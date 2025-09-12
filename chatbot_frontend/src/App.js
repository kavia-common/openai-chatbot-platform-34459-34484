import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import {
  healthCheck,
  createSession,
  getSession,
  listSessions,
  deleteSession,
  listMessages,
  sendMessage,
} from './api';

// Helpers for storage keys
const STORAGE_KEYS = {
  THEME: 'kavia_chat_theme',
  ACTIVE_SESSION_ID: 'kavia_chat_active_session_id',
};

// UI subcomponents kept inside to keep template simple
function MessageBubble({ role, content, time }) {
  return (
    <div className={`msg-row ${role}`}>
      <div className="msg-bubble" role="listitem" aria-label={`${role} message`}>
        <div className="msg-content">{content}</div>
        {time ? <div className="msg-time">{new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div> : null}
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="empty">
      <h2>Start a new conversation</h2>
      <p>Ask any question and the assistant will respond.</p>
      <button className="btn" onClick={onCreate}>+ New Chat</button>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** A simple Q&A chat UI that connects to the Django backend. */

  // Theme
  const [theme, setTheme] = useState(localStorage.getItem(STORAGE_KEYS.THEME) || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Health/ready indicator
  const [ready, setReady] = useState(false);
  const [healthError, setHealthError] = useState('');

  // Sessions and selection
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID) || '');
  const [messages, setMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Input state
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Derived: active session object
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Initial health check and load sessions
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await healthCheck();
        if (!mounted) return;
        setReady(true);
        await refreshSessions();
      } catch (e) {
        if (!mounted) return;
        setHealthError(e?.message || 'Unable to reach backend');
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load messages when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    let mounted = true;
    (async () => {
      setLoadingMessages(true);
      setError('');
      try {
        const list = await listMessages(activeSessionId);
        if (!mounted) return;
        setMessages(list || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load messages');
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    })();
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, activeSessionId || '');
    return () => { mounted = false; };
  }, [activeSessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    /** Toggle between light and dark themes and persist. */
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  async function refreshSessions() {
    setLoadingSessions(true);
    setError('');
    try {
      const data = await listSessions();
      setSessions(Array.isArray(data) ? data : []);
      // If no active session, try last or none
      if (!activeSessionId && data?.length) {
        setActiveSessionId(data[0].id);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  }

  async function handleCreateSession() {
    setError('');
    try {
      const s = await createSession();
      await refreshSessions();
      if (s?.id) {
        setActiveSessionId(s.id);
      }
      if (inputRef.current) inputRef.current.focus();
    } catch (e) {
      setError(e?.message || 'Failed to create session');
    }
  }

  async function handleDeleteSession(id) {
    if (!id) return;
    setError('');
    try {
      await deleteSession(id);
      if (activeSessionId === id) {
        setActiveSessionId('');
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
      }
      await refreshSessions();
      setMessages([]);
    } catch (e) {
      setError(e?.message || 'Failed to delete session');
    }
  }

  async function handleSendMessage(e) {
    e?.preventDefault?.();
    const trimmed = input.trim();
    if (!trimmed) return;
    setSending(true);
    setError('');

    // Optimistic update: show user message immediately
    const optimisticUser = { id: `u-${Date.now()}`, role: 'user', content: trimmed, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimisticUser]);
    setInput('');

    try {
      const resp = await sendMessage({ sessionId: activeSessionId || undefined, message: trimmed });
      // If session was created implicitly, set it
      if (!activeSessionId && resp?.session_id) {
        setActiveSessionId(resp.session_id);
        await refreshSessions();
      }
      // Append assistant reply
      const assistantMsg = { id: resp?.message_id || `a-${Date.now()}`, role: 'assistant', content: resp?.reply || '', created_at: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      // Roll back optimistic user msg? Keep it but report error
      setError(e?.message || 'Failed to send message');
    } finally {
      setSending(false);
      if (inputRef.current) inputRef.current.focus();
    }
  }

  return (
    <div className="App">
      <header className="chat-navbar">
        <div className="brand">KAVIA Chat</div>
        <div className="spacer" />
        <div className={`status ${ready && !healthError ? 'ok' : 'bad'}`} title={healthError || 'Backend connected'}>
          {ready && !healthError ? '● Online' : '○ Offline'}
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      <main className="chat-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <button className="btn btn-full" onClick={handleCreateSession}>+ New Chat</button>
          </div>
          <div className="session-list" role="list" aria-label="Chat sessions">
            {loadingSessions ? (
              <div className="muted">Loading sessions…</div>
            ) : sessions.length === 0 ? (
              <div className="muted">No sessions yet</div>
            ) : (
              sessions.map(s => (
                <div
                  key={s.id}
                  className={`session-item ${activeSessionId === s.id ? 'active' : ''}`}
                >
                  <button className="session-button" onClick={() => setActiveSessionId(s.id)}>
                    <div className="session-title">{s.title || 'Untitled Chat'}</div>
                    <div className="session-sub">{new Date(s.created_at).toLocaleString()}</div>
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteSession(s.id)} title="Delete chat">✕</button>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="chat-panel">
          {error ? <div className="error-banner" role="alert">{error}</div> : null}
          {!activeSessionId && messages.length === 0 ? (
            <EmptyState onCreate={handleCreateSession} />
          ) : (
            <>
              <div className="messages" ref={listRef} role="list" aria-live="polite">
                {loadingMessages ? (
                  <div className="muted">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="muted">Say hello to start the conversation.</div>
                ) : (
                  messages.map(m => (
                    <MessageBubble key={`${m.role}-${m.id}`} role={m.role} content={m.content} time={m.created_at} />
                  ))
                )}
                {sending ? (
                  <div className="msg-row assistant">
                    <div className="msg-bubble typing">
                      <div className="dots">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <form className="composer" onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  className="input"
                  type="text"
                  placeholder="Type your question…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  aria-label="Message input"
                />
                <button className="btn" type="submit" disabled={sending || !input.trim()}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
