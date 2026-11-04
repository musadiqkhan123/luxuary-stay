import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Spinner from '../components/ui/Spinner.jsx';
import PublicLayout from '../components/layout/PublicLayout.jsx';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { FRONT_OFFICE, MANAGEMENT, STAFF_ROLES } from '../utils/constants.js';

import Home from '../pages/public/Home.jsx';
import Rooms from '../pages/public/Rooms.jsx';
import RoomDetail from '../pages/public/RoomDetail.jsx';
import About from '../pages/public/About.jsx';
import NotFound from '../pages/public/NotFound.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';

// Dashboard pages are loaded on demand, so website visitors download less
const Overview = lazy(() => import('../pages/dashboard/Overview.jsx'));
const FrontDesk = lazy(() => import('../pages/dashboard/FrontDesk.jsx'));
const RoomBoard = lazy(() => import('../pages/dashboard/RoomBoard.jsx'));
const Bookings = lazy(() => import('../pages/dashboard/Bookings.jsx'));
const BookingDetail = lazy(() => import('../pages/dashboard/BookingDetail.jsx'));
const Guests = lazy(() => import('../pages/dashboard/Guests.jsx'));
const Invoices = lazy(() => import('../pages/dashboard/Invoices.jsx'));
const InvoiceDetail = lazy(() => import('../pages/dashboard/InvoiceDetail.jsx'));
const ServiceRequests = lazy(() => import('../pages/dashboard/ServiceRequests.jsx'));
const Housekeeping = lazy(() => import('../pages/dashboard/Housekeeping.jsx'));
const Maintenance = lazy(() => import('../pages/dashboard/Maintenance.jsx'));
const Feedback = lazy(() => import('../pages/dashboard/Feedback.jsx'));
const Reports = lazy(() => import('../pages/dashboard/Reports.jsx'));
const Users = lazy(() => import('../pages/dashboard/Users.jsx'));
const Settings = lazy(() => import('../pages/dashboard/Settings.jsx'));
const Notifications = lazy(() => import('../pages/dashboard/Notifications.jsx'));
const Profile = lazy(() => import('../pages/dashboard/Profile.jsx'));

const GuestOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:id" element={<RoomDetail />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* Sign-in screens have their own full-screen layout */}
      <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
      <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<Spinner />}><DashboardLayout /></Suspense></ProtectedRoute>}>
        <Route index element={<Overview />} />
        <Route path="front-desk" element={<ProtectedRoute roles={FRONT_OFFICE}><FrontDesk /></ProtectedRoute>} />
        <Route path="rooms" element={<ProtectedRoute roles={STAFF_ROLES}><RoomBoard /></ProtectedRoute>} />
        <Route path="bookings" element={<ProtectedRoute roles={[...FRONT_OFFICE, 'guest']}><Bookings /></ProtectedRoute>} />
        <Route path="bookings/:id" element={<ProtectedRoute roles={[...FRONT_OFFICE, 'guest']}><BookingDetail /></ProtectedRoute>} />
        <Route path="guests" element={<ProtectedRoute roles={FRONT_OFFICE}><Guests /></ProtectedRoute>} />
        <Route path="invoices" element={<ProtectedRoute roles={[...FRONT_OFFICE, 'guest']}><Invoices /></ProtectedRoute>} />
        <Route path="invoices/:id" element={<ProtectedRoute roles={[...FRONT_OFFICE, 'guest']}><InvoiceDetail /></ProtectedRoute>} />
        <Route path="services" element={<ServiceRequests />} />
        <Route path="housekeeping" element={<ProtectedRoute roles={STAFF_ROLES}><Housekeeping /></ProtectedRoute>} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="feedback" element={<ProtectedRoute roles={[...FRONT_OFFICE, 'guest']}><Feedback /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={MANAGEMENT}><Reports /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
