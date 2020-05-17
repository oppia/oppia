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

require('app.constants.ajs.ts');

require('components/button-directives/create-activity-button.directive.ts');
require('components/button-directives/social-buttons.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'alert-message.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'promo-bar.directive.ts');
require(
  'components/common-layout-directives/navigation-bars/' +
  'side-navigation-bar.directive.ts');
require(
  'components/common-layout-directives/navigation-bars/' +
  'top-navigation-bar.directive.ts');
require('components/forms/custom-forms-directives/object-editor.directive.ts');

require('directives/focus-on.directive.ts');

require('domain/user/UserInfoObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');

require('pages/Base.ts');

require('services/construct-translation-ids.service.ts');
require('services/context.service.ts');
require('services/contextual/device-info.service.ts');
require('services/contextual/url.service.ts');
require('services/csrf-token.service.ts');
require('services/date-time-format.service.ts');
require('services/debouncer.service.ts');
require('services/html-escaper.service.ts');
require('services/id-generation.service.ts');
require('services/interaction-rules-registry.service.ts');
require('services/navigation.service.ts');
require('services/promo-bar.service.ts');
require('services/rte-helper.service.ts');
require('services/site-analytics.service.ts');
require('services/state-interaction-stats.service.ts');
require('services/stateful/focus-manager.service.ts');
require('services/translation-file-hash-loader.service.ts');
require('services/user.service.ts');

require('google-analytics.initializer.ts');

// The following file uses constants in app.constants.ts and hence needs to be
// loaded *after* app.constants.ts
require('I18nFooter.ts');

require('Polyfills.ts');

// Default to passive event listeners.
require('default-passive-events');

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

const sourceMappedStackTrace = require('sourcemapped-stacktrace');

angular.module('oppia').config([
  '$compileProvider', '$cookiesProvider', '$httpProvider',
  '$interpolateProvider', '$locationProvider', '$provide', '$sanitizeProvider',
  function(
      $compileProvider, $cookiesProvider, $httpProvider,
      $interpolateProvider, $locationProvider, $provide, $sanitizeProvider) {
    var ugs = new UpgradedServices();
    // We need to provide these services and pipes separately since they are
    // used in the directives imported in this file and cannot be
    // injected before bootstrapping of oppia module.
    var servicesToProvide = [
      'AlertsService', 'BackgroundMaskService', 'BrowserCheckerService',
      'CodeReplRulesService', 'CollectionCreationBackendService',
      'ContextService', 'CsrfTokenService', 'DateTimeFormatService',
      'DebouncerService', 'DeviceInfoService',
      'DocumentAttributeCustomizationService',
      'ExplorationHtmlFormatterService', 'ExplorationObjectFactory',
      'ExpressionParserService', 'ExtensionTagAssemblerService',
      'ExtractImageFilenamesFromStateService', 'HtmlEscaperService',
      'IdGenerationService', 'InteractionObjectFactory',
      'InteractionRulesRegistryService', 'LoaderService', 'LoggerService',
      'MetaTagCustomizationService', 'NormalizeWhitespacePipe',
      'NormalizeWhitespacePunctuationAndCasePipe',
      'PencilCodeEditorRulesService', 'SidebarStatusService',
      'SiteAnalyticsService', 'SkillObjectFactory', 'SolutionObjectFactory',
      'StateCardObjectFactory', 'StateImprovementSuggestionService',
      'StateInteractionStatsService', 'StateObjectFactory',
      'StatesObjectFactory', 'TextInputRulesService', 'UrlInterpolationService',
      'UrlService', 'UserInfoObjectFactory', 'UtilsService',
      'ValidatorsService', 'WindowDimensionsService', 'WindowRef'
    ];
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      if (servicesToProvide.includes(key)) {
        $provide.value(key, value);
      }
    }
    // Refer: https://docs.angularjs.org/guide/migration
    // #migrate1.5to1.6-ng-services-$location
    // The default hash-prefix used for URLs has changed from
    // the empty string ('') to the bang ('!') in Angular v1.6.
    // For example, rather than mydomain.com/#/a/b/c
    // the URL will become mydomain.com/#!/a/b/c.  So, the line
    // here is to change the prefix back to empty string.
    $locationProvider.hashPrefix('');
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

    $sanitizeProvider.enableSvg(true);

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
  '$log', 'CsrfTokenService', 'DEV_MODE',
  function($log, CsrfTokenService, DEV_MODE) {
    var MIN_TIME_BETWEEN_ERRORS_MSEC = 5000;
    // Refer: https://docs.angularjs.org/guide/migration#-templaterequest-
    // The tpload error namespace has changed in Angular v1.7.
    // Previously, the tpload error was namespaced to $compile.
    // So, the code that matches errors of the form [$compile:tpload]
    // will no longer run in v1.7. It should be changed to match
    // [$templateRequest:tpload].
    var TPLOAD_STATUS_CODE_REGEX = (
      new RegExp(/\[\$templateRequest:tpload\].*p1=(.*?)&p2=/));
    var UNHANDLED_REJECTION_STATUS_CODE_REGEX = (
      /Possibly unhandled rejection: {.*"status":-1/);
    var timeOfLastPostedError = Date.now() - MIN_TIME_BETWEEN_ERRORS_MSEC;

    return function(exception, cause) {
      // Suppress unhandled rejection errors status code -1
      // because -1 is the status code for aborted requests.
      if (UNHANDLED_REJECTION_STATUS_CODE_REGEX.test(exception)) {
        return;
      }
      var tploadStatusCode = exception.message.match(TPLOAD_STATUS_CODE_REGEX);
      // Suppress tpload errors which occur with p1 of -1 in the error URL
      // because -1 is the status code for aborted requests.
      if (tploadStatusCode !== null && tploadStatusCode[1] === '-1') {
        return;
      }
      if (!DEV_MODE) {
        sourceMappedStackTrace.mapStackTrace(
          exception.stack, function(mappedStack) {
            var messageAndSourceAndStackTrace = [
              '',
              'Cause: ' + cause,
              exception.message,
              mappedStack.join('\n'),
              '    at URL: ' + window.location.href
            ].join('\n');
            var timeDifference = Date.now() - timeOfLastPostedError;
            // To prevent an overdose of errors, throttle to at most 1 error
            // every MIN_TIME_BETWEEN_ERRORS_MSEC.
            if (timeDifference > MIN_TIME_BETWEEN_ERRORS_MSEC) {
              // Catch all errors, to guard against infinite recursive loops.
              try {
                // We use jQuery here instead of Angular's $http, since the
                // latter creates a circular dependency.
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
          }
        );
      }
      $log.error.apply($log, arguments);
    };
  }
]);
