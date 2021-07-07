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
 * @fileoverview Invalid syntax .ts file, used by scripts/linters/
 * js_ts_linter_test.py. This file is using toThrow which is not allowed.
 */

describe('Build questions', function() {
  it('should forbid the use of reserved words', function() {
    expect(function() {
      logicProofTeacher.buildQuestion('we\u2227you', 'p=q',
        logicProofData.BASE_VOCABULARY);
    }).toThrow( // Use fo toThrow is not allowed.
      {
        message: (
          'The name \'we\' is reserved for vocabulary and so cannot ' +
          'be used here.')
      }
    );
  });
});
