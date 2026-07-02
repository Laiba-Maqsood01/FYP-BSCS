import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAccessToken } from "../services/api";
import * as authService from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessTokenState, setAccessTokenState] = useState(null);
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  const login = async (data, navigate) => {
    try {
      const res = await authService.login(data);

      const { user, accessToken } = res;

      // store token
      setAccessToken(accessToken);

      setAccessTokenState(accessToken);

      //  CASE 1: not verified → redirect to verify page
      if (!user.verified) {
        await authService.resendOTP(user.email);
        navigate("/verify-email", {
          state: { email: user.email }
        });
        return { success: false };
      }

      //  CASE 2: verified user
      setUser(user);

      navigate("/"); // go home
      return { success: true, user };

    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      const isUnverified =
        error.response?.status === 403 &&
        message.toLowerCase().includes("verify");

      if (isUnverified) {
        const email = data.email;
        try { await authService.resendOTP(email); } catch (_) {}
        navigate("/verify-email", { state: { email } });
        return { success: false, unverified: true };
      }

      return { success: false, message };
    }
  };

  //  LOGOUT
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setAccessTokenState(null);
    }
  };

  // LOGOUT ALL DEVICES
const logoutAll = async () => {
  try {
    await authService.logoutAll();
  } catch (err) {
    console.log("Logout all error:", err);
  } finally {
    // same cleanup as logout
    setUser(null);
    setAccessToken(null);
    setAccessTokenState(null);
  }
};


  //  AUTO LOGIN (on refresh)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.get("/auth/refresh-token");

        const accessToken = res.data.data.accessToken;
        setAccessToken(accessToken);
        setAccessTokenState(accessToken);

        
        const meRes = await api.get("/auth/get-me");

        setUser(meRes.data.data);

      } catch (error) {
        console.log("User not authenticated");
        setUser(null);
        setAccessTokenState(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // When the API interceptor can't refresh the token, clear state and redirect
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setAccessTokenState(null);
      navigate("/login");
    };
    window.addEventListener("auth:session-expired", handleExpired);
    return () => window.removeEventListener("auth:session-expired", handleExpired);
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!accessTokenState,

        login,
        logout,
        logoutAll,
        setUser, 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => useContext(AuthContext);