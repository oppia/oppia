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

import { AbstractControl } from '@angular/forms';
import { SchemaValidators } from './schema-validators';

class MockFormControl extends AbstractControl {
  value: unknown = '1';

  patchValue(value: unknown, options?: Object): void {
    return;
  }

  reset(value?: unknown, options?: Object): void {
    return;
  }

  setValue(value: unknown, options?: Object): void {
    this.value = value;
  }
}

describe('Schema validators', () => {
  describe('when validating "has-length-at-least"', () => {
    it('should impose minimum length bounds', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue('1');

      const args = {
        minValue: 3
      };

      const testCases = [
        { controlValue: '12', expectedResult: false },
        { controlValue: '123', expectedResult: true },
        { controlValue: '1234', expectedResult: true },
        { controlValue: ['1', '2'], expectedResult: false },
        { controlValue: undefined, expectedResult: false },
        { controlValue: ['1', '2', '3'], expectedResult: true },
        { controlValue: ['1', '2', '3', '4'], expectedResult: true },
      ];
      const filter = SchemaValidators.hasLengthAtLeast(args);
      testCases.forEach((testCase) => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(
          errorsReturned.hasLengthAtLeast).toBeDefined(testCase.toString());
      });
    }
    );
  });

  describe('when validating "has-length-at-most"', () => {
    it('should impose maximum length bounds', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue('1');

      const args = {
        maxValue: 3
      };

      const testCases = [
        { controlValue: '12', expectedResult: true},
        { controlValue: '123', expectedResult: true},
        { controlValue: '1234', expectedResult: false},
        { controlValue: undefined, expectedResult: false},
        { controlValue: ['1', '2'], expectedResult: true},
        { controlValue: ['1', '2', '3'], expectedResult: true},
        { controlValue: ['1', '2', '3', '4'], expectedResult: false},
      ];
      const filter = SchemaValidators.hasLengthAtMost(args);
      testCases.forEach((testCase) => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(
          errorsReturned.hasLengthAtMost).toBeDefined(testCase.toString());
      });
    }
    );
  });

  describe('when validating "is-at-least"', () => {
    it('should impose minimum bounds', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue(1);

      const args = {
        minValue: -2.0
      };

      const testCases = [
        {controlValue: 1.23, expectedResult: true},
        {controlValue: -1.23, expectedResult: true},
        {controlValue: -1.99, expectedResult: true },
        {controlValue: -2, expectedResult: true},
        {controlValue: -2.01, expectedResult: false},
        {controlValue: -3, expectedResult: false},
      ];
      const filter = SchemaValidators.isAtLeast(args);
      testCases.forEach((testCase) => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(
          errorsReturned.isAtLeast).toBeDefined(testCase.toString());
      });
    }
    );
  });

  describe('when validating "is-at-most"', () => {
    it('should impose maximum bounds', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue(1);

      const args = {
        maxValue: -2.0
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
      testCases.forEach((testCase) => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(
          errorsReturned.isAtMost).toBeDefined(testCase.toString());
      });
    }
    );
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
        {controlValue: '=1.23', expectedResult: false}
      ];
      const filter = SchemaValidators.isFloat();
      testCases.forEach((testCase) => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        if (errorsReturned === null) {
          throw new Error(testCase.controlValue);
        }
        expect(
          errorsReturned.isFloat).toBeDefined(testCase.toString());
      });
    }
    );
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
      testCases.forEach((testCase) => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(
          errorsReturned.isInteger).toBeDefined(testCase.toString());
      });
    }
    );
  });

  describe('when validating non-empty', () => {
    it('should check for non-empty strings', () => {
      const control: MockFormControl = new MockFormControl([], []);
      control.setValue(1);

      const testCases = [
        {controlValue: 'a', expectedResult: true},
        {controlValue: '', expectedResult: false}
      ];

      const filter = SchemaValidators.isNonempty();
      testCases.forEach((testCase) => {
        control.setValue(testCase.controlValue);
        const errorsReturned = filter(control);
        if (testCase.expectedResult === true) {
          expect(errorsReturned).toBe(null, testCase.toString());
          return;
        }
        expect(
          errorsReturned.isNonempty).toBeDefined(testCase.toString());
      });
    }
    );
  });
});
