// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Script to regenerate all math SVGs.
 */

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

const log = {
  info: (...args) => process.stdout.write(args.join(' ') + '\n'),
  warn: (...args) => process.stderr.write('WARNING: ' + args.join(' ') + '\n'),
  error: (...args) => process.stderr.write('ERROR: ' + args.join(' ') + '\n'),
};

/**
 * Initializes a Puppeteer page with MathJax 2.x loaded and configured.
 * Call this once. After this, call renderLatexToSvg() as many times as needed.
 *
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 * @returns {Promise<void>}
 */
const setupPage = async function (page) {
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

  await page.waitForFunction(
    () =>
      window.MathJax &&
      window.MathJax.Hub &&
      typeof window.MathJax.Hub.Queue === 'function',
    {timeout: 30000}
  );

  await page.evaluate(() => {
    return new Promise(resolve => {
      window.MathJax.Hub.Register.StartupHook('End', resolve);
      if (window.MathJax.isReady) {
        resolve();
      }
    });
  });

  log.info('MathJax loaded and ready.\n');
};

/**
 * Renders a single LaTeX string to SVG using the already-loaded MathJax.
 * Does not reload MathJax — just calls Hub.Queue on a new element.
 *
 * @param {import('puppeteer').Page} page - The Puppeteer page instance.
 * @param {string} latex - The LaTeX string to render.
 * @returns {Promise<string>} The SVG string.
 */
const renderLatexToSvg = async function (page, latex) {
  return await page.evaluate(async latex => {
    const container = document.createElement('div');
    container.style.visibility = 'hidden';
    container.style.position = 'absolute';
    // \( ... \) is MathJax 2.x inline math delimiter.
    container.insertAdjacentHTML('beforeend', '\\(' + latex + '\\)');
    document.body.appendChild(container);

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

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      document.body.removeChild(container);
      throw new Error('No SVG element found after typesetting');
    }

    const svgString = svgElement.outerHTML;
    document.body.removeChild(container);
    return svgString;
  }, latex);
};

/**
 * Extracts height, width, and vertical padding dimensions from an SVG string.
 *
 * @param {string} svgString - The SVG string to extract dimensions from.
 * @returns {{height: string, width: string, verticalPadding: string}}
 */
const extractDimensions = function (svgString) {
  const dimensions = {height: '', width: '', verticalPadding: '0'};

  const heightMatch = svgString.match(/height="([^"]+)"/);
  if (heightMatch) {
    const n = heightMatch[1].match(/\d+\.?\d*/);
    if (n) {
      dimensions.height = n[0].replace('.', 'd');
    }
  }

  const widthMatch = svgString.match(/width="([^"]+)"/);
  if (widthMatch) {
    const n = widthMatch[1].match(/\d+\.?\d*/);
    if (n) {
      dimensions.width = n[0].replace('.', 'd');
    }
  }

  // Extract vertical-align from style="vertical-align: -0.241ex;".
  const styleMatch = svgString.match(/style="([^"]+)"/);
  if (styleMatch) {
    const n = styleMatch[1].match(/\d+\.?\d*/);
    if (n) {
      dimensions.verticalPadding = n[0].replace('.', 'd');
    }
  }

  return dimensions;
};

/**
 * Builds a deterministic SVG filename from the LaTeX string and dimensions.
 * Uses an MD5 hash of the LaTeX string to ensure uniqueness.
 *
 * @param {string} latex - The LaTeX string.
 * @param {{height: string, width: string, verticalPadding: string}} dims
 * @returns {string} The filename.
 */
const buildFilename = function (latex, dims) {
  const hash = crypto
    .createHash('md5')
    .update(latex)
    .digest('hex')
    .slice(0, 10);

  return (
    'mathImg_' +
    hash +
    '_height_' +
    dims.height +
    '_width_' +
    dims.width +
    '_vertical_' +
    dims.verticalPadding +
    '.svg'
  );
};

/**
 * Cleans an SVG string to match Oppia's cleanMathExpressionSvgString() output.
 *
 * @param {string} svgString - The raw SVG string.
 * @returns {string} The cleaned SVG string.
 */
