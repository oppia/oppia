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

oppia.factory('FractionInputRulesService', [
  'FractionObjectFactory',
  function(FractionObjectFactory) {
    var toFloat = function(fractionDict) {
      return FractionObjectFactory.fromDict(fractionDict).toFloat();
    };

    return {
      IsEquivalentTo: function(answer, inputs) {
        return toFloat(answer) === toFloat(inputs.f);
      },
      IsEquivalentToAndInSimplestForm: function(answer, inputs) {
        var simplestForm =
          FractionObjectFactory.fromDict(inputs.f).convertToSimplestForm();
        return toFloat(answer) === toFloat(inputs.f) &&
          angular.equals(answer, simplestForm);
      },
      IsExactlyEqualTo: function(answer, inputs) {
        // Only returns true if both answers are structurally equal.
        return angular.equals(answer, inputs.f);
      },
      IsLessThan: function(answer, inputs) {
        return toFloat(answer) < toFloat(inputs.f);
      },
      IsGreaterThan: function(answer, inputs) {
        return toFloat(answer) > toFloat(inputs.f);
      },
      HasIntegerPartEqualTo: function(answer, inputs) {
        var answerFraction = FractionObjectFactory.fromDict(answer);
        return answerFraction.getIntegerPart() === inputs.x;
      },
      HasNumeratorEqualTo: function(answer, inputs) {
        return answer.numerator === inputs.x;
      },
      HasDenominatorEqualTo: function(answer, inputs) {
        return answer.denominator === inputs.x;
      },
      HasNoFractionalPart: function(answer) {
        return answer.numerator === 0;
      },
      HasFractionalPartExactlyEqualTo: function(answer, inputs) {
        return (
          answer.numerator === inputs.f.numerator &&
          answer.denominator === inputs.f.denominator);
      },
    };
  }
]);
