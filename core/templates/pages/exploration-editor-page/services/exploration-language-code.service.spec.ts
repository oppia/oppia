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
 * @fileoverview Unit tests for the ExplorationLanguageCodeService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'pages/exploration-editor-page/' +
  'services/exploration-language-code.service.ts');

describe('Exploration Language Code Service', function() {
  let elcs = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    elcs = $injector.get('ExplorationLanguageCodeService');
  }));

  it('should test the child object properties', function() {
    expect(elcs.propertyName).toBe('language_code');
    expect(elcs.getSupportedContentLanguages()).toBeInstanceOf(Object);
    elcs.displayed = 'en';
    expect(elcs.getCurrentLanguageDescription()).toBe('English');
    elcs.displayed = 'bn';
    expect(elcs.getCurrentLanguageDescription()).toBe('বাংলা (Bangla)');
    elcs.displayed = 'nl';
    expect(elcs.getCurrentLanguageDescription()).toBe('Nederlands (Dutch)');
    expect(elcs._isValid('en')).toBe(true);
  });
});
