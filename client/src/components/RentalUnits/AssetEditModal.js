import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import LoadingSpinner from '../UI/LoadingSpinner';

const AssetEditModal = ({ 
  isOpen, 
  onClose, 
  asset, 
  onSave, 
  isLoading = false 
}) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      quantity: 1,
      status: 'Working',
      notes: ''
    }
  });

  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);
  const watchedStatus = watch('status');

  // Status options
  const statusOptions = [
    { value: 'Working', label: 'Working' },
    { value: 'Faulty', label: 'Faulty' },
    { value: 'Repaired', label: 'Repaired' },
    { value: 'Replaced', label: 'Replaced' }
  ];

  // Reset form when asset changes
  useEffect(() => {
    if (asset) {
      reset({
        quantity: asset.quantity || 1,
        status: asset.status || 'Working',
        notes: asset.notes || ''
      });
    }
  }, [asset, reset]);

  // Show maintenance alert when status changes to Faulty
  useEffect(() => {
    setShowMaintenanceAlert(watchedStatus === 'Faulty');
  }, [watchedStatus]);

  const onSubmit = (data) => {
    // Only send fields that have actual values (not empty strings)
    const cleanData = {};
    if (data.quantity && data.quantity > 0) cleanData.quantity = data.quantity;
    if (data.status) cleanData.status = data.status;
    if (data.notes && data.notes.trim()) cleanData.notes = data.notes.trim();
    
    console.log('Submitting clean data:', cleanData);
    onSave(cleanData);
  };

  const handleClose = () => {
    reset();
    setShowMaintenanceAlert(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-blue-600" />
                Edit Asset
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Asset Info Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Asset Information</h3>
                <div className="space-y-1">
                  <p><span className="font-medium">Name:</span> {asset?.name || 'Unknown Asset'}</p>
                  <p><span className="font-medium">Type:</span> {asset?.category || 'Unknown Type'}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">Asset name and type cannot be changed here. To modify these, edit the asset directly.</p>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <Input
                  type="number"
                  min="1"
                  {...register('quantity', { 
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Quantity must be at least 1' }
                  })}
                  error={errors.quantity?.message}
                  placeholder="Enter quantity"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <Select
                  {...register('status', { required: 'Status is required' })}
                  options={statusOptions}
                  error={errors.status?.message}
                  placeholder="Select status"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  {...register('notes', {
                    maxLength: { value: 500, message: 'Notes cannot exceed 500 characters' }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Add any additional notes about this asset..."
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                )}
              </div>

              {/* Maintenance Alert */}
              {showMaintenanceAlert && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        Maintenance Required
                      </h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        This asset has been marked as faulty. A maintenance request will be automatically created.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetEditModal;
