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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { UtilsService } from 'services/utils.service';

export interface FractionAnswer {
  isNegative: boolean;
  wholeNumber: number;
  numerator: number;
  denominator: number;
}

@Injectable({
  providedIn: 'root'
})
export class FractionInputRulesService {
  constructor(private fractionObjectFactory: FractionObjectFactory,
    private utilsService: UtilsService) {}

  toFloat(fractionDict: FractionAnswer) {
    return this.fractionObjectFactory.fromDict(fractionDict).toFloat();
  }
  IsEquivalentTo(
      answer: FractionAnswer, inputs: {f: FractionAnswer}): boolean {
    return this.toFloat(answer) === this.toFloat(inputs.f);
  }
  IsEquivalentToAndInSimplestForm(
      answer: FractionAnswer, inputs: {f: FractionAnswer}): boolean {
    var simplestForm =
      this.fractionObjectFactory.fromDict(inputs.f).convertToSimplestForm();
    return this.toFloat(answer) === this.toFloat(inputs.f) &&
      this.utilsService.isEquivalent(answer, simplestForm);
  }
  IsExactlyEqualTo(
      answer: FractionAnswer, inputs: {f: FractionAnswer}): boolean {
    // Only returns true if both answers are structurally equal.
    return this.utilsService.isEquivalent(answer, inputs.f);
  }
  IsLessThan(
      answer: FractionAnswer, inputs: {f: FractionAnswer}): boolean {
    return this.toFloat(answer) < this.toFloat(inputs.f);
  }
  IsGreaterThan(
      answer: FractionAnswer, inputs: {f: FractionAnswer}): boolean {
    return this.toFloat(answer) > this.toFloat(inputs.f);
  }
  HasIntegerPartEqualTo(
      answer: FractionAnswer, inputs: {x: number}): boolean {
    var answerFraction = this.fractionObjectFactory.fromDict(answer);
    return answerFraction.getIntegerPart() === inputs.x;
  }
  HasNumeratorEqualTo(
      answer: FractionAnswer, inputs: {x: number}): boolean {
    return answer.numerator === inputs.x;
  }
  HasDenominatorEqualTo(
      answer: FractionAnswer, inputs: {x: number}): boolean {
    return answer.denominator === inputs.x;
  }
  HasNoFractionalPart(answer: FractionAnswer): boolean {
    return answer.numerator === 0;
  }
  HasFractionalPartExactlyEqualTo(
      answer: FractionAnswer, inputs: {f: FractionAnswer}): boolean {
    return (
      answer.numerator === inputs.f.numerator &&
      answer.denominator === inputs.f.denominator);
  }
}

angular.module('oppia').factory(
  'FractionInputRulesService', downgradeInjectable(FractionInputRulesService));
