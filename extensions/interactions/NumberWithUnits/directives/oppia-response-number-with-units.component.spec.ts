// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the NumberWithUnits response.
 */

require(
  'interactions/NumberWithUnits/directives/' +
  'oppia-response-number-with-units.component.ts');
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('oppiaResponseNumberWithUnits', function() {
  let ctrl = null;

  let mockHtmlEscaperService = {
    escapedJsonToObj: function(answer) {
      return answer;
    }
  };

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('HtmlEscaperService', mockHtmlEscaperService);

    $provide.value('$attrs', {
      answer: {
        type: 'real',
        real: 24,
        fraction: {
          isNegative: false,
          wholeNumber: 0,
          numerator: 0,
          denominator: 1
        },
        units: [
          {
            unit: 'km',
            exponent: 1
          }
        ]
      }
    });
  }));
  beforeEach(angular.mock.inject(function($componentController) {
    ctrl = $componentController('oppiaResponseNumberWithUnits');
  }));

  it('should initialise the component when user submits the answer', () => {
    ctrl.$onInit();
    expect(ctrl.answer).toEqual('24 km');
  });
});
