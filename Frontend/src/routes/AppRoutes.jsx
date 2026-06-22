import { Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import Home from "../pages/public/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyEmail from "../pages/auth/VerifyEmail";

import BrowseCars from "../pages/public/BrowseCars";
import ListingDetail from "../pages/public/ListingDetail";
import PostAd from "../pages/user/PostAd";
import InspectionForm from "../pages/user/InspectionForm";
import PaymentSuccess from "../pages/public/PaymentSuccess";
import PaymentFailed from "../pages/public/PaymentFailed";
import Profile from "../pages/common/Profile";
import NotFound from "../pages/common/NotFound";

// Dashboard
import Dashboard from "../pages/user/Dashboard";
import Overview from "../pages/user/dashboard/Overview";
import MyListings from "../pages/user/dashboard/MyListings";
import Inspections from "../pages/user/dashboard/Inspections";
import Favorites from "../pages/user/dashboard/Favorites";
import Payments from "../pages/user/dashboard/Payments";

// Admin
import AdminLayout from "../pages/admin/AdminLayout";
import ManageUsers from "../pages/admin/ManageUsers";

// Protected Route
import ProtectedRoute from "../components/auth/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* AUTHENTICATED — user & admin */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["user", "admin"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* USER DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["user", "admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview"    element={<Overview />}    />
        <Route path="listings"    element={<MyListings />}  />
        <Route path="inspections" element={<Inspections />} />
        <Route path="favorites"   element={<Favorites />}   />
        <Route path="payments"    element={<Payments />}    />
        <Route path="profile"     element={<Profile />}     />
      </Route>

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ManageUsers />} />
      </Route>

      <Route path="/browse-cars" element={<BrowseCars />} />
      <Route path="/browse-cars/:id" element={<ListingDetail />} />

      {/* POST AD — authenticated users only */}
      <Route
        path="/post-ad"
        element={
          <ProtectedRoute allowedRoles={["user", "admin"]}>
            <PostAd />
          </ProtectedRoute>
        }
      />

      {/* INSPECTION BOOKING — authenticated users only */}
      <Route
        path="/inspection/book/:listingId"
        element={
          <ProtectedRoute allowedRoles={["user", "admin"]}>
            <InspectionForm />
          </ProtectedRoute>
        }
      />

      {/* PAYMENT RESULT — shared for all payment types */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed"  element={<PaymentFailed />}  />

      {/* Not Found — redirect any unknown URL to /not-found so App.jsx can hide navbar/footer */}
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export default AppRoutes;