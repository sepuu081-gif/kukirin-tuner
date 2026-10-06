package ee.kukirin.tuner;

import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.startapp.sdk.adsbase.Ad;
import com.startapp.sdk.adsbase.StartAppAd;
import com.startapp.sdk.adsbase.StartAppSDK;
import com.startapp.sdk.adsbase.adlisteners.AdEventListener;
import com.startapp.sdk.adsbase.adlisteners.AdDisplayListener;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(name = "StartIoAds")
public class StartIoAdsPlugin extends Plugin {
    static final String APP_ID = "209307351";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private PluginCall activeCall;
    private RewardSession session;
    private String rewardId;
    private StartAppAd ad;
    private boolean initialized;
    private Runnable timeout;
    private SharedPreferences prefs() { return getContext().getSharedPreferences("kukirin_startio", 0); }
    private JSObject status() {
        JSObject result = new JSObject();
        result.put("enabled", prefs().getBoolean("enabled", false));
        result.put("adult", prefs().getBoolean("adult", false));
        result.put("configured", prefs().getBoolean("configured", false));
        result.put("testAds", BuildConfig.STARTIO_TEST_ADS);
        return result;
    }
    @PluginMethod public void getStatus(PluginCall call) { call.resolve(status()); }
    @PluginMethod public void configure(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (activeCall != null) { call.reject("BUSY", "BUSY"); return; }
            boolean adult = Boolean.TRUE.equals(call.getBoolean("adult", false));
            boolean enabled = adult && Boolean.TRUE.equals(call.getBoolean("enabled", false));
            prefs().edit().putBoolean("configured", true).putBoolean("adult", adult)
                .putBoolean("enabled", enabled).putLong("consentTime", System.currentTimeMillis()).apply();
            if (initialized) StartAppSDK.setUserConsent(getContext(), "pas", prefs().getLong("consentTime", 0), false);
            call.resolve(status());
        });
    }
    @PluginMethod public void getPendingRewards(PluginCall call) {
        JSArray ids = new JSArray();
        for (String id : prefs().getStringSet("pending", new HashSet<>())) ids.put(id);
        JSObject result = new JSObject(); result.put("ids", ids); call.resolve(result);
    }
    @PluginMethod public void acknowledgeReward(PluginCall call) {
        String id = call.getString("id", "");
        synchronized (this) {
            Set<String> pending = new HashSet<>(prefs().getStringSet("pending", new HashSet<>()));
            pending.remove(id); prefs().edit().putStringSet("pending", pending).commit();
        }
        call.resolve();
    }
    private synchronized void saveReward(String id) {
        Set<String> pending = new HashSet<>(prefs().getStringSet("pending", new HashSet<>()));
        pending.add(id); prefs().edit().putStringSet("pending", pending).commit();
    }
    @PluginMethod public void showRewarded(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (activeCall != null) { call.reject("BUSY", "BUSY"); return; }
            if (!prefs().getBoolean("adult", false) || !prefs().getBoolean("enabled", false)) { call.reject("DISABLED", "DISABLED"); return; }
            activeCall = call; session = new RewardSession(); rewardId = UUID.randomUUID().toString();
            RewardSession request = session;
            timeout = () -> { if (session == request) finish("TIMEOUT"); };
            handler.postDelayed(timeout, 30000);
            try {
                if (initialized) loadAd(request);
                else {
                    StartAppAd.disableSplash(); StartAppAd.disableAutoInterstitial();
                    StartAppSDK.setTestAdsEnabled(BuildConfig.STARTIO_TEST_ADS);
                    StartAppSDK.initParams(getContext(), APP_ID).setReturnAdsEnabled(false).setCallback(() -> {
                        initialized = true;
                        StartAppSDK.setUserConsent(getContext(), "pas", prefs().getLong("consentTime", System.currentTimeMillis()), false);
                        if (session == request) loadAd(request);
                    }).init();
                }
            } catch (Exception ex) { finish("UNAVAILABLE"); }
        });
    }
    private void loadAd(RewardSession request) {
        getActivity().runOnUiThread(() -> {
            if (session != request || activeCall == null) return;
            ad = new StartAppAd(getActivity());
            String id = rewardId;
            ad.setVideoListener(() -> { if (request.complete()) saveReward(id); });
            ad.loadAd(StartAppAd.AdMode.REWARDED_VIDEO, new AdEventListener() {
                @Override public void onReceiveAd(Ad received) {
                    getActivity().runOnUiThread(() -> {
                        if (session != request || activeCall == null) return;
                        handler.removeCallbacks(timeout);
                        boolean shown = ad.showAd(new AdDisplayListener() {
                            @Override public void adHidden(Ad shownAd) { if (session == request) finish(null); }
                            @Override public void adDisplayed(Ad shownAd) { }
                            @Override public void adClicked(Ad shownAd) { }
                            @Override public void adNotDisplayed(Ad failed) { if (session == request) finish("UNAVAILABLE"); }
                        });
                        if (!shown && session == request) finish("UNAVAILABLE");
                    });
                }
                @Override public void onFailedToReceiveAd(Ad failed) { if (session == request) finish("NO_AD"); }
            });
        });
    }
    private void finish(String error) {
        getActivity().runOnUiThread(() -> {
            if (activeCall == null || session == null || !session.end()) return;
            handler.removeCallbacks(timeout);
            PluginCall call = activeCall; boolean earned = session.earned(); String id = rewardId;
            activeCall = null; session = null; ad = null;
            if (error != null && !earned) call.reject(error, error);
            else { JSObject result = new JSObject(); result.put("completed", earned); result.put("id", earned ? id : ""); call.resolve(result); }
        });
    }
    @Override protected void handleOnDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (session != null) session.end();
        if (activeCall != null) activeCall.reject("CANCELLED", "CANCELLED");
        activeCall = null; session = null; ad = null;
        super.handleOnDestroy();
    }
}
