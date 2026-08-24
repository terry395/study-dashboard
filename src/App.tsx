import { lazy, Suspense } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'
import { PageLoader } from '@/components/LoadingSpinner'
import { PageErrorBoundary } from '@/components/ErrorBoundary'

// Lazy-loaded pages for better performance
const Dashboard     = lazy(() => import('@/pages/Dashboard'))
const CalendarPage  = lazy(() => import('@/pages/Calendar'))
const Assignments   = lazy(() => import('@/pages/Assignments'))
const Tests         = lazy(() => import('@/pages/Tests'))
const Study         = lazy(() => import('@/pages/Study'))
const ModulesPage   = lazy(() => import('@/pages/Modules'))
const Settings      = lazy(() => import('@/pages/Settings'))
const Login         = lazy(() => import('@/pages/Login'))
const Register      = lazy(() => import('@/pages/Register'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))

// Redirects authenticated users away from auth pages
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

// Redirects unauthenticated users to /login
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={
          <AuthGuard><Login /></AuthGuard>
        } />
        <Route path="/register" element={
          <AuthGuard><Register /></AuthGuard>
        } />
        <Route path="/forgot-password" element={
          <AuthGuard><ForgotPassword /></AuthGuard>
        } />

        {/* App routes — protected */}
        <Route path="/" element={
          <ProtectedRoute><AppLayout /></ProtectedRoute>
        }>
          <Route index element={<PageErrorBoundary><Dashboard /></PageErrorBoundary>} />
          <Route path="calendar"    element={<PageErrorBoundary><CalendarPage /></PageErrorBoundary>} />
          <Route path="assignments" element={<PageErrorBoundary><Assignments /></PageErrorBoundary>} />
          <Route path="tests"       element={<PageErrorBoundary><Tests /></PageErrorBoundary>} />
          <Route path="study"       element={<PageErrorBoundary><Study /></PageErrorBoundary>} />
          <Route path="modules"     element={<PageErrorBoundary><ModulesPage /></PageErrorBoundary>} />
          <Route path="settings"    element={<PageErrorBoundary><Settings /></PageErrorBoundary>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
