/**
 * bulk_generate_svgs.js
 *
 * Regenerates all math SVGs using headless Chrome + MathJax 2.x with
 * STIX-Web font — exactly matching Oppia's frontend MathJax config.
 *
 * Usage (from Oppia root):
 *   cd scripts/svg_generation
 *   npm install
 *   node bulk_generate_svgs.js
 *
 * To use a custom Chrome binary:
 *   CHROME_PATH=/path/to/chrome node bulk_generate_svgs.js
 **/

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const puppeteer = require('puppeteer');

const OPPIA_ROOT = path.resolve(__dirname, '..', '..');
const EXPLORATIONS_DIR = path.join(OPPIA_ROOT, 'data', 'explorations');
const MAPPING_OUTPUT_PATH = path.join(OPPIA_ROOT, 'svg_mapping.json');

const MATHJAX_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js' +
  '?config=TeX-AMS_SVG';

/**
 * Initializes a Puppeteer page with MathJax 2.x loaded and configured.
 * Call this once. After this, call renderLatexToSvg() as many times as needed.
 */
async function setupPage(page) {
  // Inject config as inline script in page HTML, before MathJax loads.
  await page.setContent(`
    <html>
    <head>
      <script>
        window.MathJax = {
          skipStartupTypeset: true,
          messageStyle: 'none',
          jax: ['input/TeX', 'output/SVG'],
          extensions: ['tex2jax.js', 'MathMenu.js', 'MathZoom.js'],
          showMathMenu: false,
          showProcessingMessages: false,
          SVG: {
            useGlobalCache: false,
            useFontCache: false,
            linebreaks: { automatic: true, width: '500px' },
            scale: 91,
            font: 'STIX-Web',
            showMathMenu: false,
          },
          TeX: {
            extensions: ['AMSmath.js', 'AMSsymbols.js', 'autoload-all.js'],
          },
        };
      </script>
      <script src="${MATHJAX_CDN}"></script>
    </head>
    <body></body>
    </html>
  `);

  // Wait until MathJax.Hub exists and is ready.
  await page.waitForFunction(
    () =>
      window.MathJax &&
      window.MathJax.Hub &&
      typeof window.MathJax.Hub.Queue === 'function',
    {timeout: 30000}
  );

  // Wait for MathJax startup to fully complete.
  await page.evaluate(() => {
    return new Promise(resolve => {
      window.MathJax.Hub.Register.StartupHook('End', resolve);
      if (window.MathJax.isReady) resolve();
    });
  });

  console.log('MathJax loaded and ready.\n');
}
/**
 * Renders a single LaTeX string to SVG using the already-loaded MathJax.
 * Does NOT reload MathJax — just calls Hub.Queue on a new element.
 *
 * @param {import('puppeteer').Page} page
 * @param {string} latex
 * @returns {Promise<string>} SVG string
 */
async function renderLatexToSvg(page, latex) {
  return await page.evaluate(async latex => {
    // Create a hidden container with the LaTeX.
    const container = document.createElement('div');
    container.style.visibility = 'hidden';
    container.style.position = 'absolute';
    // \( ... \) is MathJax 2.x inline math delimiter.
    container.innerHTML = '\\(' + latex + '\\)';
    document.body.appendChild(container);

    // Typeset just this element using the already-loaded MathJax.
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('MathJax typeset timed out')),
        15000
      );
      window.MathJax.Hub.Queue(
        ['Typeset', window.MathJax.Hub, container],
        () => {
          clearTimeout(timeout);
          resolve();
        }
      );
    });

    // Extract the SVG MathJax generated inside the container.
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      document.body.removeChild(container);
      throw new Error('No SVG element found after typesetting');
    }

    const svgString = svgElement.outerHTML;
    document.body.removeChild(container);
    return svgString;
  }, latex);
}

function extractDimensions(svgString) {
  const dimensions = {height: '', width: '', verticalPadding: '0'};

  const heightMatch = svgString.match(/height="([^"]+)"/);
  if (heightMatch) {
    const n = heightMatch[1].match(/\d+\.?\d*/);
    if (n) dimensions.height = n[0].replace('.', 'd');
  }

  const widthMatch = svgString.match(/width="([^"]+)"/);
  if (widthMatch) {
    const n = widthMatch[1].match(/\d+\.?\d*/);
    if (n) dimensions.width = n[0].replace('.', 'd');
  }

  // vertical-align from style="vertical-align: -0.241ex;"
  const styleMatch = svgString.match(/style="([^"]+)"/);
  if (styleMatch) {
    const n = styleMatch[1].match(/\d+\.?\d*/);
    if (n) dimensions.verticalPadding = n[0].replace('.', 'd');
  }

  return dimensions;
}

