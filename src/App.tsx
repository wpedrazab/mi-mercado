import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './app/providers/AuthProvider'
import { ProtectedRoute } from './app/routes/ProtectedRoute'
import { HomePage } from './app/routes/HomePage'
import { LoginPage } from './features/auth/LoginPage'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { UpdatePasswordPage } from './features/auth/UpdatePasswordPage'
import { AdminPanelPage } from './features/admin/AdminPanelPage'
import { FamilyManagementPage } from './features/family/FamilyManagementPage'
import { ShoppingListPage } from './features/shopping-list/ShoppingListPage'
import { CatalogsPage } from './features/catalogs/CatalogsPage'
import { StartPurchasePage } from './features/purchase/StartPurchasePage'
import { LivePurchasePage } from './features/purchase/LivePurchasePage'
import { PurchaseSummaryPage } from './features/purchase/PurchaseSummaryPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
          <Route path="/actualizar-password" element={<UpdatePasswordPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPanelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/familias/:familyId"
            element={
              <ProtectedRoute roles={['admin']}>
                <FamilyManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/familia"
            element={
              <ProtectedRoute>
                <FamilyManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lista"
            element={
              <ProtectedRoute>
                <ShoppingListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogos"
            element={
              <ProtectedRoute>
                <CatalogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/iniciar-compra"
            element={
              <ProtectedRoute>
                <StartPurchasePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compra/:purchaseId"
            element={
              <ProtectedRoute>
                <LivePurchasePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compra/:purchaseId/resumen"
            element={
              <ProtectedRoute>
                <PurchaseSummaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
