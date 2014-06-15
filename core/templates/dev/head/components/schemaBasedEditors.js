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
 * @fileoverview Directives for schema-based object editors.
 *
 * @author sll@google.com (Sean Lip)
 */

// Service for retrieving parameter specifications.
oppia.factory('parameterSpecsService', ['$log', function($log) {
  var paramSpecs = {};

  return {
    addParamSpec: function(paramName, paramType) {
      if (['bool', 'unicode', 'float', 'int', 'unicode'].indexOf(paramType) === -1) {
        $log.error('Invalid parameter type: ' + paramType);
        return;
      }
      paramSpecs[paramName] = {type: paramType};
    },
    getParamType: function(paramName) {
      if (!paramSpecs.hasOwnProperty(paramName)) {
        $log.error('No parameter with name ' + paramName + ' found.');
        return null;
      }
      return paramSpecs[paramName].type;
    },
    getAllParamsOfType: function(paramType) {
      var names = [];
      for (var paramName in paramSpecs) {
        if (paramSpecs[paramName].type === paramType) {
          names.push(paramName);
        }
      }
      return names.sort();
    }
  };
}]);

oppia.filter('convertHtmlToUnicode', [function() {
  return function(html) {
    return angular.element('<div>' + html + '</div>').text();
  };
}]);

// <oppia-parameter>name</oppia-parameter> tags are converted to {{name}}.
// '{' characters are converted to '\{'.
oppia.filter('convertHtmlWithParamsToUnicode', ['$filter', function($filter) {
  return function(html) {
    var decodeAndEscapeOpeningBraces = function(str) {
      return ($filter('convertHtmlToUnicode')(str)).split('{').join('\\{');
    };

    var PARAM_OPENING_TAG = '<oppia-parameter>';
    var PARAM_CLOSING_TAG = '</oppia-parameter>';

    var returnValue = '';
    while (html.indexOf(PARAM_OPENING_TAG) !== -1) {
      var i = html.indexOf(PARAM_OPENING_TAG);
      returnValue += decodeAndEscapeOpeningBraces(html.substring(0, i));
      html = html.substring(i);

      var j = html.indexOf(PARAM_CLOSING_TAG);
      returnValue += '{{' + html.substring(PARAM_OPENING_TAG.length, j) + '}}';
      html = html.substring(j + PARAM_CLOSING_TAG.length);
    }
    returnValue += decodeAndEscapeOpeningBraces(html);
    return returnValue;
  };
}]);

oppia.filter('convertUnicodeToHtml', ['oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
  return function(text) {
    return oppiaHtmlEscaper.unescapedStrToEscapedStr(text);
  };
}]);

oppia.filter('convertUnicodeWithParamsToHtml', ['$filter', function($filter) {
  // '\{' characters are converted to '{'.
  // {{name}} is converted to <oppia-parameter> tags.
  return function(text) {
    var unescapeOpeningBracesAndEncode = function(str) {
      return ($filter('convertUnicodeToHtml')(str)).split('\\{\\').join('{');
    };

    var PARAM_OPENING_TAG = '{{';
    var PARAM_CLOSING_TAG = '}}';

    text = text.split('\\{').join('\\{\\');

    var returnValue = '';
    while (text.indexOf(PARAM_OPENING_TAG) !== -1) {
      var i = text.indexOf(PARAM_OPENING_TAG);
      returnValue += unescapeOpeningBracesAndEncode(text.substring(0, i));
      text = text.substring(i);

      var j = text.indexOf(PARAM_CLOSING_TAG);
      returnValue += '<oppia-parameter>' + text.substring(PARAM_OPENING_TAG.length, j) + '</oppia-parameter>';
      text = text.substring(j + PARAM_CLOSING_TAG.length);
    }
    returnValue += unescapeOpeningBracesAndEncode(text);
    return returnValue;
  };
}]);


