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

// TODO(sll): Remove the check for window.GLOBALS. This check is currently
// only there so that the Karma tests run, since it looks like Karma doesn't
// 'see' the GLOBALS variable that is defined in base.html. We should fix this
// in order to make the testing and production environments match.
var oppia = angular.module(
  'oppia', [
    'ngMaterial', 'ngAnimate', 'ngSanitize', 'ngTouch', 'ngResource',
    'ui.bootstrap', 'ui.sortable', 'infinite-scroll', 'ngJoyRide', 'ngImgCrop',
    'ui.validate', 'textAngular', 'pascalprecht.translate', 'ngCookies',
    'toastr'
  ].concat(
    window.GLOBALS ? (window.GLOBALS.ADDITIONAL_ANGULAR_MODULES || [])
                   : []));

// TODO(sll): Get this to read from a common JSON file; it's replicated in
// feconf.
oppia.constant('CATEGORY_LIST', GLOBALS.ALL_CATEGORIES);
oppia.constant(
  'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', '/explorationsummarieshandler/data');

// We use a slash because this character is forbidden in a state name.
oppia.constant('PLACEHOLDER_OUTCOME_DEST', '/');
oppia.constant('INTERACTION_DISPLAY_MODE_INLINE', 'inline');
oppia.constant('DEFAULT_RULE_NAME', 'Default');
oppia.constant('CLASSIFIER_RULESPEC_STR', 'FuzzyMatches');
oppia.constant('OBJECT_EDITOR_URL_PREFIX', '/object_editor_template/');
// Feature still in development.
// NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
oppia.constant('ENABLE_STRING_CLASSIFIER', false);
oppia.constant('DEFAULT_CLASSIFIER_RULE_SPEC', {
  rule_type: 'FuzzyMatches',
  inputs: {
    training_data: []
  }
});
oppia.constant('PARAMETER_TYPES', {
  REAL: 'Real',
  UNICODE_STRING: 'UnicodeString'
});

oppia.constant('EVENT_HTML_CHANGED', 'htmlChanged');

// The maximum number of nodes to show in a row of the state graph.
oppia.constant('MAX_NODES_PER_ROW', 4);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
oppia.constant('MAX_NODE_LABEL_LENGTH', 15);

// If an $http request fails with the following error codes, a warning is
// displayed.
oppia.constant('FATAL_ERROR_CODES', [400, 401, 404, 500]);

