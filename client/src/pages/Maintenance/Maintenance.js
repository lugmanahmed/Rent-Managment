import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Wrench, 
  AlertTriangle, 
  Search,
  Filter,
  Eye,
  MapPin,
  Package,
  Calendar,
  User,
  MessageSquare,
  Edit2,
  Trash2,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { rentalUnitsAPI } from '../../services/api';

const Maintenance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState({}); // Track pending status changes
  const queryClient = useQueryClient();

  // Fetch faulty assets
  const { data: faultyAssetsData, isLoading, error } = useQuery(
    'faultyAssets',
    () => {
      console.log('Fetching faulty assets...');
      return rentalUnitsAPI.getFaultyAssets();
    },
    {
      refetchInterval: false, // Disable auto-refetch for now
      retry: 1, // Only retry once
      onSuccess: (data) => {
        console.log('Faulty assets fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching faulty assets:', error);
      }
    }
  );

  // Update asset status mutation
  const updateAssetMutation = useMutation(
    ({ unitId, assetId, assetData }) => 
      rentalUnitsAPI.updateAsset(unitId, assetId, assetData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('faultyAssets');
        queryClient.invalidateQueries('rentalUnits');
      },
    }
  );

  const faultyAssets = faultyAssetsData?.data?.data || [];

  // Filter assets based on search and status
  const filteredAssets = faultyAssets.filter(asset => {
    const matchesSearch = 
      asset.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tenant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tenant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || asset.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (unitId, assetId, event) => {
    // Extract the value from the event object
    const newStatus = event.target.value;
    
    // Store pending update instead of immediately saving
    const updateKey = `${unitId}-${assetId}`;
    setPendingUpdates(prev => ({
      ...prev,
      [updateKey]: {
        unitId,
        assetId,
        newStatus,
        originalStatus: faultyAssets.find(asset => 
          asset.rentalUnitId === unitId && asset.asset._id === assetId
        )?.status
      }
    }));
  };

  const handleUpdateAsset = async (updateKey) => {
    const update = pendingUpdates[updateKey];
    if (!update) return;

    try {
      await updateAssetMutation.mutateAsync({
        unitId: update.unitId,
        assetId: update.assetId,
        assetData: { status: update.newStatus }
      });
      
      // Remove from pending updates
      setPendingUpdates(prev => {
        const newPending = { ...prev };
        delete newPending[updateKey];
        return newPending;
      });
    } catch (error) {
      console.error('Error updating asset status:', error);
    }
  };

  const handleCancelUpdate = (updateKey) => {
    setPendingUpdates(prev => {
      const newPending = { ...prev };
      delete newPending[updateKey];
      return newPending;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Faulty':
      case 'faulty':
        return 'bg-red-100 text-red-800';
      case 'Working':
      case 'working':
        return 'bg-green-100 text-green-800';
      case 'Repaired':
        return 'bg-blue-100 text-blue-800';
      case 'Replaced':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Faulty':
      case 'faulty':
        return <AlertTriangle className="h-3 w-3" />;
      case 'Working':
      case 'working':
        return <Wrench className="h-3 w-3" />;
      case 'Repaired':
        return <Wrench className="h-3 w-3" />;
      case 'Replaced':
        return <Package className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading faulty assets: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="text-gray-600">Monitor and manage all maintenance-related assets across rental units</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Maintenance</p>
                <p className="text-2xl font-bold text-red-600">{faultyAssets.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Properties Affected</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(faultyAssets.map(asset => asset.property?._id)).size}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Units Affected</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Set(faultyAssets.map(asset => asset.rentalUnitId)).size}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tenants Affected</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(faultyAssets.map(asset => asset.tenant?._id)).size}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by asset, property, unit, or tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Faulty', label: 'Faulty' },
                  { value: 'Working', label: 'Working' },
                  { value: 'Repaired', label: 'Repaired' },
                  { value: 'Replaced', label: 'Replaced' }
                ]}
                placeholder="Filter by status"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faulty Assets List */}
      <div className="space-y-4">
        {filteredAssets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Maintenance Assets Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter 
                  ? 'No assets match your current filters.' 
                  : 'All assets are working properly!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssets.map((asset) => (
            <Card key={asset._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {asset.asset?.name || 'Unknown Asset'}
                      </h3>
                      {(() => {
                        const updateKey = `${asset.rentalUnitId}-${asset.asset._id}`;
                        const pendingUpdate = pendingUpdates[updateKey];
                        const displayStatus = pendingUpdate ? pendingUpdate.newStatus : asset.status;
                        const isPending = !!pendingUpdate;
                        
                        return (
                          <Badge className={`${getStatusColor(displayStatus)} ${isPending ? 'ring-2 ring-yellow-400' : ''}`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(displayStatus)}
                              {displayStatus}
                              {isPending && <span className="text-xs">(Pending)</span>}
                            </div>
                          </Badge>
                        );
                      })()}
                      <Badge className="bg-red-100 text-red-800">
                        Quantity: {asset.quantity || 1}
                      </Badge>
                    </div>

                    {/* Detailed Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">Property</span>
                        </div>
                        <p className="text-gray-900">{asset.property?.name || 'N/A'}</p>
                        <p className="text-gray-500 text-xs">{asset.property?.address?.street || ''}</p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-gray-700">Unit Details</span>
                        </div>
                        <p className="text-gray-900">Unit {asset.unitNumber || 'N/A'}</p>
                        <p className="text-gray-500 text-xs">Floor {asset.floorNumber || 'N/A'}</p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-gray-700">Tenant</span>
                        </div>
                        <p className="text-gray-900">
                          {asset.tenant?.firstName || 'N/A'} {' '}
                          {asset.tenant?.lastName || ''}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {asset.tenant?.phone || 'No phone'}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Wrench className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-gray-700">Asset Details</span>
                        </div>
                        <p className="text-gray-900">{asset.asset?.category || 'No category'}</p>
                        <p className="text-gray-500 text-xs">{asset.asset?.brand || 'No brand'}</p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-indigo-600" />
                          <span className="font-medium text-gray-700">Reported</span>
                        </div>
                        <p className="text-gray-900">{formatDate(asset.addedDate)}</p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-gray-700">Current Status</span>
                        </div>
                        {(() => {
                          const updateKey = `${asset.rentalUnitId}-${asset.asset._id}`;
                          const pendingUpdate = pendingUpdates[updateKey];
                          const displayStatus = pendingUpdate ? pendingUpdate.newStatus : asset.status;
                          const isPending = !!pendingUpdate;
                          
                          return (
                            <Badge className={`${getStatusColor(displayStatus)} ${isPending ? 'ring-2 ring-yellow-400' : ''}`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(displayStatus)}
                                {displayStatus}
                                {isPending && <span className="text-xs">(Pending)</span>}
                              </div>
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Notes Section */}
                    {asset.notes && (
                      <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Notes</span>
                        </div>
                        <p className="text-blue-900 text-sm">{asset.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAsset(asset);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {(() => {
                      const updateKey = `${asset.rentalUnitId}-${asset.asset._id}`;
                      const pendingUpdate = pendingUpdates[updateKey];
                      const currentStatus = pendingUpdate ? pendingUpdate.newStatus : asset.status;
                      
                      return (
                        <div className="flex items-center gap-2">
                          <Select
                            value={currentStatus}
                            onChange={(event) => handleStatusChange(asset.rentalUnitId, asset.asset._id, event)}
                            options={[
                              { value: 'Working', label: 'Working' },
                              { value: 'Faulty', label: 'Faulty' },
                              { value: 'Repaired', label: 'Repaired' },
                              { value: 'Replaced', label: 'Replaced' }
                            ]}
                            className="w-32"
                          />
                          
                          {pendingUpdate && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateAsset(updateKey)}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                              >
                                Update
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelUpdate(updateKey)}
                                className="text-gray-500 hover:text-gray-700 px-2 py-1 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Asset Details Modal */}
      {showDetailsModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Asset Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asset Name</label>
                  <p className="text-gray-900">{selectedAsset.asset?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900">{selectedAsset.asset?.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property</label>
                  <p className="text-gray-900">{selectedAsset.property?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <p className="text-gray-900">Unit {selectedAsset.unitNumber}, Floor {selectedAsset.floorNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tenant</label>
                  <p className="text-gray-900">
                    {selectedAsset.tenant?.firstName} {selectedAsset.tenant?.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <Badge className={getStatusColor(selectedAsset.status)}>
                    {selectedAsset.status}
                  </Badge>
                </div>
              </div>
              
              {selectedAsset.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedAsset.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;