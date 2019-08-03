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
 * @fileoverview Initialization and basic configuration for the Oppia module.
 */

require('directives/focus-on.directive.ts');

require('pages/Base.ts');

require('services/AlertsService.ts');
require('services/ContextService.ts');
require('services/CsrfTokenService.ts');
require('services/NavigationService.ts');
require('services/UtilsService.ts');
require('services/DebouncerService.ts');
require('services/DateTimeFormatService.ts');
require('services/IdGenerationService.ts');
require('services/HtmlEscaperService.ts');
require('services/TranslationFileHashLoaderService.ts');
require('services/RteHelperService.ts');
require('services/StateRulesStatsService.ts');
require('services/ConstructTranslationIdsService.ts');
require('services/UserService.ts');
require('services/PromoBarService.ts');
require('services/contextual/DeviceInfoService.ts');
require('services/contextual/UrlService.ts');
require('services/contextual/WindowDimensionsService.ts');
require('services/stateful/BackgroundMaskService.ts');
require('services/stateful/FocusManagerService.ts');
require('services/SiteAnalyticsService.ts');

require(
  'components/common-layout-directives/common-elements/' +
  'alert-message.directive.ts');
require('components/button-directives/create-activity-button.directive.ts');

require('components/forms/custom-forms-directives/object-editor.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'promo-bar.directive.ts');
require(
  'components/common-layout-directives/navigation-bars/' +
  'side-navigation-bar.directive.ts');
require('components/button-directives/social-buttons.directive.ts');
require(
  'components/common-layout-directives/navigation-bars/' +
  'top-navigation-bar.directive.ts');

require('domain/sidebar/SidebarStatusService.ts');
require('domain/user/UserInfoObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');

require('app.constants.ajs.ts');

// The following file uses constants in app.constants.ts and hence needs to be
// loaded after app.constants.ts
require('I18nFooter.ts');

angular.module('oppia').config([
  '$compileProvider', '$cookiesProvider', '$httpProvider',
  '$interpolateProvider', '$locationProvider',
  function(
      $compileProvider, $cookiesProvider, $httpProvider,
      $interpolateProvider, $locationProvider) {
    // This improves performance by disabling debug data. For more details,
    // see https://code.angularjs.org/1.5.5/docs/guide/production
    $compileProvider.debugInfoEnabled(false);

    // Set the AngularJS interpolators as <[ and ]>, to not conflict with
    // Jinja2 templates.
    $interpolateProvider.startSymbol('<[');
    $interpolateProvider.endSymbol(']>');

    // Prevent the search page from reloading if the search query is changed.
    $locationProvider.html5Mode(false);
    if (window.location.pathname === '/search/find') {
      $locationProvider.html5Mode(true);
    }

    // Prevent storing duplicate cookies for translation language.
    $cookiesProvider.defaults.path = '/';

    // Set default headers for POST and PUT requests.
    $httpProvider.defaults.headers.post = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    $httpProvider.defaults.headers.put = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Add an interceptor to convert requests to strings and to log and show
    // warnings for error responses.
    $httpProvider.interceptors.push([
      '$q', '$log', 'AlertsService', 'CsrfTokenService',
      function($q, $log, AlertsService, CsrfTokenService) {
        return {
          request: function(config) {
            if (config.data) {
              return $q(function(resolve, reject) {
                // Get CSRF token before sending the request.
                CsrfTokenService.getTokenAsync().then(function(token) {
                  config.data = $.param({
                    csrf_token: token,
                    payload: JSON.stringify(config.data),
                    source: document.URL
                  }, true);
                  resolve(config);
                });
              });
            }
            return config;
          },
          responseError: function(rejection) {
            // A rejection status of -1 seems to indicate (it's hard to find
            // documentation) that the response has not completed,
            // which can occur if the user navigates away from the page
            // while the response is pending, This should not be considered
            // an error.
            if (rejection.status !== -1) {
              $log.error(rejection.data);

              var warningMessage = 'Error communicating with server.';
              if (rejection.data && rejection.data.error) {
                warningMessage = rejection.data.error;
              }
              AlertsService.addWarning(warningMessage);
            }
            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);

angular.module('oppia').config(['$provide', function($provide) {
  $provide.decorator('$log', ['$delegate', 'DEV_MODE',
    function($delegate, DEV_MODE) {
      var _originalError = $delegate.error;

      if (!DEV_MODE) {
        $delegate.log = function() {};
        $delegate.info = function() {};
        // TODO(sll): Send errors (and maybe warnings) to the backend.
        $delegate.warn = function() { };
        $delegate.error = function(message) {
          if (String(message).indexOf('$digest already in progress') === -1) {
            _originalError(message);
          }
        };
        // This keeps angular-mocks happy (in tests).
        $delegate.error.logs = [];
      }

      return $delegate;
    }
  ]);
}]);

angular.module('oppia').config(['toastrConfig', function(toastrConfig) {
  angular.extend(toastrConfig, {
    allowHtml: false,
    iconClasses: {
      error: 'toast-error',
      info: 'toast-info',
      success: 'toast-success',
      warning: 'toast-warning'
    },
    positionClass: 'toast-bottom-right',
    messageClass: 'toast-message',
    progressBar: false,
    tapToDismiss: true,
    titleClass: 'toast-title'
  });
}]);

// Overwrite the built-in exceptionHandler service to log errors to the backend
// (so that they can be fixed).
angular.module('oppia').factory('$exceptionHandler', [
  '$log', 'CsrfTokenService', function($log, CsrfTokenService) {
    var MIN_TIME_BETWEEN_ERRORS_MSEC = 5000;
    var timeOfLastPostedError = Date.now() - MIN_TIME_BETWEEN_ERRORS_MSEC;

    return function(exception, cause) {
      var messageAndSourceAndStackTrace = [
        '',
        'Cause: ' + cause,
        exception.message,
        String(exception.stack),
        '    at URL: ' + window.location.href
      ].join('\n');

      // To prevent an overdose of errors, throttle to at most 1 error every
      // MIN_TIME_BETWEEN_ERRORS_MSEC.
      if (Date.now() - timeOfLastPostedError > MIN_TIME_BETWEEN_ERRORS_MSEC) {
        // Catch all errors, to guard against infinite recursive loops.
        try {
          // We use jQuery here instead of Angular's $http, since the latter
          // creates a circular dependency.
          CsrfTokenService.getTokenAsync().then(function(token) {
            $.ajax({
              type: 'POST',
              url: '/frontend_errors',
              data: $.param({
                csrf_token: token,
                payload: JSON.stringify({
                  error: messageAndSourceAndStackTrace
                }),
                source: document.URL
              }, true),
              contentType: 'application/x-www-form-urlencoded',
              dataType: 'text',
              async: true
            });

            timeOfLastPostedError = Date.now();
          });
        } catch (loggingError) {
          $log.warn('Error logging failed.');
        }
      }

      $log.error.apply($log, arguments);
    };
  }
]);

// Add a String.prototype.trim() polyfill for IE8.
if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

// Add an Object.create() polyfill for IE8.
if (typeof Object.create !== 'function') {
  (function() {
    var F = function() {};
    Object.create = function(o) {
      if (arguments.length > 1) {
        throw Error('Second argument for Object.create() is not supported');
      }
      if (o === null) {
        throw Error('Cannot set a null [[Prototype]]');
      }
      if (typeof o !== 'object') {
        throw TypeError('Argument must be an object');
      }
      F.prototype = o;
      return new F();
    };
  })();
}

// Add a Number.isInteger() polyfill for IE.
Number.isInteger = Number.isInteger || function(value) {
  return (
    typeof value === 'number' && isFinite(value) &&
    Math.floor(value) === value);
};


// Add Array.fill() polyfill for IE.
if (!Array.prototype.fill) {
  Object.defineProperty(Array.prototype, 'fill', {
    value: function(value) {
      // Steps 1-2.
      if (this === null) {
        throw new TypeError('this is null or not defined');
      }

      var O = Object(this);

      // Steps 3-5.
      var len = O.length >>> 0;

      // Steps 6-7.
      var start = arguments[1];
      var relativeStart = start >> 0;

      // Step 8.
      var k = relativeStart < 0 ?
        Math.max(len + relativeStart, 0) :
        Math.min(relativeStart, len);

      // Steps 9-10.
      var end = arguments[2];
      var relativeEnd = end === undefined ?
        len : end >> 0;

      // Step 11.
      var final = relativeEnd < 0 ?
        Math.max(len + relativeEnd, 0) :
        Math.min(relativeEnd, len);

      // Step 12.
      while (k < final) {
        O[k] = value;
        k++;
      }

      // Step 13.
      return O;
    }
  });
}