oppia.directive('parameterEditor', ['$modal', '$log', function($modal, $log) {
    return {
      restrict: 'E',
      scope: {outerValue: '='},
      template: (
        '<div class="row">' +
        '  <div class="col-lg-11 col-md-11 col-sm-11">' +
        '    <textarea ng-disabled="!hasFullyLoaded"></textarea>' +
        '  </div>' +
        '  <div class="col-lg-1 col-md-1 col-sm-1">' +
        '    <button ng-click="addParameter()" ng-disabled="!doUnicodeParamsExist()">P</button>' +
        '  </div>' +
        '</div>'),
      controller: [
          '$scope', '$element', '$attrs', '$filter', '$timeout', 'parameterSpecsService',
          function($scope, $element, $attrs, $filter, $timeout, parameterSpecsService) {
        var rteNode = $element[0].children[0].children[0].children[0];

        // A pointer to the editorDoc in the RTE iframe. Populated when the RTE
        // is initialized.
        $scope.editorDoc = null;
        $scope.hasFullyLoaded = false;

        // This is a bit silly. It appears that in contenteditables (in Chrome, anyway)
        // the cursor will stubbornly remain within the oppia-parameter element (even
        // though it should be outside it). However the behavior is correct
        // for images -- so we use images to delimit it. It's still hard to do
        // selection before the element if it's the first thing in the doc,
        // after the element if it's the last thing in the doc, or between two
        // consecutive elements. See this bug for a demonstration:
        //
        //     https://code.google.com/p/chromium/issues/detail?id=242110
        var INVISIBLE_IMAGE_TAG = (
          '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="></img>');

        $scope._createRteElement = function(paramName) {
          var el = $(
            '<oppia-parameter contenteditable="false">' +
            INVISIBLE_IMAGE_TAG +
            paramName +
            INVISIBLE_IMAGE_TAG +
            '</oppia-parameter>');

          var domNode = el.get(0);
          // This dblclick handler is stripped in the initial HTML --> RTE conversion,
          // so it needs to be reinstituted after the jwysiwyg iframe is loaded.
          domNode.ondblclick = function() {
            el.addClass('insertionPoint');
            $scope.getParamModal(paramName);
          };

          return domNode;
        };

        // Convert a unicode string into its RTE representation, and add spaces
        // at the beginning and end of each oppia-parameter element.
        $scope._convertUnicodeToRte = function(str) {
          var html = $filter('convertUnicodeWithParamsToHtml')(str);

          var elt = $('<div>' + html + '</div>');
          elt.find('oppia-parameter').replaceWith(function() {
            return [
              $scope._createRteElement(this.textContent)
            ];
          });
          return elt.html();
        };

        // Convert an RTE representation into a unicode string by removing all
        // insertion points and replacing <oppia-parameter> tags with {{...}}.
        $scope._convertRteToUnicode = function(rte) {
          var elt = $('<div>' + rte + '</div>');
          elt.find('oppia-parameter').replaceWith(function() {
            var jQueryElt = $('<oppia-parameter/>').text(this.textContent);
            return jQueryElt.get(0);
          });
          elt.find('span').replaceWith(function() {
            return '';
          });
          return $filter('convertHtmlWithParamsToUnicode')(elt.html());
        };

        $scope._saveContent = function() {
          var content = $(rteNode).wysiwyg('getContent');
          if (content !== null && content !== undefined) {
            $scope.outerValue = $scope._convertRteToUnicode(content);
            // The following $timeout removes the '$apply in progress' errors.
            $timeout(function() {
              $scope.$apply();
            });
          }
        };

        $scope.getParamModal = function(currentParamName) {
          return $modal.open({
            templateUrl: 'modals/editParamName',
            backdrop: 'static',
            resolve: {
              currentParamName: function() {
                return currentParamName;
              }
            },
            controller: [
              '$scope', '$modalInstance', 'currentParamName', 'parameterSpecsService',
              function($scope, $modalInstance, currentParamName, parameterSpecsService) {
                $scope.currentParamName = currentParamName;

                var allowedParamNames = parameterSpecsService.getAllParamsOfType('unicode');
                $scope.paramOptions = allowedParamNames.map(function(paramName) {
                  return {
                    name: paramName,
                    value: paramName
                  };
                });

                $scope.cancel = function() {
                  $modalInstance.dismiss('cancel');
                };

                $scope.save = function(paramName) {
                  $modalInstance.close(paramName);
                };
              }
            ]
          }).result.then(function(paramName) {
            var el = $scope._createRteElement(paramName);
            var insertionPoint = $scope.editorDoc.querySelector('.insertionPoint');
            $(insertionPoint).replaceWith(el);
            $(rteNode).wysiwyg('save');
          }, function() {
            var insertionPoint = $scope.editorDoc.querySelector('.insertionPoint');
            if (insertionPoint.localName === 'span') {
              insertionPoint.parentNode.removeChild(insertionPoint);
            } else {
              insertionPoint.className = insertionPoint.className.replace(
                /\binsertionPoint\b/, '');
            }
          });
        };

        $scope.init = function() {
          $scope.rteContent = $scope._convertUnicodeToRte($scope.outerValue);
          // Disable jquery.ui.dialog (just in case).
          $.fn.dialog = null;

          $(rteNode).wysiwyg({
            autoGrow: true,
            autoSave: true,
            controls: {},
            css: '/css/rte.css',
            debug: true,
            events: {
              // Prevent use of keyboard shortcuts for bold, italics, etc.
              keydown: function(e) {
                var vKey = 86, cKey = 67, zKey = 90;
                if (e.ctrlKey) {
                  if (e.keyCode !== vKey && e.keyCode !== cKey && e.keyCode !== zKey) {
                    e.preventDefault();
                  }
                }
                // Disable the enter key. Contenteditable does not seem to support
                // deletion of newlines. Also disable the tab key.
                if (e.keyCode === 13 || e.keyCode === 9) {
                  e.preventDefault();
                }
              },
              save: function(e) {
                $scope._saveContent();
              }
            },
            iFrameClass: 'wysiwyg-content',
            initialContent: $scope.rteContent,
            maxHeight: 30,
            rmUnusedControls: true
          });

          $scope.addParameter = function() {
            var doc = $(rteNode).wysiwyg('document').get(0);
            $(rteNode).wysiwyg(
              'insertHtml', '<span class="insertionPoint"></span>');
            var allowedParamNames = parameterSpecsService.getAllParamsOfType('unicode');
            if (allowedParamNames.length) {
              $scope.getParamModal(allowedParamNames[0]);
            }
          };

          $scope.doUnicodeParamsExist = function() {
            return parameterSpecsService.getAllParamsOfType('unicode').length > 0;
          };

          $scope.editorDoc = $(rteNode).wysiwyg('document')[0].body;

          // Add dblclick handlers to the various nodes.
          var elts = Array.prototype.slice.call(
            $scope.editorDoc.querySelectorAll('oppia-parameter'));
          elts.forEach(function(elt) {
            elt.ondblclick = function() {
              $(elt).addClass('insertionPoint');
              $scope.getParamModal($(elt).text());
            };
          });

          $scope.hasFullyLoaded = true;
        };

        $scope.init();
      }]
    };
  }
]);

