export const CHAT_UI_REOPEN = "___ossorioiallm-chat-widget-open___";
export function parseStylesSrc(scriptSrc = null) {
  try {
    const _url = new URL(scriptSrc);
    _url.pathname = _url.pathname
      .replace("ossorioiallm-chat-widget.js", "ossorioiallm-chat-widget.min.css")
      .replace(
        "ossorioiallm-chat-widget.min.js",
        "ossorioiallm-chat-widget.min.css"
      );
    return _url.toString();
  } catch {
    return "";
  }
}
