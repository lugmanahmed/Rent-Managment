import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, MapPin, Bed, Bath, Square, DollarSign, Users, Edit, Save, X, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { rentalUnitsAPI, propertiesAPI, settingsAPI } from '../../services/api';
import AssetManager from '../../components/RentalUnits/AssetManager';
import toast from 'react-hot-toast';

const RentalUnitDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(!id);

  const { data: dropdownData, isLoading: dropdownsLoading } = useQuery(
    'dropdowns',
    () => settingsAPI.getDropdowns(),
    {
      select: (data) => data.data.dropdownOptions
    }
  );

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery(
    'properties',
    () => propertiesAPI.getAll({ limit: 1000 }),
    {
      select: (data) => data.data.properties
    }
  );

  const { data: unitData, isLoading: unitLoading, refetch } = useQuery(
    ['rentalUnit', id],
    () => rentalUnitsAPI.getById(id),
    {
      enabled: !!id,
      select: (data) => data.data.rentalUnit
    }
  );

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: unitData || {
      unitNumber: '',
      floorNumber: 1,
      unitDetails: {
        numberOfRooms: 1,
        numberOfToilets: 1,
        squareFeet: ''
      },
      financial: {
        rentAmount: '',
        depositAmount: '',
        currency: 'MVR'
      },
      assets: [],
      status: 'available'
    }
  });

  // Reset form when unitData is loaded
  useEffect(() => {
    if (unitData) {
      console.log('🔄 Resetting form with unit data:', unitData);
      reset({
        property: unitData.property?._id || unitData.property || '',
        unitNumber: unitData.unitNumber || '',
        floorNumber: unitData.floorNumber || 1,
        unitDetails: {
          numberOfRooms: unitData.unitDetails?.numberOfRooms || 1,
          numberOfToilets: unitData.unitDetails?.numberOfToilets || 1,
          squareFeet: unitData.unitDetails?.squareFeet || '',
          description: unitData.unitDetails?.description || ''
        },
        financial: {
          rentAmount: unitData.financial?.rentAmount || '',
          depositAmount: unitData.financial?.depositAmount || '',
          currency: unitData.financial?.currency || 'MVR',
          utilities: unitData.financial?.utilities || { included: false, details: '' }
        },
        status: unitData.status || 'available'
      });
    }
  }, [unitData, reset]);

  const updateMutation = useMutation(
    (data) => rentalUnitsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['rentalUnit', id]);
        toast.success('Rental unit updated successfully!');
        setIsEditing(false);
      },
      onError: (error) => {
        console.error('❌ Update unit error:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error message:', error.message);
        
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update rental unit';
        toast.error(errorMessage);
      },
    }
  );

  const onSubmit = (data) => {
    console.log('📤 Raw form data:', data);
    
    // Prepare data for submission - ensure numeric values are properly formatted
    const submitData = {
      ...data,
      floorNumber: parseInt(data.floorNumber),
      unitDetails: {
        ...data.unitDetails,
        numberOfRooms: parseInt(data.unitDetails.numberOfRooms),
        numberOfToilets: parseInt(data.unitDetails.numberOfToilets),
        squareFeet: data.unitDetails.squareFeet ? parseFloat(data.unitDetails.squareFeet) : undefined
      },
      financial: {
        ...data.financial,
        rentAmount: parseFloat(data.financial.rentAmount),
        depositAmount: parseFloat(data.financial.depositAmount)
      }
    };
    
    console.log('📤 Processed submit data:', submitData);
    console.log('📤 Unit ID:', id);
    updateMutation.mutate(submitData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'renovation':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (dropdownsLoading || propertiesLoading || unitLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }


  // If it's a new unit, show the form
  if (!id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/rental-units')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Rental Unit</h1>
            <p className="text-sm text-gray-500">Create a new rental unit with complete details</p>
          </div>
        </div>
        {/* Form content will be added here */}
      </div>
    );
  }

  // If it's an existing unit, show view/edit mode
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/rental-units')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Unit {unitData?.unitNumber}
            </h1>
            <Badge className={getStatusColor(unitData?.tenant ? 'occupied' : 'available')}>
              {unitData?.tenant ? 'Occupied' : 'Available'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">Rental Unit Details</p>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
            <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Unit
            </Button>
          </div>
        )}
      </div>

      {/* View Mode */}
      {!isEditing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Property</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{unitData?.property?.name}</p>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{unitData?.property?.address?.street}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Unit Number</label>
                    <p className="text-gray-900 font-semibold">{unitData?.unitNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Floor</label>
                    <p className="text-gray-900">Floor {unitData?.floorNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge className={getStatusColor(unitData?.tenant ? 'occupied' : 'available')}>
                      {unitData?.tenant ? 'Occupied' : 'Available'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unit Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Square className="h-5 w-5 text-green-600" />
                  Unit Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Bed className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Rooms</p>
                      <p className="text-lg font-semibold text-gray-900">{unitData?.unitDetails?.numberOfRooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bath className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Toilets</p>
                      <p className="text-lg font-semibold text-gray-900">{unitData?.unitDetails?.numberOfToilets}</p>
                    </div>
                  </div>
                  {unitData?.unitDetails?.squareFeet && (
                    <div className="flex items-center gap-3">
                      <Square className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Square Feet</p>
                        <p className="text-lg font-semibold text-gray-900">{unitData.unitDetails.squareFeet.toLocaleString()} ft²</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Monthly Rent</label>
                    <p className="text-2xl font-bold text-gray-900">
                      {unitData?.financial?.currency} {unitData?.financial?.rentAmount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Security Deposit</label>
                    <p className="text-xl font-semibold text-gray-900">
                      {unitData?.financial?.currency} {unitData?.financial?.depositAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assets Management */}
            {unitData && (
              <AssetManager 
                rentalUnitId={unitData._id} 
                currentAssets={unitData.assets || []} 
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Tenant */}
            {unitData?.tenant && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Current Tenant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {unitData.tenant.firstName} {unitData.tenant.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{unitData.tenant.phone}</p>
                      <p className="text-sm text-gray-500">{unitData.tenant.email}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        if (unitData.tenant._id) {
                          navigate(`/tenants/${unitData.tenant._id}`);
                        } else {
                          toast.error('Tenant ID not found');
                        }
                      }}
                    >
                      View Tenant Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!unitData?.tenant && (
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    onClick={() => navigate('/tenants/new')}
                  >
                    <Users className="h-4 w-4" />
                    Assign Tenant
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Edit Unit Information
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                  <Select
                    {...register('property', { required: 'Property is required' })}
                    options={propertiesData?.map(property => ({
                      value: property._id,
                      label: `${property.name} - ${property.address.street}`
                    }))}
                    error={errors.property?.message}
                    placeholder="Select property"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                  <Input
                    {...register('unitNumber', { required: 'Unit number is required' })}
                    error={errors.unitNumber?.message}
                    placeholder="e.g., A101, 2B"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number *</label>
                  <Input
                    type="number"
                    min="1"
                    {...register('floorNumber', { 
                      required: 'Floor number is required',
                      min: { value: 1, message: 'Floor must be at least 1' }
                    })}
                    error={errors.floorNumber?.message}
                    placeholder="Floor number"
                  />
                </div>
              </div>

              {/* Unit Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rooms *</label>
                  <Select
                    {...register('unitDetails.numberOfRooms', { required: 'Number of rooms is required' })}
                    options={dropdownData?.numberOfRooms?.map(num => ({ value: num, label: `${num} room${num > 1 ? 's' : ''}` })) || [
                      { value: 1, label: '1 room' },
                      { value: 2, label: '2 rooms' },
                      { value: 3, label: '3 rooms' },
                      { value: 4, label: '4 rooms' },
                      { value: 5, label: '5 rooms' },
                      { value: 6, label: '6 rooms' },
                      { value: 7, label: '7 rooms' },
                      { value: 8, label: '8 rooms' },
                      { value: 9, label: '9 rooms' },
                      { value: 10, label: '10 rooms' }
                    ]}
                    error={errors.unitDetails?.numberOfRooms?.message}
                    placeholder="Select number of rooms"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Toilets *</label>
                  <Select
                    {...register('unitDetails.numberOfToilets', { required: 'Number of toilets is required' })}
                    options={dropdownData?.numberOfToilets?.map(num => ({ value: num, label: `${num} toilet${num > 1 ? 's' : ''}` })) || [
                      { value: 1, label: '1 toilet' },
                      { value: 2, label: '2 toilets' },
                      { value: 3, label: '3 toilets' },
                      { value: 4, label: '4 toilets' },
                      { value: 5, label: '5 toilets' }
                    ]}
                    error={errors.unitDetails?.numberOfToilets?.message}
                    placeholder="Select number of toilets"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Square Feet</label>
                  <Input
                    type="number"
                    min="0"
                    {...register('unitDetails.squareFeet', { 
                      min: { value: 0, message: 'Square feet must be positive' }
                    })}
                    error={errors.unitDetails?.squareFeet?.message}
                    placeholder="Square footage"
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount *</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('financial.rentAmount', { 
                      required: 'Rent amount is required',
                      min: { value: 0, message: 'Rent must be positive' }
                    })}
                    error={errors.financial?.rentAmount?.message}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount *</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('financial.depositAmount', { 
                      required: 'Deposit amount is required',
                      min: { value: 0, message: 'Deposit must be positive' }
                    })}
                    error={errors.financial?.depositAmount?.message}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                  <Select
                    {...register('financial.currency', { required: 'Currency is required' })}
                    options={dropdownData?.rentalCurrency?.map(curr => ({ value: curr, label: curr })) || [
                      { value: 'MVR', label: 'MVR' },
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' }
                    ]}
                    error={errors.financial?.currency?.message}
                    placeholder="Select currency"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={updateMutation.isLoading}
                  disabled={updateMutation.isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Update Unit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RentalUnitDetails;