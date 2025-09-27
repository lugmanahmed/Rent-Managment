import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, DollarSign, Edit, Trash2, Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { tenantsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import TenantForm from '../../components/Tenants/TenantForm';
import toast from 'react-hot-toast';

const TenantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const queryClient = useQueryClient();
  const isNewTenant = !id;

  const { data, isLoading, error } = useQuery(
    ['tenant', id],
    () => tenantsAPI.getById(id),
    {
      enabled: !!id,
      select: (data) => data.data.tenant
    }
  );

  const deleteMutation = useMutation(
    (id) => tenantsAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
        toast.success('Tenant deleted successfully!');
        navigate('/tenants');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete tenant');
      },
    }
  );

  const addNoteMutation = useMutation(
    ({ id, note }) => tenantsAPI.addNote(id, note),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tenant', id]);
        toast.success('Note added successfully!');
        setNewNote('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add note');
      },
    }
  );

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (newNote.trim()) {
      addNoteMutation.mutate({ id, note: newNote });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount, currency = 'MVR') => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

  if (isNewTenant) {
    return <TenantForm onClose={() => navigate('/tenants')} />;
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tenant not found</h3>
        <p className="text-gray-600 mb-4">The tenant you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/tenants')}>Back to Tenants</Button>
      </div>
    );
  }


  const isAdmin = user?.role === 'admin';


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/tenants">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {data?.firstName || 'Unknown'} {data?.lastName || 'Tenant'}
            </h1>
            <Badge className={getStatusColor(data?.status || 'unknown')}>
              {data?.status || 'unknown'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">Tenant Details</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔧 Edit button clicked');
                console.log('🔧 Current tenant data:', data);
                console.log('🔧 Setting showEditModal to true');
                setShowEditModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-gray-900">{data?.firstName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-gray-900">{data?.lastName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {data?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {data?.phone || 'N/A'}
                  </p>
                </div>
                {data.idNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID Number</label>
                    <p className="text-gray-900">{data.idNumber}</p>
                  </div>
                )}
                {data.idType && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID Type</label>
                    <p className="text-gray-900">{data.idType === 'national_id' ? 'National ID' : 'Passport'}</p>
                  </div>
                )}
                {data.nationality && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nationality</label>
                    <p className="text-gray-900">{data.nationality}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lease Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lease Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.rentalUnits && data.rentalUnits.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Properties</label>
                    <div className="space-y-1">
                      {[...new Set(data.rentalUnits.map(unit => unit.property?.name))].map((propertyName, index) => (
                        <p key={index} className="text-gray-900 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {propertyName}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {data.rentalUnits && data.rentalUnits.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rental Units</label>
                    <div className="space-y-1">
                      {data.rentalUnits.map((unit, index) => (
                        <p key={index} className="text-gray-900">
                          Unit {unit.unitNumber} (Floor {unit.floorNumber}) - {unit.property?.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Lease Start</label>
                  <p className="text-gray-900">{data?.leaseInfo?.startDate ? formatDate(data.leaseInfo.startDate) : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Lease End</label>
                  <p className="text-gray-900">{data?.leaseInfo?.endDate ? formatDate(data.leaseInfo.endDate) : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Monthly Rent</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {data?.leaseInfo?.monthlyRent ? formatCurrency(data.leaseInfo.monthlyRent, data.leaseInfo.currency) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Security Deposit</label>
                  <p className="text-gray-900">{data?.leaseInfo?.securityDeposit ? formatCurrency(data.leaseInfo.securityDeposit, data.leaseInfo.currency) : 'N/A'}</p>
                </div>
                {data.leaseInfo.agreementAttachment && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Lease Agreement</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {data.leaseInfo.agreementAttachment.fileName}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 input"
                  />
                  <Button type="submit" disabled={!newNote.trim() || addNoteMutation.isLoading}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              {data.notes && data.notes.length > 0 ? (
                <div className="space-y-3">
                  {data.notes.map((note, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50">
                      <p className="text-gray-900">{note.text}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>By {note.createdBy?.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No notes yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Emergency Contact */}
          {data.emergencyContact && (
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{data.emergencyContact.name}</p>
                  <p className="text-sm text-gray-600">{data.emergencyContact.relationship}</p>
                  <p className="text-sm text-gray-600">{data.emergencyContact.phone}</p>
                  {data.emergencyContact.email && (
                    <p className="text-sm text-gray-600">{data.emergencyContact.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.occupation && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Occupation</label>
                    <p className="text-gray-900">{data.occupation}</p>
                  </div>
                )}
                {data.employer && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employer</label>
                    <p className="text-gray-900">{data.employer}</p>
                  </div>
                )}
                {data.pets && data.pets.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pets</label>
                    <div className="space-y-1">
                      {data.pets.map((pet, index) => (
                        <p key={index} className="text-gray-900">
                          {pet.name} ({pet.type})
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Tenant Modal */}
      {showEditModal && data && (
        <div>
          {console.log('🔧 Rendering TenantForm modal with data:', data)}
          <TenantForm
            tenant={data}
            onClose={() => {
              console.log('🔧 Closing edit modal');
              setShowEditModal(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TenantDetails;
