import AppNavbar from "./components/layouts/AppNavbar";
import AppFooter from "./components/layouts/AppFooter";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "./App.css"

function App() {
  const location = useLocation();

  const noLayoutPaths   = ["/not-found"];
  const noMainPaths     = ["/dashboard"];
  const hideFooterPaths = ["/admin", "/dashboard"];

  const hideLayout  = noLayoutPaths.includes(location.pathname);
  const skipMain    = noMainPaths.some(r => location.pathname.startsWith(r));
  const hideFooter  = hideLayout || hideFooterPaths.some(r => location.pathname.startsWith(r));

  // Remove the global body padding-top that offsets the fixed navbar
  if (hideLayout) {
    document.body.style.paddingTop = "0";
  } else {
    document.body.style.paddingTop = "";
  }

  if (hideLayout) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover draggable theme="light" />
        <AppRoutes />
      </>
    );
  }

  return (
    <>
      <AppNavbar />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      {skipMain ? <AppRoutes /> : (
        <main>
          <AppRoutes />
        </main>
      )}

      {!hideFooter && <AppFooter />}
    </>
  );
}

export default App;