// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Group of all validators
 */

import { AbstractControl, ValidationErrors } from '@angular/forms';
import { AppConstants } from 'app.constants';

export class SchemaValidators {
  static isAtLeast(
      args: {minValue: number}
  ): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = parseFloat(control.value);
      if (!isNaN(value) && value >= args.minValue) {
        return null;
      }
      return {
        isAtLeast: {minValue: args.minValue, actual: control.value}
      };
    };
  }

  static isAtMost(
      args: {maxValue: number}
  ): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = parseFloat(control.value);
      if (!isNaN(value) && value <= args.maxValue) {
        return null;
      }
      return {
        isAtMost: {maxValue: args.maxValue, actual: control.value}
      };
    };
  }

  static isFloat(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      var FLOAT_REGEXP = /(?=.*\d)^\-?\d*(\.|\,)?\d*\%?$/;
      // This regex accepts floats in the following formats:
      // 0.
      // 0.55..
      // -0.55..
      // .555..
      // -.555..
      // All examples above with '.' replaced with ',' are also valid.
      // Expressions containing % are also valid (5.1% etc).

      var viewValue = '';
      try {
        viewValue = control.value.toString().trim();
      } catch (e) {
        return null;
      }

      if (viewValue !== '') {
        if (FLOAT_REGEXP.test(viewValue)) {
          if (viewValue.slice(-1) === '%') {
            // This is a percentage, so the input needs to be divided by 100.
            if (!(parseFloat(
              viewValue.substring(0, viewValue.length - 1).replace(',', '.')
            ) / 100.0)) {
              return {isFloat: 'Not float'};
            }
          } else {
            if (!parseFloat(viewValue.replace(',', '.'))) {
              return {isFloat: 'Not float'};
            }
          }
        }
      }
      return null;
    };
  }

  static isInteger(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!Number.isInteger(Number(control.value))) {
        return {isInteger: {actual: control.value}};
      }
      return null;
    };
  }

  static isNonempty(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value.length === 0) {
        return {isNonempty: true};
      }
      return null;
    };
  }

  static isUrlFragment(
      args: {charLimit: number}
  ): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl) => {
      const VALID_URL_FRAGMENT_REGEX = new RegExp(
        AppConstants.VALID_URL_FRAGMENT_REGEX);
      if (
        control.value &&
        VALID_URL_FRAGMENT_REGEX.test(control.value) &&
        control.value.length <= args.charLimit
      ) {
        return null;
      }
      return {isUrlFragment: {isUrlFragment: 'error'}};
    };
  }
}
