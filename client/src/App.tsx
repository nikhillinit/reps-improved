/* ============================================================
   REPS — App Router
   Terminal Precision design system
   ============================================================ */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LearnIndex from "./pages/LearnIndex";
import LearnSheet from "./pages/LearnSheet";
import RouterMode from "./pages/RouterMode";
import PracticeMode from "./pages/PracticeMode";
import MockMode from "./pages/MockMode";
import ReviewMode from "./pages/ReviewMode";
import PacketMode from "./pages/PacketMode";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/learn" component={LearnIndex} />
        <Route path="/learn/:id" component={LearnSheet} />
        <Route path="/router" component={RouterMode} />
        <Route path="/practice" component={PracticeMode} />
        <Route path="/mock" component={MockMode} />
        <Route path="/review" component={ReviewMode} />
        <Route path="/packet" component={PacketMode} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.17 0.012 265)",
                border: "1px solid oklch(0.28 0.01 265)",
                color: "oklch(0.91 0.005 265)",
                fontFamily: "'IBM Plex Sans', sans-serif",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
