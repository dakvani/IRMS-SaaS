import fs from 'fs';
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf-8');

// Add state variables for upload site and project
const stateVars = `
  const [selectedUploadSite, setSelectedUploadSite] = useState('');
  const [selectedUploadProject, setSelectedUploadProject] = useState('');
`;
code = code.replace("const [selectedMonth, setSelectedMonth]", stateVars + "\n  const [selectedMonth, setSelectedMonth]");

const newDownloadLogic = `
  const downloadTemplate = async () => {
    try {
      const token = (window as any)._token;
      let url = '/api/timesheets/template-data?';
      if (selectedUploadSite) url += \`siteId=\${selectedUploadSite}&\`;
      if (selectedUploadProject) url += \`projectId=\${selectedUploadProject}\`;

      const res = await fetch(url, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      const data = await res.json();
      
      const [yearStr, monthStr] = selectedMonth.split('-');
      const daysInMonth = yearStr && monthStr ? new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate() : 31;
      
      const headers = [
        "Emp ID", "Emp Name", "Allocated Site", "Allocated Project", "Common Working Time", "Shift",
        ...Array.from({length: daysInMonth}, (_, i) => (i+1).toString())
      ];
      
      let rows = data.map((emp: any) => {
        return [
          emp.employeeId, 
          \`\${emp.firstName} \${emp.lastName}\`,
          emp.siteName || '',
          emp.projectName || '',
          "8", "Day",
          ...Array.from({length: daysInMonth}, () => "8")
        ].join(',');
      });

      if (rows.length === 0) {
        rows = [
          ["EMP-001", "John Doe", "Site A", "Project Alpha", "8", "Day", ...Array.from({length: daysInMonth}, () => "8")].join(',')
        ];
      }

      const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\\n" + rows.join('\\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", \`timesheet_template_\${selectedMonth}.csv\`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Failed to generate template');
    }
  };
`;

code = code.replace(/const downloadTemplate = \(\) => \{[\s\S]*?document\.body\.removeChild\(link\);\s*\};/, newDownloadLogic.trim());

const uploadUI = `
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-8">
            <div className="flex-1 w-full max-w-xs">
              <label className="block text-sm font-medium mb-1 text-neutral-700">Site</label>
              <select className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none rounded-lg" value={selectedUploadSite} onChange={e=>setSelectedUploadSite(e.target.value)}>
                <option value="">All Sites</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full max-w-xs">
              <label className="block text-sm font-medium mb-1 text-neutral-700">Project</label>
              <select className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none rounded-lg" value={selectedUploadProject} onChange={e=>setSelectedUploadProject(e.target.value)}>
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full max-w-xs">
              <label className="block text-sm font-medium mb-1 text-neutral-700">Select Month *</label>
              <input type="month" className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none rounded-lg" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} />
            </div>
            <div className="w-full sm:w-auto">
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                <Upload className="w-4 h-4" /> Select CSV File
              </button>
            </div>
          </div>
`;

code = code.replace(
  /<div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-8">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/,
  uploadUI.trim()
);

fs.writeFileSync('src/components/Timesheets.tsx', code);
