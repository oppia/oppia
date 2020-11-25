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
 * @fileoverview Unit tests for the ExplorationTagsService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

require(
  'pages/exploration-editor-page/services/exploration-tags.service.ts');

describe('Exploration Tags Service', function() {
  let ets = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    ets = $injector.get('ExplorationTagsService');
  }));

  it('should test the child object properties', function() {
    expect(ets.propertyName).toBe('tags');
    let NotNormalize = ['angularjs ', ' google  cloud  storage   ', ' python'];
    let Normalize = ['angularjs', 'google cloud storage', 'python'];
    let UpperCaseNotValid = ['Angularjs', 'google cloud storage', 'Python'];
    let NumberNotValid = ['angularjs', 'google cloud storage', 'Python123'];
    let SpecialNotValid = ['@ngularjs', 'google cloud storage', 'Python'];
    expect(ets._normalize(NotNormalize)).toEqual(Normalize);
    expect(ets._isValid(Normalize)).toBe(true);
    expect(ets._isValid(UpperCaseNotValid)).toBe(false);
    expect(ets._isValid(NumberNotValid)).toBe(false);
    expect(ets._isValid(SpecialNotValid)).toBe(false);
  });
});
