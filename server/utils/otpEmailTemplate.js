function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeOtp(otp) {
  return String(otp || '')
    .replace(/\D/g, '')
    .slice(0, 8);
}

function getOtpCopy(purpose) {
  switch (purpose) {
    case 'password-reset':
      return {
        subject: 'Password Reset OTP - SuiteGenie',
        title: 'Reset your password',
        subtitle: 'Use this one-time code to reset your SuiteGenie password.',
        helper: "If you didn't request a password reset, you can ignore this email.",
        label: 'Password reset code',
      };
    case 'account-verification':
      return {
        subject: 'Account Verification OTP - SuiteGenie',
        title: 'Verify your account',
        subtitle: 'Use this one-time code to complete your SuiteGenie account verification.',
        helper: 'Enter this code in the verification screen to continue.',
        label: 'Verification code',
      };
    default:
      return {
        subject: 'Email Verification OTP - SuiteGenie',
        title: 'Verify your email',
        subtitle: 'Use this one-time code to confirm your email address.',
        helper: 'Enter this code in the app to continue.',
        label: 'Verification code',
      };
  }
}

export function buildOtpEmailTemplate({ otp, purpose = 'verification', expiresInMinutes = 10 }) {
  const code = normalizeOtp(otp);
  const safeCode = escapeHtml(code);
  const safePurpose = String(purpose || 'verification');
  const safeExpires = Number.isFinite(Number(expiresInMinutes)) ? Math.max(1, Number(expiresInMinutes)) : 10;
  const copy = getOtpCopy(safePurpose);

  const text = [
    copy.title,
    '',
    `${copy.label}: ${code}`,
    `This code expires in ${safeExpires} minutes.`,
    copy.helper,
    '',
    'If you were not expecting this email, you can ignore it.',
    '',
    'SuiteGenie',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(copy.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Segoe UI,Arial,sans-serif;color:#111827;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(copy.label)}: ${safeCode}. Expires in ${safeExpires} minutes.
  </span>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7fb;padding:28px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#2563eb;height:6px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding:28px 36px 10px;" align="center">
              <div style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:10px;font-weight:800;font-size:18px;line-height:1;">
                Suite<span style="color:#bfdbfe;">Genie</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 36px 8px;" align="center">
              <h1 style="margin:0;font-size:30px;line-height:1.25;color:#111827;font-weight:800;letter-spacing:-0.4px;">
                ${escapeHtml(copy.title)}
              </h1>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#6b7280;">
                ${escapeHtml(copy.subtitle)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 36px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fbff;border:1px solid #dbeafe;border-radius:14px;">
                <tr>
                  <td style="padding:18px 20px 8px;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#2563eb;">
                    ${escapeHtml(copy.label)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px 16px;">
                    <div style="font-size:34px;line-height:1.2;font-weight:800;letter-spacing:6px;color:#111827;text-align:center;background:#ffffff;border:1px dashed #bfdbfe;border-radius:12px;padding:14px 10px;">
                      ${safeCode}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 36px 10px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">
                      This code expires in <strong>${safeExpires} minutes</strong>.<br/>
                      ${escapeHtml(copy.helper)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 36px 28px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
                If you were not expecting this email, you can safely ignore it.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;" align="center">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                SuiteGenie Security · noreply@suitegenie.in
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: copy.subject,
    html,
    text,
  };
}

export default buildOtpEmailTemplate;
