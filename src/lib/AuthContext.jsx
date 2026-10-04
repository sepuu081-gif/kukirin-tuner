import React, { createContext, useContext, useMemo } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const value = useMemo(() => {
    const user = { id: 'local-player', role: 'admin', full_name: 'Rider' };

    return {
      user,
      isAuthenticated: true,
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: { offline: true },
      authChecked: true,
      logout: () => {},
      navigateToLogin: () => {},
      checkUserAuth: async () => user,
      checkAppState: async () => ({ offline: true }),
    };
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
