package com.rtochallan;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

/**
 * HeadlessSmsSendService - Required for default SMS app compliance.
 * This service is declared in the manifest but does not need to implement any functionality.
 * It exists solely to satisfy Android's default SMS app requirements.
 */
public class HeadlessSmsSendService extends Service {

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
