package com.iankesuma.tilawahquest;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

@CapacitorPlugin(
    name = "SpeechRecognition",
    permissions = {
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "speechRecognition")
    }
)
public class SpeechRecognitionPlugin extends Plugin {

    private SpeechRecognizer recognizer;
    private PluginCall pendingCall;

    @PluginMethod
    public void available(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", SpeechRecognizer.isRecognitionAvailable(getContext()));
        call.resolve(ret);
    }

    /**
     * Dipanggil HANYA saat anak menekan tombol mikrofon.
     * Jika izin belum ada, dialog izin Android dimunculkan pada saat itu juga.
     */
    @PluginMethod
    public void start(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("Perangkat ini tidak mendukung pengenalan suara.");
            return;
        }
        if (getPermissionState("speechRecognition") != PermissionState.GRANTED) {
            requestPermissionForAlias("speechRecognition", call, "permissionCallback");
            return;
        }
        startListening(call);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (getPermissionState("speechRecognition") == PermissionState.GRANTED) {
            startListening(call);
        } else {
            call.reject("Izin mikrofon ditolak. Aktifkan izin mic di pengaturan aplikasi.");
        }
    }

    private void startListening(final PluginCall call) {
        final String lang = call.getString("language", "ar-SA");
        final int maxResults = call.getInt("maxResults", 3);

        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    destroyRecognizer();
                    recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                    recognizer.setRecognitionListener(new RecognitionListener() {
                        @Override
                        public void onReadyForSpeech(Bundle params) {}

                        @Override
                        public void onBeginningOfSpeech() {}

                        @Override
                        public void onRmsChanged(float rmsdB) {}

                        @Override
                        public void onBufferReceived(byte[] buffer) {}

                        @Override
                        public void onEndOfSpeech() {}

                        @Override
                        public void onError(int error) {
                            PluginCall c = pendingCall;
                            pendingCall = null;
                            if (c != null) {
                                c.reject(mapError(error));
                            }
                            destroyRecognizer();
                        }

                        @Override
                        public void onResults(Bundle results) {
                            PluginCall c = pendingCall;
                            pendingCall = null;
                            if (c != null) {
                                ArrayList<String> matches = results != null
                                    ? results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                                    : null;
                                JSArray arr = new JSArray();
                                if (matches != null) {
                                    for (String m : matches) {
                                        arr.put(m);
                                    }
                                }
                                JSObject ret = new JSObject();
                                ret.put("matches", arr);
                                ret.put("text", (matches != null && !matches.isEmpty()) ? matches.get(0) : "");
                                c.resolve(ret);
                            }
                            destroyRecognizer();
                        }

                        @Override
                        public void onPartialResults(Bundle partialResults) {}

                        @Override
                        public void onEvent(int eventType, Bundle params) {}
                    });

                    Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
                    intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, maxResults);
                    intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
                    intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());

                    pendingCall = call;
                    recognizer.startListening(intent);
                } catch (Exception e) {
                    pendingCall = null;
                    destroyRecognizer();
                    call.reject("Gagal memulai mikrofon: " + e.getMessage());
                }
            }
        });
    }

    private String mapError(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_AUDIO:
                return "Masalah pada mikrofon perangkat.";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                return "Izin mikrofon ditolak. Aktifkan izin mic di pengaturan aplikasi.";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                return "Pengenalan suara butuh koneksi internet. Sambungkan HP lalu coba lagi.";
            case SpeechRecognizer.ERROR_NO_MATCH:
                return "Suara belum dikenali. Coba ucapkan lebih jelas.";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                return "Mesin suara sedang sibuk. Tutup aplikasi lain lalu coba lagi.";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                return "Tidak ada suara terdeteksi. Coba bicara lebih dekat ke mikrofon.";
            default:
                return "Mikrofon tidak bisa digunakan. Coba lagi.";
        }
    }

    private void destroyRecognizer() {
        if (recognizer != null) {
            try { recognizer.destroy(); } catch (Exception ignored) {}
            recognizer = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        destroyRecognizer();
        super.handleOnDestroy();
    }
}
