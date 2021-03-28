// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Numeric Input rules.
 */

import { NumericInputRulesService } from
  'interactions/NumericInput/directives/numeric-input-rules.service';

describe('Numeric Input service', () => {
  let nirs: NumericInputRulesService;
  beforeEach(() => {
    nirs = new NumericInputRulesService();
  });

  it('should have a correct equals rule', () => {
    expect(nirs.Equals(3, {
      x: 3
    })).toBe(true);
    expect(nirs.Equals(3.0, {
      x: 3
    })).toBe(true);
    expect(nirs.Equals(4, {
      x: 3
    })).toBe(false);
  });

  it('should have a correct is less than rule', () => {
    expect(nirs.IsLessThan(3.0, {
      x: 4.0
    })).toBe(true);
    expect(nirs.IsLessThan(3, {
      x: 4
    })).toBe(true);
    expect(nirs.IsLessThan(2, {
      x: 4
    })).toBe(true);
    expect(nirs.IsLessThan(3.0, {
      x: 4.0
    })).toBe(true);
    expect(nirs.IsLessThan(4, {
      x: 3.0
    })).toBe(false);
    expect(nirs.IsLessThan(4.0, {
      x: 3.0
    })).toBe(false);
    expect(nirs.IsLessThan(3, {
      x: 3
    })).toBe(false);
  });

  it('should have a correct is greater than rule', () => {
    expect(nirs.IsGreaterThan(3.0, {
      x: 4.0
    })).toBe(false);
    expect(nirs.IsGreaterThan(3, {
      x: 4
    })).toBe(false);
    expect(nirs.IsGreaterThan(3.0, {
      x: 4.0
    })).toBe(false);
    expect(nirs.IsGreaterThan(4, {
      x: 3.0
    })).toBe(true);
    expect(nirs.IsGreaterThan(4, {
      x: 3
    })).toBe(true);
    expect(nirs.IsGreaterThan(4.0, {
      x: 3.0
    })).toBe(true);
    expect(nirs.IsGreaterThan(3, {
      x: 3
    })).toBe(false);
  });

  it('should have a correct less than or equal to rule', () => {
    expect(nirs.IsLessThanOrEqualTo(3.0, {
      x: 4.0
    })).toBe(true);
    expect(nirs.IsLessThanOrEqualTo(3, {
      x: 4
    })).toBe(true);
    expect(nirs.IsLessThanOrEqualTo(2, {
      x: 4
    })).toBe(true);
    expect(nirs.IsLessThanOrEqualTo(3, {
      x: 3
    })).toBe(true);
    expect(nirs.IsLessThanOrEqualTo(3.0, {
      x: 4.0
    })).toBe(true);
    expect(nirs.IsLessThanOrEqualTo(4, {
      x: 3.0
    })).toBe(false);
    expect(nirs.IsLessThanOrEqualTo(4.0, {
      x: 3.0
    })).toBe(false);
  });

  it('should have a correct greater than or equal to rule', () => {
    expect(nirs.IsGreaterThanOrEqualTo(3.0, {
      x: 4.0
    })).toBe(false);
    expect(nirs.IsGreaterThanOrEqualTo(3, {
      x: 4
    })).toBe(false);
    expect(nirs.IsGreaterThanOrEqualTo(2, {
      x: 4
    })).toBe(false);
    expect(nirs.IsGreaterThanOrEqualTo(3.0, {
      x: 4.0
    })).toBe(false);
    expect(nirs.IsGreaterThanOrEqualTo(3, {
      x: 3
    })).toBe(true);
    expect(nirs.IsGreaterThanOrEqualTo(4, {
      x: 3.0
    })).toBe(true);
    expect(nirs.IsGreaterThanOrEqualTo(4.0, {
      x: 3.0
    })).toBe(true);
  });

  it('should have a correct inclusively between rule', () => {
    expect(nirs.IsInclusivelyBetween(1, {
      a: 0,
      b: 2
    })).toBe(true);
    expect(nirs.IsInclusivelyBetween(1, {
      a: 0,
      b: 1
    })).toBe(true);
    expect(nirs.IsInclusivelyBetween(1.0, {
      a: 0,
      b: 2
    })).toBe(true);
    expect(nirs.IsInclusivelyBetween(1.01, {
      a: 0,
      b: 1
    })).toBe(false);
    expect(nirs.IsInclusivelyBetween(1, {
      a: 0,
      b: 0
    })).toBe(false);
  });

  it('should have a correct within tolerence rule', () => {
    expect(nirs.IsWithinTolerance(0, {
      x: 0,
      tol: 1
    })).toBe(true);
    expect(nirs.IsWithinTolerance(0.5, {
      x: 0,
      tol: 0.5
    })).toBe(true);
    expect(nirs.IsWithinTolerance(-0.5, {
      x: 0,
      tol: 0.5
    })).toBe(true);
    expect(nirs.IsWithinTolerance(3, {
      x: 2.0,
      tol: 1
    })).toBe(true);
    expect(nirs.IsWithinTolerance(0.1, {
      x: 0,
      tol: 0
    })).toBe(false);
  });
});
