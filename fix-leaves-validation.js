import fs from 'fs';
let code = fs.readFileSync('src/components/Leaves.tsx', 'utf-8');

const validationRegex = /const handleSubmit = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);/;

const validationCode = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Invalid Date Range
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) {
      alert("Invalid date range: Start date cannot be after end date.");
      return;
    }

    // Validation: Overlapping leaves for the same employee
    const overlapping = leaves.find(l => 
      l.employeeId === parseInt(formData.employeeId) &&
      l.status !== 'rejected' &&
      ((start >= new Date(l.startDate) && start <= new Date(l.endDate)) ||
       (end >= new Date(l.startDate) && end <= new Date(l.endDate)) ||
       (start <= new Date(l.startDate) && end >= new Date(l.endDate)))
    );

    if (overlapping) {
      alert("Overlapping request: This employee already has a leave request during this period.");
      return;
    }
`;

code = code.replace(validationRegex, validationCode);
fs.writeFileSync('src/components/Leaves.tsx', code);