oppia.factory('schemaDefaultValueService', [function() {
  return {
    // TODO(sll): Rewrite this to take into account post_normalizers, so that
    // we always start with a valid value.
    getDefaultValue: function(schema) {
      if (schema.type === 'bool') {
        return false;
      } else if (schema.type === 'unicode' || schema.type === 'html') {
        return '';
      } else if (schema.type === 'list') {
        return [];
      } else if (schema.type === 'dict') {
        return {};
      } else {
        console.error('Invalid schema type: ' + schema.type);
      }
    }
  };
}]);


oppia.filter('requireIsFloat', [function() {
  return function(input) {
    var FLOAT_REGEXP = /^\-?\d*((\.|\,)\d+)?$/;
    if (!FLOAT_REGEXP.test(input)) {
      return undefined;
    }

    return (typeof input === 'number') ? input : parseFloat(
      input.replace(',', '.'));
  };
}]);


// The names of these filters must correspond to the names of the backend post-
// normalizers (with underscores converted to camelcase).
// WARNING: These filters do not validate the arguments supplied with the
// post-normalizer definitions in the schema; these are assumed to be correct.
oppia.filter('requireAtLeast', [function() {
  return function(input, args) {
    return (input >= args.minValue) ? input : undefined;
  };
}]);


oppia.filter('requireAtMost', [function() {
  return function(input, args) {
    return (input <= args.maxValue) ? input : undefined;
  };
}]);


oppia.filter('requireIsOneOf', [function() {
  return function(input, args) {
    return args.choices.indexOf(input) !== -1 ? input : undefined;
  };
}]);


oppia.filter('requireNonempty', [function() {
  return function(input) {
    return input ? input : undefined;
  };
}]);


