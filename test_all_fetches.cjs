const fs = require('fs');
const execSync = require('child_process').execSync;

const files = execSync('find src/components -name "*.tsx"').toString().split('\n').filter(Boolean);
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/fetch\(['\`"]([^'\`"\$]+)/g)];
  for (const match of matches) {
    const url = match[1];
    try {
      const curlOut = execSync(`curl -s -H "Authorization: Bearer mock" http://localhost:3000${url} | head -c 20`).toString();
      if (curlOut.includes('<!doctype') || curlOut.includes('<!DOCTYPE') || curlOut.includes('<html')) {
        console.log(`FAIL: ${url} in ${file} returned HTML`);
      }
    } catch (e) {
      console.log(`ERROR on ${url}`);
    }
  }
}
console.log("Done testing fetches");
