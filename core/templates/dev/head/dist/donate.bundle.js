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
/******/ 		"donate": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/donate-page/donate-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/pages/donate-page/donate-page.controller.ts":
/*!*****************************************************************************!*\
  !*** ./core/templates/dev/head/pages/donate-page/donate-page.controller.ts ***!
  \*****************************************************************************/
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
 * @fileoverview Controllers for the donate page.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('donatePageModule').controller('Donate', [
    '$http', '$scope', '$timeout', '$window', 'SiteAnalyticsService',
    'UrlInterpolationService', 'WindowDimensionsService',
    function ($http, $scope, $timeout, $window, SiteAnalyticsService, UrlInterpolationService, WindowDimensionsService) {
        $scope.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
        $scope.donateImgUrl = UrlInterpolationService.getStaticImageUrl('/general/opp_donate_text.svg');
        $scope.onDonateThroughAmazon = function () {
            SiteAnalyticsService.registerGoToDonationSiteEvent('Amazon');
            $timeout(function () {
                $window.location = 'https://smile.amazon.com/ch/81-1740068';
            }, 150);
            return false;
        };
        $scope.onDonateThroughPayPal = function () {
            // Redirection to PayPal will be initiated at the same time as this
            // function is run, but should be slow enough to allow this function time
            // to complete. It is not possible to do $http.post() in javascript after
            // a delay because cross-site POSTing is not permitted in scripts; see
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
            // for more information.
            SiteAnalyticsService.registerGoToDonationSiteEvent('PayPal');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZG9uYXRlLXBhZ2UvZG9uYXRlLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9TaXRlQW5hbHl0aWNzU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9jb250ZXh0dWFsL1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esa0RBQTBDLGdDQUFnQztBQUMxRTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdFQUF3RCxrQkFBa0I7QUFDMUU7QUFDQSx5REFBaUQsY0FBYztBQUMvRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQXlDLGlDQUFpQztBQUMxRSx3SEFBZ0gsbUJBQW1CLEVBQUU7QUFDckk7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUFnQix1QkFBdUI7QUFDdkM7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLG9HQUFrQztBQUMxQyxtQkFBTyxDQUFDLGdJQUFnRDtBQUN4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4RUFBOEU7QUFDOUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDNUtMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyIsImZpbGUiOiJkb25hdGUuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRyZXR1cm4gcmVzdWx0O1xuIFx0fVxuXG4gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGFuZCBsb2FkaW5nIGNodW5rc1xuIFx0Ly8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4gXHQvLyBQcm9taXNlID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxuIFx0dmFyIGluc3RhbGxlZENodW5rcyA9IHtcbiBcdFx0XCJkb25hdGVcIjogMFxuIFx0fTtcblxuIFx0dmFyIGRlZmVycmVkTW9kdWxlcyA9IFtdO1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHR2YXIganNvbnBBcnJheSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSB8fCBbXTtcbiBcdHZhciBvbGRKc29ucEZ1bmN0aW9uID0ganNvbnBBcnJheS5wdXNoLmJpbmQoanNvbnBBcnJheSk7XG4gXHRqc29ucEFycmF5LnB1c2ggPSB3ZWJwYWNrSnNvbnBDYWxsYmFjaztcbiBcdGpzb25wQXJyYXkgPSBqc29ucEFycmF5LnNsaWNlKCk7XG4gXHRmb3IodmFyIGkgPSAwOyBpIDwganNvbnBBcnJheS5sZW5ndGg7IGkrKykgd2VicGFja0pzb25wQ2FsbGJhY2soanNvbnBBcnJheVtpXSk7XG4gXHR2YXIgcGFyZW50SnNvbnBGdW5jdGlvbiA9IG9sZEpzb25wRnVuY3Rpb247XG5cblxuIFx0Ly8gYWRkIGVudHJ5IG1vZHVsZSB0byBkZWZlcnJlZCBsaXN0XG4gXHRkZWZlcnJlZE1vZHVsZXMucHVzaChbXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2RvbmF0ZS1wYWdlL2RvbmF0ZS1wYWdlLmNvbnRyb2xsZXIudHNcIixcImFib3V0fmFkbWlufmFwcH5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lbWFpbF9kYXNoYm9hcmR+YzFlNTBjYzBcIl0pO1xuIFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiByZWFkeVxuIFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXJzIGZvciB0aGUgZG9uYXRlIHBhZ2UuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnZG9uYXRlUGFnZU1vZHVsZScpLmNvbnRyb2xsZXIoJ0RvbmF0ZScsIFtcbiAgICAnJGh0dHAnLCAnJHNjb3BlJywgJyR0aW1lb3V0JywgJyR3aW5kb3cnLCAnU2l0ZUFuYWx5dGljc1NlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkc2NvcGUsICR0aW1lb3V0LCAkd2luZG93LCBTaXRlQW5hbHl0aWNzU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlKSB7XG4gICAgICAgICRzY29wZS53aW5kb3dJc05hcnJvdyA9IFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmlzV2luZG93TmFycm93KCk7XG4gICAgICAgICRzY29wZS5kb25hdGVJbWdVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2dlbmVyYWwvb3BwX2RvbmF0ZV90ZXh0LnN2ZycpO1xuICAgICAgICAkc2NvcGUub25Eb25hdGVUaHJvdWdoQW1hem9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgU2l0ZUFuYWx5dGljc1NlcnZpY2UucmVnaXN0ZXJHb1RvRG9uYXRpb25TaXRlRXZlbnQoJ0FtYXpvbicpO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24gPSAnaHR0cHM6Ly9zbWlsZS5hbWF6b24uY29tL2NoLzgxLTE3NDAwNjgnO1xuICAgICAgICAgICAgfSwgMTUwKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLm9uRG9uYXRlVGhyb3VnaFBheVBhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIFJlZGlyZWN0aW9uIHRvIFBheVBhbCB3aWxsIGJlIGluaXRpYXRlZCBhdCB0aGUgc2FtZSB0aW1lIGFzIHRoaXNcbiAgICAgICAgICAgIC8vIGZ1bmN0aW9uIGlzIHJ1biwgYnV0IHNob3VsZCBiZSBzbG93IGVub3VnaCB0byBhbGxvdyB0aGlzIGZ1bmN0aW9uIHRpbWVcbiAgICAgICAgICAgIC8vIHRvIGNvbXBsZXRlLiBJdCBpcyBub3QgcG9zc2libGUgdG8gZG8gJGh0dHAucG9zdCgpIGluIGphdmFzY3JpcHQgYWZ0ZXJcbiAgICAgICAgICAgIC8vIGEgZGVsYXkgYmVjYXVzZSBjcm9zcy1zaXRlIFBPU1RpbmcgaXMgbm90IHBlcm1pdHRlZCBpbiBzY3JpcHRzOyBzZWVcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUVFAvQWNjZXNzX2NvbnRyb2xfQ09SU1xuICAgICAgICAgICAgLy8gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAgICAgICAgICBTaXRlQW5hbHl0aWNzU2VydmljZS5yZWdpc3RlckdvVG9Eb25hdGlvblNpdGVFdmVudCgnUGF5UGFsJyk7XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFV0aWxpdHkgc2VydmljZXMgZm9yIGV4cGxvcmF0aW9ucyB3aGljaCBtYXkgYmUgc2hhcmVkIGJ5IGJvdGhcbiAqIHRoZSBsZWFybmVyIGFuZCBlZGl0b3Igdmlld3MuXG4gKi9cbi8vIFNlcnZpY2UgZm9yIHNlbmRpbmcgZXZlbnRzIHRvIEdvb2dsZSBBbmFseXRpY3MuXG4vL1xuLy8gTm90ZSB0aGF0IGV2ZW50cyBhcmUgb25seSBzZW50IGlmIHRoZSBDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTIGZsYWcgaXNcbi8vIHR1cm5lZCBvbi4gVGhpcyBmbGFnIG11c3QgYmUgdHVybmVkIG9uIGV4cGxpY2l0bHkgYnkgdGhlIGFwcGxpY2F0aW9uXG4vLyBvd25lciBpbiBmZWNvbmYucHkuXG5vcHBpYS5mYWN0b3J5KCdTaXRlQW5hbHl0aWNzU2VydmljZScsIFsnJHdpbmRvdycsIGZ1bmN0aW9uICgkd2luZG93KSB7XG4gICAgICAgIHZhciBDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTID0gY29uc3RhbnRzLkNBTl9TRU5EX0FOQUxZVElDU19FVkVOVFM7XG4gICAgICAgIC8vIEZvciBkZWZpbml0aW9ucyBvZiB0aGUgdmFyaW91cyBhcmd1bWVudHMsIHBsZWFzZSBzZWU6XG4gICAgICAgIC8vIGRldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvZXZlbnRzXG4gICAgICAgIHZhciBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MgPSBmdW5jdGlvbiAoZXZlbnRDYXRlZ29yeSwgZXZlbnRBY3Rpb24sIGV2ZW50TGFiZWwpIHtcbiAgICAgICAgICAgIGlmICgkd2luZG93LmdhICYmIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMpIHtcbiAgICAgICAgICAgICAgICAkd2luZG93LmdhKCdzZW5kJywgJ2V2ZW50JywgZXZlbnRDYXRlZ29yeSwgZXZlbnRBY3Rpb24sIGV2ZW50TGFiZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBGb3IgZGVmaW5pdGlvbnMgb2YgdGhlIHZhcmlvdXMgYXJndW1lbnRzLCBwbGVhc2Ugc2VlOlxuICAgICAgICAvLyBkZXZlbG9wZXJzLmdvb2dsZS5jb20vYW5hbHl0aWNzL2Rldmd1aWRlcy9jb2xsZWN0aW9uL2FuYWx5dGljc2pzL1xuICAgICAgICAvLyAgIHNvY2lhbC1pbnRlcmFjdGlvbnNcbiAgICAgICAgdmFyIF9zZW5kU29jaWFsRXZlbnRUb0dvb2dsZUFuYWx5dGljcyA9IGZ1bmN0aW9uIChuZXR3b3JrLCBhY3Rpb24sIHRhcmdldFVybCkge1xuICAgICAgICAgICAgaWYgKCR3aW5kb3cuZ2EgJiYgQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUykge1xuICAgICAgICAgICAgICAgICR3aW5kb3cuZ2EoJ3NlbmQnLCAnc29jaWFsJywgbmV0d29yaywgYWN0aW9uLCB0YXJnZXRVcmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gVGhlIHNyY0VsZW1lbnQgcmVmZXJzIHRvIHRoZSBlbGVtZW50IG9uIHRoZSBwYWdlIHRoYXQgaXMgY2xpY2tlZC5cbiAgICAgICAgICAgIHJlZ2lzdGVyU3RhcnRMb2dpbkV2ZW50OiBmdW5jdGlvbiAoc3JjRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnTG9naW5CdXR0b24nLCAnY2xpY2snLCAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgJyAnICsgc3JjRWxlbWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJOZXdTaWdudXBFdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnU2lnbnVwQnV0dG9uJywgJ2NsaWNrJywgJycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ2xpY2tCcm93c2VMaWJyYXJ5QnV0dG9uRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0Jyb3dzZUxpYnJhcnlCdXR0b24nLCAnY2xpY2snLCAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckdvVG9Eb25hdGlvblNpdGVFdmVudDogZnVuY3Rpb24gKGRvbmF0aW9uU2l0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0dvVG9Eb25hdGlvblNpdGUnLCAnY2xpY2snLCBkb25hdGlvblNpdGVOYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckFwcGx5VG9UZWFjaFdpdGhPcHBpYUV2ZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdBcHBseVRvVGVhY2hXaXRoT3BwaWEnLCAnY2xpY2snLCAnJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDbGlja0NyZWF0ZUV4cGxvcmF0aW9uQnV0dG9uRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NyZWF0ZUV4cGxvcmF0aW9uQnV0dG9uJywgJ2NsaWNrJywgJHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDcmVhdGVOZXdFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnTmV3RXhwbG9yYXRpb24nLCAnY3JlYXRlJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDcmVhdGVOZXdFeHBsb3JhdGlvbkluQ29sbGVjdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnTmV3RXhwbG9yYXRpb25Gcm9tQ29sbGVjdGlvbicsICdjcmVhdGUnLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0NvbGxlY3Rpb25FdmVudDogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnTmV3Q29sbGVjdGlvbicsICdjcmVhdGUnLCBjb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29tbWl0Q2hhbmdlc1RvUHJpdmF0ZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdDb21taXRUb1ByaXZhdGVFeHBsb3JhdGlvbicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2hhcmVFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAobmV0d29yaykge1xuICAgICAgICAgICAgICAgIF9zZW5kU29jaWFsRXZlbnRUb0dvb2dsZUFuYWx5dGljcyhuZXR3b3JrLCAnc2hhcmUnLCAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclNoYXJlQ29sbGVjdGlvbkV2ZW50OiBmdW5jdGlvbiAobmV0d29yaykge1xuICAgICAgICAgICAgICAgIF9zZW5kU29jaWFsRXZlbnRUb0dvb2dsZUFuYWx5dGljcyhuZXR3b3JrLCAnc2hhcmUnLCAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9wZW5FbWJlZEluZm9FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0VtYmVkSW5mb01vZGFsJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNvbW1pdENoYW5nZXNUb1B1YmxpY0V4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdDb21taXRUb1B1YmxpY0V4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgdHV0b3JpYWwgb24gZmlyc3QgY3JlYXRpbmcgZXhwbG9yYXRpb25cbiAgICAgICAgICAgIHJlZ2lzdGVyVHV0b3JpYWxNb2RhbE9wZW5FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1R1dG9yaWFsTW9kYWxPcGVuJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckRlY2xpbmVUdXRvcmlhbE1vZGFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdEZWNsaW5lVHV0b3JpYWxNb2RhbCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQWNjZXB0VHV0b3JpYWxNb2RhbEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQWNjZXB0VHV0b3JpYWxNb2RhbCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIHZpc2l0aW5nIHRoZSBoZWxwIGNlbnRlclxuICAgICAgICAgICAgcmVnaXN0ZXJDbGlja0hlbHBCdXR0b25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NsaWNrSGVscEJ1dHRvbicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyVmlzaXRIZWxwQ2VudGVyRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdWaXNpdEhlbHBDZW50ZXInLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9wZW5UdXRvcmlhbEZyb21IZWxwQ2VudGVyRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdPcGVuVHV0b3JpYWxGcm9tSGVscENlbnRlcicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIGV4aXRpbmcgdGhlIHR1dG9yaWFsXG4gICAgICAgICAgICByZWdpc3RlclNraXBUdXRvcmlhbEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnU2tpcFR1dG9yaWFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaW5pc2hUdXRvcmlhbEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmluaXNoVHV0b3JpYWwnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBNZXRyaWNzIGZvciBmaXJzdCB0aW1lIGVkaXRvciB1c2VcbiAgICAgICAgICAgIHJlZ2lzdGVyRWRpdG9yRmlyc3RFbnRyeUV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RFbnRlckVkaXRvcicsICdvcGVuJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdE9wZW5Db250ZW50Qm94RXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdE9wZW5Db250ZW50Qm94JywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0U2F2ZUNvbnRlbnRFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0U2F2ZUNvbnRlbnQnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0Q2xpY2tBZGRJbnRlcmFjdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RDbGlja0FkZEludGVyYWN0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdFNlbGVjdEludGVyYWN0aW9uVHlwZUV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RTZWxlY3RJbnRlcmFjdGlvblR5cGUnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0U2F2ZUludGVyYWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNhdmVJbnRlcmFjdGlvbicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlUnVsZUV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RTYXZlUnVsZScsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RDcmVhdGVTZWNvbmRTdGF0ZUV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RDcmVhdGVTZWNvbmRTdGF0ZScsICdjcmVhdGUnLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBNZXRyaWNzIGZvciBwdWJsaXNoaW5nIGV4cGxvcmF0aW9uc1xuICAgICAgICAgICAgcmVnaXN0ZXJTYXZlUGxheWFibGVFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnU2F2ZVBsYXlhYmxlRXhwbG9yYXRpb24nLCAnc2F2ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlblB1Ymxpc2hFeHBsb3JhdGlvbk1vZGFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdQdWJsaXNoRXhwbG9yYXRpb25Nb2RhbCcsICdvcGVuJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJQdWJsaXNoRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1B1Ymxpc2hFeHBsb3JhdGlvbicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyVmlzaXRPcHBpYUZyb21JZnJhbWVFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1Zpc2l0T3BwaWFGcm9tSWZyYW1lJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJOZXdDYXJkOiBmdW5jdGlvbiAoY2FyZE51bSkge1xuICAgICAgICAgICAgICAgIGlmIChjYXJkTnVtIDw9IDEwIHx8IGNhcmROdW0gJSAxMCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1BsYXllck5ld0NhcmQnLCAnY2xpY2snLCBjYXJkTnVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaW5pc2hFeHBsb3JhdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUGxheWVyRmluaXNoRXhwbG9yYXRpb24nLCAnY2xpY2snLCAnJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPcGVuQ29sbGVjdGlvbkZyb21MYW5kaW5nUGFnZUV2ZW50OiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdPcGVuRnJhY3Rpb25zRnJvbUxhbmRpbmdQYWdlJywgJ2NsaWNrJywgY29sbGVjdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclN0ZXdhcmRzTGFuZGluZ1BhZ2VFdmVudDogZnVuY3Rpb24gKHZpZXdlclR5cGUsIGJ1dHRvblRleHQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NsaWNrQnV0dG9uT25TdGV3YXJkc1BhZ2UnLCAnY2xpY2snLCB2aWV3ZXJUeXBlICsgJzonICsgYnV0dG9uVGV4dCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJTYXZlUmVjb3JkZWRBdWRpb0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnU2F2ZVJlY29yZGVkQXVkaW8nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclN0YXJ0QXVkaW9SZWNvcmRpbmdFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1N0YXJ0QXVkaW9SZWNvcmRpbmcnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclVwbG9hZEF1ZGlvRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdVcGxvYWRSZWNvcmRlZEF1ZGlvJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgY29tcHV0aW5nIHRoZSB3aW5kb3cgZGltZW5zaW9ucy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnV2luZG93RGltZW5zaW9uc1NlcnZpY2UnLCBbJyR3aW5kb3cnLCBmdW5jdGlvbiAoJHdpbmRvdykge1xuICAgICAgICB2YXIgb25SZXNpemVIb29rcyA9IFtdO1xuICAgICAgICBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdykuYmluZCgncmVzaXplJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgb25SZXNpemVIb29rcy5mb3JFYWNoKGZ1bmN0aW9uIChob29rRm4pIHtcbiAgICAgICAgICAgICAgICBob29rRm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldFdpZHRoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgkd2luZG93LmlubmVyV2lkdGggfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIHx8XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT25SZXNpemVIb29rOiBmdW5jdGlvbiAoaG9va0ZuKSB7XG4gICAgICAgICAgICAgICAgb25SZXNpemVIb29rcy5wdXNoKGhvb2tGbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNXaW5kb3dOYXJyb3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgTk9STUFMX05BVkJBUl9DVVRPRkZfV0lEVEhfUFggPSA3Njg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0V2lkdGgoKSA8PSBOT1JNQUxfTkFWQkFSX0NVVE9GRl9XSURUSF9QWDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9