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

import { UtilsService } from 'services/utils.service';

describe('Utils Service', () => {
  let uts: UtilsService = new UtilsService();

  it('should check if an object is empty', () => {
    expect(uts.isEmpty({
      a: 'b'
    })).toEqual(false);

    expect(uts.isEmpty({})).toEqual(true);

    // Test against invalid inputs.
    expect(uts.isEmpty(NaN)).toEqual(true);
    expect(uts.isEmpty(undefined)).toEqual(true);
    expect(uts.isEmpty(null)).toEqual(true);
  });

  it('should check if the input is a string', () => {
    expect(uts.isString(12)).toEqual(false);

    expect(uts.isString('')).toEqual(true);
    expect(uts.isString('xyz')).toEqual(true);
    expect(uts.isString(new String())).toEqual(true);

    // Test against invalid inputs
    expect(uts.isString(NaN)).toEqual(false);
    expect(uts.isString(undefined)).toEqual(false);
    expect(uts.isString(null)).toEqual(false);
    expect(uts.isString({})).toEqual(false);
  });

  it('should check if the input is an error', () => {
    // A custom Error.
    var NotImplementedError = function(message) {
      this.name = 'NotImplementedError';
      this.message = (message || '');
    };
    NotImplementedError.prototype = Error.prototype;
    expect(uts.isError(new Error())).toBeTrue();
    expect(uts.isError(new NotImplementedError('abc'))).toBeTrue();
    expect(uts.isError(new DOMException('abc'))).toBeTrue();
    expect(uts.isError(12)).toBeFalse();
    expect(uts.isError(undefined)).toBeFalse();
    expect(uts.isError('abc')).toBeFalse();
    expect(uts.isError(NaN)).toBeFalse();
    expect(uts.isError({})).toBeFalse();
    expect(uts.isError({
      a: 'b'
    })).toBeFalse();
    expect(uts.isError(null)).toBeFalse();
  });
});
