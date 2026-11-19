import { useEffect } from 'react';
import NexconnManager from './services/nexconnManager';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ModuleSelector from './components/ModuleSelector';
import ModeSelector from './components/ModeSelector';
import BriefingPage from './components/BriefingPage';
import LabEnvironment from './components/LabEnvironment';
import LandingPage from './components/LandingPage/LandingPage';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/Dashboard/DashboardLayout';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { StudentRoster } from './components/Dashboard/StudentRoster';
import { AccessManagement } from './components/Dashboard/AccessManagement';
import { StudentDetails } from './components/Dashboard/StudentDetails';
import { FacultyAnalytics } from './components/Dashboard/FacultyAnalytics';

import { StudentDashboardLayout } from './components/StudentDashboard/StudentDashboardLayout';
import { StudentOverview } from './components/StudentDashboard/StudentOverview';
import { StudentLeaderboard } from './components/StudentDashboard/StudentLeaderboard';
import { StudentAchievements } from './components/StudentDashboard/StudentAchievements';
import { StudentManuals } from './components/StudentDashboard/StudentManuals';
import { StudentExplorer } from './components/StudentDashboard/StudentExplorer';
import { ExplorerLayout } from './components/StudentDashboard/ExplorerLayout';
import { MoleculeBuilderView } from './components/StudentDashboard/MoleculeBuilderView';

import { CurriculumGenerator } from './components/Dashboard/CurriculumGenerator';
import ToolsLayout from './components/Dashboard/ToolsLayout';
import { Trends } from './components/Dashboard/Trends';
import { RetrosynthesisPlanner } from './components/Dashboard/RetrosynthesisPlanner';

function App() {
  useEffect(() => {
    // Determine user ID: If URL has ?partner=1 or if session user is partner, use student_partner_02
    const params = new URLSearchParams(window.location.search);
    const isPartner = params.has('partner') || sessionStorage.getItem('partner_mode') === 'true';
    if (params.has('partner')) {
      sessionStorage.setItem('partner_mode', 'true');
    }

    const userId = isPartner ? 'student_partner_02' : 'student_guru_2026';
    const userName = isPartner ? 'Guru S (Partner)' : 'Guru Prashanth (Host)';

    NexconnManager.getInstance().initAndConnect(userId, userName);
  }, []);
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Lab Routes (Students + Faculty can both access the lab) */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY']} />}>
            <Route path="/module/:moduleId" element={<ModeSelector />} />
            <Route path="/briefing/:moduleId/:mode" element={<BriefingPage />} />
            <Route path="/lab/:moduleId/:mode" element={<LabEnvironment />} />
          </Route>

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student-dashboard" element={<StudentDashboardLayout />}>
              <Route index element={<StudentOverview />} />
              <Route path="explorer" element={<ExplorerLayout />}>
                <Route index element={<Navigate to="periodic" replace />} />
                <Route path="periodic" element={<StudentExplorer />} />
                <Route path="periodic/:elementId" element={<StudentExplorer />} />
                <Route path="molecule-builder" element={<MoleculeBuilderView />} />
              </Route>
              <Route path="leaderboard" element={<StudentLeaderboard />} />
              <Route path="achievements" element={<StudentAchievements />} />
              <Route path="manuals" element={<StudentManuals />} />
              <Route path="modules" element={<ModuleSelector />} />
            </Route>
          </Route>

          {/* Protected Faculty Routes */}
          <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
            <Route path="/faculty-dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="analytics" element={<FacultyAnalytics />} />
              <Route path="roster" element={<StudentRoster />} />
              <Route path="roster/:studentId" element={<StudentDetails />} />
              <Route path="access" element={<AccessManagement />} />
              <Route path="modules" element={<ModuleSelector />} />
              <Route path="tools" element={<ToolsLayout />}>
                <Route index element={<Navigate to="dr-hydro-ai" replace />} />
                <Route path="dr-hydro-ai" element={<CurriculumGenerator />} />
                <Route path="trends" element={<Trends />} />
                <Route path="retrosynthesis" element={<RetrosynthesisPlanner />} />
              </Route>
            </Route>
          </Route>

          {/* Default catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
