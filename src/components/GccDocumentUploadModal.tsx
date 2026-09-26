import React, { useState, useRef } from 'react';
import { 
  FileText, Upload, X, CheckCircle2, ShieldCheck, 
  Calendar, Building2, AlertCircle, Eye, FileCheck, 
  Layers, ChevronRight, Sparkles, Image, RefreshCw,
  ExternalLink, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface GccDocumentData {
  documentType: string;
  documentNumber: string;
  issuingAuthority: string;
  gccRegulation: string;
  issueDate: string;
  expiryDate: string;
  firstPageUrl: string;
  secondPageUrl: string;
  copyAttachmentUrl?: string;
  notes?: string;
}

interface GccDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: number;
  employeeName?: string;
  onSuccess: () => void;
}

const OFFICIAL_GCC_DOC_TYPES = [
  {
    type: 'Iqama / Muqeem Residency Identity',
    authority: 'General Directorate of Passports (Jawazat) - KSA',
    regulation: 'Article 39 Saudi Labor Law & Muqeem Regulations',
    p1Label: 'Page 1: Front Face (Photo, Full Arabic/English Name, Iqama #, Nationality)',
    p2Label: 'Page 2: Back Face (Profession, Sponsor/Company Name, Barcode & Issue Date)',
    defaultNumLabel: 'Iqama Number (10 Digits, Starts with 2)'
  },
  {
    type: 'Saudi National ID (Hawiyya Wataniyya)',
    authority: 'Civil Affairs Agency (Ahwal Madaniyya) - Interior Ministry',
    regulation: 'Saudi Civil Status Regulations',
    p1Label: 'Page 1: Front Face (Photo, National ID #, Full Name, Birth Date)',
    p2Label: 'Page 2: Back Face (Blood Type, Place of Issue, Barcode & Expiry)',
    defaultNumLabel: 'National ID Number (10 Digits, Starts with 1)'
  },
  {
    type: 'Driving License (Rukhsat Qiyadah)',
    authority: 'General Traffic Department (Moroor) - Saudi Arabia',
    regulation: 'Saudi Traffic Regulations & GCC Unified Road Safety',
    p1Label: 'Page 1: Front Face (License Type, Heavy/Light, Arabic Details, Photo)',
    p2Label: 'Page 2: Back Face (Endorsements, Restrictions, Expiry Date & Stamp)',
    defaultNumLabel: 'License Number'
  },
  {
    type: 'Commercial Registration (CR / Sijil Tijari)',
    authority: 'Ministry of Commerce (MoC) - Kingdom of Saudi Arabia',
    regulation: 'Companies Law & GCC Unified Commercial Registry Standard',
    p1Label: 'Page 1: Main CR Certificate (Commercial Name, Activity, Capital, CR #)',
    p2Label: 'Page 2: Authorized Signatories & Branch Activities Schedule',
    defaultNumLabel: 'Commercial Registration (CR) Number'
  },
  {
    type: 'GOSI Compliance Certificate',
    authority: 'General Organization for Social Insurance (GOSI)',
    regulation: 'Saudi Social Insurance Law & Saudization Nitaqat Verification',
    p1Label: 'Page 1: Compliance & Wage Protection Certificate',
    p2Label: 'Page 2: Establishment Workforce & Contribution Breakdown',
    defaultNumLabel: 'GOSI Establishment Code'
  },
  {
    type: 'Balady Health & Occupational Card',
    authority: 'Ministry of Municipalities and Housing (Balady)',
    regulation: 'Balady Municipal Health & Safety Compliance Regulation',
    p1Label: 'Page 1: Front Face (Photo, Municipal ID, Facility Name, Fitness)',
    p2Label: 'Page 2: Back Face (Medical Tests, Blood Tests & Valid Baladiya Seal)',
    defaultNumLabel: 'Balady Certificate Number'
  },
  {
    type: 'Passport & GCC Entry Visa',
    authority: 'Ministry of Foreign Affairs & Jawazat',
    regulation: 'Immigration & International Civil Aviation Organization (ICAO)',
    p1Label: 'Page 1: Passport Bio-Data Page (Photo, Machine-Readable Zone MRZ)',
    p2Label: 'Page 2: Saudi Residence / Work Entry Visa Stamp & Border Number',
    defaultNumLabel: 'Passport / Border Number'
  },
  {
    type: 'CCHI Health Insurance Policy Card',
    authority: 'Council of Health Insurance (CCHI) - Saudi Arabia',
    regulation: 'CCHI Cooperative Health Insurance Regulations',
    p1Label: 'Page 1: Insurance Member Card (Policy #, Class, Network Tier)',
    p2Label: 'Page 2: Policy Terms, Deductible Schedule & Emergency Approval',
    defaultNumLabel: 'Policy / Member ID Number'
  },
  {
    type: 'Vehicle Registration (Istimara / Mulkiya)',
    authority: 'Traffic Department (Moroor) / Absher Platform',
    regulation: 'GCC Unified Motor Vehicle Licensing & MVPI Inspection Act',
    p1Label: 'Page 1: Front Face (Plate #, Make/Model, Owner Name, Serial #)',
    p2Label: 'Page 2: Back Face (Chassis VIN, Weight, Seating & Expiry Date)',
    defaultNumLabel: 'Serial / Custom Card Number'
  },
  {
    type: 'Saudi Council of Engineers (SCE) Accreditation',
    authority: 'Saudi Council of Engineers (Ha\'iat Al-Muhandiseen)',
    regulation: 'Engineering Practice Regulations & Professional Accreditation',
    p1Label: 'Page 1: Accreditation Certificate (Specialty, Grade, SCE Membership #)',
    p2Label: 'Page 2: Verification QR Code & Attestation Annex',
    defaultNumLabel: 'SCE Membership Number'
  },
  {
    type: 'ARAMCO / SABIC Plant Access Pass',
    authority: 'Saudi Aramco / SABIC Industrial Security Operations',
    regulation: 'High Commission for Industrial Security (HCIS) Standards',
    p1Label: 'Page 1: Plant Access Sticker / Badge Front (Photo, Site Clearance)',
    p2Label: 'Page 2: Badge Reverse (Safety Certifications, Escort Status, Expiry)',
    defaultNumLabel: 'Badge / Plant Pass Number'
  }
];

