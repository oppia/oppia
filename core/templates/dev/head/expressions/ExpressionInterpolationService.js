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
 * @fileoverview Service for interpolating expressions.
 */

// Interpolates an HTML or a unicode string containing expressions.
// The input value is evaluated against the supplied environments.
//
// Examples:
//   processHtml('abc{{a}}', [{'a': 'b'}]) gives 'abcb'.
//   processHtml('abc{{a}}', [{}]) returns null.
//   processHtml('abc', [{}]) returns 'abc'.
//   processHtml('{[a}}', [{'a': '<button></button>'}])
//     returns '&lt;button&gt;&lt;/button&gt;'.
//   processUnicode('abc{{a}}', [{'a': 'b'}]) gives 'abcb'.
//   processUnicode('abc{{a}}', [{}]) returns null.
//   processUnicode('{[a}}', [{'a': '<button></button>'}]) returns
//     '<button></button>'.
oppia.factory('ExpressionInterpolationService', [
  '$filter', 'ExpressionEvaluatorService', 'ExpressionParserService',
  'ExpressionSyntaxTreeService', 'HtmlEscaperService',
  function(
      $filter, ExpressionEvaluatorService, ExpressionParserService,
      ExpressionSyntaxTreeService, HtmlEscaperService) {
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
            return HtmlEscaperService.unescapedStrToEscapedStr(
              ExpressionEvaluatorService.evaluateExpression(
                $filter('convertHtmlToUnicode')(p1), envs));
          } catch (e) {
            var EXPRESSION_ERROR_TAG = (
              '<oppia-expression-error-tag></oppia-expression-error-tag>');
            if ((e instanceof ExpressionParserService.SyntaxError) ||
                (e instanceof ExpressionSyntaxTreeService.ExpressionError)) {
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
            return ExpressionEvaluatorService.evaluateExpression(
              $filter('convertHtmlToUnicode')(p1), envs);
          });
        } catch (e) {
          if ((e instanceof ExpressionParserService.SyntaxError) ||
              (e instanceof ExpressionSyntaxTreeService.ExpressionError)) {
            return null;
          }
          throw e;
        }
      },
      // This works for both unicode and HTML.
      getParamsFromString: function(sourceString) {
        var matches = sourceString.match(/{{([^}]*)}}/g) || [];

        var allParams = [];
        for (var i = 0; i < matches.length; i++) {
          // Trim the '{{' and '}}'.
          matches[i] = matches[i].substring(2, matches[i].length - 2);

          var params = ExpressionSyntaxTreeService.getParamsUsedInExpression(
            $filter('convertHtmlToUnicode')(matches[i]));

          for (var j = 0; j < params.length; j++) {
            if (allParams.indexOf(params[j]) === -1) {
              allParams.push(params[j]);
            }
          }
        }

        return allParams.sort();
      }
    };
  }
]);
