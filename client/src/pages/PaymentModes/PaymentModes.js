import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { paymentModesAPI } from '../../services/api';

const PaymentModes = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState(null);
  const [editingPaymentMode, setEditingPaymentMode] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sortOrder: 0,
    isActive: true
  });
  const queryClient = useQueryClient();

  // Fetch payment modes
  const { data: paymentModesData, isLoading, error } = useQuery(
    'paymentModes',
    () => paymentModesAPI.getAllIncludingInactive(),
    {
      onSuccess: (data) => {
        console.log('Payment modes fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching payment modes:', error);
      }
    }
  );

  // Create payment mode mutation
  const createMutation = useMutation(
    (data) => paymentModesAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentModes');
        setShowCreateModal(false);
        setFormData({ 
          name: '', 
          sortOrder: 0, 
          isActive: true 
        });
      },
    }
  );

  // Update payment mode mutation
  const updateMutation = useMutation(
    ({ id, data }) => paymentModesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentModes');
        setShowEditModal(false);
        setEditingPaymentMode(null);
      },
    }
  );

  // Delete payment mode mutation
  const deleteMutation = useMutation(
    (id) => paymentModesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentModes');
      },
    }
  );

  // Reorder payment modes mutation
  const reorderMutation = useMutation(
    (paymentModes) => paymentModesAPI.reorder(paymentModes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentModes');
      },
    }
  );

  const paymentModes = paymentModesData?.data?.data || [];

  const handleCreate = () => {
    if (!formData.name.trim()) {
      alert('Payment mode name is required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (paymentMode) => {
    setEditingPaymentMode(paymentMode);
    setFormData({
      name: paymentMode.name,
      sortOrder: paymentMode.sortOrder,
      isActive: paymentMode.isActive
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      alert('Payment mode name is required');
      return;
    }
    updateMutation.mutate({
      id: editingPaymentMode._id,
      data: formData
    });
  };

  const handleDelete = async (paymentMode) => {
    if (window.confirm(`Are you sure you want to delete "${paymentMode.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(paymentMode._id);
      } catch (error) {
        console.error('Error deleting payment mode:', error);
      }
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    
    const newPaymentModes = [...paymentModes];
    const temp = newPaymentModes[index];
    newPaymentModes[index] = newPaymentModes[index - 1];
    newPaymentModes[index - 1] = temp;
    
    // Update sort orders
    const reorderData = newPaymentModes.map((paymentMode, idx) => ({
      id: paymentMode._id,
      sortOrder: idx + 1
    }));
    
    reorderMutation.mutate(reorderData);
  };

  const handleMoveDown = async (index) => {
    if (index === paymentModes.length - 1) return;
    
    const newPaymentModes = [...paymentModes];
    const temp = newPaymentModes[index];
    newPaymentModes[index] = newPaymentModes[index + 1];
    newPaymentModes[index + 1] = temp;
    
    // Update sort orders
    const reorderData = newPaymentModes.map((paymentMode, idx) => ({
      id: paymentMode._id,
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
          <h1 className="text-3xl font-bold text-gray-900">Payment Modes</h1>
          <p className="text-gray-600 mt-2">Manage payment modes accepted by the application</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Payment Mode
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
                <p className="text-sm font-medium text-gray-600">Total Payment Modes</p>
                <p className="text-2xl font-bold text-gray-900">{paymentModes.length}</p>
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
                  {paymentModes.filter(pm => pm.isActive).length}
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
                  {paymentModes.filter(pm => !pm.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Modes</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentModes.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment modes found</h3>
              <p className="text-gray-600">Add payment modes to get started</p>
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentModes.map((paymentMode, index) => (
                    <tr key={paymentMode._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {paymentMode.sortOrder}
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
                              disabled={index === paymentModes.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {paymentMode.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={paymentMode.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {paymentMode.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(paymentMode.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPaymentMode(paymentMode);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(paymentMode)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(paymentMode)}
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Payment Mode</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Cash, Cheque, Card, Transfer, Account Deposit"
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
      {showEditModal && editingPaymentMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Payment Mode</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Cash, Cheque, Card, Transfer, Account Deposit"
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
      {selectedPaymentMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Payment Mode Details
              </h3>
              <Button
                variant="outline"
                onClick={() => setSelectedPaymentMode(null)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{selectedPaymentMode.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                <p className="text-gray-900">{selectedPaymentMode.sortOrder}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <Badge className={selectedPaymentMode.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {selectedPaymentMode.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="text-gray-900">
                  {new Date(selectedPaymentMode.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <p className="text-gray-900">
                  {selectedPaymentMode.createdBy?.name || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentModes;
