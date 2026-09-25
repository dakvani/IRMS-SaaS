import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

// Imports
code = code.replace(
  /import \{ (.*) \} from 'lucide-react';/,
  `import { $1, ScanLine, Calculator, Wrench, Settings, ArrowRightLeft, LayoutGrid, List } from 'lucide-react';\nimport { Html5QrcodeScanner } from 'html5-qrcode';`
);

// State additions
code = code.replace(
  /const \[formData, setFormData\] = useState\(\{[\s\S]*?status: 'available'\s*\}\);/,
  `const [formData, setFormData] = useState({
    name: '', assetTag: '', type: 'Laptop', assignedToEmployeeId: '', assignedToSiteId: '', status: 'available',
    purchasePrice: '', purchaseDate: '', salvageValue: '', usefulLifeYears: '', depreciationMethod: 'straight_line', maintenanceIntervalDays: ''
  });
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [isScanning, setIsScanning] = useState(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [maintenanceForm, setMaintenanceForm] = useState({ serviceDate: new Date().toISOString().split('T')[0], technicianNotes: '', status: 'completed' });
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);`
);

// Fetch maintenance on asset click
code = code.replace(
  /fetchAssetHistory\(asset\.id\);/,
  `fetchAssetHistory(asset.id);\n    fetchMaintenanceLogs(asset.id);`
);

const fetchMaintCode = `
  const fetchMaintenanceLogs = async (id: number) => {
    try {
      const token = (window as any)._token;
      const res = await fetch(\`/api/assets/\${id}/maintenance\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) setMaintenanceLogs(await res.json());
    } catch(e) { console.error(e); }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch(\`/api/assets/\${selectedAsset.id}/maintenance\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(maintenanceForm)
      });
      if (res.ok) {
        setShowMaintenanceForm(false);
        fetchMaintenanceLogs(selectedAsset.id);
        fetchData();
        setMaintenanceForm({ serviceDate: new Date().toISOString().split('T')[0], technicianNotes: '', status: 'completed' });
      }
    } catch (e) { console.error(e); }
  };
`;

code = code.replace(/const handleAssetClick = /, fetchMaintCode + '\n  const handleAssetClick = ');

fs.writeFileSync('src/components/Assets.tsx', code);
