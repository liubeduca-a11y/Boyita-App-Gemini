import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './screens/Dashboard';
import { Analytics } from './screens/Analytics';
import { History } from './screens/History';
import { Settings } from './screens/Settings';
import { Milestones } from './screens/Milestones';
import { FirebaseProvider } from './components/FirebaseProvider';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'history' | 'settings' | 'trophyPath'>('dashboard');

  return (
    <FirebaseProvider>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'history' && <History />}
        {activeTab === 'trophyPath' && <Milestones />}
        {activeTab === 'settings' && <Settings />}
      </Layout>
    </FirebaseProvider>
  );
}
