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
 * @fileoverview Tests for translate-text service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// UserService.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'pages/community-dashboard-page/services/translate-text.service.ts');

fdescribe('TranslateTextService', function() {
  let TranslateTextService;
  let $httpBackend;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (const [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    TranslateTextService = $injector.get('TranslateTextService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('getTextToTranslate', function() {
    it('should return no more available for states with no texts', function() {
      const expectedTextAndAvailability = {
        text: 'text1',
        more: false
      };
      $httpBackend.expect(
        'GET', '/gettranslatabletexthandler?exp_id=1&language_code=en')
        .respond({
          state_names_to_content_id_mapping: {
            stateName1: {contentId1: 'text1'},
            stateName2: {contentId2: ''}
          },
          version: 1
        });
      TranslateTextService.init('1', 'en', () => {});
      $httpBackend.flush();

      const textAndAvailability = TranslateTextService.getTextToTranslate();

      expect(textAndAvailability).toEqual(expectedTextAndAvailability);
    });

    it('should return {null, False} for completely empty states', function() {
      const expectedTextAndAvailability = {
        text: null,
        more: false
      };
      $httpBackend.expect(
        'GET', '/gettranslatabletexthandler?exp_id=1&language_code=en')
        .respond({
          state_names_to_content_id_mapping: {
            stateName1: {contentId1: ''},
            stateName2: {contentId2: ''}
          },
          version: 1
        });
      TranslateTextService.init('1', 'en', () => {});
      $httpBackend.flush();

      const textAndAvailability = TranslateTextService.getTextToTranslate();

      expect(textAndAvailability).toEqual(expectedTextAndAvailability);
    });
  });
});
