// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Script to inject hashed CSS filename into header_css_libs.html.
 */

'use strict';

const fs = require('fs');
const path = require('path');

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

var findHashedStylesFile = function () {
  try {
    var files = fs.readdirSync(DIST_DIR);
    var stylesFiles = files.filter(file =>
      /^styles\.[a-f0-9]+\.css$/i.test(file)
    );

    if (stylesFiles.length === 0) {
      throw new Error(
        `No hashed styles.*.css file found in ${DIST_DIR}. ` +
        'Make sure the Angular production build has completed successfully.'
      );
    }

    if (stylesFiles.length > 1) {
      console.warn(
        `Warning: Multiple styles files found: ${stylesFiles.join(', ')}. ` +
        `Using the first one: ${stylesFiles[0]}`
      );
    }

    return stylesFiles[0];
  } catch (error) {
    console.error(`Error reading directory ${DIST_DIR}:`, error.message);
    process.exit(1);
  }
};

var updateHeaderCssLibs = function (hashedFilename, filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File ${filePath} does not exist, skipping.`);
      return;
    }

    var content = fs.readFileSync(filePath, 'utf-8');
    var stylesCssPattern = /href="\/dist\/oppia-angular-prod\/styles(\.[a-f0-9]+)?\.css"/i;
    var newHref = `href="/dist/oppia-angular-prod/${hashedFilename}"`;

    if (!content.match(stylesCssPattern)) {
      console.warn(
        `Warning: Could not find styles.css reference in ${filePath}. ` +
        'The file may need manual updating.'
      );
      return;
    }

    var updatedContent = content.replace(stylesCssPattern, newHref);

    if (content === updatedContent) {
      console.log(`No changes needed in ${filePath} (already up to date).`);
      return;
    }

    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    console.log(`Successfully updated ${filePath} with ${hashedFilename}.`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    process.exit(1);
  }
};

var main = function () {
  console.log('Injecting hashed CSS filename into header_css_libs.html.');

  var hashedFilename = findHashedStylesFile();
  console.log(`Found hashed CSS file: ${hashedFilename}`);

  updateHeaderCssLibs(hashedFilename, HEADER_CSS_LIBS_PATH);
  updateHeaderCssLibs(hashedFilename, BACKEND_PROD_HEADER_CSS_LIBS_PATH);

  console.log('CSS hash injection complete.');
};

if (require.main === module) {
  main();
}

module.exports = {findHashedStylesFile, updateHeaderCssLibs};
