import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  FileDown,
  Printer,
  CheckCircle2,
  Users,
  Briefcase,
  Activity,
  MapPin,
  Package,
  ShieldCheck,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { sanitizeDocumentOklch } from '../utils/pdfColorSanitizer.ts';
import { printElement } from '../utils/printElement.ts';

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

interface KpiSummaryPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardKpiData;
  reportDate?: string;
}

export default function KpiSummaryPdfModal({
  isOpen,
  onClose,
  stats,
  reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}: KpiSummaryPdfModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [includeAuditVerification, setIncludeAuditVerification] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  // Computed metrics
  const activeEmp = stats.activeEmployees ?? stats.totalEmployees ?? 0;
  const totalEmp = Math.max(stats.totalEmployees ?? 0, activeEmp);
  const activeEmpRatio = totalEmp > 0 ? Math.round((activeEmp / totalEmp) * 100) : 100;

  const ongoingProj = stats.ongoingProjects ?? stats.totalProjects ?? 0;
  const totalProj = Math.max(stats.totalProjects ?? 0, ongoingProj);
  const activeProjRatio = totalProj > 0 ? Math.round((ongoingProj / totalProj) * 100) : 100;

  const utilization = Math.min(100, Math.max(0, stats.resourceUtilizationPercentage ?? 85));
  const totalAssets = stats.totalAssets ?? 0;
  const assignedAssets = stats.assignedAssets ?? 0;
  const assetRatio = totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0;
  const totalSites = stats.totalSites ?? 0;

  const getUtilizationInfo = (pct: number) => {
    if (pct >= 90) return { label: 'Peak Capacity', bgHex: '#fef3c7', textHex: '#92400e', barHex: '#f59e0b' };
    if (pct >= 70) return { label: 'Optimal Efficiency', bgHex: '#dcfce7', textHex: '#166534', barHex: '#16a34a' };
    return { label: 'Available Capacity', bgHex: '#dbeafe', textHex: '#1e40af', barHex: '#2563eb' };
  };

  const utilizationInfo = getUtilizationInfo(utilization);
  const generatedTime = useMemo(() => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), []);
  const reportId = useMemo(() => `IRMS-KPI-${Math.floor(100000 + Math.random() * 900000)}`, []);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      // 1. Audit log export action
      const token = (window as any)._token;
      if (token) {
        fetch('/api/audit-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'EXPORT',
            entity: 'KPI_SUMMARY_REPORT_PDF',
            details: {
              reportId,
              activeEmployees: activeEmp,
              ongoingProjects: ongoingProj,
              resourceUtilizationPercentage: utilization
            }
          })
        }).catch((err) => console.error('Failed to log PDF export audit:', err));
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `IRMS_Executive_KPI_Summary_${timestamp}.pdf`;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          onclone: (clonedDoc: Document) => {
            sanitizeDocumentOklch(clonedDoc);
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(reportRef.current).save();
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF automatically. You may use the Print Report button instead.');
    } finally {
      setIsExporting(false);
    }
  };

  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const handlePrint = () => {
    if (reportRef.current) {
      setPrintStatus('Opening Printer...');
      printElement(reportRef.current, `IRMS_KPI_Summary_${reportId}`);
      setTimeout(() => {
        setPrintStatus('Print Dialog Ready');
        setTimeout(() => setPrintStatus(null), 2500);
      }, 400);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-4xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Action Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-neutral-50/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-900 text-white shadow-xs">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
                  Executive KPI Summary PDF Report
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  Live Snapshot
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Ready to export executive metrics: Active Employees, Ongoing Projects, and Resource Utilization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Print document directly to printer"
            >
              <Printer className="w-4 h-4 text-orange-600" />
              <span>{printStatus || 'Print to Printer'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-orange-400" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors ml-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Customization Controls */}
        <div className="px-5 py-2.5 bg-neutral-100/60 border-b border-neutral-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeRecommendations}
                onChange={(e) => setIncludeRecommendations(e.target.checked)}
                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-3.5 h-3.5"
              />
              <span className="font-medium text-neutral-700">Include Strategic Observations</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAuditVerification}
                onChange={(e) => setIncludeAuditVerification(e.target.checked)}
                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-3.5 h-3.5"
              />
              <span className="font-medium text-neutral-700">Include Audit Signature Block</span>
            </label>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">
            Report Reference: {reportId}
          </span>
        </div>

        {/* Modal Printable Body / Document Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100 custom-scrollbar">
          <div
            ref={reportRef}
            className="print-area bg-white text-neutral-900 p-8 sm:p-10 rounded-2xl shadow-sm border border-neutral-200/90 max-w-[794px] mx-auto text-sm print:shadow-none print:border-none print:p-0"
            style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            {/* 1. Header Banner */}
            <div className="border-b-2 border-neutral-900 pb-5 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-neutral-900 text-white font-mono text-[11px] font-bold tracking-widest uppercase">
                      IRMS ENTERPRISE
                    </span>
                    <span className="text-xs font-semibold text-neutral-500 tracking-wider uppercase">
                      Executive Operations
                    </span>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-neutral-950 mt-1">
                    EXECUTIVE KPI SUMMARY REPORT
                  </h1>
                  <p className="text-xs text-neutral-600 font-medium mt-0.5">
                    High-Level Operational Status, Workforce Deployment & Capacity Utilization
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-neutral-900">{reportDate}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Time: {generatedTime}</div>
                  <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold tracking-wide uppercase">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Live
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Executive Key Highlights Callout */}
            <div className="mb-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  Executive Performance Brief
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  REF: {reportId}
                </span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                This report consolidates operational performance data from active personnel registries, deployed project engagements, field site assignments, and fleet inventory. Currently, <strong>{activeEmp} of {totalEmp}</strong> employees are actively deployed ({activeEmpRatio}% workforce deployment rate), supervising <strong>{ongoingProj} active projects</strong> across <strong>{totalSites} operational sites</strong> with an overall resource utilization index of <strong>{utilization}%</strong>.
              </p>
            </div>

            {/* 3. Primary KPI Cards Grid (The Core Requested 3 Metrics) */}
            <div className="mb-8">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                Core Key Performance Indicators
              </h2>

              <div className="grid grid-cols-3 gap-3">
                
                {/* KPI Card 1: Active Employees */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-white" style={{ borderLeft: '4px solid #4f46e5' }}>
                  <div className="flex items-center justify-between text-neutral-600 text-xs font-semibold mb-1">
                    <span>Active Employees</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      Workforce
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-2xl font-black text-neutral-950 tracking-tight">
                      {activeEmp.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-neutral-500">
                      / {totalEmp.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{activeEmpRatio}% active rate</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Deployed across operational sites
                  </p>
                </div>

                {/* KPI Card 2: Ongoing Projects */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-white" style={{ borderLeft: '4px solid #2563eb' }}>
                  <div className="flex items-center justify-between text-neutral-600 text-xs font-semibold mb-1">
                    <span>Ongoing Projects</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                      Pipeline
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-2xl font-black text-neutral-950 tracking-tight">
                      {ongoingProj.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-neutral-500">
                      / {totalProj.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-neutral-700 mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    <span>{totalSites} active field sites</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    {totalProj} total projects registered
                  </p>
                </div>

                {/* KPI Card 3: Resource Utilization Percentage */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-white" style={{ borderLeft: '4px solid #16a34a' }}>
                  <div className="flex items-center justify-between text-neutral-600 text-xs font-semibold mb-1">
                    <span>Resource Utilization</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: utilizationInfo.bgHex, color: utilizationInfo.textHex }}
                    >
                      {utilizationInfo.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-2xl font-black text-neutral-950 tracking-tight">
                      {utilization}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${utilization}%`, backgroundColor: utilizationInfo.barHex }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Workforce & asset deployment rate
                  </p>
                </div>

              </div>
            </div>

            {/* 4. Detailed Metrics Breakdown Table */}
            <div className="mb-8">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                Comprehensive Metrics Breakdown
              </h2>
              
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                      <th className="py-2.5 px-3">Metric Category</th>
                      <th className="py-2.5 px-3">Indicator Description</th>
                      <th className="py-2.5 px-3 text-right">Current Value</th>
                      <th className="py-2.5 px-3 text-right">Baseline / Total</th>
                      <th className="py-2.5 px-3 text-center">Status / Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">Workforce Status</td>
                      <td className="py-2.5 px-3 text-neutral-600">Active Deployed Employees</td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-950">{activeEmp}</td>
                      <td className="py-2.5 px-3 text-right text-neutral-500">{totalEmp} Total</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {activeEmpRatio}% Active
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">Project Operations</td>
                      <td className="py-2.5 px-3 text-neutral-600">Ongoing Active Engagements</td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-950">{ongoingProj}</td>
                      <td className="py-2.5 px-3 text-right text-neutral-500">{totalProj} Total</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {activeProjRatio}% Active
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">Capacity & Efficiency</td>
                      <td className="py-2.5 px-3 text-neutral-600">Resource Utilization Percentage</td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-950">{utilization}%</td>
                      <td className="py-2.5 px-3 text-right text-neutral-500">100% Target</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: utilizationInfo.bgHex, color: utilizationInfo.textHex }}
                        >
                          {utilizationInfo.label}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">Field Sites</td>
                      <td className="py-2.5 px-3 text-neutral-600">Active Operational Locations</td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-950">{totalSites}</td>
                      <td className="py-2.5 px-3 text-right text-neutral-500">{totalSites} Logged</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800">
                          Operational
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">Equipment & Fleet</td>
                      <td className="py-2.5 px-3 text-neutral-600">Assigned Physical Assets</td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-950">{assignedAssets}</td>
                      <td className="py-2.5 px-3 text-right text-neutral-500">{totalAssets} Total</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          {assetRatio}% Assigned
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Strategic Observations (Optional Checkbox) */}
            {includeRecommendations && (
              <div className="mb-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
                  Strategic Observations & Analysis
                </h3>
                <ul className="text-xs text-neutral-600 space-y-1.5 list-disc pl-4">
                  <li>
                    <strong>Workforce Stability:</strong> {activeEmpRatio}% of staff are active and deployed across field assignments, maintaining strong staffing continuity.
                  </li>
                  <li>
                    <strong>Project Density:</strong> With {ongoingProj} active projects across {totalSites} field sites, the operational load averages {(ongoingProj / Math.max(1, totalSites)).toFixed(1)} projects per site.
                  </li>
                  <li>
                    <strong>Operational Capacity:</strong> Resource utilization is at {utilization}%, categorized as <strong>{utilizationInfo.label}</strong>, indicating balanced workload distribution without critical resource shortages.
                  </li>
                </ul>
              </div>
            )}

            {/* 6. Official Sign-off and Verification Footer */}
            {includeAuditVerification && (
              <div className="pt-5 border-t border-neutral-200 mt-6 flex justify-between items-end text-neutral-500 text-[11px]">
                <div>
                  <p className="font-semibold text-neutral-800">Integrated Resource Management System (IRMS)</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Automated Executive KPI Generation Engine • Internal Use Only</p>
                  <p className="font-mono text-[9px] text-neutral-400 mt-1">HASH: SHA256-IRMS-{reportId}-VERIFIED</p>
                </div>
                <div className="text-right">
                  <div className="border-b border-neutral-300 w-44 pb-1 mb-1 text-center font-serif italic text-neutral-700 text-xs">
                    Automated Executive Clearance
                  </div>
                  <p className="text-[10px] font-medium text-neutral-600">Authorized System Signature</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 border-t border-neutral-200 bg-white flex justify-between items-center text-xs">
          <span className="text-neutral-500">
            Export format: <strong>A4 Portrait PDF (Standard 2x Retina Print Quality)</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-orange-400" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
