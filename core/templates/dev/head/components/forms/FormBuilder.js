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
  '$sanitize', 'HtmlEscaperService',
  function($sanitize, HtmlEscaperService) {
    return function(text) {
      return $sanitize(HtmlEscaperService.unescapedStrToEscapedStr(text));
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
        assert(!currentFragmentIsParam && text.length > i + 1 && {
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
        '<oppia-parameter>' + fragment.data +
        '</oppia-parameter>');
    });
    return result;
  };
}]);

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

oppia.filter('isInteger', [function() {
  return function(input) {
    return Number.isInteger(Number(input));
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

/* eslint-disable angular/directive-restrict */
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
              filterArgs[$filter('underscoresToCamelCase')(key)] =
                angular.copy(validatorSpec[key]);
            }
          }

          var customValidator = function(viewValue) {
            ctrl.$setValidity(
              frontendName, $filter(frontendName)(viewValue,
                filterArgs));
            return viewValue;
          };

          ctrl.$parsers.unshift(customValidator);
          ctrl.$formatters.unshift(customValidator);
        });
      }
    }
  };
}]);
/* eslint-enable angular/directive-restrict */

// This should come before 'apply-validation', if that is defined as
// an attribute on the HTML tag.

/* eslint-disable angular/directive-restrict */
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
/* eslint-enable angular/directive-restrict */
