 import { getApiBaseUrl } from './config';

 const JSON_HEADERS = {
   'Content-Type': 'application/json',
   Accept: 'application/json',
 };

 async function handleResponse(res) {
   if (!res.ok) {
     const text = await res.text().catch(() => '');
     const message = text || `Request failed with status ${res.status}`;
     throw new Error(message);
   }
   // Some endpoints might return 204 No Content
   if (res.status === 204) return null;
   return res.json();
 }

 // PUBLIC_INTERFACE
 export async function healthCheck() {
   /** Checks backend health endpoint. */
   const base = getApiBaseUrl();
   const res = await fetch(`${base}/health/`, { method: 'GET' });
   return handleResponse(res);
 }

 // PUBLIC_INTERFACE
 export async function createSession() {
   /** Create a new chat session and return the session object. */
   const base = getApiBaseUrl();
   const res = await fetch(`${base}/sessions/create/`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({}) });
   return handleResponse(res);
 }

 // PUBLIC_INTERFACE
 export async function getSession(sessionId) {
   /** Retrieve a session and its messages by sessionId. */
   const base = getApiBaseUrl();
   const res = await fetch(`${base}/sessions/${sessionId}/`, { method: 'GET' });
   return handleResponse(res);
 }

 // PUBLIC_INTERFACE
 export async function listSessions() {
   /** List all chat sessions. */
   const base = getApiBaseUrl();
   const res = await fetch(`${base}/sessions/`, { method: 'GET' });
   return handleResponse(res);
 }

 // PUBLIC_INTERFACE
 export async function deleteSession(sessionId) {
   /** Delete a session by ID. */
   const base = getApiBaseUrl();
   const res = await fetch(`${base}/sessions/${sessionId}/delete/`, { method: 'DELETE' });
   return handleResponse(res);
 }

 // PUBLIC_INTERFACE
 export async function listMessages(sessionId) {
   /** List all messages for a session. */
   const base = getApiBaseUrl();
   const res = await fetch(`${base}/sessions/${sessionId}/messages/`, { method: 'GET' });
   return handleResponse(res);
 }

 // PUBLIC_INTERFACE
 export async function sendMessage({ sessionId, message }) {
   /**
    * Send a user message to /chat/ and get assistant reply.
    * If sessionId is not provided, backend creates a new session.
    */
   const base = getApiBaseUrl();
   const payload = { message };
   if (sessionId) payload.session_id = sessionId;
   const res = await fetch(`${base}/chat/`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload) });
   return handleResponse(res);
 }
