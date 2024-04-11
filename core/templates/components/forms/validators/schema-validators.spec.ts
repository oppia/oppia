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
 * @fileoverview Tests for schema-validators.
 */

import {AbstractControl, ValidationErrors} from '@angular/forms';
import {SchemaDefaultValue} from 'services/schema-default-value.service';
import {SchemaValidators} from './schema-validators';

class MockFormControl extends AbstractControl {
  value: SchemaDefaultValue = '1';

  patchValue(value: SchemaDefaultValue, options?: Object): void {
    return;
  }

  reset(value?: SchemaDefaultValue, options?: Object): void {
    return;
  }

  setValue(value: SchemaDefaultValue, options?: Object): void {
    this.value = value;
  }
}

describe('Schema validators', () => {
  describe('when validating "has-length-at-least"', () => {
    it('should impose minimum length bounds', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue('1');

      const args = {
        minValue: 3,
      };

      const testCases = [
        {controlValue: '12', expectedResult: false},
        {controlValue: '123', expectedResult: true},
        {controlValue: '1234', expectedResult: true},
        {controlValue: ['1', '2'], expectedResult: false},
        {controlValue: undefined, expectedResult: false},
        {controlValue: ['1', '2', '3'], expectedResult: true},
        {controlValue: ['1', '2', '3', '4'], expectedResult: true},
      ];
      const filter = SchemaValidators.hasLengthAtLeast(args);
      testCases.forEach(testCase => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(errorsReturned.hasLengthAtLeast)
          .withContext(testCase.toString())
          .toBeDefined();
      });
    });
    it('should throw an error when the value is not a string', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue(1);

      const args = {
        minValue: 3,
      };
      const filter = SchemaValidators.hasLengthAtLeast(args);

      expect(() => filter(control)).toThrowError(
        'Invalid value passed in control. Expecting a string or Array'
      );
    });
  });
  describe('when validating "has-length-at-most"', () => {
    it('should impose maximum length bounds', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue('1');

      const args = {
        maxValue: 3,
      };

      const testCases = [
        {controlValue: '12', expectedResult: true},
        {controlValue: '123', expectedResult: true},
        {controlValue: '1234', expectedResult: false},
        {controlValue: undefined, expectedResult: false},
        {controlValue: ['1', '2'], expectedResult: true},
        {controlValue: ['1', '2', '3'], expectedResult: true},
        {controlValue: ['1', '2', '3', '4'], expectedResult: false},
      ];
      const filter = SchemaValidators.hasLengthAtMost(args);
      testCases.forEach(testCase => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(errorsReturned.hasLengthAtMost)
          .withContext(testCase.toString())
          .toBeDefined();
      });
    });

    it('should throw an error when the value is not a string', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue(1);

      const args = {
        maxValue: 3,
      };
      const filter = SchemaValidators.hasLengthAtMost(args);

      expect(() => filter(control)).toThrowError(
        'Invalid value passed in control. Expecting a string or Array'
      );
    });
  });

  describe('when validating "is-at-least"', () => {
    it('should impose minimum bounds', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue(1);

      const args = {
        minValue: -2.0,
      };

      const testCases = [
        {controlValue: 1.23, expectedResult: true},
        {controlValue: -1.23, expectedResult: true},
        {controlValue: -1.99, expectedResult: true},
        {controlValue: -2, expectedResult: true},
        {controlValue: -2.01, expectedResult: false},
        {controlValue: -3, expectedResult: false},
      ];
      const filter = SchemaValidators.isAtLeast(args);
      testCases.forEach(testCase => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(errorsReturned.isAtLeast)
          .withContext(testCase.toString())
          .toBeDefined();
      });
    });
  });

  describe('when validating "is-at-most"', () => {
    it('should impose maximum bounds', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue(1);

      const args = {
        maxValue: -2.0,
      };

      const testCases = [
        {controlValue: 1.23, expectedResult: false},
        {controlValue: -1.23, expectedResult: false},
        {controlValue: -1.99, expectedResult: false},
        {controlValue: -2, expectedResult: true},
        {controlValue: -2.01, expectedResult: true},
        {controlValue: -3, expectedResult: true},
      ];
      const filter = SchemaValidators.isAtMost(args);
      testCases.forEach(testCase => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(errorsReturned.isAtMost)
          .withContext(testCase.toString())
          .toBeDefined();
      });
    });
  });

  describe('when validating float', () => {
    it('should validate floats correctly', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue(1);

      const testCases = [
        {controlValue: '1.23', expectedResult: true},
        {controlValue: '-1.23', expectedResult: true},
        {controlValue: '0', expectedResult: true},
        {controlValue: '-1', expectedResult: true},
        {controlValue: '-1.0', expectedResult: true},
        {controlValue: '1,5', expectedResult: true},
        {controlValue: '1%', expectedResult: true},
        {controlValue: '1.5%', expectedResult: true},
        {controlValue: '-5%', expectedResult: true},
        {controlValue: '.35', expectedResult: true},
        {controlValue: ',3', expectedResult: true},
        {controlValue: '.3%', expectedResult: true},
        {controlValue: '2,5%', expectedResult: true},
        {controlValue: '3.2% ', expectedResult: true},
        {controlValue: ' 3.2% ', expectedResult: true},
        {controlValue: '0.', expectedResult: true},
        {controlValue: '', expectedResult: true},
        {controlValue: undefined, expectedResult: true},
        {controlValue: '3%%', expectedResult: false},
        {controlValue: '-', expectedResult: false},
        {controlValue: '.', expectedResult: false},
        {controlValue: ',', expectedResult: false},
        {controlValue: '5%,', expectedResult: false},
        {controlValue: '1.23a', expectedResult: false},
        {controlValue: 'abc', expectedResult: false},
        {controlValue: '2+3', expectedResult: false},
        {controlValue: '--1.23', expectedResult: false},
        {controlValue: '=1.23', expectedResult: false},
      ];
      const filter = SchemaValidators.isFloat();
      testCases.forEach(testCase => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        if (errorsReturned === null) {
          throw new Error(testCase.controlValue);
        }
        expect(errorsReturned.isFloat)
          .withContext(testCase.toString())
          .toBeDefined();
      });
    });
  });

  describe('when validating integer', () => {
    it('should validate int correctly', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue(1);

      const testCases = [
        {controlValue: '3', expectedResult: true},
        {controlValue: '-3', expectedResult: true},
        {controlValue: '3.0', expectedResult: true},
        {controlValue: '3.5', expectedResult: false},
      ];

      const filter = SchemaValidators.isInteger();
      testCases.forEach(testCase => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(errorsReturned.isInteger)
          .withContext(testCase.toString())
          .toBeDefined();
      });
    });
  });

  describe('when validating non-empty', () => {
    it('should check for non-empty strings', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue(1);

      const testCases = [
        {controlValue: 'a', expectedResult: true},
        {controlValue: '', expectedResult: false},
      ];

      const filter = SchemaValidators.isNonempty();
      testCases.forEach(testCase => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(errorsReturned.isNonempty)
          .withContext(testCase.toString())
          .toBeDefined();
      });
    });
  });

  describe('when validating isRegexMatched', () => {
    let filter!: (control: AbstractControl) => ValidationErrors | null;
    const control: MockFormControl = new MockFormControl([], []);
    const errorMsg = {
      isRegexMatched: "Control Value doesn't match given regex",
    };

    const getFilter = (regex: string): typeof filter => {
      return SchemaValidators.isRegexMatched({regexPattern: regex});
    };

    const expectValidationToPass = (controlValue: string) => {
      control.setValue(controlValue);
      expect(filter(control)).withContext(controlValue).toBe(null);
    };

    const expectValidationToFail = (controlValue: string) => {
      control.setValue(controlValue);
      expect(filter(control)).toEqual(errorMsg);
    };
    it('should pass if the string matches the given regular expression', () => {
      filter = getFilter('a.$');
      expectValidationToPass('a ');
      expectValidationToPass('a$');
      expectValidationToPass('a2');

      filter = getFilter('g(oog)+le');
      expectValidationToPass('google ');
      expectValidationToPass('googoogle');
      expectValidationToPass('googoogoogoogle');

      filter = getFilter('(^https:\\/\\/.*)|(^(?!.*:\\/\\/)(.*))');
      expectValidationToPass('https://');
      expectValidationToPass('https://any-string');
      expectValidationToPass('https://www.oppia.com');
      expectValidationToPass('www.oppia.com');
    });

    it('should fail if the string does not match the given regular expression', () => {
      filter = getFilter('a.$');
      expectValidationToFail('a');
      expectValidationToFail('a$a');
      expectValidationToFail('bb');

      filter = getFilter('g(oog)+le');
      expectValidationToFail('gooogle ');
      expectValidationToFail('gle');
      expectValidationToFail('goole');

      filter = getFilter('(^https:\\/\\/.*)|(^(?!.*:\\/\\/)(.*))');
      expectValidationToFail('http://');
      expectValidationToFail('abc://www.oppia.com');
    });
  });

  describe('when validating isUrlFragment', () => {
    let filter!: (control: AbstractControl) => ValidationErrors | null;
    const errorMsg = {isUrlFragment: 'Not a url fragment'};

    beforeEach(() => {
      filter = SchemaValidators.isUrlFragment({
        charLimit: 20,
      });
    });

    it('should validate non-emptiness', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue('abc');
      expect(filter(control)).toBe(null);
      control.setValue('');
      expect(filter(control)).toEqual(errorMsg);
    });

    it('should fail when there are caps characters', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue('aBc');
      expect(filter(control)).toEqual(errorMsg);
      control.setValue('aaaAAA');
      expect(filter(control)).toEqual(errorMsg);
    });

    it('should fail when there are numeric characters', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue('abc-123');
      expect(filter(control)).toEqual(errorMsg);
      control.setValue('h4ck3r');
      expect(filter(control)).toEqual(errorMsg);
    });

    it('should fail when there are special characters other than hyphen', () => {
      const control: MockFormControl = new MockFormControl([], []);
      const testCases = [
        {controlValue: 'special~chars', expectedResult: false},
        {controlValue: 'special`chars', expectedResult: false},
        {controlValue: 'special!chars', expectedResult: false},
        {controlValue: 'special@chars', expectedResult: false},
        {controlValue: 'special#chars', expectedResult: false},
        {controlValue: 'special$chars', expectedResult: false},
        {controlValue: 'special%chars', expectedResult: false},
        {controlValue: 'special^chars', expectedResult: false},
        {controlValue: 'special&chars', expectedResult: false},
        {controlValue: 'special*chars', expectedResult: false},
        {controlValue: 'special(chars', expectedResult: false},
        {controlValue: 'special)chars', expectedResult: false},
        {controlValue: 'special_chars', expectedResult: false},
        {controlValue: 'special+chars', expectedResult: false},
        {controlValue: 'special=chars', expectedResult: false},
        {controlValue: 'special{chars', expectedResult: false},
        {controlValue: 'special}chars', expectedResult: false},
        {controlValue: 'special[chars', expectedResult: false},
        {controlValue: 'special]chars', expectedResult: false},
        {controlValue: 'special:chars', expectedResult: false},
        {controlValue: 'special;chars', expectedResult: false},
        {controlValue: 'special"chars', expectedResult: false},
        {controlValue: "special'chars", expectedResult: false},
        {controlValue: 'special|chars', expectedResult: false},
        {controlValue: 'special<chars', expectedResult: false},
        {controlValue: 'special,chars', expectedResult: false},
        {controlValue: 'special>chars', expectedResult: false},
        {controlValue: 'special.chars', expectedResult: false},
        {controlValue: 'special?chars', expectedResult: false},
        {controlValue: 'special/chars', expectedResult: false},
        {controlValue: 'special\\chars', expectedResult: false},
      ];
      testCases.forEach(testCase => {
        control.setValue(testCase.controlValue);
        expect(filter(control))
          .withContext(testCase.toString())
          .toEqual(errorMsg);
      });
    });

    it('should fail when there are spaces', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue('url with spaces');
      expect(filter(control)).toEqual(errorMsg);
      control.setValue(' trailing space ');
      expect(filter(control)).toEqual(errorMsg);
    });

    it('should fail when the length of the input is greater than the char limit', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue('a-lengthy-url-fragment');
      expect(filter(control)).toEqual(errorMsg);
    });

    it('should pass when the passed value is a valid url fragment', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue('math');
      expect(filter(control)).toBe(null);
      control.setValue('computer-sciencet');
      expect(filter(control)).toBe(null);
    });
  });
});
