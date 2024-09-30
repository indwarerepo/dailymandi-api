import {} from '../types/common';

/**
 * Testing template
 */
export const testEmailTemplate = (username: string) => {
  let subject = 'Email Gateway Test';
  let template = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Gateway Test</title>
      </head>
      <body>
          <h1>Email Gateway working succesfully in Conciery</h1><br><br>
          <h4>Name: ${username}</h4>
      </body>
      </html>`;
  return { subject: subject, body: template };
};

/**
 * Email OTP template
 */
export const otpEmailTemplate = (username: string, emailId: string, otp: number) => {
  let subject = 'WorkSync+ : OTP Verification';
  let template = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>WorkSync_OTP_Template</title>
                </head>
                <body style="padding: 0; margin: 0; font-family: 'Poppins', Sans-serif; background-color: #edd3f8;">
                    <div class="container" style="max-width: 650px; margin: auto; background-color: #fff;">
                        <div class="sec1" style="max-width: 650px; text-align: center; padding:24px;">
                            <img src="https://trstorageaccount.blob.core.windows.net/defaultcontainer/logo.png" alt="WorkSync" width="170" />
                        </div>
                        <div class="sec2" style="text-align: center; padding:24px; background-color: #714286;">
                            <h3 style="color: #fff; font-size: 24px; font-weight: 100; line-height: 4px;"> Verify Your Account On </h3>
                            <h4 style="font-size: 24px; color: #fff; font-weight: 800; line-height: 4px;"> WorkSync+ </h4>
                        </div>
                        <div class="sec3" style="padding:24px;">
                            <div class="sec3-sub1" style="max-width: 480px; text-align: left; padding:24px; margin: auto;">
                                <h3 style="color: #212121; font-size: 20px; font-weight: 100; line-height: 4px;"> Hello
                                    <b>${username}</b>,
                                </h3>
                                <p style="color: #212121; line-height: 24px;">We received a request to access your WorkSync+ <br>
                                    Account
                                    <a href="mailto:${emailId}"
                                        style="color: #F98442; text-decoration: none;">${emailId}</a> through your email
                                    address.
                                </p>
                            </div>
                            <div class="sec3-sub2"
                                style="max-width: 450px; text-align:center; background-color: #F98442; border-radius: 20px; padding: 40px 24px; margin: auto;">
                                <div class="sec3-sub3"
                                    style="padding: 10px; margin: auto; background-color: #fff; border-radius: 100%; width: 38px; height: 38px;">
                                    <img src="https://trstorageaccount.blob.core.windows.net/defaultcontainer/email.png" alt=" email" width="30" style="position: relative; top:3px;" />
                                </div>
                                <div class="sec3-sub4" style="margin-bottom: 40px;">
                                    <h3 style="font-size: 20px; color:#000000; font-weight: 800; line-height: 4px;"> Your OTP </h3>
                                    <p style="color: #000000; line-height: 18px;">Your OTP
                                        to validate your account verification</p>
                                </div>
                                <div class="sec3-sub5">
                                    <h3 style="font-size: 27px; color:#fff; font-weight: 800; line-height: 4px;"> ${otp} </h3>
                                    <p style="color: #000000; line-height: 8px;">valid for 10 minutes only</p>
                                </div>
                            </div>
                            <div class="sec3-sub6" style="max-width: 480px; text-align: center; padding:14px 30px 14px; margin: auto;">
                                <p style="color: #714286; line-height: 24px;">Enter this code to securely active your account.</p>
                            </div>
                        </div>
                        <div class="sec2" style="max-width: 650px; text-align: center; padding:10px; background-color: #714286;">
                            <p style="color: #ffffff; line-height: 12px; font-size: 15px;">Copyright © 2024 <a href="#" style="color: #F98442; text-decoration: none;"> WorkSync+</a>. All Rights Reserved.</p>
                        </div>
                </body>
                </html>`;
  return { subject: subject, body: template };
};

/**
 * Email verification link template
 */
