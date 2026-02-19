import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { Layout } from "@/components/layout";

import Dashboard from "./pages/Dashboard";
import UTMBuilder from "./pages/UTMBuilder";
import KeywordCombiner from "./pages/KeywordCombiner";
import KeywordMixer from "./pages/KeywordMixer";
import KeywordTools from "./pages/KeywordTools";
import YTFinder from "./pages/YTFinder";
import QRGenerator from "./pages/QRGenerator";
import UrlHistory from "./pages/UrlHistory";
import UrlValidator from "./pages/UrlValidator";
import NegativeKeywords from "./pages/NegativeKeywords";
import AdCopyValidator from "./pages/AdCopyValidator";
import ROASCalculator from "./pages/ROASCalculator";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <FontSizeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/utm-builder" element={<UTMBuilder />} />
                <Route path="/keyword-combiner" element={<KeywordCombiner />} />
                <Route path="/keyword-mixer" element={<KeywordMixer />} />
                <Route path="/keyword-tools" element={<KeywordTools />} />
                <Route path="/yt-finder" element={<YTFinder />} />
                <Route path="/qr-generator" element={<QRGenerator />} />
                <Route path="/url-validator" element={<UrlValidator />} />
                <Route path="/negative-keywords" element={<NegativeKeywords />} />
                <Route path="/ad-copy-validator" element={<AdCopyValidator />} />
                <Route path="/roas-calculator" element={<ROASCalculator />} />
                <Route path="/history" element={<UrlHistory />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/__skeleton-preview" element={<SkeletonPreview />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </FontSizeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
