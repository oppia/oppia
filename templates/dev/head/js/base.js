// TODO(sll): The ['ui', 'ngSanitize'] dependencies are only needed for
// editorQuestion.js. Find a way to make them load only for that page.
var oppia = angular.module('oppia', ['ui', 'ngSanitize']);
var editorUrl = '/editor/';
var ALPHANUMERIC_REGEXP = {
    'regexp': /^[ A-Za-z0-9\.\?\,\+\(\)\[\]\;\!\'\"\:_-]+$/,
    'warning': 'Invalid input. Please use a non-empty ' +
        'description consisting of alphanumeric characters, underscores, ' +
        'spaces and/or hyphens.'};

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
oppia.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

// Factory for handling warnings.
oppia.factory('warningsData', function($rootScope) {
  var warningsData = {warnings: []};

  /**
   * Adds a warning message to the butterbar.
   * @param {string} warning The warning message to display.
   */
  warningsData.addWarning = function(warning) {
    console.log('WARNING: ' + warning);
    warningsData.warnings.push(warning);
  };

  /**
   * Deletes the warning at a given index.
   * @param {int} index The index of the warning to delete.
   */
  warningsData.deleteWarning = function(index) {
    warningsData.warnings.splice(index, 1);
  }

  return warningsData;
});

// Global utility methods.
function Base($scope, $timeout, warningsData) {
  $scope.warningsData = warningsData;

  /**
   * Adds content to an iframe.
   * @param {string} iframeId The id of the iframe to add content to.
   * @param {string} content The code for the iframe.
   */
  $scope.addContentToIframe = function(iframeId, content) {
    var iframe = document.getElementById(iframeId);
    if (iframe.contentDocument) {
      doc = iframe.contentDocument;
    } else {
      doc = iframe.contentWindow ? iframe.contentWindow.document : iframe.document;
    }
    doc.open();
    doc.writeln(content);
    doc.close();
  };

  /**
   * Checks whether an entity name is valid, and displays a warning message
   * if it isn't.
   * @param {string} input The input to be checked.
   * @param {boolean} showWarnings Whether to show warnings in the butterbar.
   * @return {boolean} True if the entity name is valid, false otherwise.
   */
  $scope.isValidEntityName = function(input, showWarnings) {
    if (!input) {
      if (showWarnings) {
        warningsData.addWarning('Please enter a non-empty name.');
      }
      return false;
    }
    // Remove whitespace from the beginning and end of the string, and replace
    // interior whitespace with a single space character.
    input = input.trim();
    input = input.replace(/\s{2,}/g, ' ');
    // Do not allow input to start with '[', since this is part of the prefix
    // used in the auto-suggest boxes to identify chapters, questions, etc.
    if (input[0] == '[') {
      if (showWarnings) {
        warningsData.addWarning('Names should not start with a \'[\'.');
      }
      return false;
    }
    if (!ALPHANUMERIC_REGEXP.regexp.test(input)) {
      if (showWarnings) {
        warningsData.addWarning(ALPHANUMERIC_REGEXP.warning);
      }
      return false;
    }
    return true;
  };
}

oppia.directive('mustBeValidString', function($timeout) {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        if (scope.isValidEntityName(viewValue, false)) {
          // it is valid
          ctrl.$setValidity('invalidChar', true);
          return viewValue;
        } else {
          // it is invalid, return the old model value
          elm[0].value = ctrl.$modelValue;
          ctrl.$setValidity('invalidChar', false);
          $timeout(function() {
            ctrl.$setValidity('invalidChar', true);
          }, 2000);
          return ctrl.$modelValue;
        }
      });
    }
  };
});

oppia.directive('angularHtmlBind', function($compile) {
  return function(scope, elm, attrs) {
    scope.$watch(attrs.angularHtmlBind, function(newValue, oldValue) {
      if (newValue && newValue !== oldValue) {
        elm.html(newValue);
        console.log(elm.contents());
        $compile(elm.contents())(scope);
      }
    });
  };
});

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Base.$inject = ['$scope', '$timeout', 'warningsData'];
