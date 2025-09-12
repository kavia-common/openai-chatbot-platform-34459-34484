 // PUBLIC_INTERFACE
 /**
  * Get the backend API base URL for the chatbot backend.
  * Priority:
  * 1. window.ENV.REACT_APP_BACKEND_URL (if injected at runtime)
  * 2. process.env.REACT_APP_BACKEND_URL (CRA build-time env)
  * 3. Default to relative '/api' (assumes proxy or same-origin path)
  */
 export function getApiBaseUrl() {
   /** This is a public function. */
   const runtime = typeof window !== 'undefined' && window.ENV && window.ENV.REACT_APP_BACKEND_URL;
   const buildtime = typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL;
   return (runtime || buildtime || '/api').replace(/\/+$/, '');
 }
