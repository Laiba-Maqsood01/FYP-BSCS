import { Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import Home          from "../pages/public/Home";
import Login           from "../pages/auth/Login";
import Register        from "../pages/auth/Register";
import VerifyEmail     from "../pages/auth/VerifyEmail";
import VerifyPhone     from "../pages/auth/VerifyPhone";
import ForgotPassword  from "../pages/auth/ForgotPassword";
import ResetPassword   from "../pages/auth/ResetPassword";
import BrowseCars    from "../pages/public/BrowseCars";
import ListingDetail from "../pages/public/ListingDetail";
import PaymentSuccess from "../pages/public/PaymentSuccess";
import PaymentFailed  from "../pages/public/PaymentFailed";
import PrivacyPolicy  from "../pages/public/PrivacyPolicy";
import TermsOfService from "../pages/public/TermsOfService";
import NotFound      from "../pages/common/NotFound";

// Authenticated pages
import Profile       from "../pages/common/Profile";
import PostAd        from "../pages/user/PostAd";
import EditListing   from "../pages/user/EditListing";
import InspectionForm from "../pages/user/InspectionForm";

// User Dashboard
import Dashboard     from "../pages/user/Dashboard";
import Overview      from "../pages/user/dashboard/Overview";
import MyListings    from "../pages/user/dashboard/MyListings";
import Inspections   from "../pages/user/dashboard/Inspections";
import Favorites     from "../pages/user/dashboard/Favorites";
import Payments      from "../pages/user/dashboard/Payments";

// Admin
import AdminLayout         from "../pages/admin/AdminLayout";
import AdminOverview       from "../pages/admin/dashboard/AdminOverview";
import ManageUsers         from "../pages/admin/dashboard/ManageUsers";
import UserDetail          from "../pages/admin/dashboard/UserDetail";
import ManageListings      from "../pages/admin/dashboard/ManageListings";
import ManageInspections   from "../pages/admin/dashboard/ManageInspections";
import ManageFeatured      from "../pages/admin/dashboard/ManageFeatured";
import ManageRefunds       from "../pages/admin/dashboard/ManageRefunds";
import ManageCommissions   from "../pages/admin/dashboard/ManageCommissions";
import ManageDeletions     from "../pages/admin/dashboard/ManageDeletions";
import SiteSettings        from "../pages/admin/dashboard/SiteSettings";
import ReportBuilder       from "../pages/admin/dashboard/ReportBuilder";
import InspectionReport    from "../pages/public/InspectionReport";

// Guards
import ProtectedRoute from "../components/auth/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ── PUBLIC ── */}
      <Route path="/"            element={<Home />}         />
      <Route path="/login"       element={<Login />}        />
      <Route path="/register"    element={<Register />}     />
      <Route path="/verify-email"    element={<VerifyEmail />}    />
      <Route path="/verify-phone"    element={<VerifyPhone />}    />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />}  />
      <Route path="/browse-cars"     element={<BrowseCars />}       />
      <Route path="/browse-cars/:id" element={<ListingDetail />}    />
      <Route path="/payment/success" element={<PaymentSuccess />}   />
      <Route path="/payment/failed"  element={<PaymentFailed />}    />
      <Route path="/privacy-policy"  element={<PrivacyPolicy />}    />
      <Route path="/terms"           element={<TermsOfService />}   />
      <Route path="/reports/:verifyToken" element={<InspectionReport />} />

      {/* ── AUTHENTICATED (user + admin) ── */}
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={["user", "admin"]}><Profile /></ProtectedRoute>
      } />
      <Route path="/post-ad" element={
        <ProtectedRoute allowedRoles={["user"]}><PostAd /></ProtectedRoute>
      } />
      <Route path="/edit-listing/:id" element={
        <ProtectedRoute allowedRoles={["user", "admin"]}><EditListing /></ProtectedRoute>
      } />
      <Route path="/inspection/book/:listingId" element={
        <ProtectedRoute allowedRoles={["user", "admin"]}><InspectionForm /></ProtectedRoute>
      } />

      {/* ── USER DASHBOARD ── */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["user"]}><Dashboard /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview"    element={<Overview />}    />
        <Route path="listings"    element={<MyListings />}  />
        <Route path="inspections" element={<Inspections />} />
        <Route path="favorites"   element={<Favorites />}   />
        <Route path="payments"    element={<Payments />}    />
        <Route path="profile"     element={<Profile />}     />
      </Route>

      {/* ── ADMIN PANEL ── */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview"    element={<AdminOverview />}     />
        <Route path="users"       element={<ManageUsers />}       />
        <Route path="users/:id"   element={<UserDetail />}        />
        <Route path="listings"    element={<ManageListings />}    />
        <Route path="inspections" element={<ManageInspections />} />
        <Route path="featured"    element={<ManageFeatured />}    />
        <Route path="refunds"     element={<ManageRefunds />}     />
        <Route path="commissions" element={<ManageCommissions />} />
        <Route path="deletions"   element={<ManageDeletions />}   />
        <Route path="settings"    element={<SiteSettings />}      />
        <Route path="profile"     element={<Profile />}           />
      </Route>

      {/* Report builder — standalone full-screen page (no navbar / admin sidebar),
          opened in a new tab from the admin Inspections page */}
      <Route path="/admin/inspection-reports/:reportId/build" element={
        <ProtectedRoute allowedRoles={["admin"]}><ReportBuilder /></ProtectedRoute>
      } />

      {/* ── NOT FOUND ── */}
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*"          element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export default AppRoutes;
