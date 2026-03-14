const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\Acer\\Music\\new';
const limitExpansion = ['node_modules', '.next', 'public/uploads', '.git'];
const fullyExpand = ['src/app', 'src/providers', 'src/hooks', 'src/actions', 'src/lib'];

function buildTree(dir, prefix = '', isLast = true, isRoot = true) {
    let result = '';
    
    // Get relative path
    const relPath = path.relative(rootDir, dir).replace(/\\/g, '/');
    
    if (isRoot) {
        result += `project-root\n│\n`;
    }

    let items;
    try {
        items = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
        return result;
    }

    // Sort: directories first, then files
    items.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const isItemLast = i === items.length - 1;
        const pointer = isItemLast ? '└── ' : '├── ';
        const childPath = path.join(dir, item.name);
        const childRelPath = path.relative(rootDir, childPath).replace(/\\/g, '/');
        
        // Handle ignored folders
        if (item.isDirectory() && (childRelPath === '.git' || limitExpansion.includes(childRelPath))) {
            result += `${prefix}${pointer}${item.name}\n`;
            continue;
        }

        result += `${prefix}${pointer}${item.name}\n`;

        if (item.isDirectory()) {
            const nextPrefix = prefix + (isItemLast ? '    ' : '│   ');
            result += buildTree(childPath, nextPrefix, isItemLast, false);
        }
    }
    
    return result;
}

const treeOut = buildTree(rootDir);
fs.writeFileSync('c:\\Users\\Acer\\Music\\new\\tree_output.txt', treeOut);
console.log('Tree written to tree_output.txt');
