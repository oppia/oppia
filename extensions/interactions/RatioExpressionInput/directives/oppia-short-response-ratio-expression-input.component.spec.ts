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
 * @fileoverview Unit tests for the RatioExpressionInput response
 * component.
 */

import { Ratio } from 'domain/objects/ratio.model';

require(
  'interactions/RatioExpressionInput/directives/' +
  'oppia-short-response-ratio-expression-input.component.ts');

describe('RatioExpressionInputShortResponse', function() {
  let ctrl = null;

  let mockHtmlEscaperService = {
    escapedJsonToObj: function(answer) {
      return answer;
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('Ratio', Ratio);
    $provide.value('HtmlEscaperService', mockHtmlEscaperService);

    $provide.value('$attrs', {
      answer: [1, 2, 3]
    });
  }));
  beforeEach(angular.mock.inject(function($componentController) {
    ctrl = $componentController('oppiaShortResponseRatioExpressionInput');
  }));

  it('should init the component', function() {
    ctrl.$onInit();
    expect(ctrl.answer).toEqual('1:2:3');
  });
});
