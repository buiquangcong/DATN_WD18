import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';
import Trip from 'src/pages/client/trip';
import BookingSeats from 'src/pages/client/Booking';
import { ProtectedRoute } from './components/protected-route';

// ----------------------------------------------------------------------

export const DashboardPage = lazy(() => import('src/pages/admin/dashboard'));
export const BlogPage = lazy(() => import('src/pages/admin/blog'));
export const UserPage = lazy(() => import('src/pages/admin/user'));
export const LoginPage = lazy(() => import('src/pages/admin/auth/Login'));
export const ProductsPage = lazy(() => import('src/pages/admin/products'));
export const SearchResultsPage = lazy(() => import('src/pages/client/searchresults'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  {
    path: 'admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']} redirectTo="/login">
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'user', element: <UserPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'blog', element: <BlogPage /> },
    ],
  },


  {
    path: 'khachhang',
    element: (
      <Suspense fallback={renderFallback()}>
        <Outlet />
      </Suspense>
    ),
    children: [
      { path: 'trip', element: <Trip /> },
      { path: 'searchresults', element: <SearchResultsPage /> },
      { path: 'booking/:tripId', element: <BookingSeats /> },
    ],
  },

  {
    path: 'login',
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { 
    path: '*', 
    element: <Page404 /> 
  },
];