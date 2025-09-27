import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft } from 'lucide-react';

import { assetsAPI } from '../../services/api';
import { Button } from '../../components/UI/Button';
import AssetForm from '../../components/Assets/AssetForm';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AssetEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: assetData, isLoading: assetLoading, error: assetError } = useQuery(
    ['asset', id],
    () => assetsAPI.getById(id),
    {
      enabled: !!id,
      select: (data) => data.data?.data?.asset
    }
  );

  if (assetLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

  if (assetError) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading asset</h3>
        <p className="text-gray-600 mb-4">{assetError.message || 'Something went wrong'}</p>
        <Button onClick={() => navigate('/assets')}>Back to Assets</Button>
      </div>
    );
  }

  if (!assetData && !assetLoading) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Asset not found</h3>
        <p className="text-gray-600 mb-4">The asset you're trying to edit doesn't exist.</p>
        <Button onClick={() => navigate('/assets')}>Back to Assets</Button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/assets')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assets
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Asset</h1>
          <p className="text-gray-600">Update asset information and settings</p>
        </div>
      </div>

      {/* Asset Form */}
      <AssetForm 
        asset={assetData} 
        isEdit={true} 
      />
    </div>
  );
};

export default AssetEdit;
