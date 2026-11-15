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

function inferMetadata(harnessOrDir, fileName) {
  const s = (harnessOrDir + ' ' + fileName).toLowerCase();
  let surface = 'web';
  if (s.includes('desktop') || s.includes('cowork')) surface = 'desktop';
  else if (s.includes('claude-code-code') || s.includes('cli') || s.includes('hermes')) surface = 'cli';
  else if (s.includes('antigravity')) surface = 'ide';
  else if (s.includes('mobile') || s.includes('ios') || s.includes('android')) surface = 'mobile';
  else if (s.includes('codex')) surface = 'desktop';
  else if (s.includes('browser') || s.includes('web') || s.includes('gemini') || s.includes('pi') || s.includes('grok')) surface = 'web';

  let family = 'other';
  if (s.includes('chatgpt') || s.includes('codex') || s.includes('openai')) family = 'openai';
  else if (s.includes('claude') || s.includes('anthropic')) family = 'anthropic';
  else if (s.includes('gemini') || s.includes('antigravity') || s.includes('google')) family = 'google';
  else if (s.includes('deepseek')) family = 'deepseek';
  else if (s.includes('hermes') || s.includes('nous')) family = 'nous';
  else if (s.includes('pi') || s.includes('inflection')) family = 'inflection';
  else if (s.includes('grok') || s.includes('xai')) family = 'xai';

  let harness_type = 'conversational';
  if (s.includes('antigravity') || s.includes('claude-code-code') || s.includes('claude-code-cli') || s.includes('codex')) {
    harness_type = 'coding';
  } else if (s.includes('cowork') || s.includes('chatgpt-desktop')) {
    harness_type = 'knowledge_work';
  } else if (s.includes('hermes')) {
    harness_type = 'autonomous';
  } else if (s.includes('browser') || s.includes('web') || s.includes('gemini') || s.includes('chatgpt') || s.includes('grok') || s.includes('pi')) {
    harness_type = 'conversational';
  }

  return { surface, family, harness_type };
}

function build() {
  const categoriesData = loadJson(path.join(TAXONOMY_DIR, 'categories.json'));
  const mappingsData = loadJson(path.join(TAXONOMY_DIR, 'tool-mappings.json'));
  const categories = categoriesData.categories || [];
  const mappings = mappingsData.mappings || {};

  const jsonFiles = findJsonFiles(DATA_DIR);
  const snapshots = [];
  const unmappedTools = new Set();

  for (const filePath of jsonFiles) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const fileName = path.basename(filePath, '.json');
    const parentDir = path.basename(path.dirname(filePath));
    const rawData = loadJson(filePath);

    // Extract metadata: check for date prefix YYYY-MM-DD
    const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})_(.*)$/);
    let date = '2026-08-31';
    let fileRest = fileName;

    if (dateMatch) {
      date = dateMatch[1];
      fileRest = dateMatch[2];
    }

    const parts = fileRest.split('_');
    const harness = parts[0] || parentDir || rawData.harness_reported || 'unknown';
    let model = parts[1] || rawData.model_reported || 'unknown';
    const state = parts[2] || (fileName.includes('refusal') ? 'refusal' : (fileName.includes('cold') ? 'cold' : 'active'));

    // If model is unknown or parts combined
    if (harness.includes('codex-5.6-terra')) {
      model = '5.6-terra';
    }

    const { surface, family, harness_type } = inferMetadata(parentDir + ' ' + harness, fileName);

    const categoryCounts = {};
    for (const cat of categories) {
      categoryCounts[cat.id] = 0;
    }

    const normalizedTools = (rawData.tools || []).map(tool => {
      const mapping = mappings[tool.name];
      if (!mapping) {
        unmappedTools.add(tool.name);
      }
      const category = mapping ? mapping.category : 'other';
      const subcategory = mapping ? (mapping.subcategory || 'other') : 'other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      return {
        name: tool.name,
        canonical: (mapping && mapping.canonical) || tool.name,
        category,
        subcategory,
        description: tool.description || '',
        parameters: normalizeParameters(tool.parameters)
      };
    });

    snapshots.push({
      id: fileName,
      harness,
      family,
      surface,
      harness_type,
      model,
      state,
      date,
      file_path: relativePath,
      harness_reported: rawData.harness_reported || harness,
      model_reported: rawData.model_reported || model,
      tool_count_reported: rawData.tool_count_reported !== undefined ? rawData.tool_count_reported : normalizedTools.length,
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
  if (unmappedTools.size > 0) {
    console.warn(`Warning: ${unmappedTools.size} unmapped tool(s) defaulted to "other":`);
    for (const name of [...unmappedTools].sort()) {
      console.warn(`  - ${name}`);
    }
  }
}

build();
