import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

/**
 * Get redirect URL based on user role
 */
export const getRoleRedirectUrl = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'reception':
      return '/reception/dashboard';
    case 'staff':
      return '/staff/dashboard';
    default:
      return '/dashboard';
  }
};

/**
 * Check if user has required role
 */
export const hasRole = (user: any, allowedRoles: string[]): boolean => {
  if (!user) return false;
  return allowedRoles.includes(user.role);
};

/**
 * Role Guard Component - Protects routes based on user role
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait for auth loading to complete
    if (loading) {
      return;
    }

    if (!user) {
      console.log('No user found, redirecting to login');
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      console.log(`User role ${user.role} not in allowed roles:`, allowedRoles);
      toast.error('Access denied. You do not have permission to view this page.');
      navigate(getRoleRedirectUrl(user.role));
      return;
    }

    console.log('Access granted for role:', user.role);
    setChecked(true);
  }, [user, loading, allowedRoles, navigate]);

  // Show loading spinner while checking authentication
  if (loading || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

/**
 * Admin Only Guard
 */
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RoleGuard allowedRoles={['admin']}>{children}</RoleGuard>;
};

/**
 * Reception Only Guard
 */
export const ReceptionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RoleGuard allowedRoles={['reception', 'admin']}>{children}</RoleGuard>;
};

/**
 * Staff Only Guard
 */
export const StaffGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RoleGuard allowedRoles={['staff', 'admin']}>{children}</RoleGuard>;
};

/**
 * Hook to check role access
 */
export const useRoleAccess = (allowedRoles: string[]) => {
  const { user } = useAuth();
  
  return {
    hasAccess: hasRole(user, allowedRoles),
    user,
    role: user?.role || null
  };
};
