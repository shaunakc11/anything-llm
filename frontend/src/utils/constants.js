export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export const AUTH_USER = "ossorioiallm_user";
export const AUTH_TOKEN = "ossorioiallm_authToken";
export const AUTH_TIMESTAMP = "ossorioiallm_authTimestamp";
export const COMPLETE_QUESTIONNAIRE = "ossorioiallm_completed_questionnaire";
export const SEEN_DOC_PIN_ALERT = "ossorioiallm_pinned_document_alert";
export const SEEN_WATCH_ALERT = "ossorioiallm_watched_document_alert";

export const USER_BACKGROUND_COLOR = "bg-historical-msg-user";
export const AI_BACKGROUND_COLOR = "bg-historical-msg-system";

export const OLLAMA_COMMON_URLS = [
  "http://127.0.0.1:11434",
  "http://host.docker.internal:11434",
  "http://172.17.0.1:11434",
];

export const LMSTUDIO_COMMON_URLS = [
  "http://localhost:1234/v1",
  "http://127.0.0.1:1234/v1",
  "http://host.docker.internal:1234/v1",
  "http://172.17.0.1:1234/v1",
];

export function fullApiUrl() {
  if (API_BASE !== "/api") return API_BASE;
  return `${window.location.origin}/api`;
}
