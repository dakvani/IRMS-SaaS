import fs from 'fs';
import path from 'path';

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let code = fs.readFileSync(filePath, 'utf-8');
  
  // Replace value={someObject.someField} with value={someObject.someField || ''} 
  // ONLY for common state objects: formData, courseData, recordData
  code = code.replace(/value=\{formData\.([a-zA-Z0-9]+)\}/g, "value={formData.$1 || ''}");
  code = code.replace(/value=\{courseData\.([a-zA-Z0-9]+)\}/g, "value={courseData.$1 || ''}");
  code = code.replace(/value=\{recordData\.([a-zA-Z0-9]+)\}/g, "value={recordData.$1 || ''}");
  
  // Note: for numeric inputs where it is parsed as integer (like parseInt(e.target.value)), 
  // setting it to || '' is fine for string rendering, but if the value is strictly typed to number it might complain. 
  // In our case, the value is usually 'any' or allows string.

  fs.writeFileSync(filePath, code);
}
