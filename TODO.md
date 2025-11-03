# TODO: Make React Native Project Fully Compliant Default SMS Handler App

## Pending Tasks
- [x] Update AndroidManifest.xml: Add BROADCAST_SMS permission, modify receiver to use android:permission="android.permission.BROADCAST_SMS" and action "android.provider.Telephony.SMS_DELIVER", add HeadlessSmsSendService, rename activity to ComposeSmsActivity and update intent-filter.
- [x] Rename HiddenComposeActivity.java to ComposeSmsActivity.java and update the class declaration.
- [x] Create HeadlessSmsSendService.java as an empty service extending Service.
- [x] Update App.tsx: In useEffect, after requesting permissions, call requestDefaultSmsRole() automatically.
- [ ] Test the changes by building and installing the app to verify the popup appears and SMS forwarding works.
- [x] Update API_BASE_URL to hosted backend (vercel).
- [x] Remove ForwardService start from SmsReceiver to stop phone forwarding.
