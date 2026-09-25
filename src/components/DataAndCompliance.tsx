import React, { useEffect, useState, useMemo } from 'react';
import { 
  FileText, 
  ClipboardList, 
  History, 
  Upload, 
  ShieldCheck, 
  ArrowDownToLine, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileSpreadsheet, 
  Users, 
  MapPin, 
  Briefcase, 
  Clock, 
  Package, 
  Home, 
  Filter, 
  DownloadCloud,
  ChevronRight,
  Database
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface DataAndComplianceProps {
  initialTab?: 'reports' | 'audit' | 'import';
}

export default function DataAndCompliance({ initialTab = 'reports' }: DataAndComplianceProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as 'reports' | 'audit' | 'import' | null;
  const activeTab = urlTab || initialTab;

  const setActiveTab = (tab: 'reports' | 'audit' | 'import') => {
    setSearchParams({ tab });
  };

  // --- Reports & Exports State ---
  const [assetReports, setAssetReports] = useState<any[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'high-risk' | 'healthy'>('all');

  // --- Audit Logs State ---
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  // --- Bulk Import State ---
  const [importType, setImportType] = useState<'employees' | 'assets' | 'sites'>('employees');
  const [file, setFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview, 3: Complete
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: []
  });

  const [globalError, setGlobalError] = useState<string | null>(null);

  // Fetch asset downtime reports
  const fetchAssetReports = async () => {
    setIsLoadingAssets(true);
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/reports/assets', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAssetReports(data);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    setGlobalError(null);
    try {
      const token = (window as any)._token;
      if (!token) return;
      const res = await fetch('/api/audit-logs?limit=150', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAuditLogs(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      }
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchAssetReports();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // Generic CSV Export handler
  const handleExport = async (endpoint: string, filename: string, logEntity: string) => {
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      // Audit log entry for export
      try {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            action: 'EXPORT',
            entity: logEntity,
            details: { endpoint, filename }
          })
        });
      } catch (e) {
        console.warn('Audit log write failed:', e);
      }

      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to fetch data for export`);

      const data = await res.json();
      if (!data || data.length === 0) {
        alert('No records available to export.');
        return;
      }

      // Convert JSON to CSV
      const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header];
          if (val === null || val === undefined) return '';
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Refresh audit logs if on audit tab
      if (activeTab === 'audit') fetchAuditLogs();
    } catch (err: any) {
      console.error(err);
      alert('Error exporting data: ' + err.message);
    }
  };

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = !auditSearch || 
        (log.action && String(log.action).toLowerCase().includes(auditSearch.toLowerCase())) ||
        (log.entity && String(log.entity).toLowerCase().includes(auditSearch.toLowerCase())) ||
        (log.details && String(log.details).toLowerCase().includes(auditSearch.toLowerCase())) ||
        (log.user?.name && String(log.user.name).toLowerCase().includes(auditSearch.toLowerCase())) ||
        (log.user?.email && String(log.user.email).toLowerCase().includes(auditSearch.toLowerCase()));

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesEntity = entityFilter === 'ALL' || log.entity === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [auditLogs, auditSearch, actionFilter, entityFilter]);

  // Unique entities for filter dropdown
  const uniqueEntities = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => { if (l.entity) set.add(l.entity); });
    return Array.from(set);
  }, [auditLogs]);

  // Bulk Import File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            const row: any = {};
            headers.forEach((h, i) => { row[h] = values[i] || ''; });
            return row;
          });
          setPreviewData(data);
          setImportStep(2);
        } else {
          alert("The uploaded file appears to be empty or missing data rows.");
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  // Sample CSV Template Downloader
  const downloadTemplate = (type: 'employees' | 'assets' | 'sites') => {
    let content = '';
    let filename = '';
    if (type === 'employees') {
      content = 'firstName,lastName,employeeId,department,jobTitle,mobile\nAhmed,Al-Mansoor,EMP-1001,Operations,Site Supervisor,+966500000001\nFatima,Al-Harbi,EMP-1002,Human Resources,HR Specialist,+966500000002';
      filename = 'employees_template.csv';
    } else if (type === 'assets') {
      content = 'assetTag,name,category,serialNumber,status,purchaseDate\nAST-2001,Caterpillar 320 Excavator,Heavy Equipment,CAT-320-9981,available,2024-01-15\nAST-2002,Toyota Hilux 4x4,Light Vehicle,TH-8823-KSA,available,2024-02-10';
      filename = 'assets_template.csv';
    } else {
      content = 'name,code,location,status\nRed Sea Facility,RSF-01,Yanbu Coast,active\nRiyadh Metro Logistics,RML-02,Riyadh North,active';
      filename = 'sites_template.csv';
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Commit Bulk Import
  const commitImport = async () => {
    setIsProcessingImport(true);
    let successCount = 0;
    let failCount = 0;
    const errorsList: string[] = [];
    const token = (window as any)._token;

    try {
      if (!token) throw new Error("No authorization token");

      for (let i = 0; i < previewData.length; i++) {
        const row = previewData[i];
        try {
          if (importType === 'employees') {
            const firstName = row.firstName || row['First Name'] || row.first_name || '';
            const lastName = row.lastName || row['Last Name'] || row.last_name || '';
            const employeeId = row.employeeId || row['Employee ID'] || row.employee_id || '';
            const department = row.department || row.Department || '';
            const jobTitle = row.jobTitle || row['Job Title'] || row.title || '';
            const mobile = row.mobile || row.Mobile || row.phone || '';

            if (!firstName || !lastName || !employeeId) {
              throw new Error(`Row ${i + 1}: Missing First Name, Last Name, or Employee ID`);
            }

            const res = await fetch('/api/employees', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ firstName, lastName, employeeId, department, jobTitle, mobile })
            });

            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(`Row ${i + 1} (${employeeId}): ${body.error || 'Server error'}`);
            }
          } else if (importType === 'assets') {
            const assetTag = row.assetTag || row['Asset Tag'] || row.tag || '';
            const name = row.name || row['Name'] || row.title || '';
            const category = row.category || row.Category || row.type || 'Equipment';
            const status = row.status || row.Status || 'available';

            if (!assetTag || !name) {
              throw new Error(`Row ${i + 1}: Missing Asset Tag or Name`);
            }

            const res = await fetch('/api/assets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ assetTag, name, category, status })
            });

            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(`Row ${i + 1} (${assetTag}): ${body.error || 'Server error'}`);
            }
          } else {
            const name = row.name || row['Name'] || '';
            const code = row.code || row['Code'] || '';
            const location = row.location || row.Location || '';
            const status = row.status || row.Status || 'active';

            if (!name) {
              throw new Error(`Row ${i + 1}: Missing Site Name`);
            }

            const res = await fetch('/api/sites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ name, code, location, status })
            });

            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(`Row ${i + 1} (${name}): ${body.error || 'Server error'}`);
            }
          }

          successCount++;
        } catch (e: any) {
          failCount++;
          errorsList.push(e.message);
        }
      }

      setImportResults({ success: successCount, failed: failCount, errors: errorsList });
      setImportStep(3);

      // Log the bulk import event
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'BULK_IMPORT',
          entity: importType.toUpperCase(),
          details: { records: previewData.length, success: successCount, failed: failCount }
        })
      });
    } catch (err: any) {
      console.error(err);
      alert('Bulk import processing encountered an error: ' + err.message);
    } finally {
      setIsProcessingImport(false);
    }
  };

  const filteredAssetReports = useMemo(() => {
    if (reportFilter === 'high-risk') {
      return assetReports.filter(r => r.downtime > 14 || r.serviceCount > 3);
    }
    if (reportFilter === 'healthy') {
      return assetReports.filter(r => r.downtime <= 14 && r.serviceCount <= 3);
    }
    return assetReports;
  }, [assetReports, reportFilter]);

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Data Operations & Compliance</h1>
              <p className="text-xs md:text-sm text-neutral-500 font-medium mt-0.5">
                Unified governance hub for enterprise reporting, immutable audit logs, and mass data ingestion.
              </p>
            </div>
          </div>
        </div>

        {/* Master Segmented Tab Control */}
        <div className="flex items-center p-1 bg-neutral-200/70 rounded-2xl border border-neutral-200 shadow-2xs self-start md:self-auto">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-indigo-600" />
            Reports & Analytics
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <History className="w-4 h-4 text-emerald-600" />
            Audit & Compliance Logs
            {auditLogs.length > 0 && (
              <span className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-neutral-100 text-neutral-600">
                {auditLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'import'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-4 h-4 text-amber-600" />
            Bulk Ingestion
          </button>
        </div>
      </div>

      {globalError && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center justify-between shrink-0">
          <span>{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="text-red-500 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Main Tab Views */}
      <div className="flex-1 min-h-0 bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden flex flex-col">
        
        {/* ========================================================================= */}
        {/* TAB 1: REPORTS & ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {/* Quick Action Data Export Grid */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Direct Enterprise Data Exports</h2>
                  <p className="text-xs text-neutral-500">Download formatted CSV reports across all active operational entities.</p>
                </div>
                <span className="text-xs font-semibold text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-full">
                  6 Formatted Modules
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ExportCard 
                  title="Employee Roster" 
                  description="Complete workforce roster with employee IDs, assignments, department, and contacts."
                  icon={<Users className="w-5 h-5 text-indigo-600" />}
                  badge="Personnel"
                  onExport={() => handleExport('/api/employees', 'employees_roster.csv', 'EMPLOYEES')}
                />
                <ExportCard 
                  title="Sites & Locations" 
                  description="Operational site coordinates, project hubs, and location statuses."
                  icon={<MapPin className="w-5 h-5 text-emerald-600" />}
                  badge="Locations"
                  onExport={() => handleExport('/api/sites', 'operational_sites.csv', 'SITES')}
                />
                <ExportCard 
                  title="Active Projects" 
                  description="Comprehensive project schedules, active supervisor assignments, and dates."
                  icon={<Briefcase className="w-5 h-5 text-blue-600" />}
                  badge="Projects"
                  onExport={() => handleExport('/api/projects', 'active_projects.csv', 'PROJECTS')}
                />
                <ExportCard 
                  title="Timesheets & Labor Hours" 
                  description="Timesheet records, verified shifts, overtime, and payroll validation summaries."
                  icon={<Clock className="w-5 h-5 text-amber-600" />}
                  badge="Payroll"
                  onExport={() => handleExport('/api/timesheets', 'timesheets_summary.csv', 'TIMESHEETS')}
                />
                <ExportCard 
                  title="Asset & Vehicle Fleet" 
                  description="Full machinery and vehicle registry with tags, statuses, and maintenance intervals."
                  icon={<Package className="w-5 h-5 text-orange-600" />}
                  badge="Equipment"
                  onExport={() => handleExport('/api/assets', 'asset_inventory.csv', 'ASSETS')}
                />
                <ExportCard 
                  title="Staff Accommodations" 
                  description="Housing capacity, room assignments, active bed occupancy, and facility audits."
                  icon={<Home className="w-5 h-5 text-violet-600" />}
                  badge="Facilities"
                  onExport={() => handleExport('/api/accommodations', 'staff_accommodations.csv', 'ACCOMMODATIONS')}
                />
              </div>
            </div>

            {/* Asset Downtime & Reliability Report */}
            <div className="pt-6 border-t border-neutral-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Asset Reliability & 12-Month Service Downtime Analysis
                  </h2>
                  <p className="text-xs text-neutral-500">Tracks equipment downtime days and maintenance frequency to flag failure risks.</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-neutral-100 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setReportFilter('all')}
                      className={`px-3 py-1 rounded-md transition-colors ${reportFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                    >
                      All ({assetReports.length})
                    </button>
                    <button
                      onClick={() => setReportFilter('high-risk')}
                      className={`px-3 py-1 rounded-md transition-colors ${reportFilter === 'high-risk' ? 'bg-rose-600 text-white shadow-2xs' : 'text-neutral-500'}`}
                    >
                      High Risk
                    </button>
                    <button
                      onClick={() => setReportFilter('healthy')}
                      className={`px-3 py-1 rounded-md transition-colors ${reportFilter === 'healthy' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-neutral-500'}`}
                    >
                      Healthy
                    </button>
                  </div>
                  <button
                    onClick={fetchAssetReports}
                    className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAssets ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isLoadingAssets ? (
                <div className="p-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredAssetReports.length === 0 ? (
                <div className="p-10 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  No assets match the selected filter criteria.
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 uppercase text-[11px] font-bold">
                      <tr>
                        <th className="px-5 py-3">Asset Details</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Asset Tag</th>
                        <th className="px-5 py-3">Service Frequency (12m)</th>
                        <th className="px-5 py-3">Downtime (Days)</th>
                        <th className="px-5 py-3 text-right">Reliability Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredAssetReports.sort((a, b) => b.downtime - a.downtime).map(report => {
                        const isRisk = report.downtime > 14 || report.serviceCount > 3;
                        return (
                          <tr key={report.id} className="hover:bg-neutral-50/80 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-neutral-900">{report.name}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-md text-xs font-medium">
                                {report.type || 'Equipment'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs text-neutral-600">{report.assetTag}</td>
                            <td className="px-5 py-3.5 font-bold text-neutral-700">{report.serviceCount} service cycles</td>
                            <td className="px-5 py-3.5 font-bold text-rose-600">{report.downtime} days</td>
                            <td className="px-5 py-3.5 text-right">
                              {isRisk ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                                  <AlertCircle className="w-3 h-3" /> High Risk
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" /> Healthy
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: AUDIT & COMPLIANCE LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search logs by actor, action, entity, details..."
                    value={auditSearch}
                    onChange={e => setAuditSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Action Filter */}
                <select
                  value={actionFilter}
                  onChange={e => setActionFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="ALL">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="EXPORT">EXPORT</option>
                  <option value="BULK_IMPORT">BULK IMPORT</option>
                </select>

                {/* Entity Filter */}
                {uniqueEntities.length > 0 && (
                  <select
                    value={entityFilter}
                    onChange={e => setEntityFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="ALL">All Entities</option>
                    {uniqueEntities.map(ent => (
                      <option key={ent} value={ent}>{ent}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={fetchAuditLogs}
                  className="p-2 bg-white border border-neutral-200 hover:bg-neutral-100 rounded-xl text-neutral-700 transition-colors"
                  title="Refresh Audit Trail"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => handleExport('/api/audit-logs?limit=500', 'audit_compliance_logs.csv', 'AUDIT_LOGS')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-2xs"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  Export Trail
                </button>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoadingLogs ? (
                <div className="p-16 flex flex-col items-center justify-center text-neutral-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                  <p className="text-xs font-medium">Loading immutable audit logs...</p>
                </div>
              ) : filteredAuditLogs.length === 0 ? (
                <div className="p-16 text-center text-neutral-400 space-y-2">
                  <History className="w-10 h-10 mx-auto text-neutral-300" />
                  <p className="text-sm font-semibold text-neutral-700">No audit log records match your filter.</p>
                  <p className="text-xs text-neutral-400">All user logins, modifications, exports, and bulk imports are automatically journaled here.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">User / Actor</th>
                      <th className="px-6 py-3.5">Action</th>
                      <th className="px-6 py-3.5">Entity</th>
                      <th className="px-6 py-3.5">Activity Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredAuditLogs.map(log => {
                      const actionColor = 
                        log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        log.action === 'DELETE' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        log.action === 'EXPORT' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-amber-50 text-amber-700 border-amber-200';

                      return (
                        <tr key={log.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-neutral-500 font-medium">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {log.user?.name?.[0] || log.user?.email?.[0] || 'S'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-neutral-900 truncate">
                                  {log.user?.name || log.user?.email || 'System Agent'}
                                </p>
                                {log.user?.email && (
                                  <p className="text-[10px] text-neutral-400 truncate">{log.user.email}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${actionColor}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="font-mono text-xs font-semibold text-neutral-700 bg-neutral-100 px-2 py-1 rounded-md">
                              {log.entity} {log.entityId ? `#${log.entityId}` : ''}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-neutral-600 max-w-md break-words">
                            {log.details ? log.details : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BULK DATA INGESTION */}
        {/* ========================================================================= */}
        {activeTab === 'import' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {/* Step 1: Upload & Entity Select */}
            {importStep === 1 && (
              <div className="max-w-2xl mx-auto space-y-6 pt-4">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-neutral-900">Mass Data Ingestion Engine</h2>
                  <p className="text-xs md:text-sm text-neutral-500">
                    Upload structured CSV files to batch import records with automated validation and duplicate prevention.
                  </p>
                </div>

                {/* Target Entity Picker */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/90 space-y-3">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                    1. Select Target Resource Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setImportType('employees')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        importType === 'employees'
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <Users className="w-5 h-5 text-indigo-600 mb-1" />
                      <p className="text-xs font-bold text-neutral-900">Personnel</p>
                      <p className="text-[10px] text-neutral-500">Employee Roster</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportType('assets')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        importType === 'assets'
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <Package className="w-5 h-5 text-orange-600 mb-1" />
                      <p className="text-xs font-bold text-neutral-900">Equipment</p>
                      <p className="text-[10px] text-neutral-500">Asset & Fleet</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportType('sites')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        importType === 'sites'
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <MapPin className="w-5 h-5 text-emerald-600 mb-1" />
                      <p className="text-xs font-bold text-neutral-900">Locations</p>
                      <p className="text-[10px] text-neutral-500">Sites & Projects</p>
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-neutral-200/60">
                    <span className="text-xs text-neutral-500">Need a starting structure?</span>
                    <button
                      type="button"
                      onClick={() => downloadTemplate(importType)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <DownloadCloud className="w-3.5 h-3.5" />
                      Download {importType === 'employees' ? 'Employee' : importType === 'assets' ? 'Asset' : 'Site'} CSV Template
                    </button>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
                    2. Upload CSV Data File
                  </label>
                  <label className="border-2 border-dashed border-neutral-300 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-400 transition-all group">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform shadow-2xs">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                      Click to choose CSV or drag and drop file here
                    </span>
                    <span className="text-xs text-neutral-400 mt-1">UTF-8 encoded standard CSV</span>
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                {/* Validation Guideline Banner */}
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-600 space-y-1.5">
                  <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-indigo-600" /> Ingestion Guidelines & Requirements
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-500">
                    <li>Headers will be auto-mapped (e.g. "firstName", "First Name", or "first_name").</li>
                    <li>Records with duplicate IDs or missing critical fields will be flagged and reported.</li>
                    <li>You will have a full preview step to inspect mapped columns before committing records.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 2: Data Review & Verification */}
            {importStep === 2 && (
              <div className="h-full flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-indigo-950 text-sm md:text-base">
                      Review & Confirm Data Ingestion ({previewData.length} records detected)
                    </h3>
                    <p className="text-xs text-indigo-700/80">
                      Destination: <strong className="uppercase">{importType}</strong> database. Verify the sample rows below.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => { setFile(null); setPreviewData([]); setImportStep(1); }}
                      disabled={isProcessingImport}
                      className="px-4 py-2 text-neutral-600 hover:bg-neutral-200/50 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={commitImport}
                      disabled={isProcessingImport}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isProcessingImport ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Committing Records...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Commit {previewData.length} Records to Database
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto border border-neutral-200 rounded-2xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 sticky top-0 z-10 text-neutral-600 border-b border-neutral-200 text-xs font-bold">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        {Object.keys(previewData[0] || {}).map((header, i) => (
                          <th key={i} className="px-4 py-3 font-semibold text-neutral-700">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {previewData.slice(0, 100).map((row, i) => (
                        <tr key={i} className="hover:bg-neutral-50">
                          <td className="px-4 py-2.5 text-neutral-400 font-mono">{i + 1}</td>
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="px-4 py-2.5 text-neutral-800">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 100 && (
                    <div className="p-3 text-center text-xs font-medium text-neutral-500 bg-neutral-50 border-t border-neutral-200">
                      Showing first 100 rows of {previewData.length} total detected records.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Ingestion Outcome Summary */}
            {importStep === 3 && (
              <div className="max-w-xl mx-auto py-8 text-center space-y-5">
                <div className="flex justify-center">
                  {importResults.failed === 0 ? (
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Ingestion Operation Completed</h3>
                  <p className="text-xs md:text-sm text-neutral-500 mt-1">
                    Successfully wrote <strong className="text-emerald-700">{importResults.success}</strong> records into the database.
                    {importResults.failed > 0 && (
                      <span className="text-rose-600"> {importResults.failed} rows failed validation.</span>
                    )}
                  </p>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="text-left bg-rose-50 border border-rose-200 rounded-2xl p-4 max-h-56 overflow-y-auto custom-scrollbar">
                    <p className="text-xs font-bold text-rose-800 mb-2">Failure Details:</p>
                    <ul className="list-disc pl-5 text-xs text-rose-700 space-y-1">
                      {importResults.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => { setFile(null); setPreviewData([]); setImportStep(1); }}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    Start Another Ingestion
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Verify in Audit Log
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function ExportCard({ 
  title, 
  description, 
  icon, 
  badge,
  onExport 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  badge: string;
  onExport: () => void;
}) {
  return (
    <div className="bg-neutral-50/60 rounded-2xl border border-neutral-200/90 p-5 flex flex-col justify-between hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all group">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="p-2.5 bg-white rounded-xl shadow-2xs border border-neutral-200/60 group-hover:scale-105 transition-transform">
            {icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-white px-2 py-0.5 rounded-md border border-neutral-200/80">
            {badge}
          </span>
        </div>
        <h3 className="text-sm font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">{title}</h3>
        <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">{description}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-200/60">
        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 py-2 bg-neutral-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-all shadow-2xs"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          Export Formatted CSV
        </button>
      </div>
    </div>
  );
}
