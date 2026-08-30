import fs from 'fs';
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf-8');

const updatedMatrixLogic = `
  const employeeData = React.useMemo(() => {
    const map = new Map();
    batchDetails.forEach(detail => {
      const empId = detail.employee?.id;
      if (!map.has(empId)) {
        map.set(empId, {
          id: empId,
          name: \`\${detail.employee?.firstName} \${detail.employee?.lastName}\`,
          records: {},
          total: 0,
          shift: '-',
          workingTime: '-'
        });
      }
      const emp = map.get(empId);
      
      // Extract shift and working time from notes of the first available record
      if (detail.notes && emp.shift === '-') {
        const shiftMatch = detail.notes.match(/Shift: (.*?),/);
        const wtMatch = detail.notes.match(/Working Time: (.*)/);
        if (shiftMatch) emp.shift = shiftMatch[1];
        if (wtMatch) emp.workingTime = wtMatch[1];
      }

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

code = code.replace(/const employeeData = React\.useMemo\(\(\) => \{[\s\S]*?\}, \[batchDetails\]\);/, updatedMatrixLogic.trim());

const newTableHeaders = `
                      <thead className="bg-white sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px] shadow-sm">
                        <tr>
                          <th className="px-4 py-3 sticky left-0 bg-white z-20 shadow-[1px_0_0_#e5e5e5]">Employee</th>
                          <th className="px-3 py-3 border-l border-neutral-100">Site/Proj</th>
                          <th className="px-2 py-3 text-center border-l border-neutral-100" title="Common Working Time">CWT</th>
                          <th className="px-2 py-3 text-center border-l border-neutral-100">Shift</th>
                          <th className="px-3 py-3 text-center bg-white shadow-[-1px_0_0_#e5e5e5] border-l border-neutral-100">Total</th>
                          {daysArray.map(day => (
                            <th key={day} className="px-1.5 py-3 text-center min-w-[32px]">{day}</th>
                          ))}
                        </tr>
                      </thead>
`;

code = code.replace(/<thead className="bg-white sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs shadow-sm">[\s\S]*?<\/thead>/, newTableHeaders.trim());

const newTableBody = `
                      <tbody className="divide-y divide-neutral-100">
                        {employeeData.map(emp => (
                          <tr key={emp.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-neutral-50 z-10 font-medium text-neutral-900 shadow-[1px_0_0_#e5e5e5]">
                              {emp.name}
                            </td>
                            <td className="px-3 py-3 text-neutral-600 text-[11px] truncate max-w-[120px] border-l border-neutral-100">
                              {reviewingBatch?.site_name} / {reviewingBatch?.project_name}
                            </td>
                            <td className="px-2 py-3 text-center text-neutral-600 font-medium text-xs border-l border-neutral-100">
                              {emp.workingTime}
                            </td>
                            <td className="px-2 py-3 text-center text-neutral-600 font-medium text-xs border-l border-neutral-100">
                              {emp.shift}
                            </td>
                            <td className="px-3 py-3 font-bold text-indigo-700 text-center shadow-[-1px_0_0_#e5e5e5] border-l border-neutral-100 bg-white">
                              {emp.total}
                            </td>
                            {daysArray.map(day => {
                              const rec = emp.records[day];
                              return (
                                <td key={day} className="px-1.5 py-3 text-center border-l border-neutral-50" title={rec?.notes || ''}>
                                  {rec ? (
                                    <span className={\`inline-flex items-center justify-center w-6 h-6 text-xs rounded \${rec.attendanceStatus === 'Present' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-neutral-100 text-neutral-600'}\`}>
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
`;

code = code.replace(/<tbody className="divide-y divide-neutral-100">[\s\S]*?<\/tbody>/, newTableBody.trim());

fs.writeFileSync('src/components/Timesheets.tsx', code);
