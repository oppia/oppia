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
/******/ 		"learner_dashboard": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0","collection_player~creator_dashboard~exploration_editor~exploration_player~learner_dashboard~library~~88caa5df","collection_player~learner_dashboard~library~profile"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts":
/*!**********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts ***!
  \**********************************************************************************************************************/
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
 * @fileoverview Directive for the background banner.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('backgroundBannerModule').directive('backgroundBanner', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/background-banner/' +
                'background-banner.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                function () {
                    var ctrl = this;
                    var possibleBannerFilenames = [
                        'bannerA.svg', 'bannerB.svg', 'bannerC.svg', 'bannerD.svg'
                    ];
                    var bannerImageFilename = possibleBannerFilenames[Math.floor(Math.random() * possibleBannerFilenames.length)];
                    ctrl.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl('/background/' + bannerImageFilename);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.directive.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.directive.ts ***!
  \************************************************************************************************************/
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
 * @fileoverview Directive for displaying animated loading dots.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('loadingDotsModule').directive('loadingDots', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/loading-dots/' +
                'loading-dots.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile-directives/collection-summary-tile/collection-summary-tile.directive.ts":
/*!*********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile-directives/collection-summary-tile/collection-summary-tile.directive.ts ***!
  \*********************************************************************************************************************************/
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
 * @fileoverview Summary tile for collections.
 */
__webpack_require__(/*! domain/learner_dashboard/LearnerDashboardIconsDirective.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIconsDirective.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate-and-capitalize.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate-and-capitalize.filter.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('collectionSummaryTileModule').directive('collectionSummaryTile', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getCollectionId: '&collectionId',
                getCollectionTitle: '&collectionTitle',
                getObjective: '&objective',
                getNodeCount: '&nodeCount',
                getLastUpdatedMsec: '&lastUpdatedMsec',
                getThumbnailIconUrl: '&thumbnailIconUrl',
                getThumbnailBgColor: '&thumbnailBgColor',
                isLinkedToEditorPage: '=?isLinkedToEditorPage',
                getCategory: '&category',
                isPlaylistTile: '&isPlaylistTile',
                showLearnerDashboardIconsIfPossible: ('&showLearnerDashboardIconsIfPossible'),
                isContainerNarrow: '&containerIsNarrow',
                isOwnedByCurrentUser: '&activityIsOwnedByCurrentUser',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/summary-tile-directives/collection-summary-tile/' +
                'collection-summary-tile.directive.html'),
            controller: [
                'DateTimeFormatService', 'UserService',
                'COLLECTION_VIEWER_URL', 'COLLECTION_EDITOR_URL', function (DateTimeFormatService, UserService, COLLECTION_VIEWER_URL, COLLECTION_EDITOR_URL) {
                    var ctrl = this;
                    ctrl.userIsLoggedIn = null;
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        ctrl.userIsLoggedIn = userInfo.isLoggedIn();
                    });
                    ctrl.DEFAULT_EMPTY_TITLE = 'Untitled';
                    ctrl.ACTIVITY_TYPE_COLLECTION = constants.ACTIVITY_TYPE_COLLECTION;
                    ctrl.getLastUpdatedDatetime = function () {
                        return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(ctrl.getLastUpdatedMsec());
                    };
                    ctrl.getCollectionLink = function () {
                        var targetUrl = (ctrl.isLinkedToEditorPage ?
                            COLLECTION_EDITOR_URL : COLLECTION_VIEWER_URL);
                        return UrlInterpolationService.interpolateUrl(targetUrl, {
                            collection_id: ctrl.getCollectionId()
                        });
                    };
                    ctrl.getCompleteThumbnailIconUrl = function () {
                        return UrlInterpolationService.getStaticImageUrl(ctrl.getThumbnailIconUrl());
                    };
                    ctrl.getStaticImageUrl = function (url) {
                        return UrlInterpolationService.getStaticImageUrl(url);
                    };
                    ctrl.setHoverState = function (hoverState) {
                        ctrl.collectionIsCurrentlyHoveredOver = hoverState;
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Factory for creating new frontend instances of feedback
   message domain objects.
 */
oppia.factory('FeedbackMessageSummaryObjectFactory', [function () {
        var FeedbackMessageSummary = function (messageId, text, updatedStatus, suggestionHtml, currentContentHtml, description, authorUsername, authorPictureDataUrl, createdOn) {
            this.messageId = messageId;
            this.text = text;
            this.updatedStatus = updatedStatus;
            this.suggestionHtml = suggestionHtml;
            this.currentContentHtml = currentContentHtml;
            this.description = description;
            this.authorUsername = authorUsername;
            this.authorPictureDataUrl = authorPictureDataUrl;
            this.createdOn = createdOn;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        FeedbackMessageSummary['createNewMessage'] = function (
        /* eslint-enable dot-notation */
        newMessageId, newMessageText, authorUsername, authorPictureDataUrl) {
            return new FeedbackMessageSummary(newMessageId, newMessageText, null, null, null, null, authorUsername, authorPictureDataUrl, new Date());
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        FeedbackMessageSummary['createFromBackendDict'] = function (
        /* eslint-enable dot-notation */
        feedbackMessageSummaryBackendDict) {
            return new FeedbackMessageSummary(feedbackMessageSummaryBackendDict.message_id, feedbackMessageSummaryBackendDict.text, feedbackMessageSummaryBackendDict.updated_status, feedbackMessageSummaryBackendDict.suggestion_html, feedbackMessageSummaryBackendDict.current_content_html, feedbackMessageSummaryBackendDict.description, feedbackMessageSummaryBackendDict.author_username, feedbackMessageSummaryBackendDict.author_picture_data_url, feedbackMessageSummaryBackendDict.created_on);
        };
        return FeedbackMessageSummary;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Factory for creating new frontend instances of feedback thread
   domain objects.
 */
oppia.factory('FeedbackThreadSummaryObjectFactory', [function () {
        var FeedbackThreadSummary = function (status, originalAuthorId, lastUpdated, lastMessageText, totalMessageCount, lastMessageRead, secondLastMessageRead, authorLastMessage, authorSecondLastMessage, explorationTitle, explorationId, threadId) {
            this.status = status;
            this.originalAuthorId = originalAuthorId;
            this.lastUpdated = lastUpdated;
            this.lastMessageText = lastMessageText;
            this.totalMessageCount = totalMessageCount;
            this.lastMessageRead = lastMessageRead;
            this.secondLastMessageRead = secondLastMessageRead;
            this.authorLastMessage = authorLastMessage;
            this.authorSecondLastMessage = authorSecondLastMessage;
            this.explorationTitle = explorationTitle;
            this.explorationId = explorationId;
            this.threadId = threadId;
        };
        FeedbackThreadSummary.prototype.markTheLastTwoMessagesAsRead = function () {
            if (this.authorSecondLastMessage) {
                this.secondLastMessageRead = true;
            }
            this.lastMessageRead = true;
        };
        FeedbackThreadSummary.prototype.appendNewMessage = function (lastMessageText, authorLastMessage) {
            this.lastMessageText = lastMessageText;
            this.lastUpdated = new Date();
            this.authorSecondLastMessage = this.authorLastMessage;
            this.authorLastMessage = authorLastMessage;
            this.totalMessageCount += 1;
            this.lastMessageRead = true;
            this.secondLastMessageRead = true;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        FeedbackThreadSummary['create'] = function (
        /* eslint-enable dot-notation */
        status, originalAuthorId, lastUpdated, lastMessageText, totalMessageCount, lastMessageRead, secondLastMessageRead, authorLastMessage, authorSecondLastMessage, explorationTitle, explorationId, threadId) {
            return new FeedbackThreadSummary(status, originalAuthorId, lastUpdated, lastMessageText, totalMessageCount, lastMessageRead, secondLastMessageRead, authorLastMessage, authorSecondLastMessage, explorationTitle, explorationId, threadId);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        FeedbackThreadSummary['createFromBackendDict'] = function (
        /* eslint-enable dot-notation */
        feedbackThreadSummaryBackendDict) {
            return new FeedbackThreadSummary(feedbackThreadSummaryBackendDict.status, feedbackThreadSummaryBackendDict.original_author_id, feedbackThreadSummaryBackendDict.last_updated, feedbackThreadSummaryBackendDict.last_message_text, feedbackThreadSummaryBackendDict.total_message_count, feedbackThreadSummaryBackendDict.last_message_read, feedbackThreadSummaryBackendDict.second_last_message_read, feedbackThreadSummaryBackendDict.author_last_message, feedbackThreadSummaryBackendDict.author_second_last_message, feedbackThreadSummaryBackendDict.exploration_title, feedbackThreadSummaryBackendDict.exploration_id, feedbackThreadSummaryBackendDict.thread_id);
        };
        return FeedbackThreadSummary;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardBackendApiService.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardBackendApiService.ts ***!
  \***********************************************************************************************/
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
 * @fileoverview Service to retrieve information of learner dashboard from the
 * backend.
 */
oppia.factory('LearnerDashboardBackendApiService', ['$http', function ($http) {
        var _fetchLearnerDashboardData = function () {
            return $http.get('/learnerdashboardhandler/data');
        };
        return {
            fetchLearnerDashboardData: _fetchLearnerDashboardData
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts ***!
  \************************************************************************************************/
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
 * @fileoverview ConvertToPlainText filter for Oppia.
 */
angular.module('stringUtilityFiltersModule').filter('convertToPlainText', [function () {
        return function (input) {
            var strippedText = input.replace(/(<([^>]+)>)/ig, '');
            strippedText = strippedText.replace(/&nbsp;/ig, ' ');
            strippedText = strippedText.replace(/&quot;/ig, '');
            var trimmedText = strippedText.trim();
            if (trimmedText.length === 0) {
                return strippedText;
            }
            else {
                return trimmedText;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/feedback-tab-services/thread-status-display/thread-status-display.service.ts":
/*!*********************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/feedback-tab-services/thread-status-display/thread-status-display.service.ts ***!
  \*********************************************************************************************************************************************************/
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
 * @fileoverview Service that provides information about how to display the
 * status label for a thread in the feedback tab of the exploration editor.
 */
angular.module('feedbackTabModule').factory('ThreadStatusDisplayService', [function () {
        var _STATUS_CHOICES = [{
                id: 'open',
                text: 'Open'
            }, {
                id: 'fixed',
                text: 'Fixed'
            }, {
                id: 'ignored',
                text: 'Ignored'
            }, {
                id: 'compliment',
                text: 'Compliment'
            }, {
                id: 'not_actionable',
                text: 'Not Actionable'
            }];
        return {
            STATUS_CHOICES: angular.copy(_STATUS_CHOICES),
            getLabelClass: function (status) {
                if (status === 'open') {
                    return 'label label-info';
                }
                else if (status === 'compliment') {
                    return 'label label-success';
                }
                else {
                    return 'label label-default';
                }
            },
            getHumanReadableStatus: function (status) {
                for (var i = 0; i < _STATUS_CHOICES.length; i++) {
                    if (_STATUS_CHOICES[i].id === status) {
                        return _STATUS_CHOICES[i].text;
                    }
                }
                return '';
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.controller.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.controller.ts ***!
  \***************************************************************************************************/
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
 * @fileoverview Controllers for the Learner dashboard.
 */
__webpack_require__(/*! components/common-layout-directives/background-banner/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts");
__webpack_require__(/*! components/common-layout-directives/loading-dots/loading-dots.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.directive.ts");
__webpack_require__(/*! components/summary-tile-directives/collection-summary-tile/collection-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile-directives/collection-summary-tile/collection-summary-tile.directive.ts");
__webpack_require__(/*! components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.directive.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
__webpack_require__(/*! domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts */ "./core/templates/dev/head/domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts");
__webpack_require__(/*! domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts */ "./core/templates/dev/head/domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts");
__webpack_require__(/*! domain/learner_dashboard/LearnerDashboardBackendApiService.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardBackendApiService.ts");
__webpack_require__(/*! pages/exploration-editor-page/feedback-tab/feedback-tab-services/thread-status-display/thread-status-display.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/feedback-tab-services/thread-status-display/thread-status-display.service.ts");
__webpack_require__(/*! pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-view/show-suggestion-modal-for-learner-view.service.ts */ "./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-view/show-suggestion-modal-for-learner-view.service.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('learnerDashboardPageModule').controller('LearnerDashboard', [
    '$scope', '$rootScope', '$q', '$window', '$http', '$uibModal',
    'AlertsService', 'EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS',
    'SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS', 'FATAL_ERROR_CODES',
    'LearnerDashboardBackendApiService', 'UrlInterpolationService',
    'LEARNER_DASHBOARD_SECTION_I18N_IDS',
    'LEARNER_DASHBOARD_SUBSECTION_I18N_IDS', 'ThreadStatusDisplayService',
    'DateTimeFormatService', 'FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS',
    'FeedbackThreadSummaryObjectFactory', 'FeedbackMessageSummaryObjectFactory',
    'ShowSuggestionModalForLearnerViewService', 'UserService',
    function ($scope, $rootScope, $q, $window, $http, $uibModal, AlertsService, EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS, SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS, FATAL_ERROR_CODES, LearnerDashboardBackendApiService, UrlInterpolationService, LEARNER_DASHBOARD_SECTION_I18N_IDS, LEARNER_DASHBOARD_SUBSECTION_I18N_IDS, ThreadStatusDisplayService, DateTimeFormatService, FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS, FeedbackThreadSummaryObjectFactory, FeedbackMessageSummaryObjectFactory, ShowSuggestionModalForLearnerViewService, UserService) {
        $scope.EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS = (EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS);
        $scope.SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS = (SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS);
        $scope.FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS = (FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS);
        $scope.LEARNER_DASHBOARD_SECTION_I18N_IDS = (LEARNER_DASHBOARD_SECTION_I18N_IDS);
        $scope.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS = (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS);
        $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
        $scope.PAGE_SIZE = 8;
        $scope.Math = window.Math;
        UserService.getProfileImageDataUrlAsync().then(function (dataUrl) {
            $scope.profilePictureDataUrl = dataUrl;
        });
        $rootScope.loadingMessage = 'Loading';
        $scope.username = '';
        var userInfoPromise = UserService.getUserInfoAsync();
        userInfoPromise.then(function (userInfo) {
            $scope.username = userInfo.getUsername();
        });
        var dashboardDataPromise = (LearnerDashboardBackendApiService.fetchLearnerDashboardData());
        dashboardDataPromise.then(function (response) {
            var responseData = response.data;
            $scope.isCurrentExpSortDescending = true;
            $scope.isCurrentSubscriptionSortDescending = true;
            $scope.isCurrentFeedbackSortDescending = true;
            $scope.currentExpSortType = (EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS.LAST_PLAYED.key);
            $scope.currentSubscribersSortType = (SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS.USERNAME.key);
            $scope.currentFeedbackThreadsSortType = (FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS.LAST_UPDATED.key);
            $scope.startIncompleteExpIndex = 0;
            $scope.startCompletedExpIndex = 0;
            $scope.startIncompleteCollectionIndex = 0;
            $scope.startCompletedCollectionIndex = 0;
            $scope.completedExplorationsList = (responseData.completed_explorations_list);
            $scope.completedCollectionsList = (responseData.completed_collections_list);
            $scope.incompleteExplorationsList = (responseData.incomplete_explorations_list);
            $scope.incompleteCollectionsList = (responseData.incomplete_collections_list);
            $scope.subscriptionsList = (responseData.subscription_list);
            $scope.numberNonexistentIncompleteExplorations = (responseData.number_of_nonexistent_activities.incomplete_explorations);
            $scope.numberNonexistentIncompleteCollections = (responseData.number_of_nonexistent_activities.incomplete_collections);
            $scope.numberNonexistentCompletedExplorations = (responseData.number_of_nonexistent_activities.completed_explorations);
            $scope.numberNonexistentCompletedCollections = (responseData.number_of_nonexistent_activities.completed_collections);
            $scope.numberNonexistentExplorationsFromPlaylist = (responseData.number_of_nonexistent_activities.exploration_playlist);
            $scope.numberNonexistentCollectionsFromPlaylist = (responseData.number_of_nonexistent_activities.collection_playlist);
            $scope.completedToIncompleteCollections = (responseData.completed_to_incomplete_collections);
            var threadSummaryDicts = responseData.thread_summaries;
            $scope.threadSummaries = [];
            for (var index = 0; index < threadSummaryDicts.length; index++) {
                $scope.threadSummaries.push(FeedbackThreadSummaryObjectFactory.createFromBackendDict(threadSummaryDicts[index]));
            }
            $scope.numberOfUnreadThreads = responseData.number_of_unread_threads;
            $scope.explorationPlaylist = responseData.exploration_playlist;
            $scope.collectionPlaylist = responseData.collection_playlist;
            $scope.activeSection = LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE;
            $scope.activeSubsection = (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS);
            $scope.feedbackThreadActive = false;
            $scope.noExplorationActivity = (($scope.completedExplorationsList.length === 0) &&
                ($scope.incompleteExplorationsList.length === 0));
            $scope.noCollectionActivity = (($scope.completedCollectionsList.length === 0) &&
                ($scope.incompleteCollectionsList.length === 0));
            $scope.noActivity = (($scope.noExplorationActivity) && ($scope.noCollectionActivity) &&
                ($scope.explorationPlaylist.length === 0) &&
                ($scope.collectionPlaylist.length === 0));
        }, function (errorResponse) {
            if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
                AlertsService.addWarning('Failed to get learner dashboard data');
            }
        });
        $q.all([userInfoPromise, dashboardDataPromise]).then(function () {
            $rootScope.loadingMessage = '';
        });
        $scope.loadingFeedbacks = false;
        var threadIndex = null;
        $scope.newMessage = {
            text: ''
        };
        $scope.getLabelClass = ThreadStatusDisplayService.getLabelClass;
        $scope.getHumanReadableStatus = (ThreadStatusDisplayService.getHumanReadableStatus);
        $scope.getLocaleAbbreviatedDatetimeString = (DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
        $scope.setActiveSection = function (newActiveSectionName) {
            $scope.activeSection = newActiveSectionName;
            if ($scope.activeSection ===
                LEARNER_DASHBOARD_SECTION_I18N_IDS.FEEDBACK &&
                $scope.feedbackThreadActive === true) {
                $scope.feedbackThreadActive = false;
            }
        };
        $scope.setActiveSubsection = function (newActiveSubsectionName) {
            $scope.activeSubsection = newActiveSubsectionName;
        };
        $scope.getExplorationUrl = function (explorationId) {
            return '/explore/' + explorationId;
        };
        $scope.getCollectionUrl = function (collectionId) {
            return '/collection/' + collectionId;
        };
        $scope.checkMobileView = function () {
            return ($window.innerWidth < 500);
        };
        $scope.getVisibleExplorationList = function (startCompletedExpIndex) {
            return $scope.completedExplorationsList.slice(startCompletedExpIndex, Math.min(startCompletedExpIndex + $scope.PAGE_SIZE, $scope.completedExplorationsList.length));
        };
        $scope.showUsernamePopover = function (subscriberUsername) {
            // The popover on the subscription card is only shown if the length of
            // the subscriber username is greater than 10 and the user hovers over
            // the truncated username.
            if (subscriberUsername.length > 10) {
                return 'mouseenter';
            }
            else {
                return 'none';
            }
        };
        $scope.goToPreviousPage = function (section, subsection) {
            if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
                if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                    $scope.startIncompleteExpIndex = Math.max($scope.startIncompleteExpIndex - $scope.PAGE_SIZE, 0);
                }
                else if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                    $scope.startIncompleteCollectionIndex = Math.max($scope.startIncompleteCollectionIndex - $scope.PAGE_SIZE, 0);
                }
            }
            else if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.COMPLETED) {
                if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                    $scope.startCompletedExpIndex = Math.max($scope.startCompletedExpIndex - $scope.PAGE_SIZE, 0);
                }
                else if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                    $scope.startCompletedCollectionIndex = Math.max($scope.startCompletedCollectionIndex - $scope.PAGE_SIZE, 0);
                }
            }
        };
        $scope.goToNextPage = function (section, subsection) {
            if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
                if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                    if ($scope.startIncompleteExpIndex +
                        $scope.PAGE_SIZE <= $scope.incompleteExplorationsList.length) {
                        $scope.startIncompleteExpIndex += $scope.PAGE_SIZE;
                    }
                }
                else if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                    if ($scope.startIncompleteCollectionIndex +
                        $scope.PAGE_SIZE <= $scope.startIncompleteCollectionIndex.length) {
                        $scope.startIncompleteCollectionIndex += $scope.PAGE_SIZE;
                    }
                }
            }
            else if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.COMPLETED) {
                if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                    if ($scope.startCompletedExpIndex +
                        $scope.PAGE_SIZE <= $scope.completedExplorationsList.length) {
                        $scope.startCompletedExpIndex += $scope.PAGE_SIZE;
                    }
                }
                else if (subsection === LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                    if ($scope.startCompletedCollectionIndex +
                        $scope.PAGE_SIZE <= $scope.startCompletedCollectionIndex.length) {
                        $scope.startCompletedCollectionIndex += $scope.PAGE_SIZE;
                    }
                }
            }
        };
        $scope.setExplorationsSortingOptions = function (sortType) {
            if (sortType === $scope.currentExpSortType) {
                $scope.isCurrentExpSortDescending = !$scope.isCurrentExpSortDescending;
            }
            else {
                $scope.currentExpSortType = sortType;
            }
        };
        $scope.setSubscriptionSortingOptions = function (sortType) {
            if (sortType === $scope.currentSubscriptionSortType) {
                $scope.isCurrentSubscriptionSortDescending = (!$scope.isCurrentSubscriptionSortDescending);
            }
            else {
                $scope.currentSubscriptionSortType = sortType;
            }
        };
        $scope.setFeedbackSortingOptions = function (sortType) {
            if (sortType === $scope.currentFeedbackThreadsSortType) {
                $scope.isCurrentFeedbackSortDescending = (!$scope.isCurrentFeedbackSortDescending);
            }
            else {
                $scope.currentFeedbackThreadsSortType = sortType;
            }
        };
        $scope.getValueOfExplorationSortKey = function (exploration) {
            // This function is passed as a custom comparator function to `orderBy`,
            // so that special cases can be handled while sorting explorations.
            if ($scope.currentExpSortType ===
                EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS.LAST_PLAYED.key) {
                return null;
            }
            else {
                return exploration[$scope.currentExpSortType];
            }
        };
        $scope.getValueOfSubscriptionSortKey = function (subscription) {
            // This function is passed as a custom comparator function to `orderBy`,
            // so that special cases can be handled while sorting subscriptions.
            var value = subscription[$scope.currentSubscribersSortType];
            if ($scope.currentSubscribersSortType ===
                SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS.IMPACT.key) {
                value = (value || 0);
            }
            return value;
        };
        $scope.sortFeedbackThreadsFunction = function (feedbackThread) {
            return feedbackThread[$scope.currentFeedbackThreadsSortType];
        };
        var getPlaylistSortableOptions = function (activityType) {
            return {
                'ui-floating': 'auto',
                start: function (e, ui) {
                    ui.placeholder.height(ui.item.height());
                    $scope.$apply();
                },
                sort: function (e, ui) {
                    /* eslint-disable quote-props */
                    // Making top : 0px to avoid irregular change in position.
                    ui.helper.css({ 'top': '0 px' });
                    /* eslint-enable quote-props */
                },
                update: function (e, ui) {
                    var insertExpInLearnerPlaylistUrl = (UrlInterpolationService.interpolateUrl('/learnerplaylistactivityhandler/<activityType>/<activityId>', {
                        activityType: activityType,
                        activityId: ($scope.explorationPlaylist[ui.item.sortable.index].id)
                    }));
                    $http.post(insertExpInLearnerPlaylistUrl, {
                        index: ui.item.sortable.dropindex
                    });
                    $scope.$apply();
                },
                stop: function (e, ui) {
                    $scope.$apply();
                },
                axis: 'y'
            };
        };
        $scope.collectionPlaylistSortableOptions = getPlaylistSortableOptions(constants.ACTIVITY_TYPE_COLLECTION);
        $scope.explorationPlaylistSortableOptions = getPlaylistSortableOptions(constants.ACTIVITY_TYPE_EXPLORATION);
        $scope.onClickThread = function (threadStatus, explorationId, threadId, explorationTitle) {
            $scope.loadingFeedbacks = true;
            var threadDataUrl = UrlInterpolationService.interpolateUrl('/learnerdashboardthreadhandler/<threadId>', {
                threadId: threadId
            });
            $scope.explorationTitle = explorationTitle;
            $scope.feedbackThreadActive = true;
            $scope.threadStatus = threadStatus;
            $scope.explorationId = explorationId;
            $scope.threadId = threadId;
            for (var index = 0; index < $scope.threadSummaries.length; index++) {
                if ($scope.threadSummaries[index].threadId === threadId) {
                    threadIndex = index;
                    var threadSummary = $scope.threadSummaries[index];
                    threadSummary.markTheLastTwoMessagesAsRead();
                    if (!threadSummary.lastMessageRead) {
                        $scope.numberOfUnreadThreads -= 1;
                    }
                }
            }
            $http.get(threadDataUrl).then(function (response) {
                var messageSummaryDicts = response.data.message_summary_list;
                $scope.messageSummaries = [];
                for (index = 0; index < messageSummaryDicts.length; index++) {
                    $scope.messageSummaries.push(FeedbackMessageSummaryObjectFactory.createFromBackendDict(messageSummaryDicts[index]));
                }
                $scope.loadingFeedbacks = false;
            });
        };
        $scope.showAllThreads = function () {
            $scope.feedbackThreadActive = false;
            threadIndex = null;
        };
        $scope.addNewMessage = function (threadId, newMessage) {
            var url = UrlInterpolationService.interpolateUrl('/threadhandler/<threadId>', {
                threadId: threadId
            });
            var payload = {
                updated_status: null,
                updated_subject: null,
                text: newMessage
            };
            $scope.messageSendingInProgress = true;
            $http.post(url, payload).success(function () {
                $scope.threadSummary = $scope.threadSummaries[threadIndex];
                $scope.threadSummary.appendNewMessage(newMessage, $scope.username);
                $scope.messageSendingInProgress = false;
                $scope.newMessage.text = null;
                var newMessageSummary = (FeedbackMessageSummaryObjectFactory.createNewMessage($scope.threadSummary.totalMessageCount, newMessage, $scope.username, $scope.profilePictureDataUrl));
                $scope.messageSummaries.push(newMessageSummary);
            });
        };
        $scope.showSuggestionModal = function (newContent, oldContent, description) {
            ShowSuggestionModalForLearnerViewService.showSuggestionModal('edit_exploration_state_content', {
                newContent: newContent,
                oldContent: oldContent,
                description: description
            });
        };
        $scope.openRemoveActivityModal = function (sectionNameI18nId, subsectionName, activity) {
            $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/learner-dashboard-page/learner-dashboard-page-templates/' +
                    'remove-activity-from-learner-dashboard-modal.template.html'),
                backdrop: true,
                resolve: {
                    sectionNameI18nId: function () {
                        return sectionNameI18nId;
                    },
                    subsectionName: function () {
                        return subsectionName;
                    },
                    activity: function () {
                        return activity;
                    }
                },
                controller: [
                    '$scope', '$uibModalInstance', '$http', 'sectionNameI18nId',
                    'subsectionName',
                    function ($scope, $uibModalInstance, $http, sectionNameI18nId, subsectionName) {
                        $scope.sectionNameI18nId = sectionNameI18nId;
                        $scope.subsectionName = subsectionName;
                        $scope.activityTitle = activity.title;
                        $scope.remove = function () {
                            var activityType = '';
                            if (subsectionName ===
                                LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                                activityType = constants.ACTIVITY_TYPE_EXPLORATION;
                            }
                            else if (subsectionName ===
                                LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                                activityType = constants.ACTIVITY_TYPE_COLLECTION;
                            }
                            else {
                                throw new Error('Subsection name is not valid.');
                            }
                            var removeActivityUrlPrefix = '';
                            if (sectionNameI18nId ===
                                LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
                                removeActivityUrlPrefix = '/learnerplaylistactivityhandler/';
                            }
                            else if (sectionNameI18nId ===
                                LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
                                removeActivityUrlPrefix = '/learnerincompleteactivityhandler/';
                            }
                            else {
                                throw new Error('Section name is not valid.');
                            }
                            var removeActivityUrl = (UrlInterpolationService.interpolateUrl(removeActivityUrlPrefix + '<activityType>/<activityId>', {
                                activityType: activityType,
                                activityId: activity.id
                            }));
                            $http['delete'](removeActivityUrl);
                            $uibModalInstance.close();
                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                ]
            }).result.then(function () {
                if (sectionNameI18nId ===
                    LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
                    if (subsectionName ===
                        LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                        var index = $scope.incompleteExplorationsList.indexOf(activity);
                        if (index !== -1) {
                            $scope.incompleteExplorationsList.splice(index, 1);
                        }
                    }
                    else if (subsectionName ===
                        LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                        var index = $scope.incompleteCollectionsList.indexOf(activity);
                        if (index !== -1) {
                            $scope.incompleteCollectionsList.splice(index, 1);
                        }
                    }
                }
                else if (sectionNameI18nId ===
                    LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
                    if (subsectionName ===
                        LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                        var index = $scope.explorationPlaylist.indexOf(activity);
                        if (index !== -1) {
                            $scope.explorationPlaylist.splice(index, 1);
                        }
                    }
                    else if (subsectionName ===
                        LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                        var index = $scope.collectionPlaylist.indexOf(activity);
                        if (index !== -1) {
                            $scope.collectionPlaylist.splice(index, 1);
                        }
                    }
                }
            });
        };
    }
]).animation('.menu-sub-section', function () {
    var NG_HIDE_CLASS = 'ng-hide';
    return {
        beforeAddClass: function (element, className, done) {
            if (className === NG_HIDE_CLASS) {
                element.slideUp(done);
            }
        },
        removeClass: function (element, className, done) {
            if (className === NG_HIDE_CLASS) {
                element.hide().slideDown(done);
            }
        }
    };
});


/***/ }),

/***/ "./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-view/show-suggestion-modal-for-learner-view.service.ts":
/*!*************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-view/show-suggestion-modal-for-learner-view.service.ts ***!
  \*************************************************************************************************************************************************************/
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
 * @fileoverview Service to display suggestion modal in learner view.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('showSuggestionModalForLearnerViewModule').factory('ShowSuggestionModalForLearnerViewService', [
    '$rootScope', '$uibModal',
    'UrlInterpolationService',
    function ($rootScope, $uibModal, UrlInterpolationService) {
        var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl('/pages/show-suggestion-editor-pages/' +
            'show-suggestion-modal-for-learner-view/' +
            'show-suggestion-modal-for-learner-view.directive.html');
        var _showEditStateContentSuggestionModal = function (newContent, oldContent, description) {
            $uibModal.open({
                templateUrl: _templateUrl,
                backdrop: true,
                resolve: {
                    newContent: function () {
                        return newContent;
                    },
                    oldContent: function () {
                        return oldContent;
                    },
                    description: function () {
                        return description;
                    }
                },
                controller: 'ShowSuggestionModalForLearnerView'
            });
        };
        return {
            showSuggestionModal: function (suggestionType, extraParams) {
                if (suggestionType === 'edit_exploration_state_content') {
                    _showEditStateContentSuggestionModal(extraParams.newContent, extraParams.oldContent, extraParams.description);
                }
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


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2xvYWRpbmctZG90cy9sb2FkaW5nLWRvdHMuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3VtbWFyeS10aWxlLWRpcmVjdGl2ZXMvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9mZWVkYmFja19tZXNzYWdlL0ZlZWRiYWNrTWVzc2FnZVN1bW1hcnlPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9mZWVkYmFja190aHJlYWQvRmVlZGJhY2tUaHJlYWRTdW1tYXJ5T2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lckRhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy9jb252ZXJ0LXRvLXBsYWluLXRleHQuZmlsdGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2ZlZWRiYWNrLXRhYi9mZWVkYmFjay10YWItc2VydmljZXMvdGhyZWFkLXN0YXR1cy1kaXNwbGF5L3RocmVhZC1zdGF0dXMtZGlzcGxheS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS5jb250cm9sbGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3Nob3ctc3VnZ2VzdGlvbi1lZGl0b3ItcGFnZXMvc2hvdy1zdWdnZXN0aW9uLW1vZGFsLWZvci1sZWFybmVyLXZpZXcvc2hvdy1zdWdnZXN0aW9uLW1vZGFsLWZvci1sZWFybmVyLXZpZXcuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQVEsb0JBQW9CO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQWlCLDRCQUE0QjtBQUM3QztBQUNBO0FBQ0EsMEJBQWtCLDJCQUEyQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQWdCLHVCQUF1QjtBQUN2Qzs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsZ0NBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQyxFQUFFO0FBQ3hDO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyx3SkFBNEQ7QUFDcEUsbUJBQU8sQ0FBQyxvS0FBa0U7QUFDMUUsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0MsbUJBQU8sQ0FBQyxrRkFBeUI7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQzVDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDOURMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ3hCTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVEQUF1RDtBQUN2RCx1REFBdUQ7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSwrQkFBK0IsNEJBQTRCO0FBQzNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDeERMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyw0TUFDNEI7QUFDcEMsbUJBQU8sQ0FBQyx3TEFBNEU7QUFDcEYsbUJBQU8sQ0FBQyxrT0FDa0M7QUFDMUMsbUJBQU8sQ0FBQyxzT0FDbUM7QUFDM0MsbUJBQU8sQ0FBQyxzSUFBbUQ7QUFDM0QsbUJBQU8sQ0FBQyxnS0FBZ0U7QUFDeEUsbUJBQU8sQ0FBQyw0SkFBOEQ7QUFDdEUsbUJBQU8sQ0FBQyw4SkFBK0Q7QUFDdkUsbUJBQU8sQ0FBQyxrUkFDb0Q7QUFDNUQsbUJBQU8sQ0FBQywwUkFDK0M7QUFDdkQsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkMsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0MsbUJBQU8sQ0FBQyxrRkFBeUI7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLG1DQUFtQztBQUNsRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyxnQkFBZ0I7QUFDbkQ7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLHVDQUF1QztBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0Isb0NBQW9DO0FBQ25FO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOzs7Ozs7Ozs7Ozs7QUN0Y0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FLEdBQUc7QUFDdEU7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsNERBQTRELEdBQUcsRUFBRSxFQUFFO0FBQ25FO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0Esb0RBQW9ELEdBQUc7QUFDdkQ7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsdUJBQXVCO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUsiLCJmaWxlIjoibGVhcm5lcl9kYXNoYm9hcmQuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRyZXR1cm4gcmVzdWx0O1xuIFx0fVxuXG4gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGFuZCBsb2FkaW5nIGNodW5rc1xuIFx0Ly8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4gXHQvLyBQcm9taXNlID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxuIFx0dmFyIGluc3RhbGxlZENodW5rcyA9IHtcbiBcdFx0XCJsZWFybmVyX2Rhc2hib2FyZFwiOiAwXG4gXHR9O1xuXG4gXHR2YXIgZGVmZXJyZWRNb2R1bGVzID0gW107XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdHZhciBqc29ucEFycmF5ID0gd2luZG93W1wid2VicGFja0pzb25wXCJdID0gd2luZG93W1wid2VicGFja0pzb25wXCJdIHx8IFtdO1xuIFx0dmFyIG9sZEpzb25wRnVuY3Rpb24gPSBqc29ucEFycmF5LnB1c2guYmluZChqc29ucEFycmF5KTtcbiBcdGpzb25wQXJyYXkucHVzaCA9IHdlYnBhY2tKc29ucENhbGxiYWNrO1xuIFx0anNvbnBBcnJheSA9IGpzb25wQXJyYXkuc2xpY2UoKTtcbiBcdGZvcih2YXIgaSA9IDA7IGkgPCBqc29ucEFycmF5Lmxlbmd0aDsgaSsrKSB3ZWJwYWNrSnNvbnBDYWxsYmFjayhqc29ucEFycmF5W2ldKTtcbiBcdHZhciBwYXJlbnRKc29ucEZ1bmN0aW9uID0gb2xkSnNvbnBGdW5jdGlvbjtcblxuXG4gXHQvLyBhZGQgZW50cnkgbW9kdWxlIHRvIGRlZmVycmVkIGxpc3RcbiBcdGRlZmVycmVkTW9kdWxlcy5wdXNoKFtcIi4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS9sZWFybmVyLWRhc2hib2FyZC1wYWdlLmNvbnRyb2xsZXIudHNcIixcImFib3V0fmFkbWlufmFwcH5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lbWFpbF9kYXNoYm9hcmR+YzFlNTBjYzBcIixcImNvbGxlY3Rpb25fcGxheWVyfmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+bGVhcm5lcl9kYXNoYm9hcmR+bGlicmFyeX5+ODhjYWE1ZGZcIixcImNvbGxlY3Rpb25fcGxheWVyfmxlYXJuZXJfZGFzaGJvYXJkfmxpYnJhcnl+cHJvZmlsZVwiXSk7XG4gXHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIHJlYWR5XG4gXHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgYmFja2dyb3VuZCBiYW5uZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdiYWNrZ3JvdW5kQmFubmVyTW9kdWxlJykuZGlyZWN0aXZlKCdiYWNrZ3JvdW5kQmFubmVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvJyArXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NzaWJsZUJhbm5lckZpbGVuYW1lcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICdiYW5uZXJBLnN2ZycsICdiYW5uZXJCLnN2ZycsICdiYW5uZXJDLnN2ZycsICdiYW5uZXJELnN2ZydcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhbm5lckltYWdlRmlsZW5hbWUgPSBwb3NzaWJsZUJhbm5lckZpbGVuYW1lc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwb3NzaWJsZUJhbm5lckZpbGVuYW1lcy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5iYW5uZXJJbWFnZUZpbGVVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2JhY2tncm91bmQvJyArIGJhbm5lckltYWdlRmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBkaXNwbGF5aW5nIGFuaW1hdGVkIGxvYWRpbmcgZG90cy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2xvYWRpbmdEb3RzTW9kdWxlJykuZGlyZWN0aXZlKCdsb2FkaW5nRG90cycsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2xvYWRpbmctZG90cy8nICtcbiAgICAgICAgICAgICAgICAnbG9hZGluZy1kb3RzLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkgeyB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTdW1tYXJ5IHRpbGUgZm9yIGNvbGxlY3Rpb25zLlxuICovXG5yZXF1aXJlKCdkb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lckRhc2hib2FyZEljb25zRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdHJ1bmNhdGUtYW5kLWNhcGl0YWxpemUuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9EYXRlVGltZUZvcm1hdFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1VzZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnY29sbGVjdGlvblN1bW1hcnlUaWxlTW9kdWxlJykuZGlyZWN0aXZlKCdjb2xsZWN0aW9uU3VtbWFyeVRpbGUnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGdldENvbGxlY3Rpb25JZDogJyZjb2xsZWN0aW9uSWQnLFxuICAgICAgICAgICAgICAgIGdldENvbGxlY3Rpb25UaXRsZTogJyZjb2xsZWN0aW9uVGl0bGUnLFxuICAgICAgICAgICAgICAgIGdldE9iamVjdGl2ZTogJyZvYmplY3RpdmUnLFxuICAgICAgICAgICAgICAgIGdldE5vZGVDb3VudDogJyZub2RlQ291bnQnLFxuICAgICAgICAgICAgICAgIGdldExhc3RVcGRhdGVkTXNlYzogJyZsYXN0VXBkYXRlZE1zZWMnLFxuICAgICAgICAgICAgICAgIGdldFRodW1ibmFpbEljb25Vcmw6ICcmdGh1bWJuYWlsSWNvblVybCcsXG4gICAgICAgICAgICAgICAgZ2V0VGh1bWJuYWlsQmdDb2xvcjogJyZ0aHVtYm5haWxCZ0NvbG9yJyxcbiAgICAgICAgICAgICAgICBpc0xpbmtlZFRvRWRpdG9yUGFnZTogJz0/aXNMaW5rZWRUb0VkaXRvclBhZ2UnLFxuICAgICAgICAgICAgICAgIGdldENhdGVnb3J5OiAnJmNhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBpc1BsYXlsaXN0VGlsZTogJyZpc1BsYXlsaXN0VGlsZScsXG4gICAgICAgICAgICAgICAgc2hvd0xlYXJuZXJEYXNoYm9hcmRJY29uc0lmUG9zc2libGU6ICgnJnNob3dMZWFybmVyRGFzaGJvYXJkSWNvbnNJZlBvc3NpYmxlJyksXG4gICAgICAgICAgICAgICAgaXNDb250YWluZXJOYXJyb3c6ICcmY29udGFpbmVySXNOYXJyb3cnLFxuICAgICAgICAgICAgICAgIGlzT3duZWRCeUN1cnJlbnRVc2VyOiAnJmFjdGl2aXR5SXNPd25lZEJ5Q3VycmVudFVzZXInLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvc3VtbWFyeS10aWxlLWRpcmVjdGl2ZXMvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUvJyArXG4gICAgICAgICAgICAgICAgJ2NvbGxlY3Rpb24tc3VtbWFyeS10aWxlLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJ0RhdGVUaW1lRm9ybWF0U2VydmljZScsICdVc2VyU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0NPTExFQ1RJT05fVklFV0VSX1VSTCcsICdDT0xMRUNUSU9OX0VESVRPUl9VUkwnLCBmdW5jdGlvbiAoRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLCBVc2VyU2VydmljZSwgQ09MTEVDVElPTl9WSUVXRVJfVVJMLCBDT0xMRUNUSU9OX0VESVRPUl9VUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJJc0xvZ2dlZEluID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgVXNlclNlcnZpY2UuZ2V0VXNlckluZm9Bc3luYygpLnRoZW4oZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJJc0xvZ2dlZEluID0gdXNlckluZm8uaXNMb2dnZWRJbigpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5ERUZBVUxUX0VNUFRZX1RJVExFID0gJ1VudGl0bGVkJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5BQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04gPSBjb25zdGFudHMuQUNUSVZJVFlfVFlQRV9DT0xMRUNUSU9OO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldExhc3RVcGRhdGVkRGF0ZXRpbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLmdldExvY2FsZUFiYnJldmlhdGVkRGF0ZXRpbWVTdHJpbmcoY3RybC5nZXRMYXN0VXBkYXRlZE1zZWMoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0Q29sbGVjdGlvbkxpbmsgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0VXJsID0gKGN0cmwuaXNMaW5rZWRUb0VkaXRvclBhZ2UgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENPTExFQ1RJT05fRURJVE9SX1VSTCA6IENPTExFQ1RJT05fVklFV0VSX1VSTCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwodGFyZ2V0VXJsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbl9pZDogY3RybC5nZXRDb2xsZWN0aW9uSWQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0Q29tcGxldGVUaHVtYm5haWxJY29uVXJsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKGN0cmwuZ2V0VGh1bWJuYWlsSWNvblVybCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRTdGF0aWNJbWFnZVVybCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNldEhvdmVyU3RhdGUgPSBmdW5jdGlvbiAoaG92ZXJTdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2xsZWN0aW9uSXNDdXJyZW50bHlIb3ZlcmVkT3ZlciA9IGhvdmVyU3RhdGU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mIGZlZWRiYWNrXG4gICBtZXNzYWdlIGRvbWFpbiBvYmplY3RzLlxuICovXG5vcHBpYS5mYWN0b3J5KCdGZWVkYmFja01lc3NhZ2VTdW1tYXJ5T2JqZWN0RmFjdG9yeScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBGZWVkYmFja01lc3NhZ2VTdW1tYXJ5ID0gZnVuY3Rpb24gKG1lc3NhZ2VJZCwgdGV4dCwgdXBkYXRlZFN0YXR1cywgc3VnZ2VzdGlvbkh0bWwsIGN1cnJlbnRDb250ZW50SHRtbCwgZGVzY3JpcHRpb24sIGF1dGhvclVzZXJuYW1lLCBhdXRob3JQaWN0dXJlRGF0YVVybCwgY3JlYXRlZE9uKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VJZCA9IG1lc3NhZ2VJZDtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZWRTdGF0dXMgPSB1cGRhdGVkU3RhdHVzO1xuICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9uSHRtbCA9IHN1Z2dlc3Rpb25IdG1sO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29udGVudEh0bWwgPSBjdXJyZW50Q29udGVudEh0bWw7XG4gICAgICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG4gICAgICAgICAgICB0aGlzLmF1dGhvclVzZXJuYW1lID0gYXV0aG9yVXNlcm5hbWU7XG4gICAgICAgICAgICB0aGlzLmF1dGhvclBpY3R1cmVEYXRhVXJsID0gYXV0aG9yUGljdHVyZURhdGFVcmw7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZWRPbiA9IGNyZWF0ZWRPbjtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgRmVlZGJhY2tNZXNzYWdlU3VtbWFyeVsnY3JlYXRlTmV3TWVzc2FnZSddID0gZnVuY3Rpb24gKFxuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBuZXdNZXNzYWdlSWQsIG5ld01lc3NhZ2VUZXh0LCBhdXRob3JVc2VybmFtZSwgYXV0aG9yUGljdHVyZURhdGFVcmwpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRmVlZGJhY2tNZXNzYWdlU3VtbWFyeShuZXdNZXNzYWdlSWQsIG5ld01lc3NhZ2VUZXh0LCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBhdXRob3JVc2VybmFtZSwgYXV0aG9yUGljdHVyZURhdGFVcmwsIG5ldyBEYXRlKCkpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBGZWVkYmFja01lc3NhZ2VTdW1tYXJ5WydjcmVhdGVGcm9tQmFja2VuZERpY3QnXSA9IGZ1bmN0aW9uIChcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgZmVlZGJhY2tNZXNzYWdlU3VtbWFyeUJhY2tlbmREaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZlZWRiYWNrTWVzc2FnZVN1bW1hcnkoZmVlZGJhY2tNZXNzYWdlU3VtbWFyeUJhY2tlbmREaWN0Lm1lc3NhZ2VfaWQsIGZlZWRiYWNrTWVzc2FnZVN1bW1hcnlCYWNrZW5kRGljdC50ZXh0LCBmZWVkYmFja01lc3NhZ2VTdW1tYXJ5QmFja2VuZERpY3QudXBkYXRlZF9zdGF0dXMsIGZlZWRiYWNrTWVzc2FnZVN1bW1hcnlCYWNrZW5kRGljdC5zdWdnZXN0aW9uX2h0bWwsIGZlZWRiYWNrTWVzc2FnZVN1bW1hcnlCYWNrZW5kRGljdC5jdXJyZW50X2NvbnRlbnRfaHRtbCwgZmVlZGJhY2tNZXNzYWdlU3VtbWFyeUJhY2tlbmREaWN0LmRlc2NyaXB0aW9uLCBmZWVkYmFja01lc3NhZ2VTdW1tYXJ5QmFja2VuZERpY3QuYXV0aG9yX3VzZXJuYW1lLCBmZWVkYmFja01lc3NhZ2VTdW1tYXJ5QmFja2VuZERpY3QuYXV0aG9yX3BpY3R1cmVfZGF0YV91cmwsIGZlZWRiYWNrTWVzc2FnZVN1bW1hcnlCYWNrZW5kRGljdC5jcmVhdGVkX29uKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZlZWRiYWNrTWVzc2FnZVN1bW1hcnk7XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mIGZlZWRiYWNrIHRocmVhZFxuICAgZG9tYWluIG9iamVjdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0ZlZWRiYWNrVGhyZWFkU3VtbWFyeU9iamVjdEZhY3RvcnknLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgRmVlZGJhY2tUaHJlYWRTdW1tYXJ5ID0gZnVuY3Rpb24gKHN0YXR1cywgb3JpZ2luYWxBdXRob3JJZCwgbGFzdFVwZGF0ZWQsIGxhc3RNZXNzYWdlVGV4dCwgdG90YWxNZXNzYWdlQ291bnQsIGxhc3RNZXNzYWdlUmVhZCwgc2Vjb25kTGFzdE1lc3NhZ2VSZWFkLCBhdXRob3JMYXN0TWVzc2FnZSwgYXV0aG9yU2Vjb25kTGFzdE1lc3NhZ2UsIGV4cGxvcmF0aW9uVGl0bGUsIGV4cGxvcmF0aW9uSWQsIHRocmVhZElkKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9IHN0YXR1cztcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxBdXRob3JJZCA9IG9yaWdpbmFsQXV0aG9ySWQ7XG4gICAgICAgICAgICB0aGlzLmxhc3RVcGRhdGVkID0gbGFzdFVwZGF0ZWQ7XG4gICAgICAgICAgICB0aGlzLmxhc3RNZXNzYWdlVGV4dCA9IGxhc3RNZXNzYWdlVGV4dDtcbiAgICAgICAgICAgIHRoaXMudG90YWxNZXNzYWdlQ291bnQgPSB0b3RhbE1lc3NhZ2VDb3VudDtcbiAgICAgICAgICAgIHRoaXMubGFzdE1lc3NhZ2VSZWFkID0gbGFzdE1lc3NhZ2VSZWFkO1xuICAgICAgICAgICAgdGhpcy5zZWNvbmRMYXN0TWVzc2FnZVJlYWQgPSBzZWNvbmRMYXN0TWVzc2FnZVJlYWQ7XG4gICAgICAgICAgICB0aGlzLmF1dGhvckxhc3RNZXNzYWdlID0gYXV0aG9yTGFzdE1lc3NhZ2U7XG4gICAgICAgICAgICB0aGlzLmF1dGhvclNlY29uZExhc3RNZXNzYWdlID0gYXV0aG9yU2Vjb25kTGFzdE1lc3NhZ2U7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmF0aW9uVGl0bGUgPSBleHBsb3JhdGlvblRpdGxlO1xuICAgICAgICAgICAgdGhpcy5leHBsb3JhdGlvbklkID0gZXhwbG9yYXRpb25JZDtcbiAgICAgICAgICAgIHRoaXMudGhyZWFkSWQgPSB0aHJlYWRJZDtcbiAgICAgICAgfTtcbiAgICAgICAgRmVlZGJhY2tUaHJlYWRTdW1tYXJ5LnByb3RvdHlwZS5tYXJrVGhlTGFzdFR3b01lc3NhZ2VzQXNSZWFkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuYXV0aG9yU2Vjb25kTGFzdE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlY29uZExhc3RNZXNzYWdlUmVhZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxhc3RNZXNzYWdlUmVhZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIEZlZWRiYWNrVGhyZWFkU3VtbWFyeS5wcm90b3R5cGUuYXBwZW5kTmV3TWVzc2FnZSA9IGZ1bmN0aW9uIChsYXN0TWVzc2FnZVRleHQsIGF1dGhvckxhc3RNZXNzYWdlKSB7XG4gICAgICAgICAgICB0aGlzLmxhc3RNZXNzYWdlVGV4dCA9IGxhc3RNZXNzYWdlVGV4dDtcbiAgICAgICAgICAgIHRoaXMubGFzdFVwZGF0ZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5hdXRob3JTZWNvbmRMYXN0TWVzc2FnZSA9IHRoaXMuYXV0aG9yTGFzdE1lc3NhZ2U7XG4gICAgICAgICAgICB0aGlzLmF1dGhvckxhc3RNZXNzYWdlID0gYXV0aG9yTGFzdE1lc3NhZ2U7XG4gICAgICAgICAgICB0aGlzLnRvdGFsTWVzc2FnZUNvdW50ICs9IDE7XG4gICAgICAgICAgICB0aGlzLmxhc3RNZXNzYWdlUmVhZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNlY29uZExhc3RNZXNzYWdlUmVhZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIEZlZWRiYWNrVGhyZWFkU3VtbWFyeVsnY3JlYXRlJ10gPSBmdW5jdGlvbiAoXG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIHN0YXR1cywgb3JpZ2luYWxBdXRob3JJZCwgbGFzdFVwZGF0ZWQsIGxhc3RNZXNzYWdlVGV4dCwgdG90YWxNZXNzYWdlQ291bnQsIGxhc3RNZXNzYWdlUmVhZCwgc2Vjb25kTGFzdE1lc3NhZ2VSZWFkLCBhdXRob3JMYXN0TWVzc2FnZSwgYXV0aG9yU2Vjb25kTGFzdE1lc3NhZ2UsIGV4cGxvcmF0aW9uVGl0bGUsIGV4cGxvcmF0aW9uSWQsIHRocmVhZElkKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZlZWRiYWNrVGhyZWFkU3VtbWFyeShzdGF0dXMsIG9yaWdpbmFsQXV0aG9ySWQsIGxhc3RVcGRhdGVkLCBsYXN0TWVzc2FnZVRleHQsIHRvdGFsTWVzc2FnZUNvdW50LCBsYXN0TWVzc2FnZVJlYWQsIHNlY29uZExhc3RNZXNzYWdlUmVhZCwgYXV0aG9yTGFzdE1lc3NhZ2UsIGF1dGhvclNlY29uZExhc3RNZXNzYWdlLCBleHBsb3JhdGlvblRpdGxlLCBleHBsb3JhdGlvbklkLCB0aHJlYWRJZCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIEZlZWRiYWNrVGhyZWFkU3VtbWFyeVsnY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoXG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIGZlZWRiYWNrVGhyZWFkU3VtbWFyeUJhY2tlbmREaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZlZWRiYWNrVGhyZWFkU3VtbWFyeShmZWVkYmFja1RocmVhZFN1bW1hcnlCYWNrZW5kRGljdC5zdGF0dXMsIGZlZWRiYWNrVGhyZWFkU3VtbWFyeUJhY2tlbmREaWN0Lm9yaWdpbmFsX2F1dGhvcl9pZCwgZmVlZGJhY2tUaHJlYWRTdW1tYXJ5QmFja2VuZERpY3QubGFzdF91cGRhdGVkLCBmZWVkYmFja1RocmVhZFN1bW1hcnlCYWNrZW5kRGljdC5sYXN0X21lc3NhZ2VfdGV4dCwgZmVlZGJhY2tUaHJlYWRTdW1tYXJ5QmFja2VuZERpY3QudG90YWxfbWVzc2FnZV9jb3VudCwgZmVlZGJhY2tUaHJlYWRTdW1tYXJ5QmFja2VuZERpY3QubGFzdF9tZXNzYWdlX3JlYWQsIGZlZWRiYWNrVGhyZWFkU3VtbWFyeUJhY2tlbmREaWN0LnNlY29uZF9sYXN0X21lc3NhZ2VfcmVhZCwgZmVlZGJhY2tUaHJlYWRTdW1tYXJ5QmFja2VuZERpY3QuYXV0aG9yX2xhc3RfbWVzc2FnZSwgZmVlZGJhY2tUaHJlYWRTdW1tYXJ5QmFja2VuZERpY3QuYXV0aG9yX3NlY29uZF9sYXN0X21lc3NhZ2UsIGZlZWRiYWNrVGhyZWFkU3VtbWFyeUJhY2tlbmREaWN0LmV4cGxvcmF0aW9uX3RpdGxlLCBmZWVkYmFja1RocmVhZFN1bW1hcnlCYWNrZW5kRGljdC5leHBsb3JhdGlvbl9pZCwgZmVlZGJhY2tUaHJlYWRTdW1tYXJ5QmFja2VuZERpY3QudGhyZWFkX2lkKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEZlZWRiYWNrVGhyZWFkU3VtbWFyeTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gb2YgbGVhcm5lciBkYXNoYm9hcmQgZnJvbSB0aGVcbiAqIGJhY2tlbmQuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0xlYXJuZXJEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZScsIFsnJGh0dHAnLCBmdW5jdGlvbiAoJGh0dHApIHtcbiAgICAgICAgdmFyIF9mZXRjaExlYXJuZXJEYXNoYm9hcmREYXRhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xlYXJuZXJkYXNoYm9hcmRoYW5kbGVyL2RhdGEnKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZldGNoTGVhcm5lckRhc2hib2FyZERhdGE6IF9mZXRjaExlYXJuZXJEYXNoYm9hcmREYXRhXG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb252ZXJ0VG9QbGFpblRleHQgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0cmluZ1V0aWxpdHlGaWx0ZXJzTW9kdWxlJykuZmlsdGVyKCdjb252ZXJ0VG9QbGFpblRleHQnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgc3RyaXBwZWRUZXh0ID0gaW5wdXQucmVwbGFjZSgvKDwoW14+XSspPikvaWcsICcnKTtcbiAgICAgICAgICAgIHN0cmlwcGVkVGV4dCA9IHN0cmlwcGVkVGV4dC5yZXBsYWNlKC8mbmJzcDsvaWcsICcgJyk7XG4gICAgICAgICAgICBzdHJpcHBlZFRleHQgPSBzdHJpcHBlZFRleHQucmVwbGFjZSgvJnF1b3Q7L2lnLCAnJyk7XG4gICAgICAgICAgICB2YXIgdHJpbW1lZFRleHQgPSBzdHJpcHBlZFRleHQudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRyaW1tZWRUZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJpcHBlZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJpbW1lZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdGhhdCBwcm92aWRlcyBpbmZvcm1hdGlvbiBhYm91dCBob3cgdG8gZGlzcGxheSB0aGVcbiAqIHN0YXR1cyBsYWJlbCBmb3IgYSB0aHJlYWQgaW4gdGhlIGZlZWRiYWNrIHRhYiBvZiB0aGUgZXhwbG9yYXRpb24gZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZmVlZGJhY2tUYWJNb2R1bGUnKS5mYWN0b3J5KCdUaHJlYWRTdGF0dXNEaXNwbGF5U2VydmljZScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfU1RBVFVTX0NIT0lDRVMgPSBbe1xuICAgICAgICAgICAgICAgIGlkOiAnb3BlbicsXG4gICAgICAgICAgICAgICAgdGV4dDogJ09wZW4nXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgaWQ6ICdmaXhlZCcsXG4gICAgICAgICAgICAgICAgdGV4dDogJ0ZpeGVkJ1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIGlkOiAnaWdub3JlZCcsXG4gICAgICAgICAgICAgICAgdGV4dDogJ0lnbm9yZWQnXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgaWQ6ICdjb21wbGltZW50JyxcbiAgICAgICAgICAgICAgICB0ZXh0OiAnQ29tcGxpbWVudCdcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBpZDogJ25vdF9hY3Rpb25hYmxlJyxcbiAgICAgICAgICAgICAgICB0ZXh0OiAnTm90IEFjdGlvbmFibGUnXG4gICAgICAgICAgICB9XTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFNUQVRVU19DSE9JQ0VTOiBhbmd1bGFyLmNvcHkoX1NUQVRVU19DSE9JQ0VTKSxcbiAgICAgICAgICAgIGdldExhYmVsQ2xhc3M6IGZ1bmN0aW9uIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09PSAnb3BlbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdsYWJlbCBsYWJlbC1pbmZvJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RhdHVzID09PSAnY29tcGxpbWVudCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdsYWJlbCBsYWJlbC1zdWNjZXNzJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnbGFiZWwgbGFiZWwtZGVmYXVsdCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEh1bWFuUmVhZGFibGVTdGF0dXM6IGZ1bmN0aW9uIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IF9TVEFUVVNfQ0hPSUNFUy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoX1NUQVRVU19DSE9JQ0VTW2ldLmlkID09PSBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfU1RBVFVTX0NIT0lDRVNbaV0udGV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVycyBmb3IgdGhlIExlYXJuZXIgZGFzaGJvYXJkLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9iYWNrZ3JvdW5kLWJhbm5lci8nICtcbiAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9sb2FkaW5nLWRvdHMvbG9hZGluZy1kb3RzLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUtZGlyZWN0aXZlcy9jb2xsZWN0aW9uLXN1bW1hcnktdGlsZS8nICtcbiAgICAnY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N1bW1hcnktdGlsZS1kaXJlY3RpdmVzL2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS8nICtcbiAgICAnZXhwbG9yYXRpb24tc3VtbWFyeS10aWxlLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLmZpbHRlci50cycpO1xucmVxdWlyZSgnZG9tYWluL2ZlZWRiYWNrX21lc3NhZ2UvRmVlZGJhY2tNZXNzYWdlU3VtbWFyeU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9mZWVkYmFja190aHJlYWQvRmVlZGJhY2tUaHJlYWRTdW1tYXJ5T2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2xlYXJuZXJfZGFzaGJvYXJkL0xlYXJuZXJEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZmVlZGJhY2stdGFiL2ZlZWRiYWNrLXRhYi1zZXJ2aWNlcy8nICtcbiAgICAndGhyZWFkLXN0YXR1cy1kaXNwbGF5L3RocmVhZC1zdGF0dXMtZGlzcGxheS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zaG93LXN1Z2dlc3Rpb24tZWRpdG9yLXBhZ2VzL3Nob3ctc3VnZ2VzdGlvbi1tb2RhbC1mb3ItbGVhcm5lci12aWV3LycgK1xuICAgICdzaG93LXN1Z2dlc3Rpb24tbW9kYWwtZm9yLWxlYXJuZXItdmlldy5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9EYXRlVGltZUZvcm1hdFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1VzZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnbGVhcm5lckRhc2hib2FyZFBhZ2VNb2R1bGUnKS5jb250cm9sbGVyKCdMZWFybmVyRGFzaGJvYXJkJywgW1xuICAgICckc2NvcGUnLCAnJHJvb3RTY29wZScsICckcScsICckd2luZG93JywgJyRodHRwJywgJyR1aWJNb2RhbCcsXG4gICAgJ0FsZXJ0c1NlcnZpY2UnLCAnRVhQTE9SQVRJT05TX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMnLFxuICAgICdTVUJTQ1JJUFRJT05fU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUycsICdGQVRBTF9FUlJPUl9DT0RFUycsXG4gICAgJ0xlYXJuZXJEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ0xFQVJORVJfREFTSEJPQVJEX1NFQ1RJT05fSTE4Tl9JRFMnLFxuICAgICdMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTJywgJ1RocmVhZFN0YXR1c0Rpc3BsYXlTZXJ2aWNlJyxcbiAgICAnRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlJywgJ0ZFRURCQUNLX1RIUkVBRFNfU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUycsXG4gICAgJ0ZlZWRiYWNrVGhyZWFkU3VtbWFyeU9iamVjdEZhY3RvcnknLCAnRmVlZGJhY2tNZXNzYWdlU3VtbWFyeU9iamVjdEZhY3RvcnknLFxuICAgICdTaG93U3VnZ2VzdGlvbk1vZGFsRm9yTGVhcm5lclZpZXdTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCAkcSwgJHdpbmRvdywgJGh0dHAsICR1aWJNb2RhbCwgQWxlcnRzU2VydmljZSwgRVhQTE9SQVRJT05TX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMsIFNVQlNDUklQVElPTl9TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTLCBGQVRBTF9FUlJPUl9DT0RFUywgTGVhcm5lckRhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUywgTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUywgVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2UsIERhdGVUaW1lRm9ybWF0U2VydmljZSwgRkVFREJBQ0tfVEhSRUFEU19TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTLCBGZWVkYmFja1RocmVhZFN1bW1hcnlPYmplY3RGYWN0b3J5LCBGZWVkYmFja01lc3NhZ2VTdW1tYXJ5T2JqZWN0RmFjdG9yeSwgU2hvd1N1Z2dlc3Rpb25Nb2RhbEZvckxlYXJuZXJWaWV3U2VydmljZSwgVXNlclNlcnZpY2UpIHtcbiAgICAgICAgJHNjb3BlLkVYUExPUkFUSU9OU19TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTID0gKEVYUExPUkFUSU9OU19TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTKTtcbiAgICAgICAgJHNjb3BlLlNVQlNDUklQVElPTl9TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTID0gKFNVQlNDUklQVElPTl9TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTKTtcbiAgICAgICAgJHNjb3BlLkZFRURCQUNLX1RIUkVBRFNfU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUyA9IChGRUVEQkFDS19USFJFQURTX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMpO1xuICAgICAgICAkc2NvcGUuTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUyA9IChMRUFSTkVSX0RBU0hCT0FSRF9TRUNUSU9OX0kxOE5fSURTKTtcbiAgICAgICAgJHNjb3BlLkxFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMgPSAoTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUyk7XG4gICAgICAgICRzY29wZS5nZXRTdGF0aWNJbWFnZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsO1xuICAgICAgICAkc2NvcGUuUEFHRV9TSVpFID0gODtcbiAgICAgICAgJHNjb3BlLk1hdGggPSB3aW5kb3cuTWF0aDtcbiAgICAgICAgVXNlclNlcnZpY2UuZ2V0UHJvZmlsZUltYWdlRGF0YVVybEFzeW5jKCkudGhlbihmdW5jdGlvbiAoZGF0YVVybCkge1xuICAgICAgICAgICAgJHNjb3BlLnByb2ZpbGVQaWN0dXJlRGF0YVVybCA9IGRhdGFVcmw7XG4gICAgICAgIH0pO1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJ0xvYWRpbmcnO1xuICAgICAgICAkc2NvcGUudXNlcm5hbWUgPSAnJztcbiAgICAgICAgdmFyIHVzZXJJbmZvUHJvbWlzZSA9IFVzZXJTZXJ2aWNlLmdldFVzZXJJbmZvQXN5bmMoKTtcbiAgICAgICAgdXNlckluZm9Qcm9taXNlLnRoZW4oZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAkc2NvcGUudXNlcm5hbWUgPSB1c2VySW5mby5nZXRVc2VybmFtZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGRhc2hib2FyZERhdGFQcm9taXNlID0gKExlYXJuZXJEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZS5mZXRjaExlYXJuZXJEYXNoYm9hcmREYXRhKCkpO1xuICAgICAgICBkYXNoYm9hcmREYXRhUHJvbWlzZS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIHJlc3BvbnNlRGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAkc2NvcGUuaXNDdXJyZW50RXhwU29ydERlc2NlbmRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgJHNjb3BlLmlzQ3VycmVudFN1YnNjcmlwdGlvblNvcnREZXNjZW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS5pc0N1cnJlbnRGZWVkYmFja1NvcnREZXNjZW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50RXhwU29ydFR5cGUgPSAoRVhQTE9SQVRJT05TX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMuTEFTVF9QTEFZRUQua2V5KTtcbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50U3Vic2NyaWJlcnNTb3J0VHlwZSA9IChTVUJTQ1JJUFRJT05fU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUy5VU0VSTkFNRS5rZXkpO1xuICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRGZWVkYmFja1RocmVhZHNTb3J0VHlwZSA9IChGRUVEQkFDS19USFJFQURTX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMuTEFTVF9VUERBVEVELmtleSk7XG4gICAgICAgICAgICAkc2NvcGUuc3RhcnRJbmNvbXBsZXRlRXhwSW5kZXggPSAwO1xuICAgICAgICAgICAgJHNjb3BlLnN0YXJ0Q29tcGxldGVkRXhwSW5kZXggPSAwO1xuICAgICAgICAgICAgJHNjb3BlLnN0YXJ0SW5jb21wbGV0ZUNvbGxlY3Rpb25JbmRleCA9IDA7XG4gICAgICAgICAgICAkc2NvcGUuc3RhcnRDb21wbGV0ZWRDb2xsZWN0aW9uSW5kZXggPSAwO1xuICAgICAgICAgICAgJHNjb3BlLmNvbXBsZXRlZEV4cGxvcmF0aW9uc0xpc3QgPSAocmVzcG9uc2VEYXRhLmNvbXBsZXRlZF9leHBsb3JhdGlvbnNfbGlzdCk7XG4gICAgICAgICAgICAkc2NvcGUuY29tcGxldGVkQ29sbGVjdGlvbnNMaXN0ID0gKHJlc3BvbnNlRGF0YS5jb21wbGV0ZWRfY29sbGVjdGlvbnNfbGlzdCk7XG4gICAgICAgICAgICAkc2NvcGUuaW5jb21wbGV0ZUV4cGxvcmF0aW9uc0xpc3QgPSAocmVzcG9uc2VEYXRhLmluY29tcGxldGVfZXhwbG9yYXRpb25zX2xpc3QpO1xuICAgICAgICAgICAgJHNjb3BlLmluY29tcGxldGVDb2xsZWN0aW9uc0xpc3QgPSAocmVzcG9uc2VEYXRhLmluY29tcGxldGVfY29sbGVjdGlvbnNfbGlzdCk7XG4gICAgICAgICAgICAkc2NvcGUuc3Vic2NyaXB0aW9uc0xpc3QgPSAocmVzcG9uc2VEYXRhLnN1YnNjcmlwdGlvbl9saXN0KTtcbiAgICAgICAgICAgICRzY29wZS5udW1iZXJOb25leGlzdGVudEluY29tcGxldGVFeHBsb3JhdGlvbnMgPSAocmVzcG9uc2VEYXRhLm51bWJlcl9vZl9ub25leGlzdGVudF9hY3Rpdml0aWVzLmluY29tcGxldGVfZXhwbG9yYXRpb25zKTtcbiAgICAgICAgICAgICRzY29wZS5udW1iZXJOb25leGlzdGVudEluY29tcGxldGVDb2xsZWN0aW9ucyA9IChyZXNwb25zZURhdGEubnVtYmVyX29mX25vbmV4aXN0ZW50X2FjdGl2aXRpZXMuaW5jb21wbGV0ZV9jb2xsZWN0aW9ucyk7XG4gICAgICAgICAgICAkc2NvcGUubnVtYmVyTm9uZXhpc3RlbnRDb21wbGV0ZWRFeHBsb3JhdGlvbnMgPSAocmVzcG9uc2VEYXRhLm51bWJlcl9vZl9ub25leGlzdGVudF9hY3Rpdml0aWVzLmNvbXBsZXRlZF9leHBsb3JhdGlvbnMpO1xuICAgICAgICAgICAgJHNjb3BlLm51bWJlck5vbmV4aXN0ZW50Q29tcGxldGVkQ29sbGVjdGlvbnMgPSAocmVzcG9uc2VEYXRhLm51bWJlcl9vZl9ub25leGlzdGVudF9hY3Rpdml0aWVzLmNvbXBsZXRlZF9jb2xsZWN0aW9ucyk7XG4gICAgICAgICAgICAkc2NvcGUubnVtYmVyTm9uZXhpc3RlbnRFeHBsb3JhdGlvbnNGcm9tUGxheWxpc3QgPSAocmVzcG9uc2VEYXRhLm51bWJlcl9vZl9ub25leGlzdGVudF9hY3Rpdml0aWVzLmV4cGxvcmF0aW9uX3BsYXlsaXN0KTtcbiAgICAgICAgICAgICRzY29wZS5udW1iZXJOb25leGlzdGVudENvbGxlY3Rpb25zRnJvbVBsYXlsaXN0ID0gKHJlc3BvbnNlRGF0YS5udW1iZXJfb2Zfbm9uZXhpc3RlbnRfYWN0aXZpdGllcy5jb2xsZWN0aW9uX3BsYXlsaXN0KTtcbiAgICAgICAgICAgICRzY29wZS5jb21wbGV0ZWRUb0luY29tcGxldGVDb2xsZWN0aW9ucyA9IChyZXNwb25zZURhdGEuY29tcGxldGVkX3RvX2luY29tcGxldGVfY29sbGVjdGlvbnMpO1xuICAgICAgICAgICAgdmFyIHRocmVhZFN1bW1hcnlEaWN0cyA9IHJlc3BvbnNlRGF0YS50aHJlYWRfc3VtbWFyaWVzO1xuICAgICAgICAgICAgJHNjb3BlLnRocmVhZFN1bW1hcmllcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRocmVhZFN1bW1hcnlEaWN0cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUudGhyZWFkU3VtbWFyaWVzLnB1c2goRmVlZGJhY2tUaHJlYWRTdW1tYXJ5T2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QodGhyZWFkU3VtbWFyeURpY3RzW2luZGV4XSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJHNjb3BlLm51bWJlck9mVW5yZWFkVGhyZWFkcyA9IHJlc3BvbnNlRGF0YS5udW1iZXJfb2ZfdW5yZWFkX3RocmVhZHM7XG4gICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25QbGF5bGlzdCA9IHJlc3BvbnNlRGF0YS5leHBsb3JhdGlvbl9wbGF5bGlzdDtcbiAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uUGxheWxpc3QgPSByZXNwb25zZURhdGEuY29sbGVjdGlvbl9wbGF5bGlzdDtcbiAgICAgICAgICAgICRzY29wZS5hY3RpdmVTZWN0aW9uID0gTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUy5JTkNPTVBMRVRFO1xuICAgICAgICAgICAgJHNjb3BlLmFjdGl2ZVN1YnNlY3Rpb24gPSAoTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUy5FWFBMT1JBVElPTlMpO1xuICAgICAgICAgICAgJHNjb3BlLmZlZWRiYWNrVGhyZWFkQWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUubm9FeHBsb3JhdGlvbkFjdGl2aXR5ID0gKCgkc2NvcGUuY29tcGxldGVkRXhwbG9yYXRpb25zTGlzdC5sZW5ndGggPT09IDApICYmXG4gICAgICAgICAgICAgICAgKCRzY29wZS5pbmNvbXBsZXRlRXhwbG9yYXRpb25zTGlzdC5sZW5ndGggPT09IDApKTtcbiAgICAgICAgICAgICRzY29wZS5ub0NvbGxlY3Rpb25BY3Rpdml0eSA9ICgoJHNjb3BlLmNvbXBsZXRlZENvbGxlY3Rpb25zTGlzdC5sZW5ndGggPT09IDApICYmXG4gICAgICAgICAgICAgICAgKCRzY29wZS5pbmNvbXBsZXRlQ29sbGVjdGlvbnNMaXN0Lmxlbmd0aCA9PT0gMCkpO1xuICAgICAgICAgICAgJHNjb3BlLm5vQWN0aXZpdHkgPSAoKCRzY29wZS5ub0V4cGxvcmF0aW9uQWN0aXZpdHkpICYmICgkc2NvcGUubm9Db2xsZWN0aW9uQWN0aXZpdHkpICYmXG4gICAgICAgICAgICAgICAgKCRzY29wZS5leHBsb3JhdGlvblBsYXlsaXN0Lmxlbmd0aCA9PT0gMCkgJiZcbiAgICAgICAgICAgICAgICAoJHNjb3BlLmNvbGxlY3Rpb25QbGF5bGlzdC5sZW5ndGggPT09IDApKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChGQVRBTF9FUlJPUl9DT0RFUy5pbmRleE9mKGVycm9yUmVzcG9uc2Uuc3RhdHVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0ZhaWxlZCB0byBnZXQgbGVhcm5lciBkYXNoYm9hcmQgZGF0YScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgJHEuYWxsKFt1c2VySW5mb1Byb21pc2UsIGRhc2hib2FyZERhdGFQcm9taXNlXSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgIH0pO1xuICAgICAgICAkc2NvcGUubG9hZGluZ0ZlZWRiYWNrcyA9IGZhbHNlO1xuICAgICAgICB2YXIgdGhyZWFkSW5kZXggPSBudWxsO1xuICAgICAgICAkc2NvcGUubmV3TWVzc2FnZSA9IHtcbiAgICAgICAgICAgIHRleHQ6ICcnXG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5nZXRMYWJlbENsYXNzID0gVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2UuZ2V0TGFiZWxDbGFzcztcbiAgICAgICAgJHNjb3BlLmdldEh1bWFuUmVhZGFibGVTdGF0dXMgPSAoVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2UuZ2V0SHVtYW5SZWFkYWJsZVN0YXR1cyk7XG4gICAgICAgICRzY29wZS5nZXRMb2NhbGVBYmJyZXZpYXRlZERhdGV0aW1lU3RyaW5nID0gKERhdGVUaW1lRm9ybWF0U2VydmljZS5nZXRMb2NhbGVBYmJyZXZpYXRlZERhdGV0aW1lU3RyaW5nKTtcbiAgICAgICAgJHNjb3BlLnNldEFjdGl2ZVNlY3Rpb24gPSBmdW5jdGlvbiAobmV3QWN0aXZlU2VjdGlvbk5hbWUpIHtcbiAgICAgICAgICAgICRzY29wZS5hY3RpdmVTZWN0aW9uID0gbmV3QWN0aXZlU2VjdGlvbk5hbWU7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmFjdGl2ZVNlY3Rpb24gPT09XG4gICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUy5GRUVEQkFDSyAmJlxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkYmFja1RocmVhZEFjdGl2ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkYmFja1RocmVhZEFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2V0QWN0aXZlU3Vic2VjdGlvbiA9IGZ1bmN0aW9uIChuZXdBY3RpdmVTdWJzZWN0aW9uTmFtZSkge1xuICAgICAgICAgICAgJHNjb3BlLmFjdGl2ZVN1YnNlY3Rpb24gPSBuZXdBY3RpdmVTdWJzZWN0aW9uTmFtZTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmdldEV4cGxvcmF0aW9uVXJsID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgIHJldHVybiAnL2V4cGxvcmUvJyArIGV4cGxvcmF0aW9uSWQ7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5nZXRDb2xsZWN0aW9uVXJsID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgcmV0dXJuICcvY29sbGVjdGlvbi8nICsgY29sbGVjdGlvbklkO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuY2hlY2tNb2JpbGVWaWV3ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICgkd2luZG93LmlubmVyV2lkdGggPCA1MDApO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuZ2V0VmlzaWJsZUV4cGxvcmF0aW9uTGlzdCA9IGZ1bmN0aW9uIChzdGFydENvbXBsZXRlZEV4cEluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmNvbXBsZXRlZEV4cGxvcmF0aW9uc0xpc3Quc2xpY2Uoc3RhcnRDb21wbGV0ZWRFeHBJbmRleCwgTWF0aC5taW4oc3RhcnRDb21wbGV0ZWRFeHBJbmRleCArICRzY29wZS5QQUdFX1NJWkUsICRzY29wZS5jb21wbGV0ZWRFeHBsb3JhdGlvbnNMaXN0Lmxlbmd0aCkpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2hvd1VzZXJuYW1lUG9wb3ZlciA9IGZ1bmN0aW9uIChzdWJzY3JpYmVyVXNlcm5hbWUpIHtcbiAgICAgICAgICAgIC8vIFRoZSBwb3BvdmVyIG9uIHRoZSBzdWJzY3JpcHRpb24gY2FyZCBpcyBvbmx5IHNob3duIGlmIHRoZSBsZW5ndGggb2ZcbiAgICAgICAgICAgIC8vIHRoZSBzdWJzY3JpYmVyIHVzZXJuYW1lIGlzIGdyZWF0ZXIgdGhhbiAxMCBhbmQgdGhlIHVzZXIgaG92ZXJzIG92ZXJcbiAgICAgICAgICAgIC8vIHRoZSB0cnVuY2F0ZWQgdXNlcm5hbWUuXG4gICAgICAgICAgICBpZiAoc3Vic2NyaWJlclVzZXJuYW1lLmxlbmd0aCA+IDEwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdtb3VzZWVudGVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnbm9uZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5nb1RvUHJldmlvdXNQYWdlID0gZnVuY3Rpb24gKHNlY3Rpb24sIHN1YnNlY3Rpb24pIHtcbiAgICAgICAgICAgIGlmIChzZWN0aW9uID09PSBMRUFSTkVSX0RBU0hCT0FSRF9TRUNUSU9OX0kxOE5fSURTLklOQ09NUExFVEUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2VjdGlvbiA9PT0gTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUy5FWFBMT1JBVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXJ0SW5jb21wbGV0ZUV4cEluZGV4ID0gTWF0aC5tYXgoJHNjb3BlLnN0YXJ0SW5jb21wbGV0ZUV4cEluZGV4IC0gJHNjb3BlLlBBR0VfU0laRSwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN1YnNlY3Rpb24gPT09IExFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMuQ09MTEVDVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXJ0SW5jb21wbGV0ZUNvbGxlY3Rpb25JbmRleCA9IE1hdGgubWF4KCRzY29wZS5zdGFydEluY29tcGxldGVDb2xsZWN0aW9uSW5kZXggLSAkc2NvcGUuUEFHRV9TSVpFLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzZWN0aW9uID09PSBMRUFSTkVSX0RBU0hCT0FSRF9TRUNUSU9OX0kxOE5fSURTLkNPTVBMRVRFRCkge1xuICAgICAgICAgICAgICAgIGlmIChzdWJzZWN0aW9uID09PSBMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTLkVYUExPUkFUSU9OUykge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RhcnRDb21wbGV0ZWRFeHBJbmRleCA9IE1hdGgubWF4KCRzY29wZS5zdGFydENvbXBsZXRlZEV4cEluZGV4IC0gJHNjb3BlLlBBR0VfU0laRSwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN1YnNlY3Rpb24gPT09IExFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMuQ09MTEVDVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXJ0Q29tcGxldGVkQ29sbGVjdGlvbkluZGV4ID0gTWF0aC5tYXgoJHNjb3BlLnN0YXJ0Q29tcGxldGVkQ29sbGVjdGlvbkluZGV4IC0gJHNjb3BlLlBBR0VfU0laRSwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuZ29Ub05leHRQYWdlID0gZnVuY3Rpb24gKHNlY3Rpb24sIHN1YnNlY3Rpb24pIHtcbiAgICAgICAgICAgIGlmIChzZWN0aW9uID09PSBMRUFSTkVSX0RBU0hCT0FSRF9TRUNUSU9OX0kxOE5fSURTLklOQ09NUExFVEUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2VjdGlvbiA9PT0gTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUy5FWFBMT1JBVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5zdGFydEluY29tcGxldGVFeHBJbmRleCArXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuUEFHRV9TSVpFIDw9ICRzY29wZS5pbmNvbXBsZXRlRXhwbG9yYXRpb25zTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdGFydEluY29tcGxldGVFeHBJbmRleCArPSAkc2NvcGUuUEFHRV9TSVpFO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN1YnNlY3Rpb24gPT09IExFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMuQ09MTEVDVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5zdGFydEluY29tcGxldGVDb2xsZWN0aW9uSW5kZXggK1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLlBBR0VfU0laRSA8PSAkc2NvcGUuc3RhcnRJbmNvbXBsZXRlQ29sbGVjdGlvbkluZGV4Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXJ0SW5jb21wbGV0ZUNvbGxlY3Rpb25JbmRleCArPSAkc2NvcGUuUEFHRV9TSVpFO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2VjdGlvbiA9PT0gTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUy5DT01QTEVURUQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2VjdGlvbiA9PT0gTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUy5FWFBMT1JBVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5zdGFydENvbXBsZXRlZEV4cEluZGV4ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5QQUdFX1NJWkUgPD0gJHNjb3BlLmNvbXBsZXRlZEV4cGxvcmF0aW9uc0xpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RhcnRDb21wbGV0ZWRFeHBJbmRleCArPSAkc2NvcGUuUEFHRV9TSVpFO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN1YnNlY3Rpb24gPT09IExFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMuQ09MTEVDVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5zdGFydENvbXBsZXRlZENvbGxlY3Rpb25JbmRleCArXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuUEFHRV9TSVpFIDw9ICRzY29wZS5zdGFydENvbXBsZXRlZENvbGxlY3Rpb25JbmRleC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdGFydENvbXBsZXRlZENvbGxlY3Rpb25JbmRleCArPSAkc2NvcGUuUEFHRV9TSVpFO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2V0RXhwbG9yYXRpb25zU29ydGluZ09wdGlvbnMgPSBmdW5jdGlvbiAoc29ydFR5cGUpIHtcbiAgICAgICAgICAgIGlmIChzb3J0VHlwZSA9PT0gJHNjb3BlLmN1cnJlbnRFeHBTb3J0VHlwZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5pc0N1cnJlbnRFeHBTb3J0RGVzY2VuZGluZyA9ICEkc2NvcGUuaXNDdXJyZW50RXhwU29ydERlc2NlbmRpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudEV4cFNvcnRUeXBlID0gc29ydFR5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5zZXRTdWJzY3JpcHRpb25Tb3J0aW5nT3B0aW9ucyA9IGZ1bmN0aW9uIChzb3J0VHlwZSkge1xuICAgICAgICAgICAgaWYgKHNvcnRUeXBlID09PSAkc2NvcGUuY3VycmVudFN1YnNjcmlwdGlvblNvcnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzQ3VycmVudFN1YnNjcmlwdGlvblNvcnREZXNjZW5kaW5nID0gKCEkc2NvcGUuaXNDdXJyZW50U3Vic2NyaXB0aW9uU29ydERlc2NlbmRpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRTdWJzY3JpcHRpb25Tb3J0VHlwZSA9IHNvcnRUeXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2V0RmVlZGJhY2tTb3J0aW5nT3B0aW9ucyA9IGZ1bmN0aW9uIChzb3J0VHlwZSkge1xuICAgICAgICAgICAgaWYgKHNvcnRUeXBlID09PSAkc2NvcGUuY3VycmVudEZlZWRiYWNrVGhyZWFkc1NvcnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzQ3VycmVudEZlZWRiYWNrU29ydERlc2NlbmRpbmcgPSAoISRzY29wZS5pc0N1cnJlbnRGZWVkYmFja1NvcnREZXNjZW5kaW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50RmVlZGJhY2tUaHJlYWRzU29ydFR5cGUgPSBzb3J0VHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmdldFZhbHVlT2ZFeHBsb3JhdGlvblNvcnRLZXkgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb24pIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcGFzc2VkIGFzIGEgY3VzdG9tIGNvbXBhcmF0b3IgZnVuY3Rpb24gdG8gYG9yZGVyQnlgLFxuICAgICAgICAgICAgLy8gc28gdGhhdCBzcGVjaWFsIGNhc2VzIGNhbiBiZSBoYW5kbGVkIHdoaWxlIHNvcnRpbmcgZXhwbG9yYXRpb25zLlxuICAgICAgICAgICAgaWYgKCRzY29wZS5jdXJyZW50RXhwU29ydFR5cGUgPT09XG4gICAgICAgICAgICAgICAgRVhQTE9SQVRJT05TX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMuTEFTVF9QTEFZRUQua2V5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwbG9yYXRpb25bJHNjb3BlLmN1cnJlbnRFeHBTb3J0VHlwZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5nZXRWYWx1ZU9mU3Vic2NyaXB0aW9uU29ydEtleSA9IGZ1bmN0aW9uIChzdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcGFzc2VkIGFzIGEgY3VzdG9tIGNvbXBhcmF0b3IgZnVuY3Rpb24gdG8gYG9yZGVyQnlgLFxuICAgICAgICAgICAgLy8gc28gdGhhdCBzcGVjaWFsIGNhc2VzIGNhbiBiZSBoYW5kbGVkIHdoaWxlIHNvcnRpbmcgc3Vic2NyaXB0aW9ucy5cbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHN1YnNjcmlwdGlvblskc2NvcGUuY3VycmVudFN1YnNjcmliZXJzU29ydFR5cGVdO1xuICAgICAgICAgICAgaWYgKCRzY29wZS5jdXJyZW50U3Vic2NyaWJlcnNTb3J0VHlwZSA9PT1cbiAgICAgICAgICAgICAgICBTVUJTQ1JJUFRJT05fU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUy5JTVBBQ1Qua2V5KSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSAodmFsdWUgfHwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5zb3J0RmVlZGJhY2tUaHJlYWRzRnVuY3Rpb24gPSBmdW5jdGlvbiAoZmVlZGJhY2tUaHJlYWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmZWVkYmFja1RocmVhZFskc2NvcGUuY3VycmVudEZlZWRiYWNrVGhyZWFkc1NvcnRUeXBlXTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGdldFBsYXlsaXN0U29ydGFibGVPcHRpb25zID0gZnVuY3Rpb24gKGFjdGl2aXR5VHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAndWktZmxvYXRpbmcnOiAnYXV0bycsXG4gICAgICAgICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIChlLCB1aSkge1xuICAgICAgICAgICAgICAgICAgICB1aS5wbGFjZWhvbGRlci5oZWlnaHQodWkuaXRlbS5oZWlnaHQoKSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNvcnQ6IGZ1bmN0aW9uIChlLCB1aSkge1xuICAgICAgICAgICAgICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBxdW90ZS1wcm9wcyAqL1xuICAgICAgICAgICAgICAgICAgICAvLyBNYWtpbmcgdG9wIDogMHB4IHRvIGF2b2lkIGlycmVndWxhciBjaGFuZ2UgaW4gcG9zaXRpb24uXG4gICAgICAgICAgICAgICAgICAgIHVpLmhlbHBlci5jc3MoeyAndG9wJzogJzAgcHgnIH0pO1xuICAgICAgICAgICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIHF1b3RlLXByb3BzICovXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uIChlLCB1aSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5zZXJ0RXhwSW5MZWFybmVyUGxheWxpc3RVcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoJy9sZWFybmVycGxheWxpc3RhY3Rpdml0eWhhbmRsZXIvPGFjdGl2aXR5VHlwZT4vPGFjdGl2aXR5SWQ+Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlUeXBlOiBhY3Rpdml0eVR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eUlkOiAoJHNjb3BlLmV4cGxvcmF0aW9uUGxheWxpc3RbdWkuaXRlbS5zb3J0YWJsZS5pbmRleF0uaWQpXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdChpbnNlcnRFeHBJbkxlYXJuZXJQbGF5bGlzdFVybCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHVpLml0ZW0uc29ydGFibGUuZHJvcGluZGV4XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdG9wOiBmdW5jdGlvbiAoZSwgdWkpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXhpczogJ3knXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuY29sbGVjdGlvblBsYXlsaXN0U29ydGFibGVPcHRpb25zID0gZ2V0UGxheWxpc3RTb3J0YWJsZU9wdGlvbnMoY29uc3RhbnRzLkFDVElWSVRZX1RZUEVfQ09MTEVDVElPTik7XG4gICAgICAgICRzY29wZS5leHBsb3JhdGlvblBsYXlsaXN0U29ydGFibGVPcHRpb25zID0gZ2V0UGxheWxpc3RTb3J0YWJsZU9wdGlvbnMoY29uc3RhbnRzLkFDVElWSVRZX1RZUEVfRVhQTE9SQVRJT04pO1xuICAgICAgICAkc2NvcGUub25DbGlja1RocmVhZCA9IGZ1bmN0aW9uICh0aHJlYWRTdGF0dXMsIGV4cGxvcmF0aW9uSWQsIHRocmVhZElkLCBleHBsb3JhdGlvblRpdGxlKSB7XG4gICAgICAgICAgICAkc2NvcGUubG9hZGluZ0ZlZWRiYWNrcyA9IHRydWU7XG4gICAgICAgICAgICB2YXIgdGhyZWFkRGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKCcvbGVhcm5lcmRhc2hib2FyZHRocmVhZGhhbmRsZXIvPHRocmVhZElkPicsIHtcbiAgICAgICAgICAgICAgICB0aHJlYWRJZDogdGhyZWFkSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJHNjb3BlLmV4cGxvcmF0aW9uVGl0bGUgPSBleHBsb3JhdGlvblRpdGxlO1xuICAgICAgICAgICAgJHNjb3BlLmZlZWRiYWNrVGhyZWFkQWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS50aHJlYWRTdGF0dXMgPSB0aHJlYWRTdGF0dXM7XG4gICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25JZCA9IGV4cGxvcmF0aW9uSWQ7XG4gICAgICAgICAgICAkc2NvcGUudGhyZWFkSWQgPSB0aHJlYWRJZDtcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCAkc2NvcGUudGhyZWFkU3VtbWFyaWVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgIGlmICgkc2NvcGUudGhyZWFkU3VtbWFyaWVzW2luZGV4XS50aHJlYWRJZCA9PT0gdGhyZWFkSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyZWFkSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRocmVhZFN1bW1hcnkgPSAkc2NvcGUudGhyZWFkU3VtbWFyaWVzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgdGhyZWFkU3VtbWFyeS5tYXJrVGhlTGFzdFR3b01lc3NhZ2VzQXNSZWFkKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhyZWFkU3VtbWFyeS5sYXN0TWVzc2FnZVJlYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5udW1iZXJPZlVucmVhZFRocmVhZHMgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRodHRwLmdldCh0aHJlYWREYXRhVXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlU3VtbWFyeURpY3RzID0gcmVzcG9uc2UuZGF0YS5tZXNzYWdlX3N1bW1hcnlfbGlzdDtcbiAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZVN1bW1hcmllcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IG1lc3NhZ2VTdW1tYXJ5RGljdHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlU3VtbWFyaWVzLnB1c2goRmVlZGJhY2tNZXNzYWdlU3VtbWFyeU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KG1lc3NhZ2VTdW1tYXJ5RGljdHNbaW5kZXhdKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRzY29wZS5sb2FkaW5nRmVlZGJhY2tzID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnNob3dBbGxUaHJlYWRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmZlZWRiYWNrVGhyZWFkQWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB0aHJlYWRJbmRleCA9IG51bGw7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5hZGROZXdNZXNzYWdlID0gZnVuY3Rpb24gKHRocmVhZElkLCBuZXdNZXNzYWdlKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoJy90aHJlYWRoYW5kbGVyLzx0aHJlYWRJZD4nLCB7XG4gICAgICAgICAgICAgICAgdGhyZWFkSWQ6IHRocmVhZElkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICAgICAgICAgIHVwZGF0ZWRfc3RhdHVzOiBudWxsLFxuICAgICAgICAgICAgICAgIHVwZGF0ZWRfc3ViamVjdDogbnVsbCxcbiAgICAgICAgICAgICAgICB0ZXh0OiBuZXdNZXNzYWdlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJHNjb3BlLm1lc3NhZ2VTZW5kaW5nSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgICAgICAgICAkaHR0cC5wb3N0KHVybCwgcGF5bG9hZCkuc3VjY2VzcyhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRocmVhZFN1bW1hcnkgPSAkc2NvcGUudGhyZWFkU3VtbWFyaWVzW3RocmVhZEluZGV4XTtcbiAgICAgICAgICAgICAgICAkc2NvcGUudGhyZWFkU3VtbWFyeS5hcHBlbmROZXdNZXNzYWdlKG5ld01lc3NhZ2UsICRzY29wZS51c2VybmFtZSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm1lc3NhZ2VTZW5kaW5nSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICRzY29wZS5uZXdNZXNzYWdlLnRleHQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHZhciBuZXdNZXNzYWdlU3VtbWFyeSA9IChGZWVkYmFja01lc3NhZ2VTdW1tYXJ5T2JqZWN0RmFjdG9yeS5jcmVhdGVOZXdNZXNzYWdlKCRzY29wZS50aHJlYWRTdW1tYXJ5LnRvdGFsTWVzc2FnZUNvdW50LCBuZXdNZXNzYWdlLCAkc2NvcGUudXNlcm5hbWUsICRzY29wZS5wcm9maWxlUGljdHVyZURhdGFVcmwpKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZVN1bW1hcmllcy5wdXNoKG5ld01lc3NhZ2VTdW1tYXJ5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2hvd1N1Z2dlc3Rpb25Nb2RhbCA9IGZ1bmN0aW9uIChuZXdDb250ZW50LCBvbGRDb250ZW50LCBkZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgU2hvd1N1Z2dlc3Rpb25Nb2RhbEZvckxlYXJuZXJWaWV3U2VydmljZS5zaG93U3VnZ2VzdGlvbk1vZGFsKCdlZGl0X2V4cGxvcmF0aW9uX3N0YXRlX2NvbnRlbnQnLCB7XG4gICAgICAgICAgICAgICAgbmV3Q29udGVudDogbmV3Q29udGVudCxcbiAgICAgICAgICAgICAgICBvbGRDb250ZW50OiBvbGRDb250ZW50LFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5vcGVuUmVtb3ZlQWN0aXZpdHlNb2RhbCA9IGZ1bmN0aW9uIChzZWN0aW9uTmFtZUkxOG5JZCwgc3Vic2VjdGlvbk5hbWUsIGFjdGl2aXR5KSB7XG4gICAgICAgICAgICAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS9sZWFybmVyLWRhc2hib2FyZC1wYWdlLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgJ3JlbW92ZS1hY3Rpdml0eS1mcm9tLWxlYXJuZXItZGFzaGJvYXJkLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgIHNlY3Rpb25OYW1lSTE4bklkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VjdGlvbk5hbWVJMThuSWQ7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHN1YnNlY3Rpb25OYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2VjdGlvbk5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWN0aXZpdHk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsICckaHR0cCcsICdzZWN0aW9uTmFtZUkxOG5JZCcsXG4gICAgICAgICAgICAgICAgICAgICdzdWJzZWN0aW9uTmFtZScsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlLCAkaHR0cCwgc2VjdGlvbk5hbWVJMThuSWQsIHN1YnNlY3Rpb25OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VjdGlvbk5hbWVJMThuSWQgPSBzZWN0aW9uTmFtZUkxOG5JZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdWJzZWN0aW9uTmFtZSA9IHN1YnNlY3Rpb25OYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFjdGl2aXR5VGl0bGUgPSBhY3Rpdml0eS50aXRsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdGl2aXR5VHlwZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWJzZWN0aW9uTmFtZSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUy5FWFBMT1JBVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlUeXBlID0gY29uc3RhbnRzLkFDVElWSVRZX1RZUEVfRVhQTE9SQVRJT047XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN1YnNlY3Rpb25OYW1lID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTLkNPTExFQ1RJT05TKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5VHlwZSA9IGNvbnN0YW50cy5BQ1RJVklUWV9UWVBFX0NPTExFQ1RJT047XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N1YnNlY3Rpb24gbmFtZSBpcyBub3QgdmFsaWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZW1vdmVBY3Rpdml0eVVybFByZWZpeCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWN0aW9uTmFtZUkxOG5JZCA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUy5QTEFZTElTVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVBY3Rpdml0eVVybFByZWZpeCA9ICcvbGVhcm5lcnBsYXlsaXN0YWN0aXZpdHloYW5kbGVyLyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlY3Rpb25OYW1lSTE4bklkID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMRUFSTkVSX0RBU0hCT0FSRF9TRUNUSU9OX0kxOE5fSURTLklOQ09NUExFVEUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWN0aXZpdHlVcmxQcmVmaXggPSAnL2xlYXJuZXJpbmNvbXBsZXRlYWN0aXZpdHloYW5kbGVyLyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlY3Rpb24gbmFtZSBpcyBub3QgdmFsaWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZW1vdmVBY3Rpdml0eVVybCA9IChVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChyZW1vdmVBY3Rpdml0eVVybFByZWZpeCArICc8YWN0aXZpdHlUeXBlPi88YWN0aXZpdHlJZD4nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5VHlwZTogYWN0aXZpdHlUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eUlkOiBhY3Rpdml0eS5pZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaHR0cFsnZGVsZXRlJ10ocmVtb3ZlQWN0aXZpdHlVcmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KS5yZXN1bHQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlY3Rpb25OYW1lSTE4bklkID09PVxuICAgICAgICAgICAgICAgICAgICBMRUFSTkVSX0RBU0hCT0FSRF9TRUNUSU9OX0kxOE5fSURTLklOQ09NUExFVEUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnNlY3Rpb25OYW1lID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUy5FWFBMT1JBVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9ICRzY29wZS5pbmNvbXBsZXRlRXhwbG9yYXRpb25zTGlzdC5pbmRleE9mKGFjdGl2aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaW5jb21wbGV0ZUV4cGxvcmF0aW9uc0xpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdWJzZWN0aW9uTmFtZSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgIExFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMuQ09MTEVDVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9ICRzY29wZS5pbmNvbXBsZXRlQ29sbGVjdGlvbnNMaXN0LmluZGV4T2YoYWN0aXZpdHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pbmNvbXBsZXRlQ29sbGVjdGlvbnNMaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc2VjdGlvbk5hbWVJMThuSWQgPT09XG4gICAgICAgICAgICAgICAgICAgIExFQVJORVJfREFTSEJPQVJEX1NFQ1RJT05fSTE4Tl9JRFMuUExBWUxJU1QpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnNlY3Rpb25OYW1lID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUy5FWFBMT1JBVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9ICRzY29wZS5leHBsb3JhdGlvblBsYXlsaXN0LmluZGV4T2YoYWN0aXZpdHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5leHBsb3JhdGlvblBsYXlsaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3Vic2VjdGlvbk5hbWUgPT09XG4gICAgICAgICAgICAgICAgICAgICAgICBMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTLkNPTExFQ1RJT05TKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSAkc2NvcGUuY29sbGVjdGlvblBsYXlsaXN0LmluZGV4T2YoYWN0aXZpdHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uUGxheWxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH1cbl0pLmFuaW1hdGlvbignLm1lbnUtc3ViLXNlY3Rpb24nLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIE5HX0hJREVfQ0xBU1MgPSAnbmctaGlkZSc7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYmVmb3JlQWRkQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUsIGRvbmUpIHtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUgPT09IE5HX0hJREVfQ0xBU1MpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnNsaWRlVXAoZG9uZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lLCBkb25lKSB7XG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09PSBOR19ISURFX0NMQVNTKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5oaWRlKCkuc2xpZGVEb3duKGRvbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGRpc3BsYXkgc3VnZ2VzdGlvbiBtb2RhbCBpbiBsZWFybmVyIHZpZXcuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzaG93U3VnZ2VzdGlvbk1vZGFsRm9yTGVhcm5lclZpZXdNb2R1bGUnKS5mYWN0b3J5KCdTaG93U3VnZ2VzdGlvbk1vZGFsRm9yTGVhcm5lclZpZXdTZXJ2aWNlJywgW1xuICAgICckcm9vdFNjb3BlJywgJyR1aWJNb2RhbCcsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHVpYk1vZGFsLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICB2YXIgX3RlbXBsYXRlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9zaG93LXN1Z2dlc3Rpb24tZWRpdG9yLXBhZ2VzLycgK1xuICAgICAgICAgICAgJ3Nob3ctc3VnZ2VzdGlvbi1tb2RhbC1mb3ItbGVhcm5lci12aWV3LycgK1xuICAgICAgICAgICAgJ3Nob3ctc3VnZ2VzdGlvbi1tb2RhbC1mb3ItbGVhcm5lci12aWV3LmRpcmVjdGl2ZS5odG1sJyk7XG4gICAgICAgIHZhciBfc2hvd0VkaXRTdGF0ZUNvbnRlbnRTdWdnZXN0aW9uTW9kYWwgPSBmdW5jdGlvbiAobmV3Q29udGVudCwgb2xkQ29udGVudCwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogX3RlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgICAgICAgICAgbmV3Q29udGVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ld0NvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG9sZENvbnRlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvbGRDb250ZW50O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnU2hvd1N1Z2dlc3Rpb25Nb2RhbEZvckxlYXJuZXJWaWV3J1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzaG93U3VnZ2VzdGlvbk1vZGFsOiBmdW5jdGlvbiAoc3VnZ2VzdGlvblR5cGUsIGV4dHJhUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Z2dlc3Rpb25UeXBlID09PSAnZWRpdF9leHBsb3JhdGlvbl9zdGF0ZV9jb250ZW50Jykge1xuICAgICAgICAgICAgICAgICAgICBfc2hvd0VkaXRTdGF0ZUNvbnRlbnRTdWdnZXN0aW9uTW9kYWwoZXh0cmFQYXJhbXMubmV3Q29udGVudCwgZXh0cmFQYXJhbXMub2xkQ29udGVudCwgZXh0cmFQYXJhbXMuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgbWFuaXB1bGF0aW5nIHRoZSBwYWdlIFVSTC4gQWxzbyBhbGxvd3NcbiAqIGZ1bmN0aW9ucyBvbiAkd2luZG93IHRvIGJlIG1vY2tlZCBpbiB1bml0IHRlc3RzLlxuICovXG5vcHBpYS5mYWN0b3J5KCdVcmxTZXJ2aWNlJywgWyckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgZm9yIHRlc3RpbmcgcHVycG9zZXMgKHRvIG1vY2sgJHdpbmRvdy5sb2NhdGlvbilcbiAgICAgICAgICAgIGdldEN1cnJlbnRMb2NhdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkd2luZG93LmxvY2F0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEN1cnJlbnRRdWVyeVN0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLnNlYXJjaDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKiBBcyBwYXJhbXNba2V5XSBpcyBvdmVyd3JpdHRlbiwgaWYgcXVlcnkgc3RyaW5nIGhhcyBtdWx0aXBsZSBmaWVsZFZhbHVlc1xuICAgICAgICAgICAgICAgZm9yIHNhbWUgZmllbGROYW1lLCB1c2UgZ2V0UXVlcnlGaWVsZFZhbHVlc0FzTGlzdChmaWVsZE5hbWUpIHRvIGdldCBpdFxuICAgICAgICAgICAgICAgaW4gYXJyYXkgZm9ybS4gKi9cbiAgICAgICAgICAgIGdldFVybFBhcmFtczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgcGFydHMgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLnJlcGxhY2UoL1s/Jl0rKFtePSZdKyk9KFteJl0qKS9naSwgZnVuY3Rpb24gKG0sIGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zW2RlY29kZVVSSUNvbXBvbmVudChrZXkpXSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0lmcmFtZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgdmFyIHVybFBhcnRzID0gcGF0aG5hbWUuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXJsUGFydHNbMV0gPT09ICdlbWJlZCc7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UGF0aG5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5wYXRobmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBUb3BpYyBpZCBzaG91bGQgYmUgY29ycmVjdGx5IHJldHVybmVkIGZyb20gdG9waWMgZWRpdG9yIGFzIHdlbGwgYXNcbiAgICAgICAgICAgIC8vIHN0b3J5IGVkaXRvciwgc2luY2UgYm90aCBoYXZlIHRvcGljIGlkIGluIHRoZWlyIHVybC5cbiAgICAgICAgICAgIGdldFRvcGljSWRGcm9tVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvKHN0b3J5fHRvcGljKV9lZGl0b3JcXC8oXFx3fC0pezEyfS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aG5hbWUuc3BsaXQoJy8nKVsyXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgdG9waWMgaWQgdXJsJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0VG9waWNOYW1lRnJvbUxlYXJuZXJVcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC8oc3Rvcnl8dG9waWN8cHJhY3RpY2Vfc2Vzc2lvbikvZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZS5zcGxpdCgnLycpWzJdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgVVJMIGZvciB0b3BpYycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0b3J5SWRGcm9tVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvc3RvcnlfZWRpdG9yKFxcLyhcXHd8LSl7MTJ9KXsyfS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aG5hbWUuc3BsaXQoJy8nKVszXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgc3RvcnkgaWQgdXJsJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RvcnlJZEluUGxheWVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBpZiAocXVlcnkubWF0Y2goL1xcP3N0b3J5X2lkPSgoXFx3fC0pezEyfSkvZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5LnNwbGl0KCc9JylbMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFNraWxsSWRGcm9tVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIHZhciBza2lsbElkID0gcGF0aG5hbWUuc3BsaXQoJy8nKVsyXTtcbiAgICAgICAgICAgICAgICBpZiAoc2tpbGxJZC5sZW5ndGggIT09IDEyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFNraWxsIElkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBza2lsbElkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFF1ZXJ5RmllbGRWYWx1ZXNBc0xpc3Q6IGZ1bmN0aW9uIChmaWVsZE5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGRWYWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5pbmRleE9mKCc/JykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBFYWNoIHF1ZXJ5SXRlbSByZXR1cm4gb25lIGZpZWxkLXZhbHVlIHBhaXIgaW4gdGhlIHVybC5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5SXRlbXMgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLnNsaWNlKHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuaW5kZXhPZignPycpICsgMSkuc3BsaXQoJyYnKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWVyeUl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZpZWxkTmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChxdWVyeUl0ZW1zW2ldLnNwbGl0KCc9JylbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGaWVsZFZhbHVlID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5SXRlbXNbaV0uc3BsaXQoJz0nKVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEZpZWxkTmFtZSA9PT0gZmllbGROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZXMucHVzaChjdXJyZW50RmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVmFsdWVzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFkZEZpZWxkOiBmdW5jdGlvbiAodXJsLCBmaWVsZE5hbWUsIGZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZW5jb2RlZEZpZWxkVmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQoZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgdmFyIGVuY29kZWRGaWVsZE5hbWUgPSBlbmNvZGVVUklDb21wb25lbnQoZmllbGROYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXJsICsgKHVybC5pbmRleE9mKCc/JykgIT09IC0xID8gJyYnIDogJz8nKSArIGVuY29kZWRGaWVsZE5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnPScgKyBlbmNvZGVkRmllbGRWYWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRIYXNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkuaGFzaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9