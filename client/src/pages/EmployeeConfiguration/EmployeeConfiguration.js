import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  UserCheck,
  UserX,
  LogOut,
  Key,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { usersAPI, rolesAPI } from '../../services/api';

const EmployeeConfiguration = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const queryClient = useQueryClient();

  // User form data
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    mobile: '',
    idCardNumber: '',
    assignedProperties: []
  });

  // Role form data
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: []
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery(
    'users',
    () => usersAPI.getAll(),
    {
      onError: (error) => {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users');
      }
    }
  );

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery(
    'roles',
    () => rolesAPI.getAll(),
    {
      onError: (error) => {
        console.error('Error fetching roles:', error);
        toast.error('Failed to fetch roles');
      }
    }
  );

  // User mutations
  const createUserMutation = useMutation(
    (data) => usersAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setShowCreateUserModal(false);
        resetUserForm();
        toast.success('User created successfully!');
      },
      onError: (error) => {
        console.error('Error creating user:', error);
        const errorMessage = error.response?.data?.message || 'Failed to create user';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  const updateUserMutation = useMutation(
    ({ id, data }) => usersAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setShowEditUserModal(false);
        setEditingUser(null);
        toast.success('User updated successfully!');
      },
      onError: (error) => {
        console.error('Error updating user:', error);
        const errorMessage = error.response?.data?.message || 'Failed to update user';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  const deleteUserMutation = useMutation(
    (id) => usersAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User deleted successfully!');
      },
      onError: (error) => {
        console.error('Error deleting user:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete user';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  const toggleUserStatusMutation = useMutation(
    (id) => usersAPI.toggleStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User status updated successfully!');
      },
      onError: (error) => {
        console.error('Error toggling user status:', error);
        const errorMessage = error.response?.data?.message || 'Failed to update user status';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  const endSessionMutation = useMutation(
    (id) => usersAPI.endSession(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User session ended successfully!');
      },
      onError: (error) => {
        console.error('Error ending user session:', error);
        const errorMessage = error.response?.data?.message || 'Failed to end user session';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  // Role mutations
  const createRoleMutation = useMutation(
    (data) => rolesAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roles');
        setShowCreateRoleModal(false);
        resetRoleForm();
        toast.success('Role created successfully!');
      },
      onError: (error) => {
        console.error('Error creating role:', error);
        const errorMessage = error.response?.data?.message || 'Failed to create role';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  const updateRoleMutation = useMutation(
    ({ id, data }) => rolesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roles');
        setShowEditRoleModal(false);
        setEditingRole(null);
        toast.success('Role updated successfully!');
      },
      onError: (error) => {
        console.error('Error updating role:', error);
        const errorMessage = error.response?.data?.message || 'Failed to update role';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  const deleteRoleMutation = useMutation(
    (id) => rolesAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roles');
        toast.success('Role deleted successfully!');
      },
      onError: (error) => {
        console.error('Error deleting role:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete role';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  const users = usersData?.data?.data || [];
  const roles = rolesData?.data?.data || [];

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive) ||
                         (statusFilter === 'online' && user.isOnline);
    return matchesSearch && matchesStatus;
  });

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      mobile: '',
      idCardNumber: '',
      assignedProperties: []
    });
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: []
    });
  };

  const handleCreateUser = () => {
    if (!userFormData.name.trim() || !userFormData.email.trim() || !userFormData.password.trim() || !userFormData.role) {
      toast.error('Name, email, password, and role are required');
      return;
    }
    createUserMutation.mutate(userFormData);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role._id,
      mobile: user.mobile || '',
      idCardNumber: user.idCardNumber || '',
      assignedProperties: user.assignedProperties.map(p => p._id)
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = () => {
    if (!userFormData.name.trim() || !userFormData.email.trim() || !userFormData.role) {
      toast.error('Name, email, and role are required');
      return;
    }
    updateUserMutation.mutate({
      id: editingUser._id,
      data: userFormData
    });
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete "${user.name}"?`)) {
      deleteUserMutation.mutate(user._id);
    }
  };

  const handleToggleUserStatus = async (user) => {
    if (window.confirm(`${user.isActive ? 'Deactivate' : 'Activate'} "${user.name}"?`)) {
      toggleUserStatusMutation.mutate(user._id);
    }
  };

  const handleEndSession = async (user) => {
    if (window.confirm(`End session for "${user.name}"?`)) {
      endSessionMutation.mutate(user._id);
    }
  };

  const handleCreateRole = () => {
    if (!roleFormData.name.trim() || !roleFormData.displayName.trim()) {
      toast.error('Role name and display name are required');
      return;
    }
    createRoleMutation.mutate(roleFormData);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowEditRoleModal(true);
  };

  const handleUpdateRole = () => {
    if (!roleFormData.name.trim() || !roleFormData.displayName.trim()) {
      toast.error('Role name and display name are required');
      return;
    }
    updateRoleMutation.mutate({
      id: editingRole._id,
      data: roleFormData
    });
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystem) {
      toast.error('Cannot delete system roles');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${role.displayName}"?`)) {
      deleteRoleMutation.mutate(role._id);
    }
  };

  const handleUserInputChange = (field, value) => {
    setUserFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRoleInputChange = (field, value) => {
    setRoleFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (usersLoading || rolesLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Configuration</h1>
          <p className="text-gray-600 mt-2">Manage users, roles, and permissions</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowCreateUserModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add User
          </Button>
          <Button
            onClick={() => setShowCreateRoleModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Shield className="w-5 h-5 mr-2" />
            Add Role
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="w-5 h-5 inline mr-2" />
            Roles ({roles.length})
          </button>
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.isActive).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <UserX className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inactive</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => !u.isActive).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <LogOut className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Online</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.isOnline).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Users' },
                      { value: 'active', label: 'Active Only' },
                      { value: 'inactive', label: 'Inactive Only' },
                      { value: 'online', label: 'Online Only' }
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">Add users to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className="bg-blue-100 text-blue-800">
                              {user.role?.displayName || 'No Role'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              {user.isOnline && (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  Online
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleUserStatus(user)}
                                title={user.isActive ? "Deactivate" : "Activate"}
                                className={user.isActive ? "text-red-600" : "text-green-600"}
                              >
                                {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                              {user.isOnline && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEndSession(user)}
                                  title="End Session"
                                  className="text-orange-600"
                                >
                                  <LogOut className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                title="Delete"
                                className="text-red-600"
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
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
                  <p className="text-gray-600">Add roles to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {roles.map((role) => (
                        <tr key={role._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Shield className="w-5 h-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {role.displayName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {role.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {role.description || 'No description'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={role.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {role.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {role.isSystem && (
                              <Badge className="bg-purple-100 text-purple-800 ml-2">
                                System
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {/* This would need to be fetched separately or included in the role data */}
                            0 users
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRole(role)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRole(role)}
                                title="Edit"
                                disabled={role.isSystem}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRole(role)}
                                title="Delete"
                                disabled={role.isSystem}
                                className="text-red-600"
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
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <Input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => handleUserInputChange('name', e.target.value)}
                  placeholder="Full Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => handleUserInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => handleUserInputChange('password', e.target.value)}
                  placeholder="Password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <Select
                  value={userFormData.role}
                  onChange={(e) => handleUserInputChange('role', e.target.value)}
                  options={[
                    { value: '', label: 'Select a role' },
                    ...roles.filter(r => r.isActive).map(role => ({
                      value: role._id,
                      label: role.displayName
                    }))
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile
                </label>
                <Input
                  type="text"
                  value={userFormData.mobile}
                  onChange={(e) => handleUserInputChange('mobile', e.target.value)}
                  placeholder="Mobile Number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Card Number
                </label>
                <Input
                  type="text"
                  value={userFormData.idCardNumber}
                  onChange={(e) => handleUserInputChange('idCardNumber', e.target.value)}
                  placeholder="ID Card Number"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateUserModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={createUserMutation.isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createUserMutation.isLoading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Role</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name *
                </label>
                <Input
                  type="text"
                  value={roleFormData.name}
                  onChange={(e) => handleRoleInputChange('name', e.target.value)}
                  placeholder="admin, manager, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <Input
                  type="text"
                  value={roleFormData.displayName}
                  onChange={(e) => handleRoleInputChange('displayName', e.target.value)}
                  placeholder="Administrator, Manager, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={roleFormData.description}
                  onChange={(e) => handleRoleInputChange('description', e.target.value)}
                  placeholder="Role description..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateRoleModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={createRoleMutation.isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {createRoleMutation.isLoading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <Input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => handleUserInputChange('name', e.target.value)}
                  placeholder="Full Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => handleUserInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <Select
                  value={userFormData.role}
                  onChange={(e) => handleUserInputChange('role', e.target.value)}
                  options={[
                    { value: '', label: 'Select a role' },
                    ...roles.filter(r => r.isActive).map(role => ({
                      value: role._id,
                      label: role.displayName
                    }))
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile
                </label>
                <Input
                  type="text"
                  value={userFormData.mobile}
                  onChange={(e) => handleUserInputChange('mobile', e.target.value)}
                  placeholder="Mobile Number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Card Number
                </label>
                <Input
                  type="text"
                  value={userFormData.idCardNumber}
                  onChange={(e) => handleUserInputChange('idCardNumber', e.target.value)}
                  placeholder="ID Card Number"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditUserModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateUserMutation.isLoading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Role</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name *
                </label>
                <Input
                  type="text"
                  value={roleFormData.name}
                  onChange={(e) => handleRoleInputChange('name', e.target.value)}
                  placeholder="admin, manager, etc."
                  disabled={editingRole.isSystem}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <Input
                  type="text"
                  value={roleFormData.displayName}
                  onChange={(e) => handleRoleInputChange('displayName', e.target.value)}
                  placeholder="Administrator, Manager, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={roleFormData.description}
                  onChange={(e) => handleRoleInputChange('description', e.target.value)}
                  placeholder="Role description..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditRoleModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={updateRoleMutation.isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {updateRoleMutation.isLoading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeConfiguration;



