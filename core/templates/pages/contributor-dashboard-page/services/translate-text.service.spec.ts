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

require(
  'pages/contributor-dashboard-page/services/translate-text.service.ts');

describe('TranslateTextService', function() {
  let TranslateTextService;
  let $httpBackend;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector, $q) {
    TranslateTextService = $injector.get('TranslateTextService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('getTextToTranslate', function() {
    it('should return all texts per state', function() {
      let textAndAvailability;
      $httpBackend.expect(
        'GET', '/gettranslatabletexthandler?exp_id=1&language_code=en')
        .respond({
          state_names_to_content_id_mapping: {
            stateName1: {contentId1: 'text1', contentId2: 'text2'},
            stateName2: {contentId3: 'text3'}
          },
          version: 1
        });
      TranslateTextService.init('1', 'en', () => {});
      $httpBackend.flush();

      const expectedTextAndAvailability3 = {
        text: 'text3',
        more: false
      };

      const expectedTextAndAvailability2 = {
        text: 'text2',
        more: true
      };

      const expectedTextAndAvailability1 = {
        text: 'text1',
        more: true
      };

      const expectedTextAndPreviousAvailability1 = {
        text: 'text1',
        more: false
      };

      textAndAvailability = TranslateTextService.getTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability1);

      textAndAvailability = TranslateTextService.getTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability2);

      textAndAvailability = TranslateTextService.getTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability3);

      textAndAvailability = TranslateTextService.getPreviousTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability2);

      textAndAvailability = TranslateTextService.getPreviousTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndPreviousAvailability1);

      textAndAvailability = TranslateTextService.getTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability2);

      textAndAvailability = TranslateTextService.getTextToTranslate();
      expect(textAndAvailability).toEqual(expectedTextAndAvailability3);
    });

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

      const textAndPreviousAvailability =
       TranslateTextService.getPreviousTextToTranslate();

      expect(textAndAvailability).toEqual(textAndPreviousAvailability);
    });

    it('should return the completed translations and content correctly',
      function() {
        const expectTranslationsAndContent = {
          translations: ['<p> Translation 1 </p>', '<p> Translation 2 </p>'],
          content: ['<p> Content 1 </p>', '<p> Content 2 </p>']
        };
        $httpBackend.expect(
          'GET', '/getcompletedtranslationshandler?exp_id=1&language_code=en')
          .respond({
            translations: ['<p> Translation 1 </p>', '<p> Translation 2 </p>'],
            content: ['<p> Content 1 </p>', '<p> Content 2 </p>']
          });
        TranslateTextService.fetchCompletedTranslations('1', 'en', ()=>{});
        $httpBackend.flush();

        const completedTranslationsAndContent = TranslateTextService.
          getCompletedTranslationsText();
        expect(completedTranslationsAndContent)
          .toEqual(expectTranslationsAndContent);
      });
  });
});
