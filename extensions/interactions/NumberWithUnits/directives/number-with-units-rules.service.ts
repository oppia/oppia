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
// TODO(#7403): Convert this to partial imports.
import math from 'mathjs';

import { NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory.ts';

// Rules service for number with units interaction.
@Injectable({
  providedIn: 'root'
})
export class NumberWithUnitsRulesService {
  constructor(private unitsObjectFactory: NumberWithUnitsObjectFactory) {
    try {
      this.unitsObjectFactory.createCurrencyUnits();
    } catch (parsingError) {}
  }
  // Checks if a === b.
  private isEquivalent(a: any, b: any): boolean {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    if (aProps.length !== bProps.length) {
      return false;
    }
    for (var i = 0; i < aProps.length; i++) {
      var propName = aProps[i];
      if (typeof a[propName] === 'object' && !this.isEquivalent(
        a[propName], b[propName])) {
        return false;
      }
      if (typeof a[propName] !== 'object' && a[propName] !== b[propName]) {
        return false;
      }
    }
    return true;
  }
  // TODO(#7165): Replace 'any' with the exact type.
  IsEqualTo(answer: any, inputs: any): boolean {
    // Returns true only if input is exactly equal to answer.
    answer = this.unitsObjectFactory.fromDict(answer);
    inputs = this.unitsObjectFactory.fromDict(inputs.f);

    var answerString = answer.toMathjsCompatibleString();
    var inputsString = inputs.toMathjsCompatibleString();

    var answerList = this.unitsObjectFactory.fromRawInputString(
      answerString).toDict();
    var inputsList = this.unitsObjectFactory.fromRawInputString(
      inputsString).toDict();
    return this.isEquivalent(answerList, inputsList);
  }
  // TODO(#7165): Replace 'any' with the exact type.
  IsEquivalentTo(answer: any, inputs: any): boolean {
    answer = this.unitsObjectFactory.fromDict(answer);
    inputs = this.unitsObjectFactory.fromDict(inputs.f);
    if (answer.type === 'fraction') {
      answer.type = 'real';
      answer.real = answer.fraction.toFloat();
    }
    if (inputs.type === 'fraction') {
      inputs.type = 'real';
      inputs.real = inputs.fraction.toFloat();
    }
    var answerString = answer.toMathjsCompatibleString();
    var inputsString = inputs.toMathjsCompatibleString();
    return math.unit(answerString).equals(math.unit(inputsString));
  }
}

angular.module('oppia').factory(
  'NumberWithUnitsRulesService', downgradeInjectable(
    NumberWithUnitsRulesService));
