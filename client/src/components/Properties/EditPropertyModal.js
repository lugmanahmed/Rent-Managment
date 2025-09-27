import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { X, Building2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { propertiesAPI, settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EditPropertyModal = ({ property, onClose }) => {
  const [selectedCity, setSelectedCity] = useState('');
  const queryClient = useQueryClient();

  const { data: dropdownData, isLoading: dropdownsLoading } = useQuery(
    'dropdowns',
    () => settingsAPI.getDropdowns(),
    {
      select: (data) => data.data.dropdownOptions
    }
  );

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      name: property.name,
      type: property.type,
      address: {
        street: property.address.street,
        city: property.address.city,
        island: property.address.island,
        postalCode: property.address.postalCode || '',
        country: property.address.country || 'Maldives'
      },
      buildingDetails: {
        numberOfFloors: property.buildingDetails?.numberOfFloors || 1,
        numberOfRentalUnits: property.buildingDetails?.numberOfRentalUnits || 1
      },
      details: {
        bedrooms: property.details?.bedrooms || '',
        bathrooms: property.details?.bathrooms || '',
        squareFeet: property.details?.squareFeet || '',
        yearBuilt: property.details?.yearBuilt || '',
        description: property.details?.description || ''
      },
      status: property.status || 'vacant'
    }
  });

  const updateMutation = useMutation(
    (propertyData) => propertiesAPI.update(property._id, propertyData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('properties');
        queryClient.invalidateQueries(['property', property._id]);
        toast.success('Property updated successfully!');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update property');
      },
    }
  );

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setValue('address.city', city);
    setValue('address.island', ''); // Reset island when city changes
  };

  const getIslandOptions = () => {
    if (!selectedCity || !dropdownData?.islands) return [];
    return dropdownData.islands[selectedCity] || [];
  };

  useEffect(() => {
    if (property.address.city) {
      setSelectedCity(property.address.city);
    }
  }, [property.address.city]);

  if (dropdownsLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Edit Property: {property.name}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Name *
                  </label>
                  <Input
                    {...register('name', { required: 'Property name is required' })}
                    error={errors.name?.message}
                    placeholder="Enter property name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type *
                  </label>
                  <Select
                    {...register('type', { required: 'Property type is required' })}
                    options={dropdownData?.propertyTypes?.map(type => ({
                      value: type,
                      label: type.charAt(0).toUpperCase() + type.slice(1)
                    }))}
                    error={errors.type?.message}
                    placeholder="Select property type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select
                    {...register('status')}
                    options={[
                      { value: 'vacant', label: 'Vacant' },
                      { value: 'occupied', label: 'Occupied' },
                      { value: 'maintenance', label: 'Maintenance' },
                      { value: 'renovation', label: 'Renovation' }
                    ]}
                    placeholder="Select status"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <Input
                    {...register('address.street', { required: 'Street address is required' })}
                    error={errors.address?.street?.message}
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <Select
                    {...register('address.city', { required: 'City is required' })}
                    options={dropdownData?.cities?.map(city => ({ value: city, label: city }))}
                    error={errors.address?.city?.message}
                    placeholder="Select city"
                    onChange={(e) => handleCityChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Island *
                  </label>
                  <Select
                    {...register('address.island', { required: 'Island is required' })}
                    options={getIslandOptions().map(island => ({ value: island, label: island }))}
                    error={errors.address?.island?.message}
                    placeholder="Select island"
                    disabled={!selectedCity}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <Input
                    {...register('address.postalCode')}
                    placeholder="Enter postal code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <Input
                    {...register('address.country')}
                    defaultValue="Maldives"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Building Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Building Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Floors *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    {...register('buildingDetails.numberOfFloors', { 
                      required: 'Number of floors is required',
                      min: { value: 1, message: 'Must be at least 1' }
                    })}
                    error={errors.buildingDetails?.numberOfFloors?.message}
                    placeholder="Enter number of floors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Rental Units *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    {...register('buildingDetails.numberOfRentalUnits', { 
                      required: 'Number of rental units is required',
                      min: { value: 1, message: 'Must be at least 1' }
                    })}
                    error={errors.buildingDetails?.numberOfRentalUnits?.message}
                    placeholder="Enter number of rental units"
                  />
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Property Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <Input
                    type="number"
                    min="0"
                    {...register('details.bedrooms', {
                      min: { value: 0, message: 'Cannot be negative' }
                    })}
                    error={errors.details?.bedrooms?.message}
                    placeholder="Number of bedrooms"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <Input
                    type="number"
                    min="0"
                    {...register('details.bathrooms', {
                      min: { value: 0, message: 'Cannot be negative' }
                    })}
                    error={errors.details?.bathrooms?.message}
                    placeholder="Number of bathrooms"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Square Feet
                  </label>
                  <Input
                    type="number"
                    min="0"
                    {...register('details.squareFeet', {
                      min: { value: 0, message: 'Cannot be negative' }
                    })}
                    error={errors.details?.squareFeet?.message}
                    placeholder="Square footage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Built
                  </label>
                  <Input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    {...register('details.yearBuilt', {
                      min: { value: 1800, message: 'Invalid year' },
                      max: { value: new Date().getFullYear(), message: 'Cannot be future year' }
                    })}
                    error={errors.details?.yearBuilt?.message}
                    placeholder="Year built"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('details.description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter property description"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isLoading}
                className="flex items-center gap-2"
              >
                {updateMutation.isLoading ? 'Updating...' : 'Update Property'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditPropertyModal;
