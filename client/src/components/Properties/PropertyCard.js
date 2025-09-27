import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Edit, Trash2, MoreVertical, AlertTriangle, Building2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { useAuth } from '../../contexts/AuthContext';
import { propertiesAPI, rentalUnitsAPI } from '../../services/api';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import toast from 'react-hot-toast';

const PropertyCard = ({ property, onEdit }) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const queryClient = useQueryClient();

  // Fetch rental units count for this property
  const { data: rentalUnitsData, isLoading: unitsLoading, error: unitsError } = useQuery(
    ['rental-units', property._id],
    () => rentalUnitsAPI.getByProperty(property._id),
    {
      enabled: !!property._id,
      select: (data) => {
        console.log(`🔍 PropertyCard Debug - Property: ${property.name} (${property._id})`);
        console.log(`📊 Raw API response:`, data);
        console.log(`📋 Rental units array:`, data?.data?.rentalUnits || []);
        console.log(`📈 Units count:`, data?.data?.rentalUnits?.length || 0);
        return data?.data?.rentalUnits || [];
      },
      onSuccess: (data) => {
        console.log(`✅ Successfully fetched units for ${property.name}:`, data);
      },
      onError: (error) => {
        console.error(`❌ Error fetching units for property ${property.name}:`, error);
      }
    }
  );

  const configuredUnits = rentalUnitsData?.length || 0;
  const expectedUnits = property.buildingDetails?.numberOfRentalUnits || 0;
  const hasMissingUnits = configuredUnits < expectedUnits;

  // Enhanced debug logging
  console.log(`🏠 PropertyCard Debug Summary:`);
  console.log(`   Property: ${property.name} (${property._id})`);
  console.log(`   Expected units: ${expectedUnits}`);
  console.log(`   Configured units: ${configuredUnits}`);
  console.log(`   Has missing units: ${hasMissingUnits}`);
  console.log(`   Loading: ${unitsLoading}`);
  console.log(`   Error:`, unitsError);

  const deleteMutation = useMutation(
    (id) => propertiesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('properties');
        queryClient.invalidateQueries(['rental-units', property._id]);
        toast.success('Property deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete property');
      },
    }
  );

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      deleteMutation.mutate(property._id);
    }
  };

  const handleRefreshUnits = () => {
    console.log('🔄 Refreshing units for property:', property.name);
    queryClient.invalidateQueries(['rental-units', property._id]);
    toast.success('Unit count refreshed!');
  };

  const isAdmin = user?.role === 'admin';
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

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate mb-2">
              {property.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-600 truncate">
                {property.address.street}, {property.address.city}
              </p>
            </div>
          </div>
          <div className="flex gap-1 ml-2">
            <Badge className={`${getTypeColor(property.type)} text-xs px-2 py-1`}>
              {property.type}
            </Badge>
            <Badge className={`${getStatusColor(property.status)} text-xs px-2 py-1`}>
              {property.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Building Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span>{property.buildingDetails?.numberOfFloors || 'N/A'} floors</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{configuredUnits}/{expectedUnits} units</span>
            {hasMissingUnits && (
              <AlertTriangle className="h-4 w-4 text-amber-500" title={`Missing ${expectedUnits - configuredUnits} units`} />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshUnits}
              className="ml-2 p-1 h-6 w-6"
              title="Refresh unit count"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            to={`/properties/${property._id}`}
            className="flex-1 btn btn-primary btn-sm"
          >
            View Details
          </Link>
          {isAdmin && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="px-2"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              {showActions && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      onEdit(property);
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    disabled={deleteMutation.isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
