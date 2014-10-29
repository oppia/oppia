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

oppia.factory('paramInterpolationService', [
    'expressionEvaluatorService',
    function(expressionEvaluatorService) {
  return {
    // Returns null when failed to evaluate.
    html: function(sourceHtml, env) {
      try {
        return sourceHtml.replace(/{{([^}]*)}}/, function(match, p1) {
          return expressionEvaluatorService.evaluateExpression(p1, env);
        });
      } catch (e) {
        if (e instanceof expressionEvaluatorService.ExpressionError) {
          return null;
        }
        throw e;
      }
    },

    // Returns null when failed to evaluate.
    value: function(valueExpression, env) {
      var expression = valueExpression.replace(/^\s*{{(.*)}}\s*$/, '$1')
      try {
        return expressionEvaluatorService.evaluateExpression(expression, env);
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
    'learnerParamsService', 'paramInterpolationService',
    function(learnerParamsService, paramInterpolationService) {
  var randomFromArray = function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  // Evaluate feedback.
  var makeFeedback = function(feedbacks, env) {
    var feedbackString = feedbacks.length > 0 ? randomFromArray(feedbacks) : '';
    return paramInterpolationService.html(feedbackString, env);
  };

  // Evaluate params.
  var makeParams = function(param_changes, env) {
    var new_params = {};
    if (param_changes.every(function(pc) {
      if (pc.generator_id === 'Copier') {
        var args = pc.customization_args;
        if (!args.parse_with_jinja) {
          new_params[pc.name] = args.value;
        } else {
          var paramValue = paramInterpolationService.value(args.value, env);
          if (paramValue === null) {
            return false;
          }
          new_params[pc.name] = paramValue;
        }
      } else {
        // RandomSelector.
        new_params[pc.name] = randomFromArray(pc.list_of_values);
      }
      return true;
    })) {
      // All params succeeded.
      return new_params;
    }
    // Evaluation of a param failed.
    return null;
  };

  // Evaluate question string.
  var makeQuestion = function(new_state, scope) {
    return paramInterpolationService.html(new_state.content[0].value, [scope]);
  };

  return {
    // Returns null when failed to evaluate.
    next: function(rule_spec, new_state, answer) {
      var old_params = learnerParamsService.getAllParams();
      old_params.answer = answer;
      var feedback = makeFeedback(rule_spec.feedback, [old_params]);
      if (feedback === null) {
        return null;
      }

      var new_params = makeParams(new_state.param_changes, [old_params]);
      if (new_params == null) {
        return null;
      }
      new_params.answer = answer;

      var question = makeQuestion(new_state, new_params);
      if (question === null) {
        return null;
      }

      // All succeeded. Return all the results.
      return {
        finished: rule_spec.dest === 'END',
        params: new_params,
        feedback_html: '<div>' + feedback + '<div>',
        question_html: '<div>' + question + '</div>',
      }
    }
  };
}]);
