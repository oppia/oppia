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
/******/ 		"collection_player": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/collection-player-page/collection-player-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0","collection_player~creator_dashboard~exploration_editor~exploration_player~learner_dashboard~library~~88caa5df","collection_player~learner_dashboard~library~profile","collection_editor~collection_player"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/components/button-directives/exploration-embed-modal/exploration-embed-button.service.ts":
/*!**************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/exploration-embed-modal/exploration-embed-button.service.ts ***!
  \**************************************************************************************************************************/
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
 * @fileoverview Service for the 'embed exploration' modal.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
angular.module('explorationEmbedButtonModule').factory('ExplorationEmbedButtonService', [
    '$uibModal', 'SiteAnalyticsService', 'UrlInterpolationService',
    function ($uibModal, SiteAnalyticsService, UrlInterpolationService) {
        return {
            showModal: function (explorationId) {
                $uibModal.open({
                    backdrop: true,
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/button-directives/exploration-embed-modal/' +
                        'exploration-embed-button.directive.html'),
                    resolve: {
                        explorationId: function () {
                            return explorationId;
                        }
                    },
                    controller: [
                        '$scope', '$uibModalInstance', '$window', 'explorationId',
                        function ($scope, $uibModalInstance, $window, explorationId) {
                            $scope.explorationId = explorationId;
                            $scope.serverName = ($window.location.protocol + '//' + $window.location.host);
                            $scope.close = function () {
                                $uibModalInstance.dismiss('close');
                            };
                            $scope.selectText = function (evt) {
                                var codeDiv = evt.currentTarget;
                                var range = document.createRange();
                                range.setStartBefore(codeDiv.firstChild);
                                range.setEndAfter(codeDiv.lastChild);
                                var selection = window.getSelection();
                                selection.removeAllRanges();
                                selection.addRange(range);
                            };
                        }
                    ]
                });
                SiteAnalyticsService.registerOpenEmbedInfoEvent(explorationId);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/attribution-guide/attribution-guide.directive.ts":
/*!**********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/attribution-guide/attribution-guide.directive.ts ***!
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
 * @fileoverview Directive for the attribution guide.
 */
__webpack_require__(/*! domain/utilities/BrowserCheckerService.ts */ "./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('attributionGuideModule').directive('attributionGuide', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/attribution-guide/' +
                'attribution-guide.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                'BrowserCheckerService', 'UrlService', function (BrowserCheckerService, UrlService) {
                    var ctrl = this;
                    ctrl.isMobileDevice = BrowserCheckerService.isMobileDevice();
                    ctrl.iframed = UrlService.isIframed();
                }
            ]
        };
    }
]);


/***/ }),

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

/***/ "./core/templates/dev/head/components/common-layout-directives/sharing-links/sharing-links.directive.ts":
/*!**************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/sharing-links/sharing-links.directive.ts ***!
  \**************************************************************************************************************/
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
 * @fileoverview Directive for the Social Sharing Links.
 */
