import React from 'react';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';
import { DoctorRoomPage } from './pages/DoctorRoomPage';

function App() {
  const path = window.location.pathname;
  
  if (path === '/admin' || path === '/admin/') {
    return <AdminPage />;
  }
  
  if (path === '/doctor' || path === '/doctor/') {
    return <DoctorRoomPage />;
  }
  
  return <HomePage />;
}

export default App;