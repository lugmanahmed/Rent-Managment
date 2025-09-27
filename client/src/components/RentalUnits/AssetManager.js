import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Package, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { assetsAPI, rentalUnitsAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import LoadingSpinner from '../UI/LoadingSpinner';
import AssetEditModal from './AssetEditModal';

const AssetManager = ({ rentalUnitId, currentAssets = [] }) => {
  const queryClient = useQueryClient();
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [editingAsset, setEditingAsset] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch all available assets
  const { data: assetsData, isLoading: assetsLoading } = useQuery(
    ['assets'],
    () => assetsAPI.getAll({ limit: 1000 }),
    {
      select: (data) => {
        console.log('AssetManager - Raw assets data:', data);
        return data.data?.data?.assets || data.data?.assets || [];
      }
    }
  );

  // Add asset mutation
  const addAssetMutation = useMutation(
    (assetId) => rentalUnitsAPI.addAsset(rentalUnitId, assetId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['rentalUnit', rentalUnitId]);
        toast.success('Asset added to rental unit successfully!');
        setSelectedAssetId('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add asset');
      }
    }
  );

  // Remove asset mutation
  const removeAssetMutation = useMutation(
    (assetId) => rentalUnitsAPI.removeAsset(rentalUnitId, assetId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['rentalUnit', rentalUnitId]);
        toast.success('Asset removed from rental unit successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove asset');
      }
    }
  );

  // Update asset mutation
  const updateAssetMutation = useMutation(
    ({ assetId, assetData }) => 
      rentalUnitsAPI.updateAsset(rentalUnitId, assetId, assetData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['rentalUnit', rentalUnitId]);
        setIsEditModalOpen(false);
        setEditingAsset(null);
        toast.success('Asset updated successfully');
      },
      onError: (error) => {
        console.error('Update asset error:', error);
        toast.error(error.response?.data?.message || 'Failed to update asset');
      }
    }
  );

  const handleAddAsset = () => {
    if (!selectedAssetId) {
      toast.error('Please select an asset to add');
      return;
    }
    addAssetMutation.mutate(selectedAssetId);
  };

  const handleRemoveAsset = (assetId) => {
    if (window.confirm('Are you sure you want to remove this asset from the rental unit?')) {
      removeAssetMutation.mutate(assetId);
    }
  };

  const handleEditAsset = (unitAsset) => {
    const asset = unitAsset.asset || unitAsset;
    setEditingAsset({
      _id: asset._id,
      name: asset.name,
      category: asset.category,
      quantity: unitAsset.quantity || 1,
      status: unitAsset.status || 'Working',
      notes: unitAsset.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAsset = (assetData) => {
    if (!editingAsset) return;
    
    console.log('Saving asset data:', assetData);
    console.log('Asset ID:', editingAsset._id);
    console.log('Rental Unit ID:', rentalUnitId);
    
    updateAssetMutation.mutate({
      assetId: editingAsset._id,
      assetData
    });
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingAsset(null);
  };

  // Filter out assets that are already assigned to this unit
  const availableAssets = assetsData?.filter(asset => 
    !currentAssets.some(currentAsset => currentAsset.asset?._id === asset._id)
  ) || [];



  const formatCurrency = (amount, currency = 'MVR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'MVR' ? 'USD' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('$', currency === 'MVR' ? 'MVR ' : '$');
  };

  if (assetsLoading) {
    return <LoadingSpinner size="sm" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-600" />
          Unit Assets ({currentAssets.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Asset Section */}
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose an asset...</option>
            {availableAssets.map((asset) => (
              <option key={asset._id} value={asset._id}>
                {asset.name} - {asset.brand || 'No Brand'} ({formatCurrency(asset.purchaseCost, asset.currency)})
              </option>
            ))}
          </select>
          <Button
            onClick={handleAddAsset}
            disabled={!selectedAssetId || addAssetMutation.isLoading}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>

        {/* Current Assets Table */}
        {currentAssets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentAssets.map((unitAsset) => {
                  const asset = unitAsset.asset || unitAsset; // Handle both old and new structure
                  
                  return (
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
                        <div className="text-sm text-gray-900">{asset.category || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{unitAsset.quantity || 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (unitAsset.status || 'Working') === 'Working' 
                              ? 'bg-green-100 text-green-800' 
                              : (unitAsset.status || 'Working') === 'Faulty'
                              ? 'bg-red-100 text-red-800'
                              : (unitAsset.status || 'Working') === 'Repaired'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {unitAsset.status || 'Working'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={unitAsset.notes || ''}>
                          {unitAsset.notes || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAsset(unitAsset)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAsset(asset._id)}
                            disabled={removeAssetMutation.isLoading}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No assets assigned to this rental unit</p>
            <p className="text-sm">Use the dropdown above to add assets</p>
          </div>
        )}
      </CardContent>
      
      {/* Asset Edit Modal */}
      <AssetEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        asset={editingAsset}
        onSave={handleSaveAsset}
        isLoading={updateAssetMutation.isLoading}
      />
    </Card>
  );
};

export default AssetManager;
