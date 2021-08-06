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
 * @fileoverview Directive for the PencilCodeEditor short response.
 */

describe('oppiaShortResponsePencilCodeEditor', function() {
  let ctrl = null;
  let directive = null;

  let mockHtmlEscaperService = {
    escapedJsonToObj: function(answer) {
      return answer;
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('HtmlEscaperService', mockHtmlEscaperService);

    $provide.value('$attrs', {
      answer: {
        code: '# Add the initial code snippet here.'
      }
    });
  }));
  beforeEach(angular.mock.inject(function($injector) {
    directive = $injector.get('oppiaShortResponsePencilCodeEditorDirective')[0];
    ctrl = $injector.instantiate(directive.controller);
  }));

  it('should initialise the component when submits answer', function() {
    ctrl.$onInit();
    expect(ctrl.answerCode).toEqual('# Add the initial code snippet here.');
  });
});
