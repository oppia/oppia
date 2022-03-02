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
 * @fileoverview unit tests for the Ratio Model
 */

import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { Ratio } from
  'domain/objects/ratio.model';

describe('Ratio Model', () => {
  let errors: typeof ObjectsDomainConstants.RATIO_PARSING_ERROR_I18N_KEYS;

  beforeEach(() => {
    errors = ObjectsDomainConstants.RATIO_PARSING_ERROR_I18N_KEYS;
  });

  describe('.fromList()', () => {
    it('should create a new object from list', () => {
      const ratioObject = [1, 2, 3];
      const createdRatio = Ratio.fromList(ratioObject);

      expect(createdRatio.components).toEqual(ratioObject);
    });
  });

  describe('.toAnswerString()', () => {
    it('should convert itself to a string in ratio format', () => {
      expect(new Ratio([1, 2, 3]).toAnswerString()).toBe('1:2:3');
      expect(new Ratio([2, 3, 5]).toAnswerString()).toBe('2:3:5');
      expect(new Ratio([2, 4, 6]).toAnswerString()).toBe('2:4:6');
      expect(new Ratio([10, 2, 15]).toAnswerString()).toBe('10:2:15');
      expect(new Ratio([1, 2, 3, 4]).toAnswerString()).toBe('1:2:3:4');
    });
  });

  describe('.getNumberOfTerms()', () => {
    it('should return the correct length of list', () => {
      expect(new Ratio([1, 2, 3]).getNumberOfTerms()).toBe(3);
      expect(new Ratio([1, 2]).getNumberOfTerms()).toBe(2);
      expect(new Ratio([1, 2, 3, 4]).getNumberOfTerms()).toBe(4);
      expect(new Ratio([1, 2, 3, 4, 5]).getNumberOfTerms()).toBe(5);
    });
  });

  describe('.getComponents()', () => {
    it('should return the correct components list', () => {
      expect(new Ratio([1, 2, 3]).getComponents()).toEqual([1, 2, 3]);
      expect(new Ratio([1, 2]).getComponents()).toEqual([1, 2]);
    });
  });

  describe('.fromRawInputString()', () => {
    it('should parse valid strings', () => {
      expect(Ratio.fromRawInputString('1:2')).toEqual(
        new Ratio([1, 2]));
      expect(Ratio.fromRawInputString('2:3:5')).toEqual(
        new Ratio([2, 3, 5]));
      expect(Ratio.fromRawInputString('2:3:5:7:11')).toEqual(
        new Ratio([2, 3, 5, 7, 11]));
      expect(Ratio.fromRawInputString('2 : 3 : 5 : 7 : 11')).toEqual(
        new Ratio([2, 3, 5, 7, 11]));
      expect(Ratio.fromRawInputString('  2 :3:   5')).toEqual(
        new Ratio([2, 3, 5]));
    });

    it('should throw errors for invalid character', () => {
      expect(() => {
        Ratio.fromRawInputString('3:b');
      }).toThrowError(errors.INVALID_CHARS);
      expect(() => {
        Ratio.fromRawInputString('a:3');
      }).toThrowError(errors.INVALID_CHARS);
      expect(() => {
        Ratio.fromRawInputString('-1:3');
      }).toThrowError(errors.INVALID_CHARS);
    });

    it('should throw errors for invalid format', () => {
      expect(() => {
        Ratio.fromRawInputString(':1:3');
      }).toThrowError(errors.INVALID_FORMAT);
      expect(() => {
        Ratio.fromRawInputString('1:2:3:4:5:');
      }).toThrowError(errors.INVALID_FORMAT);
      expect(() => {
        Ratio.fromRawInputString('1:');
      }).toThrowError(errors.INVALID_FORMAT);
      expect(() => {
        Ratio.fromRawInputString('1');
      }).toThrowError(errors.INVALID_FORMAT);
    });

    it('should throw errors for invalid Ratio', () => {
    // Invalid ratio.
      expect(() => {
        Ratio.fromRawInputString('1:3/2');
      }).toThrowError(errors.NON_INTEGER_ELEMENTS);
      expect(() => {
        Ratio.fromRawInputString('1:1/2:3/2');
      }).toThrowError(errors.NON_INTEGER_ELEMENTS);
      expect(() => {
        Ratio.fromRawInputString('1/2:2:3:4:5');
      }).toThrowError(errors.NON_INTEGER_ELEMENTS);
      expect(() => {
        Ratio.fromRawInputString('1:2.2');
      }).toThrowError(errors.NON_INTEGER_ELEMENTS);
      expect(() => {
        Ratio.fromRawInputString('1.2:2');
      }).toThrowError(errors.NON_INTEGER_ELEMENTS);
    });

    it('should throw errors for invalid colons', () => {
      expect(() => {
        Ratio.fromRawInputString('1::2::3');
      }).toThrowError(errors.INVALID_COLONS);
      expect(() => {
        Ratio.fromRawInputString('1:2::3');
      }).toThrowError(errors.INVALID_COLONS);
      expect(() => {
        Ratio.fromRawInputString('1:2:::3');
      }).toThrowError(errors.INVALID_COLONS);
    });

    it('should throw errors for ratio containing zero term', () => {
      expect(() => {
        Ratio.fromRawInputString('1:0');
      }).toThrowError(errors.INCLUDES_ZERO);
      expect(() => {
        Ratio.fromRawInputString('0:0');
      }).toThrowError(errors.INCLUDES_ZERO);
      expect(() => {
        Ratio.fromRawInputString('0:1');
      }).toThrowError(errors.INCLUDES_ZERO);
    });
  });

  describe('.convertToSimplestForm()', () => {
    it('should convert to simplest form', () => {
      expect(new Ratio([1, 2, 3]).convertToSimplestForm()).toEqual([1, 2, 3]);
      expect(new Ratio([2, 4, 6]).convertToSimplestForm()).toEqual([1, 2, 3]);
      expect(new Ratio([3, 6, 9]).convertToSimplestForm()).toEqual([1, 2, 3]);
      expect(new Ratio([2, 3, 5]).convertToSimplestForm()).toEqual([2, 3, 5]);
      expect(new Ratio([2, 4, 5]).convertToSimplestForm()).toEqual([2, 4, 5]);
      expect(new Ratio([2, 0, 4]).convertToSimplestForm()).toEqual([1, 0, 2]);
      expect(new Ratio([0, 0, 4]).convertToSimplestForm()).toEqual([0, 0, 1]);
    });
  });
});
