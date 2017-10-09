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
  var UtilsService;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    UtilsService = $injector.get('UtilsService');
  }));

  it('should check if an object is empty', function() {
    expect(UtilsService.isEmpty({
      a: 'b'
    })).toEqual(false);

    expect(UtilsService.isEmpty({})).toEqual(true);

    // Test against invalid inputs.
    expect(UtilsService.isEmpty(NaN)).toEqual(true);
    expect(UtilsService.isEmpty(undefined)).toEqual(true);
    expect(UtilsService.isEmpty(null)).toEqual(true);
  });

  it('should check if the input is a string', function() {
    expect(UtilsService.isString(12)).toEqual(false);

    expect(UtilsService.isString('')).toEqual(true);
    expect(UtilsService.isString('xyz')).toEqual(true);
    expect(UtilsService.isString(new String())).toEqual(true);

    // Test against invalid inputs
    expect(UtilsService.isString(NaN)).toEqual(false);
    expect(UtilsService.isString(undefined)).toEqual(false);
    expect(UtilsService.isString(null)).toEqual(false);
    expect(UtilsService.isString({})).toEqual(false);
  });
});
