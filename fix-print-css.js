import fs from 'fs';
let css = fs.readFileSync('src/index.css', 'utf-8');

// Replace the previous print block with a more generic one
css = css.replace(/@media print \{[\s\S]*?\}\n\}/, `
@media print {
  body * {
    visibility: hidden;
  }
  .print-area, .print-area * {
    visibility: visible;
  }
  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .no-print {
    display: none !important;
  }
}
`);
// Let me just replace the entire print block. I will just read index.css, remove the old one, and add the new one.
