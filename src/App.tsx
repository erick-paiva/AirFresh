/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import { useStore } from '@/store';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useStore();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { initializeAuth, initializeClients, user } = useStore();

  useEffect(() => {
    const unsubscribeAuth = initializeAuth();
    return () => unsubscribeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (user) {
      const unsubscribeClients = initializeClients();
      return () => unsubscribeClients();
    }
  }, [user, initializeClients]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
