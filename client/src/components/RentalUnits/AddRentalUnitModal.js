import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { X, Home, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { rentalUnitsAPI } from '../../services/api';
import { CURRENCIES } from '../../utils/currency';
import toast from 'react-hot-toast';

const AddRentalUnitModal = ({ propertyId, propertyName, onClose }) => {
  const [formData, setFormData] = useState({
    unitNumber: '',
    floorNumber: 1,
    numberOfRooms: 1,
    numberOfToilets: 1,
    rentAmount: '',
    depositAmount: '',
    currency: 'MVR',
    description: '',
    utilities: {
      included: false,
      details: ''
    }
  });

  // Use currency utility for rates and symbols

  const queryClient = useQueryClient();

  // Fetch capacity information
  const { data: capacityData, isLoading: capacityLoading } = useQuery(
    ['capacity-info', propertyId],
    () => rentalUnitsAPI.getCapacityInfo(propertyId),
    {
      enabled: !!propertyId,
      select: (data) => data.data.capacityInfo
    }
  );

  const createUnitMutation = useMutation(
    (unitData) => rentalUnitsAPI.create(unitData),
    {
      onSuccess: () => {
        toast.success('Rental unit created successfully!');
        queryClient.invalidateQueries(['rental-units', propertyId]);
        queryClient.invalidateQueries(['capacity-info', propertyId]);
        queryClient.invalidateQueries('properties'); // Refresh property cards
        onClose();
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to create rental unit';
        toast.error(errorMessage);
        console.error('Create unit error:', error.response?.data);
      }
    }
  );

  // Check if adding this unit would exceed capacity
  const wouldExceedCapacity = () => {
    if (!capacityData) return false;
    
    const newTotalRooms = capacityData.current.totalRooms + parseInt(formData.numberOfRooms);
    const newTotalToilets = capacityData.current.totalToilets + parseInt(formData.numberOfToilets);
    const newTotalUnits = capacityData.current.totalUnits + 1;
    
    return (
      !capacityData.canAddMore.units ||
      (capacityData.property.bedrooms > 0 && newTotalRooms > capacityData.property.bedrooms) ||
      (capacityData.property.bathrooms > 0 && newTotalToilets > capacityData.property.bathrooms)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check capacity before submitting
    if (wouldExceedCapacity()) {
      toast.error('Cannot add unit: Would exceed property capacity limits');
      return;
    }
    
    const unitData = {
      property: propertyId,
      unitNumber: formData.unitNumber,
      floorNumber: parseInt(formData.floorNumber),
      unitDetails: {
        numberOfRooms: parseInt(formData.numberOfRooms),
        numberOfToilets: parseInt(formData.numberOfToilets),
        description: formData.description
      },
      financial: {
        rentAmount: parseFloat(formData.rentAmount),
        depositAmount: parseFloat(formData.depositAmount),
        currency: formData.currency,
        utilities: formData.utilities
      }
    };

    createUnitMutation.mutate(unitData);
  };

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
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Add Rental Unit to {propertyName}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Capacity Information */}
          {capacityData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Home className="h-4 w-4" />
                Property Capacity Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {capacityData.current.totalUnits}/{capacityData.property.maxUnits}
                  </div>
                  <div className="text-sm text-gray-600">Units</div>
                  <Badge className={capacityData.canAddMore.units ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {capacityData.canAddMore.units ? 'Can Add More' : 'At Capacity'}
                  </Badge>
                </div>
                {capacityData.property.bedrooms > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {capacityData.current.totalRooms}/{capacityData.property.bedrooms}
                    </div>
                    <div className="text-sm text-gray-600">Rooms</div>
                    <Badge className={capacityData.canAddMore.rooms ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {capacityData.canAddMore.rooms ? 'Can Add More' : 'At Capacity'}
                    </Badge>
                  </div>
                )}
                {capacityData.property.bathrooms > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {capacityData.current.totalToilets}/{capacityData.property.bathrooms}
                    </div>
                    <div className="text-sm text-gray-600">Toilets</div>
                    <Badge className={capacityData.canAddMore.toilets ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {capacityData.canAddMore.toilets ? 'Can Add More' : 'At Capacity'}
                    </Badge>
                  </div>
                )}
              </div>
              {wouldExceedCapacity() && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Cannot add unit: Would exceed capacity limits</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Number *
                  </label>
                  <Input
                    type="text"
                    value={formData.unitNumber}
                    onChange={(e) => handleInputChange('unitNumber', e.target.value)}
                    placeholder="e.g., A101, 2B"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor Number *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.floorNumber}
                    onChange={(e) => handleInputChange('floorNumber', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Rooms *
                  </label>
                  <select
                    value={formData.numberOfRooms}
                    onChange={(e) => handleInputChange('numberOfRooms', parseInt(e.target.value))}
                    className="input w-full"
                  >
                    <option value="">Select number of rooms</option>
                    <option value="1">1 room</option>
                    <option value="2">2 rooms</option>
                    <option value="3">3 rooms</option>
                    <option value="4">4 rooms</option>
                    <option value="5">5 rooms</option>
                    <option value="6">6 rooms</option>
                    <option value="7">7 rooms</option>
                    <option value="8">8 rooms</option>
                    <option value="9">9 rooms</option>
                    <option value="10">10 rooms</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Toilets *
                  </label>
                  <select
                    value={formData.numberOfToilets}
                    onChange={(e) => handleInputChange('numberOfToilets', parseInt(e.target.value))}
                    className="input w-full"
                  >
                    <option value="">Select number of toilets</option>
                    <option value="1">1 toilet</option>
                    <option value="2">2 toilets</option>
                    <option value="3">3 toilets</option>
                    <option value="4">4 toilets</option>
                    <option value="5">5 toilets</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the unit..."
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
              
              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(CURRENCIES).map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      onClick={() => handleInputChange('currency', currency.code)}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        formData.currency === currency.code
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-xs text-gray-500">{currency.symbol}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                      {CURRENCIES[formData.currency].symbol}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.rentAmount}
                      onChange={(e) => handleInputChange('rentAmount', e.target.value)}
                      placeholder="0.00"
                      className="pl-12"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Security Deposit *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                      {CURRENCIES[formData.currency].symbol}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.depositAmount}
                      onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                      placeholder="0.00"
                      className="pl-12"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.utilities.included}
                    onChange={(e) => handleInputChange('utilities.included', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Utilities included in rent
                  </span>
                </label>
                {formData.utilities.included && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Utilities Details
                    </label>
                    <Input
                      type="text"
                      value={formData.utilities.details}
                      onChange={(e) => handleInputChange('utilities.details', e.target.value)}
                      placeholder="e.g., Water, electricity, internet"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createUnitMutation.isLoading || wouldExceedCapacity()}
                className="flex items-center gap-2"
              >
                {createUnitMutation.isLoading ? 'Creating...' : 'Create Unit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddRentalUnitModal;