export const emailVerificationTemplate = (username: string, emailId: string, url: string) => {
  let subject = 'WorkSync+ : Email Verification';
  let template = `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>WorkSync_Email_Template</title>
                  </head>
                  <body style="padding: 0; margin: 0; font-family: 'Poppins', Sans-serif; background-color: #edd3f8;">
                      <div class="container" style="max-width: 650px; margin: auto; background-color: #fff;">
                          <div class="sec1" style="max-width: 650px; text-align: center; padding:24px;">
                              <img src="https://trstorageaccount.blob.core.windows.net/defaultcontainer/logo.png" alt="WorkSync" width="170" />
                          </div>
                          <div class="sec2" style="text-align: center; padding:24px; background-color: #714286;">
                              <h3 style="color: #fff; font-size: 24px; font-weight: 100; line-height: 4px;"> Verify Your Account On </h3>
                              <h4 style="font-size: 24px; color: #fff; font-weight: 800; line-height: 4px;"> WorkSync+ </h4>
                          </div>
                          <div class="sec3" style="padding:24px;">
                              <div class="sec3-sub1" style="max-width: 480px; text-align: left; padding:24px; margin: auto;">
                                  <h3 style="color: #212121; font-size: 20px; font-weight: 100; line-height: 4px;"> Hello
                                      <b>${username}</b>,
                                  </h3>
                                  <p style="color: #212121; line-height: 24px;">We received a request to access your WorkSync+ <br>
                                      Account
                                      <a href="mailto:${emailId}"
                                          style="color: #F98442; text-decoration: none;">${emailId}</a> through your email
                                      address.
                                  </p>
                              </div>
                              <div class="sec3-sub2"
                                  style="max-width: 450px; text-align:center; background-color: #F98442; border-radius: 20px; padding: 40px 24px; margin: auto;">
                                  <div class="sec3-sub3"
                                      style="padding: 10px; margin: auto; background-color: #fff; border-radius: 100%; width: 38px; height: 38px;">
                                      <img src="https://trstorageaccount.blob.core.windows.net/defaultcontainer/email.png" alt=" email" width="30" style="position: relative; top:3px;" />
                                  </div>
                                  <div class="sec3-sub4" style="margin-bottom: 40px;">
                                      <p style="color: #000000; line-height: 18px;">Click The Link below to verify your account</p>
                                  </div>
                                  <div class="sec4" style="max-width: 480px; text-align: center; padding:24px; margin: auto;">
                                      <div class="verify-btn">
                                          <a href="${url}"
                                          style="background-color: #714286; color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 10px;">Verify Account</a>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <div class="sec2" style="max-width: 650px; text-align: center; padding:10px; background-color: #714286;">
                              <p style="color: #ffffff; line-height: 12px; font-size: 15px;">Copyright © 2024 <a href="#" style="color: #F98442; text-decoration: none;"> WorkSync+</a>. All Rights Reserved.</p>
                          </div>
                  </body>
                  </html>`;
  return { subject: subject, body: template };
};

/**
 * Email invitation template
 */
export const invitationEmailTemplate = (username: string, url: string) => {
  let subject = 'WorkSync+ : Invitation Letter';
  let template = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>WorkSync_Invite_Template</title>
            </head>
            <body style="padding: 0; margin: 0; font-family: 'Poppins', Sans-serif; background-color: #edd3f8;">
                <div class="container" style="max-width: 650px; margin: auto; background-color: #fff;">
                    <div class="sec1" style="max-width: 650px; text-align: center; padding:24px;">
                        <img src="https://trstorageaccount.blob.core.windows.net/defaultcontainer/logo.png" alt="WorkSync" width="170" />
                    </div>
                    <div class="sec2" style="text-align: center; padding:30px; background-color: #714286;">
                        <h3 style="color: #fff; font-size: 24px; font-weight: 100; line-height: 36px;" >Welcome to WorkSync+</h3>
                    </div>
                    <div class="sec3" style="padding:24px;">
                        <div class="sec3-sub1" style="max-width: 480px; text-align: left; padding:24px; margin: auto;">
                            <h3 style="color: #212121; font-size: 22px; font-weight: 600; line-height: 35px;"> ${username} invited you to join them in WorkSync+.</h3>
                            <p style="color: #212121; line-height: 23px;">Start planning and tracking work with ${username} and your team. <br> You can share your work and view what your team is doing.</p>
                        </div>
                        <div class="sec4" style="max-width: 480px; text-align: center; padding:24px; margin: auto;">
                        <div class="verify-btn">
                            <a href="${url}"
                            style="background-color: #F98442; color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 10px;" onMouseOver="this.style.background='#714286'" onMouseOut="this.style.background='#F98442'">Accept Invite</a>
                        </div>
                        </div>
                        <div class="sec3-sub6" style="max-width: 480px; text-align: center; padding:14px 30px 14px; margin: auto;">
                            <p style="color:#212121 ; line-height: 24px;">What is WorkSync+ ? Project and issue tracking  <a href="#"
                                style="color: #F98442; text-decoration: none;"> Learn more</a> </p>
                        </div>
                    </div>
                    <div class="sec2" style="max-width: 650px; text-align: center; padding:10px; background-color: #714286;">
                        <p style="color: #ffffff; line-height: 12px; font-size: 15px;">Copyright © 2023 <a href="#" style="color: #F98442; text-decoration: none;"> WorkSync+</a>. All Rights Reserved.</p>
                    </div>
            </body>
        </html>
    `;
  return { subject: subject, body: template };
};

/**
 * Welcome template
 */
export const welcomeEmailTemplate = (username: string, url: string) => {
  let subject = 'WorkSync+ : Welcome Letter';
  let template = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&amp;display=swap" rel="stylesheet">
                <title>WorkSync+ Mail notifications</title>
            </head>
            <body style="padding: 0; margin: 0; font-family: 'Poppins', sans-serif; background-color: #F8FAFC;">
                <div class="container" style="width:95%; max-width: 545px; margin: auto;">
                    <div class="header" style="text-align: center; padding:40px 0px; display: flex; align-items: center; justify-content: space-between;">
                        <img src="logo.svg" alt=" hooked logo" width="130" style="object-fit: contain; object-position:center;">    
                    </div>
                    <div class="content-body" style=" padding:5%; background-color: #fff;">
                        <div class="content" style=" display: flex; flex-direction: column; gap:20px;">
                            <h1 style="font-size: 1.5rem; color:#29305B; margin: 0; padding: 0;">Welcome to WorkSync+ <span style="color:#5D5FEF;">!</span></h1>
                            <div class="description" style=" display: flex; flex-direction: column; gap:14px;">
                                <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">Hello Robin van Persie,</p>
                                <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">Welcome to <b style="color:#5D5FEF;">WorkSync+</b> We’re excited to have you on board.</p>
                                <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">To get started, please confirm your email address by clicking the link below:</p>
                                <a href="#" style="padding: 10px 25px; background: rgb(93, 95, 239); color: rgb(255, 255, 255); font-size: 0.875rem; font-weight: 500; display: inline-block; border-radius: 8px; text-decoration: none; width: max-content; margin-bottom: 30px;" onmouseover="this.style.background='#29305B'" onmouseout="this.style.background='#5D5FEF'">Get Started</a>
                                <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">If you have any questions, feel free to reach out to our support team.</p>
                                <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0; padding-top: 15px;font-weight: 400;">
                                <span style="display: block;">Best,</span> 
                                The  WorkSync+ Team
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="footer" style="padding:25px 0px; display: flex; flex-direction: column; gap:14px;">
                        <h4 style="font-size: 1rem; color:#29305B; margin: 0; padding: 0;">Contact Us.</h4>
                        <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0; width: 96%; font-weight: 400;">
                            If you have any questions or need further assistance, please do not hesitate to reach out to our support team at <a href="#" style="text-decoration: underline; color: rgb(93, 95, 239); font-size: 0.875rem; margin: 0px; padding: 0px;" onmouseover="this.style.color='#29305B'" onmouseout="this.style.color='#5D5FEF'">support@company.com</a> or call (123) 456-7890. We are here to help!
                        </p>
                        <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">
                            © 2024 WorkSync+
                        </p>
                    </div>
                </div>
            </body>
        </html>
    `;
  return { subject: subject, body: template };
};

