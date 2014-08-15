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
 * @fileoverview Directives for schema-based form builders.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.run(function($rootScope) {
  $rootScope.FORM_BUILDER_MODES = {
    READONLY: 'readonly',
    DISABLED: 'disabled',
    ENABLED: 'enabled'
  };
});

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

// Escapes the {, } and \ characters, and then converts
// <oppia-parameter>name</oppia-parameter> tags to {{name}}.
oppia.filter('convertHtmlWithParamsToUnicode', ['$filter', function($filter) {
  var escapeSpecialChars = function(str) {
    // Note that order is important here! Backslashes must be replaced before
    // the others, since doing either of the others first may give rise to
    // extra backslashes.
    return ($filter('convertHtmlToUnicode')(str))
      .replace(/([\\\{\}])/g, '\\$1')
  };

  var PARAM_OPENING_TAG = '<oppia-parameter>';
  var PARAM_CLOSING_TAG = '</oppia-parameter>';

  return function(html) {
    return html.split(PARAM_OPENING_TAG).map(function(value) {
      return value.split(PARAM_CLOSING_TAG).map(function(value2) {
        return escapeSpecialChars(value2);
      }).join('}}');
    }).join('{{');
  };
}]);

oppia.filter('convertUnicodeToHtml', ['$sanitize', 'oppiaHtmlEscaper', function($sanitize, oppiaHtmlEscaper) {
  return function(text) {
    return $sanitize(oppiaHtmlEscaper.unescapedStrToEscapedStr(text));
  };
}]);

// Converts {{name}} substrings to <oppia-parameter>name</oppia-parameter> tags
// and unescapes the {, } and \ characters. This is done by reading the given
// string from left to right: if we see a backslash, we use the following
// character; if we see a '{{', this is the start of a parameter; if
// we see a '}}'; this is the end of a parameter.
oppia.filter('convertUnicodeWithParamsToHtml', ['$filter', function($filter) {
  var assert = function(b) {
    if (!b) {
      throw 'Invalid unicode-string-with-parameters: ' + text;
    }
  };

  return function(text) {
    // The parsing here needs to be done with more care because we are replacing
    // two-character strings. We can't naively break by {{ because in strings
    // like \{{{ the second and third characters will be taken as the opening
    // brackets, which is wrong. We can't unescape characters because then the
    // { characters that remain will be ambiguous (they may either be the
    // openings of parameters or literal '{' characters entered by the user.
    // So we build a standard left-to-right parser which examines each
    // character of the string in turn, and processes it accordingly.
    var textFragments = [];
    var currentFragment = '';
    var currentFragmentIsParam = false;
    for (var i = 0; i < text.length; i++) {
      if (text[i] == '\\') {
        assert(
          !currentFragmentIsParam && text.length > i + 1 &&
          {'{': true, '}': true, '\\': true}[text[i + 1]]);
        currentFragment += text[i + 1];
        i++;
      } else if (text[i] === '{') {
        assert(text.length > i + 1 && !currentFragmentIsParam && text[i + 1] === '{');
        textFragments.push({
          type: 'text',
          data: currentFragment
        });
        currentFragment = '';
        currentFragmentIsParam = true;
        i++;
      } else if (text[i] === '}') {
        assert(text.length > i + 1 && currentFragmentIsParam && text[i + 1] === '}');
        textFragments.push({
          type: 'parameter',
          data: currentFragment
        });
        currentFragment = '';
        currentFragmentIsParam = false;
        i++;
      } else {
        currentFragment += text[i];
      }
    }

    assert(!currentFragmentIsParam);
    textFragments.push({
      type: 'text',
      data: currentFragment
    });

    var result = '';
    textFragments.forEach(function(fragment) {
      result += (
        fragment.type === 'text' ? $filter('convertUnicodeToHtml')(fragment.data) :
        '<oppia-parameter>' + fragment.data + '</oppia-parameter>');
    });
    return result;
  };
}]);


