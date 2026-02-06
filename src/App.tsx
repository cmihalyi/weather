import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Layout from "@/components/layout"
import { ThemeProvider } from "./context/theme-provider"
import Dashboard from "./pages/dashboard"
import CityPage from "./pages/city-page"
import LoginPage from "./pages/login"
import { useAuth } from "@/hooks/use-auth"

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
          <Route
            path="/city/:cityName"
            element={
              user ? (
                <Layout>
                  <CityPage />
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
