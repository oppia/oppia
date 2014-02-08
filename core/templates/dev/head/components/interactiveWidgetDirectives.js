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
 * @fileoverview Directives supporting non-interactive widgets.
 *
 * @author sll@google.com (Sean Lip)
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

var WIDGET_TEMPLATE_URL_PREFIX = '/widgettemplate/interactive/';


oppia.directive('oppiaInteractiveCodeRepl', [
  'oppiaHtmlEscaper', '$compile', function(oppiaHtmlEscaper, $compile) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: WIDGET_TEMPLATE_URL_PREFIX + 'CodeRepl',
      controller: function($scope, $attrs) {
        $scope.language = oppiaHtmlEscaper.escapedJsonToObj($attrs.languageWithValue);
        $scope.placeholder = oppiaHtmlEscaper.escapedJsonToObj($attrs.placeholderWithValue);
        $scope.preCode = oppiaHtmlEscaper.escapedJsonToObj($attrs.preCodeWithValue);
        $scope.postCode = oppiaHtmlEscaper.escapedJsonToObj($attrs.postCodeWithValue);

        $scope.hasLoaded = false;

        // Keep the code string given by the user and the stdout from the evaluation
        // until sending them back to the server.
        $scope.code = ($scope.placeholder || '');
        $scope.output = '';

        // Options for the ui-codemirror display.
        $scope.codemirrorOptions = {
          lineNumbers: true,
          indentWithTabs: true,
          // Note that only 'coffeescript', 'javascript', 'lua', 'python', 'ruby' and
          // 'scheme' have CodeMirror-supported syntax highlighting. For other
          // languages, syntax highlighting will not happen.
          mode: $scope.language
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
          // Initialization done. Allow submit.
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
            code: $scope.code,
            output: $scope.output,
            evaluation: $scope.evaluation,
            error: $scope.err
          }, 'submit');
        };
      }
    };
  }
]);


oppia.directive('oppiaInteractiveContinue', [
  'oppiaHtmlEscaper', '$compile', function(oppiaHtmlEscaper, $compile) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: WIDGET_TEMPLATE_URL_PREFIX + 'Continue',
      controller: function($scope, $attrs) {
        $scope.buttonText = oppiaHtmlEscaper.escapedJsonToObj($attrs.buttonTextWithValue);

        $scope.submitAnswer = function() {
          $scope.$parent.$parent.submitAnswer('', 'submit');
        };
      }
    };
  }
]);


oppia.directive('oppiaInteractiveFileReadInput', [
  'oppiaHtmlEscaper', '$compile', function(oppiaHtmlEscaper, $compile) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: WIDGET_TEMPLATE_URL_PREFIX + 'FileReadInput',
      controller: function($scope, $attrs) {
        $scope.answer = '';

        $scope.submitAnswer = function(el) {
          var theFile = el.files[0];

          if (theFile.size === 0) {
            alert('Please choose a non-empty file.');
            return;
          }
          if (theFile.size >= 1000) {
            alert('File too large. Please choose a file smaller than 1 kilobyte.');
            return;
          }

          var form = new FormData();
          form.append('file', theFile);

          $.ajax({
            url: '/filereadhandler',
            data: form,
            processData: false,
            contentType: false,
            type: 'POST',
            datatype: 'json',
            success: function(data) {
              var answer = data['base64_file_content'];
              if (!answer) {
                alert("An error occurred while processing your input.");
                return;
              }
              $scope.$parent.$parent.submitAnswer(answer, 'submit');
            }
          });
        };
      }
    };
  }
]);


oppia.directive('oppiaInteractiveInteractiveMap', [
  'oppiaHtmlEscaper', '$compile', function(oppiaHtmlEscaper, $compile) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: WIDGET_TEMPLATE_URL_PREFIX + 'InteractiveMap',
      controller: function($scope, $attrs, $element) {
        $scope.coords = [
          oppiaHtmlEscaper.escapedJsonToObj($attrs.latitudeWithValue),
          oppiaHtmlEscaper.escapedJsonToObj($attrs.longitudeWithValue)];
        $scope.zoom = oppiaHtmlEscaper.escapedJsonToObj($attrs.zoomWithValue);

        $scope.mapMarkers = [];

        var coords = $scope.coords || [0, 0];
        var zoom_level = parseInt($scope.zoom, 10) || 0;
        $scope.mapOptions = {
          center: new google.maps.LatLng(coords[0], coords[1]),
          zoom: zoom_level,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        $scope.registerClick = function($event, $params) {
          var ll = $params[0].latLng;
          $scope.mapMarkers.push(new google.maps.Marker({
            map: $scope.map,
            position: ll
          }));

          $scope.$parent.$parent.submitAnswer(ll.lat() + ',' + ll.lng(), 'submit');
        };
      }
    };
  }
]);


