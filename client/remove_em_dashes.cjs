const fs = require('fs');
const path = require('path');

const postsDir = 'f:/suitegenie/new-platform/client/content/blog/posts';

const getAllFiles = (dir, filesList = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, filesList);
        } else if (fullPath.endsWith('.json')) {
            filesList.push(fullPath);
        }
    }
    return filesList;
};

const files = getAllFiles(postsDir);
let updatedCount = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('—')) {
        // Replace em-dash with a hyphen surrounded by spaces
        content = content.replace(/\s*—\s*/g, ' - ');
        fs.writeFileSync(f, content);
        updatedCount++;
    }
});

console.log(`Replaced em-dashes in ${updatedCount} files.`);