oppia.config([
  '$compileProvider', '$httpProvider', '$interpolateProvider',
  '$locationProvider',
  function(
      $compileProvider, $httpProvider, $interpolateProvider,
      $locationProvider) {
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
      '$q', '$log', 'alertsService', function($q, $log, alertsService) {
        return {
          request: function(config) {
            if (config.data) {
              config.data = $.param({
                csrf_token: GLOBALS.csrf_token,
                payload: JSON.stringify(config.data),
                source: document.URL
              }, true);
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
              alertsService.addWarning(warningMessage);
            }
            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);

oppia.config(['$provide', function($provide) {
  $provide.decorator('$log', ['$delegate', function($delegate) {
    var _originalError = $delegate.error;

    if (window.GLOBALS && !window.GLOBALS.DEV_MODE) {
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
  }]);
}]);

oppia.config(['toastrConfig', function(toastrConfig) {
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
    timeOut: 1500,
    titleClass: 'toast-title'
  });
}]);

// Returns true if the user is on a mobile device.
// See: http://stackoverflow.com/a/14301832/5020618
oppia.factory('deviceInfoService', ['$window', function($window) {
  return {
    isMobileDevice: function() {
      return typeof $window.orientation !== 'undefined';
    },
    hasTouchEvents: function() {
      return 'ontouchstart' in $window;
    }
  };
}]);

// Overwrite the built-in exceptionHandler service to log errors to the backend
// (so that they can be fixed).
oppia.factory('$exceptionHandler', ['$log', function($log) {
  return function(exception, cause) {
    var messageAndSourceAndStackTrace = [
      '',
      'Cause: ' + cause,
      'Source: ' + window.location.href,
      exception.message,
      String(exception.stack)
    ].join('\n');

    // Catch all errors, to guard against infinite recursive loops.
    try {
      // We use jQuery here instead of Angular's $http, since the latter
      // creates a circular dependency.
      $.ajax({
        type: 'POST',
        url: '/frontend_errors',
        data: $.param({
          csrf_token: GLOBALS.csrf_token,
          payload: JSON.stringify({
            error: messageAndSourceAndStackTrace
          }),
          source: document.URL
        }, true),
        contentType: 'application/x-www-form-urlencoded',
        dataType: 'text',
        async: true
      });
    } catch (loggingError) {
      $log.warn('Error logging failed.');
    }

    $log.error.apply($log, arguments);
  };
}]);

// Service for HTML serialization and escaping.
oppia.factory('oppiaHtmlEscaper', ['$log', function($log) {
  var htmlEscaper = {
    objToEscapedJson: function(obj) {
      return this.unescapedStrToEscapedStr(JSON.stringify(obj));
    },
    escapedJsonToObj: function(json) {
      if (!json) {
        $log.error('Empty string was passed to JSON decoder.');
        return '';
      }
      return JSON.parse(this.escapedStrToUnescapedStr(json));
    },
    unescapedStrToEscapedStr: function(str) {
      return String(str)
                  .replace(/&/g, '&amp;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
    },
    escapedStrToUnescapedStr: function(value) {
      return String(value)
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, '\'')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&');
    }
  };
  return htmlEscaper;
}]);

// Service for converting dates in milliseconds since the Epoch to
// human-readable dates.
oppia.factory('oppiaDatetimeFormatter', ['$filter', function($filter) {
  return {
    // Returns just the time if the local datetime representation has the
    // same date as the current date. Otherwise, returns just the date if the
    // local datetime representation has the same year as the current date.
    // Otherwise, returns the full date (with the year abbreviated).
    getLocaleAbbreviatedDatetimeString: function(millisSinceEpoch) {
      var date = new Date(millisSinceEpoch);
      if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
        // The replace function removes 'seconds' from the time returned.
        return date.toLocaleTimeString().replace(/:\d\d /, ' ');
      } else if (date.getFullYear() === new Date().getFullYear()) {
        return $filter('date')(date, 'MMM d');
      } else {
        return $filter('date')(date, 'shortDate');
      }
    },
    // Returns just the date.
    getLocaleDateString: function(millisSinceEpoch) {
      var date = new Date(millisSinceEpoch);
      return date.toLocaleDateString();
    },
    // Returns whether the date is at most one week before the current date.
    isRecent: function(millisSinceEpoch) {
      var ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
      return new Date().getTime() - millisSinceEpoch < ONE_WEEK_IN_MILLIS;
    }
  };
}]);

// Service for validating things and (optionally) displaying warning messages
// if the validation fails.
oppia.factory('validatorsService', [
    '$filter', 'alertsService', function($filter, alertsService) {
  return {
    /**
     * Checks whether an entity name is valid, and displays a warning message
     * if it isn't.
     * @param {string} input - The input to be checked.
     * @param {boolean} showWarnings - Whether to show warnings in the
     *   butterbar.
     * @return {boolean} True if the entity name is valid, false otherwise.
     */
    isValidEntityName: function(input, showWarnings, allowEmpty) {
      input = $filter('normalizeWhitespace')(input);
      if (!input && !allowEmpty) {
        if (showWarnings) {
          alertsService.addWarning('Please enter a non-empty name.');
        }
        return false;
      }

      for (var i = 0; i < GLOBALS.INVALID_NAME_CHARS.length; i++) {
        if (input.indexOf(GLOBALS.INVALID_NAME_CHARS[i]) !== -1) {
          if (showWarnings) {
            alertsService.addWarning(
             'Invalid input. Please use a non-empty description consisting ' +
             'of alphanumeric characters, spaces and/or hyphens.'
            );
          }
          return false;
        }
      }
      return true;
    },
    isValidExplorationTitle: function(input, showWarnings) {
      if (!this.isValidEntityName(input, showWarnings)) {
        return false;
      }

      if (input.length > 40) {
        if (showWarnings) {
          alertsService.addWarning(
            'Exploration titles should be at most 40 characters long.');
        }
        return false;
      }

      return true;
    },
    // NB: this does not check whether the card name already exists in the
    // states dict.
    isValidStateName: function(input, showWarnings) {
      if (!this.isValidEntityName(input, showWarnings)) {
        return false;
      }

      if (input.length > 50) {
        if (showWarnings) {
          alertsService.addWarning(
            'Card names should be at most 50 characters long.');
        }
        return false;
      }

      return true;
    },
    isNonempty: function(input, showWarnings) {
      if (!input) {
        if (showWarnings) {
          // TODO(sll): Allow this warning to be more specific in terms of what
          // needs to be entered.
          alertsService.addWarning('Please enter a non-empty value.');
        }
        return false;
      }
      return true;
    }
  };
}]);

// Service for generating random IDs.
oppia.factory('IdGenerationService', [function() {
  return {
    generateNewId: function() {
      return Math.random().toString(36).slice(2);
    }
  };
}]);

oppia.constant('LABEL_FOR_CLEARING_FOCUS', 'labelForClearingFocus');

// Service for setting focus. This broadcasts a 'focusOn' event which sets
// focus to the element in the page with the corresponding focusOn attribute.
// Note: This requires LABEL_FOR_CLEARING_FOCUS to exist somewhere in the HTML
// page.
oppia.factory('focusService', [
  '$rootScope', '$timeout', 'deviceInfoService', 'LABEL_FOR_CLEARING_FOCUS',
  'IdGenerationService',
  function(
      $rootScope, $timeout, deviceInfoService, LABEL_FOR_CLEARING_FOCUS,
      IdGenerationService) {
    var _nextLabelToFocusOn = null;
    return {
      clearFocus: function() {
        this.setFocus(LABEL_FOR_CLEARING_FOCUS);
      },
      setFocus: function(name) {
        if (_nextLabelToFocusOn) {
          return;
        }

        _nextLabelToFocusOn = name;
        $timeout(function() {
          $rootScope.$broadcast('focusOn', _nextLabelToFocusOn);
          _nextLabelToFocusOn = null;
        });
      },
      setFocusIfOnDesktop: function(newFocusLabel) {
        if (!deviceInfoService.isMobileDevice()) {
          this.setFocus(newFocusLabel);
        }
      },
      // Generates a random string (to be used as a focus label).
      generateFocusLabel: function() {
        return IdGenerationService.generateNewId();
      }
    };
  }
]);

// Service for manipulating the page URL.
oppia.factory('urlService', ['$window', function($window) {
  return {
    getUrlParams: function() {
      var params = {};
      var parts = $window.location.href.replace(
          /[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        params[key] = value;
      });
      return params;
    },
    isIframed: function() {
      var pathname = this.getPathname();
      var urlParts = pathname.split('/');
      return urlParts[1] === 'embed';
    },
    getPathname: function() {
      return window.location.pathname;
    }
  };
}]);

// Service for computing the window dimensions.
oppia.factory('windowDimensionsService', ['$window', function($window) {
  var onResizeHooks = [];

  $window.onresize = function() {
    onResizeHooks.forEach(function(hookFn) {
      hookFn();
    });
  };
  return {
    getWidth: function() {
      return (
        $window.innerWidth || document.documentElement.clientWidth ||
        document.body.clientWidth);
    },
    registerOnResizeHook: function(hookFn) {
      onResizeHooks.push(hookFn);
    },
    isWindowNarrow: function() {
      var NAVBAR_WITH_SEARCH_CUTOFF_WIDTH_PX = 1171;
      var NORMAL_NAVBAR_CUTOFF_WIDTH_PX = 800;
      var navbarHasSearchBar = (
        $window.location.pathname.indexOf('/search') === 0 ||
        $window.location.pathname.indexOf('/library') === 0);

      var navbarCutoffWidthPx = (
        navbarHasSearchBar ?
        NAVBAR_WITH_SEARCH_CUTOFF_WIDTH_PX :
        NORMAL_NAVBAR_CUTOFF_WIDTH_PX);
      return this.getWidth() <= navbarCutoffWidthPx;
    }
  };
}]);

// Service for sending events to Google Analytics.
//
// Note that events are only sent if the CAN_SEND_ANALYTICS_EVENTS flag is
// turned on. This flag must be turned on explicitly by the application
// owner in feconf.py.
oppia.factory('siteAnalyticsService', ['$window', function($window) {
  var CAN_SEND_ANALYTICS_EVENTS = GLOBALS.CAN_SEND_ANALYTICS_EVENTS;

  // For definitions of the various arguments, please see:
  // developers.google.com/analytics/devguides/collection/analyticsjs/events
  var _sendEventToGoogleAnalytics = function(
      eventCategory, eventAction, eventLabel) {
    if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
      $window.ga('send', 'event', eventCategory, eventAction, eventLabel);
    }
  };

  // For definitions of the various arguments, please see:
  // developers.google.com/analytics/devguides/collection/analyticsjs/
  //   social-interactions
  var _sendSocialEventToGoogleAnalytics = function(
      network, action, targetUrl) {
    if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
      $window.ga('send', 'social', network, action, targetUrl);
    }
  };

  return {
    // The srcElement refers to the element on the page that is clicked.
    registerStartLoginEvent: function(srcElement) {
      _sendEventToGoogleAnalytics(
        'LoginButton', 'click', $window.location.pathname + ' ' + srcElement);
    },
    registerNewSignupEvent: function() {
      _sendEventToGoogleAnalytics('SignupButton', 'click', '');
    },
    registerClickBrowseLibraryButtonEvent: function() {
      _sendEventToGoogleAnalytics(
        'BrowseLibraryButton', 'click', $window.location.pathname);
    },
    registerGoToDonationSiteEvent: function(donationSiteName) {
      _sendEventToGoogleAnalytics(
        'GoToDonationSite', 'click', donationSiteName);
    },
    registerApplyToTeachWithOppiaEvent: function() {
      _sendEventToGoogleAnalytics('ApplyToTeachWithOppia', 'click', '');
    },
    registerClickCreateExplorationButtonEvent: function() {
      _sendEventToGoogleAnalytics(
        'CreateExplorationButton', 'click', $window.location.pathname);
    },
    registerCreateNewExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics('NewExploration', 'create', explorationId);
    },
    registerCreateNewExplorationInCollectionEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'NewExplorationFromCollection', 'create', explorationId);
    },
    registerCreateNewCollectionEvent: function(collectionId) {
      _sendEventToGoogleAnalytics('NewCollection', 'create', collectionId);
    },
    registerCommitChangesToPrivateExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'CommitToPrivateExploration', 'click', explorationId);
    },
    registerShareExplorationEvent: function(network) {
      _sendSocialEventToGoogleAnalytics(
        network, 'share', $window.location.pathname);
    },
    registerOpenEmbedInfoEvent: function(explorationId) {
      _sendEventToGoogleAnalytics('EmbedInfoModal', 'open', explorationId);
    },
    registerCommitChangesToPublicExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'CommitToPublicExploration', 'click', explorationId);
    },
    // Metrics for tutorial on first creating exploration
    registerTutorialModalOpenEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'TutorialModalOpen', 'open', explorationId);
    },
    registerDeclineTutorialModalEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'DeclineTutorialModal', 'click', explorationId);
    },
    registerAcceptTutorialModalEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'AcceptTutorialModal', 'click', explorationId);
    },
    // Metrics for visiting the help center
    registerClickHelpButtonEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'ClickHelpButton', 'click', explorationId);
    },
    registerVisitHelpCenterEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'VisitHelpCenter', 'click', explorationId);
    },
    registerOpenTutorialFromHelpCenterEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'OpenTutorialFromHelpCenter', 'click', explorationId);
    },
    // Metrics for exiting the tutorial
    registerSkipTutorialEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'SkipTutorial', 'click', explorationId);
    },
    registerFinishTutorialEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FinishTutorial', 'click', explorationId);
    },
    // Metrics for first time editor use
    registerEditorFirstEntryEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstEnterEditor', 'open', explorationId);
    },
    registerFirstOpenContentBoxEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstOpenContentBox', 'open', explorationId);
    },
    registerFirstSaveContentEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSaveContent', 'click', explorationId);
    },
    registerFirstClickAddInteractionEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstClickAddInteraction', 'click', explorationId);
    },
    registerFirstSelectInteractionTypeEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSelectInteractionType', 'click', explorationId);
    },
    registerFirstSaveInteractionEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSaveInteraction', 'click', explorationId);
    },
    registerFirstSaveRuleEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstSaveRule', 'click', explorationId);
    },
    registerFirstCreateSecondStateEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'FirstCreateSecondState', 'create', explorationId);
    },
    // Metrics for publishing explorations
    registerSavePlayableExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'SavePlayableExploration', 'save', explorationId);
    },
    registerOpenPublishExplorationModalEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'PublishExplorationModal', 'open', explorationId);
    },
    registerPublishExplorationEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'PublishExploration', 'click', explorationId);
    },
    registerVisitOppiaFromIframeEvent: function(explorationId) {
      _sendEventToGoogleAnalytics(
        'VisitOppiaFromIframe', 'click', explorationId);
    }
  };
}]);

