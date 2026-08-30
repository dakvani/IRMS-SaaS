import fs from 'fs';

let code = fs.readFileSync('src/components/Employees.tsx', 'utf-8');

// 1. Update Imports
code = code.replace(/import \{.*?\} from 'lucide-react';/, 
  "import { Users, Search, Plus, Filter, MoreHorizontal, MapPin, Mail, Phone, Calendar, Download, Building2, Briefcase, FileText, ChevronRight, X, ArrowLeft, Edit, Printer } from 'lucide-react';");

// 2. Add filter state
const statePattern = /const \[searchTerm, setSearchTerm\] = useState\(''\);/;
code = code.replace(statePattern, 
  `const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');`);

// 3. Update filtered logic
const filterLogic = `const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (emp.firstName + ' ' + emp.lastName).toLowerCase().includes(term);
    const idMatch = emp.employeeId?.toLowerCase().includes(term);
    const posMatch = emp.jobTitle?.toLowerCase().includes(term);
    
    return nameMatch || idMatch || posMatch;
  });`;
const newFilterLogic = `const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (emp.firstName + ' ' + emp.lastName).toLowerCase().includes(term);
    const idMatch = emp.employeeId?.toLowerCase().includes(term);
    const posMatch = emp.jobTitle?.toLowerCase().includes(term);
    const matchesSearch = nameMatch || idMatch || posMatch;
    
    const matchesDept = departmentFilter ? emp.department === departmentFilter : true;
    const matchesStatus = statusFilter ? emp.status === statusFilter : true;
    
    return matchesSearch && matchesDept && matchesStatus;
  });

  const uniqueDepartments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
  `;
code = code.replace(filterLogic, newFilterLogic);

// 4. Update the Search / Filter UI
const searchBar = `<div className="relative w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            />
          </div>`;
const newSearchBar = `<div className="flex items-center gap-3 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search by name, ID, or role..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white shadow-sm transition-all"
              />
            </div>
            <select 
              value={departmentFilter} 
              onChange={e => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white shadow-sm text-sm font-medium text-neutral-700"
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept: any) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white shadow-sm text-sm font-medium text-neutral-700"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>`;
code = code.replace(searchBar, newSearchBar);

// 5. Update Profile Header to include the "Export PDF" button and add print styles
const profileHeader = `<div className="flex items-center justify-between mb-8">
            <button onClick={() => setSelectedEmployee(null)} className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Directory
            </button>
            <div className="flex gap-3">
              <button onClick={() => openEdit(selectedEmployee)} className="bg-white border border-neutral-200 text-neutral-700 px-4 py-2 rounded-lg font-medium hover:bg-neutral-50 flex items-center gap-2">
                <Edit className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>`;

const newProfileHeader = `<div className="flex items-center justify-between mb-8 print:hidden">
            <button onClick={() => setSelectedEmployee(null)} className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Directory
            </button>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="bg-white border border-neutral-200 text-neutral-700 px-4 py-2 rounded-lg font-medium hover:bg-neutral-50 flex items-center gap-2 shadow-sm">
                <Printer className="w-4 h-4" /> Export PDF
              </button>
              <button onClick={() => openEdit(selectedEmployee)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                <Edit className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
          
          <div className="hidden print:block mb-8 text-center border-b pb-4">
            <h1 className="text-3xl font-bold text-neutral-900">Employee Profile Report</h1>
            <p className="text-neutral-500 mt-2">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          `;
code = code.replace(profileHeader, newProfileHeader);

// 6. Tweak colors
code = code.replace(/text-neutral-900/g, (m, offset) => {
  // Be careful not to break standard text classes, but let's change some button text or icons
  return m;
});

// Update the list grid wrapping to handle print hiding
const parentWrapper = `<div className="h-full flex flex-col gap-6">`;
const newParentWrapper = `<div className="h-full flex flex-col gap-6 print:block print:h-auto print:gap-0">`;
code = code.replace(parentWrapper, newParentWrapper);

const tableWrapper = `<div className="flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar bg-white rounded-2xl border border-neutral-200 shadow-sm">`;
const newTableWrapper = `<div className="flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] print:hidden">`;
code = code.replace(tableWrapper, newTableWrapper);

// The top header where the "Employees" title is should also be hidden on print if we are showing a profile
const headerArea = `<div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Employees</h1>`;
const newHeaderArea = `<div className={\`flex justify-between items-center \${selectedEmployee ? 'print:hidden' : ''}\`}>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Employees</h1>`;
code = code.replace(headerArea, newHeaderArea);

fs.writeFileSync('src/components/Employees.tsx', code);
