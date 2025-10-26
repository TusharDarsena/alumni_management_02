import * as React from "react";
import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import JobOpportunitiesPage from "./pages/JobOpportunitiesPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import SearchAlumniPage from "./pages/SearchAlumniPage";
import AdminControlsPage from "./pages/AdminControlsPage";
import AlumniProfilePage from "./pages/AlumniProfilePage";
import SearchFavouritesPage from "./pages/SearchFavouritesPage";
import UserProfilePage from "./pages/UserProfilePage";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import FirstLoginPasswordChange from "./pages/FirstLoginPasswordChange";
import HelpPage from "./pages/HelpPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import MyJobListingsPage from "./pages/MyJobListingsPage";
import EditJobListingPage from "./pages/EditJobListingPage";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Routes that require authentication */}
              <Route element={<ProtectedRoute />}>
                <Route
                  path="/first-login-change"
                  element={<FirstLoginPasswordChange />}
                />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/search-alumni" element={<SearchAlumniPage />} />
                <Route
                  path="/search-favourites"
                  element={<SearchFavouritesPage />}
                />
                <Route path="/job-opportunities" element={<JobOpportunitiesPage />} />
                <Route
                  path="/alumni/:username"
                  element={<AlumniProfilePage />}
                />
                <Route
                  path="/user-profile"
                  element={
                    <UserProfilePage
                      alumnus={{
                        username: "john-doe",
                        name: "John Doe",
                        graduationYear: "2020",
                        major: "CSE",
                        company: "Acme Corp",
                        bio: "Passionate engineer",
                        skills: ["React", "Node.js"],
                        experience: [
                          {
                            company: "Acme Corp",
                            title: "Engineer",
                            from: "2021",
                          },
                        ],
                      }}
                    />
                  }
                />
              </Route>

              {/* Admin-only routes */}
              <Route element={<ProtectedRoute roles={["admin"]} />}>
                <Route path="/admin" element={<AdminControlsPage />} />
              </Route>

              <Route path="/help" element={<HelpPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
