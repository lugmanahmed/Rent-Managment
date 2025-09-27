import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { paymentRecordsAPI, rentalUnitsAPI, paymentTypesAPI, paymentModesAPI, currenciesAPI } from '../../services/api';

const PaymentRecords = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState(null);
  const [editingPaymentRecord, setEditingPaymentRecord] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    unitId: '',
    paymentType: '',
    paymentMode: '',
    currency: '',
    paidBy: '',
    startDate: '',
    endDate: ''
  });
  const [formData, setFormData] = useState({
    unitId: '',
    amount: '',
    paymentType: '',
    paymentMode: '',
    currency: '',
    paidBy: '',
    paidDate: new Date().toISOString().split('T')[0],
    mobileNo: '',
    blazNo: '',
    accountName: '',
    accountNo: '',
    bank: '',
    chequeNo: '',
    remarks: ''
  });
  const queryClient = useQueryClient();

  // Fetch payment records
  const { data: paymentRecordsData, isLoading, error } = useQuery(
    ['paymentRecords', filters],
    () => paymentRecordsAPI.getAll(filters),
    {
      onSuccess: (data) => {
        console.log('Payment records fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching payment records:', error);
      }
    }
  );

  // Fetch rental units for dropdown
  const { data: rentalUnitsData } = useQuery(
    'rentalUnits',
    () => rentalUnitsAPI.getAll({ limit: 1000 })
  );

  // Fetch payment types for dropdown
  const { data: paymentTypesData } = useQuery(
    'paymentTypes',
    () => paymentTypesAPI.getAll()
  );

  // Fetch payment modes for dropdown
  const { data: paymentModesData } = useQuery(
    'paymentModes',
    () => paymentModesAPI.getAll()
  );

  // Fetch currencies for dropdown
  const { data: currenciesData } = useQuery(
    'currencies',
    () => currenciesAPI.getAll()
  );

  // Fetch payment summary
  const { data: summaryData } = useQuery(
    'paymentSummary',
    () => paymentRecordsAPI.getSummary()
  );

  // Create payment record mutation
  const createMutation = useMutation(
    (data) => paymentRecordsAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentRecords');
        queryClient.invalidateQueries('paymentSummary');
        setShowCreateModal(false);
        resetForm();
      },
    }
  );

  // Update payment record mutation
  const updateMutation = useMutation(
    ({ id, data }) => paymentRecordsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentRecords');
        queryClient.invalidateQueries('paymentSummary');
        setShowEditModal(false);
        setEditingPaymentRecord(null);
      },
    }
  );

  // Delete payment record mutation
  const deleteMutation = useMutation(
    (id) => paymentRecordsAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentRecords');
        queryClient.invalidateQueries('paymentSummary');
      },
    }
  );

  const paymentRecords = paymentRecordsData?.data?.data?.paymentRecords || [];
  const pagination = paymentRecordsData?.data?.data?.pagination || {};
  const rentalUnits = rentalUnitsData?.data?.data || [];
  const paymentTypes = paymentTypesData?.data?.data || [];
  const paymentModes = paymentModesData?.data?.data || [];
  const currencies = currenciesData?.data?.data || [];
  const summary = summaryData?.data?.data || {};

  const resetForm = () => {
    setFormData({
      unitId: '',
      amount: '',
      paymentType: '',
      paymentMode: '',
      currency: '',
      paidBy: '',
      paidDate: new Date().toISOString().split('T')[0],
      mobileNo: '',
      blazNo: '',
      accountName: '',
      accountNo: '',
      bank: '',
      chequeNo: '',
      remarks: ''
    });
  };

  const handleCreate = () => {
    if (!formData.unitId || !formData.amount || !formData.paymentType || 
        !formData.paymentMode || !formData.currency || !formData.paidBy) {
      alert('Please fill in all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (paymentRecord) => {
    setEditingPaymentRecord(paymentRecord);
    setFormData({
      unitId: paymentRecord.unitId._id,
      amount: paymentRecord.amount,
      paymentType: paymentRecord.paymentType._id,
      paymentMode: paymentRecord.paymentMode._id,
      currency: paymentRecord.currency._id,
      paidBy: paymentRecord.paidBy,
      paidDate: new Date(paymentRecord.paidDate).toISOString().split('T')[0],
      mobileNo: paymentRecord.mobileNo || '',
      blazNo: paymentRecord.blazNo || '',
      accountName: paymentRecord.accountName || '',
      accountNo: paymentRecord.accountNo || '',
      bank: paymentRecord.bank || '',
      chequeNo: paymentRecord.chequeNo || '',
      remarks: paymentRecord.remarks || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!formData.unitId || !formData.amount || !formData.paymentType || 
        !formData.paymentMode || !formData.currency || !formData.paidBy) {
      alert('Please fill in all required fields');
      return;
    }
    updateMutation.mutate({
      id: editingPaymentRecord._id,
      data: formData
    });
  };

  const handleDelete = async (paymentRecord) => {
    if (window.confirm(`Are you sure you want to delete this payment record?`)) {
      try {
        await deleteMutation.mutateAsync(paymentRecord._id);
      } catch (error) {
        console.error('Error deleting payment record:', error);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      unitId: '',
      paymentType: '',
      paymentMode: '',
      currency: '',
      paidBy: '',
      startDate: '',
      endDate: ''
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Records</h1>
          <p className="text-gray-600 mt-2">Manage all payment transactions</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Payment Record
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${summary.totalAmount?.toFixed(2) || '0.00'}
                </p>
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
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pagination.totalRecords || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.recentPayments?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payment Types</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.paymentByType?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <Select
                value={filters.unitId}
                onChange={(e) => handleFilterChange('unitId', e.target.value)}
                options={[
                  { value: '', label: 'All Units' },
                  ...rentalUnits.map(unit => ({
                    value: unit._id,
                    label: `${unit.unitNumber} - ${unit.propertyId?.name || 'Unknown Property'}`
                  }))
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type
              </label>
              <Select
                value={filters.paymentType}
                onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                options={[
                  { value: '', label: 'All Types' },
                  ...paymentTypes.map(type => ({
                    value: type._id,
                    label: type.name
                  }))
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode
              </label>
              <Select
                value={filters.paymentMode}
                onChange={(e) => handleFilterChange('paymentMode', e.target.value)}
                options={[
                  { value: '', label: 'All Modes' },
                  ...paymentModes.map(mode => ({
                    value: mode._id,
                    label: mode.name
                  }))
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <Select
                value={filters.currency}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                options={[
                  { value: '', label: 'All Currencies' },
                  ...currencies.map(currency => ({
                    value: currency._id,
                    label: `${currency.code} - ${currency.name}`
                  }))
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid By
              </label>
              <Input
                type="text"
                value={filters.paidBy}
                onChange={(e) => handleFilterChange('paidBy', e.target.value)}
                placeholder="Search by payer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentRecords.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment records found</h3>
              <p className="text-gray-600">Add payment records to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentRecords.map((paymentRecord) => (
                    <tr key={paymentRecord._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {paymentRecord.unitId?.unitNumber || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {paymentRecord.unitId?.propertyId?.name || 'Unknown Property'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {paymentRecord.currency?.symbol || ''}{paymentRecord.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {paymentRecord.currency?.code || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-blue-100 text-blue-800">
                          {paymentRecord.paymentType?.name || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-green-100 text-green-800">
                          {paymentRecord.paymentMode?.name || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {paymentRecord.paidBy}
                        </div>
                        {paymentRecord.mobileNo && (
                          <div className="text-sm text-gray-500">
                            {paymentRecord.mobileNo}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(paymentRecord.paidDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPaymentRecord(paymentRecord)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(paymentRecord)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(paymentRecord)}
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.totalRecords) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.totalRecords, pagination.totalRecords)} of{' '}
                {pagination.totalRecords} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Payment Record</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <Select
                  value={formData.unitId}
                  onChange={(e) => handleInputChange('unitId', e.target.value)}
                  options={[
                    { value: '', label: 'Select Unit' },
                    ...rentalUnits.map(unit => ({
                      value: unit._id,
                      label: `${unit.unitNumber} - ${unit.propertyId?.name || 'Unknown Property'}`
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type *
                </label>
                <Select
                  value={formData.paymentType}
                  onChange={(e) => handleInputChange('paymentType', e.target.value)}
                  options={[
                    { value: '', label: 'Select Payment Type' },
                    ...paymentTypes.map(type => ({
                      value: type._id,
                      label: type.name
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode *
                </label>
                <Select
                  value={formData.paymentMode}
                  onChange={(e) => handleInputChange('paymentMode', e.target.value)}
                  options={[
                    { value: '', label: 'Select Payment Mode' },
                    ...paymentModes.map(mode => ({
                      value: mode._id,
                      label: mode.name
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <Select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  options={[
                    { value: '', label: 'Select Currency' },
                    ...currencies.map(currency => ({
                      value: currency._id,
                      label: `${currency.code} - ${currency.name}`
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid By *
                </label>
                <Input
                  type="text"
                  value={formData.paidBy}
                  onChange={(e) => handleInputChange('paidBy', e.target.value)}
                  placeholder="Payer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid Date *
                </label>
                <Input
                  type="date"
                  value={formData.paidDate}
                  onChange={(e) => handleInputChange('paidDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile No.
                </label>
                <Input
                  type="text"
                  value={formData.mobileNo}
                  onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                  placeholder="+960 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BLAZ No.
                </label>
                <Input
                  type="text"
                  value={formData.blazNo}
                  onChange={(e) => handleInputChange('blazNo', e.target.value)}
                  placeholder="BLAZ number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <Input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => handleInputChange('accountName', e.target.value)}
                  placeholder="Account holder name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account No.
                </label>
                <Input
                  type="text"
                  value={formData.accountNo}
                  onChange={(e) => handleInputChange('accountNo', e.target.value)}
                  placeholder="Account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank
                </label>
                <Input
                  type="text"
                  value={formData.bank}
                  onChange={(e) => handleInputChange('bank', e.target.value)}
                  placeholder="Bank name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cheque No.
                </label>
                <Input
                  type="text"
                  value={formData.chequeNo}
                  onChange={(e) => handleInputChange('chequeNo', e.target.value)}
                  placeholder="Cheque number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Additional remarks"
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
      {showEditModal && editingPaymentRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Payment Record</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <Select
                  value={formData.unitId}
                  onChange={(e) => handleInputChange('unitId', e.target.value)}
                  options={[
                    { value: '', label: 'Select Unit' },
                    ...rentalUnits.map(unit => ({
                      value: unit._id,
                      label: `${unit.unitNumber} - ${unit.propertyId?.name || 'Unknown Property'}`
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type *
                </label>
                <Select
                  value={formData.paymentType}
                  onChange={(e) => handleInputChange('paymentType', e.target.value)}
                  options={[
                    { value: '', label: 'Select Payment Type' },
                    ...paymentTypes.map(type => ({
                      value: type._id,
                      label: type.name
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode *
                </label>
                <Select
                  value={formData.paymentMode}
                  onChange={(e) => handleInputChange('paymentMode', e.target.value)}
                  options={[
                    { value: '', label: 'Select Payment Mode' },
                    ...paymentModes.map(mode => ({
                      value: mode._id,
                      label: mode.name
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <Select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  options={[
                    { value: '', label: 'Select Currency' },
                    ...currencies.map(currency => ({
                      value: currency._id,
                      label: `${currency.code} - ${currency.name}`
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid By *
                </label>
                <Input
                  type="text"
                  value={formData.paidBy}
                  onChange={(e) => handleInputChange('paidBy', e.target.value)}
                  placeholder="Payer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid Date *
                </label>
                <Input
                  type="date"
                  value={formData.paidDate}
                  onChange={(e) => handleInputChange('paidDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile No.
                </label>
                <Input
                  type="text"
                  value={formData.mobileNo}
                  onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                  placeholder="+960 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BLAZ No.
                </label>
                <Input
                  type="text"
                  value={formData.blazNo}
                  onChange={(e) => handleInputChange('blazNo', e.target.value)}
                  placeholder="BLAZ number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <Input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => handleInputChange('accountName', e.target.value)}
                  placeholder="Account holder name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account No.
                </label>
                <Input
                  type="text"
                  value={formData.accountNo}
                  onChange={(e) => handleInputChange('accountNo', e.target.value)}
                  placeholder="Account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank
                </label>
                <Input
                  type="text"
                  value={formData.bank}
                  onChange={(e) => handleInputChange('bank', e.target.value)}
                  placeholder="Bank name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cheque No.
                </label>
                <Input
                  type="text"
                  value={formData.chequeNo}
                  onChange={(e) => handleInputChange('chequeNo', e.target.value)}
                  placeholder="Cheque number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Additional remarks"
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
      {selectedPaymentRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Payment Record Details
              </h3>
              <Button
                variant="outline"
                onClick={() => setSelectedPaymentRecord(null)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <p className="text-gray-900">
                  {selectedPaymentRecord.unitId?.unitNumber || 'N/A'} - {selectedPaymentRecord.unitId?.propertyId?.name || 'Unknown Property'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="text-gray-900">
                  {selectedPaymentRecord.currency?.symbol || ''}{selectedPaymentRecord.amount.toFixed(2)} {selectedPaymentRecord.currency?.code || 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                <p className="text-gray-900">{selectedPaymentRecord.paymentType?.name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                <p className="text-gray-900">{selectedPaymentRecord.paymentMode?.name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Paid By</label>
                <p className="text-gray-900">{selectedPaymentRecord.paidBy}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Paid Date</label>
                <p className="text-gray-900">
                  {new Date(selectedPaymentRecord.paidDate).toLocaleDateString()}
                </p>
              </div>
              
              {selectedPaymentRecord.mobileNo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile No.</label>
                  <p className="text-gray-900">{selectedPaymentRecord.mobileNo}</p>
                </div>
              )}
              
              {selectedPaymentRecord.blazNo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">BLAZ No.</label>
                  <p className="text-gray-900">{selectedPaymentRecord.blazNo}</p>
                </div>
              )}
              
              {selectedPaymentRecord.accountName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Name</label>
                  <p className="text-gray-900">{selectedPaymentRecord.accountName}</p>
                </div>
              )}
              
              {selectedPaymentRecord.accountNo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account No.</label>
                  <p className="text-gray-900">{selectedPaymentRecord.accountNo}</p>
                </div>
              )}
              
              {selectedPaymentRecord.bank && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank</label>
                  <p className="text-gray-900">{selectedPaymentRecord.bank}</p>
                </div>
              )}
              
              {selectedPaymentRecord.chequeNo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cheque No.</label>
                  <p className="text-gray-900">{selectedPaymentRecord.chequeNo}</p>
                </div>
              )}
              
              {selectedPaymentRecord.remarks && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="text-gray-900">{selectedPaymentRecord.remarks}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="text-gray-900">
                  {new Date(selectedPaymentRecord.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <p className="text-gray-900">
                  {selectedPaymentRecord.createdBy?.name || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRecords;
