const cron = require('node-cron');
const Invoice = require('../models/Invoice');
const RentalUnit = require('../models/RentalUnit');
const Settings = require('../models/Settings');

// Generate unique invoice number
const generateInvoiceNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  // Find the last invoice for this month
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^INV-${year}${month}` }
  }).sort({ invoiceNumber: -1 });
  
  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `INV-${year}${month}-${String(sequence).padStart(3, '0')}`;
};

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  async startRentGenerationJob() {
    try {
      // Get rent settings to determine generation day
      const settings = await Settings.findOne();
      const rentSettings = settings?.rentSettings;
      const generationDay = rentSettings?.rentGenerationDay || 1;
      
      // Create cron expression for the specified day of month at 9 AM
      const cronExpression = `0 9 ${generationDay} * *`;
      
      const job = cron.schedule(cronExpression, async () => {
        console.log('Running automatic monthly rent generation...');
        await this.generateMonthlyRent();
      }, {
        scheduled: true,
        timezone: "Indian/Maldives"
      });

      this.jobs.set('rentGeneration', job);
      console.log(`Monthly rent generation cron job started (${generationDay}${this.getOrdinalSuffix(generationDay)} of every month at 9 AM)`);
    } catch (error) {
      console.error('Error starting rent generation job:', error);
    }
  }

  getOrdinalSuffix(day) {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  async restartRentGenerationJob() {
    try {
      // Stop existing job if it exists
      const existingJob = this.jobs.get('rentGeneration');
      if (existingJob) {
        existingJob.stop();
        this.jobs.delete('rentGeneration');
        console.log('Stopped existing rent generation job');
      }
      
      // Start new job with updated settings
      await this.startRentGenerationJob();
    } catch (error) {
      console.error('Error restarting rent generation job:', error);
    }
  }

  async generateMonthlyRent() {
    try {
      console.log('Starting monthly rent generation process...');
      
      // Get rent settings
      const settings = await Settings.findOne();
      const rentSettings = settings?.rentSettings;

      if (!rentSettings?.autoGenerateRent) {
        console.log('Auto rent generation is disabled in settings');
        return;
      }

      const today = new Date();
      console.log(`Generating rent for month: ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

      // Calculate period dates for the current month
      const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Set due date based on settings (default 7 days from generation)
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + (rentSettings.rentDueDays || 7));

      // Find all occupied rental units
      const occupiedUnits = await RentalUnit.find({ 
        status: 'occupied',
        tenant: { $ne: null }
      })
        .populate('property', 'name address')
        .populate('tenant', 'firstName lastName email phone');

      console.log(`Found ${occupiedUnits.length} occupied rental units`);

      if (occupiedUnits.length === 0) {
        console.log('No occupied rental units found. Skipping invoice generation.');
        return;
      }

      let generatedCount = 0;
      let skippedCount = 0;

      for (const unit of occupiedUnits) {
        try {
          // Check if invoice already exists for this period
          const existingInvoice = await Invoice.findOne({
            rentalUnit: unit._id,
            'period.startDate': periodStart,
            'period.endDate': periodEnd
          });

          if (existingInvoice) {
            console.log(`Invoice already exists for unit ${unit.unitNumber} (${unit.property?.name})`);
            skippedCount++;
            continue;
          }

          // Create rent item
          const rentItem = {
            description: `Rent for ${unit.unitNumber}, Floor ${unit.floorNumber}`,
            amount: unit.financial.rentAmount,
            quantity: 1,
            unitPrice: unit.financial.rentAmount
          };

          // Add utilities if enabled
          if (rentSettings.includeUtilities && rentSettings.utilitiesAmount > 0) {
            rentItem.description += ` (including utilities)`;
            rentItem.amount += rentSettings.utilitiesAmount;
          }

          // Generate unique invoice number
          const invoiceNumber = await generateInvoiceNumber();
          
          const invoiceData = {
            invoiceNumber: invoiceNumber,
            property: unit.property._id,
            rentalUnit: unit._id,
            tenant: unit.tenant._id,
            invoiceDate: today,
            dueDate: dueDate,
            period: {
              startDate: periodStart,
              endDate: periodEnd
            },
            items: [rentItem],
            subtotal: rentItem.amount,
            tax: 0,
            total: rentItem.amount,
            currency: unit.financial.currency,
            status: 'draft',
            createdBy: null, // System generated
            isAutoGenerated: true
          };

          const invoice = new Invoice(invoiceData);
          await invoice.save();
          generatedCount++;

          console.log(`✅ Generated invoice ${invoice.invoiceNumber} for unit ${unit.unitNumber} (${unit.property?.name}) - ${unit.tenant?.firstName} ${unit.tenant?.lastName}`);
        } catch (unitError) {
          console.error(`❌ Error generating invoice for unit ${unit.unitNumber}:`, unitError.message);
        }
      }

      console.log(`🎉 Monthly rent generation completed!`);
      console.log(`📊 Summary: ${generatedCount} invoices generated, ${skippedCount} skipped (already exist)`);
      
      if (generatedCount > 0) {
        console.log(`💰 Total amount generated: ${occupiedUnits.reduce((sum, unit) => {
          const baseAmount = unit.financial.rentAmount;
          const utilitiesAmount = (rentSettings.includeUtilities && rentSettings.utilitiesAmount) ? rentSettings.utilitiesAmount : 0;
          return sum + baseAmount + utilitiesAmount;
        }, 0)} ${occupiedUnits[0]?.financial?.currency || 'MVR'}`);
      }
    } catch (error) {
      console.error('❌ Error in automatic rent generation:', error);
      console.error('Stack trace:', error.stack);
    }
  }

  // Manual trigger for testing
  async triggerManualGeneration() {
    console.log('🔄 Manual rent generation triggered...');
    await this.generateMonthlyRent();
  }

  // Get next scheduled run time
  getNextRunTime() {
    const job = this.jobs.get('rentGeneration');
    if (job && job.nextDate) {
      return job.nextDate();
    }
    return null;
  }

  // Get job status
  getJobStatus() {
    const job = this.jobs.get('rentGeneration');
    if (job) {
      const nextRun = job.nextDate ? job.nextDate() : null;
      const lastRun = job.lastDate ? job.lastDate() : null;
      
      return {
        running: job.running,
        nextRun: nextRun ? nextRun.toISOString() : null,
        lastRun: lastRun ? lastRun.toISOString() : null
      };
    }
    return {
      running: false,
      nextRun: null,
      lastRun: null
    };
  }

  // Ensure cron job is running
  async ensureJobRunning() {
    const job = this.jobs.get('rentGeneration');
    if (!job || !job.running) {
      console.log('Cron job not running, starting...');
      await this.startRentGenerationJob();
    }
  }

  // Get current settings info for debugging
  async getSettingsInfo() {
    try {
      const settings = await Settings.findOne();
      const rentSettings = settings?.rentSettings;
      return {
        hasSettings: !!settings,
        rentSettings: rentSettings,
        generationDay: rentSettings?.rentGenerationDay || 1,
        autoGenerate: rentSettings?.autoGenerateRent || false
      };
    } catch (error) {
      console.error('Error getting settings info:', error);
      return { error: error.message };
    }
  }

  stopAllJobs() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }
}

module.exports = new CronService();

