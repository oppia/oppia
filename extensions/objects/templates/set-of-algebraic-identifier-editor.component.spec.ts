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
 * @fileoverview Unit tests for the set of algebraic identifier component.
 */

import { GuppyInitializationService } from
  'services/guppy-initialization.service.ts';

fdescribe('SetOfAlgebraicIdentifier', function() {
  var ctrl = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'GuppyInitializationService', new GuppyInitializationService());
  }));
  beforeEach(angular.mock.inject(function($componentController) {
    ctrl = $componentController('setOfAlgebraicIdentifierEditor');
  }));

  it('should initialize the value with an empty array', function() {
    ctrl.$onInit();
    expect(ctrl.value).toEqual([]);
  });
});
