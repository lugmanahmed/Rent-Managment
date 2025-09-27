import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import PropertyCard from '../../components/Properties/PropertyCard';
import EditPropertyModal from '../../components/Properties/EditPropertyModal';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { propertiesAPI, rentalUnitsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Properties = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['properties', { search: searchTerm, ...filters }],
    () => propertiesAPI.getAll({ 
      search: searchTerm || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined
    }),
    {
      select: (data) => data.data
    }
  );

  const deleteMutation = useMutation(
    (id) => propertiesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('properties');
        toast.success('Property deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete property');
      }
    }
  );

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDebugUnits = async () => {
    try {
      console.log('🔍 Debugging all rental units...');
      const response = await rentalUnitsAPI.debugAll();
      console.log('📊 Debug response:', response.data);
      alert(`Found ${response.data.totalUnits} total rental units. Check console for details.`);
    } catch (error) {
      console.error('❌ Debug error:', error);
      alert('Failed to debug units. Check console for error.');
    }
  };

  const clearFilters = () => {
    setFilters({ type: '', status: '' });
    setSearchTerm('');
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading properties</p>
      </div>
    );
  }

  const { properties = [], pagination } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your rental properties and their details.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            onClick={handleDebugUnits}
            variant="outline"
            className="border-orange-600 text-orange-600 hover:bg-orange-50"
          >
            🔍 Debug Units
          </Button>
          <Link to="/properties/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
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
                    placeholder="Search properties..."
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
                  <label className="label">Property Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="input"
                  >
                    <option value="">All Types</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input"
                  >
                    <option value="">All Statuses</option>
                    <option value="occupied">Occupied</option>
                    <option value="vacant">Vacant</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="renovation">Renovation</option>
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

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters.' 
                : 'Get started by adding your first property.'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <div className="mt-6">
                <Link to="/properties/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard 
              key={property._id} 
              property={property} 
              onEdit={setEditingProperty}
            />
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

      {/* Edit Property Modal */}
      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
        />
      )}
    </div>
  );
};

export default Properties;
