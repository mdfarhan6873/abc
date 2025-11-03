package com.rtochallan;

import android.app.role.RoleManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.SmsManager;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * SmsRoleModule - Native module for requesting default SMS app role.
 * Uses RoleManager on Android 10+ (API 29+), falls back to intent on lower versions.
 */
public class SmsRoleModule extends ReactContextBaseJavaModule {

    private static final int REQUEST_DEFAULT_SMS = 1001;
    private static ReactApplicationContext reactContext;

    public SmsRoleModule(ReactApplicationContext reactContext) {
        super(reactContext);
        SmsRoleModule.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "SmsRoleModule";
    }

    @ReactMethod
    public void requestDefaultSmsRole(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) { // API 29+
                RoleManager roleManager = reactContext.getSystemService(RoleManager.class);
                if (roleManager != null) {
                    Intent intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    reactContext.startActivity(intent);
                    promise.resolve(true);
                } else {
                    promise.reject("ROLE_MANAGER_UNAVAILABLE", "RoleManager not available");
                }
            } else {
                // Fallback for API < 29: Use the old intent
                Intent intent = new Intent("android.provider.Telephony.ACTION_CHANGE_DEFAULT");
                intent.putExtra("package", reactContext.getPackageName());
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("REQUEST_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void isDefaultSmsApp(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) { // API 19+
                String defaultSmsPackage = android.provider.Telephony.Sms.getDefaultSmsPackage(reactContext);
                boolean isDefault = reactContext.getPackageName().equals(defaultSmsPackage);
                promise.resolve(isDefault);
            } else {
                // For older versions, assume not default
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("CHECK_FAILED", e.getMessage());
        }
    }
}
