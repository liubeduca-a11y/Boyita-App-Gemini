import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './screens/Dashboard';
import { Analytics } from './screens/Analytics';
import { History } from './screens/History';
import { Settings } from './screens/Settings';
import { Milestones } from './screens/Milestones';
import { Bitacora } from './screens/Bitacora';
import { FirebaseProvider } from './components/FirebaseProvider';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'history' | 'settings' | 'trophyPath' | 'bitacora'>('dashboard');

  return (
    <FirebaseProvider>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'history' && <History />}
        {activeTab === 'trophyPath' && <Milestones />}
        {activeTab === 'bitacora' && <Bitacora />}
        {activeTab === 'settings' && <Settings />}
      </Layout>
    </FirebaseProvider>
  );
}
