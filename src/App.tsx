import React from 'react';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';

function App() {
  const path = window.location.pathname;
  
  if (path === '/admin' || path === '/admin/') {
    return <AdminPage />;
  }
  
  return <HomePage />;
}

export default App;