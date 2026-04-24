const fs = require('fs');
const path = require('path');

const walkSync = (dir, callback) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walkSync(filepath, callback);
    } else if (filepath.endsWith('.jsx') || filepath.endsWith('.js')) {
      callback(filepath);
    }
  });
};

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

const srcPath = 'd:/Web Dev/ETP_DeltoroEntertainment/frontend/src';

// 1. Files in admincomponents (root only)
if (fs.existsSync(path.join(srcPath, 'admincomponents'))) {
  fs.readdirSync(path.join(srcPath, 'admincomponents')).forEach(file => {
    const filepath = path.join(srcPath, 'admincomponents', file);
    if (fs.statSync(filepath).isFile() && (filepath.endsWith('.jsx') || filepath.endsWith('.js'))) {
      replaceInFile(filepath, [
        { from: '"./hooks/', to: '"../hooks/' },
        { from: "'./hooks/", to: "'../hooks/" },
        { from: '"./context/', to: '"../context/' },
        { from: "'./context/", to: "'../context/" },
        { from: '"./utils/', to: '"../utils/' },
        { from: "'./utils/", to: "'../utils/" },
        { from: '"./components/', to: '"../components/' },
        { from: "'./components/", to: "'../components/" },
        { from: '"./DateRangePicker/', to: '"../components/DateRangePicker/' },
        { from: "'./DateRangePicker/", to: "'../components/DateRangePicker/" },
      ]);
    }
  });
}

// 2. Files in admincomponents/Modal
walkSync(path.join(srcPath, 'admincomponents', 'Modal'), (filepath) => {
  replaceInFile(filepath, [
    { from: '"../hooks/', to: '"../../hooks/' },
    { from: "'../hooks/", to: "'../../hooks/" },
    { from: '"../context/', to: '"../../context/' },
    { from: "'../context/", to: "'../../context/" },
    { from: '"../utils/', to: '"../../utils/' },
    { from: "'../utils/", to: "'../../utils/" },
    { from: '"../components/', to: '"../../components/' },
    { from: "'../components/", to: "'../../components/" },
    { from: '"../DateRangePicker/', to: '"../../components/DateRangePicker/' },
    { from: "'../DateRangePicker/", to: "'../../components/DateRangePicker/" },
  ]);
});

// 3. Other components (promoter, customer, sponsor, landingpage, components, layouts, services)
const otherDirs = [
  'promotercomponents',
  'customercomponents',
  'sponsorcomponents',
  'landingpage',
  'components',
  'layouts',
  'services'
];

otherDirs.forEach(dir => {
  const fullPath = path.join(srcPath, dir);
  if (fs.existsSync(fullPath)) {
    walkSync(fullPath, (filepath) => {
      replaceInFile(filepath, [
        { from: '"../admincomponents/hooks/', to: '"../hooks/' },
        { from: "'../admincomponents/hooks/", to: "'../hooks/" },
        { from: '"../admincomponents/context/', to: '"../context/' },
        { from: "'../admincomponents/context/", to: "'../context/" },
        { from: '"../admincomponents/utils/', to: '"../utils/' },
        { from: "'../admincomponents/utils/", to: "'../utils/" },
        { from: '"../admincomponents/components/', to: '"../components/' },
        { from: "'../admincomponents/components/", to: "'../components/" },
        { from: '"../admincomponents/DateRangePicker/', to: '"../components/DateRangePicker/' },
        { from: "'../admincomponents/DateRangePicker/", to: "'../components/DateRangePicker/" },
        
        { from: '"../../admincomponents/hooks/', to: '"../../hooks/' },
        { from: "'../../admincomponents/hooks/", to: "'../../hooks/" },
        { from: '"../../admincomponents/context/', to: '"../../context/' },
        { from: "'../../admincomponents/context/", to: "'../../context/" },
        { from: '"../../admincomponents/utils/', to: '"../../utils/' },
        { from: "'../../admincomponents/utils/", to: "'../../utils/" },
        { from: '"../../admincomponents/components/', to: '"../../components/' },
        { from: "'../../admincomponents/components/", to: "'../../components/" },
        { from: '"../../admincomponents/DateRangePicker/', to: '"../../components/DateRangePicker/' },
        { from: "'../../admincomponents/DateRangePicker/", to: "'../../components/DateRangePicker/" }
      ]);
    });
  }
});

// 4. App.jsx and main.jsx
const rootFiles = ['App.jsx', 'main.jsx'];
rootFiles.forEach(file => {
  const filepath = path.join(srcPath, file);
  if (fs.existsSync(filepath)) {
    replaceInFile(filepath, [
      { from: '"./admincomponents/hooks/', to: '"./hooks/' },
      { from: "'./admincomponents/hooks/", to: "'./hooks/" },
      { from: '"./admincomponents/context/', to: '"./context/' },
      { from: "'./admincomponents/context/", to: "'./context/" },
      { from: '"./admincomponents/utils/', to: '"./utils/' },
      { from: "'./admincomponents/utils/", to: "'./utils/" },
      { from: '"./admincomponents/components/', to: '"./components/' },
      { from: "'./admincomponents/components/", to: "'./components/" },
      { from: '"./admincomponents/DateRangePicker/', to: '"./components/DateRangePicker/' },
      { from: "'./admincomponents/DateRangePicker/", to: "'./components/DateRangePicker/" }
    ]);
  }
});

console.log("Import paths updated successfully.");
