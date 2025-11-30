#!/usr/bin/env node
/**
 * Index Documentation Script
 *
 * Reads markdown files from the docs folder and sends them to the
 * Azure Functions indexing endpoint to generate embeddings.
 *
 * Usage:
 *   node index-docs.js --functions-url <url> --token <auth-token>
 *   node index-docs.js --functions-url https://func-phoenix-rooivalk-prod.azurewebsites.net --token "Bearer xxx"
 *
 * Environment variables (alternative to flags):
 *   AZURE_FUNCTIONS_BASE_URL - Functions URL
 *   AZURE_FUNCTIONS_ADMIN_KEY - Admin key for authentication
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Parse arguments
const args = process.argv.slice(2);
let functionsUrl = process.env.AZURE_FUNCTIONS_BASE_URL || '';
let authToken = process.env.AZURE_FUNCTIONS_ADMIN_KEY || '';
let docsPath = '';
let dryRun = false;
let batchSize = 5;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--functions-url':
    case '-u':
      functionsUrl = args[++i];
      break;
    case '--token':
    case '-t':
      authToken = args[++i];
      break;
    case '--docs-path':
    case '-d':
      docsPath = args[++i];
      break;
    case '--dry-run':
      dryRun = true;
      break;
    case '--batch-size':
    case '-b':
      batchSize = parseInt(args[++i], 10);
      break;
    case '--help':
    case '-h':
      console.log(`
Index Documentation Script

Usage:
  node index-docs.js [options]

Options:
  -u, --functions-url <url>   Azure Functions base URL
  -t, --token <token>         Authentication token (Bearer token or admin key)
  -d, --docs-path <path>      Path to docs folder (default: auto-detect)
  -b, --batch-size <n>        Documents per batch (default: 5)
  --dry-run                   Show what would be indexed without making requests
  -h, --help                  Show this help

Environment Variables:
  AZURE_FUNCTIONS_BASE_URL    Alternative to --functions-url
  AZURE_FUNCTIONS_ADMIN_KEY   Alternative to --token

Example:
  node index-docs.js -u https://func-phoenix-rooivalk-prod.azurewebsites.net -t "your-admin-key"
`);
      process.exit(0);
  }
}

// Find docs path
if (!docsPath) {
  const possiblePaths = [
    path.join(__dirname, '../../../apps/docs/docs'),
    path.join(__dirname, '../../apps/docs/docs'),
    path.join(process.cwd(), 'apps/docs/docs'),
    path.join(process.cwd(), 'docs'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      docsPath = p;
      break;
    }
  }
}

if (!docsPath || !fs.existsSync(docsPath)) {
  console.error('Error: Could not find docs folder. Use --docs-path to specify.');
  process.exit(1);
}

if (!functionsUrl && !dryRun) {
  console.error('Error: --functions-url is required (or set AZURE_FUNCTIONS_BASE_URL)');
  process.exit(1);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('       Phoenix Rooivalk - Documentation Indexer');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log(`Docs path:     ${docsPath}`);
console.log(`Functions URL: ${functionsUrl || '(dry run)'}`);
console.log(`Batch size:    ${batchSize}`);
console.log(`Dry run:       ${dryRun}`);
console.log('');

/**
 * Recursively find all markdown files
 */
function findMarkdownFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and hidden folders
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        findMarkdownFiles(fullPath, files);
      }
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract frontmatter and content from markdown
 */
function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(docsPath, filePath);

  // Extract frontmatter
  let title = path.basename(filePath, path.extname(filePath));
  let category = path.dirname(relativePath).split(path.sep)[0] || 'general';

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];

    const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
    if (titleMatch) title = titleMatch[1];

    const categoryMatch = frontmatter.match(/sidebar_label:\s*["']?([^"'\n]+)["']?/);
    if (categoryMatch) category = categoryMatch[1];
  }

  // Remove frontmatter from content
  const mainContent = content.replace(/^---\n[\s\S]*?\n---\n*/, '');

  // Generate URL path
  const urlPath = relativePath
    .replace(/\\/g, '/')
    .replace(/\.mdx?$/, '')
    .replace(/\/index$/, '');

  return {
    id: relativePath.replace(/[\/\\\.]/g, '_'),
    title,
    content: mainContent,
    category,
    url: `/docs/${urlPath}`,
  };
}

/**
 * Make HTTP request
 */
function makeRequest(url, data, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * Main indexing function
 */
async function indexDocs() {
  console.log('Finding markdown files...');
  const files = findMarkdownFiles(docsPath);
  console.log(`Found ${files.length} files\n`);

  const documents = files.map(parseMarkdown);

  if (dryRun) {
    console.log('Documents to index:');
    for (const doc of documents) {
      console.log(`  - ${doc.title} (${doc.category}) - ${doc.content.length} chars`);
    }
    console.log(`\nTotal: ${documents.length} documents`);
    return;
  }

  // Index in batches
  let totalChunks = 0;
  let successDocs = 0;
  let failedDocs = 0;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    console.log(`Indexing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}...`);

    try {
      const response = await makeRequest(
        `${functionsUrl}/api/index/documents`,
        { documents: batch },
        authToken
      );

      if (response.status === 200) {
        console.log(`  ✓ ${response.data.message}`);
        if (response.data.results) {
          for (const result of response.data.results) {
            if (result.status === 'success') {
              totalChunks += result.chunks;
              successDocs++;
            } else {
              failedDocs++;
              console.log(`    ⚠ Failed: ${result.docId}`);
            }
          }
        }
      } else {
        console.log(`  ✗ Error: ${response.status} - ${JSON.stringify(response.data)}`);
        failedDocs += batch.length;
      }
    } catch (error) {
      console.log(`  ✗ Request failed: ${error.message}`);
      failedDocs += batch.length;
    }

    // Wait between batches to avoid rate limits
    if (i + batchSize < documents.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                     Indexing Complete!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Documents indexed: ${successDocs}/${documents.length}`);
  console.log(`Total chunks:      ${totalChunks}`);
  if (failedDocs > 0) {
    console.log(`Failed:            ${failedDocs}`);
  }
  console.log('');
}

// Run
indexDocs().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
