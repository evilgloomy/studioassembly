import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";

// Public pages
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Journal from "./pages/Journal";
import JournalPost from "./pages/JournalPost";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./pages/admin/Login";
import ResetPassword from "./pages/admin/ResetPassword";
import Unauthorized from "./pages/admin/Unauthorized";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPosts from "./pages/admin/Posts";
import PostEditor from "./pages/admin/PostEditor";
import AdminMedia from "./pages/admin/Media";
import AdminTeam from "./pages/admin/Team";
import PageEditor from "./pages/admin/PageEditor";

// Caerhold pages
import CaerholdHome from "./pages/caerhold/Index";
import CaerholdFeed from "./pages/caerhold/Feed";
import CaerholdResidents from "./pages/caerhold/Residents";
import CaerholdResidentProfile from "./pages/caerhold/ResidentProfile";
import CaerholdLocations from "./pages/caerhold/Locations";
import CaerholdLocationPage from "./pages/caerhold/LocationPage";
import CaerholdDistricts from "./pages/caerhold/Districts";
import CaerholdDistrictDetail from "./pages/caerhold/DistrictDetail";
import CaerholdMap from "./pages/caerhold/Map";

// Caerhold admin pages
import CaerholdAdminDashboard from "./pages/caerhold/admin/Dashboard";
import CaerholdAdminMedia from "./pages/caerhold/admin/Media";
import CaerholdAdminDrafts from "./pages/caerhold/admin/Drafts";
import CaerholdDraftEditor from "./pages/caerhold/admin/DraftEditor";
import CaerholdAdminResidents from "./pages/caerhold/admin/Residents";
import CaerholdAdminLocations from "./pages/caerhold/admin/Locations";
import CaerholdResidentImport from "./pages/caerhold/admin/ResidentImport";
import CaerholdResidentDrafts from "./pages/caerhold/admin/ResidentDrafts";
import CaerholdResidentEditor from "./pages/caerhold/admin/ResidentEditor";
import CaerholdAdminDistricts from "./pages/caerhold/admin/Districts";
import CaerholdDistrictEditor from "./pages/caerhold/admin/DistrictEditor";
import CaerholdWelcomeConfig from "./pages/caerhold/admin/WelcomeConfig";
import CaerholdLocationEditor from "./pages/caerhold/admin/LocationEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:productId" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/:slug" element={<JournalPost />} />
            <Route path="/contact" element={<Contact />} />

            {/* Auth routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/unauthorized" element={<Unauthorized />} />

            {/* Protected admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="posts/new" element={<PostEditor />} />
              <Route path="posts/:id/edit" element={<PostEditor />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="pages/:pageSlug" element={<PageEditor />} />
              <Route path="team" element={<ProtectedRoute requiredRole="admin"><AdminTeam /></ProtectedRoute>} />

              {/* Caerhold admin routes */}
              <Route path="caerhold" element={<CaerholdAdminDashboard />} />
              <Route path="caerhold/media" element={<CaerholdAdminMedia />} />
              <Route path="caerhold/drafts" element={<CaerholdAdminDrafts />} />
              <Route path="caerhold/drafts/:id" element={<CaerholdDraftEditor />} />
              <Route path="caerhold/residents" element={<CaerholdAdminResidents />} />
              <Route path="caerhold/residents/import" element={<CaerholdResidentImport />} />
              <Route path="caerhold/residents/drafts" element={<CaerholdResidentDrafts />} />
              <Route path="caerhold/residents/:id" element={<CaerholdResidentEditor />} />
              <Route path="caerhold/locations" element={<CaerholdAdminLocations />} />
              <Route path="caerhold/locations/:id" element={<CaerholdLocationEditor />} />
              <Route path="caerhold/districts" element={<CaerholdAdminDistricts />} />
              <Route path="caerhold/districts/:id" element={<CaerholdDistrictEditor />} />
              <Route path="caerhold/welcome-config" element={<CaerholdWelcomeConfig />} />
            </Route>

            {/* Caerhold public routes */}
            <Route path="/caerhold" element={<CaerholdHome />} />
            <Route path="/caerhold/feed" element={<CaerholdFeed />} />
            <Route path="/caerhold/residents" element={<CaerholdResidents />} />
            <Route path="/caerhold/residents/:slug" element={<CaerholdResidentProfile />} />
            <Route path="/caerhold/locations" element={<CaerholdLocations />} />
            <Route path="/caerhold/locations/:slug" element={<CaerholdLocationPage />} />
            <Route path="/caerhold/districts" element={<CaerholdDistricts />} />
            <Route path="/caerhold/districts/:slug" element={<CaerholdDistrictDetail />} />
            <Route path="/caerhold/map" element={<CaerholdMap />} />

            {/* Redirects */}
            <Route path="/caerhold/admin/*" element={<Navigate to="/admin/caerhold" replace />} />
            <Route path="/store" element={<Navigate to="/shop" replace />} />
            <Route path="/process" element={<Navigate to="/about" replace />} />
            <Route path="/city" element={<Navigate to="/shop" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
