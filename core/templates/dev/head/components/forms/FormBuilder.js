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

oppia.filter('convertHtmlToUnicode', [function() {
  return function(html) {
    return angular.element('<div>' + html + '</div>').text();
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
