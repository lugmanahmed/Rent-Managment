import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Building2, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Wrench,
  Plus,
  Settings,
  Home,
  CreditCard,
  Package,
  BarChart3,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { reportsAPI } from '../../services/api';

const Dashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    () => reportsAPI.getDashboard(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-8" />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading dashboard data</p>
      </div>
    );
  }

  const { summary, financial, maintenance } = dashboardData?.data || {};

  const stats = [
    {
      name: 'Total Properties',
      value: summary?.totalProperties || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Occupied Properties',
      value: summary?.occupiedProperties || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Monthly Income',
      value: `$${financial?.totalMonthlyRent?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Collection Rate',
      value: `${financial?.collectionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ];

  const alerts = [
    {
      name: 'Overdue Payments',
      value: financial?.overdueAmount || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      urgent: (financial?.overdueAmount || 0) > 0
    },
    {
      name: 'Pending Maintenance',
      value: maintenance?.pendingMaintenance || 0,
      icon: Wrench,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      urgent: (maintenance?.urgentMaintenance || 0) > 0
    },
    {
      name: 'Urgent Maintenance',
      value: maintenance?.urgentMaintenance || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      urgent: (maintenance?.urgentMaintenance || 0) > 0
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your rental properties.
        </p>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <Card key={alert.name} className={alert.urgent ? 'border-red-200' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${alert.bgColor}`}>
                    <Icon className={`h-6 w-6 ${alert.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{alert.name}</p>
                    <p className={`text-2xl font-semibold ${alert.urgent ? 'text-red-600' : 'text-gray-900'}`}>
                      {typeof alert.value === 'number' ? alert.value : alert.value}
                    </p>
                  </div>
                </div>
                {alert.urgent && (
                  <div className="mt-2">
                    <Badge variant="danger" size="sm">Requires Attention</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Property Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Occupancy Rate</span>
                <span className="text-lg font-semibold text-gray-900">
                  {summary?.occupancyRate || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ width: `${summary?.occupancyRate || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{summary?.occupiedProperties || 0} occupied</span>
                <span>{summary?.vacantProperties || 0} vacant</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Monthly Rent</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${financial?.totalMonthlyRent?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Paid This Month</span>
                <span className="text-lg font-semibold text-green-600">
                  ${financial?.paidRent?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-lg font-semibold text-yellow-600">
                  ${financial?.pendingRent?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overdue</span>
                <span className="text-lg font-semibold text-red-600">
                  ${financial?.overdueAmount?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              Maintenance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Requests</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {maintenance?.pendingMaintenance || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Urgent Issues</span>
                <span className="text-lg font-semibold text-red-600">
                  {maintenance?.urgentMaintenance || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed This Month</span>
                <span className="text-lg font-semibold text-green-600">
                  {maintenance?.completedMaintenance || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
