import React from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Badge } from '../UI/Badge';

const TenantCard = ({ tenant }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'evicted':
        return 'bg-red-100 text-red-800';
      case 'moved_out':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaseStatus = () => {
    const now = new Date();
    const startDate = new Date(tenant.lease.startDate);
    const endDate = new Date(tenant.lease.endDate);
    
    if (now < startDate) return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' };
    if (now > endDate) return { status: 'expired', color: 'bg-red-100 text-red-800' };
    return { status: 'active', color: 'bg-green-100 text-green-800' };
  };

  const leaseStatus = getLeaseStatus();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {tenant.personalInfo.firstName} {tenant.personalInfo.lastName}
          </CardTitle>
          <div className="flex gap-2">
            <Badge className={getStatusColor(tenant.status)}>
              {tenant.status}
            </Badge>
            <Badge className={leaseStatus.color}>
              {leaseStatus.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{tenant.personalInfo.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{tenant.personalInfo.phone}</span>
          </div>
        </div>

        {/* Property Info */}
        {tenant.property && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{tenant.property.name}</span>
          </div>
        )}

        {/* Lease Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Lease: {new Date(tenant.lease.startDate).toLocaleDateString()} - {new Date(tenant.lease.endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Monthly Rent:</span>
            <span className="text-sm font-semibold text-gray-900">
              ${tenant.lease.monthlyRent.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Link
            to={`/tenants/${tenant._id}`}
            className="flex-1 btn btn-primary btn-sm"
          >
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantCard;
