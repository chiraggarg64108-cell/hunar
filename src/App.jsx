import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import VoiceBuilderPage from './pages/VoiceBuilderPage'
import PublicProfilePage from './pages/PublicProfilePage'
import DirectoryPage from './pages/DirectoryPage'
import MyCardPage from './pages/MyCardPage'
import SettingsPage from './pages/SettingsPage'

// Protected Route helper
function RequireAuth({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Root redirect
function RootRoute() {
  const { currentUser } = useAuth()
  return currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="max-w-md mx-auto min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased transition-colors shadow-2xl relative">
              <Routes>
                <Route path="/" element={<RootRoute />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireAuth>
                      <DashboardPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/builder"
                  element={
                    <RequireAuth>
                      <VoiceBuilderPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/my-card"
                  element={
                    <RequireAuth>
                      <MyCardPage />
                    </RequireAuth>
                  }
                />
                <Route path="/profile/:id" element={<PublicProfilePage />} />
                <Route path="/directory" element={<DirectoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
