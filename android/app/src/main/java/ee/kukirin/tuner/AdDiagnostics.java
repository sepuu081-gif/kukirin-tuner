package ee.kukirin.tuner;

import java.util.Locale;

final class AdDiagnostics {
    static String clean(String message) {
        if (message == null) return "SDK did not provide an error message";
        String safe = message.replaceAll("https?://\\S+", "[url]")
            .replaceAll("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", "[email]")
            .replaceAll("[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}", "[id]")
            .replaceAll("[\\r\\n\\t]+", " ").trim();
        return safe.isEmpty() ? "SDK did not provide an error message" : safe.substring(0, Math.min(240, safe.length()));
    }
    static String code(String message) {
        String value = message == null ? "" : message.toLowerCase(Locale.ROOT);
        if (value.matches(".*\\bstatus(?:\\s*[:=]\\s*|\\s+)204\\b.*")) return "EMPTY_RESPONSE";
        if (value.contains("no fill") || value.contains("no_fill") || value.contains("no ads")) return "NO_FILL";
        if (value.contains("network") || value.contains("connection") || value.contains("unknownhost") || value.contains("resolve host") || value.contains("socket") || value.contains("ssl") || value.contains("timed out")) return "NETWORK_ERROR";
        if (value.contains("invalid app") || value.contains("app id") || value.contains("application id")) return "CONFIG_ERROR";
        return "LOAD_FAILED";
    }
}
