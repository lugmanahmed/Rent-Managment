const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class PDFService {
  constructor() {
    this.outputDir = path.join(__dirname, '../uploads/invoices');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateInvoicePDF(invoice) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = this.generateInvoiceHTML(invoice);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      await browser.close();
      
      // Save PDF file
      const fileName = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
      const filePath = path.join(this.outputDir, fileName);
      
      fs.writeFileSync(filePath, pdfBuffer);
      
      return {
        fileName,
        filePath,
        buffer: pdfBuffer
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  generateInvoiceHTML(invoice) {
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
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          
          .company-info h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 10px;
          }
          
          .company-info p {
            color: #6b7280;
            font-size: 14px;
          }
          
          .invoice-info {
            text-align: right;
          }
          
          .invoice-info h2 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 10px;
          }
          
          .invoice-info p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .bill-to {
            margin-bottom: 30px;
          }
          
          .bill-to h3 {
            color: #1f2937;
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          
          .bill-to p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .items-table th {
            background-color: #f9fafb;
            color: #1f2937;
            font-weight: 600;
            padding: 15px 10px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .items-table td {
            padding: 15px 10px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
          }
          
          .items-table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          
          .totals-table {
            width: 300px;
          }
          
          .totals-table tr {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .totals-table .total-row {
            font-weight: 600;
            font-size: 18px;
            color: #1f2937;
            border-top: 2px solid #1f2937;
            margin-top: 10px;
            padding-top: 10px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .status-draft { background-color: #f3f4f6; color: #374151; }
          .status-sent { background-color: #dbeafe; color: #1e40af; }
          .status-paid { background-color: #d1fae5; color: #065f46; }
          .status-overdue { background-color: #fee2e2; color: #991b1b; }
          .status-cancelled { background-color: #f3f4f6; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-info">
              <h1>Rent Management System</h1>
              <p>Property Management Services</p>
              <p>Email: info@rentmanagement.com</p>
              <p>Phone: +960 123-4567</p>
            </div>
            <div class="invoice-info">
              <h2>INVOICE</h2>
              <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${formatDate(invoice.invoiceDate)}</p>
              <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status}</span></p>
            </div>
          </div>
          
          <div class="bill-to">
            <h3>Bill To:</h3>
            <p><strong>${invoice.tenant?.firstName} ${invoice.tenant?.lastName}</strong></p>
            <p>${invoice.property?.name}</p>
            <p>Unit ${invoice.rentalUnit?.unitNumber}, Floor ${invoice.rentalUnit?.floorNumber}</p>
            <p>Email: ${invoice.tenant?.email}</p>
            <p>Phone: ${invoice.tenant?.phone}</p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${formatCurrency(item.unitPrice, invoice.currency)}</td>
                  <td style="text-align: right;">${formatCurrency(item.amount, invoice.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td>${formatCurrency(invoice.subtotal, invoice.currency)}</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td>${formatCurrency(invoice.tax, invoice.currency)}</td>
              </tr>
              <tr class="total-row">
                <td>Total:</td>
                <td>${formatCurrency(invoice.total, invoice.currency)}</td>
              </tr>
            </table>
          </div>
          
          ${invoice.notes ? `
            <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
              <h4 style="color: #1f2937; margin-bottom: 10px;">Notes:</h4>
              <p style="color: #6b7280;">${invoice.notes}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This invoice was generated on ${formatDate(new Date())}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new PDFService();
