import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  FileText, 
  Search,
  Filter,
  Download,
  Mail,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { invoicesAPI, settingsAPI, rentalUnitsAPI } from '../../services/api';

const Rent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [generateData, setGenerateData] = useState({
    periodStart: '',
    periodEnd: '',
    dueDate: ''
  });
  const [rentSettings, setRentSettings] = useState({
    autoGenerateRent: false,
    rentGenerationDay: 1,
    rentDueDays: 7
  });
  const queryClient = useQueryClient();

  // Fetch cron job status
  const { data: cronStatusData } = useQuery(
    'cronStatus',
    () => invoicesAPI.getCronStatus(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      onError: (error) => {
        console.error('Error fetching cron status:', error);
      }
    }
  );

  // Fetch settings
  const { data: settingsData } = useQuery(
    'settings',
    () => settingsAPI.get(),
    {
      onSuccess: (data) => {
        if (data?.data?.settings?.rentSettings) {
          setRentSettings(data.data.settings.rentSettings);
        }
      },
      onError: (error) => {
        console.error('Error fetching settings:', error);
      }
    }
  );

  // Fetch occupied units count
  const { data: occupiedUnitsData } = useQuery(
    'occupiedUnitsCount',
    () => invoicesAPI.getOccupiedUnitsCount(),
    {
      onSuccess: (data) => {
        console.log('🔍 Occupied units count API response:', data);
      },
      onError: (error) => {
        console.error('❌ Error fetching occupied units count:', error);
        console.error('❌ Error details:', error.response?.data);
      },
      staleTime: 0, // Always fetch fresh data
      cacheTime: 0, // Don't cache
      refetchOnWindowFocus: true,
      refetchOnMount: true
    }
  );

  // Fetch invoices
  const { data: invoicesData, isLoading, error } = useQuery(
    'invoices',
    () => invoicesAPI.getAll(),
    {
      onSuccess: (data) => {
        console.log('Invoices fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching invoices:', error);
      }
    }
  );

  // Generate rent invoices mutation
  const generateRentMutation = useMutation(
    (data) => invoicesAPI.generateRent(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('invoices');
        setShowGenerateModal(false);
        setGenerateData({ periodStart: '', periodEnd: '', dueDate: '' });
        
        const { data, skippedUnits, summary } = response.data;
        let message = `Successfully generated ${data.length} rent invoices!`;
        
        if (skippedUnits && skippedUnits.length > 0) {
          message += `\n\nSkipped ${skippedUnits.length} units:`;
          skippedUnits.forEach(unit => {
            message += `\n• Unit ${unit.unitNumber} (${unit.property}): ${unit.reason}`;
          });
        }
        
        alert(message);
      },
      onError: (error) => {
        console.error('Error generating rent invoices:', error);
        const errorMessage = error.response?.data?.message || 'Failed to generate rent invoices. Please try again.';
        alert(`Error: ${errorMessage}`);
      }
    }
  );

  // Update invoice mutation
  const updateInvoiceMutation = useMutation(
    ({ id, data }) => invoicesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
      },
    }
  );

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation(
    (id) => invoicesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
      },
    }
  );

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    (settingsData) => settingsAPI.update(settingsData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        queryClient.invalidateQueries('cronStatus');
        setShowSettingsModal(false);
        alert('Settings updated successfully!');
      },
      onError: (error) => {
        console.error('Error updating settings:', error);
        alert('Failed to update settings');
      }
    }
  );

  // Fix rental unit status mutation
  const fixStatusMutation = useMutation(
    () => rentalUnitsAPI.fixStatus(),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('occupiedUnitsCount');
        alert(`Successfully fixed ${response.data.fixed} rental unit statuses!`);
      },
      onError: (error) => {
        console.error('Error fixing rental unit status:', error);
        alert('Failed to fix rental unit statuses');
      }
    }
  );

  const invoices = invoicesData?.data?.data || [];

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.rentalUnit?.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.tenant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.tenant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleGenerateRent = () => {
    console.log('Generate data:', generateData);
    
    if (!generateData.periodStart || !generateData.periodEnd || !generateData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate dates
    const startDate = new Date(generateData.periodStart);
    const endDate = new Date(generateData.periodEnd);
    const dueDate = new Date(generateData.dueDate);

    if (startDate >= endDate) {
      alert('Period start date must be before period end date');
      return;
    }

    if (dueDate < endDate) {
      alert('Due date should be on or after the period end date');
      return;
    }

    // Confirm generation
    const confirmMessage = `Generate rent invoices for the period ${generateData.periodStart} to ${generateData.periodEnd}?\n\nThis will create invoices for all occupied rental units.`;
    if (window.confirm(confirmMessage)) {
      console.log('Sending generate request with data:', generateData);
      generateRentMutation.mutate(generateData);
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoiceId,
        data: { status: newStatus }
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoiceMutation.mutateAsync(invoiceId);
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const response = await invoicesAPI.downloadPDF(invoiceId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const handleSendEmail = async (invoiceId) => {
    try {
      await invoicesAPI.sendEmail(invoiceId);
      alert('Invoice sent successfully!');
      queryClient.invalidateQueries('invoices');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const handleTriggerMonthlyGeneration = async () => {
    if (window.confirm('This will generate rent invoices for all occupied units for the current month. Continue?')) {
      try {
        await invoicesAPI.triggerMonthlyGeneration();
        alert('Monthly rent generation triggered successfully!');
        queryClient.invalidateQueries('invoices');
        queryClient.invalidateQueries('cronStatus');
      } catch (error) {
        console.error('Error triggering monthly generation:', error);
        alert('Failed to trigger monthly generation');
      }
    }
  };

  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate({
      rentSettings: rentSettings
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'sent': return <Mail className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount, currency = 'MVR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'MVR' ? 'USD' : currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rent Management</h1>
          <p className="text-gray-600 mt-2">Manage rent invoices and payments</p>
          {cronStatusData?.data && (
            <div className="mt-2 text-sm text-gray-500">
              <span className="inline-flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {cronStatusData.data.nextRun ? (
                  <>Next auto-generation: {new Date(cronStatusData.data.nextRun).toLocaleString()}</>
                ) : (
                  <>Auto-generation: {cronStatusData.data.running ? 'Running' : 'Not scheduled'}</>
                )}
              </span>
              {cronStatusData.data.settingsInfo && (
                <div className="mt-1 text-xs text-gray-400">
                  Generation day: {cronStatusData.data.settingsInfo.generationDay}, 
                  Auto-generate: {cronStatusData.data.settingsInfo.autoGenerate ? 'Yes' : 'No'}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowSettingsModal(true)}
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Auto-Generation Settings
          </Button>
          {occupiedUnitsData?.data?.count === 0 && (
            <Button
              onClick={() => fixStatusMutation.mutate()}
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
              disabled={fixStatusMutation.isLoading}
            >
              <Users className="w-5 h-5 mr-2" />
              {fixStatusMutation.isLoading ? 'Fixing...' : 'Fix Unit Status'}
            </Button>
          )}
          <Button
            onClick={handleTriggerMonthlyGeneration}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Trigger Monthly Generation
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                console.log('🔄 Manually refreshing occupied units count...');
                queryClient.invalidateQueries('occupiedUnitsCount');
              }}
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              🔄 Refresh Units Count
            </Button>
            <Button
              onClick={() => setShowGenerateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Generate Rent Invoices
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(inv => inv.status === 'overdue').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search invoices by number, property, unit, or tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'sent', label: 'Sent' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              placeholder="Filter by status"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-600">Generate rent invoices to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property & Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
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
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.invoiceNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(invoice.invoiceDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.property?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Unit {invoice.rentalUnit?.unitNumber}, Floor {invoice.rentalUnit?.floorNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.tenant?.firstName} {invoice.tenant?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.tenant?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(invoice.period?.startDate)} - {formatDate(invoice.period?.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowDetailsModal(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(invoice._id)}
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendEmail(invoice._id)}
                            disabled={!invoice.tenant?.email}
                            title={invoice.tenant?.email ? "Send Email" : "No tenant email"}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Select
                            value={invoice.status}
                            onChange={(e) => handleStatusChange(invoice._id, e.target.value)}
                            options={[
                              { value: 'draft', label: 'Draft' },
                              { value: 'sent', label: 'Sent' },
                              { value: 'paid', label: 'Paid' },
                              { value: 'overdue', label: 'Overdue' },
                              { value: 'cancelled', label: 'Cancelled' }
                            ]}
                            className="w-32"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice._id)}
                            disabled={invoice.status !== 'draft'}
                            title="Delete Invoice"
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

      {/* Generate Rent Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Rent Invoices</h3>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                This will generate rent invoices for all occupied rental units with valid rent amounts.
                Existing invoices for the same period will be skipped.
              </p>
              {occupiedUnitsData?.data && (
                <p className="text-xs text-blue-600 mt-1">
                  {occupiedUnitsData.data.count > 0 
                    ? `Found ${occupiedUnitsData.data.count} occupied rental units ready for invoice generation.`
                    : 'No occupied rental units found. Please assign tenants to rental units first.'
                  }
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Start Date
                </label>
                <Input
                  type="date"
                  value={generateData.periodStart}
                  onChange={(e) => setGenerateData(prev => ({ ...prev, periodStart: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period End Date
                </label>
                <Input
                  type="date"
                  value={generateData.periodEnd}
                  onChange={(e) => setGenerateData(prev => ({ ...prev, periodEnd: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={generateData.dueDate}
                  onChange={(e) => setGenerateData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowGenerateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateRent}
                disabled={generateRentMutation.isLoading || (occupiedUnitsData?.data?.count === 0)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {generateRentMutation.isLoading ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Invoice {selectedInvoice.invoiceNumber}
              </h3>
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property</label>
                  <p className="text-gray-900">{selectedInvoice.property?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <p className="text-gray-900">
                    Unit {selectedInvoice.rentalUnit?.unitNumber}, Floor {selectedInvoice.rentalUnit?.floorNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tenant</label>
                  <p className="text-gray-900">
                    {selectedInvoice.tenant?.firstName} {selectedInvoice.tenant?.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <Badge className={`${getStatusColor(selectedInvoice.status)} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(selectedInvoice.status)}
                    {selectedInvoice.status}
                  </Badge>
                </div>
              </div>
              
              {/* Invoice Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Description</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Unit Price</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items?.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.unitPrice, selectedInvoice.currency)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.amount, selectedInvoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Invoice Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(selectedInvoice.tax, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-900">Total:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => handleDownloadPDF(selectedInvoice._id)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleSendEmail(selectedInvoice._id)}
                  disabled={!selectedInvoice.tenant?.email}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Generation Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Auto-Generation Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Generate Rent Invoices
                </label>
                <Select
                  value={rentSettings.autoGenerateRent}
                  onChange={(e) => setRentSettings(prev => ({ 
                    ...prev, 
                    autoGenerateRent: e.target.value === 'true' 
                  }))}
                  options={[
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                  ]}
                  placeholder="Auto generate rent invoices"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rent Generation Day (1-31)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={rentSettings.rentGenerationDay}
                  onChange={(e) => setRentSettings(prev => ({ 
                    ...prev, 
                    rentGenerationDay: parseInt(e.target.value) 
                  }))}
                  placeholder="Day of month to generate rent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rent Due Days
                </label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={rentSettings.rentDueDays}
                  onChange={(e) => setRentSettings(prev => ({ 
                    ...prev, 
                    rentDueDays: parseInt(e.target.value) 
                  }))}
                  placeholder="Days after generation when rent is due"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSettingsModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSettings}
                disabled={updateSettingsMutation.isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updateSettingsMutation.isLoading ? 'Updating...' : 'Update Settings'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rent;