oppia.directive('oppiaInteractiveMultipleChoiceInput', [
  'oppiaHtmlEscaper', '$compile', function(oppiaHtmlEscaper, $compile) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: WIDGET_TEMPLATE_URL_PREFIX + 'MultipleChoiceInput',
      controller: function($scope, $attrs) {
        $scope.choices = oppiaHtmlEscaper.escapedJsonToObj($attrs.choicesWithValue);

        $scope.submitAnswer = function(answer) {
          if (!answer) {
            return;
          }
          $scope.$parent.$parent.submitAnswer(answer, 'submit');
        };
      }
    };
  }
]);


oppia.directive('oppiaInteractiveNumericInput', [
  'oppiaHtmlEscaper', '$compile', function(oppiaHtmlEscaper, $compile) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: WIDGET_TEMPLATE_URL_PREFIX + 'NumericInput',
      controller: function($scope, $attrs) {
        $scope.submitAnswer = function(answer) {
          $scope.$parent.$parent.submitAnswer(answer, 'submit');
        };
      }
    };
  }
]);


oppia.directive('oppiaInteractiveSetInput', [
  'oppiaHtmlEscaper', '$compile', function(oppiaHtmlEscaper, $compile) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: WIDGET_TEMPLATE_URL_PREFIX + 'SetInput',
      controller: function($scope, $attrs) {
        $scope.answer = [];

        $scope.addElement = function(newElement) {
          if (newElement !== 0 && !newElement) {
            return;
          }
          $scope.answer.push(newElement);
          $scope.newElement = '';
          $scope.$parent.$parent.adjustPageHeight(false);
        };

        $scope.deleteElement = function(index) {
          $scope.answer.splice(index, 1);
        };

        $scope.submitAnswer = function(answer) {
          $scope.$parent.$parent.submitAnswer(answer, 'submit');
        };
      }
    };
  }
]);


oppia.directive('oppiaInteractiveTarFileReadInput', [
  'oppiaHtmlEscaper', '$compile', function(oppiaHtmlEscaper, $compile) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: WIDGET_TEMPLATE_URL_PREFIX + 'TarFileReadInput',
      controller: function($scope, $attrs) {
        $scope.answer = '';
        $scope.filename = '';

        $scope.submitAnswer = function(el) {
          var theFile = el.files[0];

          if (theFile.size === 0) {
            alert('Please choose a non-empty file.');
            return;
          }
          if (theFile.size >= 1000) {
            alert('File too large. Please choose a file smaller than 1 kilobyte.');
            return;
          }

          var form = new FormData();
          form.append('file', theFile);

          $scope.filename = theFile.name;
          // The call to $scope.$apply() is needed because $scope.filename does not
          // update automatically in the HTML template.
          $scope.$apply();
          $('#processing-modal').modal('show');

          $.ajax({
            url: '/filereadhandler',
            data: form,
            processData: false,
            contentType: false,
            type: 'POST',
            datatype: 'json',
            success: function(data) {
              console.log(data);
              var answer = data['base64_file_content'];
              if (!answer) {
                alert('An error occurred while processing your input.');
                return;
              }
              $scope.$parent.$parent.submitAnswer(answer, 'submit');
            }
          });
        };
      }
    };
  }
]);


oppia.directive('oppiaInteractiveTextInput', [
  'oppiaHtmlEscaper', '$compile', function(oppiaHtmlEscaper, $compile) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: WIDGET_TEMPLATE_URL_PREFIX + 'TextInput',
      controller: function($scope, $attrs) {
        $scope.placeholder = oppiaHtmlEscaper.escapedJsonToObj($attrs.placeholderWithValue);
        $scope.rows = oppiaHtmlEscaper.escapedJsonToObj($attrs.rowsWithValue);
        $scope.columns = oppiaHtmlEscaper.escapedJsonToObj($attrs.columnsWithValue);

        $scope.answer = '';

        $scope.submitAnswer = function(answer) {
          if (!answer) {
            return;
          }

          $scope.$parent.$parent.submitAnswer(answer, 'submit');
        };
      }
    };
  }
]);
