package ee.kukirin.tuner;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null || getBridge().getWebView() == null) return;
                getBridge().getWebView().post(() ->
                    getBridge().getWebView().evaluateJavascript(
                        "window.dispatchEvent(new Event('kukirin:native-back'))",
                        null
                    )
                );
            }
        });
    }
}
