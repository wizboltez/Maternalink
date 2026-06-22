import React, { createContext } from 'react';

export const HealthDataContext = createContext();

export function HealthDataProvider({ children }) {
  // TODO: Implement context provider
  return (
    <HealthDataContext.Provider value={{}}>
      {children}
    </HealthDataContext.Provider>
  );
}

export function useHealthData() {
  // TODO: Implement hook
  return {};
}
