import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Roles from "./pages/Roles";
import Skills from "./pages/Skills";
import ProficiencyLevels from "./pages/ProficiencyLevels";
import Assessments from "./pages/Assessments";
import EmployeeAssignments from "./pages/EmployeeAssignments";
import Certifications from "./pages/Certifications";
import Trainings from "./pages/Trainings";
import EmployeeCertifications from "./pages/EmployeeCertifications";
import EmployeeTrainings from "./pages/EmployeeTrainings";
import EmployeeDetail from "./pages/EmployeeDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/proficiency-levels" element={<ProficiencyLevels />} />
          <Route path="/employee-assignments" element={<EmployeeAssignments />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/certifications" element={<Certifications />} />
          <Route path="/trainings" element={<Trainings />} />
          <Route path="/employee-certifications" element={<EmployeeCertifications />} />
          <Route path="/employee-trainings" element={<EmployeeTrainings />} />
          <Route path="/employee/:id" element={<EmployeeDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Safely mount the app, handling HMR
const rootElement = document.getElementById("root");
if (rootElement && !rootElement.hasChildNodes()) {
  createRoot(rootElement).render(<App />);
}
