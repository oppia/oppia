#!/usr/bin/env node

/**
 * @fileoverview Script to inject the hashed CSS filename into header_css_libs.html.
 *
 * Angular CLI generates CSS files with hashes in production builds (e.g., styles.abc123.css).
 * This script:
 * 1. Scans the dist/oppia-angular-prod/ directory for the hashed styles.*.css file
 * 2. Updates core/templates/pages/header_css_libs.html with the correct hashed filename
 * 3. Updates backend_prod_files/templates/pages/header_css_libs.html if it exists
 *
 * This script should be run automatically after Angular production builds.
 */

const fs = require('fs');
const path = require('path');

// Configuration.
const DIST_DIR = path.join(__dirname, '..', 'dist', 'oppia-angular-prod');
const HEADER_CSS_LIBS_PATH = path.join(
  __dirname,
  '..',
  'core',
  'templates',
  'pages',
  'header_css_libs.html'
);
const BACKEND_PROD_HEADER_CSS_LIBS_PATH = path.join(
  __dirname,
  '..',
  'backend_prod_files',
  'templates',
  'pages',
  'header_css_libs.html'
);

/**
 * Find the hashed styles CSS file in the dist directory.
 * @returns {string} The filename of the hashed styles CSS file.
 */
// eslint-disable-next-line func-style
function findHashedStylesFile() {
  try {
    const files = fs.readdirSync(DIST_DIR);
    const stylesFiles = files.filter((file) =>
      file.match(/^styles\.[a-z0-9]+\.css$/)
    );

    if (stylesFiles.length === 0) {
      throw new Error(
        `No hashed styles.*.css file found in ${DIST_DIR}. ` +
          'Make sure the Angular production build has completed successfully.'
      );
    }

    if (stylesFiles.length > 1) {
      // eslint-disable-next-line no-console
      console.warn(
        `Warning: Multiple styles files found: ${stylesFiles.join(', ')}. ` +
          `Using the first one: ${stylesFiles[0]}`
      );
    }

    return stylesFiles[0];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error reading directory ${DIST_DIR}:`, error.message);
    process.exit(1);
  }
}

/**
 * Update the header_css_libs.html file with the hashed CSS filename.
 * @param {string} hashedFilename The hashed CSS filename to inject.
 * @param {string} filePath The path to the header_css_libs.html file to update.
 */
// eslint-disable-next-line func-style
function updateHeaderCssLibs(hashedFilename, filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      // eslint-disable-next-line no-console
      console.log(`File ${filePath} does not exist, skipping.`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace the hardcoded styles.css with the hashed version.
    // Match both possible patterns:
    // 1. href="/dist/oppia-angular-prod/styles.css"
    // 2. href="/dist/oppia-angular-prod/styles.[hash].css"
    // The hash can contain any alphanumeric characters.
    const stylesCssPattern =
      /href="\/dist\/oppia-angular-prod\/styles(\.[a-z0-9]+)?\.css"/;
    const newHref = `href="/dist/oppia-angular-prod/${hashedFilename}"`;

    if (!content.match(stylesCssPattern)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Warning: Could not find styles.css reference in ${filePath}. ` +
          'The file may need manual updating.'
      );
      return;
    }

    const updatedContent = content.replace(stylesCssPattern, newHref);

    if (content === updatedContent) {
      // eslint-disable-next-line no-console
      console.log(`No changes needed in ${filePath} (already up to date).`);
      return;
    }

    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    // eslint-disable-next-line no-console
    console.log(`✓ Successfully updated ${filePath} with ${hashedFilename}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error updating ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Main execution function.
 */
// eslint-disable-next-line func-style
function main() {
  // eslint-disable-next-line no-console
  console.log('=== Injecting hashed CSS filename into header_css_libs.html ===');

  // Step 1: Find the hashed styles file.
  const hashedFilename = findHashedStylesFile();
  // eslint-disable-next-line no-console
  console.log(`Found hashed CSS file: ${hashedFilename}`);

  // Step 2: Update the source header_css_libs.html file.
  updateHeaderCssLibs(hashedFilename, HEADER_CSS_LIBS_PATH);

  // Step 3: Update the backend prod header_css_libs.html file if it exists.
  updateHeaderCssLibs(hashedFilename, BACKEND_PROD_HEADER_CSS_LIBS_PATH);

  // eslint-disable-next-line no-console
  console.log('=== CSS hash injection complete ===');
}

// Run the script if executed directly.
if (require.main === module) {
  main();
}

module.exports = {findHashedStylesFile, updateHeaderCssLibs};
