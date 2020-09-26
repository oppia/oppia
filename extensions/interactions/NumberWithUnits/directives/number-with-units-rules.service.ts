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

import { unit } from 'mathjs';

import { NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { UtilsService } from 'services/utils.service';
import { NumberWithUnitsAnswer } from 'interactions/answer-defs';
import { NumberWithUnitsRuleInputs } from 'interactions/rule-input-defs';

// Rules service for number with units interaction.
@Injectable({
  providedIn: 'root'
})
export class NumberWithUnitsRulesService {
  constructor(
    private unitsObjectFactory: NumberWithUnitsObjectFactory,
    private utilsService: UtilsService) {
    try {
      this.unitsObjectFactory.createCurrencyUnits();
    } catch (parsingError) {}
  }

  IsEqualTo(
      answer: NumberWithUnitsAnswer,
      inputs: NumberWithUnitsRuleInputs): boolean {
    // Returns true only if input is exactly equal to answer.
    var answerObject = this.unitsObjectFactory.fromDict(answer);
    var inputsObject = this.unitsObjectFactory.fromDict(inputs.f);

    var answerString = answerObject.toMathjsCompatibleString();
    var inputsString = inputsObject.toMathjsCompatibleString();

    var answerList = this.unitsObjectFactory.fromRawInputString(
      answerString).toDict();
    var inputsList = this.unitsObjectFactory.fromRawInputString(
      inputsString).toDict();
    return this.utilsService.isEquivalent(answerList, inputsList);
  }

  IsEquivalentTo(
      answer: NumberWithUnitsAnswer,
      inputs: NumberWithUnitsRuleInputs): boolean {
    var answerObject = this.unitsObjectFactory.fromDict(answer);
    var inputsObject = this.unitsObjectFactory.fromDict(inputs.f);
    if (answerObject.type === 'fraction') {
      answerObject.type = 'real';
      answerObject.real = answerObject.fraction.toFloat();
    }
    if (inputsObject.type === 'fraction') {
      inputsObject.type = 'real';
      inputsObject.real = inputsObject.fraction.toFloat();
    }
    var answerString = answerObject.toMathjsCompatibleString();
    var inputsString = inputsObject.toMathjsCompatibleString();
    return unit(answerString).equals(unit(inputsString));
  }
}

angular.module('oppia').factory(
  'NumberWithUnitsRulesService', downgradeInjectable(
    NumberWithUnitsRulesService));
