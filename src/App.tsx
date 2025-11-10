import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Inventory from "./pages/Inventory";
import Layout from "@/components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/inventory"
            element={
              <Layout>
                <Inventory />
              </Layout>
            }
          />
          <Route
            path="/lots"
            element={
              <Layout>
                <div className="container mx-auto px-4 py-8">
                  <h2 className="text-2xl font-bold">เพิ่มล๊อต</h2>
                  <p className="text-muted-foreground mt-2">
                    ฟีเจอร์นี้กำลังพัฒนา
                  </p>
                </div>
              </Layout>
            }
          />
          <Route
            path="/history"
            element={
              <Layout>
                <div className="container mx-auto px-4 py-8">
                  <h2 className="text-2xl font-bold">ประวัติ</h2>
                  <p className="text-muted-foreground mt-2">
                    ฟีเจอร์นี้กำลังพัฒนา
                  </p>
                </div>
              </Layout>
            }
          />
          <Route
            path="/reports"
            element={
              <Layout>
                <div className="container mx-auto px-4 py-8">
                  <h2 className="text-2xl font-bold">รายงาน</h2>
                  <p className="text-muted-foreground mt-2">
                    ฟีเจอร์นี้กำลังพัฒนา
                  </p>
                </div>
              </Layout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
