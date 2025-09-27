const nodemailer = require('nodemailer');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });
  }

  async sendInvoiceEmail(invoice, pdfPath, tenantEmail) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@rentmanagement.com',
        to: tenantEmail,
        subject: `Rent Invoice ${invoice.invoiceNumber} - ${invoice.property?.name}`,
        html: this.generateEmailHTML(invoice),
        attachments: [
          {
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            path: pdfPath,
            contentType: 'application/pdf'
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }
  }

  generateEmailHTML(invoice) {
    const formatCurrency = (amount, currency = 'MVR') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency === 'MVR' ? 'USD' : currency,
        minimumFractionDigits: 2
      }).format(amount);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rent Invoice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #1f2937;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 0 0 8px 8px;
          }
          .invoice-details {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            text-align: center;
            margin: 20px 0;
          }
          .due-date {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rent Invoice</h1>
          <p>Invoice #${invoice.invoiceNumber}</p>
        </div>
        
        <div class="content">
          <p>Dear ${invoice.tenant?.firstName} ${invoice.tenant?.lastName},</p>
          
          <p>Please find attached your rent invoice for the period ${formatDate(invoice.period?.startDate)} to ${formatDate(invoice.period?.endDate)}.</p>
          
          <div class="invoice-details">
            <h3>Invoice Details</h3>
            <p><strong>Property:</strong> ${invoice.property?.name}</p>
            <p><strong>Unit:</strong> Unit ${invoice.rentalUnit?.unitNumber}, Floor ${invoice.rentalUnit?.floorNumber}</p>
            <p><strong>Period:</strong> ${formatDate(invoice.period?.startDate)} - ${formatDate(invoice.period?.endDate)}</p>
            <p><strong>Invoice Date:</strong> ${formatDate(invoice.invoiceDate)}</p>
          </div>
          
          <div class="amount">
            Total Amount: ${formatCurrency(invoice.total, invoice.currency)}
          </div>
          
          <div class="due-date">
            <strong>Due Date: ${formatDate(invoice.dueDate)}</strong>
          </div>
          
          <p>Please ensure payment is made by the due date to avoid any late fees.</p>
          
          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Rent Management System</p>
            <p>Email: info@rentmanagement.com | Phone: +960 123-4567</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
