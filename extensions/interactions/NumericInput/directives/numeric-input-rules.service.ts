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
 * @fileoverview Rules service for the interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class NumericInputRulesService {
  Equals(answer: number, inputs: {x: number}): boolean {
    return answer === inputs.x;
  }
  IsLessThan(answer: number, inputs: {x: number}): boolean {
    return answer < inputs.x;
  }
  IsGreaterThan(answer: number, inputs: {x: number}): boolean {
    return answer > inputs.x;
  }
  IsLessThanOrEqualTo(answer: number, inputs: {x: number}): boolean {
    return answer <= inputs.x;
  }
  IsGreaterThanOrEqualTo(answer: number, inputs: {x: number}): boolean {
    return answer >= inputs.x;
  }
  IsInclusivelyBetween(
      answer: number, inputs: {a: number, b: number}): boolean {
    // TODO(wxy): Have frontend validation at creation time to check that
    // inputs.a <= inputs.b
    return answer >= inputs.a && answer <= inputs.b;
  }
  IsWithinTolerance(
      answer: number, inputs: {x: number, tol: number}): boolean {
    return answer >= inputs.x - inputs.tol &&
      answer <= inputs.x + inputs.tol;
  }
}

angular.module('oppia').factory(
  'NumericInputRulesService',
  downgradeInjectable(NumericInputRulesService));
