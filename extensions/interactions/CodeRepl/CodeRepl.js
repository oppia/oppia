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
 * Directive for the CodeRepl interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveCodeRepl', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interaction/CodeRepl',
      controller:  ['$scope', '$attrs', function($scope, $attrs) {
        $scope.language = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.languageWithValue);
        $scope.placeholder = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.placeholderWithValue);
        $scope.preCode = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.preCodeWithValue);
        $scope.postCode = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.postCodeWithValue);

        $scope.hasLoaded = false;

        // Keep the code string given by the user and the stdout from the
        // evaluation until sending them back to the server.
        $scope.code = ($scope.placeholder || '');
        $scope.output = '';

        $scope.initCodeEditor = function(editor) {
          editor.setValue($scope.code);

          // Options for the ui-codemirror display.
          editor.setOption('lineNumbers', true);
          editor.setOption('indentWithTabs', true);

          // Note that only 'coffeescript', 'javascript', 'python', and 'ruby'
          // have CodeMirror-supported syntax highlighting. For other
          // languages, syntax highlighting will not happen.
          editor.setOption('mode', $scope.language);

          // NOTE: this is necessary to avoid the textarea being greyed-out.
          setTimeout(function() {
            editor.refresh();
          }, 200);

          editor.on('change', function(instance, change) {
            $scope.code = editor.getValue();
          });

          $scope.hasLoaded = true;
        };

        // Configure Skulpt.
        Sk.configure({
          output: function(out) {
            // This output function is called continuously throughout the
            // runtime of the script.
            $scope.output += out;
          },
          timeoutMsg: function() {
            $scope.sendResponse('', 'timeout');
          },
          execLimit: 10000,
        });

        $scope.runCode = function(codeInput) {
          $scope.code = codeInput;
          $scope.output = '';

          var fullCode = (
            $scope.preCode + '\n' + codeInput + '\n' + $scope.postCode);

          // Evaluate the program asynchronously using Skulpt.
          Sk.misceval.asyncToPromise(function() {
            Sk.importMainWithBody('<stdin>', false, fullCode, true);
          }).then(function(res) {
            // Finished evaluating.
            $scope.sendResponse('', '');
          }, function(err) {
            if (!(err instanceof Sk.builtin.TimeLimitError)) {
              $scope.sendResponse('', String(err));
            }
          });
        };

        $scope.sendResponse = function(evaluation, err) {
          $scope.evaluation = (evaluation || '');
          $scope.err = (err || '');
          $scope.$parent.$parent.submitAnswer({
            // Replace tabs with 2 spaces.
            // TODO(sll): Change the default Python indentation to 4 spaces.
            code: $scope.code.replace(/\t/g, '  ') || '',
            output: $scope.output,
            evaluation: $scope.evaluation,
            error: $scope.err
          });
        };
      }]
    };
  }
]);

oppia.directive('oppiaResponseCodeRepl', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/CodeRepl',
      controller: ['$scope', '$attrs', 'focusService', function($scope, $attrs, focusService) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);

        if ($scope.answer.error) {
          $scope.errorFocusLabel = focusService.generateFocusLabel();
          focusService.setFocus($scope.errorFocusLabel);
        }
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseCodeRepl', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/CodeRepl',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);

