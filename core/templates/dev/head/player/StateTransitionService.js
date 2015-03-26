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

// Interpolates an HTML or a unicode string containing expressions.
// The input value is evaluated against the supplied environments.
//
// Examples:
//   processHtml('abc{{a}}', [{'a': 'b'}]) gives 'abcb'.
//   processHtml('abc{{a}}', [{}]) returns null.
//   processHtml('abc', [{}]) returns 'abc'.
//   processHtml('{[a}}', [{'a': '<button></button>'}]) returns '&lt;button&gt;&lt;/button&gt;'.
//   processUnicode('abc{{a}}', [{'a': 'b'}]) gives 'abcb'.
//   processUnicode('abc{{a}}', [{}]) returns null.
//   processUnicode('{[a}}', [{'a': '<button></button>'}]) returns '<button></button>'.
oppia.factory('expressionInterpolationService', [
    '$filter', 'expressionParserService',
    'expressionEvaluatorService', 'oppiaHtmlEscaper',
    function($filter, expressionParserService, expressionEvaluatorService,
             oppiaHtmlEscaper) {
  return {
    // This method should only be used if its result would immediately be
    // displayed on the screen without passing through further computation.
    // It differs from other methods in this service in that it
    // auto-escapes the returned HTML, and returns an 'error' label if the
    // evaluation fails.
    processHtml: function(sourceHtml, envs) {
      return sourceHtml.replace(/{{([^}]*)}}/g, function(match, p1) {
        try {
          // TODO(sll): Remove the call to $filter once we have a
          // custom UI for entering expressions. It is only needed because
          // expressions are currently input inline via the RTE.
          return oppiaHtmlEscaper.unescapedStrToEscapedStr(
            expressionEvaluatorService.evaluateExpression(
              $filter('convertHtmlToUnicode')(p1), envs));
        } catch (e) {
          var EXPRESSION_ERROR_TAG = (
            '<oppia-expression-error-tag></oppia-expression-error-tag>');
          if ((e instanceof expressionParserService.SyntaxError) ||
              (e instanceof expressionEvaluatorService.ExpressionError)) {
            return EXPRESSION_ERROR_TAG;
          }
          throw e;
        }
      });
    },
    // Returns null if the evaluation fails.
    processUnicode: function(sourceUnicode, envs) {
      try {
        return sourceUnicode.replace(/{{([^}]*)}}/g, function(match, p1) {
          // TODO(sll): Remove the call to $filter once we have a
          // custom UI for entering expressions. It is only needed because
          // expressions are currently input inline via the RTE.
          return expressionEvaluatorService.evaluateExpression(
            $filter('convertHtmlToUnicode')(p1), envs);
        });
      } catch (e) {
        if ((e instanceof expressionParserService.SyntaxError) ||
            (e instanceof expressionEvaluatorService.ExpressionError)) {
          return null;
        }
        throw e;
      }
    }
  };
}]);

// Produces information necessary to render a particular state. Note that this
// service is memoryless -- all calls to it are independent of each other.
oppia.factory('stateTransitionService', [
    'learnerParamsService', 'expressionInterpolationService',
    function(learnerParamsService, expressionInterpolationService) {
  var randomFromArray = function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  // Evaluate feedback.
  var makeFeedback = function(feedbacks, envs) {
    var feedbackHtml = feedbacks.length > 0 ? randomFromArray(feedbacks) : '';
    return expressionInterpolationService.processHtml(feedbackHtml, envs);
  };

  // Evaluate parameters. Returns null if any evaluation fails.
  var makeParams = function(oldParams, paramChanges, envs) {
    var newParams = angular.copy(oldParams);
    if (paramChanges.every(function(pc) {
      if (pc.generator_id === 'Copier') {
        if (!pc.customization_args.parse_with_jinja) {
          newParams[pc.name] = pc.customization_args.value;
        } else {
          var paramValue = expressionInterpolationService.processUnicode(
            pc.customization_args.value, [newParams].concat(envs));
          if (paramValue === null) {
            return false;
          }
          newParams[pc.name] = paramValue;
        }
      } else {
        // RandomSelector.
        newParams[pc.name] = randomFromArray(
          pc.customization_args.list_of_values);
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
  var makeQuestion = function(newState, envs) {
    return expressionInterpolationService.processHtml(
      newState.content[0].value, envs);
  };

  return {
    getInitStateData: function(expParamSpecs, expParamChanges, initState) {
      var baseParams = {};
      for (var paramName in expParamSpecs) {
        // TODO(sll): This assumes all parameters are of type UnicodeString.
        // We should generalize this to other default values for different
        // types of parameters.
        baseParams[paramName] = '';
      }

      var newParams = makeParams(
        baseParams, expParamChanges.concat(initState.param_changes),
        [baseParams]);
      if (newParams === null) {
        return null;
      }

      var question = makeQuestion(initState, [newParams]);
      if (question === null) {
        return null;
      }

      // All succeeded. Return all the results.
      return {
        params: newParams,
        question_html: question
      }
    },
    // Returns null when failed to evaluate.
    getNextStateData: function(ruleSpec, newState, answer) {
      var oldParams = learnerParamsService.getAllParams();
      oldParams.answer = answer;
      var feedback = makeFeedback(ruleSpec.feedback, [oldParams]);
      if (feedback === null) {
        return null;
      }

      var newParams = (
        newState ? makeParams(
          oldParams, newState.param_changes, [oldParams]) : oldParams);
      if (newParams === null) {
        return null;
      }

      var question = (
        newState ? makeQuestion(newState, [newParams, {answer: 'answer'}]) :
        'Congratulations, you have finished!');
      if (question === null) {
        return null;
      }

      // All succeeded. Return all the results.
      // TODO(sll): Remove the 'answer' key from newParams.
      newParams.answer = answer;
      return {
        finished: ruleSpec.dest === 'END',
        params: newParams,
        feedback_html: feedback,
        question_html: question
      }
    }
  };
}]);
