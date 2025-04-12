export function html_escape(s: string, quote = true) {
    s = s.replace("&", "&amp;")

    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    if (quote) {
        s = s.replace('"', "&quot;")
        s = s.replace('\'', "&#x27;")
    }
    return s;
}