oppia.directive('unicodeWithParametersEditor', ['$modal', '$log', 'warningsData', function($modal, $log, warningsData) {
  return {
    restrict: 'E',
    scope: {
      allowedParameterNames: '&',
      localValue: '=',
      mode: '='
    },
    template: (
      '<div class="input-group">' +
      '  <textarea ng-disabled="!hasFullyLoaded"></textarea>' +
      '  <span class="input-group-btn">' +
      '    <button type="button" class="btn btn-default" ng-click="insertNewParameter()">+P</button>' +
      '  </span>' +
      '</div>'),
    controller: [
        '$scope', '$element', '$attrs', '$filter', '$timeout',
        function($scope, $element, $attrs, $filter, $timeout) {
      if (!$scope.allowedParameterNames().length) {
        console.error(
          'The unicode-with-parameters editor should not be used if there ' +
          'are no unicode parameters available.');
        return;
      }

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
      var PARAM_CONTAINER_CLASS = 'oppia-parameter-container';

      $scope._createRteParameterTag = function(paramName) {
        var el = $(
          '<span class="' + PARAM_CONTAINER_CLASS + '" contenteditable="false">' +
            INVISIBLE_IMAGE_TAG +
              '<oppia-parameter>' +
                paramName +
              '</oppia-parameter>' +
            INVISIBLE_IMAGE_TAG +
          '</span>');

        var domNode = el.get(0);
        domNode.ondblclick = function() {
          $scope.openEditParameterModal(paramName, domNode);
        };
        return domNode;
      };

      // Convert a unicode string into its RTE representation.
      $scope._convertUnicodeToRte = function(str) {
        var html = $filter('convertUnicodeWithParamsToHtml')(str);

        var elt = $('<div>' + html + '</div>');
        elt.find('oppia-parameter').replaceWith(function() {
          return $scope._createRteParameterTag(this.textContent)
        });
        return elt.html();
      };

      // Convert an RTE representation into a unicode string by removing all
      // insertion points and replacing <oppia-parameter> tags with {{...}}.
      $scope._convertRteToUnicode = function(rte) {
        var elt = $('<div>' + rte + '</div>');
        // Strip out all additional attributes and class names from the
        // <oppia-parameter> tag before conversion to a unicode string.
        elt.find('.' + PARAM_CONTAINER_CLASS).replaceWith(function() {
          return $('<oppia-parameter/>').text(this.textContent).get(0);
        });
        return $filter('convertHtmlWithParamsToUnicode')(elt.html());
      };

      var rteNode = $element[0].querySelector('textarea');

      // A pointer to the editorDoc in the RTE iframe. Populated when the RTE
      // is initialized.
      $scope.editorDoc = null;
      $scope.hasFullyLoaded = false;

      // If eltToReplace is null, a new element should be inserted at the
      // current caret.
      $scope.openEditParameterModal = function(currentParamName, eltToReplace) {
        return $modal.open({
          templateUrl: 'modals/editParamName',
          backdrop: 'static',
          resolve: {
            allowedParameterNames: function() {
              return $scope.allowedParameterNames();
            }
          },
          controller: ['$scope', '$modalInstance', 'allowedParameterNames', function(
              $scope, $modalInstance, allowedParameterNames) {
            $scope.currentParamName = currentParamName;
            $scope.paramOptions = allowedParameterNames.map(function(paramName) {
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
          }]
        }).result.then(function(paramName) {
          var el = $scope._createRteParameterTag(paramName);
          if (eltToReplace === null) {
            var doc = $(rteNode).wysiwyg('document').get(0);
            $(rteNode).wysiwyg(
              'insertHtml', '<span class="insertionPoint"></span>');
            eltToReplace = $scope.editorDoc.querySelector('.insertionPoint');
          }

          // Note that this removes the contenteditable="false" and ondblclick
          // attributes of el (but they are eventually replaced during the
          // normalization of the RTE content step). Also, we need to save the
          // change explicitly because the wysiwyg editor does not auto-detect
          // replaceWith() events.
          $(eltToReplace).replaceWith(el);
          $(rteNode).wysiwyg('save');
        });
      };

      $scope.insertNewParameter = function() {
        $scope.openEditParameterModal($scope.allowedParameterNames()[0], null);
      };

      var rteContentMemento = $scope._convertUnicodeToRte($scope.localValue);

      $scope._normalizeRteContent = function(content) {
        // TODO(sll): Write this method to validate rather than just normalize.

        // The only top-level tags should be oppia-parameter tags. Each of these
        // tags should have a contenteditable=false attribute, a dblclick handler
        // that opens the parameter modal, and content consisting of a valid
        // parameter name of type unicode surrounded by two invisible image
        // tags.
        var elt = $('<div>' + content + '</div>');
        elt.find('.' + PARAM_CONTAINER_CLASS).replaceWith(function() {
          return $scope._createRteParameterTag(this.textContent.trim())
        });
        return elt.html();
      };

      $scope.init = function() {
        $(rteNode).wysiwyg({
          autoGrow: true,
          autoSave: true,
          controls: {},
          css: '/css/rte.css',
          debug: true,
          events: {
            // Prevent dragging, since this causes weird things to happen when
            // a user selects text containing all or part of parameter tags and
            // then drags that text elsewhere.
            dragstart: function(e) {
              e.preventDefault();
            },
            // Prevent use of keyboard shortcuts for bold, italics, etc. Also
            // prevent pasting, newlines and tabbing.
            keydown: function(e) {
              var aKey = 65, cKey = 67, xKey = 88, zKey = 90;
              var vKey = 86;
              if (e.ctrlKey) {
                if (e.keyCode === 86) {
                  e.preventDefault();
                  alert('Pasting in string input fields is currently not supported. Sorry about that!');
                } else if (e.keyCode !== aKey && e.keyCode !== cKey && e.keyCode !== xKey && e.keyCode !== zKey) {
                  e.preventDefault();
                }
              }
              // Disable the enter key. Contenteditable does not seem to support
              // deletion of newlines. Also disable the tab key.
              if (e.keyCode === 13 || e.keyCode === 9) {
                e.preventDefault();
              }
            },
            paste: function(e) {
              e.preventDefault();
            },
            save: function(e) {
              var currentContent = $(rteNode).wysiwyg('getContent');
              if (currentContent === null || currentContent === undefined) {
                return;
              }

              // Normalize the new content. If a validation error occurs,
              // revert to the memento, and update the external and internal
              // values. Otherwise, update the external and internal values
              // with the normalized content, and update the memento as well.
              var normalizedContent = '';
              try {
                normalizedContent = $scope._normalizeRteContent(currentContent);
              } catch(unusedException) {
                console.error('Error parsing RTE content: ' + currentContent);
                normalizedContent = rteContentMemento;
              }

              if (normalizedContent !== currentContent) {
                $(rteNode).wysiwyg('setContent', normalizedContent);
              }

              // Update the external value. The $timeout removes the '$apply in
              // progress' errors which get triggered if a parameter was edited.
              $timeout(function() {
                $scope.$apply(function() {
                  $scope.localValue = $scope._convertRteToUnicode(normalizedContent);
                });
              });

              // Update the memento.
              rteContentMemento = normalizedContent;
            }
          },
          iFrameClass: 'wysiwyg-content',
          initialContent: rteContentMemento,
          maxHeight: 30,
          rmUnusedControls: true
        });

        $scope.editorDoc = $(rteNode).wysiwyg('document')[0].body;

        // Add dblclick handlers to the various nodes, since they get stripped
        // in the initialization.
        var elts = Array.prototype.slice.call(
          $scope.editorDoc.querySelectorAll('.' + PARAM_CONTAINER_CLASS));
        elts.forEach(function(elt) {
          elt.ondblclick = function() {
            $scope.openEditParameterModal($(elt).text(), elt);
          };
        });

        $scope.hasFullyLoaded = true;
      };

      $scope.init();

      // TODO(sll): If two RTEs share the same data source, and one RTE saves
      // a change to the data, the other RTE should be updated. However, if we
      // just place a $scope.$watch on the data source, then typing in a single
      // RTE is going to call that method, and this will replace the content of
      // the RTE -- which is normally not an issue, but in this case it
      // moves the cursor back to the beginning of the doc and frustrates the
      // user. We should find a solution for this -- although it probably is
      // not a common use case to have multiple unicode RTEs referencing the
      // same data source, there is a problem in that although the Cancel
      // button does update the data model, it does not update the appearance
      // of the RTE.
    }]
  };
}]);

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
      mode: '=',
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
      mode: '=',
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
      mode: '=',
      allowParameters: '&'
    },
    templateUrl: 'schemaBasedEditor/bool',
    restrict: 'E',
    controller: ['$scope', 'parameterSpecsService', function($scope, parameterSpecsService) {
      $scope.editAsParameter = angular.isString($scope.localValue);

      $scope.boolEditorOptions = [{
        name: 'True',
        value: true
      }, {
        name: 'False',
        value: false
      }];

      if ($scope.allowParameters()) {
        var paramNames = parameterSpecsService.getAllParamsOfType('bool');
        paramNames.forEach(function(paramName) {
          $scope.boolEditorOptions.push({
            name: '[Parameter] ' + paramName,
            value: paramName
          });
        });
      }

      $scope.$watch('localValue', function(newValue, oldValue) {
        // Because JS objects are passed by reference, the current value needs
        // to be set manually to an object in the list of options.
        $scope.boolEditorOptions.forEach(function(option) {
          if (angular.equals(option.value, newValue)) {
            $scope.localValue = option.value;
            $scope.editAsParameter = angular.isString($scope.localValue);
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
      // The mode in which to display the form. Should be treated as read-only.
      mode: '=',
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
              value: paramName
            };
          });

          $scope.$watch('localValue', function(newValue, oldValue) {
            $scope.editAsParameter = angular.isString(newValue);
            // Because JS objects are passed by reference, the current value needs
            // to be set manually to an object in the list of options.
            if ($scope.editAsParameter) {
              $scope.paramNameOptions.forEach(function(option) {
                if (angular.equals(option.value, newValue)) {
                  $scope.localValue = option.value;
                }
              });
            }
          });

          $scope.toggleEditMode = function() {
            $scope.editAsParameter = !$scope.editAsParameter;
            $scope.localValue = $scope.editAsParameter ? paramNames[0] : 0.0;
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
      // The mode in which to display the form. Should be treated as read-only.
      mode: '=',
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
              value: paramName
            };
          });

          $scope.$watch('localValue', function(newValue, oldValue) {
            $scope.editAsParameter = angular.isString(newValue);
            // Because JS objects are passed by reference, the current value needs
            // to be set manually to an object in the list of options.
            if ($scope.editAsParameter) {
              $scope.paramNameOptions.forEach(function(option) {
                if (angular.equals(option.value, newValue)) {
                  $scope.localValue = option.value;
                }
              });
            }
          });

          $scope.toggleEditMode = function() {
            $scope.editAsParameter = !$scope.editAsParameter;
            $scope.localValue = $scope.editAsParameter ? paramNames[0] : 0;
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
      // The mode in which to display the form. Should be treated as read-only.
      mode: '=',
      postNormalizers: '&'
    },
    templateUrl: 'schemaBasedEditor/unicode',
    restrict: 'E',
    controller: ['$scope', '$filter', '$sce', 'parameterSpecsService',
        function($scope, $filter, $sce, parameterSpecsService) {
      $scope.allowedParameterNames = parameterSpecsService.getAllParamsOfType('unicode');
      $scope.doUnicodeParamsExist = ($scope.allowedParameterNames.length > 0);

      $scope.getDisplayedValue = function() {
        return $sce.trustAsHtml($filter('convertUnicodeWithParamsToHtml')($scope.localValue));
      };
    }]
  };
}]);

