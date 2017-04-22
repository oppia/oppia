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
 */

// NOTE TO DEVELOPERS: This forms framework accepts an external event
// named 'schemaBasedFormsShown'. This should be called by clients
// when these forms first come into view.

// The conditioning on window.GLOBALS.RTE_COMPONENT_SPECS is because, in the
// Karma tests, this value is undefined.

// Service for retrieving parameter specifications.
oppia.factory('parameterSpecsService', ['$log', function($log) {
  var paramSpecs = {};
  var ALLOWED_PARAM_TYPES = ['bool', 'unicode', 'float', 'int'];

  return {
    addParamSpec: function(paramName, paramType) {
      if (ALLOWED_PARAM_TYPES.indexOf(paramType) === -1) {
        $log.error('Invalid parameter type: ' + paramType);
        return;
      }
      paramSpecs[paramName] = {
        type: paramType
      };
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
    },
    getAllParams: function() {
      var names = [];
      for (var paramName in paramSpecs) {
        names.push(paramName);
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
      .replace(/([\\\{\}])/g, '\\$1');
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

oppia.filter('convertUnicodeToHtml', [
  '$sanitize', 'oppiaHtmlEscaper', function($sanitize, oppiaHtmlEscaper) {
    return function(text) {
      return $sanitize(oppiaHtmlEscaper.unescapedStrToEscapedStr(text));
    };
  }
]);

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
      if (text[i] === '\\') {
        assert(
          !currentFragmentIsParam && text.length > i + 1 &&
          {
            '{': true,
            '}': true,
            '\\': true
          }[text[i + 1]]);
        currentFragment += text[i + 1];
        i++;
      } else if (text[i] === '{') {
        assert(
          text.length > i + 1 && !currentFragmentIsParam &&
          text[i + 1] === '{');
        textFragments.push({
          type: 'text',
          data: currentFragment
        });
        currentFragment = '';
        currentFragmentIsParam = true;
        i++;
      } else if (text[i] === '}') {
        assert(
          text.length > i + 1 && currentFragmentIsParam &&
          text[i + 1] === '}');
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
        fragment.type === 'text' ?
        $filter('convertUnicodeToHtml')(fragment.data) :
        '<oppia-parameter>' + fragment.data + '</oppia-parameter>');
    });
    return result;
  };
}]);

