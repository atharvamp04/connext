package services

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"os"

	"gopkg.in/gomail.v2"
)

type EmailService struct {
	dialer  *gomail.Dialer
	from    string
	enabled bool
}

func NewEmailService() *EmailService {
	host := os.Getenv("SMTP_HOST")
	port := 587
	if os.Getenv("SMTP_PORT") != "" {
		fmt.Sscanf(os.Getenv("SMTP_PORT"), "%d", &port)
	}
	username := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASS")

	// Check if SMTP is configured
	if host == "" || username == "" || password == "" {
		log.Println("⚠️  ============================================")
		log.Println("⚠️  WARNING: Email service NOT configured!")
		log.Println("⚠️  Missing SMTP credentials in .env file")
		log.Println("⚠️  Required variables:")
		if host == "" {
			log.Println("⚠️    - SMTP_HOST (e.g., smtp.gmail.com)")
		}
		if username == "" {
			log.Println("⚠️    - SMTP_USER (your email address)")
		}
		if password == "" {
			log.Println("⚠️    - SMTP_PASS (app password)")
		}
		log.Println("⚠️  Invitation emails will NOT be sent!")
		log.Println("⚠️  ============================================")

		return &EmailService{
			enabled: false,
		}
	}

	// Log successful configuration (without password)
	log.Printf("✅ Email Service enabled: %s:%d (user: %s)", host, port, username)

	return &EmailService{
		dialer:  gomail.NewDialer(host, port, username, password),
		from:    username,
		enabled: true,
	}
}

type InvitationEmailData struct {
	InviterName string
	InviteeName string
	InviteLink  string
	IsNewUser   bool
}

func (s *EmailService) SendInvitation(to string, data InvitationEmailData) error {
	// Check if email service is enabled
	if !s.enabled {
		return fmt.Errorf("email service is not configured - please set SMTP credentials in .env file")
	}

	log.Printf("📤 Sending invitation email to: %s (New user: %v)", to, data.IsNewUser)

	m := gomail.NewMessage()
	m.SetHeader("From", s.from)
	m.SetHeader("To", to)

	if data.IsNewUser {
		m.SetHeader("Subject", fmt.Sprintf("%s invited you to join Connext Network", data.InviterName))
	} else {
		m.SetHeader("Subject", fmt.Sprintf("%s invited you to their network", data.InviterName))
	}

	htmlBody, err := s.renderInvitationTemplate(data)
	if err != nil {
		log.Printf("❌ Failed to render email template: %v", err)
		return err
	}
	m.SetBody("text/html", htmlBody)

	textBody := s.getPlainTextBody(data)
	m.AddAlternative("text/plain", textBody)

	log.Printf("📧 Connecting to SMTP server...")
	err = s.dialer.DialAndSend(m)

	if err != nil {
		log.Printf("❌ Failed to send email: %v", err)
		log.Printf("💡 Common fixes:")
		log.Printf("   - For Gmail: Use App Password (not regular password)")
		log.Printf("   - Enable 2FA and generate App Password at: https://myaccount.google.com/apppasswords")
		log.Printf("   - Check firewall allows port 587")
		log.Printf("   - Verify SMTP_HOST, SMTP_USER, SMTP_PASS in .env")
		return err
	}

	log.Printf("✅ Email sent successfully to: %s", to)
	return nil
}

func (s *EmailService) renderInvitationTemplate(data InvitationEmailData) (string, error) {
	tmpl := `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 14px 28px; background: #ec4899; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #db2777; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🌐 Connext Network</h1>
        </div>
        <div class="content">
            {{if .IsNewUser}}
                <h2>You're Invited to Join Connext!</h2>
                <p>Hi{{if .InviteeName}} {{.InviteeName}}{{end}},</p>
                <p><strong>{{.InviterName}}</strong> has invited you to join their private network on Connext.</p>
                
                <div class="info-box">
                    <strong>What's Connext?</strong>
                    <p style="margin: 10px 0 0 0;">Connext is a secure network management platform that lets you connect and manage your devices privately.</p>
                </div>

                <p><strong>To get started:</strong></p>
                <ol>
                    <li>Click the button below to accept the invitation</li>
                    <li>Create your free account</li>
                    <li>Start connecting with {{.InviterName}}'s network</li>
                </ol>

                <center>
                    <a href="{{.InviteLink}}" class="button">Accept Invitation & Sign Up</a>
                </center>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    Or copy and paste this link into your browser:<br>
                    <code style="background: #f5f5f5; padding: 8px; display: inline-block; margin-top: 8px; word-break: break-all;">{{.InviteLink}}</code>
                </p>
            {{else}}
                <h2>Network Invitation</h2>
                <p>Hi {{.InviteeName}},</p>
                <p><strong>{{.InviterName}}</strong> has invited you to join their network on Connext.</p>
                
                <p>Click the button below to accept this invitation and get access to their network devices.</p>

                <center>
                    <a href="{{.InviteLink}}" class="button">Accept Invitation</a>
                </center>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    Or copy and paste this link into your browser:<br>
                    <code style="background: #f5f5f5; padding: 8px; display: inline-block; margin-top: 8px; word-break: break-all;">{{.InviteLink}}</code>
                </p>
            {{end}}

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 13px;">
                This invitation was sent by {{.InviterName}}. If you weren't expecting this email, you can safely ignore it.
            </p>
        </div>
        <div class="footer">
            <p>© 2024 Connext Network. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`

	t, err := template.New("invitation").Parse(tmpl)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

func (s *EmailService) getPlainTextBody(data InvitationEmailData) string {
	inviteeGreeting := ""
	if data.InviteeName != "" {
		inviteeGreeting = " " + data.InviteeName
	}

	if data.IsNewUser {
		return fmt.Sprintf(`You're Invited to Join Connext!

Hi%s,

%s has invited you to join their private network on Connext.

What's Connext?
Connext is a secure network management platform that lets you connect and manage your devices privately.

To get started:
1. Click the link below to accept the invitation
2. Create your free account
3. Start connecting with %s's network

Accept Invitation: %s

If you weren't expecting this email, you can safely ignore it.

© 2024 Connext Network`,
			inviteeGreeting,
			data.InviterName,
			data.InviterName,
			data.InviteLink,
		)
	}

	return fmt.Sprintf(`Network Invitation

Hi %s,

%s has invited you to join their network on Connext.

Click the link below to accept this invitation and get access to their network devices.

Accept Invitation: %s

If you weren't expecting this email, you can safely ignore it.

© 2024 Connext Network`,
		data.InviteeName,
		data.InviterName,
		data.InviteLink,
	)
}
