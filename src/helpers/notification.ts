import schedule from 'node-schedule';
import config from 'config';
import nodemailer from 'nodemailer';
import {} from './mail-templates';
import moment from 'moment';
/**
 * Email Gateway Configuration
 */
export const emailGateway = (EmailData: string, subject: string, body: string) => {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: config.get('email_user') as string,
      clientId: config.get('email_client_id') as string,
      clientSecret: config.get('email_client_secret') as string,
      refreshToken: config.get('email_refresh_token') as string,
      accessToken: config.get('email_access_token') as string,
    },
  });
  var mailOptions = {
    from: config.get('app_name') as string,
    to: EmailData,
    subject: subject,
    html: body,
  };

  transporter.sendMail(mailOptions, (err: Error | null, info: any) => {
    if (err) {
      console.log('Error ' + err);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

// FCM Notification Gateway Functionality
exports.firebaseNotification = (DeviceKeyFire: any, msgBody: any, msgHead: any) => {
  var FCM = require('fcm-node');
  var serverKey =
    'AAAArZiSeEo:APA91bGtr5slYPktm8fWTd3V1AqAItrYYVSCf9vciG5AthjZtfZmHvHRVXEwNe9ZRTByMbPdkOqQaYLtZITK2_S5nD1Y0gnHdududS5EF-kij5LF1Va2ltEoMpisI-iJNy9Mu9Y3CQdy';
  var fcm = new FCM(serverKey);

  var message = {
    to: DeviceKeyFire,
    notification: {
      title: msgHead,
      body: msgBody,
    },
  };

  fcm.send(message, function (err: any, response: any) {
    if (err) {
      console.log('Something has gone wrong!', err);
    } else {
      console.log('Successfully sent with response: ', response);
    }
  });
};
