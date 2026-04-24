const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replacements) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  replacements.forEach(({ from, to }) => {
    content = content.split(from).join(to);
  });
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
};

const filesToFix = [
  { path: 'admincomponents/boothandticket.jsx', replacements: [{ from: '"../admincomponents/hooks/', to: '"../hooks/' }] },
  { path: 'admincomponents/eventmanagement.jsx', replacements: [{ from: '"../admincomponents/hooks/', to: '"../hooks/' }] },
  { path: 'admincomponents/ViewTicket.jsx', replacements: [{ from: "'../admincomponents/hooks/", to: "'../hooks/" }, { from: "'../admincomponents/utils/", to: "'../utils/" }] },
  { path: 'admincomponents/support.jsx', replacements: [{ from: "'../admincomponents/hooks/", to: "'../hooks/" }, { from: "'../admincomponents/utils/", to: "'../utils/" }] }
];

const basePath = 'd:/Web Dev/ETP_DeltoroEntertainment/frontend/src';

filesToFix.forEach(({ path: relPath, replacements }) => {
  const fullPath = path.join(basePath, relPath);
  if (fs.existsSync(fullPath)) {
    replaceInFile(fullPath, replacements);
  } else {
    console.log("File not found: " + fullPath);
  }
});

console.log("Leftover imports fixed.");
