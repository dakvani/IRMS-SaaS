import React, { useState, useRef } from 'react';
import {
  X,
  FileDown,
  Printer,
  CheckCircle2,
  Users,
  Briefcase,
  MapPin,
  Package,
  ShieldCheck,
  Calendar,
  Building2,
  Clock,
  Home,
  Truck,
  FileText,
  User,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { sanitizeDocumentOklch } from '../utils/pdfColorSanitizer.ts';
import { printElement } from '../utils/printElement.ts';

interface EmployeeDossierPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  dossierData: any;
}

export default function EmployeeDossierPdfModal({
  isOpen,
  onClose,
  employee,
  dossierData,
}: EmployeeDossierPdfModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !employee) return null;

  const emp = employee;
  const activeAcc = dossierData?.activeAccommodation;
  const accHistory = dossierData?.accommodationHistory || [];
  const activeAssign = dossierData?.activeAssignment;
  const assignHistory = dossierData?.assignmentHistory || [];
  const activeVeh = dossierData?.activeVehicle;
  const vehHistory = dossierData?.vehicleHistory || [];
  const assetsList = dossierData?.assets || [];
  const assetHist = dossierData?.assetHistory || [];
  const docs = dossierData?.documents || [];
  const leaves = dossierData?.leaves || [];
  const timesheets = dossierData?.timesheets || [];

  const handlePrint = () => {
    if (reportRef.current) {
      setPrintStatus('Opening Printer...');
      printElement(reportRef.current, `IRMS_Dossier_${emp.employeeId || emp.id}`);
      setTimeout(() => {
        setPrintStatus('Print Dialog Ready');
        setTimeout(() => setPrintStatus(null), 2500);
      }, 400);
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || isExporting) return;
    setIsExporting(true);

    try {
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
            entity: 'EMPLOYEE_DOSSIER_REPORT_PDF',
            details: {
              employeeId: emp.id,
              employeeName: `${emp.firstName} ${emp.lastName}`,
              empCode: emp.employeeId
            }
          })
        }).catch((err) => console.error('Failed to log PDF export audit:', err));
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `IRMS_Employee_Dossier_${emp.employeeId || emp.id}_${timestamp}.pdf`;

      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
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
      alert('Failed to generate PDF automatically. You may use the Print button instead.');
    } finally {
      setIsExporting(false);
    }
  };

  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-4xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Action Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-neutral-50/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-900 text-white shadow-xs">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
                  Employee 360° Master Dossier Report
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                  Report Preview
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Official operational documentation for {emp.firstName} {emp.lastName} ({emp.employeeId}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Send directly to printer"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
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
                  <FileDown className="w-4 h-4 text-indigo-400" />
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

        {/* Modal Printable Body / Document Preview */}
        <div className="flex-1 overflow-y-auto bg-neutral-100/60 p-4 sm:p-6 custom-scrollbar">
          <div
            ref={reportRef}
            className="print-area bg-white max-w-[794px] mx-auto p-8 sm:p-10 shadow-sm border border-neutral-200/90 rounded-xl text-neutral-900 font-sans print:shadow-none print:border-none print:p-0"
            style={{ minHeight: '1050px', width: '100%', boxSizing: 'border-box' }}
          >
            {/* Document Header */}
            <div className="border-b-2 border-neutral-900 pb-5 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
                      IR
                    </div>
                    <span className="text-xl font-black tracking-tight text-neutral-950">
                      IRMS ENTERPRISE SAAS
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
                    Industrial Resource Management • Workforce & Asset Platform
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-2.5 py-1 rounded bg-neutral-900 text-white font-mono text-[10px] font-bold tracking-widest uppercase mb-1">
                    CONFIDENTIAL DOSSIER
                  </div>
                  <p className="text-[11px] text-neutral-500 font-medium">Generated: {reportDate}</p>
                  <p className="text-[11px] font-mono text-neutral-400">Ref: EMP-{emp.employeeId || emp.id}</p>
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-950">
                  {emp.firstName} {emp.lastName}
                </h1>
                <p className="text-xs text-neutral-600 mt-0.5">
                  {emp.jobTitle || 'Technician'} • {emp.department || 'Operations'} • {emp.employmentType || 'Full-time'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-1 bg-white border border-neutral-300 rounded text-neutral-800">
                  ID: {emp.employeeId}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
                  emp.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {emp.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Employee Information 2-Column Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              <div className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200/80 space-y-2">
                <div className="font-bold text-neutral-900 border-b border-neutral-200 pb-1 uppercase tracking-wide text-[10px]">
                  Personal & Legal Information
                </div>
                <div className="flex justify-between"><span className="text-neutral-500">Nationality:</span><span className="font-semibold text-neutral-800">{emp.nationality || 'Saudi Arabia'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">National ID / Iqama:</span><span className="font-mono font-semibold text-neutral-800">{emp.nationalId || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Date of Birth:</span><span className="font-semibold text-neutral-800">{emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString() : 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Gender:</span><span className="font-semibold text-neutral-800">{emp.gender || 'Male'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Compliance:</span><span className="font-bold text-emerald-700">Verified GOSI / Qiwa</span></div>
              </div>

              <div className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200/80 space-y-2">
                <div className="font-bold text-neutral-900 border-b border-neutral-200 pb-1 uppercase tracking-wide text-[10px]">
                  Contact & Corporate Details
                </div>
                <div className="flex justify-between"><span className="text-neutral-500">Mobile Phone:</span><span className="font-semibold text-neutral-800">{emp.mobile || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Corporate Email:</span><span className="font-semibold text-neutral-800 truncate max-w-[180px]">{emp.email || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Emergency Contact:</span><span className="font-semibold text-neutral-800">{emp.emergencyContact || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Joining Date:</span><span className="font-semibold text-neutral-800">{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Position Level:</span><span className="font-semibold text-neutral-800">{emp.position || 'Standard'}</span></div>
              </div>
            </div>

            {/* Current Active Deployments Snapshot Cards */}
            <div className="grid grid-cols-4 gap-3 mb-6 text-xs">
              <div className="bg-orange-50/60 border border-orange-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wide block">Current Housing</span>
                <span className="font-bold text-neutral-900 block truncate mt-1">
                  {activeAcc ? activeAcc.accommodation?.name : 'Not Housed'}
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  {activeAcc ? `Room ${activeAcc.room?.roomNumber}` : `${accHistory.length} past stays`}
                </span>
              </div>

              <div className="bg-blue-50/60 border border-blue-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide block">Current Deployment</span>
                <span className="font-bold text-neutral-900 block truncate mt-1">
                  {activeAssign ? `${activeAssign.project?.name || activeAssign.site?.name}` : 'Unassigned'}
                </span>
                <span className="text-[10px] text-neutral-500 block truncate">
                  {activeAssign?.role || `${assignHistory.length} total deployments`}
                </span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block">Current Vehicle</span>
                <span className="font-bold text-neutral-900 block truncate mt-1">
                  {activeVeh ? `${activeVeh.vehicle?.make} ${activeVeh.vehicle?.model}` : 'No Vehicle'}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 block">
                  {activeVeh ? activeVeh.vehicle?.licensePlate : `${vehHistory.length} past records`}
                </span>
              </div>

              <div className="bg-purple-50/60 border border-purple-200 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wide block">Allocated Assets</span>
                <span className="font-bold text-neutral-900 block truncate mt-1">
                  {assetsList.length} Active Items
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  {assetHist.length} total allocations
                </span>
              </div>
            </div>

            {/* SECTION 1: Housing & Accommodation History */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-orange-600" />
                Staff Housing & Accommodation History ({accHistory.length})
              </h3>
              {accHistory.length > 0 ? (
                <table className="w-full text-left text-xs border border-neutral-200 rounded-lg overflow-hidden">
                  <thead className="bg-neutral-100 text-neutral-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Property Name</th>
                      <th className="p-2">Room / Building</th>
                      <th className="p-2">Check-in</th>
                      <th className="p-2">Check-out</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {accHistory.map((h: any, i: number) => (
                      <tr key={i} className="hover:bg-neutral-50">
                        <td className="p-2 font-semibold text-neutral-800">{h.accommodation?.name || 'Accommodation'}</td>
                        <td className="p-2 text-neutral-600">Room {h.room?.roomNumber} ({h.room?.building || 'Main'})</td>
                        <td className="p-2 font-mono text-[11px]">{h.startDate ? new Date(h.startDate).toLocaleDateString() : '-'}</td>
                        <td className="p-2 font-mono text-[11px]">{h.endDate ? new Date(h.endDate).toLocaleDateString() : 'Present'}</td>
                        <td className="p-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            h.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-neutral-400 text-xs italic">No accommodation history recorded.</p>
              )}
            </div>

            {/* SECTION 2: Deployments & Assignments History */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                Deployments & Project Assignments ({assignHistory.length})
              </h3>
              {assignHistory.length > 0 ? (
                <table className="w-full text-left text-xs border border-neutral-200 rounded-lg overflow-hidden">
                  <thead className="bg-neutral-100 text-neutral-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Assigned Role</th>
                      <th className="p-2">Site / Location</th>
                      <th className="p-2">Project & Client</th>
                      <th className="p-2">Start Date</th>
                      <th className="p-2">End Date</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {assignHistory.map((a: any, i: number) => (
                      <tr key={i} className="hover:bg-neutral-50">
                        <td className="p-2 font-semibold text-neutral-800">{a.role}</td>
                        <td className="p-2 text-neutral-600">{a.site?.name || 'N/A'}</td>
                        <td className="p-2 text-neutral-600">{a.project?.name || 'General Operations'}</td>
                        <td className="p-2 font-mono text-[11px]">{a.startDate ? new Date(a.startDate).toLocaleDateString() : '-'}</td>
                        <td className="p-2 font-mono text-[11px]">{a.endDate ? new Date(a.endDate).toLocaleDateString() : 'Ongoing'}</td>
                        <td className="p-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            a.status?.toLowerCase() === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-neutral-400 text-xs italic">No project assignments recorded.</p>
              )}
            </div>

            {/* SECTION 3: Vehicles & Transport History */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                Company Vehicles & Fleet Assignments ({vehHistory.length})
              </h3>
              {vehHistory.length > 0 ? (
                <table className="w-full text-left text-xs border border-neutral-200 rounded-lg overflow-hidden">
                  <thead className="bg-neutral-100 text-neutral-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Make & Model</th>
                      <th className="p-2">Plate Number</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Assigned Date</th>
                      <th className="p-2">Return Date</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {vehHistory.map((v: any, i: number) => (
                      <tr key={i} className="hover:bg-neutral-50">
                        <td className="p-2 font-semibold text-neutral-800">{v.vehicle?.make} {v.vehicle?.model} ({v.vehicle?.year || '2023'})</td>
                        <td className="p-2 font-mono font-bold text-neutral-700">{v.vehicle?.licensePlate}</td>
                        <td className="p-2 text-neutral-600">{v.vehicle?.type || 'Pickup'}</td>
                        <td className="p-2 font-mono text-[11px]">{v.startDate ? new Date(v.startDate).toLocaleDateString() : '-'}</td>
                        <td className="p-2 font-mono text-[11px]">{v.endDate ? new Date(v.endDate).toLocaleDateString() : 'Current'}</td>
                        <td className="p-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            v.status?.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-neutral-400 text-xs italic">No company vehicle assignments on record.</p>
              )}
            </div>

            {/* SECTION 4: Assets & Tools History */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-purple-600" />
                Allocated Assets & Equipment ({assetsList.length + assetHist.length})
              </h3>
              {assetsList.length > 0 || assetHist.length > 0 ? (
                <table className="w-full text-left text-xs border border-neutral-200 rounded-lg overflow-hidden">
                  <thead className="bg-neutral-100 text-neutral-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Asset Name</th>
                      <th className="p-2">Tag #</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Make / Model</th>
                      <th className="p-2 text-right">Allocation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {assetsList.map((a: any, i: number) => (
                      <tr key={`cur-${i}`} className="hover:bg-neutral-50">
                        <td className="p-2 font-semibold text-neutral-800">{a.name}</td>
                        <td className="p-2 font-mono font-bold text-neutral-700">{a.assetTag}</td>
                        <td className="p-2 text-neutral-600">{a.type}</td>
                        <td className="p-2 text-neutral-500">{a.make || ''} {a.model || ''}</td>
                        <td className="p-2 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                            Currently In Custody
                          </span>
                        </td>
                      </tr>
                    ))}
                    {assetHist.map((h: any, i: number) => (
                      <tr key={`hist-${i}`} className="hover:bg-neutral-50 opacity-80">
                        <td className="p-2 font-semibold text-neutral-700">{h.asset?.name}</td>
                        <td className="p-2 font-mono text-neutral-600">{h.asset?.assetTag}</td>
                        <td className="p-2 text-neutral-500">{h.asset?.type}</td>
                        <td className="p-2 text-neutral-500">{h.asset?.make || ''} {h.asset?.model || ''}</td>
                        <td className="p-2 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-600">
                            Returned / Past
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-neutral-400 text-xs italic">No tools or IT assets allocated to this employee.</p>
              )}
            </div>

            {/* SECTION 5: Official Documents Archive */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Verified GCC & Saudi Official Documents ({docs.length})
              </h3>
              {docs.length > 0 ? (
                <table className="w-full text-left text-xs border border-neutral-200 rounded-lg overflow-hidden">
                  <thead className="bg-neutral-100 text-neutral-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Document Type</th>
                      <th className="p-2">Doc # / Ref</th>
                      <th className="p-2">Issue Date</th>
                      <th className="p-2">Expiry Date</th>
                      <th className="p-2 text-right">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {docs.map((d: any, i: number) => {
                      let docNum = '';
                      try {
                        if (d.documentUrl?.startsWith('{')) {
                          const parsed = JSON.parse(d.documentUrl);
                          docNum = parsed.documentNumber || '';
                        }
                      } catch {}

                      return (
                        <tr key={i} className="hover:bg-neutral-50">
                          <td className="p-2 font-semibold text-neutral-800">{d.documentType}</td>
                          <td className="p-2 font-mono text-[11px] text-neutral-600">{docNum || 'Archived'}</td>
                          <td className="p-2 font-mono text-[11px]">{d.issueDate ? new Date(d.issueDate).toLocaleDateString() : '-'}</td>
                          <td className="p-2 font-mono text-[11px] font-semibold text-neutral-800">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : 'Permanent'}</td>
                          <td className="p-2 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              Certified Copy
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-neutral-400 text-xs italic">No official certificates or scanned copies recorded.</p>
              )}
            </div>

            {/* Document Footer & Sign-off Seal */}
            <div className="mt-8 pt-4 border-t-2 border-neutral-200 flex justify-between items-end text-xs text-neutral-500">
              <div>
                <p className="font-bold text-neutral-800">IRMS Workforce & Operations Compliance</p>
                <p className="text-[10px] text-neutral-400">Authentic digital dossier copy issued by authorized SaaS instance.</p>
                <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Audit Trail Verified & Digitally Certified</span>
                </div>
              </div>
              <div className="text-right">
                <div className="w-36 border-b border-neutral-400 pb-1 mb-1"></div>
                <span className="text-[10px] uppercase font-bold text-neutral-600 block">
                  Operations Director Sign-off
                </span>
                <span className="text-[9px] text-neutral-400">Stamp & Authorized Signature</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Info */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>Format: <strong>A4 Portrait PDF (High Resolution 2x Canvas)</strong></span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="text-neutral-700 hover:text-neutral-900 font-semibold cursor-pointer"
            >
              Print Document
            </button>
            <span>•</span>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              {isExporting ? 'Generating...' : 'Download PDF File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
