// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests that the utility functions are working as expected.
 */

describe('Utils Service', function() {
  var utilsService;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    utilsService = $injector.get('utilsService');
  }));

  it('should check if an object is empty', function() {
    expect(utilsService.isEmpty({
      a: 'b'
    })).toEqual(false);

    expect(utilsService.isEmpty({})).toEqual(true);

    // Test against invalid inputs.
    expect(utilsService.isEmpty(NaN)).toEqual(true);
    expect(utilsService.isEmpty(undefined)).toEqual(true);
    expect(utilsService.isEmpty(null)).toEqual(true);
  });

  it('should check if the input is a string', function() {
    expect(utilsService.isString(12)).toEqual(false);

    expect(utilsService.isString('')).toEqual(true);
    expect(utilsService.isString('xyz')).toEqual(true);
    expect(utilsService.isString(new String())).toEqual(true);

    // Test against invalid inputs
    expect(utilsService.isString(NaN)).toEqual(false);
    expect(utilsService.isString(undefined)).toEqual(false);
    expect(utilsService.isString(null)).toEqual(false);
    expect(utilsService.isString({})).toEqual(false);
  });
});
