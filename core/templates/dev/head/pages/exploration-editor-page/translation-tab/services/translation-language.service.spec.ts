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
 * @fileoverview Unit test for the Translation language service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');

describe('Translation language service', function() {
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('LanguageUtilService', {
      getAllVoiceoverLanguageCodes: function() {
        return ['en', 'hi'];
      },
      getAudioLanguageDescription: function(activeLanguageCode) {
        var descriptions = {
          en: 'English'
        };
        return descriptions[activeLanguageCode];
      }
    });
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  describe('Translation language service', function() {
    var tls = null;

    beforeEach(angular.mock.inject(function($injector) {
      tls = $injector.get('TranslationLanguageService');
    }));

    it('should correctly set and get state names', function() {
      tls.setActiveLanguageCode('en');
      expect(tls.getActiveLanguageCode()).toBe('en');
    });

    it('should not allow invalid state names to be set', function() {
      tls.setActiveLanguageCode('eng');
      expect(tls.getActiveLanguageCode()).toBeNull();

      tls.setActiveLanguageCode(null);
      expect(tls.getActiveLanguageCode()).toBeNull();
    });

    it('should show the language description', function() {
      tls.setActiveLanguageCode('en');
      expect(tls.getActiveLanguageDescription()).toBe('English');
    });

    it('shouldn\'t show the language description of invalid state name',
      function() {
        tls.setActiveLanguageCode('eng');
        expect(tls.getActiveLanguageDescription()).toBeNull();
      });
  });
});
