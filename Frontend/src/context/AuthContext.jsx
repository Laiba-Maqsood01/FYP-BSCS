import { createContext } from 'react';

export const AuthContext = createContext({
  auth: { role: 'guest', name: '', email: '' },
  onLogin: () => false,
  onLogout: () => {},
});
