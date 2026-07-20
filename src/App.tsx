import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useStore } from './store/useStore';
import { sweepOrphanImages } from './lib/images';
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
  const location = useLocation();

  // Start each page at the top when navigating.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // On startup, drop any image blobs no longer referenced by state (orphans from
  // cancelled forms, resets, or imports on a previous visit).
  useEffect(() => {
    const { behaviours, rewards } = useStore.getState();
    const referenced = [...behaviours, ...rewards]
      .map((x) => x.imageId)
      .filter((x): x is string => Boolean(x));
    void sweepOrphanImages(referenced);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <CelebrationProvider>
        <ParentGateProvider>
          <Layout>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                <Routes location={location}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/kids" element={<KidsPage />} />
                  <Route path="/kids/:id/avatar" element={<AvatarPage />} />
                  <Route path="/behaviours" element={<BehavioursPage />} />
                  <Route path="/rewards" element={<RewardsPage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Layout>
        </ParentGateProvider>
      </CelebrationProvider>
    </MotionConfig>
  );
}
