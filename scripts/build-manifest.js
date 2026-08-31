#!/usr/bin/env node

/**
 * build-manifest.js
 * Ingests all capture JSON files in data/ and taxonomy/ definitions to produce a compiled manifest.json.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const TAXONOMY_DIR = path.join(ROOT_DIR, 'taxonomy');
const OUTPUT_FILE = path.join(ROOT_DIR, 'manifest.json');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeParameters(params) {
  if (!params) return [];
  if (Array.isArray(params)) {
    return params.map(p => ({
      name: p.name || '',
      type: p.type || 'unknown',
      required: Boolean(p.required),
      enum: Array.isArray(p.enum) ? p.enum : null,
      description: p.description || ''
    }));
  }
  if (typeof params === 'object' && params.properties) {
    const requiredList = Array.isArray(params.required) ? params.required : [];
    return Object.entries(params.properties).map(([name, prop]) => ({
      name,
      type: prop.type || 'unknown',
      required: requiredList.includes(name),
      enum: Array.isArray(prop.enum) ? prop.enum : null,
      description: prop.description || ''
    }));
  }
  return [];
}

function findJsonFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findJsonFiles(fullPath));
    } else if (file.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

function build() {
  const categoriesData = loadJson(path.join(TAXONOMY_DIR, 'categories.json'));
  const mappingsData = loadJson(path.join(TAXONOMY_DIR, 'tool-mappings.json'));
  const categories = categoriesData.categories || [];
  const mappings = mappingsData.mappings || {};

  const jsonFiles = findJsonFiles(DATA_DIR);
  const snapshots = [];

  for (const filePath of jsonFiles) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const fileName = path.basename(filePath, '.json');
    const rawData = loadJson(filePath);

    // Format: YYYY-MM-DD_<harness>_<model>_<state>
    const parts = fileName.split('_');
    const date = parts[0] || 'unknown';
    const harness = parts[1] || rawData.harness_reported || 'unknown';
    const model = parts[2] || rawData.model_reported || 'unknown';
    const state = parts[3] || 'cold';

    const categoryCounts = {};
    for (const cat of categories) {
      categoryCounts[cat.id] = 0;
    }

    const normalizedTools = (rawData.tools || []).map(tool => {
      const mapping = mappings[tool.name] || {
        category: 'other',
        canonical: tool.name
      };

      const category = mapping.category || 'other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      return {
        name: tool.name,
        canonical: mapping.canonical || tool.name,
        category,
        description: tool.description || '',
        parameters: normalizeParameters(tool.parameters)
      };
    });

    snapshots.push({
      id: fileName,
      harness,
      model,
      state,
      date,
      file_path: relativePath,
      harness_reported: rawData.harness_reported || harness,
      model_reported: rawData.model_reported || model,
      tool_count_reported: rawData.tool_count_reported || normalizedTools.length,
      tool_count_actual: normalizedTools.length,
      completeness: rawData.completeness || 'complete',
      omissions_note: rawData.omissions_note || null,
      category_counts: categoryCounts,
      tools: normalizedTools
    });
  }

  snapshots.sort((a, b) => b.date.localeCompare(a.date));

  const manifest = {
    generated_at: new Date().toISOString(),
    categories,
    snapshots
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Generated manifest.json with ${snapshots.length} snapshot(s).`);
}

build();
