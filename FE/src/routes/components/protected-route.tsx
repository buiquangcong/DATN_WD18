import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectTo?: string;
  children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, redirectTo = '/login', children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  let isAuthenticated = false;
  let isAuthorized = true;
  let parsedUser: any = null;

  if (token && userString) {
    try {
      parsedUser = JSON.parse(userString);
      isAuthenticated = true;
      if (allowedRoles && !allowedRoles.includes(parsedUser?.role)) {
        isAuthorized = false;
      }
    } catch (error) {
      isAuthenticated = false;
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('ProtectedRoute: Unauthenticated. Redirecting to', redirectTo);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate(redirectTo, { replace: true });
    } else if (!isAuthorized) {
      console.log('ProtectedRoute: Unauthorized role', parsedUser?.role, '. Redirecting to /404');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/404', { replace: true });
    }
  }, [isAuthenticated, isAuthorized, navigate, redirectTo, parsedUser]);

  if (!isAuthenticated || !isAuthorized) {
    return null;
  }

  return children ? <>{children}</> : <Outlet />;
}