// TODO(sll): This whole directive needs to be rewritten to not rely on
// jWysiwyg.
oppia.directive('unicodeWithParametersEditor', ['$modal', function($modal) {
  return {
    restrict: 'E',
    scope: {
      allowedParameterNames: '&',
      localValue: '='
    },
    template: (
      '<div class="input-group">' +
      '  <textarea ng-disabled="!hasFullyLoaded"></textarea>' +
      '  <span class="input-group-btn">' +
      '    <button type="button" class="btn btn-default"' +
      '            ng-click="insertNewParameter()">+P</button>' +
      '  </span>' +
      '</div>'),
    controller: [
      '$scope', '$element', '$filter', '$timeout',
      function($scope, $element, $filter, $timeout) {
        if (!$scope.allowedParameterNames().length) {
          console.error(
            'The unicode-with-parameters editor should not be used if there ' +
            'are no unicode parameters available.');
          return;
        }

        // This is a bit silly. It appears that in contenteditables (in Chrome,
        // anyway) the cursor will stubbornly remain within the oppia-parameter
        // element (even though it should be outside it). However the behavior
        // is correct for images -- so we use images to delimit it. It's still
        // hard to do selection before the element if it's the first thing in
        // the doc, after the element if it's the last thing in the doc, or
        // between two consecutive elements. See this bug for a demonstration:
        //
        //     https://code.google.com/p/chromium/issues/detail?id=242110
        var INVISIBLE_IMAGE_TAG = (
          '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAA' +
          'AAABAAEAAAICTAEAOw=="></img>');
        var PARAM_CONTAINER_CLASS = 'oppia-parameter-container';

        $scope._createRteParameterTag = function(paramName) {
          var el = $(
            '<span class="' + PARAM_CONTAINER_CLASS + '" ' +
                   'contenteditable="false">' +
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
            return $scope._createRteParameterTag(this.textContent);
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
        $scope.openEditParameterModal =
          function(currentParamName, eltToReplace) {
            return $modal.open({
              templateUrl: 'modals/editParamName',
              backdrop: true,
              resolve: {
                allowedParameterNames: function() {
                  return $scope.allowedParameterNames();
                }
              },
              controller: [
                '$scope', '$modalInstance', 'allowedParameterNames',
                function($scope, $modalInstance, allowedParameterNames) {
                  $scope.currentParamName = currentParamName;
                  $scope.paramOptions = allowedParameterNames.map(
                    function(paramName) {
                      return {
                        name: paramName,
                        value: paramName
                      };
                    }
                  );

                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                  };

                  $scope.save = function(paramName) {
                    $modalInstance.close(paramName);
                  };
                }
              ]
            }).result.then(function(paramName) {
              var el = $scope._createRteParameterTag(paramName);
              if (eltToReplace === null) {
                var doc = $(rteNode).wysiwyg('document').get(0);
                $(rteNode).wysiwyg(
                  'insertHtml', '<span class="insertionPoint"></span>');
                eltToReplace =
                  $scope.editorDoc.querySelector('.insertionPoint');
              }

              // Note that this removes the contenteditable="false" and
              // ondblclick attributes of el (but they are eventually replaced
              // during the normalization of the RTE content step). Also, we
              // need to save the change explicitly because the wysiwyg editor
              // does not auto-detect replaceWith() events.
              $(eltToReplace).replaceWith(el);
              $(rteNode).wysiwyg('save');
            });
          };

        $scope.insertNewParameter = function() {
          $scope.openEditParameterModal(
            $scope.allowedParameterNames()[0], null);
        };

        var rteContentMemento = $scope._convertUnicodeToRte($scope.localValue);
        $scope.currentlyEditing = false;
        $scope.$watch('localValue', function() {
          if (!$scope.currentlyEditing) {
            // This is an external change.
            rteContentMemento = $scope._convertUnicodeToRte($scope.localValue);
            $(rteNode).wysiwyg('setContent', rteContentMemento);
          }
        }, true);

        $scope._normalizeRteContent = function(content) {
          // TODO(sll): Write this method to validate rather than just
          // normalize.

          // The only top-level tags should be oppia-parameter tags. Each of
          // these tags should have a contenteditable=false attribute, a
          // dblclick handler that opens the parameter modal, and content
          // consisting of a valid parameter name of type unicode surrounded
          // by two invisible image tags.
          var elt = $('<div>' + content + '</div>');
          elt.find('.' + PARAM_CONTAINER_CLASS).replaceWith(function() {
            return $scope._createRteParameterTag(this.textContent.trim());
          });
          return elt.html();
        };

        $scope.init = function() {
          $(rteNode).wysiwyg({
            autoGrow: true,
            autoSave: true,
            controls: {},
            css: '/css/rte_single_line.css',
            debug: true,
            events: {
              // Prevent dragging, since this causes weird things to happen when
              // a user selects text containing all or part of parameter tags
              // and then drags that text elsewhere.
              dragstart: function(e) {
                e.preventDefault();
              },
              // Prevent use of keyboard shortcuts for bold, italics, etc. Also
              // prevent pasting, newlines and tabbing.
              keydown: function(e) {
                var aKey = 65;
                var cKey = 67;
                var xKey = 88;
                var zKey = 90;
                var vKey = 86;
                if (e.ctrlKey) {
                  if (e.keyCode === 86) {
                    e.preventDefault();
                    alert(
                      'Pasting in string input fields is currently not ' +
                      'supported. Sorry about that!');
                  } else if (
                      e.keyCode !== aKey && e.keyCode !== cKey &&
                      e.keyCode !== xKey && e.keyCode !== zKey) {
                    e.preventDefault();
                  }
                }
                // Disable the enter key. Contenteditable does not seem to
                // support deletion of newlines. Also disable the tab key.
                if (e.keyCode === 13 || e.keyCode === 9) {
                  e.preventDefault();
                }
              },
              paste: function(e) {
                e.preventDefault();
              },
              save: function() {
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
                  normalizedContent =
                    $scope._normalizeRteContent(currentContent);
                } catch (unusedException) {
                  console.error('Error parsing RTE content: ' + currentContent);
                  normalizedContent = rteContentMemento;
                }

                if (normalizedContent !== currentContent) {
                  $(rteNode).wysiwyg('setContent', normalizedContent);
                }

                // Update the external value. The $timeout removes the '$apply
                // in progress' errors which get triggered if a parameter was
                // edited.
                $timeout(function() {
                  $scope.$apply(function() {
                    $scope.currentlyEditing = true;
                    $scope.localValue = $scope._convertRteToUnicode(
                      normalizedContent);
                    // TODO(sll): This is a somewhat hacky solution. Can it be
                    // cleaned up?
                    $timeout(function() {
                      $scope.currentlyEditing = false;
                    }, 50);
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
        // just place a $scope.$watch on the data source, then typing in a
        // single RTE is going to call that method, and this will replace the
        // content of the RTE -- which is normally not an issue, but in this
        // case it moves the cursor back to the beginning of the doc and
        // frustrates the user. We should find a solution for this -- although
        // it probably is not a common use case to have multiple unicode RTEs
        // referencing the same data source, there is a problem in that although
        // the Cancel button does update the data model, it does not update the
        // appearance of the RTE.
      }
    ]
  };
}]);

oppia.factory('schemaDefaultValueService', [function() {
  return {
    // TODO(sll): Rewrite this to take validators into account, so that
    // we always start with a valid value.
    getDefaultValue: function(schema) {
      if (schema.choices) {
        return schema.choices[0];
      } else if (schema.type === 'bool') {
        return false;
      } else if (schema.type === 'unicode' || schema.type === 'html') {
        return '';
      } else if (schema.type === 'list') {
        return [this.getDefaultValue(schema.items)];
      } else if (schema.type === 'dict') {
        var result = {};
        for (var i = 0; i < schema.properties.length; i++) {
          result[schema.properties[i].name] = this.getDefaultValue(
            schema.properties[i].schema);
        }
        return result;
      } else if (schema.type === 'int' || schema.type === 'float') {
        return 0;
      } else {
        console.error('Invalid schema type: ' + schema.type);
      }
    }
  };
}]);

oppia.factory('schemaUndefinedLastElementService', [function() {
  return {
    // Returns true if the input value, taken as the last element in a list,
    // should be considered as 'undefined' and therefore deleted.
    getUndefinedValue: function(schema) {
      if (schema.type === 'unicode' || schema.type === 'html') {
        return '';
      } else {
        return undefined;
      }
    }
  };
}]);

oppia.filter('sanitizeHtmlForRte', ['$sanitize', function($sanitize) {
  var _EXTENSION_SELECTOR = '[class^=oppia-noninteractive-]';

  return function(html) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    // Save the unsanitized extensions.
    var unsanitizedExtensions = $(wrapper).find(_EXTENSION_SELECTOR);

    wrapper.innerHTML = $sanitize(wrapper.innerHTML);
    var sanitizedExtensions = $(wrapper).find(_EXTENSION_SELECTOR);
    for (var i = 0; i < sanitizedExtensions.length; i++) {
      var el = sanitizedExtensions[i];
      var attrs = unsanitizedExtensions[i].attributes;
      for (var j = 0; j < attrs.length; j++) {
        var attr = attrs[j];
        // Reinstate the sanitized widget attributes.
        if (attr.name.indexOf('-with-value') !== -1 &&
            !el.hasAttribute(attr.name)) {
          el.setAttribute(attr.name, attr.value);
        }
      }
    }

    return wrapper.innerHTML;
  };
}]);

oppia.directive('textAngularRte', [
  '$filter', '$timeout', 'oppiaHtmlEscaper', 'rteHelperService',
  'textAngularManager',
  function(
    $filter, $timeout, oppiaHtmlEscaper, rteHelperService,
    textAngularManager) {
    return {
      restrict: 'E',
      scope: {
        htmlContent: '=',
        uiConfig: '&',
        labelForFocusTarget: '&'
      },
      template: (
        '<div text-angular="" ta-toolbar="<[toolbarOptionsJson]>" ' +
        '     ta-paste="stripFormatting($html)" ng-model="tempContent"' +
        '     placeholder="<[placeholderText]>"' +
        '     name="<[labelForFocusTarget()]>">' +
        '</div>'),
      controller: ['$scope', function($scope) {
        // Currently, operations affecting the filesystem are allowed only in
        // the editor context.
        $scope.isCustomizationModalOpen = false;
        var toolbarOptions = [
          ['bold', 'italics'],
          ['ol', 'ul', 'pre', 'indent', 'outdent'],
          []
        ];
        var whitelistedImgClasses = [];

        if ($scope.uiConfig() && $scope.uiConfig().placeholder) {
          $scope.placeholderText = $scope.uiConfig().placeholder;
        }

        rteHelperService.getRichTextComponents().forEach(
          function(componentDefn) {
            if (!($scope.uiConfig() &&
                  $scope.uiConfig().hide_complex_extensions &&
                  componentDefn.isComplex)) {
              toolbarOptions[2].push(componentDefn.name);
            }
            var imgClassName = 'oppia-noninteractive-' + componentDefn.name;
            whitelistedImgClasses.push(imgClassName);
          }
        );
        $scope.toolbarOptionsJson = JSON.stringify(toolbarOptions);

        var _convertHtmlToRte = function(html) {
          return rteHelperService.convertHtmlToRte(html);
        };

        $scope.stripFormatting = function(html) {
          var safeHtml = $filter(
            'stripFormatting'
          )(html, whitelistedImgClasses);
          // The '.' default is needed, otherwise some tags are not stripped
          // properly. To reproduce, copy the image from this page
          // (https://en.wikipedia.org/wiki/C._Auguste_Dupin) and paste it
          // into the RTE.
          return safeHtml || '.';
        };

        $scope.init = function() {
          $scope.tempContent = _convertHtmlToRte($scope.htmlContent);
        };

        $scope.init();

        $scope.$on('focusOn', function(evt, label) {
          if (label === $scope.labelForFocusTarget()) {
            var editorScope = textAngularManager.retrieveEditor(label).scope;
            $timeout(function() {
              editorScope.displayElements.text[0].focus();
            });
          }
        });

        $scope.$watch('tempContent', function(newVal) {
          // Sanitizing while a modal is open would delete the markers that
          // save and restore the cursor's position in the RTE.
          var displayedContent = $scope.isCustomizationModalOpen ? newVal :
            $filter('sanitizeHtmlForRte')(newVal);
          $scope.htmlContent = rteHelperService.convertRteToHtml(
            displayedContent);
        });

        // It is possible for the content of the RTE to be changed externally,
        // e.g. if there are several RTEs in a list, and one is deleted.
        $scope.$on('externalHtmlContentChange', function() {
          $timeout(function() {
            $scope.tempContent = _convertHtmlToRte($scope.htmlContent);
          });
        });
      }]
    };
  }
]);

// The names of these filters must correspond to the names of the backend
// validators (with underscores converted to camelcase).
// WARNING: These filters do not validate the arguments supplied with the
// validator definitions in the schema; these are assumed to be correct.
oppia.filter('isAtLeast', [function() {
  return function(input, args) {
    return (input >= args.minValue);
  };
}]);

oppia.filter('isAtMost', [function() {
  return function(input, args) {
    return (input <= args.maxValue);
  };
}]);

oppia.filter('isNonempty', [function() {
  return function(input) {
    return Boolean(input);
  };
}]);

oppia.filter('isFloat', [function() {
  return function(input) {
    var FLOAT_REGEXP = /(?=.*\d)^\-?\d*(\.|\,)?\d*\%?$/;
    // This regex accepts floats in the following formats:
    // 0.
    // 0.55..
    // -0.55..
    // .555..
    // -.555..
    // All examples above with '.' replaced with ',' are also valid.
    // Expressions containing % are also valid (5.1% etc).

    var viewValue = '';
    try {
      var viewValue = input.toString().trim();
    } catch (e) {
      return undefined;
    }

    if (viewValue !== '' && FLOAT_REGEXP.test(viewValue)) {
      if (viewValue.slice(-1) === '%') {
        // This is a percentage, so the input needs to be divided by 100.
        return parseFloat(
          viewValue.substring(0, viewValue.length - 1).replace(',', '.')
        ) / 100.0;
      } else {
        return parseFloat(viewValue.replace(',', '.'));
      }
    } else {
      return undefined;
    }
  };
}]);

oppia.directive('applyValidation', ['$filter', function($filter) {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {
      // Add validators in reverse order.
      if (scope.validators()) {
        scope.validators().forEach(function(validatorSpec) {
          var frontendName = $filter('underscoresToCamelCase')(
            validatorSpec.id);

          // Note that there may not be a corresponding frontend filter for
          // each backend validator.
          try {
            $filter(frontendName);
          } catch (err) {
            return;
          }

          var filterArgs = {};
          for (key in validatorSpec) {
            if (key !== 'id') {
              filterArgs[$filter('underscoresToCamelCase')(key)] = angular.copy(
                validatorSpec[key]);
            }
          }

          var customValidator = function(viewValue) {
            ctrl.$setValidity(
              frontendName, $filter(frontendName)(viewValue, filterArgs));
            return viewValue;
          };

          ctrl.$parsers.unshift(customValidator);
          ctrl.$formatters.unshift(customValidator);
        });
      }
    }
  };
}]);

// This should come before 'apply-validation', if that is defined as
// an attribute on the HTML tag.
oppia.directive('requireIsFloat', ['$filter', function($filter) {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {
      var floatValidator = function(viewValue) {
        var filteredValue = $filter('isFloat')(viewValue);
        ctrl.$setValidity('isFloat', filteredValue !== undefined);
        return filteredValue;
      };

      ctrl.$parsers.unshift(floatValidator);
      ctrl.$formatters.unshift(floatValidator);
    }
  };
}]);

oppia.directive('requireIsValidExpression', [
  'parameterSpecsService', 'expressionEvaluatorService',
  function(parameterSpecsService, expressionEvaluatorService) {
    // Create a namescope environment from the parameter names. The values of
    // the parameters do not matter.
    var params = {};
    parameterSpecsService.getAllParams().forEach(function(name) {
      params[name] = true;
    });

    return {
      require: 'ngModel',
      restrict: 'A',
      link: function(scope, elm, attrs, ctrl) {
        var validator = function(value) {
          ctrl.$setValidity('isValidExpression',
              expressionEvaluatorService.validateExpression(value, [params]));
          return value;
        };

        ctrl.$parsers.unshift(validator);
        ctrl.$formatters.unshift(validator);
      }
    };
  }]
);

// Prevents timeouts due to recursion in nested directives. See:
//
//   http://stackoverflow.com/q/14430655
oppia.factory('recursionHelper', ['$compile', function($compile) {
  return {
    /**
     * Manually compiles the element, fixing the recursion loop.
     * @param {DOM element} element
     * @param {function|object} link - A post-link function, or an object with
     *   function(s) registered via pre and post properties.
     * @return {object} An object containing the linking functions.
     */
    compile: function(element, link) {
      // Normalize the link parameter
      if (angular.isFunction(link)) {
        link = {
          post: link
        };
      }

      // Break the recursion loop by removing the contents,
      var contents = element.contents().remove();
      var compiledContents;
      return {
        pre: (link && link.pre) ? link.pre : null,
        post: function(scope, element) {
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
