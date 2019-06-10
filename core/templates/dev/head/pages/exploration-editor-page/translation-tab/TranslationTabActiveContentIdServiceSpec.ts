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
 * @fileoverview Unit test for the Translation tab active content id service.
 */

require(
  'pages/exploration_editor/translation_tab/' +
  'TranslationTabActiveContentIdService.ts'
);

describe('Translation tab active content id service', function() {
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('StateRecordedVoiceoversService', {
      displayed: {
        getAllContentId: function() {
          return ['content', 'feedback_1'];
        }
      }
    });
  }));
  var ttacis = null;

  beforeEach(angular.mock.inject(function($injector) {
    ttacis = $injector.get('TranslationTabActiveContentIdService');
  }));

  it('should correctly set and get active content id', function() {
    expect(ttacis.getActiveContentId()).toBeNull();
    ttacis.setActiveContentId('content');
    expect(ttacis.getActiveContentId()).toBe('content');
  });

  it('should throw error on setting invalid content id', function() {
    expect(function() {
      ttacis.setActiveContentId('feedback_2');
    }).toThrowError(
      'Invalid active content id: feedback_2');
  });
});
