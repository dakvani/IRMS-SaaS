import React from 'react';
import { Users, Briefcase, Activity, CheckCircle2, TrendingUp, Layers, MapPin, Package, ArrowUpRight, FileDown, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export interface DashboardKpiData {
  totalEmployees: number;
  activeEmployees: number;
  totalSites: number;
  totalProjects: number;
  ongoingProjects: number;
  totalAssets: number;
  assignedAssets: number;
  resourceUtilizationPercentage: number;
}

interface DashboardKpiSummaryProps {
  stats: DashboardKpiData;
  onRefresh?: () => void;
  onDownloadReport?: () => void;
  isLoading?: boolean;
}

export default function DashboardKpiSummary({ stats, onRefresh, onDownloadReport, isLoading }: DashboardKpiSummaryProps) {
  const activeEmp = stats.activeEmployees ?? stats.totalEmployees ?? 0;
  const totalEmp = Math.max(stats.totalEmployees ?? 0, activeEmp);
  const activeEmpRatio = totalEmp > 0 ? Math.round((activeEmp / totalEmp) * 100) : 100;

  const ongoingProj = stats.ongoingProjects ?? stats.totalProjects ?? 0;
  const totalProj = Math.max(stats.totalProjects ?? 0, ongoingProj);
  const activeProjRatio = totalProj > 0 ? Math.round((ongoingProj / totalProj) * 100) : 100;

  const utilization = Math.min(100, Math.max(0, stats.resourceUtilizationPercentage ?? 85));
  
  // Utilization status indicator
  const getUtilizationStatus = (pct: number) => {
    if (pct >= 90) return { label: 'Peak Capacity', color: 'text-amber-600', dot: 'bg-amber-500', bar: 'bg-amber-500' };
    if (pct >= 70) return { label: 'Optimal Efficiency', color: 'text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-600' };
    return { label: 'Available Capacity', color: 'text-blue-700', dot: 'bg-blue-500', bar: 'bg-blue-600' };
  };

  const status = getUtilizationStatus(utilization);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Executive Performance Scorecard
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Data
          </span>
        </div>
        {onDownloadReport && (
          <button
            type="button"
            onClick={onDownloadReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold shadow-2xs hover:border-neutral-300 transition-all cursor-pointer active:scale-98"
            title="Preview and export KPI summary report as PDF or print"
          >
            <FileDown className="w-3.5 h-3.5 text-orange-600" />
            <span>Export Report</span>
          </button>
        )}
      </div>

      {/* High-Level KPI Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Active Employees */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 relative overflow-hidden transition-all duration-200 hover:border-neutral-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Workforce Status
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-500">Active Employees</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-neutral-950 tracking-tight">
                {activeEmp.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-neutral-500">
                of {totalEmp.toLocaleString()} total
              </span>
            </div>
          </div>

          {/* Clean unboxed metadata separator */}
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-1.5 font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{activeEmpRatio}% workforce active</span>
            </div>
            <span className="text-neutral-400">Deployed across sites</span>
          </div>
        </div>

        {/* KPI 2: Ongoing Projects */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 relative overflow-hidden transition-all duration-200 hover:border-neutral-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Project Pipeline
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-500">Ongoing Projects</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-neutral-950 tracking-tight">
                {ongoingProj.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-neutral-500">
                active in progress
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-1.5 font-medium text-neutral-700">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              <span>{stats.totalSites || 0} active field sites</span>
            </div>
            <span className="text-neutral-400">
              {stats.totalProjects || ongoingProj} total logged
            </span>
          </div>
        </div>

        {/* KPI 3: Resource Utilization Percentage */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 relative overflow-hidden transition-all duration-200 hover:border-neutral-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Operations Efficiency
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-500">Resource Utilization Percentage</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-neutral-950 tracking-tight">
                {utilization}%
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                <span className={`text-xs font-semibold ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          {/* Progress track */}
          <div className="mt-3.5">
            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${status.bar} transition-all duration-500 rounded-full`}
                style={{ width: `${utilization}%` }}
              />
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500">
            <span>Workforce & asset deployment rate</span>
            <span className="font-semibold text-neutral-700">{utilization}% target reached</span>
          </div>
        </div>
      </div>
    </div>
  );
}
