import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Plus, Search, Filter, Users, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { tenantsAPI } from '../../services/api';

const Tenants = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    property: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const handleFixTenantStatus = async () => {
    try {
      console.log('🔧 Fixing tenant statuses...');
      const response = await fetch('http://localhost:5000/api/tenants/fix-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('📊 Fix status response:', data);
      alert(`Fixed ${data.updatedCount} tenants from pending to active status!`);
      // Refresh the tenants list
      window.location.reload();
    } catch (error) {
      console.error('❌ Fix tenant status error:', error);
      alert('Failed to fix tenant statuses. Check console for error.');
    }
  };

  const { data, isLoading, error } = useQuery(
    ['tenants', filters],
    () => tenantsAPI.getAll(filters),
    {
      select: (data) => {
        console.log('🔍 Tenants data:', data.data);
        // Log rental units data for debugging
        data.data?.tenants?.forEach(tenant => {
          if (tenant.rentalUnits?.length > 0) {
            console.log(`📊 Tenant ${tenant.firstName} ${tenant.lastName} rental units:`, 
              tenant.rentalUnits.map(unit => ({
                unitNumber: unit.unitNumber,
                rentAmount: unit.financial?.rentAmount
              }))
            );
          }
        });
        return data.data;
      }
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading tenants</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500">Manage tenant information and lease details</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleFixTenantStatus}
            className="text-orange-600 border-orange-600 hover:bg-orange-50"
          >
            🔧 Fix Tenant Status
          </Button>
          <Link to="/tenants/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Tenant
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tenants..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'terminated', label: 'Terminated' },
                  { value: 'pending', label: 'Pending' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <Select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                options={[
                  { value: 'createdAt', label: 'Date Created' },
                  { value: 'lastName', label: 'Last Name' },
                  { value: 'firstName', label: 'First Name' },
                  { value: 'leaseInfo.startDate', label: 'Lease Start' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <Select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                options={[
                  { value: 'desc', label: 'Descending' },
                  { value: 'asc', label: 'Ascending' }
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tenants ({data?.pagination?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.tenants && data.tenants.length > 0 ? (
            <div className="space-y-4">
              {data.tenants.map((tenant) => (
                <div key={tenant._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {tenant.firstName} {tenant.lastName}
                        </h3>
                        <Badge className={getStatusColor(tenant.status)}>
                          {tenant.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{tenant.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>
                            {tenant.rentalUnits && tenant.rentalUnits.length > 0 
                              ? tenant.rentalUnits[0].property?.name 
                              : 'No units assigned'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Lease: {formatDate(tenant.leaseInfo.startDate)} - {formatDate(tenant.leaseInfo.endDate)}</span>
                        </div>
                      </div>

                      {tenant.rentalUnits && tenant.rentalUnits.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          Units: {tenant.rentalUnits.map(unit => 
                            `Unit ${unit.unitNumber} (Floor ${unit.floorNumber})`
                          ).join(', ')}
                        </div>
                      )}

                      <div className="mt-2 text-sm text-gray-600">
                        {(() => {
                          // Calculate total rent from all rental units
                          const totalRent = tenant.rentalUnits?.reduce((sum, unit) => {
                            return sum + (unit.financial?.rentAmount || 0);
                          }, 0) || 0;
                          
                          return (
                            <span>
                              Total Rent: {tenant.leaseInfo.currency} {totalRent.toLocaleString()}/month
                              {tenant.rentalUnits?.length > 1 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({tenant.rentalUnits.length} units)
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/tenants/${tenant._id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {data.pagination && data.pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {((data.pagination.current - 1) * filters.limit) + 1} to{' '}
                    {Math.min(data.pagination.current * filters.limit, data.pagination.total)} of{' '}
                    {data.pagination.total} tenants
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.pagination.current === 1}
                      onClick={() => handleFilterChange('page', data.pagination.current - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {data.pagination.current} of {data.pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.pagination.current === data.pagination.pages}
                      onClick={() => handleFilterChange('page', data.pagination.current + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No tenants found</p>
              <Link to="/tenants/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Tenant
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Tenants;
