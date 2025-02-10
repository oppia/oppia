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

import {UtilsService} from 'services/utils.service';

describe('Utils Service', () => {
  let uts: UtilsService = new UtilsService();

  it('should check if an object is empty', () => {
    expect(
      uts.isEmpty({
        a: 'b',
      })
    ).toEqual(false);

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

    // Test against invalid inputs.
    expect(uts.isString(NaN)).toEqual(false);
    expect(uts.isString(undefined)).toEqual(false);
    expect(uts.isString(null)).toEqual(false);
    expect(uts.isString({})).toEqual(false);
  });

  it('should check if the input is an error', () => {
    expect(uts.isError(new Error())).toBeTrue();
    expect(uts.isError(new TypeError())).toBeTrue();
    expect(uts.isError(new DOMException('abc'))).toBeTrue();
    expect(uts.isError(12)).toBeFalse();
    expect(uts.isError(undefined)).toBeFalse();
    expect(uts.isError('abc')).toBeFalse();
    expect(uts.isError(NaN)).toBeFalse();
    expect(uts.isError({})).toBeFalse();
    expect(
      uts.isError({
        a: 'b',
      })
    ).toBeFalse();
    expect(uts.isError(null)).toBeFalse();
  });

  it('should check if the two objects are equal', () => {
    const objA = {
      k1: 'Value1',
      k2: 'Value2',
      k3: [1, 2, 3, 4, {a: 'b'}],
      k4: {
        x: [1, 2, 3, {a: [1, 2, 3]}],
        y: 'abc',
      },
    };
    const objB = {
      k1: 'Value1',
      k2: 'Value2',
      k3: [1, 2, 3, 4, {a: 'b'}],
      k4: {
        x: [1, 2, 3, {a: [1, 2, 3]}],
        y: 'abc',
      },
    };
    const objC = {
      name: 'test',
    };
    expect(uts.isEquivalent(objA, objB)).toBe(true);
    expect(uts.isEquivalent(objA, objC)).toBe(false);
  });

  it('should return false if objects are not of the same type', () => {
    const objA = {
      k1: 'Value1',
      k2: 'Value2',
      k3: [1, 2, 3, 4, {a: 'b'}],
      k4: {
        x: [1, 2, 3, {a: [1, 2, 3]}],
        y: 'abc',
      },
    };
    const objB = 2;
    expect(uts.isEquivalent(objA, objB)).toBe(false);
  });

  it('should return false if one of the objects are null', () => {
    const objA = {
      k1: 'Value1',
      k2: 'Value2',
      k3: [1, 2, 3, 4, {a: 'b'}],
      k4: {
        x: [1, 2, 3, {a: [1, 2, 3]}],
        y: 'abc',
      },
    };
    const objB = null;
    expect(uts.isEquivalent(objA, objB)).toBe(false);
  });

  it('should return true if both of the objects are null', () => {
    const objA = null;
    const objB = null;
    expect(uts.isEquivalent(objA, objB)).toBe(true);
  });

  it('should return false if values of the objects are not equal', () => {
    const objA = {
      k1: 'Value1',
      k2: 'Value2',
      k3: [1, 2, 3, 4, {a: 'b'}],
      k4: {
        x: [1, 2, 3, {a: [1, 2, 3]}],
        y: 'abc',
      },
    };
    const objB = {
      k1: 'Value1',
      k2: 'Value2',
      k3: [1, 2, 3, 4, {a: 'c'}],
      k4: {
        x: [1, 2, 3, {a: [1, 2, 3]}],
        y: 'abc',
      },
    };
    expect(uts.isEquivalent(objA, objB)).toBe(false);
  });

  it('should check if an obj is defined or not', () => {
    const objA = {};
    const objB = {
      key: 'value',
    };
    let objC;
    const objD = null;
    expect(uts.isDefined(objA)).toBe(true);
    expect(uts.isDefined(objB)).toBe(true);
    expect(uts.isDefined(objC)).toBe(false);
    expect(uts.isDefined(objD)).toBe(false);
  });

  it('should determine when an element is overflowing', () => {
    let elWithHorizontalOverflow = jasmine.createSpyObj('HTMLElement', [], {
      offsetWidth: 200,
      offsetHeight: 300,
      scrollWidth: 500,
      scrollHeight: 300,
    });
    expect(uts.isOverflowing(elWithHorizontalOverflow)).toBeTrue();

    let elWithVerticalOverflow = jasmine.createSpyObj('HTMLElement', [], {
      offsetWidth: 200,
      offsetHeight: 300,
      scrollWidth: 200,
      scrollHeight: 600,
    });
    expect(uts.isOverflowing(elWithVerticalOverflow)).toBeTrue();

    let elWithoutOverflow = jasmine.createSpyObj('HTMLElement', [], {
      offsetWidth: 200,
      offsetHeight: 300,
      scrollWidth: 200,
      scrollHeight: 300,
    });
    expect(uts.isOverflowing(elWithoutOverflow)).toBeFalse();

    expect(uts.isOverflowing(null)).toBeFalse();
  });

  describe('getting safe return URLs', () => {
    // An array of (inputUrl, expectedUrl) tuples.
    const testCases: [string, string][] = [
      ['javascript:alert(0)', '/'],
      ['data:text/html,<script>alert(0)</script>', '/'],
      ['>\'>"><img src=x onerror=alert(0)>', '/'],
      ['https://evil.com', '/'],
      ['evil.com', '/'],
      ['//evil.com', '/'],
      ['///', '/'],
      ['%', '/'],
      ['a', '/'],
      ['/', '/'],
      ['/learner-dashboard', '/learner-dashboard'],
    ];

    for (const [inputUrl, expectedUrl] of testCases) {
      it('should return ' + expectedUrl + ' from ' + inputUrl, () => {
        expect(uts.getSafeReturnUrl(inputUrl)).toEqual(expectedUrl);
      });

      const encodedInputUrl = encodeURIComponent(inputUrl);
      it('should return ' + expectedUrl + ' from ' + encodedInputUrl, () => {
        expect(uts.getSafeReturnUrl(encodedInputUrl)).toEqual(expectedUrl);
      });
    }
  });
});