const cleanSvg = function (svgString) {
  return svgString
    .replace(/xmlns:xlink="[^"]*"/g, '')
    .replace(/\srole="[^"]*"/g, '')
    .replace(/\saria-hidden="[^"]*"/g, '')
    .replace(/\sdata-[\w-]+=(?:"[^"]*"|'[^']*')/g, '')
    .replace(/<svg(?![^>]*xmlns=)/, '<svg xmlns="http://www.w3.org/2000/svg"');
};

/**
 * Extracts all math tag raw_latex and svg_filename values from an HTML string.
 *
 * @param {string} htmlString - The HTML string to extract math tags from.
 * @returns {Array<{rawLatex: string, svgFilename: string}>}
 */
const extractMathTagsFromHtml = function (htmlString) {
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
      log.warn('Could not parse math tag:', match[1].slice(0, 60), e.message);
    }
  }
  return results;
};

/**
 * Recursively collects all HTML strings containing math tags from an object.
 *
 * @param {*} obj - The object to walk.
 * @param {string[]} found - Accumulator for found HTML strings.
 * @returns {string[]} All HTML strings containing math tags.
 */
const collectHtmlStrings = function (obj, found = []) {
  if (typeof obj === 'string') {
    if (obj.includes('oppia-noninteractive-math')) {
      found.push(obj);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      collectHtmlStrings(item, found);
    }
  } else if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      collectHtmlStrings(value, found);
    }
  }
  return found;
};

/**
 * Main entry point. Iterates over all explorations, renders math SVGs, and
 * writes svg_mapping.json.
 *
 * @returns {Promise<void>}
 */
const main = async function () {
  if (!fs.existsSync(EXPLORATIONS_DIR)) {
    log.error('Explorations directory not found:', EXPLORATIONS_DIR);
    process.exit(1);
  }

  log.info('Launching headless Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  page.on('console', () => {});
  page.on('pageerror', () => {});

  await setupPage(page);

  const mapping = [];
  const seen = new Set();

  const explorationIds = fs
    .readdirSync(EXPLORATIONS_DIR)
    .filter(name =>
      fs.statSync(path.join(EXPLORATIONS_DIR, name)).isDirectory()
    );

  log.info('Found ' + explorationIds.length + ' explorations.\n');

  for (const explorationId of explorationIds) {
    const explorationDir = path.join(EXPLORATIONS_DIR, explorationId);
    const yamlPath = path.join(explorationDir, explorationId + '.yaml');
    const imageDir = path.join(explorationDir, 'assets', 'image');

    if (!fs.existsSync(yamlPath)) {
      continue;
    }

    let explorationData;
    try {
      explorationData = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
    } catch (e) {
      log.error('Could not parse YAML for "' + explorationId + '":', e.message);
      continue;
    }

    const htmlStrings = collectHtmlStrings(explorationData);
    if (htmlStrings.length === 0) {
      continue;
    }

    const mathTags = [];
    for (const html of htmlStrings) {
      mathTags.push(...extractMathTagsFromHtml(html));
    }
    if (mathTags.length === 0) {
      continue;
    }

    log.info(
      'Processing "' + explorationId + '": ' + mathTags.length + ' math tag(s)'
    );

    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, {recursive: true});
    }

    for (const {rawLatex, svgFilename: oldFilename} of mathTags) {
      const dedupeKey = explorationId + '::' + rawLatex;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      try {
        const rawSvg = await renderLatexToSvg(page, rawLatex);
        const cleanedSvg = cleanSvg(rawSvg);
        const dims = extractDimensions(cleanedSvg);

        if (!dims.height || !dims.width) {
          log.warn('Could not extract dimensions for: ' + rawLatex);
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

        log.info('  Done: ' + rawLatex);
        log.info('    -> ' + newFilename);
      } catch (e) {
        log.error('Could not process LaTeX "' + rawLatex + '": ' + e.message);
      }
    }
  }

  await browser.close();

  fs.writeFileSync(
    MAPPING_OUTPUT_PATH,
    JSON.stringify(mapping, null, 2),
    'utf8'
  );

  log.info('\nDone.');
  log.info('Generated ' + mapping.length + ' new SVG(s).');
  log.info('Mapping written to: ' + MAPPING_OUTPUT_PATH);
};

main().catch(err => {
  log.error('Fatal error:', err);
  process.exit(1);
});