function buildFilename(latex, dims) {
  const hash = crypto
    .createHash('md5')
    .update(latex)
    .digest('hex')
    .slice(0, 10);

  return (
    `mathImg_${hash}` +
    `_height_${dims.height}` +
    `_width_${dims.width}` +
    `_vertical_${dims.verticalPadding}.svg`
  );
}

function cleanSvg(svgString) {
  return svgString
    .replace(/xmlns:xlink="[^"]*"/g, '')
    .replace(/\srole="[^"]*"/g, '')
    .replace(/\saria-hidden="[^"]*"/g, '')
    .replace(/\sdata-[\w-]+=(?:"[^"]*"|'[^']*')/g, '')
    .replace(/<svg(?![^>]*xmlns=)/, '<svg xmlns="http://www.w3.org/2000/svg"');
}

function extractMathTagsFromHtml(htmlString) {
  const results = [];
  const attrRegex = /math_content-with-value="([^"]+)"/g;
  let match;

  while ((match = attrRegex.exec(htmlString)) !== null) {
    try {
      const unescaped = match[1]
        .replace(/&amp;quot;/g, '"')
        .replace(/&quot;/g, '"')
        .replace(/&amp;amp;/g, '&')
        .replace(/&amp;/g, '&');

      const mathContent = JSON.parse(unescaped);
      if (
        mathContent.raw_latex !== undefined &&
        mathContent.svg_filename !== undefined
      ) {
        results.push({
          rawLatex: mathContent.raw_latex,
          svgFilename: mathContent.svg_filename,
        });
      }
    } catch (e) {
      console.warn(
        '  Could not parse math tag:',
        match[1].slice(0, 60),
        '→',
        e.message
      );
    }
  }
  return results;
}

function collectHtmlStrings(obj, found = []) {
  if (typeof obj === 'string') {
    if (obj.includes('oppia-noninteractive-math')) found.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) collectHtmlStrings(item, found);
  } else if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) collectHtmlStrings(value, found);
  }
  return found;
}

async function main() {
  if (!fs.existsSync(EXPLORATIONS_DIR)) {
    console.error('Explorations directory not found:', EXPLORATIONS_DIR);
    process.exit(1);
  }

  console.log('Launching headless Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Suppress noisy browser console output.
  page.on('console', () => {});
  page.on('pageerror', () => {});

  // Load MathJax ONCE with correct config.
  await setupPage(page);

  const mapping = [];
  const seen = new Set();

  const explorationIds = fs
    .readdirSync(EXPLORATIONS_DIR)
    .filter(name =>
      fs.statSync(path.join(EXPLORATIONS_DIR, name)).isDirectory()
    );

  console.log(`Found ${explorationIds.length} explorations.\n`);

  for (const explorationId of explorationIds) {
    const explorationDir = path.join(EXPLORATIONS_DIR, explorationId);
    const yamlPath = path.join(explorationDir, `${explorationId}.yaml`);
    const imageDir = path.join(explorationDir, 'assets', 'image');

    if (!fs.existsSync(yamlPath)) continue;

    let explorationData;
    try {
      explorationData = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
    } catch (e) {
      console.error(
        `  ERROR: Could not parse YAML for "${explorationId}":`,
        e.message
      );
      continue;
    }

    const htmlStrings = collectHtmlStrings(explorationData);
    if (htmlStrings.length === 0) continue;

    const mathTags = [];
    for (const html of htmlStrings) {
      mathTags.push(...extractMathTagsFromHtml(html));
    }
    if (mathTags.length === 0) continue;

    console.log(
      `Processing "${explorationId}": ${mathTags.length} math tag(s)`
    );

    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, {recursive: true});
    }

    for (const {rawLatex, svgFilename: oldFilename} of mathTags) {
      const dedupeKey = `${explorationId}::${rawLatex}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      try {
        const rawSvg = await renderLatexToSvg(page, rawLatex);
        const cleanedSvg = cleanSvg(rawSvg);
        const dims = extractDimensions(cleanedSvg);

        if (!dims.height || !dims.width) {
          console.warn(
            `  WARNING: Could not extract dimensions for: ${rawLatex}`
          );
          continue;
        }

        const newFilename = buildFilename(rawLatex, dims);
        fs.writeFileSync(path.join(imageDir, newFilename), cleanedSvg, 'utf8');

        mapping.push({
          exploration_id: explorationId,
          old_filename: oldFilename,
          new_filename: newFilename,
          raw_latex: rawLatex,
        });

        console.log(`  ✓ ${rawLatex}`);
        console.log(`    → ${newFilename}`);
      } catch (e) {
        console.error(`  ERROR processing LaTeX "${rawLatex}": ${e.message}`);
      }
    }
  }

  await browser.close();

  fs.writeFileSync(
    MAPPING_OUTPUT_PATH,
    JSON.stringify(mapping, null, 2),
    'utf8'
  );

  console.log(`\nDone.`);
  console.log(`Generated ${mapping.length} new SVG(s).`);
  console.log(`Mapping written to: ${MAPPING_OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
