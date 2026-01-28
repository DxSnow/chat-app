const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'ChaChaChat <onboarding@resend.dev>';

async function sendOTPEmail(email, code) {
  // Always log to console for development/debugging
  console.log(`\n========================================`);
  console.log(`OTP CODE for ${email}: ${code}`);
  console.log(`========================================\n`);

  // If no API key configured, just use console
  if (!process.env.RESEND_API_KEY) {
    return { id: 'dev-mode' };
  }

  // Try to send email, but don't fail if it doesn't work
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your ChaChaChat Login Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ec4899; margin-bottom: 20px;">ChaChaChat</h2>
          <p style="color: #374151; font-size: 16px;">Your one-time login code is:</p>
          <div style="font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; padding: 24px; background: #f3f4f6; border-radius: 12px; text-align: center; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">ChaChaChat - Real-time Chat Application</p>
        </div>
      `,
    });

    if (error) {
      console.error('Email send failed (code logged above):', error.message);
      // Don't throw - the code is already logged to console
    } else {
      console.log('Email sent successfully!');
    }

    return data || { id: 'console-fallback' };
  } catch (err) {
    console.error('Email error (code logged above):', err.message);
    return { id: 'console-fallback' };
  }
}

async function sendWelcomeEmail(email, displayName) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV MODE] Welcome email for ${email}`);
    return { id: 'dev-mode' };
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Welcome to ChaChaChat!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ec4899; margin-bottom: 20px;">Welcome to ChaChaChat!</h2>
        <p style="color: #374151; font-size: 16px;">Hi ${displayName},</p>
        <p style="color: #374151; font-size: 16px;">Your account has been created successfully. You can now start chatting with others in real-time!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">ChaChaChat - Real-time Chat Application</p>
      </div>
    `,
  });

  if (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw, welcome email is not critical
  }

  return data;
}

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
};