__webpack_require__(/*! components/button-directives/exploration-embed-modal/exploration-embed-button.service.ts */ "./core/templates/dev/head/components/button-directives/exploration-embed-modal/exploration-embed-button.service.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
angular.module('sharingLinksModule').directive('sharingLinks', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                layoutType: '@',
                layoutAlignType: '@',
                shareType: '@',
                getTwitterText: '&twitterText',
                getExplorationId: '&explorationId',
                getCollectionId: '&collectionId'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/sharing-links/' +
                'sharing-links.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$window', 'HtmlEscaperService',
                'ExplorationEmbedButtonService', 'SiteAnalyticsService',
                function ($window, HtmlEscaperService, ExplorationEmbedButtonService, SiteAnalyticsService) {
                    var ctrl = this;
                    ctrl.registerShareEvent = null;
                    if (ctrl.shareType === 'exploration') {
                        ctrl.explorationId = ctrl.getExplorationId();
                        ctrl.activityType = 'explore';
                        ctrl.activityId = ctrl.explorationId;
                        ctrl.registerShareEvent = (SiteAnalyticsService.registerShareExplorationEvent);
                        ctrl.showEmbedExplorationModal = (ExplorationEmbedButtonService.showModal);
                    }
                    else if (ctrl.shareType === 'collection') {
                        ctrl.collectionId = ctrl.getCollectionId();
                        ctrl.activityType = 'collection';
                        ctrl.activityId = ctrl.collectionId;
                        ctrl.registerShareEvent = (SiteAnalyticsService.registerShareCollectionEvent);
                    }
                    else {
                        throw Error('SharingLinks directive can only be used either in the' +
                            'collection player or the exploration player');
                    }
                    ctrl.serverName = ($window.location.protocol + '//' + $window.location.host);
                    ctrl.escapedTwitterText = (HtmlEscaperService.unescapedStrToEscapedStr(ctrl.getTwitterText()));
                    ctrl.classroomUrl = UrlInterpolationService.getStaticImageUrl('/general/classroom.png');
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/CollectionPlaythroughObjectFactory.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionPlaythroughObjectFactory.ts ***!
  \*****************************************************************************************/
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection playthrough domain objects.
 */
oppia.factory('CollectionPlaythroughObjectFactory', [function () {
        // TODO(bhenning): Add setters for some of these properties. Setters allow
        // the collection editor to setup specifically configured playthrough
        // sessions of the collection player through this object (for example, the
        // editor would be able to fake which explorations were completed to see how
        // that particular configuration would look for a learner).
        // Stores information about a current playthrough of a collection for a
        // user.
        var CollectionPlaythrough = function (nextExplorationId, completedExplorationIds) {
            this._nextExplorationId = nextExplorationId;
            this._completedExplorationIds = completedExplorationIds;
        };
        // Returns the upcoming exploration ID. Changes to this are not
        // reflected in the collection.
        CollectionPlaythrough.prototype.getNextExplorationId = function () {
            return this._nextExplorationId;
        };
        CollectionPlaythrough.prototype.getNextRecommendedCollectionNodeCount =
            function () {
                // As the collection is linear, only a single node would be available,
                // after any node.
                return 1;
            };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        CollectionPlaythrough['hasFinishedCollection'] = function () {
            /* eslint-enable dot-notation */
            return this._nextExplorationId === null;
        };
        // Returns a list of explorations completed that are related to this
        // collection. Changes to this list are not reflected in this collection.
        CollectionPlaythrough.prototype.getCompletedExplorationIds = function () {
            return angular.copy(this._completedExplorationIds);
        };
        CollectionPlaythrough.prototype.getCompletedExplorationNodeCount =
            function () {
                return this._completedExplorationIds.length;
            };
        CollectionPlaythrough.prototype.hasStartedCollection = function () {
            return this._completedExplorationIds.length !== 0;
        };
        // Static class methods. Note that "this" is not available in static
        // contexts. This function takes a JSON object which represents a backend
        // collection playthrough python dict.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        CollectionPlaythrough['createFromBackendObject'] = function (
        /* eslint-enable dot-notation */
        collectionPlaythroughBackendObject) {
            return new CollectionPlaythrough(collectionPlaythroughBackendObject.next_exploration_id, collectionPlaythroughBackendObject.completed_exploration_ids);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        CollectionPlaythrough['create'] = function (
        /* eslint-enable dot-notation */
        nextExplorationId, completedExplorationIds) {
            return new CollectionPlaythrough(nextExplorationId, angular.copy(completedExplorationIds));
        };
        return CollectionPlaythrough;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/GuestCollectionProgressObjectFactory.ts":
/*!*******************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/GuestCollectionProgressObjectFactory.ts ***!
  \*******************************************************************************************/
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
 * @fileoverview Factory for creating and mutating a domain object which
 * represents the progress of a guest playing through a collection.
 */
oppia.factory('GuestCollectionProgressObjectFactory', [
    function () {
        var GuestCollectionProgress = function (completedExplorationsMap) {
            this._completedExplorationsMap = completedExplorationsMap;
        };
        // Instance methods
        // Returns whether the guest has made any progress towards completing the
        // specified collection ID. Note that this does not account for whether the
        // completed explorations are still contained within that collection.
        GuestCollectionProgress.prototype.hasCompletionProgress = function (collectionId) {
            return this._completedExplorationsMap.hasOwnProperty(collectionId);
        };
        // Returns an array of exploration IDs which have been completed by the
        // specified collection ID, or empty if none have.
        GuestCollectionProgress.prototype.getCompletedExplorationIds = function (collectionId) {
            if (!this.hasCompletionProgress(collectionId)) {
                return [];
            }
            return angular.copy(this._completedExplorationsMap[collectionId]);
        };
        // Specifies that a specific exploration ID has been completed in the
        // context of the specified collection. Returns whether that exploration ID
        // was not previously registered as completed for the collection.
        GuestCollectionProgress.prototype.addCompletedExplorationId = function (collectionId, explorationId) {
            var completedExplorationIds = this.getCompletedExplorationIds(collectionId);
            if (completedExplorationIds.indexOf(explorationId) === -1) {
                completedExplorationIds.push(explorationId);
                this._completedExplorationsMap[collectionId] = completedExplorationIds;
                return true;
            }
            return false;
        };
        // Converts this object to JSON for storage.
        GuestCollectionProgress.prototype.toJson = function (collectionId, explorationIds) {
            return JSON.stringify(this._completedExplorationsMap);
        };
        // Static class methods. Note that "this" is not available in static
        // contexts.
        // This function takes a JSON string which represents a raw collection
        // object and returns a new GuestCollectionProgress domain object. A null or
        // undefined string indicates that an empty progress object should be
        // created.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        GuestCollectionProgress['createFromJson'] = function (
        /* eslint-enable dot-notation */
        collectionProgressJson) {
            if (collectionProgressJson) {
                return new GuestCollectionProgress(JSON.parse(collectionProgressJson));
            }
            else {
                return new GuestCollectionProgress({});
            }
        };
        return GuestCollectionProgress;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/GuestCollectionProgressService.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/GuestCollectionProgressService.ts ***!
  \*************************************************************************************/
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
 * @fileoverview Service that records progress guests make during a collection
 * playthrough. Note that this service does not currently support saving a
 * user's progress when they create an account.
 */
// TODO(bhenning): Move this to a service which stores shared state across the
// frontend in a way that can be persisted in the backend upon account
// creation, such as exploration progress.
// TODO(bhenning): This should be reset upon login, otherwise the progress will
// be different depending on the user's logged in/logged out state.
__webpack_require__(/*! domain/collection/GuestCollectionProgressObjectFactory.ts */ "./core/templates/dev/head/domain/collection/GuestCollectionProgressObjectFactory.ts");
oppia.factory('GuestCollectionProgressService', [
    '$window', 'GuestCollectionProgressObjectFactory',
    function ($window, GuestCollectionProgressObjectFactory) {
        var COLLECTION_STORAGE_KEY = 'collectionProgressStore_v1';
        var storeGuestCollectionProgress = function (guestCollectionProgress) {
            $window.localStorage[COLLECTION_STORAGE_KEY] = (guestCollectionProgress.toJson());
        };
        var loadGuestCollectionProgress = function () {
            return GuestCollectionProgressObjectFactory.createFromJson($window.localStorage[COLLECTION_STORAGE_KEY]);
        };
        var recordCompletedExploration = function (collectionId, explorationId) {
            var guestCollectionProgress = loadGuestCollectionProgress();
            var completedExplorationIdHasBeenAdded = (guestCollectionProgress.addCompletedExplorationId(collectionId, explorationId));
            if (completedExplorationIdHasBeenAdded) {
                storeGuestCollectionProgress(guestCollectionProgress);
            }
        };
        var getValidCompletedExplorationIds = function (collection) {
            var collectionId = collection.getId();
            var guestCollectionProgress = loadGuestCollectionProgress();
            var completedExplorationIds = (guestCollectionProgress.getCompletedExplorationIds(collectionId));
            // Filter the exploration IDs by whether they are contained within the
            // specified collection structure.
            return completedExplorationIds.filter(function (expId) {
                return collection.containsCollectionNode(expId);
            });
        };
        // This method corresponds to collection_domain.get_next_exploration_id.
        var _getNextExplorationId = function (collection, completedIds) {
            var explorationIds = collection.getExplorationIds();
            for (var i = 0; i < explorationIds.length; i++) {
                if (completedIds.indexOf(explorationIds[i]) === -1) {
                    return explorationIds[i];
                }
            }
            return null;
        };
        return {
            /**
             * Records that the specified exploration was completed in the context of
             * the specified collection, as a guest.
             */
            recordExplorationCompletedInCollection: function (collectionId, explorationId) {
                recordCompletedExploration(collectionId, explorationId);
            },
            /**
             * Returns whether the guest user has made any progress toward completing
             * the specified collection by completing at least one exploration related
             * to the collection. Note that this does not account for any completed
             * explorations which are no longer referenced by the collection;
             * getCompletedExplorationIds() should be used for that, instead.
             */
            hasCompletedSomeExploration: function (collectionId) {
                var guestCollectionProgress = loadGuestCollectionProgress();
                return guestCollectionProgress.hasCompletionProgress(collectionId);
            },
            /**
             * Given a collection object, returns the list of exploration IDs
             * completed by the guest user. The return list of exploration IDs will
             * not include any previously completed explorations for the given
             * collection that are no longer part of the collection.
             */
            getCompletedExplorationIds: function (collection) {
                return getValidCompletedExplorationIds(collection);
            },
            /**
             * Given a collection object a list of completed exploration IDs, returns
             * the next exploration ID the guest user can play as part of
             * completing the collection. If this method returns null, the
             * guest has completed the collection.
             */
            getNextExplorationId: function (collection, completedExplorationIds) {
                return _getNextExplorationId(collection, completedExplorationIds);
            }
        };
    }
]);


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
oppia.factory('BrowserCheckerService', [
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

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-footer/collection-footer.directive.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-footer/collection-footer.directive.ts ***!
  \***************************************************************************************************************/
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
 * @fileoverview Directive for showing author/share footer
 * in collection player.
 */
__webpack_require__(/*! components/common-layout-directives/sharing-links/sharing-links.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/sharing-links/sharing-links.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('collectionFooterModule').directive('collectionFooter', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                twitterText: '@'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-player-page/collection-footer/' +
                'collection-footer.directive.html'),
            controller: [
                '$scope',
                function ($scope) {
                    $scope.collectionId = GLOBALS.collectionId;
                    $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                    $scope.getTwitterText = function () {
                        return $scope.twitterText;
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-local-nav/collection-local-nav.controller.ts":
/*!**********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-local-nav/collection-local-nav.controller.ts ***!
  \**********************************************************************************************************************/
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
 * @fileoverview Controller for the local navigation in the collection view.
 */
angular.module('collectionLocalNavModule').controller('CollectionLocalNav', ['$scope', function ($scope) {
        $scope.canEdit = GLOBALS.canEdit;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-node-list/collection-node-list.directive.ts":
/*!*********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-node-list/collection-node-list.directive.ts ***!
  \*********************************************************************************************************************/
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
 * @fileoverview Directive for creating a list of collection nodes which link to
 * playing the exploration in each node.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('collectionNodeListModule').directive('collectionNodeList', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getCollectionId: '&collectionId',
                getCollectionNodes: '&collectionNodes'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-player-page/collection-node-list/' +
                'collection-node-list.directive.html')
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-player-page.controller.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-player-page.controller.ts ***!
  \***************************************************************************************************/
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
 * @fileoverview Controller for the learner's view of a collection.
 */
// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
__webpack_require__(/*! pages/collection-player-page/collection-node-list/collection-node-list.directive.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-node-list/collection-node-list.directive.ts");
// ^^^ this block of requires should be removed ^^^
__webpack_require__(/*! components/common-layout-directives/attribution-guide/attribution-guide.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/attribution-guide/attribution-guide.directive.ts");
__webpack_require__(/*! components/common-layout-directives/background-banner/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts");
__webpack_require__(/*! components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.directive.ts");
__webpack_require__(/*! pages/collection-player-page/collection-footer/collection-footer.directive.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-footer/collection-footer.directive.ts");
__webpack_require__(/*! pages/collection-player-page/collection-local-nav/collection-local-nav.controller.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-local-nav/collection-local-nav.controller.ts");
__webpack_require__(/*! domain/collection/CollectionObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionObjectFactory.ts");
__webpack_require__(/*! domain/collection/CollectionPlaythroughObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionPlaythroughObjectFactory.ts");
__webpack_require__(/*! domain/collection/GuestCollectionProgressService.ts */ "./core/templates/dev/head/domain/collection/GuestCollectionProgressService.ts");
__webpack_require__(/*! domain/collection/ReadOnlyCollectionBackendApiService.ts */ "./core/templates/dev/head/domain/collection/ReadOnlyCollectionBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('collectionPlayerPageModule').constant('COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');
angular.module('collectionPlayerPageModule').controller('CollectionPlayer', [
    '$anchorScroll', '$http', '$location', '$scope',
    'AlertsService', 'CollectionObjectFactory',
    'CollectionPlaythroughObjectFactory', 'GuestCollectionProgressService',
    'ReadOnlyCollectionBackendApiService', 'UrlInterpolationService',
    'WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS',
    function ($anchorScroll, $http, $location, $scope, AlertsService, CollectionObjectFactory, CollectionPlaythroughObjectFactory, GuestCollectionProgressService, ReadOnlyCollectionBackendApiService, UrlInterpolationService, WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS) {
        $scope.collection = null;
        $scope.collectionPlaythrough = null;
        $scope.collectionId = GLOBALS.collectionId;
        $scope.isLoggedIn = GLOBALS.isLoggedIn;
        $scope.explorationCardIsShown = false;
        $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
        // The pathIconParameters is an array containing the co-ordinates,
        // background color and icon url for the icons generated on the path.
        $scope.pathIconParameters = [];
        $scope.activeHighlightedIconIndex = -1;
        $scope.MIN_HEIGHT_FOR_PATH_SVG_PX = 220;
        $scope.ODD_SVG_HEIGHT_OFFSET_PX = 150;
        $scope.EVEN_SVG_HEIGHT_OFFSET_PX = 280;
        $scope.ICON_Y_INITIAL_PX = 35;
        $scope.ICON_Y_INCREMENT_PX = 110;
        $scope.ICON_X_MIDDLE_PX = 225;
        $scope.ICON_X_LEFT_PX = 55;
        $scope.ICON_X_RIGHT_PX = 395;
        $scope.svgHeight = $scope.MIN_HEIGHT_FOR_PATH_SVG_PX;
        $scope.nextExplorationId = null;
        $scope.whitelistedCollectionIdsForGuestProgress = (WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS);
        $anchorScroll.yOffset = -80;
        $scope.setIconHighlight = function (index) {
            $scope.activeHighlightedIconIndex = index;
        };
        $scope.unsetIconHighlight = function () {
            $scope.activeHighlightedIconIndex = -1;
        };
        $scope.togglePreviewCard = function () {
            $scope.explorationCardIsShown = !$scope.explorationCardIsShown;
        };
        $scope.getCollectionNodeForExplorationId = function (explorationId) {
            var collectionNode = ($scope.collection.getCollectionNodeByExplorationId(explorationId));
            if (!collectionNode) {
                AlertsService.addWarning('There was an error loading the collection.');
            }
            return collectionNode;
        };
        $scope.getNextRecommendedCollectionNodes = function () {
            return $scope.getCollectionNodeForExplorationId($scope.collectionPlaythrough.getNextExplorationId());
        };
        $scope.getCompletedExplorationNodes = function () {
            return $scope.getCollectionNodeForExplorationId($scope.collectionPlaythrough.getCompletedExplorationIds());
        };
        $scope.getNonRecommendedCollectionNodeCount = function () {
            return $scope.collection.getCollectionNodeCount() - ($scope.collectionPlaythrough.getNextRecommendedCollectionNodeCount() +
                $scope.collectionPlaythrough.getCompletedExplorationNodeCount());
        };
        $scope.updateExplorationPreview = function (explorationId) {
            $scope.explorationCardIsShown = true;
            $scope.currentExplorationId = explorationId;
            $scope.summaryToPreview = $scope.getCollectionNodeForExplorationId(explorationId).getExplorationSummaryObject();
        };
        // Calculates the SVG parameters required to draw the curved path.
        $scope.generatePathParameters = function () {
            // The pathSvgParameters represents the final string of SVG parameters
            // for the bezier curve to be generated. The default parameters represent
            // the first curve ie. lesson 1 to lesson 3.
            $scope.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
            var collectionNodeCount = $scope.collection.getCollectionNodeCount();
            // The sParameterExtension represents the co-ordinates following the 'S'
            // (smooth curve to) command in SVG.
            var sParameterExtension = '';
            $scope.pathIconParameters = $scope.generatePathIconParameters();
            if (collectionNodeCount === 1) {
                $scope.pathSvgParameters = '';
            }
            else if (collectionNodeCount === 2) {
                $scope.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
            }
            else {
                // The x and y here represent the co-ordinates of the control points
                // for the bezier curve (path).
                var y = 500;
                for (var i = 1; i < Math.floor(collectionNodeCount / 2); i++) {
                    var x = (i % 2) ? 30 : 470;
                    sParameterExtension += x + ' ' + y + ', ';
                    y += 20;
                    sParameterExtension += 250 + ' ' + y + ', ';
                    y += 200;
                }
                if (sParameterExtension !== '') {
                    $scope.pathSvgParameters += ' S ' + sParameterExtension;
                }
            }
            if (collectionNodeCount % 2 === 0) {
                if (collectionNodeCount === 2) {
                    $scope.svgHeight = $scope.MIN_HEIGHT_FOR_PATH_SVG_PX;
                }
                else {
                    $scope.svgHeight = y - $scope.EVEN_SVG_HEIGHT_OFFSET_PX;
                }
            }
            else {
                if (collectionNodeCount === 1) {
                    $scope.svgHeight = $scope.MIN_HEIGHT_FOR_PATH_SVG_PX;
                }
                else {
                    $scope.svgHeight = y - $scope.ODD_SVG_HEIGHT_OFFSET_PX;
                }
            }
        };
        $scope.generatePathIconParameters = function () {
            var collectionNodes = $scope.collection.getCollectionNodes();
            var iconParametersArray = [];
            iconParametersArray.push({
                thumbnailIconUrl: collectionNodes[0].getExplorationSummaryObject().thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
                left: '225px',
                top: '35px',
                thumbnailBgColor: collectionNodes[0].getExplorationSummaryObject().thumbnail_bg_color
            });
            // Here x and y represent the co-ordinates for the icons in the path.
            var x = $scope.ICON_X_MIDDLE_PX;
            var y = $scope.ICON_Y_INITIAL_PX;
            var countMiddleIcon = 1;
            for (var i = 1; i < $scope.collection.getCollectionNodeCount(); i++) {
                if (countMiddleIcon === 0 && x === $scope.ICON_X_MIDDLE_PX) {
                    x = $scope.ICON_X_LEFT_PX;
                    y += $scope.ICON_Y_INCREMENT_PX;
                    countMiddleIcon = 1;
                }
                else if (countMiddleIcon === 1 && x === $scope.ICON_X_MIDDLE_PX) {
                    x = $scope.ICON_X_RIGHT_PX;
                    y += $scope.ICON_Y_INCREMENT_PX;
                    countMiddleIcon = 0;
                }
                else {
                    x = $scope.ICON_X_MIDDLE_PX;
                    y += $scope.ICON_Y_INCREMENT_PX;
                }
                iconParametersArray.push({
                    thumbnailIconUrl: collectionNodes[i].getExplorationSummaryObject().thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
                    left: x + 'px',
                    top: y + 'px',
                    thumbnailBgColor: collectionNodes[i].getExplorationSummaryObject().thumbnail_bg_color
                });
            }
            return iconParametersArray;
        };
        $scope.isCompletedExploration = function (explorationId) {
            var completedExplorationIds = ($scope.collectionPlaythrough.getCompletedExplorationIds());
            return completedExplorationIds.indexOf(explorationId) > -1;
        };
        $scope.getExplorationUrl = function (explorationId) {
            return ('/explore/' + explorationId + '?collection_id=' + $scope.collectionId);
        };
        $http.get('/collectionsummarieshandler/data', {
            params: {
                stringified_collection_ids: JSON.stringify([$scope.collectionId])
            }
        }).then(function (response) {
            $scope.collectionSummary = response.data.summaries[0];
        }, function () {
            AlertsService.addWarning('There was an error while fetching the collection summary.');
        });
        // Load the collection the learner wants to view.
        ReadOnlyCollectionBackendApiService.loadCollection($scope.collectionId).then(function (collectionBackendObject) {
            $scope.collection = CollectionObjectFactory.create(collectionBackendObject);
            // Load the user's current progress in the collection. If the user is a
            // guest, then either the defaults from the server will be used or the
            // user's local progress, if any has been made and the collection is
            // whitelisted.
            var collectionAllowsGuestProgress = ($scope.whitelistedCollectionIdsForGuestProgress.indexOf($scope.collectionId) !== -1);
            if (!$scope.isLoggedIn && collectionAllowsGuestProgress &&
                GuestCollectionProgressService.hasCompletedSomeExploration($scope.collectionId)) {
                var completedExplorationIds = (GuestCollectionProgressService.getCompletedExplorationIds($scope.collection));
                var nextExplorationId = (GuestCollectionProgressService.getNextExplorationId($scope.collection, completedExplorationIds));
                $scope.collectionPlaythrough = (CollectionPlaythroughObjectFactory.create(nextExplorationId, completedExplorationIds));
            }
            else {
                $scope.collectionPlaythrough = (CollectionPlaythroughObjectFactory.createFromBackendObject(collectionBackendObject.playthrough_dict));
            }
            $scope.nextExplorationId =
                $scope.collectionPlaythrough.getNextExplorationId();
        }, function () {
            // TODO(bhenning): Handle not being able to load the collection.
            // NOTE TO DEVELOPERS: Check the backend console for an indication as to
            // why this error occurred; sometimes the errors are noisy, so they are
            // not shown to the user.
            AlertsService.addWarning('There was an error loading the collection.');
        });
        $scope.$watch('collection', function (newValue) {
            if (newValue !== null) {
                $scope.generatePathParameters();
            }
        }, true);
        $scope.scrollToLocation = function (id) {
            $location.hash(id);
            $anchorScroll();
        };
        $scope.closeOnClickingOutside = function () {
            $scope.explorationCardIsShown = false;
        };
        $scope.onClickStopPropagation = function ($evt) {
            $evt.stopPropagation();
        };
        // Touching anywhere outside the mobile preview should hide it.
        document.addEventListener('touchstart', function () {
            if ($scope.explorationCardIsShown === true) {
                $scope.explorationCardIsShown = false;
            }
        });
    }
]);


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
oppia.factory('HtmlEscaperService', ['$log', function ($log) {
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


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9idXR0b24tZGlyZWN0aXZlcy9leHBsb3JhdGlvbi1lbWJlZC1tb2RhbC9leHBsb3JhdGlvbi1lbWJlZC1idXR0b24uc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9hdHRyaWJ1dGlvbi1ndWlkZS9hdHRyaWJ1dGlvbi1ndWlkZS5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL3NoYXJpbmctbGlua3Mvc2hhcmluZy1saW5rcy5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvblBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY29sbGVjdGlvbi9HdWVzdENvbGxlY3Rpb25Qcm9ncmVzc09iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2NvbGxlY3Rpb24vR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi91dGlsaXRpZXMvQnJvd3NlckNoZWNrZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy9jb252ZXJ0LXRvLXBsYWluLXRleHQuZmlsdGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UvY29sbGVjdGlvbi1mb290ZXIvY29sbGVjdGlvbi1mb290ZXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UvY29sbGVjdGlvbi1sb2NhbC1uYXYvY29sbGVjdGlvbi1sb2NhbC1uYXYuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLXBsYXllci1wYWdlL2NvbGxlY3Rpb24tbm9kZS1saXN0L2NvbGxlY3Rpb24tbm9kZS1saXN0LmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLXBsYXllci1wYWdlL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvU2l0ZUFuYWx5dGljc1NlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esa0RBQTBDLGdDQUFnQztBQUMxRTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdFQUF3RCxrQkFBa0I7QUFDMUU7QUFDQSx5REFBaUQsY0FBYztBQUMvRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQXlDLGlDQUFpQztBQUMxRSx3SEFBZ0gsbUJBQW1CLEVBQUU7QUFDckk7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUFnQix1QkFBdUI7QUFDdkM7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLG9HQUFrQztBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHNIQUEyQztBQUNuRCxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxvTkFDaUM7QUFDekMsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxnR0FBZ0M7QUFDeEMsbUJBQU8sQ0FBQyxvR0FBa0M7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQzVFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscURBQXFEO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxzSkFBMkQ7QUFDbkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsMkJBQTJCO0FBQ3REO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdURBQXVEO0FBQ3ZELHVEQUF1RDtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDRMQUN3QjtBQUNoQyxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDbEJMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwTUFDK0I7QUFDdkM7QUFDQSxtQkFBTyxDQUFDLDRNQUM0QjtBQUNwQyxtQkFBTyxDQUFDLDRNQUM0QjtBQUNwQyxtQkFBTyxDQUFDLHNPQUNtQztBQUMzQyxtQkFBTyxDQUFDLDhMQUM0QjtBQUNwQyxtQkFBTyxDQUFDLDRNQUNnQztBQUN4QyxtQkFBTyxDQUFDLDRIQUE4QztBQUN0RCxtQkFBTyxDQUFDLGtKQUF5RDtBQUNqRSxtQkFBTyxDQUFDLDBJQUFxRDtBQUM3RCxtQkFBTyxDQUFDLG9KQUEwRDtBQUNsRSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQix5Q0FBeUM7QUFDeEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixnREFBZ0Q7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBLFNBQVM7QUFDVDtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsdUNBQXVDO0FBQ3ZDO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EseUNBQXlDO0FBQ3pDLDBDQUEwQztBQUMxQyx5Q0FBeUM7QUFDekMsd0NBQXdDO0FBQ3hDLHdDQUF3QztBQUN4QyxhQUFhO0FBQ2I7QUFDQTtBQUNBLG9DQUFvQztBQUNwQyxtQ0FBbUM7QUFDbkMsa0NBQWtDO0FBQ2xDLGtDQUFrQztBQUNsQyxtQ0FBbUM7QUFDbkM7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDOUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQzVLTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRUFBbUUsR0FBRztBQUN0RTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSw0REFBNEQsR0FBRyxFQUFFLEVBQUU7QUFDbkU7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxvREFBb0QsR0FBRztBQUN2RDtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyx1QkFBdUI7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyIsImZpbGUiOiJjb2xsZWN0aW9uX3BsYXllci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBpbnN0YWxsIGEgSlNPTlAgY2FsbGJhY2sgZm9yIGNodW5rIGxvYWRpbmdcbiBcdGZ1bmN0aW9uIHdlYnBhY2tKc29ucENhbGxiYWNrKGRhdGEpIHtcbiBcdFx0dmFyIGNodW5rSWRzID0gZGF0YVswXTtcbiBcdFx0dmFyIG1vcmVNb2R1bGVzID0gZGF0YVsxXTtcbiBcdFx0dmFyIGV4ZWN1dGVNb2R1bGVzID0gZGF0YVsyXTtcblxuIFx0XHQvLyBhZGQgXCJtb3JlTW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcbiBcdFx0Ly8gdGhlbiBmbGFnIGFsbCBcImNodW5rSWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG4gXHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDAsIHJlc29sdmVzID0gW107XG4gXHRcdGZvcig7aSA8IGNodW5rSWRzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0Y2h1bmtJZCA9IGNodW5rSWRzW2ldO1xuIFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuIFx0XHRcdFx0cmVzb2x2ZXMucHVzaChpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF1bMF0pO1xuIFx0XHRcdH1cbiBcdFx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuIFx0XHR9XG4gXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuIFx0XHRcdGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG4gXHRcdFx0XHRtb2R1bGVzW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0aWYocGFyZW50SnNvbnBGdW5jdGlvbikgcGFyZW50SnNvbnBGdW5jdGlvbihkYXRhKTtcblxuIFx0XHR3aGlsZShyZXNvbHZlcy5sZW5ndGgpIHtcbiBcdFx0XHRyZXNvbHZlcy5zaGlmdCgpKCk7XG4gXHRcdH1cblxuIFx0XHQvLyBhZGQgZW50cnkgbW9kdWxlcyBmcm9tIGxvYWRlZCBjaHVuayB0byBkZWZlcnJlZCBsaXN0XG4gXHRcdGRlZmVycmVkTW9kdWxlcy5wdXNoLmFwcGx5KGRlZmVycmVkTW9kdWxlcywgZXhlY3V0ZU1vZHVsZXMgfHwgW10pO1xuXG4gXHRcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gYWxsIGNodW5rcyByZWFkeVxuIFx0XHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiBcdH07XG4gXHRmdW5jdGlvbiBjaGVja0RlZmVycmVkTW9kdWxlcygpIHtcbiBcdFx0dmFyIHJlc3VsdDtcbiBcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRlZmVycmVkTW9kdWxlcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdHZhciBkZWZlcnJlZE1vZHVsZSA9IGRlZmVycmVkTW9kdWxlc1tpXTtcbiBcdFx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcbiBcdFx0XHRmb3IodmFyIGogPSAxOyBqIDwgZGVmZXJyZWRNb2R1bGUubGVuZ3RoOyBqKyspIHtcbiBcdFx0XHRcdHZhciBkZXBJZCA9IGRlZmVycmVkTW9kdWxlW2pdO1xuIFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2RlcElkXSAhPT0gMCkgZnVsZmlsbGVkID0gZmFsc2U7XG4gXHRcdFx0fVxuIFx0XHRcdGlmKGZ1bGZpbGxlZCkge1xuIFx0XHRcdFx0ZGVmZXJyZWRNb2R1bGVzLnNwbGljZShpLS0sIDEpO1xuIFx0XHRcdFx0cmVzdWx0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBkZWZlcnJlZE1vZHVsZVswXSk7XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcImNvbGxlY3Rpb25fcGxheWVyXCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLXBsYXllci1wYWdlL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UuY29udHJvbGxlci50c1wiLFwiYWJvdXR+YWRtaW5+YXBwfmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmVtYWlsX2Rhc2hib2FyZH5jMWU1MGNjMFwiLFwiY29sbGVjdGlvbl9wbGF5ZXJ+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5sZWFybmVyX2Rhc2hib2FyZH5saWJyYXJ5fn44OGNhYTVkZlwiLFwiY29sbGVjdGlvbl9wbGF5ZXJ+bGVhcm5lcl9kYXNoYm9hcmR+bGlicmFyeX5wcm9maWxlXCIsXCJjb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllclwiXSk7XG4gXHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIHJlYWR5XG4gXHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgdGhlICdlbWJlZCBleHBsb3JhdGlvbicgbW9kYWwuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FbWJlZEJ1dHRvbk1vZHVsZScpLmZhY3RvcnkoJ0V4cGxvcmF0aW9uRW1iZWRCdXR0b25TZXJ2aWNlJywgW1xuICAgICckdWliTW9kYWwnLCAnU2l0ZUFuYWx5dGljc1NlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkdWliTW9kYWwsIFNpdGVBbmFseXRpY3NTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2hvd01vZGFsOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvYnV0dG9uLWRpcmVjdGl2ZXMvZXhwbG9yYXRpb24tZW1iZWQtbW9kYWwvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnZXhwbG9yYXRpb24tZW1iZWQtYnV0dG9uLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uSWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhwbG9yYXRpb25JZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsICckd2luZG93JywgJ2V4cGxvcmF0aW9uSWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UsICR3aW5kb3csIGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25JZCA9IGV4cGxvcmF0aW9uSWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlcnZlck5hbWUgPSAoJHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyAkd2luZG93LmxvY2F0aW9uLmhvc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2xvc2UnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RUZXh0ID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29kZURpdiA9IGV2dC5jdXJyZW50VGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZS5zZXRTdGFydEJlZm9yZShjb2RlRGl2LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZS5zZXRFbmRBZnRlcihjb2RlRGl2Lmxhc3RDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLmFkZFJhbmdlKHJhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgU2l0ZUFuYWx5dGljc1NlcnZpY2UucmVnaXN0ZXJPcGVuRW1iZWRJbmZvRXZlbnQoZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGF0dHJpYnV0aW9uIGd1aWRlLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0Jyb3dzZXJDaGVja2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2F0dHJpYnV0aW9uR3VpZGVNb2R1bGUnKS5kaXJlY3RpdmUoJ2F0dHJpYnV0aW9uR3VpZGUnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9hdHRyaWJ1dGlvbi1ndWlkZS8nICtcbiAgICAgICAgICAgICAgICAnYXR0cmlidXRpb24tZ3VpZGUuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnQnJvd3NlckNoZWNrZXJTZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCBmdW5jdGlvbiAoQnJvd3NlckNoZWNrZXJTZXJ2aWNlLCBVcmxTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc01vYmlsZURldmljZSA9IEJyb3dzZXJDaGVja2VyU2VydmljZS5pc01vYmlsZURldmljZSgpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlmcmFtZWQgPSBVcmxTZXJ2aWNlLmlzSWZyYW1lZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgYmFja2dyb3VuZCBiYW5uZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdiYWNrZ3JvdW5kQmFubmVyTW9kdWxlJykuZGlyZWN0aXZlKCdiYWNrZ3JvdW5kQmFubmVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvJyArXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NzaWJsZUJhbm5lckZpbGVuYW1lcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICdiYW5uZXJBLnN2ZycsICdiYW5uZXJCLnN2ZycsICdiYW5uZXJDLnN2ZycsICdiYW5uZXJELnN2ZydcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhbm5lckltYWdlRmlsZW5hbWUgPSBwb3NzaWJsZUJhbm5lckZpbGVuYW1lc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwb3NzaWJsZUJhbm5lckZpbGVuYW1lcy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5iYW5uZXJJbWFnZUZpbGVVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2JhY2tncm91bmQvJyArIGJhbm5lckltYWdlRmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgU29jaWFsIFNoYXJpbmcgTGlua3MuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvYnV0dG9uLWRpcmVjdGl2ZXMvZXhwbG9yYXRpb24tZW1iZWQtbW9kYWwvJyArXG4gICAgJ2V4cGxvcmF0aW9uLWVtYmVkLWJ1dHRvbi5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnc2hhcmluZ0xpbmtzTW9kdWxlJykuZGlyZWN0aXZlKCdzaGFyaW5nTGlua3MnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGxheW91dFR5cGU6ICdAJyxcbiAgICAgICAgICAgICAgICBsYXlvdXRBbGlnblR5cGU6ICdAJyxcbiAgICAgICAgICAgICAgICBzaGFyZVR5cGU6ICdAJyxcbiAgICAgICAgICAgICAgICBnZXRUd2l0dGVyVGV4dDogJyZ0d2l0dGVyVGV4dCcsXG4gICAgICAgICAgICAgICAgZ2V0RXhwbG9yYXRpb25JZDogJyZleHBsb3JhdGlvbklkJyxcbiAgICAgICAgICAgICAgICBnZXRDb2xsZWN0aW9uSWQ6ICcmY29sbGVjdGlvbklkJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL3NoYXJpbmctbGlua3MvJyArXG4gICAgICAgICAgICAgICAgJ3NoYXJpbmctbGlua3MuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHdpbmRvdycsICdIdG1sRXNjYXBlclNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdFeHBsb3JhdGlvbkVtYmVkQnV0dG9uU2VydmljZScsICdTaXRlQW5hbHl0aWNzU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCR3aW5kb3csIEh0bWxFc2NhcGVyU2VydmljZSwgRXhwbG9yYXRpb25FbWJlZEJ1dHRvblNlcnZpY2UsIFNpdGVBbmFseXRpY3NTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5yZWdpc3RlclNoYXJlRXZlbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5zaGFyZVR5cGUgPT09ICdleHBsb3JhdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZXhwbG9yYXRpb25JZCA9IGN0cmwuZ2V0RXhwbG9yYXRpb25JZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3Rpdml0eVR5cGUgPSAnZXhwbG9yZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2aXR5SWQgPSBjdHJsLmV4cGxvcmF0aW9uSWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnJlZ2lzdGVyU2hhcmVFdmVudCA9IChTaXRlQW5hbHl0aWNzU2VydmljZS5yZWdpc3RlclNoYXJlRXhwbG9yYXRpb25FdmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dFbWJlZEV4cGxvcmF0aW9uTW9kYWwgPSAoRXhwbG9yYXRpb25FbWJlZEJ1dHRvblNlcnZpY2Uuc2hvd01vZGFsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjdHJsLnNoYXJlVHlwZSA9PT0gJ2NvbGxlY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb25JZCA9IGN0cmwuZ2V0Q29sbGVjdGlvbklkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2aXR5VHlwZSA9ICdjb2xsZWN0aW9uJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuYWN0aXZpdHlJZCA9IGN0cmwuY29sbGVjdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5yZWdpc3RlclNoYXJlRXZlbnQgPSAoU2l0ZUFuYWx5dGljc1NlcnZpY2UucmVnaXN0ZXJTaGFyZUNvbGxlY3Rpb25FdmVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignU2hhcmluZ0xpbmtzIGRpcmVjdGl2ZSBjYW4gb25seSBiZSB1c2VkIGVpdGhlciBpbiB0aGUnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY29sbGVjdGlvbiBwbGF5ZXIgb3IgdGhlIGV4cGxvcmF0aW9uIHBsYXllcicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2VydmVyTmFtZSA9ICgkd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArICR3aW5kb3cubG9jYXRpb24uaG9zdCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZXNjYXBlZFR3aXR0ZXJUZXh0ID0gKEh0bWxFc2NhcGVyU2VydmljZS51bmVzY2FwZWRTdHJUb0VzY2FwZWRTdHIoY3RybC5nZXRUd2l0dGVyVGV4dCgpKSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2xhc3Nyb29tVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9nZW5lcmFsL2NsYXNzcm9vbS5wbmcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmRcbiAqIGNvbGxlY3Rpb24gcGxheXRocm91Z2ggZG9tYWluIG9iamVjdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0NvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3RvcnknLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBUT0RPKGJoZW5uaW5nKTogQWRkIHNldHRlcnMgZm9yIHNvbWUgb2YgdGhlc2UgcHJvcGVydGllcy4gU2V0dGVycyBhbGxvd1xuICAgICAgICAvLyB0aGUgY29sbGVjdGlvbiBlZGl0b3IgdG8gc2V0dXAgc3BlY2lmaWNhbGx5IGNvbmZpZ3VyZWQgcGxheXRocm91Z2hcbiAgICAgICAgLy8gc2Vzc2lvbnMgb2YgdGhlIGNvbGxlY3Rpb24gcGxheWVyIHRocm91Z2ggdGhpcyBvYmplY3QgKGZvciBleGFtcGxlLCB0aGVcbiAgICAgICAgLy8gZWRpdG9yIHdvdWxkIGJlIGFibGUgdG8gZmFrZSB3aGljaCBleHBsb3JhdGlvbnMgd2VyZSBjb21wbGV0ZWQgdG8gc2VlIGhvd1xuICAgICAgICAvLyB0aGF0IHBhcnRpY3VsYXIgY29uZmlndXJhdGlvbiB3b3VsZCBsb29rIGZvciBhIGxlYXJuZXIpLlxuICAgICAgICAvLyBTdG9yZXMgaW5mb3JtYXRpb24gYWJvdXQgYSBjdXJyZW50IHBsYXl0aHJvdWdoIG9mIGEgY29sbGVjdGlvbiBmb3IgYVxuICAgICAgICAvLyB1c2VyLlxuICAgICAgICB2YXIgQ29sbGVjdGlvblBsYXl0aHJvdWdoID0gZnVuY3Rpb24gKG5leHRFeHBsb3JhdGlvbklkLCBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcykge1xuICAgICAgICAgICAgdGhpcy5fbmV4dEV4cGxvcmF0aW9uSWQgPSBuZXh0RXhwbG9yYXRpb25JZDtcbiAgICAgICAgICAgIHRoaXMuX2NvbXBsZXRlZEV4cGxvcmF0aW9uSWRzID0gY29tcGxldGVkRXhwbG9yYXRpb25JZHM7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgdGhlIHVwY29taW5nIGV4cGxvcmF0aW9uIElELiBDaGFuZ2VzIHRvIHRoaXMgYXJlIG5vdFxuICAgICAgICAvLyByZWZsZWN0ZWQgaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgICAgIENvbGxlY3Rpb25QbGF5dGhyb3VnaC5wcm90b3R5cGUuZ2V0TmV4dEV4cGxvcmF0aW9uSWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmV4dEV4cGxvcmF0aW9uSWQ7XG4gICAgICAgIH07XG4gICAgICAgIENvbGxlY3Rpb25QbGF5dGhyb3VnaC5wcm90b3R5cGUuZ2V0TmV4dFJlY29tbWVuZGVkQ29sbGVjdGlvbk5vZGVDb3VudCA9XG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gQXMgdGhlIGNvbGxlY3Rpb24gaXMgbGluZWFyLCBvbmx5IGEgc2luZ2xlIG5vZGUgd291bGQgYmUgYXZhaWxhYmxlLFxuICAgICAgICAgICAgICAgIC8vIGFmdGVyIGFueSBub2RlLlxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQ29sbGVjdGlvblBsYXl0aHJvdWdoWydoYXNGaW5pc2hlZENvbGxlY3Rpb24nXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmV4dEV4cGxvcmF0aW9uSWQgPT09IG51bGw7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgYSBsaXN0IG9mIGV4cGxvcmF0aW9ucyBjb21wbGV0ZWQgdGhhdCBhcmUgcmVsYXRlZCB0byB0aGlzXG4gICAgICAgIC8vIGNvbGxlY3Rpb24uIENoYW5nZXMgdG8gdGhpcyBsaXN0IGFyZSBub3QgcmVmbGVjdGVkIGluIHRoaXMgY29sbGVjdGlvbi5cbiAgICAgICAgQ29sbGVjdGlvblBsYXl0aHJvdWdoLnByb3RvdHlwZS5nZXRDb21wbGV0ZWRFeHBsb3JhdGlvbklkcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkodGhpcy5fY29tcGxldGVkRXhwbG9yYXRpb25JZHMpO1xuICAgICAgICB9O1xuICAgICAgICBDb2xsZWN0aW9uUGxheXRocm91Z2gucHJvdG90eXBlLmdldENvbXBsZXRlZEV4cGxvcmF0aW9uTm9kZUNvdW50ID1cbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY29tcGxldGVkRXhwbG9yYXRpb25JZHMubGVuZ3RoO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgQ29sbGVjdGlvblBsYXl0aHJvdWdoLnByb3RvdHlwZS5oYXNTdGFydGVkQ29sbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb21wbGV0ZWRFeHBsb3JhdGlvbklkcy5sZW5ndGggIT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFN0YXRpYyBjbGFzcyBtZXRob2RzLiBOb3RlIHRoYXQgXCJ0aGlzXCIgaXMgbm90IGF2YWlsYWJsZSBpbiBzdGF0aWNcbiAgICAgICAgLy8gY29udGV4dHMuIFRoaXMgZnVuY3Rpb24gdGFrZXMgYSBKU09OIG9iamVjdCB3aGljaCByZXByZXNlbnRzIGEgYmFja2VuZFxuICAgICAgICAvLyBjb2xsZWN0aW9uIHBsYXl0aHJvdWdoIHB5dGhvbiBkaWN0LlxuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBDb2xsZWN0aW9uUGxheXRocm91Z2hbJ2NyZWF0ZUZyb21CYWNrZW5kT2JqZWN0J10gPSBmdW5jdGlvbiAoXG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIGNvbGxlY3Rpb25QbGF5dGhyb3VnaEJhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29sbGVjdGlvblBsYXl0aHJvdWdoKGNvbGxlY3Rpb25QbGF5dGhyb3VnaEJhY2tlbmRPYmplY3QubmV4dF9leHBsb3JhdGlvbl9pZCwgY29sbGVjdGlvblBsYXl0aHJvdWdoQmFja2VuZE9iamVjdC5jb21wbGV0ZWRfZXhwbG9yYXRpb25faWRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQ29sbGVjdGlvblBsYXl0aHJvdWdoWydjcmVhdGUnXSA9IGZ1bmN0aW9uIChcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgbmV4dEV4cGxvcmF0aW9uSWQsIGNvbXBsZXRlZEV4cGxvcmF0aW9uSWRzKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbGxlY3Rpb25QbGF5dGhyb3VnaChuZXh0RXhwbG9yYXRpb25JZCwgYW5ndWxhci5jb3B5KGNvbXBsZXRlZEV4cGxvcmF0aW9uSWRzKSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBDb2xsZWN0aW9uUGxheXRocm91Z2g7XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBhbmQgbXV0YXRpbmcgYSBkb21haW4gb2JqZWN0IHdoaWNoXG4gKiByZXByZXNlbnRzIHRoZSBwcm9ncmVzcyBvZiBhIGd1ZXN0IHBsYXlpbmcgdGhyb3VnaCBhIGNvbGxlY3Rpb24uXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0d1ZXN0Q29sbGVjdGlvblByb2dyZXNzT2JqZWN0RmFjdG9yeScsIFtcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzcyA9IGZ1bmN0aW9uIChjb21wbGV0ZWRFeHBsb3JhdGlvbnNNYXApIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbXBsZXRlZEV4cGxvcmF0aW9uc01hcCA9IGNvbXBsZXRlZEV4cGxvcmF0aW9uc01hcDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gSW5zdGFuY2UgbWV0aG9kc1xuICAgICAgICAvLyBSZXR1cm5zIHdoZXRoZXIgdGhlIGd1ZXN0IGhhcyBtYWRlIGFueSBwcm9ncmVzcyB0b3dhcmRzIGNvbXBsZXRpbmcgdGhlXG4gICAgICAgIC8vIHNwZWNpZmllZCBjb2xsZWN0aW9uIElELiBOb3RlIHRoYXQgdGhpcyBkb2VzIG5vdCBhY2NvdW50IGZvciB3aGV0aGVyIHRoZVxuICAgICAgICAvLyBjb21wbGV0ZWQgZXhwbG9yYXRpb25zIGFyZSBzdGlsbCBjb250YWluZWQgd2l0aGluIHRoYXQgY29sbGVjdGlvbi5cbiAgICAgICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MucHJvdG90eXBlLmhhc0NvbXBsZXRpb25Qcm9ncmVzcyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb21wbGV0ZWRFeHBsb3JhdGlvbnNNYXAuaGFzT3duUHJvcGVydHkoY29sbGVjdGlvbklkKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBleHBsb3JhdGlvbiBJRHMgd2hpY2ggaGF2ZSBiZWVuIGNvbXBsZXRlZCBieSB0aGVcbiAgICAgICAgLy8gc3BlY2lmaWVkIGNvbGxlY3Rpb24gSUQsIG9yIGVtcHR5IGlmIG5vbmUgaGF2ZS5cbiAgICAgICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MucHJvdG90eXBlLmdldENvbXBsZXRlZEV4cGxvcmF0aW9uSWRzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmhhc0NvbXBsZXRpb25Qcm9ncmVzcyhjb2xsZWN0aW9uSWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weSh0aGlzLl9jb21wbGV0ZWRFeHBsb3JhdGlvbnNNYXBbY29sbGVjdGlvbklkXSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFNwZWNpZmllcyB0aGF0IGEgc3BlY2lmaWMgZXhwbG9yYXRpb24gSUQgaGFzIGJlZW4gY29tcGxldGVkIGluIHRoZVxuICAgICAgICAvLyBjb250ZXh0IG9mIHRoZSBzcGVjaWZpZWQgY29sbGVjdGlvbi4gUmV0dXJucyB3aGV0aGVyIHRoYXQgZXhwbG9yYXRpb24gSURcbiAgICAgICAgLy8gd2FzIG5vdCBwcmV2aW91c2x5IHJlZ2lzdGVyZWQgYXMgY29tcGxldGVkIGZvciB0aGUgY29sbGVjdGlvbi5cbiAgICAgICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MucHJvdG90eXBlLmFkZENvbXBsZXRlZEV4cGxvcmF0aW9uSWQgPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkLCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICB2YXIgY29tcGxldGVkRXhwbG9yYXRpb25JZHMgPSB0aGlzLmdldENvbXBsZXRlZEV4cGxvcmF0aW9uSWRzKGNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICBpZiAoY29tcGxldGVkRXhwbG9yYXRpb25JZHMuaW5kZXhPZihleHBsb3JhdGlvbklkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcy5wdXNoKGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBsZXRlZEV4cGxvcmF0aW9uc01hcFtjb2xsZWN0aW9uSWRdID0gY29tcGxldGVkRXhwbG9yYXRpb25JZHM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIC8vIENvbnZlcnRzIHRoaXMgb2JqZWN0IHRvIEpTT04gZm9yIHN0b3JhZ2UuXG4gICAgICAgIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzLnByb3RvdHlwZS50b0pzb24gPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkLCBleHBsb3JhdGlvbklkcykge1xuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMuX2NvbXBsZXRlZEV4cGxvcmF0aW9uc01hcCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFN0YXRpYyBjbGFzcyBtZXRob2RzLiBOb3RlIHRoYXQgXCJ0aGlzXCIgaXMgbm90IGF2YWlsYWJsZSBpbiBzdGF0aWNcbiAgICAgICAgLy8gY29udGV4dHMuXG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gdGFrZXMgYSBKU09OIHN0cmluZyB3aGljaCByZXByZXNlbnRzIGEgcmF3IGNvbGxlY3Rpb25cbiAgICAgICAgLy8gb2JqZWN0IGFuZCByZXR1cm5zIGEgbmV3IEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzIGRvbWFpbiBvYmplY3QuIEEgbnVsbCBvclxuICAgICAgICAvLyB1bmRlZmluZWQgc3RyaW5nIGluZGljYXRlcyB0aGF0IGFuIGVtcHR5IHByb2dyZXNzIG9iamVjdCBzaG91bGQgYmVcbiAgICAgICAgLy8gY3JlYXRlZC5cbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NbJ2NyZWF0ZUZyb21Kc29uJ10gPSBmdW5jdGlvbiAoXG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIGNvbGxlY3Rpb25Qcm9ncmVzc0pzb24pIHtcbiAgICAgICAgICAgIGlmIChjb2xsZWN0aW9uUHJvZ3Jlc3NKc29uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzcyhKU09OLnBhcnNlKGNvbGxlY3Rpb25Qcm9ncmVzc0pzb24pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3Moe30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3M7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdGhhdCByZWNvcmRzIHByb2dyZXNzIGd1ZXN0cyBtYWtlIGR1cmluZyBhIGNvbGxlY3Rpb25cbiAqIHBsYXl0aHJvdWdoLiBOb3RlIHRoYXQgdGhpcyBzZXJ2aWNlIGRvZXMgbm90IGN1cnJlbnRseSBzdXBwb3J0IHNhdmluZyBhXG4gKiB1c2VyJ3MgcHJvZ3Jlc3Mgd2hlbiB0aGV5IGNyZWF0ZSBhbiBhY2NvdW50LlxuICovXG4vLyBUT0RPKGJoZW5uaW5nKTogTW92ZSB0aGlzIHRvIGEgc2VydmljZSB3aGljaCBzdG9yZXMgc2hhcmVkIHN0YXRlIGFjcm9zcyB0aGVcbi8vIGZyb250ZW5kIGluIGEgd2F5IHRoYXQgY2FuIGJlIHBlcnNpc3RlZCBpbiB0aGUgYmFja2VuZCB1cG9uIGFjY291bnRcbi8vIGNyZWF0aW9uLCBzdWNoIGFzIGV4cGxvcmF0aW9uIHByb2dyZXNzLlxuLy8gVE9ETyhiaGVubmluZyk6IFRoaXMgc2hvdWxkIGJlIHJlc2V0IHVwb24gbG9naW4sIG90aGVyd2lzZSB0aGUgcHJvZ3Jlc3Mgd2lsbFxuLy8gYmUgZGlmZmVyZW50IGRlcGVuZGluZyBvbiB0aGUgdXNlcidzIGxvZ2dlZCBpbi9sb2dnZWQgb3V0IHN0YXRlLlxucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NPYmplY3RGYWN0b3J5LnRzJyk7XG5vcHBpYS5mYWN0b3J5KCdHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2UnLCBbXG4gICAgJyR3aW5kb3cnLCAnR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NPYmplY3RGYWN0b3J5JyxcbiAgICBmdW5jdGlvbiAoJHdpbmRvdywgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHZhciBDT0xMRUNUSU9OX1NUT1JBR0VfS0VZID0gJ2NvbGxlY3Rpb25Qcm9ncmVzc1N0b3JlX3YxJztcbiAgICAgICAgdmFyIHN0b3JlR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZ3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICR3aW5kb3cubG9jYWxTdG9yYWdlW0NPTExFQ1RJT05fU1RPUkFHRV9LRVldID0gKGd1ZXN0Q29sbGVjdGlvblByb2dyZXNzLnRvSnNvbigpKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGxvYWRHdWVzdENvbGxlY3Rpb25Qcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc09iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUpzb24oJHdpbmRvdy5sb2NhbFN0b3JhZ2VbQ09MTEVDVElPTl9TVE9SQUdFX0tFWV0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVjb3JkQ29tcGxldGVkRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkLCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICB2YXIgZ3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MgPSBsb2FkR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MoKTtcbiAgICAgICAgICAgIHZhciBjb21wbGV0ZWRFeHBsb3JhdGlvbklkSGFzQmVlbkFkZGVkID0gKGd1ZXN0Q29sbGVjdGlvblByb2dyZXNzLmFkZENvbXBsZXRlZEV4cGxvcmF0aW9uSWQoY29sbGVjdGlvbklkLCBleHBsb3JhdGlvbklkKSk7XG4gICAgICAgICAgICBpZiAoY29tcGxldGVkRXhwbG9yYXRpb25JZEhhc0JlZW5BZGRlZCkge1xuICAgICAgICAgICAgICAgIHN0b3JlR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MoZ3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgZ2V0VmFsaWRDb21wbGV0ZWRFeHBsb3JhdGlvbklkcyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB2YXIgY29sbGVjdGlvbklkID0gY29sbGVjdGlvbi5nZXRJZCgpO1xuICAgICAgICAgICAgdmFyIGd1ZXN0Q29sbGVjdGlvblByb2dyZXNzID0gbG9hZEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzKCk7XG4gICAgICAgICAgICB2YXIgY29tcGxldGVkRXhwbG9yYXRpb25JZHMgPSAoZ3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MuZ2V0Q29tcGxldGVkRXhwbG9yYXRpb25JZHMoY29sbGVjdGlvbklkKSk7XG4gICAgICAgICAgICAvLyBGaWx0ZXIgdGhlIGV4cGxvcmF0aW9uIElEcyBieSB3aGV0aGVyIHRoZXkgYXJlIGNvbnRhaW5lZCB3aXRoaW4gdGhlXG4gICAgICAgICAgICAvLyBzcGVjaWZpZWQgY29sbGVjdGlvbiBzdHJ1Y3R1cmUuXG4gICAgICAgICAgICByZXR1cm4gY29tcGxldGVkRXhwbG9yYXRpb25JZHMuZmlsdGVyKGZ1bmN0aW9uIChleHBJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uLmNvbnRhaW5zQ29sbGVjdGlvbk5vZGUoZXhwSWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRoaXMgbWV0aG9kIGNvcnJlc3BvbmRzIHRvIGNvbGxlY3Rpb25fZG9tYWluLmdldF9uZXh0X2V4cGxvcmF0aW9uX2lkLlxuICAgICAgICB2YXIgX2dldE5leHRFeHBsb3JhdGlvbklkID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvbXBsZXRlZElkcykge1xuICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWRzID0gY29sbGVjdGlvbi5nZXRFeHBsb3JhdGlvbklkcygpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHBsb3JhdGlvbklkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChjb21wbGV0ZWRJZHMuaW5kZXhPZihleHBsb3JhdGlvbklkc1tpXSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleHBsb3JhdGlvbklkc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVjb3JkcyB0aGF0IHRoZSBzcGVjaWZpZWQgZXhwbG9yYXRpb24gd2FzIGNvbXBsZXRlZCBpbiB0aGUgY29udGV4dCBvZlxuICAgICAgICAgICAgICogdGhlIHNwZWNpZmllZCBjb2xsZWN0aW9uLCBhcyBhIGd1ZXN0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZWNvcmRFeHBsb3JhdGlvbkNvbXBsZXRlZEluQ29sbGVjdGlvbjogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIHJlY29yZENvbXBsZXRlZEV4cGxvcmF0aW9uKGNvbGxlY3Rpb25JZCwgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGd1ZXN0IHVzZXIgaGFzIG1hZGUgYW55IHByb2dyZXNzIHRvd2FyZCBjb21wbGV0aW5nXG4gICAgICAgICAgICAgKiB0aGUgc3BlY2lmaWVkIGNvbGxlY3Rpb24gYnkgY29tcGxldGluZyBhdCBsZWFzdCBvbmUgZXhwbG9yYXRpb24gcmVsYXRlZFxuICAgICAgICAgICAgICogdG8gdGhlIGNvbGxlY3Rpb24uIE5vdGUgdGhhdCB0aGlzIGRvZXMgbm90IGFjY291bnQgZm9yIGFueSBjb21wbGV0ZWRcbiAgICAgICAgICAgICAqIGV4cGxvcmF0aW9ucyB3aGljaCBhcmUgbm8gbG9uZ2VyIHJlZmVyZW5jZWQgYnkgdGhlIGNvbGxlY3Rpb247XG4gICAgICAgICAgICAgKiBnZXRDb21wbGV0ZWRFeHBsb3JhdGlvbklkcygpIHNob3VsZCBiZSB1c2VkIGZvciB0aGF0LCBpbnN0ZWFkLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBoYXNDb21wbGV0ZWRTb21lRXhwbG9yYXRpb246IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZ3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MgPSBsb2FkR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MuaGFzQ29tcGxldGlvblByb2dyZXNzKGNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHaXZlbiBhIGNvbGxlY3Rpb24gb2JqZWN0LCByZXR1cm5zIHRoZSBsaXN0IG9mIGV4cGxvcmF0aW9uIElEc1xuICAgICAgICAgICAgICogY29tcGxldGVkIGJ5IHRoZSBndWVzdCB1c2VyLiBUaGUgcmV0dXJuIGxpc3Qgb2YgZXhwbG9yYXRpb24gSURzIHdpbGxcbiAgICAgICAgICAgICAqIG5vdCBpbmNsdWRlIGFueSBwcmV2aW91c2x5IGNvbXBsZXRlZCBleHBsb3JhdGlvbnMgZm9yIHRoZSBnaXZlblxuICAgICAgICAgICAgICogY29sbGVjdGlvbiB0aGF0IGFyZSBubyBsb25nZXIgcGFydCBvZiB0aGUgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0Q29tcGxldGVkRXhwbG9yYXRpb25JZHM6IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFZhbGlkQ29tcGxldGVkRXhwbG9yYXRpb25JZHMoY29sbGVjdGlvbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHaXZlbiBhIGNvbGxlY3Rpb24gb2JqZWN0IGEgbGlzdCBvZiBjb21wbGV0ZWQgZXhwbG9yYXRpb24gSURzLCByZXR1cm5zXG4gICAgICAgICAgICAgKiB0aGUgbmV4dCBleHBsb3JhdGlvbiBJRCB0aGUgZ3Vlc3QgdXNlciBjYW4gcGxheSBhcyBwYXJ0IG9mXG4gICAgICAgICAgICAgKiBjb21wbGV0aW5nIHRoZSBjb2xsZWN0aW9uLiBJZiB0aGlzIG1ldGhvZCByZXR1cm5zIG51bGwsIHRoZVxuICAgICAgICAgICAgICogZ3Vlc3QgaGFzIGNvbXBsZXRlZCB0aGUgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0TmV4dEV4cGxvcmF0aW9uSWQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfZ2V0TmV4dEV4cGxvcmF0aW9uSWQoY29sbGVjdGlvbiwgY29tcGxldGVkRXhwbG9yYXRpb25JZHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBVdGlsaXR5IHNlcnZpY2UgZm9yIGNoZWNraW5nIHdlYiBicm93c2VyIHR5cGUuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0Jyb3dzZXJDaGVja2VyU2VydmljZScsIFtcbiAgICAnQVVUT0dFTkVSQVRFRF9BVURJT19MQU5HVUFHRVMnLFxuICAgIGZ1bmN0aW9uIChBVVRPR0VORVJBVEVEX0FVRElPX0xBTkdVQUdFUykge1xuICAgICAgICAvLyBGb3IgZGV0YWlscyBvbiB0aGUgcmVsaWFiaWxpdHkgb2YgdGhpcyBjaGVjaywgc2VlXG4gICAgICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzk4NDc1ODAvXG4gICAgICAgIC8vIGhvdy10by1kZXRlY3Qtc2FmYXJpLWNocm9tZS1pZS1maXJlZm94LWFuZC1vcGVyYS1icm93c2VyI2Fuc3dlci05ODUxNzY5XG4gICAgICAgIHZhciBpc1NhZmFyaSA9IC9jb25zdHJ1Y3Rvci9pLnRlc3Qod2luZG93LkhUTUxFbGVtZW50KSB8fCAoZnVuY3Rpb24gKHApIHtcbiAgICAgICAgICAgIHJldHVybiBwLnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IFNhZmFyaVJlbW90ZU5vdGlmaWNhdGlvbl0nO1xuICAgICAgICB9KSghd2luZG93LnNhZmFyaSB8fFxuICAgICAgICAgICAgKHR5cGVvZiB3aW5kb3cuc2FmYXJpICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuc2FmYXJpLnB1c2hOb3RpZmljYXRpb24pKTtcbiAgICAgICAgdmFyIF9zdXBwb3J0c1NwZWVjaFN5bnRoZXNpcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzdXBwb3J0TGFuZyA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5oYXNPd25Qcm9wZXJ0eSgnc3BlZWNoU3ludGhlc2lzJykpIHtcbiAgICAgICAgICAgICAgICBzcGVlY2hTeW50aGVzaXMuZ2V0Vm9pY2VzKCkuZm9yRWFjaChmdW5jdGlvbiAodm9pY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgQVVUT0dFTkVSQVRFRF9BVURJT19MQU5HVUFHRVMuZm9yRWFjaChmdW5jdGlvbiAoYXVkaW9MYW5ndWFnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZvaWNlLmxhbmcgPT09IGF1ZGlvTGFuZ3VhZ2Uuc3BlZWNoX3N5bnRoZXNpc19jb2RlIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKF9pc01vYmlsZURldmljZSgpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZvaWNlLmxhbmcgPT09IGF1ZGlvTGFuZ3VhZ2Uuc3BlZWNoX3N5bnRoZXNpc19jb2RlX21vYmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdXBwb3J0TGFuZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN1cHBvcnRMYW5nO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2lzTW9iaWxlRGV2aWNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQgfHwgbmF2aWdhdG9yLnZlbmRvciB8fCB3aW5kb3cub3BlcmE7XG4gICAgICAgICAgICByZXR1cm4gdXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHwgdXNlckFnZW50Lm1hdGNoKC9BbmRyb2lkL2kpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VwcG9ydHNTcGVlY2hTeW50aGVzaXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3N1cHBvcnRzU3BlZWNoU3ludGhlc2lzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNNb2JpbGVEZXZpY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2lzTW9iaWxlRGV2aWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnZlcnRUb1BsYWluVGV4dCBmaWx0ZXIgZm9yIE9wcGlhLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3RyaW5nVXRpbGl0eUZpbHRlcnNNb2R1bGUnKS5maWx0ZXIoJ2NvbnZlcnRUb1BsYWluVGV4dCcsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciBzdHJpcHBlZFRleHQgPSBpbnB1dC5yZXBsYWNlKC8oPChbXj5dKyk+KS9pZywgJycpO1xuICAgICAgICAgICAgc3RyaXBwZWRUZXh0ID0gc3RyaXBwZWRUZXh0LnJlcGxhY2UoLyZuYnNwOy9pZywgJyAnKTtcbiAgICAgICAgICAgIHN0cmlwcGVkVGV4dCA9IHN0cmlwcGVkVGV4dC5yZXBsYWNlKC8mcXVvdDsvaWcsICcnKTtcbiAgICAgICAgICAgIHZhciB0cmltbWVkVGV4dCA9IHN0cmlwcGVkVGV4dC50cmltKCk7XG4gICAgICAgICAgICBpZiAodHJpbW1lZFRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0cmlwcGVkVGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cmltbWVkVGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBzaG93aW5nIGF1dGhvci9zaGFyZSBmb290ZXJcbiAqIGluIGNvbGxlY3Rpb24gcGxheWVyLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9zaGFyaW5nLWxpbmtzLycgK1xuICAgICdzaGFyaW5nLWxpbmtzLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2NvbGxlY3Rpb25Gb290ZXJNb2R1bGUnKS5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25Gb290ZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICB0d2l0dGVyVGV4dDogJ0AnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLWZvb3Rlci8nICtcbiAgICAgICAgICAgICAgICAnY29sbGVjdGlvbi1mb290ZXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uSWQgPSBHTE9CQUxTLmNvbGxlY3Rpb25JZDtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldFN0YXRpY0ltYWdlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmw7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRUd2l0dGVyVGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkc2NvcGUudHdpdHRlclRleHQ7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVyIGZvciB0aGUgbG9jYWwgbmF2aWdhdGlvbiBpbiB0aGUgY29sbGVjdGlvbiB2aWV3LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnY29sbGVjdGlvbkxvY2FsTmF2TW9kdWxlJykuY29udHJvbGxlcignQ29sbGVjdGlvbkxvY2FsTmF2JywgWyckc2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICRzY29wZS5jYW5FZGl0ID0gR0xPQkFMUy5jYW5FZGl0O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBjcmVhdGluZyBhIGxpc3Qgb2YgY29sbGVjdGlvbiBub2RlcyB3aGljaCBsaW5rIHRvXG4gKiBwbGF5aW5nIHRoZSBleHBsb3JhdGlvbiBpbiBlYWNoIG5vZGUuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdjb2xsZWN0aW9uTm9kZUxpc3RNb2R1bGUnKS5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25Ob2RlTGlzdCcsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGdldENvbGxlY3Rpb25JZDogJyZjb2xsZWN0aW9uSWQnLFxuICAgICAgICAgICAgICAgIGdldENvbGxlY3Rpb25Ob2RlczogJyZjb2xsZWN0aW9uTm9kZXMnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLW5vZGUtbGlzdC8nICtcbiAgICAgICAgICAgICAgICAnY29sbGVjdGlvbi1ub2RlLWxpc3QuZGlyZWN0aXZlLmh0bWwnKVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVyIGZvciB0aGUgbGVhcm5lcidzIHZpZXcgb2YgYSBjb2xsZWN0aW9uLlxuICovXG4vLyBUT0RPKHZvanRlY2hqZWxpbmVrKTogdGhpcyBibG9jayBvZiByZXF1aXJlcyBzaG91bGQgYmUgcmVtb3ZlZCBhZnRlciB3ZVxuLy8gaW50cm9kdWNlIHdlYnBhY2sgZm9yIC9leHRlbnNpb25zXG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLXBsYXllci1wYWdlL2NvbGxlY3Rpb24tbm9kZS1saXN0LycgK1xuICAgICdjb2xsZWN0aW9uLW5vZGUtbGlzdC5kaXJlY3RpdmUudHMnKTtcbi8vIF5eXiB0aGlzIGJsb2NrIG9mIHJlcXVpcmVzIHNob3VsZCBiZSByZW1vdmVkIF5eXlxucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYXR0cmlidXRpb24tZ3VpZGUvJyArXG4gICAgJ2F0dHJpYnV0aW9uLWd1aWRlLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvJyArXG4gICAgJ2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUtZGlyZWN0aXZlcy9leHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUvJyArXG4gICAgJ2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UvY29sbGVjdGlvbi1mb290ZXIvJyArXG4gICAgJ2NvbGxlY3Rpb24tZm9vdGVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLWxvY2FsLW5hdi8nICtcbiAgICAnY29sbGVjdGlvbi1sb2NhbC1uYXYuY29udHJvbGxlci50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvbk9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0d1ZXN0Q29sbGVjdGlvblByb2dyZXNzU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vUmVhZE9ubHlDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdjb2xsZWN0aW9uUGxheWVyUGFnZU1vZHVsZScpLmNvbnN0YW50KCdDT0xMRUNUSU9OX0RBVEFfVVJMX1RFTVBMQVRFJywgJy9jb2xsZWN0aW9uX2hhbmRsZXIvZGF0YS88Y29sbGVjdGlvbl9pZD4nKTtcbmFuZ3VsYXIubW9kdWxlKCdjb2xsZWN0aW9uUGxheWVyUGFnZU1vZHVsZScpLmNvbnRyb2xsZXIoJ0NvbGxlY3Rpb25QbGF5ZXInLCBbXG4gICAgJyRhbmNob3JTY3JvbGwnLCAnJGh0dHAnLCAnJGxvY2F0aW9uJywgJyRzY29wZScsXG4gICAgJ0FsZXJ0c1NlcnZpY2UnLCAnQ29sbGVjdGlvbk9iamVjdEZhY3RvcnknLFxuICAgICdDb2xsZWN0aW9uUGxheXRocm91Z2hPYmplY3RGYWN0b3J5JywgJ0d1ZXN0Q29sbGVjdGlvblByb2dyZXNzU2VydmljZScsXG4gICAgJ1JlYWRPbmx5Q29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAnV0hJVEVMSVNURURfQ09MTEVDVElPTl9JRFNfRk9SX1NBVklOR19HVUVTVF9QUk9HUkVTUycsXG4gICAgZnVuY3Rpb24gKCRhbmNob3JTY3JvbGwsICRodHRwLCAkbG9jYXRpb24sICRzY29wZSwgQWxlcnRzU2VydmljZSwgQ29sbGVjdGlvbk9iamVjdEZhY3RvcnksIENvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3RvcnksIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzU2VydmljZSwgUmVhZE9ubHlDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBXSElURUxJU1RFRF9DT0xMRUNUSU9OX0lEU19GT1JfU0FWSU5HX0dVRVNUX1BST0dSRVNTKSB7XG4gICAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gbnVsbDtcbiAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb25QbGF5dGhyb3VnaCA9IG51bGw7XG4gICAgICAgICRzY29wZS5jb2xsZWN0aW9uSWQgPSBHTE9CQUxTLmNvbGxlY3Rpb25JZDtcbiAgICAgICAgJHNjb3BlLmlzTG9nZ2VkSW4gPSBHTE9CQUxTLmlzTG9nZ2VkSW47XG4gICAgICAgICRzY29wZS5leHBsb3JhdGlvbkNhcmRJc1Nob3duID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5nZXRTdGF0aWNJbWFnZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsO1xuICAgICAgICAvLyBUaGUgcGF0aEljb25QYXJhbWV0ZXJzIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGNvLW9yZGluYXRlcyxcbiAgICAgICAgLy8gYmFja2dyb3VuZCBjb2xvciBhbmQgaWNvbiB1cmwgZm9yIHRoZSBpY29ucyBnZW5lcmF0ZWQgb24gdGhlIHBhdGguXG4gICAgICAgICRzY29wZS5wYXRoSWNvblBhcmFtZXRlcnMgPSBbXTtcbiAgICAgICAgJHNjb3BlLmFjdGl2ZUhpZ2hsaWdodGVkSWNvbkluZGV4ID0gLTE7XG4gICAgICAgICRzY29wZS5NSU5fSEVJR0hUX0ZPUl9QQVRIX1NWR19QWCA9IDIyMDtcbiAgICAgICAgJHNjb3BlLk9ERF9TVkdfSEVJR0hUX09GRlNFVF9QWCA9IDE1MDtcbiAgICAgICAgJHNjb3BlLkVWRU5fU1ZHX0hFSUdIVF9PRkZTRVRfUFggPSAyODA7XG4gICAgICAgICRzY29wZS5JQ09OX1lfSU5JVElBTF9QWCA9IDM1O1xuICAgICAgICAkc2NvcGUuSUNPTl9ZX0lOQ1JFTUVOVF9QWCA9IDExMDtcbiAgICAgICAgJHNjb3BlLklDT05fWF9NSURETEVfUFggPSAyMjU7XG4gICAgICAgICRzY29wZS5JQ09OX1hfTEVGVF9QWCA9IDU1O1xuICAgICAgICAkc2NvcGUuSUNPTl9YX1JJR0hUX1BYID0gMzk1O1xuICAgICAgICAkc2NvcGUuc3ZnSGVpZ2h0ID0gJHNjb3BlLk1JTl9IRUlHSFRfRk9SX1BBVEhfU1ZHX1BYO1xuICAgICAgICAkc2NvcGUubmV4dEV4cGxvcmF0aW9uSWQgPSBudWxsO1xuICAgICAgICAkc2NvcGUud2hpdGVsaXN0ZWRDb2xsZWN0aW9uSWRzRm9yR3Vlc3RQcm9ncmVzcyA9IChXSElURUxJU1RFRF9DT0xMRUNUSU9OX0lEU19GT1JfU0FWSU5HX0dVRVNUX1BST0dSRVNTKTtcbiAgICAgICAgJGFuY2hvclNjcm9sbC55T2Zmc2V0ID0gLTgwO1xuICAgICAgICAkc2NvcGUuc2V0SWNvbkhpZ2hsaWdodCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgJHNjb3BlLmFjdGl2ZUhpZ2hsaWdodGVkSWNvbkluZGV4ID0gaW5kZXg7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS51bnNldEljb25IaWdobGlnaHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuYWN0aXZlSGlnaGxpZ2h0ZWRJY29uSW5kZXggPSAtMTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnRvZ2dsZVByZXZpZXdDYXJkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmV4cGxvcmF0aW9uQ2FyZElzU2hvd24gPSAhJHNjb3BlLmV4cGxvcmF0aW9uQ2FyZElzU2hvd247XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5nZXRDb2xsZWN0aW9uTm9kZUZvckV4cGxvcmF0aW9uSWQgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25Ob2RlID0gKCRzY29wZS5jb2xsZWN0aW9uLmdldENvbGxlY3Rpb25Ob2RlQnlFeHBsb3JhdGlvbklkKGV4cGxvcmF0aW9uSWQpKTtcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbk5vZGUpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1RoZXJlIHdhcyBhbiBlcnJvciBsb2FkaW5nIHRoZSBjb2xsZWN0aW9uLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25Ob2RlO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuZ2V0TmV4dFJlY29tbWVuZGVkQ29sbGVjdGlvbk5vZGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5nZXRDb2xsZWN0aW9uTm9kZUZvckV4cGxvcmF0aW9uSWQoJHNjb3BlLmNvbGxlY3Rpb25QbGF5dGhyb3VnaC5nZXROZXh0RXhwbG9yYXRpb25JZCgpKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmdldENvbXBsZXRlZEV4cGxvcmF0aW9uTm9kZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmdldENvbGxlY3Rpb25Ob2RlRm9yRXhwbG9yYXRpb25JZCgkc2NvcGUuY29sbGVjdGlvblBsYXl0aHJvdWdoLmdldENvbXBsZXRlZEV4cGxvcmF0aW9uSWRzKCkpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuZ2V0Tm9uUmVjb21tZW5kZWRDb2xsZWN0aW9uTm9kZUNvdW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5jb2xsZWN0aW9uLmdldENvbGxlY3Rpb25Ob2RlQ291bnQoKSAtICgkc2NvcGUuY29sbGVjdGlvblBsYXl0aHJvdWdoLmdldE5leHRSZWNvbW1lbmRlZENvbGxlY3Rpb25Ob2RlQ291bnQoKSArXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb25QbGF5dGhyb3VnaC5nZXRDb21wbGV0ZWRFeHBsb3JhdGlvbk5vZGVDb3VudCgpKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZUV4cGxvcmF0aW9uUHJldmlldyA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25DYXJkSXNTaG93biA9IHRydWU7XG4gICAgICAgICAgICAkc2NvcGUuY3VycmVudEV4cGxvcmF0aW9uSWQgPSBleHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgJHNjb3BlLnN1bW1hcnlUb1ByZXZpZXcgPSAkc2NvcGUuZ2V0Q29sbGVjdGlvbk5vZGVGb3JFeHBsb3JhdGlvbklkKGV4cGxvcmF0aW9uSWQpLmdldEV4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCgpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBDYWxjdWxhdGVzIHRoZSBTVkcgcGFyYW1ldGVycyByZXF1aXJlZCB0byBkcmF3IHRoZSBjdXJ2ZWQgcGF0aC5cbiAgICAgICAgJHNjb3BlLmdlbmVyYXRlUGF0aFBhcmFtZXRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBUaGUgcGF0aFN2Z1BhcmFtZXRlcnMgcmVwcmVzZW50cyB0aGUgZmluYWwgc3RyaW5nIG9mIFNWRyBwYXJhbWV0ZXJzXG4gICAgICAgICAgICAvLyBmb3IgdGhlIGJlemllciBjdXJ2ZSB0byBiZSBnZW5lcmF0ZWQuIFRoZSBkZWZhdWx0IHBhcmFtZXRlcnMgcmVwcmVzZW50XG4gICAgICAgICAgICAvLyB0aGUgZmlyc3QgY3VydmUgaWUuIGxlc3NvbiAxIHRvIGxlc3NvbiAzLlxuICAgICAgICAgICAgJHNjb3BlLnBhdGhTdmdQYXJhbWV0ZXJzID0gJ00yNTAgODAgIEMgNDcwIDEwMCwgNDcwIDI4MCwgMjUwIDMwMCc7XG4gICAgICAgICAgICB2YXIgY29sbGVjdGlvbk5vZGVDb3VudCA9ICRzY29wZS5jb2xsZWN0aW9uLmdldENvbGxlY3Rpb25Ob2RlQ291bnQoKTtcbiAgICAgICAgICAgIC8vIFRoZSBzUGFyYW1ldGVyRXh0ZW5zaW9uIHJlcHJlc2VudHMgdGhlIGNvLW9yZGluYXRlcyBmb2xsb3dpbmcgdGhlICdTJ1xuICAgICAgICAgICAgLy8gKHNtb290aCBjdXJ2ZSB0bykgY29tbWFuZCBpbiBTVkcuXG4gICAgICAgICAgICB2YXIgc1BhcmFtZXRlckV4dGVuc2lvbiA9ICcnO1xuICAgICAgICAgICAgJHNjb3BlLnBhdGhJY29uUGFyYW1ldGVycyA9ICRzY29wZS5nZW5lcmF0ZVBhdGhJY29uUGFyYW1ldGVycygpO1xuICAgICAgICAgICAgaWYgKGNvbGxlY3Rpb25Ob2RlQ291bnQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUucGF0aFN2Z1BhcmFtZXRlcnMgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNvbGxlY3Rpb25Ob2RlQ291bnQgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUucGF0aFN2Z1BhcmFtZXRlcnMgPSAnTTI1MCA4MCAgQyA0NzAgMTAwLCA0NzAgMjgwLCAyNTAgMzAwJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFRoZSB4IGFuZCB5IGhlcmUgcmVwcmVzZW50IHRoZSBjby1vcmRpbmF0ZXMgb2YgdGhlIGNvbnRyb2wgcG9pbnRzXG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSBiZXppZXIgY3VydmUgKHBhdGgpLlxuICAgICAgICAgICAgICAgIHZhciB5ID0gNTAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgTWF0aC5mbG9vcihjb2xsZWN0aW9uTm9kZUNvdW50IC8gMik7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IChpICUgMikgPyAzMCA6IDQ3MDtcbiAgICAgICAgICAgICAgICAgICAgc1BhcmFtZXRlckV4dGVuc2lvbiArPSB4ICsgJyAnICsgeSArICcsICc7XG4gICAgICAgICAgICAgICAgICAgIHkgKz0gMjA7XG4gICAgICAgICAgICAgICAgICAgIHNQYXJhbWV0ZXJFeHRlbnNpb24gKz0gMjUwICsgJyAnICsgeSArICcsICc7XG4gICAgICAgICAgICAgICAgICAgIHkgKz0gMjAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc1BhcmFtZXRlckV4dGVuc2lvbiAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnBhdGhTdmdQYXJhbWV0ZXJzICs9ICcgUyAnICsgc1BhcmFtZXRlckV4dGVuc2lvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY29sbGVjdGlvbk5vZGVDb3VudCAlIDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoY29sbGVjdGlvbk5vZGVDb3VudCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3ZnSGVpZ2h0ID0gJHNjb3BlLk1JTl9IRUlHSFRfRk9SX1BBVEhfU1ZHX1BYO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN2Z0hlaWdodCA9IHkgLSAkc2NvcGUuRVZFTl9TVkdfSEVJR0hUX09GRlNFVF9QWDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoY29sbGVjdGlvbk5vZGVDb3VudCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3ZnSGVpZ2h0ID0gJHNjb3BlLk1JTl9IRUlHSFRfRk9SX1BBVEhfU1ZHX1BYO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN2Z0hlaWdodCA9IHkgLSAkc2NvcGUuT0REX1NWR19IRUlHSFRfT0ZGU0VUX1BYO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmdlbmVyYXRlUGF0aEljb25QYXJhbWV0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25Ob2RlcyA9ICRzY29wZS5jb2xsZWN0aW9uLmdldENvbGxlY3Rpb25Ob2RlcygpO1xuICAgICAgICAgICAgdmFyIGljb25QYXJhbWV0ZXJzQXJyYXkgPSBbXTtcbiAgICAgICAgICAgIGljb25QYXJhbWV0ZXJzQXJyYXkucHVzaCh7XG4gICAgICAgICAgICAgICAgdGh1bWJuYWlsSWNvblVybDogY29sbGVjdGlvbk5vZGVzWzBdLmdldEV4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCgpLnRodW1ibmFpbF9pY29uX3VybC5yZXBsYWNlKCdzdWJqZWN0cycsICdpbnZlcnRlZF9zdWJqZWN0cycpLFxuICAgICAgICAgICAgICAgIGxlZnQ6ICcyMjVweCcsXG4gICAgICAgICAgICAgICAgdG9wOiAnMzVweCcsXG4gICAgICAgICAgICAgICAgdGh1bWJuYWlsQmdDb2xvcjogY29sbGVjdGlvbk5vZGVzWzBdLmdldEV4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCgpLnRodW1ibmFpbF9iZ19jb2xvclxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBIZXJlIHggYW5kIHkgcmVwcmVzZW50IHRoZSBjby1vcmRpbmF0ZXMgZm9yIHRoZSBpY29ucyBpbiB0aGUgcGF0aC5cbiAgICAgICAgICAgIHZhciB4ID0gJHNjb3BlLklDT05fWF9NSURETEVfUFg7XG4gICAgICAgICAgICB2YXIgeSA9ICRzY29wZS5JQ09OX1lfSU5JVElBTF9QWDtcbiAgICAgICAgICAgIHZhciBjb3VudE1pZGRsZUljb24gPSAxO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCAkc2NvcGUuY29sbGVjdGlvbi5nZXRDb2xsZWN0aW9uTm9kZUNvdW50KCk7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChjb3VudE1pZGRsZUljb24gPT09IDAgJiYgeCA9PT0gJHNjb3BlLklDT05fWF9NSURETEVfUFgpIHtcbiAgICAgICAgICAgICAgICAgICAgeCA9ICRzY29wZS5JQ09OX1hfTEVGVF9QWDtcbiAgICAgICAgICAgICAgICAgICAgeSArPSAkc2NvcGUuSUNPTl9ZX0lOQ1JFTUVOVF9QWDtcbiAgICAgICAgICAgICAgICAgICAgY291bnRNaWRkbGVJY29uID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoY291bnRNaWRkbGVJY29uID09PSAxICYmIHggPT09ICRzY29wZS5JQ09OX1hfTUlERExFX1BYKSB7XG4gICAgICAgICAgICAgICAgICAgIHggPSAkc2NvcGUuSUNPTl9YX1JJR0hUX1BYO1xuICAgICAgICAgICAgICAgICAgICB5ICs9ICRzY29wZS5JQ09OX1lfSU5DUkVNRU5UX1BYO1xuICAgICAgICAgICAgICAgICAgICBjb3VudE1pZGRsZUljb24gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgeCA9ICRzY29wZS5JQ09OX1hfTUlERExFX1BYO1xuICAgICAgICAgICAgICAgICAgICB5ICs9ICRzY29wZS5JQ09OX1lfSU5DUkVNRU5UX1BYO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpY29uUGFyYW1ldGVyc0FycmF5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0aHVtYm5haWxJY29uVXJsOiBjb2xsZWN0aW9uTm9kZXNbaV0uZ2V0RXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0KCkudGh1bWJuYWlsX2ljb25fdXJsLnJlcGxhY2UoJ3N1YmplY3RzJywgJ2ludmVydGVkX3N1YmplY3RzJyksXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IHggKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IHkgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICB0aHVtYm5haWxCZ0NvbG9yOiBjb2xsZWN0aW9uTm9kZXNbaV0uZ2V0RXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0KCkudGh1bWJuYWlsX2JnX2NvbG9yXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaWNvblBhcmFtZXRlcnNBcnJheTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmlzQ29tcGxldGVkRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgdmFyIGNvbXBsZXRlZEV4cGxvcmF0aW9uSWRzID0gKCRzY29wZS5jb2xsZWN0aW9uUGxheXRocm91Z2guZ2V0Q29tcGxldGVkRXhwbG9yYXRpb25JZHMoKSk7XG4gICAgICAgICAgICByZXR1cm4gY29tcGxldGVkRXhwbG9yYXRpb25JZHMuaW5kZXhPZihleHBsb3JhdGlvbklkKSA+IC0xO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuZ2V0RXhwbG9yYXRpb25VcmwgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgcmV0dXJuICgnL2V4cGxvcmUvJyArIGV4cGxvcmF0aW9uSWQgKyAnP2NvbGxlY3Rpb25faWQ9JyArICRzY29wZS5jb2xsZWN0aW9uSWQpO1xuICAgICAgICB9O1xuICAgICAgICAkaHR0cC5nZXQoJy9jb2xsZWN0aW9uc3VtbWFyaWVzaGFuZGxlci9kYXRhJywge1xuICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgc3RyaW5naWZpZWRfY29sbGVjdGlvbl9pZHM6IEpTT04uc3RyaW5naWZ5KFskc2NvcGUuY29sbGVjdGlvbklkXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uU3VtbWFyeSA9IHJlc3BvbnNlLmRhdGEuc3VtbWFyaWVzWzBdO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1RoZXJlIHdhcyBhbiBlcnJvciB3aGlsZSBmZXRjaGluZyB0aGUgY29sbGVjdGlvbiBzdW1tYXJ5LicpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gTG9hZCB0aGUgY29sbGVjdGlvbiB0aGUgbGVhcm5lciB3YW50cyB0byB2aWV3LlxuICAgICAgICBSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS5sb2FkQ29sbGVjdGlvbigkc2NvcGUuY29sbGVjdGlvbklkKS50aGVuKGZ1bmN0aW9uIChjb2xsZWN0aW9uQmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb24gPSBDb2xsZWN0aW9uT2JqZWN0RmFjdG9yeS5jcmVhdGUoY29sbGVjdGlvbkJhY2tlbmRPYmplY3QpO1xuICAgICAgICAgICAgLy8gTG9hZCB0aGUgdXNlcidzIGN1cnJlbnQgcHJvZ3Jlc3MgaW4gdGhlIGNvbGxlY3Rpb24uIElmIHRoZSB1c2VyIGlzIGFcbiAgICAgICAgICAgIC8vIGd1ZXN0LCB0aGVuIGVpdGhlciB0aGUgZGVmYXVsdHMgZnJvbSB0aGUgc2VydmVyIHdpbGwgYmUgdXNlZCBvciB0aGVcbiAgICAgICAgICAgIC8vIHVzZXIncyBsb2NhbCBwcm9ncmVzcywgaWYgYW55IGhhcyBiZWVuIG1hZGUgYW5kIHRoZSBjb2xsZWN0aW9uIGlzXG4gICAgICAgICAgICAvLyB3aGl0ZWxpc3RlZC5cbiAgICAgICAgICAgIHZhciBjb2xsZWN0aW9uQWxsb3dzR3Vlc3RQcm9ncmVzcyA9ICgkc2NvcGUud2hpdGVsaXN0ZWRDb2xsZWN0aW9uSWRzRm9yR3Vlc3RQcm9ncmVzcy5pbmRleE9mKCRzY29wZS5jb2xsZWN0aW9uSWQpICE9PSAtMSk7XG4gICAgICAgICAgICBpZiAoISRzY29wZS5pc0xvZ2dlZEluICYmIGNvbGxlY3Rpb25BbGxvd3NHdWVzdFByb2dyZXNzICYmXG4gICAgICAgICAgICAgICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlLmhhc0NvbXBsZXRlZFNvbWVFeHBsb3JhdGlvbigkc2NvcGUuY29sbGVjdGlvbklkKSkge1xuICAgICAgICAgICAgICAgIHZhciBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcyA9IChHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2UuZ2V0Q29tcGxldGVkRXhwbG9yYXRpb25JZHMoJHNjb3BlLmNvbGxlY3Rpb24pKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEV4cGxvcmF0aW9uSWQgPSAoR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlLmdldE5leHRFeHBsb3JhdGlvbklkKCRzY29wZS5jb2xsZWN0aW9uLCBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcykpO1xuICAgICAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uUGxheXRocm91Z2ggPSAoQ29sbGVjdGlvblBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeS5jcmVhdGUobmV4dEV4cGxvcmF0aW9uSWQsIGNvbXBsZXRlZEV4cGxvcmF0aW9uSWRzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGVjdGlvblBsYXl0aHJvdWdoID0gKENvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmRPYmplY3QoY29sbGVjdGlvbkJhY2tlbmRPYmplY3QucGxheXRocm91Z2hfZGljdCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJHNjb3BlLm5leHRFeHBsb3JhdGlvbklkID1cbiAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGVjdGlvblBsYXl0aHJvdWdoLmdldE5leHRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIFRPRE8oYmhlbm5pbmcpOiBIYW5kbGUgbm90IGJlaW5nIGFibGUgdG8gbG9hZCB0aGUgY29sbGVjdGlvbi5cbiAgICAgICAgICAgIC8vIE5PVEUgVE8gREVWRUxPUEVSUzogQ2hlY2sgdGhlIGJhY2tlbmQgY29uc29sZSBmb3IgYW4gaW5kaWNhdGlvbiBhcyB0b1xuICAgICAgICAgICAgLy8gd2h5IHRoaXMgZXJyb3Igb2NjdXJyZWQ7IHNvbWV0aW1lcyB0aGUgZXJyb3JzIGFyZSBub2lzeSwgc28gdGhleSBhcmVcbiAgICAgICAgICAgIC8vIG5vdCBzaG93biB0byB0aGUgdXNlci5cbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnVGhlcmUgd2FzIGFuIGVycm9yIGxvYWRpbmcgdGhlIGNvbGxlY3Rpb24uJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkc2NvcGUuJHdhdGNoKCdjb2xsZWN0aW9uJywgZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZ2VuZXJhdGVQYXRoUGFyYW1ldGVycygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcbiAgICAgICAgJHNjb3BlLnNjcm9sbFRvTG9jYXRpb24gPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICRsb2NhdGlvbi5oYXNoKGlkKTtcbiAgICAgICAgICAgICRhbmNob3JTY3JvbGwoKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmNsb3NlT25DbGlja2luZ091dHNpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25DYXJkSXNTaG93biA9IGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUub25DbGlja1N0b3BQcm9wYWdhdGlvbiA9IGZ1bmN0aW9uICgkZXZ0KSB7XG4gICAgICAgICAgICAkZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUb3VjaGluZyBhbnl3aGVyZSBvdXRzaWRlIHRoZSBtb2JpbGUgcHJldmlldyBzaG91bGQgaGlkZSBpdC5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICgkc2NvcGUuZXhwbG9yYXRpb25DYXJkSXNTaG93biA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5leHBsb3JhdGlvbkNhcmRJc1Nob3duID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBIVE1MIHNlcmlhbGl6YXRpb24gYW5kIGVzY2FwaW5nLlxuICovXG5vcHBpYS5mYWN0b3J5KCdIdG1sRXNjYXBlclNlcnZpY2UnLCBbJyRsb2cnLCBmdW5jdGlvbiAoJGxvZykge1xuICAgICAgICB2YXIgaHRtbEVzY2FwZXIgPSB7XG4gICAgICAgICAgICBvYmpUb0VzY2FwZWRKc29uOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudW5lc2NhcGVkU3RyVG9Fc2NhcGVkU3RyKEpTT04uc3RyaW5naWZ5KG9iaikpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVzY2FwZWRKc29uVG9PYmo6IGZ1bmN0aW9uIChqc29uKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFqc29uKSB7XG4gICAgICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoJ0VtcHR5IHN0cmluZyB3YXMgcGFzc2VkIHRvIEpTT04gZGVjb2Rlci4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh0aGlzLmVzY2FwZWRTdHJUb1VuZXNjYXBlZFN0cihqc29uKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5lc2NhcGVkU3RyVG9Fc2NhcGVkU3RyOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhzdHIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgJyYjMzk7JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVzY2FwZWRTdHJUb1VuZXNjYXBlZFN0cjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyh2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZxdW90Oy9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJiMzOTsvZywgJ1xcJycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZndDsvZywgJz4nKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmFtcDsvZywgJyYnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGh0bWxFc2NhcGVyO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlcyBmb3IgZXhwbG9yYXRpb25zIHdoaWNoIG1heSBiZSBzaGFyZWQgYnkgYm90aFxuICogdGhlIGxlYXJuZXIgYW5kIGVkaXRvciB2aWV3cy5cbiAqL1xuLy8gU2VydmljZSBmb3Igc2VuZGluZyBldmVudHMgdG8gR29vZ2xlIEFuYWx5dGljcy5cbi8vXG4vLyBOb3RlIHRoYXQgZXZlbnRzIGFyZSBvbmx5IHNlbnQgaWYgdGhlIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMgZmxhZyBpc1xuLy8gdHVybmVkIG9uLiBUaGlzIGZsYWcgbXVzdCBiZSB0dXJuZWQgb24gZXhwbGljaXRseSBieSB0aGUgYXBwbGljYXRpb25cbi8vIG93bmVyIGluIGZlY29uZi5weS5cbm9wcGlhLmZhY3RvcnkoJ1NpdGVBbmFseXRpY3NTZXJ2aWNlJywgWyckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgdmFyIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMgPSBjb25zdGFudHMuQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUztcbiAgICAgICAgLy8gRm9yIGRlZmluaXRpb25zIG9mIHRoZSB2YXJpb3VzIGFyZ3VtZW50cywgcGxlYXNlIHNlZTpcbiAgICAgICAgLy8gZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9ldmVudHNcbiAgICAgICAgdmFyIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcyA9IGZ1bmN0aW9uIChldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCkge1xuICAgICAgICAgICAgaWYgKCR3aW5kb3cuZ2EgJiYgQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUykge1xuICAgICAgICAgICAgICAgICR3aW5kb3cuZ2EoJ3NlbmQnLCAnZXZlbnQnLCBldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIEZvciBkZWZpbml0aW9ucyBvZiB0aGUgdmFyaW91cyBhcmd1bWVudHMsIHBsZWFzZSBzZWU6XG4gICAgICAgIC8vIGRldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvXG4gICAgICAgIC8vICAgc29jaWFsLWludGVyYWN0aW9uc1xuICAgICAgICB2YXIgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzID0gZnVuY3Rpb24gKG5ldHdvcmssIGFjdGlvbiwgdGFyZ2V0VXJsKSB7XG4gICAgICAgICAgICBpZiAoJHdpbmRvdy5nYSAmJiBDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5nYSgnc2VuZCcsICdzb2NpYWwnLCBuZXR3b3JrLCBhY3Rpb24sIHRhcmdldFVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBUaGUgc3JjRWxlbWVudCByZWZlcnMgdG8gdGhlIGVsZW1lbnQgb24gdGhlIHBhZ2UgdGhhdCBpcyBjbGlja2VkLlxuICAgICAgICAgICAgcmVnaXN0ZXJTdGFydExvZ2luRXZlbnQ6IGZ1bmN0aW9uIChzcmNFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdMb2dpbkJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnICcgKyBzcmNFbGVtZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld1NpZ251cEV2ZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTaWdudXBCdXR0b24nLCAnY2xpY2snLCAnJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDbGlja0Jyb3dzZUxpYnJhcnlCdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQnJvd3NlTGlicmFyeUJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyR29Ub0RvbmF0aW9uU2l0ZUV2ZW50OiBmdW5jdGlvbiAoZG9uYXRpb25TaXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnR29Ub0RvbmF0aW9uU2l0ZScsICdjbGljaycsIGRvbmF0aW9uU2l0ZU5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQXBwbHlUb1RlYWNoV2l0aE9wcGlhRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0FwcGx5VG9UZWFjaFdpdGhPcHBpYScsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrQ3JlYXRlRXhwbG9yYXRpb25CdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ3JlYXRlRXhwbG9yYXRpb25CdXR0b24nLCAnY2xpY2snLCAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbicsICdjcmVhdGUnLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uSW5Db2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbkZyb21Db2xsZWN0aW9uJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ3JlYXRlTmV3Q29sbGVjdGlvbkV2ZW50OiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdDb2xsZWN0aW9uJywgJ2NyZWF0ZScsIGNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDb21taXRDaGFuZ2VzVG9Qcml2YXRlRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHJpdmF0ZUV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJTaGFyZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2hhcmVDb2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlbkVtYmVkSW5mb0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRW1iZWRJbmZvTW9kYWwnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29tbWl0Q2hhbmdlc1RvUHVibGljRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHVibGljRXhwbG9yYXRpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBNZXRyaWNzIGZvciB0dXRvcmlhbCBvbiBmaXJzdCBjcmVhdGluZyBleHBsb3JhdGlvblxuICAgICAgICAgICAgcmVnaXN0ZXJUdXRvcmlhbE1vZGFsT3BlbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVHV0b3JpYWxNb2RhbE9wZW4nLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRGVjbGluZVR1dG9yaWFsTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0RlY2xpbmVUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJBY2NlcHRUdXRvcmlhbE1vZGFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdBY2NlcHRUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgdmlzaXRpbmcgdGhlIGhlbHAgY2VudGVyXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrSGVscEJ1dHRvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tIZWxwQnV0dG9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdEhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1Zpc2l0SGVscENlbnRlcicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlblR1dG9yaWFsRnJvbUhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5UdXRvcmlhbEZyb21IZWxwQ2VudGVyJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgZXhpdGluZyB0aGUgdHV0b3JpYWxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2tpcFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTa2lwVHV0b3JpYWwnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaW5pc2hUdXRvcmlhbCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIGZpcnN0IHRpbWUgZWRpdG9yIHVzZVxuICAgICAgICAgICAgcmVnaXN0ZXJFZGl0b3JGaXJzdEVudHJ5RXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdEVudGVyRWRpdG9yJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0T3BlbkNvbnRlbnRCb3hFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0T3BlbkNvbnRlbnRCb3gnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlQ29udGVudEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RTYXZlQ29udGVudCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RDbGlja0FkZEludGVyYWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENsaWNrQWRkSW50ZXJhY3Rpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0U2VsZWN0SW50ZXJhY3Rpb25UeXBlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNlbGVjdEludGVyYWN0aW9uVHlwZScsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlSW50ZXJhY3Rpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0U2F2ZUludGVyYWN0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdFNhdmVSdWxlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNhdmVSdWxlJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdENyZWF0ZVNlY29uZFN0YXRlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENyZWF0ZVNlY29uZFN0YXRlJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIHB1Ymxpc2hpbmcgZXhwbG9yYXRpb25zXG4gICAgICAgICAgICByZWdpc3RlclNhdmVQbGF5YWJsZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUGxheWFibGVFeHBsb3JhdGlvbicsICdzYXZlJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPcGVuUHVibGlzaEV4cGxvcmF0aW9uTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1B1Ymxpc2hFeHBsb3JhdGlvbk1vZGFsJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclB1Ymxpc2hFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUHVibGlzaEV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdE9wcGlhRnJvbUlmcmFtZUV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVmlzaXRPcHBpYUZyb21JZnJhbWUnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld0NhcmQ6IGZ1bmN0aW9uIChjYXJkTnVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhcmROdW0gPD0gMTAgfHwgY2FyZE51bSAlIDEwID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUGxheWVyTmV3Q2FyZCcsICdjbGljaycsIGNhcmROdW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaEV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdQbGF5ZXJGaW5pc2hFeHBsb3JhdGlvbicsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9wZW5Db2xsZWN0aW9uRnJvbUxhbmRpbmdQYWdlRXZlbnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5GcmFjdGlvbnNGcm9tTGFuZGluZ1BhZ2UnLCAnY2xpY2snLCBjb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3Rld2FyZHNMYW5kaW5nUGFnZUV2ZW50OiBmdW5jdGlvbiAodmlld2VyVHlwZSwgYnV0dG9uVGV4dCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tCdXR0b25PblN0ZXdhcmRzUGFnZScsICdjbGljaycsIHZpZXdlclR5cGUgKyAnOicgKyBidXR0b25UZXh0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclNhdmVSZWNvcmRlZEF1ZGlvRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUmVjb3JkZWRBdWRpbycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3RhcnRBdWRpb1JlY29yZGluZ0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnU3RhcnRBdWRpb1JlY29yZGluZycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyVXBsb2FkQXVkaW9FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1VwbG9hZFJlY29yZGVkQXVkaW8nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBtYW5pcHVsYXRpbmcgdGhlIHBhZ2UgVVJMLiBBbHNvIGFsbG93c1xuICogZnVuY3Rpb25zIG9uICR3aW5kb3cgdG8gYmUgbW9ja2VkIGluIHVuaXQgdGVzdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1VybFNlcnZpY2UnLCBbJyR3aW5kb3cnLCBmdW5jdGlvbiAoJHdpbmRvdykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBmb3IgdGVzdGluZyBwdXJwb3NlcyAodG8gbW9jayAkd2luZG93LmxvY2F0aW9uKVxuICAgICAgICAgICAgZ2V0Q3VycmVudExvY2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICR3aW5kb3cubG9jYXRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkuc2VhcmNoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qIEFzIHBhcmFtc1trZXldIGlzIG92ZXJ3cml0dGVuLCBpZiBxdWVyeSBzdHJpbmcgaGFzIG11bHRpcGxlIGZpZWxkVmFsdWVzXG4gICAgICAgICAgICAgICBmb3Igc2FtZSBmaWVsZE5hbWUsIHVzZSBnZXRRdWVyeUZpZWxkVmFsdWVzQXNMaXN0KGZpZWxkTmFtZSkgdG8gZ2V0IGl0XG4gICAgICAgICAgICAgICBpbiBhcnJheSBmb3JtLiAqL1xuICAgICAgICAgICAgZ2V0VXJsUGFyYW1zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0cyA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkucmVwbGFjZSgvWz8mXSsoW149Jl0rKT0oW14mXSopL2dpLCBmdW5jdGlvbiAobSwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXNbZGVjb2RlVVJJQ29tcG9uZW50KGtleSldID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSWZyYW1lZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICB2YXIgdXJsUGFydHMgPSBwYXRobmFtZS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmxQYXJ0c1sxXSA9PT0gJ2VtYmVkJztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRQYXRobmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLnBhdGhuYW1lO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRvcGljIGlkIHNob3VsZCBiZSBjb3JyZWN0bHkgcmV0dXJuZWQgZnJvbSB0b3BpYyBlZGl0b3IgYXMgd2VsbCBhc1xuICAgICAgICAgICAgLy8gc3RvcnkgZWRpdG9yLCBzaW5jZSBib3RoIGhhdmUgdG9waWMgaWQgaW4gdGhlaXIgdXJsLlxuICAgICAgICAgICAgZ2V0VG9waWNJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC8oc3Rvcnl8dG9waWMpX2VkaXRvclxcLyhcXHd8LSl7MTJ9L2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZS5zcGxpdCgnLycpWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCB0b3BpYyBpZCB1cmwnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRUb3BpY05hbWVGcm9tTGVhcm5lclVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcLyhzdG9yeXx0b3BpY3xwcmFjdGljZV9zZXNzaW9uKS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lLnNwbGl0KCcvJylbMl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBVUkwgZm9yIHRvcGljJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RvcnlJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC9zdG9yeV9lZGl0b3IoXFwvKFxcd3wtKXsxMn0pezJ9L2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZS5zcGxpdCgnLycpWzNdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBzdG9yeSBpZCB1cmwnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdG9yeUlkSW5QbGF5ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcXVlcnkgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpO1xuICAgICAgICAgICAgICAgIGlmIChxdWVyeS5tYXRjaCgvXFw/c3RvcnlfaWQ9KChcXHd8LSl7MTJ9KS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcXVlcnkuc3BsaXQoJz0nKVsxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U2tpbGxJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgdmFyIHNraWxsSWQgPSBwYXRobmFtZS5zcGxpdCgnLycpWzJdO1xuICAgICAgICAgICAgICAgIGlmIChza2lsbElkLmxlbmd0aCAhPT0gMTIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU2tpbGwgSWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNraWxsSWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UXVlcnlGaWVsZFZhbHVlc0FzTGlzdDogZnVuY3Rpb24gKGZpZWxkTmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBmaWVsZFZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLmluZGV4T2YoJz8nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVhY2ggcXVlcnlJdGVtIHJldHVybiBvbmUgZmllbGQtdmFsdWUgcGFpciBpbiB0aGUgdXJsLlxuICAgICAgICAgICAgICAgICAgICB2YXIgcXVlcnlJdGVtcyA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuc2xpY2UodGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5pbmRleE9mKCc/JykgKyAxKS5zcGxpdCgnJicpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXJ5SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50RmllbGROYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5SXRlbXNbaV0uc3BsaXQoJz0nKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZpZWxkVmFsdWUgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlJdGVtc1tpXS5zcGxpdCgnPScpWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RmllbGROYW1lID09PSBmaWVsZE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlcy5wdXNoKGN1cnJlbnRGaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRWYWx1ZXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWRkRmllbGQ6IGZ1bmN0aW9uICh1cmwsIGZpZWxkTmFtZSwgZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBlbmNvZGVkRmllbGRWYWx1ZSA9IGVuY29kZVVSSUNvbXBvbmVudChmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5jb2RlZEZpZWxkTmFtZSA9IGVuY29kZVVSSUNvbXBvbmVudChmaWVsZE5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmwgKyAodXJsLmluZGV4T2YoJz8nKSAhPT0gLTEgPyAnJicgOiAnPycpICsgZW5jb2RlZEZpZWxkTmFtZSArXG4gICAgICAgICAgICAgICAgICAgICc9JyArIGVuY29kZWRGaWVsZFZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEhhc2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5oYXNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=