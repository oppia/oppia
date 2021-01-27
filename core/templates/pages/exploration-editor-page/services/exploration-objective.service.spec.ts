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
 * @fileoverview Unit tests for the ExplorationObjectiveService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

require(
  'pages/exploration-editor-page/services/exploration-objective.service.ts');

describe('Exploration Objective Service', function() {
  let eos = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    eos = $injector.get('ExplorationObjectiveService');
  }));

  it('should test the child object properties', function() {
    expect(eos.propertyName).toBe('objective');
    let NotNormalize = '   Exploration         Objective Service     ';
    let Normalize = 'Exploration Objective Service';
    let NonValid = '';
    expect(eos._normalize(NotNormalize)).toBe(Normalize);
    expect(eos._isValid(Normalize)).toBe(true);
    expect(eos._isValid(NonValid)).toBe(false);
  });
});
