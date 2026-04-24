const fs = require('fs');
const path = require('path');

const walkSync = (dir, callback) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walkSync(filepath, callback);
    } else if (filepath.endsWith('.jsx') || filepath.endsWith('.js') || filepath.endsWith('.css')) {
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

// Fixes for admincomponents root
if (fs.existsSync(path.join(srcPath, 'admincomponents'))) {
  fs.readdirSync(path.join(srcPath, 'admincomponents')).forEach(file => {
    const filepath = path.join(srcPath, 'admincomponents', file);
    if (fs.statSync(filepath).isFile() && (filepath.endsWith('.jsx') || filepath.endsWith('.js'))) {
      replaceInFile(filepath, [
        { from: '"../components/BoothMap"', to: '"./BoothMap"' },
        { from: "'../components/BoothMap'", to: "'./BoothMap'" },
        { from: '"../components/EventSelection"', to: '"./EventSelection"' },
        { from: "'../components/EventSelection'", to: "'./EventSelection'" },
        { from: '"../components/LayoutBuilder"', to: '"./LayoutBuilder"' },
        { from: "'../components/LayoutBuilder'", to: "'./LayoutBuilder'" },
        { from: '"../components/LiveScanning"', to: '"./LiveScanning"' },
        { from: "'../components/LiveScanning'", to: "'./LiveScanning'" },
        { from: '"../components/SeatMap"', to: '"./SeatMap"' },
        { from: "'../components/SeatMap'", to: "'./SeatMap'" },
        
        { from: '"../components/DateRangePicker', to: '"../utils/DateRangePicker' },
        { from: "'../components/DateRangePicker", to: "'../utils/DateRangePicker" },
        
        { from: '"./LayoutBuilder.css"', to: '"./LayoutBuilder.css"' } // If it was "./LayoutBuilder.css", it stays the same because it moved with it
      ]);
    }
  });
}

// Fixes for admincomponents/Modal
walkSync(path.join(srcPath, 'admincomponents', 'Modal'), (filepath) => {
  replaceInFile(filepath, [
    { from: '"../../components/BoothMap"', to: '"../BoothMap"' },
    { from: "'../../components/BoothMap'", to: "'../BoothMap'" },
    { from: '"../../components/EventSelection"', to: '"../EventSelection"' },
    { from: "'../../components/EventSelection'", to: "'../EventSelection'" },
    { from: '"../../components/LayoutBuilder"', to: '"../LayoutBuilder"' },
    { from: "'../../components/LayoutBuilder'", to: "'../LayoutBuilder'" },
    { from: '"../../components/LiveScanning"', to: '"../LiveScanning"' },
    { from: "'../../components/LiveScanning'", to: "'../LiveScanning'" },
    { from: '"../../components/SeatMap"', to: '"../SeatMap"' },
    { from: "'../../components/SeatMap'", to: "'../SeatMap'" },
    
    { from: '"../../components/DateRangePicker', to: '"../../utils/DateRangePicker' },
    { from: "'../../components/DateRangePicker", to: "'../../utils/DateRangePicker" },
  ]);
});

// App.jsx Fix
if (fs.existsSync(path.join(srcPath, 'App.jsx'))) {
    replaceInFile(path.join(srcPath, 'App.jsx'), [
        { from: '"./components/ProtectedRoute.jsx"', to: '"./utils/ProtectedRoute.jsx"' },
        { from: "'./components/ProtectedRoute.jsx'", to: "'./utils/ProtectedRoute.jsx'" }
    ]);
}

console.log("Fixes complete.");
