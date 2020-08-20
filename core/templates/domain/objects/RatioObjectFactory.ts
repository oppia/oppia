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
 * @fileoverview Factory for creating instances of Ratio
 * domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { RatioInputAnswer } from
  'interactions/answer-defs';

export class Ratio {
    numbers: number[];
    constructor(numbersList: number[]) {
      this.numbers = numbersList;
    }

    toString(): string {
      return this.numbers.join(':');
    }

    getNoOfTerms(): number {
      return this.numbers.length;
    }
    convertToSimplestForm(): number[] {
      var gcd = (x: number, y: number) => {
        return y === 0 ? x : gcd(y, x % y);
      };
      var gcdResult = this.numbers.reduce(gcd);
      return this.numbers.map(currentValue => currentValue / gcdResult);
    }
}

@Injectable({
  providedIn: 'root'
})
export class RatioObjectFactory {
  fromRawInputString(rawInput: string): Ratio {
    var INVALID_CHARS_REGEX = /[^\d^:]$/g;
    if (INVALID_CHARS_REGEX.test(rawInput)) {
      throw new Error(
        ObjectsDomainConstants.RATIO_PARSING_ERRORS.INVALID_CHARS);
    }
    var RATIO_REGEX = /^(\d+(:\d+)+)$/;
    if (!RATIO_REGEX.test(rawInput)) {
      throw new Error(
        ObjectsDomainConstants.RATIO_PARSING_ERRORS.INVALID_FORMAT);
    }
    var numbersList = [];
    rawInput = rawInput.trim();
    numbersList = rawInput.split(':').map(Number);
    return new Ratio(numbersList);
  }

  fromList(ratioList: RatioInputAnswer) {
    return new Ratio(ratioList);
  }
}

angular.module('oppia').factory(
  'RatioObjectFactory', downgradeInjectable(RatioObjectFactory));
