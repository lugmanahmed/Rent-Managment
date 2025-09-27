import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Package, 
  Wrench,
  Shield,
  AlertTriangle,
  TrendingDown,
  Clock,
  MapPin,
  FileText,
  Save,
  X
} from 'lucide-react';

import { assetsAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceCost: '',
    maintenanceDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Fetch asset details
  const { data: assetData, isLoading: assetLoading } = useQuery(
    ['asset', id],
    () => assetsAPI.getById(id),
    {
      enabled: !!id,
      select: (data) => data.data?.data?.asset || data.data
    }
  );

  // Delete asset mutation
  const deleteAssetMutation = useMutation(
    () => assetsAPI.delete(id),
    {
      onSuccess: () => {
        toast.success('Asset deleted successfully');
        queryClient.invalidateQueries(['assets']);
        queryClient.invalidateQueries(['assets-stats']);
        navigate('/assets');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete asset');
      }
    }
  );

  // Record maintenance mutation
  const maintenanceMutation = useMutation(
    (data) => assetsAPI.recordMaintenance(id, data),
    {
      onSuccess: () => {
        toast.success('Maintenance recorded successfully');
        queryClient.invalidateQueries(['asset', id]);
        setMaintenanceForm({
          maintenanceCost: '',
          maintenanceDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record maintenance');
      }
    }
  );

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${assetData?.name}"?`)) {
      deleteAssetMutation.mutate();
    }
  };

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    maintenanceMutation.mutate(maintenanceForm);
  };

  const formatCurrency = (amount, currency = 'MVR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'MVR' ? 'USD' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('$', currency === 'MVR' ? 'MVR ' : '$');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'disposed': return 'bg-red-100 text-red-800';
      case 'lost': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWarrantyStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'no_warranty': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (assetLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

  if (!assetData) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Asset not found</h3>
        <p className="text-gray-600 mb-4">The asset you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/assets')}>Back to Assets</Button>
      </div>
    );
  }

  const asset = assetData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/assets')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{asset.icon || '📦'}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{asset.name || 'Unnamed Asset'}</h1>
                <p className="text-gray-600 capitalize">
                  {asset.category?.replace('_', ' ') || 'Unknown'} • {asset.type || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/assets/${asset._id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Asset
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{asset.name || 'Unnamed Asset'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <p className="text-gray-900 capitalize">{asset.category?.replace('_', ' ') || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <Badge className={`${asset.type === 'fixed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} flex items-center gap-1 w-fit`}>
                    {asset.type === 'fixed' ? <Package className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                    {asset.type || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={`${getStatusColor(asset.status || 'active')} w-fit`}>
                    {asset.status || 'Active'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Condition</label>
                  <Badge className={`${getConditionColor(asset.condition || 'good')} w-fit`}>
                    {asset.condition || 'Good'}
                  </Badge>
                </div>
                {asset.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-gray-900 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {asset.location}
                    </p>
                  </div>
                )}
              </div>
              {asset.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900">{asset.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Purchase Cost</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(asset.purchaseCost || 0, asset.currency || 'MVR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Value</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(asset.currentValue || 0, asset.currency || 'MVR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Purchase Date</label>
                  <p className="text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Age</label>
                  <p className="text-gray-900">{asset.ageInYears || 0} years</p>
                </div>
                {asset.supplier && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Supplier</label>
                    <p className="text-gray-900">{asset.supplier}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Maintenance Cost</label>
                  <p className="text-gray-900">{formatCurrency(asset.maintenanceCost || 0, asset.currency || 'MVR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Depreciation Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-purple-600" />
                Depreciation Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Depreciation Method</label>
                  <p className="text-gray-900 capitalize">
                    {asset.depreciationMethod?.replace('_', ' ') || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Useful Life</label>
                  <p className="text-gray-900">{asset.usefulLife || 0} years</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Salvage Value</label>
                  <p className="text-gray-900">{formatCurrency(asset.salvageValue || 0, asset.currency || 'MVR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Remaining Useful Life</label>
                  <p className="text-gray-900">{asset.remainingUsefulLife || 0} years</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Depreciation per Year</label>
                  <p className="text-gray-900">{formatCurrency(asset.depreciationPerYear || 0, asset.currency || 'MVR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Depreciation per Month</label>
                  <p className="text-gray-900">{formatCurrency(asset.depreciationPerMonth || 0, asset.currency || 'MVR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(asset.serialNumber || asset.model || asset.brand || asset.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {asset.serialNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Serial Number</label>
                      <p className="text-gray-900 font-mono">{asset.serialNumber}</p>
                    </div>
                  )}
                  {asset.model && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Model</label>
                      <p className="text-gray-900">{asset.model}</p>
                    </div>
                  )}
                  {asset.brand && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Brand</label>
                      <p className="text-gray-900">{asset.brand}</p>
                    </div>
                  )}
                </div>
                {asset.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{asset.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Warranty Status */}
          {(asset.warrantyPeriod || 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Warranty Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Warranty Period</label>
                  <p className="text-gray-900">{asset.warrantyPeriod || 0} months</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={`${getWarrantyStatusColor(asset.warrantyStatus || 'no_warranty')} w-fit`}>
                    {asset.warrantyStatus === 'active' ? 'Active' : 
                     asset.warrantyStatus === 'expired' ? 'Expired' : 'No Warranty'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maintenance History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-600" />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.lastMaintenanceDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Maintenance</label>
                  <p className="text-gray-900 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
              )}
              
              {asset.nextMaintenanceDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Next Maintenance</label>
                  <p className="text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
              )}

              {/* Record Maintenance Form */}
              <form onSubmit={handleMaintenanceSubmit} className="space-y-3">
                <h4 className="font-medium text-gray-900">Record Maintenance</h4>
                <Input
                  label="Cost"
                  type="number"
                  value={maintenanceForm.maintenanceCost}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, maintenanceCost: e.target.value }))}
                  placeholder="0"
                />
                <Input
                  label="Date"
                  type="date"
                  value={maintenanceForm.maintenanceDate}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, maintenanceDate: e.target.value }))}
                />
                <Input
                  label="Notes"
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Maintenance details..."
                  multiline
                  rows={2}
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={maintenanceMutation.isLoading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Record Maintenance
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/assets/${asset._id}/edit`)}
                className="w-full justify-start"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Asset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/assets')}
                className="w-full justify-start"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assets
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssetDetails;
