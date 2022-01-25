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
 * @fileoverview Unit tests for the MusicNotesInput short response.
 */

describe('oppiaShortResponseMusicNotesInput', function() {
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
  }));

  describe('when user provides an answer', () => {
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('$attrs', {
        answer: [{
          readableNoteName: 'B4',
          noteDuration: {
            num: 1,
            den: 1
          }
        }]
      });
    }));

    beforeEach(angular.mock.inject(function($injector) {
      directive =
        $injector.get('oppiaShortResponseMusicNotesInputDirective')[0];
      ctrl = $injector.instantiate(directive.controller);
    }));

    it('should initialise the component when submits answer', function() {
      ctrl.$onInit();
      expect(ctrl.displayedAnswer).toEqual('B4');
    });
  });

  describe('when user does not provides an answer', () => {
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('$attrs', {
        answer: []
      });
    }));

    beforeEach(angular.mock.inject(function($componentController) {
      ctrl = $componentController('oppiaShortResponseMusicNotesInput');
    }));

    it('should initialise the component when submits answer', function() {
      ctrl.$onInit();
      expect(ctrl.displayedAnswer).toEqual('No answer given.');
    });
  });
});
