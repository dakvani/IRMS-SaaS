const fs = require('fs');
const path = require('path');

const OKLCH_PARSER_SNIPPET = `
var parseOklchTokens = function(args) {
    try {
        if (!args || !args.length) return 0;
        var tokens = args.filter(function(t) {
            return t && t.type !== 31 && t.type !== 4 && t.value !== '/';
        });
        if (!tokens.length) return 0;
        var L = 0, C = 0, H = 0, a = 1;
        if (tokens[0]) {
            L = tokens[0].type === 16 ? tokens[0].number / 100 : (Number(tokens[0].number) || 0);
        }
        if (tokens[1]) {
            C = tokens[1].type === 16 ? tokens[1].number / 100 : (Number(tokens[1].number) || 0);
        }
        if (tokens[2]) {
            H = Number(tokens[2].number) || 0;
        }
        if (tokens[3]) {
            a = tokens[3].type === 16 ? tokens[3].number / 100 : (tokens[3].number != null ? Number(tokens[3].number) : 1);
        }
        var hRad = (H * Math.PI) / 180;
        var aCoord = C * Math.cos(hRad);
        var bCoord = C * Math.sin(hRad);
        var l_ = L + 0.3963377774 * aCoord + 0.2158037573 * bCoord;
        var m_ = L - 0.1055613458 * aCoord - 0.0638541728 * bCoord;
        var s_ = L - 0.0894841775 * aCoord - 1.291485548 * bCoord;
        var l3 = l_ * l_ * l_;
        var m3 = m_ * m_ * m_;
        var s3 = s_ * s_ * s_;
        var rLin = +4.0767434756 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
        var gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
        var bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;
        var toGamma = function(x) {
            var clamped = Math.max(0, Math.min(1, x));
            return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
        };
        var r = Math.round(toGamma(rLin) * 255);
        var g = Math.round(toGamma(gLin) * 255);
        var b = Math.round(toGamma(bLin) * 255);
        return ((r << 24) | (g << 16) | (b << 8) | (Math.round(a * 255) << 0)) >>> 0;
    } catch (_e) {
        return 0;
    }
};
`;

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  let code = fs.readFileSync(filePath, 'utf8');
  let originalCode = code;

  // 1. Inject parseOklchTokens if not present
  if (!code.includes('var parseOklchTokens = function')) {
    code = OKLCH_PARSER_SNIPPET + '\n' + code;
  }

  // 2. Replace any throw new Error involving unsupported color function
  const throwRegex = /throw new Error\s*\(\s*[^)]*unsupported color function[^)]*\)\s*;?/gi;
  if (throwRegex.test(code)) {
    code = code.replace(throwRegex, () => {
      return `if (typeof parseOklchTokens === "function" && typeof value !== "undefined" && value) { return parseOklchTokens(value.values); } if (typeof parseOklchTokens === "function" && typeof e !== "undefined" && e) { return parseOklchTokens(e.values); } return 0;`;
    });
  }

  // 3. Fix any previous patch returning pack(23, 23, 23, 1)
  if (code.includes('return pack(23, 23, 23, 1);')) {
    code = code.replace(/return pack\(23,\s*23,\s*23,\s*1\);/g, 'return parseOklchTokens(value ? value.values : args);');
  }

  // 4. Ensure SUPPORTED_COLOR_FUNCTIONS includes oklch
  if (code.includes('rgba: rgb') && !code.includes('oklch: function')) {
    code = code.replace(
      /rgba:\s*rgb/g,
      `rgba: rgb,
    oklch: function(context, args) { return parseOklchTokens(args); }`
    );
  }

  if (code !== originalCode) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('[OKLCH Patch] Successfully patched:', filePath);
    return true;
  }
  return false;
}

const targetFiles = [
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.js'),
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.esm.js'),
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.min.js'),
  path.join(__dirname, '../node_modules/html2canvas/dist/lib/css/types/color.js'),
  path.join(__dirname, '../node_modules/.vite/deps/html2pdf__js.js')
];

let totalPatched = 0;
for (const file of targetFiles) {
  if (patchFile(file)) {
    totalPatched++;
  }
}
console.log(`[OKLCH Patch] Finished. Patched ${totalPatched} files.`);
