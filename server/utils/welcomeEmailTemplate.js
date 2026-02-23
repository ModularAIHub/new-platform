function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeName(name) {
  const safe = String(name || '').trim();
  return safe ? safe : 'there';
}

export function buildWelcomeEmailTemplate({ name }) {
  const displayName = normalizeName(name);
  const safeName = escapeHtml(displayName);

  const subject = `Welcome to SuiteGenie, ${displayName}!`;
  const text = [
    `Welcome to SuiteGenie, ${displayName}!`,
    '',
    'Your AI-powered social media workspace is ready.',
    '',
    'Get started in 4 steps:',
    '1. Connect your account (Twitter/X or LinkedIn)',
    '2. Generate your first post with TweetGenie or LinkedInGenie',
    '3. Schedule and automate your content',
    '4. Invite your team with role-based access',
    '',
    'Go to your dashboard: https://suitegenie.in/dashboard',
    '',
    `Hey ${displayName} - I'm Kanishk, founder of SuiteGenie. If you get stuck or have feedback, reply to this email. I read every reply.`,
    '',
    '- Kanishk Saraswat, Founder, SuiteGenie',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to SuiteGenie</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <span style="display:none;max-height:0;overflow:hidden;color:#f0f4f8;">
    Your AI social media engine is ready. Let's get started.
  </span>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef3f8;padding:28px 12px;">
    <tr>
      <td align="center">

        <table width="680" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

          <tr>
            <td style="background-color:#2563eb;height:5px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" style="padding:32px 36px 24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#2563eb;border-radius:10px;padding:9px 18px;">
                    <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Suite<span style="color:#ffffff;">Genie</span></span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:22px 0 8px;font-size:30px;font-weight:800;color:#111827;letter-spacing:-0.5px;line-height:1.2;">
                Welcome to SuiteGenie, ${safeName}!
              </h1>
              <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.6;">
                Your AI-powered social media workspace is ready.<br/>Here's how to hit the ground running.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px;">
              <div style="height:1px;background-color:#e5e7eb;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 36px 8px;">
              <p style="margin:0 0 20px;font-size:11px;font-weight:700;color:#2563eb;letter-spacing:2px;text-transform:uppercase;">Get started in 4 steps</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px;height:36px;background-color:#eff6ff;border:2px solid #bfdbfe;border-radius:10px;text-align:center;line-height:32px;font-size:15px;font-weight:800;color:#2563eb;">1</div>
                  </td>
                  <td valign="middle" style="padding-left:14px;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">Connect your account</p>
                    <p style="margin:3px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">Link your Twitter/X or LinkedIn account to your SuiteGenie workspace.</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px;height:36px;background-color:#eff6ff;border:2px solid #bfdbfe;border-radius:10px;text-align:center;line-height:32px;font-size:15px;font-weight:800;color:#2563eb;">2</div>
                  </td>
                  <td valign="middle" style="padding-left:14px;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">Generate your first post</p>
                    <p style="margin:3px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">Use TweetGenie or LinkedInGenie to create AI-written content in seconds.</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px;height:36px;background-color:#eff6ff;border:2px solid #bfdbfe;border-radius:10px;text-align:center;line-height:32px;font-size:15px;font-weight:800;color:#2563eb;">3</div>
                  </td>
                  <td valign="middle" style="padding-left:14px;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">Schedule &amp; automate</p>
                    <p style="margin:3px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">Bulk schedule weeks of content and let SuiteGenie handle the posting automatically.</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px;height:36px;background-color:#eff6ff;border:2px solid #bfdbfe;border-radius:10px;text-align:center;line-height:32px;font-size:15px;font-weight:800;color:#2563eb;">4</div>
                  </td>
                  <td valign="middle" style="padding-left:14px;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">Invite your team</p>
                    <p style="margin:3px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">Add editors and viewers with role-based access - keep client accounts organised and secure.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 36px 28px;">
              <a href="https://suitegenie.in/dashboard" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:10px;letter-spacing:0.2px;">
                Go to my Dashboard &rarr;
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px;">
              <div style="height:1px;background-color:#e5e7eb;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 36px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8faff;border-left:3px solid #2563eb;border-radius:0 8px 8px 0;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">
                      Hey ${safeName} - I'm Kanishk, founder of SuiteGenie. I built this to cut down the repetitive work that eats up time in social media operations. If you ever get stuck, just reply to this email. I read every reply personally.
                    </p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#2563eb;">- Kanishk Saraswat, Founder &middot; SuiteGenie</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 36px;border-radius:0 0 16px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">SuiteGenie &middot; kanishksaraswat@suitegenie.in</p>
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      Reply to this email for help &middot;
                      <a href="https://suitegenie.in" style="color:#2563eb;text-decoration:none;">suitegenie.in</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  return { subject, html, text };
}

export default buildWelcomeEmailTemplate;
