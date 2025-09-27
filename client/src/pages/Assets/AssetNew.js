import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Button } from '../../components/UI/Button';
import AssetForm from '../../components/Assets/AssetForm';

const AssetNew = () => {
  const navigate = useNavigate();

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
          <h1 className="text-3xl font-bold text-gray-900">Add New Asset</h1>
          <p className="text-gray-600">Create a new asset to track in your inventory</p>
        </div>
      </div>

      {/* Asset Form */}
      <AssetForm />
    </div>
  );
};

export default AssetNew;
