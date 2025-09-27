import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import FormSection from '../../components/UI/FormSection';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { propertiesAPI, settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PropertyRegistration = () => {
  const [selectedCity, setSelectedCity] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: dropdownData, isLoading: dropdownsLoading } = useQuery(
    'dropdowns',
    () => settingsAPI.getDropdowns(),
    {
      select: (data) => data.data.dropdownOptions
    }
  );

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      type: 'apartment',
      address: {
        city: '',
        island: '',
        country: 'Maldives'
      },
      buildingDetails: {
        numberOfFloors: 1,
        numberOfRentalUnits: 1
      },
    }
  });

  const createMutation = useMutation(
    (propertyData) => propertiesAPI.create(propertyData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('properties');
        toast.success('Property registered successfully!');
        navigate('/properties');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create property');
      }
    }
  );

  const onSubmit = (data) => {
    createMutation.mutate(data);
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

  if (dropdownsLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Property Registration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Register a new rental property with complete details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <FormSection title="Basic Information" collapsible={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Property Name *</label>
                  <Input
                    {...register('name', { required: 'Property name is required' })}
                    error={errors.name?.message}
                    placeholder="Enter property name"
                  />
                </div>
                <div>
                  <label className="label">Property Type *</label>
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
              </div>
            </FormSection>

            {/* Address Information */}
            <FormSection title="Address Information" collapsible={true} defaultExpanded={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Street Address *</label>
                  <Input
                    {...register('address.street', { required: 'Street address is required' })}
                    error={errors.address?.street?.message}
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <label className="label">City *</label>
                  <Select
                    {...register('address.city', { required: 'City is required' })}
                    options={dropdownData?.cities?.map(city => ({ value: city, label: city }))}
                    error={errors.address?.city?.message}
                    placeholder="Select city"
                    onChange={(e) => handleCityChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Island *</label>
                  <Select
                    {...register('address.island', { required: 'Island is required' })}
                    options={getIslandOptions().map(island => ({ value: island, label: island }))}
                    error={errors.address?.island?.message}
                    placeholder="Select island"
                    disabled={!selectedCity}
                  />
                </div>
                <div>
                  <label className="label">Postal Code</label>
                  <Input
                    {...register('address.postalCode')}
                    placeholder="Enter postal code"
                  />
                </div>
                <div>
                  <label className="label">Country</label>
                  <Input
                    {...register('address.country')}
                    defaultValue="Maldives"
                    disabled
                  />
                </div>
              </div>
            </FormSection>

            {/* Building Details */}
            <FormSection title="Building Details" collapsible={true} defaultExpanded={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Number of Floors *</label>
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
                  <label className="label">Number of Rental Units *</label>
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
            </FormSection>

            {/* Property Details */}
            <FormSection title="Property Details" collapsible={true} defaultExpanded={false}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Bedrooms</label>
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
                  <label className="label">Bathrooms</label>
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
                  <label className="label">Square Feet</label>
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
                  <label className="label">Year Built</label>
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
                <label className="label">Description</label>
                <textarea
                  {...register('details.description')}
                  className="input min-h-[100px]"
                  placeholder="Enter property description"
                />
              </div>
            </FormSection>


            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/properties')}
                disabled={createMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createMutation.isLoading}
                disabled={createMutation.isLoading}
              >
                Register Property
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyRegistration;
