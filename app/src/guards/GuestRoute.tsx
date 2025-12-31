import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

import { ROUTE_HOME } from '../constants/routes';

interface GuestRouteProps {
  children: React.ReactNode;
}

interface LocationState {
  from?: {
    pathname: string;
  };
}

/**
 * GuestRoute - Guards routes that should only be accessible to unauthenticated users
 * Examples: Login, Register, Forgot Password pages
 * Redirects authenticated users to their intended destination or home
 */
export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const state = location.state as LocationState;

  if (isAuthenticated) {
    const from = state?.from?.pathname || ROUTE_HOME;

    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
