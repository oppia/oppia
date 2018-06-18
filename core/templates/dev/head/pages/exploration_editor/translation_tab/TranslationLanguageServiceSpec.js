// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Editor state service.
 */

describe('Translation language service', function() {
  beforeEach(module('oppia', function($provide) {
    $provide.value('LanguageUtilService', {
      getAllAudioLanguageCodes: function() {
        return ['en', 'hi'];
      }
    });
  }));

  describe('Translation language service', function() {
    var tls = null;

    beforeEach(inject(function($injector) {
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
  });
});
