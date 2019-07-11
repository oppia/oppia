// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Validator to check if input is nonempty.
 */

require('components/forms/validators/is-nonempty.filter.ts');

describe('Normalizer tests', function() {
  var filterName = 'isNonempty';

  beforeEach(angular.mock.module('oppia'));

  it('should have the relevant filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should validate non-emptiness', angular.mock.inject(function($filter) {
    var filter = $filter('isNonempty');
    expect(filter('a')).toBe(true);
    expect(filter('')).toBe(false);
  }));
});
