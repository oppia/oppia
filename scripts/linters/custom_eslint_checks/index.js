// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Indexes all custom eslint rules.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Reads a directory and imports all JavaScript modules found within it,
 * excluding 'index.js'.
 * @param {string} dirPath The path to the directory to index.
 * @returns {Object<string, Module>} An object where keys are filenames
 *   (minus .js) and values are the required modules.
 */
function requireIndex(dirPath) {
  const modules = {};
  const resolvedDir = path.resolve(dirPath);

  const files = fs.readdirSync(resolvedDir);

  for (const file of files) {
    // Only process JavaScript files that are not this index file itself.
    if (file.endsWith('.js') && file !== 'index.js') {
      const moduleName = path.basename(file, '.js');
      modules[moduleName] = require(path.join(resolvedDir, file));
    }
  }

  return modules;
}

// Import all rules in custom_eslint_checks/rules using the replacement function.
module.exports.rules = requireIndex(__dirname + '/rules');
