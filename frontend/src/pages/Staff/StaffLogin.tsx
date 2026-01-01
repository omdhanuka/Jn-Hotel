import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Briefcase, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const StaffLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      // Store token and user data
      const token = response.data.token;
      const user = response.data.user;

      if (!token) {
        throw new Error('No token received from server');
      }

      // Verify user is staff
      if (user.role !== 'staff') {
        setError('This portal is for staff members only');
        toast.error('Access denied. Staff members only.');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('✅ Staff login successful:', {
        token: token ? 'Token stored' : 'No token',
        tokenLength: token ? token.length : 0,
        user: `${user.firstName} ${user.lastName}`,
        role: user.role
      });

      toast.success('Welcome back!');
      navigate('/staff/dashboard');
    } catch (error: any) {
      console.error('❌ Staff login error:', error.response?.data);
      setError(error.response?.data?.message || 'Invalid email or password');
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full mb-4">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">JN Palace Hotel</h1>
          <p className="text-gray-600">Staff Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Staff Login</h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="staff@jnpalace.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-md hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Logging in...' : 'Login to Staff Portal'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link to="/" className="block text-sm text-blue-600 hover:text-blue-800">
              ← Back to Main Website
            </Link>
            <div className="text-xs text-gray-500">
              <p>Forgot your password? Contact your manager</p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Staff Access Only</p>
          <div className="mt-2 flex justify-center space-x-4">
            <Link to="/manager/login" className="text-blue-600 hover:underline">
              Manager Portal
            </Link>
            <span className="text-gray-400">•</span>
            <Link to="/admin/login" className="text-blue-600 hover:underline">
              Admin Portal
            </Link>
          </div>
        </div>

        {/* Quick Access Info */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Staff Portal Features</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• View and manage your assigned tasks</li>
            <li>• Upload work completion photos</li>
            <li>• Apply for leave and check balance</li>
            <li>• Track your performance metrics</li>
            <li>• Receive real-time notifications</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
