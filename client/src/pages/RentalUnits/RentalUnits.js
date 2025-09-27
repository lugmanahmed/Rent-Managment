import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Home, MapPin, Bed, Bath, Square, Users, DollarSign, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { rentalUnitsAPI, propertiesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const RentalUnits = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    property: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['rentalUnits', { search: searchTerm, ...filters }],
    () => rentalUnitsAPI.getAll({ 
      search: searchTerm || undefined,
      status: filters.status || undefined,
      property: filters.property || undefined
    }),
    {
      select: (data) => data.data
    }
  );

  const { data: propertiesData } = useQuery(
    'properties',
    () => propertiesAPI.getAll({ limit: 1000 }),
    {
      select: (data) => data.data.properties
    }
  );

  const deleteMutation = useMutation(
    (id) => rentalUnitsAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rentalUnits');
        toast.success('Rental unit deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete rental unit');
      }
    }
  );

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this rental unit?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', property: '' });
    setSearchTerm('');
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

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading rental units</p>
      </div>
    );
  }

  const { rentalUnits = [], pagination } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rental Units</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage rental units and their details.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/rental-units/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search rental units..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="label">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input"
                  >
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="renovation">Renovation</option>
                  </select>
                </div>
                <div>
                  <label className="label">Property</label>
                  <select
                    value={filters.property}
                    onChange={(e) => handleFilterChange('property', e.target.value)}
                    className="input"
                  >
                    <option value="">All Properties</option>
                    {propertiesData?.map((property) => (
                      <option key={property._id} value={property._id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rental Units Grid */}
      {rentalUnits.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rental units found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters.' 
                : 'Get started by adding your first rental unit.'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <div className="mt-6">
                <Link to="/rental-units/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rentalUnits.map((unit) => (
            <Card key={unit._id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Unit {unit.unitNumber}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(unit.tenant ? 'occupied' : 'available')}>
                      {unit.tenant ? 'Occupied' : 'Available'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(unit._id)}
                      disabled={deleteMutation.isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {unit.property && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>{unit.property.name}</span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Unit Specs */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4 text-gray-400" />
                      <span>{unit.unitDetails.numberOfRooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4 text-gray-400" />
                      <span>{unit.unitDetails.numberOfToilets}</span>
                    </div>
                    {unit.unitDetails.squareFeet && (
                      <div className="flex items-center gap-1">
                        <Square className="h-4 w-4 text-gray-400" />
                        <span>{unit.unitDetails.squareFeet}ft²</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">Floor {unit.floorNumber}</span>
                </div>

                {/* Rent */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-gray-900">
                      {unit.financial.currency} {unit.financial.rentAmount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">/month</span>
                </div>

                {/* Tenant Info */}
                {unit.tenant && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {unit.tenant.firstName} {unit.tenant.lastName}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{unit.tenant.email}</p>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Link
                  to={`/rental-units/${unit._id}`}
                  className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Details
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((pagination.current - 1) * 10) + 1} to{' '}
            {Math.min(pagination.current * 10, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={pagination.current === 1}
              onClick={() => {/* Handle previous page */}}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pagination.current === pagination.pages}
              onClick={() => {/* Handle next page */}}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalUnits;
