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
 * @fileoverview Webpack plugin to inject Angular-generated hashed CSS filename
 * into HtmlWebpackPlugin templates.
 *
 * This plugin scans the Angular CLI output directory for hashed CSS files
 * (e.g., styles.abc123.css) and makes them available to webpack templates
 * via templateParameters, eliminating the need for post-build injection scripts.
 */

'use strict';

const fs = require('fs');
const path = require('path');

class AngularStylesHashPlugin {
  constructor(options = {}) {
    this.angularDistDir = options.angularDistDir || 'dist/oppia-angular-prod';
    this.baseHref = options.baseHref || '/dist/oppia-angular-prod/';
  }

  findHashedStylesFile() {
    const distPath = path.resolve(this.angularDistDir);

    // Check if the Angular dist directory exists.
    if (!fs.existsSync(distPath)) {
      console.warn(
        `[AngularStylesHashPlugin] Angular dist directory not found: ${distPath}`
      );
      return null;
    }

    try {
      const files = fs.readdirSync(distPath);
      const stylesFiles = files.filter(file =>
        /^styles\.[a-f0-9]+\.css$/i.test(file)
      );

      if (stylesFiles.length === 0) {
        console.warn(
          '[AngularStylesHashPlugin] No hashed styles.*.css file found in ' +
            `${distPath}. Angular build may not have completed yet.`
        );
        return null;
      }

      if (stylesFiles.length > 1) {
        console.warn(
          `[AngularStylesHashPlugin] Multiple styles files found: ${stylesFiles.join(', ')}. ` +
            `Using the first one: ${stylesFiles[0]}`
        );
      }

      return stylesFiles[0];
    } catch (error) {
      console.error(
        `[AngularStylesHashPlugin] Error reading directory ${distPath}:`,
        error.message
      );
      return null;
    }
  }

  updateHashesJson(hashedFilename) {
    try {
      const hashesJsonPath = path.resolve('assets/hashes.json');

      // Extract the hash from the filename (e.g., styles.6045ea39e11b1ef9e492.css -> 6045ea39e11b1ef9e492).
      const hashMatch = hashedFilename.match(/^styles\.([a-f0-9]+)\.css$/i);
      if (!hashMatch) {
        console.warn(
          `[AngularStylesHashPlugin] Could not extract hash from filename ${hashedFilename}. ` +
            'Skipping hashes.json update.'
        );
        return;
      }

      const hash = hashMatch[1];
      let hashesData = {};

      // Read existing hashes.json if it exists.
      if (fs.existsSync(hashesJsonPath)) {
        const existingContent = fs.readFileSync(hashesJsonPath, 'utf-8');
        try {
          hashesData = JSON.parse(existingContent);
        } catch (parseError) {
          console.warn(
            '[AngularStylesHashPlugin] Could not parse existing hashes.json. Creating new file.'
          );
          hashesData = {};
        }
      }

      // Add/update the CSS file hash.
      hashesData['/dist/oppia-angular-prod/styles.css'] = hash;

      // Write back to hashes.json.
      fs.writeFileSync(
        hashesJsonPath,
        JSON.stringify(hashesData, null, 2),
        'utf-8'
      );
      // eslint-disable-next-line no-console
      console.log(
        `[AngularStylesHashPlugin] Updated assets/hashes.json with hash ${hash} for styles.css.`
      );
    } catch (error) {
      console.error(
        '[AngularStylesHashPlugin] Error updating hashes.json:',
        error.message
      );
    }
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('AngularStylesHashPlugin', compilation => {
      // Hook into HtmlWebpackPlugin processing.
      const HtmlWebpackPlugin = require('html-webpack-plugin');
      const hooks = HtmlWebpackPlugin.getHooks(compilation);

      hooks.beforeEmit.tapAsync(
        'AngularStylesHashPlugin',
        (data, callback) => {
          const hashedFilename = this.findHashedStylesFile();

          if (hashedFilename) {
            const fullPath = this.baseHref + hashedFilename;
            // eslint-disable-next-line no-console
            console.log(
              `[AngularStylesHashPlugin] Found Angular styles: ${hashedFilename}`
            );

            // Replace styles.css references with hashed version in the template.
            data.html = data.html.replace(
              new RegExp(
                `${this.baseHref}styles\\.css(?!\\.[a-f0-9])`,
                'g'
              ),
              fullPath
            );

            // Update hashes.json for frontend use.
            this.updateHashesJson(hashedFilename);
          } else {
            console.warn(
              '[AngularStylesHashPlugin] Could not find hashed styles file. ' +
                'Using fallback styles.css'
            );
          }

          callback(null, data);
        }
      );
    });
  }
}

module.exports = AngularStylesHashPlugin;
