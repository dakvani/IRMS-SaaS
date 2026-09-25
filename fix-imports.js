import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');
code = "import { QRCodeSVG } from 'qrcode.react';\nimport Barcode from 'react-barcode';\n" + code;
fs.writeFileSync('src/components/Assets.tsx', code);
