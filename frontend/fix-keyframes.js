import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

let count = 0;
walkDir('./src', (filePath) => {
    if (!filePath.endsWith('.css')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('@keyframes')) return;

    let newContent = '';
    let extractedKeyframes = [];
    
    let i = 0;
    while(i < content.length) {
        let match = content.indexOf('@keyframes', i);
        if (match === -1) {
            newContent += content.slice(i);
            break;
        }
        
        newContent += content.slice(i, match);
        
        let braceCount = 0;
        let started = false;
        let endMatch = match;
        for (let j = match; j < content.length; j++) {
            if (content[j] === '{') {
                braceCount++;
                started = true;
            } else if (content[j] === '}') {
                braceCount--;
            }
            if (started && braceCount === 0) {
                endMatch = j + 1;
                break;
            }
        }
        
        let keyframeBlock = content.slice(match, endMatch);
        extractedKeyframes.push(keyframeBlock);
        
        i = endMatch;
    }
    
    if (extractedKeyframes.length > 0) {
        newContent = newContent + '\n\n' + extractedKeyframes.join('\n\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        count++;
        console.log(`Fixed: ${filePath}`);
    }
});
console.log(`Total fixed: ${count} files.`);
