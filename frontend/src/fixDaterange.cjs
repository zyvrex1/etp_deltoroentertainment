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
  { path: 'customercomponents/CustomerBrowseEvent.jsx', replacements: [{ from: "'../admincomponents/DateRangePicker'", to: "'../utils/DateRangePicker'" }] },
  { path: 'customercomponents/CustomerPurchaseHistory.jsx', replacements: [{ from: "'../admincomponents/DateRangePicker'", to: "'../utils/DateRangePicker'" }] },
  { path: 'sponsorcomponents/SponsorBrowseEvents.jsx', replacements: [{ from: "'../admincomponents/DateRangePicker'", to: "'../utils/DateRangePicker'" }] },
  { path: 'sponsorcomponents/SponsorEventHistory.jsx', replacements: [{ from: "'../admincomponents/DateRangePicker'", to: "'../utils/DateRangePicker'" }] },
  { path: 'sponsorcomponents/SponsorInvoice.jsx', replacements: [{ from: "'../admincomponents/DateRangePicker'", to: "'../utils/DateRangePicker'" }] },
  { path: 'admincomponents/audit.jsx', replacements: [{ from: "'./DateRangePicker'", to: "'../utils/DateRangePicker'" }] },
  { path: 'admincomponents/reportsandanalytics.jsx', replacements: [{ from: '"./DateRangePicker"', to: '"../utils/DateRangePicker"' }] },
  { path: 'promotercomponents/promoterpayouts.jsx', replacements: [{ from: '"../components/DateRangePicker/DateRangePicker.jsx"', to: '"../utils/DateRangePicker/DateRangePicker.jsx"' }] },
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

console.log("DateRangePicker imports fixed.");