// TODO(sll): The 'Cancel' button should revert the text in the HTML box to its
// original state.
// TODO(sll): The noninteractive widgets in the RTE do not work.
oppia.directive('schemaBasedHtmlEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // The mode in which to display the form. Should be treated as read-only.
      mode: '='
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
      // The mode in which to display the form. Should be treated as read-only.
      mode: '=',
      // Read-only property. The schema definition for each item in the list.
      itemSchema: '&',
      // The length of the list. If not specified, the list is of arbitrary length.
      len: '='
    },
    templateUrl: 'schemaBasedEditor/list',
    restrict: 'E',
    compile: recursionHelper.compile,
    controller: ['$scope', function($scope) {
      if ($scope.len === undefined) {
        $scope.addElement = function() {
          $scope.localValue.push(
            schemaDefaultValueService.getDefaultValue($scope.itemSchema()));
        };

        $scope.deleteElement = function(index) {
          $scope.localValue.splice(index, 1);
        };
      } else {
        if ($scope.len <= 0) {
          throw 'Invalid length for list editor: ' + $scope.len;
        }
        if ($scope.len != $scope.localValue.length) {
          throw 'List editor length does not match length of input value: ' +
            $scope.len + ' ' + $scope.localValue;
        }
      }
    }]
  };
}]);

oppia.directive('schemaBasedDictEditor', ['recursionHelper', function(recursionHelper) {
  return {
    scope: {
      localValue: '=',
      // The mode in which to display the form. Should be treated as read-only.
      mode: '=',
      // Read-only property. An object whose keys and values are the dict
      // properties and the corresponding schemas.
      propertySchemas: '&'
    },
    templateUrl: 'schemaBasedEditor/dict',
    restrict: 'E',
    compile: recursionHelper.compile
  };
}]);
