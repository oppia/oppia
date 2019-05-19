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
/******/ 		"stewards": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/topic-landing-page/topic-landing-page-stewards/topic-landing-page-stewards.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/pages/topic-landing-page/topic-landing-page-stewards/topic-landing-page-stewards.controller.ts":
/*!********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-landing-page/topic-landing-page-stewards/topic-landing-page-stewards.controller.ts ***!
  \********************************************************************************************************************************/
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
 * @fileoverview Controller for the stewards landing page.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('topicLandingPageStewardsModule').controller('Stewards', [
    '$scope', '$timeout', '$window', 'SiteAnalyticsService',
    'UrlInterpolationService', 'UrlService', 'WindowDimensionsService',
    function ($scope, $timeout, $window, SiteAnalyticsService, UrlInterpolationService, UrlService, WindowDimensionsService) {
        $scope.TAB_NAME_PARENTS = 'Parents';
        $scope.TAB_NAME_TEACHERS = 'Teachers';
        $scope.TAB_NAME_NONPROFITS = 'NGOs';
        $scope.TAB_NAME_VOLUNTEERS = 'Volunteers';
        var URL_PATTERNS_TO_TAB_NAMES = {
            '/parents': $scope.TAB_NAME_PARENTS,
            '/teachers': $scope.TAB_NAME_TEACHERS,
            '/partners': $scope.TAB_NAME_NONPROFITS,
            '/nonprofits': $scope.TAB_NAME_NONPROFITS,
            '/volunteers': $scope.TAB_NAME_VOLUNTEERS
        };
        $scope.setActiveTabName = function (newActiveTabName) {
            $scope.activeTabName = newActiveTabName;
            $scope.buttonDefinitions = getButtonDefinitions(newActiveTabName);
        };
        $scope.isActiveTab = function (tabName) {
            return $scope.activeTabName === tabName;
        };
        $scope.getActiveTabNameInSingularForm = function () {
            if ($scope.activeTabName === $scope.TAB_NAME_PARENTS) {
                return 'Parent';
            }
            else if ($scope.activeTabName === $scope.TAB_NAME_TEACHERS) {
                return 'Teacher';
            }
            else if ($scope.activeTabName === $scope.TAB_NAME_NONPROFITS) {
                return 'Nonprofit';
            }
            else if ($scope.activeTabName === $scope.TAB_NAME_VOLUNTEERS) {
                return 'Volunteer';
            }
            else {
                throw Error('Invalid active tab name: ' + $scope.activeTabName);
            }
        };
        var getButtonDefinitions = function (tabName) {
            if (tabName === $scope.TAB_NAME_PARENTS ||
                tabName === $scope.TAB_NAME_TEACHERS) {
                return [{
                        text: 'Browse Lessons',
                        href: '/library'
                    }, {
                        text: 'Subscribe to our Newsletter',
                        href: 'https://tinyletter.com/oppia'
                    }];
            }
            else if (tabName === $scope.TAB_NAME_NONPROFITS) {
                return [{
                        text: 'Get Involved',
                        href: 'https://www.oppiafoundation.org/partnerships#get-in-touch'
                    }, {
                        text: 'Browse Lessons',
                        href: '/library'
                    }];
            }
            else if (tabName === $scope.TAB_NAME_VOLUNTEERS) {
                // TODO(sll): Add "Get in Touch" link that points to contact form.
                return [{
                        text: 'Browse Volunteer Opportunities',
                        href: 'https://www.oppiafoundation.org/volunteer'
                    }];
            }
            else {
                throw Error('Invalid tab name: ' + tabName);
            }
        };
        $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
        $scope.getStaticSubjectImageUrl = function (subjectName) {
            return UrlInterpolationService.getStaticImageUrl('/subjects/' +
                subjectName + '.svg');
        };
        $scope.onClickButton = function (buttonDefinition) {
            SiteAnalyticsService.registerStewardsLandingPageEvent($scope.activeTabName, buttonDefinition.text);
            $timeout(function () {
                $window.location = buttonDefinition.href;
            }, 150);
        };
        // Note: This should be kept in sync with the CSS media query on
        // landing_page_stewards.html.
        var isWindowNarrow = function (windowWidthPx) {
            return windowWidthPx <= 890;
        };
        $scope.windowIsNarrow = isWindowNarrow(WindowDimensionsService.getWidth());
        WindowDimensionsService.registerOnResizeHook(function () {
            $scope.windowIsNarrow = isWindowNarrow(WindowDimensionsService.getWidth());
            $scope.$apply();
        });
        // Set the initial tab name based on the URL; default to TAB_NAME_PARENTS.
        var initialPathname = UrlService.getPathname();
        $scope.activeTabName = $scope.TAB_NAME_PARENTS;
        for (var urlPattern in URL_PATTERNS_TO_TAB_NAMES) {
            if (initialPathname.indexOf(urlPattern) === 0) {
                $scope.activeTabName = URL_PATTERNS_TO_TAB_NAMES[urlPattern];
                break;
            }
        }
        $scope.buttonDefinitions = getButtonDefinitions($scope.activeTabName);
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
oppia.factory('WindowDimensionsService', ['$window', function ($window) {
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
    }]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWMtbGFuZGluZy1wYWdlL3RvcGljLWxhbmRpbmctcGFnZS1zdGV3YXJkcy90b3BpYy1sYW5kaW5nLXBhZ2Utc3Rld2FyZHMuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9TaXRlQW5hbHl0aWNzU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvY29udGV4dHVhbC9XaW5kb3dEaW1lbnNpb25zU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBUSxvQkFBb0I7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBaUIsNEJBQTRCO0FBQzdDO0FBQ0E7QUFDQSwwQkFBa0IsMkJBQTJCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUF5QyxpQ0FBaUM7QUFDMUUsd0hBQWdILG1CQUFtQixFQUFFO0FBQ3JJO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBZ0IsdUJBQXVCO0FBQ3ZDOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxvR0FBa0M7QUFDMUMsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0MsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULHFEQUFxRDtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDNUtMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRSxHQUFHO0FBQ3RFO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLDREQUE0RCxHQUFHLEVBQUUsRUFBRTtBQUNuRTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLG9EQUFvRCxHQUFHO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLHVCQUF1QjtBQUMxRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUMzR0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLIiwiZmlsZSI6InN0ZXdhcmRzLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIGluc3RhbGwgYSBKU09OUCBjYWxsYmFjayBmb3IgY2h1bmsgbG9hZGluZ1xuIFx0ZnVuY3Rpb24gd2VicGFja0pzb25wQ2FsbGJhY2soZGF0YSkge1xuIFx0XHR2YXIgY2h1bmtJZHMgPSBkYXRhWzBdO1xuIFx0XHR2YXIgbW9yZU1vZHVsZXMgPSBkYXRhWzFdO1xuIFx0XHR2YXIgZXhlY3V0ZU1vZHVsZXMgPSBkYXRhWzJdO1xuXG4gXHRcdC8vIGFkZCBcIm1vcmVNb2R1bGVzXCIgdG8gdGhlIG1vZHVsZXMgb2JqZWN0LFxuIFx0XHQvLyB0aGVuIGZsYWcgYWxsIFwiY2h1bmtJZHNcIiBhcyBsb2FkZWQgYW5kIGZpcmUgY2FsbGJhY2tcbiBcdFx0dmFyIG1vZHVsZUlkLCBjaHVua0lkLCBpID0gMCwgcmVzb2x2ZXMgPSBbXTtcbiBcdFx0Zm9yKDtpIDwgY2h1bmtJZHMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHRjaHVua0lkID0gY2h1bmtJZHNbaV07XG4gXHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG4gXHRcdFx0XHRyZXNvbHZlcy5wdXNoKGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSk7XG4gXHRcdFx0fVxuIFx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IDA7XG4gXHRcdH1cbiBcdFx0Zm9yKG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG4gXHRcdFx0aWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcbiBcdFx0XHRcdG1vZHVsZXNbbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRpZihwYXJlbnRKc29ucEZ1bmN0aW9uKSBwYXJlbnRKc29ucEZ1bmN0aW9uKGRhdGEpO1xuXG4gXHRcdHdoaWxlKHJlc29sdmVzLmxlbmd0aCkge1xuIFx0XHRcdHJlc29sdmVzLnNoaWZ0KCkoKTtcbiBcdFx0fVxuXG4gXHRcdC8vIGFkZCBlbnRyeSBtb2R1bGVzIGZyb20gbG9hZGVkIGNodW5rIHRvIGRlZmVycmVkIGxpc3RcbiBcdFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2guYXBwbHkoZGVmZXJyZWRNb2R1bGVzLCBleGVjdXRlTW9kdWxlcyB8fCBbXSk7XG5cbiBcdFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiBhbGwgY2h1bmtzIHJlYWR5XG4gXHRcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIFx0fTtcbiBcdGZ1bmN0aW9uIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCkge1xuIFx0XHR2YXIgcmVzdWx0O1xuIFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWRNb2R1bGVzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0dmFyIGRlZmVycmVkTW9kdWxlID0gZGVmZXJyZWRNb2R1bGVzW2ldO1xuIFx0XHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuIFx0XHRcdGZvcih2YXIgaiA9IDE7IGogPCBkZWZlcnJlZE1vZHVsZS5sZW5ndGg7IGorKykge1xuIFx0XHRcdFx0dmFyIGRlcElkID0gZGVmZXJyZWRNb2R1bGVbal07XG4gXHRcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbZGVwSWRdICE9PSAwKSBmdWxmaWxsZWQgPSBmYWxzZTtcbiBcdFx0XHR9XG4gXHRcdFx0aWYoZnVsZmlsbGVkKSB7XG4gXHRcdFx0XHRkZWZlcnJlZE1vZHVsZXMuc3BsaWNlKGktLSwgMSk7XG4gXHRcdFx0XHRyZXN1bHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IGRlZmVycmVkTW9kdWxlWzBdKTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0cmV0dXJuIHJlc3VsdDtcbiBcdH1cblxuIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3NcbiBcdC8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuIFx0Ly8gUHJvbWlzZSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbiBcdHZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG4gXHRcdFwic3Rld2FyZHNcIjogMFxuIFx0fTtcblxuIFx0dmFyIGRlZmVycmVkTW9kdWxlcyA9IFtdO1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHR2YXIganNvbnBBcnJheSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSB8fCBbXTtcbiBcdHZhciBvbGRKc29ucEZ1bmN0aW9uID0ganNvbnBBcnJheS5wdXNoLmJpbmQoanNvbnBBcnJheSk7XG4gXHRqc29ucEFycmF5LnB1c2ggPSB3ZWJwYWNrSnNvbnBDYWxsYmFjaztcbiBcdGpzb25wQXJyYXkgPSBqc29ucEFycmF5LnNsaWNlKCk7XG4gXHRmb3IodmFyIGkgPSAwOyBpIDwganNvbnBBcnJheS5sZW5ndGg7IGkrKykgd2VicGFja0pzb25wQ2FsbGJhY2soanNvbnBBcnJheVtpXSk7XG4gXHR2YXIgcGFyZW50SnNvbnBGdW5jdGlvbiA9IG9sZEpzb25wRnVuY3Rpb247XG5cblxuIFx0Ly8gYWRkIGVudHJ5IG1vZHVsZSB0byBkZWZlcnJlZCBsaXN0XG4gXHRkZWZlcnJlZE1vZHVsZXMucHVzaChbXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLWxhbmRpbmctcGFnZS90b3BpYy1sYW5kaW5nLXBhZ2Utc3Rld2FyZHMvdG9waWMtbGFuZGluZy1wYWdlLXN0ZXdhcmRzLmNvbnRyb2xsZXIudHNcIixcImFib3V0fmFkbWlufmFwcH5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lbWFpbF9kYXNoYm9hcmR+YzFlNTBjYzBcIl0pO1xuIFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiByZWFkeVxuIFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXIgZm9yIHRoZSBzdGV3YXJkcyBsYW5kaW5nIHBhZ2UuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCd0b3BpY0xhbmRpbmdQYWdlU3Rld2FyZHNNb2R1bGUnKS5jb250cm9sbGVyKCdTdGV3YXJkcycsIFtcbiAgICAnJHNjb3BlJywgJyR0aW1lb3V0JywgJyR3aW5kb3cnLCAnU2l0ZUFuYWx5dGljc1NlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdGltZW91dCwgJHdpbmRvdywgU2l0ZUFuYWx5dGljc1NlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBVcmxTZXJ2aWNlLCBXaW5kb3dEaW1lbnNpb25zU2VydmljZSkge1xuICAgICAgICAkc2NvcGUuVEFCX05BTUVfUEFSRU5UUyA9ICdQYXJlbnRzJztcbiAgICAgICAgJHNjb3BlLlRBQl9OQU1FX1RFQUNIRVJTID0gJ1RlYWNoZXJzJztcbiAgICAgICAgJHNjb3BlLlRBQl9OQU1FX05PTlBST0ZJVFMgPSAnTkdPcyc7XG4gICAgICAgICRzY29wZS5UQUJfTkFNRV9WT0xVTlRFRVJTID0gJ1ZvbHVudGVlcnMnO1xuICAgICAgICB2YXIgVVJMX1BBVFRFUk5TX1RPX1RBQl9OQU1FUyA9IHtcbiAgICAgICAgICAgICcvcGFyZW50cyc6ICRzY29wZS5UQUJfTkFNRV9QQVJFTlRTLFxuICAgICAgICAgICAgJy90ZWFjaGVycyc6ICRzY29wZS5UQUJfTkFNRV9URUFDSEVSUyxcbiAgICAgICAgICAgICcvcGFydG5lcnMnOiAkc2NvcGUuVEFCX05BTUVfTk9OUFJPRklUUyxcbiAgICAgICAgICAgICcvbm9ucHJvZml0cyc6ICRzY29wZS5UQUJfTkFNRV9OT05QUk9GSVRTLFxuICAgICAgICAgICAgJy92b2x1bnRlZXJzJzogJHNjb3BlLlRBQl9OQU1FX1ZPTFVOVEVFUlNcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnNldEFjdGl2ZVRhYk5hbWUgPSBmdW5jdGlvbiAobmV3QWN0aXZlVGFiTmFtZSkge1xuICAgICAgICAgICAgJHNjb3BlLmFjdGl2ZVRhYk5hbWUgPSBuZXdBY3RpdmVUYWJOYW1lO1xuICAgICAgICAgICAgJHNjb3BlLmJ1dHRvbkRlZmluaXRpb25zID0gZ2V0QnV0dG9uRGVmaW5pdGlvbnMobmV3QWN0aXZlVGFiTmFtZSk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5pc0FjdGl2ZVRhYiA9IGZ1bmN0aW9uICh0YWJOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmFjdGl2ZVRhYk5hbWUgPT09IHRhYk5hbWU7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5nZXRBY3RpdmVUYWJOYW1lSW5TaW5ndWxhckZvcm0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmFjdGl2ZVRhYk5hbWUgPT09ICRzY29wZS5UQUJfTkFNRV9QQVJFTlRTKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdQYXJlbnQnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoJHNjb3BlLmFjdGl2ZVRhYk5hbWUgPT09ICRzY29wZS5UQUJfTkFNRV9URUFDSEVSUykge1xuICAgICAgICAgICAgICAgIHJldHVybiAnVGVhY2hlcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgkc2NvcGUuYWN0aXZlVGFiTmFtZSA9PT0gJHNjb3BlLlRBQl9OQU1FX05PTlBST0ZJVFMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ05vbnByb2ZpdCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICgkc2NvcGUuYWN0aXZlVGFiTmFtZSA9PT0gJHNjb3BlLlRBQl9OQU1FX1ZPTFVOVEVFUlMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1ZvbHVudGVlcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBhY3RpdmUgdGFiIG5hbWU6ICcgKyAkc2NvcGUuYWN0aXZlVGFiTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBnZXRCdXR0b25EZWZpbml0aW9ucyA9IGZ1bmN0aW9uICh0YWJOYW1lKSB7XG4gICAgICAgICAgICBpZiAodGFiTmFtZSA9PT0gJHNjb3BlLlRBQl9OQU1FX1BBUkVOVFMgfHxcbiAgICAgICAgICAgICAgICB0YWJOYW1lID09PSAkc2NvcGUuVEFCX05BTUVfVEVBQ0hFUlMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCcm93c2UgTGVzc29ucycsXG4gICAgICAgICAgICAgICAgICAgICAgICBocmVmOiAnL2xpYnJhcnknXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdTdWJzY3JpYmUgdG8gb3VyIE5ld3NsZXR0ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgaHJlZjogJ2h0dHBzOi8vdGlueWxldHRlci5jb20vb3BwaWEnXG4gICAgICAgICAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGFiTmFtZSA9PT0gJHNjb3BlLlRBQl9OQU1FX05PTlBST0ZJVFMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdHZXQgSW52b2x2ZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaHJlZjogJ2h0dHBzOi8vd3d3Lm9wcGlhZm91bmRhdGlvbi5vcmcvcGFydG5lcnNoaXBzI2dldC1pbi10b3VjaCdcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0Jyb3dzZSBMZXNzb25zJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY6ICcvbGlicmFyeSdcbiAgICAgICAgICAgICAgICAgICAgfV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0YWJOYW1lID09PSAkc2NvcGUuVEFCX05BTUVfVk9MVU5URUVSUykge1xuICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogQWRkIFwiR2V0IGluIFRvdWNoXCIgbGluayB0aGF0IHBvaW50cyB0byBjb250YWN0IGZvcm0uXG4gICAgICAgICAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQnJvd3NlIFZvbHVudGVlciBPcHBvcnR1bml0aWVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY6ICdodHRwczovL3d3dy5vcHBpYWZvdW5kYXRpb24ub3JnL3ZvbHVudGVlcidcbiAgICAgICAgICAgICAgICAgICAgfV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCB0YWIgbmFtZTogJyArIHRhYk5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuZ2V0U3RhdGljSW1hZ2VVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybDtcbiAgICAgICAgJHNjb3BlLmdldFN0YXRpY1N1YmplY3RJbWFnZVVybCA9IGZ1bmN0aW9uIChzdWJqZWN0TmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKCcvc3ViamVjdHMvJyArXG4gICAgICAgICAgICAgICAgc3ViamVjdE5hbWUgKyAnLnN2ZycpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUub25DbGlja0J1dHRvbiA9IGZ1bmN0aW9uIChidXR0b25EZWZpbml0aW9uKSB7XG4gICAgICAgICAgICBTaXRlQW5hbHl0aWNzU2VydmljZS5yZWdpc3RlclN0ZXdhcmRzTGFuZGluZ1BhZ2VFdmVudCgkc2NvcGUuYWN0aXZlVGFiTmFtZSwgYnV0dG9uRGVmaW5pdGlvbi50ZXh0KTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uID0gYnV0dG9uRGVmaW5pdGlvbi5ocmVmO1xuICAgICAgICAgICAgfSwgMTUwKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gTm90ZTogVGhpcyBzaG91bGQgYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIENTUyBtZWRpYSBxdWVyeSBvblxuICAgICAgICAvLyBsYW5kaW5nX3BhZ2Vfc3Rld2FyZHMuaHRtbC5cbiAgICAgICAgdmFyIGlzV2luZG93TmFycm93ID0gZnVuY3Rpb24gKHdpbmRvd1dpZHRoUHgpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3dXaWR0aFB4IDw9IDg5MDtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLndpbmRvd0lzTmFycm93ID0gaXNXaW5kb3dOYXJyb3coV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKSk7XG4gICAgICAgIFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnJlZ2lzdGVyT25SZXNpemVIb29rKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS53aW5kb3dJc05hcnJvdyA9IGlzV2luZG93TmFycm93KFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCkpO1xuICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gU2V0IHRoZSBpbml0aWFsIHRhYiBuYW1lIGJhc2VkIG9uIHRoZSBVUkw7IGRlZmF1bHQgdG8gVEFCX05BTUVfUEFSRU5UUy5cbiAgICAgICAgdmFyIGluaXRpYWxQYXRobmFtZSA9IFVybFNlcnZpY2UuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgJHNjb3BlLmFjdGl2ZVRhYk5hbWUgPSAkc2NvcGUuVEFCX05BTUVfUEFSRU5UUztcbiAgICAgICAgZm9yICh2YXIgdXJsUGF0dGVybiBpbiBVUkxfUEFUVEVSTlNfVE9fVEFCX05BTUVTKSB7XG4gICAgICAgICAgICBpZiAoaW5pdGlhbFBhdGhuYW1lLmluZGV4T2YodXJsUGF0dGVybikgPT09IDApIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuYWN0aXZlVGFiTmFtZSA9IFVSTF9QQVRURVJOU19UT19UQUJfTkFNRVNbdXJsUGF0dGVybl07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgJHNjb3BlLmJ1dHRvbkRlZmluaXRpb25zID0gZ2V0QnV0dG9uRGVmaW5pdGlvbnMoJHNjb3BlLmFjdGl2ZVRhYk5hbWUpO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBVdGlsaXR5IHNlcnZpY2VzIGZvciBleHBsb3JhdGlvbnMgd2hpY2ggbWF5IGJlIHNoYXJlZCBieSBib3RoXG4gKiB0aGUgbGVhcm5lciBhbmQgZWRpdG9yIHZpZXdzLlxuICovXG4vLyBTZXJ2aWNlIGZvciBzZW5kaW5nIGV2ZW50cyB0byBHb29nbGUgQW5hbHl0aWNzLlxuLy9cbi8vIE5vdGUgdGhhdCBldmVudHMgYXJlIG9ubHkgc2VudCBpZiB0aGUgQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUyBmbGFnIGlzXG4vLyB0dXJuZWQgb24uIFRoaXMgZmxhZyBtdXN0IGJlIHR1cm5lZCBvbiBleHBsaWNpdGx5IGJ5IHRoZSBhcHBsaWNhdGlvblxuLy8gb3duZXIgaW4gZmVjb25mLnB5Llxub3BwaWEuZmFjdG9yeSgnU2l0ZUFuYWx5dGljc1NlcnZpY2UnLCBbJyR3aW5kb3cnLCBmdW5jdGlvbiAoJHdpbmRvdykge1xuICAgICAgICB2YXIgQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUyA9IGNvbnN0YW50cy5DQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTO1xuICAgICAgICAvLyBGb3IgZGVmaW5pdGlvbnMgb2YgdGhlIHZhcmlvdXMgYXJndW1lbnRzLCBwbGVhc2Ugc2VlOlxuICAgICAgICAvLyBkZXZlbG9wZXJzLmdvb2dsZS5jb20vYW5hbHl0aWNzL2Rldmd1aWRlcy9jb2xsZWN0aW9uL2FuYWx5dGljc2pzL2V2ZW50c1xuICAgICAgICB2YXIgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzID0gZnVuY3Rpb24gKGV2ZW50Q2F0ZWdvcnksIGV2ZW50QWN0aW9uLCBldmVudExhYmVsKSB7XG4gICAgICAgICAgICBpZiAoJHdpbmRvdy5nYSAmJiBDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5nYSgnc2VuZCcsICdldmVudCcsIGV2ZW50Q2F0ZWdvcnksIGV2ZW50QWN0aW9uLCBldmVudExhYmVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8gRm9yIGRlZmluaXRpb25zIG9mIHRoZSB2YXJpb3VzIGFyZ3VtZW50cywgcGxlYXNlIHNlZTpcbiAgICAgICAgLy8gZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9cbiAgICAgICAgLy8gICBzb2NpYWwtaW50ZXJhY3Rpb25zXG4gICAgICAgIHZhciBfc2VuZFNvY2lhbEV2ZW50VG9Hb29nbGVBbmFseXRpY3MgPSBmdW5jdGlvbiAobmV0d29yaywgYWN0aW9uLCB0YXJnZXRVcmwpIHtcbiAgICAgICAgICAgIGlmICgkd2luZG93LmdhICYmIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMpIHtcbiAgICAgICAgICAgICAgICAkd2luZG93LmdhKCdzZW5kJywgJ3NvY2lhbCcsIG5ldHdvcmssIGFjdGlvbiwgdGFyZ2V0VXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFRoZSBzcmNFbGVtZW50IHJlZmVycyB0byB0aGUgZWxlbWVudCBvbiB0aGUgcGFnZSB0aGF0IGlzIGNsaWNrZWQuXG4gICAgICAgICAgICByZWdpc3RlclN0YXJ0TG9naW5FdmVudDogZnVuY3Rpb24gKHNyY0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0xvZ2luQnV0dG9uJywgJ2NsaWNrJywgJHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICcgJyArIHNyY0VsZW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyTmV3U2lnbnVwRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1NpZ251cEJ1dHRvbicsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrQnJvd3NlTGlicmFyeUJ1dHRvbkV2ZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdCcm93c2VMaWJyYXJ5QnV0dG9uJywgJ2NsaWNrJywgJHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJHb1RvRG9uYXRpb25TaXRlRXZlbnQ6IGZ1bmN0aW9uIChkb25hdGlvblNpdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdHb1RvRG9uYXRpb25TaXRlJywgJ2NsaWNrJywgZG9uYXRpb25TaXRlTmFtZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJBcHBseVRvVGVhY2hXaXRoT3BwaWFFdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQXBwbHlUb1RlYWNoV2l0aE9wcGlhJywgJ2NsaWNrJywgJycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ2xpY2tDcmVhdGVFeHBsb3JhdGlvbkJ1dHRvbkV2ZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdDcmVhdGVFeHBsb3JhdGlvbkJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ3JlYXRlTmV3RXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ05ld0V4cGxvcmF0aW9uJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ3JlYXRlTmV3RXhwbG9yYXRpb25JbkNvbGxlY3Rpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ05ld0V4cGxvcmF0aW9uRnJvbUNvbGxlY3Rpb24nLCAnY3JlYXRlJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDcmVhdGVOZXdDb2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ05ld0NvbGxlY3Rpb24nLCAnY3JlYXRlJywgY29sbGVjdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNvbW1pdENoYW5nZXNUb1ByaXZhdGVFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ29tbWl0VG9Qcml2YXRlRXhwbG9yYXRpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclNoYXJlRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKG5ldHdvcmspIHtcbiAgICAgICAgICAgICAgICBfc2VuZFNvY2lhbEV2ZW50VG9Hb29nbGVBbmFseXRpY3MobmV0d29yaywgJ3NoYXJlJywgJHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJTaGFyZUNvbGxlY3Rpb25FdmVudDogZnVuY3Rpb24gKG5ldHdvcmspIHtcbiAgICAgICAgICAgICAgICBfc2VuZFNvY2lhbEV2ZW50VG9Hb29nbGVBbmFseXRpY3MobmV0d29yaywgJ3NoYXJlJywgJHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPcGVuRW1iZWRJbmZvRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdFbWJlZEluZm9Nb2RhbCcsICdvcGVuJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDb21taXRDaGFuZ2VzVG9QdWJsaWNFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ29tbWl0VG9QdWJsaWNFeHBsb3JhdGlvbicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIHR1dG9yaWFsIG9uIGZpcnN0IGNyZWF0aW5nIGV4cGxvcmF0aW9uXG4gICAgICAgICAgICByZWdpc3RlclR1dG9yaWFsTW9kYWxPcGVuRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdUdXRvcmlhbE1vZGFsT3BlbicsICdvcGVuJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJEZWNsaW5lVHV0b3JpYWxNb2RhbEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRGVjbGluZVR1dG9yaWFsTW9kYWwnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckFjY2VwdFR1dG9yaWFsTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0FjY2VwdFR1dG9yaWFsTW9kYWwnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBNZXRyaWNzIGZvciB2aXNpdGluZyB0aGUgaGVscCBjZW50ZXJcbiAgICAgICAgICAgIHJlZ2lzdGVyQ2xpY2tIZWxwQnV0dG9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdDbGlja0hlbHBCdXR0b24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclZpc2l0SGVscENlbnRlckV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVmlzaXRIZWxwQ2VudGVyJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPcGVuVHV0b3JpYWxGcm9tSGVscENlbnRlckV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnT3BlblR1dG9yaWFsRnJvbUhlbHBDZW50ZXInLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBNZXRyaWNzIGZvciBleGl0aW5nIHRoZSB0dXRvcmlhbFxuICAgICAgICAgICAgcmVnaXN0ZXJTa2lwVHV0b3JpYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1NraXBUdXRvcmlhbCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmluaXNoVHV0b3JpYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpbmlzaFR1dG9yaWFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgZmlyc3QgdGltZSBlZGl0b3IgdXNlXG4gICAgICAgICAgICByZWdpc3RlckVkaXRvckZpcnN0RW50cnlFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0RW50ZXJFZGl0b3InLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RPcGVuQ29udGVudEJveEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RPcGVuQ29udGVudEJveCcsICdvcGVuJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdFNhdmVDb250ZW50RXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNhdmVDb250ZW50JywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdENsaWNrQWRkSW50ZXJhY3Rpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0Q2xpY2tBZGRJbnRlcmFjdGlvbicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTZWxlY3RJbnRlcmFjdGlvblR5cGVFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0U2VsZWN0SW50ZXJhY3Rpb25UeXBlJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdFNhdmVJbnRlcmFjdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RTYXZlSW50ZXJhY3Rpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0U2F2ZVJ1bGVFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0U2F2ZVJ1bGUnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0Q3JlYXRlU2Vjb25kU3RhdGVFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0Q3JlYXRlU2Vjb25kU3RhdGUnLCAnY3JlYXRlJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgcHVibGlzaGluZyBleHBsb3JhdGlvbnNcbiAgICAgICAgICAgIHJlZ2lzdGVyU2F2ZVBsYXlhYmxlRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1NhdmVQbGF5YWJsZUV4cGxvcmF0aW9uJywgJ3NhdmUnLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9wZW5QdWJsaXNoRXhwbG9yYXRpb25Nb2RhbEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUHVibGlzaEV4cGxvcmF0aW9uTW9kYWwnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyUHVibGlzaEV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdQdWJsaXNoRXhwbG9yYXRpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclZpc2l0T3BwaWFGcm9tSWZyYW1lRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdWaXNpdE9wcGlhRnJvbUlmcmFtZScsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyTmV3Q2FyZDogZnVuY3Rpb24gKGNhcmROdW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FyZE51bSA8PSAxMCB8fCBjYXJkTnVtICUgMTAgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdQbGF5ZXJOZXdDYXJkJywgJ2NsaWNrJywgY2FyZE51bSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmluaXNoRXhwbG9yYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1BsYXllckZpbmlzaEV4cGxvcmF0aW9uJywgJ2NsaWNrJywgJycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlbkNvbGxlY3Rpb25Gcm9tTGFuZGluZ1BhZ2VFdmVudDogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnT3BlbkZyYWN0aW9uc0Zyb21MYW5kaW5nUGFnZScsICdjbGljaycsIGNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJTdGV3YXJkc0xhbmRpbmdQYWdlRXZlbnQ6IGZ1bmN0aW9uICh2aWV3ZXJUeXBlLCBidXR0b25UZXh0KSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdDbGlja0J1dHRvbk9uU3Rld2FyZHNQYWdlJywgJ2NsaWNrJywgdmlld2VyVHlwZSArICc6JyArIGJ1dHRvblRleHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2F2ZVJlY29yZGVkQXVkaW9FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1NhdmVSZWNvcmRlZEF1ZGlvJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJTdGFydEF1ZGlvUmVjb3JkaW5nRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTdGFydEF1ZGlvUmVjb3JkaW5nJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJVcGxvYWRBdWRpb0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVXBsb2FkUmVjb3JkZWRBdWRpbycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIG1hbmlwdWxhdGluZyB0aGUgcGFnZSBVUkwuIEFsc28gYWxsb3dzXG4gKiBmdW5jdGlvbnMgb24gJHdpbmRvdyB0byBiZSBtb2NrZWQgaW4gdW5pdCB0ZXN0cy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnVXJsU2VydmljZScsIFsnJHdpbmRvdycsIGZ1bmN0aW9uICgkd2luZG93KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGZvciB0ZXN0aW5nIHB1cnBvc2VzICh0byBtb2NrICR3aW5kb3cubG9jYXRpb24pXG4gICAgICAgICAgICBnZXRDdXJyZW50TG9jYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHdpbmRvdy5sb2NhdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRDdXJyZW50UXVlcnlTdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5zZWFyY2g7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyogQXMgcGFyYW1zW2tleV0gaXMgb3ZlcndyaXR0ZW4sIGlmIHF1ZXJ5IHN0cmluZyBoYXMgbXVsdGlwbGUgZmllbGRWYWx1ZXNcbiAgICAgICAgICAgICAgIGZvciBzYW1lIGZpZWxkTmFtZSwgdXNlIGdldFF1ZXJ5RmllbGRWYWx1ZXNBc0xpc3QoZmllbGROYW1lKSB0byBnZXQgaXRcbiAgICAgICAgICAgICAgIGluIGFycmF5IGZvcm0uICovXG4gICAgICAgICAgICBnZXRVcmxQYXJhbXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0ge307XG4gICAgICAgICAgICAgICAgdmFyIHBhcnRzID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5yZXBsYWNlKC9bPyZdKyhbXj0mXSspPShbXiZdKikvZ2ksIGZ1bmN0aW9uIChtLCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtc1tkZWNvZGVVUklDb21wb25lbnQoa2V5KV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNJZnJhbWVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIHZhciB1cmxQYXJ0cyA9IHBhdGhuYW1lLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybFBhcnRzWzFdID09PSAnZW1iZWQnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFBhdGhuYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkucGF0aG5hbWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVG9waWMgaWQgc2hvdWxkIGJlIGNvcnJlY3RseSByZXR1cm5lZCBmcm9tIHRvcGljIGVkaXRvciBhcyB3ZWxsIGFzXG4gICAgICAgICAgICAvLyBzdG9yeSBlZGl0b3IsIHNpbmNlIGJvdGggaGF2ZSB0b3BpYyBpZCBpbiB0aGVpciB1cmwuXG4gICAgICAgICAgICBnZXRUb3BpY0lkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcLyhzdG9yeXx0b3BpYylfZWRpdG9yXFwvKFxcd3wtKXsxMn0vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhuYW1lLnNwbGl0KCcvJylbMl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHRvcGljIGlkIHVybCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFRvcGljTmFtZUZyb21MZWFybmVyVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvKHN0b3J5fHRvcGljfHByYWN0aWNlX3Nlc3Npb24pL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUuc3BsaXQoJy8nKVsyXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFVSTCBmb3IgdG9waWMnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdG9yeUlkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcL3N0b3J5X2VkaXRvcihcXC8oXFx3fC0pezEyfSl7Mn0vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhuYW1lLnNwbGl0KCcvJylbM107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHN0b3J5IGlkIHVybCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0b3J5SWRJblBsYXllcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBxdWVyeSA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXJ5Lm1hdGNoKC9cXD9zdG9yeV9pZD0oKFxcd3wtKXsxMn0pL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVyeS5zcGxpdCgnPScpWzFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTa2lsbElkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2tpbGxJZCA9IHBhdGhuYW1lLnNwbGl0KCcvJylbMl07XG4gICAgICAgICAgICAgICAgaWYgKHNraWxsSWQubGVuZ3RoICE9PSAxMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTa2lsbCBJZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc2tpbGxJZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRRdWVyeUZpZWxkVmFsdWVzQXNMaXN0OiBmdW5jdGlvbiAoZmllbGROYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkVmFsdWVzID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuaW5kZXhPZignPycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRWFjaCBxdWVyeUl0ZW0gcmV0dXJuIG9uZSBmaWVsZC12YWx1ZSBwYWlyIGluIHRoZSB1cmwuXG4gICAgICAgICAgICAgICAgICAgIHZhciBxdWVyeUl0ZW1zID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5zbGljZSh0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLmluZGV4T2YoJz8nKSArIDEpLnNwbGl0KCcmJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVlcnlJdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGaWVsZE5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlJdGVtc1tpXS5zcGxpdCgnPScpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50RmllbGRWYWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudChxdWVyeUl0ZW1zW2ldLnNwbGl0KCc9JylbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRGaWVsZE5hbWUgPT09IGZpZWxkTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWVzLnB1c2goY3VycmVudEZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFZhbHVlcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZGRGaWVsZDogZnVuY3Rpb24gKHVybCwgZmllbGROYW1lLCBmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVuY29kZWRGaWVsZFZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIHZhciBlbmNvZGVkRmllbGROYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybCArICh1cmwuaW5kZXhPZignPycpICE9PSAtMSA/ICcmJyA6ICc/JykgKyBlbmNvZGVkRmllbGROYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJz0nICsgZW5jb2RlZEZpZWxkVmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0SGFzaDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLmhhc2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBjb21wdXRpbmcgdGhlIHdpbmRvdyBkaW1lbnNpb25zLlxuICovXG5vcHBpYS5mYWN0b3J5KCdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsIFsnJHdpbmRvdycsIGZ1bmN0aW9uICgkd2luZG93KSB7XG4gICAgICAgIHZhciBvblJlc2l6ZUhvb2tzID0gW107XG4gICAgICAgIGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KS5iaW5kKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBvblJlc2l6ZUhvb2tzLmZvckVhY2goZnVuY3Rpb24gKGhvb2tGbikge1xuICAgICAgICAgICAgICAgIGhvb2tGbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0V2lkdGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCR3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggfHxcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPblJlc2l6ZUhvb2s6IGZ1bmN0aW9uIChob29rRm4pIHtcbiAgICAgICAgICAgICAgICBvblJlc2l6ZUhvb2tzLnB1c2goaG9va0ZuKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc1dpbmRvd05hcnJvdzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBOT1JNQUxfTkFWQkFSX0NVVE9GRl9XSURUSF9QWCA9IDc2ODtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRXaWR0aCgpIDw9IE5PUk1BTF9OQVZCQVJfQ1VUT0ZGX1dJRFRIX1BYO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=