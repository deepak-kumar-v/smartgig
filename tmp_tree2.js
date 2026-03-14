const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\Acer\\Music\\new';

// Directories to NOT expand at all (just show the folder name)
const limitExpansion = [
    'node_modules', 
    '.next', 
    'public/uploads', 
    'uploads', 
    '.git',
    'prisma/migrations',
    'test-results',
    'playwright-report'
];

// Folders to fully expand (show all files and subfolders)
const fullyExpand = [
    'src/app', 
    'src/providers', 
    'src/hooks', 
    'src/actions', 
    'src/lib'
];

function isFullyExpanded(relPath) {
    return fullyExpand.some(p => relPath === p || relPath.startsWith(p + '/'));
}

function shouldLimitExpansion(relPath) {
    // If exact match or a subdirectory of a limited folder, we don't want to process it.
    // Actually we only want to list the matching folder, but not its contents.
    // The check happens before recursing.
    return limitExpansion.includes(relPath);
}

function buildTree(dir, prefix = '', isRoot = true) {
    let result = '';
    
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
    
    // Filter items depending on where we are
    const currentRelPath = path.relative(rootDir, dir).replace(/\\/g, '/');
    let filteredItems = [];
    
    for (const item of items) {
        const itemRelPath = currentRelPath === '' ? item.name : `${currentRelPath}/${item.name}`;
        
        // Skip hidden files/folders un-necessary, except .env, .gitignore, .next
        if (item.name.startsWith('.') && item.name !== '.env' && item.name !== '.gitignore' && item.name !== '.next') {
            if (item.name !== '.agent') continue; // keep .agent maybe? Or skip. Let's skip to keep it clean.
        }

        if (item.isDirectory()) {
            filteredItems.push(item);
        } else {
            // It's a file
            if (isRoot) {
                // Always show root files
                filteredItems.push(item);
            } else if (isFullyExpanded(currentRelPath)) {
                // Show files if we are inside a fully expanded dir
                filteredItems.push(item);
            } else if (currentRelPath === 'prisma' || currentRelPath === 'src') {
                // Specific files like schema.prisma or root src files
                filteredItems.push(item);
            } else {
                // For other folders (like src/components, src/server), should we show files?
                // The user only said "Expand the following folders completely: src/app...". 
                // Let's hide files to keep the tree short, but show directories.
                // Wait, components are usually important. Let's include files but hope the tree is short enough now.
                // No, wait, if I include all files in src/components, it might still be long.
                // Let's just include all files, since we've excluded a bunch of other heavy dirs.
                filteredItems.push(item);
            }
        }
    }

    for (let i = 0; i < filteredItems.length; i++) {
        const item = filteredItems[i];
        const isItemLast = i === filteredItems.length - 1;
        const pointer = isItemLast ? '└── ' : '├── ';
        const itemRelPath = currentRelPath === '' ? item.name : `${currentRelPath}/${item.name}`;

        result += `${prefix}${pointer}${item.name}\n`;

        if (item.isDirectory() && !shouldLimitExpansion(itemRelPath)) {
            const nextPrefix = prefix + (isItemLast ? '    ' : '│   ');
            result += buildTree(path.join(dir, item.name), nextPrefix, false);
        }
    }
    
    return result;
}

const treeOut = buildTree(rootDir);
fs.writeFileSync('c:\\Users\\Acer\\Music\\new\\tree_output2.txt', treeOut);
console.log('Tree written to tree_output2.txt');
