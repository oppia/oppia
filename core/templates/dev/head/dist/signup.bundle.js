/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"signup": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/signup-page/signup-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/pages/signup-page/signup-page.controller.ts":
/*!*****************************************************************************!*\
  !*** ./core/templates/dev/head/pages/signup-page/signup-page.controller.ts ***!
  \*****************************************************************************/
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
 * @fileoverview Data and controllers for the Oppia profile page.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/IdGenerationService.ts */ "./core/templates/dev/head/services/IdGenerationService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/stateful/FocusManagerService.ts */ "./core/templates/dev/head/services/stateful/FocusManagerService.ts");
angular.module('signupPageModule').controller('Signup', [
    '$http', '$rootScope', '$scope', '$uibModal', 'AlertsService',
    'FocusManagerService',
    'SiteAnalyticsService', 'UrlInterpolationService', 'UrlService',
    'SITE_NAME',
    function ($http, $rootScope, $scope, $uibModal, AlertsService, FocusManagerService, SiteAnalyticsService, UrlInterpolationService, UrlService, SITE_NAME) {
        var _SIGNUP_DATA_URL = '/signuphandler/data';
        $rootScope.loadingMessage = 'I18N_SIGNUP_LOADING';
        $scope.warningI18nCode = '';
        $scope.siteName = SITE_NAME;
        $scope.submissionInProcess = false;
        $http.get(_SIGNUP_DATA_URL).then(function (response) {
            var data = response.data;
            $rootScope.loadingMessage = '';
            $scope.username = data.username;
            $scope.hasEverRegistered = data.has_ever_registered;
            $scope.hasAgreedToLatestTerms = data.has_agreed_to_latest_terms;
            $scope.showEmailPreferencesForm = data.can_send_emails;
            $scope.hasUsername = Boolean($scope.username);
            FocusManagerService.setFocus('usernameInputField');
        });
        $scope.blurredAtLeastOnce = false;
        $scope.canReceiveEmailUpdates = null;
        $scope.isFormValid = function () {
            return ($scope.hasAgreedToLatestTerms &&
                ($scope.hasUsername || !$scope.getWarningText($scope.username)));
        };
        $scope.showLicenseExplanationModal = function () {
            $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/signup-page/signup-page-templates/' +
                    'licence-explanation-modal.template.directive.html'),
                backdrop: true,
                resolve: {},
                controller: [
                    '$scope', '$uibModalInstance', 'SITE_NAME',
                    function ($scope, $uibModalInstance, SITE_NAME) {
                        $scope.siteName = SITE_NAME;
                        $scope.close = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                ]
            });
        };
        $scope.onUsernameInputFormBlur = function (username) {
            if ($scope.hasUsername) {
                return;
            }
            AlertsService.clearWarnings();
            $scope.blurredAtLeastOnce = true;
            $scope.updateWarningText(username);
            if (!$scope.warningI18nCode) {
                $http.post('usernamehandler/data', {
                    username: $scope.username
                }).then(function (response) {
                    if (response.data.username_is_taken) {
                        $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_TAKEN';
                    }
                });
            }
        };
        // Returns the warning text corresponding to the validation error for the
        // given username, or an empty string if the username is valid.
        $scope.updateWarningText = function (username) {
            var alphanumeric = /^[A-Za-z0-9]+$/;
            var admin = /admin/i;
            var oppia = /oppia/i;
            if (!username) {
                $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_NO_USERNAME';
            }
            else if (username.indexOf(' ') !== -1) {
                $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_WITH_SPACES';
            }
            else if (username.length > 50) {
                $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_MORE_50_CHARS';
            }
            else if (!alphanumeric.test(username)) {
                $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_ONLY_ALPHANUM';
            }
            else if (admin.test(username)) {
                $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_WITH_ADMIN';
            }
            else if (oppia.test(username)) {
                $scope.warningI18nCode = 'I18N_SIGNUP_ERROR_USERNAME_NOT_AVAILABLE';
            }
            else {
                $scope.warningI18nCode = '';
            }
        };
        $scope.onSelectEmailPreference = function () {
            $scope.emailPreferencesWarningText = '';
        };
        $scope.submitPrerequisitesForm = function (agreedToTerms, username, canReceiveEmailUpdates) {
            if (!agreedToTerms) {
                AlertsService.addWarning('I18N_SIGNUP_ERROR_MUST_AGREE_TO_TERMS');
                return;
            }
            if (!$scope.hasUsername && $scope.warningI18nCode) {
                return;
            }
            var defaultDashboard = constants.DASHBOARD_TYPE_LEARNER;
            var returnUrl = window.decodeURIComponent(UrlService.getUrlParams().return_url);
            if (returnUrl.indexOf('creator_dashboard') !== -1) {
                defaultDashboard = constants.DASHBOARD_TYPE_CREATOR;
            }
            else {
                defaultDashboard = constants.DASHBOARD_TYPE_LEARNER;
            }
            var requestParams = {
                agreed_to_terms: agreedToTerms,
                can_receive_email_updates: null,
                default_dashboard: defaultDashboard,
                username: null
            };
            if (!$scope.hasUsername) {
                requestParams.username = username;
            }
            if (GLOBALS.CAN_SEND_EMAILS && !$scope.hasUsername) {
                if (canReceiveEmailUpdates === null) {
                    $scope.emailPreferencesWarningText = 'I18N_SIGNUP_FIELD_REQUIRED';
                    return;
                }
                if (canReceiveEmailUpdates === 'yes') {
                    requestParams.can_receive_email_updates = true;
                }
                else if (canReceiveEmailUpdates === 'no') {
                    requestParams.can_receive_email_updates = false;
                }
                else {
                    throw Error('Invalid value for email preferences: ' + canReceiveEmailUpdates);
                }
            }
            SiteAnalyticsService.registerNewSignupEvent();
            $scope.submissionInProcess = true;
            $http.post(_SIGNUP_DATA_URL, requestParams).then(function () {
                window.location = window.decodeURIComponent(UrlService.getUrlParams().return_url);
            }, function (rejection) {
                if (rejection.data && rejection.data.status_code === 401) {
                    $scope.showRegistrationSessionExpiredModal();
                }
                $scope.submissionInProcess = false;
            });
        };
        $scope.showRegistrationSessionExpiredModal = function () {
            $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/signup-page/signup-page-templates/' +
                    'registration-session-expired-modal.template.html'),
                backdrop: 'static',
                keyboard: false,
                resolve: {},
                controller: [
                    '$scope', '$uibModalInstance', 'SiteAnalyticsService',
                    'UserService', '$timeout', '$window',
                    function ($scope, $uibModalInstance, SiteAnalyticsService, UserService, $timeout, $window) {
                        $scope.continueRegistration = function () {
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
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                ]
            });
        };
    }
]);


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
oppia.factory('IdGenerationService', [function () {
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
oppia.factory('SiteAnalyticsService', ['$window', function ($window) {
        var CAN_SEND_ANALYTICS_EVENTS = constants.CAN_SEND_ANALYTICS_EVENTS;
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
            },
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/UserService.ts":
/*!*********************************************************!*\
  !*** ./core/templates/dev/head/services/UserService.ts ***!
  \*********************************************************/
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
 * @fileoverview Service for user data.
 */
oppia.factory('UserService', [
    '$http', '$q', '$window', 'UrlInterpolationService', 'UserInfoObjectFactory',
    'DEFAULT_PROFILE_IMAGE_PATH',
    function ($http, $q, $window, UrlInterpolationService, UserInfoObjectFactory, DEFAULT_PROFILE_IMAGE_PATH) {
        var PREFERENCES_DATA_URL = '/preferenceshandler/data';
        var userInfo = null;
        var getUserInfoAsync = function () {
            if (GLOBALS.userIsLoggedIn) {
                if (userInfo) {
                    return $q.resolve(userInfo);
                }
                return $http.get('/userinfohandler').then(function (response) {
                    userInfo = UserInfoObjectFactory.createFromBackendDict(response.data);
                    return userInfo;
                });
            }
            else {
                return $q.resolve(UserInfoObjectFactory.createDefault());
            }
        };
        return {
            getProfileImageDataUrlAsync: function () {
                var profilePictureDataUrl = (UrlInterpolationService.getStaticImageUrl(DEFAULT_PROFILE_IMAGE_PATH));
                if (GLOBALS.userIsLoggedIn) {
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
oppia.factory('UrlService', ['$window', function ($window) {
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
            // Topic id should be correctly returned from topic editor as well as
            // story editor, since both have topic id in their url.
            getTopicIdFromUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(story|topic)_editor\/(\w|-){12}/g)) {
                    return pathname.split('/')[2];
                }
                throw Error('Invalid topic id url');
            },
            getTopicNameFromLearnerUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(story|topic|practice_session)/g)) {
                    return decodeURIComponent(pathname.split('/')[2]);
                }
                throw Error('Invalid URL for topic');
            },
            getStoryIdFromUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/story_editor(\/(\w|-){12}){2}/g)) {
                    return pathname.split('/')[3];
                }
                throw Error('Invalid story id url');
            },
            getStoryIdInPlayer: function () {
                var query = this.getCurrentQueryString();
                if (query.match(/\?story_id=((\w|-){12})/g)) {
                    return query.split('=')[1];
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
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/stateful/FocusManagerService.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/services/stateful/FocusManagerService.ts ***!
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
 * @fileoverview Service for setting focus. This broadcasts a 'focusOn' event
 * which sets focus to the element in the page with the corresponding focusOn
 * attribute.
 * Note: This requires LABEL_FOR_CLEARING_FOCUS to exist somewhere in the HTML
 * page.
 */
oppia.factory('FocusManagerService', [
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


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc2lnbnVwLXBhZ2Uvc2lnbnVwLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9JZEdlbmVyYXRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1VzZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9zdGF0ZWZ1bC9Gb2N1c01hbmFnZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esa0RBQTBDLGdDQUFnQztBQUMxRTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdFQUF3RCxrQkFBa0I7QUFDMUU7QUFDQSx5REFBaUQsY0FBYztBQUMvRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQXlDLGlDQUFpQztBQUMxRSx3SEFBZ0gsbUJBQW1CLEVBQUU7QUFDckk7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUFnQix1QkFBdUI7QUFDdkM7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQyxtQkFBTyxDQUFDLGtHQUFpQztBQUN6QyxtQkFBTyxDQUFDLG9HQUFrQztBQUMxQyxtQkFBTyxDQUFDLGtGQUF5QjtBQUNqQyxtQkFBTyxDQUFDLHNHQUFtQztBQUMzQyxtQkFBTyxDQUFDLG9IQUEwQztBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkI7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkI7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDNUJMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQzVLTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0Qsd0JBQXdCO0FBQzFFO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRSxHQUFHO0FBQ3RFO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLDREQUE0RCxHQUFHLEVBQUUsRUFBRTtBQUNuRTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLG9EQUFvRCxHQUFHO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLHVCQUF1QjtBQUMxRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUMzR0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic2lnbnVwLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIGluc3RhbGwgYSBKU09OUCBjYWxsYmFjayBmb3IgY2h1bmsgbG9hZGluZ1xuIFx0ZnVuY3Rpb24gd2VicGFja0pzb25wQ2FsbGJhY2soZGF0YSkge1xuIFx0XHR2YXIgY2h1bmtJZHMgPSBkYXRhWzBdO1xuIFx0XHR2YXIgbW9yZU1vZHVsZXMgPSBkYXRhWzFdO1xuIFx0XHR2YXIgZXhlY3V0ZU1vZHVsZXMgPSBkYXRhWzJdO1xuXG4gXHRcdC8vIGFkZCBcIm1vcmVNb2R1bGVzXCIgdG8gdGhlIG1vZHVsZXMgb2JqZWN0LFxuIFx0XHQvLyB0aGVuIGZsYWcgYWxsIFwiY2h1bmtJZHNcIiBhcyBsb2FkZWQgYW5kIGZpcmUgY2FsbGJhY2tcbiBcdFx0dmFyIG1vZHVsZUlkLCBjaHVua0lkLCBpID0gMCwgcmVzb2x2ZXMgPSBbXTtcbiBcdFx0Zm9yKDtpIDwgY2h1bmtJZHMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHRjaHVua0lkID0gY2h1bmtJZHNbaV07XG4gXHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG4gXHRcdFx0XHRyZXNvbHZlcy5wdXNoKGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSk7XG4gXHRcdFx0fVxuIFx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IDA7XG4gXHRcdH1cbiBcdFx0Zm9yKG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG4gXHRcdFx0aWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcbiBcdFx0XHRcdG1vZHVsZXNbbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRpZihwYXJlbnRKc29ucEZ1bmN0aW9uKSBwYXJlbnRKc29ucEZ1bmN0aW9uKGRhdGEpO1xuXG4gXHRcdHdoaWxlKHJlc29sdmVzLmxlbmd0aCkge1xuIFx0XHRcdHJlc29sdmVzLnNoaWZ0KCkoKTtcbiBcdFx0fVxuXG4gXHRcdC8vIGFkZCBlbnRyeSBtb2R1bGVzIGZyb20gbG9hZGVkIGNodW5rIHRvIGRlZmVycmVkIGxpc3RcbiBcdFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2guYXBwbHkoZGVmZXJyZWRNb2R1bGVzLCBleGVjdXRlTW9kdWxlcyB8fCBbXSk7XG5cbiBcdFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiBhbGwgY2h1bmtzIHJlYWR5XG4gXHRcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIFx0fTtcbiBcdGZ1bmN0aW9uIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCkge1xuIFx0XHR2YXIgcmVzdWx0O1xuIFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWRNb2R1bGVzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0dmFyIGRlZmVycmVkTW9kdWxlID0gZGVmZXJyZWRNb2R1bGVzW2ldO1xuIFx0XHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuIFx0XHRcdGZvcih2YXIgaiA9IDE7IGogPCBkZWZlcnJlZE1vZHVsZS5sZW5ndGg7IGorKykge1xuIFx0XHRcdFx0dmFyIGRlcElkID0gZGVmZXJyZWRNb2R1bGVbal07XG4gXHRcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbZGVwSWRdICE9PSAwKSBmdWxmaWxsZWQgPSBmYWxzZTtcbiBcdFx0XHR9XG4gXHRcdFx0aWYoZnVsZmlsbGVkKSB7XG4gXHRcdFx0XHRkZWZlcnJlZE1vZHVsZXMuc3BsaWNlKGktLSwgMSk7XG4gXHRcdFx0XHRyZXN1bHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IGRlZmVycmVkTW9kdWxlWzBdKTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0cmV0dXJuIHJlc3VsdDtcbiBcdH1cblxuIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3NcbiBcdC8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuIFx0Ly8gUHJvbWlzZSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbiBcdHZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG4gXHRcdFwic2lnbnVwXCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zaWdudXAtcGFnZS9zaWdudXAtcGFnZS5jb250cm9sbGVyLnRzXCIsXCJhYm91dH5hZG1pbn5hcHB+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2FyZH5kb25hdGV+ZW1haWxfZGFzaGJvYXJkfmMxZTUwY2MwXCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEYXRhIGFuZCBjb250cm9sbGVycyBmb3IgdGhlIE9wcGlhIHByb2ZpbGUgcGFnZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSWRHZW5lcmF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU2l0ZUFuYWx5dGljc1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1VzZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL3N0YXRlZnVsL0ZvY3VzTWFuYWdlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzaWdudXBQYWdlTW9kdWxlJykuY29udHJvbGxlcignU2lnbnVwJywgW1xuICAgICckaHR0cCcsICckcm9vdFNjb3BlJywgJyRzY29wZScsICckdWliTW9kYWwnLCAnQWxlcnRzU2VydmljZScsXG4gICAgJ0ZvY3VzTWFuYWdlclNlcnZpY2UnLFxuICAgICdTaXRlQW5hbHl0aWNzU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdVcmxTZXJ2aWNlJyxcbiAgICAnU0lURV9OQU1FJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRyb290U2NvcGUsICRzY29wZSwgJHVpYk1vZGFsLCBBbGVydHNTZXJ2aWNlLCBGb2N1c01hbmFnZXJTZXJ2aWNlLCBTaXRlQW5hbHl0aWNzU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFVybFNlcnZpY2UsIFNJVEVfTkFNRSkge1xuICAgICAgICB2YXIgX1NJR05VUF9EQVRBX1VSTCA9ICcvc2lnbnVwaGFuZGxlci9kYXRhJztcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdJMThOX1NJR05VUF9MT0FESU5HJztcbiAgICAgICAgJHNjb3BlLndhcm5pbmdJMThuQ29kZSA9ICcnO1xuICAgICAgICAkc2NvcGUuc2l0ZU5hbWUgPSBTSVRFX05BTUU7XG4gICAgICAgICRzY29wZS5zdWJtaXNzaW9uSW5Qcm9jZXNzID0gZmFsc2U7XG4gICAgICAgICRodHRwLmdldChfU0lHTlVQX0RBVEFfVVJMKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgJHNjb3BlLnVzZXJuYW1lID0gZGF0YS51c2VybmFtZTtcbiAgICAgICAgICAgICRzY29wZS5oYXNFdmVyUmVnaXN0ZXJlZCA9IGRhdGEuaGFzX2V2ZXJfcmVnaXN0ZXJlZDtcbiAgICAgICAgICAgICRzY29wZS5oYXNBZ3JlZWRUb0xhdGVzdFRlcm1zID0gZGF0YS5oYXNfYWdyZWVkX3RvX2xhdGVzdF90ZXJtcztcbiAgICAgICAgICAgICRzY29wZS5zaG93RW1haWxQcmVmZXJlbmNlc0Zvcm0gPSBkYXRhLmNhbl9zZW5kX2VtYWlscztcbiAgICAgICAgICAgICRzY29wZS5oYXNVc2VybmFtZSA9IEJvb2xlYW4oJHNjb3BlLnVzZXJuYW1lKTtcbiAgICAgICAgICAgIEZvY3VzTWFuYWdlclNlcnZpY2Uuc2V0Rm9jdXMoJ3VzZXJuYW1lSW5wdXRGaWVsZCcpO1xuICAgICAgICB9KTtcbiAgICAgICAgJHNjb3BlLmJsdXJyZWRBdExlYXN0T25jZSA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUuY2FuUmVjZWl2ZUVtYWlsVXBkYXRlcyA9IG51bGw7XG4gICAgICAgICRzY29wZS5pc0Zvcm1WYWxpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoJHNjb3BlLmhhc0FncmVlZFRvTGF0ZXN0VGVybXMgJiZcbiAgICAgICAgICAgICAgICAoJHNjb3BlLmhhc1VzZXJuYW1lIHx8ICEkc2NvcGUuZ2V0V2FybmluZ1RleHQoJHNjb3BlLnVzZXJuYW1lKSkpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2hvd0xpY2Vuc2VFeHBsYW5hdGlvbk1vZGFsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3NpZ251cC1wYWdlL3NpZ251cC1wYWdlLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgJ2xpY2VuY2UtZXhwbGFuYXRpb24tbW9kYWwudGVtcGxhdGUuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICByZXNvbHZlOiB7fSxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLCAnU0lURV9OQU1FJyxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UsIFNJVEVfTkFNRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNpdGVOYW1lID0gU0lURV9OQU1FO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUub25Vc2VybmFtZUlucHV0Rm9ybUJsdXIgPSBmdW5jdGlvbiAodXNlcm5hbWUpIHtcbiAgICAgICAgICAgIGlmICgkc2NvcGUuaGFzVXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICRzY29wZS5ibHVycmVkQXRMZWFzdE9uY2UgPSB0cnVlO1xuICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZVdhcm5pbmdUZXh0KHVzZXJuYW1lKTtcbiAgICAgICAgICAgIGlmICghJHNjb3BlLndhcm5pbmdJMThuQ29kZSkge1xuICAgICAgICAgICAgICAgICRodHRwLnBvc3QoJ3VzZXJuYW1laGFuZGxlci9kYXRhJywge1xuICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogJHNjb3BlLnVzZXJuYW1lXG4gICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEudXNlcm5hbWVfaXNfdGFrZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS53YXJuaW5nSTE4bkNvZGUgPSAnSTE4Tl9TSUdOVVBfRVJST1JfVVNFUk5BTUVfVEFLRU4nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgdGhlIHdhcm5pbmcgdGV4dCBjb3JyZXNwb25kaW5nIHRvIHRoZSB2YWxpZGF0aW9uIGVycm9yIGZvciB0aGVcbiAgICAgICAgLy8gZ2l2ZW4gdXNlcm5hbWUsIG9yIGFuIGVtcHR5IHN0cmluZyBpZiB0aGUgdXNlcm5hbWUgaXMgdmFsaWQuXG4gICAgICAgICRzY29wZS51cGRhdGVXYXJuaW5nVGV4dCA9IGZ1bmN0aW9uICh1c2VybmFtZSkge1xuICAgICAgICAgICAgdmFyIGFscGhhbnVtZXJpYyA9IC9eW0EtWmEtejAtOV0rJC87XG4gICAgICAgICAgICB2YXIgYWRtaW4gPSAvYWRtaW4vaTtcbiAgICAgICAgICAgIHZhciBvcHBpYSA9IC9vcHBpYS9pO1xuICAgICAgICAgICAgaWYgKCF1c2VybmFtZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS53YXJuaW5nSTE4bkNvZGUgPSAnSTE4Tl9TSUdOVVBfRVJST1JfTk9fVVNFUk5BTUUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodXNlcm5hbWUuaW5kZXhPZignICcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICRzY29wZS53YXJuaW5nSTE4bkNvZGUgPSAnSTE4Tl9TSUdOVVBfRVJST1JfVVNFUk5BTUVfV0lUSF9TUEFDRVMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodXNlcm5hbWUubGVuZ3RoID4gNTApIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUud2FybmluZ0kxOG5Db2RlID0gJ0kxOE5fU0lHTlVQX0VSUk9SX1VTRVJOQU1FX01PUkVfNTBfQ0hBUlMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIWFscGhhbnVtZXJpYy50ZXN0KHVzZXJuYW1lKSkge1xuICAgICAgICAgICAgICAgICRzY29wZS53YXJuaW5nSTE4bkNvZGUgPSAnSTE4Tl9TSUdOVVBfRVJST1JfVVNFUk5BTUVfT05MWV9BTFBIQU5VTSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhZG1pbi50ZXN0KHVzZXJuYW1lKSkge1xuICAgICAgICAgICAgICAgICRzY29wZS53YXJuaW5nSTE4bkNvZGUgPSAnSTE4Tl9TSUdOVVBfRVJST1JfVVNFUk5BTUVfV0lUSF9BRE1JTic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChvcHBpYS50ZXN0KHVzZXJuYW1lKSkge1xuICAgICAgICAgICAgICAgICRzY29wZS53YXJuaW5nSTE4bkNvZGUgPSAnSTE4Tl9TSUdOVVBfRVJST1JfVVNFUk5BTUVfTk9UX0FWQUlMQUJMRSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUud2FybmluZ0kxOG5Db2RlID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5vblNlbGVjdEVtYWlsUHJlZmVyZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lbWFpbFByZWZlcmVuY2VzV2FybmluZ1RleHQgPSAnJztcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnN1Ym1pdFByZXJlcXVpc2l0ZXNGb3JtID0gZnVuY3Rpb24gKGFncmVlZFRvVGVybXMsIHVzZXJuYW1lLCBjYW5SZWNlaXZlRW1haWxVcGRhdGVzKSB7XG4gICAgICAgICAgICBpZiAoIWFncmVlZFRvVGVybXMpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0kxOE5fU0lHTlVQX0VSUk9SX01VU1RfQUdSRUVfVE9fVEVSTVMnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoISRzY29wZS5oYXNVc2VybmFtZSAmJiAkc2NvcGUud2FybmluZ0kxOG5Db2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRlZmF1bHREYXNoYm9hcmQgPSBjb25zdGFudHMuREFTSEJPQVJEX1RZUEVfTEVBUk5FUjtcbiAgICAgICAgICAgIHZhciByZXR1cm5VcmwgPSB3aW5kb3cuZGVjb2RlVVJJQ29tcG9uZW50KFVybFNlcnZpY2UuZ2V0VXJsUGFyYW1zKCkucmV0dXJuX3VybCk7XG4gICAgICAgICAgICBpZiAocmV0dXJuVXJsLmluZGV4T2YoJ2NyZWF0b3JfZGFzaGJvYXJkJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgZGVmYXVsdERhc2hib2FyZCA9IGNvbnN0YW50cy5EQVNIQk9BUkRfVFlQRV9DUkVBVE9SO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVmYXVsdERhc2hib2FyZCA9IGNvbnN0YW50cy5EQVNIQk9BUkRfVFlQRV9MRUFSTkVSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJlcXVlc3RQYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgYWdyZWVkX3RvX3Rlcm1zOiBhZ3JlZWRUb1Rlcm1zLFxuICAgICAgICAgICAgICAgIGNhbl9yZWNlaXZlX2VtYWlsX3VwZGF0ZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgZGVmYXVsdF9kYXNoYm9hcmQ6IGRlZmF1bHREYXNoYm9hcmQsXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IG51bGxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoISRzY29wZS5oYXNVc2VybmFtZSkge1xuICAgICAgICAgICAgICAgIHJlcXVlc3RQYXJhbXMudXNlcm5hbWUgPSB1c2VybmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChHTE9CQUxTLkNBTl9TRU5EX0VNQUlMUyAmJiAhJHNjb3BlLmhhc1VzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhblJlY2VpdmVFbWFpbFVwZGF0ZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVtYWlsUHJlZmVyZW5jZXNXYXJuaW5nVGV4dCA9ICdJMThOX1NJR05VUF9GSUVMRF9SRVFVSVJFRCc7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNhblJlY2VpdmVFbWFpbFVwZGF0ZXMgPT09ICd5ZXMnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RQYXJhbXMuY2FuX3JlY2VpdmVfZW1haWxfdXBkYXRlcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNhblJlY2VpdmVFbWFpbFVwZGF0ZXMgPT09ICdubycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdFBhcmFtcy5jYW5fcmVjZWl2ZV9lbWFpbF91cGRhdGVzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCB2YWx1ZSBmb3IgZW1haWwgcHJlZmVyZW5jZXM6ICcgKyBjYW5SZWNlaXZlRW1haWxVcGRhdGVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBTaXRlQW5hbHl0aWNzU2VydmljZS5yZWdpc3Rlck5ld1NpZ251cEV2ZW50KCk7XG4gICAgICAgICAgICAkc2NvcGUuc3VibWlzc2lvbkluUHJvY2VzcyA9IHRydWU7XG4gICAgICAgICAgICAkaHR0cC5wb3N0KF9TSUdOVVBfREFUQV9VUkwsIHJlcXVlc3RQYXJhbXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHdpbmRvdy5kZWNvZGVVUklDb21wb25lbnQoVXJsU2VydmljZS5nZXRVcmxQYXJhbXMoKS5yZXR1cm5fdXJsKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChyZWplY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAocmVqZWN0aW9uLmRhdGEgJiYgcmVqZWN0aW9uLmRhdGEuc3RhdHVzX2NvZGUgPT09IDQwMSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2hvd1JlZ2lzdHJhdGlvblNlc3Npb25FeHBpcmVkTW9kYWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN1Ym1pc3Npb25JblByb2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2hvd1JlZ2lzdHJhdGlvblNlc3Npb25FeHBpcmVkTW9kYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvc2lnbnVwLXBhZ2Uvc2lnbnVwLXBhZ2UtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAncmVnaXN0cmF0aW9uLXNlc3Npb24tZXhwaXJlZC1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgICAgICAgIGtleWJvYXJkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZXNvbHZlOiB7fSxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLCAnU2l0ZUFuYWx5dGljc1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICAgICAnVXNlclNlcnZpY2UnLCAnJHRpbWVvdXQnLCAnJHdpbmRvdycsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlLCBTaXRlQW5hbHl0aWNzU2VydmljZSwgVXNlclNlcnZpY2UsICR0aW1lb3V0LCAkd2luZG93KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29udGludWVSZWdpc3RyYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVXNlclNlcnZpY2UuZ2V0TG9naW5VcmxBc3luYygpLnRoZW4oZnVuY3Rpb24gKGxvZ2luVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2dpblVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24gPSBsb2dpblVybDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDE1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignTG9naW4gdXJsIG5vdCBmb3VuZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBnZW5lcmF0aW5nIHJhbmRvbSBJRHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0lkR2VuZXJhdGlvblNlcnZpY2UnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2VuZXJhdGVOZXdJZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlcyByYW5kb20gc3RyaW5nIHVzaW5nIHRoZSBsYXN0IDEwIGRpZ2l0cyBvZlxuICAgICAgICAgICAgICAgIC8vIHRoZSBzdHJpbmcgZm9yIGJldHRlciBlbnRyb3B5LlxuICAgICAgICAgICAgICAgIHZhciByYW5kb21TdHJpbmcgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAocmFuZG9tU3RyaW5nLmxlbmd0aCA8IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJhbmRvbVN0cmluZyA9IHJhbmRvbVN0cmluZyArICcwJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhbmRvbVN0cmluZy5zbGljZSgtMTApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlcyBmb3IgZXhwbG9yYXRpb25zIHdoaWNoIG1heSBiZSBzaGFyZWQgYnkgYm90aFxuICogdGhlIGxlYXJuZXIgYW5kIGVkaXRvciB2aWV3cy5cbiAqL1xuLy8gU2VydmljZSBmb3Igc2VuZGluZyBldmVudHMgdG8gR29vZ2xlIEFuYWx5dGljcy5cbi8vXG4vLyBOb3RlIHRoYXQgZXZlbnRzIGFyZSBvbmx5IHNlbnQgaWYgdGhlIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMgZmxhZyBpc1xuLy8gdHVybmVkIG9uLiBUaGlzIGZsYWcgbXVzdCBiZSB0dXJuZWQgb24gZXhwbGljaXRseSBieSB0aGUgYXBwbGljYXRpb25cbi8vIG93bmVyIGluIGZlY29uZi5weS5cbm9wcGlhLmZhY3RvcnkoJ1NpdGVBbmFseXRpY3NTZXJ2aWNlJywgWyckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgdmFyIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMgPSBjb25zdGFudHMuQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUztcbiAgICAgICAgLy8gRm9yIGRlZmluaXRpb25zIG9mIHRoZSB2YXJpb3VzIGFyZ3VtZW50cywgcGxlYXNlIHNlZTpcbiAgICAgICAgLy8gZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9ldmVudHNcbiAgICAgICAgdmFyIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcyA9IGZ1bmN0aW9uIChldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCkge1xuICAgICAgICAgICAgaWYgKCR3aW5kb3cuZ2EgJiYgQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUykge1xuICAgICAgICAgICAgICAgICR3aW5kb3cuZ2EoJ3NlbmQnLCAnZXZlbnQnLCBldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIEZvciBkZWZpbml0aW9ucyBvZiB0aGUgdmFyaW91cyBhcmd1bWVudHMsIHBsZWFzZSBzZWU6XG4gICAgICAgIC8vIGRldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvXG4gICAgICAgIC8vICAgc29jaWFsLWludGVyYWN0aW9uc1xuICAgICAgICB2YXIgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzID0gZnVuY3Rpb24gKG5ldHdvcmssIGFjdGlvbiwgdGFyZ2V0VXJsKSB7XG4gICAgICAgICAgICBpZiAoJHdpbmRvdy5nYSAmJiBDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5nYSgnc2VuZCcsICdzb2NpYWwnLCBuZXR3b3JrLCBhY3Rpb24sIHRhcmdldFVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBUaGUgc3JjRWxlbWVudCByZWZlcnMgdG8gdGhlIGVsZW1lbnQgb24gdGhlIHBhZ2UgdGhhdCBpcyBjbGlja2VkLlxuICAgICAgICAgICAgcmVnaXN0ZXJTdGFydExvZ2luRXZlbnQ6IGZ1bmN0aW9uIChzcmNFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdMb2dpbkJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnICcgKyBzcmNFbGVtZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld1NpZ251cEV2ZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTaWdudXBCdXR0b24nLCAnY2xpY2snLCAnJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDbGlja0Jyb3dzZUxpYnJhcnlCdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQnJvd3NlTGlicmFyeUJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyR29Ub0RvbmF0aW9uU2l0ZUV2ZW50OiBmdW5jdGlvbiAoZG9uYXRpb25TaXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnR29Ub0RvbmF0aW9uU2l0ZScsICdjbGljaycsIGRvbmF0aW9uU2l0ZU5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQXBwbHlUb1RlYWNoV2l0aE9wcGlhRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0FwcGx5VG9UZWFjaFdpdGhPcHBpYScsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrQ3JlYXRlRXhwbG9yYXRpb25CdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ3JlYXRlRXhwbG9yYXRpb25CdXR0b24nLCAnY2xpY2snLCAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbicsICdjcmVhdGUnLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uSW5Db2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbkZyb21Db2xsZWN0aW9uJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ3JlYXRlTmV3Q29sbGVjdGlvbkV2ZW50OiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdDb2xsZWN0aW9uJywgJ2NyZWF0ZScsIGNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDb21taXRDaGFuZ2VzVG9Qcml2YXRlRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHJpdmF0ZUV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJTaGFyZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2hhcmVDb2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlbkVtYmVkSW5mb0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRW1iZWRJbmZvTW9kYWwnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29tbWl0Q2hhbmdlc1RvUHVibGljRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHVibGljRXhwbG9yYXRpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBNZXRyaWNzIGZvciB0dXRvcmlhbCBvbiBmaXJzdCBjcmVhdGluZyBleHBsb3JhdGlvblxuICAgICAgICAgICAgcmVnaXN0ZXJUdXRvcmlhbE1vZGFsT3BlbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVHV0b3JpYWxNb2RhbE9wZW4nLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRGVjbGluZVR1dG9yaWFsTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0RlY2xpbmVUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJBY2NlcHRUdXRvcmlhbE1vZGFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdBY2NlcHRUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgdmlzaXRpbmcgdGhlIGhlbHAgY2VudGVyXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrSGVscEJ1dHRvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tIZWxwQnV0dG9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdEhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1Zpc2l0SGVscENlbnRlcicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlblR1dG9yaWFsRnJvbUhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5UdXRvcmlhbEZyb21IZWxwQ2VudGVyJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgZXhpdGluZyB0aGUgdHV0b3JpYWxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2tpcFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTa2lwVHV0b3JpYWwnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaW5pc2hUdXRvcmlhbCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIGZpcnN0IHRpbWUgZWRpdG9yIHVzZVxuICAgICAgICAgICAgcmVnaXN0ZXJFZGl0b3JGaXJzdEVudHJ5RXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdEVudGVyRWRpdG9yJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0T3BlbkNvbnRlbnRCb3hFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0T3BlbkNvbnRlbnRCb3gnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlQ29udGVudEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RTYXZlQ29udGVudCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RDbGlja0FkZEludGVyYWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENsaWNrQWRkSW50ZXJhY3Rpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0U2VsZWN0SW50ZXJhY3Rpb25UeXBlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNlbGVjdEludGVyYWN0aW9uVHlwZScsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlSW50ZXJhY3Rpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0U2F2ZUludGVyYWN0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdFNhdmVSdWxlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNhdmVSdWxlJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdENyZWF0ZVNlY29uZFN0YXRlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENyZWF0ZVNlY29uZFN0YXRlJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIHB1Ymxpc2hpbmcgZXhwbG9yYXRpb25zXG4gICAgICAgICAgICByZWdpc3RlclNhdmVQbGF5YWJsZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUGxheWFibGVFeHBsb3JhdGlvbicsICdzYXZlJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPcGVuUHVibGlzaEV4cGxvcmF0aW9uTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1B1Ymxpc2hFeHBsb3JhdGlvbk1vZGFsJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclB1Ymxpc2hFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUHVibGlzaEV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdE9wcGlhRnJvbUlmcmFtZUV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVmlzaXRPcHBpYUZyb21JZnJhbWUnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld0NhcmQ6IGZ1bmN0aW9uIChjYXJkTnVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhcmROdW0gPD0gMTAgfHwgY2FyZE51bSAlIDEwID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUGxheWVyTmV3Q2FyZCcsICdjbGljaycsIGNhcmROdW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaEV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdQbGF5ZXJGaW5pc2hFeHBsb3JhdGlvbicsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9wZW5Db2xsZWN0aW9uRnJvbUxhbmRpbmdQYWdlRXZlbnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5GcmFjdGlvbnNGcm9tTGFuZGluZ1BhZ2UnLCAnY2xpY2snLCBjb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3Rld2FyZHNMYW5kaW5nUGFnZUV2ZW50OiBmdW5jdGlvbiAodmlld2VyVHlwZSwgYnV0dG9uVGV4dCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tCdXR0b25PblN0ZXdhcmRzUGFnZScsICdjbGljaycsIHZpZXdlclR5cGUgKyAnOicgKyBidXR0b25UZXh0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclNhdmVSZWNvcmRlZEF1ZGlvRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUmVjb3JkZWRBdWRpbycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3RhcnRBdWRpb1JlY29yZGluZ0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnU3RhcnRBdWRpb1JlY29yZGluZycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyVXBsb2FkQXVkaW9FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1VwbG9hZFJlY29yZGVkQXVkaW8nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciB1c2VyIGRhdGEuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1VzZXJTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICckd2luZG93JywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1VzZXJJbmZvT2JqZWN0RmFjdG9yeScsXG4gICAgJ0RFRkFVTFRfUFJPRklMRV9JTUFHRV9QQVRIJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCAkd2luZG93LCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgVXNlckluZm9PYmplY3RGYWN0b3J5LCBERUZBVUxUX1BST0ZJTEVfSU1BR0VfUEFUSCkge1xuICAgICAgICB2YXIgUFJFRkVSRU5DRVNfREFUQV9VUkwgPSAnL3ByZWZlcmVuY2VzaGFuZGxlci9kYXRhJztcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gbnVsbDtcbiAgICAgICAgdmFyIGdldFVzZXJJbmZvQXN5bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoR0xPQkFMUy51c2VySXNMb2dnZWRJbikge1xuICAgICAgICAgICAgICAgIGlmICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZSh1c2VySW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy91c2VyaW5mb2hhbmRsZXInKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB1c2VySW5mbyA9IFVzZXJJbmZvT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1c2VySW5mbztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZXNvbHZlKFVzZXJJbmZvT2JqZWN0RmFjdG9yeS5jcmVhdGVEZWZhdWx0KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0UHJvZmlsZUltYWdlRGF0YVVybEFzeW5jOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb2ZpbGVQaWN0dXJlRGF0YVVybCA9IChVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybChERUZBVUxUX1BST0ZJTEVfSU1BR0VfUEFUSCkpO1xuICAgICAgICAgICAgICAgIGlmIChHTE9CQUxTLnVzZXJJc0xvZ2dlZEluKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9wcmVmZXJlbmNlc2hhbmRsZXIvcHJvZmlsZV9waWN0dXJlJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLnByb2ZpbGVfcGljdHVyZV9kYXRhX3VybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVQaWN0dXJlRGF0YVVybCA9IHJlc3BvbnNlLmRhdGEucHJvZmlsZV9waWN0dXJlX2RhdGFfdXJsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb2ZpbGVQaWN0dXJlRGF0YVVybDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShwcm9maWxlUGljdHVyZURhdGFVcmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXRQcm9maWxlSW1hZ2VEYXRhVXJsQXN5bmM6IGZ1bmN0aW9uIChuZXdQcm9maWxlSW1hZ2VEYXRhVXJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLnB1dChQUkVGRVJFTkNFU19EQVRBX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVfdHlwZTogJ3Byb2ZpbGVfcGljdHVyZV9kYXRhX3VybCcsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IG5ld1Byb2ZpbGVJbWFnZURhdGFVcmxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRMb2dpblVybEFzeW5jOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVybFBhcmFtZXRlcnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfdXJsOiAkd2luZG93LmxvY2F0aW9uLmhyZWZcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy91cmxfaGFuZGxlcicsIHsgcGFyYW1zOiB1cmxQYXJhbWV0ZXJzIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLmxvZ2luX3VybDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRVc2VySW5mb0FzeW5jOiBnZXRVc2VySW5mb0FzeW5jXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIG1hbmlwdWxhdGluZyB0aGUgcGFnZSBVUkwuIEFsc28gYWxsb3dzXG4gKiBmdW5jdGlvbnMgb24gJHdpbmRvdyB0byBiZSBtb2NrZWQgaW4gdW5pdCB0ZXN0cy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnVXJsU2VydmljZScsIFsnJHdpbmRvdycsIGZ1bmN0aW9uICgkd2luZG93KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGZvciB0ZXN0aW5nIHB1cnBvc2VzICh0byBtb2NrICR3aW5kb3cubG9jYXRpb24pXG4gICAgICAgICAgICBnZXRDdXJyZW50TG9jYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHdpbmRvdy5sb2NhdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRDdXJyZW50UXVlcnlTdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5zZWFyY2g7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyogQXMgcGFyYW1zW2tleV0gaXMgb3ZlcndyaXR0ZW4sIGlmIHF1ZXJ5IHN0cmluZyBoYXMgbXVsdGlwbGUgZmllbGRWYWx1ZXNcbiAgICAgICAgICAgICAgIGZvciBzYW1lIGZpZWxkTmFtZSwgdXNlIGdldFF1ZXJ5RmllbGRWYWx1ZXNBc0xpc3QoZmllbGROYW1lKSB0byBnZXQgaXRcbiAgICAgICAgICAgICAgIGluIGFycmF5IGZvcm0uICovXG4gICAgICAgICAgICBnZXRVcmxQYXJhbXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0ge307XG4gICAgICAgICAgICAgICAgdmFyIHBhcnRzID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5yZXBsYWNlKC9bPyZdKyhbXj0mXSspPShbXiZdKikvZ2ksIGZ1bmN0aW9uIChtLCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtc1tkZWNvZGVVUklDb21wb25lbnQoa2V5KV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNJZnJhbWVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIHZhciB1cmxQYXJ0cyA9IHBhdGhuYW1lLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybFBhcnRzWzFdID09PSAnZW1iZWQnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFBhdGhuYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkucGF0aG5hbWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVG9waWMgaWQgc2hvdWxkIGJlIGNvcnJlY3RseSByZXR1cm5lZCBmcm9tIHRvcGljIGVkaXRvciBhcyB3ZWxsIGFzXG4gICAgICAgICAgICAvLyBzdG9yeSBlZGl0b3IsIHNpbmNlIGJvdGggaGF2ZSB0b3BpYyBpZCBpbiB0aGVpciB1cmwuXG4gICAgICAgICAgICBnZXRUb3BpY0lkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcLyhzdG9yeXx0b3BpYylfZWRpdG9yXFwvKFxcd3wtKXsxMn0vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhuYW1lLnNwbGl0KCcvJylbMl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHRvcGljIGlkIHVybCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFRvcGljTmFtZUZyb21MZWFybmVyVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvKHN0b3J5fHRvcGljfHByYWN0aWNlX3Nlc3Npb24pL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUuc3BsaXQoJy8nKVsyXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFVSTCBmb3IgdG9waWMnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdG9yeUlkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcL3N0b3J5X2VkaXRvcihcXC8oXFx3fC0pezEyfSl7Mn0vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhuYW1lLnNwbGl0KCcvJylbM107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHN0b3J5IGlkIHVybCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0b3J5SWRJblBsYXllcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBxdWVyeSA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXJ5Lm1hdGNoKC9cXD9zdG9yeV9pZD0oKFxcd3wtKXsxMn0pL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVyeS5zcGxpdCgnPScpWzFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTa2lsbElkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2tpbGxJZCA9IHBhdGhuYW1lLnNwbGl0KCcvJylbMl07XG4gICAgICAgICAgICAgICAgaWYgKHNraWxsSWQubGVuZ3RoICE9PSAxMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTa2lsbCBJZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc2tpbGxJZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRRdWVyeUZpZWxkVmFsdWVzQXNMaXN0OiBmdW5jdGlvbiAoZmllbGROYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkVmFsdWVzID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuaW5kZXhPZignPycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRWFjaCBxdWVyeUl0ZW0gcmV0dXJuIG9uZSBmaWVsZC12YWx1ZSBwYWlyIGluIHRoZSB1cmwuXG4gICAgICAgICAgICAgICAgICAgIHZhciBxdWVyeUl0ZW1zID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5zbGljZSh0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLmluZGV4T2YoJz8nKSArIDEpLnNwbGl0KCcmJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVlcnlJdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGaWVsZE5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlJdGVtc1tpXS5zcGxpdCgnPScpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50RmllbGRWYWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudChxdWVyeUl0ZW1zW2ldLnNwbGl0KCc9JylbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRGaWVsZE5hbWUgPT09IGZpZWxkTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWVzLnB1c2goY3VycmVudEZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFZhbHVlcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZGRGaWVsZDogZnVuY3Rpb24gKHVybCwgZmllbGROYW1lLCBmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVuY29kZWRGaWVsZFZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIHZhciBlbmNvZGVkRmllbGROYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybCArICh1cmwuaW5kZXhPZignPycpICE9PSAtMSA/ICcmJyA6ICc/JykgKyBlbmNvZGVkRmllbGROYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJz0nICsgZW5jb2RlZEZpZWxkVmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0SGFzaDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLmhhc2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBzZXR0aW5nIGZvY3VzLiBUaGlzIGJyb2FkY2FzdHMgYSAnZm9jdXNPbicgZXZlbnRcbiAqIHdoaWNoIHNldHMgZm9jdXMgdG8gdGhlIGVsZW1lbnQgaW4gdGhlIHBhZ2Ugd2l0aCB0aGUgY29ycmVzcG9uZGluZyBmb2N1c09uXG4gKiBhdHRyaWJ1dGUuXG4gKiBOb3RlOiBUaGlzIHJlcXVpcmVzIExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUyB0byBleGlzdCBzb21ld2hlcmUgaW4gdGhlIEhUTUxcbiAqIHBhZ2UuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0ZvY3VzTWFuYWdlclNlcnZpY2UnLCBbXG4gICAgJyRyb290U2NvcGUnLCAnJHRpbWVvdXQnLCAnRGV2aWNlSW5mb1NlcnZpY2UnLCAnSWRHZW5lcmF0aW9uU2VydmljZScsXG4gICAgJ0xBQkVMX0ZPUl9DTEVBUklOR19GT0NVUycsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsICR0aW1lb3V0LCBEZXZpY2VJbmZvU2VydmljZSwgSWRHZW5lcmF0aW9uU2VydmljZSwgTEFCRUxfRk9SX0NMRUFSSU5HX0ZPQ1VTKSB7XG4gICAgICAgIHZhciBfbmV4dExhYmVsVG9Gb2N1c09uID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNsZWFyRm9jdXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEZvY3VzKExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0Rm9jdXM6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9uZXh0TGFiZWxUb0ZvY3VzT24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfbmV4dExhYmVsVG9Gb2N1c09uID0gbmFtZTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZm9jdXNPbicsIF9uZXh0TGFiZWxUb0ZvY3VzT24pO1xuICAgICAgICAgICAgICAgICAgICBfbmV4dExhYmVsVG9Gb2N1c09uID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXRGb2N1c0lmT25EZXNrdG9wOiBmdW5jdGlvbiAobmV3Rm9jdXNMYWJlbCkge1xuICAgICAgICAgICAgICAgIGlmICghRGV2aWNlSW5mb1NlcnZpY2UuaXNNb2JpbGVEZXZpY2UoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEZvY3VzKG5ld0ZvY3VzTGFiZWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBHZW5lcmF0ZXMgYSByYW5kb20gc3RyaW5nICh0byBiZSB1c2VkIGFzIGEgZm9jdXMgbGFiZWwpLlxuICAgICAgICAgICAgZ2VuZXJhdGVGb2N1c0xhYmVsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIElkR2VuZXJhdGlvblNlcnZpY2UuZ2VuZXJhdGVOZXdJZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==