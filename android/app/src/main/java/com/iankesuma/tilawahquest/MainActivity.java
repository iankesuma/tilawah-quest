package com.iankesuma.tilawahquest;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private WebViewAssetLoader assetLoader;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Inisialisasi AndroidX WebViewAssetLoader resmi (memuat file APK dari assets/public secara aman tanpa server localhost)
        assetLoader = new WebViewAssetLoader.Builder()
            .setDomain("localhost")
            .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
    }

    @Override
    public void onStart() {
        super.onStart();
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setJavaScriptEnabled(true);

                // Intersep permintaan localhost agar langsung dilayani oleh WebViewAssetLoader internal dari dalam APK
                webView.setWebViewClient(new WebViewClientCompat() {
                    @Override
                    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                        Uri uri = request.getUrl();
                        if (uri != null && uri.getHost() != null && uri.getHost().equals("localhost")) {
                            // Map URL https://localhost/<path> ke assets/public/<path>
                            String path = uri.getPath();
                            if (path == null || path.equals("/") || path.isEmpty()) {
                                path = "/public/index.html";
                            } else if (!path.startsWith("/public/")) {
                                path = "/public" + path;
                            }
                            Uri mappedUri = new Uri.Builder()
                                .scheme("https")
                                .authority("localhost")
                                .path(path)
                                .build();
                            WebResourceResponse res = assetLoader.shouldInterceptRequest(mappedUri);
                            if (res != null) return res;
                        }
                        return super.shouldInterceptRequest(view, request);
                    }

                    @Override
                    public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                        // Fallback darurat jika tetap ada kendala skema
                        if (failingUrl != null && failingUrl.contains("localhost")) {
                            view.loadUrl("file:///android_asset/public/index.html");
                        }
                    }
                });
            }
        } catch (Exception ignored) {}
    }
}
