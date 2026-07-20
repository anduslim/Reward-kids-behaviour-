import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ParentGateProvider } from './components/ParentGate';
import { CelebrationProvider } from './components/Celebration';
import { Dashboard } from './pages/Dashboard';
import { KidsPage } from './pages/KidsPage';
import { AvatarPage } from './pages/AvatarPage';
import { BehavioursPage } from './pages/BehavioursPage';
import { RewardsPage } from './pages/RewardsPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <CelebrationProvider>
      <ParentGateProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/kids" element={<KidsPage />} />
            <Route path="/kids/:id/avatar" element={<AvatarPage />} />
            <Route path="/behaviours" element={<BehavioursPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </ParentGateProvider>
    </CelebrationProvider>
  );
}
