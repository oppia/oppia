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
 * @fileoverview Unit tests for generic services.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

const constants = require('constants.ts');

describe('Constants Generating', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'ParamChangeObjectFactory', new ParamChangeObjectFactory());
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
    $provide.value(
      'WrittenTranslationsObjectFactory',
      new WrittenTranslationsObjectFactory(
        new WrittenTranslationObjectFactory()));
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  var $injector = null;
  beforeEach(angular.mock.inject(function(_$injector_) {
    $injector = _$injector_.get('$injector');
  }));

  it('should transform all key value pairs to angular constants', function() {
    for (var constantName in constants) {
      expect($injector.has(constantName)).toBe(true);
      expect($injector.get(constantName)).toEqual(constants[constantName]);
    }
  });
});
