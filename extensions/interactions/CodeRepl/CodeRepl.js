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
 * Directive for the CodeRepl interactive widget.
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
      templateUrl: 'interactiveWidget/CodeRepl',
      controller:  ['$scope', '$attrs', function($scope, $attrs) {
        $scope.language = oppiaHtmlEscaper.escapedJsonToObj($attrs.languageWithValue);
        $scope.placeholder = oppiaHtmlEscaper.escapedJsonToObj($attrs.placeholderWithValue);
        $scope.preCode = oppiaHtmlEscaper.escapedJsonToObj($attrs.preCodeWithValue);
        $scope.postCode = oppiaHtmlEscaper.escapedJsonToObj($attrs.postCodeWithValue);

        $scope.hasLoaded = false;

        // Keep the code string given by the user and the stdout from the evaluation
        // until sending them back to the server.
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
        };


        // Set up the jsrepl instance with callbacks set.
        var jsrepl = new JSREPL({
          output: function(out) {
            // For successful evaluation, this is called before 'result', so just keep
            // the output string here.
            $scope.output = out;
          },
          result: function(res) {
            $scope.sendResponse(res, '');
          },
          error: function(err) {
            var err = '';
            if ($scope.output) {
              // Part of the error message can be in the output string.
              err += $scope.output;
              $scope.output = '';
            }
            $scope.sendResponse('', err);
          },
          timeout: {
            time: 10000,
            callback: function() {
              $scope.sendResponse('', 'timeout');
            },
          },
        });

        jsrepl.loadLanguage($scope.language, function() {
          console.log('Code REPL widget initialized.');
          $scope.hasLoaded = true;
          $scope.$apply();
        });

        $scope.runCode = function(codeInput) {
          $scope.code = codeInput;
          $scope.output = '';

          // Running the code. This triggers one of the callbacks set to jsrepl which
          // then calls sendResponse with the result.
          var fullCode = $scope.preCode + '\n' + codeInput + '\n' + $scope.postCode;
          jsrepl.eval(fullCode);
        };

        $scope.sendResponse = function(evaluation, err) {
          $scope.evaluation = (evaluation || '');
          $scope.err = (err || '');
          $scope.$parent.$parent.submitAnswer({
            code: $scope.code || '',
            output: $scope.output,
            evaluation: $scope.evaluation,
            error: $scope.err
          }, 'submit');
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
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);
