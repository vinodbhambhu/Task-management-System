import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Role dashboards
import AdminDashboard  from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

// Shared pages
import TaskDetail       from './pages/TaskDetail';
import SubmissionDetail from './pages/SubmissionDetail';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')   return <Navigate to="/admin"   replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/"         element={<RoleRedirect />} />
    <Route path="/login"    element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route path="/admin/*" element={
      <PrivateRoute roles={['admin']}>
        <AdminDashboard />
      </PrivateRoute>
    } />

    <Route path="/teacher/*" element={
      <PrivateRoute roles={['teacher']}>
        <TeacherDashboard />
      </PrivateRoute>
    } />

    <Route path="/student/*" element={
      <PrivateRoute roles={['student']}>
        <StudentDashboard />
      </PrivateRoute>
    } />

    <Route path="/tasks/:id" element={
      <PrivateRoute><TaskDetail /></PrivateRoute>
    } />
    <Route path="/submissions/:id" element={
      <PrivateRoute><SubmissionDetail /></PrivateRoute>
    } />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}