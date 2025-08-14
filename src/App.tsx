import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';
import { DoctorRoomPage } from './pages/DoctorRoomPage';

function App() {
  const path = window.location.pathname;
  
  return (
    <ErrorBoundary>
      {path === '/admin' || path === '/admin/' ? (
        <AdminPage />
      ) : path === '/doctor' || path === '/doctor/' ? (
        <DoctorRoomPage />
      ) : (
        <HomePage />
      )}
    </ErrorBoundary>
  );
}

export default App;