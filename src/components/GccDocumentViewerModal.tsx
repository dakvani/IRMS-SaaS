import React, { useState } from 'react';
import { 
  X, ShieldCheck, FileText, Download, Eye, 
  ExternalLink, Layers, CheckCircle2, Calendar, Building2 
} from 'lucide-react';
import { motion } from 'motion/react';

interface GccDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  employeeName?: string;
}

export default function GccDocumentViewerModal({
  isOpen,
  onClose,
  document,
  employeeName
}: GccDocumentViewerModalProps) {
  const [activeView, setActiveView] = useState<'both' | 'page1' | 'page2' | 'annex'>('both');

  if (!isOpen || !document) return null;

  // Parse documentUrl if it was stored as JSON with firstPageUrl & secondPageUrl
  let firstPage = '';
  let secondPage = '';
  let annex = '';
  let docNumber = '';
  let authority = 'Saudi / GCC Regulatory Authority';
  let regulation = 'Official Labor & Civil Status Standard';
  let notes = '';

  if (document.documentUrl) {
    try {
      if (document.documentUrl.startsWith('{')) {
        const parsed = JSON.parse(document.documentUrl);
        firstPage = parsed.firstPageUrl || '';
        secondPage = parsed.secondPageUrl || '';
        annex = parsed.copyAttachmentUrl || '';
        docNumber = parsed.documentNumber || '';
        authority = parsed.issuingAuthority || authority;
        regulation = parsed.gccRegulation || regulation;
        notes = parsed.notes || '';
      } else {
        firstPage = document.documentUrl;
      }
    } catch {
      firstPage = document.documentUrl;
    }
  }

  const hasBothPages = !!(firstPage && secondPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
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
                  {document.documentType}
                </h3>
                {docNumber && (
                  <span className="font-mono text-xs font-bold bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                    #{docNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {employeeName ? `Custodian: ${employeeName} • ` : ''}{authority}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher tabs */}
            {hasBothPages && (
              <div className="bg-neutral-800 p-0.5 rounded-lg flex items-center text-xs">
                <button
                  onClick={() => setActiveView('both')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    activeView === 'both' ? 'bg-neutral-950 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setActiveView('page1')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    activeView === 'page1' ? 'bg-neutral-950 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Page 1 (Front)
                </button>
                <button
                  onClick={() => setActiveView('page2')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    activeView === 'page2' ? 'bg-neutral-950 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Page 2 (Back)
                </button>
                {annex && (
                  <button
                    onClick={() => setActiveView('annex')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      activeView === 'annex' ? 'bg-neutral-950 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Annex
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-4 flex-wrap text-neutral-600">
            {document.issueDate && (
              <span>Issued: <strong className="text-neutral-900">{document.issueDate}</strong></span>
            )}
            {document.expiryDate && (
              <span>Expires: <strong className="text-neutral-900">{document.expiryDate}</strong></span>
            )}
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Valid Archive
            </span>
          </div>

          <span className="text-neutral-500 font-medium italic">
            Compliance Standard: {regulation}
          </span>
        </div>

        {/* Document Scans Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {activeView === 'both' && hasBothPages ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PAGE 1 */}
              <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-50 shadow-2xs flex flex-col">
                <div className="p-3 bg-white border-b border-neutral-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono text-[10px] flex items-center justify-center">1</span>
                    Page 1: Front Face (Personal Details / Photo)
                  </span>
                  <a
                    href={firstPage}
                    download="Document_Page1"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Full Res
                  </a>
                </div>
                <div className="p-4 flex-1 flex items-center justify-center min-h-[300px]">
                  {firstPage.startsWith('data:image') || firstPage.startsWith('http') ? (
                    <img src={firstPage} alt="Page 1 Scan" className="max-h-[420px] w-auto object-contain rounded-lg shadow-sm border border-neutral-200" />
                  ) : (
                    <div className="text-neutral-400 text-xs">PDF or Digital Document Scan</div>
                  )}
                </div>
              </div>

              {/* PAGE 2 */}
              <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-50 shadow-2xs flex flex-col">
                <div className="p-3 bg-white border-b border-neutral-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] flex items-center justify-center">2</span>
                    Page 2: Back Face (Endorsement / Barcode / Expiry)
                  </span>
                  <a
                    href={secondPage}
                    download="Document_Page2"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Full Res
                  </a>
                </div>
                <div className="p-4 flex-1 flex items-center justify-center min-h-[300px]">
                  {secondPage.startsWith('data:image') || secondPage.startsWith('http') ? (
                    <img src={secondPage} alt="Page 2 Scan" className="max-h-[420px] w-auto object-contain rounded-lg shadow-sm border border-neutral-200" />
                  ) : (
                    <div className="text-neutral-400 text-xs">PDF or Digital Document Scan</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-50 shadow-2xs flex flex-col">
              <div className="p-3 bg-white border-b border-neutral-200 flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-900">
                  {activeView === 'page2' ? 'Page 2: Back Face' : activeView === 'annex' ? 'Additional Annex / Translation' : 'Page 1: Front Face'}
                </span>
                <a
                  href={activeView === 'page2' ? secondPage : activeView === 'annex' ? annex : firstPage}
                  download="Document_Scan"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Full Res
                </a>
              </div>
              <div className="p-6 flex items-center justify-center min-h-[380px]">
                <img
                  src={activeView === 'page2' ? secondPage : activeView === 'annex' ? annex : firstPage}
                  alt="Document Scan"
                  className="max-h-[500px] w-auto object-contain rounded-lg shadow-md border border-neutral-200"
                />
              </div>
            </div>
          )}

          {notes && (
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
              <span className="font-bold text-neutral-800 block mb-0.5">Compliance Notes:</span>
              <p className="text-neutral-600">{notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-medium">
            Verified under GCC / Saudi Arabia labor and municipal regulatory archive
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