export default function GccDocumentUploadModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  onSuccess
}: GccDocumentUploadModalProps) {
  const [selectedDocType, setSelectedDocType] = useState(OFFICIAL_GCC_DOC_TYPES[0].type);
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState(OFFICIAL_GCC_DOC_TYPES[0].authority);
  const [gccRegulation, setGccRegulation] = useState(OFFICIAL_GCC_DOC_TYPES[0].regulation);
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [firstPageUrl, setFirstPageUrl] = useState('');
  const [secondPageUrl, setSecondPageUrl] = useState('');
  const [copyAttachmentUrl, setCopyAttachmentUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputP1Ref = useRef<HTMLInputElement>(null);
  const fileInputP2Ref = useRef<HTMLInputElement>(null);
  const fileInputAnnexRef = useRef<HTMLInputElement>(null);

  const currentTypeConfig = OFFICIAL_GCC_DOC_TYPES.find(d => d.type === selectedDocType) || OFFICIAL_GCC_DOC_TYPES[0];

  const handleDocTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDocType(val);
    const cfg = OFFICIAL_GCC_DOC_TYPES.find(d => d.type === val);
    if (cfg) {
      setIssuingAuthority(cfg.authority);
      setGccRegulation(cfg.regulation);
    }
  };

  // Convert uploaded local file to base64 data URL for pristine rendering
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, pageType: 'p1' | 'p2' | 'annex') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB limit. Please upload a smaller scan or image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (pageType === 'p1') setFirstPageUrl(result);
      else if (pageType === 'p2') setSecondPageUrl(result);
      else setCopyAttachmentUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setError('Please select an employee to attach this official document.');
      return;
    }
    if (!firstPageUrl && !secondPageUrl) {
      setError('Please attach at least Page 1 (Front Copy) of the official document as required by Saudi / GCC regulations.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = (window as any)._token;
      const res = await fetch('/api/employee-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          employeeId,
          documentType: selectedDocType,
          documentNumber,
          issuingAuthority,
          gccRegulation,
          issueDate: issueDate || null,
          expiryDate: expiryDate || null,
          firstPageUrl,
          secondPageUrl,
          copyAttachmentUrl,
          notes
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to record official document');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error saving official document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Official Document Upload & Copy Archive
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
                  Saudi & GCC Compliant
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {employeeName ? `Archiving for: ${employeeName}` : 'Add verified official documents with Front & Back page scans'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Official Regulatory Type */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
              <FileText className="w-4 h-4 text-indigo-600" />
              1. Document Classification & Regulatory Standards
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Official Document Type (Saudi Arabia / GCC Standard) *
                </label>
                <select
                  value={selectedDocType}
                  onChange={handleDocTypeChange}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-neutral-900"
                >
                  {OFFICIAL_GCC_DOC_TYPES.map((dt, i) => (
                    <option key={i} value={dt.type}>{dt.type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  {currentTypeConfig.defaultNumLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                  placeholder="e.g. 2489102841"
                  className="w-full text-xs sm:text-sm px-3.5 py-2 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Issuing Authority
                </label>
                <input
                  type="text"
                  value={issuingAuthority}
                  onChange={e => setIssuingAuthority(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Issue Date (Gregorian)
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Expiry Date (Gregorian) *
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Applicable GCC Compliance Rule: </span>
                <span className="text-indigo-800">{currentTypeConfig.regulation}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Upload Multi-Section Copies (First Page, Second Page, Copy Annex) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                2. Upload Official Document Copy Sections (Page 1 & Page 2)
              </h4>
              <span className="text-[11px] text-neutral-500 font-medium">
                Both faces required for official validation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SECTION A: FIRST PAGE (FRONT) */}
              <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono text-[10px] flex items-center justify-center">1</span>
                    First Page (Front Face) *
                  </span>
                  {firstPageUrl && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Attached
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-500 leading-tight">
                  {currentTypeConfig.p1Label}
                </p>

                {/* Upload box */}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  ref={fileInputP1Ref}
                  className="hidden"
                  onChange={e => handleFileUpload(e, 'p1')}
                />

                {firstPageUrl ? (
                  <div className="relative rounded-xl border border-neutral-200 overflow-hidden bg-white p-2">
                    {firstPageUrl.startsWith('data:image') || firstPageUrl.startsWith('http') ? (
                      <div className="h-32 w-full flex items-center justify-center bg-neutral-100 rounded-lg overflow-hidden relative group">
                        <img src={firstPageUrl} alt="Page 1 Scan" className="max-h-full object-contain" />
                        <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button
                            type="button"
                            onClick={() => fileInputP1Ref.current?.click()}
                            className="px-2.5 py-1 bg-white text-neutral-900 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Change Scan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 flex flex-col items-center justify-center text-xs text-neutral-600">
                        <FileText className="w-8 h-8 text-neutral-400 mb-1" />
                        <span>Document Attached</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setFirstPageUrl('')}
                      className="absolute top-3 right-3 p-1 rounded-full bg-neutral-900/70 text-white hover:bg-neutral-950"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputP1Ref.current?.click()}
                    className="border-2 border-dashed border-neutral-300 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-white hover:bg-indigo-50/20 transition-all"
                  >
                    <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-neutral-800">Upload Page 1 (Front Copy)</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Click to choose image or scan (PNG, JPG, PDF up to 8MB)</p>
                  </div>
                )}
              </div>

              {/* SECTION B: SECOND PAGE (BACK) */}
              <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] flex items-center justify-center">2</span>
                    Second Page (Back Face)
                  </span>
                  {secondPageUrl && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Attached
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-500 leading-tight">
                  {currentTypeConfig.p2Label}
                </p>

                {/* Upload box */}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  ref={fileInputP2Ref}
                  className="hidden"
                  onChange={e => handleFileUpload(e, 'p2')}
                />

                {secondPageUrl ? (
                  <div className="relative rounded-xl border border-neutral-200 overflow-hidden bg-white p-2">
                    {secondPageUrl.startsWith('data:image') || secondPageUrl.startsWith('http') ? (
                      <div className="h-32 w-full flex items-center justify-center bg-neutral-100 rounded-lg overflow-hidden relative group">
                        <img src={secondPageUrl} alt="Page 2 Scan" className="max-h-full object-contain" />
                        <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button
                            type="button"
                            onClick={() => fileInputP2Ref.current?.click()}
                            className="px-2.5 py-1 bg-white text-neutral-900 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Change Scan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 flex flex-col items-center justify-center text-xs text-neutral-600">
                        <FileText className="w-8 h-8 text-neutral-400 mb-1" />
                        <span>Document Attached</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setSecondPageUrl('')}
                      className="absolute top-3 right-3 p-1 rounded-full bg-neutral-900/70 text-white hover:bg-neutral-950"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputP2Ref.current?.click()}
                    className="border-2 border-dashed border-neutral-300 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-white hover:bg-indigo-50/20 transition-all"
                  >
                    <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-neutral-800">Upload Page 2 (Back Copy)</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Click to choose image or scan (Reverse side / Endorsement)</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION C: OPTIONAL ANNEX / TRANSLATION / ATTESTATION */}
            <div className="border border-neutral-200/80 rounded-xl p-3.5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-neutral-400" />
                  Section 3: Additional Annex / Attestation / Translation (Optional)
                </span>
                {copyAttachmentUrl && (
                  <button
                    type="button"
                    onClick={() => setCopyAttachmentUrl('')}
                    className="text-[10px] text-rose-600 hover:underline"
                  >
                    Remove Annex
                  </button>
                )}
              </div>

              <input
                type="file"
                accept="image/*,application/pdf"
                ref={fileInputAnnexRef}
                className="hidden"
                onChange={e => handleFileUpload(e, 'annex')}
              />

              {!copyAttachmentUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputAnnexRef.current?.click()}
                  className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-neutral-400" />
                  Attach Chamber of Commerce Stamp, Arabic Translation, or Medical Annex
                </button>
              ) : (
                <div className="p-2 rounded-lg bg-neutral-50 text-xs font-medium text-emerald-800 flex items-center justify-between">
                  <span>Additional Annex File Uploaded & Stored</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              )}
            </div>

            {/* Notes / Special Endorsements */}
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                Compliance Notes & Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Verified against Absher / Muqeem portal on 1446-03-24. Valid for field site operations in Riyadh Metro."
                className="w-full text-xs px-3.5 py-2 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-neutral-900"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                <span>Recording Scans...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Save & Archive Official Document</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