oppia.factory('codeReplNormalizationService', [function() {
  var removeLeadingWhitespace = function(str) {
    return str.replace(/^\s+/g, '');
  };
  var removeTrailingWhitespace = function(str) {
    return str.replace(/\s+$/g, '');
  };
  return {
    getNormalizedCode: function(codeString) {
      /*
       * Normalizes a code string (which is assumed not to contain tab
       * characters). In particular:
       *
       * - Strips out lines that start with '#' (comments), possibly preceded by
       *     whitespace.
       * - Trims trailing whitespace on each line.
       * - Removes blank newlines.
       * - Make the indentation level four spaces.
       */
      // TODO(sll): Augment this function to strip out comments that occur at the
      // end of a line. However, be careful with lines where '#' is contained in
      // quotes or the character is escaped.
      var FOUR_SPACES = '    ';
      // Maps the number of spaces at the beginning of a line to an int specifying
      // the desired indentation level.
      var numSpaceToDesiredIndentLevel = {
          0: 0,
      };

      var codeLines = removeTrailingWhitespace(codeString).split('\n');
      var normalizedCodeLines = [];
      codeLines.forEach(function(line) {
        if (removeLeadingWhitespace(line).startsWith('#')) {
          return;
        }
        line = removeTrailingWhitespace(line);
        if (!line) {
          return;
        }

        var numSpaces = line.length - removeLeadingWhitespace(line).length;

        var maxNumSpaces = Object.keys(numSpaceToDesiredIndentLevel).reduce(
          function(max, key) {
            return Math.max(key, max);
          }, -Infinity);
        if (numSpaces > maxNumSpaces) {
          // Add a new indentation level
          numSpaceToDesiredIndentLevel[numSpaces] =
            Object.keys(numSpaceToDesiredIndentLevel).length;
        }

        // This is set when the indentation level of the current line does not
        // start a new scope, and also does not match any previous indentation
        // level. This case is actually invalid, but for now, we take the
        // largest indentation level that is less than this one.
        // TODO(sll): Bad indentation should result in an error nearer the
        // source.
        var isShortfallLine =
          !numSpaceToDesiredIndentLevel.hasOwnProperty(numSpaces) &&
          numSpaces < maxNumSpaces;

        // Clear all existing indentation levels to the right of this one.
        for (var key in numSpaceToDesiredIndentLevel) {
          if (key > numSpaces) {
            delete numSpaceToDesiredIndentLevel[key];
          }
        }

        if (isShortfallLine) {
          numSpaces = Object.keys(numSpaceToDesiredIndentLevel).reduce(
            function(max, key) {
              return Math.max(numSpaceToDesiredIndentLevel[key], max);
            }, -Infinity);
        }

        var normalizedLine = '';
        for (var i = 0; i < numSpaceToDesiredIndentLevel[numSpaces]; i++) {
          normalizedLine += FOUR_SPACES;
        }
        normalizedLine += removeLeadingWhitespace(line);
        normalizedCodeLines.push(normalizedLine);
      });
      return normalizedCodeLines.join('\n');
    },
    // A very naive approach to 'normalizing' the code is to strip out all
    // comments and whitespace. This normalization currently assumes Python.
    normalizePythonCode: function(code) {
      // TODO(sll): This does not correctly handle the case where '#' is
      // within quotes, or where it is escaped.
      // remove comments
      var strippedCode = code.replace(/#.*/g, '');
      // remove whitespace
      return strippedCode.replace(/\s+/g, '');
    }
  };
}]);

oppia.factory('codeReplRulesService', [
    '$filter', 'codeReplNormalizationService',
    function($filter, codeReplNormalizationService) {
  return {
    CodeEquals: function(answer, inputs) {
      var normalizedCode =
        codeReplNormalizationService.getNormalizedCode(answer.code);
      var normalizedExpectedCode =
        codeReplNormalizationService.getNormalizedCode(inputs.x);
      return normalizedCode == normalizedExpectedCode;
    },
    CodeContains: function(answer, inputs) {
      var normalizedCode =
        codeReplNormalizationService.getNormalizedCode(answer.code);
      var normalizedSnippet =
        codeReplNormalizationService.getNormalizedCode(inputs.x);
      return normalizedCode.indexOf(normalizedSnippet) != -1;
    },
    CodeDoesNotContain: function(answer, inputs) {
      var normalizedCode =
        codeReplNormalizationService.getNormalizedCode(answer.code);
      var normalizedSnippet =
        codeReplNormalizationService.getNormalizedCode(inputs.x);
      return normalizedCode.indexOf(normalizedSnippet) == -1;
    },
    OutputEquals: function(answer, inputs) {
      var normalizedOutput = $filter('normalizeWhitespace')(answer.output);
      var normalizedExpectedOutput =
        $filter('normalizeWhitespace')(inputs.x);
      return normalizedOutput == normalizedExpectedOutput;
    },
    ResultsInError: function(answer, inputs) {
      return !!(answer.error.trim());
    },
    ErrorContains: function(answer, inputs) {
      var normalizedError = $filter('normalizeWhitespace')(answer.error);
      var normalizedSnippet = $filter('normalizeWhitespace')(inputs.x);
      return normalizedError.indexOf(normalizedSnippet) != -1;
    },
    FuzzyMatches: function(answer, inputs) {
      // TODO(bhenning): This is where a third party library could be used to
      // intelligently normalize and compare different submissions of code.
      // Also, this should return a value between 0 and 1 depending on how
      // closely it matches the training data, rather than doing a crisp
      // comparison on stripped code.

      var code = codeReplNormalizationService.normalizePythonCode(answer.code);
      return inputs.training_data.some(function(possibility) {
        return codeReplNormalizationService.normalizePythonCode(
          possibility.code) == code;
      });
    }
  };
}]);
