"use client";

import { createContext, useContext } from "react";

const LoginModalContext = createContext(() => {});

export function LoginModalProvider({ onRequestLogin, children }) {
  return (
    <LoginModalContext.Provider value={onRequestLogin}>
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  return useContext(LoginModalContext);
}