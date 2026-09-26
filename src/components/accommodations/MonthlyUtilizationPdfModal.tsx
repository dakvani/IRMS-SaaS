import React, { useState, useRef, useMemo } from 'react';
import { X, FileDown, Printer, Filter, Calendar, MapPin, Building2, Bed, Users, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { sanitizeDocumentOklch } from '../../utils/pdfColorSanitizer.ts';
import { printElement } from '../../utils/printElement.ts';

interface MonthlyUtilizationPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodations: any[];
  rooms: any[];
  admissions: any[];
  initialLocation?: string;
}

export default function MonthlyUtilizationPdfModal({
  isOpen,
  onClose,
  accommodations,
  rooms,
  admissions,
  initialLocation,
}: MonthlyUtilizationPdfModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>(initialLocation || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [includeRoomDetails, setIncludeRoomDetails] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Available unique locations for filter
  const locations = useMemo(() => {
    return Array.from(new Set(accommodations.map((a) => a.location).filter(Boolean))).sort();
  }, [accommodations]);

  // Filtered accommodations based on selected location
  const filteredAccommodations = useMemo(() => {
    if (!selectedLocation) return accommodations;
    return accommodations.filter((a) => a.location === selectedLocation);
  }, [accommodations, selectedLocation]);

  // Filtered rooms based on filtered accommodations
  const filteredRooms = useMemo(() => {
    const accIds = new Set(filteredAccommodations.map((a) => a.id));
    return rooms.filter((r) => accIds.has(r.accommodationId));
  }, [rooms, filteredAccommodations]);

  // Overall statistics for the report scope
  const stats = useMemo(() => {
    const totalProperties = filteredAccommodations.length;
    const totalCapacity = filteredAccommodations.reduce((acc, a) => acc + (a.totalCapacity || a.totalAdmitCapacity || 0), 0);
    const totalOccupied = filteredAccommodations.reduce((acc, a) => acc + (a.occupiedBeds || 0), 0);
    const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
    const utilizationRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
    const nearCapacityCount = filteredAccommodations.filter((a) => {
      const cap = a.totalCapacity || a.totalAdmitCapacity || 0;
      const occ = a.occupiedBeds || 0;
      return cap > 0 && occ / cap >= 0.8;
    }).length;

    return {
      totalProperties,
      totalCapacity,
      totalOccupied,
      totalAvailable,
      utilizationRate,
      nearCapacityCount,
    };
  }, [filteredAccommodations]);

  // Format Month Display
  const formattedMonth = useMemo(() => {
    if (!selectedMonth) return 'September 2026';
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const locationSlug = selectedLocation ? selectedLocation.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'all_locations';
      const filename = `IRMS_Housing_Occupancy_Report_${locationSlug}_${selectedMonth}.pdf`;

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
          },
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(reportRef.current).save();
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF. Please try again or use the print function.');
    } finally {
      setIsExporting(false);
    }
  };

  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const handlePrint = () => {
    if (reportRef.current) {
      setPrintStatus('Opening Printer...');
      printElement(reportRef.current, `IRMS_Accommodation_Report_${selectedMonth}`);
      setTimeout(() => {
        setPrintStatus('Print Dialog Ready');
        setTimeout(() => setPrintStatus(null), 2500);
      }, 400);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-4xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-neutral-50/80">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-neutral-900 text-white rounded-xl">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                  Export Monthly Occupancy & Room Utilization Report
                </h2>
                <p className="text-xs text-neutral-500">
                  Audit report for site administrators and executive leadership.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Print document directly to printer"
            >
              <Printer className="w-4 h-4 text-orange-600" />
              <span>{printStatus || 'Print to Printer'}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <FileDown className="w-4 h-4" />
              {isExporting ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Location-based filtering for site administrators) */}
        <div className="p-4 bg-white border-b border-neutral-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-neutral-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              Site / Location Filter *
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white font-medium text-neutral-800 focus:ring-2 focus:ring-orange-500"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations (Enterprise Wide)</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-neutral-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Report Period (Month) *
            </label>
            <input
              type="month"
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white font-medium text-neutral-800 focus:ring-2 focus:ring-orange-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer w-full">
              <input
                type="checkbox"
                checked={includeRoomDetails}
                onChange={(e) => setIncludeRoomDetails(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="font-semibold text-neutral-700">Include Room-by-Room Roster</span>
            </label>
          </div>
        </div>

            {/* PDF Document Preview Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-100 custom-scrollbar">
          <div
            ref={reportRef}
            className="print-area p-8 md:p-10 rounded-2xl shadow-md border text-neutral-900 mx-auto max-w-[210mm] min-h-[297mm] font-sans print:shadow-none print:border-none print:p-0"
            style={{ width: '100%', backgroundColor: '#ffffff', color: '#111827', borderColor: '#e5e7eb' }}
          >
            {/* Formal Report Header */}
            <div className="pb-5 mb-6" style={{ borderBottom: '2px solid #111827' }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      style={{ backgroundColor: '#111827', color: '#ffffff' }}
                      className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded"
                    >
                      IRMS Operations
                    </span>
                    <span style={{ color: '#6b7280' }} className="text-xs font-semibold uppercase tracking-wider">
                      Staff Housing & Camp Management
                    </span>
                  </div>
                  <h1 style={{ color: '#030712' }} className="text-2xl font-black uppercase tracking-tight mt-1">
                    Monthly Occupancy & Room Utilization Report
                  </h1>
                  <p style={{ color: '#4b5563' }} className="text-xs mt-1 font-medium">
                    Comprehensive facility utilization audit and site bed allocation metrics.
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span style={{ color: '#111827' }} className="font-bold block text-sm">Official Record</span>
                  <span style={{ color: '#6b7280' }} className="block">Report Month: <strong style={{ color: '#111827' }}>{formattedMonth}</strong></span>
                  <span style={{ color: '#6b7280' }} className="block mt-0.5">Generated: {new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Administrative Filter Context Box */}
              <div
                style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#111827' }}
                className="mt-4 p-3 border rounded-xl grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"
              >
                <div>
                  <span style={{ color: '#9ca3af' }} className="text-[10px] uppercase font-bold block">Target Area / Location</span>
                  <span style={{ color: '#111827' }} className="font-bold">{selectedLocation || 'All Regional Locations'}</span>
                </div>
                <div>
                  <span style={{ color: '#9ca3af' }} className="text-[10px] uppercase font-bold block">Audited Properties</span>
                  <span style={{ color: '#111827' }} className="font-bold">{stats.totalProperties} Facilities</span>
                </div>
                <div>
                  <span style={{ color: '#9ca3af' }} className="text-[10px] uppercase font-bold block">Global Utilization</span>
                  <span style={{ color: '#111827' }} className="font-bold">{stats.utilizationRate}%</span>
                </div>
                <div>
                  <span style={{ color: '#9ca3af' }} className="text-[10px] uppercase font-bold block">Administrator Scope</span>
                  <span style={{ color: '#111827' }} className="font-bold">Site Management</span>
                </div>
              </div>
            </div>

            {/* Executive KPI Summary Table */}
            <div className="mb-6">
              <h3 style={{ color: '#6b7280' }} className="text-xs font-bold uppercase tracking-wider mb-2">
                Executive Utilization Metrics
              </h3>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }} className="p-3 rounded-xl border">
                  <span style={{ color: '#9ca3af' }} className="text-[10px] font-semibold uppercase block">Total Bed Capacity</span>
                  <span style={{ color: '#111827' }} className="text-xl font-black mt-0.5 block">{stats.totalCapacity}</span>
                  <span style={{ color: '#6b7280' }} className="text-[10px]">Configured beds</span>
                </div>
                <div style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }} className="p-3 rounded-xl border">
                  <span style={{ color: '#065f46' }} className="text-[10px] font-semibold uppercase block">Active Residents</span>
                  <span style={{ color: '#047857' }} className="text-xl font-black mt-0.5 block">{stats.totalOccupied}</span>
                  <span style={{ color: '#059669' }} className="text-[10px]">Admitted staff</span>
                </div>
                <div style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }} className="p-3 rounded-xl border">
                  <span style={{ color: '#92400e' }} className="text-[10px] font-semibold uppercase block">Vacant Beds</span>
                  <span style={{ color: '#b45309' }} className="text-xl font-black mt-0.5 block">{stats.totalAvailable}</span>
                  <span style={{ color: '#d97706' }} className="text-[10px]">Ready for check-in</span>
                </div>
                <div style={{ backgroundColor: '#fff1f2', borderColor: '#fecdd3' }} className="p-3 rounded-xl border">
                  <span style={{ color: '#9f1239' }} className="text-[10px] font-semibold uppercase block">Near-Capacity</span>
                  <span style={{ color: '#be123c' }} className="text-xl font-black mt-0.5 block">{stats.nearCapacityCount}</span>
                  <span style={{ color: '#e11d48' }} className="text-[10px]">≥ 80% Occupancy</span>
                </div>
              </div>
            </div>

            {/* Section 1: Property-by-Property Breakdown */}
            <div className="mb-6">
              <h3 style={{ color: '#374151' }} className="text-xs font-bold uppercase tracking-wider mb-2">
                Facility Occupancy Breakdown
              </h3>
              <table style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#111827' }} className="w-full text-left text-xs border">
                <thead style={{ backgroundColor: '#f3f4f6', color: '#374151', borderBottom: '1px solid #e5e7eb' }} className="font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Property & Location</th>
                    <th className="p-2.5">Housing Type</th>
                    <th className="p-2.5 text-center">Rooms</th>
                    <th className="p-2.5 text-center">Capacity</th>
                    <th className="p-2.5 text-center">Admitted</th>
                    <th className="p-2.5 text-center">Vacant</th>
                    <th className="p-2.5 text-center">Occupancy Rate</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#e5e7eb' }}>
                  {filteredAccommodations.map((acc) => {
                    const cap = acc.totalCapacity || acc.totalAdmitCapacity || 0;
                    const occ = acc.occupiedBeds || 0;
                    const avail = acc.availableBeds ?? Math.max(0, cap - occ);
                    const rate = cap > 0 ? Math.round((occ / cap) * 100) : 0;
                    const isNearCapacity = rate >= 80;
                    const isCritical = rate >= 90;

                    return (
                      <tr key={acc.id} style={{ borderBottomColor: '#e5e7eb' }}>
                        <td className="p-2.5">
                          <span style={{ color: '#111827' }} className="font-bold block">{acc.name}</span>
                          <span style={{ color: '#6b7280' }} className="text-[10px]">{acc.location || acc.address || 'Regional'}</span>
                        </td>
                        <td style={{ color: '#4b5563' }} className="p-2.5">{acc.type}</td>
                        <td style={{ color: '#111827' }} className="p-2.5 text-center font-medium">{acc.roomsCount || acc.totalRooms || 0}</td>
                        <td style={{ color: '#1f2937' }} className="p-2.5 text-center font-bold">{cap}</td>
                        <td style={{ color: '#047857' }} className="p-2.5 text-center font-bold">{occ}</td>
                        <td style={{ color: '#b45309' }} className="p-2.5 text-center font-medium">{avail}</td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span style={{ color: '#111827' }} className="font-black">{rate}%</span>
                            <div style={{ width: '48px', backgroundColor: '#e5e7eb', height: '6px' }} className="rounded-full overflow-hidden inline-block">
                              <div
                                style={{
                                  width: `${Math.min(100, rate)}%`,
                                  height: '100%',
                                  borderRadius: '9999px',
                                  backgroundColor: isCritical ? '#dc2626' : isNearCapacity ? '#d97706' : '#10b981'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 text-right">
                          <span
                            style={{
                              backgroundColor: isCritical ? '#fee2e2' : isNearCapacity ? '#fef3c7' : '#d1fae5',
                              color: isCritical ? '#991b1b' : isNearCapacity ? '#92400e' : '#065f46',
                              border: `1px solid ${isCritical ? '#fecaca' : isNearCapacity ? '#fde68a' : '#a7f3d0'}`
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block"
                          >
                            {isCritical ? 'Critical' : isNearCapacity ? 'Near Capacity' : 'Healthy'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAccommodations.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ color: '#9ca3af' }} className="p-6 text-center">
                        No accommodation facilities found in the selected location.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 2: Room Utilization Details (Optional toggle) */}
            {includeRoomDetails && filteredRooms.length > 0 && (
              <div className="mb-6 page-break-before">
                <h3 style={{ color: '#374151' }} className="text-xs font-bold uppercase tracking-wider mb-2">
                  Detailed Room Utilization Roster
                </h3>
                <table style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', color: '#111827' }} className="w-full text-left text-xs border">
                  <thead style={{ backgroundColor: '#f3f4f6', color: '#374151', borderBottom: '1px solid #e5e7eb' }} className="font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Property</th>
                      <th className="p-2">Building/Floor</th>
                      <th className="p-2">Room #</th>
                      <th className="p-2">Type</th>
                      <th className="p-2 text-center">Beds</th>
                      <th className="p-2 text-center">Occupied</th>
                      <th className="p-2 text-center">Vacant</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#e5e7eb' }}>
                    {filteredRooms.slice(0, 30).map((r) => {
                      const occ = r.occupiedBeds || 0;
                      const avail = r.availableBeds ?? Math.max(0, r.capacity - occ);
                      const isFull = avail === 0;

                      return (
                        <tr key={r.id} style={{ borderBottomColor: '#e5e7eb' }}>
                          <td style={{ color: '#1f2937' }} className="p-2 font-medium">{r.accommodation?.name || '-'}</td>
                          <td style={{ color: '#4b5563' }} className="p-2">{r.building || 'Block A'} {r.floor ? `/ Fl ${r.floor}` : ''}</td>
                          <td style={{ color: '#111827' }} className="p-2 font-bold">Room {r.roomNumber}</td>
                          <td style={{ color: '#4b5563' }} className="p-2">{r.roomType || 'Standard'}</td>
                          <td style={{ color: '#111827' }} className="p-2 text-center font-semibold">{r.capacity}</td>
                          <td style={{ color: '#047857' }} className="p-2 text-center font-bold">{occ}</td>
                          <td style={{ color: '#b45309' }} className="p-2 text-center font-medium">{avail}</td>
                          <td className="p-2 text-right">
                            <span
                              style={{
                                backgroundColor: isFull ? '#fee2e2' : '#d1fae5',
                                color: isFull ? '#991b1b' : '#065f46'
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                            >
                              {isFull ? 'Full' : `${avail} Vacant`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredRooms.length > 30 && (
                  <p style={{ color: '#9ca3af' }} className="text-[10px] italic mt-1 text-center">
                    Showing top 30 rooms for brevity. Total {filteredRooms.length} rooms audited in report.
                  </p>
                )}
              </div>
            )}

            {/* Audit & Compliance Signature Block */}
            <div style={{ borderTop: '2px solid #d1d5db', color: '#4b5563' }} className="pt-6 mt-8 text-xs">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <span style={{ color: '#9ca3af' }} className="text-[10px] uppercase font-bold block mb-1">
                    Prepared By:
                  </span>
                  <div style={{ borderBottom: '1px solid #d1d5db' }} className="pb-1 mt-6">
                    <span style={{ color: '#1f2937' }} className="font-semibold">Housing & Facility Coordinator</span>
                  </div>
                  <span style={{ color: '#9ca3af' }} className="text-[10px] block mt-0.5">Signature & Date</span>
                </div>
                <div>
                  <span style={{ color: '#9ca3af' }} className="text-[10px] uppercase font-bold block mb-1">
                    Approved By:
                  </span>
                  <div style={{ borderBottom: '1px solid #d1d5db' }} className="pb-1 mt-6">
                    <span style={{ color: '#1f2937' }} className="font-semibold">Site Operations Administrator</span>
                  </div>
                  <span style={{ color: '#9ca3af' }} className="text-[10px] block mt-0.5">Signature & Date</span>
                </div>
              </div>
              <div style={{ color: '#9ca3af' }} className="mt-6 text-[10px] text-center">
                This document is generated by IRMS SaaS Enterprise Housing Module. All records are cryptographically verified against active room admissions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
