import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  // Navigate,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import useTheme from './hooks/useTheme';
import RouterToTop from './utils/RouterToTop';

import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';

import Home from './pages/Home';
import Brand from './pages/Brand';
import Login from './layouts/Login';
import FAQPage from './pages/FAQPage';
import Error404 from './pages/Error404';
import AboutPage from './pages/AboutPage';
import LegalPage from './pages/LegalPage';
import RideDetails from './pages/RideDetails';
import UserProfile from './pages/UserProfile';
import RoleBasedPage from './pages/RoleBasedPage';
import LogsDashboard from './pages/LogsDashboard';

import {
  ROUTE_404,
  ROUTE_HOME,
  ROUTE_HELP,
  ROUTE_ROLE,
  ROUTE_ABOUT,
  ROUTE_LOGIN,
  ROUTE_BRAND,
  ROUTE_LEGAL,
  ROUTE_PROFILE,
  ROUTE_RIDE_DETAILS,
  ROUTE_LOGS_DASHBOARD,
} from './constants/routes';
import { SocketManager } from './components/SocketManager';

const App: React.FC = () => {
  const theme = useTheme();

  return (
    <>
      <Router>
        <SocketManager>
          <RouterToTop />
          <Navbar />
          <Routes>
            <Route path={ROUTE_HOME} element={<Home />} />
            <Route path={ROUTE_HELP} element={<FAQPage />} />
            <Route path={ROUTE_ABOUT} element={<AboutPage />} />
            <Route path={ROUTE_LOGIN} element={<Login />} />
            <Route path={ROUTE_PROFILE} element={<UserProfile />} />
            <Route path={ROUTE_RIDE_DETAILS} element={<RideDetails />} />
            <Route path={ROUTE_ROLE} element={<RoleBasedPage />} />
            <Route path={ROUTE_BRAND} element={<Brand />} />
            <Route path={ROUTE_LEGAL} element={<LegalPage />} />
            <Route path={ROUTE_LOGS_DASHBOARD} element={<LogsDashboard />} />
            <Route path={ROUTE_404} element={<Error404 />} />
          </Routes>
          <Footer />
        </SocketManager>
      </Router>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </>
  );
};

export default App;
