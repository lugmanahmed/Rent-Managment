import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import FormSection from '../../components/UI/FormSection';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('global');
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading: settingsLoading } = useQuery(
    'settings',
    () => settingsAPI.get(),
    {
      select: (data) => data.data.settings
    }
  );

  const { data: dropdownData, isLoading: dropdownsLoading } = useQuery(
    'dropdowns',
    () => settingsAPI.getDropdowns(),
    {
      select: (data) => data.data.dropdownOptions
    }
  );

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: settingsData || {
      globalSettings: {
        defaultCurrency: 'MVR',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Indian/Maldives',
        language: 'en'
      },
      notificationSettings: {
        emailNotifications: true,
        smsNotifications: false,
        rentReminderDays: 7,
        maintenanceReminderDays: 3,
        overdueReminderDays: 3,
        leaseExpiryReminderDays: 30
      },
      leaseSettings: {
        defaultLeaseDuration: 12,
        autoRenewal: false,
        gracePeriodDays: 5
      },
      financialSettings: {
        lateFeePercentage: 5,
        lateFeeFixedAmount: 0,
        securityDepositMonths: 1,
        petDepositAmount: 0
      },
      rentSettings: {
        autoGenerateRent: true,
        rentGenerationDay: 1,
        rentDueDays: 7,
        includeUtilities: false,
        utilitiesAmount: 0,
        lateFeePercentage: 5,
        lateFeeFixedAmount: 0,
        invoiceTemplate: 'standard',
        emailReminders: true,
        reminderDays: [3, 1]
      }
    }
  });

  const updateMutation = useMutation(
    (settingsData) => settingsAPI.update(settingsData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        toast.success('Settings updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update settings');
      }
    }
  );

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  const addLeasePreset = () => {
    const currentPresets = watch('leaseSettings.leaseDurationPresets') || [];
    setValue('leaseSettings.leaseDurationPresets', [
      ...currentPresets,
      { name: '', months: 12 }
    ]);
  };

  const removeLeasePreset = (index) => {
    const currentPresets = watch('leaseSettings.leaseDurationPresets') || [];
    setValue('leaseSettings.leaseDurationPresets', 
      currentPresets.filter((_, i) => i !== index)
    );
  };

  const updateLeasePreset = (index, field, value) => {
    const currentPresets = watch('leaseSettings.leaseDurationPresets') || [];
    const updatedPresets = [...currentPresets];
    updatedPresets[index] = { ...updatedPresets[index], [field]: value };
    setValue('leaseSettings.leaseDurationPresets', updatedPresets);
  };

  if (settingsLoading || dropdownsLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

  const tabs = [
    { id: 'global', name: 'Global Settings', icon: '🌐' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'lease', name: 'Lease Settings', icon: '📄' },
    { id: 'financial', name: 'Financial Settings', icon: '💰' },
    { id: 'rent', name: 'Rent Settings', icon: '📋' },
    { id: 'system', name: 'System Settings', icon: '⚙️' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure system settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{tabs.find(tab => tab.id === activeTab)?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Global Settings */}
                {activeTab === 'global' && (
                  <FormSection title="Global Settings" collapsible={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Default Currency *</label>
                        <Select
                          {...register('globalSettings.defaultCurrency', { required: 'Default currency is required' })}
                          options={dropdownData?.currencies?.map(currency => ({ value: currency, label: currency }))}
                          error={errors.globalSettings?.defaultCurrency?.message}
                          placeholder="Select default currency"
                        />
                      </div>
                      <div>
                        <label className="label">Date Format *</label>
                        <Select
                          {...register('globalSettings.dateFormat', { required: 'Date format is required' })}
                          options={[
                            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                          ]}
                          error={errors.globalSettings?.dateFormat?.message}
                          placeholder="Select date format"
                        />
                      </div>
                      <div>
                        <label className="label">Timezone *</label>
                        <Input
                          {...register('globalSettings.timezone', { required: 'Timezone is required' })}
                          error={errors.globalSettings?.timezone?.message}
                          placeholder="e.g., Indian/Maldives"
                        />
                      </div>
                      <div>
                        <label className="label">Language *</label>
                        <Select
                          {...register('globalSettings.language', { required: 'Language is required' })}
                          options={[
                            { value: 'en', label: 'English' },
                            { value: 'dv', label: 'Dhivehi' }
                          ]}
                          error={errors.globalSettings?.language?.message}
                          placeholder="Select language"
                        />
                      </div>
                    </div>
                  </FormSection>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <FormSection title="Notification Settings" collapsible={false}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Email Notifications</label>
                          <Select
                            {...register('notificationSettings.emailNotifications')}
                            options={[
                              { value: true, label: 'Enabled' },
                              { value: false, label: 'Disabled' }
                            ]}
                            placeholder="Select option"
                          />
                        </div>
                        <div>
                          <label className="label">SMS Notifications</label>
                          <Select
                            {...register('notificationSettings.smsNotifications')}
                            options={[
                              { value: true, label: 'Enabled' },
                              { value: false, label: 'Disabled' }
                            ]}
                            placeholder="Select option"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Rent Reminder (Days)</label>
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            {...register('notificationSettings.rentReminderDays', {
                              min: { value: 1, message: 'Must be at least 1' },
                              max: { value: 30, message: 'Cannot exceed 30' }
                            })}
                            error={errors.notificationSettings?.rentReminderDays?.message}
                            placeholder="Days before rent due"
                          />
                        </div>
                        <div>
                          <label className="label">Maintenance Reminder (Days)</label>
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            {...register('notificationSettings.maintenanceReminderDays', {
                              min: { value: 1, message: 'Must be at least 1' },
                              max: { value: 30, message: 'Cannot exceed 30' }
                            })}
                            error={errors.notificationSettings?.maintenanceReminderDays?.message}
                            placeholder="Days before maintenance due"
                          />
                        </div>
                        <div>
                          <label className="label">Overdue Reminder (Days)</label>
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            {...register('notificationSettings.overdueReminderDays', {
                              min: { value: 1, message: 'Must be at least 1' },
                              max: { value: 30, message: 'Cannot exceed 30' }
                            })}
                            error={errors.notificationSettings?.overdueReminderDays?.message}
                            placeholder="Days after overdue"
                          />
                        </div>
                        <div>
                          <label className="label">Lease Expiry Reminder (Days)</label>
                          <Input
                            type="number"
                            min="1"
                            max="90"
                            {...register('notificationSettings.leaseExpiryReminderDays', {
                              min: { value: 1, message: 'Must be at least 1' },
                              max: { value: 90, message: 'Cannot exceed 90' }
                            })}
                            error={errors.notificationSettings?.leaseExpiryReminderDays?.message}
                            placeholder="Days before lease expiry"
                          />
                        </div>
                      </div>
                    </div>
                  </FormSection>
                )}

                {/* Lease Settings */}
                {activeTab === 'lease' && (
                  <FormSection title="Lease Settings" collapsible={false}>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Default Lease Duration (Months)</label>
                          <Input
                            type="number"
                            min="1"
                            {...register('leaseSettings.defaultLeaseDuration', {
                              min: { value: 1, message: 'Must be at least 1' }
                            })}
                            error={errors.leaseSettings?.defaultLeaseDuration?.message}
                            placeholder="Default lease duration"
                          />
                        </div>
                        <div>
                          <label className="label">Grace Period (Days)</label>
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            {...register('leaseSettings.gracePeriodDays', {
                              min: { value: 0, message: 'Cannot be negative' },
                              max: { value: 30, message: 'Cannot exceed 30' }
                            })}
                            error={errors.leaseSettings?.gracePeriodDays?.message}
                            placeholder="Grace period for payments"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">Auto Renewal</label>
                        <Select
                          {...register('leaseSettings.autoRenewal')}
                          options={[
                            { value: true, label: 'Enabled' },
                            { value: false, label: 'Disabled' }
                          ]}
                          placeholder="Select option"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Lease Duration Presets</h4>
                        <div className="space-y-3">
                          {watch('leaseSettings.leaseDurationPresets')?.map((preset, index) => (
                            <div key={index} className="flex gap-4 items-end">
                              <div className="flex-1">
                                <label className="label">Preset Name</label>
                                <Input
                                  value={preset.name}
                                  onChange={(e) => updateLeasePreset(index, 'name', e.target.value)}
                                  placeholder="e.g., 6 Months"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="label">Months</label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={preset.months}
                                  onChange={(e) => updateLeasePreset(index, 'months', parseInt(e.target.value))}
                                  placeholder="6"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeLeasePreset(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addLeasePreset}
                          >
                            Add Preset
                          </Button>
                        </div>
                      </div>
                    </div>
                  </FormSection>
                )}

                {/* Financial Settings */}
                {activeTab === 'financial' && (
                  <FormSection title="Financial Settings" collapsible={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Late Fee Percentage (%)</label>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          {...register('financialSettings.lateFeePercentage', {
                            min: { value: 0, message: 'Cannot be negative' },
                            max: { value: 20, message: 'Cannot exceed 20%' }
                          })}
                          error={errors.financialSettings?.lateFeePercentage?.message}
                          placeholder="Late fee percentage"
                        />
                      </div>
                      <div>
                        <label className="label">Fixed Late Fee Amount</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...register('financialSettings.lateFeeFixedAmount', {
                            min: { value: 0, message: 'Cannot be negative' }
                          })}
                          error={errors.financialSettings?.lateFeeFixedAmount?.message}
                          placeholder="Fixed late fee amount"
                        />
                      </div>
                      <div>
                        <label className="label">Security Deposit (Months)</label>
                        <Input
                          type="number"
                          min="0"
                          max="12"
                          {...register('financialSettings.securityDepositMonths', {
                            min: { value: 0, message: 'Cannot be negative' },
                            max: { value: 12, message: 'Cannot exceed 12 months' }
                          })}
                          error={errors.financialSettings?.securityDepositMonths?.message}
                          placeholder="Security deposit in months"
                        />
                      </div>
                      <div>
                        <label className="label">Pet Deposit Amount</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...register('financialSettings.petDepositAmount', {
                            min: { value: 0, message: 'Cannot be negative' }
                          })}
                          error={errors.financialSettings?.petDepositAmount?.message}
                          placeholder="Pet deposit amount"
                        />
                      </div>
                    </div>
                  </FormSection>
                )}

                {/* Rent Settings */}
                {activeTab === 'rent' && (
                  <FormSection title="Rent Settings" collapsible={false}>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Auto Generate Rent Invoices</label>
                          <Select
                            {...register('rentSettings.autoGenerateRent')}
                            options={[
                              { value: true, label: 'Yes' },
                              { value: false, label: 'No' }
                            ]}
                            placeholder="Auto generate rent invoices"
                          />
                        </div>
                        <div>
                          <label className="label">Rent Generation Day (1-31)</label>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            {...register('rentSettings.rentGenerationDay', {
                              min: { value: 1, message: 'Must be between 1-31' },
                              max: { value: 31, message: 'Must be between 1-31' }
                            })}
                            error={errors.rentSettings?.rentGenerationDay?.message}
                            placeholder="Day of month to generate rent"
                          />
                        </div>
                        <div>
                          <label className="label">Rent Due Days</label>
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            {...register('rentSettings.rentDueDays', {
                              min: { value: 1, message: 'Must be at least 1 day' },
                              max: { value: 30, message: 'Cannot exceed 30 days' }
                            })}
                            error={errors.rentSettings?.rentDueDays?.message}
                            placeholder="Days after generation when rent is due"
                          />
                        </div>
                        <div>
                          <label className="label">Include Utilities</label>
                          <Select
                            {...register('rentSettings.includeUtilities')}
                            options={[
                              { value: true, label: 'Yes' },
                              { value: false, label: 'No' }
                            ]}
                            placeholder="Include utilities in rent"
                          />
                        </div>
                        <div>
                          <label className="label">Utilities Amount</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('rentSettings.utilitiesAmount', {
                              min: { value: 0, message: 'Cannot be negative' }
                            })}
                            error={errors.rentSettings?.utilitiesAmount?.message}
                            placeholder="Default utilities amount"
                          />
                        </div>
                        <div>
                          <label className="label">Late Fee Percentage (%)</label>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            {...register('rentSettings.lateFeePercentage', {
                              min: { value: 0, message: 'Cannot be negative' },
                              max: { value: 20, message: 'Cannot exceed 20%' }
                            })}
                            error={errors.rentSettings?.lateFeePercentage?.message}
                            placeholder="Late fee percentage for rent"
                          />
                        </div>
                        <div>
                          <label className="label">Fixed Late Fee Amount</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('rentSettings.lateFeeFixedAmount', {
                              min: { value: 0, message: 'Cannot be negative' }
                            })}
                            error={errors.rentSettings?.lateFeeFixedAmount?.message}
                            placeholder="Fixed late fee amount for rent"
                          />
                        </div>
                        <div>
                          <label className="label">Invoice Template</label>
                          <Select
                            {...register('rentSettings.invoiceTemplate')}
                            options={[
                              { value: 'standard', label: 'Standard' },
                              { value: 'detailed', label: 'Detailed' },
                              { value: 'minimal', label: 'Minimal' }
                            ]}
                            placeholder="Invoice template"
                          />
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Email Reminders</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="label">Send Email Reminders</label>
                            <Select
                              {...register('rentSettings.emailReminders')}
                              options={[
                                { value: true, label: 'Yes' },
                                { value: false, label: 'No' }
                              ]}
                              placeholder="Send email reminders"
                            />
                          </div>
                          <div>
                            <label className="label">Reminder Days (comma-separated)</label>
                            <Input
                              type="text"
                              {...register('rentSettings.reminderDays')}
                              placeholder="3,1 (days before due date)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </FormSection>
                )}

                {/* System Settings */}
                {activeTab === 'system' && (
                  <FormSection title="System Settings" collapsible={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Max File Upload Size (MB)</label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          {...register('systemSettings.maxFileUploadSize', {
                            min: { value: 1, message: 'Must be at least 1MB' },
                            max: { value: 100, message: 'Cannot exceed 100MB' }
                          })}
                          error={errors.systemSettings?.maxFileUploadSize?.message}
                          placeholder="Maximum file upload size"
                        />
                      </div>
                      <div>
                        <label className="label">Session Timeout (Minutes)</label>
                        <Input
                          type="number"
                          min="30"
                          max="1440"
                          {...register('systemSettings.sessionTimeout', {
                            min: { value: 30, message: 'Must be at least 30 minutes' },
                            max: { value: 1440, message: 'Cannot exceed 24 hours' }
                          })}
                          error={errors.systemSettings?.sessionTimeout?.message}
                          placeholder="Session timeout in minutes"
                        />
                      </div>
                      <div>
                        <label className="label">Backup Frequency</label>
                        <Select
                          {...register('systemSettings.backupFrequency')}
                          options={[
                            { value: 'daily', label: 'Daily' },
                            { value: 'weekly', label: 'Weekly' },
                            { value: 'monthly', label: 'Monthly' }
                          ]}
                          placeholder="Select backup frequency"
                        />
                      </div>
                    </div>
                  </FormSection>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t">
                  <Button
                    type="submit"
                    loading={updateMutation.isLoading}
                    disabled={updateMutation.isLoading}
                  >
                    Save Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
