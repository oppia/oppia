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
import { Validator as OppiaValidator } from 'interactions/TextInput/directives/text-input-validation.service';
import cloneDeep from 'lodash/cloneDeep';
import { UnderscoresToCamelCasePipe } from 'filters/string-utility-filters/underscores-to-camel-case.pipe';

type ValidatorKeyType = keyof Omit<typeof SchemaValidators, 'prototype'>;
type ValidatorFunctionType = (typeof SchemaValidators)[ValidatorKeyType];
type FilterArgsType = Parameters<ValidatorFunctionType>[0];

export const validate = (
    control: AbstractControl, validators: OppiaValidator[]
): ValidationErrors | null => {
  let underscoresToCamelCasePipe = new UnderscoresToCamelCasePipe();
  if (!validators || validators.length === 0) {
    return null;
  }
  let errorsPresent = false;
  let allValidationErrors: ValidationErrors = {};
  for (const validatorSpec of validators) {
    const validatorName = underscoresToCamelCasePipe.transform(
      validatorSpec.id
    ) as ValidatorKeyType;
    const filterArgs = Object.fromEntries(
      Object.entries(validatorSpec)
        .filter(([key, _]) => key !== 'id')
        .map(
          ([key, value]) => {
            return [
              underscoresToCamelCasePipe.transform(key),
              cloneDeep(value)
            ];
          })
    ) as FilterArgsType;
    if (SchemaValidators[validatorName]) {
      const error = (
        SchemaValidators[
          validatorName
        ] as (arg: FilterArgsType) => ReturnType<ValidatorFunctionType>
      )(filterArgs)(control);
      if (error !== null) {
        errorsPresent = true;
        allValidationErrors = {...allValidationErrors, ...error};
      }
    } else {
      // TODO(#15190): Throw an error if validator not found.
    }
  }
  if (!errorsPresent) {
    return null;
  }
  return allValidationErrors;
};

export class SchemaValidators {
  static hasLengthAtLeast(
      args: {minValue: number}
  ): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined) {
        return {
          hasLengthAtLeast: {minValue: args.minValue, actual: control.value}
        };
      }
      if (!(typeof value === 'string' || Array.isArray(value))) {
        throw new Error(
          'Invalid value passed in control. Expecting a string or Array');
      }
      if (value.length >= args.minValue) {
        return null;
      }
      return {
        hasLengthAtLeast: {
          minValue: args.minValue, actual: control.value.length}
      };
    };
  }

  static hasLengthAtMost(
      args: {maxValue: number}
  ): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined) {
        return {
          hasLengthAtMost: {minValue: args.maxValue, actual: control.value}
        };
      }
      if (!(typeof value === 'string' || Array.isArray(value))) {
        throw new Error(
          'Invalid value passed in control. Expecting a string or Array');
      }
      if (value.length <= args.maxValue) {
        return null;
      }
      return {
        hasLengthAtMost: {maxValue: args.maxValue, actual: control.value.length}
      };
    };
  }

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
            return isNaN(parseFloat(
              // TODO(#15455): Use the numeric-service to get the current
              // decimal separator.
              viewValue.substring(0, viewValue.length - 1).replace(',', '.')
            ) / 100.0) ? {isFloat: 'Not float', actual: control.value} : null;
          } else {
            // TODO(#15455): Use the numeric-service to get the current
            // decimal separator.
            return isNaN(parseFloat(viewValue.replace(',', '.'))) ?
               {isFloat: 'Not float', actual: control.value} : null;
          }
        } else {
          return {isFloat: 'Not float', actual: control.value};
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
      if (control.value === null || control.value?.length === 0) {
        return {isNonempty: true};
      }
      return null;
    };
  }

  static isRegexMatched(
      args: {regexPattern: string}
  ): (control: AbstractControl) => ValidationErrors | null {
    const re = new RegExp(args.regexPattern);
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || re.test(control.value)) {
        return null;
      }
      return {isRegexMatched: 'Control Value doesn\'t match given regex'};
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
      return {isUrlFragment: 'Not a url fragment'};
    };
  }
}
