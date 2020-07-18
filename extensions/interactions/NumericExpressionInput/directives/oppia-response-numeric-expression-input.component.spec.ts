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
 * @fileoverview Unit tests for the NumericExpressionInput response component.
 */

require(
  'interactions/NumericExpressionInput/directives/' +
  'oppia-response-numeric-expression-input.component.ts');

describe('NumericExpressionInputResponse', function() {
  let ctrl = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$attrs', {
      answer: '&quot;answer&quot;',
    });
  }));
  beforeEach(angular.mock.inject(function($componentController) {
    ctrl = $componentController('oppiaResponseNumericExpressionInput');
  }));

  it('should correctly escape characters in the answer', function() {
    ctrl.$onInit();
    expect(ctrl.answer).toBe('answer');
  });
});
