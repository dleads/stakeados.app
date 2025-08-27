// Email Service for sending notifications and updates

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface ProposalStatusEmailData {
  proposerName: string;
  proposalTitle: string;
  status: 'approved' | 'rejected' | 'changes_requested';
  feedback?: string;
  reviewerName?: string;
  actionUrl?: string;
}

export class EmailService {
  private static baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://stakeados.com';

  static generateProposalStatusEmail(
    data: ProposalStatusEmailData
  ): EmailTemplate {
    const { proposalTitle, status, feedback, reviewerName, actionUrl } = data;

    const statusConfig = {
      approved: {
        subject: '🎉 Your Article Proposal Has Been Approved!',
        title: 'Congratulations! Your proposal has been approved.',
        message:
          'Your article proposal has been approved by our editorial team. You can now start writing your full article.',
        actionText: 'Start Writing',
        color: '#00FF88',
        emoji: '🎉',
      },
      rejected: {
        subject: '📝 Article Proposal Update',
        title: 'Your proposal needs some adjustments.',
        message:
          'Unfortunately, your article proposal was not approved at this time. Please review the feedback below and consider submitting a revised proposal.',
        actionText: 'Submit New Proposal',
        color: '#FF6B6B',
        emoji: '📝',
      },
      changes_requested: {
        subject: '✏️ Changes Requested for Your Article Proposal',
        title: 'Your proposal is almost ready!',
        message:
          'Our editorial team has reviewed your proposal and would like you to make some adjustments before approval.',
        actionText: 'Revise Proposal',
        color: '#4ECDC4',
        emoji: '✏️',
      },
    };

    const config = statusConfig[status];

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #00FF88;
            margin-bottom: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background-color: ${config.color}20;
            color: ${config.color};
            border: 2px solid ${config.color}40;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin: 20px 0;
            text-align: center;
        }
        .proposal-title {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid ${config.color};
            margin: 20px 0;
        }
        .proposal-title h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 18px;
        }
        .message {
            font-size: 16px;
            color: #555;
            margin: 20px 0;
            text-align: center;
        }
        .feedback {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ddd;
        }
        .feedback h4 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        .feedback p {
            margin: 0;
            color: #666;
            white-space: pre-wrap;
        }
        .action-button {
            display: inline-block;
            background: ${config.color};
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 14px;
        }
        .footer a {
            color: #00FF88;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">STAKEADOS</div>
            <div class="status-badge">${status.replace('_', ' ')}</div>
        </div>
        
        <h1 class="title">${config.emoji} ${config.title}</h1>
        
        <div class="proposal-title">
            <h3>"${proposalTitle}"</h3>
        </div>
        
        <p class="message">${config.message}</p>
        
        ${
          feedback
            ? `
        <div class="feedback">
            <h4>Feedback from ${reviewerName || 'Editorial Team'}:</h4>
            <p>${feedback}</p>
        </div>
        `
            : ''
        }
        
        <div style="text-align: center;">
            <a href="${actionUrl || `${this.baseUrl}/community/propose`}" class="action-button">
                ${config.actionText}
            </a>
        </div>
        
        <div class="footer">
            <p>
                This email was sent to you because you submitted an article proposal on Stakeados.<br>
                <a href="${this.baseUrl}">Visit Stakeados</a> | 
                <a href="${this.baseUrl}/settings">Notification Settings</a>
            </p>
        </div>
    </div>
</body>
</html>`;

    const text = `
${config.emoji} ${config.title}

Proposal: "${proposalTitle}"

${config.message}

${feedback ? `Feedback from ${reviewerName || 'Editorial Team'}:\n${feedback}\n\n` : ''}

${config.actionText}: ${actionUrl || `${this.baseUrl}/community/propose`}

---
This email was sent to you because you submitted an article proposal on Stakeados.
Visit: ${this.baseUrl}
`;

    return {
      subject: config.subject,
      html,
      text,
    };
  }

  static async sendEmail(
    to: string,
    template: EmailTemplate,
    options: { from?: string } = {}
  ): Promise<void> {
    // This is where you would integrate with your email service provider
    // Examples: SendGrid, Resend, AWS SES, etc.

    console.log('Sending email:', {
      to,
      from: options.from || 'noreply@stakeados.com',
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    // Example with a hypothetical email service:
    /*
    const emailProvider = getEmailProvider(); // Your email service
    
    await emailProvider.send({
      to,
      from: options.from || 'noreply@stakeados.com',
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    */

    // For development, you might want to save emails to a file or database
    if (process.env.NODE_ENV === 'development') {
      // Save to file or log for testing
      console.log('Email would be sent in production:', template.subject);
    }
  }

  static async sendProposalStatusNotification(
    proposalData: ProposalStatusEmailData
  ): Promise<void> {
    const template = this.generateProposalStatusEmail(proposalData);

    // In a real implementation, you would get the email from the user data
    // For now, we'll just log it
    console.log('Proposal status notification:', {
      proposer: proposalData.proposerName,
      status: proposalData.status,
      template: template.subject,
    });

    // await this.sendEmail(userEmail, template);
  }
}

// Utility function to create notification data
export function createProposalNotificationData(
  proposal: any,
  status: 'approved' | 'rejected' | 'changes_requested',
  feedback?: string,
  reviewerName?: string
): ProposalStatusEmailData {
  const actionUrls = {
    approved: `${process.env.NEXT_PUBLIC_APP_URL}/articles/create?proposal=${proposal.id}`,
    rejected: `${process.env.NEXT_PUBLIC_APP_URL}/community/propose`,
    changes_requested: `${process.env.NEXT_PUBLIC_APP_URL}/proposals/${proposal.id}/edit`,
  };

  return {
    proposerName: proposal.proposer?.display_name || proposal.proposer_name,
    proposalTitle: proposal.title,
    status,
    feedback,
    reviewerName,
    actionUrl: actionUrls[status],
  };
}
