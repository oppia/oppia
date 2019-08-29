(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17"],{

/***/ "./core/templates/dev/head/App.ts":
/*!****************************************!*\
  !*** ./core/templates/dev/head/App.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
__webpack_require__(/*! directives/focus-on.directive.ts */ "./core/templates/dev/head/directives/focus-on.directive.ts");
__webpack_require__(/*! pages/Base.ts */ "./core/templates/dev/head/pages/Base.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! services/CsrfTokenService.ts */ "./core/templates/dev/head/services/CsrfTokenService.ts");
__webpack_require__(/*! services/NavigationService.ts */ "./core/templates/dev/head/services/NavigationService.ts");
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
__webpack_require__(/*! services/DebouncerService.ts */ "./core/templates/dev/head/services/DebouncerService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
__webpack_require__(/*! services/IdGenerationService.ts */ "./core/templates/dev/head/services/IdGenerationService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
__webpack_require__(/*! services/TranslationFileHashLoaderService.ts */ "./core/templates/dev/head/services/TranslationFileHashLoaderService.ts");
__webpack_require__(/*! services/RteHelperService.ts */ "./core/templates/dev/head/services/RteHelperService.ts");
__webpack_require__(/*! services/StateRulesStatsService.ts */ "./core/templates/dev/head/services/StateRulesStatsService.ts");
__webpack_require__(/*! services/ConstructTranslationIdsService.ts */ "./core/templates/dev/head/services/ConstructTranslationIdsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/PromoBarService.ts */ "./core/templates/dev/head/services/PromoBarService.ts");
__webpack_require__(/*! services/contextual/DeviceInfoService.ts */ "./core/templates/dev/head/services/contextual/DeviceInfoService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
__webpack_require__(/*! services/stateful/BackgroundMaskService.ts */ "./core/templates/dev/head/services/stateful/BackgroundMaskService.ts");
__webpack_require__(/*! services/stateful/FocusManagerService.ts */ "./core/templates/dev/head/services/stateful/FocusManagerService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! components/common-layout-directives/common-elements/alert-message.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/alert-message.directive.ts");
__webpack_require__(/*! components/button-directives/create-activity-button.directive.ts */ "./core/templates/dev/head/components/button-directives/create-activity-button.directive.ts");
__webpack_require__(/*! components/forms/custom-forms-directives/object-editor.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/object-editor.directive.ts");
__webpack_require__(/*! components/common-layout-directives/common-elements/promo-bar.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/promo-bar.directive.ts");
__webpack_require__(/*! components/common-layout-directives/navigation-bars/side-navigation-bar.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/navigation-bars/side-navigation-bar.directive.ts");
__webpack_require__(/*! components/button-directives/social-buttons.directive.ts */ "./core/templates/dev/head/components/button-directives/social-buttons.directive.ts");
__webpack_require__(/*! components/common-layout-directives/navigation-bars/top-navigation-bar.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/navigation-bars/top-navigation-bar.directive.ts");
__webpack_require__(/*! domain/sidebar/SidebarStatusService.ts */ "./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts");
__webpack_require__(/*! domain/user/UserInfoObjectFactory.ts */ "./core/templates/dev/head/domain/user/UserInfoObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! app.constants.ajs.ts */ "./core/templates/dev/head/app.constants.ajs.ts");
__webpack_require__(/*! google-analytics.initializer.ts */ "./core/templates/dev/head/google-analytics.initializer.ts");
// The following file uses constants in app.constants.ts and hence needs to be
// loaded after app.constants.ts
__webpack_require__(/*! I18nFooter.ts */ "./core/templates/dev/head/I18nFooter.ts");
angular.module('oppia').config([
    '$compileProvider', '$cookiesProvider', '$httpProvider',
    '$interpolateProvider', '$locationProvider',
    function ($compileProvider, $cookiesProvider, $httpProvider, $interpolateProvider, $locationProvider) {
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
            function ($q, $log, AlertsService, CsrfTokenService) {
                return {
                    request: function (config) {
                        if (config.data) {
                            return $q(function (resolve, reject) {
                                // Get CSRF token before sending the request.
                                CsrfTokenService.getTokenAsync().then(function (token) {
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
                    responseError: function (rejection) {
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
angular.module('oppia').config(['$provide', function ($provide) {
        $provide.decorator('$log', ['$delegate', 'DEV_MODE',
            function ($delegate, DEV_MODE) {
                var _originalError = $delegate.error;
                if (!DEV_MODE) {
                    $delegate.log = function () { };
                    $delegate.info = function () { };
                    // TODO(sll): Send errors (and maybe warnings) to the backend.
                    $delegate.warn = function () { };
                    $delegate.error = function (message) {
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
angular.module('oppia').config(['toastrConfig', function (toastrConfig) {
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
    '$log', 'CsrfTokenService', function ($log, CsrfTokenService) {
        var MIN_TIME_BETWEEN_ERRORS_MSEC = 5000;
        var timeOfLastPostedError = Date.now() - MIN_TIME_BETWEEN_ERRORS_MSEC;
        return function (exception, cause) {
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
                    CsrfTokenService.getTokenAsync().then(function (token) {
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
                }
                catch (loggingError) {
                    $log.warn('Error logging failed.');
                }
            }
            $log.error.apply($log, arguments);
        };
    }
]);
// Add a String.prototype.trim() polyfill for IE8.
if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}
// Add an Object.create() polyfill for IE8.
if (typeof Object.create !== 'function') {
    (function () {
        var F = function () { };
        Object.create = function (o) {
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
Number.isInteger = Number.isInteger || function (value) {
    return (typeof value === 'number' && isFinite(value) &&
        Math.floor(value) === value);
};
// Add Array.fill() polyfill for IE.
if (!Array.prototype.fill) {
    Object.defineProperty(Array.prototype, 'fill', {
        value: function (value) {
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


/***/ }),

/***/ "./core/templates/dev/head/I18nFooter.ts":
/*!***********************************************!*\
  !*** ./core/templates/dev/head/I18nFooter.ts ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Translation functions for Oppia.
 *
 * @author milagro.teruel@gmail.com (Milagro Teruel)
 */
__webpack_require__(/*! services/TranslationFileHashLoaderService.ts */ "./core/templates/dev/head/services/TranslationFileHashLoaderService.ts");
angular.module('oppia').directive('i18nFooter', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/i18n-footer.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$http', '$timeout', '$translate', 'UserService',
                'SUPPORTED_SITE_LANGUAGES',
                function ($http, $timeout, $translate, UserService, SUPPORTED_SITE_LANGUAGES) {
                    var ctrl = this;
                    // Changes the language of the translations.
                    var preferencesDataUrl = '/preferenceshandler/data';
                    var siteLanguageUrl = '/save_site_language';
                    ctrl.supportedSiteLanguages = SUPPORTED_SITE_LANGUAGES;
                    // The $timeout seems to be necessary for the dropdown to show
                    // anything at the outset, if the default language is not English.
                    $timeout(function () {
                        // $translate.use() returns undefined until the language file is
                        // fully loaded, which causes a blank field in the dropdown, hence
                        // we use $translate.proposedLanguage() as suggested in
                        // http://stackoverflow.com/a/28903658
                        ctrl.currentLanguageCode = $translate.use() ||
                            $translate.proposedLanguage();
                    }, 50);
                    ctrl.changeLanguage = function () {
                        $translate.use(ctrl.currentLanguageCode);
                        UserService.getUserInfoAsync().then(function (userInfo) {
                            if (userInfo.isLoggedIn()) {
                                $http.put(siteLanguageUrl, {
                                    site_language_code: ctrl.currentLanguageCode
                                });
                            }
                        });
                    };
                }
            ]
        };
    }
]);
angular.module('oppia').config([
    '$translateProvider', 'DEFAULT_TRANSLATIONS', 'SUPPORTED_SITE_LANGUAGES',
    function ($translateProvider, DEFAULT_TRANSLATIONS, SUPPORTED_SITE_LANGUAGES) {
        var availableLanguageKeys = [];
        var availableLanguageKeysMap = {};
        SUPPORTED_SITE_LANGUAGES.forEach(function (language) {
            availableLanguageKeys.push(language.id);
            availableLanguageKeysMap[language.id + '*'] = language.id;
        });
        availableLanguageKeysMap['*'] = 'en';
        $translateProvider
            .registerAvailableLanguageKeys(availableLanguageKeys, availableLanguageKeysMap)
            .useLoader('TranslationFileHashLoaderService', {
            prefix: '/i18n/',
            suffix: '.json'
        })
            // The use of default translation improves the loading time when English
            // is selected
            .translations('en', DEFAULT_TRANSLATIONS)
            .fallbackLanguage('en')
            .determinePreferredLanguage()
            .useCookieStorage()
            // The messageformat interpolation method is necessary for pluralization.
            // Is optional and should be passed as argument to the translate call. See
            // https://angular-translate.github.io/docs/#/guide/14_pluralization
            .addInterpolation('$translateMessageFormatInterpolation')
            // The strategy 'sanitize' does not support utf-8 encoding.
            // https://github.com/angular-translate/angular-translate/issues/1131
            // The strategy 'escape' will brake strings with raw html, like hyperlinks
            .useSanitizeValueStrategy('sanitizeParameters')
            .forceAsyncReload(true);
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/app.constants.ajs.ts":
/*!******************************************************!*\
  !*** ./core/templates/dev/head/app.constants.ajs.ts ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Shared constants for the Oppia module.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var app_constants_1 = __webpack_require__(/*! app.constants */ "./core/templates/dev/head/app.constants.ts");
var constants = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'constants.ts'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
for (var constantName in constants) {
    angular.module('oppia').constant(constantName, constants[constantName]);
}
// Translations of strings that are loaded in the front page. They are listed
// here to be loaded synchronously with the script to prevent a FOUC or
// Flash of Untranslated Content.
// See http://angular-translate.github.io/docs/#/guide/12_asynchronous-loading
angular.module('oppia').constant('DEFAULT_TRANSLATIONS', app_constants_1.AppConstants.DEFAULT_TRANSLATIONS);
angular.module('oppia').constant('RULE_SUMMARY_WRAP_CHARACTER_COUNT', app_constants_1.AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT);
/* Called always when learner moves to a new card.
   Also called when card is selected by clicking on progress dots */
angular.module('oppia').constant('EVENT_ACTIVE_CARD_CHANGED', app_constants_1.AppConstants.EVENT_ACTIVE_CARD_CHANGED);
/* Called when the learner moves to a new card that they haven't seen before. */
angular.module('oppia').constant('EVENT_NEW_CARD_OPENED', app_constants_1.AppConstants.EVENT_NEW_CARD_OPENED);
angular.module('oppia').constant('EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE', app_constants_1.AppConstants.EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE);
angular.module('oppia').constant('EDITABLE_EXPLORATION_DATA_URL_TEMPLATE', app_constants_1.AppConstants.EDITABLE_EXPLORATION_DATA_URL_TEMPLATE);
angular.module('oppia').constant('EXPLORATION_DATA_URL_TEMPLATE', app_constants_1.AppConstants.EXPLORATION_DATA_URL_TEMPLATE);
angular.module('oppia').constant('EXPLORATION_VERSION_DATA_URL_TEMPLATE', app_constants_1.AppConstants.EXPLORATION_VERSION_DATA_URL_TEMPLATE);
/* New card is available but user hasn't gone to it yet (when oppia
   gives a feedback and waits for user to press 'continue').
   Not called when a card is selected by clicking progress dots */
angular.module('oppia').constant('EVENT_NEW_CARD_AVAILABLE', app_constants_1.AppConstants.EVENT_NEW_CARD_AVAILABLE);
angular.module('oppia').constant('WARNING_TYPES', app_constants_1.AppConstants.WARNING_TYPES);
angular.module('oppia').constant('STATE_ERROR_MESSAGES', app_constants_1.AppConstants.STATE_ERROR_MESSAGES);
angular.module('oppia').constant('EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', app_constants_1.AppConstants.EXPLORATION_SUMMARY_DATA_URL_TEMPLATE);
angular.module('oppia').constant('EXPLORATION_AND_SKILL_ID_PATTERN', app_constants_1.AppConstants.EXPLORATION_AND_SKILL_ID_PATTERN);
// We use a slash because this character is forbidden in a state name.
angular.module('oppia').constant('PLACEHOLDER_OUTCOME_DEST', app_constants_1.AppConstants.PLACEHOLDER_OUTCOME_DEST);
angular.module('oppia').constant('INTERACTION_DISPLAY_MODE_INLINE', app_constants_1.AppConstants.INTERACTION_DISPLAY_MODE_INLINE);
angular.module('oppia').constant('LOADING_INDICATOR_URL', app_constants_1.AppConstants.LOADING_INDICATOR_URL);
angular.module('oppia').constant('OBJECT_EDITOR_URL_PREFIX', app_constants_1.AppConstants.OBJECT_EDITOR_URL_PREFIX);
// Feature still in development.
// NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
angular.module('oppia').constant('ENABLE_ML_CLASSIFIERS', app_constants_1.AppConstants.ENABLE_ML_CLASSIFIERS);
// Feature still in development.
angular.module('oppia').constant('INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION', app_constants_1.AppConstants.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION);
angular.module('oppia').constant('PARAMETER_TYPES', app_constants_1.AppConstants.PARAMETER_TYPES);
// The maximum number of nodes to show in a row of the state graph.
angular.module('oppia').constant('MAX_NODES_PER_ROW', app_constants_1.AppConstants.MAX_NODES_PER_ROW);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
angular.module('oppia').constant('MAX_NODE_LABEL_LENGTH', app_constants_1.AppConstants.MAX_NODE_LABEL_LENGTH);
// If an $http request fails with the following error codes, a warning is
// displayed.
angular.module('oppia').constant('FATAL_ERROR_CODES', app_constants_1.AppConstants.FATAL_ERROR_CODES);
// Do not modify these, for backwards-compatibility reasons.
angular.module('oppia').constant('COMPONENT_NAME_CONTENT', app_constants_1.AppConstants.COMPONENT_NAME_CONTENT);
angular.module('oppia').constant('COMPONENT_NAME_HINT', app_constants_1.AppConstants.COMPONENT_NAME_HINT);
angular.module('oppia').constant('COMPONENT_NAME_SOLUTION', app_constants_1.AppConstants.COMPONENT_NAME_SOLUTION);
angular.module('oppia').constant('COMPONENT_NAME_FEEDBACK', app_constants_1.AppConstants.COMPONENT_NAME_FEEDBACK);
angular.module('oppia').constant('COMPONENT_NAME_EXPLANATION', app_constants_1.AppConstants.COMPONENT_NAME_EXPLANATION);
angular.module('oppia').constant('COMPONENT_NAME_WORKED_EXAMPLE', app_constants_1.AppConstants.COMPONENT_NAME_WORKED_EXAMPLE);
angular.module('oppia').constant('ACTION_TYPE_EXPLORATION_START', app_constants_1.AppConstants.ACTION_TYPE_EXPLORATION_START);
angular.module('oppia').constant('ACTION_TYPE_ANSWER_SUBMIT', app_constants_1.AppConstants.ACTION_TYPE_ANSWER_SUBMIT);
angular.module('oppia').constant('ACTION_TYPE_EXPLORATION_QUIT', app_constants_1.AppConstants.ACTION_TYPE_EXPLORATION_QUIT);
angular.module('oppia').constant('ISSUE_TYPE_EARLY_QUIT', app_constants_1.AppConstants.ISSUE_TYPE_EARLY_QUIT);
angular.module('oppia').constant('ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS', app_constants_1.AppConstants.ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS);
angular.module('oppia').constant('ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS', app_constants_1.AppConstants.ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS);
angular.module('oppia').constant('SITE_NAME', app_constants_1.AppConstants.SITE_NAME);
angular.module('oppia').constant('DEFAULT_PROFILE_IMAGE_PATH', app_constants_1.AppConstants.DEFAULT_PROFILE_IMAGE_PATH);
angular.module('oppia').constant('LOGOUT_URL', app_constants_1.AppConstants.LOGOUT_URL);
angular.module('oppia').constant('EVENT_QUESTION_SUMMARIES_INITIALIZED', app_constants_1.AppConstants.EVENT_QUESTION_SUMMARIES_INITIALIZED);
// TODO(vojtechjelinek): Move these to separate file later, after we establish
// process to follow for Angular constants (#6731).
angular.module('oppia').constant('SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE', app_constants_1.AppConstants.SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE);
angular.module('oppia').constant('EDITABLE_TOPIC_DATA_URL_TEMPLATE', app_constants_1.AppConstants.EDITABLE_TOPIC_DATA_URL_TEMPLATE);
angular.module('oppia').constant('LABEL_FOR_CLEARING_FOCUS', app_constants_1.AppConstants.LABEL_FOR_CLEARING_FOCUS);
// TODO(bhenning): This constant should be provided by the backend.
angular.module('oppia').constant('COLLECTION_DATA_URL_TEMPLATE', app_constants_1.AppConstants.COLLECTION_DATA_URL_TEMPLATE);
angular.module('oppia').constant('ENTITY_TYPE', app_constants_1.AppConstants.ENTITY_TYPE);


/***/ }),

/***/ "./core/templates/dev/head/app.constants.ts":
/*!**************************************************!*\
  !*** ./core/templates/dev/head/app.constants.ts ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Shared constants for the Oppia module.
 */
var AppConstants = /** @class */ (function () {
    function AppConstants() {
    }
    AppConstants.DEFAULT_TRANSLATIONS = {
        I18N_LIBRARY_PAGE_TITLE: 'Library',
        I18N_LIBRARY_LOADING: 'Loading',
        I18N_SIGNUP_PAGE_SUBTITLE: 'Registration',
        I18N_SIGNUP_PAGE_TITLE: 'Oppia',
        I18N_LIBRARY_SEARCH_PLACEHOLDER: 'What are you curious about?',
        I18N_LIBRARY_ALL_LANGUAGES: 'All Languages',
        I18N_LIBRARY_LANGUAGES_EN: 'English',
        I18N_LIBRARY_ALL_CATEGORIES: 'All Categories',
        I18N_TOPNAV_SIGN_IN: 'Sign in',
        I18N_SPLASH_PAGE_TITLE: 'Oppia: Teach, Learn, Explore',
        I18N_SIGNUP_REGISTRATION: 'Registration',
        I18N_SIGNUP_LOADING: 'Loading'
    };
    AppConstants.ACTIVITY_STATUS_PRIVATE = 'private';
    AppConstants.ACTIVITY_STATUS_PUBLIC = 'public';
    AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT = 30;
    /* Called always when learner moves to a new card.
       Also called when card is selected by clicking on progress dots */
    AppConstants.EVENT_ACTIVE_CARD_CHANGED = 'activeCardChanged';
    /* Called when the learner moves to a new card that they haven't seen
       before. */
    AppConstants.EVENT_NEW_CARD_OPENED = 'newCardOpened';
    AppConstants.EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE = '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>';
    AppConstants.EDITABLE_EXPLORATION_DATA_URL_TEMPLATE = '/createhandler/data/<exploration_id>';
    AppConstants.EXPLORATION_DATA_URL_TEMPLATE = '/explorehandler/init/<exploration_id>';
    AppConstants.EXPLORATION_VERSION_DATA_URL_TEMPLATE = '/explorehandler/init/<exploration_id>?v=<version>';
    /* New card is available but user hasn't gone to it yet (when oppia
       gives a feedback and waits for user to press 'continue.
       Not called when a card is selected by clicking progress dots */
    AppConstants.EVENT_NEW_CARD_AVAILABLE = 'newCardAvailable';
    AppConstants.WARNING_TYPES = {
        // These must be fixed before the exploration can be saved.
        CRITICAL: 'critical',
        // These must be fixed before publishing an exploration to the public
        // library.
        ERROR: 'error'
    };
    AppConstants.STATE_ERROR_MESSAGES = {
        ADD_INTERACTION: 'Please add an interaction to this card.',
        STATE_UNREACHABLE: 'This card is unreachable.',
        UNABLE_TO_END_EXPLORATION: ('There\'s no way to complete the exploration starting from this card. ' +
            'To fix this, make sure that the last card in the chain starting from' +
            ' this one has an \'End Exploration\' question type.'),
        INCORRECT_SOLUTION: ('The current solution does not lead to another card.'),
        UNRESOLVED_ANSWER: ('There is an answer among the top 10 which has no explicit feedback.')
    };
    AppConstants.EXPLORATION_SUMMARY_DATA_URL_TEMPLATE = '/explorationsummarieshandler/data';
    AppConstants.EXPLORATION_AND_SKILL_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
    // We use a slash because this character is forbidden in a state name.
    AppConstants.PLACEHOLDER_OUTCOME_DEST = '/';
    AppConstants.INTERACTION_DISPLAY_MODE_INLINE = 'inline';
    AppConstants.LOADING_INDICATOR_URL = '/activity/loadingIndicator.gif';
    AppConstants.OBJECT_EDITOR_URL_PREFIX = '/object_editor_template/';
    // Feature still in development.
    // NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
    AppConstants.ENABLE_ML_CLASSIFIERS = false;
    // Feature still in development.
    AppConstants.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION = 'The current solution does not lead to another card.';
    AppConstants.PARAMETER_TYPES = {
        REAL: 'Real',
        UNICODE_STRING: 'UnicodeString'
    };
    // The maximum number of nodes to show in a row of the state graph.
    AppConstants.MAX_NODES_PER_ROW = 4;
    // The following variable must be at least 3. It represents the maximum
    // length, in characters, for the name of each node label in the state graph.
    AppConstants.MAX_NODE_LABEL_LENGTH = 15;
    // If an $http request fails with the following error codes, a warning is
    // displayed.
    AppConstants.FATAL_ERROR_CODES = [400, 401, 404, 500];
    // Do not modify these, for backwards-compatibility reasons.
    AppConstants.COMPONENT_NAME_CONTENT = 'content';
    AppConstants.COMPONENT_NAME_HINT = 'hint';
    AppConstants.COMPONENT_NAME_SOLUTION = 'solution';
    AppConstants.COMPONENT_NAME_FEEDBACK = 'feedback';
    AppConstants.COMPONENT_NAME_EXPLANATION = 'explanation';
    AppConstants.COMPONENT_NAME_WORKED_EXAMPLE = 'worked_example';
    AppConstants.ACTION_TYPE_EXPLORATION_START = 'ExplorationStart';
    AppConstants.ACTION_TYPE_ANSWER_SUBMIT = 'AnswerSubmit';
    AppConstants.ACTION_TYPE_EXPLORATION_QUIT = 'ExplorationQuit';
    AppConstants.ISSUE_TYPE_EARLY_QUIT = 'EarlyQuit';
    AppConstants.ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS = 'MultipleIncorrectSubmissions';
    AppConstants.ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS = 'CyclicStateTransitions';
    AppConstants.SITE_NAME = 'Oppia.org';
    AppConstants.DEFAULT_PROFILE_IMAGE_PATH = '/avatar/user_blue_72px.png';
    AppConstants.LOGOUT_URL = '/logout';
    AppConstants.EVENT_QUESTION_SUMMARIES_INITIALIZED = 'questionSummariesInitialized';
    // TODO(vojtechjelinek): Move these to separate file later, after we establish
    // process to follow for Angular constants (#6731).
    AppConstants.SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE = '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>';
    AppConstants.EDITABLE_TOPIC_DATA_URL_TEMPLATE = '/topic_editor_handler/data/<topic_id>';
    AppConstants.LABEL_FOR_CLEARING_FOCUS = 'labelForClearingFocus';
    // TODO(bhenning): This constant should be provided by the backend.
    AppConstants.COLLECTION_DATA_URL_TEMPLATE = '/collection_handler/data/<collection_id>';
    AppConstants.ENTITY_TYPE = {
        EXPLORATION: 'exploration',
        TOPIC: 'topic',
        SKILL: 'skill',
        STORY: 'story',
        SUBTOPIC: 'subtopic'
    };
    return AppConstants;
}());
exports.AppConstants = AppConstants;
var constants = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'constants.ts'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
Object.assign(AppConstants, constants);


/***/ }),

/***/ "./core/templates/dev/head/components/button-directives/create-activity-button.directive.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/create-activity-button.directive.ts ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the Create Exploration/Collection button.
 */
__webpack_require__(/*! components/entity-creation-services/collection-creation.service.ts */ "./core/templates/dev/head/components/entity-creation-services/collection-creation.service.ts");
__webpack_require__(/*! components/entity-creation-services/exploration-creation.service.ts */ "./core/templates/dev/head/components/entity-creation-services/exploration-creation.service.ts");
__webpack_require__(/*! domain/utilities/BrowserCheckerService.ts */ "./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('oppia').directive('createActivityButton', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/button-directives/create-activity-button.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$timeout', '$window', '$uibModal',
                'ExplorationCreationService', 'CollectionCreationService',
                'SiteAnalyticsService', 'UrlService', 'UserService',
                'ALLOW_YAML_FILE_UPLOAD',
                function ($timeout, $window, $uibModal, ExplorationCreationService, CollectionCreationService, SiteAnalyticsService, UrlService, UserService, ALLOW_YAML_FILE_UPLOAD) {
                    var ctrl = this;
                    ctrl.creationInProgress = false;
                    ctrl.allowYamlFileUpload = ALLOW_YAML_FILE_UPLOAD;
                    ctrl.canCreateCollections = null;
                    ctrl.userIsLoggedIn = null;
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        ctrl.canCreateCollections = userInfo.canCreateCollections();
                        ctrl.userIsLoggedIn = userInfo.isLoggedIn();
                    });
                    ctrl.showUploadExplorationModal = (ExplorationCreationService.showUploadExplorationModal);
                    ctrl.onRedirectToLogin = function (destinationUrl) {
                        SiteAnalyticsService.registerStartLoginEvent('createActivityButton');
                        $timeout(function () {
                            $window.location = destinationUrl;
                        }, 150);
                        return false;
                    };
                    ctrl.initCreationProcess = function () {
                        // Without this, the modal keeps reopening when the window is
                        // resized.
                        if (ctrl.creationInProgress) {
                            return;
                        }
                        ctrl.creationInProgress = true;
                        if (!ctrl.canCreateCollections) {
                            ExplorationCreationService.createNewExploration();
                        }
                        else if (UrlService.getPathname() !== '/creator_dashboard') {
                            $window.location.replace('/creator_dashboard?mode=create');
                        }
                        else {
                            $uibModal.open({
                                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/creator-dashboard-page/modal-templates/' +
                                    'create-activity-modal.directive.html'),
                                backdrop: true,
                                controller: [
                                    '$scope', '$uibModalInstance',
                                    function ($scope, $uibModalInstance) {
                                        UserService.getUserInfoAsync().then(function (userInfo) {
                                            $scope.canCreateCollections = (userInfo.canCreateCollections());
                                        });
                                        $scope.chooseExploration = function () {
                                            ExplorationCreationService.createNewExploration();
                                            $uibModalInstance.close();
                                        };
                                        $scope.chooseCollection = function () {
                                            CollectionCreationService.createNewCollection();
                                            $uibModalInstance.close();
                                        };
                                        $scope.cancel = function () {
                                            $uibModalInstance.dismiss('cancel');
                                        };
                                        $scope.explorationImgUrl = (UrlInterpolationService.getStaticImageUrl('/activity/exploration.svg'));
                                        $scope.collectionImgUrl = (UrlInterpolationService.getStaticImageUrl('/activity/collection.svg'));
                                    }
                                ],
                                windowClass: 'oppia-creation-modal'
                            }).result.then(function () { }, function () {
                                ctrl.creationInProgress = false;
                            });
                        }
                    };
                    // If the user clicked on a 'create' button to get to the dashboard,
                    // open the create modal immediately (or redirect to the exploration
                    // editor if the create modal does not need to be shown).
                    if (UrlService.getUrlParams().mode === 'create') {
                        if (!ctrl.canCreateCollections) {
                            ExplorationCreationService.createNewExploration();
                        }
                        else {
                            ctrl.initCreationProcess();
                        }
                    }
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/button-directives/social-buttons.directive.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/social-buttons.directive.ts ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the social buttons displayed in footer.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('socialButtons', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/button-directives/social-buttons.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () {
                    var ctrl = this;
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/common-elements/alert-message.directive.ts":
/*!****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-elements/alert-message.directive.ts ***!
  \****************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for Alert Messages
 */
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').directive('alertMessage', [function () {
        return {
            restrict: 'E',
            scope: {
                getMessage: '&messageObject',
                getMessageIndex: '&messageIndex'
            },
            template: '<div class="oppia-alert-message"></div>',
            controller: [
                '$scope', 'AlertsService', 'toastr',
                function ($scope, AlertsService, toastr) {
                    $scope.AlertsService = AlertsService;
                    $scope.toastr = toastr;
                }
            ],
            link: function (scope) {
                var message = scope.getMessage();
                if (message.type === 'info') {
                    scope.toastr.info(message.content, {
                        timeOut: message.timeout,
                        onHidden: function () {
                            scope.AlertsService.deleteMessage(message);
                        }
                    });
                }
                else if (message.type === 'success') {
                    scope.toastr.success(message.content, {
                        timeOut: message.timeout,
                        onHidden: function () {
                            scope.AlertsService.deleteMessage(message);
                        }
                    });
                }
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/common-elements/promo-bar.directive.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-elements/promo-bar.directive.ts ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a promo bar that appears at the top of the
 * screen. The bar is configurable with a message and whether the promo is
 * dismissible.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/PromoBarService.ts */ "./core/templates/dev/head/services/PromoBarService.ts");
angular.module('oppia').directive('promoBar', [
    '$window', 'PromoBarService', 'UrlInterpolationService',
    function ($window, PromoBarService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/common-elements/' +
                'promo-bar.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                function () {
                    var ctrl = this;
                    var isPromoDismissed = function () {
                        if (!$window.hasOwnProperty('sessionStorage')) {
                            return false;
                        }
                        return !!angular.fromJson($window.sessionStorage.promoIsDismissed);
                    };
                    var setPromoDismissed = function (promoIsDismissed) {
                        if (!$window.hasOwnProperty('sessionStorage')) {
                            return;
                        }
                        $window.sessionStorage.promoIsDismissed = angular.toJson(promoIsDismissed);
                    };
                    PromoBarService.getPromoBarData().then(function (promoBarObject) {
                        ctrl.promoBarIsEnabled = promoBarObject.promoBarEnabled;
                        ctrl.promoBarMessage = promoBarObject.promoBarMessage;
                    });
                    // TODO(bhenning): Utilize cookies for tracking when a promo is
                    // dismissed. Cookies allow for a longer-lived memory of whether the
                    // promo is dismissed.
                    ctrl.promoIsVisible = !isPromoDismissed();
                    ctrl.dismissPromo = function () {
                        ctrl.promoIsVisible = false;
                        setPromoDismissed(true);
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/navigation-bars/side-navigation-bar.directive.ts":
/*!**********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/navigation-bars/side-navigation-bar.directive.ts ***!
  \**********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the side navigation bar.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('sideNavigationBar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/navigation-bars/' +
                'side-navigation-bar.directive.html'),
            controllerAs: '$ctrl',
            controller: ['$timeout', function ($timeout) {
                    var ctrl = this;
                    ctrl.currentUrl = window.location.pathname;
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/navigation-bars/top-navigation-bar.directive.ts":
/*!*********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/navigation-bars/top-navigation-bar.directive.ts ***!
  \*********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the top navigation bar. This excludes the part
 * of the navbar that is used for local navigation (such as the various tabs in
 * the editor pages).
 */
__webpack_require__(/*! domain/sidebar/SidebarStatusService.ts */ "./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/DebouncerService.ts */ "./core/templates/dev/head/services/DebouncerService.ts");
__webpack_require__(/*! services/NavigationService.ts */ "./core/templates/dev/head/services/NavigationService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/contextual/DeviceInfoService.ts */ "./core/templates/dev/head/services/contextual/DeviceInfoService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('oppia').directive('topNavigationBar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/navigation-bars/' +
                'top-navigation-bar.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$http', '$window', '$timeout', '$translate',
                'SidebarStatusService', 'LABEL_FOR_CLEARING_FOCUS', 'UserService',
                'SiteAnalyticsService', 'NavigationService', 'WindowDimensionsService',
                'DebouncerService', 'DeviceInfoService', 'LOGOUT_URL',
                function ($scope, $http, $window, $timeout, $translate, SidebarStatusService, LABEL_FOR_CLEARING_FOCUS, UserService, SiteAnalyticsService, NavigationService, WindowDimensionsService, DebouncerService, DeviceInfoService, LOGOUT_URL) {
                    var ctrl = this;
                    ctrl.isModerator = null;
                    ctrl.isAdmin = null;
                    ctrl.isTopicManager = null;
                    ctrl.isSuperAdmin = null;
                    ctrl.userIsLoggedIn = null;
                    ctrl.username = '';
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        if (userInfo.getPreferredSiteLanguageCode()) {
                            $translate.use(userInfo.getPreferredSiteLanguageCode());
                        }
                        ctrl.isModerator = userInfo.isModerator();
                        ctrl.isAdmin = userInfo.isAdmin();
                        ctrl.isTopicManager = userInfo.isTopicManager();
                        ctrl.isSuperAdmin = userInfo.isSuperAdmin();
                        ctrl.userIsLoggedIn = userInfo.isLoggedIn();
                        ctrl.username = userInfo.getUsername();
                        if (ctrl.username) {
                            ctrl.profilePageUrl = UrlInterpolationService.interpolateUrl('/profile/<username>', {
                                username: ctrl.username
                            });
                        }
                        if (ctrl.userIsLoggedIn) {
                            // Show the number of unseen notifications in the navbar and page
                            // title, unless the user is already on the dashboard page.
                            $http.get('/notificationshandler').then(function (response) {
                                var data = response.data;
                                if ($window.location.pathname !== '/') {
                                    ctrl.numUnseenNotifications = data.num_unseen_notifications;
                                    if (ctrl.numUnseenNotifications > 0) {
                                        $window.document.title = ('(' + ctrl.numUnseenNotifications + ') ' +
                                            $window.document.title);
                                    }
                                }
                            });
                        }
                    });
                    UserService.getProfileImageDataUrlAsync().then(function (dataUrl) {
                        ctrl.profilePictureDataUrl = dataUrl;
                    });
                    var NAV_MODE_SIGNUP = 'signup';
                    var NAV_MODES_WITH_CUSTOM_LOCAL_NAV = [
                        'create', 'explore', 'collection', 'collection_editor',
                        'topics_and_skills_dashboard', 'topic_editor', 'skill_editor',
                        'story_editor'
                    ];
                    ctrl.currentUrl = window.location.pathname.split('/')[1];
                    ctrl.LABEL_FOR_CLEARING_FOCUS = LABEL_FOR_CLEARING_FOCUS;
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                    ctrl.logoutUrl = LOGOUT_URL;
                    ctrl.userMenuIsShown = (ctrl.currentUrl !== NAV_MODE_SIGNUP);
                    ctrl.standardNavIsShown = (NAV_MODES_WITH_CUSTOM_LOCAL_NAV.indexOf(ctrl.currentUrl) === -1);
                    ctrl.onLoginButtonClicked = function () {
                        SiteAnalyticsService.registerStartLoginEvent('loginButton');
                        UserService.getLoginUrlAsync().then(function (loginUrl) {
                            if (loginUrl) {
                                $timeout(function () {
                                    $window.location = loginUrl;
                                }, 150);
                            }
                            else {
                                throw Error('Login url not found.');
                            }
                        });
                    };
                    ctrl.googleSignInIconUrl = (UrlInterpolationService.getStaticImageUrl('/google_signin_buttons/google_signin.svg'));
                    ctrl.onLogoutButtonClicked = function () {
                        $window.localStorage.removeItem('last_uploaded_audio_lang');
                    };
                    ctrl.ACTION_OPEN = NavigationService.ACTION_OPEN;
                    ctrl.ACTION_CLOSE = NavigationService.ACTION_CLOSE;
                    ctrl.KEYBOARD_EVENT_TO_KEY_CODES =
                        NavigationService.KEYBOARD_EVENT_TO_KEY_CODES;
                    /**
                     * Opens the submenu.
                     * @param {object} evt
                     * @param {String} menuName - name of menu, on which
                     * open/close action to be performed (aboutMenu,profileMenu).
                     */
                    ctrl.openSubmenu = function (evt, menuName) {
                        // Focus on the current target before opening its submenu.
                        NavigationService.openSubmenu(evt, menuName);
                    };
                    ctrl.blurNavigationLinks = function (evt) {
                        // This is required because if about submenu is in open state
                        // and when you hover on library, both will be highlighted,
                        // To avoid that, blur all the a's in nav, so that only one
                        // will be highlighted.
                        $('nav a').blur();
                    };
                    ctrl.closeSubmenu = function (evt) {
                        NavigationService.closeSubmenu(evt);
                    };
                    ctrl.closeSubmenuIfNotMobile = function (evt) {
                        if (DeviceInfoService.isMobileDevice()) {
                            return;
                        }
                        ctrl.closeSubmenu(evt);
                    };
                    /**
                     * Handles keydown events on menus.
                     * @param {object} evt
                     * @param {String} menuName - name of menu to perform action
                     * on(aboutMenu/profileMenu)
                     * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
                     * corresponding actions to be performed(open/close).
                     *
                     * @example
                     *  onMenuKeypress($event, 'aboutMenu', {enter: 'open'})
                     */
                    ctrl.onMenuKeypress = function (evt, menuName, eventsTobeHandled) {
                        NavigationService.onMenuKeypress(evt, menuName, eventsTobeHandled);
                        ctrl.activeMenuName = NavigationService.activeMenuName;
                    };
                    // Close the submenu if focus or click occurs anywhere outside of
                    // the menu or outside of its parent (which opens submenu on hover).
                    angular.element(document).on('click', function (evt) {
                        if (!angular.element(evt.target).closest('li').length) {
                            ctrl.activeMenuName = '';
                            $scope.$apply();
                        }
                    });
                    ctrl.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
                    var currentWindowWidth = WindowDimensionsService.getWidth();
                    ctrl.navElementsVisibilityStatus = {};
                    // The order of the elements in this array specifies the order in
                    // which they will be hidden. Earlier elements will be hidden first.
                    var NAV_ELEMENTS_ORDER = [
                        'I18N_TOPNAV_DONATE', 'I18N_TOPNAV_ABOUT',
                        'I18N_CREATE_EXPLORATION_CREATE', 'I18N_TOPNAV_LIBRARY'
                    ];
                    for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
                        ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] = true;
                    }
                    WindowDimensionsService.registerOnResizeHook(function () {
                        ctrl.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
                        $scope.$apply();
                        // If window is resized larger, try displaying the hidden elements.
                        if (currentWindowWidth < WindowDimensionsService.getWidth()) {
                            for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
                                if (!ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]]) {
                                    ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] =
                                        true;
                                }
                            }
                        }
                        // Close the sidebar, if necessary.
                        SidebarStatusService.closeSidebar();
                        ctrl.sidebarIsShown = SidebarStatusService.isSidebarShown();
                        currentWindowWidth = WindowDimensionsService.getWidth();
                        truncateNavbarDebounced();
                    });
                    ctrl.isSidebarShown = function () {
                        if (SidebarStatusService.isSidebarShown()) {
                            angular.element(document.body).addClass('oppia-stop-scroll');
                        }
                        else {
                            angular.element(document.body).removeClass('oppia-stop-scroll');
                        }
                        return SidebarStatusService.isSidebarShown();
                    };
                    ctrl.toggleSidebar = function () {
                        SidebarStatusService.toggleSidebar();
                    };
                    /**
                     * Checks if i18n has been run.
                     * If i18n has not yet run, the <a> and <span> tags will have
                     * no text content, so their innerText.length value will be 0.
                     * @returns {boolean}
                     */
                    var checkIfI18NCompleted = function () {
                        var i18nCompleted = true;
                        var tabs = document.querySelectorAll('.oppia-navbar-tab-content');
                        for (var i = 0; i < tabs.length; i++) {
                            if (tabs[i].innerText.length === 0) {
                                i18nCompleted = false;
                                break;
                            }
                        }
                        return i18nCompleted;
                    };
                    /**
                     * Checks if window is >768px and i18n is completed, then checks
                     * for overflow. If overflow is detected, hides the least important
                     * tab and then calls itself again after a 50ms delay.
                     */
                    var truncateNavbar = function () {
                        // If the window is narrow, the standard nav tabs are not shown.
                        if (WindowDimensionsService.isWindowNarrow()) {
                            return;
                        }
                        // If i18n hasn't completed, retry after 100ms.
                        if (!checkIfI18NCompleted()) {
                            $timeout(truncateNavbar, 100);
                            return;
                        }
                        // The value of 60px used here comes from measuring the normal
                        // height of the navbar (56px) in Chrome's inspector and rounding
                        // up. If the height of the navbar is changed in the future this
                        // will need to be updated.
                        if (document.querySelector('div.collapse.navbar-collapse')
                            .clientHeight > 60) {
                            for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
                                if (ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]]) {
                                    // Hide one element, then check again after 50ms.
                                    // This gives the browser time to render the visibility
                                    // change.
                                    ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] =
                                        false;
                                    // Force a digest cycle to hide element immediately.
                                    // Otherwise it would be hidden after the next call.
                                    // This is due to setTimeout use in debounce.
                                    $scope.$apply();
                                    $timeout(truncateNavbar, 50);
                                    return;
                                }
                            }
                        }
                    };
                    var truncateNavbarDebounced = DebouncerService.debounce(truncateNavbar, 500);
                    // The function needs to be run after i18n. A timeout of 0 appears to
                    // run after i18n in Chrome, but not other browsers. The function will
                    // check if i18n is complete and set a new timeout if it is not. Since
                    // a timeout of 0 works for at least one browser, it is used here.
                    $timeout(truncateNavbar, 0);
                    $scope.$on('searchBarLoaded', function () {
                        $timeout(truncateNavbar, 100);
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/entity-creation-services/collection-creation.service.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/entity-creation-services/collection-creation.service.ts ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Modal and functionality for the create collection button.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
// TODO(bhenning): Refactor this to match the frontend design spec and reduce
// duplicated code between CollectionCreationService and
// ExplorationCreationService.
angular.module('oppia').factory('CollectionCreationService', [
    '$http', '$rootScope', '$timeout', '$window', 'AlertsService',
    'SiteAnalyticsService', 'UrlInterpolationService',
    function ($http, $rootScope, $timeout, $window, AlertsService, SiteAnalyticsService, UrlInterpolationService) {
        var CREATE_NEW_COLLECTION_URL_TEMPLATE = ('/collection_editor/create/<collection_id>');
        var collectionCreationInProgress = false;
        return {
            createNewCollection: function () {
                if (collectionCreationInProgress) {
                    return;
                }
                collectionCreationInProgress = true;
                AlertsService.clearWarnings();
                $rootScope.loadingMessage = 'Creating collection';
                $http.post('/collection_editor_handler/create_new', {})
                    .then(function (response) {
                    SiteAnalyticsService.registerCreateNewCollectionEvent(response.data.collectionId);
                    $timeout(function () {
                        $window.location = UrlInterpolationService.interpolateUrl(CREATE_NEW_COLLECTION_URL_TEMPLATE, {
                            collection_id: response.data.collectionId
                        });
                    }, 150);
                }, function () {
                    $rootScope.loadingMessage = '';
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/entity-creation-services/exploration-creation.service.ts":
/*!*****************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/entity-creation-services/exploration-creation.service.ts ***!
  \*****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Functionality for the create exploration button and upload
 * modal.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/CsrfTokenService.ts */ "./core/templates/dev/head/services/CsrfTokenService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
angular.module('oppia').factory('ExplorationCreationService', [
    '$http', '$rootScope', '$timeout', '$uibModal', '$window',
    'AlertsService', 'CsrfTokenService', 'SiteAnalyticsService',
    'UrlInterpolationService',
    function ($http, $rootScope, $timeout, $uibModal, $window, AlertsService, CsrfTokenService, SiteAnalyticsService, UrlInterpolationService) {
        var CREATE_NEW_EXPLORATION_URL_TEMPLATE = '/create/<exploration_id>';
        var explorationCreationInProgress = false;
        return {
            createNewExploration: function () {
                if (explorationCreationInProgress) {
                    return;
                }
                explorationCreationInProgress = true;
                AlertsService.clearWarnings();
                $rootScope.loadingMessage = 'Creating exploration';
                $http.post('/contributehandler/create_new', {}).then(function (response) {
                    SiteAnalyticsService.registerCreateNewExplorationEvent(response.data.explorationId);
                    $timeout(function () {
                        $window.location = UrlInterpolationService.interpolateUrl(CREATE_NEW_EXPLORATION_URL_TEMPLATE, {
                            exploration_id: response.data.explorationId
                        });
                    }, 150);
                    return false;
                }, function () {
                    $rootScope.loadingMessage = '';
                    explorationCreationInProgress = false;
                });
            },
            showUploadExplorationModal: function () {
                AlertsService.clearWarnings();
                $uibModal.open({
                    backdrop: true,
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/creator-dashboard-page/modal-templates/' +
                        'upload-activity-modal.directive.html'),
                    controller: [
                        '$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.save = function () {
                                var returnObj = {
                                    yamlFile: null
                                };
                                var file = document.getElementById('newFileInput').files[0];
                                if (!file || !file.size) {
                                    AlertsService.addWarning('Empty file detected.');
                                    return;
                                }
                                returnObj.yamlFile = file;
                                $uibModalInstance.close(returnObj);
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                                AlertsService.clearWarnings();
                            };
                        }
                    ]
                }).result.then(function (result) {
                    var yamlFile = result.yamlFile;
                    $rootScope.loadingMessage = 'Creating exploration';
                    var form = new FormData();
                    form.append('yaml_file', yamlFile);
                    form.append('payload', JSON.stringify({}));
                    CsrfTokenService.getTokenAsync().then(function (token) {
                        form.append('csrf_token', token);
                        $.ajax({
                            contentType: false,
                            data: form,
                            dataFilter: function (data) {
                                // Remove the XSSI prefix.
                                return JSON.parse(data.substring(5));
                            },
                            dataType: 'text',
                            processData: false,
                            type: 'POST',
                            url: 'contributehandler/upload'
                        }).done(function (data) {
                            $window.location = UrlInterpolationService.interpolateUrl(CREATE_NEW_EXPLORATION_URL_TEMPLATE, {
                                exploration_id: data.explorationId
                            });
                        }).fail(function (data) {
                            var transformedData = data.responseText.substring(5);
                            var parsedResponse = JSON.parse(transformedData);
                            AlertsService.addWarning(parsedResponse.error || 'Error communicating with server.');
                            $rootScope.loadingMessage = '';
                            $rootScope.$apply();
                        });
                    });
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/custom-forms-directives/object-editor.directive.ts":
/*!*****************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/custom-forms-directives/object-editor.directive.ts ***!
  \*****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Directives for the object editors.
 */
// Individual object editor directives are in extensions/objects/templates.
angular.module('oppia').directive('objectEditor', [
    '$compile', '$log', function ($compile, $log) {
        return {
            scope: {
                alwaysEditable: '@',
                initArgs: '=',
                isEditable: '@',
                objType: '@',
                value: '='
            },
            link: function (scope, element) {
                // Converts a camel-cased string to a lower-case hyphen-separated
                // string.
                var directiveName = scope.objType.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
                scope.getInitArgs = function () {
                    return scope.initArgs;
                };
                scope.getAlwaysEditable = function () {
                    return scope.alwaysEditable;
                };
                scope.getIsEditable = function () {
                    return scope.isEditable;
                };
                if (directiveName) {
                    element.html('<' + directiveName +
                        '-editor get-always-editable="getAlwaysEditable()"' +
                        ' get-init-args="getInitArgs()" get-is-editable="getIsEditable()"' +
                        ' obj-type="objType" value="value"></' +
                        directiveName + '-editor>');
                    $compile(element.contents())(scope);
                }
                else {
                    $log.error('Error in objectEditor: no editor type supplied.');
                }
            },
            restrict: 'E'
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/directives/focus-on.directive.ts":
/*!******************************************************************!*\
  !*** ./core/templates/dev/head/directives/focus-on.directive.ts ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview FocusOn Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */
// When set as an attr of an <input> element, moves focus to that element
// when a 'focusOn' event is broadcast.
angular.module('oppia').directive('focusOn', [
    'LABEL_FOR_CLEARING_FOCUS', function (LABEL_FOR_CLEARING_FOCUS) {
        return function (scope, elt, attrs) {
            scope.$on('focusOn', function (e, name) {
                if (name === attrs.focusOn) {
                    elt[0].focus();
                }
                // If the purpose of the focus switch was to clear focus, blur the
                // element.
                if (name === LABEL_FOR_CLEARING_FOCUS) {
                    elt[0].blur();
                }
            });
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for maintaining the open/closed status of the
 * hamburger-menu sidebar.
 */
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('oppia').factory('SidebarStatusService', [
    'WindowDimensionsService', function (WindowDimensionsService) {
        var pendingSidebarClick = false;
        var sidebarIsShown = false;
        var _openSidebar = function () {
            if (WindowDimensionsService.isWindowNarrow() && !sidebarIsShown) {
                sidebarIsShown = true;
                pendingSidebarClick = true;
            }
        };
        var _closeSidebar = function () {
            if (sidebarIsShown) {
                sidebarIsShown = false;
                pendingSidebarClick = false;
            }
        };
        return {
            isSidebarShown: function () {
                return sidebarIsShown;
            },
            openSidebar: function () {
                _openSidebar();
            },
            closeSidebar: function () {
                _closeSidebar();
            },
            toggleSidebar: function () {
                if (!sidebarIsShown) {
                    _openSidebar();
                }
                else {
                    _closeSidebar();
                }
            },
            onDocumentClick: function () {
                if (!pendingSidebarClick) {
                    sidebarIsShown = false;
                }
                else {
                    pendingSidebarClick = false;
                }
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/user/UserInfoObjectFactory.ts":
/*!**********************************************************************!*\
  !*** ./core/templates/dev/head/domain/user/UserInfoObjectFactory.ts ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating and instances of frontend user UserInfo
 * domain objects.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var UserInfo = /** @class */ (function () {
    function UserInfo(isModerator, isAdmin, isSuperAdmin, isTopicManager, canCreateCollections, preferredSiteLanguageCode, username, email, isLoggedIn) {
        this._isModerator = isModerator;
        this._isAdmin = isAdmin;
        this._isTopicManager = isTopicManager;
        this._isSuperAdmin = isSuperAdmin;
        this._canCreateCollections = canCreateCollections;
        this._preferredSiteLanguageCode = preferredSiteLanguageCode;
        this._username = username;
        this._email = email;
        this._isLoggedIn = isLoggedIn;
    }
    UserInfo.prototype.isModerator = function () {
        return this._isModerator;
    };
    UserInfo.prototype.isAdmin = function () {
        return this._isAdmin;
    };
    UserInfo.prototype.isTopicManager = function () {
        return this._isTopicManager;
    };
    UserInfo.prototype.isSuperAdmin = function () {
        return this._isSuperAdmin;
    };
    UserInfo.prototype.canCreateCollections = function () {
        return this._canCreateCollections;
    };
    UserInfo.prototype.getPreferredSiteLanguageCode = function () {
        return this._preferredSiteLanguageCode;
    };
    UserInfo.prototype.getUsername = function () {
        return this._username;
    };
    UserInfo.prototype.getEmail = function () {
        return this._email;
    };
    UserInfo.prototype.isLoggedIn = function () {
        return this._isLoggedIn;
    };
    return UserInfo;
}());
exports.UserInfo = UserInfo;
var UserInfoObjectFactory = /** @class */ (function () {
    function UserInfoObjectFactory() {
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'data' is a dict with underscore_cased keys which give tslint
    // errors against underscore_casing in favor of camelCasing.
    UserInfoObjectFactory.prototype.createFromBackendDict = function (data) {
        return new UserInfo(data.is_moderator, data.is_admin, data.is_super_admin, data.is_topic_manager, data.can_create_collections, data.preferred_site_language_code, data.username, data.email, data.user_is_logged_in);
    };
    UserInfoObjectFactory.prototype.createDefault = function () {
        return new UserInfo(false, false, false, false, false, null, null, null, false);
    };
    UserInfoObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], UserInfoObjectFactory);
    return UserInfoObjectFactory;
}());
exports.UserInfoObjectFactory = UserInfoObjectFactory;
angular.module('oppia').factory('UserInfoObjectFactory', static_1.downgradeInjectable(UserInfoObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility service for checking web browser type.
 */
angular.module('oppia').factory('BrowserCheckerService', [
    'AUTOGENERATED_AUDIO_LANGUAGES',
    function (AUTOGENERATED_AUDIO_LANGUAGES) {
        // For details on the reliability of this check, see
        // https://stackoverflow.com/questions/9847580/
        // how-to-detect-safari-chrome-ie-firefox-and-opera-browser#answer-9851769
        var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
            return p.toString() === '[object SafariRemoteNotification]';
        })(!window.safari ||
            (typeof window.safari !== 'undefined' && window.safari.pushNotification));
        var _supportsSpeechSynthesis = function () {
            var supportLang = false;
            if (window.hasOwnProperty('speechSynthesis')) {
                speechSynthesis.getVoices().forEach(function (voice) {
                    AUTOGENERATED_AUDIO_LANGUAGES.forEach(function (audioLanguage) {
                        if (voice.lang === audioLanguage.speech_synthesis_code ||
                            (_isMobileDevice() &&
                                voice.lang === audioLanguage.speech_synthesis_code_mobile)) {
                            supportLang = true;
                        }
                    });
                });
            }
            return supportLang;
        };
        var _isMobileDevice = function () {
            var userAgent = navigator.userAgent || navigator.vendor || window.opera;
            return userAgent.match(/iPhone/i) || userAgent.match(/Android/i);
        };
        return {
            supportsSpeechSynthesis: function () {
                return _supportsSpeechSynthesis();
            },
            isMobileDevice: function () {
                return _isMobileDevice();
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts":
/*!*****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to construct URLs by inserting variables within them as
 * necessary to have a fully-qualified URL.
 */
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
__webpack_require__(/*! app.constants.ajs.ts */ "./core/templates/dev/head/app.constants.ajs.ts");
var hashes = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'hashes.json'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
angular.module('oppia').factory('UrlInterpolationService', [
    'AlertsService', 'UrlService', 'UtilsService', 'DEV_MODE',
    function (AlertsService, UrlService, UtilsService, DEV_MODE) {
        var validateResourcePath = function (resourcePath) {
            if (!resourcePath) {
                AlertsService.fatalWarning('Empty path passed in method.');
            }
            var RESOURCE_PATH_STARTS_WITH_FORWARD_SLASH = /^\//;
            // Ensure that resourcePath starts with a forward slash.
            if (!resourcePath.match(RESOURCE_PATH_STARTS_WITH_FORWARD_SLASH)) {
                AlertsService.fatalWarning('Path must start with \'\/\': \'' + resourcePath + '\'.');
            }
        };
        /**
         * Given a resource path relative to subfolder in /,
         * returns resource path with cache slug.
         */
        var getUrlWithSlug = function (resourcePath) {
            if (!DEV_MODE) {
                if (hashes[resourcePath]) {
                    var index = resourcePath.lastIndexOf('.');
                    return (resourcePath.slice(0, index) + '.' + hashes[resourcePath] +
                        resourcePath.slice(index));
                }
            }
            return resourcePath;
        };
        /**
         * Given a resource path relative to subfolder in /,
         * returns complete resource path with cache slug and prefixed with url
         * depending on dev/prod mode.
         */
        var getCompleteUrl = function (prefix, path) {
            if (DEV_MODE) {
                return prefix + getUrlWithSlug(path);
            }
            else {
                return '/build' + prefix + getUrlWithSlug(path);
            }
        };
        /**
         * Given a resource path relative to extensions folder,
         * returns the complete url path to that resource.
         */
        var getExtensionResourceUrl = function (resourcePath) {
            validateResourcePath(resourcePath);
            return getCompleteUrl('/extensions', resourcePath);
        };
        return {
            /**
             * Given a formatted URL, interpolates the URL by inserting values the URL
             * needs using the interpolationValues object. For example, urlTemplate
             * might be:
             *
             *   /createhandler/resolved_answers/<exploration_id>/<escaped_state_name>
             *
             * interpolationValues is an object whose keys are variables within the
             * URL. For the above example, interpolationValues may look something
             * like:
             *
             *   { 'exploration_id': '0', 'escaped_state_name': 'InputBinaryNumber' }
             *
             * If a URL requires a value which is not keyed within the
             * interpolationValues object, this will return null.
             */
            interpolateUrl: function (urlTemplate, interpolationValues) {
                if (!urlTemplate) {
                    AlertsService.fatalWarning('Invalid or empty URL template passed in: \'' + urlTemplate + '\'');
                    return null;
                }
                // http://stackoverflow.com/questions/4775722
                if (!(interpolationValues instanceof Object) || (Object.prototype.toString.call(interpolationValues) === '[object Array]')) {
                    AlertsService.fatalWarning('Expected an object of interpolation values to be passed into ' +
                        'interpolateUrl.');
                    return null;
                }
                // Valid pattern: <alphanum>
                var INTERPOLATION_VARIABLE_REGEX = /<(\w+)>/;
                // Invalid patterns: <<stuff>>, <stuff>>>, <>
                var EMPTY_VARIABLE_REGEX = /<>/;
                var INVALID_VARIABLE_REGEX = /(<{2,})(\w*)(>{2,})/;
                if (urlTemplate.match(INVALID_VARIABLE_REGEX) ||
                    urlTemplate.match(EMPTY_VARIABLE_REGEX)) {
                    AlertsService.fatalWarning('Invalid URL template received: \'' + urlTemplate + '\'');
                    return null;
                }
                var escapedInterpolationValues = {};
                for (var varName in interpolationValues) {
                    var value = interpolationValues[varName];
                    if (!UtilsService.isString(value)) {
                        AlertsService.fatalWarning('Parameters passed into interpolateUrl must be strings.');
                        return null;
                    }
                    escapedInterpolationValues[varName] = encodeURIComponent(value);
                }
                // Ensure the URL has no nested brackets (which would lead to
                // indirection in the interpolated variables).
                var filledUrl = angular.copy(urlTemplate);
                var match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
                while (match) {
                    var currentVarName = match[1];
                    if (!escapedInterpolationValues.hasOwnProperty(currentVarName)) {
                        AlertsService.fatalWarning('Expected variable \'' + currentVarName +
                            '\' when interpolating URL.');
                        return null;
                    }
                    filledUrl = filledUrl.replace(INTERPOLATION_VARIABLE_REGEX, escapedInterpolationValues[currentVarName]);
                    match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
                }
                return filledUrl;
            },
            /**
             * Given an image path relative to /assets/images folder,
             * returns the complete url path to that image.
             */
            getStaticImageUrl: function (imagePath) {
                validateResourcePath(imagePath);
                return getCompleteUrl('/assets', '/images' + imagePath);
            },
            /**
             * Given a video path relative to /assets/videos folder,
             * returns the complete url path to that image.
             */
            getStaticVideoUrl: function (videoPath) {
                validateResourcePath(videoPath);
                return getCompleteUrl('/assets', '/videos' + videoPath);
            },
            /**
             * Given a path relative to /assets folder, returns the complete url path
             * to that asset.
             */
            getStaticAssetUrl: function (assetPath) {
                validateResourcePath(assetPath);
                return getCompleteUrl('/assets', assetPath);
            },
            getFullStaticAssetUrl: function (path) {
                validateResourcePath(path);
                if (DEV_MODE) {
                    return UrlService.getOrigin() + path;
                }
                else {
                    return UrlService.getOrigin() + '/build' + path;
                }
            },
            /**
             * Given an interaction id, returns the complete url path to
             * the thumbnail image for the interaction.
             */
            getInteractionThumbnailImageUrl: function (interactionId) {
                if (!interactionId) {
                    AlertsService.fatalWarning('Empty interactionId passed in getInteractionThumbnailImageUrl.');
                }
                return getExtensionResourceUrl('/interactions/' + interactionId +
                    '/static/' + interactionId + '.png');
            },
            /**
             * Given a directive path relative to head folder,
             * returns the complete url path to that directive.
             */
            getDirectiveTemplateUrl: function (path) {
                validateResourcePath(path);
                if (DEV_MODE) {
                    return '/templates/dev/head' + getUrlWithSlug(path);
                }
                else {
                    return '/build/templates/head' + getUrlWithSlug(path);
                }
            },
            getExtensionResourceUrl: getExtensionResourceUrl,
            _getUrlWithSlug: getUrlWithSlug,
            _getCompleteUrl: getCompleteUrl
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/google-analytics.initializer.ts":
/*!*****************************************************************!*\
  !*** ./core/templates/dev/head/google-analytics.initializer.ts ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Initialization of Google Analytics..
 */
var constants = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'constants.ts'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments);
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
(function () {
    if (constants.ANALYTICS_ID && constants.SITE_NAME_FOR_ANALYTICS) {
        ga('create', constants.ANALYTICS_ID, 'auto', { allowLinker: true });
        ga('set', 'anonymizeIp', true);
        ga('set', 'forceSSL', true);
        ga('require', 'linker');
        ga('linker:autoLink', [constants.SITE_NAME_FOR_ANALYTICS]);
        ga('send', 'pageview');
    }
})();


/***/ }),

/***/ "./core/templates/dev/head/pages/Base.ts":
/*!***********************************************!*\
  !*** ./core/templates/dev/head/pages/Base.ts ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
__webpack_require__(/*! domain/sidebar/SidebarStatusService.ts */ "./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/CsrfTokenService.ts */ "./core/templates/dev/head/services/CsrfTokenService.ts");
__webpack_require__(/*! services/contextual/DocumentAttributeCustomizationService.ts */ "./core/templates/dev/head/services/contextual/DocumentAttributeCustomizationService.ts");
__webpack_require__(/*! services/contextual/MetaTagCustomizationService.ts */ "./core/templates/dev/head/services/contextual/MetaTagCustomizationService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/stateful/BackgroundMaskService.ts */ "./core/templates/dev/head/services/stateful/BackgroundMaskService.ts");
__webpack_require__(/*! app.constants.ajs.ts */ "./core/templates/dev/head/app.constants.ajs.ts");
/**
 * @fileoverview Oppia's base controller.
 */
angular.module('oppia').controller('Base', [
    '$document', '$rootScope', '$scope', 'AlertsService', 'BackgroundMaskService',
    'CsrfTokenService', 'DocumentAttributeCustomizationService',
    'MetaTagCustomizationService', 'SidebarStatusService',
    'UrlInterpolationService', 'UrlService', 'DEV_MODE',
    'SITE_FEEDBACK_FORM_URL', 'SITE_NAME',
    function ($document, $rootScope, $scope, AlertsService, BackgroundMaskService, CsrfTokenService, DocumentAttributeCustomizationService, MetaTagCustomizationService, SidebarStatusService, UrlInterpolationService, UrlService, DEV_MODE, SITE_FEEDBACK_FORM_URL, SITE_NAME) {
        $scope.siteName = SITE_NAME;
        $scope.currentLang = 'en';
        $scope.pageUrl = UrlService.getCurrentLocation().href;
        $scope.iframed = UrlService.isIframed();
        $scope.getAssetUrl = function (path) {
            return UrlInterpolationService.getFullStaticAssetUrl(path);
        };
        $scope.isBackgroundMaskActive = BackgroundMaskService.isMaskActive;
        $scope.AlertsService = AlertsService;
        $rootScope.DEV_MODE = DEV_MODE;
        // If this is nonempty, the whole page goes into 'Loading...' mode.
        $rootScope.loadingMessage = '';
        CsrfTokenService.initializeToken();
        MetaTagCustomizationService.addMetaTags([
            {
                propertyType: 'name',
                propertyValue: 'application-name',
                content: SITE_NAME
            },
            {
                propertyType: 'name',
                propertyValue: 'msapplication-square310x310logo',
                content: $scope.getAssetUrl('/assets/images/logo/msapplication-large.png')
            },
            {
                propertyType: 'name',
                propertyValue: 'msapplication-wide310x150logo',
                content: $scope.getAssetUrl('/assets/images/logo/msapplication-wide.png')
            },
            {
                propertyType: 'name',
                propertyValue: 'msapplication-square150x150logo',
                content: $scope.getAssetUrl('/assets/images/logo/msapplication-square.png')
            },
            {
                propertyType: 'name',
                propertyValue: 'msapplication-square70x70logo',
                content: $scope.getAssetUrl('/assets/images/logo/msapplication-tiny.png')
            },
            {
                propertyType: 'property',
                propertyValue: 'og:url',
                content: $scope.pageUrl
            },
            {
                propertyType: 'property',
                propertyValue: 'og:image',
                content: $scope.getAssetUrl('/assets/images/logo/288x288_logo_mint.png')
            }
        ]);
        // Listener function to catch the change in language preference.
        $rootScope.$on('$translateChangeSuccess', function (evt, response) {
            $scope.currentLang = response.language;
        });
        $scope.siteFeedbackFormUrl = SITE_FEEDBACK_FORM_URL;
        $scope.isSidebarShown = SidebarStatusService.isSidebarShown;
        $scope.closeSidebarOnSwipe = SidebarStatusService.closeSidebar;
        $scope.skipToMainContent = function () {
            var mainContentElement = document.getElementById('oppia-main-content');
            if (!mainContentElement) {
                throw Error('Variable mainContentElement is undefined.');
            }
            mainContentElement.tabIndex = -1;
            mainContentElement.scrollIntoView();
            mainContentElement.focus();
        };
        DocumentAttributeCustomizationService.addAttribute('lang', $scope.currentLang);
        // TODO(sll): use 'touchstart' for mobile.
        $document.on('click', function () {
            SidebarStatusService.onDocumentClick();
            $scope.$apply();
        });
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/AlertsService.ts":
/*!***********************************************************!*\
  !*** ./core/templates/dev/head/services/AlertsService.ts ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for handling warnings and info messages.
 */
angular.module('oppia').factory('AlertsService', ['$log', function ($log) {
        var AlertsService = {
            /**
             * Each element in each of the arrays here is an object with two keys:
             *   - type:  a string specifying the type of message or warning.
             *            Possible types - "warning", "info" or "success".
             *   - content: a string containing the warning or message.
             */
            /**
             * Array of "warning" messages.
             */
            warnings: [],
            /**
             * Array of "success" or "info" messages.
             */
            messages: [],
            addWarning: null,
            fatalWarning: null,
            deleteWarning: null,
            clearWarnings: null,
            addMessage: null,
            deleteMessage: null,
            addInfoMessage: null,
            addSuccessMessage: null,
            clearMessages: null
        };
        // This is to prevent infinite loops.
        var MAX_TOTAL_WARNINGS = 10;
        var MAX_TOTAL_MESSAGES = 10;
        /**
         * Adds a warning message.
         * @param {string} warning - The warning message to display.
         */
        AlertsService.addWarning = function (warning) {
            $log.error(warning);
            if (AlertsService.warnings.length >= MAX_TOTAL_WARNINGS) {
                return;
            }
            AlertsService.warnings.push({
                type: 'warning',
                content: warning
            });
        };
        /**
         * Adds a warning in the same way as addWarning(), except it also throws an
         * exception to cause a hard failure in the frontend.
         * @param {string} warning - The warning message to display.
         */
        AlertsService.fatalWarning = function (warning) {
            AlertsService.addWarning(warning);
            throw new Error(warning);
        };
        /**
         * Deletes the warning from the warnings list.
         * @param {Object} warningObject - The warning message to be deleted.
         */
        AlertsService.deleteWarning = function (warningObject) {
            var warnings = AlertsService.warnings;
            var newWarnings = [];
            for (var i = 0; i < warnings.length; i++) {
                if (warnings[i].content !== warningObject.content) {
                    newWarnings.push(warnings[i]);
                }
            }
            AlertsService.warnings = newWarnings;
        };
        /**
         * Clears all warnings.
         */
        AlertsService.clearWarnings = function () {
            AlertsService.warnings = [];
        };
        /**
         * Adds a message, can be info messages or success messages.
         * @param {string} type - Type of message
         * @param {string} message - Message content
         * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
         */
        AlertsService.addMessage = function (type, message, timeoutMilliseconds) {
            if (AlertsService.messages.length >= MAX_TOTAL_MESSAGES) {
                return;
            }
            AlertsService.messages.push({
                type: type,
                content: message,
                timeout: timeoutMilliseconds
            });
        };
        /**
         * Deletes the message from the messages list.
         * @param {Object} messageObject - Message to be deleted.
         */
        AlertsService.deleteMessage = function (messageObject) {
            var messages = AlertsService.messages;
            var newMessages = [];
            for (var i = 0; i < messages.length; i++) {
                if (messages[i].type !== messageObject.type ||
                    messages[i].content !== messageObject.content) {
                    newMessages.push(messages[i]);
                }
            }
            AlertsService.messages = newMessages;
        };
        /**
         * Adds an info message.
         * @param {string} message - Info message to display.
         * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
         */
        AlertsService.addInfoMessage = function (message, timeoutMilliseconds) {
            if (timeoutMilliseconds === undefined) {
                timeoutMilliseconds = 1500;
            }
            AlertsService.addMessage('info', message, timeoutMilliseconds);
        };
        /**
         * Adds a success message.
         * @param {string} message - Success message to display
         * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
         */
        AlertsService.addSuccessMessage = function (message, timeoutMilliseconds) {
            if (timeoutMilliseconds === undefined) {
                timeoutMilliseconds = 1500;
            }
            AlertsService.addMessage('success', message, timeoutMilliseconds);
        };
        /**
         * Clears all messages.
         */
        AlertsService.clearMessages = function () {
            AlertsService.messages = [];
        };
        return AlertsService;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/ConstructTranslationIdsService.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/services/ConstructTranslationIdsService.ts ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service to dynamically construct translation ids for i18n.
 */
angular.module('oppia').factory('ConstructTranslationIdsService', [
    function () {
        return {
            // Construct a translation id for library from name and a prefix.
            // Ex: 'categories', 'art' -> 'I18N_LIBRARY_CATEGORIES_ART'
            getLibraryId: function (prefix, name) {
                return ('I18N_LIBRARY_' + prefix.toUpperCase() + '_' +
                    name.toUpperCase().split(' ').join('_'));
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/ContextService.ts":
/*!************************************************************!*\
  !*** ./core/templates/dev/head/services/ContextService.ts ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Service for returning information about a page's
 * context.
 */
__webpack_require__(/*! services/services.constants.ajs.ts */ "./core/templates/dev/head/services/services.constants.ajs.ts");
angular.module('oppia').factory('ContextService', [
    'UrlService', 'ENTITY_TYPE', 'EXPLORATION_EDITOR_TAB_CONTEXT',
    'PAGE_CONTEXT', function (UrlService, ENTITY_TYPE, EXPLORATION_EDITOR_TAB_CONTEXT, PAGE_CONTEXT) {
        var pageContext = null;
        var explorationId = null;
        var questionId = null;
        var editorContext = null;
        return {
            init: function (editorName) {
                editorContext = editorName;
            },
            // Following method helps to know the whether the context of editor is
            // question editor or exploration editor. The variable editorContext is
            // set from the init function that is called upon initialization in the
            // respective editors.
            getEditorContext: function () {
                return editorContext;
            },
            // Returns a string representing the current tab of the editor (either
            // 'editor' or 'preview'), or null if the current tab is neither of these,
            // or the current page is not the editor.
            getEditorTabContext: function () {
                var hash = UrlService.getHash();
                if (hash.indexOf('#/gui') === 0) {
                    return EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR;
                }
                else if (hash.indexOf('#/preview') === 0) {
                    return EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW;
                }
                else {
                    return null;
                }
            },
            // Returns a string representing the context of the current page.
            // This is PAGE_CONTEXT.EXPLORATION_EDITOR or
            // PAGE_CONTEXT.EXPLORATION_PLAYER or PAGE_CONTEXT.QUESTION_EDITOR.
            // If the current page is not one in either EXPLORATION_EDITOR or
            // EXPLORATION_PLAYER or QUESTION_EDITOR then return PAGE_CONTEXT.OTHER
            getPageContext: function () {
                if (pageContext) {
                    return pageContext;
                }
                else {
                    var pathnameArray = UrlService.getPathname().split('/');
                    for (var i = 0; i < pathnameArray.length; i++) {
                        if (pathnameArray[i] === 'explore' ||
                            (pathnameArray[i] === 'embed' &&
                                pathnameArray[i + 1] === 'exploration')) {
                            pageContext = PAGE_CONTEXT.EXPLORATION_PLAYER;
                            return PAGE_CONTEXT.EXPLORATION_PLAYER;
                        }
                        else if (pathnameArray[i] === 'create') {
                            pageContext = PAGE_CONTEXT.EXPLORATION_EDITOR;
                            return PAGE_CONTEXT.EXPLORATION_EDITOR;
                        }
                        else if (pathnameArray[i] === 'question_editor') {
                            pageContext = PAGE_CONTEXT.QUESTION_EDITOR;
                            return PAGE_CONTEXT.QUESTION_EDITOR;
                        }
                        else if (pathnameArray[i] === 'topic_editor') {
                            pageContext = PAGE_CONTEXT.TOPIC_EDITOR;
                            return PAGE_CONTEXT.TOPIC_EDITOR;
                        }
                        else if (pathnameArray[i] === 'story_editor') {
                            pageContext = PAGE_CONTEXT.STORY_EDITOR;
                            return PAGE_CONTEXT.STORY_EDITOR;
                        }
                        else if (pathnameArray[i] === 'skill_editor') {
                            pageContext = PAGE_CONTEXT.SKILL_EDITOR;
                            return PAGE_CONTEXT.SKILL_EDITOR;
                        }
                        else if (pathnameArray[i] === 'practice_session' ||
                            pathnameArray[i] === 'review_test') {
                            pageContext = PAGE_CONTEXT.QUESTION_PLAYER;
                            return PAGE_CONTEXT.QUESTION_PLAYER;
                        }
                        else if (pathnameArray[i] === 'collection_editor') {
                            pageContext = PAGE_CONTEXT.COLLECTION_EDITOR;
                            return PAGE_CONTEXT.COLLECTION_EDITOR;
                        }
                    }
                    return PAGE_CONTEXT.OTHER;
                }
            },
            isInExplorationContext: function () {
                return (this.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR ||
                    this.getPageContext() === PAGE_CONTEXT.EXPLORATION_PLAYER);
            },
            isInQuestionContext: function () {
                return (this.getPageContext() === PAGE_CONTEXT.QUESTION_EDITOR);
            },
            getEntityId: function () {
                var pathnameArray = UrlService.getPathname().split('/');
                for (var i = 0; i < pathnameArray.length; i++) {
                    if (pathnameArray[i] === 'embed') {
                        return decodeURI(pathnameArray[i + 2]);
                    }
                }
                return decodeURI(pathnameArray[2]);
            },
            getEntityType: function () {
                var pathnameArray = UrlService.getPathname().split('/');
                for (var i = 0; i < pathnameArray.length; i++) {
                    if (pathnameArray[i] === 'create' || pathnameArray[i] === 'explore' ||
                        (pathnameArray[i] === 'embed' &&
                            pathnameArray[i + 1] === 'exploration')) {
                        return ENTITY_TYPE.EXPLORATION;
                    }
                    if (pathnameArray[i] === 'topic_editor') {
                        return ENTITY_TYPE.TOPIC;
                    }
                    if (pathnameArray[i] === 'subtopic') {
                        return ENTITY_TYPE.SUBTOPIC;
                    }
                    if (pathnameArray[i] === 'story_editor') {
                        return ENTITY_TYPE.STORY;
                    }
                    if (pathnameArray[i] === 'skill_editor') {
                        return ENTITY_TYPE.SKILL;
                    }
                }
            },
            // Returns a string representing the explorationId (obtained from the
            // URL).
            getExplorationId: function () {
                if (explorationId) {
                    return explorationId;
                }
                else if (!this.isInQuestionPlayerMode()) {
                    // The pathname should be one of /explore/{exploration_id} or
                    // /create/{exploration_id} or /embed/exploration/{exploration_id}.
                    var pathnameArray = UrlService.getPathname().split('/');
                    for (var i = 0; i < pathnameArray.length; i++) {
                        if (pathnameArray[i] === 'explore' ||
                            pathnameArray[i] === 'create') {
                            explorationId = pathnameArray[i + 1];
                            return pathnameArray[i + 1];
                        }
                        if (pathnameArray[i] === 'embed') {
                            explorationId = pathnameArray[i + 2];
                            return explorationId;
                        }
                    }
                    throw Error('ERROR: ContextService should not be used outside the ' +
                        'context of an exploration or a question.');
                }
            },
            // Returns a string representing the questionId (obtained from the
            // URL).
            getQuestionId: function () {
                if (questionId) {
                    return questionId;
                }
                else {
                    // The pathname should /question_editor/{question_id}.
                    var pathnameArray = UrlService.getPathname().split('/');
                    for (var i = 0; i < pathnameArray.length; i++) {
                        if (pathnameArray[i] === 'question_editor') {
                            questionId = pathnameArray[i + 1];
                            return pathnameArray[i + 1];
                        }
                    }
                    throw Error('ERROR: ContextService should not be used outside the ' +
                        'context of an exploration or a question.');
                }
            },
            // Following method helps to know whether exploration editor is
            // in main editing mode or preview mode.
            isInExplorationEditorMode: function () {
                return (this.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR &&
                    this.getEditorTabContext() === (EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR));
            },
            isInQuestionPlayerMode: function () {
                return this.getPageContext() === PAGE_CONTEXT.QUESTION_PLAYER;
            },
            isInExplorationEditorPage: function () {
                return this.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/CsrfTokenService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/CsrfTokenService.ts ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Service for managing CSRF tokens.
 */
// This needs to be imported first instead of using the global definition
// because Angular doesn't support global definitions and every library used
// needs to be imported explicitly.
var jquery_1 = __importDefault(__webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js"));
angular.module('oppia').factory('CsrfTokenService', [function () {
        var tokenPromise = null;
        return {
            initializeToken: function () {
                if (tokenPromise !== null) {
                    throw new Error('Token request has already been made');
                }
                // We use jQuery here instead of Angular's $http, since the latter creates
                // a circular dependency.
                tokenPromise = jquery_1.default.ajax({
                    url: '/csrfhandler',
                    type: 'GET',
                    dataType: 'text',
                    dataFilter: function (data) {
                        // Remove the protective XSSI (cross-site scripting inclusion) prefix.
                        var actualData = data.substring(5);
                        return JSON.parse(actualData);
                    },
                }).then(function (response) {
                    return response.token;
                });
            },
            getTokenAsync: function () {
                if (tokenPromise === null) {
                    throw new Error('Token needs to be initialized');
                }
                return tokenPromise;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/DateTimeFormatService.ts":
/*!*******************************************************************!*\
  !*** ./core/templates/dev/head/services/DateTimeFormatService.ts ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for converting dates in milliseconds
 * since the Epoch to human-readable dates.
 */
angular.module('oppia').factory('DateTimeFormatService', [
    '$filter', function ($filter) {
        return {
            // Returns just the time if the local datetime representation has the
            // same date as the current date. Otherwise, returns just the date if the
            // local datetime representation has the same year as the current date.
            // Otherwise, returns the full date (with the year abbreviated).
            getLocaleAbbreviatedDatetimeString: function (millisSinceEpoch) {
                var date = new Date(millisSinceEpoch);
                if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
                    return date.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    });
                }
                else if (date.getFullYear() === new Date().getFullYear()) {
                    return $filter('date')(date, 'MMM d');
                }
                else {
                    return $filter('date')(date, 'shortDate');
                }
            },
            // Returns just the date.
            getLocaleDateString: function (millisSinceEpoch) {
                var date = new Date(millisSinceEpoch);
                return date.toLocaleDateString();
            },
            // Returns whether the date is at most one week before the current date.
            isRecent: function (millisSinceEpoch) {
                var ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
                return new Date().getTime() - millisSinceEpoch < ONE_WEEK_IN_MILLIS;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/DebouncerService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/DebouncerService.ts ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for debouncing function calls.
 */
angular.module('oppia').factory('DebouncerService', [function () {
        return {
            // Returns a function that will not be triggered as long as it continues to
            // be invoked. The function only gets executed after it stops being called
            // for `wait` milliseconds.
            debounce: function (func, millisecsToWait) {
                var timeout;
                var context = this;
                var args = arguments;
                var timestamp;
                var result;
                var later = function () {
                    var last = new Date().getTime() - timestamp;
                    if (last < millisecsToWait) {
                        timeout = setTimeout(later, millisecsToWait - last);
                    }
                    else {
                        timeout = null;
                        result = func.apply(context, args);
                        if (!timeout) {
                            context = null;
                            args = null;
                        }
                    }
                };
                return function () {
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


/***/ }),

/***/ "./core/templates/dev/head/services/HtmlEscaperService.ts":
/*!****************************************************************!*\
  !*** ./core/templates/dev/head/services/HtmlEscaperService.ts ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for HTML serialization and escaping.
 */
angular.module('oppia').factory('HtmlEscaperService', ['$log', function ($log) {
        var htmlEscaper = {
            objToEscapedJson: function (obj) {
                return this.unescapedStrToEscapedStr(JSON.stringify(obj));
            },
            escapedJsonToObj: function (json) {
                if (!json) {
                    $log.error('Empty string was passed to JSON decoder.');
                    return '';
                }
                return JSON.parse(this.escapedStrToUnescapedStr(json));
            },
            unescapedStrToEscapedStr: function (str) {
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            },
            escapedStrToUnescapedStr: function (value) {
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


/***/ }),

/***/ "./core/templates/dev/head/services/IdGenerationService.ts":
/*!*****************************************************************!*\
  !*** ./core/templates/dev/head/services/IdGenerationService.ts ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for generating random IDs.
 */
angular.module('oppia').factory('IdGenerationService', [function () {
        return {
            generateNewId: function () {
                // Generates random string using the last 10 digits of
                // the string for better entropy.
                var randomString = Math.random().toString(36).slice(2);
                while (randomString.length < 10) {
                    randomString = randomString + '0';
                }
                return randomString.slice(-10);
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/NavigationService.ts":
/*!***************************************************************!*\
  !*** ./core/templates/dev/head/services/NavigationService.ts ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for navigating the top navigation bar with
 * tab and shift-tab.
 */
angular.module('oppia').factory('NavigationService', [function () {
        var navigation = {
            activeMenuName: '',
            ACTION_OPEN: 'open',
            ACTION_CLOSE: 'close',
            KEYBOARD_EVENT_TO_KEY_CODES: {
                enter: {
                    shiftKeyIsPressed: false,
                    keyCode: 13
                },
                tab: {
                    shiftKeyIsPressed: false,
                    keyCode: 9
                },
                shiftTab: {
                    shiftKeyIsPressed: true,
                    keyCode: 9
                }
            },
            openSubmenu: null,
            closeSubmenu: null,
            onMenuKeypress: null
        };
        /**
        * Opens the submenu.
        * @param {object} evt
        * @param {String} menuName - name of menu, on which
        * open/close action to be performed (category,language).
        */
        navigation.openSubmenu = function (evt, menuName) {
            // Focus on the current target before opening its submenu.
            navigation.activeMenuName = menuName;
            angular.element(evt.currentTarget).focus();
        };
        navigation.closeSubmenu = function (evt) {
            navigation.activeMenuName = '';
            angular.element(evt.currentTarget).closest('li')
                .find('a').blur();
        };
        /**
         * Handles keydown events on menus.
         * @param {object} evt
         * @param {String} menuName - name of menu to perform action
         * on(category/language)
         * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
         * corresponding actions to be performed(open/close).
         *
         * @example
         *  onMenuKeypress($event, 'category', {enter: 'open'})
         */
        navigation.onMenuKeypress = function (evt, menuName, eventsTobeHandled) {
            var targetEvents = Object.keys(eventsTobeHandled);
            for (var i = 0; i < targetEvents.length; i++) {
                var keyCodeSpec = navigation.KEYBOARD_EVENT_TO_KEY_CODES[targetEvents[i]];
                if (keyCodeSpec.keyCode === evt.keyCode &&
                    evt.shiftKey === keyCodeSpec.shiftKeyIsPressed) {
                    if (eventsTobeHandled[targetEvents[i]] === navigation.ACTION_OPEN) {
                        navigation.openSubmenu(evt, menuName);
                    }
                    else if (eventsTobeHandled[targetEvents[i]] ===
                        navigation.ACTION_CLOSE) {
                        navigation.closeSubmenu(evt);
                    }
                    else {
                        throw Error('Invalid action type.');
                    }
                }
            }
        };
        return navigation;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/PromoBarService.ts":
/*!*************************************************************!*\
  !*** ./core/templates/dev/head/services/PromoBarService.ts ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service Promo bar.
 */
__webpack_require__(/*! services/services.constants.ajs.ts */ "./core/templates/dev/head/services/services.constants.ajs.ts");
angular.module('oppia').factory('PromoBarService', [
    '$http', '$q', 'ENABLE_PROMO_BAR',
    function ($http, $q, ENABLE_PROMO_BAR) {
        return {
            getPromoBarData: function () {
                var promoBarData = {
                    promoBarEnabled: false,
                    promoBarMessage: ''
                };
                if (ENABLE_PROMO_BAR) {
                    return $http.get('/promo_bar_handler', {}).then(function (response) {
                        promoBarData.promoBarEnabled = response.data.promo_bar_enabled;
                        promoBarData.promoBarMessage = response.data.promo_bar_message;
                        return promoBarData;
                    });
                }
                else {
                    return $q.resolve(promoBarData);
                }
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/RteHelperService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/RteHelperService.ts ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview A helper service for the Rich text editor(RTE).
 */
__webpack_require__(/*! services/services.constants.ajs.ts */ "./core/templates/dev/head/services/services.constants.ajs.ts");
angular.module('oppia').factory('RteHelperService', [
    '$document', '$log', '$uibModal',
    'FocusManagerService', 'HtmlEscaperService',
    'UrlInterpolationService', 'RTE_COMPONENT_SPECS',
    function ($document, $log, $uibModal, FocusManagerService, HtmlEscaperService, UrlInterpolationService, RTE_COMPONENT_SPECS) {
        var _RICH_TEXT_COMPONENTS = [];
        Object.keys(RTE_COMPONENT_SPECS).sort().forEach(function (componentId) {
            _RICH_TEXT_COMPONENTS.push({
                backendId: RTE_COMPONENT_SPECS[componentId].backend_id,
                customizationArgSpecs: angular.copy(RTE_COMPONENT_SPECS[componentId].customization_arg_specs),
                id: RTE_COMPONENT_SPECS[componentId].frontend_id,
                iconDataUrl: RTE_COMPONENT_SPECS[componentId].icon_data_url,
                isComplex: RTE_COMPONENT_SPECS[componentId].is_complex,
                isBlockElement: RTE_COMPONENT_SPECS[componentId].is_block_element,
                requiresFs: RTE_COMPONENT_SPECS[componentId].requires_fs,
                tooltip: RTE_COMPONENT_SPECS[componentId].tooltip
            });
        });
        var _createCustomizationArgDictFromAttrs = function (attrs) {
            var customizationArgsDict = {};
            for (var i = 0; i < attrs.length; i++) {
                var attr = attrs[i];
                if (attr.name === 'class' || attr.name === 'src' ||
                    attr.name === '_moz_resizing') {
                    continue;
                }
                var separatorLocation = attr.name.indexOf('-with-value');
                if (separatorLocation === -1) {
                    $log.error('RTE Error: invalid customization attribute ' + attr.name);
                    continue;
                }
                var argName = attr.name.substring(0, separatorLocation);
                customizationArgsDict[argName] = HtmlEscaperService.escapedJsonToObj(attr.value);
            }
            return customizationArgsDict;
        };
        return {
            createCustomizationArgDictFromAttrs: function (attrs) {
                return _createCustomizationArgDictFromAttrs(attrs);
            },
            getRichTextComponents: function () {
                return angular.copy(_RICH_TEXT_COMPONENTS);
            },
            isInlineComponent: function (richTextComponent) {
                var inlineComponents = ['link', 'math'];
                return inlineComponents.indexOf(richTextComponent) !== -1;
            },
            // The refocusFn arg is a function that restores focus to the text editor
            // after exiting the modal, and moves the cursor back to where it was
            // before the modal was opened.
            _openCustomizationModal: function (customizationArgSpecs, attrsCustomizationArgsDict, onSubmitCallback, onDismissCallback, refocusFn) {
                $document[0].execCommand('enableObjectResizing', false, false);
                var modalDialog = $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/ck-editor-helpers/' +
                        'customize-rte-component-modal.template.html'),
                    backdrop: 'static',
                    resolve: {},
                    controller: [
                        '$scope', '$uibModalInstance', '$timeout',
                        function ($scope, $uibModalInstance, $timeout) {
                            $scope.customizationArgSpecs = customizationArgSpecs;
                            // Without this code, the focus will remain in the background RTE
                            // even after the modal loads. This switches the focus to a
                            // temporary field in the modal which is then removed from the
                            // DOM.
                            // TODO(sll): Make this switch to the first input field in the
                            // modal instead.
                            $scope.modalIsLoading = true;
                            FocusManagerService.setFocus('tmpFocusPoint');
                            $timeout(function () {
                                $scope.modalIsLoading = false;
                            });
                            $scope.tmpCustomizationArgs = [];
                            for (var i = 0; i < customizationArgSpecs.length; i++) {
                                var caName = customizationArgSpecs[i].name;
                                $scope.tmpCustomizationArgs.push({
                                    name: caName,
                                    value: (attrsCustomizationArgsDict.hasOwnProperty(caName) ?
                                        angular.copy(attrsCustomizationArgsDict[caName]) :
                                        customizationArgSpecs[i].default_value)
                                });
                            }
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                            $scope.save = function () {
                                $scope.$broadcast('externalSave');
                                var customizationArgsDict = {};
                                for (var i = 0; i < $scope.tmpCustomizationArgs.length; i++) {
                                    var caName = $scope.tmpCustomizationArgs[i].name;
                                    customizationArgsDict[caName] = ($scope.tmpCustomizationArgs[i].value);
                                }
                                $uibModalInstance.close(customizationArgsDict);
                            };
                        }
                    ]
                });
                modalDialog.result.then(onSubmitCallback, onDismissCallback);
                // 'finally' is a JS keyword. If it is just used in its ".finally" form,
                // the minification process throws an error.
                modalDialog.result['finally'](refocusFn);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/SiteAnalyticsService.ts":
/*!******************************************************************!*\
  !*** ./core/templates/dev/head/services/SiteAnalyticsService.ts ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Utility services for explorations which may be shared by both
 * the learner and editor views.
 */
// Service for sending events to Google Analytics.
//
// Note that events are only sent if the CAN_SEND_ANALYTICS_EVENTS flag is
// turned on. This flag must be turned on explicitly by the application
// owner in feconf.py.
angular.module('oppia').factory('SiteAnalyticsService', [
    '$window', 'CAN_SEND_ANALYTICS_EVENTS', function ($window, CAN_SEND_ANALYTICS_EVENTS) {
        // For definitions of the various arguments, please see:
        // developers.google.com/analytics/devguides/collection/analyticsjs/events
        var _sendEventToGoogleAnalytics = function (eventCategory, eventAction, eventLabel) {
            if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
                $window.ga('send', 'event', eventCategory, eventAction, eventLabel);
            }
        };
        // For definitions of the various arguments, please see:
        // developers.google.com/analytics/devguides/collection/analyticsjs/
        //   social-interactions
        var _sendSocialEventToGoogleAnalytics = function (network, action, targetUrl) {
            if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
                $window.ga('send', 'social', network, action, targetUrl);
            }
        };
        return {
            // The srcElement refers to the element on the page that is clicked.
            registerStartLoginEvent: function (srcElement) {
                _sendEventToGoogleAnalytics('LoginButton', 'click', $window.location.pathname + ' ' + srcElement);
            },
            registerNewSignupEvent: function () {
                _sendEventToGoogleAnalytics('SignupButton', 'click', '');
            },
            registerClickBrowseLibraryButtonEvent: function () {
                _sendEventToGoogleAnalytics('BrowseLibraryButton', 'click', $window.location.pathname);
            },
            registerGoToDonationSiteEvent: function (donationSiteName) {
                _sendEventToGoogleAnalytics('GoToDonationSite', 'click', donationSiteName);
            },
            registerApplyToTeachWithOppiaEvent: function () {
                _sendEventToGoogleAnalytics('ApplyToTeachWithOppia', 'click', '');
            },
            registerClickCreateExplorationButtonEvent: function () {
                _sendEventToGoogleAnalytics('CreateExplorationButton', 'click', $window.location.pathname);
            },
            registerCreateNewExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('NewExploration', 'create', explorationId);
            },
            registerCreateNewExplorationInCollectionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('NewExplorationFromCollection', 'create', explorationId);
            },
            registerCreateNewCollectionEvent: function (collectionId) {
                _sendEventToGoogleAnalytics('NewCollection', 'create', collectionId);
            },
            registerCommitChangesToPrivateExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('CommitToPrivateExploration', 'click', explorationId);
            },
            registerShareExplorationEvent: function (network) {
                _sendSocialEventToGoogleAnalytics(network, 'share', $window.location.pathname);
            },
            registerShareCollectionEvent: function (network) {
                _sendSocialEventToGoogleAnalytics(network, 'share', $window.location.pathname);
            },
            registerOpenEmbedInfoEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('EmbedInfoModal', 'open', explorationId);
            },
            registerCommitChangesToPublicExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('CommitToPublicExploration', 'click', explorationId);
            },
            // Metrics for tutorial on first creating exploration
            registerTutorialModalOpenEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('TutorialModalOpen', 'open', explorationId);
            },
            registerDeclineTutorialModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('DeclineTutorialModal', 'click', explorationId);
            },
            registerAcceptTutorialModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('AcceptTutorialModal', 'click', explorationId);
            },
            // Metrics for visiting the help center
            registerClickHelpButtonEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('ClickHelpButton', 'click', explorationId);
            },
            registerVisitHelpCenterEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('VisitHelpCenter', 'click', explorationId);
            },
            registerOpenTutorialFromHelpCenterEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('OpenTutorialFromHelpCenter', 'click', explorationId);
            },
            // Metrics for exiting the tutorial
            registerSkipTutorialEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SkipTutorial', 'click', explorationId);
            },
            registerFinishTutorialEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FinishTutorial', 'click', explorationId);
            },
            // Metrics for first time editor use
            registerEditorFirstEntryEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstEnterEditor', 'open', explorationId);
            },
            registerFirstOpenContentBoxEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstOpenContentBox', 'open', explorationId);
            },
            registerFirstSaveContentEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveContent', 'click', explorationId);
            },
            registerFirstClickAddInteractionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstClickAddInteraction', 'click', explorationId);
            },
            registerFirstSelectInteractionTypeEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSelectInteractionType', 'click', explorationId);
            },
            registerFirstSaveInteractionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveInteraction', 'click', explorationId);
            },
            registerFirstSaveRuleEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveRule', 'click', explorationId);
            },
            registerFirstCreateSecondStateEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstCreateSecondState', 'create', explorationId);
            },
            // Metrics for publishing explorations
            registerSavePlayableExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SavePlayableExploration', 'save', explorationId);
            },
            registerOpenPublishExplorationModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('PublishExplorationModal', 'open', explorationId);
            },
            registerPublishExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('PublishExploration', 'click', explorationId);
            },
            registerVisitOppiaFromIframeEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('VisitOppiaFromIframe', 'click', explorationId);
            },
            registerNewCard: function (cardNum) {
                if (cardNum <= 10 || cardNum % 10 === 0) {
                    _sendEventToGoogleAnalytics('PlayerNewCard', 'click', cardNum);
                }
            },
            registerFinishExploration: function () {
                _sendEventToGoogleAnalytics('PlayerFinishExploration', 'click', '');
            },
            registerOpenCollectionFromLandingPageEvent: function (collectionId) {
                _sendEventToGoogleAnalytics('OpenFractionsFromLandingPage', 'click', collectionId);
            },
            registerStewardsLandingPageEvent: function (viewerType, buttonText) {
                _sendEventToGoogleAnalytics('ClickButtonOnStewardsPage', 'click', viewerType + ':' + buttonText);
            },
            registerSaveRecordedAudioEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SaveRecordedAudio', 'click', explorationId);
            },
            registerStartAudioRecordingEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('StartAudioRecording', 'click', explorationId);
            },
            registerUploadAudioEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('UploadRecordedAudio', 'click', explorationId);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/StateRulesStatsService.ts":
/*!********************************************************************!*\
  !*** ./core/templates/dev/head/services/StateRulesStatsService.ts ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for calculating the statistics of a particular state.
 */
angular.module('oppia').factory('StateRulesStatsService', [
    '$http', '$injector', '$q', 'AngularNameService',
    'AnswerClassificationService', 'ContextService', 'FractionObjectFactory',
    function ($http, $injector, $q, AngularNameService, AnswerClassificationService, ContextService, FractionObjectFactory) {
        return {
            /**
             * TODO(brianrodri): Consider moving this into a visualization domain
             * object.
             *
             * @param {Object!} state
             * @return {Boolean} whether given state has an implementation for
             *     displaying the improvements overview tab in the State Editor.
             */
            stateSupportsImprovementsOverview: function (state) {
                return state.interaction.id === 'TextInput';
            },
            /**
             * Returns a promise which will provide details of the given state's
             * answer-statistics.
             *
             * @param {Object!} state
             * @returns {Promise}
             */
            computeStateRulesStats: function (state) {
                var explorationId = ContextService.getExplorationId();
                if (!state.interaction.id) {
                    return $q.resolve({
                        state_name: state.name,
                        exploration_id: explorationId,
                        visualizations_info: [],
                    });
                }
                var interactionRulesService = $injector.get(AngularNameService.getNameOfInteractionRulesService(state.interaction.id));
                return $http.get('/createhandler/state_rules_stats/' + [
                    encodeURIComponent(explorationId),
                    encodeURIComponent(state.name)
                ].join('/')).then(function (response) {
                    return {
                        state_name: state.name,
                        exploration_id: explorationId,
                        visualizations_info: response.data.visualizations_info.map(function (vizInfo) {
                            var newVizInfo = angular.copy(vizInfo);
                            newVizInfo.data.forEach(function (vizInfoDatum) {
                                // If data is a FractionInput, need to change data so that
                                // visualization displays the input in a readable manner.
                                if (state.interaction.id === 'FractionInput') {
                                    vizInfoDatum.answer =
                                        FractionObjectFactory.fromDict(vizInfoDatum.answer).toString();
                                }
                                if (newVizInfo.addressed_info_is_supported) {
                                    vizInfoDatum.is_addressed =
                                        AnswerClassificationService
                                            .isClassifiedExplicitlyOrGoesToNewState(state.name, state, vizInfoDatum.answer, interactionRulesService);
                                }
                            });
                            return newVizInfo;
                        })
                    };
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/TranslationFileHashLoaderService.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/services/TranslationFileHashLoaderService.ts ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Service to load the i18n translation file.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').factory('TranslationFileHashLoaderService', [
    '$http', '$q', 'UrlInterpolationService',
    function ($http, $q, UrlInterpolationService) {
        /* Options object contains:
         *  prefix: added before key, defined by developer
         *  key: language key, determined internally by i18n library
         *  suffix: added after key, defined by developer
         */
        return function (options) {
            var fileUrl = [
                options.prefix,
                options.key,
                options.suffix
            ].join('');
            return $http.get(UrlInterpolationService.getStaticAssetUrl(fileUrl)).then(function (result) {
                return result.data;
            }, function () {
                return $q.reject(options.key);
            });
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/UserService.ts":
/*!*********************************************************!*\
  !*** ./core/templates/dev/head/services/UserService.ts ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
__webpack_require__(/*! domain/user/UserInfoObjectFactory.ts */ "./core/templates/dev/head/domain/user/UserInfoObjectFactory.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
/**
 * @fileoverview Service for user data.
 */
angular.module('oppia').factory('UserService', [
    '$http', '$q', '$window', 'UrlInterpolationService', 'UrlService',
    'UserInfoObjectFactory', 'DEFAULT_PROFILE_IMAGE_PATH',
    function ($http, $q, $window, UrlInterpolationService, UrlService, UserInfoObjectFactory, DEFAULT_PROFILE_IMAGE_PATH) {
        var PREFERENCES_DATA_URL = '/preferenceshandler/data';
        var userInfo = null;
        var getUserInfoAsync = function () {
            if (UrlService.getPathname() === '/signup') {
                return $q.resolve(UserInfoObjectFactory.createDefault());
            }
            if (userInfo) {
                return $q.resolve(userInfo);
            }
            return $http.get('/userinfohandler').then(function (response) {
                if (response.data.user_is_logged_in) {
                    userInfo = UserInfoObjectFactory.createFromBackendDict(response.data);
                    return $q.resolve(userInfo);
                }
                else {
                    return $q.resolve(UserInfoObjectFactory.createDefault());
                }
            });
        };
        return {
            getProfileImageDataUrlAsync: function () {
                var profilePictureDataUrl = (UrlInterpolationService.getStaticImageUrl(DEFAULT_PROFILE_IMAGE_PATH));
                return getUserInfoAsync().then(function (userInfo) {
                    if (userInfo.isLoggedIn()) {
                        return $http.get('/preferenceshandler/profile_picture').then(function (response) {
                            if (response.data.profile_picture_data_url) {
                                profilePictureDataUrl = response.data.profile_picture_data_url;
                            }
                            return profilePictureDataUrl;
                        });
                    }
                    else {
                        return $q.resolve(profilePictureDataUrl);
                    }
                });
            },
            setProfileImageDataUrlAsync: function (newProfileImageDataUrl) {
                return $http.put(PREFERENCES_DATA_URL, {
                    update_type: 'profile_picture_data_url',
                    data: newProfileImageDataUrl
                });
            },
            getLoginUrlAsync: function () {
                var urlParameters = {
                    current_url: $window.location.href
                };
                return $http.get('/url_handler', { params: urlParameters }).then(function (response) {
                    return response.data.login_url;
                });
            },
            getUserInfoAsync: getUserInfoAsync
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/UtilsService.ts":
/*!**********************************************************!*\
  !*** ./core/templates/dev/head/services/UtilsService.ts ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for storing all generic functions which have to be
 * used at multiple places in the codebase.
 */
angular.module('oppia').factory('UtilsService', [function () {
        var utils = {
            isEmpty: function (obj) {
                for (var property in obj) {
                    if (obj.hasOwnProperty(property)) {
                        return false;
                    }
                }
                return true;
            },
            // http://stackoverflow.com/questions/203739
            isString: function (input) {
                return (typeof input === 'string' || input instanceof String);
            }
        };
        return utils;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/DeviceInfoService.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/DeviceInfoService.ts ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service to check if user is on a mobile device.
 */
// See: https://stackoverflow.com/a/11381730
angular.module('oppia').factory('DeviceInfoService', [
    '$window', function ($window) {
        return {
            isMobileDevice: function () {
                return Boolean(navigator.userAgent.match(/Android/i) ||
                    navigator.userAgent.match(/webOS/i) ||
                    navigator.userAgent.match(/iPhone/i) ||
                    navigator.userAgent.match(/iPad/i) ||
                    navigator.userAgent.match(/iPod/i) ||
                    navigator.userAgent.match(/BlackBerry/i) ||
                    navigator.userAgent.match(/Windows Phone/i));
            },
            isMobileUserAgent: function () {
                return /Mobi/.test(navigator.userAgent);
            },
            hasTouchEvents: function () {
                return 'ontouchstart' in $window;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/DocumentAttributeCustomizationService.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/DocumentAttributeCustomizationService.ts ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to add custom attributes to the <html> element.
 */
angular.module('oppia').factory('DocumentAttributeCustomizationService', [
    '$window', function ($window) {
        return {
            addAttribute: function (attribute, value) {
                $window.document.documentElement.setAttribute(attribute, value);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/MetaTagCustomizationService.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/MetaTagCustomizationService.ts ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to add custom meta tags.
 */
angular.module('oppia').factory('MetaTagCustomizationService', [
    '$window', function ($window) {
        return {
            addMetaTags: function (attrArray) {
                attrArray.forEach(function (attr) {
                    var meta = $window.document.createElement('meta');
                    meta.setAttribute(attr.propertyType, attr.propertyValue);
                    meta.setAttribute('content', attr.content);
                    $window.document.head.appendChild(meta);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/UrlService.ts":
/*!*******************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/UrlService.ts ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for manipulating the page URL. Also allows
 * functions on $window to be mocked in unit tests.
 */
angular.module('oppia').factory('UrlService', ['$window', function ($window) {
        return {
            // This function is for testing purposes (to mock $window.location)
            getCurrentLocation: function () {
                return $window.location;
            },
            getCurrentQueryString: function () {
                return this.getCurrentLocation().search;
            },
            /* As params[key] is overwritten, if query string has multiple fieldValues
               for same fieldName, use getQueryFieldValuesAsList(fieldName) to get it
               in array form. */
            getUrlParams: function () {
                var params = {};
                var parts = this.getCurrentQueryString().replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                    params[decodeURIComponent(key)] = decodeURIComponent(value);
                });
                return params;
            },
            isIframed: function () {
                var pathname = this.getPathname();
                var urlParts = pathname.split('/');
                return urlParts[1] === 'embed';
            },
            getPathname: function () {
                return this.getCurrentLocation().pathname;
            },
            getTopicIdFromUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/topic_editor\/(\w|-){12}/g)) {
                    return pathname.split('/')[2];
                }
                throw Error('Invalid topic id url');
            },
            getTopicNameFromLearnerUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(story|topic|subtopic|practice_session)/g)) {
                    return decodeURIComponent(pathname.split('/')[2]);
                }
                throw Error('Invalid URL for topic');
            },
            getSubtopicIdFromUrl: function () {
                var pathname = this.getPathname();
                var argumentsArray = pathname.split('/');
                if (pathname.match(/\/subtopic/g) && argumentsArray.length === 4) {
                    return decodeURIComponent(argumentsArray[3]);
                }
                throw Error('Invalid URL for subtopic');
            },
            getStoryIdFromUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(story_editor|review_test)\/(\w|-){12}/g)) {
                    return pathname.split('/')[2];
                }
                throw Error('Invalid story id url');
            },
            getStoryIdFromViewerUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/story\/(\w|-){12}/g)) {
                    return pathname.split('/')[2];
                }
                throw Error('Invalid story id url');
            },
            getStoryIdInPlayer: function () {
                var query = this.getCurrentQueryString();
                var queryItems = query.split('&');
                for (var i = 0; i < queryItems.length; i++) {
                    var part = queryItems[i];
                    if (part.match(/\?story_id=((\w|-){12})/g)) {
                        return part.split('=')[1];
                    }
                }
                return null;
            },
            getSkillIdFromUrl: function () {
                var pathname = this.getPathname();
                var skillId = pathname.split('/')[2];
                if (skillId.length !== 12) {
                    throw Error('Invalid Skill Id');
                }
                return skillId;
            },
            getQueryFieldValuesAsList: function (fieldName) {
                var fieldValues = [];
                if (this.getCurrentQueryString().indexOf('?') > -1) {
                    // Each queryItem return one field-value pair in the url.
                    var queryItems = this.getCurrentQueryString().slice(this.getCurrentQueryString().indexOf('?') + 1).split('&');
                    for (var i = 0; i < queryItems.length; i++) {
                        var currentFieldName = decodeURIComponent(queryItems[i].split('=')[0]);
                        var currentFieldValue = decodeURIComponent(queryItems[i].split('=')[1]);
                        if (currentFieldName === fieldName) {
                            fieldValues.push(currentFieldValue);
                        }
                    }
                }
                return fieldValues;
            },
            addField: function (url, fieldName, fieldValue) {
                var encodedFieldValue = encodeURIComponent(fieldValue);
                var encodedFieldName = encodeURIComponent(fieldName);
                return url + (url.indexOf('?') !== -1 ? '&' : '?') + encodedFieldName +
                    '=' + encodedFieldValue;
            },
            getHash: function () {
                return this.getCurrentLocation().hash;
            },
            getOrigin: function () {
                return this.getCurrentLocation().origin;
            },
            getCollectionIdFromExplorationUrl: function () {
                var urlParams = this.getUrlParams();
                if (urlParams.hasOwnProperty('parent')) {
                    return null;
                }
                if (urlParams.hasOwnProperty('collection_id')) {
                    return urlParams.collection_id;
                }
                return null;
            },
            getUsernameFromProfileUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(profile)/g)) {
                    return decodeURIComponent(pathname.split('/')[2]);
                }
                throw Error('Invalid profile URL');
            },
            getCollectionIdFromUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(collection)/g)) {
                    return decodeURIComponent(pathname.split('/')[2]);
                }
                throw Error('Invalid collection URL');
            },
            getCollectionIdFromEditorUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(collection_editor\/create)/g)) {
                    return decodeURIComponent(pathname.split('/')[3]);
                }
                throw Error('Invalid collection editor URL');
            },
            getExplorationVersionFromUrl: function () {
                var urlParams = this.getUrlParams();
                if (urlParams.hasOwnProperty('v')) {
                    var version = urlParams.v;
                    if (version.includes('#')) {
                        // For explorations played in an iframe.
                        version = version.substring(0, version.indexOf('#'));
                    }
                    return Number(version);
                }
                return null;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/WindowDimensionsService.ts ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for computing the window dimensions.
 */
angular.module('oppia').factory('WindowDimensionsService', [
    '$window', function ($window) {
        var onResizeHooks = [];
        angular.element($window).bind('resize', function () {
            onResizeHooks.forEach(function (hookFn) {
                hookFn();
            });
        });
        return {
            getWidth: function () {
                return ($window.innerWidth || document.documentElement.clientWidth ||
                    document.body.clientWidth);
            },
            registerOnResizeHook: function (hookFn) {
                onResizeHooks.push(hookFn);
            },
            isWindowNarrow: function () {
                var NORMAL_NAVBAR_CUTOFF_WIDTH_PX = 768;
                return this.getWidth() <= NORMAL_NAVBAR_CUTOFF_WIDTH_PX;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/services.constants.ajs.ts":
/*!********************************************************************!*\
  !*** ./core/templates/dev/head/services/services.constants.ajs.ts ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for shared services across Oppia.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var services_constants_1 = __webpack_require__(/*! services/services.constants */ "./core/templates/dev/head/services/services.constants.ts");
angular.module('oppia').constant('PAGE_CONTEXT', services_constants_1.ServicesConstants.PAGE_CONTEXT);
angular.module('oppia').constant('EXPLORATION_EDITOR_TAB_CONTEXT', services_constants_1.ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT);
angular.module('oppia').constant('EXPLORATION_FEATURES_URL', services_constants_1.ServicesConstants.EXPLORATION_FEATURES_URL);
angular.module('oppia').constant('FETCH_ISSUES_URL', services_constants_1.ServicesConstants.FETCH_ISSUES_URL);
angular.module('oppia').constant('FETCH_PLAYTHROUGH_URL', services_constants_1.ServicesConstants.FETCH_PLAYTHROUGH_URL);
angular.module('oppia').constant('RESOLVE_ISSUE_URL', services_constants_1.ServicesConstants.RESOLVE_ISSUE_URL);
angular.module('oppia').constant('STORE_PLAYTHROUGH_URL', services_constants_1.ServicesConstants.STORE_PLAYTHROUGH_URL);
// Enables recording playthroughs from learner sessions.
angular.module('oppia').constant('EARLY_QUIT_THRESHOLD_IN_SECS', services_constants_1.ServicesConstants.EARLY_QUIT_THRESHOLD_IN_SECS);
angular.module('oppia').constant('NUM_INCORRECT_ANSWERS_THRESHOLD', services_constants_1.ServicesConstants.NUM_INCORRECT_ANSWERS_THRESHOLD);
angular.module('oppia').constant('NUM_REPEATED_CYCLES_THRESHOLD', services_constants_1.ServicesConstants.NUM_REPEATED_CYCLES_THRESHOLD);
angular.module('oppia').constant('CURRENT_ACTION_SCHEMA_VERSION', services_constants_1.ServicesConstants.CURRENT_ACTION_SCHEMA_VERSION);
angular.module('oppia').constant('CURRENT_ISSUE_SCHEMA_VERSION', services_constants_1.ServicesConstants.CURRENT_ISSUE_SCHEMA_VERSION);
// Whether to enable the promo bar functionality. This does not actually turn on
// the promo bar, as that is gated by a config value (see config_domain). This
// merely avoids checking for whether the promo bar is enabled for every Oppia
// page visited.
angular.module('oppia').constant('ENABLE_PROMO_BAR', services_constants_1.ServicesConstants.ENABLE_PROMO_BAR);
angular.module('oppia').constant('RTE_COMPONENT_SPECS', services_constants_1.ServicesConstants.RTE_COMPONENT_SPECS);
angular.module('oppia').constant('SEARCH_DATA_URL', services_constants_1.ServicesConstants.SEARCH_DATA_URL);
angular.module('oppia').constant('STATE_ANSWER_STATS_URL', services_constants_1.ServicesConstants.STATE_ANSWER_STATS_URL);


/***/ }),

/***/ "./core/templates/dev/head/services/services.constants.ts":
/*!****************************************************************!*\
  !*** ./core/templates/dev/head/services/services.constants.ts ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for shared services across Oppia.
 */
var ServicesConstants = /** @class */ (function () {
    function ServicesConstants() {
    }
    ServicesConstants.PAGE_CONTEXT = {
        COLLECTION_EDITOR: 'collection_editor',
        EXPLORATION_EDITOR: 'editor',
        EXPLORATION_PLAYER: 'learner',
        QUESTION_EDITOR: 'question_editor',
        QUESTION_PLAYER: 'question_player',
        SKILL_EDITOR: 'skill_editor',
        STORY_EDITOR: 'story_editor',
        TOPIC_EDITOR: 'topic_editor',
        OTHER: 'other'
    };
    ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT = {
        EDITOR: 'editor',
        PREVIEW: 'preview'
    };
    ServicesConstants.EXPLORATION_FEATURES_URL = '/explorehandler/features/<exploration_id>';
    ServicesConstants.FETCH_ISSUES_URL = '/issuesdatahandler/<exploration_id>';
    ServicesConstants.FETCH_PLAYTHROUGH_URL = '/playthroughdatahandler/<exploration_id>/<playthrough_id>';
    ServicesConstants.RESOLVE_ISSUE_URL = '/resolveissuehandler/<exploration_id>';
    ServicesConstants.STORE_PLAYTHROUGH_URL = '/explorehandler/store_playthrough/<exploration_id>';
    // Enables recording playthroughs from learner sessions.
    ServicesConstants.EARLY_QUIT_THRESHOLD_IN_SECS = 45;
    ServicesConstants.NUM_INCORRECT_ANSWERS_THRESHOLD = 3;
    ServicesConstants.NUM_REPEATED_CYCLES_THRESHOLD = 3;
    ServicesConstants.CURRENT_ACTION_SCHEMA_VERSION = 1;
    ServicesConstants.CURRENT_ISSUE_SCHEMA_VERSION = 1;
    // Whether to enable the promo bar functionality. This does not actually turn
    // on the promo bar, as that is gated by a config value (see config_domain).
    // This merely avoids checking for whether the promo bar is enabled for every
    // Oppia page visited.
    ServicesConstants.ENABLE_PROMO_BAR = true;
    ServicesConstants.SEARCH_DATA_URL = '/searchhandler/data';
    ServicesConstants.STATE_ANSWER_STATS_URL = '/createhandler/state_answer_stats/<exploration_id>';
    ServicesConstants.RTE_COMPONENT_SPECS = (__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'rich_text_components_definitions.ts'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())));
    return ServicesConstants;
}());
exports.ServicesConstants = ServicesConstants;


/***/ }),

/***/ "./core/templates/dev/head/services/stateful/BackgroundMaskService.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/services/stateful/BackgroundMaskService.ts ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for enabling a background mask that leaves navigation
 * visible.
 */
angular.module('oppia').factory('BackgroundMaskService', [
    function () {
        var maskIsActive = false;
        return {
            isMaskActive: function () {
                return maskIsActive;
            },
            activateMask: function () {
                maskIsActive = true;
            },
            deactivateMask: function () {
                maskIsActive = false;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/stateful/FocusManagerService.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/services/stateful/FocusManagerService.ts ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Service for setting focus. This broadcasts a 'focusOn' event
 * which sets focus to the element in the page with the corresponding focusOn
 * attribute.
 * Note: This requires LABEL_FOR_CLEARING_FOCUS to exist somewhere in the HTML
 * page.
 */
__webpack_require__(/*! services/contextual/DeviceInfoService.ts */ "./core/templates/dev/head/services/contextual/DeviceInfoService.ts");
__webpack_require__(/*! services/IdGenerationService.ts */ "./core/templates/dev/head/services/IdGenerationService.ts");
angular.module('oppia').factory('FocusManagerService', [
    '$rootScope', '$timeout', 'DeviceInfoService', 'IdGenerationService',
    'LABEL_FOR_CLEARING_FOCUS',
    function ($rootScope, $timeout, DeviceInfoService, IdGenerationService, LABEL_FOR_CLEARING_FOCUS) {
        var _nextLabelToFocusOn = null;
        return {
            clearFocus: function () {
                this.setFocus(LABEL_FOR_CLEARING_FOCUS);
            },
            setFocus: function (name) {
                if (_nextLabelToFocusOn) {
                    return;
                }
                _nextLabelToFocusOn = name;
                $timeout(function () {
                    $rootScope.$broadcast('focusOn', _nextLabelToFocusOn);
                    _nextLabelToFocusOn = null;
                });
            },
            setFocusIfOnDesktop: function (newFocusLabel) {
                if (!DeviceInfoService.isMobileDevice()) {
                    this.setFocus(newFocusLabel);
                }
            },
            // Generates a random string (to be used as a focus label).
            generateFocusLabel: function () {
                return IdGenerationService.generateNewId();
            }
        };
    }
]);


/***/ }),

/***/ "./node_modules/@angular/core/fesm5 lazy recursive":
/*!****************************************************************!*\
  !*** ./node_modules/@angular/core/fesm5 lazy namespace object ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(function() {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./node_modules/@angular/core/fesm5 lazy recursive";

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9BcHAudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvSTE4bkZvb3Rlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9hcHAuY29uc3RhbnRzLmFqcy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9hcHAuY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvYnV0dG9uLWRpcmVjdGl2ZXMvY3JlYXRlLWFjdGl2aXR5LWJ1dHRvbi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9idXR0b24tZGlyZWN0aXZlcy9zb2NpYWwtYnV0dG9ucy5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzL2FsZXJ0LW1lc3NhZ2UuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy9wcm9tby1iYXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL25hdmlnYXRpb24tYmFycy9zaWRlLW5hdmlnYXRpb24tYmFyLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9uYXZpZ2F0aW9uLWJhcnMvdG9wLW5hdmlnYXRpb24tYmFyLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2VudGl0eS1jcmVhdGlvbi1zZXJ2aWNlcy9jb2xsZWN0aW9uLWNyZWF0aW9uLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvZXhwbG9yYXRpb24tY3JlYXRpb24uc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2N1c3RvbS1mb3Jtcy1kaXJlY3RpdmVzL29iamVjdC1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RpcmVjdGl2ZXMvZm9jdXMtb24uZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9zaWRlYmFyL1NpZGViYXJTdGF0dXNTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi91c2VyL1VzZXJJbmZvT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL0Jyb3dzZXJDaGVja2VyU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2dvb2dsZS1hbmFseXRpY3MuaW5pdGlhbGl6ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvQmFzZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0NvbnN0cnVjdFRyYW5zbGF0aW9uSWRzU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9Db250ZXh0U2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9Dc3JmVG9rZW5TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0RhdGVUaW1lRm9ybWF0U2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9EZWJvdW5jZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0h0bWxFc2NhcGVyU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9JZEdlbmVyYXRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL05hdmlnYXRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1Byb21vQmFyU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9SdGVIZWxwZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1N0YXRlUnVsZXNTdGF0c1NlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvVHJhbnNsYXRpb25GaWxlSGFzaExvYWRlclNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvVXNlclNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvVXRpbHNTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL2NvbnRleHR1YWwvRGV2aWNlSW5mb1NlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvY29udGV4dHVhbC9Eb2N1bWVudEF0dHJpYnV0ZUN1c3RvbWl6YXRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL2NvbnRleHR1YWwvTWV0YVRhZ0N1c3RvbWl6YXRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9jb250ZXh0dWFsL1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL3NlcnZpY2VzLmNvbnN0YW50cy5hanMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvc2VydmljZXMuY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL3N0YXRlZnVsL0JhY2tncm91bmRNYXNrU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9zdGF0ZWZ1bC9Gb2N1c01hbmFnZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9AYW5ndWxhci9jb3JlL2Zlc201IGxhenkgbmFtZXNwYWNlIG9iamVjdCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsb0dBQWtDO0FBQzFDLG1CQUFPLENBQUMsOERBQWU7QUFDdkIsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkMsbUJBQU8sQ0FBQyx3RkFBNEI7QUFDcEMsbUJBQU8sQ0FBQyw0RkFBOEI7QUFDdEMsbUJBQU8sQ0FBQyw4RkFBK0I7QUFDdkMsbUJBQU8sQ0FBQyxvRkFBMEI7QUFDbEMsbUJBQU8sQ0FBQyw0RkFBOEI7QUFDdEMsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0MsbUJBQU8sQ0FBQyxrR0FBaUM7QUFDekMsbUJBQU8sQ0FBQyxnR0FBZ0M7QUFDeEMsbUJBQU8sQ0FBQyw0SEFBOEM7QUFDdEQsbUJBQU8sQ0FBQyw0RkFBOEI7QUFDdEMsbUJBQU8sQ0FBQyx3R0FBb0M7QUFDNUMsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQsbUJBQU8sQ0FBQyxrRkFBeUI7QUFDakMsbUJBQU8sQ0FBQywwRkFBNkI7QUFDckMsbUJBQU8sQ0FBQyxvSEFBMEM7QUFDbEQsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0MsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQsbUJBQU8sQ0FBQyxvSEFBMEM7QUFDbEQsbUJBQU8sQ0FBQyxvR0FBa0M7QUFDMUMsbUJBQU8sQ0FBQyxnTUFDd0I7QUFDaEMsbUJBQU8sQ0FBQyxvS0FBa0U7QUFDMUUsbUJBQU8sQ0FBQywwS0FBcUU7QUFDN0UsbUJBQU8sQ0FBQyx3TEFDb0I7QUFDNUIsbUJBQU8sQ0FBQyw0TUFDOEI7QUFDdEMsbUJBQU8sQ0FBQyxvSkFBMEQ7QUFDbEUsbUJBQU8s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Q2xDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCxHQUFHLFNBQVMsR0FBRztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Es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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakI7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDckRMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ3BETDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EseUNBQXlDO0FBQ3pDLDBDQUEwQztBQUMx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O0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNB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QUFDQTtBQUNBO0FBQ0EsK0JBQStCLHVCQUF1QjtBQUN0RDtBQUNBLHVEQUF1RCxHQUFHO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsdUJBQXVCO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDMUtMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLG1CQUFPLENBQUMsNkZBQTZCO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDLG1CQUFPLENBQUMsNkpBQXFDO0FBQzFGO0FBQ0EsQ0FBQztBQUNEOzs7Ozs7Ozs7Ozs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLG9IQUEwQztBQUNsRCxtQkFBTyxDQUFDLGtHQUFpQztBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQSw0Q0FBNEMsV0FBVztBQUN2RDtBQUNBO0FBQ0Esa0YiLCJmaWxlIjoiYWJvdXR+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29tbXVuaXR5X2Rhc2hib2FyZH5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lMDZhNGExNy5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEluaXRpYWxpemF0aW9uIGFuZCBiYXNpYyBjb25maWd1cmF0aW9uIGZvciB0aGUgT3BwaWEgbW9kdWxlLlxuICovXG5yZXF1aXJlKCdkaXJlY3RpdmVzL2ZvY3VzLW9uLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvQmFzZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ29udGV4dFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0NzcmZUb2tlblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL05hdmlnYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9VdGlsc1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0RlYm91bmNlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0RhdGVUaW1lRm9ybWF0U2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSWRHZW5lcmF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9UcmFuc2xhdGlvbkZpbGVIYXNoTG9hZGVyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvUnRlSGVscGVyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU3RhdGVSdWxlc1N0YXRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ29uc3RydWN0VHJhbnNsYXRpb25JZHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvUHJvbW9CYXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL0RldmljZUluZm9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL3N0YXRlZnVsL0JhY2tncm91bmRNYXNrU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvc3RhdGVmdWwvRm9jdXNNYW5hZ2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU2l0ZUFuYWx5dGljc1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAnYWxlcnQtbWVzc2FnZS5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvYnV0dG9uLWRpcmVjdGl2ZXMvY3JlYXRlLWFjdGl2aXR5LWJ1dHRvbi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvY3VzdG9tLWZvcm1zLWRpcmVjdGl2ZXMvb2JqZWN0LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAncHJvbW8tYmFyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvbmF2aWdhdGlvbi1iYXJzLycgK1xuICAgICdzaWRlLW5hdmlnYXRpb24tYmFyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9idXR0b24tZGlyZWN0aXZlcy9zb2NpYWwtYnV0dG9ucy5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL25hdmlnYXRpb24tYmFycy8nICtcbiAgICAndG9wLW5hdmlnYXRpb24tYmFyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3NpZGViYXIvU2lkZWJhclN0YXR1c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91c2VyL1VzZXJJbmZvT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnYXBwLmNvbnN0YW50cy5hanMudHMnKTtcbnJlcXVpcmUoJ2dvb2dsZS1hbmFseXRpY3MuaW5pdGlhbGl6ZXIudHMnKTtcbi8vIFRoZSBmb2xsb3dpbmcgZmlsZSB1c2VzIGNvbnN0YW50cyBpbiBhcHAuY29uc3RhbnRzLnRzIGFuZCBoZW5jZSBuZWVkcyB0byBiZVxuLy8gbG9hZGVkIGFmdGVyIGFwcC5jb25zdGFudHMudHNcbnJlcXVpcmUoJ0kxOG5Gb290ZXIudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbmZpZyhbXG4gICAgJyRjb21waWxlUHJvdmlkZXInLCAnJGNvb2tpZXNQcm92aWRlcicsICckaHR0cFByb3ZpZGVyJyxcbiAgICAnJGludGVycG9sYXRlUHJvdmlkZXInLCAnJGxvY2F0aW9uUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uICgkY29tcGlsZVByb3ZpZGVyLCAkY29va2llc1Byb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkaW50ZXJwb2xhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAgICAgLy8gVGhpcyBpbXByb3ZlcyBwZXJmb3JtYW5jZSBieSBkaXNhYmxpbmcgZGVidWcgZGF0YS4gRm9yIG1vcmUgZGV0YWlscyxcbiAgICAgICAgLy8gc2VlIGh0dHBzOi8vY29kZS5hbmd1bGFyanMub3JnLzEuNS41L2RvY3MvZ3VpZGUvcHJvZHVjdGlvblxuICAgICAgICAkY29tcGlsZVByb3ZpZGVyLmRlYnVnSW5mb0VuYWJsZWQoZmFsc2UpO1xuICAgICAgICAvLyBTZXQgdGhlIEFuZ3VsYXJKUyBpbnRlcnBvbGF0b3JzIGFzIDxbIGFuZCBdPiwgdG8gbm90IGNvbmZsaWN0IHdpdGhcbiAgICAgICAgLy8gSmluamEyIHRlbXBsYXRlcy5cbiAgICAgICAgJGludGVycG9sYXRlUHJvdmlkZXIuc3RhcnRTeW1ib2woJzxbJyk7XG4gICAgICAgICRpbnRlcnBvbGF0ZVByb3ZpZGVyLmVuZFN5bWJvbCgnXT4nKTtcbiAgICAgICAgLy8gUHJldmVudCB0aGUgc2VhcmNoIHBhZ2UgZnJvbSByZWxvYWRpbmcgaWYgdGhlIHNlYXJjaCBxdWVyeSBpcyBjaGFuZ2VkLlxuICAgICAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUoZmFsc2UpO1xuICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lID09PSAnL3NlYXJjaC9maW5kJykge1xuICAgICAgICAgICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFByZXZlbnQgc3RvcmluZyBkdXBsaWNhdGUgY29va2llcyBmb3IgdHJhbnNsYXRpb24gbGFuZ3VhZ2UuXG4gICAgICAgICRjb29raWVzUHJvdmlkZXIuZGVmYXVsdHMucGF0aCA9ICcvJztcbiAgICAgICAgLy8gU2V0IGRlZmF1bHQgaGVhZGVycyBmb3IgUE9TVCBhbmQgUFVUIHJlcXVlc3RzLlxuICAgICAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMucG9zdCA9IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ1xuICAgICAgICB9O1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnMucHV0ID0ge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXG4gICAgICAgIH07XG4gICAgICAgIC8vIEFkZCBhbiBpbnRlcmNlcHRvciB0byBjb252ZXJ0IHJlcXVlc3RzIHRvIHN0cmluZ3MgYW5kIHRvIGxvZyBhbmQgc2hvd1xuICAgICAgICAvLyB3YXJuaW5ncyBmb3IgZXJyb3IgcmVzcG9uc2VzLlxuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckcScsICckbG9nJywgJ0FsZXJ0c1NlcnZpY2UnLCAnQ3NyZlRva2VuU2VydmljZScsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJHEsICRsb2csIEFsZXJ0c1NlcnZpY2UsIENzcmZUb2tlblNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgQ1NSRiB0b2tlbiBiZWZvcmUgc2VuZGluZyB0aGUgcmVxdWVzdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ3NyZlRva2VuU2VydmljZS5nZXRUb2tlbkFzeW5jKCkudGhlbihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5kYXRhID0gJC5wYXJhbSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3NyZl90b2tlbjogdG9rZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogSlNPTi5zdHJpbmdpZnkoY29uZmlnLmRhdGEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogZG9jdW1lbnQuVVJMXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVqZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBIHJlamVjdGlvbiBzdGF0dXMgb2YgLTEgc2VlbXMgdG8gaW5kaWNhdGUgKGl0J3MgaGFyZCB0byBmaW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkb2N1bWVudGF0aW9uKSB0aGF0IHRoZSByZXNwb25zZSBoYXMgbm90IGNvbXBsZXRlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdoaWNoIGNhbiBvY2N1ciBpZiB0aGUgdXNlciBuYXZpZ2F0ZXMgYXdheSBmcm9tIHRoZSBwYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aGlsZSB0aGUgcmVzcG9uc2UgaXMgcGVuZGluZywgVGhpcyBzaG91bGQgbm90IGJlIGNvbnNpZGVyZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuIGVycm9yLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlamVjdGlvbi5zdGF0dXMgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxvZy5lcnJvcihyZWplY3Rpb24uZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHdhcm5pbmdNZXNzYWdlID0gJ0Vycm9yIGNvbW11bmljYXRpbmcgd2l0aCBzZXJ2ZXIuJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVqZWN0aW9uLmRhdGEgJiYgcmVqZWN0aW9uLmRhdGEuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ01lc3NhZ2UgPSByZWplY3Rpb24uZGF0YS5lcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKHdhcm5pbmdNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVqZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH1cbl0pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uZmlnKFsnJHByb3ZpZGUnLCBmdW5jdGlvbiAoJHByb3ZpZGUpIHtcbiAgICAgICAgJHByb3ZpZGUuZGVjb3JhdG9yKCckbG9nJywgWyckZGVsZWdhdGUnLCAnREVWX01PREUnLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRkZWxlZ2F0ZSwgREVWX01PREUpIHtcbiAgICAgICAgICAgICAgICB2YXIgX29yaWdpbmFsRXJyb3IgPSAkZGVsZWdhdGUuZXJyb3I7XG4gICAgICAgICAgICAgICAgaWYgKCFERVZfTU9ERSkge1xuICAgICAgICAgICAgICAgICAgICAkZGVsZWdhdGUubG9nID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgICAgICAgICAgICAgICAgICAkZGVsZWdhdGUuaW5mbyA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyhzbGwpOiBTZW5kIGVycm9ycyAoYW5kIG1heWJlIHdhcm5pbmdzKSB0byB0aGUgYmFja2VuZC5cbiAgICAgICAgICAgICAgICAgICAgJGRlbGVnYXRlLndhcm4gPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgICAgICAgICAgICAgICAgICRkZWxlZ2F0ZS5lcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoU3RyaW5nKG1lc3NhZ2UpLmluZGV4T2YoJyRkaWdlc3QgYWxyZWFkeSBpbiBwcm9ncmVzcycpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9vcmlnaW5hbEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGtlZXBzIGFuZ3VsYXItbW9ja3MgaGFwcHkgKGluIHRlc3RzKS5cbiAgICAgICAgICAgICAgICAgICAgJGRlbGVnYXRlLmVycm9yLmxvZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICRkZWxlZ2F0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfV0pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uZmlnKFsndG9hc3RyQ29uZmlnJywgZnVuY3Rpb24gKHRvYXN0ckNvbmZpZykge1xuICAgICAgICBhbmd1bGFyLmV4dGVuZCh0b2FzdHJDb25maWcsIHtcbiAgICAgICAgICAgIGFsbG93SHRtbDogZmFsc2UsXG4gICAgICAgICAgICBpY29uQ2xhc3Nlczoge1xuICAgICAgICAgICAgICAgIGVycm9yOiAndG9hc3QtZXJyb3InLFxuICAgICAgICAgICAgICAgIGluZm86ICd0b2FzdC1pbmZvJyxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiAndG9hc3Qtc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgd2FybmluZzogJ3RvYXN0LXdhcm5pbmcnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9zaXRpb25DbGFzczogJ3RvYXN0LWJvdHRvbS1yaWdodCcsXG4gICAgICAgICAgICBtZXNzYWdlQ2xhc3M6ICd0b2FzdC1tZXNzYWdlJyxcbiAgICAgICAgICAgIHByb2dyZXNzQmFyOiBmYWxzZSxcbiAgICAgICAgICAgIHRhcFRvRGlzbWlzczogdHJ1ZSxcbiAgICAgICAgICAgIHRpdGxlQ2xhc3M6ICd0b2FzdC10aXRsZSdcbiAgICAgICAgfSk7XG4gICAgfV0pO1xuLy8gT3ZlcndyaXRlIHRoZSBidWlsdC1pbiBleGNlcHRpb25IYW5kbGVyIHNlcnZpY2UgdG8gbG9nIGVycm9ycyB0byB0aGUgYmFja2VuZFxuLy8gKHNvIHRoYXQgdGhleSBjYW4gYmUgZml4ZWQpLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnJGV4Y2VwdGlvbkhhbmRsZXInLCBbXG4gICAgJyRsb2cnLCAnQ3NyZlRva2VuU2VydmljZScsIGZ1bmN0aW9uICgkbG9nLCBDc3JmVG9rZW5TZXJ2aWNlKSB7XG4gICAgICAgIHZhciBNSU5fVElNRV9CRVRXRUVOX0VSUk9SU19NU0VDID0gNTAwMDtcbiAgICAgICAgdmFyIHRpbWVPZkxhc3RQb3N0ZWRFcnJvciA9IERhdGUubm93KCkgLSBNSU5fVElNRV9CRVRXRUVOX0VSUk9SU19NU0VDO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGV4Y2VwdGlvbiwgY2F1c2UpIHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlQW5kU291cmNlQW5kU3RhY2tUcmFjZSA9IFtcbiAgICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgICAnQ2F1c2U6ICcgKyBjYXVzZSxcbiAgICAgICAgICAgICAgICBleGNlcHRpb24ubWVzc2FnZSxcbiAgICAgICAgICAgICAgICBTdHJpbmcoZXhjZXB0aW9uLnN0YWNrKSxcbiAgICAgICAgICAgICAgICAnICAgIGF0IFVSTDogJyArIHdpbmRvdy5sb2NhdGlvbi5ocmVmXG4gICAgICAgICAgICBdLmpvaW4oJ1xcbicpO1xuICAgICAgICAgICAgLy8gVG8gcHJldmVudCBhbiBvdmVyZG9zZSBvZiBlcnJvcnMsIHRocm90dGxlIHRvIGF0IG1vc3QgMSBlcnJvciBldmVyeVxuICAgICAgICAgICAgLy8gTUlOX1RJTUVfQkVUV0VFTl9FUlJPUlNfTVNFQy5cbiAgICAgICAgICAgIGlmIChEYXRlLm5vdygpIC0gdGltZU9mTGFzdFBvc3RlZEVycm9yID4gTUlOX1RJTUVfQkVUV0VFTl9FUlJPUlNfTVNFQykge1xuICAgICAgICAgICAgICAgIC8vIENhdGNoIGFsbCBlcnJvcnMsIHRvIGd1YXJkIGFnYWluc3QgaW5maW5pdGUgcmVjdXJzaXZlIGxvb3BzLlxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIHVzZSBqUXVlcnkgaGVyZSBpbnN0ZWFkIG9mIEFuZ3VsYXIncyAkaHR0cCwgc2luY2UgdGhlIGxhdHRlclxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGVzIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICAgICAgICAgICAgICAgICAgQ3NyZlRva2VuU2VydmljZS5nZXRUb2tlbkFzeW5jKCkudGhlbihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJy9mcm9udGVuZF9lcnJvcnMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjc3JmX3Rva2VuOiB0b2tlbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IG1lc3NhZ2VBbmRTb3VyY2VBbmRTdGFja1RyYWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGRvY3VtZW50LlVSTFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHRydWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVPZkxhc3RQb3N0ZWRFcnJvciA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAobG9nZ2luZ0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICRsb2cud2FybignRXJyb3IgbG9nZ2luZyBmYWlsZWQuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJGxvZy5lcnJvci5hcHBseSgkbG9nLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuLy8gQWRkIGEgU3RyaW5nLnByb3RvdHlwZS50cmltKCkgcG9seWZpbGwgZm9yIElFOC5cbmlmICh0eXBlb2YgU3RyaW5nLnByb3RvdHlwZS50cmltICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgU3RyaW5nLnByb3RvdHlwZS50cmltID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgfTtcbn1cbi8vIEFkZCBhbiBPYmplY3QuY3JlYXRlKCkgcG9seWZpbGwgZm9yIElFOC5cbmlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBGID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgICAgICBPYmplY3QuY3JlYXRlID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdTZWNvbmQgYXJndW1lbnQgZm9yIE9iamVjdC5jcmVhdGUoKSBpcyBub3Qgc3VwcG9ydGVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdDYW5ub3Qgc2V0IGEgbnVsbCBbW1Byb3RvdHlwZV1dJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG8gIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgRi5wcm90b3R5cGUgPSBvO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBGKCk7XG4gICAgICAgIH07XG4gICAgfSkoKTtcbn1cbi8vIEFkZCBhIE51bWJlci5pc0ludGVnZXIoKSBwb2x5ZmlsbCBmb3IgSUUuXG5OdW1iZXIuaXNJbnRlZ2VyID0gTnVtYmVyLmlzSW50ZWdlciB8fCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUodmFsdWUpICYmXG4gICAgICAgIE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSk7XG59O1xuLy8gQWRkIEFycmF5LmZpbGwoKSBwb2x5ZmlsbCBmb3IgSUUuXG5pZiAoIUFycmF5LnByb3RvdHlwZS5maWxsKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFycmF5LnByb3RvdHlwZSwgJ2ZpbGwnLCB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIC8vIFN0ZXBzIDEtMi5cbiAgICAgICAgICAgIGlmICh0aGlzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigndGhpcyBpcyBudWxsIG9yIG5vdCBkZWZpbmVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgTyA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgICAgIC8vIFN0ZXBzIDMtNS5cbiAgICAgICAgICAgIHZhciBsZW4gPSBPLmxlbmd0aCA+Pj4gMDtcbiAgICAgICAgICAgIC8vIFN0ZXBzIDYtNy5cbiAgICAgICAgICAgIHZhciBzdGFydCA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgICAgIHZhciByZWxhdGl2ZVN0YXJ0ID0gc3RhcnQgPj4gMDtcbiAgICAgICAgICAgIC8vIFN0ZXAgOC5cbiAgICAgICAgICAgIHZhciBrID0gcmVsYXRpdmVTdGFydCA8IDAgP1xuICAgICAgICAgICAgICAgIE1hdGgubWF4KGxlbiArIHJlbGF0aXZlU3RhcnQsIDApIDpcbiAgICAgICAgICAgICAgICBNYXRoLm1pbihyZWxhdGl2ZVN0YXJ0LCBsZW4pO1xuICAgICAgICAgICAgLy8gU3RlcHMgOS0xMC5cbiAgICAgICAgICAgIHZhciBlbmQgPSBhcmd1bWVudHNbMl07XG4gICAgICAgICAgICB2YXIgcmVsYXRpdmVFbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/XG4gICAgICAgICAgICAgICAgbGVuIDogZW5kID4+IDA7XG4gICAgICAgICAgICAvLyBTdGVwIDExLlxuICAgICAgICAgICAgdmFyIGZpbmFsID0gcmVsYXRpdmVFbmQgPCAwID9cbiAgICAgICAgICAgICAgICBNYXRoLm1heChsZW4gKyByZWxhdGl2ZUVuZCwgMCkgOlxuICAgICAgICAgICAgICAgIE1hdGgubWluKHJlbGF0aXZlRW5kLCBsZW4pO1xuICAgICAgICAgICAgLy8gU3RlcCAxMi5cbiAgICAgICAgICAgIHdoaWxlIChrIDwgZmluYWwpIHtcbiAgICAgICAgICAgICAgICBPW2tdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3RlcCAxMy5cbiAgICAgICAgICAgIHJldHVybiBPO1xuICAgICAgICB9XG4gICAgfSk7XG59XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRyYW5zbGF0aW9uIGZ1bmN0aW9ucyBmb3IgT3BwaWEuXG4gKlxuICogQGF1dGhvciBtaWxhZ3JvLnRlcnVlbEBnbWFpbC5jb20gKE1pbGFncm8gVGVydWVsKVxuICovXG5yZXF1aXJlKCdzZXJ2aWNlcy9UcmFuc2xhdGlvbkZpbGVIYXNoTG9hZGVyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdpMThuRm9vdGVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvaTE4bi1mb290ZXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJGh0dHAnLCAnJHRpbWVvdXQnLCAnJHRyYW5zbGF0ZScsICdVc2VyU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1NVUFBPUlRFRF9TSVRFX0xBTkdVQUdFUycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRodHRwLCAkdGltZW91dCwgJHRyYW5zbGF0ZSwgVXNlclNlcnZpY2UsIFNVUFBPUlRFRF9TSVRFX0xBTkdVQUdFUykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZXMgdGhlIGxhbmd1YWdlIG9mIHRoZSB0cmFuc2xhdGlvbnMuXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmVmZXJlbmNlc0RhdGFVcmwgPSAnL3ByZWZlcmVuY2VzaGFuZGxlci9kYXRhJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpdGVMYW5ndWFnZVVybCA9ICcvc2F2ZV9zaXRlX2xhbmd1YWdlJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zdXBwb3J0ZWRTaXRlTGFuZ3VhZ2VzID0gU1VQUE9SVEVEX1NJVEVfTEFOR1VBR0VTO1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgJHRpbWVvdXQgc2VlbXMgdG8gYmUgbmVjZXNzYXJ5IGZvciB0aGUgZHJvcGRvd24gdG8gc2hvd1xuICAgICAgICAgICAgICAgICAgICAvLyBhbnl0aGluZyBhdCB0aGUgb3V0c2V0LCBpZiB0aGUgZGVmYXVsdCBsYW5ndWFnZSBpcyBub3QgRW5nbGlzaC5cbiAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJHRyYW5zbGF0ZS51c2UoKSByZXR1cm5zIHVuZGVmaW5lZCB1bnRpbCB0aGUgbGFuZ3VhZ2UgZmlsZSBpc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZnVsbHkgbG9hZGVkLCB3aGljaCBjYXVzZXMgYSBibGFuayBmaWVsZCBpbiB0aGUgZHJvcGRvd24sIGhlbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSB1c2UgJHRyYW5zbGF0ZS5wcm9wb3NlZExhbmd1YWdlKCkgYXMgc3VnZ2VzdGVkIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yODkwMzY1OFxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jdXJyZW50TGFuZ3VhZ2VDb2RlID0gJHRyYW5zbGF0ZS51c2UoKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0cmFuc2xhdGUucHJvcG9zZWRMYW5ndWFnZSgpO1xuICAgICAgICAgICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2hhbmdlTGFuZ3VhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdHJhbnNsYXRlLnVzZShjdHJsLmN1cnJlbnRMYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgVXNlclNlcnZpY2UuZ2V0VXNlckluZm9Bc3luYygpLnRoZW4oZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJJbmZvLmlzTG9nZ2VkSW4oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaHR0cC5wdXQoc2l0ZUxhbmd1YWdlVXJsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXRlX2xhbmd1YWdlX2NvZGU6IGN0cmwuY3VycmVudExhbmd1YWdlQ29kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25maWcoW1xuICAgICckdHJhbnNsYXRlUHJvdmlkZXInLCAnREVGQVVMVF9UUkFOU0xBVElPTlMnLCAnU1VQUE9SVEVEX1NJVEVfTEFOR1VBR0VTJyxcbiAgICBmdW5jdGlvbiAoJHRyYW5zbGF0ZVByb3ZpZGVyLCBERUZBVUxUX1RSQU5TTEFUSU9OUywgU1VQUE9SVEVEX1NJVEVfTEFOR1VBR0VTKSB7XG4gICAgICAgIHZhciBhdmFpbGFibGVMYW5ndWFnZUtleXMgPSBbXTtcbiAgICAgICAgdmFyIGF2YWlsYWJsZUxhbmd1YWdlS2V5c01hcCA9IHt9O1xuICAgICAgICBTVVBQT1JURURfU0lURV9MQU5HVUFHRVMuZm9yRWFjaChmdW5jdGlvbiAobGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIGF2YWlsYWJsZUxhbmd1YWdlS2V5cy5wdXNoKGxhbmd1YWdlLmlkKTtcbiAgICAgICAgICAgIGF2YWlsYWJsZUxhbmd1YWdlS2V5c01hcFtsYW5ndWFnZS5pZCArICcqJ10gPSBsYW5ndWFnZS5pZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGF2YWlsYWJsZUxhbmd1YWdlS2V5c01hcFsnKiddID0gJ2VuJztcbiAgICAgICAgJHRyYW5zbGF0ZVByb3ZpZGVyXG4gICAgICAgICAgICAucmVnaXN0ZXJBdmFpbGFibGVMYW5ndWFnZUtleXMoYXZhaWxhYmxlTGFuZ3VhZ2VLZXlzLCBhdmFpbGFibGVMYW5ndWFnZUtleXNNYXApXG4gICAgICAgICAgICAudXNlTG9hZGVyKCdUcmFuc2xhdGlvbkZpbGVIYXNoTG9hZGVyU2VydmljZScsIHtcbiAgICAgICAgICAgIHByZWZpeDogJy9pMThuLycsXG4gICAgICAgICAgICBzdWZmaXg6ICcuanNvbidcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC8vIFRoZSB1c2Ugb2YgZGVmYXVsdCB0cmFuc2xhdGlvbiBpbXByb3ZlcyB0aGUgbG9hZGluZyB0aW1lIHdoZW4gRW5nbGlzaFxuICAgICAgICAgICAgLy8gaXMgc2VsZWN0ZWRcbiAgICAgICAgICAgIC50cmFuc2xhdGlvbnMoJ2VuJywgREVGQVVMVF9UUkFOU0xBVElPTlMpXG4gICAgICAgICAgICAuZmFsbGJhY2tMYW5ndWFnZSgnZW4nKVxuICAgICAgICAgICAgLmRldGVybWluZVByZWZlcnJlZExhbmd1YWdlKClcbiAgICAgICAgICAgIC51c2VDb29raWVTdG9yYWdlKClcbiAgICAgICAgICAgIC8vIFRoZSBtZXNzYWdlZm9ybWF0IGludGVycG9sYXRpb24gbWV0aG9kIGlzIG5lY2Vzc2FyeSBmb3IgcGx1cmFsaXphdGlvbi5cbiAgICAgICAgICAgIC8vIElzIG9wdGlvbmFsIGFuZCBzaG91bGQgYmUgcGFzc2VkIGFzIGFyZ3VtZW50IHRvIHRoZSB0cmFuc2xhdGUgY2FsbC4gU2VlXG4gICAgICAgICAgICAvLyBodHRwczovL2FuZ3VsYXItdHJhbnNsYXRlLmdpdGh1Yi5pby9kb2NzLyMvZ3VpZGUvMTRfcGx1cmFsaXphdGlvblxuICAgICAgICAgICAgLmFkZEludGVycG9sYXRpb24oJyR0cmFuc2xhdGVNZXNzYWdlRm9ybWF0SW50ZXJwb2xhdGlvbicpXG4gICAgICAgICAgICAvLyBUaGUgc3RyYXRlZ3kgJ3Nhbml0aXplJyBkb2VzIG5vdCBzdXBwb3J0IHV0Zi04IGVuY29kaW5nLlxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXItdHJhbnNsYXRlL2FuZ3VsYXItdHJhbnNsYXRlL2lzc3Vlcy8xMTMxXG4gICAgICAgICAgICAvLyBUaGUgc3RyYXRlZ3kgJ2VzY2FwZScgd2lsbCBicmFrZSBzdHJpbmdzIHdpdGggcmF3IGh0bWwsIGxpa2UgaHlwZXJsaW5rc1xuICAgICAgICAgICAgLnVzZVNhbml0aXplVmFsdWVTdHJhdGVneSgnc2FuaXRpemVQYXJhbWV0ZXJzJylcbiAgICAgICAgICAgIC5mb3JjZUFzeW5jUmVsb2FkKHRydWUpO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBTaGFyZWQgY29uc3RhbnRzIGZvciB0aGUgT3BwaWEgbW9kdWxlLlxuICovXG4vLyBUT0RPKCM3MDkyKTogRGVsZXRlIHRoaXMgZmlsZSBvbmNlIG1pZ3JhdGlvbiBpcyBjb21wbGV0ZSBhbmQgdGhlc2UgQW5ndWxhckpTXG4vLyBlcXVpdmFsZW50cyBvZiB0aGUgQW5ndWxhciBjb25zdGFudHMgYXJlIG5vIGxvbmdlciBuZWVkZWQuXG52YXIgYXBwX2NvbnN0YW50c18xID0gcmVxdWlyZShcImFwcC5jb25zdGFudHNcIik7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSgnY29uc3RhbnRzLnRzJyk7XG5mb3IgKHZhciBjb25zdGFudE5hbWUgaW4gY29uc3RhbnRzKSB7XG4gICAgYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoY29uc3RhbnROYW1lLCBjb25zdGFudHNbY29uc3RhbnROYW1lXSk7XG59XG4vLyBUcmFuc2xhdGlvbnMgb2Ygc3RyaW5ncyB0aGF0IGFyZSBsb2FkZWQgaW4gdGhlIGZyb250IHBhZ2UuIFRoZXkgYXJlIGxpc3RlZFxuLy8gaGVyZSB0byBiZSBsb2FkZWQgc3luY2hyb25vdXNseSB3aXRoIHRoZSBzY3JpcHQgdG8gcHJldmVudCBhIEZPVUMgb3Jcbi8vIEZsYXNoIG9mIFVudHJhbnNsYXRlZCBDb250ZW50LlxuLy8gU2VlIGh0dHA6Ly9hbmd1bGFyLXRyYW5zbGF0ZS5naXRodWIuaW8vZG9jcy8jL2d1aWRlLzEyX2FzeW5jaHJvbm91cy1sb2FkaW5nXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnREVGQVVMVF9UUkFOU0xBVElPTlMnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkRFRkFVTFRfVFJBTlNMQVRJT05TKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdSVUxFX1NVTU1BUllfV1JBUF9DSEFSQUNURVJfQ09VTlQnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLlJVTEVfU1VNTUFSWV9XUkFQX0NIQVJBQ1RFUl9DT1VOVCk7XG4vKiBDYWxsZWQgYWx3YXlzIHdoZW4gbGVhcm5lciBtb3ZlcyB0byBhIG5ldyBjYXJkLlxuICAgQWxzbyBjYWxsZWQgd2hlbiBjYXJkIGlzIHNlbGVjdGVkIGJ5IGNsaWNraW5nIG9uIHByb2dyZXNzIGRvdHMgKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFVkVOVF9BQ1RJVkVfQ0FSRF9DSEFOR0VEJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5FVkVOVF9BQ1RJVkVfQ0FSRF9DSEFOR0VEKTtcbi8qIENhbGxlZCB3aGVuIHRoZSBsZWFybmVyIG1vdmVzIHRvIGEgbmV3IGNhcmQgdGhhdCB0aGV5IGhhdmVuJ3Qgc2VlbiBiZWZvcmUuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRVZFTlRfTkVXX0NBUkRfT1BFTkVEJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5FVkVOVF9ORVdfQ0FSRF9PUEVORUQpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0VESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfRFJBRlRfVVJMX1RFTVBMQVRFJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5FRElUQUJMRV9FWFBMT1JBVElPTl9EQVRBX0RSQUZUX1VSTF9URU1QTEFURSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRURJVEFCTEVfRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkVESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfVVJMX1RFTVBMQVRFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFWFBMT1JBVElPTl9EQVRBX1VSTF9URU1QTEFURScsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0VYUExPUkFUSU9OX1ZFUlNJT05fREFUQV9VUkxfVEVNUExBVEUnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkVYUExPUkFUSU9OX1ZFUlNJT05fREFUQV9VUkxfVEVNUExBVEUpO1xuLyogTmV3IGNhcmQgaXMgYXZhaWxhYmxlIGJ1dCB1c2VyIGhhc24ndCBnb25lIHRvIGl0IHlldCAod2hlbiBvcHBpYVxuICAgZ2l2ZXMgYSBmZWVkYmFjayBhbmQgd2FpdHMgZm9yIHVzZXIgdG8gcHJlc3MgJ2NvbnRpbnVlJykuXG4gICBOb3QgY2FsbGVkIHdoZW4gYSBjYXJkIGlzIHNlbGVjdGVkIGJ5IGNsaWNraW5nIHByb2dyZXNzIGRvdHMgKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFVkVOVF9ORVdfQ0FSRF9BVkFJTEFCTEUnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkVWRU5UX05FV19DQVJEX0FWQUlMQUJMRSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnV0FSTklOR19UWVBFUycsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuV0FSTklOR19UWVBFUyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU1RBVEVfRVJST1JfTUVTU0FHRVMnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLlNUQVRFX0VSUk9SX01FU1NBR0VTKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFWFBMT1JBVElPTl9TVU1NQVJZX0RBVEFfVVJMX1RFTVBMQVRFJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5FWFBMT1JBVElPTl9TVU1NQVJZX0RBVEFfVVJMX1RFTVBMQVRFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFWFBMT1JBVElPTl9BTkRfU0tJTExfSURfUEFUVEVSTicsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuRVhQTE9SQVRJT05fQU5EX1NLSUxMX0lEX1BBVFRFUk4pO1xuLy8gV2UgdXNlIGEgc2xhc2ggYmVjYXVzZSB0aGlzIGNoYXJhY3RlciBpcyBmb3JiaWRkZW4gaW4gYSBzdGF0ZSBuYW1lLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1BMQUNFSE9MREVSX09VVENPTUVfREVTVCcsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuUExBQ0VIT0xERVJfT1VUQ09NRV9ERVNUKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdJTlRFUkFDVElPTl9ESVNQTEFZX01PREVfSU5MSU5FJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5JTlRFUkFDVElPTl9ESVNQTEFZX01PREVfSU5MSU5FKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdMT0FESU5HX0lORElDQVRPUl9VUkwnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkxPQURJTkdfSU5ESUNBVE9SX1VSTCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnT0JKRUNUX0VESVRPUl9VUkxfUFJFRklYJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5PQkpFQ1RfRURJVE9SX1VSTF9QUkVGSVgpO1xuLy8gRmVhdHVyZSBzdGlsbCBpbiBkZXZlbG9wbWVudC5cbi8vIE5PVEUgVE8gREVWRUxPUEVSUzogVGhpcyBzaG91bGQgYmUgc3luY2hyb25pemVkIHdpdGggdGhlIHZhbHVlIGluIGZlY29uZi5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFTkFCTEVfTUxfQ0xBU1NJRklFUlMnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkVOQUJMRV9NTF9DTEFTU0lGSUVSUyk7XG4vLyBGZWF0dXJlIHN0aWxsIGluIGRldmVsb3BtZW50LlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0lORk9fTUVTU0FHRV9TT0xVVElPTl9JU19JTlZBTElEX0ZPUl9FWFBMT1JBVElPTicsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuSU5GT19NRVNTQUdFX1NPTFVUSU9OX0lTX0lOVkFMSURfRk9SX0VYUExPUkFUSU9OKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdQQVJBTUVURVJfVFlQRVMnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLlBBUkFNRVRFUl9UWVBFUyk7XG4vLyBUaGUgbWF4aW11bSBudW1iZXIgb2Ygbm9kZXMgdG8gc2hvdyBpbiBhIHJvdyBvZiB0aGUgc3RhdGUgZ3JhcGguXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnTUFYX05PREVTX1BFUl9ST1cnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLk1BWF9OT0RFU19QRVJfUk9XKTtcbi8vIFRoZSBmb2xsb3dpbmcgdmFyaWFibGUgbXVzdCBiZSBhdCBsZWFzdCAzLiBJdCByZXByZXNlbnRzIHRoZSBtYXhpbXVtIGxlbmd0aCxcbi8vIGluIGNoYXJhY3RlcnMsIGZvciB0aGUgbmFtZSBvZiBlYWNoIG5vZGUgbGFiZWwgaW4gdGhlIHN0YXRlIGdyYXBoLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ01BWF9OT0RFX0xBQkVMX0xFTkdUSCcsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuTUFYX05PREVfTEFCRUxfTEVOR1RIKTtcbi8vIElmIGFuICRodHRwIHJlcXVlc3QgZmFpbHMgd2l0aCB0aGUgZm9sbG93aW5nIGVycm9yIGNvZGVzLCBhIHdhcm5pbmcgaXNcbi8vIGRpc3BsYXllZC5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdGQVRBTF9FUlJPUl9DT0RFUycsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuRkFUQUxfRVJST1JfQ09ERVMpO1xuLy8gRG8gbm90IG1vZGlmeSB0aGVzZSwgZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IHJlYXNvbnMuXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ09NUE9ORU5UX05BTUVfQ09OVEVOVCcsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuQ09NUE9ORU5UX05BTUVfQ09OVEVOVCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ09NUE9ORU5UX05BTUVfSElOVCcsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuQ09NUE9ORU5UX05BTUVfSElOVCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ09NUE9ORU5UX05BTUVfU09MVVRJT04nLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkNPTVBPTkVOVF9OQU1FX1NPTFVUSU9OKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDT01QT05FTlRfTkFNRV9GRUVEQkFDSycsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuQ09NUE9ORU5UX05BTUVfRkVFREJBQ0spO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NPTVBPTkVOVF9OQU1FX0VYUExBTkFUSU9OJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5DT01QT05FTlRfTkFNRV9FWFBMQU5BVElPTik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ09NUE9ORU5UX05BTUVfV09SS0VEX0VYQU1QTEUnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkNPTVBPTkVOVF9OQU1FX1dPUktFRF9FWEFNUExFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdBQ1RJT05fVFlQRV9FWFBMT1JBVElPTl9TVEFSVCcsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuQUNUSU9OX1RZUEVfRVhQTE9SQVRJT05fU1RBUlQpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0FDVElPTl9UWVBFX0FOU1dFUl9TVUJNSVQnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkFDVElPTl9UWVBFX0FOU1dFUl9TVUJNSVQpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0FDVElPTl9UWVBFX0VYUExPUkFUSU9OX1FVSVQnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkFDVElPTl9UWVBFX0VYUExPUkFUSU9OX1FVSVQpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0lTU1VFX1RZUEVfRUFSTFlfUVVJVCcsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuSVNTVUVfVFlQRV9FQVJMWV9RVUlUKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdJU1NVRV9UWVBFX01VTFRJUExFX0lOQ09SUkVDVF9TVUJNSVNTSU9OUycsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuSVNTVUVfVFlQRV9NVUxUSVBMRV9JTkNPUlJFQ1RfU1VCTUlTU0lPTlMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0lTU1VFX1RZUEVfQ1lDTElDX1NUQVRFX1RSQU5TSVRJT05TJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5JU1NVRV9UWVBFX0NZQ0xJQ19TVEFURV9UUkFOU0lUSU9OUyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0lURV9OQU1FJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5TSVRFX05BTUUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0RFRkFVTFRfUFJPRklMRV9JTUFHRV9QQVRIJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5ERUZBVUxUX1BST0ZJTEVfSU1BR0VfUEFUSCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnTE9HT1VUX1VSTCcsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuTE9HT1VUX1VSTCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRVZFTlRfUVVFU1RJT05fU1VNTUFSSUVTX0lOSVRJQUxJWkVEJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5FVkVOVF9RVUVTVElPTl9TVU1NQVJJRVNfSU5JVElBTElaRUQpO1xuLy8gVE9ETyh2b2p0ZWNoamVsaW5layk6IE1vdmUgdGhlc2UgdG8gc2VwYXJhdGUgZmlsZSBsYXRlciwgYWZ0ZXIgd2UgZXN0YWJsaXNoXG4vLyBwcm9jZXNzIHRvIGZvbGxvdyBmb3IgQW5ndWxhciBjb25zdGFudHMgKCM2NzMxKS5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVUJUT1BJQ19QQUdFX0VESVRPUl9EQVRBX1VSTF9URU1QTEFURScsIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMuU1VCVE9QSUNfUEFHRV9FRElUT1JfREFUQV9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0VESVRBQkxFX1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5FRElUQUJMRV9UT1BJQ19EQVRBX1VSTF9URU1QTEFURSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnTEFCRUxfRk9SX0NMRUFSSU5HX0ZPQ1VTJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5MQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMpO1xuLy8gVE9ETyhiaGVubmluZyk6IFRoaXMgY29uc3RhbnQgc2hvdWxkIGJlIHByb3ZpZGVkIGJ5IHRoZSBiYWNrZW5kLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NPTExFQ1RJT05fREFUQV9VUkxfVEVNUExBVEUnLCBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkNPTExFQ1RJT05fREFUQV9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0VOVElUWV9UWVBFJywgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5FTlRJVFlfVFlQRSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNoYXJlZCBjb25zdGFudHMgZm9yIHRoZSBPcHBpYSBtb2R1bGUuXG4gKi9cbnZhciBBcHBDb25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQXBwQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBBcHBDb25zdGFudHMuREVGQVVMVF9UUkFOU0xBVElPTlMgPSB7XG4gICAgICAgIEkxOE5fTElCUkFSWV9QQUdFX1RJVExFOiAnTGlicmFyeScsXG4gICAgICAgIEkxOE5fTElCUkFSWV9MT0FESU5HOiAnTG9hZGluZycsXG4gICAgICAgIEkxOE5fU0lHTlVQX1BBR0VfU1VCVElUTEU6ICdSZWdpc3RyYXRpb24nLFxuICAgICAgICBJMThOX1NJR05VUF9QQUdFX1RJVExFOiAnT3BwaWEnLFxuICAgICAgICBJMThOX0xJQlJBUllfU0VBUkNIX1BMQUNFSE9MREVSOiAnV2hhdCBhcmUgeW91IGN1cmlvdXMgYWJvdXQ/JyxcbiAgICAgICAgSTE4Tl9MSUJSQVJZX0FMTF9MQU5HVUFHRVM6ICdBbGwgTGFuZ3VhZ2VzJyxcbiAgICAgICAgSTE4Tl9MSUJSQVJZX0xBTkdVQUdFU19FTjogJ0VuZ2xpc2gnLFxuICAgICAgICBJMThOX0xJQlJBUllfQUxMX0NBVEVHT1JJRVM6ICdBbGwgQ2F0ZWdvcmllcycsXG4gICAgICAgIEkxOE5fVE9QTkFWX1NJR05fSU46ICdTaWduIGluJyxcbiAgICAgICAgSTE4Tl9TUExBU0hfUEFHRV9USVRMRTogJ09wcGlhOiBUZWFjaCwgTGVhcm4sIEV4cGxvcmUnLFxuICAgICAgICBJMThOX1NJR05VUF9SRUdJU1RSQVRJT046ICdSZWdpc3RyYXRpb24nLFxuICAgICAgICBJMThOX1NJR05VUF9MT0FESU5HOiAnTG9hZGluZydcbiAgICB9O1xuICAgIEFwcENvbnN0YW50cy5BQ1RJVklUWV9TVEFUVVNfUFJJVkFURSA9ICdwcml2YXRlJztcbiAgICBBcHBDb25zdGFudHMuQUNUSVZJVFlfU1RBVFVTX1BVQkxJQyA9ICdwdWJsaWMnO1xuICAgIEFwcENvbnN0YW50cy5SVUxFX1NVTU1BUllfV1JBUF9DSEFSQUNURVJfQ09VTlQgPSAzMDtcbiAgICAvKiBDYWxsZWQgYWx3YXlzIHdoZW4gbGVhcm5lciBtb3ZlcyB0byBhIG5ldyBjYXJkLlxuICAgICAgIEFsc28gY2FsbGVkIHdoZW4gY2FyZCBpcyBzZWxlY3RlZCBieSBjbGlja2luZyBvbiBwcm9ncmVzcyBkb3RzICovXG4gICAgQXBwQ29uc3RhbnRzLkVWRU5UX0FDVElWRV9DQVJEX0NIQU5HRUQgPSAnYWN0aXZlQ2FyZENoYW5nZWQnO1xuICAgIC8qIENhbGxlZCB3aGVuIHRoZSBsZWFybmVyIG1vdmVzIHRvIGEgbmV3IGNhcmQgdGhhdCB0aGV5IGhhdmVuJ3Qgc2VlblxuICAgICAgIGJlZm9yZS4gKi9cbiAgICBBcHBDb25zdGFudHMuRVZFTlRfTkVXX0NBUkRfT1BFTkVEID0gJ25ld0NhcmRPcGVuZWQnO1xuICAgIEFwcENvbnN0YW50cy5FRElUQUJMRV9FWFBMT1JBVElPTl9EQVRBX0RSQUZUX1VSTF9URU1QTEFURSA9ICcvY3JlYXRlaGFuZGxlci9kYXRhLzxleHBsb3JhdGlvbl9pZD4/YXBwbHlfZHJhZnQ9PGFwcGx5X2RyYWZ0Pic7XG4gICAgQXBwQ29uc3RhbnRzLkVESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfVVJMX1RFTVBMQVRFID0gJy9jcmVhdGVoYW5kbGVyL2RhdGEvPGV4cGxvcmF0aW9uX2lkPic7XG4gICAgQXBwQ29uc3RhbnRzLkVYUExPUkFUSU9OX0RBVEFfVVJMX1RFTVBMQVRFID0gJy9leHBsb3JlaGFuZGxlci9pbml0LzxleHBsb3JhdGlvbl9pZD4nO1xuICAgIEFwcENvbnN0YW50cy5FWFBMT1JBVElPTl9WRVJTSU9OX0RBVEFfVVJMX1RFTVBMQVRFID0gJy9leHBsb3JlaGFuZGxlci9pbml0LzxleHBsb3JhdGlvbl9pZD4/dj08dmVyc2lvbj4nO1xuICAgIC8qIE5ldyBjYXJkIGlzIGF2YWlsYWJsZSBidXQgdXNlciBoYXNuJ3QgZ29uZSB0byBpdCB5ZXQgKHdoZW4gb3BwaWFcbiAgICAgICBnaXZlcyBhIGZlZWRiYWNrIGFuZCB3YWl0cyBmb3IgdXNlciB0byBwcmVzcyAnY29udGludWUuXG4gICAgICAgTm90IGNhbGxlZCB3aGVuIGEgY2FyZCBpcyBzZWxlY3RlZCBieSBjbGlja2luZyBwcm9ncmVzcyBkb3RzICovXG4gICAgQXBwQ29uc3RhbnRzLkVWRU5UX05FV19DQVJEX0FWQUlMQUJMRSA9ICduZXdDYXJkQXZhaWxhYmxlJztcbiAgICBBcHBDb25zdGFudHMuV0FSTklOR19UWVBFUyA9IHtcbiAgICAgICAgLy8gVGhlc2UgbXVzdCBiZSBmaXhlZCBiZWZvcmUgdGhlIGV4cGxvcmF0aW9uIGNhbiBiZSBzYXZlZC5cbiAgICAgICAgQ1JJVElDQUw6ICdjcml0aWNhbCcsXG4gICAgICAgIC8vIFRoZXNlIG11c3QgYmUgZml4ZWQgYmVmb3JlIHB1Ymxpc2hpbmcgYW4gZXhwbG9yYXRpb24gdG8gdGhlIHB1YmxpY1xuICAgICAgICAvLyBsaWJyYXJ5LlxuICAgICAgICBFUlJPUjogJ2Vycm9yJ1xuICAgIH07XG4gICAgQXBwQ29uc3RhbnRzLlNUQVRFX0VSUk9SX01FU1NBR0VTID0ge1xuICAgICAgICBBRERfSU5URVJBQ1RJT046ICdQbGVhc2UgYWRkIGFuIGludGVyYWN0aW9uIHRvIHRoaXMgY2FyZC4nLFxuICAgICAgICBTVEFURV9VTlJFQUNIQUJMRTogJ1RoaXMgY2FyZCBpcyB1bnJlYWNoYWJsZS4nLFxuICAgICAgICBVTkFCTEVfVE9fRU5EX0VYUExPUkFUSU9OOiAoJ1RoZXJlXFwncyBubyB3YXkgdG8gY29tcGxldGUgdGhlIGV4cGxvcmF0aW9uIHN0YXJ0aW5nIGZyb20gdGhpcyBjYXJkLiAnICtcbiAgICAgICAgICAgICdUbyBmaXggdGhpcywgbWFrZSBzdXJlIHRoYXQgdGhlIGxhc3QgY2FyZCBpbiB0aGUgY2hhaW4gc3RhcnRpbmcgZnJvbScgK1xuICAgICAgICAgICAgJyB0aGlzIG9uZSBoYXMgYW4gXFwnRW5kIEV4cGxvcmF0aW9uXFwnIHF1ZXN0aW9uIHR5cGUuJyksXG4gICAgICAgIElOQ09SUkVDVF9TT0xVVElPTjogKCdUaGUgY3VycmVudCBzb2x1dGlvbiBkb2VzIG5vdCBsZWFkIHRvIGFub3RoZXIgY2FyZC4nKSxcbiAgICAgICAgVU5SRVNPTFZFRF9BTlNXRVI6ICgnVGhlcmUgaXMgYW4gYW5zd2VyIGFtb25nIHRoZSB0b3AgMTAgd2hpY2ggaGFzIG5vIGV4cGxpY2l0IGZlZWRiYWNrLicpXG4gICAgfTtcbiAgICBBcHBDb25zdGFudHMuRVhQTE9SQVRJT05fU1VNTUFSWV9EQVRBX1VSTF9URU1QTEFURSA9ICcvZXhwbG9yYXRpb25zdW1tYXJpZXNoYW5kbGVyL2RhdGEnO1xuICAgIEFwcENvbnN0YW50cy5FWFBMT1JBVElPTl9BTkRfU0tJTExfSURfUEFUVEVSTiA9IC9eW2EtekEtWjAtOV8tXSskLztcbiAgICAvLyBXZSB1c2UgYSBzbGFzaCBiZWNhdXNlIHRoaXMgY2hhcmFjdGVyIGlzIGZvcmJpZGRlbiBpbiBhIHN0YXRlIG5hbWUuXG4gICAgQXBwQ29uc3RhbnRzLlBMQUNFSE9MREVSX09VVENPTUVfREVTVCA9ICcvJztcbiAgICBBcHBDb25zdGFudHMuSU5URVJBQ1RJT05fRElTUExBWV9NT0RFX0lOTElORSA9ICdpbmxpbmUnO1xuICAgIEFwcENvbnN0YW50cy5MT0FESU5HX0lORElDQVRPUl9VUkwgPSAnL2FjdGl2aXR5L2xvYWRpbmdJbmRpY2F0b3IuZ2lmJztcbiAgICBBcHBDb25zdGFudHMuT0JKRUNUX0VESVRPUl9VUkxfUFJFRklYID0gJy9vYmplY3RfZWRpdG9yX3RlbXBsYXRlLyc7XG4gICAgLy8gRmVhdHVyZSBzdGlsbCBpbiBkZXZlbG9wbWVudC5cbiAgICAvLyBOT1RFIFRPIERFVkVMT1BFUlM6IFRoaXMgc2hvdWxkIGJlIHN5bmNocm9uaXplZCB3aXRoIHRoZSB2YWx1ZSBpbiBmZWNvbmYuXG4gICAgQXBwQ29uc3RhbnRzLkVOQUJMRV9NTF9DTEFTU0lGSUVSUyA9IGZhbHNlO1xuICAgIC8vIEZlYXR1cmUgc3RpbGwgaW4gZGV2ZWxvcG1lbnQuXG4gICAgQXBwQ29uc3RhbnRzLklORk9fTUVTU0FHRV9TT0xVVElPTl9JU19JTlZBTElEX0ZPUl9FWFBMT1JBVElPTiA9ICdUaGUgY3VycmVudCBzb2x1dGlvbiBkb2VzIG5vdCBsZWFkIHRvIGFub3RoZXIgY2FyZC4nO1xuICAgIEFwcENvbnN0YW50cy5QQVJBTUVURVJfVFlQRVMgPSB7XG4gICAgICAgIFJFQUw6ICdSZWFsJyxcbiAgICAgICAgVU5JQ09ERV9TVFJJTkc6ICdVbmljb2RlU3RyaW5nJ1xuICAgIH07XG4gICAgLy8gVGhlIG1heGltdW0gbnVtYmVyIG9mIG5vZGVzIHRvIHNob3cgaW4gYSByb3cgb2YgdGhlIHN0YXRlIGdyYXBoLlxuICAgIEFwcENvbnN0YW50cy5NQVhfTk9ERVNfUEVSX1JPVyA9IDQ7XG4gICAgLy8gVGhlIGZvbGxvd2luZyB2YXJpYWJsZSBtdXN0IGJlIGF0IGxlYXN0IDMuIEl0IHJlcHJlc2VudHMgdGhlIG1heGltdW1cbiAgICAvLyBsZW5ndGgsIGluIGNoYXJhY3RlcnMsIGZvciB0aGUgbmFtZSBvZiBlYWNoIG5vZGUgbGFiZWwgaW4gdGhlIHN0YXRlIGdyYXBoLlxuICAgIEFwcENvbnN0YW50cy5NQVhfTk9ERV9MQUJFTF9MRU5HVEggPSAxNTtcbiAgICAvLyBJZiBhbiAkaHR0cCByZXF1ZXN0IGZhaWxzIHdpdGggdGhlIGZvbGxvd2luZyBlcnJvciBjb2RlcywgYSB3YXJuaW5nIGlzXG4gICAgLy8gZGlzcGxheWVkLlxuICAgIEFwcENvbnN0YW50cy5GQVRBTF9FUlJPUl9DT0RFUyA9IFs0MDAsIDQwMSwgNDA0LCA1MDBdO1xuICAgIC8vIERvIG5vdCBtb2RpZnkgdGhlc2UsIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSByZWFzb25zLlxuICAgIEFwcENvbnN0YW50cy5DT01QT05FTlRfTkFNRV9DT05URU5UID0gJ2NvbnRlbnQnO1xuICAgIEFwcENvbnN0YW50cy5DT01QT05FTlRfTkFNRV9ISU5UID0gJ2hpbnQnO1xuICAgIEFwcENvbnN0YW50cy5DT01QT05FTlRfTkFNRV9TT0xVVElPTiA9ICdzb2x1dGlvbic7XG4gICAgQXBwQ29uc3RhbnRzLkNPTVBPTkVOVF9OQU1FX0ZFRURCQUNLID0gJ2ZlZWRiYWNrJztcbiAgICBBcHBDb25zdGFudHMuQ09NUE9ORU5UX05BTUVfRVhQTEFOQVRJT04gPSAnZXhwbGFuYXRpb24nO1xuICAgIEFwcENvbnN0YW50cy5DT01QT05FTlRfTkFNRV9XT1JLRURfRVhBTVBMRSA9ICd3b3JrZWRfZXhhbXBsZSc7XG4gICAgQXBwQ29uc3RhbnRzLkFDVElPTl9UWVBFX0VYUExPUkFUSU9OX1NUQVJUID0gJ0V4cGxvcmF0aW9uU3RhcnQnO1xuICAgIEFwcENvbnN0YW50cy5BQ1RJT05fVFlQRV9BTlNXRVJfU1VCTUlUID0gJ0Fuc3dlclN1Ym1pdCc7XG4gICAgQXBwQ29uc3RhbnRzLkFDVElPTl9UWVBFX0VYUExPUkFUSU9OX1FVSVQgPSAnRXhwbG9yYXRpb25RdWl0JztcbiAgICBBcHBDb25zdGFudHMuSVNTVUVfVFlQRV9FQVJMWV9RVUlUID0gJ0Vhcmx5UXVpdCc7XG4gICAgQXBwQ29uc3RhbnRzLklTU1VFX1RZUEVfTVVMVElQTEVfSU5DT1JSRUNUX1NVQk1JU1NJT05TID0gJ011bHRpcGxlSW5jb3JyZWN0U3VibWlzc2lvbnMnO1xuICAgIEFwcENvbnN0YW50cy5JU1NVRV9UWVBFX0NZQ0xJQ19TVEFURV9UUkFOU0lUSU9OUyA9ICdDeWNsaWNTdGF0ZVRyYW5zaXRpb25zJztcbiAgICBBcHBDb25zdGFudHMuU0lURV9OQU1FID0gJ09wcGlhLm9yZyc7XG4gICAgQXBwQ29uc3RhbnRzLkRFRkFVTFRfUFJPRklMRV9JTUFHRV9QQVRIID0gJy9hdmF0YXIvdXNlcl9ibHVlXzcycHgucG5nJztcbiAgICBBcHBDb25zdGFudHMuTE9HT1VUX1VSTCA9ICcvbG9nb3V0JztcbiAgICBBcHBDb25zdGFudHMuRVZFTlRfUVVFU1RJT05fU1VNTUFSSUVTX0lOSVRJQUxJWkVEID0gJ3F1ZXN0aW9uU3VtbWFyaWVzSW5pdGlhbGl6ZWQnO1xuICAgIC8vIFRPRE8odm9qdGVjaGplbGluZWspOiBNb3ZlIHRoZXNlIHRvIHNlcGFyYXRlIGZpbGUgbGF0ZXIsIGFmdGVyIHdlIGVzdGFibGlzaFxuICAgIC8vIHByb2Nlc3MgdG8gZm9sbG93IGZvciBBbmd1bGFyIGNvbnN0YW50cyAoIzY3MzEpLlxuICAgIEFwcENvbnN0YW50cy5TVUJUT1BJQ19QQUdFX0VESVRPUl9EQVRBX1VSTF9URU1QTEFURSA9ICcvc3VidG9waWNfcGFnZV9lZGl0b3JfaGFuZGxlci9kYXRhLzx0b3BpY19pZD4vPHN1YnRvcGljX2lkPic7XG4gICAgQXBwQ29uc3RhbnRzLkVESVRBQkxFX1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFID0gJy90b3BpY19lZGl0b3JfaGFuZGxlci9kYXRhLzx0b3BpY19pZD4nO1xuICAgIEFwcENvbnN0YW50cy5MQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMgPSAnbGFiZWxGb3JDbGVhcmluZ0ZvY3VzJztcbiAgICAvLyBUT0RPKGJoZW5uaW5nKTogVGhpcyBjb25zdGFudCBzaG91bGQgYmUgcHJvdmlkZWQgYnkgdGhlIGJhY2tlbmQuXG4gICAgQXBwQ29uc3RhbnRzLkNPTExFQ1RJT05fREFUQV9VUkxfVEVNUExBVEUgPSAnL2NvbGxlY3Rpb25faGFuZGxlci9kYXRhLzxjb2xsZWN0aW9uX2lkPic7XG4gICAgQXBwQ29uc3RhbnRzLkVOVElUWV9UWVBFID0ge1xuICAgICAgICBFWFBMT1JBVElPTjogJ2V4cGxvcmF0aW9uJyxcbiAgICAgICAgVE9QSUM6ICd0b3BpYycsXG4gICAgICAgIFNLSUxMOiAnc2tpbGwnLFxuICAgICAgICBTVE9SWTogJ3N0b3J5JyxcbiAgICAgICAgU1VCVE9QSUM6ICdzdWJ0b3BpYydcbiAgICB9O1xuICAgIHJldHVybiBBcHBDb25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5BcHBDb25zdGFudHMgPSBBcHBDb25zdGFudHM7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSgnY29uc3RhbnRzLnRzJyk7XG5PYmplY3QuYXNzaWduKEFwcENvbnN0YW50cywgY29uc3RhbnRzKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgQ3JlYXRlIEV4cGxvcmF0aW9uL0NvbGxlY3Rpb24gYnV0dG9uLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2VudGl0eS1jcmVhdGlvbi1zZXJ2aWNlcy9jb2xsZWN0aW9uLWNyZWF0aW9uLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZW50aXR5LWNyZWF0aW9uLXNlcnZpY2VzL2V4cGxvcmF0aW9uLWNyZWF0aW9uLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvQnJvd3NlckNoZWNrZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdjcmVhdGVBY3Rpdml0eUJ1dHRvbicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvYnV0dG9uLWRpcmVjdGl2ZXMvY3JlYXRlLWFjdGl2aXR5LWJ1dHRvbi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckdGltZW91dCcsICckd2luZG93JywgJyR1aWJNb2RhbCcsXG4gICAgICAgICAgICAgICAgJ0V4cGxvcmF0aW9uQ3JlYXRpb25TZXJ2aWNlJywgJ0NvbGxlY3Rpb25DcmVhdGlvblNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdTaXRlQW5hbHl0aWNzU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnQUxMT1dfWUFNTF9GSUxFX1VQTE9BRCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCR0aW1lb3V0LCAkd2luZG93LCAkdWliTW9kYWwsIEV4cGxvcmF0aW9uQ3JlYXRpb25TZXJ2aWNlLCBDb2xsZWN0aW9uQ3JlYXRpb25TZXJ2aWNlLCBTaXRlQW5hbHl0aWNzU2VydmljZSwgVXJsU2VydmljZSwgVXNlclNlcnZpY2UsIEFMTE9XX1lBTUxfRklMRV9VUExPQUQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNyZWF0aW9uSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmFsbG93WWFtbEZpbGVVcGxvYWQgPSBBTExPV19ZQU1MX0ZJTEVfVVBMT0FEO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNhbkNyZWF0ZUNvbGxlY3Rpb25zID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC51c2VySXNMb2dnZWRJbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLmdldFVzZXJJbmZvQXN5bmMoKS50aGVuKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jYW5DcmVhdGVDb2xsZWN0aW9ucyA9IHVzZXJJbmZvLmNhbkNyZWF0ZUNvbGxlY3Rpb25zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJJc0xvZ2dlZEluID0gdXNlckluZm8uaXNMb2dnZWRJbigpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zaG93VXBsb2FkRXhwbG9yYXRpb25Nb2RhbCA9IChFeHBsb3JhdGlvbkNyZWF0aW9uU2VydmljZS5zaG93VXBsb2FkRXhwbG9yYXRpb25Nb2RhbCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwub25SZWRpcmVjdFRvTG9naW4gPSBmdW5jdGlvbiAoZGVzdGluYXRpb25VcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNpdGVBbmFseXRpY3NTZXJ2aWNlLnJlZ2lzdGVyU3RhcnRMb2dpbkV2ZW50KCdjcmVhdGVBY3Rpdml0eUJ1dHRvbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24gPSBkZXN0aW5hdGlvblVybDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDE1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaW5pdENyZWF0aW9uUHJvY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdpdGhvdXQgdGhpcywgdGhlIG1vZGFsIGtlZXBzIHJlb3BlbmluZyB3aGVuIHRoZSB3aW5kb3cgaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlc2l6ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5jcmVhdGlvbkluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNyZWF0aW9uSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwuY2FuQ3JlYXRlQ29sbGVjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvbkNyZWF0aW9uU2VydmljZS5jcmVhdGVOZXdFeHBsb3JhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoVXJsU2VydmljZS5nZXRQYXRobmFtZSgpICE9PSAnL2NyZWF0b3JfZGFzaGJvYXJkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24ucmVwbGFjZSgnL2NyZWF0b3JfZGFzaGJvYXJkP21vZGU9Y3JlYXRlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NyZWF0b3ItZGFzaGJvYXJkLXBhZ2UvbW9kYWwtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NyZWF0ZS1hY3Rpdml0eS1tb2RhbC5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLmdldFVzZXJJbmZvQXN5bmMoKS50aGVuKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuQ3JlYXRlQ29sbGVjdGlvbnMgPSAodXNlckluZm8uY2FuQ3JlYXRlQ29sbGVjdGlvbnMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNob29zZUV4cGxvcmF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvbkNyZWF0aW9uU2VydmljZS5jcmVhdGVOZXdFeHBsb3JhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNob29zZUNvbGxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25DcmVhdGlvblNlcnZpY2UuY3JlYXRlTmV3Q29sbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25JbWdVcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9hY3Rpdml0eS9leHBsb3JhdGlvbi5zdmcnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb25JbWdVcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9hY3Rpdml0eS9jb2xsZWN0aW9uLnN2ZycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Q2xhc3M6ICdvcHBpYS1jcmVhdGlvbi1tb2RhbCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5yZXN1bHQudGhlbihmdW5jdGlvbiAoKSB7IH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jcmVhdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHVzZXIgY2xpY2tlZCBvbiBhICdjcmVhdGUnIGJ1dHRvbiB0byBnZXQgdG8gdGhlIGRhc2hib2FyZCxcbiAgICAgICAgICAgICAgICAgICAgLy8gb3BlbiB0aGUgY3JlYXRlIG1vZGFsIGltbWVkaWF0ZWx5IChvciByZWRpcmVjdCB0byB0aGUgZXhwbG9yYXRpb25cbiAgICAgICAgICAgICAgICAgICAgLy8gZWRpdG9yIGlmIHRoZSBjcmVhdGUgbW9kYWwgZG9lcyBub3QgbmVlZCB0byBiZSBzaG93bikuXG4gICAgICAgICAgICAgICAgICAgIGlmIChVcmxTZXJ2aWNlLmdldFVybFBhcmFtcygpLm1vZGUgPT09ICdjcmVhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwuY2FuQ3JlYXRlQ29sbGVjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvbkNyZWF0aW9uU2VydmljZS5jcmVhdGVOZXdFeHBsb3JhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pbml0Q3JlYXRpb25Qcm9jZXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHNvY2lhbCBidXR0b25zIGRpc3BsYXllZCBpbiBmb290ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc29jaWFsQnV0dG9ucycsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvYnV0dG9uLWRpcmVjdGl2ZXMvc29jaWFsLWJ1dHRvbnMuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRTdGF0aWNJbWFnZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsO1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgQWxlcnQgTWVzc2FnZXNcbiAqL1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdhbGVydE1lc3NhZ2UnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgZ2V0TWVzc2FnZTogJyZtZXNzYWdlT2JqZWN0JyxcbiAgICAgICAgICAgICAgICBnZXRNZXNzYWdlSW5kZXg6ICcmbWVzc2FnZUluZGV4J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cIm9wcGlhLWFsZXJ0LW1lc3NhZ2VcIj48L2Rpdj4nLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnQWxlcnRzU2VydmljZScsICd0b2FzdHInLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsIEFsZXJ0c1NlcnZpY2UsIHRvYXN0cikge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuQWxlcnRzU2VydmljZSA9IEFsZXJ0c1NlcnZpY2U7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS50b2FzdHIgPSB0b2FzdHI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlID0gc2NvcGUuZ2V0TWVzc2FnZSgpO1xuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdpbmZvJykge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS50b2FzdHIuaW5mbyhtZXNzYWdlLmNvbnRlbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVPdXQ6IG1lc3NhZ2UudGltZW91dCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uSGlkZGVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuQWxlcnRzU2VydmljZS5kZWxldGVNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudG9hc3RyLnN1Y2Nlc3MobWVzc2FnZS5jb250ZW50LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lT3V0OiBtZXNzYWdlLnRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkhpZGRlbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLkFsZXJ0c1NlcnZpY2UuZGVsZXRlTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHByb21vIGJhciB0aGF0IGFwcGVhcnMgYXQgdGhlIHRvcCBvZiB0aGVcbiAqIHNjcmVlbi4gVGhlIGJhciBpcyBjb25maWd1cmFibGUgd2l0aCBhIG1lc3NhZ2UgYW5kIHdoZXRoZXIgdGhlIHByb21vIGlzXG4gKiBkaXNtaXNzaWJsZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvUHJvbW9CYXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3Byb21vQmFyJywgW1xuICAgICckd2luZG93JywgJ1Byb21vQmFyU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCR3aW5kb3csIFByb21vQmFyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAgICAgICAgICAgICAncHJvbW8tYmFyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc1Byb21vRGlzbWlzc2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkd2luZG93Lmhhc093blByb3BlcnR5KCdzZXNzaW9uU3RvcmFnZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICEhYW5ndWxhci5mcm9tSnNvbigkd2luZG93LnNlc3Npb25TdG9yYWdlLnByb21vSXNEaXNtaXNzZWQpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2V0UHJvbW9EaXNtaXNzZWQgPSBmdW5jdGlvbiAocHJvbW9Jc0Rpc21pc3NlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkd2luZG93Lmhhc093blByb3BlcnR5KCdzZXNzaW9uU3RvcmFnZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5wcm9tb0lzRGlzbWlzc2VkID0gYW5ndWxhci50b0pzb24ocHJvbW9Jc0Rpc21pc3NlZCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIFByb21vQmFyU2VydmljZS5nZXRQcm9tb0JhckRhdGEoKS50aGVuKGZ1bmN0aW9uIChwcm9tb0Jhck9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wcm9tb0JhcklzRW5hYmxlZCA9IHByb21vQmFyT2JqZWN0LnByb21vQmFyRW5hYmxlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucHJvbW9CYXJNZXNzYWdlID0gcHJvbW9CYXJPYmplY3QucHJvbW9CYXJNZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyhiaGVubmluZyk6IFV0aWxpemUgY29va2llcyBmb3IgdHJhY2tpbmcgd2hlbiBhIHByb21vIGlzXG4gICAgICAgICAgICAgICAgICAgIC8vIGRpc21pc3NlZC4gQ29va2llcyBhbGxvdyBmb3IgYSBsb25nZXItbGl2ZWQgbWVtb3J5IG9mIHdoZXRoZXIgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHByb21vIGlzIGRpc21pc3NlZC5cbiAgICAgICAgICAgICAgICAgICAgY3RybC5wcm9tb0lzVmlzaWJsZSA9ICFpc1Byb21vRGlzbWlzc2VkKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZGlzbWlzc1Byb21vID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wcm9tb0lzVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0UHJvbW9EaXNtaXNzZWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBzaWRlIG5hdmlnYXRpb24gYmFyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NpZGVOYXZpZ2F0aW9uQmFyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvbmF2aWdhdGlvbi1iYXJzLycgK1xuICAgICAgICAgICAgICAgICdzaWRlLW5hdmlnYXRpb24tYmFyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyR0aW1lb3V0JywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jdXJyZW50VXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFN0YXRpY0ltYWdlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmw7XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgdG9wIG5hdmlnYXRpb24gYmFyLiBUaGlzIGV4Y2x1ZGVzIHRoZSBwYXJ0XG4gKiBvZiB0aGUgbmF2YmFyIHRoYXQgaXMgdXNlZCBmb3IgbG9jYWwgbmF2aWdhdGlvbiAoc3VjaCBhcyB0aGUgdmFyaW91cyB0YWJzIGluXG4gKiB0aGUgZWRpdG9yIHBhZ2VzKS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3NpZGViYXIvU2lkZWJhclN0YXR1c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0RlYm91bmNlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL05hdmlnYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TaXRlQW5hbHl0aWNzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXNlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvRGV2aWNlSW5mb1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgndG9wTmF2aWdhdGlvbkJhcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL25hdmlnYXRpb24tYmFycy8nICtcbiAgICAgICAgICAgICAgICAndG9wLW5hdmlnYXRpb24tYmFyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckaHR0cCcsICckd2luZG93JywgJyR0aW1lb3V0JywgJyR0cmFuc2xhdGUnLFxuICAgICAgICAgICAgICAgICdTaWRlYmFyU3RhdHVzU2VydmljZScsICdMQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMnLCAnVXNlclNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdTaXRlQW5hbHl0aWNzU2VydmljZScsICdOYXZpZ2F0aW9uU2VydmljZScsICdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0RlYm91bmNlclNlcnZpY2UnLCAnRGV2aWNlSW5mb1NlcnZpY2UnLCAnTE9HT1VUX1VSTCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsICR3aW5kb3csICR0aW1lb3V0LCAkdHJhbnNsYXRlLCBTaWRlYmFyU3RhdHVzU2VydmljZSwgTEFCRUxfRk9SX0NMRUFSSU5HX0ZPQ1VTLCBVc2VyU2VydmljZSwgU2l0ZUFuYWx5dGljc1NlcnZpY2UsIE5hdmlnYXRpb25TZXJ2aWNlLCBXaW5kb3dEaW1lbnNpb25zU2VydmljZSwgRGVib3VuY2VyU2VydmljZSwgRGV2aWNlSW5mb1NlcnZpY2UsIExPR09VVF9VUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzTW9kZXJhdG9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc0FkbWluID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1RvcGljTWFuYWdlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNTdXBlckFkbWluID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC51c2VySXNMb2dnZWRJbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcm5hbWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgVXNlclNlcnZpY2UuZ2V0VXNlckluZm9Bc3luYygpLnRoZW4oZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXNlckluZm8uZ2V0UHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRyYW5zbGF0ZS51c2UodXNlckluZm8uZ2V0UHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNNb2RlcmF0b3IgPSB1c2VySW5mby5pc01vZGVyYXRvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc0FkbWluID0gdXNlckluZm8uaXNBZG1pbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc1RvcGljTWFuYWdlciA9IHVzZXJJbmZvLmlzVG9waWNNYW5hZ2VyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzU3VwZXJBZG1pbiA9IHVzZXJJbmZvLmlzU3VwZXJBZG1pbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC51c2VySXNMb2dnZWRJbiA9IHVzZXJJbmZvLmlzTG9nZ2VkSW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcm5hbWUgPSB1c2VySW5mby5nZXRVc2VybmFtZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwudXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnByb2ZpbGVQYWdlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoJy9wcm9maWxlLzx1c2VybmFtZT4nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBjdHJsLnVzZXJuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC51c2VySXNMb2dnZWRJbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNob3cgdGhlIG51bWJlciBvZiB1bnNlZW4gbm90aWZpY2F0aW9ucyBpbiB0aGUgbmF2YmFyIGFuZCBwYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGl0bGUsIHVubGVzcyB0aGUgdXNlciBpcyBhbHJlYWR5IG9uIHRoZSBkYXNoYm9hcmQgcGFnZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaHR0cC5nZXQoJy9ub3RpZmljYXRpb25zaGFuZGxlcicpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgIT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5udW1VbnNlZW5Ob3RpZmljYXRpb25zID0gZGF0YS5udW1fdW5zZWVuX25vdGlmaWNhdGlvbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5udW1VbnNlZW5Ob3RpZmljYXRpb25zID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cuZG9jdW1lbnQudGl0bGUgPSAoJygnICsgY3RybC5udW1VbnNlZW5Ob3RpZmljYXRpb25zICsgJykgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cuZG9jdW1lbnQudGl0bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRQcm9maWxlSW1hZ2VEYXRhVXJsQXN5bmMoKS50aGVuKGZ1bmN0aW9uIChkYXRhVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnByb2ZpbGVQaWN0dXJlRGF0YVVybCA9IGRhdGFVcmw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgTkFWX01PREVfU0lHTlVQID0gJ3NpZ251cCc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBOQVZfTU9ERVNfV0lUSF9DVVNUT01fTE9DQUxfTkFWID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2NyZWF0ZScsICdleHBsb3JlJywgJ2NvbGxlY3Rpb24nLCAnY29sbGVjdGlvbl9lZGl0b3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3RvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZCcsICd0b3BpY19lZGl0b3InLCAnc2tpbGxfZWRpdG9yJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzdG9yeV9lZGl0b3InXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY3VycmVudFVybCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnLycpWzFdO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkxBQkVMX0ZPUl9DTEVBUklOR19GT0NVUyA9IExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRTdGF0aWNJbWFnZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmxvZ291dFVybCA9IExPR09VVF9VUkw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXNlck1lbnVJc1Nob3duID0gKGN0cmwuY3VycmVudFVybCAhPT0gTkFWX01PREVfU0lHTlVQKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zdGFuZGFyZE5hdklzU2hvd24gPSAoTkFWX01PREVTX1dJVEhfQ1VTVE9NX0xPQ0FMX05BVi5pbmRleE9mKGN0cmwuY3VycmVudFVybCkgPT09IC0xKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbkxvZ2luQnV0dG9uQ2xpY2tlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNpdGVBbmFseXRpY3NTZXJ2aWNlLnJlZ2lzdGVyU3RhcnRMb2dpbkV2ZW50KCdsb2dpbkJ1dHRvbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgVXNlclNlcnZpY2UuZ2V0TG9naW5VcmxBc3luYygpLnRoZW4oZnVuY3Rpb24gKGxvZ2luVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvZ2luVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24gPSBsb2dpblVybDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdMb2dpbiB1cmwgbm90IGZvdW5kLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdvb2dsZVNpZ25Jbkljb25VcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9nb29nbGVfc2lnbmluX2J1dHRvbnMvZ29vZ2xlX3NpZ25pbi5zdmcnKSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwub25Mb2dvdXRCdXR0b25DbGlja2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnbGFzdF91cGxvYWRlZF9hdWRpb19sYW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuQUNUSU9OX09QRU4gPSBOYXZpZ2F0aW9uU2VydmljZS5BQ1RJT05fT1BFTjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5BQ1RJT05fQ0xPU0UgPSBOYXZpZ2F0aW9uU2VydmljZS5BQ1RJT05fQ0xPU0U7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuS0VZQk9BUkRfRVZFTlRfVE9fS0VZX0NPREVTID1cbiAgICAgICAgICAgICAgICAgICAgICAgIE5hdmlnYXRpb25TZXJ2aWNlLktFWUJPQVJEX0VWRU5UX1RPX0tFWV9DT0RFUztcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE9wZW5zIHRoZSBzdWJtZW51LlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZ0XG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZW51TmFtZSAtIG5hbWUgb2YgbWVudSwgb24gd2hpY2hcbiAgICAgICAgICAgICAgICAgICAgICogb3Blbi9jbG9zZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIChhYm91dE1lbnUscHJvZmlsZU1lbnUpLlxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgY3RybC5vcGVuU3VibWVudSA9IGZ1bmN0aW9uIChldnQsIG1lbnVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb2N1cyBvbiB0aGUgY3VycmVudCB0YXJnZXQgYmVmb3JlIG9wZW5pbmcgaXRzIHN1Ym1lbnUuXG4gICAgICAgICAgICAgICAgICAgICAgICBOYXZpZ2F0aW9uU2VydmljZS5vcGVuU3VibWVudShldnQsIG1lbnVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5ibHVyTmF2aWdhdGlvbkxpbmtzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyByZXF1aXJlZCBiZWNhdXNlIGlmIGFib3V0IHN1Ym1lbnUgaXMgaW4gb3BlbiBzdGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW5kIHdoZW4geW91IGhvdmVyIG9uIGxpYnJhcnksIGJvdGggd2lsbCBiZSBoaWdobGlnaHRlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIGF2b2lkIHRoYXQsIGJsdXIgYWxsIHRoZSBhJ3MgaW4gbmF2LCBzbyB0aGF0IG9ubHkgb25lXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aWxsIGJlIGhpZ2hsaWdodGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnbmF2IGEnKS5ibHVyKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2xvc2VTdWJtZW51ID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgTmF2aWdhdGlvblNlcnZpY2UuY2xvc2VTdWJtZW51KGV2dCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2xvc2VTdWJtZW51SWZOb3RNb2JpbGUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGV2aWNlSW5mb1NlcnZpY2UuaXNNb2JpbGVEZXZpY2UoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY2xvc2VTdWJtZW51KGV2dCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBIYW5kbGVzIGtleWRvd24gZXZlbnRzIG9uIG1lbnVzLlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZ0XG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZW51TmFtZSAtIG5hbWUgb2YgbWVudSB0byBwZXJmb3JtIGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgKiBvbihhYm91dE1lbnUvcHJvZmlsZU1lbnUpXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudHNUb2JlSGFuZGxlZCAtIE1hcCBrZXlib2FyZCBldmVudHMoJ0VudGVyJykgdG9cbiAgICAgICAgICAgICAgICAgICAgICogY29ycmVzcG9uZGluZyBhY3Rpb25zIHRvIGJlIHBlcmZvcm1lZChvcGVuL2Nsb3NlKS5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAgICAgICAgICogIG9uTWVudUtleXByZXNzKCRldmVudCwgJ2Fib3V0TWVudScsIHtlbnRlcjogJ29wZW4nfSlcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGN0cmwub25NZW51S2V5cHJlc3MgPSBmdW5jdGlvbiAoZXZ0LCBtZW51TmFtZSwgZXZlbnRzVG9iZUhhbmRsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE5hdmlnYXRpb25TZXJ2aWNlLm9uTWVudUtleXByZXNzKGV2dCwgbWVudU5hbWUsIGV2ZW50c1RvYmVIYW5kbGVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuYWN0aXZlTWVudU5hbWUgPSBOYXZpZ2F0aW9uU2VydmljZS5hY3RpdmVNZW51TmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2xvc2UgdGhlIHN1Ym1lbnUgaWYgZm9jdXMgb3IgY2xpY2sgb2NjdXJzIGFueXdoZXJlIG91dHNpZGUgb2ZcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIG1lbnUgb3Igb3V0c2lkZSBvZiBpdHMgcGFyZW50ICh3aGljaCBvcGVucyBzdWJtZW51IG9uIGhvdmVyKS5cbiAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuZWxlbWVudChldnQudGFyZ2V0KS5jbG9zZXN0KCdsaScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuYWN0aXZlTWVudU5hbWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLndpbmRvd0lzTmFycm93ID0gV2luZG93RGltZW5zaW9uc1NlcnZpY2UuaXNXaW5kb3dOYXJyb3coKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRXaW5kb3dXaWR0aCA9IFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubmF2RWxlbWVudHNWaXNpYmlsaXR5U3RhdHVzID0ge307XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBvcmRlciBvZiB0aGUgZWxlbWVudHMgaW4gdGhpcyBhcnJheSBzcGVjaWZpZXMgdGhlIG9yZGVyIGluXG4gICAgICAgICAgICAgICAgICAgIC8vIHdoaWNoIHRoZXkgd2lsbCBiZSBoaWRkZW4uIEVhcmxpZXIgZWxlbWVudHMgd2lsbCBiZSBoaWRkZW4gZmlyc3QuXG4gICAgICAgICAgICAgICAgICAgIHZhciBOQVZfRUxFTUVOVFNfT1JERVIgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnSTE4Tl9UT1BOQVZfRE9OQVRFJywgJ0kxOE5fVE9QTkFWX0FCT1VUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdJMThOX0NSRUFURV9FWFBMT1JBVElPTl9DUkVBVEUnLCAnSTE4Tl9UT1BOQVZfTElCUkFSWSdcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBOQVZfRUxFTUVOVFNfT1JERVIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubmF2RWxlbWVudHNWaXNpYmlsaXR5U3RhdHVzW05BVl9FTEVNRU5UU19PUkRFUltpXV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnJlZ2lzdGVyT25SZXNpemVIb29rKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwud2luZG93SXNOYXJyb3cgPSBXaW5kb3dEaW1lbnNpb25zU2VydmljZS5pc1dpbmRvd05hcnJvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2luZG93IGlzIHJlc2l6ZWQgbGFyZ2VyLCB0cnkgZGlzcGxheWluZyB0aGUgaGlkZGVuIGVsZW1lbnRzLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRXaW5kb3dXaWR0aCA8IFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE5BVl9FTEVNRU5UU19PUkRFUi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwubmF2RWxlbWVudHNWaXNpYmlsaXR5U3RhdHVzW05BVl9FTEVNRU5UU19PUkRFUltpXV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubmF2RWxlbWVudHNWaXNpYmlsaXR5U3RhdHVzW05BVl9FTEVNRU5UU19PUkRFUltpXV0gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDbG9zZSB0aGUgc2lkZWJhciwgaWYgbmVjZXNzYXJ5LlxuICAgICAgICAgICAgICAgICAgICAgICAgU2lkZWJhclN0YXR1c1NlcnZpY2UuY2xvc2VTaWRlYmFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNpZGViYXJJc1Nob3duID0gU2lkZWJhclN0YXR1c1NlcnZpY2UuaXNTaWRlYmFyU2hvd24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRXaW5kb3dXaWR0aCA9IFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnVuY2F0ZU5hdmJhckRlYm91bmNlZCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1NpZGViYXJTaG93biA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChTaWRlYmFyU3RhdHVzU2VydmljZS5pc1NpZGViYXJTaG93bigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmJvZHkpLmFkZENsYXNzKCdvcHBpYS1zdG9wLXNjcm9sbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmJvZHkpLnJlbW92ZUNsYXNzKCdvcHBpYS1zdG9wLXNjcm9sbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFNpZGViYXJTdGF0dXNTZXJ2aWNlLmlzU2lkZWJhclNob3duKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudG9nZ2xlU2lkZWJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNpZGViYXJTdGF0dXNTZXJ2aWNlLnRvZ2dsZVNpZGViYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIENoZWNrcyBpZiBpMThuIGhhcyBiZWVuIHJ1bi5cbiAgICAgICAgICAgICAgICAgICAgICogSWYgaTE4biBoYXMgbm90IHlldCBydW4sIHRoZSA8YT4gYW5kIDxzcGFuPiB0YWdzIHdpbGwgaGF2ZVxuICAgICAgICAgICAgICAgICAgICAgKiBubyB0ZXh0IGNvbnRlbnQsIHNvIHRoZWlyIGlubmVyVGV4dC5sZW5ndGggdmFsdWUgd2lsbCBiZSAwLlxuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGVja0lmSTE4TkNvbXBsZXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpMThuQ29tcGxldGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YWJzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm9wcGlhLW5hdmJhci10YWItY29udGVudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YWJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhYnNbaV0uaW5uZXJUZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpMThuQ29tcGxldGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpMThuQ29tcGxldGVkO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ2hlY2tzIGlmIHdpbmRvdyBpcyA+NzY4cHggYW5kIGkxOG4gaXMgY29tcGxldGVkLCB0aGVuIGNoZWNrc1xuICAgICAgICAgICAgICAgICAgICAgKiBmb3Igb3ZlcmZsb3cuIElmIG92ZXJmbG93IGlzIGRldGVjdGVkLCBoaWRlcyB0aGUgbGVhc3QgaW1wb3J0YW50XG4gICAgICAgICAgICAgICAgICAgICAqIHRhYiBhbmQgdGhlbiBjYWxscyBpdHNlbGYgYWdhaW4gYWZ0ZXIgYSA1MG1zIGRlbGF5LlxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRydW5jYXRlTmF2YmFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHdpbmRvdyBpcyBuYXJyb3csIHRoZSBzdGFuZGFyZCBuYXYgdGFicyBhcmUgbm90IHNob3duLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmlzV2luZG93TmFycm93KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBpMThuIGhhc24ndCBjb21wbGV0ZWQsIHJldHJ5IGFmdGVyIDEwMG1zLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja0lmSTE4TkNvbXBsZXRlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQodHJ1bmNhdGVOYXZiYXIsIDEwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHZhbHVlIG9mIDYwcHggdXNlZCBoZXJlIGNvbWVzIGZyb20gbWVhc3VyaW5nIHRoZSBub3JtYWxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhlaWdodCBvZiB0aGUgbmF2YmFyICg1NnB4KSBpbiBDaHJvbWUncyBpbnNwZWN0b3IgYW5kIHJvdW5kaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB1cC4gSWYgdGhlIGhlaWdodCBvZiB0aGUgbmF2YmFyIGlzIGNoYW5nZWQgaW4gdGhlIGZ1dHVyZSB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aWxsIG5lZWQgdG8gYmUgdXBkYXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXYuY29sbGFwc2UubmF2YmFyLWNvbGxhcHNlJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2xpZW50SGVpZ2h0ID4gNjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE5BVl9FTEVNRU5UU19PUkRFUi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5uYXZFbGVtZW50c1Zpc2liaWxpdHlTdGF0dXNbTkFWX0VMRU1FTlRTX09SREVSW2ldXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGlkZSBvbmUgZWxlbWVudCwgdGhlbiBjaGVjayBhZ2FpbiBhZnRlciA1MG1zLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBnaXZlcyB0aGUgYnJvd3NlciB0aW1lIHRvIHJlbmRlciB0aGUgdmlzaWJpbGl0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hhbmdlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5uYXZFbGVtZW50c1Zpc2liaWxpdHlTdGF0dXNbTkFWX0VMRU1FTlRTX09SREVSW2ldXSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSBhIGRpZ2VzdCBjeWNsZSB0byBoaWRlIGVsZW1lbnQgaW1tZWRpYXRlbHkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UgaXQgd291bGQgYmUgaGlkZGVuIGFmdGVyIHRoZSBuZXh0IGNhbGwuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGR1ZSB0byBzZXRUaW1lb3V0IHVzZSBpbiBkZWJvdW5jZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KHRydW5jYXRlTmF2YmFyLCA1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciB0cnVuY2F0ZU5hdmJhckRlYm91bmNlZCA9IERlYm91bmNlclNlcnZpY2UuZGVib3VuY2UodHJ1bmNhdGVOYXZiYXIsIDUwMCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBmdW5jdGlvbiBuZWVkcyB0byBiZSBydW4gYWZ0ZXIgaTE4bi4gQSB0aW1lb3V0IG9mIDAgYXBwZWFycyB0b1xuICAgICAgICAgICAgICAgICAgICAvLyBydW4gYWZ0ZXIgaTE4biBpbiBDaHJvbWUsIGJ1dCBub3Qgb3RoZXIgYnJvd3NlcnMuIFRoZSBmdW5jdGlvbiB3aWxsXG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGkxOG4gaXMgY29tcGxldGUgYW5kIHNldCBhIG5ldyB0aW1lb3V0IGlmIGl0IGlzIG5vdC4gU2luY2VcbiAgICAgICAgICAgICAgICAgICAgLy8gYSB0aW1lb3V0IG9mIDAgd29ya3MgZm9yIGF0IGxlYXN0IG9uZSBicm93c2VyLCBpdCBpcyB1c2VkIGhlcmUuXG4gICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KHRydW5jYXRlTmF2YmFyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignc2VhcmNoQmFyTG9hZGVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQodHJ1bmNhdGVOYXZiYXIsIDEwMCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kYWwgYW5kIGZ1bmN0aW9uYWxpdHkgZm9yIHRoZSBjcmVhdGUgY29sbGVjdGlvbiBidXR0b24uXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzJyk7XG4vLyBUT0RPKGJoZW5uaW5nKTogUmVmYWN0b3IgdGhpcyB0byBtYXRjaCB0aGUgZnJvbnRlbmQgZGVzaWduIHNwZWMgYW5kIHJlZHVjZVxuLy8gZHVwbGljYXRlZCBjb2RlIGJldHdlZW4gQ29sbGVjdGlvbkNyZWF0aW9uU2VydmljZSBhbmRcbi8vIEV4cGxvcmF0aW9uQ3JlYXRpb25TZXJ2aWNlLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQ29sbGVjdGlvbkNyZWF0aW9uU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHJvb3RTY29wZScsICckdGltZW91dCcsICckd2luZG93JywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICdTaXRlQW5hbHl0aWNzU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcm9vdFNjb3BlLCAkdGltZW91dCwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgU2l0ZUFuYWx5dGljc1NlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHZhciBDUkVBVEVfTkVXX0NPTExFQ1RJT05fVVJMX1RFTVBMQVRFID0gKCcvY29sbGVjdGlvbl9lZGl0b3IvY3JlYXRlLzxjb2xsZWN0aW9uX2lkPicpO1xuICAgICAgICB2YXIgY29sbGVjdGlvbkNyZWF0aW9uSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3JlYXRlTmV3Q29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChjb2xsZWN0aW9uQ3JlYXRpb25JblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbkNyZWF0aW9uSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5jbGVhcldhcm5pbmdzKCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdDcmVhdGluZyBjb2xsZWN0aW9uJztcbiAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KCcvY29sbGVjdGlvbl9lZGl0b3JfaGFuZGxlci9jcmVhdGVfbmV3Jywge30pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBTaXRlQW5hbHl0aWNzU2VydmljZS5yZWdpc3RlckNyZWF0ZU5ld0NvbGxlY3Rpb25FdmVudChyZXNwb25zZS5kYXRhLmNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24gPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChDUkVBVEVfTkVXX0NPTExFQ1RJT05fVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbl9pZDogcmVzcG9uc2UuZGF0YS5jb2xsZWN0aW9uSWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTApO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGdW5jdGlvbmFsaXR5IGZvciB0aGUgY3JlYXRlIGV4cGxvcmF0aW9uIGJ1dHRvbiBhbmQgdXBsb2FkXG4gKiBtb2RhbC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ3NyZlRva2VuU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU2l0ZUFuYWx5dGljc1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0V4cGxvcmF0aW9uQ3JlYXRpb25TZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcm9vdFNjb3BlJywgJyR0aW1lb3V0JywgJyR1aWJNb2RhbCcsICckd2luZG93JyxcbiAgICAnQWxlcnRzU2VydmljZScsICdDc3JmVG9rZW5TZXJ2aWNlJywgJ1NpdGVBbmFseXRpY3NTZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHJvb3RTY29wZSwgJHRpbWVvdXQsICR1aWJNb2RhbCwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgQ3NyZlRva2VuU2VydmljZSwgU2l0ZUFuYWx5dGljc1NlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHZhciBDUkVBVEVfTkVXX0VYUExPUkFUSU9OX1VSTF9URU1QTEFURSA9ICcvY3JlYXRlLzxleHBsb3JhdGlvbl9pZD4nO1xuICAgICAgICB2YXIgZXhwbG9yYXRpb25DcmVhdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNyZWF0ZU5ld0V4cGxvcmF0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4cGxvcmF0aW9uQ3JlYXRpb25JblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXhwbG9yYXRpb25DcmVhdGlvbkluUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJXYXJuaW5ncygpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnQ3JlYXRpbmcgZXhwbG9yYXRpb24nO1xuICAgICAgICAgICAgICAgICRodHRwLnBvc3QoJy9jb250cmlidXRlaGFuZGxlci9jcmVhdGVfbmV3Jywge30pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIFNpdGVBbmFseXRpY3NTZXJ2aWNlLnJlZ2lzdGVyQ3JlYXRlTmV3RXhwbG9yYXRpb25FdmVudChyZXNwb25zZS5kYXRhLmV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoQ1JFQVRFX05FV19FWFBMT1JBVElPTl9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogcmVzcG9uc2UuZGF0YS5leHBsb3JhdGlvbklkXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTUwKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbkNyZWF0aW9uSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNob3dVcGxvYWRFeHBsb3JhdGlvbk1vZGFsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5jbGVhcldhcm5pbmdzKCk7XG4gICAgICAgICAgICAgICAgJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY3JlYXRvci1kYXNoYm9hcmQtcGFnZS9tb2RhbC10ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAndXBsb2FkLWFjdGl2aXR5LW1vZGFsLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLCBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zYXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmV0dXJuT2JqID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeWFtbEZpbGU6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3RmlsZUlucHV0JykuZmlsZXNbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmlsZSB8fCAhZmlsZS5zaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0VtcHR5IGZpbGUgZGV0ZWN0ZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuT2JqLnlhbWxGaWxlID0gZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UocmV0dXJuT2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSkucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgeWFtbEZpbGUgPSByZXN1bHQueWFtbEZpbGU7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnQ3JlYXRpbmcgZXhwbG9yYXRpb24nO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICBmb3JtLmFwcGVuZCgneWFtbF9maWxlJywgeWFtbEZpbGUpO1xuICAgICAgICAgICAgICAgICAgICBmb3JtLmFwcGVuZCgncGF5bG9hZCcsIEpTT04uc3RyaW5naWZ5KHt9KSk7XG4gICAgICAgICAgICAgICAgICAgIENzcmZUb2tlblNlcnZpY2UuZ2V0VG9rZW5Bc3luYygpLnRoZW4oZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLmFwcGVuZCgnY3NyZl90b2tlbicsIHRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUZpbHRlcjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBYU1NJIHByZWZpeC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YS5zdWJzdHJpbmcoNSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJ2NvbnRyaWJ1dGVoYW5kbGVyL3VwbG9hZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmRvbmUoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoQ1JFQVRFX05FV19FWFBMT1JBVElPTl9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGRhdGEuZXhwbG9yYXRpb25JZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1lZERhdGEgPSBkYXRhLnJlc3BvbnNlVGV4dC5zdWJzdHJpbmcoNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnNlZFJlc3BvbnNlID0gSlNPTi5wYXJzZSh0cmFuc2Zvcm1lZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZyhwYXJzZWRSZXNwb25zZS5lcnJvciB8fCAnRXJyb3IgY29tbXVuaWNhdGluZyB3aXRoIHNlcnZlci4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlcyBmb3IgdGhlIG9iamVjdCBlZGl0b3JzLlxuICovXG4vLyBJbmRpdmlkdWFsIG9iamVjdCBlZGl0b3IgZGlyZWN0aXZlcyBhcmUgaW4gZXh0ZW5zaW9ucy9vYmplY3RzL3RlbXBsYXRlcy5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb2JqZWN0RWRpdG9yJywgW1xuICAgICckY29tcGlsZScsICckbG9nJywgZnVuY3Rpb24gKCRjb21waWxlLCAkbG9nKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGFsd2F5c0VkaXRhYmxlOiAnQCcsXG4gICAgICAgICAgICAgICAgaW5pdEFyZ3M6ICc9JyxcbiAgICAgICAgICAgICAgICBpc0VkaXRhYmxlOiAnQCcsXG4gICAgICAgICAgICAgICAgb2JqVHlwZTogJ0AnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAvLyBDb252ZXJ0cyBhIGNhbWVsLWNhc2VkIHN0cmluZyB0byBhIGxvd2VyLWNhc2UgaHlwaGVuLXNlcGFyYXRlZFxuICAgICAgICAgICAgICAgIC8vIHN0cmluZy5cbiAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aXZlTmFtZSA9IHNjb3BlLm9ialR5cGUucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBzY29wZS5nZXRJbml0QXJncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlLmluaXRBcmdzO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgc2NvcGUuZ2V0QWx3YXlzRWRpdGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5hbHdheXNFZGl0YWJsZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNjb3BlLmdldElzRWRpdGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5pc0VkaXRhYmxlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKGRpcmVjdGl2ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5odG1sKCc8JyArIGRpcmVjdGl2ZU5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJy1lZGl0b3IgZ2V0LWFsd2F5cy1lZGl0YWJsZT1cImdldEFsd2F5c0VkaXRhYmxlKClcIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJyBnZXQtaW5pdC1hcmdzPVwiZ2V0SW5pdEFyZ3MoKVwiIGdldC1pcy1lZGl0YWJsZT1cImdldElzRWRpdGFibGUoKVwiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnIG9iai10eXBlPVwib2JqVHlwZVwiIHZhbHVlPVwidmFsdWVcIj48LycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aXZlTmFtZSArICctZWRpdG9yPicpO1xuICAgICAgICAgICAgICAgICAgICAkY29tcGlsZShlbGVtZW50LmNvbnRlbnRzKCkpKHNjb3BlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoJ0Vycm9yIGluIG9iamVjdEVkaXRvcjogbm8gZWRpdG9yIHR5cGUgc3VwcGxpZWQuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRSdcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRm9jdXNPbiBEaXJlY3RpdmUgKG5vdCBhc3NvY2lhdGVkIHdpdGggcmV1c2FibGVcbiAqIGNvbXBvbmVudHMuKVxuICogTkI6IFJldXNhYmxlIGNvbXBvbmVudCBkaXJlY3RpdmVzIHNob3VsZCBnbyBpbiB0aGUgY29tcG9uZW50cy8gZm9sZGVyLlxuICovXG4vLyBXaGVuIHNldCBhcyBhbiBhdHRyIG9mIGFuIDxpbnB1dD4gZWxlbWVudCwgbW92ZXMgZm9jdXMgdG8gdGhhdCBlbGVtZW50XG4vLyB3aGVuIGEgJ2ZvY3VzT24nIGV2ZW50IGlzIGJyb2FkY2FzdC5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnZm9jdXNPbicsIFtcbiAgICAnTEFCRUxfRk9SX0NMRUFSSU5HX0ZPQ1VTJywgZnVuY3Rpb24gKExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHNjb3BlLCBlbHQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS4kb24oJ2ZvY3VzT24nLCBmdW5jdGlvbiAoZSwgbmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSBhdHRycy5mb2N1c09uKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsdFswXS5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcHVycG9zZSBvZiB0aGUgZm9jdXMgc3dpdGNoIHdhcyB0byBjbGVhciBmb2N1cywgYmx1ciB0aGVcbiAgICAgICAgICAgICAgICAvLyBlbGVtZW50LlxuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSBMQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMpIHtcbiAgICAgICAgICAgICAgICAgICAgZWx0WzBdLmJsdXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgbWFpbnRhaW5pbmcgdGhlIG9wZW4vY2xvc2VkIHN0YXR1cyBvZiB0aGVcbiAqIGhhbWJ1cmdlci1tZW51IHNpZGViYXIuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1NpZGViYXJTdGF0dXNTZXJ2aWNlJywgW1xuICAgICdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsIGZ1bmN0aW9uIChXaW5kb3dEaW1lbnNpb25zU2VydmljZSkge1xuICAgICAgICB2YXIgcGVuZGluZ1NpZGViYXJDbGljayA9IGZhbHNlO1xuICAgICAgICB2YXIgc2lkZWJhcklzU2hvd24gPSBmYWxzZTtcbiAgICAgICAgdmFyIF9vcGVuU2lkZWJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChXaW5kb3dEaW1lbnNpb25zU2VydmljZS5pc1dpbmRvd05hcnJvdygpICYmICFzaWRlYmFySXNTaG93bikge1xuICAgICAgICAgICAgICAgIHNpZGViYXJJc1Nob3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwZW5kaW5nU2lkZWJhckNsaWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9jbG9zZVNpZGViYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoc2lkZWJhcklzU2hvd24pIHtcbiAgICAgICAgICAgICAgICBzaWRlYmFySXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHBlbmRpbmdTaWRlYmFyQ2xpY2sgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzU2lkZWJhclNob3duOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpZGViYXJJc1Nob3duO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9wZW5TaWRlYmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX29wZW5TaWRlYmFyKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2xvc2VTaWRlYmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX2Nsb3NlU2lkZWJhcigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvZ2dsZVNpZGViYXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNpZGViYXJJc1Nob3duKSB7XG4gICAgICAgICAgICAgICAgICAgIF9vcGVuU2lkZWJhcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX2Nsb3NlU2lkZWJhcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkRvY3VtZW50Q2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdTaWRlYmFyQ2xpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc2lkZWJhcklzU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdTaWRlYmFyQ2xpY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBpbnN0YW5jZXMgb2YgZnJvbnRlbmQgdXNlciBVc2VySW5mb1xuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBVc2VySW5mbyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBVc2VySW5mbyhpc01vZGVyYXRvciwgaXNBZG1pbiwgaXNTdXBlckFkbWluLCBpc1RvcGljTWFuYWdlciwgY2FuQ3JlYXRlQ29sbGVjdGlvbnMsIHByZWZlcnJlZFNpdGVMYW5ndWFnZUNvZGUsIHVzZXJuYW1lLCBlbWFpbCwgaXNMb2dnZWRJbikge1xuICAgICAgICB0aGlzLl9pc01vZGVyYXRvciA9IGlzTW9kZXJhdG9yO1xuICAgICAgICB0aGlzLl9pc0FkbWluID0gaXNBZG1pbjtcbiAgICAgICAgdGhpcy5faXNUb3BpY01hbmFnZXIgPSBpc1RvcGljTWFuYWdlcjtcbiAgICAgICAgdGhpcy5faXNTdXBlckFkbWluID0gaXNTdXBlckFkbWluO1xuICAgICAgICB0aGlzLl9jYW5DcmVhdGVDb2xsZWN0aW9ucyA9IGNhbkNyZWF0ZUNvbGxlY3Rpb25zO1xuICAgICAgICB0aGlzLl9wcmVmZXJyZWRTaXRlTGFuZ3VhZ2VDb2RlID0gcHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZTtcbiAgICAgICAgdGhpcy5fdXNlcm5hbWUgPSB1c2VybmFtZTtcbiAgICAgICAgdGhpcy5fZW1haWwgPSBlbWFpbDtcbiAgICAgICAgdGhpcy5faXNMb2dnZWRJbiA9IGlzTG9nZ2VkSW47XG4gICAgfVxuICAgIFVzZXJJbmZvLnByb3RvdHlwZS5pc01vZGVyYXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzTW9kZXJhdG9yO1xuICAgIH07XG4gICAgVXNlckluZm8ucHJvdG90eXBlLmlzQWRtaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0FkbWluO1xuICAgIH07XG4gICAgVXNlckluZm8ucHJvdG90eXBlLmlzVG9waWNNYW5hZ2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNUb3BpY01hbmFnZXI7XG4gICAgfTtcbiAgICBVc2VySW5mby5wcm90b3R5cGUuaXNTdXBlckFkbWluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNTdXBlckFkbWluO1xuICAgIH07XG4gICAgVXNlckluZm8ucHJvdG90eXBlLmNhbkNyZWF0ZUNvbGxlY3Rpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2FuQ3JlYXRlQ29sbGVjdGlvbnM7XG4gICAgfTtcbiAgICBVc2VySW5mby5wcm90b3R5cGUuZ2V0UHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ByZWZlcnJlZFNpdGVMYW5ndWFnZUNvZGU7XG4gICAgfTtcbiAgICBVc2VySW5mby5wcm90b3R5cGUuZ2V0VXNlcm5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl91c2VybmFtZTtcbiAgICB9O1xuICAgIFVzZXJJbmZvLnByb3RvdHlwZS5nZXRFbWFpbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VtYWlsO1xuICAgIH07XG4gICAgVXNlckluZm8ucHJvdG90eXBlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0xvZ2dlZEluO1xuICAgIH07XG4gICAgcmV0dXJuIFVzZXJJbmZvO1xufSgpKTtcbmV4cG9ydHMuVXNlckluZm8gPSBVc2VySW5mbztcbnZhciBVc2VySW5mb09iamVjdEZhY3RvcnkgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXNlckluZm9PYmplY3RGYWN0b3J5KCkge1xuICAgIH1cbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdkYXRhJyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkIGtleXMgd2hpY2ggZ2l2ZSB0c2xpbnRcbiAgICAvLyBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy5cbiAgICBVc2VySW5mb09iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUZyb21CYWNrZW5kRGljdCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHJldHVybiBuZXcgVXNlckluZm8oZGF0YS5pc19tb2RlcmF0b3IsIGRhdGEuaXNfYWRtaW4sIGRhdGEuaXNfc3VwZXJfYWRtaW4sIGRhdGEuaXNfdG9waWNfbWFuYWdlciwgZGF0YS5jYW5fY3JlYXRlX2NvbGxlY3Rpb25zLCBkYXRhLnByZWZlcnJlZF9zaXRlX2xhbmd1YWdlX2NvZGUsIGRhdGEudXNlcm5hbWUsIGRhdGEuZW1haWwsIGRhdGEudXNlcl9pc19sb2dnZWRfaW4pO1xuICAgIH07XG4gICAgVXNlckluZm9PYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVEZWZhdWx0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVzZXJJbmZvKGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgbnVsbCwgbnVsbCwgbnVsbCwgZmFsc2UpO1xuICAgIH07XG4gICAgVXNlckluZm9PYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIFVzZXJJbmZvT2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIFVzZXJJbmZvT2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLlVzZXJJbmZvT2JqZWN0RmFjdG9yeSA9IFVzZXJJbmZvT2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1VzZXJJbmZvT2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoVXNlckluZm9PYmplY3RGYWN0b3J5KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFV0aWxpdHkgc2VydmljZSBmb3IgY2hlY2tpbmcgd2ViIGJyb3dzZXIgdHlwZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQnJvd3NlckNoZWNrZXJTZXJ2aWNlJywgW1xuICAgICdBVVRPR0VORVJBVEVEX0FVRElPX0xBTkdVQUdFUycsXG4gICAgZnVuY3Rpb24gKEFVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTKSB7XG4gICAgICAgIC8vIEZvciBkZXRhaWxzIG9uIHRoZSByZWxpYWJpbGl0eSBvZiB0aGlzIGNoZWNrLCBzZWVcbiAgICAgICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTg0NzU4MC9cbiAgICAgICAgLy8gaG93LXRvLWRldGVjdC1zYWZhcmktY2hyb21lLWllLWZpcmVmb3gtYW5kLW9wZXJhLWJyb3dzZXIjYW5zd2VyLTk4NTE3NjlcbiAgICAgICAgdmFyIGlzU2FmYXJpID0gL2NvbnN0cnVjdG9yL2kudGVzdCh3aW5kb3cuSFRNTEVsZW1lbnQpIHx8IChmdW5jdGlvbiAocCkge1xuICAgICAgICAgICAgcmV0dXJuIHAudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgU2FmYXJpUmVtb3RlTm90aWZpY2F0aW9uXSc7XG4gICAgICAgIH0pKCF3aW5kb3cuc2FmYXJpIHx8XG4gICAgICAgICAgICAodHlwZW9mIHdpbmRvdy5zYWZhcmkgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5zYWZhcmkucHVzaE5vdGlmaWNhdGlvbikpO1xuICAgICAgICB2YXIgX3N1cHBvcnRzU3BlZWNoU3ludGhlc2lzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHN1cHBvcnRMYW5nID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAod2luZG93Lmhhc093blByb3BlcnR5KCdzcGVlY2hTeW50aGVzaXMnKSkge1xuICAgICAgICAgICAgICAgIHNwZWVjaFN5bnRoZXNpcy5nZXRWb2ljZXMoKS5mb3JFYWNoKGZ1bmN0aW9uICh2b2ljZSkge1xuICAgICAgICAgICAgICAgICAgICBBVVRPR0VORVJBVEVEX0FVRElPX0xBTkdVQUdFUy5mb3JFYWNoKGZ1bmN0aW9uIChhdWRpb0xhbmd1YWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodm9pY2UubGFuZyA9PT0gYXVkaW9MYW5ndWFnZS5zcGVlY2hfc3ludGhlc2lzX2NvZGUgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoX2lzTW9iaWxlRGV2aWNlKCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm9pY2UubGFuZyA9PT0gYXVkaW9MYW5ndWFnZS5zcGVlY2hfc3ludGhlc2lzX2NvZGVfbW9iaWxlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1cHBvcnRMYW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3VwcG9ydExhbmc7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfaXNNb2JpbGVEZXZpY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCBuYXZpZ2F0b3IudmVuZG9yIHx8IHdpbmRvdy5vcGVyYTtcbiAgICAgICAgICAgIHJldHVybiB1c2VyQWdlbnQubWF0Y2goL2lQaG9uZS9pKSB8fCB1c2VyQWdlbnQubWF0Y2goL0FuZHJvaWQvaSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdXBwb3J0c1NwZWVjaFN5bnRoZXNpczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3VwcG9ydHNTcGVlY2hTeW50aGVzaXMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc01vYmlsZURldmljZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfaXNNb2JpbGVEZXZpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBjb25zdHJ1Y3QgVVJMcyBieSBpbnNlcnRpbmcgdmFyaWFibGVzIHdpdGhpbiB0aGVtIGFzXG4gKiBuZWNlc3NhcnkgdG8gaGF2ZSBhIGZ1bGx5LXF1YWxpZmllZCBVUkwuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXRpbHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdhcHAuY29uc3RhbnRzLmFqcy50cycpO1xudmFyIGhhc2hlcyA9IHJlcXVpcmUoJ2hhc2hlcy5qc29uJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIFtcbiAgICAnQWxlcnRzU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ1V0aWxzU2VydmljZScsICdERVZfTU9ERScsXG4gICAgZnVuY3Rpb24gKEFsZXJ0c1NlcnZpY2UsIFVybFNlcnZpY2UsIFV0aWxzU2VydmljZSwgREVWX01PREUpIHtcbiAgICAgICAgdmFyIHZhbGlkYXRlUmVzb3VyY2VQYXRoID0gZnVuY3Rpb24gKHJlc291cmNlUGF0aCkge1xuICAgICAgICAgICAgaWYgKCFyZXNvdXJjZVBhdGgpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnRW1wdHkgcGF0aCBwYXNzZWQgaW4gbWV0aG9kLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIFJFU09VUkNFX1BBVEhfU1RBUlRTX1dJVEhfRk9SV0FSRF9TTEFTSCA9IC9eXFwvLztcbiAgICAgICAgICAgIC8vIEVuc3VyZSB0aGF0IHJlc291cmNlUGF0aCBzdGFydHMgd2l0aCBhIGZvcndhcmQgc2xhc2guXG4gICAgICAgICAgICBpZiAoIXJlc291cmNlUGF0aC5tYXRjaChSRVNPVVJDRV9QQVRIX1NUQVJUU19XSVRIX0ZPUldBUkRfU0xBU0gpKSB7XG4gICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5mYXRhbFdhcm5pbmcoJ1BhdGggbXVzdCBzdGFydCB3aXRoIFxcJ1xcL1xcJzogXFwnJyArIHJlc291cmNlUGF0aCArICdcXCcuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHaXZlbiBhIHJlc291cmNlIHBhdGggcmVsYXRpdmUgdG8gc3ViZm9sZGVyIGluIC8sXG4gICAgICAgICAqIHJldHVybnMgcmVzb3VyY2UgcGF0aCB3aXRoIGNhY2hlIHNsdWcuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgZ2V0VXJsV2l0aFNsdWcgPSBmdW5jdGlvbiAocmVzb3VyY2VQYXRoKSB7XG4gICAgICAgICAgICBpZiAoIURFVl9NT0RFKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhhc2hlc1tyZXNvdXJjZVBhdGhdKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHJlc291cmNlUGF0aC5sYXN0SW5kZXhPZignLicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHJlc291cmNlUGF0aC5zbGljZSgwLCBpbmRleCkgKyAnLicgKyBoYXNoZXNbcmVzb3VyY2VQYXRoXSArXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZVBhdGguc2xpY2UoaW5kZXgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzb3VyY2VQYXRoO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2l2ZW4gYSByZXNvdXJjZSBwYXRoIHJlbGF0aXZlIHRvIHN1YmZvbGRlciBpbiAvLFxuICAgICAgICAgKiByZXR1cm5zIGNvbXBsZXRlIHJlc291cmNlIHBhdGggd2l0aCBjYWNoZSBzbHVnIGFuZCBwcmVmaXhlZCB3aXRoIHVybFxuICAgICAgICAgKiBkZXBlbmRpbmcgb24gZGV2L3Byb2QgbW9kZS5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBnZXRDb21wbGV0ZVVybCA9IGZ1bmN0aW9uIChwcmVmaXgsIHBhdGgpIHtcbiAgICAgICAgICAgIGlmIChERVZfTU9ERSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyBnZXRVcmxXaXRoU2x1ZyhwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnL2J1aWxkJyArIHByZWZpeCArIGdldFVybFdpdGhTbHVnKHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2l2ZW4gYSByZXNvdXJjZSBwYXRoIHJlbGF0aXZlIHRvIGV4dGVuc2lvbnMgZm9sZGVyLFxuICAgICAgICAgKiByZXR1cm5zIHRoZSBjb21wbGV0ZSB1cmwgcGF0aCB0byB0aGF0IHJlc291cmNlLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIGdldEV4dGVuc2lvblJlc291cmNlVXJsID0gZnVuY3Rpb24gKHJlc291cmNlUGF0aCkge1xuICAgICAgICAgICAgdmFsaWRhdGVSZXNvdXJjZVBhdGgocmVzb3VyY2VQYXRoKTtcbiAgICAgICAgICAgIHJldHVybiBnZXRDb21wbGV0ZVVybCgnL2V4dGVuc2lvbnMnLCByZXNvdXJjZVBhdGgpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHaXZlbiBhIGZvcm1hdHRlZCBVUkwsIGludGVycG9sYXRlcyB0aGUgVVJMIGJ5IGluc2VydGluZyB2YWx1ZXMgdGhlIFVSTFxuICAgICAgICAgICAgICogbmVlZHMgdXNpbmcgdGhlIGludGVycG9sYXRpb25WYWx1ZXMgb2JqZWN0LiBGb3IgZXhhbXBsZSwgdXJsVGVtcGxhdGVcbiAgICAgICAgICAgICAqIG1pZ2h0IGJlOlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgL2NyZWF0ZWhhbmRsZXIvcmVzb2x2ZWRfYW5zd2Vycy88ZXhwbG9yYXRpb25faWQ+Lzxlc2NhcGVkX3N0YXRlX25hbWU+XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogaW50ZXJwb2xhdGlvblZhbHVlcyBpcyBhbiBvYmplY3Qgd2hvc2Uga2V5cyBhcmUgdmFyaWFibGVzIHdpdGhpbiB0aGVcbiAgICAgICAgICAgICAqIFVSTC4gRm9yIHRoZSBhYm92ZSBleGFtcGxlLCBpbnRlcnBvbGF0aW9uVmFsdWVzIG1heSBsb29rIHNvbWV0aGluZ1xuICAgICAgICAgICAgICogbGlrZTpcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiAgIHsgJ2V4cGxvcmF0aW9uX2lkJzogJzAnLCAnZXNjYXBlZF9zdGF0ZV9uYW1lJzogJ0lucHV0QmluYXJ5TnVtYmVyJyB9XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogSWYgYSBVUkwgcmVxdWlyZXMgYSB2YWx1ZSB3aGljaCBpcyBub3Qga2V5ZWQgd2l0aGluIHRoZVxuICAgICAgICAgICAgICogaW50ZXJwb2xhdGlvblZhbHVlcyBvYmplY3QsIHRoaXMgd2lsbCByZXR1cm4gbnVsbC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaW50ZXJwb2xhdGVVcmw6IGZ1bmN0aW9uICh1cmxUZW1wbGF0ZSwgaW50ZXJwb2xhdGlvblZhbHVlcykge1xuICAgICAgICAgICAgICAgIGlmICghdXJsVGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5mYXRhbFdhcm5pbmcoJ0ludmFsaWQgb3IgZW1wdHkgVVJMIHRlbXBsYXRlIHBhc3NlZCBpbjogXFwnJyArIHVybFRlbXBsYXRlICsgJ1xcJycpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy80Nzc1NzIyXG4gICAgICAgICAgICAgICAgaWYgKCEoaW50ZXJwb2xhdGlvblZhbHVlcyBpbnN0YW5jZW9mIE9iamVjdCkgfHwgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnRlcnBvbGF0aW9uVmFsdWVzKSA9PT0gJ1tvYmplY3QgQXJyYXldJykpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5mYXRhbFdhcm5pbmcoJ0V4cGVjdGVkIGFuIG9iamVjdCBvZiBpbnRlcnBvbGF0aW9uIHZhbHVlcyB0byBiZSBwYXNzZWQgaW50byAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdpbnRlcnBvbGF0ZVVybC4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFZhbGlkIHBhdHRlcm46IDxhbHBoYW51bT5cbiAgICAgICAgICAgICAgICB2YXIgSU5URVJQT0xBVElPTl9WQVJJQUJMRV9SRUdFWCA9IC88KFxcdyspPi87XG4gICAgICAgICAgICAgICAgLy8gSW52YWxpZCBwYXR0ZXJuczogPDxzdHVmZj4+LCA8c3R1ZmY+Pj4sIDw+XG4gICAgICAgICAgICAgICAgdmFyIEVNUFRZX1ZBUklBQkxFX1JFR0VYID0gLzw+LztcbiAgICAgICAgICAgICAgICB2YXIgSU5WQUxJRF9WQVJJQUJMRV9SRUdFWCA9IC8oPHsyLH0pKFxcdyopKD57Mix9KS87XG4gICAgICAgICAgICAgICAgaWYgKHVybFRlbXBsYXRlLm1hdGNoKElOVkFMSURfVkFSSUFCTEVfUkVHRVgpIHx8XG4gICAgICAgICAgICAgICAgICAgIHVybFRlbXBsYXRlLm1hdGNoKEVNUFRZX1ZBUklBQkxFX1JFR0VYKSkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnSW52YWxpZCBVUkwgdGVtcGxhdGUgcmVjZWl2ZWQ6IFxcJycgKyB1cmxUZW1wbGF0ZSArICdcXCcnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBlc2NhcGVkSW50ZXJwb2xhdGlvblZhbHVlcyA9IHt9O1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHZhck5hbWUgaW4gaW50ZXJwb2xhdGlvblZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBpbnRlcnBvbGF0aW9uVmFsdWVzW3Zhck5hbWVdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIVV0aWxzU2VydmljZS5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuZmF0YWxXYXJuaW5nKCdQYXJhbWV0ZXJzIHBhc3NlZCBpbnRvIGludGVycG9sYXRlVXJsIG11c3QgYmUgc3RyaW5ncy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVzY2FwZWRJbnRlcnBvbGF0aW9uVmFsdWVzW3Zhck5hbWVdID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIHRoZSBVUkwgaGFzIG5vIG5lc3RlZCBicmFja2V0cyAod2hpY2ggd291bGQgbGVhZCB0b1xuICAgICAgICAgICAgICAgIC8vIGluZGlyZWN0aW9uIGluIHRoZSBpbnRlcnBvbGF0ZWQgdmFyaWFibGVzKS5cbiAgICAgICAgICAgICAgICB2YXIgZmlsbGVkVXJsID0gYW5ndWxhci5jb3B5KHVybFRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBmaWxsZWRVcmwubWF0Y2goSU5URVJQT0xBVElPTl9WQVJJQUJMRV9SRUdFWCk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50VmFyTmFtZSA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWVzY2FwZWRJbnRlcnBvbGF0aW9uVmFsdWVzLmhhc093blByb3BlcnR5KGN1cnJlbnRWYXJOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5mYXRhbFdhcm5pbmcoJ0V4cGVjdGVkIHZhcmlhYmxlIFxcJycgKyBjdXJyZW50VmFyTmFtZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1xcJyB3aGVuIGludGVycG9sYXRpbmcgVVJMLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZmlsbGVkVXJsID0gZmlsbGVkVXJsLnJlcGxhY2UoSU5URVJQT0xBVElPTl9WQVJJQUJMRV9SRUdFWCwgZXNjYXBlZEludGVycG9sYXRpb25WYWx1ZXNbY3VycmVudFZhck5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBmaWxsZWRVcmwubWF0Y2goSU5URVJQT0xBVElPTl9WQVJJQUJMRV9SRUdFWCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmaWxsZWRVcmw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHaXZlbiBhbiBpbWFnZSBwYXRoIHJlbGF0aXZlIHRvIC9hc3NldHMvaW1hZ2VzIGZvbGRlcixcbiAgICAgICAgICAgICAqIHJldHVybnMgdGhlIGNvbXBsZXRlIHVybCBwYXRoIHRvIHRoYXQgaW1hZ2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldFN0YXRpY0ltYWdlVXJsOiBmdW5jdGlvbiAoaW1hZ2VQYXRoKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVSZXNvdXJjZVBhdGgoaW1hZ2VQYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q29tcGxldGVVcmwoJy9hc3NldHMnLCAnL2ltYWdlcycgKyBpbWFnZVBhdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2l2ZW4gYSB2aWRlbyBwYXRoIHJlbGF0aXZlIHRvIC9hc3NldHMvdmlkZW9zIGZvbGRlcixcbiAgICAgICAgICAgICAqIHJldHVybnMgdGhlIGNvbXBsZXRlIHVybCBwYXRoIHRvIHRoYXQgaW1hZ2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldFN0YXRpY1ZpZGVvVXJsOiBmdW5jdGlvbiAodmlkZW9QYXRoKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVSZXNvdXJjZVBhdGgodmlkZW9QYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q29tcGxldGVVcmwoJy9hc3NldHMnLCAnL3ZpZGVvcycgKyB2aWRlb1BhdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2l2ZW4gYSBwYXRoIHJlbGF0aXZlIHRvIC9hc3NldHMgZm9sZGVyLCByZXR1cm5zIHRoZSBjb21wbGV0ZSB1cmwgcGF0aFxuICAgICAgICAgICAgICogdG8gdGhhdCBhc3NldC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0U3RhdGljQXNzZXRVcmw6IGZ1bmN0aW9uIChhc3NldFBhdGgpIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVJlc291cmNlUGF0aChhc3NldFBhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRDb21wbGV0ZVVybCgnL2Fzc2V0cycsIGFzc2V0UGF0aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0RnVsbFN0YXRpY0Fzc2V0VXJsOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRlUmVzb3VyY2VQYXRoKHBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChERVZfTU9ERSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVXJsU2VydmljZS5nZXRPcmlnaW4oKSArIHBhdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVXJsU2VydmljZS5nZXRPcmlnaW4oKSArICcvYnVpbGQnICsgcGF0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHaXZlbiBhbiBpbnRlcmFjdGlvbiBpZCwgcmV0dXJucyB0aGUgY29tcGxldGUgdXJsIHBhdGggdG9cbiAgICAgICAgICAgICAqIHRoZSB0aHVtYm5haWwgaW1hZ2UgZm9yIHRoZSBpbnRlcmFjdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0SW50ZXJhY3Rpb25UaHVtYm5haWxJbWFnZVVybDogZnVuY3Rpb24gKGludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5mYXRhbFdhcm5pbmcoJ0VtcHR5IGludGVyYWN0aW9uSWQgcGFzc2VkIGluIGdldEludGVyYWN0aW9uVGh1bWJuYWlsSW1hZ2VVcmwuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBnZXRFeHRlbnNpb25SZXNvdXJjZVVybCgnL2ludGVyYWN0aW9ucy8nICsgaW50ZXJhY3Rpb25JZCArXG4gICAgICAgICAgICAgICAgICAgICcvc3RhdGljLycgKyBpbnRlcmFjdGlvbklkICsgJy5wbmcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdpdmVuIGEgZGlyZWN0aXZlIHBhdGggcmVsYXRpdmUgdG8gaGVhZCBmb2xkZXIsXG4gICAgICAgICAgICAgKiByZXR1cm5zIHRoZSBjb21wbGV0ZSB1cmwgcGF0aCB0byB0aGF0IGRpcmVjdGl2ZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmw6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVSZXNvdXJjZVBhdGgocGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKERFVl9NT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnL3RlbXBsYXRlcy9kZXYvaGVhZCcgKyBnZXRVcmxXaXRoU2x1ZyhwYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnL2J1aWxkL3RlbXBsYXRlcy9oZWFkJyArIGdldFVybFdpdGhTbHVnKHBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRFeHRlbnNpb25SZXNvdXJjZVVybDogZ2V0RXh0ZW5zaW9uUmVzb3VyY2VVcmwsXG4gICAgICAgICAgICBfZ2V0VXJsV2l0aFNsdWc6IGdldFVybFdpdGhTbHVnLFxuICAgICAgICAgICAgX2dldENvbXBsZXRlVXJsOiBnZXRDb21wbGV0ZVVybFxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBJbml0aWFsaXphdGlvbiBvZiBHb29nbGUgQW5hbHl0aWNzLi5cbiAqL1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoJ2NvbnN0YW50cy50cycpO1xuKGZ1bmN0aW9uIChpLCBzLCBvLCBnLCByLCBhLCBtKSB7XG4gICAgaVsnR29vZ2xlQW5hbHl0aWNzT2JqZWN0J10gPSByO1xuICAgIGlbcl0gPSBpW3JdIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgKGlbcl0ucSA9IGlbcl0ucSB8fCBbXSkucHVzaChhcmd1bWVudHMpO1xuICAgIH0sIGlbcl0ubCA9IDEgKiBuZXcgRGF0ZSgpO1xuICAgIGEgPSBzLmNyZWF0ZUVsZW1lbnQobyksXG4gICAgICAgIG0gPSBzLmdldEVsZW1lbnRzQnlUYWdOYW1lKG8pWzBdO1xuICAgIGEuYXN5bmMgPSAxO1xuICAgIGEuc3JjID0gZztcbiAgICBtLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGEsIG0pO1xufSkod2luZG93LCBkb2N1bWVudCwgJ3NjcmlwdCcsICdodHRwczovL3d3dy5nb29nbGUtYW5hbHl0aWNzLmNvbS9hbmFseXRpY3MuanMnLCAnZ2EnKTtcbihmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGNvbnN0YW50cy5BTkFMWVRJQ1NfSUQgJiYgY29uc3RhbnRzLlNJVEVfTkFNRV9GT1JfQU5BTFlUSUNTKSB7XG4gICAgICAgIGdhKCdjcmVhdGUnLCBjb25zdGFudHMuQU5BTFlUSUNTX0lELCAnYXV0bycsIHsgYWxsb3dMaW5rZXI6IHRydWUgfSk7XG4gICAgICAgIGdhKCdzZXQnLCAnYW5vbnltaXplSXAnLCB0cnVlKTtcbiAgICAgICAgZ2EoJ3NldCcsICdmb3JjZVNTTCcsIHRydWUpO1xuICAgICAgICBnYSgncmVxdWlyZScsICdsaW5rZXInKTtcbiAgICAgICAgZ2EoJ2xpbmtlcjphdXRvTGluaycsIFtjb25zdGFudHMuU0lURV9OQU1FX0ZPUl9BTkFMWVRJQ1NdKTtcbiAgICAgICAgZ2EoJ3NlbmQnLCAncGFnZXZpZXcnKTtcbiAgICB9XG59KSgpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnJlcXVpcmUoJ2RvbWFpbi9zaWRlYmFyL1NpZGViYXJTdGF0dXNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Dc3JmVG9rZW5TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL0RvY3VtZW50QXR0cmlidXRlQ3VzdG9taXphdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvTWV0YVRhZ0N1c3RvbWl6YXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL3N0YXRlZnVsL0JhY2tncm91bmRNYXNrU2VydmljZS50cycpO1xucmVxdWlyZSgnYXBwLmNvbnN0YW50cy5hanMudHMnKTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBPcHBpYSdzIGJhc2UgY29udHJvbGxlci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29udHJvbGxlcignQmFzZScsIFtcbiAgICAnJGRvY3VtZW50JywgJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJ0FsZXJ0c1NlcnZpY2UnLCAnQmFja2dyb3VuZE1hc2tTZXJ2aWNlJyxcbiAgICAnQ3NyZlRva2VuU2VydmljZScsICdEb2N1bWVudEF0dHJpYnV0ZUN1c3RvbWl6YXRpb25TZXJ2aWNlJyxcbiAgICAnTWV0YVRhZ0N1c3RvbWl6YXRpb25TZXJ2aWNlJywgJ1NpZGViYXJTdGF0dXNTZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCAnVXJsU2VydmljZScsICdERVZfTU9ERScsXG4gICAgJ1NJVEVfRkVFREJBQ0tfRk9STV9VUkwnLCAnU0lURV9OQU1FJyxcbiAgICBmdW5jdGlvbiAoJGRvY3VtZW50LCAkcm9vdFNjb3BlLCAkc2NvcGUsIEFsZXJ0c1NlcnZpY2UsIEJhY2tncm91bmRNYXNrU2VydmljZSwgQ3NyZlRva2VuU2VydmljZSwgRG9jdW1lbnRBdHRyaWJ1dGVDdXN0b21pemF0aW9uU2VydmljZSwgTWV0YVRhZ0N1c3RvbWl6YXRpb25TZXJ2aWNlLCBTaWRlYmFyU3RhdHVzU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFVybFNlcnZpY2UsIERFVl9NT0RFLCBTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMLCBTSVRFX05BTUUpIHtcbiAgICAgICAgJHNjb3BlLnNpdGVOYW1lID0gU0lURV9OQU1FO1xuICAgICAgICAkc2NvcGUuY3VycmVudExhbmcgPSAnZW4nO1xuICAgICAgICAkc2NvcGUucGFnZVVybCA9IFVybFNlcnZpY2UuZ2V0Q3VycmVudExvY2F0aW9uKCkuaHJlZjtcbiAgICAgICAgJHNjb3BlLmlmcmFtZWQgPSBVcmxTZXJ2aWNlLmlzSWZyYW1lZCgpO1xuICAgICAgICAkc2NvcGUuZ2V0QXNzZXRVcmwgPSBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldEZ1bGxTdGF0aWNBc3NldFVybChwYXRoKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmlzQmFja2dyb3VuZE1hc2tBY3RpdmUgPSBCYWNrZ3JvdW5kTWFza1NlcnZpY2UuaXNNYXNrQWN0aXZlO1xuICAgICAgICAkc2NvcGUuQWxlcnRzU2VydmljZSA9IEFsZXJ0c1NlcnZpY2U7XG4gICAgICAgICRyb290U2NvcGUuREVWX01PREUgPSBERVZfTU9ERTtcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBub25lbXB0eSwgdGhlIHdob2xlIHBhZ2UgZ29lcyBpbnRvICdMb2FkaW5nLi4uJyBtb2RlLlxuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgIENzcmZUb2tlblNlcnZpY2UuaW5pdGlhbGl6ZVRva2VuKCk7XG4gICAgICAgIE1ldGFUYWdDdXN0b21pemF0aW9uU2VydmljZS5hZGRNZXRhVGFncyhbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlUeXBlOiAnbmFtZScsXG4gICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZTogJ2FwcGxpY2F0aW9uLW5hbWUnLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFNJVEVfTkFNRVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVR5cGU6ICduYW1lJyxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlOiAnbXNhcHBsaWNhdGlvbi1zcXVhcmUzMTB4MzEwbG9nbycsXG4gICAgICAgICAgICAgICAgY29udGVudDogJHNjb3BlLmdldEFzc2V0VXJsKCcvYXNzZXRzL2ltYWdlcy9sb2dvL21zYXBwbGljYXRpb24tbGFyZ2UucG5nJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlUeXBlOiAnbmFtZScsXG4gICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZTogJ21zYXBwbGljYXRpb24td2lkZTMxMHgxNTBsb2dvJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAkc2NvcGUuZ2V0QXNzZXRVcmwoJy9hc3NldHMvaW1hZ2VzL2xvZ28vbXNhcHBsaWNhdGlvbi13aWRlLnBuZycpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5VHlwZTogJ25hbWUnLFxuICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWU6ICdtc2FwcGxpY2F0aW9uLXNxdWFyZTE1MHgxNTBsb2dvJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAkc2NvcGUuZ2V0QXNzZXRVcmwoJy9hc3NldHMvaW1hZ2VzL2xvZ28vbXNhcHBsaWNhdGlvbi1zcXVhcmUucG5nJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlUeXBlOiAnbmFtZScsXG4gICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZTogJ21zYXBwbGljYXRpb24tc3F1YXJlNzB4NzBsb2dvJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAkc2NvcGUuZ2V0QXNzZXRVcmwoJy9hc3NldHMvaW1hZ2VzL2xvZ28vbXNhcHBsaWNhdGlvbi10aW55LnBuZycpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5VHlwZTogJ3Byb3BlcnR5JyxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlOiAnb2c6dXJsJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAkc2NvcGUucGFnZVVybFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVR5cGU6ICdwcm9wZXJ0eScsXG4gICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZTogJ29nOmltYWdlJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAkc2NvcGUuZ2V0QXNzZXRVcmwoJy9hc3NldHMvaW1hZ2VzL2xvZ28vMjg4eDI4OF9sb2dvX21pbnQucG5nJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgICAgIC8vIExpc3RlbmVyIGZ1bmN0aW9uIHRvIGNhdGNoIHRoZSBjaGFuZ2UgaW4gbGFuZ3VhZ2UgcHJlZmVyZW5jZS5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyR0cmFuc2xhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2dCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50TGFuZyA9IHJlc3BvbnNlLmxhbmd1YWdlO1xuICAgICAgICB9KTtcbiAgICAgICAgJHNjb3BlLnNpdGVGZWVkYmFja0Zvcm1VcmwgPSBTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMO1xuICAgICAgICAkc2NvcGUuaXNTaWRlYmFyU2hvd24gPSBTaWRlYmFyU3RhdHVzU2VydmljZS5pc1NpZGViYXJTaG93bjtcbiAgICAgICAgJHNjb3BlLmNsb3NlU2lkZWJhck9uU3dpcGUgPSBTaWRlYmFyU3RhdHVzU2VydmljZS5jbG9zZVNpZGViYXI7XG4gICAgICAgICRzY29wZS5za2lwVG9NYWluQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtYWluQ29udGVudEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3BwaWEtbWFpbi1jb250ZW50Jyk7XG4gICAgICAgICAgICBpZiAoIW1haW5Db250ZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdWYXJpYWJsZSBtYWluQ29udGVudEVsZW1lbnQgaXMgdW5kZWZpbmVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LnRhYkluZGV4ID0gLTE7XG4gICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9O1xuICAgICAgICBEb2N1bWVudEF0dHJpYnV0ZUN1c3RvbWl6YXRpb25TZXJ2aWNlLmFkZEF0dHJpYnV0ZSgnbGFuZycsICRzY29wZS5jdXJyZW50TGFuZyk7XG4gICAgICAgIC8vIFRPRE8oc2xsKTogdXNlICd0b3VjaHN0YXJ0JyBmb3IgbW9iaWxlLlxuICAgICAgICAkZG9jdW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgU2lkZWJhclN0YXR1c1NlcnZpY2Uub25Eb2N1bWVudENsaWNrKCk7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBoYW5kbGluZyB3YXJuaW5ncyBhbmQgaW5mbyBtZXNzYWdlcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQWxlcnRzU2VydmljZScsIFsnJGxvZycsIGZ1bmN0aW9uICgkbG9nKSB7XG4gICAgICAgIHZhciBBbGVydHNTZXJ2aWNlID0ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBFYWNoIGVsZW1lbnQgaW4gZWFjaCBvZiB0aGUgYXJyYXlzIGhlcmUgaXMgYW4gb2JqZWN0IHdpdGggdHdvIGtleXM6XG4gICAgICAgICAgICAgKiAgIC0gdHlwZTogIGEgc3RyaW5nIHNwZWNpZnlpbmcgdGhlIHR5cGUgb2YgbWVzc2FnZSBvciB3YXJuaW5nLlxuICAgICAgICAgICAgICogICAgICAgICAgICBQb3NzaWJsZSB0eXBlcyAtIFwid2FybmluZ1wiLCBcImluZm9cIiBvciBcInN1Y2Nlc3NcIi5cbiAgICAgICAgICAgICAqICAgLSBjb250ZW50OiBhIHN0cmluZyBjb250YWluaW5nIHRoZSB3YXJuaW5nIG9yIG1lc3NhZ2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQXJyYXkgb2YgXCJ3YXJuaW5nXCIgbWVzc2FnZXMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHdhcm5pbmdzOiBbXSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQXJyYXkgb2YgXCJzdWNjZXNzXCIgb3IgXCJpbmZvXCIgbWVzc2FnZXMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG1lc3NhZ2VzOiBbXSxcbiAgICAgICAgICAgIGFkZFdhcm5pbmc6IG51bGwsXG4gICAgICAgICAgICBmYXRhbFdhcm5pbmc6IG51bGwsXG4gICAgICAgICAgICBkZWxldGVXYXJuaW5nOiBudWxsLFxuICAgICAgICAgICAgY2xlYXJXYXJuaW5nczogbnVsbCxcbiAgICAgICAgICAgIGFkZE1lc3NhZ2U6IG51bGwsXG4gICAgICAgICAgICBkZWxldGVNZXNzYWdlOiBudWxsLFxuICAgICAgICAgICAgYWRkSW5mb01lc3NhZ2U6IG51bGwsXG4gICAgICAgICAgICBhZGRTdWNjZXNzTWVzc2FnZTogbnVsbCxcbiAgICAgICAgICAgIGNsZWFyTWVzc2FnZXM6IG51bGxcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVGhpcyBpcyB0byBwcmV2ZW50IGluZmluaXRlIGxvb3BzLlxuICAgICAgICB2YXIgTUFYX1RPVEFMX1dBUk5JTkdTID0gMTA7XG4gICAgICAgIHZhciBNQVhfVE9UQUxfTUVTU0FHRVMgPSAxMDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYSB3YXJuaW5nIG1lc3NhZ2UuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB3YXJuaW5nIC0gVGhlIHdhcm5pbmcgbWVzc2FnZSB0byBkaXNwbGF5LlxuICAgICAgICAgKi9cbiAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nID0gZnVuY3Rpb24gKHdhcm5pbmcpIHtcbiAgICAgICAgICAgICRsb2cuZXJyb3Iod2FybmluZyk7XG4gICAgICAgICAgICBpZiAoQWxlcnRzU2VydmljZS53YXJuaW5ncy5sZW5ndGggPj0gTUFYX1RPVEFMX1dBUk5JTkdTKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQWxlcnRzU2VydmljZS53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICAgICAgICAgICAgY29udGVudDogd2FybmluZ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgd2FybmluZyBpbiB0aGUgc2FtZSB3YXkgYXMgYWRkV2FybmluZygpLCBleGNlcHQgaXQgYWxzbyB0aHJvd3MgYW5cbiAgICAgICAgICogZXhjZXB0aW9uIHRvIGNhdXNlIGEgaGFyZCBmYWlsdXJlIGluIHRoZSBmcm9udGVuZC5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHdhcm5pbmcgLSBUaGUgd2FybmluZyBtZXNzYWdlIHRvIGRpc3BsYXkuXG4gICAgICAgICAqL1xuICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZyA9IGZ1bmN0aW9uICh3YXJuaW5nKSB7XG4gICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcod2FybmluZyk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Iod2FybmluZyk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWxldGVzIHRoZSB3YXJuaW5nIGZyb20gdGhlIHdhcm5pbmdzIGxpc3QuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB3YXJuaW5nT2JqZWN0IC0gVGhlIHdhcm5pbmcgbWVzc2FnZSB0byBiZSBkZWxldGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgQWxlcnRzU2VydmljZS5kZWxldGVXYXJuaW5nID0gZnVuY3Rpb24gKHdhcm5pbmdPYmplY3QpIHtcbiAgICAgICAgICAgIHZhciB3YXJuaW5ncyA9IEFsZXJ0c1NlcnZpY2Uud2FybmluZ3M7XG4gICAgICAgICAgICB2YXIgbmV3V2FybmluZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2FybmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAod2FybmluZ3NbaV0uY29udGVudCAhPT0gd2FybmluZ09iamVjdC5jb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1dhcm5pbmdzLnB1c2god2FybmluZ3NbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2Uud2FybmluZ3MgPSBuZXdXYXJuaW5ncztcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsZWFycyBhbGwgd2FybmluZ3MuXG4gICAgICAgICAqL1xuICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBBbGVydHNTZXJ2aWNlLndhcm5pbmdzID0gW107XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgbWVzc2FnZSwgY2FuIGJlIGluZm8gbWVzc2FnZXMgb3Igc3VjY2VzcyBtZXNzYWdlcy5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBUeXBlIG9mIG1lc3NhZ2VcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBNZXNzYWdlIGNvbnRlbnRcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ8dW5kZWZpbmVkfSB0aW1lb3V0TWlsbGlzZWNvbmRzIC0gVGltZW91dCBmb3IgdGhlIHRvYXN0LlxuICAgICAgICAgKi9cbiAgICAgICAgQWxlcnRzU2VydmljZS5hZGRNZXNzYWdlID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UsIHRpbWVvdXRNaWxsaXNlY29uZHMpIHtcbiAgICAgICAgICAgIGlmIChBbGVydHNTZXJ2aWNlLm1lc3NhZ2VzLmxlbmd0aCA+PSBNQVhfVE9UQUxfTUVTU0FHRVMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBBbGVydHNTZXJ2aWNlLm1lc3NhZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgY29udGVudDogbWVzc2FnZSxcbiAgICAgICAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TWlsbGlzZWNvbmRzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlbGV0ZXMgdGhlIG1lc3NhZ2UgZnJvbSB0aGUgbWVzc2FnZXMgbGlzdC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2VPYmplY3QgLSBNZXNzYWdlIHRvIGJlIGRlbGV0ZWQuXG4gICAgICAgICAqL1xuICAgICAgICBBbGVydHNTZXJ2aWNlLmRlbGV0ZU1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZU9iamVjdCkge1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2VzID0gQWxlcnRzU2VydmljZS5tZXNzYWdlcztcbiAgICAgICAgICAgIHZhciBuZXdNZXNzYWdlcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXNzYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlc1tpXS50eXBlICE9PSBtZXNzYWdlT2JqZWN0LnR5cGUgfHxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXNbaV0uY29udGVudCAhPT0gbWVzc2FnZU9iamVjdC5jb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2VzLnB1c2gobWVzc2FnZXNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UubWVzc2FnZXMgPSBuZXdNZXNzYWdlcztcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYW4gaW5mbyBtZXNzYWdlLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIEluZm8gbWVzc2FnZSB0byBkaXNwbGF5LlxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcnx1bmRlZmluZWR9IHRpbWVvdXRNaWxsaXNlY29uZHMgLSBUaW1lb3V0IGZvciB0aGUgdG9hc3QuXG4gICAgICAgICAqL1xuICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZEluZm9NZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHRpbWVvdXRNaWxsaXNlY29uZHMpIHtcbiAgICAgICAgICAgIGlmICh0aW1lb3V0TWlsbGlzZWNvbmRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0TWlsbGlzZWNvbmRzID0gMTUwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkTWVzc2FnZSgnaW5mbycsIG1lc3NhZ2UsIHRpbWVvdXRNaWxsaXNlY29uZHMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhIHN1Y2Nlc3MgbWVzc2FnZS5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBTdWNjZXNzIG1lc3NhZ2UgdG8gZGlzcGxheVxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcnx1bmRlZmluZWR9IHRpbWVvdXRNaWxsaXNlY29uZHMgLSBUaW1lb3V0IGZvciB0aGUgdG9hc3QuXG4gICAgICAgICAqL1xuICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFN1Y2Nlc3NNZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHRpbWVvdXRNaWxsaXNlY29uZHMpIHtcbiAgICAgICAgICAgIGlmICh0aW1lb3V0TWlsbGlzZWNvbmRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0TWlsbGlzZWNvbmRzID0gMTUwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkTWVzc2FnZSgnc3VjY2VzcycsIG1lc3NhZ2UsIHRpbWVvdXRNaWxsaXNlY29uZHMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2xlYXJzIGFsbCBtZXNzYWdlcy5cbiAgICAgICAgICovXG4gICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJNZXNzYWdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UubWVzc2FnZXMgPSBbXTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEFsZXJ0c1NlcnZpY2U7XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGR5bmFtaWNhbGx5IGNvbnN0cnVjdCB0cmFuc2xhdGlvbiBpZHMgZm9yIGkxOG4uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NvbnN0cnVjdFRyYW5zbGF0aW9uSWRzU2VydmljZScsIFtcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBDb25zdHJ1Y3QgYSB0cmFuc2xhdGlvbiBpZCBmb3IgbGlicmFyeSBmcm9tIG5hbWUgYW5kIGEgcHJlZml4LlxuICAgICAgICAgICAgLy8gRXg6ICdjYXRlZ29yaWVzJywgJ2FydCcgLT4gJ0kxOE5fTElCUkFSWV9DQVRFR09SSUVTX0FSVCdcbiAgICAgICAgICAgIGdldExpYnJhcnlJZDogZnVuY3Rpb24gKHByZWZpeCwgbmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoJ0kxOE5fTElCUkFSWV8nICsgcHJlZml4LnRvVXBwZXJDYXNlKCkgKyAnXycgK1xuICAgICAgICAgICAgICAgICAgICBuYW1lLnRvVXBwZXJDYXNlKCkuc3BsaXQoJyAnKS5qb2luKCdfJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciByZXR1cm5pbmcgaW5mb3JtYXRpb24gYWJvdXQgYSBwYWdlJ3NcbiAqIGNvbnRleHQuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL3NlcnZpY2VzLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NvbnRleHRTZXJ2aWNlJywgW1xuICAgICdVcmxTZXJ2aWNlJywgJ0VOVElUWV9UWVBFJywgJ0VYUExPUkFUSU9OX0VESVRPUl9UQUJfQ09OVEVYVCcsXG4gICAgJ1BBR0VfQ09OVEVYVCcsIGZ1bmN0aW9uIChVcmxTZXJ2aWNlLCBFTlRJVFlfVFlQRSwgRVhQTE9SQVRJT05fRURJVE9SX1RBQl9DT05URVhULCBQQUdFX0NPTlRFWFQpIHtcbiAgICAgICAgdmFyIHBhZ2VDb250ZXh0ID0gbnVsbDtcbiAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWQgPSBudWxsO1xuICAgICAgICB2YXIgcXVlc3Rpb25JZCA9IG51bGw7XG4gICAgICAgIHZhciBlZGl0b3JDb250ZXh0ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uIChlZGl0b3JOYW1lKSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yQ29udGV4dCA9IGVkaXRvck5hbWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gRm9sbG93aW5nIG1ldGhvZCBoZWxwcyB0byBrbm93IHRoZSB3aGV0aGVyIHRoZSBjb250ZXh0IG9mIGVkaXRvciBpc1xuICAgICAgICAgICAgLy8gcXVlc3Rpb24gZWRpdG9yIG9yIGV4cGxvcmF0aW9uIGVkaXRvci4gVGhlIHZhcmlhYmxlIGVkaXRvckNvbnRleHQgaXNcbiAgICAgICAgICAgIC8vIHNldCBmcm9tIHRoZSBpbml0IGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHVwb24gaW5pdGlhbGl6YXRpb24gaW4gdGhlXG4gICAgICAgICAgICAvLyByZXNwZWN0aXZlIGVkaXRvcnMuXG4gICAgICAgICAgICBnZXRFZGl0b3JDb250ZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVkaXRvckNvbnRleHQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgdGFiIG9mIHRoZSBlZGl0b3IgKGVpdGhlclxuICAgICAgICAgICAgLy8gJ2VkaXRvcicgb3IgJ3ByZXZpZXcnKSwgb3IgbnVsbCBpZiB0aGUgY3VycmVudCB0YWIgaXMgbmVpdGhlciBvZiB0aGVzZSxcbiAgICAgICAgICAgIC8vIG9yIHRoZSBjdXJyZW50IHBhZ2UgaXMgbm90IHRoZSBlZGl0b3IuXG4gICAgICAgICAgICBnZXRFZGl0b3JUYWJDb250ZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhc2ggPSBVcmxTZXJ2aWNlLmdldEhhc2goKTtcbiAgICAgICAgICAgICAgICBpZiAoaGFzaC5pbmRleE9mKCcjL2d1aScpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFWFBMT1JBVElPTl9FRElUT1JfVEFCX0NPTlRFWFQuRURJVE9SO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChoYXNoLmluZGV4T2YoJyMvcHJldmlldycpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFWFBMT1JBVElPTl9FRElUT1JfVEFCX0NPTlRFWFQuUFJFVklFVztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY29udGV4dCBvZiB0aGUgY3VycmVudCBwYWdlLlxuICAgICAgICAgICAgLy8gVGhpcyBpcyBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fRURJVE9SIG9yXG4gICAgICAgICAgICAvLyBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fUExBWUVSIG9yIFBBR0VfQ09OVEVYVC5RVUVTVElPTl9FRElUT1IuXG4gICAgICAgICAgICAvLyBJZiB0aGUgY3VycmVudCBwYWdlIGlzIG5vdCBvbmUgaW4gZWl0aGVyIEVYUExPUkFUSU9OX0VESVRPUiBvclxuICAgICAgICAgICAgLy8gRVhQTE9SQVRJT05fUExBWUVSIG9yIFFVRVNUSU9OX0VESVRPUiB0aGVuIHJldHVybiBQQUdFX0NPTlRFWFQuT1RIRVJcbiAgICAgICAgICAgIGdldFBhZ2VDb250ZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhZ2VDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYWdlQ29udGV4dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZUFycmF5ID0gVXJsU2VydmljZS5nZXRQYXRobmFtZSgpLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aG5hbWVBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdleHBsb3JlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXRobmFtZUFycmF5W2ldID09PSAnZW1iZWQnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGhuYW1lQXJyYXlbaSArIDFdID09PSAnZXhwbG9yYXRpb24nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VDb250ZXh0ID0gUEFHRV9DT05URVhULkVYUExPUkFUSU9OX1BMQVlFUjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUEFHRV9DT05URVhULkVYUExPUkFUSU9OX1BMQVlFUjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdjcmVhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFnZUNvbnRleHQgPSBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fRURJVE9SO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fRURJVE9SO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocGF0aG5hbWVBcnJheVtpXSA9PT0gJ3F1ZXN0aW9uX2VkaXRvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWdlQ29udGV4dCA9IFBBR0VfQ09OVEVYVC5RVUVTVElPTl9FRElUT1I7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFBBR0VfQ09OVEVYVC5RVUVTVElPTl9FRElUT1I7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAndG9waWNfZWRpdG9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VDb250ZXh0ID0gUEFHRV9DT05URVhULlRPUElDX0VESVRPUjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUEFHRV9DT05URVhULlRPUElDX0VESVRPUjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdzdG9yeV9lZGl0b3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFnZUNvbnRleHQgPSBQQUdFX0NPTlRFWFQuU1RPUllfRURJVE9SO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQQUdFX0NPTlRFWFQuU1RPUllfRURJVE9SO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocGF0aG5hbWVBcnJheVtpXSA9PT0gJ3NraWxsX2VkaXRvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWdlQ29udGV4dCA9IFBBR0VfQ09OVEVYVC5TS0lMTF9FRElUT1I7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFBBR0VfQ09OVEVYVC5TS0lMTF9FRElUT1I7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAncHJhY3RpY2Vfc2Vzc2lvbicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRobmFtZUFycmF5W2ldID09PSAncmV2aWV3X3Rlc3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFnZUNvbnRleHQgPSBQQUdFX0NPTlRFWFQuUVVFU1RJT05fUExBWUVSO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQQUdFX0NPTlRFWFQuUVVFU1RJT05fUExBWUVSO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocGF0aG5hbWVBcnJheVtpXSA9PT0gJ2NvbGxlY3Rpb25fZWRpdG9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VDb250ZXh0ID0gUEFHRV9DT05URVhULkNPTExFQ1RJT05fRURJVE9SO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQQUdFX0NPTlRFWFQuQ09MTEVDVElPTl9FRElUT1I7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFBBR0VfQ09OVEVYVC5PVEhFUjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNJbkV4cGxvcmF0aW9uQ29udGV4dDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fRURJVE9SIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0UGFnZUNvbnRleHQoKSA9PT0gUEFHRV9DT05URVhULkVYUExPUkFUSU9OX1BMQVlFUik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNJblF1ZXN0aW9uQ29udGV4dDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuUVVFU1RJT05fRURJVE9SKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRFbnRpdHlJZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZUFycmF5ID0gVXJsU2VydmljZS5nZXRQYXRobmFtZSgpLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRobmFtZUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAnZW1iZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJKHBhdGhuYW1lQXJyYXlbaSArIDJdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJKHBhdGhuYW1lQXJyYXlbMl0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEVudGl0eVR5cGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWVBcnJheSA9IFVybFNlcnZpY2UuZ2V0UGF0aG5hbWUoKS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aG5hbWVBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWVBcnJheVtpXSA9PT0gJ2NyZWF0ZScgfHwgcGF0aG5hbWVBcnJheVtpXSA9PT0gJ2V4cGxvcmUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAocGF0aG5hbWVBcnJheVtpXSA9PT0gJ2VtYmVkJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGhuYW1lQXJyYXlbaSArIDFdID09PSAnZXhwbG9yYXRpb24nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEVOVElUWV9UWVBFLkVYUExPUkFUSU9OO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAndG9waWNfZWRpdG9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEVOVElUWV9UWVBFLlRPUElDO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAnc3VidG9waWMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRU5USVRZX1RZUEUuU1VCVE9QSUM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdzdG9yeV9lZGl0b3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRU5USVRZX1RZUEUuU1RPUlk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdza2lsbF9lZGl0b3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRU5USVRZX1RZUEUuU0tJTEw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGV4cGxvcmF0aW9uSWQgKG9idGFpbmVkIGZyb20gdGhlXG4gICAgICAgICAgICAvLyBVUkwpLlxuICAgICAgICAgICAgZ2V0RXhwbG9yYXRpb25JZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICghdGhpcy5pc0luUXVlc3Rpb25QbGF5ZXJNb2RlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHBhdGhuYW1lIHNob3VsZCBiZSBvbmUgb2YgL2V4cGxvcmUve2V4cGxvcmF0aW9uX2lkfSBvclxuICAgICAgICAgICAgICAgICAgICAvLyAvY3JlYXRlL3tleHBsb3JhdGlvbl9pZH0gb3IgL2VtYmVkL2V4cGxvcmF0aW9uL3tleHBsb3JhdGlvbl9pZH0uXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZUFycmF5ID0gVXJsU2VydmljZS5nZXRQYXRobmFtZSgpLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aG5hbWVBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdleHBsb3JlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGhuYW1lQXJyYXlbaV0gPT09ICdjcmVhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25JZCA9IHBhdGhuYW1lQXJyYXlbaSArIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZUFycmF5W2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAnZW1iZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25JZCA9IHBhdGhuYW1lQXJyYXlbaSArIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBleHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdFUlJPUjogQ29udGV4dFNlcnZpY2Ugc2hvdWxkIG5vdCBiZSB1c2VkIG91dHNpZGUgdGhlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2NvbnRleHQgb2YgYW4gZXhwbG9yYXRpb24gb3IgYSBxdWVzdGlvbi4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHF1ZXN0aW9uSWQgKG9idGFpbmVkIGZyb20gdGhlXG4gICAgICAgICAgICAvLyBVUkwpLlxuICAgICAgICAgICAgZ2V0UXVlc3Rpb25JZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChxdWVzdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVzdGlvbklkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHBhdGhuYW1lIHNob3VsZCAvcXVlc3Rpb25fZWRpdG9yL3txdWVzdGlvbl9pZH0uXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZUFycmF5ID0gVXJsU2VydmljZS5nZXRQYXRobmFtZSgpLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aG5hbWVBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdxdWVzdGlvbl9lZGl0b3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlc3Rpb25JZCA9IHBhdGhuYW1lQXJyYXlbaSArIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZUFycmF5W2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignRVJST1I6IENvbnRleHRTZXJ2aWNlIHNob3VsZCBub3QgYmUgdXNlZCBvdXRzaWRlIHRoZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjb250ZXh0IG9mIGFuIGV4cGxvcmF0aW9uIG9yIGEgcXVlc3Rpb24uJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEZvbGxvd2luZyBtZXRob2QgaGVscHMgdG8ga25vdyB3aGV0aGVyIGV4cGxvcmF0aW9uIGVkaXRvciBpc1xuICAgICAgICAgICAgLy8gaW4gbWFpbiBlZGl0aW5nIG1vZGUgb3IgcHJldmlldyBtb2RlLlxuICAgICAgICAgICAgaXNJbkV4cGxvcmF0aW9uRWRpdG9yTW9kZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fRURJVE9SICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0RWRpdG9yVGFiQ29udGV4dCgpID09PSAoRVhQTE9SQVRJT05fRURJVE9SX1RBQl9DT05URVhULkVESVRPUikpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSW5RdWVzdGlvblBsYXllck1vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuUVVFU1RJT05fUExBWUVSO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSW5FeHBsb3JhdGlvbkVkaXRvclBhZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fRURJVE9SO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBtYW5hZ2luZyBDU1JGIHRva2Vucy5cbiAqL1xuLy8gVGhpcyBuZWVkcyB0byBiZSBpbXBvcnRlZCBmaXJzdCBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBnbG9iYWwgZGVmaW5pdGlvblxuLy8gYmVjYXVzZSBBbmd1bGFyIGRvZXNuJ3Qgc3VwcG9ydCBnbG9iYWwgZGVmaW5pdGlvbnMgYW5kIGV2ZXJ5IGxpYnJhcnkgdXNlZFxuLy8gbmVlZHMgdG8gYmUgaW1wb3J0ZWQgZXhwbGljaXRseS5cbnZhciBqcXVlcnlfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwianF1ZXJ5XCIpKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NzcmZUb2tlblNlcnZpY2UnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9rZW5Qcm9taXNlID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluaXRpYWxpemVUb2tlbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0b2tlblByb21pc2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUb2tlbiByZXF1ZXN0IGhhcyBhbHJlYWR5IGJlZW4gbWFkZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBXZSB1c2UgalF1ZXJ5IGhlcmUgaW5zdGVhZCBvZiBBbmd1bGFyJ3MgJGh0dHAsIHNpbmNlIHRoZSBsYXR0ZXIgY3JlYXRlc1xuICAgICAgICAgICAgICAgIC8vIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICAgICAgICAgICAgICB0b2tlblByb21pc2UgPSBqcXVlcnlfMS5kZWZhdWx0LmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvY3NyZmhhbmRsZXInLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YUZpbHRlcjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgcHJvdGVjdGl2ZSBYU1NJIChjcm9zcy1zaXRlIHNjcmlwdGluZyBpbmNsdXNpb24pIHByZWZpeC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxEYXRhID0gZGF0YS5zdWJzdHJpbmcoNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShhY3R1YWxEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UudG9rZW47XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0VG9rZW5Bc3luYzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0b2tlblByb21pc2UgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUb2tlbiBuZWVkcyB0byBiZSBpbml0aWFsaXplZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW5Qcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgY29udmVydGluZyBkYXRlcyBpbiBtaWxsaXNlY29uZHNcbiAqIHNpbmNlIHRoZSBFcG9jaCB0byBodW1hbi1yZWFkYWJsZSBkYXRlcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlJywgW1xuICAgICckZmlsdGVyJywgZnVuY3Rpb24gKCRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFJldHVybnMganVzdCB0aGUgdGltZSBpZiB0aGUgbG9jYWwgZGF0ZXRpbWUgcmVwcmVzZW50YXRpb24gaGFzIHRoZVxuICAgICAgICAgICAgLy8gc2FtZSBkYXRlIGFzIHRoZSBjdXJyZW50IGRhdGUuIE90aGVyd2lzZSwgcmV0dXJucyBqdXN0IHRoZSBkYXRlIGlmIHRoZVxuICAgICAgICAgICAgLy8gbG9jYWwgZGF0ZXRpbWUgcmVwcmVzZW50YXRpb24gaGFzIHRoZSBzYW1lIHllYXIgYXMgdGhlIGN1cnJlbnQgZGF0ZS5cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgcmV0dXJucyB0aGUgZnVsbCBkYXRlICh3aXRoIHRoZSB5ZWFyIGFiYnJldmlhdGVkKS5cbiAgICAgICAgICAgIGdldExvY2FsZUFiYnJldmlhdGVkRGF0ZXRpbWVTdHJpbmc6IGZ1bmN0aW9uIChtaWxsaXNTaW5jZUVwb2NoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShtaWxsaXNTaW5jZUVwb2NoKTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoKSA9PT0gbmV3IERhdGUoKS50b0xvY2FsZURhdGVTdHJpbmcoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvdXI6ICdudW1lcmljJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbnV0ZTogJ251bWVyaWMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaG91cjEyOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkYXRlLmdldEZ1bGxZZWFyKCkgPT09IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignZGF0ZScpKGRhdGUsICdNTU0gZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRmaWx0ZXIoJ2RhdGUnKShkYXRlLCAnc2hvcnREYXRlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMganVzdCB0aGUgZGF0ZS5cbiAgICAgICAgICAgIGdldExvY2FsZURhdGVTdHJpbmc6IGZ1bmN0aW9uIChtaWxsaXNTaW5jZUVwb2NoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShtaWxsaXNTaW5jZUVwb2NoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBSZXR1cm5zIHdoZXRoZXIgdGhlIGRhdGUgaXMgYXQgbW9zdCBvbmUgd2VlayBiZWZvcmUgdGhlIGN1cnJlbnQgZGF0ZS5cbiAgICAgICAgICAgIGlzUmVjZW50OiBmdW5jdGlvbiAobWlsbGlzU2luY2VFcG9jaCkge1xuICAgICAgICAgICAgICAgIHZhciBPTkVfV0VFS19JTl9NSUxMSVMgPSA3ICogMjQgKiA2MCAqIDYwICogMTAwMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBtaWxsaXNTaW5jZUVwb2NoIDwgT05FX1dFRUtfSU5fTUlMTElTO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBkZWJvdW5jaW5nIGZ1bmN0aW9uIGNhbGxzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdEZWJvdW5jZXJTZXJ2aWNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgbm90IGJlIHRyaWdnZXJlZCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0b1xuICAgICAgICAgICAgLy8gYmUgaW52b2tlZC4gVGhlIGZ1bmN0aW9uIG9ubHkgZ2V0cyBleGVjdXRlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWRcbiAgICAgICAgICAgIC8vIGZvciBgd2FpdGAgbWlsbGlzZWNvbmRzLlxuICAgICAgICAgICAgZGVib3VuY2U6IGZ1bmN0aW9uIChmdW5jLCBtaWxsaXNlY3NUb1dhaXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGltZW91dDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgdmFyIHRpbWVzdGFtcDtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3QgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRpbWVzdGFtcDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3QgPCBtaWxsaXNlY3NUb1dhaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCBtaWxsaXNlY3NUb1dhaXQgLSBsYXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIG1pbGxpc2Vjc1RvV2FpdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgSFRNTCBzZXJpYWxpemF0aW9uIGFuZCBlc2NhcGluZy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnSHRtbEVzY2FwZXJTZXJ2aWNlJywgWyckbG9nJywgZnVuY3Rpb24gKCRsb2cpIHtcbiAgICAgICAgdmFyIGh0bWxFc2NhcGVyID0ge1xuICAgICAgICAgICAgb2JqVG9Fc2NhcGVkSnNvbjogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnVuZXNjYXBlZFN0clRvRXNjYXBlZFN0cihKU09OLnN0cmluZ2lmeShvYmopKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlc2NhcGVkSnNvblRvT2JqOiBmdW5jdGlvbiAoanNvbikge1xuICAgICAgICAgICAgICAgIGlmICghanNvbikge1xuICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdFbXB0eSBzdHJpbmcgd2FzIHBhc3NlZCB0byBKU09OIGRlY29kZXIuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UodGhpcy5lc2NhcGVkU3RyVG9VbmVzY2FwZWRTdHIoanNvbikpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuZXNjYXBlZFN0clRvRXNjYXBlZFN0cjogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcoc3RyKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlc2NhcGVkU3RyVG9VbmVzY2FwZWRTdHI6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyYjMzk7L2csICdcXCcnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBodG1sRXNjYXBlcjtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGdlbmVyYXRpbmcgcmFuZG9tIElEcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnSWRHZW5lcmF0aW9uU2VydmljZScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZW5lcmF0ZU5ld0lkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gR2VuZXJhdGVzIHJhbmRvbSBzdHJpbmcgdXNpbmcgdGhlIGxhc3QgMTAgZGlnaXRzIG9mXG4gICAgICAgICAgICAgICAgLy8gdGhlIHN0cmluZyBmb3IgYmV0dGVyIGVudHJvcHkuXG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbVN0cmluZyA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChyYW5kb21TdHJpbmcubGVuZ3RoIDwgMTApIHtcbiAgICAgICAgICAgICAgICAgICAgcmFuZG9tU3RyaW5nID0gcmFuZG9tU3RyaW5nICsgJzAnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmFuZG9tU3RyaW5nLnNsaWNlKC0xMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBuYXZpZ2F0aW5nIHRoZSB0b3AgbmF2aWdhdGlvbiBiYXIgd2l0aFxuICogdGFiIGFuZCBzaGlmdC10YWIuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ05hdmlnYXRpb25TZXJ2aWNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5hdmlnYXRpb24gPSB7XG4gICAgICAgICAgICBhY3RpdmVNZW51TmFtZTogJycsXG4gICAgICAgICAgICBBQ1RJT05fT1BFTjogJ29wZW4nLFxuICAgICAgICAgICAgQUNUSU9OX0NMT1NFOiAnY2xvc2UnLFxuICAgICAgICAgICAgS0VZQk9BUkRfRVZFTlRfVE9fS0VZX0NPREVTOiB7XG4gICAgICAgICAgICAgICAgZW50ZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnRLZXlJc1ByZXNzZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBrZXlDb2RlOiAxM1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGFiOiB7XG4gICAgICAgICAgICAgICAgICAgIHNoaWZ0S2V5SXNQcmVzc2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAga2V5Q29kZTogOVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2hpZnRUYWI6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnRLZXlJc1ByZXNzZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGtleUNvZGU6IDlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3BlblN1Ym1lbnU6IG51bGwsXG4gICAgICAgICAgICBjbG9zZVN1Ym1lbnU6IG51bGwsXG4gICAgICAgICAgICBvbk1lbnVLZXlwcmVzczogbnVsbFxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgKiBPcGVucyB0aGUgc3VibWVudS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZ0XG4gICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lbnVOYW1lIC0gbmFtZSBvZiBtZW51LCBvbiB3aGljaFxuICAgICAgICAqIG9wZW4vY2xvc2UgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCAoY2F0ZWdvcnksbGFuZ3VhZ2UpLlxuICAgICAgICAqL1xuICAgICAgICBuYXZpZ2F0aW9uLm9wZW5TdWJtZW51ID0gZnVuY3Rpb24gKGV2dCwgbWVudU5hbWUpIHtcbiAgICAgICAgICAgIC8vIEZvY3VzIG9uIHRoZSBjdXJyZW50IHRhcmdldCBiZWZvcmUgb3BlbmluZyBpdHMgc3VibWVudS5cbiAgICAgICAgICAgIG5hdmlnYXRpb24uYWN0aXZlTWVudU5hbWUgPSBtZW51TmFtZTtcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChldnQuY3VycmVudFRhcmdldCkuZm9jdXMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgbmF2aWdhdGlvbi5jbG9zZVN1Ym1lbnUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBuYXZpZ2F0aW9uLmFjdGl2ZU1lbnVOYW1lID0gJyc7XG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZXZ0LmN1cnJlbnRUYXJnZXQpLmNsb3Nlc3QoJ2xpJylcbiAgICAgICAgICAgICAgICAuZmluZCgnYScpLmJsdXIoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZXMga2V5ZG93biBldmVudHMgb24gbWVudXMuXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldnRcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lbnVOYW1lIC0gbmFtZSBvZiBtZW51IHRvIHBlcmZvcm0gYWN0aW9uXG4gICAgICAgICAqIG9uKGNhdGVnb3J5L2xhbmd1YWdlKVxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRzVG9iZUhhbmRsZWQgLSBNYXAga2V5Ym9hcmQgZXZlbnRzKCdFbnRlcicpIHRvXG4gICAgICAgICAqIGNvcnJlc3BvbmRpbmcgYWN0aW9ucyB0byBiZSBwZXJmb3JtZWQob3Blbi9jbG9zZSkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICBvbk1lbnVLZXlwcmVzcygkZXZlbnQsICdjYXRlZ29yeScsIHtlbnRlcjogJ29wZW4nfSlcbiAgICAgICAgICovXG4gICAgICAgIG5hdmlnYXRpb24ub25NZW51S2V5cHJlc3MgPSBmdW5jdGlvbiAoZXZ0LCBtZW51TmFtZSwgZXZlbnRzVG9iZUhhbmRsZWQpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXRFdmVudHMgPSBPYmplY3Qua2V5cyhldmVudHNUb2JlSGFuZGxlZCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhcmdldEV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBrZXlDb2RlU3BlYyA9IG5hdmlnYXRpb24uS0VZQk9BUkRfRVZFTlRfVE9fS0VZX0NPREVTW3RhcmdldEV2ZW50c1tpXV07XG4gICAgICAgICAgICAgICAgaWYgKGtleUNvZGVTcGVjLmtleUNvZGUgPT09IGV2dC5rZXlDb2RlICYmXG4gICAgICAgICAgICAgICAgICAgIGV2dC5zaGlmdEtleSA9PT0ga2V5Q29kZVNwZWMuc2hpZnRLZXlJc1ByZXNzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50c1RvYmVIYW5kbGVkW3RhcmdldEV2ZW50c1tpXV0gPT09IG5hdmlnYXRpb24uQUNUSU9OX09QRU4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRpb24ub3BlblN1Ym1lbnUoZXZ0LCBtZW51TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZXZlbnRzVG9iZUhhbmRsZWRbdGFyZ2V0RXZlbnRzW2ldXSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRpb24uQUNUSU9OX0NMT1NFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0aW9uLmNsb3NlU3VibWVudShldnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgYWN0aW9uIHR5cGUuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBuYXZpZ2F0aW9uO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBQcm9tbyBiYXIuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL3NlcnZpY2VzLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1Byb21vQmFyU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnRU5BQkxFX1BST01PX0JBUicsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgRU5BQkxFX1BST01PX0JBUikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0UHJvbW9CYXJEYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb21vQmFyRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbW9CYXJFbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvbW9CYXJNZXNzYWdlOiAnJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKEVOQUJMRV9QUk9NT19CQVIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Byb21vX2Jhcl9oYW5kbGVyJywge30pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9tb0JhckRhdGEucHJvbW9CYXJFbmFibGVkID0gcmVzcG9uc2UuZGF0YS5wcm9tb19iYXJfZW5hYmxlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21vQmFyRGF0YS5wcm9tb0Jhck1lc3NhZ2UgPSByZXNwb25zZS5kYXRhLnByb21vX2Jhcl9tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21vQmFyRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShwcm9tb0JhckRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBoZWxwZXIgc2VydmljZSBmb3IgdGhlIFJpY2ggdGV4dCBlZGl0b3IoUlRFKS5cbiAqL1xucmVxdWlyZSgnc2VydmljZXMvc2VydmljZXMuY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnUnRlSGVscGVyU2VydmljZScsIFtcbiAgICAnJGRvY3VtZW50JywgJyRsb2cnLCAnJHVpYk1vZGFsJyxcbiAgICAnRm9jdXNNYW5hZ2VyU2VydmljZScsICdIdG1sRXNjYXBlclNlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdSVEVfQ09NUE9ORU5UX1NQRUNTJyxcbiAgICBmdW5jdGlvbiAoJGRvY3VtZW50LCAkbG9nLCAkdWliTW9kYWwsIEZvY3VzTWFuYWdlclNlcnZpY2UsIEh0bWxFc2NhcGVyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFJURV9DT01QT05FTlRfU1BFQ1MpIHtcbiAgICAgICAgdmFyIF9SSUNIX1RFWFRfQ09NUE9ORU5UUyA9IFtdO1xuICAgICAgICBPYmplY3Qua2V5cyhSVEVfQ09NUE9ORU5UX1NQRUNTKS5zb3J0KCkuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50SWQpIHtcbiAgICAgICAgICAgIF9SSUNIX1RFWFRfQ09NUE9ORU5UUy5wdXNoKHtcbiAgICAgICAgICAgICAgICBiYWNrZW5kSWQ6IFJURV9DT01QT05FTlRfU1BFQ1NbY29tcG9uZW50SWRdLmJhY2tlbmRfaWQsXG4gICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ1NwZWNzOiBhbmd1bGFyLmNvcHkoUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0uY3VzdG9taXphdGlvbl9hcmdfc3BlY3MpLFxuICAgICAgICAgICAgICAgIGlkOiBSVEVfQ09NUE9ORU5UX1NQRUNTW2NvbXBvbmVudElkXS5mcm9udGVuZF9pZCxcbiAgICAgICAgICAgICAgICBpY29uRGF0YVVybDogUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0uaWNvbl9kYXRhX3VybCxcbiAgICAgICAgICAgICAgICBpc0NvbXBsZXg6IFJURV9DT01QT05FTlRfU1BFQ1NbY29tcG9uZW50SWRdLmlzX2NvbXBsZXgsXG4gICAgICAgICAgICAgICAgaXNCbG9ja0VsZW1lbnQ6IFJURV9DT01QT05FTlRfU1BFQ1NbY29tcG9uZW50SWRdLmlzX2Jsb2NrX2VsZW1lbnQsXG4gICAgICAgICAgICAgICAgcmVxdWlyZXNGczogUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0ucmVxdWlyZXNfZnMsXG4gICAgICAgICAgICAgICAgdG9vbHRpcDogUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0udG9vbHRpcFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgX2NyZWF0ZUN1c3RvbWl6YXRpb25BcmdEaWN0RnJvbUF0dHJzID0gZnVuY3Rpb24gKGF0dHJzKSB7XG4gICAgICAgICAgICB2YXIgY3VzdG9taXphdGlvbkFyZ3NEaWN0ID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBhdHRyc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoYXR0ci5uYW1lID09PSAnY2xhc3MnIHx8IGF0dHIubmFtZSA9PT0gJ3NyYycgfHxcbiAgICAgICAgICAgICAgICAgICAgYXR0ci5uYW1lID09PSAnX21vel9yZXNpemluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzZXBhcmF0b3JMb2NhdGlvbiA9IGF0dHIubmFtZS5pbmRleE9mKCctd2l0aC12YWx1ZScpO1xuICAgICAgICAgICAgICAgIGlmIChzZXBhcmF0b3JMb2NhdGlvbiA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxvZy5lcnJvcignUlRFIEVycm9yOiBpbnZhbGlkIGN1c3RvbWl6YXRpb24gYXR0cmlidXRlICcgKyBhdHRyLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBhdHRyLm5hbWUuc3Vic3RyaW5nKDAsIHNlcGFyYXRvckxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICBjdXN0b21pemF0aW9uQXJnc0RpY3RbYXJnTmFtZV0gPSBIdG1sRXNjYXBlclNlcnZpY2UuZXNjYXBlZEpzb25Ub09iaihhdHRyLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjdXN0b21pemF0aW9uQXJnc0RpY3Q7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGVDdXN0b21pemF0aW9uQXJnRGljdEZyb21BdHRyczogZnVuY3Rpb24gKGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jcmVhdGVDdXN0b21pemF0aW9uQXJnRGljdEZyb21BdHRycyhhdHRycyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UmljaFRleHRDb21wb25lbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShfUklDSF9URVhUX0NPTVBPTkVOVFMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSW5saW5lQ29tcG9uZW50OiBmdW5jdGlvbiAocmljaFRleHRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5saW5lQ29tcG9uZW50cyA9IFsnbGluaycsICdtYXRoJ107XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlubGluZUNvbXBvbmVudHMuaW5kZXhPZihyaWNoVGV4dENvbXBvbmVudCkgIT09IC0xO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRoZSByZWZvY3VzRm4gYXJnIGlzIGEgZnVuY3Rpb24gdGhhdCByZXN0b3JlcyBmb2N1cyB0byB0aGUgdGV4dCBlZGl0b3JcbiAgICAgICAgICAgIC8vIGFmdGVyIGV4aXRpbmcgdGhlIG1vZGFsLCBhbmQgbW92ZXMgdGhlIGN1cnNvciBiYWNrIHRvIHdoZXJlIGl0IHdhc1xuICAgICAgICAgICAgLy8gYmVmb3JlIHRoZSBtb2RhbCB3YXMgb3BlbmVkLlxuICAgICAgICAgICAgX29wZW5DdXN0b21pemF0aW9uTW9kYWw6IGZ1bmN0aW9uIChjdXN0b21pemF0aW9uQXJnU3BlY3MsIGF0dHJzQ3VzdG9taXphdGlvbkFyZ3NEaWN0LCBvblN1Ym1pdENhbGxiYWNrLCBvbkRpc21pc3NDYWxsYmFjaywgcmVmb2N1c0ZuKSB7XG4gICAgICAgICAgICAgICAgJGRvY3VtZW50WzBdLmV4ZWNDb21tYW5kKCdlbmFibGVPYmplY3RSZXNpemluZycsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdmFyIG1vZGFsRGlhbG9nID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NrLWVkaXRvci1oZWxwZXJzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2N1c3RvbWl6ZS1ydGUtY29tcG9uZW50LW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsICckdGltZW91dCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSwgJHRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VzdG9taXphdGlvbkFyZ1NwZWNzID0gY3VzdG9taXphdGlvbkFyZ1NwZWNzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdpdGhvdXQgdGhpcyBjb2RlLCB0aGUgZm9jdXMgd2lsbCByZW1haW4gaW4gdGhlIGJhY2tncm91bmQgUlRFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXZlbiBhZnRlciB0aGUgbW9kYWwgbG9hZHMuIFRoaXMgc3dpdGNoZXMgdGhlIGZvY3VzIHRvIGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZW1wb3JhcnkgZmllbGQgaW4gdGhlIG1vZGFsIHdoaWNoIGlzIHRoZW4gcmVtb3ZlZCBmcm9tIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERPTS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IE1ha2UgdGhpcyBzd2l0Y2ggdG8gdGhlIGZpcnN0IGlucHV0IGZpZWxkIGluIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1vZGFsIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1vZGFsSXNMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGb2N1c01hbmFnZXJTZXJ2aWNlLnNldEZvY3VzKCd0bXBGb2N1c1BvaW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubW9kYWxJc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG1wQ3VzdG9taXphdGlvbkFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1c3RvbWl6YXRpb25BcmdTcGVjcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FOYW1lID0gY3VzdG9taXphdGlvbkFyZ1NwZWNzW2ldLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS50bXBDdXN0b21pemF0aW9uQXJncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNhTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAoYXR0cnNDdXN0b21pemF0aW9uQXJnc0RpY3QuaGFzT3duUHJvcGVydHkoY2FOYW1lKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5jb3B5KGF0dHJzQ3VzdG9taXphdGlvbkFyZ3NEaWN0W2NhTmFtZV0pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21pemF0aW9uQXJnU3BlY3NbaV0uZGVmYXVsdF92YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNhdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdleHRlcm5hbFNhdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1c3RvbWl6YXRpb25BcmdzRGljdCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS50bXBDdXN0b21pemF0aW9uQXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhTmFtZSA9ICRzY29wZS50bXBDdXN0b21pemF0aW9uQXJnc1tpXS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ3NEaWN0W2NhTmFtZV0gPSAoJHNjb3BlLnRtcEN1c3RvbWl6YXRpb25BcmdzW2ldLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZShjdXN0b21pemF0aW9uQXJnc0RpY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBtb2RhbERpYWxvZy5yZXN1bHQudGhlbihvblN1Ym1pdENhbGxiYWNrLCBvbkRpc21pc3NDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgLy8gJ2ZpbmFsbHknIGlzIGEgSlMga2V5d29yZC4gSWYgaXQgaXMganVzdCB1c2VkIGluIGl0cyBcIi5maW5hbGx5XCIgZm9ybSxcbiAgICAgICAgICAgICAgICAvLyB0aGUgbWluaWZpY2F0aW9uIHByb2Nlc3MgdGhyb3dzIGFuIGVycm9yLlxuICAgICAgICAgICAgICAgIG1vZGFsRGlhbG9nLnJlc3VsdFsnZmluYWxseSddKHJlZm9jdXNGbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFV0aWxpdHkgc2VydmljZXMgZm9yIGV4cGxvcmF0aW9ucyB3aGljaCBtYXkgYmUgc2hhcmVkIGJ5IGJvdGhcbiAqIHRoZSBsZWFybmVyIGFuZCBlZGl0b3Igdmlld3MuXG4gKi9cbi8vIFNlcnZpY2UgZm9yIHNlbmRpbmcgZXZlbnRzIHRvIEdvb2dsZSBBbmFseXRpY3MuXG4vL1xuLy8gTm90ZSB0aGF0IGV2ZW50cyBhcmUgb25seSBzZW50IGlmIHRoZSBDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTIGZsYWcgaXNcbi8vIHR1cm5lZCBvbi4gVGhpcyBmbGFnIG11c3QgYmUgdHVybmVkIG9uIGV4cGxpY2l0bHkgYnkgdGhlIGFwcGxpY2F0aW9uXG4vLyBvd25lciBpbiBmZWNvbmYucHkuXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdTaXRlQW5hbHl0aWNzU2VydmljZScsIFtcbiAgICAnJHdpbmRvdycsICdDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTJywgZnVuY3Rpb24gKCR3aW5kb3csIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMpIHtcbiAgICAgICAgLy8gRm9yIGRlZmluaXRpb25zIG9mIHRoZSB2YXJpb3VzIGFyZ3VtZW50cywgcGxlYXNlIHNlZTpcbiAgICAgICAgLy8gZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9ldmVudHNcbiAgICAgICAgdmFyIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcyA9IGZ1bmN0aW9uIChldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCkge1xuICAgICAgICAgICAgaWYgKCR3aW5kb3cuZ2EgJiYgQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUykge1xuICAgICAgICAgICAgICAgICR3aW5kb3cuZ2EoJ3NlbmQnLCAnZXZlbnQnLCBldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIEZvciBkZWZpbml0aW9ucyBvZiB0aGUgdmFyaW91cyBhcmd1bWVudHMsIHBsZWFzZSBzZWU6XG4gICAgICAgIC8vIGRldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvXG4gICAgICAgIC8vICAgc29jaWFsLWludGVyYWN0aW9uc1xuICAgICAgICB2YXIgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzID0gZnVuY3Rpb24gKG5ldHdvcmssIGFjdGlvbiwgdGFyZ2V0VXJsKSB7XG4gICAgICAgICAgICBpZiAoJHdpbmRvdy5nYSAmJiBDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5nYSgnc2VuZCcsICdzb2NpYWwnLCBuZXR3b3JrLCBhY3Rpb24sIHRhcmdldFVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBUaGUgc3JjRWxlbWVudCByZWZlcnMgdG8gdGhlIGVsZW1lbnQgb24gdGhlIHBhZ2UgdGhhdCBpcyBjbGlja2VkLlxuICAgICAgICAgICAgcmVnaXN0ZXJTdGFydExvZ2luRXZlbnQ6IGZ1bmN0aW9uIChzcmNFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdMb2dpbkJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnICcgKyBzcmNFbGVtZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld1NpZ251cEV2ZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTaWdudXBCdXR0b24nLCAnY2xpY2snLCAnJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDbGlja0Jyb3dzZUxpYnJhcnlCdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQnJvd3NlTGlicmFyeUJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyR29Ub0RvbmF0aW9uU2l0ZUV2ZW50OiBmdW5jdGlvbiAoZG9uYXRpb25TaXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnR29Ub0RvbmF0aW9uU2l0ZScsICdjbGljaycsIGRvbmF0aW9uU2l0ZU5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQXBwbHlUb1RlYWNoV2l0aE9wcGlhRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0FwcGx5VG9UZWFjaFdpdGhPcHBpYScsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrQ3JlYXRlRXhwbG9yYXRpb25CdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ3JlYXRlRXhwbG9yYXRpb25CdXR0b24nLCAnY2xpY2snLCAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbicsICdjcmVhdGUnLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uSW5Db2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbkZyb21Db2xsZWN0aW9uJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ3JlYXRlTmV3Q29sbGVjdGlvbkV2ZW50OiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdDb2xsZWN0aW9uJywgJ2NyZWF0ZScsIGNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDb21taXRDaGFuZ2VzVG9Qcml2YXRlRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHJpdmF0ZUV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJTaGFyZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2hhcmVDb2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlbkVtYmVkSW5mb0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRW1iZWRJbmZvTW9kYWwnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29tbWl0Q2hhbmdlc1RvUHVibGljRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHVibGljRXhwbG9yYXRpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBNZXRyaWNzIGZvciB0dXRvcmlhbCBvbiBmaXJzdCBjcmVhdGluZyBleHBsb3JhdGlvblxuICAgICAgICAgICAgcmVnaXN0ZXJUdXRvcmlhbE1vZGFsT3BlbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVHV0b3JpYWxNb2RhbE9wZW4nLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRGVjbGluZVR1dG9yaWFsTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0RlY2xpbmVUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJBY2NlcHRUdXRvcmlhbE1vZGFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdBY2NlcHRUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgdmlzaXRpbmcgdGhlIGhlbHAgY2VudGVyXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrSGVscEJ1dHRvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tIZWxwQnV0dG9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdEhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1Zpc2l0SGVscENlbnRlcicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlblR1dG9yaWFsRnJvbUhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5UdXRvcmlhbEZyb21IZWxwQ2VudGVyJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgZXhpdGluZyB0aGUgdHV0b3JpYWxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2tpcFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTa2lwVHV0b3JpYWwnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaW5pc2hUdXRvcmlhbCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIGZpcnN0IHRpbWUgZWRpdG9yIHVzZVxuICAgICAgICAgICAgcmVnaXN0ZXJFZGl0b3JGaXJzdEVudHJ5RXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdEVudGVyRWRpdG9yJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0T3BlbkNvbnRlbnRCb3hFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0T3BlbkNvbnRlbnRCb3gnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlQ29udGVudEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RTYXZlQ29udGVudCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RDbGlja0FkZEludGVyYWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENsaWNrQWRkSW50ZXJhY3Rpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0U2VsZWN0SW50ZXJhY3Rpb25UeXBlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNlbGVjdEludGVyYWN0aW9uVHlwZScsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlSW50ZXJhY3Rpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0U2F2ZUludGVyYWN0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdFNhdmVSdWxlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNhdmVSdWxlJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdENyZWF0ZVNlY29uZFN0YXRlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENyZWF0ZVNlY29uZFN0YXRlJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIHB1Ymxpc2hpbmcgZXhwbG9yYXRpb25zXG4gICAgICAgICAgICByZWdpc3RlclNhdmVQbGF5YWJsZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUGxheWFibGVFeHBsb3JhdGlvbicsICdzYXZlJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPcGVuUHVibGlzaEV4cGxvcmF0aW9uTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1B1Ymxpc2hFeHBsb3JhdGlvbk1vZGFsJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclB1Ymxpc2hFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUHVibGlzaEV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdE9wcGlhRnJvbUlmcmFtZUV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVmlzaXRPcHBpYUZyb21JZnJhbWUnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld0NhcmQ6IGZ1bmN0aW9uIChjYXJkTnVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhcmROdW0gPD0gMTAgfHwgY2FyZE51bSAlIDEwID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUGxheWVyTmV3Q2FyZCcsICdjbGljaycsIGNhcmROdW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaEV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdQbGF5ZXJGaW5pc2hFeHBsb3JhdGlvbicsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9wZW5Db2xsZWN0aW9uRnJvbUxhbmRpbmdQYWdlRXZlbnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5GcmFjdGlvbnNGcm9tTGFuZGluZ1BhZ2UnLCAnY2xpY2snLCBjb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3Rld2FyZHNMYW5kaW5nUGFnZUV2ZW50OiBmdW5jdGlvbiAodmlld2VyVHlwZSwgYnV0dG9uVGV4dCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tCdXR0b25PblN0ZXdhcmRzUGFnZScsICdjbGljaycsIHZpZXdlclR5cGUgKyAnOicgKyBidXR0b25UZXh0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclNhdmVSZWNvcmRlZEF1ZGlvRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUmVjb3JkZWRBdWRpbycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3RhcnRBdWRpb1JlY29yZGluZ0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnU3RhcnRBdWRpb1JlY29yZGluZycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyVXBsb2FkQXVkaW9FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1VwbG9hZFJlY29yZGVkQXVkaW8nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY2FsY3VsYXRpbmcgdGhlIHN0YXRpc3RpY3Mgb2YgYSBwYXJ0aWN1bGFyIHN0YXRlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdTdGF0ZVJ1bGVzU3RhdHNTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckaW5qZWN0b3InLCAnJHEnLCAnQW5ndWxhck5hbWVTZXJ2aWNlJyxcbiAgICAnQW5zd2VyQ2xhc3NpZmljYXRpb25TZXJ2aWNlJywgJ0NvbnRleHRTZXJ2aWNlJywgJ0ZyYWN0aW9uT2JqZWN0RmFjdG9yeScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkaW5qZWN0b3IsICRxLCBBbmd1bGFyTmFtZVNlcnZpY2UsIEFuc3dlckNsYXNzaWZpY2F0aW9uU2VydmljZSwgQ29udGV4dFNlcnZpY2UsIEZyYWN0aW9uT2JqZWN0RmFjdG9yeSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUT0RPKGJyaWFucm9kcmkpOiBDb25zaWRlciBtb3ZpbmcgdGhpcyBpbnRvIGEgdmlzdWFsaXphdGlvbiBkb21haW5cbiAgICAgICAgICAgICAqIG9iamVjdC5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdCF9IHN0YXRlXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIGdpdmVuIHN0YXRlIGhhcyBhbiBpbXBsZW1lbnRhdGlvbiBmb3JcbiAgICAgICAgICAgICAqICAgICBkaXNwbGF5aW5nIHRoZSBpbXByb3ZlbWVudHMgb3ZlcnZpZXcgdGFiIGluIHRoZSBTdGF0ZSBFZGl0b3IuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHN0YXRlU3VwcG9ydHNJbXByb3ZlbWVudHNPdmVydmlldzogZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlLmludGVyYWN0aW9uLmlkID09PSAnVGV4dElucHV0JztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHdpbGwgcHJvdmlkZSBkZXRhaWxzIG9mIHRoZSBnaXZlbiBzdGF0ZSdzXG4gICAgICAgICAgICAgKiBhbnN3ZXItc3RhdGlzdGljcy5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge09iamVjdCF9IHN0YXRlXG4gICAgICAgICAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY29tcHV0ZVN0YXRlUnVsZXNTdGF0czogZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWQgPSBDb250ZXh0U2VydmljZS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFzdGF0ZS5pbnRlcmFjdGlvbi5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZV9uYW1lOiBzdGF0ZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGV4cGxvcmF0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXN1YWxpemF0aW9uc19pbmZvOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBpbnRlcmFjdGlvblJ1bGVzU2VydmljZSA9ICRpbmplY3Rvci5nZXQoQW5ndWxhck5hbWVTZXJ2aWNlLmdldE5hbWVPZkludGVyYWN0aW9uUnVsZXNTZXJ2aWNlKHN0YXRlLmludGVyYWN0aW9uLmlkKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2NyZWF0ZWhhbmRsZXIvc3RhdGVfcnVsZXNfc3RhdHMvJyArIFtcbiAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KGV4cGxvcmF0aW9uSWQpLFxuICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RhdGUubmFtZSlcbiAgICAgICAgICAgICAgICBdLmpvaW4oJy8nKSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlX25hbWU6IHN0YXRlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc3VhbGl6YXRpb25zX2luZm86IHJlc3BvbnNlLmRhdGEudmlzdWFsaXphdGlvbnNfaW5mby5tYXAoZnVuY3Rpb24gKHZpekluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Vml6SW5mbyA9IGFuZ3VsYXIuY29weSh2aXpJbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWaXpJbmZvLmRhdGEuZm9yRWFjaChmdW5jdGlvbiAodml6SW5mb0RhdHVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGRhdGEgaXMgYSBGcmFjdGlvbklucHV0LCBuZWVkIHRvIGNoYW5nZSBkYXRhIHNvIHRoYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmlzdWFsaXphdGlvbiBkaXNwbGF5cyB0aGUgaW5wdXQgaW4gYSByZWFkYWJsZSBtYW5uZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5pbnRlcmFjdGlvbi5pZCA9PT0gJ0ZyYWN0aW9uSW5wdXQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXpJbmZvRGF0dW0uYW5zd2VyID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGcmFjdGlvbk9iamVjdEZhY3RvcnkuZnJvbURpY3Qodml6SW5mb0RhdHVtLmFuc3dlcikudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3Vml6SW5mby5hZGRyZXNzZWRfaW5mb19pc19zdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpekluZm9EYXR1bS5pc19hZGRyZXNzZWQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFuc3dlckNsYXNzaWZpY2F0aW9uU2VydmljZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaXNDbGFzc2lmaWVkRXhwbGljaXRseU9yR29lc1RvTmV3U3RhdGUoc3RhdGUubmFtZSwgc3RhdGUsIHZpekluZm9EYXR1bS5hbnN3ZXIsIGludGVyYWN0aW9uUnVsZXNTZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXdWaXpJbmZvO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBsb2FkIHRoZSBpMThuIHRyYW5zbGF0aW9uIGZpbGUuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1RyYW5zbGF0aW9uRmlsZUhhc2hMb2FkZXJTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgLyogT3B0aW9ucyBvYmplY3QgY29udGFpbnM6XG4gICAgICAgICAqICBwcmVmaXg6IGFkZGVkIGJlZm9yZSBrZXksIGRlZmluZWQgYnkgZGV2ZWxvcGVyXG4gICAgICAgICAqICBrZXk6IGxhbmd1YWdlIGtleSwgZGV0ZXJtaW5lZCBpbnRlcm5hbGx5IGJ5IGkxOG4gbGlicmFyeVxuICAgICAgICAgKiAgc3VmZml4OiBhZGRlZCBhZnRlciBrZXksIGRlZmluZWQgYnkgZGV2ZWxvcGVyXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBmaWxlVXJsID0gW1xuICAgICAgICAgICAgICAgIG9wdGlvbnMucHJlZml4LFxuICAgICAgICAgICAgICAgIG9wdGlvbnMua2V5LFxuICAgICAgICAgICAgICAgIG9wdGlvbnMuc3VmZml4XG4gICAgICAgICAgICBdLmpvaW4oJycpO1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldChVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNBc3NldFVybChmaWxlVXJsKSkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5kYXRhO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3Qob3B0aW9ucy5rZXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxucmVxdWlyZSgnZG9tYWluL3VzZXIvVXNlckluZm9PYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciB1c2VyIGRhdGEuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1VzZXJTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICckd2luZG93JywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1VybFNlcnZpY2UnLFxuICAgICdVc2VySW5mb09iamVjdEZhY3RvcnknLCAnREVGQVVMVF9QUk9GSUxFX0lNQUdFX1BBVEgnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsICR3aW5kb3csIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBVcmxTZXJ2aWNlLCBVc2VySW5mb09iamVjdEZhY3RvcnksIERFRkFVTFRfUFJPRklMRV9JTUFHRV9QQVRIKSB7XG4gICAgICAgIHZhciBQUkVGRVJFTkNFU19EQVRBX1VSTCA9ICcvcHJlZmVyZW5jZXNoYW5kbGVyL2RhdGEnO1xuICAgICAgICB2YXIgdXNlckluZm8gPSBudWxsO1xuICAgICAgICB2YXIgZ2V0VXNlckluZm9Bc3luYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChVcmxTZXJ2aWNlLmdldFBhdGhuYW1lKCkgPT09ICcvc2lnbnVwJykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZXNvbHZlKFVzZXJJbmZvT2JqZWN0RmFjdG9yeS5jcmVhdGVEZWZhdWx0KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUodXNlckluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3VzZXJpbmZvaGFuZGxlcicpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEudXNlcl9pc19sb2dnZWRfaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlckluZm8gPSBVc2VySW5mb09iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZSh1c2VySW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShVc2VySW5mb09iamVjdEZhY3RvcnkuY3JlYXRlRGVmYXVsdCgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldFByb2ZpbGVJbWFnZURhdGFVcmxBc3luYzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwcm9maWxlUGljdHVyZURhdGFVcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoREVGQVVMVF9QUk9GSUxFX0lNQUdFX1BBVEgpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0VXNlckluZm9Bc3luYygpLnRoZW4oZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VySW5mby5pc0xvZ2dlZEluKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9wcmVmZXJlbmNlc2hhbmRsZXIvcHJvZmlsZV9waWN0dXJlJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5wcm9maWxlX3BpY3R1cmVfZGF0YV91cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZVBpY3R1cmVEYXRhVXJsID0gcmVzcG9uc2UuZGF0YS5wcm9maWxlX3BpY3R1cmVfZGF0YV91cmw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9maWxlUGljdHVyZURhdGFVcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZXNvbHZlKHByb2ZpbGVQaWN0dXJlRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXRQcm9maWxlSW1hZ2VEYXRhVXJsQXN5bmM6IGZ1bmN0aW9uIChuZXdQcm9maWxlSW1hZ2VEYXRhVXJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLnB1dChQUkVGRVJFTkNFU19EQVRBX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVfdHlwZTogJ3Byb2ZpbGVfcGljdHVyZV9kYXRhX3VybCcsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IG5ld1Byb2ZpbGVJbWFnZURhdGFVcmxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRMb2dpblVybEFzeW5jOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVybFBhcmFtZXRlcnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfdXJsOiAkd2luZG93LmxvY2F0aW9uLmhyZWZcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy91cmxfaGFuZGxlcicsIHsgcGFyYW1zOiB1cmxQYXJhbWV0ZXJzIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLmxvZ2luX3VybDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRVc2VySW5mb0FzeW5jOiBnZXRVc2VySW5mb0FzeW5jXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIHN0b3JpbmcgYWxsIGdlbmVyaWMgZnVuY3Rpb25zIHdoaWNoIGhhdmUgdG8gYmVcbiAqIHVzZWQgYXQgbXVsdGlwbGUgcGxhY2VzIGluIHRoZSBjb2RlYmFzZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnVXRpbHNTZXJ2aWNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHV0aWxzID0ge1xuICAgICAgICAgICAgaXNFbXB0eTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIG9iaikge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjAzNzM5XG4gICAgICAgICAgICBpc1N0cmluZzogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnIHx8IGlucHV0IGluc3RhbmNlb2YgU3RyaW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHV0aWxzO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBjaGVjayBpZiB1c2VyIGlzIG9uIGEgbW9iaWxlIGRldmljZS5cbiAqL1xuLy8gU2VlOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTEzODE3MzBcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0RldmljZUluZm9TZXJ2aWNlJywgW1xuICAgICckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEJvb2xlYW4obmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKSB8fFxuICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC93ZWJPUy9pKSB8fFxuICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHxcbiAgICAgICAgICAgICAgICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBhZC9pKSB8fFxuICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpIHx8XG4gICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0JsYWNrQmVycnkvaSkgfHxcbiAgICAgICAgICAgICAgICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvV2luZG93cyBQaG9uZS9pKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNNb2JpbGVVc2VyQWdlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gL01vYmkvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGFzVG91Y2hFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ29udG91Y2hzdGFydCcgaW4gJHdpbmRvdztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBhZGQgY3VzdG9tIGF0dHJpYnV0ZXMgdG8gdGhlIDxodG1sPiBlbGVtZW50LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdEb2N1bWVudEF0dHJpYnV0ZUN1c3RvbWl6YXRpb25TZXJ2aWNlJywgW1xuICAgICckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFkZEF0dHJpYnV0ZTogZnVuY3Rpb24gKGF0dHJpYnV0ZSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAkd2luZG93LmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gYWRkIGN1c3RvbSBtZXRhIHRhZ3MuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ01ldGFUYWdDdXN0b21pemF0aW9uU2VydmljZScsIFtcbiAgICAnJHdpbmRvdycsIGZ1bmN0aW9uICgkd2luZG93KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhZGRNZXRhVGFnczogZnVuY3Rpb24gKGF0dHJBcnJheSkge1xuICAgICAgICAgICAgICAgIGF0dHJBcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChhdHRyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtZXRhID0gJHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZXRhJyk7XG4gICAgICAgICAgICAgICAgICAgIG1ldGEuc2V0QXR0cmlidXRlKGF0dHIucHJvcGVydHlUeXBlLCBhdHRyLnByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBtZXRhLnNldEF0dHJpYnV0ZSgnY29udGVudCcsIGF0dHIuY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICR3aW5kb3cuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChtZXRhKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgbWFuaXB1bGF0aW5nIHRoZSBwYWdlIFVSTC4gQWxzbyBhbGxvd3NcbiAqIGZ1bmN0aW9ucyBvbiAkd2luZG93IHRvIGJlIG1vY2tlZCBpbiB1bml0IHRlc3RzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdVcmxTZXJ2aWNlJywgWyckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgZm9yIHRlc3RpbmcgcHVycG9zZXMgKHRvIG1vY2sgJHdpbmRvdy5sb2NhdGlvbilcbiAgICAgICAgICAgIGdldEN1cnJlbnRMb2NhdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkd2luZG93LmxvY2F0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEN1cnJlbnRRdWVyeVN0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLnNlYXJjaDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKiBBcyBwYXJhbXNba2V5XSBpcyBvdmVyd3JpdHRlbiwgaWYgcXVlcnkgc3RyaW5nIGhhcyBtdWx0aXBsZSBmaWVsZFZhbHVlc1xuICAgICAgICAgICAgICAgZm9yIHNhbWUgZmllbGROYW1lLCB1c2UgZ2V0UXVlcnlGaWVsZFZhbHVlc0FzTGlzdChmaWVsZE5hbWUpIHRvIGdldCBpdFxuICAgICAgICAgICAgICAgaW4gYXJyYXkgZm9ybS4gKi9cbiAgICAgICAgICAgIGdldFVybFBhcmFtczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgcGFydHMgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLnJlcGxhY2UoL1s/Jl0rKFtePSZdKyk9KFteJl0qKS9naSwgZnVuY3Rpb24gKG0sIGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zW2RlY29kZVVSSUNvbXBvbmVudChrZXkpXSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0lmcmFtZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgdmFyIHVybFBhcnRzID0gcGF0aG5hbWUuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXJsUGFydHNbMV0gPT09ICdlbWJlZCc7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UGF0aG5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5wYXRobmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRUb3BpY0lkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcL3RvcGljX2VkaXRvclxcLyhcXHd8LSl7MTJ9L2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZS5zcGxpdCgnLycpWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCB0b3BpYyBpZCB1cmwnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRUb3BpY05hbWVGcm9tTGVhcm5lclVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcLyhzdG9yeXx0b3BpY3xzdWJ0b3BpY3xwcmFjdGljZV9zZXNzaW9uKS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lLnNwbGl0KCcvJylbMl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBVUkwgZm9yIHRvcGljJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3VidG9waWNJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3VtZW50c0FycmF5ID0gcGF0aG5hbWUuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcL3N1YnRvcGljL2cpICYmIGFyZ3VtZW50c0FycmF5Lmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGFyZ3VtZW50c0FycmF5WzNdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgVVJMIGZvciBzdWJ0b3BpYycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0b3J5SWRGcm9tVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvKHN0b3J5X2VkaXRvcnxyZXZpZXdfdGVzdClcXC8oXFx3fC0pezEyfS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aG5hbWUuc3BsaXQoJy8nKVsyXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgc3RvcnkgaWQgdXJsJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RvcnlJZEZyb21WaWV3ZXJVcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC9zdG9yeVxcLyhcXHd8LSl7MTJ9L2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZS5zcGxpdCgnLycpWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBzdG9yeSBpZCB1cmwnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdG9yeUlkSW5QbGF5ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcXVlcnkgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpO1xuICAgICAgICAgICAgICAgIHZhciBxdWVyeUl0ZW1zID0gcXVlcnkuc3BsaXQoJyYnKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXJ5SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnQgPSBxdWVyeUl0ZW1zW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFydC5tYXRjaCgvXFw/c3RvcnlfaWQ9KChcXHd8LSl7MTJ9KS9nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnQuc3BsaXQoJz0nKVsxXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTa2lsbElkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2tpbGxJZCA9IHBhdGhuYW1lLnNwbGl0KCcvJylbMl07XG4gICAgICAgICAgICAgICAgaWYgKHNraWxsSWQubGVuZ3RoICE9PSAxMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTa2lsbCBJZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc2tpbGxJZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRRdWVyeUZpZWxkVmFsdWVzQXNMaXN0OiBmdW5jdGlvbiAoZmllbGROYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkVmFsdWVzID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuaW5kZXhPZignPycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRWFjaCBxdWVyeUl0ZW0gcmV0dXJuIG9uZSBmaWVsZC12YWx1ZSBwYWlyIGluIHRoZSB1cmwuXG4gICAgICAgICAgICAgICAgICAgIHZhciBxdWVyeUl0ZW1zID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5zbGljZSh0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLmluZGV4T2YoJz8nKSArIDEpLnNwbGl0KCcmJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVlcnlJdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGaWVsZE5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlJdGVtc1tpXS5zcGxpdCgnPScpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50RmllbGRWYWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudChxdWVyeUl0ZW1zW2ldLnNwbGl0KCc9JylbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRGaWVsZE5hbWUgPT09IGZpZWxkTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWVzLnB1c2goY3VycmVudEZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFZhbHVlcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZGRGaWVsZDogZnVuY3Rpb24gKHVybCwgZmllbGROYW1lLCBmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVuY29kZWRGaWVsZFZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIHZhciBlbmNvZGVkRmllbGROYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybCArICh1cmwuaW5kZXhPZignPycpICE9PSAtMSA/ICcmJyA6ICc/JykgKyBlbmNvZGVkRmllbGROYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJz0nICsgZW5jb2RlZEZpZWxkVmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0SGFzaDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLmhhc2g7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0T3JpZ2luOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkub3JpZ2luO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldENvbGxlY3Rpb25JZEZyb21FeHBsb3JhdGlvblVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB1cmxQYXJhbXMgPSB0aGlzLmdldFVybFBhcmFtcygpO1xuICAgICAgICAgICAgICAgIGlmICh1cmxQYXJhbXMuaGFzT3duUHJvcGVydHkoJ3BhcmVudCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodXJsUGFyYW1zLmhhc093blByb3BlcnR5KCdjb2xsZWN0aW9uX2lkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVybFBhcmFtcy5jb2xsZWN0aW9uX2lkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRVc2VybmFtZUZyb21Qcm9maWxlVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvKHByb2ZpbGUpL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUuc3BsaXQoJy8nKVsyXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHByb2ZpbGUgVVJMJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q29sbGVjdGlvbklkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcLyhjb2xsZWN0aW9uKS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lLnNwbGl0KCcvJylbMl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBjb2xsZWN0aW9uIFVSTCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldENvbGxlY3Rpb25JZEZyb21FZGl0b3JVcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC8oY29sbGVjdGlvbl9lZGl0b3JcXC9jcmVhdGUpL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUuc3BsaXQoJy8nKVszXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIGNvbGxlY3Rpb24gZWRpdG9yIFVSTCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEV4cGxvcmF0aW9uVmVyc2lvbkZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXJsUGFyYW1zID0gdGhpcy5nZXRVcmxQYXJhbXMoKTtcbiAgICAgICAgICAgICAgICBpZiAodXJsUGFyYW1zLmhhc093blByb3BlcnR5KCd2JykpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZlcnNpb24gPSB1cmxQYXJhbXMudjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZlcnNpb24uaW5jbHVkZXMoJyMnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGV4cGxvcmF0aW9ucyBwbGF5ZWQgaW4gYW4gaWZyYW1lLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbiA9IHZlcnNpb24uc3Vic3RyaW5nKDAsIHZlcnNpb24uaW5kZXhPZignIycpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTnVtYmVyKHZlcnNpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGNvbXB1dGluZyB0aGUgd2luZG93IGRpbWVuc2lvbnMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlJywgW1xuICAgICckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgdmFyIG9uUmVzaXplSG9va3MgPSBbXTtcbiAgICAgICAgYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLmJpbmQoJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG9uUmVzaXplSG9va3MuZm9yRWFjaChmdW5jdGlvbiAoaG9va0ZuKSB7XG4gICAgICAgICAgICAgICAgaG9va0ZuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRXaWR0aDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoJHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fFxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9uUmVzaXplSG9vazogZnVuY3Rpb24gKGhvb2tGbikge1xuICAgICAgICAgICAgICAgIG9uUmVzaXplSG9va3MucHVzaChob29rRm4pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzV2luZG93TmFycm93OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIE5PUk1BTF9OQVZCQVJfQ1VUT0ZGX1dJRFRIX1BYID0gNzY4O1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFdpZHRoKCkgPD0gTk9STUFMX05BVkJBUl9DVVRPRkZfV0lEVEhfUFg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3Igc2hhcmVkIHNlcnZpY2VzIGFjcm9zcyBPcHBpYS5cbiAqL1xuLy8gVE9ETygjNzA5Mik6IERlbGV0ZSB0aGlzIGZpbGUgb25jZSBtaWdyYXRpb24gaXMgY29tcGxldGUgYW5kIHRoZXNlIEFuZ3VsYXJKU1xuLy8gZXF1aXZhbGVudHMgb2YgdGhlIEFuZ3VsYXIgY29uc3RhbnRzIGFyZSBubyBsb25nZXIgbmVlZGVkLlxudmFyIHNlcnZpY2VzX2NvbnN0YW50c18xID0gcmVxdWlyZShcInNlcnZpY2VzL3NlcnZpY2VzLmNvbnN0YW50c1wiKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdQQUdFX0NPTlRFWFQnLCBzZXJ2aWNlc19jb25zdGFudHNfMS5TZXJ2aWNlc0NvbnN0YW50cy5QQUdFX0NPTlRFWFQpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0VYUExPUkFUSU9OX0VESVRPUl9UQUJfQ09OVEVYVCcsIHNlcnZpY2VzX2NvbnN0YW50c18xLlNlcnZpY2VzQ29uc3RhbnRzLkVYUExPUkFUSU9OX0VESVRPUl9UQUJfQ09OVEVYVCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRVhQTE9SQVRJT05fRkVBVFVSRVNfVVJMJywgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMuRVhQTE9SQVRJT05fRkVBVFVSRVNfVVJMKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdGRVRDSF9JU1NVRVNfVVJMJywgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMuRkVUQ0hfSVNTVUVTX1VSTCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRkVUQ0hfUExBWVRIUk9VR0hfVVJMJywgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMuRkVUQ0hfUExBWVRIUk9VR0hfVVJMKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdSRVNPTFZFX0lTU1VFX1VSTCcsIHNlcnZpY2VzX2NvbnN0YW50c18xLlNlcnZpY2VzQ29uc3RhbnRzLlJFU09MVkVfSVNTVUVfVVJMKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVE9SRV9QTEFZVEhST1VHSF9VUkwnLCBzZXJ2aWNlc19jb25zdGFudHNfMS5TZXJ2aWNlc0NvbnN0YW50cy5TVE9SRV9QTEFZVEhST1VHSF9VUkwpO1xuLy8gRW5hYmxlcyByZWNvcmRpbmcgcGxheXRocm91Z2hzIGZyb20gbGVhcm5lciBzZXNzaW9ucy5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFQVJMWV9RVUlUX1RIUkVTSE9MRF9JTl9TRUNTJywgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMuRUFSTFlfUVVJVF9USFJFU0hPTERfSU5fU0VDUyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnTlVNX0lOQ09SUkVDVF9BTlNXRVJTX1RIUkVTSE9MRCcsIHNlcnZpY2VzX2NvbnN0YW50c18xLlNlcnZpY2VzQ29uc3RhbnRzLk5VTV9JTkNPUlJFQ1RfQU5TV0VSU19USFJFU0hPTEQpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ05VTV9SRVBFQVRFRF9DWUNMRVNfVEhSRVNIT0xEJywgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMuTlVNX1JFUEVBVEVEX0NZQ0xFU19USFJFU0hPTEQpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NVUlJFTlRfQUNUSU9OX1NDSEVNQV9WRVJTSU9OJywgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMuQ1VSUkVOVF9BQ1RJT05fU0NIRU1BX1ZFUlNJT04pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NVUlJFTlRfSVNTVUVfU0NIRU1BX1ZFUlNJT04nLCBzZXJ2aWNlc19jb25zdGFudHNfMS5TZXJ2aWNlc0NvbnN0YW50cy5DVVJSRU5UX0lTU1VFX1NDSEVNQV9WRVJTSU9OKTtcbi8vIFdoZXRoZXIgdG8gZW5hYmxlIHRoZSBwcm9tbyBiYXIgZnVuY3Rpb25hbGl0eS4gVGhpcyBkb2VzIG5vdCBhY3R1YWxseSB0dXJuIG9uXG4vLyB0aGUgcHJvbW8gYmFyLCBhcyB0aGF0IGlzIGdhdGVkIGJ5IGEgY29uZmlnIHZhbHVlIChzZWUgY29uZmlnX2RvbWFpbikuIFRoaXNcbi8vIG1lcmVseSBhdm9pZHMgY2hlY2tpbmcgZm9yIHdoZXRoZXIgdGhlIHByb21vIGJhciBpcyBlbmFibGVkIGZvciBldmVyeSBPcHBpYVxuLy8gcGFnZSB2aXNpdGVkLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0VOQUJMRV9QUk9NT19CQVInLCBzZXJ2aWNlc19jb25zdGFudHNfMS5TZXJ2aWNlc0NvbnN0YW50cy5FTkFCTEVfUFJPTU9fQkFSKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdSVEVfQ09NUE9ORU5UX1NQRUNTJywgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMuUlRFX0NPTVBPTkVOVF9TUEVDUyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0VBUkNIX0RBVEFfVVJMJywgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMuU0VBUkNIX0RBVEFfVVJMKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVEFURV9BTlNXRVJfU1RBVFNfVVJMJywgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMuU1RBVEVfQU5TV0VSX1NUQVRTX1VSTCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3Igc2hhcmVkIHNlcnZpY2VzIGFjcm9zcyBPcHBpYS5cbiAqL1xudmFyIFNlcnZpY2VzQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNlcnZpY2VzQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBTZXJ2aWNlc0NvbnN0YW50cy5QQUdFX0NPTlRFWFQgPSB7XG4gICAgICAgIENPTExFQ1RJT05fRURJVE9SOiAnY29sbGVjdGlvbl9lZGl0b3InLFxuICAgICAgICBFWFBMT1JBVElPTl9FRElUT1I6ICdlZGl0b3InLFxuICAgICAgICBFWFBMT1JBVElPTl9QTEFZRVI6ICdsZWFybmVyJyxcbiAgICAgICAgUVVFU1RJT05fRURJVE9SOiAncXVlc3Rpb25fZWRpdG9yJyxcbiAgICAgICAgUVVFU1RJT05fUExBWUVSOiAncXVlc3Rpb25fcGxheWVyJyxcbiAgICAgICAgU0tJTExfRURJVE9SOiAnc2tpbGxfZWRpdG9yJyxcbiAgICAgICAgU1RPUllfRURJVE9SOiAnc3RvcnlfZWRpdG9yJyxcbiAgICAgICAgVE9QSUNfRURJVE9SOiAndG9waWNfZWRpdG9yJyxcbiAgICAgICAgT1RIRVI6ICdvdGhlcidcbiAgICB9O1xuICAgIFNlcnZpY2VzQ29uc3RhbnRzLkVYUExPUkFUSU9OX0VESVRPUl9UQUJfQ09OVEVYVCA9IHtcbiAgICAgICAgRURJVE9SOiAnZWRpdG9yJyxcbiAgICAgICAgUFJFVklFVzogJ3ByZXZpZXcnXG4gICAgfTtcbiAgICBTZXJ2aWNlc0NvbnN0YW50cy5FWFBMT1JBVElPTl9GRUFUVVJFU19VUkwgPSAnL2V4cGxvcmVoYW5kbGVyL2ZlYXR1cmVzLzxleHBsb3JhdGlvbl9pZD4nO1xuICAgIFNlcnZpY2VzQ29uc3RhbnRzLkZFVENIX0lTU1VFU19VUkwgPSAnL2lzc3Vlc2RhdGFoYW5kbGVyLzxleHBsb3JhdGlvbl9pZD4nO1xuICAgIFNlcnZpY2VzQ29uc3RhbnRzLkZFVENIX1BMQVlUSFJPVUdIX1VSTCA9ICcvcGxheXRocm91Z2hkYXRhaGFuZGxlci88ZXhwbG9yYXRpb25faWQ+LzxwbGF5dGhyb3VnaF9pZD4nO1xuICAgIFNlcnZpY2VzQ29uc3RhbnRzLlJFU09MVkVfSVNTVUVfVVJMID0gJy9yZXNvbHZlaXNzdWVoYW5kbGVyLzxleHBsb3JhdGlvbl9pZD4nO1xuICAgIFNlcnZpY2VzQ29uc3RhbnRzLlNUT1JFX1BMQVlUSFJPVUdIX1VSTCA9ICcvZXhwbG9yZWhhbmRsZXIvc3RvcmVfcGxheXRocm91Z2gvPGV4cGxvcmF0aW9uX2lkPic7XG4gICAgLy8gRW5hYmxlcyByZWNvcmRpbmcgcGxheXRocm91Z2hzIGZyb20gbGVhcm5lciBzZXNzaW9ucy5cbiAgICBTZXJ2aWNlc0NvbnN0YW50cy5FQVJMWV9RVUlUX1RIUkVTSE9MRF9JTl9TRUNTID0gNDU7XG4gICAgU2VydmljZXNDb25zdGFudHMuTlVNX0lOQ09SUkVDVF9BTlNXRVJTX1RIUkVTSE9MRCA9IDM7XG4gICAgU2VydmljZXNDb25zdGFudHMuTlVNX1JFUEVBVEVEX0NZQ0xFU19USFJFU0hPTEQgPSAzO1xuICAgIFNlcnZpY2VzQ29uc3RhbnRzLkNVUlJFTlRfQUNUSU9OX1NDSEVNQV9WRVJTSU9OID0gMTtcbiAgICBTZXJ2aWNlc0NvbnN0YW50cy5DVVJSRU5UX0lTU1VFX1NDSEVNQV9WRVJTSU9OID0gMTtcbiAgICAvLyBXaGV0aGVyIHRvIGVuYWJsZSB0aGUgcHJvbW8gYmFyIGZ1bmN0aW9uYWxpdHkuIFRoaXMgZG9lcyBub3QgYWN0dWFsbHkgdHVyblxuICAgIC8vIG9uIHRoZSBwcm9tbyBiYXIsIGFzIHRoYXQgaXMgZ2F0ZWQgYnkgYSBjb25maWcgdmFsdWUgKHNlZSBjb25maWdfZG9tYWluKS5cbiAgICAvLyBUaGlzIG1lcmVseSBhdm9pZHMgY2hlY2tpbmcgZm9yIHdoZXRoZXIgdGhlIHByb21vIGJhciBpcyBlbmFibGVkIGZvciBldmVyeVxuICAgIC8vIE9wcGlhIHBhZ2UgdmlzaXRlZC5cbiAgICBTZXJ2aWNlc0NvbnN0YW50cy5FTkFCTEVfUFJPTU9fQkFSID0gdHJ1ZTtcbiAgICBTZXJ2aWNlc0NvbnN0YW50cy5TRUFSQ0hfREFUQV9VUkwgPSAnL3NlYXJjaGhhbmRsZXIvZGF0YSc7XG4gICAgU2VydmljZXNDb25zdGFudHMuU1RBVEVfQU5TV0VSX1NUQVRTX1VSTCA9ICcvY3JlYXRlaGFuZGxlci9zdGF0ZV9hbnN3ZXJfc3RhdHMvPGV4cGxvcmF0aW9uX2lkPic7XG4gICAgU2VydmljZXNDb25zdGFudHMuUlRFX0NPTVBPTkVOVF9TUEVDUyA9IChyZXF1aXJlKCdyaWNoX3RleHRfY29tcG9uZW50c19kZWZpbml0aW9ucy50cycpKTtcbiAgICByZXR1cm4gU2VydmljZXNDb25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5TZXJ2aWNlc0NvbnN0YW50cyA9IFNlcnZpY2VzQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBlbmFibGluZyBhIGJhY2tncm91bmQgbWFzayB0aGF0IGxlYXZlcyBuYXZpZ2F0aW9uXG4gKiB2aXNpYmxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdCYWNrZ3JvdW5kTWFza1NlcnZpY2UnLCBbXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWFza0lzQWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc01hc2tBY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFza0lzQWN0aXZlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFjdGl2YXRlTWFzazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG1hc2tJc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVhY3RpdmF0ZU1hc2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBtYXNrSXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3Igc2V0dGluZyBmb2N1cy4gVGhpcyBicm9hZGNhc3RzIGEgJ2ZvY3VzT24nIGV2ZW50XG4gKiB3aGljaCBzZXRzIGZvY3VzIHRvIHRoZSBlbGVtZW50IGluIHRoZSBwYWdlIHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgZm9jdXNPblxuICogYXR0cmlidXRlLlxuICogTm90ZTogVGhpcyByZXF1aXJlcyBMQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMgdG8gZXhpc3Qgc29tZXdoZXJlIGluIHRoZSBIVE1MXG4gKiBwYWdlLlxuICovXG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL0RldmljZUluZm9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9JZEdlbmVyYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdGb2N1c01hbmFnZXJTZXJ2aWNlJywgW1xuICAgICckcm9vdFNjb3BlJywgJyR0aW1lb3V0JywgJ0RldmljZUluZm9TZXJ2aWNlJywgJ0lkR2VuZXJhdGlvblNlcnZpY2UnLFxuICAgICdMQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMnLFxuICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkdGltZW91dCwgRGV2aWNlSW5mb1NlcnZpY2UsIElkR2VuZXJhdGlvblNlcnZpY2UsIExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUykge1xuICAgICAgICB2YXIgX25leHRMYWJlbFRvRm9jdXNPbiA9IG51bGw7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjbGVhckZvY3VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRGb2N1cyhMQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldEZvY3VzOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChfbmV4dExhYmVsVG9Gb2N1c09uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX25leHRMYWJlbFRvRm9jdXNPbiA9IG5hbWU7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2ZvY3VzT24nLCBfbmV4dExhYmVsVG9Gb2N1c09uKTtcbiAgICAgICAgICAgICAgICAgICAgX25leHRMYWJlbFRvRm9jdXNPbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0Rm9jdXNJZk9uRGVza3RvcDogZnVuY3Rpb24gKG5ld0ZvY3VzTGFiZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoIURldmljZUluZm9TZXJ2aWNlLmlzTW9iaWxlRGV2aWNlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRGb2N1cyhuZXdGb2N1c0xhYmVsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gR2VuZXJhdGVzIGEgcmFuZG9tIHN0cmluZyAodG8gYmUgdXNlZCBhcyBhIGZvY3VzIGxhYmVsKS5cbiAgICAgICAgICAgIGdlbmVyYXRlRm9jdXNMYWJlbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBJZEdlbmVyYXRpb25TZXJ2aWNlLmdlbmVyYXRlTmV3SWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsImZ1bmN0aW9uIHdlYnBhY2tFbXB0eUFzeW5jQ29udGV4dChyZXEpIHtcblx0Ly8gSGVyZSBQcm9taXNlLnJlc29sdmUoKS50aGVuKCkgaXMgdXNlZCBpbnN0ZWFkIG9mIG5ldyBQcm9taXNlKCkgdG8gcHJldmVudFxuXHQvLyB1bmNhdWdodCBleGNlcHRpb24gcG9wcGluZyB1cCBpbiBkZXZ0b29sc1xuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyByZXEgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH0pO1xufVxud2VicGFja0VtcHR5QXN5bmNDb250ZXh0LmtleXMgPSBmdW5jdGlvbigpIHsgcmV0dXJuIFtdOyB9O1xud2VicGFja0VtcHR5QXN5bmNDb250ZXh0LnJlc29sdmUgPSB3ZWJwYWNrRW1wdHlBc3luY0NvbnRleHQ7XG5tb2R1bGUuZXhwb3J0cyA9IHdlYnBhY2tFbXB0eUFzeW5jQ29udGV4dDtcbndlYnBhY2tFbXB0eUFzeW5jQ29udGV4dC5pZCA9IFwiLi9ub2RlX21vZHVsZXMvQGFuZ3VsYXIvY29yZS9mZXNtNSBsYXp5IHJlY3Vyc2l2ZVwiOyJdLCJzb3VyY2VSb290IjoiIn0=