import * as React from "react";
import "./global.css";

import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import JobOpportunitiesPage from "./pages/JobOpportunitiesPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import SearchAlumniPage from "./pages/SearchAlumniPage";
import AdminControlsPage from "./pages/AdminControlsPage";
import AlumniProfilePage from "./pages/AlumniProfilePage";
import SearchFavouritesPage from "./pages/SearchFavouritesPage";
import UserProfilePage from "./pages/UserProfilePage";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import HelpPage from "./pages/HelpPage";
import MyJobListingsPage from "./pages/MyJobListingsPage";
import EditJobListingPage from "./pages/EditJobListingPage";
import JobApplicantsPage from "./pages/JobApplicantsPage";
import AppliedJobsPage from "./pages/AppliedJobsPage";
import { AuthProvider, useAuth } from "./hooks/useClerkAuth";
import { ThemeProvider } from "./context/ThemeContext";
import { ScrapingProvider } from "./context/ScrapingContext";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY - auth will not work properly");
}

const queryClient = new QueryClient();

/**
 * Protected route wrapper using Clerk
 */
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading, isSignedIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // Check role if required
  if (roles && roles.length > 0 && user) {
    if (!roles.includes(user.role)) {
      return <Unauthorized />;
    }
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/sign-in/*" element={<SignInPage />} />
    <Route path="/sign-up/*" element={<SignUpPage />} />
    <Route path="/help" element={<HelpPage />} />
    <Route path="/unauthorized" element={<Unauthorized />} />

    {/* Protected routes - require authentication */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/search-alumni"
      element={
        <ProtectedRoute>
          <SearchAlumniPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/search-favourites"
      element={
        <ProtectedRoute>
          <SearchFavouritesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/job-opportunities"
      element={
        <ProtectedRoute>
          <JobOpportunitiesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/jobs/my-listings"
      element={
        <ProtectedRoute>
          <MyJobListingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/jobs/applied"
      element={
        <ProtectedRoute>
          <AppliedJobsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/jobs/edit/:id"
      element={
        <ProtectedRoute>
          <EditJobListingPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/jobs/:jobId/applicants"
      element={
        <ProtectedRoute>
          <JobApplicantsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/alumni/:username"
      element={
        <ProtectedRoute>
          <AlumniProfilePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/user-profile"
      element={
        <ProtectedRoute>
          <UserProfilePage />
        </ProtectedRoute>
      }
    />

    {/* Admin-only routes */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute roles={["admin"]}>
          <AdminControlsPage />
        </ProtectedRoute>
      }
    />

    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY || ""}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ScrapingProvider>
                <AppRoutes />
              </ScrapingProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
