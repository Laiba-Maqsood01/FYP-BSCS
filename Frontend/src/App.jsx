import { useCallback, useState } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import BrowseCarsPage from './pages/BrowseCarsPage.jsx';
import CarDetailsPage from './pages/CarDetailsPage.jsx';
import GenericSaleFlowPage from './pages/GenericSaleFlowPage.jsx';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminPanelPage from './pages/AdminPanelPage.jsx';
import ManagedSaleFlowPage from './pages/ManagedSaleFlowPage.jsx';
import PostAdPage from './pages/PostAdPage.jsx';
import SellOptionsPage from './pages/SellOptionsPage.jsx';

function App() {
  const getInitialPage = () => {
    if (typeof window === 'undefined') {
      return 'Home';
    }

    const path = window.location.pathname.toLowerCase();
    if (path === '/admin' || path === '/admin-login') {
      return 'Admin Login';
    }

    return 'Home';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [selectedCar, setSelectedCar] = useState(null);
  const [auth, setAuth] = useState({ role: 'guest', name: '', email: '' });

  const handleLogin = useCallback((role, email, password) => {
    const credentials = {
      user: { email: 'user@autohub.com', password: 'user123', name: 'Valued User' },
      admin: { email: 'admin@autohub.com', password: 'admin123', name: 'Admin User' },
    };

    const expected = credentials[role];
    if (!expected || email.toLowerCase() !== expected.email || password !== expected.password) {
      return false;
    }

    setAuth({ role, name: expected.name, email: expected.email });
    setCurrentPage(role === 'admin' ? 'Admin Panel' : 'Dashboard');
    return true;
  }, []);

  const handleLogout = useCallback(() => {
    setAuth({ role: 'guest', name: '', email: '' });
    setCurrentPage('Home');
  }, []);

  const handleNavigate = useCallback((page, payload) => {
    if (page === 'Car Details') {
      setSelectedCar(payload || null);
    }

    if (page === 'Dashboard' && auth.role !== 'user') {
      setCurrentPage('Home');
      return;
    }

    if (page === 'Admin Panel' && auth.role !== 'admin') {
      setCurrentPage('Home');
      return;
    }

    setCurrentPage(page);
  }, [auth.role]);

  let page = null;

  if (currentPage === 'Browse Cars') {
    page = (
      <BrowseCarsPage
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onViewDetails={(car) => handleNavigate('Car Details', car)}
      />
    );
  } else if (currentPage === 'Dashboard') {
    page = <DashboardPage currentPage={currentPage} onNavigate={handleNavigate} />;
  } else if (currentPage === 'Admin Panel') {
    page = <AdminPanelPage currentPage={currentPage} onNavigate={handleNavigate} />;
  } else if (currentPage === 'Post an Ad') {
    page = <PostAdPage currentPage={currentPage} onNavigate={handleNavigate} />;
  } else if (currentPage === 'Admin Login') {
    page = <AdminLoginPage currentPage={currentPage} onNavigate={handleNavigate} onLogin={handleLogin} />;
  } else if (currentPage === 'Car Details') {
    page = (
      <CarDetailsPage
        car={selectedCar}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />
    );
  } else if (currentPage === 'Generic Sale Flow') {
    page = <GenericSaleFlowPage currentPage={currentPage} onNavigate={handleNavigate} />;
  } else if (currentPage === 'Managed Sale Flow') {
    page = <ManagedSaleFlowPage currentPage={currentPage} onNavigate={handleNavigate} />;
  } else if (currentPage === 'Generic Sale' || currentPage === 'Managed Sale') {
    page = (
      <SellOptionsPage
        currentPage={currentPage}
        initialSelection={currentPage === 'Managed Sale' ? 'managed' : 'generic'}
        onNavigate={handleNavigate}
      />
    );
  } else {
    page = <HomePage currentPage={currentPage} onNavigate={handleNavigate} />;
  }

  return (
    <AuthContext.Provider value={{ auth, onLogin: handleLogin, onLogout: handleLogout }}>
      {page}
    </AuthContext.Provider>
  );
}

export default App;

