// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for multiple choice input rules.
 */

describe('Multiple choice input rules service', function() {
  beforeEach(module('oppia'));

  var mcirs = null;
  beforeEach(inject(function($injector) {
    mcirs = $injector.get('multipleChoiceInputRulesService');
  }));

  it('should have a correct \'equals\' rule', function() {
    expect(mcirs.Equals(3, {
      x: 3
    })).toBe(true);
    expect(mcirs.Equals(3, {
      x: 4
    })).toBe(false);
  });
});