/**
 * Welcome template
 */
export const welcomeEmailTemplateWithPassword = (username: string, password: string) => {
  let subject = 'WorkSync+ : Welcome Letter';
  let template = `
          <!DOCTYPE html>
          <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&amp;display=swap" rel="stylesheet">
                  <title>WorkSync+ Mail notifications</title>
              </head>
              <body style="padding: 0; margin: 0; font-family: 'Poppins', sans-serif; background-color: #F8FAFC;">
                  <div class="container" style="width:95%; max-width: 545px; margin: auto;">
                      <div class="header" style="text-align: center; padding:40px 0px; display: flex; align-items: center; justify-content: space-between;">
                          <img src="logo.svg" alt=" hooked logo" width="130" style="object-fit: contain; object-position:center;">    
                      </div>
                      <div class="content-body" style=" padding:5%; background-color: #fff;">
                          <div class="content" style=" display: flex; flex-direction: column; gap:20px;">
                              <h1 style="font-size: 1.5rem; color:#29305B; margin: 0; padding: 0;">Welcome to WorkSync+ <span style="color:#5D5FEF;">!</span></h1>
                              <div class="description" style=" display: flex; flex-direction: column; gap:14px;">
                                  <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">Hello ${username},</p>
                                  <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">Welcome to <b style="color:#5D5FEF;">WorkSync+</b> We’re excited to have you on board.</p>
                                  <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">Your Login Password : ${password}</p>
                                  <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">To get started, please clicking the link below:</p>
                                  <a href="#" style="padding: 10px 25px; background: rgb(93, 95, 239); color: rgb(255, 255, 255); font-size: 0.875rem; font-weight: 500; display: inline-block; border-radius: 8px; text-decoration: none; width: max-content; margin-bottom: 30px;" onmouseover="this.style.background='#29305B'" onmouseout="this.style.background='#5D5FEF'">Get Started</a>
                                  <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">If you have any questions, feel free to reach out to our support team.</p>
                                  <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0; padding-top: 15px;font-weight: 400;">
                                  <span style="display: block;">Best,</span> 
                                  The  WorkSync+ Team
                                  </p>
                              </div>
                          </div>
                      </div>
  
                      <div class="footer" style="padding:25px 0px; display: flex; flex-direction: column; gap:14px;">
                          <h4 style="font-size: 1rem; color:#29305B; margin: 0; padding: 0;">Contact Us.</h4>
                          <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0; width: 96%; font-weight: 400;">
                              If you have any questions or need further assistance, please do not hesitate to reach out to our support team at <a href="#" style="text-decoration: underline; color: rgb(93, 95, 239); font-size: 0.875rem; margin: 0px; padding: 0px;" onmouseover="this.style.color='#29305B'" onmouseout="this.style.color='#5D5FEF'">support@company.com</a> or call (123) 456-7890. We are here to help!
                          </p>
                          <p style="font-size: 0.875rem; color:#29305B; margin: 0; padding: 0;font-weight: 400;">
                              © 2024 WorkSync+
                          </p>
                      </div>
                  </div>
              </body>
          </html>
      `;
  return { subject: subject, body: template };
};
