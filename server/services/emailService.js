import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';

class EmailService {
    constructor() {
        // Initialize Resend with API key
        if (!process.env.RESEND_API_KEY) {
            console.error('❌ RESEND_API_KEY not found in environment variables');
            throw new Error('RESEND_API_KEY is required');
        }
        
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@suitegenie.in';
        this.platformName = process.env.PLATFORM_NAME || 'SuiteGenie';
        this.baseUrl = process.env.BASE_URL || 'http://localhost:5173';
        
        console.log('📧 Resend EmailService initialized');
        console.log('🔑 API Key loaded:', process.env.RESEND_API_KEY.substring(0, 10) + '...');
    }

    /**
     * Send team invitation email using Resend
     */
    async sendTeamInvitation({ 
        recipientEmail, 
        recipientName, 
        inviterName, 
        inviterEmail, 
        teamName, 
        role, 
        invitationToken,
        expiresAt 
    }) {
        try {
            const inviteUrl = `${this.baseUrl}/team/invite/${invitationToken}`;
            const expiryDate = new Date(expiresAt).toLocaleDateString();
            
            const htmlTemplate = this.getTeamInvitationTemplate({
                recipientName: recipientName || recipientEmail,
                inviterName,
                inviterEmail,
                teamName,
                role,
                inviteUrl,
                expiryDate,
                platformName: this.platformName
            });

            const textContent = this.getTeamInvitationTextTemplate({
                recipientName: recipientName || recipientEmail,
                inviterName,
                teamName,
                role,
                inviteUrl,
                expiryDate,
                platformName: this.platformName
            });

            console.log('📧 Sending team invitation email via Resend...');
            console.log('📧 To:', recipientEmail);
            console.log('📧 Team:', teamName);
            console.log('📧 Role:', role);

            const { data, error } = await this.resend.emails.send({
                from: `${this.platformName} <${this.fromEmail}>`,
                to: recipientEmail,
                subject: `You're invited to join "${teamName}" on ${this.platformName}`,
                html: htmlTemplate,
                text: textContent
            });

            if (error) {
                console.error('❌ Resend API Error:', error);
                throw new Error(`Resend API error: ${error.message}`);
            }

            console.log('✅ Team invitation email sent successfully!');
            console.log('📧 Email ID:', data.id);
            console.log('📧 Recipient:', recipientEmail);
            console.log('📧 Team:', teamName);

            return {
                success: true,
                messageId: data.id,
                provider: 'resend'
            };

        } catch (error) {
            console.error('❌ Failed to send team invitation email:', error);
            throw new Error(`Email sending failed: ${error.message}`);
        }
    }

    /**
     * Send reminder email for pending invitation using Resend
     */
    async sendInvitationReminder({
        recipientEmail,
        recipientName,
        inviterName,
        teamName,
        role,
        invitationToken,
        expiresAt,
        daysSinceInvite
    }) {
        try {
            const inviteUrl = `${this.baseUrl}/team/invite/${invitationToken}`;
            const expiryDate = new Date(expiresAt).toLocaleDateString();
            
            const htmlTemplate = this.getInvitationReminderTemplate({
                recipientName: recipientName || recipientEmail,
                inviterName,
                teamName,
                role,
                inviteUrl,
                expiryDate,
                daysSinceInvite,
                platformName: this.platformName
            });

            console.log('📧 Sending invitation reminder via Resend...');

            const { data, error } = await this.resend.emails.send({
                from: `${this.platformName} <${this.fromEmail}>`,
                to: recipientEmail,
                subject: `Reminder: Join "${teamName}" on ${this.platformName}`,
                html: htmlTemplate
            });

            if (error) {
                console.error('❌ Resend API Error:', error);
                throw new Error(`Resend API error: ${error.message}`);
            }

            console.log('✅ Invitation reminder sent successfully!');
            console.log('📧 Email ID:', data.id);

            return {
                success: true,
                messageId: data.id,
                provider: 'resend'
            };

        } catch (error) {
            console.error('❌ Failed to send invitation reminder:', error);
            throw new Error(`Reminder email sending failed: ${error.message}`);
        }
    }

