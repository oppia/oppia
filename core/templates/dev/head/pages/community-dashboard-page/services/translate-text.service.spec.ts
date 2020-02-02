// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for translation suggestion service.
 */

require(
  'pages/community-dashboard-page/services/' +
  'translate-text.service.ts');

fdescribe('TranslateTextService', function() {
  var TranslateTextService = null;
  var $httpBackend = null;
  var mockStateWiseTextForTranslation = null;
  var callbackObject = null;
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    TranslateTextService = $injector.get('TranslateTextService');
    mockStateWiseTextForTranslation = {
      version: 1,
      state_names_to_content_id_mapping: {
        Intro: {
          content: 'IntroContent'
        },
        END: {
          content: '<p>Congratulations, you have finished!</p>'
        },
        'Second Question': {
          content: 'testContent'
        }
      }
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('getTextToTranslate', function() {
    it('should return text available for translation', function() {
      $httpBackend.whenRoute('GET', '/gettranslatabletexthandler')
        .respond(function(method, url, data, headers, params) {
          return [200, mockStateWiseTextForTranslation];
        });
      TranslateTextService.init(1, 'en', function() {
        var translateData = TranslateTextService.getTextToTranslate();
        expect(translateData.text).toEqual('IntroContent');
        expect(translateData.more).toEqual(true);
      });
      $httpBackend.flush();
    });
  });

  describe('suggestTranslatedText', function() {
    it('should post new translated text data to the API', function() {
      $httpBackend.whenRoute('GET', '/suggestionhandler/')
        .respond(function(method, url, data, headers, params) {
          return [200, {test: 'pass'}];
        });
      // Can test like this since no operations are to be performed on data.
      var testCallback = function(data) {
        expect(data.test).toEqual('pass');
      };
      TranslateTextService.init(1, 'en', function() {
        TranslateTextService.suggestTranslatedText(
          '<p>test</p>', 'en', testCallback);
      });
    });
  });
});
