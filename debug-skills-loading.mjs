#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SKILLS_DIR = './skills';
const skillsCatalogue = new Map();

function loadSkillsRecursive(dir, category = '', depth = 0) {
  if (!existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    return;
  }
  
  const entries = readdirSync(dir, { withFileTypes: true });
  console.log(`${'  '.repeat(depth)}Scanning: ${dir} (${entries.length} entries)`);

  for (const file of entries) {
    const fullPath = join(dir, file.name);
    
    if (file.isDirectory()) {
      const subCategory = category ? `${category}/${file.name}` : file.name;
      loadSkillsRecursive(fullPath, subCategory, depth + 1);
    } else if (file.name.endsWith('.md') && file.name !== 'README.md') {
      const id = file.name.replace('.md', '');
      
      // Check for duplicate IDs
      if (skillsCatalogue.has(id)) {
        console.log(`⚠️  Duplicate ID: ${id} (${fullPath} vs ${skillsCatalogue.get(id).path})`);
      }
      
      skillsCatalogue.set(id, { id, path: fullPath, category });
    }
  }
}

loadSkillsRecursive(SKILLS_DIR);
console.log('\n=== Summary ===');
console.log('Total skills loaded:', skillsCatalogue.size);
console.log('Total .md files found:', Array.from(skillsCatalogue.values()).length);