    /**
     * HTML template for team invitation
     */
    getTeamInvitationTemplate({
        recipientName,
        inviterName,
        inviterEmail,
        teamName,
        role,
        inviteUrl,
        expiryDate,
        platformName
    }) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Team Invitation</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                .invite-button { display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .invite-button:hover { background: #45a049; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
                .role-badge { background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 You're Invited to Join a Team!</h1>
            </div>
            
            <div class="content">
                <p>Hi ${recipientName},</p>
                
                <p><strong>${inviterName}</strong> (${inviterEmail}) has invited you to join the team <strong>"${teamName}"</strong> on ${platformName}.</p>
                
                <p>You'll be joining as: <span class="role-badge">${role.toUpperCase()}</span></p>
                
                <p>As a team member, you'll be able to:</p>
                <ul>
                    <li>📱 Connect and manage social media accounts</li>
                    <li>🤝 Collaborate with team members</li>
                    <li>📊 Access team analytics and insights</li>
                    <li>🚀 Use all premium platform features</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" class="invite-button">Accept Invitation</a>
                </div>
                
                <p><strong>⏰ This invitation expires on ${expiryDate}</strong></p>
                
                <p>If you can't click the button above, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${inviteUrl}</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
                
                <p style="font-size: 14px; color: #666;">
                    Don't recognize ${inviterName}? You can safely ignore this email.
                </p>
            </div>
            
            <div class="footer">
                <p>© 2025 ${platformName}. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Plain text template for team invitation
     */
    getTeamInvitationTextTemplate({
        recipientName,
        inviterName,
        teamName,
        role,
        inviteUrl,
        expiryDate,
        platformName
    }) {
        return `
You're Invited to Join a Team!

Hi ${recipientName},

${inviterName} has invited you to join the team "${teamName}" on ${platformName}.

You'll be joining as: ${role.toUpperCase()}

As a team member, you'll be able to:
- Connect and manage social media accounts
- Collaborate with team members  
- Access team analytics and insights
- Use all premium platform features

Accept your invitation: ${inviteUrl}

This invitation expires on ${expiryDate}

Don't recognize ${inviterName}? You can safely ignore this email.

© 2025 ${platformName}. All rights reserved.
        `.trim();
    }

    /**
     * HTML template for invitation reminder
     */
    getInvitationReminderTemplate({
        recipientName,
        inviterName,
        teamName,
        role,
        inviteUrl,
        expiryDate,
        daysSinceInvite,
        platformName
    }) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation Reminder</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ff7043 0%, #ff5722 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                .remind-button { display: inline-block; background: #ff5722; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
                .urgent { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⏰ Invitation Reminder</h1>
            </div>
            
            <div class="content">
                <p>Hi ${recipientName},</p>
                
                <p>This is a friendly reminder that you have a pending invitation from <strong>${inviterName}</strong> to join the team <strong>"${teamName}"</strong> on ${platformName}.</p>
                
                <p>It's been ${daysSinceInvite} days since the invitation was sent.</p>
                
                <div class="urgent">
                    <strong>⚠️ Your invitation expires on ${expiryDate}</strong>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" class="remind-button">Accept Invitation Now</a>
                </div>
                
                <p>Don't miss out on collaborating with your team!</p>
            </div>
            
            <div class="footer">
                <p>© 2025 ${platformName}. All rights reserved.</p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Test Resend email configuration
     */
    async testEmailConfiguration() {
        try {
            // Test Resend connection by sending a test email to a safe address
            console.log('📧 Testing Resend configuration...');
            console.log('🔑 API Key present:', !!process.env.RESEND_API_KEY);
            
            // For now, just check if API key is present and Resend instance exists
            if (!process.env.RESEND_API_KEY) {
                throw new Error('RESEND_API_KEY is not configured');
            }
            
            if (!this.resend) {
                throw new Error('Resend instance not initialized');
            }
            
            console.log('✅ Resend email service is configured correctly');
            return { 
                success: true, 
                provider: 'resend',
                apiKeyPresent: true
            };
        } catch (error) {
            console.error('❌ Resend configuration error:', error);
            return { 
                success: false, 
                error: error.message,
                provider: 'resend'
            };
        }
    }
}

export default EmailService;