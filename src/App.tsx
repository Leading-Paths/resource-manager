import { HashRouter, NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Tags, GitBranch, Server, Grid3x3 } from 'lucide-react';
import { DataMenu } from './components/DataMenu';
import { Toaster } from './components/ui/toast';
import { TeamPage } from './pages/TeamPage';
import { SkillsPage } from './pages/SkillsPage';
import { MemberSkillsPage } from './pages/MemberSkillsPage';
import { SystemsPage } from './pages/SystemsPage';
import { SmeMatrixPage } from './pages/SmeMatrixPage';
import { DashboardPage } from './pages/DashboardPage';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/skills', label: 'Skills', icon: Tags },
  { to: '/member-skills', label: 'Member skills', icon: GitBranch },
  { to: '/systems', label: 'Systems', icon: Server },
  { to: '/sme', label: 'SME matrix', icon: Grid3x3 },
];

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-full flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-white grid place-items-center font-semibold">
                R
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 leading-tight">Resource Manager</div>
                <div className="text-xs text-slate-500 leading-tight">SME coverage & BAU capacity</div>
              </div>
            </div>
            <DataMenu />
          </div>
          <nav className="px-2 lg:px-4 border-t border-slate-100 flex gap-0.5 overflow-x-auto scroll-fade-x">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                     ${isActive
                       ? 'border-brand-600 text-brand-700'
                       : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'}`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {n.label}
                </NavLink>
              );
            })}
          </nav>
        </header>
        <main className="flex-1 px-4 lg:px-6 py-6 max-w-[1600px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/member-skills" element={<MemberSkillsPage />} />
            <Route path="/systems" element={<SystemsPage />} />
            <Route path="/sme" element={<SmeMatrixPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </HashRouter>
  );
}