oppia.directive('validateWithPostNormalizers', ['$filter', function($filter) {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {
      // Add normalizers in reverse order.
      if (scope.postNormalizers()) {
        scope.postNormalizers().forEach(function(normalizerSpec) {
          var frontendName = $filter('underscoresToCamelCase')(normalizerSpec.id);

          // Note that there may not be a corresponding frontend filter for
          // each backend normalizer.
          try {
            $filter(frontendName);
          } catch(err) {
            return;
          }

          var filterArgs = {};
          for (key in normalizerSpec) {
            if (key !== 'id') {
              filterArgs[$filter('underscoresToCamelCase')(key)] = angular.copy(
                normalizerSpec[key]);
            }
          }

          var customValidator = function(viewValue) {
            var filteredValue = $filter(frontendName)(viewValue, filterArgs);
            ctrl.$setValidity(frontendName, filteredValue !== undefined);
            return filteredValue;
          };

          ctrl.$parsers.unshift(customValidator);
          ctrl.$formatters.unshift(customValidator);
        });
      }
    }
  };
}]);

// This should come after validate-with-post-normalizers, if that is defined as
// an attribute on the HTML tag.
oppia.directive('addFloatValidation', ['$filter', function($filter) {
  var FLOAT_REGEXP = /^\-?\d*((\.|\,)\d+)?$/;
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {
      var floatValidator = function(viewValue) {
        var filteredValue = $filter('requireIsFloat')(viewValue);
        ctrl.$setValidity('requireIsFloat', filteredValue !== undefined);
        return filteredValue;
      };

      ctrl.$parsers.unshift(floatValidator);
      ctrl.$formatters.unshift(floatValidator);
    }
  };
}]);

// Prevents timeouts due to recursion in nested directives. See:
//
//   http://stackoverflow.com/questions/14430655/recursion-in-angular-directives
oppia.factory('recursionHelper', ['$compile', function($compile){
  return {
    /**
     * Manually compiles the element, fixing the recursion loop.
     * @param element
     * @param [link] A post-link function, or an object with function(s)
     *     registered via pre and post properties.
     * @returns An object containing the linking functions.
     */
    compile: function(element, link){
      // Normalize the link parameter
      if (angular.isFunction(link)) {
        link = {post: link};
      }

      // Break the recursion loop by removing the contents,
      var contents = element.contents().remove();
      var compiledContents;
      return {
        pre: (link && link.pre) ? link.pre : null,
        post: function(scope, element){
          // Compile the contents.
          if (!compiledContents) {
              compiledContents = $compile(contents);
          }
          // Re-add the compiled contents to the element.
          compiledContents(scope, function(clone) {
              element.append(clone);
          });

          // Call the post-linking function, if any.
          if (link && link.post) {
            link.post.apply(null, arguments);
          }
        }
      };
    }
  };
}]);

oppia.directive('schemaBasedEditor', ['recursionHelper', function(recursionHelper) {
  return {
    scope: {
      definition: '=',
      isEditable: '&',
      savedValue: '='
    },
    templateUrl: 'schemaBasedEditor/entryPoint',
    restrict: 'E',
    compile: recursionHelper.compile,
    controller: ['$scope', function($scope) {
      $scope.$watch('savedValue', function(newValue, oldValue) {
        $scope.localValue = angular.copy($scope.savedValue);
      });

      $scope.submitValue = function(value) {
        $scope.savedValue = angular.copy($scope.localValue);
        alert($scope.savedValue);
      };
      $scope.cancelEdit = function() {
        $scope.localValue = angular.copy($scope.savedValue);
      };
    }]
  };
}]);

oppia.directive('schemaBuilder', [function() {
  return {
    scope: {
      schema: '&',
      isEditable: '&',
      localValue: '='
    },
    templateUrl: 'schemaBasedEditor/master',
    restrict: 'E'
  };
}]);

oppia.directive('schemaBasedBoolEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      allowParameters: '&'
    },
    templateUrl: 'schemaBasedEditor/bool',
    restrict: 'E',
    controller: ['$scope', 'parameterSpecsService', function($scope, parameterSpecsService) {
      $scope.boolEditorOptions = [{
        name: 'True',
        value: {
          type: 'raw',
          data: true
        }
      }, {
        name: 'False',
        value: {
          type: 'raw',
          data: false
        }
      }];

      if ($scope.allowParameters()) {
        var paramNames = parameterSpecsService.getAllParamsOfType('bool');
        paramNames.forEach(function(paramName) {
          $scope.boolEditorOptions.push({
            name: '[Parameter] ' + paramName,
            value: {
              type: 'parameter',
              data: paramName
            }
          });
        });
      }

      $scope.$watch('localValue', function(newValue, oldValue) {
        // Because JS objects are passed by reference, the current value needs
        // to be set manually to an object in the list of options.
        $scope.boolEditorOptions.forEach(function(option) {
          if (angular.equals(option.value, newValue)) {
            $scope.localValue = option.value;
          }
        });
      });
    }]
  };
}]);

