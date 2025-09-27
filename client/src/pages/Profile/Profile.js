import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="label">Name</label>
              <p className="text-gray-900">{user?.name}</p>
            </div>
            <div>
              <label className="label">Email</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="label">Role</label>
              <p className="text-gray-900 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="label">Last Login</label>
              <p className="text-gray-900">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              Edit Profile
            </Button>
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
            <Button variant="destructive" className="w-full" onClick={logout}>
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
