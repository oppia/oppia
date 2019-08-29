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
/******/
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
/******/ 		"library": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/library-page/library-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","collection_player~creator_dashboard~learner_dashboard~library~profile~story_viewer","collection_player~learner_dashboard~library~profile~story_viewer","community_dashboard~library~preferences"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/base_components/BaseContentDirective.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/base_components/BaseContentDirective.ts ***!
  \*************************************************************************/
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
 * @fileoverview Directive for the Base Transclusion Component.
 */
__webpack_require__(/*! base_components/WarningLoaderDirective.ts */ "./core/templates/dev/head/base_components/WarningLoaderDirective.ts");
__webpack_require__(/*! pages/OppiaFooterDirective.ts */ "./core/templates/dev/head/pages/OppiaFooterDirective.ts");
__webpack_require__(/*! domain/sidebar/SidebarStatusService.ts */ "./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/stateful/BackgroundMaskService.ts */ "./core/templates/dev/head/services/stateful/BackgroundMaskService.ts");
angular.module('oppia').directive('baseContent', [
    'UrlInterpolationService',
    function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            transclude: {
                breadcrumb: '?navbarBreadcrumb',
                content: 'content',
                footer: '?pageFooter',
                navOptions: '?navOptions',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/base_components/base_content_directive.html'),
            controllerAs: '$ctrl',
            controller: ['$rootScope', 'BackgroundMaskService',
                'SidebarStatusService', 'UrlService', 'SITE_FEEDBACK_FORM_URL',
                function ($rootScope, BackgroundMaskService, SidebarStatusService, UrlService, SITE_FEEDBACK_FORM_URL) {
                    var ctrl = this;
                    ctrl.iframed = UrlService.isIframed();
                    ctrl.siteFeedbackFormUrl = SITE_FEEDBACK_FORM_URL;
                    ctrl.isSidebarShown = SidebarStatusService.isSidebarShown;
                    ctrl.closeSidebarOnSwipe = SidebarStatusService.closeSidebar;
                    ctrl.isBackgroundMaskActive = BackgroundMaskService.isMaskActive;
                    ctrl.DEV_MODE = $rootScope.DEV_MODE;
                    ctrl.skipToMainContent = function () {
                        var mainContentElement = document.getElementById('oppia-main-content');
                        if (!mainContentElement) {
                            throw Error('Variable mainContentElement is undefined.');
                        }
                        mainContentElement.tabIndex = -1;
                        mainContentElement.scrollIntoView();
                        mainContentElement.focus();
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/base_components/WarningLoaderDirective.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/base_components/WarningLoaderDirective.ts ***!
  \***************************************************************************/
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
 * @fileoverview Directive for warning_loader.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').directive('warningLoader', [
    'UrlInterpolationService',
    function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/base_components/warning_loader_directive.html'),
            controllerAs: '$ctrl',
            controller: ['AlertsService',
                function (AlertsService) {
                    var ctrl = this;
                    ctrl.AlertsService = AlertsService;
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/common-elements/loading-dots.directive.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-elements/loading-dots.directive.ts ***!
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
 * @fileoverview Directive for displaying animated loading dots.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('loadingDots', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/common-elements/' +
                'loading-dots.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile/collection-summary-tile.constants.ajs.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile/collection-summary-tile.constants.ajs.ts ***!
  \**************************************************************************************************/
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
 * @fileoverview Constants for summary tile for collections.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var collection_summary_tile_constants_1 = __webpack_require__(/*! components/summary-tile/collection-summary-tile.constants */ "./core/templates/dev/head/components/summary-tile/collection-summary-tile.constants.ts");
angular.module('oppia').constant('COLLECTION_VIEWER_URL', collection_summary_tile_constants_1.CollectionSummaryTileConstants.COLLECTION_VIEWER_URL);
angular.module('oppia').constant('COLLECTION_EDITOR_URL', collection_summary_tile_constants_1.CollectionSummaryTileConstants.COLLECTION_EDITOR_URL);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile/collection-summary-tile.constants.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile/collection-summary-tile.constants.ts ***!
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for summary tile for collections.
 */
var CollectionSummaryTileConstants = /** @class */ (function () {
    function CollectionSummaryTileConstants() {
    }
    CollectionSummaryTileConstants.COLLECTION_VIEWER_URL = '/collection/<collection_id>';
    CollectionSummaryTileConstants.COLLECTION_EDITOR_URL = '/collection_editor/create/<collection_id>';
    return CollectionSummaryTileConstants;
}());
exports.CollectionSummaryTileConstants = CollectionSummaryTileConstants;


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile/collection-summary-tile.directive.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile/collection-summary-tile.directive.ts ***!
  \**********************************************************************************************/
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
__webpack_require__(/*! components/summary-tile/collection-summary-tile.constants.ajs.ts */ "./core/templates/dev/head/components/summary-tile/collection-summary-tile.constants.ajs.ts");
angular.module('oppia').directive('collectionSummaryTile', [
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
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/summary-tile/collection-summary-tile.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                'DateTimeFormatService', 'UserService',
                'ACTIVITY_TYPE_COLLECTION', 'COLLECTION_VIEWER_URL',
                'COLLECTION_EDITOR_URL', function (DateTimeFormatService, UserService, ACTIVITY_TYPE_COLLECTION, COLLECTION_VIEWER_URL, COLLECTION_EDITOR_URL) {
                    var ctrl = this;
                    ctrl.userIsLoggedIn = null;
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        ctrl.userIsLoggedIn = userInfo.isLoggedIn();
                    });
                    ctrl.DEFAULT_EMPTY_TITLE = 'Untitled';
                    ctrl.ACTIVITY_TYPE_COLLECTION = ACTIVITY_TYPE_COLLECTION;
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

/***/ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts ***!
  \******************************************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating new frontend instances of learner
   dashboard activity ids domain object.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var LearnerDashboardActivityIds = /** @class */ (function () {
    function LearnerDashboardActivityIds(incompleteExplorationIds, incompleteCollectionIds, completedExplorationIds, completedCollectionIds, explorationPlaylistIds, collectionPlaylistIds) {
        this.incompleteExplorationIds = incompleteExplorationIds;
        this.incompleteCollectionIds = incompleteCollectionIds;
        this.completedExplorationIds = completedExplorationIds;
        this.completedCollectionIds = completedCollectionIds;
        this.explorationPlaylistIds = explorationPlaylistIds;
        this.collectionPlaylistIds = collectionPlaylistIds;
    }
    LearnerDashboardActivityIds.prototype.includesActivity = function (activityId) {
        if (this.incompleteCollectionIds.indexOf(activityId) !== -1 ||
            this.completedCollectionIds.indexOf(activityId) !== -1 ||
            this.collectionPlaylistIds.indexOf(activityId) !== -1 ||
            this.incompleteExplorationIds.indexOf(activityId) !== -1 ||
            this.completedExplorationIds.indexOf(activityId) !== -1 ||
            this.explorationPlaylistIds.indexOf(activityId) !== -1) {
            return true;
        }
        else {
            return false;
        }
    };
    LearnerDashboardActivityIds.prototype.belongsToExplorationPlaylist = function (explorationId) {
        if (this.explorationPlaylistIds.indexOf(explorationId) !== -1) {
            return true;
        }
        else {
            return false;
        }
    };
    LearnerDashboardActivityIds.prototype.belongsToCollectionPlaylist = function (collectionId) {
        if (this.collectionPlaylistIds.indexOf(collectionId) !== -1) {
            return true;
        }
        else {
            return false;
        }
    };
    LearnerDashboardActivityIds.prototype.belongsToCompletedExplorations = function (explorationId) {
        if (this.completedExplorationIds.indexOf(explorationId) !== -1) {
            return true;
        }
        else {
            return false;
        }
    };
    LearnerDashboardActivityIds.prototype.belongsToCompletedCollections = function (collectionId) {
        if (this.completedCollectionIds.indexOf(collectionId) !== -1) {
            return true;
        }
        else {
            return false;
        }
    };
    LearnerDashboardActivityIds.prototype.belongsToIncompleteExplorations = function (explorationId) {
        if (this.incompleteExplorationIds.indexOf(explorationId) !== -1) {
            return true;
        }
        else {
            return false;
        }
    };
    LearnerDashboardActivityIds.prototype.belongsToIncompleteCollections = function (collectionId) {
        if (this.incompleteCollectionIds.indexOf(collectionId) !== -1) {
            return true;
        }
        else {
            return false;
        }
    };
    LearnerDashboardActivityIds.prototype.addToExplorationLearnerPlaylist = function (explorationId) {
        this.explorationPlaylistIds.push(explorationId);
    };
    LearnerDashboardActivityIds.prototype.removeFromExplorationLearnerPlaylist = function (explorationId) {
        var index = this.explorationPlaylistIds.indexOf(explorationId);
        if (index !== -1) {
            this.explorationPlaylistIds.splice(index, 1);
        }
    };
    LearnerDashboardActivityIds.prototype.addToCollectionLearnerPlaylist = function (collectionId) {
        this.collectionPlaylistIds.push(collectionId);
    };
    LearnerDashboardActivityIds.prototype.removeFromCollectionLearnerPlaylist = function (collectionId) {
        var index = this.collectionPlaylistIds.indexOf(collectionId);
        if (index !== -1) {
            this.collectionPlaylistIds.splice(index, 1);
        }
    };
    return LearnerDashboardActivityIds;
}());
exports.LearnerDashboardActivityIds = LearnerDashboardActivityIds;
var LearnerDashboardActivityIdsObjectFactory = /** @class */ (function () {
    function LearnerDashboardActivityIdsObjectFactory() {
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'skillRightsBackendDict' is a dict with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    LearnerDashboardActivityIdsObjectFactory.prototype.createFromBackendDict = function (learnerDashboardActivityIdsDict) {
        return new LearnerDashboardActivityIds(learnerDashboardActivityIdsDict.incomplete_exploration_ids, learnerDashboardActivityIdsDict.incomplete_collection_ids, learnerDashboardActivityIdsDict.completed_exploration_ids, learnerDashboardActivityIdsDict.completed_collection_ids, learnerDashboardActivityIdsDict.exploration_playlist_ids, learnerDashboardActivityIdsDict.collection_playlist_ids);
    };
    LearnerDashboardActivityIdsObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], LearnerDashboardActivityIdsObjectFactory);
    return LearnerDashboardActivityIdsObjectFactory;
}());
exports.LearnerDashboardActivityIdsObjectFactory = LearnerDashboardActivityIdsObjectFactory;
angular.module('oppia').factory('LearnerDashboardActivityIdsObjectFactory', static_1.downgradeInjectable(LearnerDashboardActivityIdsObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts ***!
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Backend services related to fetching the ids of the
 * activities present in the learner dashboard.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var http_1 = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var LearnerDashboardIdsBackendApiService = /** @class */ (function () {
    function LearnerDashboardIdsBackendApiService(http) {
        this.http = http;
    }
    LearnerDashboardIdsBackendApiService.prototype._fetchLearnerDashboardIds = function () {
        // HttpClient returns an Observable, the toPromise converts it into a
        // Promise.
        return this.http.get('/learnerdashboardidshandler/data').toPromise();
    };
    LearnerDashboardIdsBackendApiService.prototype.fetchLearnerDashboardIds = function () {
        return this._fetchLearnerDashboardIds();
    };
    var _a;
    LearnerDashboardIdsBackendApiService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof http_1.HttpClient !== "undefined" && http_1.HttpClient) === "function" ? _a : Object])
    ], LearnerDashboardIdsBackendApiService);
    return LearnerDashboardIdsBackendApiService;
}());
exports.LearnerDashboardIdsBackendApiService = LearnerDashboardIdsBackendApiService;
angular.module('oppia').factory('LearnerDashboardIdsBackendApiService', static_1.downgradeInjectable(LearnerDashboardIdsBackendApiService));


/***/ }),

/***/ "./core/templates/dev/head/domain/learner_dashboard/LearnerPlaylistService.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/learner_dashboard/LearnerPlaylistService.ts ***!
  \************************************************************************************/
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
 * @fileoverview Service related to the learner playlist.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').factory('LearnerPlaylistService', [
    '$http', '$uibModal', 'AlertsService', 'UrlInterpolationService',
    'ACTIVITY_TYPE_COLLECTION', 'ACTIVITY_TYPE_EXPLORATION',
    function ($http, $uibModal, AlertsService, UrlInterpolationService, ACTIVITY_TYPE_COLLECTION, ACTIVITY_TYPE_EXPLORATION) {
        var _addToLearnerPlaylist = function (activityId, activityType) {
            var successfullyAdded = true;
            var addToLearnerPlaylistUrl = (UrlInterpolationService.interpolateUrl('/learnerplaylistactivityhandler/<activityType>/<activityId>', {
                activityType: activityType,
                activityId: activityId
            }));
            $http.post(addToLearnerPlaylistUrl, {})
                .then(function (response) {
                if (response.data.belongs_to_completed_or_incomplete_list) {
                    successfullyAdded = false;
                    AlertsService.addInfoMessage('You have already completed or are completing this ' +
                        'activity.');
                }
                if (response.data.belongs_to_subscribed_activities) {
                    successfullyAdded = false;
                    AlertsService.addInfoMessage('This is present in your creator dashboard');
                }
                if (response.data.playlist_limit_exceeded) {
                    successfullyAdded = false;
                    AlertsService.addInfoMessage('Your \'Play Later\' list is full!  Either you can ' +
                        'complete some or you can head to the learner dashboard ' +
                        'and remove some.');
                }
                if (successfullyAdded) {
                    AlertsService.addSuccessMessage('Successfully added to your \'Play Later\' list.');
                }
            });
            return successfullyAdded;
        };
        var _removeFromLearnerPlaylist = function (activityId, activityTitle, activityType, learnerDashboardActivityIds) {
            $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/learner-dashboard-page/modal-templates/' +
                    'remove-activity-from-learner-dashboard-modal.template.html'),
                backdrop: true,
                resolve: {
                    activityId: function () {
                        return activityId;
                    },
                    activityTitle: function () {
                        return activityTitle;
                    }
                },
                controller: [
                    '$scope', '$uibModalInstance', '$http', 'UrlInterpolationService',
                    function ($scope, $uibModalInstance, $http, UrlInterpolationService) {
                        $scope.sectionNameI18nId = ('I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION');
                        $scope.activityTitle = activityTitle;
                        var removeFromLearnerPlaylistUrl = (UrlInterpolationService.interpolateUrl('/learnerplaylistactivityhandler/' +
                            '<activityType>/<activityId>', {
                            activityType: activityType,
                            activityId: activityId
                        }));
                        $scope.remove = function () {
                            $http['delete'](removeFromLearnerPlaylistUrl);
                            $uibModalInstance.close();
                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                ]
            }).result.then(function () {
                if (activityType === ACTIVITY_TYPE_EXPLORATION) {
                    learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist(activityId);
                }
                else if (activityType === ACTIVITY_TYPE_COLLECTION) {
                    learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist(activityId);
                }
            });
        };
        return {
            addToLearnerPlaylist: _addToLearnerPlaylist,
            removeFromLearnerPlaylist: _removeFromLearnerPlaylist
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/objects/objects-domain.constants.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/objects/objects-domain.constants.ts ***!
  \****************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for objects domain.
 */
var ObjectsDomainConstants = /** @class */ (function () {
    function ObjectsDomainConstants() {
    }
    ObjectsDomainConstants.FRACTION_PARSING_ERRORS = {
        INVALID_CHARS: 'Please only use numerical digits, spaces or forward slashes (/)',
        INVALID_FORMAT: 'Please enter a valid fraction (e.g., 5/3 or 1 2/3)',
        DIVISION_BY_ZERO: 'Please do not put 0 in the denominator'
    };
    ObjectsDomainConstants.NUMBER_WITH_UNITS_PARSING_ERRORS = {
        INVALID_VALUE: 'Please ensure that value is either a fraction or a number',
        INVALID_CURRENCY: 'Please enter a valid currency (e.g., $5 or Rs 5)',
        INVALID_CURRENCY_FORMAT: 'Please write currency units at the beginning',
        INVALID_UNIT_CHARS: 'Please ensure that unit only contains numbers, alphabets, (, ), *, ^, ' +
            '/, -'
    };
    ObjectsDomainConstants.CURRENCY_UNITS = {
        dollar: {
            name: 'dollar',
            aliases: ['$', 'dollars', 'Dollars', 'Dollar', 'USD'],
            front_units: ['$'],
            base_unit: null
        },
        rupee: {
            name: 'rupee',
            aliases: ['Rs', 'rupees', '₹', 'Rupees', 'Rupee'],
            front_units: ['Rs ', '₹'],
            base_unit: null
        },
        cent: {
            name: 'cent',
            aliases: ['cents', 'Cents', 'Cent'],
            front_units: [],
            base_unit: '0.01 dollar'
        },
        paise: {
            name: 'paise',
            aliases: ['paisa', 'Paise', 'Paisa'],
            front_units: [],
            base_unit: '0.01 rupee'
        }
    };
    return ObjectsDomainConstants;
}());
exports.ObjectsDomainConstants = ObjectsDomainConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/OppiaFooterDirective.ts":
/*!***************************************************************!*\
  !*** ./core/templates/dev/head/pages/OppiaFooterDirective.ts ***!
  \***************************************************************/
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
 * @fileoverview Directive for the footer.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('oppiaFooter', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/oppia_footer_directive.html'),
            controllerAs: '$ctrl',
            controller: [
                function () { }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/library-footer/library-footer.directive.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/library-footer/library-footer.directive.ts ***!
  \***********************************************************************************************/
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
 * @fileoverview Directive for the library footer.
 */
__webpack_require__(/*! pages/OppiaFooterDirective.ts */ "./core/templates/dev/head/pages/OppiaFooterDirective.ts");
__webpack_require__(/*! pages/library-page/library-page.constants.ajs.ts */ "./core/templates/dev/head/pages/library-page/library-page.constants.ajs.ts");
angular.module('oppia').directive('libraryFooter', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/library-page/library-footer/library-footer.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$window', 'LIBRARY_PAGE_MODES', 'LIBRARY_PATHS_TO_MODES',
                function ($window, LIBRARY_PAGE_MODES, LIBRARY_PATHS_TO_MODES) {
                    var ctrl = this;
                    var pageMode = LIBRARY_PATHS_TO_MODES[$window.location.pathname];
                    ctrl.footerIsDisplayed = (pageMode !== LIBRARY_PAGE_MODES.SEARCH);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/library-page.constants.ajs.ts":
/*!**********************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/library-page.constants.ajs.ts ***!
  \**********************************************************************************/
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
 * @fileoverview Constants for the Oppia contributors' library page.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var library_page_constants_1 = __webpack_require__(/*! pages/library-page/library-page.constants */ "./core/templates/dev/head/pages/library-page/library-page.constants.ts");
// NOTE TO DEVELOPERS: The constants defined below in LIBRARY_PAGE_MODES should
// be same as the LIBRARY_PAGE_MODE constants defined in feconf.py. For example
// LIBRARY_PAGE_MODES.GROUP should have the same value as
// LIBRARY_PAGE_MODE_GROUP in feconf.py.
angular.module('oppia').constant('LIBRARY_PAGE_MODES', library_page_constants_1.LibraryPageConstants.LIBRARY_PAGE_MODES);
angular.module('oppia').constant('LIBRARY_PATHS_TO_MODES', library_page_constants_1.LibraryPageConstants.LIBRARY_PATHS_TO_MODES);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/library-page.constants.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/library-page.constants.ts ***!
  \******************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for the Oppia contributors' library page.
 */
// NOTE TO DEVELOPERS: The constants defined below in LIBRARY_PAGE_MODES should
// be same as the LIBRARY_PAGE_MODE constants defined in feconf.py. For example
// LIBRARY_PAGE_MODES.GROUP should have the same value as
// LIBRARY_PAGE_MODE_GROUP in feconf.py.
var LibraryPageConstants = /** @class */ (function () {
    function LibraryPageConstants() {
    }
    LibraryPageConstants.LIBRARY_PAGE_MODES = {
        GROUP: 'group',
        INDEX: 'index',
        SEARCH: 'search'
    };
    LibraryPageConstants.LIBRARY_PATHS_TO_MODES = {
        '/library': 'index',
        '/library/top_rated': 'group',
        '/library/recently_published': 'group',
        '/search/find': 'search'
    };
    return LibraryPageConstants;
}());
exports.LibraryPageConstants = LibraryPageConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/library-page.directive.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/library-page.directive.ts ***!
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
 * @fileoverview Data and directive for the Oppia contributors' library page.
 */
__webpack_require__(/*! components/common-layout-directives/common-elements/loading-dots.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/loading-dots.directive.ts");
__webpack_require__(/*! components/summary-tile/exploration-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile/exploration-summary-tile.directive.ts");
__webpack_require__(/*! components/summary-tile/collection-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile/collection-summary-tile.directive.ts");
__webpack_require__(/*! pages/library-page/search-results/search-results.directive.ts */ "./core/templates/dev/head/pages/library-page/search-results/search-results.directive.ts");
__webpack_require__(/*! domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts");
__webpack_require__(/*! domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts");
__webpack_require__(/*! domain/learner_dashboard/LearnerPlaylistService.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerPlaylistService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ConstructTranslationIdsService.ts */ "./core/templates/dev/head/services/ConstructTranslationIdsService.ts");
__webpack_require__(/*! services/PageTitleService.ts */ "./core/templates/dev/head/services/PageTitleService.ts");
__webpack_require__(/*! services/SearchService.ts */ "./core/templates/dev/head/services/SearchService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
__webpack_require__(/*! pages/library-page/library-page.constants.ajs.ts */ "./core/templates/dev/head/pages/library-page/library-page.constants.ajs.ts");
angular.module('oppia').directive('libraryPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/library-page/library-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$http', '$log', '$rootScope', '$scope', '$timeout', '$uibModal',
                '$window', 'AlertsService', 'ConstructTranslationIdsService',
                'LearnerDashboardActivityIdsObjectFactory',
                'LearnerDashboardIdsBackendApiService', 'LearnerPlaylistService',
                'PageTitleService', 'SearchService',
                'UrlInterpolationService', 'UrlService', 'UserService',
                'WindowDimensionsService', 'ALL_CATEGORIES',
                'LIBRARY_PAGE_MODES', 'LIBRARY_PATHS_TO_MODES', 'LIBRARY_TILE_WIDTH_PX',
                function ($http, $log, $rootScope, $scope, $timeout, $uibModal, $window, AlertsService, ConstructTranslationIdsService, LearnerDashboardActivityIdsObjectFactory, LearnerDashboardIdsBackendApiService, LearnerPlaylistService, PageTitleService, SearchService, UrlInterpolationService, UrlService, UserService, WindowDimensionsService, ALL_CATEGORIES, LIBRARY_PAGE_MODES, LIBRARY_PATHS_TO_MODES, LIBRARY_TILE_WIDTH_PX) {
                    var ctrl = this;
                    $rootScope.loadingMessage = 'I18N_LIBRARY_LOADING';
                    var possibleBannerFilenames = [
                        'banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'
                    ];
                    ctrl.bannerImageFilename = possibleBannerFilenames[Math.floor(Math.random() * possibleBannerFilenames.length)];
                    ctrl.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl('/library/' + ctrl.bannerImageFilename);
                    ctrl.activeGroupIndex = null;
                    var currentPath = $window.location.pathname;
                    if (!LIBRARY_PATHS_TO_MODES.hasOwnProperty(currentPath)) {
                        $log.error('INVALID URL PATH: ' + currentPath);
                    }
                    ctrl.pageMode = LIBRARY_PATHS_TO_MODES[currentPath];
                    ctrl.LIBRARY_PAGE_MODES = LIBRARY_PAGE_MODES;
                    var title = 'Exploration Library - Oppia';
                    if (ctrl.pageMode === LIBRARY_PAGE_MODES.GROUP ||
                        ctrl.pageMode === LIBRARY_PAGE_MODES.SEARCH) {
                        title = 'Find explorations to learn from - Oppia';
                    }
                    PageTitleService.setPageTitle(title);
                    // Keeps track of the index of the left-most visible card of each
                    // group.
                    ctrl.leftmostCardIndices = [];
                    if (ctrl.pageMode === LIBRARY_PAGE_MODES.GROUP) {
                        var pathnameArray = $window.location.pathname.split('/');
                        ctrl.groupName = pathnameArray[2];
                        $http.get('/librarygrouphandler', {
                            params: {
                                group_name: ctrl.groupName
                            }
                        }).success(function (data) {
                            ctrl.activityList = data.activity_list;
                            ctrl.groupHeaderI18nId = data.header_i18n_id;
                            $rootScope.$broadcast('preferredLanguageCodesLoaded', data.preferred_language_codes);
                            $rootScope.loadingMessage = '';
                        });
                    }
                    else {
                        $http.get('/libraryindexhandler').success(function (data) {
                            ctrl.libraryGroups = data.activity_summary_dicts_by_category;
                            UserService.getUserInfoAsync().then(function (userInfo) {
                                ctrl.activitiesOwned = { explorations: {}, collections: {} };
                                if (userInfo.isLoggedIn()) {
                                    $http.get('/creatordashboardhandler/data')
                                        .then(function (response) {
                                        ctrl.libraryGroups.forEach(function (libraryGroup) {
                                            var activitySummaryDicts = (libraryGroup.activity_summary_dicts);
                                            var ACTIVITY_TYPE_EXPLORATION = 'exploration';
                                            var ACTIVITY_TYPE_COLLECTION = 'collection';
                                            activitySummaryDicts.forEach(function (activitySummaryDict) {
                                                if (activitySummaryDict.activity_type === (ACTIVITY_TYPE_EXPLORATION)) {
                                                    ctrl.activitiesOwned.explorations[activitySummaryDict.id] = false;
                                                }
                                                else if (activitySummaryDict.activity_type === (ACTIVITY_TYPE_COLLECTION)) {
                                                    ctrl.activitiesOwned.collections[activitySummaryDict.id] = false;
                                                }
                                                else {
                                                    $log.error('INVALID ACTIVITY TYPE: Activity' +
                                                        '(id: ' + activitySummaryDict.id +
                                                        ', name: ' + activitySummaryDict.title +
                                                        ', type: ' + activitySummaryDict.activity_type +
                                                        ') has an invalid activity type, which could ' +
                                                        'not be recorded as an exploration or a collection.');
                                                }
                                            });
                                            response.data.explorations_list
                                                .forEach(function (ownedExplorations) {
                                                ctrl.activitiesOwned.explorations[ownedExplorations.id] = true;
                                            });
                                            response.data.collections_list
                                                .forEach(function (ownedCollections) {
                                                ctrl.activitiesOwned.collections[ownedCollections.id] = true;
                                            });
                                        });
                                        $rootScope.loadingMessage = '';
                                    });
                                }
                                else {
                                    $rootScope.loadingMessage = '';
                                }
                            });
                            $rootScope.$broadcast('preferredLanguageCodesLoaded', data.preferred_language_codes);
                            // Initialize the carousel(s) on the library index page.
                            // Pause is necessary to ensure all elements have loaded.
                            $timeout(initCarousels, 390);
                            // Check if actual and expected widths are the same.
                            // If not produce an error that would be caught by e2e tests.
                            $timeout(function () {
                                var actualWidth = $('exploration-summary-tile').width();
                                if (actualWidth && actualWidth !== LIBRARY_TILE_WIDTH_PX) {
                                    console.error('The actual width of tile is different than the expected ' +
                                        'width. Actual size: ' + actualWidth + ', Expected size: ' +
                                        LIBRARY_TILE_WIDTH_PX);
                                }
                            }, 3000);
                            // The following initializes the tracker to have all
                            // elements flush left.
                            // Transforms the group names into translation ids
                            ctrl.leftmostCardIndices = [];
                            for (var i = 0; i < ctrl.libraryGroups.length; i++) {
                                ctrl.leftmostCardIndices.push(0);
                            }
                        });
                    }
                    ctrl.setActiveGroup = function (groupIndex) {
                        ctrl.activeGroupIndex = groupIndex;
                    };
                    ctrl.clearActiveGroup = function () {
                        ctrl.activeGroupIndex = null;
                    };
                    // If the value below is changed, the following CSS values in
                    // oppia.css must be changed:
                    // - .oppia-exp-summary-tiles-container: max-width
                    // - .oppia-library-carousel: max-width
                    var MAX_NUM_TILES_PER_ROW = 4;
                    ctrl.tileDisplayCount = 0;
                    var initCarousels = function () {
                        // This prevents unnecessary execution of this method immediately
                        // after a window resize event is fired.
                        if (!ctrl.libraryGroups) {
                            return;
                        }
                        var windowWidth = $(window).width() * 0.85;
                        // The number 20 is added to LIBRARY_TILE_WIDTH_PX in order to
                        // compensate for padding and margins. 20 is just an arbitrary
                        // number.
                        ctrl.tileDisplayCount = Math.min(Math.floor(windowWidth / (LIBRARY_TILE_WIDTH_PX + 20)), MAX_NUM_TILES_PER_ROW);
                        $('.oppia-library-carousel').css({
                            width: (ctrl.tileDisplayCount * LIBRARY_TILE_WIDTH_PX) + 'px'
                        });
                        // The following determines whether to enable left scroll after
                        // resize.
                        for (var i = 0; i < ctrl.libraryGroups.length; i++) {
                            var carouselJQuerySelector = ('.oppia-library-carousel-tiles:eq(n)'.replace('n', i));
                            var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
                            var index = Math.ceil(carouselScrollPositionPx / LIBRARY_TILE_WIDTH_PX);
                            ctrl.leftmostCardIndices[i] = index;
                        }
                    };
                    var isAnyCarouselCurrentlyScrolling = false;
                    ctrl.scroll = function (ind, isLeftScroll) {
                        if (isAnyCarouselCurrentlyScrolling) {
                            return;
                        }
                        var carouselJQuerySelector = ('.oppia-library-carousel-tiles:eq(n)'.replace('n', ind));
                        var direction = isLeftScroll ? -1 : 1;
                        var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
                        // Prevent scrolling if there more carousel pixed widths than
                        // there are tile widths.
                        if (ctrl.libraryGroups[ind].activity_summary_dicts.length <=
                            ctrl.tileDisplayCount) {
                            return;
                        }
                        carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);
                        if (isLeftScroll) {
                            ctrl.leftmostCardIndices[ind] = Math.max(0, ctrl.leftmostCardIndices[ind] - ctrl.tileDisplayCount);
                        }
                        else {
                            ctrl.leftmostCardIndices[ind] = Math.min(ctrl.libraryGroups[ind].activity_summary_dicts.length -
                                ctrl.tileDisplayCount + 1, ctrl.leftmostCardIndices[ind] + ctrl.tileDisplayCount);
                        }
                        var newScrollPositionPx = carouselScrollPositionPx +
                            (ctrl.tileDisplayCount * LIBRARY_TILE_WIDTH_PX * direction);
                        $(carouselJQuerySelector).animate({
                            scrollLeft: newScrollPositionPx
                        }, {
                            duration: 800,
                            queue: false,
                            start: function () {
                                isAnyCarouselCurrentlyScrolling = true;
                            },
                            complete: function () {
                                isAnyCarouselCurrentlyScrolling = false;
                            }
                        });
                    };
                    // The carousels do not work when the width is 1 card long, so we need
                    // to handle this case discretely and also prevent swiping past the
                    // first and last card.
                    ctrl.incrementLeftmostCardIndex = function (ind) {
                        var lastItem = ((ctrl.libraryGroups[ind].activity_summary_dicts.length -
                            ctrl.tileDisplayCount) <= ctrl.leftmostCardIndices[ind]);
                        if (!lastItem) {
                            ctrl.leftmostCardIndices[ind]++;
                        }
                    };
                    ctrl.decrementLeftmostCardIndex = function (ind) {
                        ctrl.leftmostCardIndices[ind] = (Math.max(ctrl.leftmostCardIndices[ind] - 1, 0));
                    };
                    $(window).resize(function () {
                        initCarousels();
                        // This is needed, otherwise ctrl.tileDisplayCount takes a long
                        // time (several seconds) to update.
                        $scope.$apply();
                    });
                    var activateSearchMode = function () {
                        if (ctrl.pageMode !== LIBRARY_PAGE_MODES.SEARCH) {
                            $('.oppia-library-container').fadeOut(function () {
                                ctrl.pageMode = LIBRARY_PAGE_MODES.SEARCH;
                                $timeout(function () {
                                    $('.oppia-library-container').fadeIn();
                                }, 50);
                            });
                        }
                    };
                    // The following loads explorations belonging to a particular group.
                    // If fullResultsUrl is given it loads the page corresponding to
                    // the url. Otherwise, it will initiate a search query for the
                    // given list of categories.
                    ctrl.showFullResultsPage = function (categories, fullResultsUrl) {
                        if (fullResultsUrl) {
                            $window.location.href = fullResultsUrl;
                        }
                        else {
                            var selectedCategories = {};
                            for (var i = 0; i < categories.length; i++) {
                                selectedCategories[categories[i]] = true;
                            }
                            var targetSearchQueryUrl = SearchService.getSearchUrlQueryString('', selectedCategories, {});
                            $window.location.href = '/search/find?q=' + targetSearchQueryUrl;
                        }
                    };
                    var libraryWindowCutoffPx = 530;
                    ctrl.libraryWindowIsNarrow = (WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
                    WindowDimensionsService.registerOnResizeHook(function () {
                        ctrl.libraryWindowIsNarrow = (WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
                        $scope.$apply();
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/library-page.module.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/library-page.module.ts ***!
  \***************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Module for the library page.
 */
__webpack_require__(/*! core-js/es7/reflect */ "./node_modules/core-js/es7/reflect.js");
__webpack_require__(/*! zone.js */ "./node_modules/zone.js/dist/zone.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var platform_browser_1 = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var http_1 = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
// This component is needed to force-bootstrap Angular at the beginning of the
// app.
var ServiceBootstrapComponent = /** @class */ (function () {
    function ServiceBootstrapComponent() {
    }
    ServiceBootstrapComponent = __decorate([
        core_1.Component({
            selector: 'service-bootstrap',
            template: ''
        })
    ], ServiceBootstrapComponent);
    return ServiceBootstrapComponent;
}());
exports.ServiceBootstrapComponent = ServiceBootstrapComponent;
var app_constants_1 = __webpack_require__(/*! app.constants */ "./core/templates/dev/head/app.constants.ts");
var collection_summary_tile_constants_1 = __webpack_require__(/*! components/summary-tile/collection-summary-tile.constants */ "./core/templates/dev/head/components/summary-tile/collection-summary-tile.constants.ts");
var interactions_extension_constants_1 = __webpack_require__(/*! interactions/interactions-extension.constants */ "./extensions/interactions/interactions-extension.constants.ts");
var objects_domain_constants_1 = __webpack_require__(/*! domain/objects/objects-domain.constants */ "./core/templates/dev/head/domain/objects/objects-domain.constants.ts");
var services_constants_1 = __webpack_require__(/*! services/services.constants */ "./core/templates/dev/head/services/services.constants.ts");
var library_page_constants_1 = __webpack_require__(/*! pages/library-page/library-page.constants */ "./core/templates/dev/head/pages/library-page/library-page.constants.ts");
var LibraryPageModule = /** @class */ (function () {
    function LibraryPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    LibraryPageModule.prototype.ngDoBootstrap = function () { };
    LibraryPageModule = __decorate([
        core_1.NgModule({
            imports: [
                platform_browser_1.BrowserModule,
                http_1.HttpClientModule
            ],
            declarations: [
                ServiceBootstrapComponent
            ],
            entryComponents: [
                ServiceBootstrapComponent
            ],
            providers: [
                app_constants_1.AppConstants,
                collection_summary_tile_constants_1.CollectionSummaryTileConstants,
                interactions_extension_constants_1.InteractionsExtensionsConstants,
                objects_domain_constants_1.ObjectsDomainConstants,
                services_constants_1.ServicesConstants,
                library_page_constants_1.LibraryPageConstants
            ]
        })
    ], LibraryPageModule);
    return LibraryPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(LibraryPageModule);
};
var downgradedModule = static_2.downgradeModule(bootstrapFn);
angular.module('oppia', [
    'dndLists', 'headroom', 'infinite-scroll', 'ngAnimate',
    'ngAudio', 'ngCookies', 'ngImgCrop', 'ngJoyRide', 'ngMaterial',
    'ngResource', 'ngSanitize', 'ngTouch', 'pascalprecht.translate',
    'toastr', 'ui.bootstrap', 'ui.sortable', 'ui.tree', 'ui.validate',
    downgradedModule
])
    // This directive is the downgraded version of the Angular component to
    // bootstrap the Angular 8.
    .directive('serviceBootstrap', static_1.downgradeComponent({
    component: ServiceBootstrapComponent
}));


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/library-page.scripts.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/library-page.scripts.ts ***!
  \****************************************************************************/
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
 * @fileoverview Directives required in library.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/library-page/library-page.module.ts */ "./core/templates/dev/head/pages/library-page/library-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! pages/library-page/library-page.directive.ts */ "./core/templates/dev/head/pages/library-page/library-page.directive.ts");
__webpack_require__(/*! pages/library-page/library-footer/library-footer.directive.ts */ "./core/templates/dev/head/pages/library-page/library-footer/library-footer.directive.ts");
__webpack_require__(/*! pages/library-page/search-bar/search-bar.directive.ts */ "./core/templates/dev/head/pages/library-page/search-bar/search-bar.directive.ts");


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/search-bar/search-bar.directive.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/search-bar/search-bar.directive.ts ***!
  \***************************************************************************************/
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
 * @fileoverview Directive for the Search Bar.
 */
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
__webpack_require__(/*! domain/utilities/LanguageUtilService.ts */ "./core/templates/dev/head/domain/utilities/LanguageUtilService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/ConstructTranslationIdsService.ts */ "./core/templates/dev/head/services/ConstructTranslationIdsService.ts");
__webpack_require__(/*! services/DebouncerService.ts */ "./core/templates/dev/head/services/DebouncerService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
__webpack_require__(/*! services/NavigationService.ts */ "./core/templates/dev/head/services/NavigationService.ts");
__webpack_require__(/*! services/SearchService.ts */ "./core/templates/dev/head/services/SearchService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('oppia').directive('searchBar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/library-page/search-bar/search-bar.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$location', '$rootScope', '$scope', '$timeout', '$translate',
                '$window', 'ConstructTranslationIdsService', 'DebouncerService',
                'HtmlEscaperService', 'LanguageUtilService', 'NavigationService',
                'SearchService', 'UrlService', 'SEARCH_DROPDOWN_CATEGORIES',
                function ($location, $rootScope, $scope, $timeout, $translate, $window, ConstructTranslationIdsService, DebouncerService, HtmlEscaperService, LanguageUtilService, NavigationService, SearchService, UrlService, SEARCH_DROPDOWN_CATEGORIES) {
                    var ctrl = this;
                    ctrl.isSearchInProgress = SearchService.isSearchInProgress;
                    ctrl.SEARCH_DROPDOWN_CATEGORIES = (SEARCH_DROPDOWN_CATEGORIES.map(function (categoryName) {
                        return {
                            id: categoryName,
                            text: ConstructTranslationIdsService.getLibraryId('categories', categoryName)
                        };
                    }));
                    ctrl.ACTION_OPEN = NavigationService.ACTION_OPEN;
                    ctrl.ACTION_CLOSE = NavigationService.ACTION_CLOSE;
                    ctrl.KEYBOARD_EVENT_TO_KEY_CODES =
                        NavigationService.KEYBOARD_EVENT_TO_KEY_CODES;
                    /**
                     * Opens the submenu.
                     * @param {object} evt
                     * @param {String} menuName - name of menu, on which
                     * open/close action to be performed (category,language).
                     */
                    ctrl.openSubmenu = function (evt, menuName) {
                        NavigationService.openSubmenu(evt, menuName);
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
                    ctrl.onMenuKeypress = function (evt, menuName, eventsTobeHandled) {
                        NavigationService.onMenuKeypress(evt, menuName, eventsTobeHandled);
                        ctrl.activeMenuName = NavigationService.activeMenuName;
                    };
                    ctrl.ALL_LANGUAGE_CODES = (LanguageUtilService.getLanguageIdsAndTexts());
                    ctrl.searchQuery = '';
                    ctrl.selectionDetails = {
                        categories: {
                            description: '',
                            itemsName: 'categories',
                            masterList: ctrl.SEARCH_DROPDOWN_CATEGORIES,
                            numSelections: 0,
                            selections: {},
                            summary: ''
                        },
                        languageCodes: {
                            description: '',
                            itemsName: 'languages',
                            masterList: ctrl.ALL_LANGUAGE_CODES,
                            numSelections: 0,
                            selections: {},
                            summary: ''
                        }
                    };
                    // Non-translatable parts of the html strings, like numbers or user
                    // names.
                    ctrl.translationData = {};
                    // Update the description, numSelections and summary fields of the
                    // relevant entry of ctrl.selectionDetails.
                    var updateSelectionDetails = function (itemsType) {
                        var itemsName = ctrl.selectionDetails[itemsType].itemsName;
                        var masterList = ctrl.selectionDetails[itemsType].masterList;
                        var selectedItems = [];
                        for (var i = 0; i < masterList.length; i++) {
                            if (ctrl.selectionDetails[itemsType]
                                .selections[masterList[i].id]) {
                                selectedItems.push(masterList[i].text);
                            }
                        }
                        var totalCount = selectedItems.length;
                        ctrl.selectionDetails[itemsType].numSelections = totalCount;
                        ctrl.selectionDetails[itemsType].summary = (totalCount === 0 ? 'I18N_LIBRARY_ALL_' + itemsName.toUpperCase() :
                            totalCount === 1 ? selectedItems[0] :
                                'I18N_LIBRARY_N_' + itemsName.toUpperCase());
                        ctrl.translationData[itemsName + 'Count'] = totalCount;
                        // TODO(milit): When the language changes, the translations won't
                        // change until the user changes the selection and this function is
                        // re-executed.
                        if (selectedItems.length > 0) {
                            var translatedItems = [];
                            for (var i = 0; i < selectedItems.length; i++) {
                                translatedItems.push($translate.instant(selectedItems[i]));
                            }
                            ctrl.selectionDetails[itemsType].description = (translatedItems.join(', '));
                        }
                        else {
                            ctrl.selectionDetails[itemsType].description = ('I18N_LIBRARY_ALL_' + itemsName.toUpperCase() + '_SELECTED');
                        }
                    };
                    ctrl.toggleSelection = function (itemsType, optionName) {
                        var selections = ctrl.selectionDetails[itemsType].selections;
                        if (!selections.hasOwnProperty(optionName)) {
                            selections[optionName] = true;
                        }
                        else {
                            selections[optionName] = !selections[optionName];
                        }
                        updateSelectionDetails(itemsType);
                        onSearchQueryChangeExec();
                    };
                    ctrl.deselectAll = function (itemsType) {
                        ctrl.selectionDetails[itemsType].selections = {};
                        updateSelectionDetails(itemsType);
                        onSearchQueryChangeExec();
                    };
                    $scope.$watch('$ctrl.searchQuery', function (newQuery, oldQuery) {
                        // Run only if the query has changed.
                        if (newQuery !== oldQuery) {
                            onSearchQueryChangeExec();
                        }
                    });
                    var onSearchQueryChangeExec = function () {
                        SearchService.executeSearchQuery(ctrl.searchQuery, ctrl.selectionDetails.categories.selections, ctrl.selectionDetails.languageCodes.selections);
                        var searchUrlQueryString = SearchService.getSearchUrlQueryString(ctrl.searchQuery, ctrl.selectionDetails.categories.selections, ctrl.selectionDetails.languageCodes.selections);
                        if ($window.location.pathname === '/search/find') {
                            $location.url('/find?q=' + searchUrlQueryString);
                        }
                        else {
                            $window.location.href = '/search/find?q=' + searchUrlQueryString;
                        }
                    };
                    // Initialize the selection descriptions and summaries.
                    for (var itemsType in ctrl.selectionDetails) {
                        updateSelectionDetails(itemsType);
                    }
                    var updateSearchFieldsBasedOnUrlQuery = function () {
                        var oldQueryString = SearchService.getCurrentUrlQueryString();
                        ctrl.selectionDetails.categories.selections = {};
                        ctrl.selectionDetails.languageCodes.selections = {};
                        ctrl.searchQuery =
                            SearchService.updateSearchFieldsBasedOnUrlQuery($window.location.search, ctrl.selectionDetails);
                        updateSelectionDetails('categories');
                        updateSelectionDetails('languageCodes');
                        var newQueryString = SearchService.getCurrentUrlQueryString();
                        if (oldQueryString !== newQueryString) {
                            onSearchQueryChangeExec();
                        }
                    };
                    $scope.$on('$locationChangeSuccess', function () {
                        if (UrlService.getUrlParams().hasOwnProperty('q')) {
                            updateSearchFieldsBasedOnUrlQuery();
                        }
                    });
                    $scope.$on('preferredLanguageCodesLoaded', function (evt, preferredLanguageCodesList) {
                        preferredLanguageCodesList.forEach(function (languageCode) {
                            var selections = ctrl.selectionDetails.languageCodes.selections;
                            if (!selections.hasOwnProperty(languageCode)) {
                                selections[languageCode] = true;
                            }
                            else {
                                selections[languageCode] = !selections[languageCode];
                            }
                        });
                        updateSelectionDetails('languageCodes');
                        if (UrlService.getUrlParams().hasOwnProperty('q')) {
                            updateSearchFieldsBasedOnUrlQuery();
                        }
                        if ($window.location.pathname === '/search/find') {
                            onSearchQueryChangeExec();
                        }
                        refreshSearchBarLabels();
                        // Notify the function that handles overflow in case the search
                        // elements load after it has already been run.
                        $rootScope.$broadcast('searchBarLoaded', true);
                    });
                    var refreshSearchBarLabels = function () {
                        // If you translate these strings in the html, then you must use a
                        // filter because only the first 14 characters are displayed. That
                        // would generate FOUC for languages other than English. As an
                        // exception, we translate them here and update the translation
                        // every time the language is changed.
                        ctrl.searchBarPlaceholder = $translate.instant('I18N_LIBRARY_SEARCH_PLACEHOLDER');
                        // 'messageformat' is the interpolation method for plural forms.
                        // http://angular-translate.github.io/docs/#/guide/14_pluralization.
                        ctrl.categoryButtonText = $translate.instant(ctrl.selectionDetails.categories.summary, ctrl.translationData, 'messageformat');
                        ctrl.languageButtonText = $translate.instant(ctrl.selectionDetails.languageCodes.summary, ctrl.translationData, 'messageformat');
                    };
                    $rootScope.$on('$translateChangeSuccess', refreshSearchBarLabels);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/search-results/activity-tiles-infinity-grid.directive.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/search-results/activity-tiles-infinity-grid.directive.ts ***!
  \*************************************************************************************************************/
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
 * @fileoverview Directive for an infinitely-scrollable view of activity tiles
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/SearchService.ts */ "./core/templates/dev/head/services/SearchService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('oppia').directive('activityTilesInfinityGrid', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/library-page/search-results/' +
                'activity-tiles-infinity-grid.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$rootScope', 'SearchService', 'WindowDimensionsService',
                function ($scope, $rootScope, SearchService, WindowDimensionsService) {
                    var ctrl = this;
                    ctrl.endOfPageIsReached = false;
                    ctrl.allActivitiesInOrder = [];
                    // Called when the first batch of search results is retrieved from the
                    // server.
                    $scope.$on('initialSearchResultsLoaded', function (evt, activityList) {
                        ctrl.allActivitiesInOrder = activityList;
                        ctrl.endOfPageIsReached = false;
                    });
                    ctrl.showMoreActivities = function () {
                        if (!$rootScope.loadingMessage && !ctrl.endOfPageIsReached) {
                            ctrl.searchResultsAreLoading = true;
                            SearchService.loadMoreData(function (data, endOfPageIsReached) {
                                ctrl.allActivitiesInOrder =
                                    ctrl.allActivitiesInOrder.concat(data.activity_list);
                                ctrl.endOfPageIsReached = endOfPageIsReached;
                                ctrl.searchResultsAreLoading = false;
                            }, function (endOfPageIsReached) {
                                ctrl.endOfPageIsReached = endOfPageIsReached;
                                ctrl.searchResultsAreLoading = false;
                            });
                        }
                    };
                    var libraryWindowCutoffPx = 530;
                    ctrl.libraryWindowIsNarrow = (WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
                    WindowDimensionsService.registerOnResizeHook(function () {
                        ctrl.libraryWindowIsNarrow = (WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
                        $scope.$apply();
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/search-results/search-results.directive.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/search-results/search-results.directive.ts ***!
  \***********************************************************************************************/
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
 * @fileoverview Directive for showing search results.
 */
__webpack_require__(/*! pages/library-page/search-results/activity-tiles-infinity-grid.directive.ts */ "./core/templates/dev/head/pages/library-page/search-results/activity-tiles-infinity-grid.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('oppia').directive('searchResults', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/library-page/search-results/search-results.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$rootScope', '$q', '$timeout', '$window',
                'SiteAnalyticsService', 'UserService',
                function ($scope, $rootScope, $q, $timeout, $window, SiteAnalyticsService, UserService) {
                    var ctrl = this;
                    ctrl.someResultsExist = true;
                    ctrl.userIsLoggedIn = null;
                    $rootScope.loadingMessage = 'Loading';
                    var userInfoPromise = UserService.getUserInfoAsync();
                    userInfoPromise.then(function (userInfo) {
                        ctrl.userIsLoggedIn = userInfo.isLoggedIn();
                    });
                    // Called when the first batch of search results is retrieved from the
                    // server.
                    var searchResultsPromise = $scope.$on('initialSearchResultsLoaded', function (evt, activityList) {
                        ctrl.someResultsExist = activityList.length > 0;
                    });
                    $q.all([userInfoPromise, searchResultsPromise]).then(function () {
                        $rootScope.loadingMessage = '';
                    });
                    ctrl.onRedirectToLogin = function (destinationUrl) {
                        SiteAnalyticsService.registerStartLoginEvent('noSearchResults');
                        $timeout(function () {
                            $window.location = destinationUrl;
                        }, 150);
                        return false;
                    };
                    ctrl.noExplorationsImgUrl =
                        UrlInterpolationService.getStaticImageUrl('/general/no_explorations_found.png');
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/PageTitleService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/PageTitleService.ts ***!
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Service to set the title of the page.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var platform_browser_1 = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
var PageTitleService = /** @class */ (function () {
    function PageTitleService(titleService) {
        this.titleService = titleService;
    }
    PageTitleService.prototype.setPageTitle = function (title) {
        this.titleService.setTitle(title);
    };
    var _a;
    PageTitleService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof platform_browser_1.Title !== "undefined" && platform_browser_1.Title) === "function" ? _a : Object])
    ], PageTitleService);
    return PageTitleService;
}());
exports.PageTitleService = PageTitleService;
angular.module('oppia').factory('PageTitleService', static_1.downgradeInjectable(PageTitleService));


/***/ }),

/***/ "./core/templates/dev/head/services/SearchService.ts":
/*!***********************************************************!*\
  !*** ./core/templates/dev/head/services/SearchService.ts ***!
  \***********************************************************/
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
 * @fileoverview search service for activityTilesInfinityGrid
 */
__webpack_require__(/*! services/services.constants.ajs.ts */ "./core/templates/dev/head/services/services.constants.ajs.ts");
angular.module('oppia').factory('SearchService', [
    '$http', '$log', '$rootScope', '$translate', 'SEARCH_DATA_URL',
    function ($http, $log, $rootScope, $translate, SEARCH_DATA_URL) {
        var _lastQuery = null;
        var _lastSelectedCategories = {};
        var _lastSelectedLanguageCodes = {};
        var _searchCursor = null;
        // Appends a suffix to the query describing allowed category and language
        // codes to filter on.
        var _getSuffixForQuery = function (selectedCategories, selectedLanguageCodes) {
            var querySuffix = '';
            var _categories = '';
            for (var key in selectedCategories) {
                if (selectedCategories[key]) {
                    if (_categories) {
                        _categories += '" OR "';
                    }
                    _categories += key;
                }
            }
            if (_categories) {
                querySuffix += '&category=("' + _categories + '")';
            }
            var _languageCodes = '';
            for (var key in selectedLanguageCodes) {
                if (selectedLanguageCodes[key]) {
                    if (_languageCodes) {
                        _languageCodes += '" OR "';
                    }
                    _languageCodes += key;
                }
            }
            if (_languageCodes) {
                querySuffix += '&language_code=("' + _languageCodes + '")';
            }
            return querySuffix;
        };
        var hasReachedEndOfPage = function () {
            return _searchCursor === null;
        };
        var updateSearchFields = function (itemsType, urlComponent, selectionDetails) {
            var itemCodeGroup = urlComponent.match(/=\("[A-Za-z%20" ]+"\)/);
            var itemCodes = itemCodeGroup ? itemCodeGroup[0] : null;
            var EXPECTED_PREFIX = '=("';
            var EXPECTED_SUFFIX = '")';
            if (!itemCodes ||
                itemCodes.indexOf(EXPECTED_PREFIX) !== 0 ||
                itemCodes.lastIndexOf(EXPECTED_SUFFIX) !==
                    itemCodes.length - EXPECTED_SUFFIX.length) {
                throw Error('Invalid search query url fragment for ' +
                    itemsType + ': ' + urlComponent);
            }
            var items = itemCodes.substring(EXPECTED_PREFIX.length, itemCodes.length - EXPECTED_SUFFIX.length).split('" OR "');
            var selections = selectionDetails[itemsType].selections;
            for (var i = 0; i < items.length; i++) {
                selections[items[i]] = true;
            }
        };
        var _isCurrentlyFetchingResults = false;
        var numSearchesInProgress = 0;
        var getQueryUrl = function (searchUrlQueryString) {
            return SEARCH_DATA_URL + '?q=' + searchUrlQueryString;
        };
        return {
            getSearchUrlQueryString: function (searchQuery, selectedCategories, selectedLanguageCodes) {
                return encodeURIComponent(searchQuery) +
                    _getSuffixForQuery(selectedCategories, selectedLanguageCodes);
            },
            // Note that an empty query results in all activities being shown.
            executeSearchQuery: function (searchQuery, selectedCategories, selectedLanguageCodes, successCallback) {
                var queryUrl = getQueryUrl(this.getSearchUrlQueryString(searchQuery, selectedCategories, selectedLanguageCodes));
                _isCurrentlyFetchingResults = true;
                numSearchesInProgress++;
                $http.get(queryUrl).then(function (response) {
                    var data = response.data;
                    _lastQuery = searchQuery;
                    _lastSelectedCategories = angular.copy(selectedCategories);
                    _lastSelectedLanguageCodes = angular.copy(selectedLanguageCodes);
                    _searchCursor = data.search_cursor;
                    numSearchesInProgress--;
                    $rootScope.$broadcast('initialSearchResultsLoaded', data.activity_list);
                    _isCurrentlyFetchingResults = false;
                    var checkMismatch = function (searchQuery) {
                        var isMismatch = true;
                        $('.oppia-search-bar-input').each(function (index) {
                            if ($(this).val().trim() === searchQuery) {
                                isMismatch = false;
                            }
                        });
                        return isMismatch;
                    };
                    if (checkMismatch(searchQuery)) {
                        $log.error('Mismatch');
                        $log.error('SearchQuery: ' + searchQuery);
                        $log.error('Input: ' + $('.oppia-search-bar-input').val().trim());
                    }
                }, function () {
                    numSearchesInProgress--;
                });
                // Translate the new explorations loaded.
                $translate.refresh();
                if (successCallback) {
                    successCallback();
                }
            },
            isSearchInProgress: function () {
                return numSearchesInProgress > 0;
            },
            // The following takes in the url search component as an argument and the
            // selectionDetails. It will update selectionDetails with the relevant
            // fields that were extracted from the url. It returns the unencoded
            // search query string.
            updateSearchFieldsBasedOnUrlQuery: function (urlComponent, selectionDetails) {
                var urlQuery = urlComponent.substring('?q='.length);
                // The following will split the urlQuery into 3 components:
                // 1. query
                // 2. categories (optional)
                // 3. language codes (default to 'en')
                var querySegments = urlQuery.split('&');
                for (var i = 1; i < querySegments.length; i++) {
                    urlComponent = decodeURIComponent(querySegments[i]);
                    var itemsType = null;
                    if (urlComponent.indexOf('category') === 0) {
                        itemsType = 'categories';
                    }
                    else if (urlComponent.indexOf('language_code') === 0) {
                        itemsType = 'languageCodes';
                    }
                    else {
                        continue;
                    }
                    try {
                        updateSearchFields(itemsType, urlComponent, selectionDetails);
                    }
                    catch (error) {
                        selectionDetails[itemsType].selections = {};
                        throw error;
                    }
                }
                return decodeURIComponent(querySegments[0]);
            },
            getCurrentUrlQueryString: function () {
                return this.getSearchUrlQueryString(_lastQuery, _lastSelectedCategories, _lastSelectedLanguageCodes);
            },
            loadMoreData: function (successCallback, failureCallback) {
                // If a new query is still being sent, or the end of the page has been
                // reached, do not fetch more results.
                if (_isCurrentlyFetchingResults || hasReachedEndOfPage()) {
                    failureCallback(hasReachedEndOfPage());
                    return;
                }
                var queryUrl = getQueryUrl(this.getCurrentUrlQueryString());
                if (_searchCursor) {
                    queryUrl += '&cursor=' + _searchCursor;
                }
                _isCurrentlyFetchingResults = true;
                $http.get(queryUrl).then(function (response) {
                    _searchCursor = response.data.search_cursor;
                    _isCurrentlyFetchingResults = false;
                    if (successCallback) {
                        successCallback(response.data, hasReachedEndOfPage());
                    }
                });
            }
        };
    }
]);


/***/ }),

/***/ "./extensions/interactions/interactions-extension.constants.ts":
/*!*********************************************************************!*\
  !*** ./extensions/interactions/interactions-extension.constants.ts ***!
  \*********************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for interactions extensions.
 */
var InteractionsExtensionsConstants = /** @class */ (function () {
    function InteractionsExtensionsConstants() {
    }
    // Minimum confidence required for a predicted answer group to be shown to
    // user. Generally a threshold of 0.7-0.8 is assumed to be a good one in
    // practice, however value need not be in those bounds.
    InteractionsExtensionsConstants.CODE_REPL_PREDICTION_SERVICE_THRESHOLD = 0.7;
    InteractionsExtensionsConstants.GRAPH_INPUT_LEFT_MARGIN = 120;
    // Gives the staff-lines human readable values.
    InteractionsExtensionsConstants.NOTE_NAMES_TO_MIDI_VALUES = {
        A5: 81,
        G5: 79,
        F5: 77,
        E5: 76,
        D5: 74,
        C5: 72,
        B4: 71,
        A4: 69,
        G4: 67,
        F4: 65,
        E4: 64,
        D4: 62,
        C4: 60
    };
    // Minimum confidence required for a predicted answer group to be shown to
    // user. Generally a threshold of 0.7-0.8 is assumed to be a good one in
    // practice, however value need not be in those bounds.
    InteractionsExtensionsConstants.TEXT_INPUT_PREDICTION_SERVICE_THRESHOLD = 0.7;
    return InteractionsExtensionsConstants;
}());
exports.InteractionsExtensionsConstants = InteractionsExtensionsConstants;


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy9sb2FkaW5nLWRvdHMuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3VtbWFyeS10aWxlL2NvbGxlY3Rpb24tc3VtbWFyeS10aWxlLmNvbnN0YW50cy5hanMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3VtbWFyeS10aWxlL2NvbGxlY3Rpb24tc3VtbWFyeS10aWxlLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9sZWFybmVyX2Rhc2hib2FyZC9MZWFybmVyUGxheWxpc3RTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9PcHBpYUZvb3RlckRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1mb290ZXIvbGlicmFyeS1mb290ZXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2xpYnJhcnktcGFnZS9saWJyYXJ5LXBhZ2UuY29uc3RhbnRzLmFqcy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1wYWdlLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1wYWdlLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1wYWdlLnNjcmlwdHMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbGlicmFyeS1wYWdlL3NlYXJjaC1iYXIvc2VhcmNoLWJhci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbGlicmFyeS1wYWdlL3NlYXJjaC1yZXN1bHRzL2FjdGl2aXR5LXRpbGVzLWluZmluaXR5LWdyaWQuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2xpYnJhcnktcGFnZS9zZWFyY2gtcmVzdWx0cy9zZWFyY2gtcmVzdWx0cy5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvUGFnZVRpdGxlU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9TZWFyY2hTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEIiwiZmlsZSI6ImxpYnJhcnkuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuXG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcImxpYnJhcnlcIjogMFxuIFx0fTtcblxuIFx0dmFyIGRlZmVycmVkTW9kdWxlcyA9IFtdO1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHR2YXIganNvbnBBcnJheSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSB8fCBbXTtcbiBcdHZhciBvbGRKc29ucEZ1bmN0aW9uID0ganNvbnBBcnJheS5wdXNoLmJpbmQoanNvbnBBcnJheSk7XG4gXHRqc29ucEFycmF5LnB1c2ggPSB3ZWJwYWNrSnNvbnBDYWxsYmFjaztcbiBcdGpzb25wQXJyYXkgPSBqc29ucEFycmF5LnNsaWNlKCk7XG4gXHRmb3IodmFyIGkgPSAwOyBpIDwganNvbnBBcnJheS5sZW5ndGg7IGkrKykgd2VicGFja0pzb25wQ2FsbGJhY2soanNvbnBBcnJheVtpXSk7XG4gXHR2YXIgcGFyZW50SnNvbnBGdW5jdGlvbiA9IG9sZEpzb25wRnVuY3Rpb247XG5cblxuIFx0Ly8gYWRkIGVudHJ5IG1vZHVsZSB0byBkZWZlcnJlZCBsaXN0XG4gXHRkZWZlcnJlZE1vZHVsZXMucHVzaChbXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2xpYnJhcnktcGFnZS9saWJyYXJ5LXBhZ2Uuc2NyaXB0cy50c1wiLFwidmVuZG9yc35hYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcn43ODU2YzA1YVwiLFwiYWJvdXR+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29tbXVuaXR5X2Rhc2hib2FyZH5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lMDZhNGExN1wiLFwiY29sbGVjdGlvbl9wbGF5ZXJ+Y3JlYXRvcl9kYXNoYm9hcmR+bGVhcm5lcl9kYXNoYm9hcmR+bGlicmFyeX5wcm9maWxlfnN0b3J5X3ZpZXdlclwiLFwiY29sbGVjdGlvbl9wbGF5ZXJ+bGVhcm5lcl9kYXNoYm9hcmR+bGlicmFyeX5wcm9maWxlfnN0b3J5X3ZpZXdlclwiLFwiY29tbXVuaXR5X2Rhc2hib2FyZH5saWJyYXJ5fnByZWZlcmVuY2VzXCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBCYXNlIFRyYW5zY2x1c2lvbiBDb21wb25lbnQuXG4gKi9cbnJlcXVpcmUoJ2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9PcHBpYUZvb3RlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3NpZGViYXIvU2lkZWJhclN0YXR1c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvc3RhdGVmdWwvQmFja2dyb3VuZE1hc2tTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2Jhc2VDb250ZW50JywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB7XG4gICAgICAgICAgICAgICAgYnJlYWRjcnVtYjogJz9uYXZiYXJCcmVhZGNydW1iJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnY29udGVudCcsXG4gICAgICAgICAgICAgICAgZm9vdGVyOiAnP3BhZ2VGb290ZXInLFxuICAgICAgICAgICAgICAgIG5hdk9wdGlvbnM6ICc/bmF2T3B0aW9ucycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvYmFzZV9jb21wb25lbnRzL2Jhc2VfY29udGVudF9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckcm9vdFNjb3BlJywgJ0JhY2tncm91bmRNYXNrU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1NpZGViYXJTdGF0dXNTZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCAnU0lURV9GRUVEQkFDS19GT1JNX1VSTCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIEJhY2tncm91bmRNYXNrU2VydmljZSwgU2lkZWJhclN0YXR1c1NlcnZpY2UsIFVybFNlcnZpY2UsIFNJVEVfRkVFREJBQ0tfRk9STV9VUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlmcmFtZWQgPSBVcmxTZXJ2aWNlLmlzSWZyYW1lZCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNpdGVGZWVkYmFja0Zvcm1VcmwgPSBTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzU2lkZWJhclNob3duID0gU2lkZWJhclN0YXR1c1NlcnZpY2UuaXNTaWRlYmFyU2hvd247XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2xvc2VTaWRlYmFyT25Td2lwZSA9IFNpZGViYXJTdGF0dXNTZXJ2aWNlLmNsb3NlU2lkZWJhcjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc0JhY2tncm91bmRNYXNrQWN0aXZlID0gQmFja2dyb3VuZE1hc2tTZXJ2aWNlLmlzTWFza0FjdGl2ZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5ERVZfTU9ERSA9ICRyb290U2NvcGUuREVWX01PREU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2tpcFRvTWFpbkNvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFpbkNvbnRlbnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29wcGlhLW1haW4tY29udGVudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtYWluQ29udGVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVmFyaWFibGUgbWFpbkNvbnRlbnRFbGVtZW50IGlzIHVuZGVmaW5lZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC50YWJJbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LnNjcm9sbEludG9WaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3Igd2FybmluZ19sb2FkZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnd2FybmluZ0xvYWRlcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvYmFzZV9jb21wb25lbnRzL3dhcm5pbmdfbG9hZGVyX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChBbGVydHNTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5BbGVydHNTZXJ2aWNlID0gQWxlcnRzU2VydmljZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgZGlzcGxheWluZyBhbmltYXRlZCBsb2FkaW5nIGRvdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnbG9hZGluZ0RvdHMnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvJyArXG4gICAgICAgICAgICAgICAgJ2xvYWRpbmctZG90cy5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHsgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciBzdW1tYXJ5IHRpbGUgZm9yIGNvbGxlY3Rpb25zLlxuICovXG4vLyBUT0RPKCM3MDkyKTogRGVsZXRlIHRoaXMgZmlsZSBvbmNlIG1pZ3JhdGlvbiBpcyBjb21wbGV0ZSBhbmQgdGhlc2UgQW5ndWxhckpTXG4vLyBlcXVpdmFsZW50cyBvZiB0aGUgQW5ndWxhciBjb25zdGFudHMgYXJlIG5vIGxvbmdlciBuZWVkZWQuXG52YXIgY29sbGVjdGlvbl9zdW1tYXJ5X3RpbGVfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuY29uc3RhbnRzXCIpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NPTExFQ1RJT05fVklFV0VSX1VSTCcsIGNvbGxlY3Rpb25fc3VtbWFyeV90aWxlX2NvbnN0YW50c18xLkNvbGxlY3Rpb25TdW1tYXJ5VGlsZUNvbnN0YW50cy5DT0xMRUNUSU9OX1ZJRVdFUl9VUkwpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NPTExFQ1RJT05fRURJVE9SX1VSTCcsIGNvbGxlY3Rpb25fc3VtbWFyeV90aWxlX2NvbnN0YW50c18xLkNvbGxlY3Rpb25TdW1tYXJ5VGlsZUNvbnN0YW50cy5DT0xMRUNUSU9OX0VESVRPUl9VUkwpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHN1bW1hcnkgdGlsZSBmb3IgY29sbGVjdGlvbnMuXG4gKi9cbnZhciBDb2xsZWN0aW9uU3VtbWFyeVRpbGVDb25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29sbGVjdGlvblN1bW1hcnlUaWxlQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBDb2xsZWN0aW9uU3VtbWFyeVRpbGVDb25zdGFudHMuQ09MTEVDVElPTl9WSUVXRVJfVVJMID0gJy9jb2xsZWN0aW9uLzxjb2xsZWN0aW9uX2lkPic7XG4gICAgQ29sbGVjdGlvblN1bW1hcnlUaWxlQ29uc3RhbnRzLkNPTExFQ1RJT05fRURJVE9SX1VSTCA9ICcvY29sbGVjdGlvbl9lZGl0b3IvY3JlYXRlLzxjb2xsZWN0aW9uX2lkPic7XG4gICAgcmV0dXJuIENvbGxlY3Rpb25TdW1tYXJ5VGlsZUNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLkNvbGxlY3Rpb25TdW1tYXJ5VGlsZUNvbnN0YW50cyA9IENvbGxlY3Rpb25TdW1tYXJ5VGlsZUNvbnN0YW50cztcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU3VtbWFyeSB0aWxlIGZvciBjb2xsZWN0aW9ucy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2xlYXJuZXJfZGFzaGJvYXJkL0xlYXJuZXJEYXNoYm9hcmRJY29uc0RpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLWFuZC1jYXBpdGFsaXplLmZpbHRlci50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdjb2xsZWN0aW9uU3VtbWFyeVRpbGUnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGdldENvbGxlY3Rpb25JZDogJyZjb2xsZWN0aW9uSWQnLFxuICAgICAgICAgICAgICAgIGdldENvbGxlY3Rpb25UaXRsZTogJyZjb2xsZWN0aW9uVGl0bGUnLFxuICAgICAgICAgICAgICAgIGdldE9iamVjdGl2ZTogJyZvYmplY3RpdmUnLFxuICAgICAgICAgICAgICAgIGdldE5vZGVDb3VudDogJyZub2RlQ291bnQnLFxuICAgICAgICAgICAgICAgIGdldExhc3RVcGRhdGVkTXNlYzogJyZsYXN0VXBkYXRlZE1zZWMnLFxuICAgICAgICAgICAgICAgIGdldFRodW1ibmFpbEljb25Vcmw6ICcmdGh1bWJuYWlsSWNvblVybCcsXG4gICAgICAgICAgICAgICAgZ2V0VGh1bWJuYWlsQmdDb2xvcjogJyZ0aHVtYm5haWxCZ0NvbG9yJyxcbiAgICAgICAgICAgICAgICBpc0xpbmtlZFRvRWRpdG9yUGFnZTogJz0/aXNMaW5rZWRUb0VkaXRvclBhZ2UnLFxuICAgICAgICAgICAgICAgIGdldENhdGVnb3J5OiAnJmNhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBpc1BsYXlsaXN0VGlsZTogJyZpc1BsYXlsaXN0VGlsZScsXG4gICAgICAgICAgICAgICAgc2hvd0xlYXJuZXJEYXNoYm9hcmRJY29uc0lmUG9zc2libGU6ICgnJnNob3dMZWFybmVyRGFzaGJvYXJkSWNvbnNJZlBvc3NpYmxlJyksXG4gICAgICAgICAgICAgICAgaXNDb250YWluZXJOYXJyb3c6ICcmY29udGFpbmVySXNOYXJyb3cnLFxuICAgICAgICAgICAgICAgIGlzT3duZWRCeUN1cnJlbnRVc2VyOiAnJmFjdGl2aXR5SXNPd25lZEJ5Q3VycmVudFVzZXInLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvc3VtbWFyeS10aWxlL2NvbGxlY3Rpb24tc3VtbWFyeS10aWxlLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJ0RhdGVUaW1lRm9ybWF0U2VydmljZScsICdVc2VyU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0FDVElWSVRZX1RZUEVfQ09MTEVDVElPTicsICdDT0xMRUNUSU9OX1ZJRVdFUl9VUkwnLFxuICAgICAgICAgICAgICAgICdDT0xMRUNUSU9OX0VESVRPUl9VUkwnLCBmdW5jdGlvbiAoRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLCBVc2VyU2VydmljZSwgQUNUSVZJVFlfVFlQRV9DT0xMRUNUSU9OLCBDT0xMRUNUSU9OX1ZJRVdFUl9VUkwsIENPTExFQ1RJT05fRURJVE9SX1VSTCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCkudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSB1c2VySW5mby5pc0xvZ2dlZEluKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkRFRkFVTFRfRU1QVFlfVElUTEUgPSAnVW50aXRsZWQnO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkFDVElWSVRZX1RZUEVfQ09MTEVDVElPTiA9IEFDVElWSVRZX1RZUEVfQ09MTEVDVElPTjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRMYXN0VXBkYXRlZERhdGV0aW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIERhdGVUaW1lRm9ybWF0U2VydmljZS5nZXRMb2NhbGVBYmJyZXZpYXRlZERhdGV0aW1lU3RyaW5nKGN0cmwuZ2V0TGFzdFVwZGF0ZWRNc2VjKCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldENvbGxlY3Rpb25MaW5rID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldFVybCA9IChjdHJsLmlzTGlua2VkVG9FZGl0b3JQYWdlID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDT0xMRUNUSU9OX0VESVRPUl9VUkwgOiBDT0xMRUNUSU9OX1ZJRVdFUl9VUkwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKHRhcmdldFVybCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25faWQ6IGN0cmwuZ2V0Q29sbGVjdGlvbklkKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldENvbXBsZXRlVGh1bWJuYWlsSWNvblVybCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybChjdHJsLmdldFRodW1ibmFpbEljb25VcmwoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0U3RhdGljSW1hZ2VVcmwgPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRIb3ZlclN0YXRlID0gZnVuY3Rpb24gKGhvdmVyU3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY29sbGVjdGlvbklzQ3VycmVudGx5SG92ZXJlZE92ZXIgPSBob3ZlclN0YXRlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBsZWFybmVyXG4gICBkYXNoYm9hcmQgYWN0aXZpdHkgaWRzIGRvbWFpbiBvYmplY3QuXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzKGluY29tcGxldGVFeHBsb3JhdGlvbklkcywgaW5jb21wbGV0ZUNvbGxlY3Rpb25JZHMsIGNvbXBsZXRlZEV4cGxvcmF0aW9uSWRzLCBjb21wbGV0ZWRDb2xsZWN0aW9uSWRzLCBleHBsb3JhdGlvblBsYXlsaXN0SWRzLCBjb2xsZWN0aW9uUGxheWxpc3RJZHMpIHtcbiAgICAgICAgdGhpcy5pbmNvbXBsZXRlRXhwbG9yYXRpb25JZHMgPSBpbmNvbXBsZXRlRXhwbG9yYXRpb25JZHM7XG4gICAgICAgIHRoaXMuaW5jb21wbGV0ZUNvbGxlY3Rpb25JZHMgPSBpbmNvbXBsZXRlQ29sbGVjdGlvbklkcztcbiAgICAgICAgdGhpcy5jb21wbGV0ZWRFeHBsb3JhdGlvbklkcyA9IGNvbXBsZXRlZEV4cGxvcmF0aW9uSWRzO1xuICAgICAgICB0aGlzLmNvbXBsZXRlZENvbGxlY3Rpb25JZHMgPSBjb21wbGV0ZWRDb2xsZWN0aW9uSWRzO1xuICAgICAgICB0aGlzLmV4cGxvcmF0aW9uUGxheWxpc3RJZHMgPSBleHBsb3JhdGlvblBsYXlsaXN0SWRzO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25QbGF5bGlzdElkcyA9IGNvbGxlY3Rpb25QbGF5bGlzdElkcztcbiAgICB9XG4gICAgTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLnByb3RvdHlwZS5pbmNsdWRlc0FjdGl2aXR5ID0gZnVuY3Rpb24gKGFjdGl2aXR5SWQpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5jb21wbGV0ZUNvbGxlY3Rpb25JZHMuaW5kZXhPZihhY3Rpdml0eUlkKSAhPT0gLTEgfHxcbiAgICAgICAgICAgIHRoaXMuY29tcGxldGVkQ29sbGVjdGlvbklkcy5pbmRleE9mKGFjdGl2aXR5SWQpICE9PSAtMSB8fFxuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uUGxheWxpc3RJZHMuaW5kZXhPZihhY3Rpdml0eUlkKSAhPT0gLTEgfHxcbiAgICAgICAgICAgIHRoaXMuaW5jb21wbGV0ZUV4cGxvcmF0aW9uSWRzLmluZGV4T2YoYWN0aXZpdHlJZCkgIT09IC0xIHx8XG4gICAgICAgICAgICB0aGlzLmNvbXBsZXRlZEV4cGxvcmF0aW9uSWRzLmluZGV4T2YoYWN0aXZpdHlJZCkgIT09IC0xIHx8XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmF0aW9uUGxheWxpc3RJZHMuaW5kZXhPZihhY3Rpdml0eUlkKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMucHJvdG90eXBlLmJlbG9uZ3NUb0V4cGxvcmF0aW9uUGxheWxpc3QgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICBpZiAodGhpcy5leHBsb3JhdGlvblBsYXlsaXN0SWRzLmluZGV4T2YoZXhwbG9yYXRpb25JZCkgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLnByb3RvdHlwZS5iZWxvbmdzVG9Db2xsZWN0aW9uUGxheWxpc3QgPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbGxlY3Rpb25QbGF5bGlzdElkcy5pbmRleE9mKGNvbGxlY3Rpb25JZCkgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLnByb3RvdHlwZS5iZWxvbmdzVG9Db21wbGV0ZWRFeHBsb3JhdGlvbnMgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICBpZiAodGhpcy5jb21wbGV0ZWRFeHBsb3JhdGlvbklkcy5pbmRleE9mKGV4cGxvcmF0aW9uSWQpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5wcm90b3R5cGUuYmVsb25nc1RvQ29tcGxldGVkQ29sbGVjdGlvbnMgPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbXBsZXRlZENvbGxlY3Rpb25JZHMuaW5kZXhPZihjb2xsZWN0aW9uSWQpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5wcm90b3R5cGUuYmVsb25nc1RvSW5jb21wbGV0ZUV4cGxvcmF0aW9ucyA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgIGlmICh0aGlzLmluY29tcGxldGVFeHBsb3JhdGlvbklkcy5pbmRleE9mKGV4cGxvcmF0aW9uSWQpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5wcm90b3R5cGUuYmVsb25nc1RvSW5jb21wbGV0ZUNvbGxlY3Rpb25zID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICBpZiAodGhpcy5pbmNvbXBsZXRlQ29sbGVjdGlvbklkcy5pbmRleE9mKGNvbGxlY3Rpb25JZCkgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLnByb3RvdHlwZS5hZGRUb0V4cGxvcmF0aW9uTGVhcm5lclBsYXlsaXN0ID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgdGhpcy5leHBsb3JhdGlvblBsYXlsaXN0SWRzLnB1c2goZXhwbG9yYXRpb25JZCk7XG4gICAgfTtcbiAgICBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMucHJvdG90eXBlLnJlbW92ZUZyb21FeHBsb3JhdGlvbkxlYXJuZXJQbGF5bGlzdCA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZXhwbG9yYXRpb25QbGF5bGlzdElkcy5pbmRleE9mKGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmF0aW9uUGxheWxpc3RJZHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLnByb3RvdHlwZS5hZGRUb0NvbGxlY3Rpb25MZWFybmVyUGxheWxpc3QgPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvblBsYXlsaXN0SWRzLnB1c2goY29sbGVjdGlvbklkKTtcbiAgICB9O1xuICAgIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5wcm90b3R5cGUucmVtb3ZlRnJvbUNvbGxlY3Rpb25MZWFybmVyUGxheWxpc3QgPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuY29sbGVjdGlvblBsYXlsaXN0SWRzLmluZGV4T2YoY29sbGVjdGlvbklkKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uUGxheWxpc3RJZHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcztcbn0oKSk7XG5leHBvcnRzLkxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcyA9IExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcztcbnZhciBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNPYmplY3RGYWN0b3J5ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc09iamVjdEZhY3RvcnkoKSB7XG4gICAgfVxuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ3NraWxsUmlnaHRzQmFja2VuZERpY3QnIGlzIGEgZGljdCB3aXRoIHVuZGVyc2NvcmVfY2FzZWRcbiAgICAvLyBrZXlzIHdoaWNoIGdpdmUgdHNsaW50IGVycm9ycyBhZ2FpbnN0IHVuZGVyc2NvcmVfY2FzaW5nIGluIGZhdm9yIG9mXG4gICAgLy8gY2FtZWxDYXNpbmcuXG4gICAgTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzT2JqZWN0RmFjdG9yeS5wcm90b3R5cGUuY3JlYXRlRnJvbUJhY2tlbmREaWN0ID0gZnVuY3Rpb24gKGxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc0RpY3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMobGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzRGljdC5pbmNvbXBsZXRlX2V4cGxvcmF0aW9uX2lkcywgbGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzRGljdC5pbmNvbXBsZXRlX2NvbGxlY3Rpb25faWRzLCBsZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNEaWN0LmNvbXBsZXRlZF9leHBsb3JhdGlvbl9pZHMsIGxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc0RpY3QuY29tcGxldGVkX2NvbGxlY3Rpb25faWRzLCBsZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNEaWN0LmV4cGxvcmF0aW9uX3BsYXlsaXN0X2lkcywgbGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzRGljdC5jb2xsZWN0aW9uX3BsYXlsaXN0X2lkcyk7XG4gICAgfTtcbiAgICBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNPYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc09iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNPYmplY3RGYWN0b3J5O1xufSgpKTtcbmV4cG9ydHMuTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzT2JqZWN0RmFjdG9yeSA9IExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc09iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNPYmplY3RGYWN0b3J5Jywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNPYmplY3RGYWN0b3J5KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9fbWV0YWRhdGEgPSAodGhpcyAmJiB0aGlzLl9fbWV0YWRhdGEpIHx8IGZ1bmN0aW9uIChrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBCYWNrZW5kIHNlcnZpY2VzIHJlbGF0ZWQgdG8gZmV0Y2hpbmcgdGhlIGlkcyBvZiB0aGVcbiAqIGFjdGl2aXRpZXMgcHJlc2VudCBpbiB0aGUgbGVhcm5lciBkYXNoYm9hcmQuXG4gKi9cbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBodHRwXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29tbW9uL2h0dHBcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExlYXJuZXJEYXNoYm9hcmRJZHNCYWNrZW5kQXBpU2VydmljZShodHRwKSB7XG4gICAgICAgIHRoaXMuaHR0cCA9IGh0dHA7XG4gICAgfVxuICAgIExlYXJuZXJEYXNoYm9hcmRJZHNCYWNrZW5kQXBpU2VydmljZS5wcm90b3R5cGUuX2ZldGNoTGVhcm5lckRhc2hib2FyZElkcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gSHR0cENsaWVudCByZXR1cm5zIGFuIE9ic2VydmFibGUsIHRoZSB0b1Byb21pc2UgY29udmVydHMgaXQgaW50byBhXG4gICAgICAgIC8vIFByb21pc2UuXG4gICAgICAgIHJldHVybiB0aGlzLmh0dHAuZ2V0KCcvbGVhcm5lcmRhc2hib2FyZGlkc2hhbmRsZXIvZGF0YScpLnRvUHJvbWlzZSgpO1xuICAgIH07XG4gICAgTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlLnByb3RvdHlwZS5mZXRjaExlYXJuZXJEYXNoYm9hcmRJZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mZXRjaExlYXJuZXJEYXNoYm9hcmRJZHMoKTtcbiAgICB9O1xuICAgIHZhciBfYTtcbiAgICBMZWFybmVyRGFzaGJvYXJkSWRzQmFja2VuZEFwaVNlcnZpY2UgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pLFxuICAgICAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW3R5cGVvZiAoX2EgPSB0eXBlb2YgaHR0cF8xLkh0dHBDbGllbnQgIT09IFwidW5kZWZpbmVkXCIgJiYgaHR0cF8xLkh0dHBDbGllbnQpID09PSBcImZ1bmN0aW9uXCIgPyBfYSA6IE9iamVjdF0pXG4gICAgXSwgTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlKTtcbiAgICByZXR1cm4gTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlO1xufSgpKTtcbmV4cG9ydHMuTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlID0gTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlJywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShMZWFybmVyRGFzaGJvYXJkSWRzQmFja2VuZEFwaVNlcnZpY2UpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSByZWxhdGVkIHRvIHRoZSBsZWFybmVyIHBsYXlsaXN0LlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdMZWFybmVyUGxheWxpc3RTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckdWliTW9kYWwnLCAnQWxlcnRzU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ0FDVElWSVRZX1RZUEVfQ09MTEVDVElPTicsICdBQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICR1aWJNb2RhbCwgQWxlcnRzU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIEFDVElWSVRZX1RZUEVfQ09MTEVDVElPTiwgQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTikge1xuICAgICAgICB2YXIgX2FkZFRvTGVhcm5lclBsYXlsaXN0ID0gZnVuY3Rpb24gKGFjdGl2aXR5SWQsIGFjdGl2aXR5VHlwZSkge1xuICAgICAgICAgICAgdmFyIHN1Y2Nlc3NmdWxseUFkZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBhZGRUb0xlYXJuZXJQbGF5bGlzdFVybCA9IChVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybCgnL2xlYXJuZXJwbGF5bGlzdGFjdGl2aXR5aGFuZGxlci88YWN0aXZpdHlUeXBlPi88YWN0aXZpdHlJZD4nLCB7XG4gICAgICAgICAgICAgICAgYWN0aXZpdHlUeXBlOiBhY3Rpdml0eVR5cGUsXG4gICAgICAgICAgICAgICAgYWN0aXZpdHlJZDogYWN0aXZpdHlJZFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgJGh0dHAucG9zdChhZGRUb0xlYXJuZXJQbGF5bGlzdFVybCwge30pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEuYmVsb25nc190b19jb21wbGV0ZWRfb3JfaW5jb21wbGV0ZV9saXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NmdWxseUFkZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ1lvdSBoYXZlIGFscmVhZHkgY29tcGxldGVkIG9yIGFyZSBjb21wbGV0aW5nIHRoaXMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnYWN0aXZpdHkuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLmJlbG9uZ3NfdG9fc3Vic2NyaWJlZF9hY3Rpdml0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NmdWxseUFkZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ1RoaXMgaXMgcHJlc2VudCBpbiB5b3VyIGNyZWF0b3IgZGFzaGJvYXJkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLnBsYXlsaXN0X2xpbWl0X2V4Y2VlZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NmdWxseUFkZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ1lvdXIgXFwnUGxheSBMYXRlclxcJyBsaXN0IGlzIGZ1bGwhICBFaXRoZXIgeW91IGNhbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjb21wbGV0ZSBzb21lIG9yIHlvdSBjYW4gaGVhZCB0byB0aGUgbGVhcm5lciBkYXNoYm9hcmQgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnYW5kIHJlbW92ZSBzb21lLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc2Z1bGx5QWRkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRTdWNjZXNzTWVzc2FnZSgnU3VjY2Vzc2Z1bGx5IGFkZGVkIHRvIHlvdXIgXFwnUGxheSBMYXRlclxcJyBsaXN0LicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3NmdWxseUFkZGVkO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3JlbW92ZUZyb21MZWFybmVyUGxheWxpc3QgPSBmdW5jdGlvbiAoYWN0aXZpdHlJZCwgYWN0aXZpdHlUaXRsZSwgYWN0aXZpdHlUeXBlLCBsZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMpIHtcbiAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9sZWFybmVyLWRhc2hib2FyZC1wYWdlL21vZGFsLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgJ3JlbW92ZS1hY3Rpdml0eS1mcm9tLWxlYXJuZXItZGFzaGJvYXJkLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5SWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3Rpdml0eUlkO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eVRpdGxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWN0aXZpdHlUaXRsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJywgJyRodHRwJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UsICRodHRwLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlY3Rpb25OYW1lSTE4bklkID0gKCdJMThOX0xFQVJORVJfREFTSEJPQVJEX1BMQVlMSVNUX1NFQ1RJT04nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3Rpdml0eVRpdGxlID0gYWN0aXZpdHlUaXRsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZW1vdmVGcm9tTGVhcm5lclBsYXlsaXN0VXJsID0gKFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKCcvbGVhcm5lcnBsYXlsaXN0YWN0aXZpdHloYW5kbGVyLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8YWN0aXZpdHlUeXBlPi88YWN0aXZpdHlJZD4nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlUeXBlOiBhY3Rpdml0eVR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlJZDogYWN0aXZpdHlJZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaHR0cFsnZGVsZXRlJ10ocmVtb3ZlRnJvbUxlYXJuZXJQbGF5bGlzdFVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pLnJlc3VsdC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aXZpdHlUeXBlID09PSBBQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OKSB7XG4gICAgICAgICAgICAgICAgICAgIGxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5yZW1vdmVGcm9tRXhwbG9yYXRpb25MZWFybmVyUGxheWxpc3QoYWN0aXZpdHlJZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFjdGl2aXR5VHlwZSA9PT0gQUNUSVZJVFlfVFlQRV9DT0xMRUNUSU9OKSB7XG4gICAgICAgICAgICAgICAgICAgIGxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5yZW1vdmVGcm9tQ29sbGVjdGlvbkxlYXJuZXJQbGF5bGlzdChhY3Rpdml0eUlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFkZFRvTGVhcm5lclBsYXlsaXN0OiBfYWRkVG9MZWFybmVyUGxheWxpc3QsXG4gICAgICAgICAgICByZW1vdmVGcm9tTGVhcm5lclBsYXlsaXN0OiBfcmVtb3ZlRnJvbUxlYXJuZXJQbGF5bGlzdFxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIG9iamVjdHMgZG9tYWluLlxuICovXG52YXIgT2JqZWN0c0RvbWFpbkNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBPYmplY3RzRG9tYWluQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBPYmplY3RzRG9tYWluQ29uc3RhbnRzLkZSQUNUSU9OX1BBUlNJTkdfRVJST1JTID0ge1xuICAgICAgICBJTlZBTElEX0NIQVJTOiAnUGxlYXNlIG9ubHkgdXNlIG51bWVyaWNhbCBkaWdpdHMsIHNwYWNlcyBvciBmb3J3YXJkIHNsYXNoZXMgKC8pJyxcbiAgICAgICAgSU5WQUxJRF9GT1JNQVQ6ICdQbGVhc2UgZW50ZXIgYSB2YWxpZCBmcmFjdGlvbiAoZS5nLiwgNS8zIG9yIDEgMi8zKScsXG4gICAgICAgIERJVklTSU9OX0JZX1pFUk86ICdQbGVhc2UgZG8gbm90IHB1dCAwIGluIHRoZSBkZW5vbWluYXRvcidcbiAgICB9O1xuICAgIE9iamVjdHNEb21haW5Db25zdGFudHMuTlVNQkVSX1dJVEhfVU5JVFNfUEFSU0lOR19FUlJPUlMgPSB7XG4gICAgICAgIElOVkFMSURfVkFMVUU6ICdQbGVhc2UgZW5zdXJlIHRoYXQgdmFsdWUgaXMgZWl0aGVyIGEgZnJhY3Rpb24gb3IgYSBudW1iZXInLFxuICAgICAgICBJTlZBTElEX0NVUlJFTkNZOiAnUGxlYXNlIGVudGVyIGEgdmFsaWQgY3VycmVuY3kgKGUuZy4sICQ1IG9yIFJzIDUpJyxcbiAgICAgICAgSU5WQUxJRF9DVVJSRU5DWV9GT1JNQVQ6ICdQbGVhc2Ugd3JpdGUgY3VycmVuY3kgdW5pdHMgYXQgdGhlIGJlZ2lubmluZycsXG4gICAgICAgIElOVkFMSURfVU5JVF9DSEFSUzogJ1BsZWFzZSBlbnN1cmUgdGhhdCB1bml0IG9ubHkgY29udGFpbnMgbnVtYmVycywgYWxwaGFiZXRzLCAoLCApLCAqLCBeLCAnICtcbiAgICAgICAgICAgICcvLCAtJ1xuICAgIH07XG4gICAgT2JqZWN0c0RvbWFpbkNvbnN0YW50cy5DVVJSRU5DWV9VTklUUyA9IHtcbiAgICAgICAgZG9sbGFyOiB7XG4gICAgICAgICAgICBuYW1lOiAnZG9sbGFyJyxcbiAgICAgICAgICAgIGFsaWFzZXM6IFsnJCcsICdkb2xsYXJzJywgJ0RvbGxhcnMnLCAnRG9sbGFyJywgJ1VTRCddLFxuICAgICAgICAgICAgZnJvbnRfdW5pdHM6IFsnJCddLFxuICAgICAgICAgICAgYmFzZV91bml0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIHJ1cGVlOiB7XG4gICAgICAgICAgICBuYW1lOiAncnVwZWUnLFxuICAgICAgICAgICAgYWxpYXNlczogWydScycsICdydXBlZXMnLCAn4oK5JywgJ1J1cGVlcycsICdSdXBlZSddLFxuICAgICAgICAgICAgZnJvbnRfdW5pdHM6IFsnUnMgJywgJ+KCuSddLFxuICAgICAgICAgICAgYmFzZV91bml0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIGNlbnQ6IHtcbiAgICAgICAgICAgIG5hbWU6ICdjZW50JyxcbiAgICAgICAgICAgIGFsaWFzZXM6IFsnY2VudHMnLCAnQ2VudHMnLCAnQ2VudCddLFxuICAgICAgICAgICAgZnJvbnRfdW5pdHM6IFtdLFxuICAgICAgICAgICAgYmFzZV91bml0OiAnMC4wMSBkb2xsYXInXG4gICAgICAgIH0sXG4gICAgICAgIHBhaXNlOiB7XG4gICAgICAgICAgICBuYW1lOiAncGFpc2UnLFxuICAgICAgICAgICAgYWxpYXNlczogWydwYWlzYScsICdQYWlzZScsICdQYWlzYSddLFxuICAgICAgICAgICAgZnJvbnRfdW5pdHM6IFtdLFxuICAgICAgICAgICAgYmFzZV91bml0OiAnMC4wMSBydXBlZSdcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIE9iamVjdHNEb21haW5Db25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5PYmplY3RzRG9tYWluQ29uc3RhbnRzID0gT2JqZWN0c0RvbWFpbkNvbnN0YW50cztcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgZm9vdGVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ29wcGlhRm9vdGVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvb3BwaWFfZm9vdGVyX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkgeyB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGxpYnJhcnkgZm9vdGVyLlxuICovXG5yZXF1aXJlKCdwYWdlcy9PcHBpYUZvb3RlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvbGlicmFyeS1wYWdlL2xpYnJhcnktcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2xpYnJhcnlGb290ZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1mb290ZXIvbGlicmFyeS1mb290ZXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHdpbmRvdycsICdMSUJSQVJZX1BBR0VfTU9ERVMnLCAnTElCUkFSWV9QQVRIU19UT19NT0RFUycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCR3aW5kb3csIExJQlJBUllfUEFHRV9NT0RFUywgTElCUkFSWV9QQVRIU19UT19NT0RFUykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYWdlTW9kZSA9IExJQlJBUllfUEFUSFNfVE9fTU9ERVNbJHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZm9vdGVySXNEaXNwbGF5ZWQgPSAocGFnZU1vZGUgIT09IExJQlJBUllfUEFHRV9NT0RFUy5TRUFSQ0gpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciB0aGUgT3BwaWEgY29udHJpYnV0b3JzJyBsaWJyYXJ5IHBhZ2UuXG4gKi9cbi8vIFRPRE8oIzcwOTIpOiBEZWxldGUgdGhpcyBmaWxlIG9uY2UgbWlncmF0aW9uIGlzIGNvbXBsZXRlIGFuZCB0aGVzZSBBbmd1bGFySlNcbi8vIGVxdWl2YWxlbnRzIG9mIHRoZSBBbmd1bGFyIGNvbnN0YW50cyBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbnZhciBsaWJyYXJ5X3BhZ2VfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwicGFnZXMvbGlicmFyeS1wYWdlL2xpYnJhcnktcGFnZS5jb25zdGFudHNcIik7XG4vLyBOT1RFIFRPIERFVkVMT1BFUlM6IFRoZSBjb25zdGFudHMgZGVmaW5lZCBiZWxvdyBpbiBMSUJSQVJZX1BBR0VfTU9ERVMgc2hvdWxkXG4vLyBiZSBzYW1lIGFzIHRoZSBMSUJSQVJZX1BBR0VfTU9ERSBjb25zdGFudHMgZGVmaW5lZCBpbiBmZWNvbmYucHkuIEZvciBleGFtcGxlXG4vLyBMSUJSQVJZX1BBR0VfTU9ERVMuR1JPVVAgc2hvdWxkIGhhdmUgdGhlIHNhbWUgdmFsdWUgYXNcbi8vIExJQlJBUllfUEFHRV9NT0RFX0dST1VQIGluIGZlY29uZi5weS5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdMSUJSQVJZX1BBR0VfTU9ERVMnLCBsaWJyYXJ5X3BhZ2VfY29uc3RhbnRzXzEuTGlicmFyeVBhZ2VDb25zdGFudHMuTElCUkFSWV9QQUdFX01PREVTKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdMSUJSQVJZX1BBVEhTX1RPX01PREVTJywgbGlicmFyeV9wYWdlX2NvbnN0YW50c18xLkxpYnJhcnlQYWdlQ29uc3RhbnRzLkxJQlJBUllfUEFUSFNfVE9fTU9ERVMpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHRoZSBPcHBpYSBjb250cmlidXRvcnMnIGxpYnJhcnkgcGFnZS5cbiAqL1xuLy8gTk9URSBUTyBERVZFTE9QRVJTOiBUaGUgY29uc3RhbnRzIGRlZmluZWQgYmVsb3cgaW4gTElCUkFSWV9QQUdFX01PREVTIHNob3VsZFxuLy8gYmUgc2FtZSBhcyB0aGUgTElCUkFSWV9QQUdFX01PREUgY29uc3RhbnRzIGRlZmluZWQgaW4gZmVjb25mLnB5LiBGb3IgZXhhbXBsZVxuLy8gTElCUkFSWV9QQUdFX01PREVTLkdST1VQIHNob3VsZCBoYXZlIHRoZSBzYW1lIHZhbHVlIGFzXG4vLyBMSUJSQVJZX1BBR0VfTU9ERV9HUk9VUCBpbiBmZWNvbmYucHkuXG52YXIgTGlicmFyeVBhZ2VDb25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlicmFyeVBhZ2VDb25zdGFudHMoKSB7XG4gICAgfVxuICAgIExpYnJhcnlQYWdlQ29uc3RhbnRzLkxJQlJBUllfUEFHRV9NT0RFUyA9IHtcbiAgICAgICAgR1JPVVA6ICdncm91cCcsXG4gICAgICAgIElOREVYOiAnaW5kZXgnLFxuICAgICAgICBTRUFSQ0g6ICdzZWFyY2gnXG4gICAgfTtcbiAgICBMaWJyYXJ5UGFnZUNvbnN0YW50cy5MSUJSQVJZX1BBVEhTX1RPX01PREVTID0ge1xuICAgICAgICAnL2xpYnJhcnknOiAnaW5kZXgnLFxuICAgICAgICAnL2xpYnJhcnkvdG9wX3JhdGVkJzogJ2dyb3VwJyxcbiAgICAgICAgJy9saWJyYXJ5L3JlY2VudGx5X3B1Ymxpc2hlZCc6ICdncm91cCcsXG4gICAgICAgICcvc2VhcmNoL2ZpbmQnOiAnc2VhcmNoJ1xuICAgIH07XG4gICAgcmV0dXJuIExpYnJhcnlQYWdlQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuTGlicmFyeVBhZ2VDb25zdGFudHMgPSBMaWJyYXJ5UGFnZUNvbnN0YW50cztcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGF0YSBhbmQgZGlyZWN0aXZlIGZvciB0aGUgT3BwaWEgY29udHJpYnV0b3JzJyBsaWJyYXJ5IHBhZ2UuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAnbG9hZGluZy1kb3RzLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvZXhwbG9yYXRpb24tc3VtbWFyeS10aWxlLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9saWJyYXJ5LXBhZ2Uvc2VhcmNoLXJlc3VsdHMvc2VhcmNoLXJlc3VsdHMuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2xlYXJuZXJfZGFzaGJvYXJkL0xlYXJuZXJEYXNoYm9hcmRJZHNCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL2xlYXJuZXJfZGFzaGJvYXJkL0xlYXJuZXJQbGF5bGlzdFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0NvbnN0cnVjdFRyYW5zbGF0aW9uSWRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvUGFnZVRpdGxlU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU2VhcmNoU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXNlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9XaW5kb3dEaW1lbnNpb25zU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvbGlicmFyeS1wYWdlL2xpYnJhcnktcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2xpYnJhcnlQYWdlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvbGlicmFyeS1wYWdlL2xpYnJhcnktcGFnZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckaHR0cCcsICckbG9nJywgJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJyR0aW1lb3V0JywgJyR1aWJNb2RhbCcsXG4gICAgICAgICAgICAgICAgJyR3aW5kb3cnLCAnQWxlcnRzU2VydmljZScsICdDb25zdHJ1Y3RUcmFuc2xhdGlvbklkc1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNPYmplY3RGYWN0b3J5JyxcbiAgICAgICAgICAgICAgICAnTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlJywgJ0xlYXJuZXJQbGF5bGlzdFNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdQYWdlVGl0bGVTZXJ2aWNlJywgJ1NlYXJjaFNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnV2luZG93RGltZW5zaW9uc1NlcnZpY2UnLCAnQUxMX0NBVEVHT1JJRVMnLFxuICAgICAgICAgICAgICAgICdMSUJSQVJZX1BBR0VfTU9ERVMnLCAnTElCUkFSWV9QQVRIU19UT19NT0RFUycsICdMSUJSQVJZX1RJTEVfV0lEVEhfUFgnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkaHR0cCwgJGxvZywgJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCwgJHVpYk1vZGFsLCAkd2luZG93LCBBbGVydHNTZXJ2aWNlLCBDb25zdHJ1Y3RUcmFuc2xhdGlvbklkc1NlcnZpY2UsIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc09iamVjdEZhY3RvcnksIExlYXJuZXJEYXNoYm9hcmRJZHNCYWNrZW5kQXBpU2VydmljZSwgTGVhcm5lclBsYXlsaXN0U2VydmljZSwgUGFnZVRpdGxlU2VydmljZSwgU2VhcmNoU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFVybFNlcnZpY2UsIFVzZXJTZXJ2aWNlLCBXaW5kb3dEaW1lbnNpb25zU2VydmljZSwgQUxMX0NBVEVHT1JJRVMsIExJQlJBUllfUEFHRV9NT0RFUywgTElCUkFSWV9QQVRIU19UT19NT0RFUywgTElCUkFSWV9USUxFX1dJRFRIX1BYKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdJMThOX0xJQlJBUllfTE9BRElORyc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NzaWJsZUJhbm5lckZpbGVuYW1lcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICdiYW5uZXIxLnN2ZycsICdiYW5uZXIyLnN2ZycsICdiYW5uZXIzLnN2ZycsICdiYW5uZXI0LnN2ZydcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5iYW5uZXJJbWFnZUZpbGVuYW1lID0gcG9zc2libGVCYW5uZXJGaWxlbmFtZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGVCYW5uZXJGaWxlbmFtZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYmFubmVySW1hZ2VGaWxlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9saWJyYXJ5LycgKyBjdHJsLmJhbm5lckltYWdlRmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2ZUdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudFBhdGggPSAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUxJQlJBUllfUEFUSFNfVE9fTU9ERVMuaGFzT3duUHJvcGVydHkoY3VycmVudFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdJTlZBTElEIFVSTCBQQVRIOiAnICsgY3VycmVudFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0cmwucGFnZU1vZGUgPSBMSUJSQVJZX1BBVEhTX1RPX01PREVTW2N1cnJlbnRQYXRoXTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5MSUJSQVJZX1BBR0VfTU9ERVMgPSBMSUJSQVJZX1BBR0VfTU9ERVM7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aXRsZSA9ICdFeHBsb3JhdGlvbiBMaWJyYXJ5IC0gT3BwaWEnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5wYWdlTW9kZSA9PT0gTElCUkFSWV9QQUdFX01PREVTLkdST1VQIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnBhZ2VNb2RlID09PSBMSUJSQVJZX1BBR0VfTU9ERVMuU0VBUkNIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZSA9ICdGaW5kIGV4cGxvcmF0aW9ucyB0byBsZWFybiBmcm9tIC0gT3BwaWEnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFBhZ2VUaXRsZVNlcnZpY2Uuc2V0UGFnZVRpdGxlKHRpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gS2VlcHMgdHJhY2sgb2YgdGhlIGluZGV4IG9mIHRoZSBsZWZ0LW1vc3QgdmlzaWJsZSBjYXJkIG9mIGVhY2hcbiAgICAgICAgICAgICAgICAgICAgLy8gZ3JvdXAuXG4gICAgICAgICAgICAgICAgICAgIGN0cmwubGVmdG1vc3RDYXJkSW5kaWNlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5wYWdlTW9kZSA9PT0gTElCUkFSWV9QQUdFX01PREVTLkdST1VQKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWVBcnJheSA9ICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZ3JvdXBOYW1lID0gcGF0aG5hbWVBcnJheVsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLmdldCgnL2xpYnJhcnlncm91cGhhbmRsZXInLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwX25hbWU6IGN0cmwuZ3JvdXBOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuYWN0aXZpdHlMaXN0ID0gZGF0YS5hY3Rpdml0eV9saXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZ3JvdXBIZWFkZXJJMThuSWQgPSBkYXRhLmhlYWRlcl9pMThuX2lkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgncHJlZmVycmVkTGFuZ3VhZ2VDb2Rlc0xvYWRlZCcsIGRhdGEucHJlZmVycmVkX2xhbmd1YWdlX2NvZGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLmdldCgnL2xpYnJhcnlpbmRleGhhbmRsZXInKS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5saWJyYXJ5R3JvdXBzID0gZGF0YS5hY3Rpdml0eV9zdW1tYXJ5X2RpY3RzX2J5X2NhdGVnb3J5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLmdldFVzZXJJbmZvQXN5bmMoKS50aGVuKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2aXRpZXNPd25lZCA9IHsgZXhwbG9yYXRpb25zOiB7fSwgY29sbGVjdGlvbnM6IHt9IH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1c2VySW5mby5pc0xvZ2dlZEluKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLmdldCgnL2NyZWF0b3JkYXNoYm9hcmRoYW5kbGVyL2RhdGEnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubGlicmFyeUdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChsaWJyYXJ5R3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdGl2aXR5U3VtbWFyeURpY3RzID0gKGxpYnJhcnlHcm91cC5hY3Rpdml0eV9zdW1tYXJ5X2RpY3RzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIEFDVElWSVRZX1RZUEVfRVhQTE9SQVRJT04gPSAnZXhwbG9yYXRpb24nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgQUNUSVZJVFlfVFlQRV9DT0xMRUNUSU9OID0gJ2NvbGxlY3Rpb24nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eVN1bW1hcnlEaWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChhY3Rpdml0eVN1bW1hcnlEaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZpdHlTdW1tYXJ5RGljdC5hY3Rpdml0eV90eXBlID09PSAoQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2aXRpZXNPd25lZC5leHBsb3JhdGlvbnNbYWN0aXZpdHlTdW1tYXJ5RGljdC5pZF0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFjdGl2aXR5U3VtbWFyeURpY3QuYWN0aXZpdHlfdHlwZSA9PT0gKEFDVElWSVRZX1RZUEVfQ09MTEVDVElPTikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2aXRpZXNPd25lZC5jb2xsZWN0aW9uc1thY3Rpdml0eVN1bW1hcnlEaWN0LmlkXSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxvZy5lcnJvcignSU5WQUxJRCBBQ1RJVklUWSBUWVBFOiBBY3Rpdml0eScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnKGlkOiAnICsgYWN0aXZpdHlTdW1tYXJ5RGljdC5pZCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcsIG5hbWU6ICcgKyBhY3Rpdml0eVN1bW1hcnlEaWN0LnRpdGxlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJywgdHlwZTogJyArIGFjdGl2aXR5U3VtbWFyeURpY3QuYWN0aXZpdHlfdHlwZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcpIGhhcyBhbiBpbnZhbGlkIGFjdGl2aXR5IHR5cGUsIHdoaWNoIGNvdWxkICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbm90IGJlIHJlY29yZGVkIGFzIGFuIGV4cGxvcmF0aW9uIG9yIGEgY29sbGVjdGlvbi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuZXhwbG9yYXRpb25zX2xpc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChvd25lZEV4cGxvcmF0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3Rpdml0aWVzT3duZWQuZXhwbG9yYXRpb25zW293bmVkRXhwbG9yYXRpb25zLmlkXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLmNvbGxlY3Rpb25zX2xpc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChvd25lZENvbGxlY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2aXRpZXNPd25lZC5jb2xsZWN0aW9uc1tvd25lZENvbGxlY3Rpb25zLmlkXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdwcmVmZXJyZWRMYW5ndWFnZUNvZGVzTG9hZGVkJywgZGF0YS5wcmVmZXJyZWRfbGFuZ3VhZ2VfY29kZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIGNhcm91c2VsKHMpIG9uIHRoZSBsaWJyYXJ5IGluZGV4IHBhZ2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGF1c2UgaXMgbmVjZXNzYXJ5IHRvIGVuc3VyZSBhbGwgZWxlbWVudHMgaGF2ZSBsb2FkZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoaW5pdENhcm91c2VscywgMzkwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBhY3R1YWwgYW5kIGV4cGVjdGVkIHdpZHRocyBhcmUgdGhlIHNhbWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbm90IHByb2R1Y2UgYW4gZXJyb3IgdGhhdCB3b3VsZCBiZSBjYXVnaHQgYnkgZTJlIHRlc3RzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbFdpZHRoID0gJCgnZXhwbG9yYXRpb24tc3VtbWFyeS10aWxlJykud2lkdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdHVhbFdpZHRoICYmIGFjdHVhbFdpZHRoICE9PSBMSUJSQVJZX1RJTEVfV0lEVEhfUFgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RoZSBhY3R1YWwgd2lkdGggb2YgdGlsZSBpcyBkaWZmZXJlbnQgdGhhbiB0aGUgZXhwZWN0ZWQgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dpZHRoLiBBY3R1YWwgc2l6ZTogJyArIGFjdHVhbFdpZHRoICsgJywgRXhwZWN0ZWQgc2l6ZTogJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCUkFSWV9USUxFX1dJRFRIX1BYKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgaW5pdGlhbGl6ZXMgdGhlIHRyYWNrZXIgdG8gaGF2ZSBhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbGVtZW50cyBmbHVzaCBsZWZ0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyYW5zZm9ybXMgdGhlIGdyb3VwIG5hbWVzIGludG8gdHJhbnNsYXRpb24gaWRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5sZWZ0bW9zdENhcmRJbmRpY2VzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdHJsLmxpYnJhcnlHcm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5sZWZ0bW9zdENhcmRJbmRpY2VzLnB1c2goMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRBY3RpdmVHcm91cCA9IGZ1bmN0aW9uIChncm91cEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2ZUdyb3VwSW5kZXggPSBncm91cEluZGV4O1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNsZWFyQWN0aXZlR3JvdXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2ZUdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgdmFsdWUgYmVsb3cgaXMgY2hhbmdlZCwgdGhlIGZvbGxvd2luZyBDU1MgdmFsdWVzIGluXG4gICAgICAgICAgICAgICAgICAgIC8vIG9wcGlhLmNzcyBtdXN0IGJlIGNoYW5nZWQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIC0gLm9wcGlhLWV4cC1zdW1tYXJ5LXRpbGVzLWNvbnRhaW5lcjogbWF4LXdpZHRoXG4gICAgICAgICAgICAgICAgICAgIC8vIC0gLm9wcGlhLWxpYnJhcnktY2Fyb3VzZWw6IG1heC13aWR0aFxuICAgICAgICAgICAgICAgICAgICB2YXIgTUFYX05VTV9USUxFU19QRVJfUk9XID0gNDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC50aWxlRGlzcGxheUNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluaXRDYXJvdXNlbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIHByZXZlbnRzIHVubmVjZXNzYXJ5IGV4ZWN1dGlvbiBvZiB0aGlzIG1ldGhvZCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWZ0ZXIgYSB3aW5kb3cgcmVzaXplIGV2ZW50IGlzIGZpcmVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHJsLmxpYnJhcnlHcm91cHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgd2luZG93V2lkdGggPSAkKHdpbmRvdykud2lkdGgoKSAqIDAuODU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgbnVtYmVyIDIwIGlzIGFkZGVkIHRvIExJQlJBUllfVElMRV9XSURUSF9QWCBpbiBvcmRlciB0b1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29tcGVuc2F0ZSBmb3IgcGFkZGluZyBhbmQgbWFyZ2lucy4gMjAgaXMganVzdCBhbiBhcmJpdHJhcnlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG51bWJlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGlsZURpc3BsYXlDb3VudCA9IE1hdGgubWluKE1hdGguZmxvb3Iod2luZG93V2lkdGggLyAoTElCUkFSWV9USUxFX1dJRFRIX1BYICsgMjApKSwgTUFYX05VTV9USUxFU19QRVJfUk9XKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5vcHBpYS1saWJyYXJ5LWNhcm91c2VsJykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogKGN0cmwudGlsZURpc3BsYXlDb3VudCAqIExJQlJBUllfVElMRV9XSURUSF9QWCkgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGV0ZXJtaW5lcyB3aGV0aGVyIHRvIGVuYWJsZSBsZWZ0IHNjcm9sbCBhZnRlclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzaXplLlxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdHJsLmxpYnJhcnlHcm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2Fyb3VzZWxKUXVlcnlTZWxlY3RvciA9ICgnLm9wcGlhLWxpYnJhcnktY2Fyb3VzZWwtdGlsZXM6ZXEobiknLnJlcGxhY2UoJ24nLCBpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhcm91c2VsU2Nyb2xsUG9zaXRpb25QeCA9ICQoY2Fyb3VzZWxKUXVlcnlTZWxlY3Rvcikuc2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IE1hdGguY2VpbChjYXJvdXNlbFNjcm9sbFBvc2l0aW9uUHggLyBMSUJSQVJZX1RJTEVfV0lEVEhfUFgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubGVmdG1vc3RDYXJkSW5kaWNlc1tpXSA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNBbnlDYXJvdXNlbEN1cnJlbnRseVNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNjcm9sbCA9IGZ1bmN0aW9uIChpbmQsIGlzTGVmdFNjcm9sbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQW55Q2Fyb3VzZWxDdXJyZW50bHlTY3JvbGxpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2Fyb3VzZWxKUXVlcnlTZWxlY3RvciA9ICgnLm9wcGlhLWxpYnJhcnktY2Fyb3VzZWwtdGlsZXM6ZXEobiknLnJlcGxhY2UoJ24nLCBpbmQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSBpc0xlZnRTY3JvbGwgPyAtMSA6IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ID0gJChjYXJvdXNlbEpRdWVyeVNlbGVjdG9yKS5zY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IHNjcm9sbGluZyBpZiB0aGVyZSBtb3JlIGNhcm91c2VsIHBpeGVkIHdpZHRocyB0aGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGVyZSBhcmUgdGlsZSB3aWR0aHMuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5saWJyYXJ5R3JvdXBzW2luZF0uYWN0aXZpdHlfc3VtbWFyeV9kaWN0cy5sZW5ndGggPD1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnRpbGVEaXNwbGF5Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJvdXNlbFNjcm9sbFBvc2l0aW9uUHggPSBNYXRoLm1heCgwLCBjYXJvdXNlbFNjcm9sbFBvc2l0aW9uUHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTGVmdFNjcm9sbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubGVmdG1vc3RDYXJkSW5kaWNlc1tpbmRdID0gTWF0aC5tYXgoMCwgY3RybC5sZWZ0bW9zdENhcmRJbmRpY2VzW2luZF0gLSBjdHJsLnRpbGVEaXNwbGF5Q291bnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5sZWZ0bW9zdENhcmRJbmRpY2VzW2luZF0gPSBNYXRoLm1pbihjdHJsLmxpYnJhcnlHcm91cHNbaW5kXS5hY3Rpdml0eV9zdW1tYXJ5X2RpY3RzLmxlbmd0aCAtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGlsZURpc3BsYXlDb3VudCArIDEsIGN0cmwubGVmdG1vc3RDYXJkSW5kaWNlc1tpbmRdICsgY3RybC50aWxlRGlzcGxheUNvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdTY3JvbGxQb3NpdGlvblB4ID0gY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY3RybC50aWxlRGlzcGxheUNvdW50ICogTElCUkFSWV9USUxFX1dJRFRIX1BYICogZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoY2Fyb3VzZWxKUXVlcnlTZWxlY3RvcikuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVmdDogbmV3U2Nyb2xsUG9zaXRpb25QeFxuICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA4MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQW55Q2Fyb3VzZWxDdXJyZW50bHlTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBbnlDYXJvdXNlbEN1cnJlbnRseVNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgY2Fyb3VzZWxzIGRvIG5vdCB3b3JrIHdoZW4gdGhlIHdpZHRoIGlzIDEgY2FyZCBsb25nLCBzbyB3ZSBuZWVkXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGhhbmRsZSB0aGlzIGNhc2UgZGlzY3JldGVseSBhbmQgYWxzbyBwcmV2ZW50IHN3aXBpbmcgcGFzdCB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gZmlyc3QgYW5kIGxhc3QgY2FyZC5cbiAgICAgICAgICAgICAgICAgICAgY3RybC5pbmNyZW1lbnRMZWZ0bW9zdENhcmRJbmRleCA9IGZ1bmN0aW9uIChpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0SXRlbSA9ICgoY3RybC5saWJyYXJ5R3JvdXBzW2luZF0uYWN0aXZpdHlfc3VtbWFyeV9kaWN0cy5sZW5ndGggLVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGlsZURpc3BsYXlDb3VudCkgPD0gY3RybC5sZWZ0bW9zdENhcmRJbmRpY2VzW2luZF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFsYXN0SXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubGVmdG1vc3RDYXJkSW5kaWNlc1tpbmRdKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZGVjcmVtZW50TGVmdG1vc3RDYXJkSW5kZXggPSBmdW5jdGlvbiAoaW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmxlZnRtb3N0Q2FyZEluZGljZXNbaW5kXSA9IChNYXRoLm1heChjdHJsLmxlZnRtb3N0Q2FyZEluZGljZXNbaW5kXSAtIDEsIDApKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0Q2Fyb3VzZWxzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIG5lZWRlZCwgb3RoZXJ3aXNlIGN0cmwudGlsZURpc3BsYXlDb3VudCB0YWtlcyBhIGxvbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRpbWUgKHNldmVyYWwgc2Vjb25kcykgdG8gdXBkYXRlLlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdGl2YXRlU2VhcmNoTW9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLnBhZ2VNb2RlICE9PSBMSUJSQVJZX1BBR0VfTU9ERVMuU0VBUkNIKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLm9wcGlhLWxpYnJhcnktY29udGFpbmVyJykuZmFkZU91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucGFnZU1vZGUgPSBMSUJSQVJZX1BBR0VfTU9ERVMuU0VBUkNIO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcub3BwaWEtbGlicmFyeS1jb250YWluZXInKS5mYWRlSW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGxvYWRzIGV4cGxvcmF0aW9ucyBiZWxvbmdpbmcgdG8gYSBwYXJ0aWN1bGFyIGdyb3VwLlxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBmdWxsUmVzdWx0c1VybCBpcyBnaXZlbiBpdCBsb2FkcyB0aGUgcGFnZSBjb3JyZXNwb25kaW5nIHRvXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSB1cmwuIE90aGVyd2lzZSwgaXQgd2lsbCBpbml0aWF0ZSBhIHNlYXJjaCBxdWVyeSBmb3IgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIGdpdmVuIGxpc3Qgb2YgY2F0ZWdvcmllcy5cbiAgICAgICAgICAgICAgICAgICAgY3RybC5zaG93RnVsbFJlc3VsdHNQYWdlID0gZnVuY3Rpb24gKGNhdGVnb3JpZXMsIGZ1bGxSZXN1bHRzVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnVsbFJlc3VsdHNVcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uLmhyZWYgPSBmdWxsUmVzdWx0c1VybDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZENhdGVnb3JpZXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhdGVnb3JpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRDYXRlZ29yaWVzW2NhdGVnb3JpZXNbaV1dID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldFNlYXJjaFF1ZXJ5VXJsID0gU2VhcmNoU2VydmljZS5nZXRTZWFyY2hVcmxRdWVyeVN0cmluZygnJywgc2VsZWN0ZWRDYXRlZ29yaWVzLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy9zZWFyY2gvZmluZD9xPScgKyB0YXJnZXRTZWFyY2hRdWVyeVVybDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpYnJhcnlXaW5kb3dDdXRvZmZQeCA9IDUzMDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5saWJyYXJ5V2luZG93SXNOYXJyb3cgPSAoV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKSA8PSBsaWJyYXJ5V2luZG93Q3V0b2ZmUHgpO1xuICAgICAgICAgICAgICAgICAgICBXaW5kb3dEaW1lbnNpb25zU2VydmljZS5yZWdpc3Rlck9uUmVzaXplSG9vayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmxpYnJhcnlXaW5kb3dJc05hcnJvdyA9IChXaW5kb3dEaW1lbnNpb25zU2VydmljZS5nZXRXaWR0aCgpIDw9IGxpYnJhcnlXaW5kb3dDdXRvZmZQeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgbGlicmFyeSBwYWdlLlxuICovXG5yZXF1aXJlKFwiY29yZS1qcy9lczcvcmVmbGVjdFwiKTtcbnJlcXVpcmUoXCJ6b25lLmpzXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGh0dHBfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb21tb24vaHR0cFwiKTtcbi8vIFRoaXMgY29tcG9uZW50IGlzIG5lZWRlZCB0byBmb3JjZS1ib290c3RyYXAgQW5ndWxhciBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZVxuLy8gYXBwLlxudmFyIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCgpIHtcbiAgICB9XG4gICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuQ29tcG9uZW50KHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnc2VydmljZS1ib290c3RyYXAnLFxuICAgICAgICAgICAgdGVtcGxhdGU6ICcnXG4gICAgICAgIH0pXG4gICAgXSwgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCk7XG4gICAgcmV0dXJuIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQ7XG59KCkpO1xuZXhwb3J0cy5TZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbnZhciBhcHBfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiYXBwLmNvbnN0YW50c1wiKTtcbnZhciBjb2xsZWN0aW9uX3N1bW1hcnlfdGlsZV9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJjb21wb25lbnRzL3N1bW1hcnktdGlsZS9jb2xsZWN0aW9uLXN1bW1hcnktdGlsZS5jb25zdGFudHNcIik7XG52YXIgaW50ZXJhY3Rpb25zX2V4dGVuc2lvbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJpbnRlcmFjdGlvbnMvaW50ZXJhY3Rpb25zLWV4dGVuc2lvbi5jb25zdGFudHNcIik7XG52YXIgb2JqZWN0c19kb21haW5fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiZG9tYWluL29iamVjdHMvb2JqZWN0cy1kb21haW4uY29uc3RhbnRzXCIpO1xudmFyIHNlcnZpY2VzX2NvbnN0YW50c18xID0gcmVxdWlyZShcInNlcnZpY2VzL3NlcnZpY2VzLmNvbnN0YW50c1wiKTtcbnZhciBsaWJyYXJ5X3BhZ2VfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwicGFnZXMvbGlicmFyeS1wYWdlL2xpYnJhcnktcGFnZS5jb25zdGFudHNcIik7XG52YXIgTGlicmFyeVBhZ2VNb2R1bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlicmFyeVBhZ2VNb2R1bGUoKSB7XG4gICAgfVxuICAgIC8vIEVtcHR5IHBsYWNlaG9sZGVyIG1ldGhvZCB0byBzYXRpc2Z5IHRoZSBgQ29tcGlsZXJgLlxuICAgIExpYnJhcnlQYWdlTW9kdWxlLnByb3RvdHlwZS5uZ0RvQm9vdHN0cmFwID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIExpYnJhcnlQYWdlTW9kdWxlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5OZ01vZHVsZSh7XG4gICAgICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgICAgICAgcGxhdGZvcm1fYnJvd3Nlcl8xLkJyb3dzZXJNb2R1bGUsXG4gICAgICAgICAgICAgICAgaHR0cF8xLkh0dHBDbGllbnRNb2R1bGVcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZW50cnlDb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICAgICAgICAgIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbl9zdW1tYXJ5X3RpbGVfY29uc3RhbnRzXzEuQ29sbGVjdGlvblN1bW1hcnlUaWxlQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEuSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBvYmplY3RzX2RvbWFpbl9jb25zdGFudHNfMS5PYmplY3RzRG9tYWluQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIHNlcnZpY2VzX2NvbnN0YW50c18xLlNlcnZpY2VzQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIGxpYnJhcnlfcGFnZV9jb25zdGFudHNfMS5MaWJyYXJ5UGFnZUNvbnN0YW50c1xuICAgICAgICAgICAgXVxuICAgICAgICB9KVxuICAgIF0sIExpYnJhcnlQYWdlTW9kdWxlKTtcbiAgICByZXR1cm4gTGlicmFyeVBhZ2VNb2R1bGU7XG59KCkpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfZHluYW1pY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pY1wiKTtcbnZhciBzdGF0aWNfMiA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBib290c3RyYXBGbiA9IGZ1bmN0aW9uIChleHRyYVByb3ZpZGVycykge1xuICAgIHZhciBwbGF0Zm9ybVJlZiA9IHBsYXRmb3JtX2Jyb3dzZXJfZHluYW1pY18xLnBsYXRmb3JtQnJvd3NlckR5bmFtaWMoZXh0cmFQcm92aWRlcnMpO1xuICAgIHJldHVybiBwbGF0Zm9ybVJlZi5ib290c3RyYXBNb2R1bGUoTGlicmFyeVBhZ2VNb2R1bGUpO1xufTtcbnZhciBkb3duZ3JhZGVkTW9kdWxlID0gc3RhdGljXzIuZG93bmdyYWRlTW9kdWxlKGJvb3RzdHJhcEZuKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScsIFtcbiAgICAnZG5kTGlzdHMnLCAnaGVhZHJvb20nLCAnaW5maW5pdGUtc2Nyb2xsJywgJ25nQW5pbWF0ZScsXG4gICAgJ25nQXVkaW8nLCAnbmdDb29raWVzJywgJ25nSW1nQ3JvcCcsICduZ0pveVJpZGUnLCAnbmdNYXRlcmlhbCcsXG4gICAgJ25nUmVzb3VyY2UnLCAnbmdTYW5pdGl6ZScsICduZ1RvdWNoJywgJ3Bhc2NhbHByZWNodC50cmFuc2xhdGUnLFxuICAgICd0b2FzdHInLCAndWkuYm9vdHN0cmFwJywgJ3VpLnNvcnRhYmxlJywgJ3VpLnRyZWUnLCAndWkudmFsaWRhdGUnLFxuICAgIGRvd25ncmFkZWRNb2R1bGVcbl0pXG4gICAgLy8gVGhpcyBkaXJlY3RpdmUgaXMgdGhlIGRvd25ncmFkZWQgdmVyc2lvbiBvZiB0aGUgQW5ndWxhciBjb21wb25lbnQgdG9cbiAgICAvLyBib290c3RyYXAgdGhlIEFuZ3VsYXIgOC5cbiAgICAuZGlyZWN0aXZlKCdzZXJ2aWNlQm9vdHN0cmFwJywgc3RhdGljXzEuZG93bmdyYWRlQ29tcG9uZW50KHtcbiAgICBjb21wb25lbnQ6IFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbn0pKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlcyByZXF1aXJlZCBpbiBsaWJyYXJ5LlxuICovXG4vLyBUaGUgbW9kdWxlIG5lZWRzIHRvIGJlIGxvYWRlZCBiZWZvcmUgZXZlcnl0aGluZyBlbHNlIHNpbmNlIGl0IGRlZmluZXMgdGhlXG4vLyBtYWluIG1vZHVsZSB0aGUgZWxlbWVudHMgYXJlIGF0dGFjaGVkIHRvLlxucmVxdWlyZSgncGFnZXMvbGlicmFyeS1wYWdlL2xpYnJhcnktcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ0FwcC50cycpO1xucmVxdWlyZSgnYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1wYWdlLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvbGlicmFyeS1wYWdlL2xpYnJhcnktZm9vdGVyL2xpYnJhcnktZm9vdGVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvbGlicmFyeS1wYWdlL3NlYXJjaC1iYXIvc2VhcmNoLWJhci5kaXJlY3RpdmUudHMnKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgU2VhcmNoIEJhci5cbiAqL1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLmZpbHRlci50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9MYW5ndWFnZVV0aWxTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Db25zdHJ1Y3RUcmFuc2xhdGlvbklkc1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0RlYm91bmNlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0h0bWxFc2NhcGVyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvTmF2aWdhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NlYXJjaFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzZWFyY2hCYXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9saWJyYXJ5LXBhZ2Uvc2VhcmNoLWJhci9zZWFyY2gtYmFyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRsb2NhdGlvbicsICckcm9vdFNjb3BlJywgJyRzY29wZScsICckdGltZW91dCcsICckdHJhbnNsYXRlJyxcbiAgICAgICAgICAgICAgICAnJHdpbmRvdycsICdDb25zdHJ1Y3RUcmFuc2xhdGlvbklkc1NlcnZpY2UnLCAnRGVib3VuY2VyU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0h0bWxFc2NhcGVyU2VydmljZScsICdMYW5ndWFnZVV0aWxTZXJ2aWNlJywgJ05hdmlnYXRpb25TZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnU2VhcmNoU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ1NFQVJDSF9EUk9QRE9XTl9DQVRFR09SSUVTJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJGxvY2F0aW9uLCAkcm9vdFNjb3BlLCAkc2NvcGUsICR0aW1lb3V0LCAkdHJhbnNsYXRlLCAkd2luZG93LCBDb25zdHJ1Y3RUcmFuc2xhdGlvbklkc1NlcnZpY2UsIERlYm91bmNlclNlcnZpY2UsIEh0bWxFc2NhcGVyU2VydmljZSwgTGFuZ3VhZ2VVdGlsU2VydmljZSwgTmF2aWdhdGlvblNlcnZpY2UsIFNlYXJjaFNlcnZpY2UsIFVybFNlcnZpY2UsIFNFQVJDSF9EUk9QRE9XTl9DQVRFR09SSUVTKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1NlYXJjaEluUHJvZ3Jlc3MgPSBTZWFyY2hTZXJ2aWNlLmlzU2VhcmNoSW5Qcm9ncmVzcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5TRUFSQ0hfRFJPUERPV05fQ0FURUdPUklFUyA9IChTRUFSQ0hfRFJPUERPV05fQ0FURUdPUklFUy5tYXAoZnVuY3Rpb24gKGNhdGVnb3J5TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogY2F0ZWdvcnlOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IENvbnN0cnVjdFRyYW5zbGF0aW9uSWRzU2VydmljZS5nZXRMaWJyYXJ5SWQoJ2NhdGVnb3JpZXMnLCBjYXRlZ29yeU5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuQUNUSU9OX09QRU4gPSBOYXZpZ2F0aW9uU2VydmljZS5BQ1RJT05fT1BFTjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5BQ1RJT05fQ0xPU0UgPSBOYXZpZ2F0aW9uU2VydmljZS5BQ1RJT05fQ0xPU0U7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuS0VZQk9BUkRfRVZFTlRfVE9fS0VZX0NPREVTID1cbiAgICAgICAgICAgICAgICAgICAgICAgIE5hdmlnYXRpb25TZXJ2aWNlLktFWUJPQVJEX0VWRU5UX1RPX0tFWV9DT0RFUztcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE9wZW5zIHRoZSBzdWJtZW51LlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZ0XG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZW51TmFtZSAtIG5hbWUgb2YgbWVudSwgb24gd2hpY2hcbiAgICAgICAgICAgICAgICAgICAgICogb3Blbi9jbG9zZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIChjYXRlZ29yeSxsYW5ndWFnZSkuXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9wZW5TdWJtZW51ID0gZnVuY3Rpb24gKGV2dCwgbWVudU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE5hdmlnYXRpb25TZXJ2aWNlLm9wZW5TdWJtZW51KGV2dCwgbWVudU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogSGFuZGxlcyBrZXlkb3duIGV2ZW50cyBvbiBtZW51cy5cbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2dFxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVudU5hbWUgLSBuYW1lIG9mIG1lbnUgdG8gcGVyZm9ybSBhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICogb24oY2F0ZWdvcnkvbGFuZ3VhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudHNUb2JlSGFuZGxlZCAtIE1hcCBrZXlib2FyZCBldmVudHMoJ0VudGVyJykgdG9cbiAgICAgICAgICAgICAgICAgICAgICogY29ycmVzcG9uZGluZyBhY3Rpb25zIHRvIGJlIHBlcmZvcm1lZChvcGVuL2Nsb3NlKS5cbiAgICAgICAgICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAgICAgICAgICogIG9uTWVudUtleXByZXNzKCRldmVudCwgJ2NhdGVnb3J5Jywge2VudGVyOiAnb3Blbid9KVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbk1lbnVLZXlwcmVzcyA9IGZ1bmN0aW9uIChldnQsIG1lbnVOYW1lLCBldmVudHNUb2JlSGFuZGxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgTmF2aWdhdGlvblNlcnZpY2Uub25NZW51S2V5cHJlc3MoZXZ0LCBtZW51TmFtZSwgZXZlbnRzVG9iZUhhbmRsZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVNZW51TmFtZSA9IE5hdmlnYXRpb25TZXJ2aWNlLmFjdGl2ZU1lbnVOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkFMTF9MQU5HVUFHRV9DT0RFUyA9IChMYW5ndWFnZVV0aWxTZXJ2aWNlLmdldExhbmd1YWdlSWRzQW5kVGV4dHMoKSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2VhcmNoUXVlcnkgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZWxlY3Rpb25EZXRhaWxzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcmllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtc05hbWU6ICdjYXRlZ29yaWVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXN0ZXJMaXN0OiBjdHJsLlNFQVJDSF9EUk9QRE9XTl9DQVRFR09SSUVTLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bVNlbGVjdGlvbnM6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uczoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeTogJydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBsYW5ndWFnZUNvZGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zTmFtZTogJ2xhbmd1YWdlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzdGVyTGlzdDogY3RybC5BTExfTEFOR1VBR0VfQ09ERVMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtU2VsZWN0aW9uczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25zOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBOb24tdHJhbnNsYXRhYmxlIHBhcnRzIG9mIHRoZSBodG1sIHN0cmluZ3MsIGxpa2UgbnVtYmVycyBvciB1c2VyXG4gICAgICAgICAgICAgICAgICAgIC8vIG5hbWVzLlxuICAgICAgICAgICAgICAgICAgICBjdHJsLnRyYW5zbGF0aW9uRGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRlc2NyaXB0aW9uLCBudW1TZWxlY3Rpb25zIGFuZCBzdW1tYXJ5IGZpZWxkcyBvZiB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVsZXZhbnQgZW50cnkgb2YgY3RybC5zZWxlY3Rpb25EZXRhaWxzLlxuICAgICAgICAgICAgICAgICAgICB2YXIgdXBkYXRlU2VsZWN0aW9uRGV0YWlscyA9IGZ1bmN0aW9uIChpdGVtc1R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpdGVtc05hbWUgPSBjdHJsLnNlbGVjdGlvbkRldGFpbHNbaXRlbXNUeXBlXS5pdGVtc05hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFzdGVyTGlzdCA9IGN0cmwuc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdLm1hc3Rlckxpc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWRJdGVtcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXN0ZXJMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwuc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZWxlY3Rpb25zW21hc3Rlckxpc3RbaV0uaWRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbXMucHVzaChtYXN0ZXJMaXN0W2ldLnRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b3RhbENvdW50ID0gc2VsZWN0ZWRJdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNlbGVjdGlvbkRldGFpbHNbaXRlbXNUeXBlXS5udW1TZWxlY3Rpb25zID0gdG90YWxDb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdLnN1bW1hcnkgPSAodG90YWxDb3VudCA9PT0gMCA/ICdJMThOX0xJQlJBUllfQUxMXycgKyBpdGVtc05hbWUudG9VcHBlckNhc2UoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxDb3VudCA9PT0gMSA/IHNlbGVjdGVkSXRlbXNbMF0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnSTE4Tl9MSUJSQVJZX05fJyArIGl0ZW1zTmFtZS50b1VwcGVyQ2FzZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudHJhbnNsYXRpb25EYXRhW2l0ZW1zTmFtZSArICdDb3VudCddID0gdG90YWxDb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE8obWlsaXQpOiBXaGVuIHRoZSBsYW5ndWFnZSBjaGFuZ2VzLCB0aGUgdHJhbnNsYXRpb25zIHdvbid0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGFuZ2UgdW50aWwgdGhlIHVzZXIgY2hhbmdlcyB0aGUgc2VsZWN0aW9uIGFuZCB0aGlzIGZ1bmN0aW9uIGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyByZS1leGVjdXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZEl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNsYXRlZEl0ZW1zID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxlY3RlZEl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZWRJdGVtcy5wdXNoKCR0cmFuc2xhdGUuaW5zdGFudChzZWxlY3RlZEl0ZW1zW2ldKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdLmRlc2NyaXB0aW9uID0gKHRyYW5zbGF0ZWRJdGVtcy5qb2luKCcsICcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdLmRlc2NyaXB0aW9uID0gKCdJMThOX0xJQlJBUllfQUxMXycgKyBpdGVtc05hbWUudG9VcHBlckNhc2UoKSArICdfU0VMRUNURUQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC50b2dnbGVTZWxlY3Rpb24gPSBmdW5jdGlvbiAoaXRlbXNUeXBlLCBvcHRpb25OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0aW9ucyA9IGN0cmwuc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdLnNlbGVjdGlvbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbGVjdGlvbnMuaGFzT3duUHJvcGVydHkob3B0aW9uTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25zW29wdGlvbk5hbWVdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbnNbb3B0aW9uTmFtZV0gPSAhc2VsZWN0aW9uc1tvcHRpb25OYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVNlbGVjdGlvbkRldGFpbHMoaXRlbXNUeXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uU2VhcmNoUXVlcnlDaGFuZ2VFeGVjKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZGVzZWxlY3RBbGwgPSBmdW5jdGlvbiAoaXRlbXNUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNlbGVjdGlvbkRldGFpbHNbaXRlbXNUeXBlXS5zZWxlY3Rpb25zID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVTZWxlY3Rpb25EZXRhaWxzKGl0ZW1zVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvblNlYXJjaFF1ZXJ5Q2hhbmdlRXhlYygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJHdhdGNoKCckY3RybC5zZWFyY2hRdWVyeScsIGZ1bmN0aW9uIChuZXdRdWVyeSwgb2xkUXVlcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJ1biBvbmx5IGlmIHRoZSBxdWVyeSBoYXMgY2hhbmdlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdRdWVyeSAhPT0gb2xkUXVlcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblNlYXJjaFF1ZXJ5Q2hhbmdlRXhlYygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uU2VhcmNoUXVlcnlDaGFuZ2VFeGVjID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2VhcmNoU2VydmljZS5leGVjdXRlU2VhcmNoUXVlcnkoY3RybC5zZWFyY2hRdWVyeSwgY3RybC5zZWxlY3Rpb25EZXRhaWxzLmNhdGVnb3JpZXMuc2VsZWN0aW9ucywgY3RybC5zZWxlY3Rpb25EZXRhaWxzLmxhbmd1YWdlQ29kZXMuc2VsZWN0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VhcmNoVXJsUXVlcnlTdHJpbmcgPSBTZWFyY2hTZXJ2aWNlLmdldFNlYXJjaFVybFF1ZXJ5U3RyaW5nKGN0cmwuc2VhcmNoUXVlcnksIGN0cmwuc2VsZWN0aW9uRGV0YWlscy5jYXRlZ29yaWVzLnNlbGVjdGlvbnMsIGN0cmwuc2VsZWN0aW9uRGV0YWlscy5sYW5ndWFnZUNvZGVzLnNlbGVjdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPT09ICcvc2VhcmNoL2ZpbmQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxvY2F0aW9uLnVybCgnL2ZpbmQ/cT0nICsgc2VhcmNoVXJsUXVlcnlTdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy9zZWFyY2gvZmluZD9xPScgKyBzZWFyY2hVcmxRdWVyeVN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgc2VsZWN0aW9uIGRlc2NyaXB0aW9ucyBhbmQgc3VtbWFyaWVzLlxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpdGVtc1R5cGUgaW4gY3RybC5zZWxlY3Rpb25EZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVTZWxlY3Rpb25EZXRhaWxzKGl0ZW1zVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHVwZGF0ZVNlYXJjaEZpZWxkc0Jhc2VkT25VcmxRdWVyeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRRdWVyeVN0cmluZyA9IFNlYXJjaFNlcnZpY2UuZ2V0Q3VycmVudFVybFF1ZXJ5U3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNlbGVjdGlvbkRldGFpbHMuY2F0ZWdvcmllcy5zZWxlY3Rpb25zID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNlbGVjdGlvbkRldGFpbHMubGFuZ3VhZ2VDb2Rlcy5zZWxlY3Rpb25zID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNlYXJjaFF1ZXJ5ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTZWFyY2hTZXJ2aWNlLnVwZGF0ZVNlYXJjaEZpZWxkc0Jhc2VkT25VcmxRdWVyeSgkd2luZG93LmxvY2F0aW9uLnNlYXJjaCwgY3RybC5zZWxlY3Rpb25EZXRhaWxzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVNlbGVjdGlvbkRldGFpbHMoJ2NhdGVnb3JpZXMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVNlbGVjdGlvbkRldGFpbHMoJ2xhbmd1YWdlQ29kZXMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdRdWVyeVN0cmluZyA9IFNlYXJjaFNlcnZpY2UuZ2V0Q3VycmVudFVybFF1ZXJ5U3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2xkUXVlcnlTdHJpbmcgIT09IG5ld1F1ZXJ5U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25TZWFyY2hRdWVyeUNoYW5nZUV4ZWMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignJGxvY2F0aW9uQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChVcmxTZXJ2aWNlLmdldFVybFBhcmFtcygpLmhhc093blByb3BlcnR5KCdxJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVTZWFyY2hGaWVsZHNCYXNlZE9uVXJsUXVlcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ3ByZWZlcnJlZExhbmd1YWdlQ29kZXNMb2FkZWQnLCBmdW5jdGlvbiAoZXZ0LCBwcmVmZXJyZWRMYW5ndWFnZUNvZGVzTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmVycmVkTGFuZ3VhZ2VDb2Rlc0xpc3QuZm9yRWFjaChmdW5jdGlvbiAobGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdGlvbnMgPSBjdHJsLnNlbGVjdGlvbkRldGFpbHMubGFuZ3VhZ2VDb2Rlcy5zZWxlY3Rpb25zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2VsZWN0aW9ucy5oYXNPd25Qcm9wZXJ0eShsYW5ndWFnZUNvZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbnNbbGFuZ3VhZ2VDb2RlXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25zW2xhbmd1YWdlQ29kZV0gPSAhc2VsZWN0aW9uc1tsYW5ndWFnZUNvZGVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlU2VsZWN0aW9uRGV0YWlscygnbGFuZ3VhZ2VDb2RlcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFVybFNlcnZpY2UuZ2V0VXJsUGFyYW1zKCkuaGFzT3duUHJvcGVydHkoJ3EnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVNlYXJjaEZpZWxkc0Jhc2VkT25VcmxRdWVyeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPT09ICcvc2VhcmNoL2ZpbmQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25TZWFyY2hRdWVyeUNoYW5nZUV4ZWMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZnJlc2hTZWFyY2hCYXJMYWJlbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGlmeSB0aGUgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIG92ZXJmbG93IGluIGNhc2UgdGhlIHNlYXJjaFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWxlbWVudHMgbG9hZCBhZnRlciBpdCBoYXMgYWxyZWFkeSBiZWVuIHJ1bi5cbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VhcmNoQmFyTG9hZGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVmcmVzaFNlYXJjaEJhckxhYmVscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHlvdSB0cmFuc2xhdGUgdGhlc2Ugc3RyaW5ncyBpbiB0aGUgaHRtbCwgdGhlbiB5b3UgbXVzdCB1c2UgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmlsdGVyIGJlY2F1c2Ugb25seSB0aGUgZmlyc3QgMTQgY2hhcmFjdGVycyBhcmUgZGlzcGxheWVkLiBUaGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3b3VsZCBnZW5lcmF0ZSBGT1VDIGZvciBsYW5ndWFnZXMgb3RoZXIgdGhhbiBFbmdsaXNoLiBBcyBhblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhjZXB0aW9uLCB3ZSB0cmFuc2xhdGUgdGhlbSBoZXJlIGFuZCB1cGRhdGUgdGhlIHRyYW5zbGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBldmVyeSB0aW1lIHRoZSBsYW5ndWFnZSBpcyBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zZWFyY2hCYXJQbGFjZWhvbGRlciA9ICR0cmFuc2xhdGUuaW5zdGFudCgnSTE4Tl9MSUJSQVJZX1NFQVJDSF9QTEFDRUhPTERFUicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ21lc3NhZ2Vmb3JtYXQnIGlzIHRoZSBpbnRlcnBvbGF0aW9uIG1ldGhvZCBmb3IgcGx1cmFsIGZvcm1zLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaHR0cDovL2FuZ3VsYXItdHJhbnNsYXRlLmdpdGh1Yi5pby9kb2NzLyMvZ3VpZGUvMTRfcGx1cmFsaXphdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY2F0ZWdvcnlCdXR0b25UZXh0ID0gJHRyYW5zbGF0ZS5pbnN0YW50KGN0cmwuc2VsZWN0aW9uRGV0YWlscy5jYXRlZ29yaWVzLnN1bW1hcnksIGN0cmwudHJhbnNsYXRpb25EYXRhLCAnbWVzc2FnZWZvcm1hdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5sYW5ndWFnZUJ1dHRvblRleHQgPSAkdHJhbnNsYXRlLmluc3RhbnQoY3RybC5zZWxlY3Rpb25EZXRhaWxzLmxhbmd1YWdlQ29kZXMuc3VtbWFyeSwgY3RybC50cmFuc2xhdGlvbkRhdGEsICdtZXNzYWdlZm9ybWF0Jyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJG9uKCckdHJhbnNsYXRlQ2hhbmdlU3VjY2VzcycsIHJlZnJlc2hTZWFyY2hCYXJMYWJlbHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhbiBpbmZpbml0ZWx5LXNjcm9sbGFibGUgdmlldyBvZiBhY3Rpdml0eSB0aWxlc1xuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TZWFyY2hTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2FjdGl2aXR5VGlsZXNJbmZpbml0eUdyaWQnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9saWJyYXJ5LXBhZ2Uvc2VhcmNoLXJlc3VsdHMvJyArXG4gICAgICAgICAgICAgICAgJ2FjdGl2aXR5LXRpbGVzLWluZmluaXR5LWdyaWQuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnU2VhcmNoU2VydmljZScsICdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgU2VhcmNoU2VydmljZSwgV2luZG93RGltZW5zaW9uc1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmVuZE9mUGFnZUlzUmVhY2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmFsbEFjdGl2aXRpZXNJbk9yZGVyID0gW107XG4gICAgICAgICAgICAgICAgICAgIC8vIENhbGxlZCB3aGVuIHRoZSBmaXJzdCBiYXRjaCBvZiBzZWFyY2ggcmVzdWx0cyBpcyByZXRyaWV2ZWQgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VydmVyLlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdpbml0aWFsU2VhcmNoUmVzdWx0c0xvYWRlZCcsIGZ1bmN0aW9uIChldnQsIGFjdGl2aXR5TGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hbGxBY3Rpdml0aWVzSW5PcmRlciA9IGFjdGl2aXR5TGlzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZW5kT2ZQYWdlSXNSZWFjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dNb3JlQWN0aXZpdGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSAmJiAhY3RybC5lbmRPZlBhZ2VJc1JlYWNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNlYXJjaFJlc3VsdHNBcmVMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTZWFyY2hTZXJ2aWNlLmxvYWRNb3JlRGF0YShmdW5jdGlvbiAoZGF0YSwgZW5kT2ZQYWdlSXNSZWFjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuYWxsQWN0aXZpdGllc0luT3JkZXIgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hbGxBY3Rpdml0aWVzSW5PcmRlci5jb25jYXQoZGF0YS5hY3Rpdml0eV9saXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5lbmRPZlBhZ2VJc1JlYWNoZWQgPSBlbmRPZlBhZ2VJc1JlYWNoZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2VhcmNoUmVzdWx0c0FyZUxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZW5kT2ZQYWdlSXNSZWFjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZW5kT2ZQYWdlSXNSZWFjaGVkID0gZW5kT2ZQYWdlSXNSZWFjaGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNlYXJjaFJlc3VsdHNBcmVMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaWJyYXJ5V2luZG93Q3V0b2ZmUHggPSA1MzA7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubGlicmFyeVdpbmRvd0lzTmFycm93ID0gKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCkgPD0gbGlicmFyeVdpbmRvd0N1dG9mZlB4KTtcbiAgICAgICAgICAgICAgICAgICAgV2luZG93RGltZW5zaW9uc1NlcnZpY2UucmVnaXN0ZXJPblJlc2l6ZUhvb2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5saWJyYXJ5V2luZG93SXNOYXJyb3cgPSAoV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKSA8PSBsaWJyYXJ5V2luZG93Q3V0b2ZmUHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3Igc2hvd2luZyBzZWFyY2ggcmVzdWx0cy5cbiAqL1xucmVxdWlyZSgncGFnZXMvbGlicmFyeS1wYWdlL3NlYXJjaC1yZXN1bHRzLycgK1xuICAgICdhY3Rpdml0eS10aWxlcy1pbmZpbml0eS1ncmlkLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU2l0ZUFuYWx5dGljc1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1VzZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NlYXJjaFJlc3VsdHMnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9saWJyYXJ5LXBhZ2Uvc2VhcmNoLXJlc3VsdHMvc2VhcmNoLXJlc3VsdHMuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJHEnLCAnJHRpbWVvdXQnLCAnJHdpbmRvdycsXG4gICAgICAgICAgICAgICAgJ1NpdGVBbmFseXRpY3NTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCAkcSwgJHRpbWVvdXQsICR3aW5kb3csIFNpdGVBbmFseXRpY3NTZXJ2aWNlLCBVc2VyU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc29tZVJlc3VsdHNFeGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJ0xvYWRpbmcnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlckluZm9Qcm9taXNlID0gVXNlclNlcnZpY2UuZ2V0VXNlckluZm9Bc3luYygpO1xuICAgICAgICAgICAgICAgICAgICB1c2VySW5mb1Byb21pc2UudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSB1c2VySW5mby5pc0xvZ2dlZEluKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBDYWxsZWQgd2hlbiB0aGUgZmlyc3QgYmF0Y2ggb2Ygc2VhcmNoIHJlc3VsdHMgaXMgcmV0cmlldmVkIGZyb20gdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHNlcnZlci5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlYXJjaFJlc3VsdHNQcm9taXNlID0gJHNjb3BlLiRvbignaW5pdGlhbFNlYXJjaFJlc3VsdHNMb2FkZWQnLCBmdW5jdGlvbiAoZXZ0LCBhY3Rpdml0eUxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc29tZVJlc3VsdHNFeGlzdCA9IGFjdGl2aXR5TGlzdC5sZW5ndGggPiAwO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHEuYWxsKFt1c2VySW5mb1Byb21pc2UsIHNlYXJjaFJlc3VsdHNQcm9taXNlXSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uUmVkaXJlY3RUb0xvZ2luID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTaXRlQW5hbHl0aWNzU2VydmljZS5yZWdpc3RlclN0YXJ0TG9naW5FdmVudCgnbm9TZWFyY2hSZXN1bHRzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbiA9IGRlc3RpbmF0aW9uVXJsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5ub0V4cGxvcmF0aW9uc0ltZ1VybCA9XG4gICAgICAgICAgICAgICAgICAgICAgICBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2dlbmVyYWwvbm9fZXhwbG9yYXRpb25zX2ZvdW5kLnBuZycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gc2V0IHRoZSB0aXRsZSBvZiB0aGUgcGFnZS5cbiAqL1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyXCIpO1xudmFyIFBhZ2VUaXRsZVNlcnZpY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGFnZVRpdGxlU2VydmljZSh0aXRsZVNlcnZpY2UpIHtcbiAgICAgICAgdGhpcy50aXRsZVNlcnZpY2UgPSB0aXRsZVNlcnZpY2U7XG4gICAgfVxuICAgIFBhZ2VUaXRsZVNlcnZpY2UucHJvdG90eXBlLnNldFBhZ2VUaXRsZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgICAgICB0aGlzLnRpdGxlU2VydmljZS5zZXRUaXRsZSh0aXRsZSk7XG4gICAgfTtcbiAgICB2YXIgX2E7XG4gICAgUGFnZVRpdGxlU2VydmljZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSksXG4gICAgICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbdHlwZW9mIChfYSA9IHR5cGVvZiBwbGF0Zm9ybV9icm93c2VyXzEuVGl0bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgcGxhdGZvcm1fYnJvd3Nlcl8xLlRpdGxlKSA9PT0gXCJmdW5jdGlvblwiID8gX2EgOiBPYmplY3RdKVxuICAgIF0sIFBhZ2VUaXRsZVNlcnZpY2UpO1xuICAgIHJldHVybiBQYWdlVGl0bGVTZXJ2aWNlO1xufSgpKTtcbmV4cG9ydHMuUGFnZVRpdGxlU2VydmljZSA9IFBhZ2VUaXRsZVNlcnZpY2U7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdQYWdlVGl0bGVTZXJ2aWNlJywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShQYWdlVGl0bGVTZXJ2aWNlKSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IHNlYXJjaCBzZXJ2aWNlIGZvciBhY3Rpdml0eVRpbGVzSW5maW5pdHlHcmlkXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL3NlcnZpY2VzLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1NlYXJjaFNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRsb2cnLCAnJHJvb3RTY29wZScsICckdHJhbnNsYXRlJywgJ1NFQVJDSF9EQVRBX1VSTCcsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkbG9nLCAkcm9vdFNjb3BlLCAkdHJhbnNsYXRlLCBTRUFSQ0hfREFUQV9VUkwpIHtcbiAgICAgICAgdmFyIF9sYXN0UXVlcnkgPSBudWxsO1xuICAgICAgICB2YXIgX2xhc3RTZWxlY3RlZENhdGVnb3JpZXMgPSB7fTtcbiAgICAgICAgdmFyIF9sYXN0U2VsZWN0ZWRMYW5ndWFnZUNvZGVzID0ge307XG4gICAgICAgIHZhciBfc2VhcmNoQ3Vyc29yID0gbnVsbDtcbiAgICAgICAgLy8gQXBwZW5kcyBhIHN1ZmZpeCB0byB0aGUgcXVlcnkgZGVzY3JpYmluZyBhbGxvd2VkIGNhdGVnb3J5IGFuZCBsYW5ndWFnZVxuICAgICAgICAvLyBjb2RlcyB0byBmaWx0ZXIgb24uXG4gICAgICAgIHZhciBfZ2V0U3VmZml4Rm9yUXVlcnkgPSBmdW5jdGlvbiAoc2VsZWN0ZWRDYXRlZ29yaWVzLCBzZWxlY3RlZExhbmd1YWdlQ29kZXMpIHtcbiAgICAgICAgICAgIHZhciBxdWVyeVN1ZmZpeCA9ICcnO1xuICAgICAgICAgICAgdmFyIF9jYXRlZ29yaWVzID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc2VsZWN0ZWRDYXRlZ29yaWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkQ2F0ZWdvcmllc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfY2F0ZWdvcmllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2NhdGVnb3JpZXMgKz0gJ1wiIE9SIFwiJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBfY2F0ZWdvcmllcyArPSBrZXk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKF9jYXRlZ29yaWVzKSB7XG4gICAgICAgICAgICAgICAgcXVlcnlTdWZmaXggKz0gJyZjYXRlZ29yeT0oXCInICsgX2NhdGVnb3JpZXMgKyAnXCIpJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBfbGFuZ3VhZ2VDb2RlcyA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHNlbGVjdGVkTGFuZ3VhZ2VDb2Rlcykge1xuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZExhbmd1YWdlQ29kZXNba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2xhbmd1YWdlQ29kZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9sYW5ndWFnZUNvZGVzICs9ICdcIiBPUiBcIic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgX2xhbmd1YWdlQ29kZXMgKz0ga2V5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChfbGFuZ3VhZ2VDb2Rlcykge1xuICAgICAgICAgICAgICAgIHF1ZXJ5U3VmZml4ICs9ICcmbGFuZ3VhZ2VfY29kZT0oXCInICsgX2xhbmd1YWdlQ29kZXMgKyAnXCIpJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBxdWVyeVN1ZmZpeDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGhhc1JlYWNoZWRFbmRPZlBhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gX3NlYXJjaEN1cnNvciA9PT0gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHVwZGF0ZVNlYXJjaEZpZWxkcyA9IGZ1bmN0aW9uIChpdGVtc1R5cGUsIHVybENvbXBvbmVudCwgc2VsZWN0aW9uRGV0YWlscykge1xuICAgICAgICAgICAgdmFyIGl0ZW1Db2RlR3JvdXAgPSB1cmxDb21wb25lbnQubWF0Y2goLz1cXChcIltBLVphLXolMjBcIiBdK1wiXFwpLyk7XG4gICAgICAgICAgICB2YXIgaXRlbUNvZGVzID0gaXRlbUNvZGVHcm91cCA/IGl0ZW1Db2RlR3JvdXBbMF0gOiBudWxsO1xuICAgICAgICAgICAgdmFyIEVYUEVDVEVEX1BSRUZJWCA9ICc9KFwiJztcbiAgICAgICAgICAgIHZhciBFWFBFQ1RFRF9TVUZGSVggPSAnXCIpJztcbiAgICAgICAgICAgIGlmICghaXRlbUNvZGVzIHx8XG4gICAgICAgICAgICAgICAgaXRlbUNvZGVzLmluZGV4T2YoRVhQRUNURURfUFJFRklYKSAhPT0gMCB8fFxuICAgICAgICAgICAgICAgIGl0ZW1Db2Rlcy5sYXN0SW5kZXhPZihFWFBFQ1RFRF9TVUZGSVgpICE9PVxuICAgICAgICAgICAgICAgICAgICBpdGVtQ29kZXMubGVuZ3RoIC0gRVhQRUNURURfU1VGRklYLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHNlYXJjaCBxdWVyeSB1cmwgZnJhZ21lbnQgZm9yICcgK1xuICAgICAgICAgICAgICAgICAgICBpdGVtc1R5cGUgKyAnOiAnICsgdXJsQ29tcG9uZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBpdGVtcyA9IGl0ZW1Db2Rlcy5zdWJzdHJpbmcoRVhQRUNURURfUFJFRklYLmxlbmd0aCwgaXRlbUNvZGVzLmxlbmd0aCAtIEVYUEVDVEVEX1NVRkZJWC5sZW5ndGgpLnNwbGl0KCdcIiBPUiBcIicpO1xuICAgICAgICAgICAgdmFyIHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25EZXRhaWxzW2l0ZW1zVHlwZV0uc2VsZWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb25zW2l0ZW1zW2ldXSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfaXNDdXJyZW50bHlGZXRjaGluZ1Jlc3VsdHMgPSBmYWxzZTtcbiAgICAgICAgdmFyIG51bVNlYXJjaGVzSW5Qcm9ncmVzcyA9IDA7XG4gICAgICAgIHZhciBnZXRRdWVyeVVybCA9IGZ1bmN0aW9uIChzZWFyY2hVcmxRdWVyeVN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIFNFQVJDSF9EQVRBX1VSTCArICc/cT0nICsgc2VhcmNoVXJsUXVlcnlTdHJpbmc7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRTZWFyY2hVcmxRdWVyeVN0cmluZzogZnVuY3Rpb24gKHNlYXJjaFF1ZXJ5LCBzZWxlY3RlZENhdGVnb3JpZXMsIHNlbGVjdGVkTGFuZ3VhZ2VDb2Rlcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc2VhcmNoUXVlcnkpICtcbiAgICAgICAgICAgICAgICAgICAgX2dldFN1ZmZpeEZvclF1ZXJ5KHNlbGVjdGVkQ2F0ZWdvcmllcywgc2VsZWN0ZWRMYW5ndWFnZUNvZGVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBOb3RlIHRoYXQgYW4gZW1wdHkgcXVlcnkgcmVzdWx0cyBpbiBhbGwgYWN0aXZpdGllcyBiZWluZyBzaG93bi5cbiAgICAgICAgICAgIGV4ZWN1dGVTZWFyY2hRdWVyeTogZnVuY3Rpb24gKHNlYXJjaFF1ZXJ5LCBzZWxlY3RlZENhdGVnb3JpZXMsIHNlbGVjdGVkTGFuZ3VhZ2VDb2Rlcywgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHF1ZXJ5VXJsID0gZ2V0UXVlcnlVcmwodGhpcy5nZXRTZWFyY2hVcmxRdWVyeVN0cmluZyhzZWFyY2hRdWVyeSwgc2VsZWN0ZWRDYXRlZ29yaWVzLCBzZWxlY3RlZExhbmd1YWdlQ29kZXMpKTtcbiAgICAgICAgICAgICAgICBfaXNDdXJyZW50bHlGZXRjaGluZ1Jlc3VsdHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG51bVNlYXJjaGVzSW5Qcm9ncmVzcysrO1xuICAgICAgICAgICAgICAgICRodHRwLmdldChxdWVyeVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgICAgICBfbGFzdFF1ZXJ5ID0gc2VhcmNoUXVlcnk7XG4gICAgICAgICAgICAgICAgICAgIF9sYXN0U2VsZWN0ZWRDYXRlZ29yaWVzID0gYW5ndWxhci5jb3B5KHNlbGVjdGVkQ2F0ZWdvcmllcyk7XG4gICAgICAgICAgICAgICAgICAgIF9sYXN0U2VsZWN0ZWRMYW5ndWFnZUNvZGVzID0gYW5ndWxhci5jb3B5KHNlbGVjdGVkTGFuZ3VhZ2VDb2Rlcyk7XG4gICAgICAgICAgICAgICAgICAgIF9zZWFyY2hDdXJzb3IgPSBkYXRhLnNlYXJjaF9jdXJzb3I7XG4gICAgICAgICAgICAgICAgICAgIG51bVNlYXJjaGVzSW5Qcm9ncmVzcy0tO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2luaXRpYWxTZWFyY2hSZXN1bHRzTG9hZGVkJywgZGF0YS5hY3Rpdml0eV9saXN0KTtcbiAgICAgICAgICAgICAgICAgICAgX2lzQ3VycmVudGx5RmV0Y2hpbmdSZXN1bHRzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGVja01pc21hdGNoID0gZnVuY3Rpb24gKHNlYXJjaFF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNNaXNtYXRjaCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcub3BwaWEtc2VhcmNoLWJhci1pbnB1dCcpLmVhY2goZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkudHJpbSgpID09PSBzZWFyY2hRdWVyeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc01pc21hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNNaXNtYXRjaDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoZWNrTWlzbWF0Y2goc2VhcmNoUXVlcnkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdNaXNtYXRjaCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGxvZy5lcnJvcignU2VhcmNoUXVlcnk6ICcgKyBzZWFyY2hRdWVyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdJbnB1dDogJyArICQoJy5vcHBpYS1zZWFyY2gtYmFyLWlucHV0JykudmFsKCkudHJpbSgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbnVtU2VhcmNoZXNJblByb2dyZXNzLS07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gVHJhbnNsYXRlIHRoZSBuZXcgZXhwbG9yYXRpb25zIGxvYWRlZC5cbiAgICAgICAgICAgICAgICAkdHJhbnNsYXRlLnJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc1NlYXJjaEluUHJvZ3Jlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVtU2VhcmNoZXNJblByb2dyZXNzID4gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIHRha2VzIGluIHRoZSB1cmwgc2VhcmNoIGNvbXBvbmVudCBhcyBhbiBhcmd1bWVudCBhbmQgdGhlXG4gICAgICAgICAgICAvLyBzZWxlY3Rpb25EZXRhaWxzLiBJdCB3aWxsIHVwZGF0ZSBzZWxlY3Rpb25EZXRhaWxzIHdpdGggdGhlIHJlbGV2YW50XG4gICAgICAgICAgICAvLyBmaWVsZHMgdGhhdCB3ZXJlIGV4dHJhY3RlZCBmcm9tIHRoZSB1cmwuIEl0IHJldHVybnMgdGhlIHVuZW5jb2RlZFxuICAgICAgICAgICAgLy8gc2VhcmNoIHF1ZXJ5IHN0cmluZy5cbiAgICAgICAgICAgIHVwZGF0ZVNlYXJjaEZpZWxkc0Jhc2VkT25VcmxRdWVyeTogZnVuY3Rpb24gKHVybENvbXBvbmVudCwgc2VsZWN0aW9uRGV0YWlscykge1xuICAgICAgICAgICAgICAgIHZhciB1cmxRdWVyeSA9IHVybENvbXBvbmVudC5zdWJzdHJpbmcoJz9xPScubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIHdpbGwgc3BsaXQgdGhlIHVybFF1ZXJ5IGludG8gMyBjb21wb25lbnRzOlxuICAgICAgICAgICAgICAgIC8vIDEuIHF1ZXJ5XG4gICAgICAgICAgICAgICAgLy8gMi4gY2F0ZWdvcmllcyAob3B0aW9uYWwpXG4gICAgICAgICAgICAgICAgLy8gMy4gbGFuZ3VhZ2UgY29kZXMgKGRlZmF1bHQgdG8gJ2VuJylcbiAgICAgICAgICAgICAgICB2YXIgcXVlcnlTZWdtZW50cyA9IHVybFF1ZXJ5LnNwbGl0KCcmJyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBxdWVyeVNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHVybENvbXBvbmVudCA9IGRlY29kZVVSSUNvbXBvbmVudChxdWVyeVNlZ21lbnRzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1zVHlwZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cmxDb21wb25lbnQuaW5kZXhPZignY2F0ZWdvcnknKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXNUeXBlID0gJ2NhdGVnb3JpZXMnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHVybENvbXBvbmVudC5pbmRleE9mKCdsYW5ndWFnZV9jb2RlJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zVHlwZSA9ICdsYW5ndWFnZUNvZGVzJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVTZWFyY2hGaWVsZHMoaXRlbXNUeXBlLCB1cmxDb21wb25lbnQsIHNlbGVjdGlvbkRldGFpbHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdLnNlbGVjdGlvbnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocXVlcnlTZWdtZW50c1swXSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q3VycmVudFVybFF1ZXJ5U3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VhcmNoVXJsUXVlcnlTdHJpbmcoX2xhc3RRdWVyeSwgX2xhc3RTZWxlY3RlZENhdGVnb3JpZXMsIF9sYXN0U2VsZWN0ZWRMYW5ndWFnZUNvZGVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb2FkTW9yZURhdGE6IGZ1bmN0aW9uIChzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIC8vIElmIGEgbmV3IHF1ZXJ5IGlzIHN0aWxsIGJlaW5nIHNlbnQsIG9yIHRoZSBlbmQgb2YgdGhlIHBhZ2UgaGFzIGJlZW5cbiAgICAgICAgICAgICAgICAvLyByZWFjaGVkLCBkbyBub3QgZmV0Y2ggbW9yZSByZXN1bHRzLlxuICAgICAgICAgICAgICAgIGlmIChfaXNDdXJyZW50bHlGZXRjaGluZ1Jlc3VsdHMgfHwgaGFzUmVhY2hlZEVuZE9mUGFnZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZhaWx1cmVDYWxsYmFjayhoYXNSZWFjaGVkRW5kT2ZQYWdlKCkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBxdWVyeVVybCA9IGdldFF1ZXJ5VXJsKHRoaXMuZ2V0Q3VycmVudFVybFF1ZXJ5U3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGlmIChfc2VhcmNoQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5VXJsICs9ICcmY3Vyc29yPScgKyBfc2VhcmNoQ3Vyc29yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfaXNDdXJyZW50bHlGZXRjaGluZ1Jlc3VsdHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICRodHRwLmdldChxdWVyeVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgX3NlYXJjaEN1cnNvciA9IHJlc3BvbnNlLmRhdGEuc2VhcmNoX2N1cnNvcjtcbiAgICAgICAgICAgICAgICAgICAgX2lzQ3VycmVudGx5RmV0Y2hpbmdSZXN1bHRzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZS5kYXRhLCBoYXNSZWFjaGVkRW5kT2ZQYWdlKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgaW50ZXJhY3Rpb25zIGV4dGVuc2lvbnMuXG4gKi9cbnZhciBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMoKSB7XG4gICAgfVxuICAgIC8vIE1pbmltdW0gY29uZmlkZW5jZSByZXF1aXJlZCBmb3IgYSBwcmVkaWN0ZWQgYW5zd2VyIGdyb3VwIHRvIGJlIHNob3duIHRvXG4gICAgLy8gdXNlci4gR2VuZXJhbGx5IGEgdGhyZXNob2xkIG9mIDAuNy0wLjggaXMgYXNzdW1lZCB0byBiZSBhIGdvb2Qgb25lIGluXG4gICAgLy8gcHJhY3RpY2UsIGhvd2V2ZXIgdmFsdWUgbmVlZCBub3QgYmUgaW4gdGhvc2UgYm91bmRzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuQ09ERV9SRVBMX1BSRURJQ1RJT05fU0VSVklDRV9USFJFU0hPTEQgPSAwLjc7XG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5HUkFQSF9JTlBVVF9MRUZUX01BUkdJTiA9IDEyMDtcbiAgICAvLyBHaXZlcyB0aGUgc3RhZmYtbGluZXMgaHVtYW4gcmVhZGFibGUgdmFsdWVzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuTk9URV9OQU1FU19UT19NSURJX1ZBTFVFUyA9IHtcbiAgICAgICAgQTU6IDgxLFxuICAgICAgICBHNTogNzksXG4gICAgICAgIEY1OiA3NyxcbiAgICAgICAgRTU6IDc2LFxuICAgICAgICBENTogNzQsXG4gICAgICAgIEM1OiA3MixcbiAgICAgICAgQjQ6IDcxLFxuICAgICAgICBBNDogNjksXG4gICAgICAgIEc0OiA2NyxcbiAgICAgICAgRjQ6IDY1LFxuICAgICAgICBFNDogNjQsXG4gICAgICAgIEQ0OiA2MixcbiAgICAgICAgQzQ6IDYwXG4gICAgfTtcbiAgICAvLyBNaW5pbXVtIGNvbmZpZGVuY2UgcmVxdWlyZWQgZm9yIGEgcHJlZGljdGVkIGFuc3dlciBncm91cCB0byBiZSBzaG93biB0b1xuICAgIC8vIHVzZXIuIEdlbmVyYWxseSBhIHRocmVzaG9sZCBvZiAwLjctMC44IGlzIGFzc3VtZWQgdG8gYmUgYSBnb29kIG9uZSBpblxuICAgIC8vIHByYWN0aWNlLCBob3dldmVyIHZhbHVlIG5lZWQgbm90IGJlIGluIHRob3NlIGJvdW5kcy5cbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLlRFWFRfSU5QVVRfUFJFRElDVElPTl9TRVJWSUNFX1RIUkVTSE9MRCA9IDAuNztcbiAgICByZXR1cm4gSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLkludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMgPSBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==