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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('directives/focus-on.directive.ts');

require('pages/Base.ts');

require('services/context.service.ts');
require('services/csrf-token.service.ts');
require('services/navigation.service.ts');
require('services/debouncer.service.ts');
require('services/date-time-format.service.ts');
require('services/id-generation.service.ts');
require('services/html-escaper.service.ts');
require('services/translation-file-hash-loader.service.ts');
require('services/rte-helper.service.ts');
require('services/state-rules-stats.service.ts');
require('services/construct-translation-ids.service.ts');
require('services/user.service.ts');
require('services/promo-bar.service.ts');
require('services/contextual/device-info.service.ts');
require('services/contextual/url.service.ts');
require('services/stateful/focus-manager.service.ts');
require('services/site-analytics.service.ts');

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

require('domain/user/UserInfoObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');

require('app.constants.ajs.ts');

require('google-analytics.initializer.ts');

// The following file uses constants in app.constants.ts and hence needs to be
// loaded after app.constants.ts
require('I18nFooter.ts');

const sourceMappedStackTrace = require('sourcemapped-stacktrace');

angular.module('oppia').config([
  '$compileProvider', '$cookiesProvider', '$httpProvider',
  '$interpolateProvider', '$locationProvider', '$provide',
  function(
      $compileProvider, $cookiesProvider, $httpProvider,
      $interpolateProvider, $locationProvider, $provide) {
    // Refer: https://docs.angularjs.org/guide/migration
    // #migrate1.5to1.6-ng-services-$location
    // The default hash-prefix used for URLs has changed from
    // the empty string ('') to the bang ('!') in Angular v1.6.
    // For example, rather than mydomain.com/#/a/b/c
    // the URL will become mydomain.com/#!/a/b/c.  So, the line
    // here is to change the prefix back to empty string.
    $locationProvider.hashPrefix('');

    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
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
      '$exceptionHandler', '$q', '$log', 'AlertsService', 'CsrfTokenService',
      function($exceptionHandler, $q, $log, AlertsService, CsrfTokenService) {
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
              // rejection.config is an optional parameter.
              // see https://docs.angularjs.org/api/ng/service/$http
              var rejectionUrl = typeof rejection.config !== 'undefined' ? (
                rejection.config.url) : '';
              var additionalLoggingInfo = warningMessage +
                '\n URL: ' + rejectionUrl +
                '\n data: ' + JSON.stringify(rejection.data);
              // $exceptionHandler is called directly instead of
              // throwing an error to invoke it because the return
              // statement below must execute. There are tests
              // that rely on this.
              $exceptionHandler(new Error(additionalLoggingInfo));
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
// NOTE: The line number logged in stack driver will not accurately
// match the line number in the source code. This is because browsers
// automatically remove empty lines and concatinate strings which are
// spread over multiple lines. The errored file may be viewed on the
// browser console where the line number should match.
angular.module('oppia').factory('$exceptionHandler', [
  '$log', 'CsrfTokenService', function($log, CsrfTokenService) {
    var MIN_TIME_BETWEEN_ERRORS_MSEC = 5000;
    // Refer: https://docs.angularjs.org/guide/migration#-templaterequest-
    // The tpload error namespace has changed in Angular v1.7.
    // Previously, the tpload error was namespaced to $compile.
    // So, the code that matches errors of the form [$compile:tpload]
    // will no longer run in v1.7. It should be changed to match
    // [$templateRequest:tpload].
    var TPLOAD_STATUS_CODE_REGEX = (
      new RegExp(/\[\$templateRequest:tpload\].*p1=(.*?)&p2=/));
    var timeOfLastPostedError = Date.now() - MIN_TIME_BETWEEN_ERRORS_MSEC;

    return function(exception, cause) {
      // Exceptions are expected to be of Error type. If an error is thrown
      // with a primitive data type, it must be converted to an Error object
      // so that the error gets logged correctly.
      // This check can be removed once all the manually thrown exceptions
      // are converted to Error objects (see #8456).
      if (!(exception instanceof Error)) {
        exception = new Error(exception);
      }
      var tploadStatusCode = exception.message.match(TPLOAD_STATUS_CODE_REGEX);
      // Suppress tpload errors which occur with p1 of -1 in the error URL
      // because -1 is the status code for aborted requests.
      if (tploadStatusCode !== null && tploadStatusCode[1] === '-1') {
        return;
      }
      sourceMappedStackTrace.mapStackTrace(
        exception.stack, function(mappedStack) {
          var messageAndSourceAndStackTrace = [
            '',
            'Cause: ' + cause,
            exception.message,
            mappedStack.join('\n'),
            '    at URL: ' + window.location.href
          ].join('\n');
          // To prevent an overdose of errors, throttle to at most 1 error every
          // MIN_TIME_BETWEEN_ERRORS_MSEC.
          if (
            Date.now() - timeOfLastPostedError > MIN_TIME_BETWEEN_ERRORS_MSEC) {
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
        });
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


// Add SVGElement.prototype.outerHTML polyfill for IE
if (!('outerHTML' in SVGElement.prototype)) {
  Object.defineProperty(SVGElement.prototype, 'outerHTML', {
    get: function() {
      var $node, $temp;
      $temp = document.createElement('div');
      $node = this.cloneNode(true);
      $temp.appendChild($node);
      return $temp.innerHTML;
    },
    enumerable: false,
    configurable: true
  });
}


// Older browsers might not implement mediaDevices at all,
// so we set an empty object first.
if (navigator.mediaDevices === undefined) {
  // @ts-ignore: mediaDevices is read-only error.
  navigator.mediaDevices = {};
}

// Some browsers partially implement mediaDevices.
// We can't just assign an object with getUserMedia
// as it would overwrite existing properties.
// Here, we will just add the getUserMedia property
// if it's missing.
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function(constraints) {
    // First get ahold of the legacy getUserMedia, if present.
    var getUserMedia = (
      // @ts-ignore: 'webkitGetUserMedia' and 'mozGetUserMedia'
      // property does not exist error.
      navigator.webkitGetUserMedia || navigator.mozGetUserMedia);

    // If getUserMedia is not implemented, return a rejected promise
    // with an error to keep a consistent interface.
    if (!getUserMedia) {
      return Promise.reject(
        new Error('getUserMedia is not implemented in this browser'));
    }

    // Otherwise, wrap the call to the old navigator.getUserMedia
    // with a Promise.
    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}
