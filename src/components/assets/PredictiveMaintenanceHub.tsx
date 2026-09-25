import React, { useState, useMemo } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle2, Clock, Wrench, RefreshCw, 
  Search, ShieldAlert, Sparkles, TrendingUp, Calendar, MapPin, 
  SlidersHorizontal, Check, X, FileText, ChevronRight, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PredictiveMaintenanceHubProps {
  predictiveData: any | null;
  onRefresh: () => void;
  onAssetClick?: (asset: any) => void;
}

export default function PredictiveMaintenanceHub({
  predictiveData,
  onRefresh,
  onAssetClick,
}: PredictiveMaintenanceHubProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'upcoming' | 'optimal'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Quick Service Modal
  const [schedulingAsset, setSchedulingAsset] = useState<any | null>(null);
  const [serviceDate, setServiceDate] = useState('2026-09-25');
  const [serviceNotes, setServiceNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Log Maintenance Completed Modal
  const [loggingAsset, setLoggingAsset] = useState<any | null>(null);
  const [logNotes, setLogNotes] = useState('');
  const [logDowntime, setLogDowntime] = useState(1);
  const [isLogging, setIsLogging] = useState(false);

  const summary = predictiveData?.summary || {
    totalAssets: 0,
    criticalCount: 0,
    warningCount: 0,
    upcomingCount: 0,
    optimalCount: 0,
    fleetHealthScore: 100,
    serviceAlertsTotal: 0,
  };

  const items: any[] = predictiveData?.items || [];

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (activeFilter !== 'all' && item.severity !== activeFilter) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(term);
        const matchTag = item.assetTag?.toLowerCase().includes(term);
        const matchType = item.type?.toLowerCase().includes(term);
        const matchMake = item.make?.toLowerCase().includes(term);
        if (!matchName && !matchTag && !matchType && !matchMake) return false;
      }
      return true;
    });
  }, [items, activeFilter, searchTerm]);

  // Sync to system notifications table
  const handleSyncNotifications = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/assets/predictive-maintenance/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSyncMessage(`Successfully generated & synced ${data.count} priority alerts to system notifications!`);
        setTimeout(() => setSyncMessage(null), 5000);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Schedule service for an asset
  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingAsset) return;
    setIsScheduling(true);
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/assets/${schedulingAsset.assetId}/schedule-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          serviceDate,
          notes: serviceNotes || `Scheduled servicing based on predictive maintenance wear cycle analysis (${schedulingAsset.wearPercentage}% elapsed).`
        })
      });
      if (res.ok) {
        setSchedulingAsset(null);
        setServiceNotes('');
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScheduling(false);
    }
  };

  // Log completed service
  const handleConfirmLogService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingAsset) return;
    setIsLogging(true);
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/assets/${loggingAsset.assetId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          serviceDate: new Date().toISOString().split('T')[0],
          technicianNotes: logNotes || 'Completed scheduled preventative overhaul and safety certification.',
          downtimeDays: logDowntime,
          status: 'completed'
        })
      });
      if (res.ok) {
        // Also update asset status back to available if was maintenance
        await fetch(`/api/assets/${loggingAsset.assetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            status: 'available',
            lastMaintenanceDate: new Date().toISOString().split('T')[0]
          })
        });

        setLoggingAsset(null);
        setLogNotes('');
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sync Toast Feedback */}
      <AnimatePresence>
        {syncMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="bg-emerald-600 text-white p-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-bold">{syncMessage}</span>
            </div>
            <button onClick={() => setSyncMessage(null)} className="text-emerald-200 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Predictive Summary Bar */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
              <Activity className="w-4 h-4" />
              <span>Predictive Maintenance & Failure Forecasting Engine</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Equipment Health & Servicing Intelligence</h2>
            <p className="text-neutral-400 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Analyzes historical maintenance intervals, cumulative technician downtime logs, and operational site deployments to forecast when equipment requires preventative servicing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSyncNotifications}
              disabled={isSyncing}
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 backdrop-blur-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing Alerts...' : 'Scan & Sync Notifications'}
            </button>

            <div className="bg-indigo-600/30 border border-indigo-500/30 px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">Fleet Health</span>
              <span className="text-xl font-black text-indigo-100">{summary.fleetHealthScore}%</span>
            </div>
          </div>
        </div>

        {/* Intelligence Metric Badges */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <span className="text-xs text-neutral-400 font-medium block">Urgent Servicing Required</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-red-400">{summary.criticalCount}</span>
              <span className="text-[10px] font-bold text-red-400/80 uppercase px-1.5 py-0.5 bg-red-500/20 rounded">Critical</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <span className="text-xs text-neutral-400 font-medium block">Due in &lt; 15 Days</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400">{summary.warningCount}</span>
              <span className="text-[10px] font-bold text-amber-400/80 uppercase px-1.5 py-0.5 bg-amber-500/20 rounded">Warning</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <span className="text-xs text-neutral-400 font-medium block">Upcoming Normal Cycle</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-blue-400">{summary.upcomingCount}</span>
              <span className="text-[10px] font-bold text-blue-400/80 uppercase px-1.5 py-0.5 bg-blue-500/20 rounded">16-30 Days</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <span className="text-xs text-neutral-400 font-medium block">Monitored Assets</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-neutral-200">{summary.totalAssets}</span>
              <span className="text-[10px] font-bold text-emerald-400/80 uppercase px-1.5 py-0.5 bg-emerald-500/20 rounded">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-2 rounded-2xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeFilter === 'all' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            All Equipment ({items.length})
          </button>
          <button 
            onClick={() => setActiveFilter('critical')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeFilter === 'critical' ? 'bg-red-600 text-white shadow-sm' : 'text-red-600 hover:bg-red-50'}`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            Critical Attention ({summary.criticalCount})
          </button>
          <button 
            onClick={() => setActiveFilter('warning')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeFilter === 'warning' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-50'}`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Upcoming (&lt;15d) ({summary.warningCount})
          </button>
          <button 
            onClick={() => setActiveFilter('optimal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeFilter === 'optimal' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'}`}
          >
            Optimal Health ({summary.optimalCount})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search diagnostic cards..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-56 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Equipment Predictive Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-white border border-neutral-200 rounded-3xl p-16 text-center text-neutral-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-neutral-900">All Equipment In Healthy State</h3>
            <p className="text-sm text-neutral-500 mt-1">No equipment matching the current filter requires attention.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const isCritical = item.severity === 'critical';
            const isWarning = item.severity === 'warning';
            const isUpcoming = item.severity === 'upcoming';

            return (
              <div 
                key={item.assetId}
                className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isCritical ? 'border-red-300 ring-1 ring-red-500/20' : 
                  isWarning ? 'border-amber-300 ring-1 ring-amber-500/20' : 'border-neutral-200'
                }`}
              >
                {/* Card Header */}
                <div className={`p-5 border-b ${
                  isCritical ? 'bg-red-50/40 border-red-100' : 
                  isWarning ? 'bg-amber-50/30 border-amber-100' : 'bg-neutral-50/50 border-neutral-100'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.photoUrl ? (
                        <img src={item.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0" />
                      ) : (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isCritical ? 'bg-red-100 text-red-700' :
                          isWarning ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          <Wrench className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-neutral-900 text-sm leading-tight truncate" title={item.name}>{item.name}</h4>
                        <p className="text-xs font-mono text-neutral-500 mt-0.5">{item.assetTag} • {item.type}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                      isCritical ? 'bg-red-600 text-white animate-pulse' :
                      isWarning ? 'bg-amber-100 text-amber-800' :
                      isUpcoming ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.daysRemaining <= 0 ? `${Math.abs(item.daysRemaining)}d Overdue` :
                       item.daysRemaining <= 7 ? `Due in ${item.daysRemaining}d` :
                       item.daysRemaining <= 15 ? `${item.daysRemaining}d Remaining` : `${item.daysRemaining}d Health`}
                    </span>
                  </div>

                  {/* Wear & Health Meter Gauge */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-neutral-600">Operational Duty Wear</span>
                      <span className={`font-black ${
                        item.wearPercentage >= 90 ? 'text-red-600' :
                        item.wearPercentage >= 75 ? 'text-amber-600' : 'text-neutral-700'
                      }`}>
                        {item.wearPercentage}% Duty Cycle
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.wearPercentage >= 90 ? 'bg-red-600' :
                          item.wearPercentage >= 75 ? 'bg-amber-500' :
                          item.wearPercentage >= 50 ? 'bg-sky-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, item.wearPercentage)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card Body: Algorithmic Diagnosis & Recommendation */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Predictive Servicing Recommendation</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {item.recommendation}
                    </p>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-neutral-50/70 rounded-xl border border-neutral-100">
                      <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Target Service Date</span>
                      <span className="font-bold text-neutral-800 mt-0.5 block flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        {item.projectedNextServiceDate}
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-50/70 rounded-xl border border-neutral-100">
                      <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Calculated MTBF</span>
                      <span className="font-bold text-neutral-800 mt-0.5 block">
                        {item.effectiveIntervalDays} days cycle
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-50/70 rounded-xl border border-neutral-100">
                      <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Past Services Logged</span>
                      <span className="font-bold text-neutral-800 mt-0.5 block">
                        {item.serviceHistoryCount} recorded
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-50/70 rounded-xl border border-neutral-100">
                      <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Total Downtime</span>
                      <span className="font-bold text-neutral-800 mt-0.5 block">
                        {item.totalDowntimeDays} days historical
                      </span>
                    </div>
                  </div>

                  {item.deployment && (
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-medium text-neutral-700 truncate">
                        {item.deployment.siteName || 'HQ'} {item.deployment.projectName ? `(${item.deployment.projectName})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setSchedulingAsset(item);
                      setServiceDate(item.projectedNextServiceDate);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                      isCritical ? 'bg-red-600 hover:bg-red-700 text-white' :
                      isWarning ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Schedule Service
                  </button>

                  <button 
                    onClick={() => setLoggingAsset(item)}
                    title="Log completed service maintenance"
                    className="p-2 bg-white border border-neutral-200 hover:border-indigo-600 text-neutral-700 hover:text-indigo-600 rounded-xl transition-colors shrink-0"
                  >
                    <Wrench className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => onAssetClick && onAssetClick({ id: item.assetId, ...item })}
                    title="View full asset specifications & audit history"
                    className="p-2 bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-500 rounded-xl transition-colors shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SCHEDULE SERVICE MODAL */}
      <AnimatePresence>
        {schedulingAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-neutral-900">Schedule Preventative Service</h3>
                </div>
                <button onClick={() => setSchedulingAsset(null)} className="text-neutral-400 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmSchedule} className="p-6 space-y-4">
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-bold">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900">{schedulingAsset.name}</h4>
                    <p className="text-xs text-neutral-500 font-mono">{schedulingAsset.assetTag}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Target Service Date *</label>
                  <input 
                    type="date"
                    required
                    value={serviceDate}
                    onChange={e => setServiceDate(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Algorithm suggested target: <span className="font-bold text-indigo-600">{schedulingAsset.projectedNextServiceDate}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Service Instructions / Work Scope</label>
                  <textarea 
                    rows={3}
                    placeholder="e.g., Full hydraulic fluid flush, pressure gauge inspection, rotor balancing..."
                    value={serviceNotes}
                    onChange={e => setServiceNotes(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20"
                  ></textarea>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setSchedulingAsset(null)}
                    className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isScheduling}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                  >
                    {isScheduling ? 'Scheduling...' : 'Confirm Service Order'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOG MAINTENANCE COMPLETED MODAL */}
      <AnimatePresence>
        {loggingAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-neutral-900">Record Completed Servicing</h3>
                </div>
                <button onClick={() => setLoggingAsset(null)} className="text-neutral-400 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmLogService} className="p-6 space-y-4">
                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-bold shadow-sm">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900">{loggingAsset.name}</h4>
                    <p className="text-xs text-neutral-500 font-mono">{loggingAsset.assetTag}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Technician Notes & Replaced Parts *</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="e.g., Replaced drive belt, lubricated main bearings, performed 4-hour stress test without issues..."
                    value={logNotes}
                    onChange={e => setLogNotes(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Recorded Equipment Downtime (Days)</label>
                  <input 
                    type="number"
                    min="0"
                    max="60"
                    value={logDowntime}
                    onChange={e => setLogDowntime(parseInt(e.target.value) || 0)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">Downtime is factored into future MTBF predictions.</p>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setLoggingAsset(null)}
                    className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLogging}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                  >
                    {isLogging ? 'Logging...' : 'Save Maintenance Log'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
