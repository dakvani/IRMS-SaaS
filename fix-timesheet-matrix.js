import fs from 'fs';
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf-8');

const matrixLogic = `
  const [yearStr, monthStr] = reviewingBatch?.month?.split('-') || [];
  const daysInMonth = yearStr && monthStr ? new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate() : 31;
  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const employeeData = React.useMemo(() => {
    const map = new Map();
    batchDetails.forEach(detail => {
      const empId = detail.employee?.id;
      if (!map.has(empId)) {
        map.set(empId, {
          id: empId,
          name: \`\${detail.employee?.firstName} \${detail.employee?.lastName}\`,
          records: {},
          total: 0
        });
      }
      const emp = map.get(empId);
      if (detail.date) {
        const dayStr = detail.date.split('T')[0].split('-')[2];
        const day = parseInt(dayStr, 10);
        emp.records[day] = detail;
        emp.total += (detail.hoursWorked || 0);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [batchDetails]);
`;

code = code.replace(
  "if (isLoading) return <div",
  matrixLogic + "\n  if (isLoading) return <div"
);

const newModalTable = `
                ) : employeeData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-white sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs shadow-sm">
                        <tr>
                          <th className="px-4 py-3 sticky left-0 bg-white z-20 shadow-[1px_0_0_#e5e5e5]">Employee</th>
                          <th className="px-4 py-3 text-center bg-white shadow-[-1px_0_0_#e5e5e5] border-l border-neutral-100">Total</th>
                          {daysArray.map(day => (
                            <th key={day} className="px-2 py-3 text-center min-w-[36px]">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {employeeData.map(emp => (
                          <tr key={emp.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-neutral-50 z-10 font-medium text-neutral-900 shadow-[1px_0_0_#e5e5e5]">
                              {emp.name}
                            </td>
                            <td className="px-4 py-3 font-bold text-indigo-700 text-center shadow-[-1px_0_0_#e5e5e5] border-l border-neutral-100 bg-white">
                              {emp.total}
                            </td>
                            {daysArray.map(day => {
                              const rec = emp.records[day];
                              return (
                                <td key={day} className="px-2 py-3 text-center border-l border-neutral-50" title={rec?.notes || ''}>
                                  {rec ? (
                                    <span className={\`inline-flex items-center justify-center w-7 h-7 rounded-md \${rec.attendanceStatus === 'Present' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-neutral-100 text-neutral-600'}\`}>
                                      {rec.hoursWorked}
                                    </span>
                                  ) : (
                                    <span className="text-neutral-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
`;

code = code.replace(
  /\) : batchDetails\.length > 0 \? \([\s\S]*?\) : \(\s*<div className="text-center py-12 text-neutral-500">/,
  newModalTable.trim() + "\n                ) : (\n                  <div className=\"text-center py-12 text-neutral-500\">"
);

fs.writeFileSync('src/components/Timesheets.tsx', code);
