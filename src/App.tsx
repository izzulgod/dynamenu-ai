import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import MenuPage from "./pages/MenuPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import KitchenDashboard from "./pages/KitchenDashboard";
import AdminMenuPage from "./pages/AdminMenuPage";
import AdminPromoPage from "./pages/AdminPromoPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SplashScreen show={showSplash} />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/kitchen" element={<KitchenDashboard />} />
            <Route path="/admin/menu" element={<AdminMenuPage />} />
            <Route path="/admin/promo" element={<AdminPromoPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
