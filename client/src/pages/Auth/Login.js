import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleDebugUsers = async () => {
    try {
      console.log('🔍 Debugging users...');
      const response = await fetch('http://localhost:5000/api/auth/debug/users');
      const data = await response.json();
      console.log('📊 Debug response:', data);
      alert(`Found ${data.totalUsers} users. Check console for details.`);
    } catch (error) {
      console.error('❌ Debug error:', error);
      alert('Failed to debug users. Check console for error.');
    }
  };

  const handleTestLogin = async () => {
    try {
      console.log('🧪 Testing login API...');
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword'
        })
      });
      const data = await response.json();
      console.log('🧪 Test login response:', data);
      alert(`Test login response: ${response.status} - ${data.message || 'Success'}`);
    } catch (error) {
      console.error('❌ Test login error:', error);
      alert('Test login failed. Check console for error.');
    }
  };

  const onSubmit = async (data) => {
    if (loading) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login submission error:', error);
      toast.error('An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your property management dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={errors.email?.message}
                  placeholder="Enter your email"
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  error={errors.password?.message}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Debug Buttons */}
          <div className="mt-4 text-center space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDebugUsers}
              className="text-orange-600 border-orange-600 hover:bg-orange-50 w-full"
            >
              🔍 Debug Users
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestLogin}
              className="text-blue-600 border-blue-600 hover:bg-blue-50 w-full"
            >
              🧪 Test Login API
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
