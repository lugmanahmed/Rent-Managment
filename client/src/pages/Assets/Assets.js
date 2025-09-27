import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  DollarSign,
  Calendar,
  MapPin
} from 'lucide-react';

import { assetsAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Badge } from '../../components/UI/Badge';
import { Select } from '../../components/UI/Select';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Assets = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
          const [filters, setFilters] = useState({
            brand: '',
            category: '',
            condition: '',
            currency: ''
          });
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Build query parameters
  const queryParams = {
    page: currentPage,
    limit: 12,
    search: searchTerm || undefined,
    ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value)),
    sortBy,
    sortOrder
  };

  // Fetch assets
  const { data: assetsData, isLoading: assetsLoading } = useQuery(
    ['assets', queryParams],
    () => assetsAPI.getAll(queryParams),
    {
      select: (data) => {
        console.log('Raw API response:', data);
        return data.data;
      }
    }
  );


  // Delete asset mutation
  const deleteAssetMutation = useMutation(
    (id) => assetsAPI.delete(id),
    {
      onSuccess: () => {
        toast.success('Asset deleted successfully');
        queryClient.invalidateQueries(['assets']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete asset');
      }
    }
  );

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteAssetMutation.mutate(id);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

          const clearFilters = () => {
            setFilters({
              brand: '',
              category: '',
              condition: '',
              currency: ''
            });
            setSearchTerm('');
            setCurrentPage(1);
          };

  const formatCurrency = (amount, currency = 'MVR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'MVR' ? 'USD' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('$', currency === 'MVR' ? 'MVR ' : '$');
  };


  if (assetsLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

          const assets = assetsData?.data?.assets || [];
          const pagination = assetsData?.data?.pagination || {};
          
          console.log('Assets data:', assetsData);
          console.log('Assets array:', assets);
          console.log('Assets length:', assets.length);
          console.log('Brands in assets:', assets.map(asset => asset.brand));
          console.log('Categories in assets:', assets.map(asset => asset.category));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assets Management</h1>
          <p className="text-gray-600">Track and manage your property assets</p>
        </div>
        <Button onClick={() => navigate('/assets/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>


      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            
            <select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Brands</option>
              {assets && assets.length > 0 ? (
                Array.from(new Set(assets.map(asset => asset.brand).filter(Boolean))).map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))
              ) : (
                <option value="" disabled>Loading brands...</option>
              )}
            </select>
            
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {assets && assets.length > 0 ? (
                Array.from(new Set(assets.map(asset => asset.category).filter(Boolean))).map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading categories...</option>
              )}
            </select>

            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Asset
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Brand
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{asset.name || 'Unnamed Asset'}</div>
                        {asset.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{asset.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{asset.brand || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{asset.category || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/assets/${asset._id}/edit`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(asset._id, asset.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((pagination.current - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.current * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={pagination.current === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700">
              Page {pagination.current} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
              disabled={pagination.current === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {assets.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first asset'
              }
            </p>
            <Button onClick={() => navigate('/assets/new')}>
              Add Asset
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Assets;