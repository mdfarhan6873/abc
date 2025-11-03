import SendSMS from 'react-native-sms';

export async function forwardSmsToNumber(smsBody: string, targetNumber: string) {
  try {
    SendSMS.send({
      body: smsBody,
      recipients: [targetNumber],
      successTypes: ['all'] as any, // Use 'all' to cover sent and queued
    }, (completed, cancelled, error) => {
      if (completed) {
        console.log('SMS forwarded successfully');
      } else if (cancelled) {
        console.log('SMS forwarding cancelled');
      } else if (error) {
        console.error('SMS forwarding error:', error);
      }
    });
  } catch (error) {
    console.error('Forward SMS error:', error);
    throw error;
  }
}
