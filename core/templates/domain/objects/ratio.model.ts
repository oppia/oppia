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
 * @fileoverview Frontend Model for ratio.
 */

import {ObjectsDomainConstants} from 'domain/objects/objects-domain.constants';
import {RatioInputAnswer} from 'interactions/answer-defs';

type GreatestCommonDivisor = (x: number, y: number) => number;

export class Ratio {
  components: number[];
  constructor(numbersList: number[]) {
    this.components = numbersList;
  }

  static fromRawInputString(rawInput: string): Ratio {
    if (rawInput.length === 0) {
      throw new Error(
        ObjectsDomainConstants.RATIO_PARSING_ERROR_I18N_KEYS.EMPTY_STRING
      );
    }
    var INVALID_CHARS_REGEX = /[^\d^:^\.^\/^\s]/g;
    if (INVALID_CHARS_REGEX.test(rawInput)) {
      throw new Error(
        ObjectsDomainConstants.RATIO_PARSING_ERROR_I18N_KEYS.INVALID_CHARS
      );
    }
    var INVALID_COLON_REGEX = /(:{2})/g;
    if (INVALID_COLON_REGEX.test(rawInput)) {
      throw new Error(
        ObjectsDomainConstants.RATIO_PARSING_ERROR_I18N_KEYS.INVALID_COLONS
      );
    }
    var INVALID_RATIO_REGEX = /\d+[\.\/]{1,}\d*/g;
    if (INVALID_RATIO_REGEX.test(rawInput)) {
      throw new Error(
        ObjectsDomainConstants.RATIO_PARSING_ERROR_I18N_KEYS.NON_INTEGER_ELEMENTS
      );
    }
    // Checking for badly formatted ratio e.g. :2:3:4 or 2:3:4:.
    var RATIO_REGEX = /^(\s)*(\d+((\s)*:(\s)*\d+)+)(\s)*$/;
    if (!RATIO_REGEX.test(rawInput)) {
      throw new Error(
        ObjectsDomainConstants.RATIO_PARSING_ERROR_I18N_KEYS.INVALID_FORMAT
      );
    }
    var numbersList = [];
    rawInput = rawInput.trim();
    numbersList = rawInput.split(':').map(Number);
    var ratio = new Ratio(numbersList);
    if (ratio.components.some(element => element === 0)) {
      throw new Error(
        ObjectsDomainConstants.RATIO_PARSING_ERROR_I18N_KEYS.INCLUDES_ZERO
      );
    }
    return ratio;
  }

  // Checks the equality of arrays value by value.
  static arrayEquals(a: number[], b: number[]): boolean {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index])
    );
  }

  static fromList(ratioList: RatioInputAnswer): Ratio {
    return new Ratio(ratioList);
  }

  toAnswerString(): string {
    return this.components.join(':');
  }

  getNumberOfTerms(): number {
    return this.components.length;
  }

  getComponents(): number[] {
    return this.components;
  }

  /**
   * Returns this Ratio in its most simplified form.
   */
  convertToSimplestForm(): number[] {
    var gcd: GreatestCommonDivisor = (x: number, y: number) => {
      return y === 0 ? x : gcd(y, x % y);
    };
    var gcdResult = this.components.reduce(gcd);
    return this.components.map(currentValue => currentValue / gcdResult);
  }
}
