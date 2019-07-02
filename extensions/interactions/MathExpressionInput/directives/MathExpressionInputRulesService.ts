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

var oppia = require('AppInit.ts').module;

oppia.factory('MathExpressionInputRulesService', [function() {
  return {
    IsMathematicallyEquivalentTo: function(answer, inputs) {
      try {
        MathExpression.fromLatex(answer.latex);
      } catch (e) {
        throw Error(
          'Bad expression in answer.latex: ' + e.message() + ' inputs: ' +
          JSON.stringify(answer));
      }

      try {
        MathExpression.fromLatex(inputs.x);
      } catch (e) {
        throw Error(
          'Bad expression in inputs.x: ' + e.message() + ' inputs: ' +
          JSON.stringify(inputs));
      }

      return (
        MathExpression.fromLatex(answer.latex).equals(
          MathExpression.fromLatex(inputs.x)));
    }
  };
}]);
