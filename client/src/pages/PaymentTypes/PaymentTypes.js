import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  Save,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { paymentTypesAPI } from '../../services/api';

const PaymentTypes = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [editingPaymentType, setEditingPaymentType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sortOrder: 0,
    description: '',
    isActive: true
  });
  const queryClient = useQueryClient();

  // Fetch payment types
  const { data: paymentTypesData, isLoading, error } = useQuery(
    'paymentTypes',
    () => paymentTypesAPI.getAllIncludingInactive(),
    {
      onSuccess: (data) => {
        console.log('Payment types fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching payment types:', error);
      }
    }
  );

  // Create payment type mutation
  const createMutation = useMutation(
    (data) => paymentTypesAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentTypes');
        setShowCreateModal(false);
        setFormData({ name: '', sortOrder: 0, description: '', isActive: true });
      },
    }
  );

  // Update payment type mutation
  const updateMutation = useMutation(
    ({ id, data }) => paymentTypesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentTypes');
        setShowEditModal(false);
        setEditingPaymentType(null);
      },
    }
  );

  // Delete payment type mutation
  const deleteMutation = useMutation(
    (id) => paymentTypesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentTypes');
      },
    }
  );

  // Reorder payment types mutation
  const reorderMutation = useMutation(
    (paymentTypes) => paymentTypesAPI.reorder(paymentTypes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentTypes');
      },
    }
  );

  const paymentTypes = paymentTypesData?.data?.data || [];

  const handleCreate = () => {
    if (!formData.name.trim()) {
      alert('Payment type name is required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (paymentType) => {
    setEditingPaymentType(paymentType);
    setFormData({
      name: paymentType.name,
      sortOrder: paymentType.sortOrder,
      description: paymentType.description || '',
      isActive: paymentType.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      alert('Payment type name is required');
      return;
    }
    updateMutation.mutate({
      id: editingPaymentType._id,
      data: formData
    });
  };

  const handleDelete = async (paymentType) => {
    if (window.confirm(`Are you sure you want to delete "${paymentType.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(paymentType._id);
      } catch (error) {
        console.error('Error deleting payment type:', error);
      }
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    
    const newPaymentTypes = [...paymentTypes];
    const temp = newPaymentTypes[index];
    newPaymentTypes[index] = newPaymentTypes[index - 1];
    newPaymentTypes[index - 1] = temp;
    
    // Update sort orders
    const reorderData = newPaymentTypes.map((pt, idx) => ({
      id: pt._id,
      sortOrder: idx + 1
    }));
    
    reorderMutation.mutate(reorderData);
  };

  const handleMoveDown = async (index) => {
    if (index === paymentTypes.length - 1) return;
    
    const newPaymentTypes = [...paymentTypes];
    const temp = newPaymentTypes[index];
    newPaymentTypes[index] = newPaymentTypes[index + 1];
    newPaymentTypes[index + 1] = temp;
    
    // Update sort orders
    const reorderData = newPaymentTypes.map((pt, idx) => ({
      id: pt._id,
      sortOrder: idx + 1
    }));
    
    reorderMutation.mutate(reorderData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Types</h1>
          <p className="text-gray-600 mt-2">Manage payment types accepted by the application</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Payment Type
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payment Types</p>
                <p className="text-2xl font-bold text-gray-900">{paymentTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentTypes.filter(pt => pt.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentTypes.filter(pt => !pt.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Types</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentTypes.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment types found</h3>
              <p className="text-gray-600">Add payment types to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentTypes.map((paymentType, index) => (
                    <tr key={paymentType._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {paymentType.sortOrder}
                          </span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={index === paymentTypes.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {paymentType.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {paymentType.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={paymentType.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {paymentType.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPaymentType(paymentType);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(paymentType)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(paymentType)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Payment Type</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Rent, Advance, Deposit"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isLoading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPaymentType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Payment Type</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Rent, Advance, Deposit"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select
                  value={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                  options={[
                    { value: true, label: 'Active' },
                    { value: false, label: 'Inactive' }
                  ]}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateMutation.isLoading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedPaymentType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Payment Type Details
              </h3>
              <Button
                variant="outline"
                onClick={() => setSelectedPaymentType(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{selectedPaymentType.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                <p className="text-gray-900">{selectedPaymentType.sortOrder}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900">{selectedPaymentType.description || 'No description'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <Badge className={selectedPaymentType.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {selectedPaymentType.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="text-gray-900">
                  {new Date(selectedPaymentType.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTypes;
