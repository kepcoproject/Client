import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Spaces from "./pages/Spaces";
import Devices from "./pages/Devices";
import SpaceDetail from "./pages/SpaceDetail";
import Recommendations from "./pages/Recommendations";
import Reports from "./pages/Reports";
import ControlLogs from "./pages/ControlLogs";
import Users from "./pages/Users";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/spaces" element={<Spaces />} />
                <Route path="/spaces/:spaceId" element={<SpaceDetail />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/control-logs" element={<ControlLogs />} />
                <Route path="/settings" element={<Settings />} />

                <Route element={<AdminRoute />}>
                  <Route path="/users" element={<Users />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
