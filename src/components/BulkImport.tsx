import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function BulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview, 3: Complete
  
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState({ success: 0, failed: 0, errors: [] as string[] });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Simple mock parser for CSV
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((h, i) => { row[h] = values[i] || ''; });
            return row;
          });
          setPreviewData(data);
          setStep(2);
        } else {
          alert("The uploaded file appears to be empty or invalid.");
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const commitImport = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;
    let errorsList: string[] = [];
    
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      // We'll process sequentially for simplicity & safety in MVP
      for (let i = 0; i < previewData.length; i++) {
        const row = previewData[i];
        try {
          // Normalize names
          const firstName = row.firstName || row['First Name'] || row.first_name || '';
          const lastName = row.lastName || row['Last Name'] || row.last_name || '';
          const employeeId = row.employeeId || row['Employee ID'] || row.employee_id || '';
          const department = row.department || row.Department || '';
          const jobTitle = row.jobTitle || row['Job Title'] || row.title || '';

          if (!firstName || !lastName || !employeeId) {
            throw new Error(`Row ${i+1}: Missing required fields (First Name, Last Name, or Employee ID).`);
          }

          const res = await fetch('/api/employees', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ firstName, lastName, employeeId, department, jobTitle })
          });

          if (!res.ok) {
            let errBody; try { errBody = await res.json(); } catch(e) { errBody = { error: 'Server error' }; }
            throw new Error(`Row ${i+1}: ${errBody.error || 'Server error'}`);
          }
          
          successCount++;
        } catch (e: any) {
          failCount++;
          errorsList.push(e.message);
        }
      }
      
      setResults({ success: successCount, failed: failCount, errors: errorsList });
      setStep(3);

      // Audit log for the bulk operation itself
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'CREATE',
          entity: 'BULK_IMPORT',
          details: { type: 'Employees', success: successCount, failed: failCount }
        })
      });

    } catch (err: any) {
      console.error(err);
      alert('Import failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Bulk Data Import
        </h2>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {step === 1 && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="mb-6 text-center">
              <h3 className="text-xl font-bold text-neutral-900">Upload Employees Data</h3>
              <p className="text-neutral-500 mt-2">Upload a CSV file containing your employee records. The file must include <span className="font-medium text-neutral-700">First Name, Last Name, and Employee ID</span> headers.</p>
            </div>
            
            <label className="border-2 border-dashed border-neutral-300 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 hover:border-blue-400 transition-colors group">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <span className="text-sm font-medium text-blue-600">Click to browse or drag file here</span>
              <span className="text-xs text-neutral-500 mt-1">Supports CSV only for MVP</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
            
            <div className="mt-8 bg-neutral-50 rounded-lg p-4 text-sm text-neutral-600 border border-neutral-200">
              <p className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" /> Requirements
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Headers must match common variants (e.g. "firstName" or "First Name").</li>
                <li>Duplicate Employee IDs will fail during insertion.</li>
                <li>You will be able to review data before committing to the database.</li>
              </ul>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div>
                <h3 className="font-semibold text-blue-900">Preview Data</h3>
                <p className="text-sm text-blue-700">Found {previewData.length} records to import. Please review below.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setFile(null); setPreviewData([]); setStep(1); }}
                  disabled={isProcessing}
                  className="px-4 py-2 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={commitImport}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isProcessing ? 'Processing...' : 'Confirm Import'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-neutral-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 sticky top-0 z-10 text-neutral-600 border-b border-neutral-200">
                  <tr>
                    {Object.keys(previewData[0] || {}).map((header, i) => (
                      <th key={i} className="px-4 py-3 font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {previewData.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-4 py-3 text-neutral-700">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 50 && (
                <div className="p-3 text-center text-sm text-neutral-500 bg-neutral-50">
                  Showing first 50 rows of {previewData.length}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-xl mx-auto mt-12 text-center">
            <div className="mb-6 flex justify-center">
              {results.failed === 0 ? (
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10" />
                </div>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">Import Complete</h3>
            <p className="text-neutral-600 mb-8">
              Successfully imported <strong>{results.success}</strong> records. 
              {results.failed > 0 && <span> Failed to import <strong>{results.failed}</strong> records.</span>}
            </p>

            {results.errors.length > 0 && (
              <div className="text-left bg-red-50 border border-red-100 rounded-lg p-4 mb-8 max-h-64 overflow-y-auto">
                <h4 className="font-semibold text-red-800 mb-2">Error Details:</h4>
                <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                  {results.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <button 
              onClick={() => { setFile(null); setPreviewData([]); setStep(1); }}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium transition-colors"
            >
              Start New Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
