// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import Layout from "@/components/Layout";
import Products from "@/pages/Products";
import Inventory from "@/pages/Inventory";
import Lots from "@/pages/Lots";
import History from "@/pages/History";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { RoleProtected } from "@/components/RoleProtected";

const queryClient = new QueryClient();

/* ---------- Protected wrapper ---------- */
function Protected({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthed(!!u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready) {
      return (
        <div className="min-h-screen grid place-items-center text-muted-foreground">
          กำลังตรวจสอบสิทธิ์…
        </div>
      );
    }
    if (!authed) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
    return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* public */}
          <Route path="/login" element={<Login />} />

          {/* root → /products */}
          <Route path="/" element={<Navigate to="/products" replace />} />

          {/* protected */}
          <Route
            path="/products"
            element={
              <Protected>
                <Layout>
                  <Products />
                </Layout>
              </Protected>
            }
          />
          
          {/* inventory, lots: superadmin/admin/owner */}
          <Route
            path="/inventory"
            element={
              <RoleProtected allow={["superadmin", "admin", "owner"]}>
                <Layout>
                  <Inventory />
                </Layout>
              </RoleProtected>
            }
          />
          <Route
            path="/lots"
            element={
              <RoleProtected allow={["superadmin", "admin", "owner"]}>
                <Layout>
                  <Lots />
                </Layout>
              </RoleProtected>
            }
          />

          {/* history, reports: superadmin/admin เท่านั้น */}
          <Route
            path="/history"
            element={
              <RoleProtected allow={["superadmin", "admin"]}>
                <Layout>
                  <History />
                </Layout>
              </RoleProtected>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleProtected allow={["superadmin", "admin"]}>
                <Layout>
                  <Reports />
                </Layout>
              </RoleProtected>
            }
          />

          {/* catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
