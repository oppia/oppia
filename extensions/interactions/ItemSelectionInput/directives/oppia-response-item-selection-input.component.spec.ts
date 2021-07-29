// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the ItemSelectionInput response.
 */

describe('oppiaResponseItemSelectionInput', function() {
  let ctrl = null;

  let mockHtmlEscaperService = {
    escapedJsonToObj: function(answer) {
      return answer;
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('HtmlEscaperService', mockHtmlEscaperService);

    $provide.value('$attrs', {
      choices: [
        {
          _html: 'choice 1',
          _contentId: 'ca_choices_1'
        },
        {
          _html: 'choice 2',
          _contentId: 'ca_choices_2'
        },
        {
          _html: 'choice 3',
          _contentId: 'ca_choices_3'
        },
      ],
      answer: [
        'ca_choices_1'
      ]
    });
  }));
  beforeEach(angular.mock.inject(function($componentController) {
    ctrl = $componentController('oppiaResponseItemSelectionInput');
  }));

  it('should initialise the component when', () => {
    ctrl.$onInit();
    expect(ctrl.answer).toEqual(['choice 1']);
  });
});
