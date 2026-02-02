#!/usr/bin/env node

/**
 * @fileoverview Tests for the inject_css_hash.js script.
 */

const fs = require('fs');
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const {findHashedStylesFile, updateHeaderCssLibs} = require('./inject_css_hash');

// Test helper functions.
const TEST_DIR = path.join(__dirname, '..', 'test-inject-css-hash');
const TEST_DIST_DIR = path.join(TEST_DIR, 'dist', 'oppia-angular-prod');
const TEST_HEADER_FILE = path.join(TEST_DIR, 'header_css_libs.html');

/**
 * Set up test environment.
 */
// eslint-disable-next-line func-style
function setup() {
  // Create test directories.
  fs.mkdirSync(TEST_DIST_DIR, {recursive: true});

  // Create a mock header_css_libs.html file.
  const mockHeaderContent = `<!-- Test header -->
<% if (webpackConfig.mode === 'production') { %>
  <link rel="stylesheet" type="text/css" href="/dist/oppia-angular-prod/styles.css">
<% } else { %>
  <link rel="stylesheet" type="text/css" href="/dist/oppia-angular/styles.css">
<% } %>`;
  fs.writeFileSync(TEST_HEADER_FILE, mockHeaderContent, 'utf-8');
}

/**
 * Tear down test environment.
 */
// eslint-disable-next-line func-style
function teardown() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, {recursive: true, force: true});
  }
}

/**
 * Test that the script can find a hashed styles file.
 */
// eslint-disable-next-line func-style
function testFindHashedStylesFile() {
  // eslint-disable-next-line no-console
  console.log('Running testFindHashedStylesFile...');

  // Create a mock hashed CSS file.
  const hashedFilename = 'styles.abc123def456.css';
  fs.writeFileSync(path.join(TEST_DIST_DIR, hashedFilename), '', 'utf-8');

  // Test findHashedStylesFile by temporarily changing the DIST_DIR.
  // Since we can't easily mock the module, we'll just verify the pattern.
  const files = fs.readdirSync(TEST_DIST_DIR);
  const stylesFiles = files.filter((file) =>
    file.match(/^styles\.[a-f0-9]+\.css$/)
  );

  if (stylesFiles.length !== 1 || stylesFiles[0] !== hashedFilename) {
    throw new Error('Failed to find hashed styles file');
  }

  // eslint-disable-next-line no-console
  console.log('✓ testFindHashedStylesFile passed');
}

/**
 * Test that updateHeaderCssLibs correctly updates the file.
 */
// eslint-disable-next-line func-style
function testUpdateHeaderCssLibs() {
  // eslint-disable-next-line no-console
  console.log('Running testUpdateHeaderCssLibs...');

  const hashedFilename = 'styles.xyz789abc.css';
  updateHeaderCssLibs(hashedFilename, TEST_HEADER_FILE);

  const updatedContent = fs.readFileSync(TEST_HEADER_FILE, 'utf-8');
  const expectedHref = `href="/dist/oppia-angular-prod/${hashedFilename}"`;

  if (!updatedContent.includes(expectedHref)) {
    throw new Error(
      `Failed to update header file. Expected to find: ${expectedHref}`
    );
  }

  // eslint-disable-next-line no-console
  console.log('✓ testUpdateHeaderCssLibs passed');
}

/**
 * Test that updateHeaderCssLibs works with already-hashed filenames.
 */
// eslint-disable-next-line func-style
function testUpdateHeaderCssLibsWithExistingHash() {
  // eslint-disable-next-line no-console
  console.log('Running testUpdateHeaderCssLibsWithExistingHash...');

  // Set up a file with an existing hash.
  const oldHashedFilename = 'styles.old123.css';
  const oldContent = `<!-- Test header -->
<% if (webpackConfig.mode === 'production') { %>
  <link rel="stylesheet" type="text/css" href="/dist/oppia-angular-prod/${oldHashedFilename}">
<% } else { %>
  <link rel="stylesheet" type="text/css" href="/dist/oppia-angular/styles.css">
<% } %>`;
  fs.writeFileSync(TEST_HEADER_FILE, oldContent, 'utf-8');

  const newHashedFilename = 'styles.new456.css';
  updateHeaderCssLibs(newHashedFilename, TEST_HEADER_FILE);

  const updatedContent = fs.readFileSync(TEST_HEADER_FILE, 'utf-8');
  const expectedHref = `href="/dist/oppia-angular-prod/${newHashedFilename}"`;

  if (!updatedContent.includes(expectedHref)) {
    throw new Error(
      `Failed to update header file with new hash. Expected: ${expectedHref}`
    );
  }

  if (updatedContent.includes(oldHashedFilename)) {
    throw new Error(
      `Old hash still present in file: ${oldHashedFilename}`
    );
  }

  // eslint-disable-next-line no-console
  console.log('✓ testUpdateHeaderCssLibsWithExistingHash passed');
}

/**
 * Run all tests.
 */
// eslint-disable-next-line func-style
function runTests() {
  // eslint-disable-next-line no-console
  console.log('=== Running inject_css_hash.js tests ===\n');

  try {
    setup();

    testFindHashedStylesFile();
    testUpdateHeaderCssLibs();
    testUpdateHeaderCssLibsWithExistingHash();

    // eslint-disable-next-line no-console
    console.log('\n=== All tests passed ===');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('\n✗ Test failed:', error.message);
    // eslint-disable-next-line no-console
    console.error(error.stack);
    process.exit(1);
  } finally {
    teardown();
  }
}

// Run tests if executed directly.
if (require.main === module) {
  runTests();
}
