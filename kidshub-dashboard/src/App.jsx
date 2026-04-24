import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';
import Children from './pages/Children';
import ChildProfile from './pages/ChildProfile';
import Classrooms from './pages/Classrooms';
import Staff from './pages/Staff';
import Parents from './pages/Parents';
import Messages from './pages/Messages';
import Schedule from './pages/Schedule';
import CheckIn from './pages/CheckIn';
import Activities from './pages/Activities';
import Announcements from './pages/Announcements';
import Settings from './pages/Settings';
import Plans from './pages/Plans';
import Reports from './pages/Reports';
import VideoSurveillance from './pages/VideoSurveillance';
import Unlock from './pages/Unlock';
import Welcome from './pages/Welcome';
import Paywall from './pages/Paywall';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Onboarding wizard (new-owner journey, stop 2). Register.jsx
             lands new owners here after signup; existing owners can
             always return here to pick up unfinished setup steps. */}
          <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
          
          {/* Children Routes */}
          <Route path="/children" element={<ProtectedRoute><Children /></ProtectedRoute>} />
          <Route path="/children/:id" element={<ProtectedRoute><ChildProfile /></ProtectedRoute>} />
          
          {/* Classrooms Routes */}
          <Route path="/classrooms" element={<ProtectedRoute><Classrooms /></ProtectedRoute>} />
          <Route path="/classrooms/:id" element={<ProtectedRoute><Classrooms /></ProtectedRoute>} />
          
          {/* Staff Route */}
          <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />

          {/* Parents Route */}
          <Route path="/parents" element={<ProtectedRoute><Parents /></ProtectedRoute>} />

          {/* Messages Route */}
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          
          {/* Schedule Route */}
          <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
          
          {/* Check In/Out Route */}
          <Route path="/check-in" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
          
          {/* Activities Routes */}
          <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
          <Route path="/activities/new" element={<ProtectedRoute><Activities /></ProtectedRoute>} />

          {/* Announcements Route */}
          <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />

          {/* Settings Route */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Reports Route (Sprint 6-7 / D2, D3, D5) */}
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

          <Route path="/video-surveillance" element={<ProtectedRoute><VideoSurveillance /></ProtectedRoute>} />

          <Route path="/unlock" element={<ProtectedRoute><Unlock /></ProtectedRoute>} />

          {/* Plans / upgrade Route — exempt from the /paywall redirect
             (see ProtectedRoute.PAYWALL_EXEMPT_PATHS) so expired owners
             can still review tiers before contacting sales. */}
          <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />

          {/* Paywall — full-screen lock page for owners whose 60-day
             Starter free window has elapsed. ProtectedRoute redirects
             every non-exempt dashboard route here. Exempt itself so
             the redirect doesn't loop; still owner-gated via
             <ProtectedRoute> to prevent logged-out / wrong-role users
             from viewing it. */}
          <Route path="/paywall" element={<ProtectedRoute><Paywall /></ProtectedRoute>} />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
