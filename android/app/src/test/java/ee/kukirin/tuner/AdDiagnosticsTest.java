package ee.kukirin.tuner;
import org.junit.Test;
import static org.junit.Assert.*;

public class AdDiagnosticsTest {
    @Test public void distinguishesNoFillFromNetworkAndConfiguration() {
        assertEquals("NO_FILL", AdDiagnostics.code("Failed to load REWARDED_VIDEO: NO FILL"));
        assertEquals("NETWORK_ERROR", AdDiagnostics.code("Unable to resolve host"));
        assertEquals("CONFIG_ERROR", AdDiagnostics.code("Invalid app id"));
        assertEquals("EMPTY_RESPONSE", AdDiagnostics.code("GET url status 204 retry"));
        assertEquals("LOAD_FAILED", AdDiagnostics.code(null));
    }
    @Test public void removesSensitiveIdentifiersAndBoundsErrors() {
        String safe=AdDiagnostics.clean("Failure https://example.com?token=secret test@example.com 12345678-abcd-abcd-abcd-123456789abc\nmore");
        assertFalse(safe.contains("secret"));assertFalse(safe.contains("example.com"));assertFalse(safe.contains("12345678"));assertFalse(safe.contains("\n"));
        assertEquals(240, AdDiagnostics.clean(new String(new char[300]).replace('\0','x')).length());
    }
}
