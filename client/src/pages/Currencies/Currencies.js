import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  DollarSign, 
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  Star,
  StarOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { currenciesAPI } from '../../services/api';

const Currencies = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    sortOrder: 0,
    decimalPlaces: 2,
    isActive: true,
    isDefault: false
  });
  const queryClient = useQueryClient();

  // Fetch currencies
  const { data: currenciesData, isLoading, error } = useQuery(
    'currencies',
    () => currenciesAPI.getAllIncludingInactive(),
    {
      onSuccess: (data) => {
        console.log('Currencies fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching currencies:', error);
      }
    }
  );

  // Create currency mutation
  const createMutation = useMutation(
    (data) => currenciesAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currencies');
        setShowCreateModal(false);
        setFormData({ 
          code: '', 
          name: '', 
          symbol: '', 
          sortOrder: 0, 
          decimalPlaces: 2, 
          isActive: true, 
          isDefault: false 
        });
        toast.success('Currency created successfully!');
      },
      onError: (error) => {
        console.error('Error creating currency:', error);
        const errorMessage = error.response?.data?.message || 'Failed to create currency';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  // Update currency mutation
  const updateMutation = useMutation(
    ({ id, data }) => currenciesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currencies');
        setShowEditModal(false);
        setEditingCurrency(null);
        toast.success('Currency updated successfully!');
      },
      onError: (error) => {
        console.error('Error updating currency:', error);
        const errorMessage = error.response?.data?.message || 'Failed to update currency';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  // Delete currency mutation
  const deleteMutation = useMutation(
    (id) => currenciesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currencies');
        toast.success('Currency deleted successfully!');
      },
      onError: (error) => {
        console.error('Error deleting currency:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete currency';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  // Set default currency mutation
  const setDefaultMutation = useMutation(
    (id) => currenciesAPI.setDefault(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currencies');
        toast.success('Default currency updated successfully!');
      },
      onError: (error) => {
        console.error('Error setting default currency:', error);
        const errorMessage = error.response?.data?.message || 'Failed to set default currency';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  // Reorder currencies mutation
  const reorderMutation = useMutation(
    (currencies) => currenciesAPI.reorder(currencies),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currencies');
        toast.success('Currencies reordered successfully!');
      },
      onError: (error) => {
        console.error('Error reordering currencies:', error);
        const errorMessage = error.response?.data?.message || 'Failed to reorder currencies';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  const currencies = currenciesData?.data?.data || [];

  const handleCreate = () => {
    if (!formData.code.trim() || !formData.name.trim() || !formData.symbol.trim()) {
      toast.error('Currency code, name, and symbol are required');
      return;
    }
    if (formData.code.length !== 3) {
      toast.error('Currency code must be exactly 3 characters');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      sortOrder: currency.sortOrder,
      decimalPlaces: currency.decimalPlaces,
      isActive: currency.isActive,
      isDefault: currency.isDefault
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!formData.code.trim() || !formData.name.trim() || !formData.symbol.trim()) {
      toast.error('Currency code, name, and symbol are required');
      return;
    }
    if (formData.code.length !== 3) {
      toast.error('Currency code must be exactly 3 characters');
      return;
    }
    updateMutation.mutate({
      id: editingCurrency._id,
      data: formData
    });
  };

  const handleDelete = async (currency) => {
    if (currency.isDefault) {
      toast.error('Cannot delete the default currency');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${currency.name}"?`)) {
      deleteMutation.mutate(currency._id);
    }
  };

  const handleSetDefault = async (currency) => {
    if (window.confirm(`Set "${currency.name}" as the default currency?`)) {
      setDefaultMutation.mutate(currency._id);
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    
    const newCurrencies = [...currencies];
    const temp = newCurrencies[index];
    newCurrencies[index] = newCurrencies[index - 1];
    newCurrencies[index - 1] = temp;
    
    // Update sort orders
    const reorderData = newCurrencies.map((currency, idx) => ({
      id: currency._id,
      sortOrder: idx + 1
    }));
    
    reorderMutation.mutate(reorderData);
  };

  const handleMoveDown = async (index) => {
    if (index === currencies.length - 1) return;
    
    const newCurrencies = [...currencies];
    const temp = newCurrencies[index];
    newCurrencies[index] = newCurrencies[index + 1];
    newCurrencies[index + 1] = temp;
    
    // Update sort orders
    const reorderData = newCurrencies.map((currency, idx) => ({
      id: currency._id,
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
          <h1 className="text-3xl font-bold text-gray-900">Currencies</h1>
          <p className="text-gray-600 mt-2">Manage currencies accepted by the application</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Currency
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Currencies</p>
                <p className="text-2xl font-bold text-gray-900">{currencies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currencies.filter(c => c.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currencies.filter(c => !c.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Default</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currencies.find(c => c.isDefault)?.name || 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Currencies</CardTitle>
        </CardHeader>
        <CardContent>
          {currencies.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No currencies found</h3>
              <p className="text-gray-600">Add currencies to get started</p>
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
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Decimals
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
                  {currencies.map((currency, index) => (
                    <tr key={currency._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {currency.sortOrder}
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
                              disabled={index === currencies.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {currency.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {currency.name}
                          </span>
                          {currency.isDefault && (
                            <Star className="w-4 h-4 text-yellow-500 ml-2" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {currency.symbol}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {currency.decimalPlaces}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={currency.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {currency.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCurrency(currency);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(currency)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(currency)}
                            disabled={currency.isDefault}
                            title={currency.isDefault ? "Already Default" : "Set as Default"}
                            className={currency.isDefault ? "opacity-50" : ""}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(currency)}
                            disabled={currency.isDefault}
                            title={currency.isDefault ? "Cannot Delete Default" : "Delete"}
                            className={currency.isDefault ? "opacity-50" : ""}
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Currency</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Code *
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="USD, EUR, MVR"
                  maxLength={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="US Dollar, Euro, Maldivian Rufiyaa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol *
                </label>
                <Input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  placeholder="$"
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
                  Decimal Places
                </label>
                <Input
                  type="number"
                  min="0"
                  max="4"
                  value={formData.decimalPlaces}
                  onChange={(e) => handleInputChange('decimalPlaces', parseInt(e.target.value) || 2)}
                  placeholder="2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set as Default
                </label>
                <Select
                  value={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.value === 'true')}
                  options={[
                    { value: false, label: 'No' },
                    { value: true, label: 'Yes' }
                  ]}
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
      {showEditModal && editingCurrency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Currency</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Code *
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="USD, EUR, MVR"
                  maxLength={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="US Dollar, Euro, Maldivian Rufiyaa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol *
                </label>
                <Input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  placeholder="$"
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
                  Decimal Places
                </label>
                <Input
                  type="number"
                  min="0"
                  max="4"
                  value={formData.decimalPlaces}
                  onChange={(e) => handleInputChange('decimalPlaces', parseInt(e.target.value) || 2)}
                  placeholder="2"
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
      {selectedCurrency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Currency Details
              </h3>
              <Button
                variant="outline"
                onClick={() => setSelectedCurrency(null)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <p className="text-gray-900">{selectedCurrency.code}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{selectedCurrency.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Symbol</label>
                <p className="text-gray-900">{selectedCurrency.symbol}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                <p className="text-gray-900">{selectedCurrency.sortOrder}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Decimal Places</label>
                <p className="text-gray-900">{selectedCurrency.decimalPlaces}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <Badge className={selectedCurrency.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {selectedCurrency.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Default</label>
                <Badge className={selectedCurrency.isDefault ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                  {selectedCurrency.isDefault ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="text-gray-900">
                  {new Date(selectedCurrency.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Currencies;