// Service for debouncing function calls.
oppia.factory('oppiaDebouncer', [function() {
  return {
    // Returns a function that will not be triggered as long as it continues to
    // be invoked. The function only gets executed after it stops being called
    // for `wait` milliseconds.
    debounce: function(func, millisecsToWait) {
      var timeout;
      var context;
      var args;
      var timestamp;
      var result;

      var later = function() {
        var last = new Date().getTime() - timestamp;
        if (last < millisecsToWait && last > 0) {
          timeout = setTimeout(later, millisecsToWait - last);
        } else {
          timeout = null;
          result = func.apply(context, args);
          if (!timeout) {
            context = null;
            args = null;
          }
        }
      };

      return function() {
        context = this;
        args = arguments;
        timestamp = new Date().getTime();
        if (!timeout) {
          timeout = setTimeout(later, millisecsToWait);
        }
        return result;
      };
    }
  };
}]);

// Shim service for functions on $window that allows these functions to be
// mocked in unit tests.
oppia.factory('currentLocationService', ['$window', function($window) {
  return {
    getHash: function() {
      return $window.location.hash;
    },
    getPathname: function() {
      return $window.location.pathname;
    }
  };
}]);

// Service for assembling extension tags (for gadgets and interactions).
oppia.factory('extensionTagAssemblerService', [
    '$filter', 'oppiaHtmlEscaper', function($filter, oppiaHtmlEscaper) {
  return {
    formatCustomizationArgAttrs: function(element, customizationArgSpecs) {
      for (var caSpecName in customizationArgSpecs) {
        var caSpecValue = customizationArgSpecs[caSpecName].value;
        element.attr(
          $filter('camelCaseToHyphens')(caSpecName) + '-with-value',
          oppiaHtmlEscaper.objToEscapedJson(caSpecValue));
      }
      return element;
    }
  };
}]);

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