oppia.directive('schemaBasedFloatEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      allowParameters: '&',
      postNormalizers: '&'
    },
    templateUrl: 'schemaBasedEditor/float',
    restrict: 'E',
    controller: ['$scope', 'parameterSpecsService', function($scope, parameterSpecsService) {
      $scope.editAsParameter = false;

      if ($scope.allowParameters()) {
        var paramNames = parameterSpecsService.getAllParamsOfType('float');
        if (paramNames.length) {
          $scope.paramNameOptions = paramNames.map(function(paramName) {
            return {
              name: paramName,
              value: {
                type: 'parameter',
                data: paramName
              }
            };
          });

          $scope.$watch('localValue', function(newValue, oldValue) {
            $scope.editAsParameter = (newValue.type === 'parameter');
            // Because JS objects are passed by reference, the current value needs
            // to be set manually to an object in the list of options.
            if ($scope.localValue.type === 'parameter') {
              $scope.paramNameOptions.forEach(function(option) {
                if (angular.equals(option.value, newValue)) {
                  $scope.localValue = option.value;
                }
              });
            }
          });

          $scope.toggleEditMode = function() {
            $scope.editAsParameter = !$scope.editAsParameter;
            $scope.localValue = $scope.editAsParameter ? {
              type: 'parameter',
              data: paramNames[0]
            } : {
              type: 'raw',
              data: 0.0
            };
          };
        }
      }
    }]
  };
}]);

oppia.directive('schemaBasedIntEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      allowParameters: '&'
    },
    templateUrl: 'schemaBasedEditor/int',
    restrict: 'E',
    controller: ['$scope', 'parameterSpecsService', function($scope, parameterSpecsService) {
      $scope.editAsParameter = false;

      if ($scope.allowParameters()) {
        var paramNames = parameterSpecsService.getAllParamsOfType('int');
        if (paramNames.length) {
          $scope.paramNameOptions = paramNames.map(function(paramName) {
            return {
              name: paramName,
              value: {
                type: 'parameter',
                data: paramName
              }
            };
          });

          $scope.$watch('localValue', function(newValue, oldValue) {
            $scope.editAsParameter = (newValue.type === 'parameter');
            // Because JS objects are passed by reference, the current value needs
            // to be set manually to an object in the list of options.
            if ($scope.localValue.type === 'parameter') {
              $scope.paramNameOptions.forEach(function(option) {
                if (angular.equals(option.value, newValue)) {
                  $scope.localValue = option.value;
                }
              });
            }
          });

          $scope.toggleEditMode = function() {
            $scope.editAsParameter = !$scope.editAsParameter;
            $scope.localValue = $scope.editAsParameter ? {
              type: 'parameter',
              data: paramNames[0]
            } : {
              type: 'raw',
              data: 0
            };
          };
        }
      }
    }]
  };
}]);

oppia.directive('schemaBasedUnicodeEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      postNormalizers: '&'
    },
    templateUrl: 'schemaBasedEditor/unicode',
    restrict: 'E'
  };
}]);

// TODO(sll): The 'Cancel' button should revert the text in the HTML box to its
// original state.
// TODO(sll): The noninteractive widgets in the RTE do not work.
oppia.directive('schemaBasedHtmlEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&'
    },
    templateUrl: 'schemaBasedEditor/html',
    restrict: 'E'
  };
}]);

oppia.directive('schemaBasedListEditor', [
    'schemaDefaultValueService', 'recursionHelper',
    function(schemaDefaultValueService, recursionHelper) {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      // Read-only property. The schema definition for each item in the list.
      itemSchema: '&'
    },
    templateUrl: 'schemaBasedEditor/list',
    restrict: 'E',
    compile: recursionHelper.compile,
    controller: ['$scope', function($scope) {
      $scope.addElement = function() {
        $scope.localValue.push(
          schemaDefaultValueService.getDefaultValue($scope.itemSchema()));
      };

      $scope.deleteElement = function(index) {
        $scope.localValue.splice(index, 1);
      };
    }]
  };
}]);

oppia.directive('schemaBasedDictEditor', ['recursionHelper', function(recursionHelper) {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      // Read-only property. An object whose keys and values are the dict
      // properties and the corresponding schemas.
      propertySchemas: '&'
    },
    templateUrl: 'schemaBasedEditor/dict',
    restrict: 'E',
    compile: recursionHelper.compile
  };
}]);
