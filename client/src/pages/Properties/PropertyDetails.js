import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, MapPin, Bed, Bath, Square, Calendar, Plus, Home, Users, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { propertiesAPI, rentalUnitsAPI } from '../../services/api';
import AddRentalUnitModal from '../../components/RentalUnits/AddRentalUnitModal';
import EditPropertyModal from '../../components/Properties/EditPropertyModal';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const deletePropertyMutation = useMutation(
    (id) => propertiesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('properties');
        toast.success('Property deleted successfully!');
        navigate('/properties');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete property');
      },
    }
  );

  const deleteUnitMutation = useMutation(
    (unitId) => rentalUnitsAPI.delete(unitId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['rental-units', id]);
        queryClient.invalidateQueries(['capacity-info', id]);
        queryClient.invalidateQueries('properties'); // Refresh property cards
        toast.success('Rental unit deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete rental unit');
      },
    }
  );

  const handleDeleteProperty = () => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      deletePropertyMutation.mutate(id);
    }
  };

  const handleDeleteUnit = (unitId, unitNumber) => {
    if (window.confirm(`Are you sure you want to delete Unit ${unitNumber}? This action cannot be undone and will remove all associated data.`)) {
      deleteUnitMutation.mutate(unitId);
    }
  };

  const isAdmin = user?.role === 'admin';
  
  const { data, isLoading, error } = useQuery(
    ['property', id],
    () => propertiesAPI.getById(id),
    {
      select: (data) => data.data.property
    }
  );

  const { data: rentalUnits, isLoading: unitsLoading } = useQuery(
    ['rental-units', id],
    () => rentalUnitsAPI.getByProperty(id),
    {
      select: (data) => data.data.rentalUnits || [],
      enabled: !!id
    }
  );

  const { data: capacityData } = useQuery(
    ['capacity-info', id],
    () => rentalUnitsAPI.getCapacityInfo(id),
    {
      enabled: !!id,
      select: (data) => data.data.capacityInfo
    }
  );

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading property details</p>
        <Link to="/properties">
          <Button className="mt-4">Back to Properties</Button>
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied':
        return 'bg-green-100 text-green-800';
      case 'vacant':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      case 'renovation':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'house':
        return 'bg-blue-100 text-blue-800';
      case 'apartment':
        return 'bg-purple-100 text-purple-800';
      case 'commercial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUnitStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      case 'renovation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/properties">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data?.name}</h1>
          <p className="text-sm text-gray-500">{data?.fullAddress}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge className={getTypeColor(data?.type)}>
            {data?.type}
          </Badge>
          <Badge className={getStatusColor(data?.status)}>
            {data?.status}
          </Badge>
          {isAdmin && (
            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteProperty}
                disabled={deletePropertyMutation.isLoading}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                {deletePropertyMutation.isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data?.details?.bedrooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Bedrooms</p>
                      <p className="font-semibold">{data.details.bedrooms}</p>
                    </div>
                  </div>
                )}
                {data?.details?.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Bathrooms</p>
                      <p className="font-semibold">{data.details.bathrooms}</p>
                    </div>
                  </div>
                )}
                {data?.details?.squareFeet && (
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Square Feet</p>
                      <p className="font-semibold">{data.details.squareFeet.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {data?.details?.yearBuilt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Year Built</p>
                      <p className="font-semibold">{data.details.yearBuilt}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {data?.details?.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Description</p>
                  <p className="text-gray-900">{data.details.description}</p>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Rental Units */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rental Units</CardTitle>
                  {capacityData && (
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        {capacityData.current.totalUnits}/{capacityData.property.maxUnits} units
                      </span>
                      {capacityData.property.bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          {capacityData.current.totalRooms}/{capacityData.property.bedrooms} rooms
                        </span>
                      )}
                      {capacityData.property.bathrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          {capacityData.current.totalToilets}/{capacityData.property.bathrooms} toilets
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => setShowAddUnit(true)}
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={capacityData && !capacityData.canAddMore.units}
                >
                  <Plus className="h-4 w-4" />
                  Add Unit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {unitsLoading ? (
                <LoadingSpinner size="md" />
              ) : rentalUnits && rentalUnits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rentalUnits.map((unit) => (
                    <div key={unit._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Unit {unit.unitNumber}</span>
                        </div>
                        <Badge className={getUnitStatusColor(unit.status)}>
                          {unit.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Floor:</span>
                          <span>{unit.floorNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Rooms:</span>
                          <span>{unit.unitDetails.numberOfRooms}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Toilets:</span>
                          <span>{unit.unitDetails.numberOfToilets}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Rent:</span>
                          <span className="font-medium">
                            {unit.financial.currency} {unit.financial.rentAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <Link to={`/rental-units/${unit._id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Users className="h-3 w-3" />
                              <span>{unit.assets?.length || 0} assets</span>
                            </div>
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUnit(unit._id, unit.unitNumber)}
                                disabled={deleteUnitMutation.isLoading}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No rental units added yet</p>
                  <Button onClick={() => setShowAddUnit(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Unit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{data?.address?.street}</p>
                  <p className="text-gray-500">
                    {data?.address?.city}, {data?.address?.island}
                  </p>
                  <p className="text-gray-500">{data?.address?.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          {data?.amenities && data.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data?.amenities?.map((amenity, index) => (
                    <Badge key={index} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Manager */}
          {data?.assignedManager && (
            <Card>
              <CardHeader>
                <CardTitle>Property Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {data?.assignedManager?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{data?.assignedManager?.name}</p>
                    <p className="text-sm text-gray-500">{data?.assignedManager?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

          {/* Add Rental Unit Modal */}
          {showAddUnit && (
            <AddRentalUnitModal
              propertyId={id}
              propertyName={data?.name}
              onClose={() => setShowAddUnit(false)}
            />
          )}

          {/* Edit Property Modal */}
          {showEditModal && data && (
            <EditPropertyModal
              property={data}
              onClose={() => setShowEditModal(false)}
            />
          )}
        </div>
      );
    };

    export default PropertyDetails;
