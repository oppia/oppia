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

// Rules service for number with units interaction.
oppia.factory('NumberWithUnitsRulesService', [
  'FractionObjectFactory', 'NumberWithUnitsObjectFactory',
  function(FractionObjectFactory, NumberWithUnitsObjectFactory) {
    try {
      NumberWithUnitsObjectFactory.createCurrencyUnits();
    } catch (parsingError) {}

    return {
      IsEqualTo: function(answer, inputs) {
        // Returns true only if input is exactly equal to answer.
        answer = NumberWithUnitsObjectFactory.fromDict(answer);
        inputs = NumberWithUnitsObjectFactory.fromDict(inputs.f);

        var answerString = answer.toMathjsCompatibleString();
        var inputsString = inputs.toMathjsCompatibleString();

        var answerList = NumberWithUnitsObjectFactory.fromRawInputString(
          answerString).toDict();
        var inputsList = NumberWithUnitsObjectFactory.fromRawInputString(
          inputsString).toDict();
        return angular.equals(answerList, inputsList);
      },
      IsEquivalentTo: function(answer, inputs) {
        answer = NumberWithUnitsObjectFactory.fromDict(answer);
        inputs = NumberWithUnitsObjectFactory.fromDict(inputs.f);
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
    };
  }
]);
