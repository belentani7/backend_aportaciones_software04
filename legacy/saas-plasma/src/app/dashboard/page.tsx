'use client';

import { motion } from 'framer-motion';
import { MetricCard3D, Chart3D, Globe3D } from '@/components/WebGLCharts';
import { OrbitalField } from '@/components/ParticleField';
import { Navigation } from '@/components/Navigation';

const METRICS = [
  {
    title: 'Monthly Revenue',
    value: '$127,430',
    change: '+23.5% vs last month',
    positive: true,
    icon: (
      <svg className="w-5 h-5 text-uv-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Active Users',
    value: '8,234',
    change: '+12.1% vs last month',
    positive: true,
    icon: (
      <svg className="w-5 h-5 text-plasma-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: 'Conversion Rate',
    value: '3.84%',
    change: '-0.2% vs last month',
    positive: false,
    icon: (
      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Churn Rate',
    value: '1.2%',
    change: '-0.3% vs last month',
    positive: true,
    icon: (
      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

const CHART_DATA = {
  revenue: {
    data: [42000, 45000, 48000, 52000, 55000, 58000, 62000, 65000, 68000, 72000, 75000, 78000],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  users: {
    data: [1200, 1450, 1680, 1920, 2100, 2350, 2580, 2820, 3100, 3400, 3650, 3900],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  conversions: {
    data: [2.1, 2.3, 2.5, 2.7, 2.9, 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
};

const GLOBE_POINTS = [
  { lat: 37.7749, lng: -122.4194, value: 0.9 },
  { lat: 40.7128, lng: -74.0060, value: 0.8 },
  { lat: 51.5074, lng: -0.1278, value: 0.7 },
  { lat: 48.8566, lng: 2.3522, value: 0.6 },
  { lat: 35.6762, lng: 139.6503, value: 0.8 },
  { lat: -33.8688, lng: 151.2093, value: 0.4 },
  { lat: 55.7558, lng: 37.6173, value: 0.5 },
  { lat: -23.5505, lng: -46.6333, value: 0.6 },
  { lat: 39.9042, lng: 116.4074, value: 0.7 },
  { lat: 28.6139, lng: 77.2090, value: 0.4 },
];

const RECENT_ACTIVITY = [
  { id: 1, user: 'Sarah Chen', action: 'Upgraded to Pro plan', time: '2 min ago', type: 'upgrade' },
  { id: 2, user: 'Marcus Johnson', action: 'Created new project', time: '15 min ago', type: 'create' },
  { id: 3, user: 'Emily Rodriguez', action: 'Invited 3 team members', time: '1 hour ago', type: 'invite' },
  { id: 4, user: 'David Kim', action: 'Exported analytics report', time: '2 hours ago', type: 'export' },
  { id: 5, user: 'Lisa Wang', action: 'Completed onboarding', time: '3 hours ago', type: 'onboard' },
];

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen bg-void">
      <Navigation />
      
      <main className="pt-24 pb-16 px-6" style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div className="mb-12">
          <motion.h1 
            className="font-display text-4xl sm:text-5xl font-bold text-gradient-uv"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Dashboard
          </motion.h1>
          <motion.p 
            className="font-body text-milky-400 mt-2 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Real-time analytics and insights for your SaaS platform
          </motion.p>
        </div>

        <motion.div 
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {METRICS.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <MetricCard3D {...metric} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="grid gap-6 lg:grid-cols-2 mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.div className="glass rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-milky-50">Revenue Overview</h2>
              <div className="glass px-3 py-1 rounded-full text-xs font-mono text-milky-400">Last 12 months</div>
            </div>
            <Chart3D 
              data={CHART_DATA.revenue.data} 
              labels={CHART_DATA.revenue.labels} 
              color="#8b3eff"
            />
          </motion.div>

          <motion.div className="glass rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-milky-50">User Growth</h2>
              <div className="glass px-3 py-1 rounded-full text-xs font-mono text-milky-400">Last 12 months</div>
            </div>
            <Chart3D 
              data={CHART_DATA.users.data} 
              labels={CHART_DATA.users.labels} 
              color="#d946ef"
            />
          </motion.div>
        </motion.div>

        <motion.div 
          className="grid gap-6 lg:grid-cols-3 mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.div className="lg:col-span-2 glass rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-milky-50">Global Activity</h2>
              <div className="glass px-3 py-1 rounded-full text-xs font-mono text-milky-400">Real-time</div>
            </div>
            <Globe3D points={GLOBE_POINTS} />
          </motion.div>

          <motion.div className="glass rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-milky-50">Recent Activity</h2>
              <a href="/activity" className="font-mono text-xs text-uv-400 hover:text-uv-300 transition">View all</a>
            </div>
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity) => (
                <motion.div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 glass rounded-xl transition hover:glass-elevated"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="w-10 h-10 glass-elevated rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-uv-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-milky-50 truncate">{activity.user}</p>
                    <p className="font-body text-sm text-milky-400 truncate">{activity.action}</p>
                  </div>
                  <span className="font-mono text-xs text-milky-500 whitespace-nowrap">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mt-12 glass rounded-2xl p-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-bold text-milky-50">Conversion Funnel</h2>
            <div className="glass px-3 py-1 rounded-full text-xs font-mono text-milky-400">Last 30 days</div>
          </div>
          <Chart3D 
            data={CHART_DATA.conversions.data} 
            labels={CHART_DATA.conversions.labels} 
            color="#e879f9"
          />
        </motion.div>

        <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
          <OrbitalField count={500} radius={8} speed={0.2} className="opacity-30" />
        </div>
      </main>
    </div>
  );
}