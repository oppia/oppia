// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for exploration state transition used in reader and
 * editor.
 *
 * @author kashida@google.com (Koji Ashida)
 */

// Interpolates a string containing expressions, or a value which is
// represented by an expression. In either case, the string/value
// is evaluated against the supplied environments. If the interpolation fails,
// a null value is returned.
//
// Examples:
//   processString('abc{{a}}', [{'a': 'b'}]) gives 'abcb'.
//   processString('abc{{a}}', [{}]) returns null.
//   processString('abc', [{}]) returns 'abc'.
//   processValue('{{a}}', [{'a': 'b'}]) returns 'b'.
//   processValue('{{a}}', [{}]) returns null.
//   processValue('a', [{'a': 'b'}]) throws an error.
//   processValue(345, [{'a': 'b'}]) throws an error.
//   processValue('345{{a}}', [{}]) throws an error.
oppia.factory('expressionInterpolationService', [
    'expressionEvaluatorService', function(expressionEvaluatorService) {
  return {
    processString: function(sourceString, envs) {
      try {
        return sourceString.replace(/{{([^}]*)}}/, function(match, p1) {
          return expressionEvaluatorService.evaluateExpression(p1, envs);
        });
      } catch (e) {
        if (e instanceof expressionEvaluatorService.ExpressionError) {
          return null;
        }
        throw e;
      }
    },

    // valueExpression should be a string of the form '{{...}}'.
    processValue: function(valueExpression, envs) {
      valueExpression = valueExpression.trim();
      if (valueExpression.indexOf('{{') !== 0 ||
          valueExpression.indexOf('}}') + 2 !== valueExpression.length) {
        throw 'Invalid value expression: ' + valueExpression;
      }

      valueExpression = valueExpression.substring(
        2, valueExpression.length - 2);
      try {
        return expressionEvaluatorService.evaluateExpression(valueExpression, envs);
      } catch (e) {
        if (e instanceof expressionEvaluatorService.ExpressionError) {
          return null;
        }
        throw e;
      }
    }
  };
}]);

// Produces information necessary to transition from one state to another.
// independently reset and queried for the current time.
oppia.factory('stateTransitionService', [
    'learnerParamsService', 'expressionInterpolationService',
    function(learnerParamsService, expressionInterpolationService) {
  var randomFromArray = function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  // Evaluate feedback.
  var makeFeedback = function(feedbacks, envs) {
    var feedbackString = feedbacks.length > 0 ? randomFromArray(feedbacks) : '';
    return expressionInterpolationService.processString(feedbackString, envs);
  };

  // Evaluate parameters. Returns null if any evaluation fails.
  var makeParams = function(paramChanges, envs) {
    var newParams = {};
    if (paramChanges.every(function(pc) {
      if (pc.generator_id === 'Copier') {
        var args = pc.customization_args;
        if (!args.parse_with_jinja) {
          newParams[pc.name] = args.value;
        } else {
          var paramValue = expressionInterpolationService.processValue(
            args.value, envs);
          if (paramValue === null) {
            return false;
          }
          newParams[pc.name] = paramValue;
        }
      } else {
        // RandomSelector.
        newParams[pc.name] = randomFromArray(pc.list_of_values);
      }
      return true;
    })) {
      // All parameters were evaluated successfully.
      return newParams;
    }
    // Evaluation of some parameter failed.
    return null;
  };

  // Evaluate question string.
  var makeQuestion = function(new_state, envs) {
    return expressionInterpolationService.processString(
      new_state.content[0].value, envs);
  };

  return {
    // Returns null when failed to evaluate.
    getNextStateData: function(ruleSpec, new_state, answer) {
      var oldParams = learnerParamsService.getAllParams();
      oldParams.answer = answer;
      var feedback = makeFeedback(ruleSpec.feedback, [oldParams]);
      if (feedback === null) {
        return null;
      }

      var newParams = makeParams(new_state.param_changes, [oldParams]);
      if (newParams === null) {
        return null;
      }

      var question = makeQuestion(new_state, [newParams, {answer: 'answer'}]);
      if (question === null) {
        return null;
      }

      // All succeeded. Return all the results.
      // Note that newParams does not include a key for 'answer'.
      return {
        finished: ruleSpec.dest === 'END',
        params: newParams,
        feedback_html: feedback,
        question_html: question,
      }
    }
  };
}]);
