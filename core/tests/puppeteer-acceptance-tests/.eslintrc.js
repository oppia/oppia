// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview File configuring eslint checks to ignore console statements
 * in the puppeteer-acceptance-tests directory.
 */

module.exports = {
  rules: {
    'no-console': 'off',
  },
};

/** We need to ignore the eslint checks for the console statements in our 
 * Acceptance Tests because we use console statements to log the progress or
 * feedback of the tests.
 */
