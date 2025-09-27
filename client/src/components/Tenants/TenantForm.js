import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import LoadingSpinner from '../UI/LoadingSpinner';
import { tenantsAPI, rentalUnitsAPI, propertiesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TenantForm = ({ tenant, onClose }) => {
  console.log('🔧 TenantForm component rendered with tenant:', tenant);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idType: 'national_id',
    idNumber: '',
    dateOfBirth: '',
    nationality: 'Maldives',
    rentalUnits: [],
    leaseInfo: {
      startDate: '',
      endDate: '',
      monthlyRent: '',
      currency: 'MVR',
      securityDeposit: '',
      agreementAttachment: null
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    }
  });

  const queryClient = useQueryClient();

  // Populate form when editing existing tenant
  useEffect(() => {
    if (tenant) {
      console.log('🔄 Populating form with tenant data:', tenant);
      setFormData({
        firstName: tenant.firstName || '',
        lastName: tenant.lastName || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        idType: tenant.idType || 'national_id',
        idNumber: tenant.idNumber || '',
        dateOfBirth: tenant.dateOfBirth || '',
        nationality: tenant.nationality || 'Maldives',
        rentalUnits: tenant.rentalUnits || [],
        leaseInfo: {
          startDate: tenant.leaseInfo?.startDate || '',
          endDate: tenant.leaseInfo?.endDate || '',
          monthlyRent: tenant.leaseInfo?.monthlyRent || '',
          currency: tenant.leaseInfo?.currency || 'MVR',
          securityDeposit: tenant.leaseInfo?.securityDeposit || '',
          agreementAttachment: tenant.leaseInfo?.agreementAttachment || null
        },
        emergencyContact: {
          name: tenant.emergencyContact?.name || '',
          relationship: tenant.emergencyContact?.relationship || '',
          phone: tenant.emergencyContact?.phone || '',
          email: tenant.emergencyContact?.email || ''
        }
      });
    }
  }, [tenant]);

  // Fetch rental units (available + tenant's assigned units if editing)
  const { data: rentalUnitsData, isLoading: unitsLoading } = useQuery(
    ['rental-units', tenant?._id],
    async () => {
      if (tenant) {
        // When editing, fetch both available units and tenant's assigned units
        const [availableUnits, assignedUnits] = await Promise.all([
          rentalUnitsAPI.getAll({ status: 'available' }),
          rentalUnitsAPI.getAll({ tenant: tenant._id })
        ]);
        
        const available = availableUnits.data.rentalUnits || [];
        const assigned = assignedUnits.data.rentalUnits || [];
        
        console.log('🔍 Available units:', available.length);
        console.log('🔍 Assigned units:', assigned.length);
        
        return {
          available: available,
          assigned: assigned,
          all: [...assigned, ...available] // Assigned units first, then available
        };
      } else {
        // When creating, only fetch available units
        const response = await rentalUnitsAPI.getAll({ status: 'available' });
        const units = response.data.rentalUnits || [];
        console.log(`📊 Found ${units.length} available units for new tenant`);
        return {
          available: units,
          assigned: [],
          all: units
        };
      }
    },
    {
      select: (data) => {
        console.log('🔍 Rental units data:', data);
        return data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: false
    }
  );

  // Fetch properties for filtering
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery(
    'properties',
    () => propertiesAPI.getAll({ limit: 1000 }),
    {
      select: (data) => data.data.properties || [],
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: false
    }
  );

  const handleDebugUnits = async () => {
    try {
      console.log('🔍 Debugging all rental units...');
      const response = await fetch('http://localhost:5000/api/rental-units/debug/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      console.log('📊 Debug units response:', data);
      alert(`Found ${data.totalUnits} total units. Check console for details.`);
    } catch (error) {
      console.error('❌ Debug units error:', error);
      alert('Failed to debug units. Check console for error.');
    }
  };

  const createTenantMutation = useMutation(
    (tenantData) => {
      if (tenant) {
        // Update existing tenant
        return tenantsAPI.update(tenant._id, tenantData);
      } else {
        // Create new tenant
        return tenantsAPI.create(tenantData);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
        if (tenant) {
          queryClient.invalidateQueries(['tenant', tenant._id]);
          toast.success('Tenant updated successfully!');
        } else {
          toast.success('Tenant created successfully!');
        }
        onClose();
      },
      onError: (error) => {
        const action = tenant ? 'update' : 'create';
        toast.error(error.response?.data?.message || `Failed to ${action} tenant`);
      },
    }
  );

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleRentalUnitToggle = (unitId) => {
    setFormData(prev => ({
      ...prev,
      rentalUnits: prev.rentalUnits.includes(unitId)
        ? prev.rentalUnits.filter(id => id !== unitId)
        : [...prev.rentalUnits, unitId]
    }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        leaseInfo: {
          ...prev.leaseInfo,
          agreementAttachment: {
            fileName: file.name,
            filePath: URL.createObjectURL(file) // In real app, upload to server
          }
        }
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.rentalUnits.length === 0) {
      toast.error('Please select at least one rental unit');
      return;
    }

    createTenantMutation.mutate(formData);
  };

  // Get all units (assigned + available) for the form
  const allUnits = rentalUnitsData?.all || [];
  const assignedUnits = rentalUnitsData?.assigned || [];
  const availableUnits = rentalUnitsData?.available || [];
  
  console.log('📊 Form units - Total:', allUnits.length, 'Assigned:', assignedUnits.length, 'Available:', availableUnits.length);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {tenant ? 'Edit Tenant' : 'Add New Tenant'}
            </h1>
            <p className="text-sm text-gray-500">
              {tenant ? 'Update tenant information' : 'Create a new tenant record'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Type *
                </label>
                <Select
                  value={formData.idType}
                  onChange={(e) => handleInputChange('idType', e.target.value)}
                  options={[
                    { value: 'national_id', label: 'National ID' },
                    { value: 'passport', label: 'Passport' }
                  ]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number *
                </label>
                <Input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  placeholder="Enter ID number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality
                </label>
                <Input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Enter nationality"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rental Units Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Rental Units *</CardTitle>
            <p className="text-sm text-gray-500">
              {tenant ? 'Modify the units this tenant rents' : 'Select the units this tenant will rent'}
            </p>
            {tenant && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 Currently assigned units are shown first, then available units
              </div>
            )}
          </CardHeader>
          <CardContent>
            {unitsLoading ? (
              <LoadingSpinner size="md" />
            ) : allUnits.length > 0 ? (
              <div className="space-y-4">
                {assignedUnits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Currently Assigned Units</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {assignedUnits.map((unit) => (
                        <div
                          key={unit._id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            formData.rentalUnits.includes(unit._id)
                              ? 'border-green-500 bg-green-50'
                              : 'border-green-300 hover:border-green-400'
                          }`}
                          onClick={() => handleRentalUnitToggle(unit._id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">Unit {unit.unitNumber}</h3>
                              <p className="text-sm text-gray-600">
                                Floor {unit.floorNumber} • {unit.unitDetails.numberOfRooms} rooms
                              </p>
                              <p className="text-sm text-gray-500">
                                {unit.property?.name}
                              </p>
                              <span className="text-xs text-green-600 font-medium">Currently Assigned</span>
                            </div>
                            <div className={`w-4 h-4 rounded border-2 ${
                              formData.rentalUnits.includes(unit._id)
                                ? 'bg-green-500 border-green-500'
                                : 'border-green-300'
                            }`}>
                              {formData.rentalUnits.includes(unit._id) && (
                                <div className="w-full h-full bg-white rounded-sm scale-50"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {availableUnits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Available Units</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableUnits.map((unit) => (
                        <div
                          key={unit._id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            formData.rentalUnits.includes(unit._id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => handleRentalUnitToggle(unit._id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">Unit {unit.unitNumber}</h3>
                              <p className="text-sm text-gray-600">
                                Floor {unit.floorNumber} • {unit.unitDetails.numberOfRooms} rooms
                              </p>
                              <p className="text-sm text-gray-500">
                                {unit.property?.name}
                              </p>
                              <span className="text-xs text-blue-600 font-medium">Available</span>
                            </div>
                            <div className={`w-4 h-4 rounded border-2 ${
                              formData.rentalUnits.includes(unit._id)
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {formData.rentalUnits.includes(unit._id) && (
                                <div className="w-full h-full bg-white rounded-sm scale-50"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No rental units found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lease Information */}
        <Card>
          <CardHeader>
            <CardTitle>Lease Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Start Date *
                </label>
                <Input
                  type="date"
                  value={formData.leaseInfo.startDate}
                  onChange={(e) => handleInputChange('leaseInfo.startDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease End Date *
                </label>
                <Input
                  type="date"
                  value={formData.leaseInfo.endDate}
                  onChange={(e) => handleInputChange('leaseInfo.endDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent *
                </label>
                <div className="flex gap-2">
                  <Select
                    value={formData.leaseInfo.currency}
                    onChange={(e) => handleInputChange('leaseInfo.currency', e.target.value)}
                    options={[
                      { value: 'MVR', label: 'MVR' },
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' }
                    ]}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.leaseInfo.monthlyRent}
                    onChange={(e) => handleInputChange('leaseInfo.monthlyRent', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Deposit
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.leaseInfo.securityDeposit}
                  onChange={(e) => handleInputChange('leaseInfo.securityDeposit', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Agreement Attachment
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="agreement-upload"
                  />
                  <label
                    htmlFor="agreement-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Agreement
                  </label>
                  {formData.leaseInfo.agreementAttachment && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{formData.leaseInfo.agreementAttachment.fileName}</span>
                      <button
                        type="button"
                        onClick={() => handleInputChange('leaseInfo.agreementAttachment', null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <Input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  placeholder="Enter contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <Input
                  type="text"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <Input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <Input
                  type="email"
                  value={formData.emergencyContact.email}
                  onChange={(e) => handleInputChange('emergencyContact.email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleDebugUnits}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            🔍 Debug All Units
          </Button>
          
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTenantMutation.isLoading}
              className="flex items-center gap-2"
            >
              {createTenantMutation.isLoading 
                ? (tenant ? 'Updating...' : 'Creating...') 
                : (tenant ? 'Update Tenant' : 'Create Tenant')
              }
            </Button>
          </div>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};

export default TenantForm;