// Service for code normalization. Used by the code REPL and pencil code
// interactions.
oppia.factory('codeNormalizationService', [function() {
  var removeLeadingWhitespace = function(str) {
    return str.replace(/^\s+/g, '');
  };
  var removeTrailingWhitespace = function(str) {
    return str.replace(/\s+$/g, '');
  };
  var removeIntermediateWhitespace = function(str) {
    return str.replace(/\s+/g, ' ');
  };
  return {
    getNormalizedCode: function(codeString) {
      /*
       * Normalizes a code string (which is assumed not to contain tab
       * characters). In particular:
       *
       * - Strips out lines that start with '#' (comments), possibly preceded by
       *     whitespace.
       * - Trims trailing whitespace on each line, and normalizes multiple
       *     whitespace characters within a single line into one space
       *     character.
       * - Removes blank newlines.
       * - Make the indentation level four spaces.
       */
      // TODO(sll): Augment this function to strip out comments that occur at
      // the end of a line. However, be careful with lines where '#' is
      // contained in quotes or the character is escaped.
      var FOUR_SPACES = '    ';
      // Maps the number of spaces at the beginning of a line to an int
      // specifying the desired indentation level.
      var numSpacesToDesiredIndentLevel = {
        0: 0
      };

      var codeLines = removeTrailingWhitespace(codeString).split('\n');
      var normalizedCodeLines = [];
      codeLines.forEach(function(line) {
        if (removeLeadingWhitespace(line).indexOf('#') === 0) {
          return;
        }
        line = removeTrailingWhitespace(line);
        if (!line) {
          return;
        }

        var numSpaces = line.length - removeLeadingWhitespace(line).length;

        var existingNumSpaces = Object.keys(numSpacesToDesiredIndentLevel);
        var maxNumSpaces = Math.max.apply(null, existingNumSpaces);
        if (numSpaces > maxNumSpaces) {
          // Add a new indentation level
          numSpacesToDesiredIndentLevel[numSpaces] = existingNumSpaces.length;
        }

        // This is set when the indentation level of the current line does not
        // start a new scope, and also does not match any previous indentation
        // level. This case is actually invalid, but for now, we take the
        // largest indentation level that is less than this one.
        // TODO(sll): Bad indentation should result in an error nearer the
        // source.
        var isShortfallLine =
          !numSpacesToDesiredIndentLevel.hasOwnProperty(numSpaces) &&
          numSpaces < maxNumSpaces;

        // Clear all existing indentation levels to the right of this one.
        for (var indentLength in numSpacesToDesiredIndentLevel) {
          if (Number(indentLength) > numSpaces) {
            delete numSpacesToDesiredIndentLevel[indentLength];
          }
        }

        if (isShortfallLine) {
          existingNumSpaces = Object.keys(numSpacesToDesiredIndentLevel);
          numSpaces = Math.max.apply(null, existingNumSpaces);
        }

        var normalizedLine = '';
        for (var i = 0; i < numSpacesToDesiredIndentLevel[numSpaces]; i++) {
          normalizedLine += FOUR_SPACES;
        }
        normalizedLine += removeIntermediateWhitespace(
          removeLeadingWhitespace(line));
        normalizedCodeLines.push(normalizedLine);
      });
      return normalizedCodeLines.join('\n');
    }
  };
}]);
