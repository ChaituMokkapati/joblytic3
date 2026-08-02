import { Calendar, Briefcase, Radar, GraduationCap, Sparkles, FolderCheck, Bell, Cpu } from 'lucide-react';

/** Workspace tabs shown in the top navbar (Profile lives in avatar menu only). */
export const WORKSPACE_TABS = [
  { id: 'dashboard', label: 'Deadlines', icon: Calendar },
  { id: 'tracker', label: 'Tracker', icon: Briefcase },
  { id: 'scrape', label: 'Scrape', icon: Radar, accent: 'cyan' },
  { id: 'coaching', label: 'Institute', icon: GraduationCap, accent: 'wine' },
  { id: 'checklist', label: 'Doc Agent', icon: Sparkles },
  { id: 'vault', label: 'Vault', icon: FolderCheck },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'terminal', label: 'Trace', icon: Cpu, accent: 'trace' }
];

export const VALID_WORKSPACE_TABS = new Set([
  ...WORKSPACE_TABS.map((t) => t.id),
  'profile' // reachable from avatar dropdown only
]);

export function parseWorkspaceTab(value) {
  if (value && VALID_WORKSPACE_TABS.has(value)) return value;
  return 'dashboard';
}

export function workspacePath(tab = 'dashboard') {
  if (!tab || tab === 'dashboard') return '/dashboard';
  return `/dashboard?tab=${tab}`;
}
