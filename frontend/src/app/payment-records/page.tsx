'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/UI/Dialog';
import { Receipt, Plus, Search, Edit, Trash2, Save, X } from 'lucide-react';
import { paymentRecordsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import SidebarLayout from '../../components/Layout/SidebarLayout';

interface PaymentRecord {
  id: number;
  tenant_id: number;
  property_id: number;
  payment_type_id: number;
  payment_mode_id: number;
  amount: number;
  reference_number?: string;
  payment_date: string;
  status: string;
  notes?: string;
  tenant?: {
    name: string;
  };
  property?: {
    name: string;
  };
  paymentType?: {
    name: string;
  };
  paymentMode?: {
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export default function PaymentRecordsPage() {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPaymentRecord, setEditingPaymentRecord] = useState<PaymentRecord | null>(null);
  const [formData, setFormData] = useState({
    tenant_id: '',
    property_id: '',
    payment_type_id: '',
    payment_mode_id: '',
    amount: '',
    reference_number: '',
    payment_date: '',
    status: 'pending',
    notes: ''
  });

  useEffect(() => {
    fetchPaymentRecords();
  }, []);

  const fetchPaymentRecords = async () => {
    try {
      setLoading(true);
      const response = await paymentRecordsAPI.getAll();
      setPaymentRecords(response.data.payment_records || []);
    } catch (error) {
      console.error('Error fetching payment records:', error);
      toast.error('Failed to fetch payment records');
    } finally {
      setLoading(false);
    }
  };

  const filteredPaymentRecords = paymentRecords.filter(record =>
    record.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.paymentType?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.paymentMode?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPaymentRecord = () => {
    setEditingPaymentRecord(null);
    setFormData({
      tenant_id: '',
      property_id: '',
      payment_type_id: '',
      payment_mode_id: '',
      amount: '',
      reference_number: '',
      payment_date: '',
      status: 'pending',
      notes: ''
    });
    setShowAddForm(true);
  };

  const handleEditPaymentRecord = (paymentRecord: PaymentRecord) => {
    setEditingPaymentRecord(paymentRecord);
    setFormData({
      tenant_id: paymentRecord.tenant_id.toString(),
      property_id: paymentRecord.property_id.toString(),
      payment_type_id: paymentRecord.payment_type_id.toString(),
      payment_mode_id: paymentRecord.payment_mode_id.toString(),
      amount: paymentRecord.amount.toString(),
      reference_number: paymentRecord.reference_number || '',
      payment_date: paymentRecord.payment_date,
      status: paymentRecord.status,
      notes: paymentRecord.notes || ''
    });
    setShowAddForm(true);
  };

  const handleSavePaymentRecord = async () => {
    try {
      const submitData = {
        ...formData,
        tenant_id: parseInt(formData.tenant_id),
        property_id: parseInt(formData.property_id),
        payment_type_id: parseInt(formData.payment_type_id),
        payment_mode_id: parseInt(formData.payment_mode_id),
        amount: parseFloat(formData.amount)
      };

      if (editingPaymentRecord) {
        // Update existing payment record
        await paymentRecordsAPI.update(editingPaymentRecord.id, submitData);
        toast.success('Payment record updated successfully');
      } else {
        // Create new payment record
        await paymentRecordsAPI.create(submitData);
        toast.success('Payment record created successfully');
      }
      
      setShowAddForm(false);
      setEditingPaymentRecord(null);
      fetchPaymentRecords();
    } catch (error) {
      console.error('Error saving payment record:', error);
      
      // Show specific validation errors if available
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        toast.error('Validation failed: ' + errorMessages.join(', '));
      } else {
        toast.error('Failed to save payment record: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingPaymentRecord(null);
    setFormData({
      tenant_id: '',
      property_id: '',
      payment_type_id: '',
      payment_mode_id: '',
      amount: '',
      reference_number: '',
      payment_date: '',
      status: 'pending',
      notes: ''
    });
  };

  const handleDeletePaymentRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    
    try {
      await paymentRecordsAPI.delete(id);
      toast.success('Payment record deleted successfully');
      fetchPaymentRecords();
    } catch (error) {
      console.error('Error deleting payment record:', error);
      toast.error('Failed to delete payment record');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const totalRecords = paymentRecords.length;
  const completedRecords = paymentRecords.filter(record => record.status === 'completed').length;
  const pendingRecords = paymentRecords.filter(record => record.status === 'pending').length;
  const failedRecords = paymentRecords.filter(record => record.status === 'failed').length;

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Records</h1>
            <p className="mt-2 text-gray-600">
              Detailed payment transaction records
            </p>
          </div>
          <Button onClick={handleAddPaymentRecord} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Record
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
              <Receipt className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalRecords}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{completedRecords}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{pendingRecords}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
              <div className="h-2 w-2 bg-red-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{failedRecords}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search payment records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Add/Edit Payment Record Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingPaymentRecord ? 'Edit Payment Record' : 'Add Payment Record'}
              </DialogTitle>
              <DialogDescription>
                {editingPaymentRecord ? 'Update the payment record details below.' : 'Create a new payment record by filling out the form below.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tenant ID *
                  </label>
                  <Input
                    placeholder="Enter tenant ID"
                    value={formData.tenant_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, tenant_id: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property ID *
                  </label>
                  <Input
                    placeholder="Enter property ID"
                    value={formData.property_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, property_id: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type ID *
                  </label>
                  <Input
                    placeholder="Enter payment type ID"
                    value={formData.payment_type_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_type_id: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Mode ID *
                  </label>
                  <Input
                    placeholder="Enter payment mode ID"
                    value={formData.payment_mode_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_mode_id: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <Input
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <Input
                  placeholder="Enter reference number (optional)"
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <Input
                  placeholder="Enter notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={cancelForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSavePaymentRecord}>
                <Save className="h-4 w-4 mr-2" />
                {editingPaymentRecord ? 'Update Payment Record' : 'Create Payment Record'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Records Table */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Payment Records List</CardTitle>
            <CardDescription className="text-gray-600">
              Manage your payment transaction records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tenant</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Property</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Mode</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaymentRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{record.tenant?.name || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-600">{record.property?.name || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">${record.amount?.toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-600">{record.paymentType?.name || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-600">{record.paymentMode?.name || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-500">
                          {new Date(record.payment_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPaymentRecord(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePaymentRecord(record.id)}
                            className="text-red-600 hover:text-red-700"
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

            {filteredPaymentRecords.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payment records found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first payment record.'}
                </p>
                <div className="mt-6">
                  <Button onClick={handleAddPaymentRecord}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Record
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}