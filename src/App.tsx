import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Layout from "@app/components/layout"
import { ThemeProvider } from "@app/context/theme-provider"
import Dashboard from "@app/pages/dashboard"
import LoginPage from "@app/pages/login"
import { useAuth } from "@app/hooks/use-auth"
import AccountDetailsPage from "@app/pages/acccount-details"

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/accounts/:accountId/details" element={<AccountDetailsPage />} />
          <Route
            path="/dashboard"
            element={
              user ? (
                <Layout>
                  <Dashboard />
                </Layout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
