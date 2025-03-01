// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Custom Jest environment for enhanced test failure handling.
 *
 * This custom Jest environment extends NodeEnvironment to detect test failures
 * in real-time and trigger actions like capturing screenshots for debugging.
 */

const fs = require('fs');
const path = require('path');
const {showMessage} = require('./utilities/common/show-message');
const NodeEnvironment = require('jest-environment-node');

const CONFIG_FILE = path.resolve(__dirname, 'jest-runtime-config.json');

class CustomJestEnvironment extends NodeEnvironment {
  async handleTestEvent(event) {
    if (event.name === 'test_done' && event.test.errors.length > 0) {
      showMessage('Test failed: Capturing screenshots...');
      fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify({testFailureDetected: true})
      );
    }
  }
}

module.exports = CustomJestEnvironment;
