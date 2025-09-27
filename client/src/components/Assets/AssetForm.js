import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  X, 
  Package
} from 'lucide-react';

import { assetsAPI } from '../../services/api';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import FormSection from '../UI/FormSection';

const AssetForm = ({ asset, isEdit = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: '',
      brand: '',
      category: 'other'
    }
  });

  useEffect(() => {
    if (asset && isEdit) {
      reset({
        name: asset.name || '',
        brand: asset.brand || '',
        category: asset.category || 'other'
      });
    }
  }, [asset, reset, isEdit]);

  const createMutation = useMutation(
    (data) => assetsAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['assets']);
        queryClient.invalidateQueries(['assets-stats']);
        toast.success('Asset created successfully!');
        navigate('/assets');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create asset');
      }
    }
  );

  const updateMutation = useMutation(
    (data) => assetsAPI.update(asset._id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['assets']);
        queryClient.invalidateQueries(['assets-stats']);
        toast.success('Asset updated successfully!');
        navigate('/assets');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update asset');
      }
    }
  );

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <FormSection title="Asset Information" icon={<Package className="h-5 w-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Asset Name *"
              {...register('name', { required: 'Asset name is required' })}
              error={errors.name?.message}
              placeholder="e.g., Living Room Sofa, Air Conditioner"
            />
          </div>

          <div>
            <Input
              label="Brand"
              {...register('brand')}
              placeholder="e.g., Samsung, IKEA, Hitachi"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="other">Other</option>
              <option value="furniture">Furniture</option>
              <option value="appliance">Appliance</option>
              <option value="electronics">Electronics</option>
              <option value="kitchen">Kitchen</option>
              <option value="bathroom">Bathroom</option>
              <option value="bedroom">Bedroom</option>
              <option value="living_room">Living Room</option>
              <option value="outdoor">Outdoor</option>
              <option value="security">Security</option>
              <option value="maintenance">Maintenance</option>
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/assets')}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : (isEdit ? 'Update Asset' : 'Create Asset')}
        </Button>
      </div>
    </form>
  );
};

export default AssetForm;