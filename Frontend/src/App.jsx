import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
import BrowseCars from "./pages/BrowseCars.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InspectionReport from "./pages/InspectionReport";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AddCar from "./pages/AddCar.jsx";
import Admin from "./pages/Admin.jsx";
import VehicleDetails from "./pages/VehicleDetails.jsx";
import FooterInfoPage from "./pages/FooterInfoPage.jsx";
import Footer from "./components/Footer.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

function AppRoutes() {
  const location = useLocation();
  const hideFooter =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse-cars" element={<BrowseCars />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-car" element={<AddCar />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/vehicle/:listingId" element={<VehicleDetails />} />
        <Route path="/info/:slug" element={<FooterInfoPage />} />
        <Route
          path="/inspection-report/:listingId"
          element={<InspectionReport />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      {!hideFooter && <Footer />}
    </>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("autohub-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("autohub-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light",
    );
  };

  return (
    <Router>
      <ThemeProvider value={{ theme, toggleTheme }}>
        <AppRoutes />
      </ThemeProvider>
    </Router>
  );
}

export default App;
