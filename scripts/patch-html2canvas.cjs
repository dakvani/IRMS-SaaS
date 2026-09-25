const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.js'),
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.esm.js')
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let code = fs.readFileSync(f, 'utf8');
  let changed = false;

  if (!code.includes('oklch: function') && code.includes('rgba: rgb')) {
    code = code.replace(
      /rgba:\s*rgb\s*\n?\s*};/,
      `rgba: rgb,
    oklch: function (context, args) {
        return pack(23, 23, 23, 1);
    }
};`
    );
    changed = true;
  }

  if (!code.includes('value.name === "oklch"')) {
    code = code.replace(
      /if \(typeof colorFunction === \x27undefined\x27\) \{/,
      `if (typeof colorFunction === \x27undefined\x27) {
                    if (value.name === "oklch") {
                        return pack(23, 23, 23, 1);
                    }`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, code, 'utf8');
    console.log('[OKLCH Patch] Applied to:', f);
  }
}
