#!/usr/bin/env node

/**
 * Script لتحديث version.json يدوياً
 * 
 * الاستخدام:
 *   node scripts/update-version.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const versionFile = path.join(rootDir, 'public', 'version.json');

try {
  // احصل على معلومات الـ git
  const gitHash = execSync('git rev-parse HEAD').toString().trim().slice(0, 8);
  const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  
  // إنشاء البيانات الجديدة
  const versionData = {
    version: new Date().toISOString().slice(0, 10),
    timestamp: Date.now(),
    buildHash: gitHash,
    branch: gitBranch
  };

  // اكتب الملف
  fs.writeFileSync(
    versionFile,
    JSON.stringify(versionData, null, 2),
    'utf8'
  );

  console.log('✓ تم تحديث version.json');
  console.log(JSON.stringify(versionData, null, 2));
  
} catch (error) {
  console.error('✗ خطأ في تحديث version.json:', error.message);
  process.exit(1);
}
