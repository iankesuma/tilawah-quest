package com.iankesuma.tilawahquest;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int REQ_CODE_AUDIO = 2001;
    private static final int REQ_CODE_LOC = 2002;

    private PermissionRequest pendingAudioRequest;
    private GeolocationPermissions.Callback pendingLocationCallback;
    private String pendingLocationOrigin;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Daftarkan plugin speech recognition native (izinkan mic hanya saat tombol ditekan)
        registerPlugin(SpeechRecognitionPlugin.class);
        super.onCreate(savedInstanceState);
        // Tidak ada permintaan izin di awal aplikasi. Izin mic & lokasi diminta on-demand.
    }

    @Override
    public void onStart() {
        super.onStart();
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.getSettings().setGeolocationEnabled(true);
                webView.getSettings().setGeolocationDatabasePath(getFilesDir().getPath());

                webView.setWebChromeClient(new WebChromeClient() {
                    // Izin Lokasi On-Demand: Dipanggil saat user menekan 'Pakai lokasi saya' di jadwal sholat
                    @Override
                    public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                        if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                            callback.invoke(origin, true, false);
                        } else {
                            pendingLocationCallback = callback;
                            pendingLocationOrigin = origin;
                            ActivityCompat.requestPermissions(
                                MainActivity.this,
                                new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                                REQ_CODE_LOC
                            );
                        }
                    }

                    // Izin Mikrofon On-Demand: Dipanggil saat user menekan tombol '🎤 Suara'
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                boolean needsAudio = false;
                                for (String resource : request.getResources()) {
                                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                                        needsAudio = true;
                                        break;
                                    }
                                }

                                if (needsAudio) {
                                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                                        request.grant(request.getResources());
                                    } else {
                                        pendingAudioRequest = request;
                                        ActivityCompat.requestPermissions(
                                            MainActivity.this,
                                            new String[]{Manifest.permission.RECORD_AUDIO},
                                            REQ_CODE_AUDIO
                                        );
                                    }
                                } else {
                                    request.grant(request.getResources());
                                }
                            }
                        });
                    }
                });
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQ_CODE_LOC) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                if (pendingLocationCallback != null && pendingLocationOrigin != null) {
                    pendingLocationCallback.invoke(pendingLocationOrigin, true, false);
                }
            } else {
                if (pendingLocationCallback != null && pendingLocationOrigin != null) {
                    pendingLocationCallback.invoke(pendingLocationOrigin, false, false);
                }
            }
            pendingLocationCallback = null;
            pendingLocationOrigin = null;
        } else if (requestCode == REQ_CODE_AUDIO) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                if (pendingAudioRequest != null) {
                    pendingAudioRequest.grant(pendingAudioRequest.getResources());
                }
            } else {
                if (pendingAudioRequest != null) {
                    pendingAudioRequest.deny();
                }
            }
            pendingAudioRequest = null;
        }
    }
}
