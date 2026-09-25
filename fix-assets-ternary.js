import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

const renderIndex = code.indexOf('return (');
const preRender = code.substring(0, renderIndex);
let renderStr = code.substring(renderIndex);

const boardRegex = /\{viewMode === 'board'[\s\S]*?<\/div>\s*\)\}\s*<\/>\s*\)\}/;
let boardMatch = renderStr.match(boardRegex);
if (!boardMatch) {
  const fallbackBoardRegex = /\{viewMode === 'board'[\s\S]*?<\/div>\s*\)\}/;
  boardMatch = renderStr.match(fallbackBoardRegex);
}

if (boardMatch) {
  renderStr = renderStr.replace(boardMatch[0], '');
  
  // Clean up any dangling `</>\n      )}` that was left behind
  renderStr = renderStr.replace(/<\/div>\s*\)\}\s*<\/>\s*\)\}/, '</div>\n      )}');
  
  const listEndRegex = /<\/table>\s*<\/div>\s*\)\}/;
  
  let boardCode = boardMatch[0];
  // Remove the `!isLoading && filtered.length > 0` checks if they exist
  boardCode = boardCode.replace(/&& !isLoading && filtered\.length > 0 && /, '&& ');
  
  renderStr = renderStr.replace(listEndRegex, `</table>\n        </div>\n      )}\n      ${boardCode}\n      </>\n      )}`);
}

fs.writeFileSync('src/components/Assets.tsx', preRender + renderStr);
