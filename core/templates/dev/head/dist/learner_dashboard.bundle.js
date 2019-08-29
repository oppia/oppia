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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","vendors~admin~collection_editor~collection_player~creator_dashboard~exploration_editor~exploration_p~7f8bcc67","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","collection_player~creator_dashboard~learner_dashboard~library~profile~story_viewer","collection_player~learner_dashboard~library~profile~story_viewer"]);
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

/***/ "./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts ***!
  \********************************************************************************************************************/
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
angular.module('oppia').directive('backgroundBanner', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/common-elements/' +
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

/***/ "./core/templates/dev/head/directives/angular-html-bind.directive.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/directives/angular-html-bind.directive.ts ***!
  \***************************************************************************/
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
 * @fileoverview AngularHtmlBind Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */
// HTML bind directive that trusts the value it is given and also evaluates
// custom directive tags in the provided value.
angular.module('oppia').directive('angularHtmlBind', [
    '$compile', function ($compile) {
        return {
            restrict: 'E',
            link: function (scope, elm, attrs) {
                // Clean up old scopes if the html changes.
                // Reference: https://stackoverflow.com/a/42927814
                var newScope;
                scope.$watch(attrs.htmlData, function (newValue) {
                    if (newScope) {
                        newScope.$destroy();
                    }
                    elm.empty();
                    newScope = scope.$new();
                    elm.html(newValue);
                    $compile(elm.contents())(newScope);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts ***!
  \************************************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of feedback
   message domain objects.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var FeedbackMessageSummary = /** @class */ (function () {
    function FeedbackMessageSummary(messageId, text, updatedStatus, suggestionHtml, currentContentHtml, description, authorUsername, authorPictureDataUrl, createdOn) {
        this.messageId = messageId;
        this.text = text;
        this.updatedStatus = updatedStatus;
        this.suggestionHtml = suggestionHtml;
        this.currentContentHtml = currentContentHtml;
        this.description = description;
        this.authorUsername = authorUsername;
        this.authorPictureDataUrl = authorPictureDataUrl;
        this.createdOn = createdOn;
    }
    return FeedbackMessageSummary;
}());
exports.FeedbackMessageSummary = FeedbackMessageSummary;
var FeedbackMessageSummaryObjectFactory = /** @class */ (function () {
    function FeedbackMessageSummaryObjectFactory() {
    }
    FeedbackMessageSummaryObjectFactory.prototype.createNewMessage = function (newMessageId, newMessageText, authorUsername, authorPictureDataUrl) {
        return new FeedbackMessageSummary(newMessageId, newMessageText, null, null, null, null, authorUsername, authorPictureDataUrl, new Date());
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'feedbackMessageSummaryBackendDict' is a dict with
    // underscore_cased keys which give tslint errors against underscore_casing
    // in favor of camelCasing.
    FeedbackMessageSummaryObjectFactory.prototype.createFromBackendDict = function (feedbackMessageSummaryBackendDict) {
        return new FeedbackMessageSummary(feedbackMessageSummaryBackendDict.message_id, feedbackMessageSummaryBackendDict.text, feedbackMessageSummaryBackendDict.updated_status, feedbackMessageSummaryBackendDict.suggestion_html, feedbackMessageSummaryBackendDict.current_content_html, feedbackMessageSummaryBackendDict.description, feedbackMessageSummaryBackendDict.author_username, feedbackMessageSummaryBackendDict.author_picture_data_url, feedbackMessageSummaryBackendDict.created_on);
    };
    FeedbackMessageSummaryObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], FeedbackMessageSummaryObjectFactory);
    return FeedbackMessageSummaryObjectFactory;
}());
exports.FeedbackMessageSummaryObjectFactory = FeedbackMessageSummaryObjectFactory;
angular.module('oppia').factory('FeedbackMessageSummaryObjectFactory', static_1.downgradeInjectable(FeedbackMessageSummaryObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts ***!
  \**********************************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of feedback thread
   domain objects.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var FeedbackThreadSummary = /** @class */ (function () {
    function FeedbackThreadSummary(status, originalAuthorId, lastUpdated, lastMessageText, totalMessageCount, lastMessageRead, secondLastMessageRead, authorLastMessage, authorSecondLastMessage, explorationTitle, explorationId, threadId) {
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
    }
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
    return FeedbackThreadSummary;
}());
exports.FeedbackThreadSummary = FeedbackThreadSummary;
var FeedbackThreadSummaryObjectFactory = /** @class */ (function () {
    function FeedbackThreadSummaryObjectFactory() {
    }
    FeedbackThreadSummaryObjectFactory.prototype.create = function (status, originalAuthorId, lastUpdated, lastMessageText, totalMessageCount, lastMessageRead, secondLastMessageRead, authorLastMessage, authorSecondLastMessage, explorationTitle, explorationId, threadId) {
        return new FeedbackThreadSummary(status, originalAuthorId, lastUpdated, lastMessageText, totalMessageCount, lastMessageRead, secondLastMessageRead, authorLastMessage, authorSecondLastMessage, explorationTitle, explorationId, threadId);
    };
    FeedbackThreadSummaryObjectFactory.prototype.createFromBackendDict = function (feedbackThreadSummaryBackendDict) {
        return new FeedbackThreadSummary(feedbackThreadSummaryBackendDict.status, feedbackThreadSummaryBackendDict.original_author_id, feedbackThreadSummaryBackendDict.last_updated, feedbackThreadSummaryBackendDict.last_message_text, feedbackThreadSummaryBackendDict.total_message_count, feedbackThreadSummaryBackendDict.last_message_is_read, feedbackThreadSummaryBackendDict.second_last_message_is_read, feedbackThreadSummaryBackendDict.author_last_message, feedbackThreadSummaryBackendDict.author_second_last_message, feedbackThreadSummaryBackendDict.exploration_title, feedbackThreadSummaryBackendDict.exploration_id, feedbackThreadSummaryBackendDict.thread_id);
    };
    FeedbackThreadSummaryObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], FeedbackThreadSummaryObjectFactory);
    return FeedbackThreadSummaryObjectFactory;
}());
exports.FeedbackThreadSummaryObjectFactory = FeedbackThreadSummaryObjectFactory;
angular.module('oppia').factory('FeedbackThreadSummaryObjectFactory', static_1.downgradeInjectable(FeedbackThreadSummaryObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardBackendApiService.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardBackendApiService.ts ***!
  \***********************************************************************************************/
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
 * @fileoverview Service to retrieve information of learner dashboard from the
 * backend.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var http_1 = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var LearnerDashboardBackendApiService = /** @class */ (function () {
    function LearnerDashboardBackendApiService(http) {
        this.http = http;
    }
    LearnerDashboardBackendApiService.prototype._fetchLearnerDashboardData = function () {
        // HttpClient returns an Observable, the toPromise converts it into a
        // Promise.
        return this.http.get('/learnerdashboardhandler/data').toPromise();
    };
    LearnerDashboardBackendApiService.prototype.fetchLearnerDashboardData = function () {
        return this._fetchLearnerDashboardData();
    };
    var _a;
    LearnerDashboardBackendApiService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof http_1.HttpClient !== "undefined" && http_1.HttpClient) === "function" ? _a : Object])
    ], LearnerDashboardBackendApiService);
    return LearnerDashboardBackendApiService;
}());
exports.LearnerDashboardBackendApiService = LearnerDashboardBackendApiService;
angular.module('oppia').factory('LearnerDashboardBackendApiService', static_1.downgradeInjectable(LearnerDashboardBackendApiService));


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

/***/ "./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/services/thread-status-display.service.ts":
/*!**********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/services/thread-status-display.service.ts ***!
  \**********************************************************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Service that provides information about how to display the
 * status label for a thread in the feedback tab of the exploration editor.
 */
var cloneDeep_1 = __importDefault(__webpack_require__(/*! lodash/cloneDeep */ "./node_modules/lodash/cloneDeep.js"));
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var ThreadStatusDisplayService = /** @class */ (function () {
    function ThreadStatusDisplayService() {
        this.STATUS_CHOICES = cloneDeep_1.default(ThreadStatusDisplayService_1._STATUS_CHOICES);
    }
    ThreadStatusDisplayService_1 = ThreadStatusDisplayService;
    ThreadStatusDisplayService.prototype.getLabelClass = function (status) {
        if (status === 'open') {
            return 'label label-info';
        }
        else if (status === 'compliment') {
            return 'label label-success';
        }
        else {
            return 'label label-default';
        }
    };
    ThreadStatusDisplayService.prototype.getHumanReadableStatus = function (status) {
        for (var i = 0; i < ThreadStatusDisplayService_1._STATUS_CHOICES.length; i++) {
            if (ThreadStatusDisplayService_1._STATUS_CHOICES[i].id === status) {
                return ThreadStatusDisplayService_1._STATUS_CHOICES[i].text;
            }
        }
        return '';
    };
    var ThreadStatusDisplayService_1;
    ThreadStatusDisplayService._STATUS_CHOICES = [{
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
    ThreadStatusDisplayService = ThreadStatusDisplayService_1 = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], ThreadStatusDisplayService);
    return ThreadStatusDisplayService;
}());
exports.ThreadStatusDisplayService = ThreadStatusDisplayService;
angular.module('oppia').factory('ThreadStatusDisplayService', static_1.downgradeInjectable(ThreadStatusDisplayService));


/***/ }),

/***/ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.constants.ajs.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.constants.ajs.ts ***!
  \******************************************************************************************************/
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
 * @fileoverview Constants for the Learner dashboard.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var learner_dashboard_page_constants_1 = __webpack_require__(/*! pages/learner-dashboard-page/learner-dashboard-page.constants */ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.constants.ts");
angular.module('oppia').constant('LEARNER_DASHBOARD_SECTION_I18N_IDS', learner_dashboard_page_constants_1.LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS);
angular.module('oppia').constant('LEARNER_DASHBOARD_SUBSECTION_I18N_IDS', learner_dashboard_page_constants_1.LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS);
angular.module('oppia').constant('EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS', learner_dashboard_page_constants_1.LearnerDashboardPageConstants.EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS);
angular.module('oppia').constant('SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS', learner_dashboard_page_constants_1.LearnerDashboardPageConstants.SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS);
angular.module('oppia').constant('FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS', learner_dashboard_page_constants_1.LearnerDashboardPageConstants.FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS);


/***/ }),

/***/ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.constants.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.constants.ts ***!
  \**************************************************************************************************/
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
 * @fileoverview Constants for the Learner dashboard.
 */
var LearnerDashboardPageConstants = /** @class */ (function () {
    function LearnerDashboardPageConstants() {
    }
    LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS = {
        INCOMPLETE: 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION',
        COMPLETED: 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION',
        SUBSCRIPTIONS: 'I18N_LEARNER_DASHBOARD_SUBSCRIPTIONS_SECTION',
        FEEDBACK: 'I18N_LEARNER_DASHBOARD_FEEDBACK_SECTION',
        PLAYLIST: 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION'
    };
    LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS = {
        EXPLORATIONS: 'I18N_DASHBOARD_EXPLORATIONS',
        COLLECTIONS: 'I18N_DASHBOARD_COLLECTIONS'
    };
    LearnerDashboardPageConstants.EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS = {
        LAST_PLAYED: {
            key: 'last_played',
            i18nId: 'I18N_LEARNER_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_PLAYED'
        },
        TITLE: {
            key: 'title',
            i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_TITLE'
        },
        CATEGORY: {
            key: 'category',
            i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_CATEGORY'
        }
    };
    LearnerDashboardPageConstants.SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS = {
        USERNAME: {
            key: 'subscriber_username',
            i18nId: 'I18N_PREFERENCES_USERNAME'
        },
        IMPACT: {
            key: 'subscriber_impact',
            i18nId: 'I18N_CREATOR_IMPACT'
        }
    };
    LearnerDashboardPageConstants.FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS = {
        LAST_UPDATED: {
            key: 'last_updated',
            i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_UPDATED'
        },
        EXPLORATION: {
            key: 'exploration',
            i18nId: 'I18N_DASHBOARD_TABLE_HEADING_EXPLORATION'
        }
    };
    return LearnerDashboardPageConstants;
}());
exports.LearnerDashboardPageConstants = LearnerDashboardPageConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.controller.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.controller.ts ***!
  \***************************************************************************************************/
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
 * @fileoverview Controllers for the creator dashboard.
 */
__webpack_require__(/*! components/common-layout-directives/common-elements/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts");
__webpack_require__(/*! components/common-layout-directives/common-elements/loading-dots.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/loading-dots.directive.ts");
__webpack_require__(/*! components/summary-tile/collection-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile/collection-summary-tile.directive.ts");
__webpack_require__(/*! components/summary-tile/exploration-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile/exploration-summary-tile.directive.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
__webpack_require__(/*! directives/angular-html-bind.directive.ts */ "./core/templates/dev/head/directives/angular-html-bind.directive.ts");
__webpack_require__(/*! domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts */ "./core/templates/dev/head/domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts");
__webpack_require__(/*! domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts */ "./core/templates/dev/head/domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts");
__webpack_require__(/*! domain/learner_dashboard/LearnerDashboardBackendApiService.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardBackendApiService.ts");
__webpack_require__(/*! pages/exploration-editor-page/feedback-tab/services/thread-status-display.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/services/thread-status-display.service.ts");
__webpack_require__(/*! pages/learner-dashboard-page/suggestion-modal/suggestion-modal-for-learner-dashboard.service.ts */ "./core/templates/dev/head/pages/learner-dashboard-page/suggestion-modal/suggestion-modal-for-learner-dashboard.service.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! pages/learner-dashboard-page/learner-dashboard-page.constants.ajs.ts */ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.constants.ajs.ts");
angular.module('oppia').directive('learnerDashboardPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/learner-dashboard-page/learner-dashboard-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$rootScope', '$q', '$window', '$http', '$uibModal',
                'AlertsService', 'EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS',
                'ACTIVITY_TYPE_COLLECTION', 'ACTIVITY_TYPE_EXPLORATION',
                'SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS', 'FATAL_ERROR_CODES',
                'LearnerDashboardBackendApiService', 'UrlInterpolationService',
                'LEARNER_DASHBOARD_SECTION_I18N_IDS',
                'LEARNER_DASHBOARD_SUBSECTION_I18N_IDS', 'ThreadStatusDisplayService',
                'DateTimeFormatService', 'FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS',
                'FeedbackThreadSummaryObjectFactory',
                'FeedbackMessageSummaryObjectFactory',
                'SuggestionModalForLearnerDashboardService', 'UserService',
                function ($scope, $rootScope, $q, $window, $http, $uibModal, AlertsService, EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS, ACTIVITY_TYPE_COLLECTION, ACTIVITY_TYPE_EXPLORATION, SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS, FATAL_ERROR_CODES, LearnerDashboardBackendApiService, UrlInterpolationService, LEARNER_DASHBOARD_SECTION_I18N_IDS, LEARNER_DASHBOARD_SUBSECTION_I18N_IDS, ThreadStatusDisplayService, DateTimeFormatService, FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS, FeedbackThreadSummaryObjectFactory, FeedbackMessageSummaryObjectFactory, SuggestionModalForLearnerDashboardService, UserService) {
                    var ctrl = this;
                    ctrl.EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS = (EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS);
                    ctrl.SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS = (SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS);
                    ctrl.FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS = (FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS);
                    ctrl.LEARNER_DASHBOARD_SECTION_I18N_IDS = (LEARNER_DASHBOARD_SECTION_I18N_IDS);
                    ctrl.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS = (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS);
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                    ctrl.PAGE_SIZE = 8;
                    ctrl.Math = window.Math;
                    UserService.getProfileImageDataUrlAsync().then(function (dataUrl) {
                        ctrl.profilePictureDataUrl = dataUrl;
                    });
                    $rootScope.loadingMessage = 'Loading';
                    ctrl.username = '';
                    var userInfoPromise = UserService.getUserInfoAsync();
                    userInfoPromise.then(function (userInfo) {
                        ctrl.username = userInfo.getUsername();
                    });
                    var dashboardDataPromise = (LearnerDashboardBackendApiService.fetchLearnerDashboardData());
                    dashboardDataPromise.then(function (responseData) {
                        ctrl.isCurrentExpSortDescending = true;
                        ctrl.isCurrentSubscriptionSortDescending = true;
                        ctrl.isCurrentFeedbackSortDescending = true;
                        ctrl.currentExpSortType = (EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS.LAST_PLAYED.key);
                        ctrl.currentSubscribersSortType = (SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS.USERNAME.key);
                        ctrl.currentFeedbackThreadsSortType = (FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS.LAST_UPDATED.key);
                        ctrl.startIncompleteExpIndex = 0;
                        ctrl.startCompletedExpIndex = 0;
                        ctrl.startIncompleteCollectionIndex = 0;
                        ctrl.startCompletedCollectionIndex = 0;
                        ctrl.completedExplorationsList = (responseData.completed_explorations_list);
                        ctrl.completedCollectionsList = (responseData.completed_collections_list);
                        ctrl.incompleteExplorationsList = (responseData.incomplete_explorations_list);
                        ctrl.incompleteCollectionsList = (responseData.incomplete_collections_list);
                        ctrl.subscriptionsList = (responseData.subscription_list);
                        ctrl.numberNonexistentIncompleteExplorations = (responseData.number_of_nonexistent_activities
                            .incomplete_explorations);
                        ctrl.numberNonexistentIncompleteCollections = (responseData.number_of_nonexistent_activities
                            .incomplete_collections);
                        ctrl.numberNonexistentCompletedExplorations = (responseData.number_of_nonexistent_activities
                            .completed_explorations);
                        ctrl.numberNonexistentCompletedCollections = (responseData.number_of_nonexistent_activities
                            .completed_collections);
                        ctrl.numberNonexistentExplorationsFromPlaylist = (responseData.number_of_nonexistent_activities
                            .exploration_playlist);
                        ctrl.numberNonexistentCollectionsFromPlaylist = (responseData.number_of_nonexistent_activities
                            .collection_playlist);
                        ctrl.completedToIncompleteCollections = (responseData.completed_to_incomplete_collections);
                        var threadSummaryDicts = responseData.thread_summaries;
                        ctrl.threadSummaries = [];
                        for (var index = 0; index < threadSummaryDicts.length; index++) {
                            ctrl.threadSummaries.push(FeedbackThreadSummaryObjectFactory.createFromBackendDict(threadSummaryDicts[index]));
                        }
                        ctrl.numberOfUnreadThreads =
                            responseData.number_of_unread_threads;
                        ctrl.explorationPlaylist = responseData.exploration_playlist;
                        ctrl.collectionPlaylist = responseData.collection_playlist;
                        ctrl.activeSection =
                            LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE;
                        ctrl.activeSubsection = (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS);
                        ctrl.feedbackThreadActive = false;
                        ctrl.noExplorationActivity = ((ctrl.completedExplorationsList.length === 0) &&
                            (ctrl.incompleteExplorationsList.length === 0));
                        ctrl.noCollectionActivity = ((ctrl.completedCollectionsList.length === 0) &&
                            (ctrl.incompleteCollectionsList.length === 0));
                        ctrl.noActivity = ((ctrl.noExplorationActivity) && (ctrl.noCollectionActivity) &&
                            (ctrl.explorationPlaylist.length === 0) &&
                            (ctrl.collectionPlaylist.length === 0));
                    }, function (errorResponse) {
                        if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
                            AlertsService.addWarning('Failed to get learner dashboard data');
                        }
                    });
                    $q.all([userInfoPromise, dashboardDataPromise]).then(function () {
                        $rootScope.loadingMessage = '';
                    });
                    ctrl.loadingFeedbacks = false;
                    var threadIndex = null;
                    ctrl.newMessage = {
                        text: ''
                    };
                    ctrl.getLabelClass = ThreadStatusDisplayService.getLabelClass;
                    ctrl.getHumanReadableStatus = (ThreadStatusDisplayService.getHumanReadableStatus);
                    ctrl.getLocaleAbbreviatedDatetimeString = (DateTimeFormatService.getLocaleAbbreviatedDatetimeString);
                    ctrl.setActiveSection = function (newActiveSectionName) {
                        ctrl.activeSection = newActiveSectionName;
                        if (ctrl.activeSection ===
                            LEARNER_DASHBOARD_SECTION_I18N_IDS.FEEDBACK &&
                            ctrl.feedbackThreadActive === true) {
                            ctrl.feedbackThreadActive = false;
                        }
                    };
                    ctrl.setActiveSubsection = function (newActiveSubsectionName) {
                        ctrl.activeSubsection = newActiveSubsectionName;
                    };
                    ctrl.getExplorationUrl = function (explorationId) {
                        return '/explore/' + explorationId;
                    };
                    ctrl.getCollectionUrl = function (collectionId) {
                        return '/collection/' + collectionId;
                    };
                    ctrl.checkMobileView = function () {
                        return ($window.innerWidth < 500);
                    };
                    ctrl.getVisibleExplorationList = function (startCompletedExpIndex) {
                        return ctrl.completedExplorationsList.slice(startCompletedExpIndex, Math.min(startCompletedExpIndex + ctrl.PAGE_SIZE, ctrl.completedExplorationsList.length));
                    };
                    ctrl.showUsernamePopover = function (subscriberUsername) {
                        // The popover on the subscription card is only shown if the length
                        // of the subscriber username is greater than 10 and the user hovers
                        // over the truncated username.
                        if (subscriberUsername.length > 10) {
                            return 'mouseenter';
                        }
                        else {
                            return 'none';
                        }
                    };
                    ctrl.goToPreviousPage = function (section, subsection) {
                        if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
                            if (subsection === (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
                                ctrl.startIncompleteExpIndex = Math.max(ctrl.startIncompleteExpIndex - ctrl.PAGE_SIZE, 0);
                            }
                            else if (subsection === (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
                                ctrl.startIncompleteCollectionIndex = Math.max(ctrl.startIncompleteCollectionIndex - ctrl.PAGE_SIZE, 0);
                            }
                        }
                        else if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.COMPLETED) {
                            if (subsection === (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
                                ctrl.startCompletedExpIndex = Math.max(ctrl.startCompletedExpIndex - ctrl.PAGE_SIZE, 0);
                            }
                            else if (subsection === (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
                                ctrl.startCompletedCollectionIndex = Math.max(ctrl.startCompletedCollectionIndex - ctrl.PAGE_SIZE, 0);
                            }
                        }
                    };
                    ctrl.goToNextPage = function (section, subsection) {
                        if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
                            if (subsection === (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
                                if (ctrl.startIncompleteExpIndex +
                                    ctrl.PAGE_SIZE <= ctrl.incompleteExplorationsList.length) {
                                    ctrl.startIncompleteExpIndex += ctrl.PAGE_SIZE;
                                }
                            }
                            else if (subsection === (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
                                if (ctrl.startIncompleteCollectionIndex +
                                    ctrl.PAGE_SIZE <=
                                    ctrl.startIncompleteCollectionIndex.length) {
                                    ctrl.startIncompleteCollectionIndex += ctrl.PAGE_SIZE;
                                }
                            }
                        }
                        else if (section === LEARNER_DASHBOARD_SECTION_I18N_IDS.COMPLETED) {
                            if (subsection === (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS)) {
                                if (ctrl.startCompletedExpIndex +
                                    ctrl.PAGE_SIZE <= ctrl.completedExplorationsList.length) {
                                    ctrl.startCompletedExpIndex += ctrl.PAGE_SIZE;
                                }
                            }
                            else if (subsection === (LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS)) {
                                if (ctrl.startCompletedCollectionIndex +
                                    ctrl.PAGE_SIZE <= ctrl.startCompletedCollectionIndex.length) {
                                    ctrl.startCompletedCollectionIndex += ctrl.PAGE_SIZE;
                                }
                            }
                        }
                    };
                    ctrl.setExplorationsSortingOptions = function (sortType) {
                        if (sortType === ctrl.currentExpSortType) {
                            ctrl.isCurrentExpSortDescending =
                                !ctrl.isCurrentExpSortDescending;
                        }
                        else {
                            ctrl.currentExpSortType = sortType;
                        }
                    };
                    ctrl.setSubscriptionSortingOptions = function (sortType) {
                        if (sortType === ctrl.currentSubscriptionSortType) {
                            ctrl.isCurrentSubscriptionSortDescending = (!ctrl.isCurrentSubscriptionSortDescending);
                        }
                        else {
                            ctrl.currentSubscriptionSortType = sortType;
                        }
                    };
                    ctrl.setFeedbackSortingOptions = function (sortType) {
                        if (sortType === ctrl.currentFeedbackThreadsSortType) {
                            ctrl.isCurrentFeedbackSortDescending = (!ctrl.isCurrentFeedbackSortDescending);
                        }
                        else {
                            ctrl.currentFeedbackThreadsSortType = sortType;
                        }
                    };
                    ctrl.getValueOfExplorationSortKey = function (exploration) {
                        // This function is passed as a custom comparator function to
                        // `orderBy`, so that special cases can be handled while sorting
                        // explorations.
                        if (ctrl.currentExpSortType ===
                            EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS.LAST_PLAYED.key) {
                            return null;
                        }
                        else {
                            return exploration[ctrl.currentExpSortType];
                        }
                    };
                    ctrl.getValueOfSubscriptionSortKey = function (subscription) {
                        // This function is passed as a custom comparator function to
                        // `orderBy`, so that special cases can be handled while sorting
                        // subscriptions.
                        var value = subscription[ctrl.currentSubscribersSortType];
                        if (ctrl.currentSubscribersSortType ===
                            SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS.IMPACT.key) {
                            value = (value || 0);
                        }
                        return value;
                    };
                    ctrl.sortFeedbackThreadsFunction = function (feedbackThread) {
                        return feedbackThread[ctrl.currentFeedbackThreadsSortType];
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
                                var insertExpInLearnerPlaylistUrl = (UrlInterpolationService.interpolateUrl(('/learnerplaylistactivityhandler/<activityType>/' +
                                    '<activityId>'), {
                                    activityType: activityType,
                                    activityId: (ctrl.explorationPlaylist[ui.item.sortable.index].id)
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
                    ctrl.collectionPlaylistSortableOptions = getPlaylistSortableOptions(ACTIVITY_TYPE_COLLECTION);
                    ctrl.explorationPlaylistSortableOptions = getPlaylistSortableOptions(ACTIVITY_TYPE_EXPLORATION);
                    ctrl.onClickThread = function (threadStatus, explorationId, threadId, explorationTitle) {
                        ctrl.loadingFeedbacks = true;
                        var threadDataUrl = UrlInterpolationService.interpolateUrl('/learnerdashboardthreadhandler/<threadId>', {
                            threadId: threadId
                        });
                        ctrl.explorationTitle = explorationTitle;
                        ctrl.feedbackThreadActive = true;
                        ctrl.threadStatus = threadStatus;
                        ctrl.explorationId = explorationId;
                        ctrl.threadId = threadId;
                        for (var index = 0; index < ctrl.threadSummaries.length; index++) {
                            if (ctrl.threadSummaries[index].threadId === threadId) {
                                threadIndex = index;
                                var threadSummary = ctrl.threadSummaries[index];
                                threadSummary.markTheLastTwoMessagesAsRead();
                                if (!threadSummary.lastMessageRead) {
                                    ctrl.numberOfUnreadThreads -= 1;
                                }
                            }
                        }
                        $http.get(threadDataUrl).then(function (response) {
                            var messageSummaryDicts = response.data.message_summary_list;
                            ctrl.messageSummaries = [];
                            for (index = 0; index < messageSummaryDicts.length; index++) {
                                ctrl.messageSummaries.push(FeedbackMessageSummaryObjectFactory.createFromBackendDict(messageSummaryDicts[index]));
                            }
                            ctrl.loadingFeedbacks = false;
                        });
                    };
                    ctrl.showAllThreads = function () {
                        ctrl.feedbackThreadActive = false;
                        threadIndex = null;
                    };
                    ctrl.addNewMessage = function (threadId, newMessage) {
                        var url = UrlInterpolationService.interpolateUrl('/threadhandler/<threadId>', {
                            threadId: threadId
                        });
                        var payload = {
                            updated_status: null,
                            updated_subject: null,
                            text: newMessage
                        };
                        ctrl.messageSendingInProgress = true;
                        $http.post(url, payload).success(function () {
                            ctrl.threadSummary = ctrl.threadSummaries[threadIndex];
                            ctrl.threadSummary.appendNewMessage(newMessage, ctrl.username);
                            ctrl.messageSendingInProgress = false;
                            ctrl.newMessage.text = null;
                            var newMessageSummary = (FeedbackMessageSummaryObjectFactory.createNewMessage(ctrl.threadSummary.totalMessageCount, newMessage, ctrl.username, ctrl.profilePictureDataUrl));
                            ctrl.messageSummaries.push(newMessageSummary);
                        });
                    };
                    ctrl.showSuggestionModal = function (newContent, oldContent, description) {
                        SuggestionModalForLearnerDashboardService.showSuggestionModal('edit_exploration_state_content', {
                            newContent: newContent,
                            oldContent: oldContent,
                            description: description
                        });
                    };
                    ctrl.openRemoveActivityModal = function (sectionNameI18nId, subsectionName, activity) {
                        $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/learner-dashboard-page/modal-templates/' +
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
                                'subsectionName', 'ACTIVITY_TYPE_COLLECTION',
                                'ACTIVITY_TYPE_EXPLORATION',
                                function ($scope, $uibModalInstance, $http, sectionNameI18nId, subsectionName, ACTIVITY_TYPE_COLLECTION, ACTIVITY_TYPE_EXPLORATION) {
                                    $scope.sectionNameI18nId = sectionNameI18nId;
                                    $scope.subsectionName = subsectionName;
                                    $scope.activityTitle = activity.title;
                                    $scope.remove = function () {
                                        var activityType = '';
                                        if (subsectionName ===
                                            LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                                            activityType = ACTIVITY_TYPE_EXPLORATION;
                                        }
                                        else if (subsectionName ===
                                            LEARNER_DASHBOARD_SUBSECTION_I18N_IDS
                                                .COLLECTIONS) {
                                            activityType = ACTIVITY_TYPE_COLLECTION;
                                        }
                                        else {
                                            throw new Error('Subsection name is not valid.');
                                        }
                                        var removeActivityUrlPrefix = '';
                                        if (sectionNameI18nId ===
                                            LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
                                            removeActivityUrlPrefix =
                                                '/learnerplaylistactivityhandler/';
                                        }
                                        else if (sectionNameI18nId ===
                                            LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
                                            removeActivityUrlPrefix =
                                                '/learnerincompleteactivityhandler/';
                                        }
                                        else {
                                            throw new Error('Section name is not valid.');
                                        }
                                        var removeActivityUrl = (UrlInterpolationService.interpolateUrl(removeActivityUrlPrefix +
                                            '<activityType>/<activityId>', {
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
                                    var index = ctrl.incompleteExplorationsList.indexOf(activity);
                                    if (index !== -1) {
                                        ctrl.incompleteExplorationsList.splice(index, 1);
                                    }
                                }
                                else if (subsectionName ===
                                    LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                                    var index = ctrl.incompleteCollectionsList.indexOf(activity);
                                    if (index !== -1) {
                                        ctrl.incompleteCollectionsList.splice(index, 1);
                                    }
                                }
                            }
                            else if (sectionNameI18nId ===
                                LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
                                if (subsectionName ===
                                    LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
                                    var index = ctrl.explorationPlaylist.indexOf(activity);
                                    if (index !== -1) {
                                        ctrl.explorationPlaylist.splice(index, 1);
                                    }
                                }
                                else if (subsectionName ===
                                    LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
                                    var index = ctrl.collectionPlaylist.indexOf(activity);
                                    if (index !== -1) {
                                        ctrl.collectionPlaylist.splice(index, 1);
                                    }
                                }
                            }
                        });
                    };
                }
            ]
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

/***/ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.module.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.module.ts ***!
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Module for the learner dashboard page.
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
var learner_dashboard_page_constants_1 = __webpack_require__(/*! pages/learner-dashboard-page/learner-dashboard-page.constants */ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.constants.ts");
var LearnerDashboardPageModule = /** @class */ (function () {
    function LearnerDashboardPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    LearnerDashboardPageModule.prototype.ngDoBootstrap = function () { };
    LearnerDashboardPageModule = __decorate([
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
                learner_dashboard_page_constants_1.LearnerDashboardPageConstants
            ]
        })
    ], LearnerDashboardPageModule);
    return LearnerDashboardPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(LearnerDashboardPageModule);
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

/***/ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.scripts.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.scripts.ts ***!
  \************************************************************************************************/
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
 * @fileoverview Scripts for the learner dashboard page.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/learner-dashboard-page/learner-dashboard-page.module.ts */ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! pages/learner-dashboard-page/learner-dashboard-page.controller.ts */ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.controller.ts");


/***/ }),

/***/ "./core/templates/dev/head/pages/learner-dashboard-page/suggestion-modal/suggestion-modal-for-learner-dashboard.service.ts":
/*!*********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/learner-dashboard-page/suggestion-modal/suggestion-modal-for-learner-dashboard.service.ts ***!
  \*********************************************************************************************************************************/
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
__webpack_require__(/*! services/SuggestionModalService.ts */ "./core/templates/dev/head/services/SuggestionModalService.ts");
angular.module('oppia').factory('SuggestionModalForLearnerDashboardService', [
    '$uibModal', 'UrlInterpolationService',
    function ($uibModal, UrlInterpolationService) {
        var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl('/pages/learner-dashboard-page/suggestion-modal/' +
            'learner-dashboard-suggestion-modal.directive.html');
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
                controller: [
                    '$scope', '$uibModalInstance', 'SuggestionModalService',
                    'description', 'newContent', 'oldContent',
                    function ($scope, $uibModalInstance, SuggestionModalService, description, newContent, oldContent) {
                        $scope.newContent = newContent;
                        $scope.oldContent = oldContent;
                        $scope.description = description;
                        $scope.cancel = function () {
                            SuggestionModalService.cancelSuggestion($uibModalInstance);
                        };
                    }
                ]
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

/***/ "./core/templates/dev/head/services/SuggestionModalService.ts":
/*!********************************************************************!*\
  !*** ./core/templates/dev/head/services/SuggestionModalService.ts ***!
  \********************************************************************/
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
 * @fileoverview Service to handle common code for suggestion modal display.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var SuggestionModalService = /** @class */ (function () {
    function SuggestionModalService() {
        this.SUGGESTION_ACCEPTED_MSG = ('This suggestion has already been accepted.');
        this.SUGGESTION_REJECTED_MSG = ('This suggestion has already been rejected.');
        this.SUGGESTION_INVALID_MSG = ('This suggestion was made for a state that no longer exists.' +
            ' It cannot be accepted.');
        this.UNSAVED_CHANGES_MSG = ('You have unsaved changes to this exploration. Please save/discard your ' +
            'unsaved changes if you wish to accept.');
        this.ACTION_ACCEPT_SUGGESTION = 'accept';
        this.ACTION_REJECT_SUGGESTION = 'reject';
        this.ACTION_RESUBMIT_SUGGESTION = 'resubmit';
        this.SUGGESTION_ACCEPTED = 'accepted';
        this.SUGGESTION_REJECTED = 'rejected';
    }
    // TODO(YashJipkate): Replace 'any' with the exact type. This has been kept as
    // 'any' since '$uibModalInstance' is a AngularJS native object and does not
    // have a TS interface.
    SuggestionModalService.prototype.acceptSuggestion = function ($uibModalInstance, paramDict) {
        $uibModalInstance.close(paramDict);
    };
    // TODO(YashJipkate): Replace 'any' with the exact type. This has been kept as
    // 'any' since '$uibModalInstance' is a AngularJS native object and does not
    // have a TS interface.
    SuggestionModalService.prototype.rejectSuggestion = function ($uibModalInstance, paramDict) {
        $uibModalInstance.close(paramDict);
    };
    // TODO(YashJipkate): Replace 'any' with the exact type. This has been kept as
    // 'any' since '$uibModalInstance' is a AngularJS native object and does not
    // have a TS interface.
    SuggestionModalService.prototype.cancelSuggestion = function ($uibModalInstance) {
        $uibModalInstance.dismiss('cancel');
    };
    SuggestionModalService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], SuggestionModalService);
    return SuggestionModalService;
}());
exports.SuggestionModalService = SuggestionModalService;
angular.module('oppia').factory('SuggestionModalService', static_1.downgradeInjectable(SuggestionModalService));


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy9iYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzL2xvYWRpbmctZG90cy5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuY29uc3RhbnRzLmFqcy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3N1bW1hcnktdGlsZS9jb2xsZWN0aW9uLXN1bW1hcnktdGlsZS5jb25zdGFudHMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RpcmVjdGl2ZXMvYW5ndWxhci1odG1sLWJpbmQuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9mZWVkYmFja19tZXNzYWdlL0ZlZWRiYWNrTWVzc2FnZVN1bW1hcnlPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9mZWVkYmFja190aHJlYWQvRmVlZGJhY2tUaHJlYWRTdW1tYXJ5T2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lckRhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9PcHBpYUZvb3RlckRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9mZWVkYmFjay10YWIvc2VydmljZXMvdGhyZWFkLXN0YXR1cy1kaXNwbGF5LnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS9sZWFybmVyLWRhc2hib2FyZC1wYWdlLmNvbnN0YW50cy5hanMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS9sZWFybmVyLWRhc2hib2FyZC1wYWdlLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9sZWFybmVyLWRhc2hib2FyZC1wYWdlL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9sZWFybmVyLWRhc2hib2FyZC1wYWdlL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS5zY3JpcHRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2Uvc3VnZ2VzdGlvbi1tb2RhbC9zdWdnZXN0aW9uLW1vZGFsLWZvci1sZWFybmVyLWRhc2hib2FyZC5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1N1Z2dlc3Rpb25Nb2RhbFNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vZXh0ZW5zaW9ucy9pbnRlcmFjdGlvbnMvaW50ZXJhY3Rpb25zLWV4dGVuc2lvbi5jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQVEsb0JBQW9CO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQWlCLDRCQUE0QjtBQUM3QztBQUNBO0FBQ0EsMEJBQWtCLDJCQUEyQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFD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O0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsbUNBQW1DO0FBQzlFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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ZC5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBpbnN0YWxsIGEgSlNPTlAgY2FsbGJhY2sgZm9yIGNodW5rIGxvYWRpbmdcbiBcdGZ1bmN0aW9uIHdlYnBhY2tKc29ucENhbGxiYWNrKGRhdGEpIHtcbiBcdFx0dmFyIGNodW5rSWRzID0gZGF0YVswXTtcbiBcdFx0dmFyIG1vcmVNb2R1bGVzID0gZGF0YVsxXTtcbiBcdFx0dmFyIGV4ZWN1dGVNb2R1bGVzID0gZGF0YVsyXTtcblxuIFx0XHQvLyBhZGQgXCJtb3JlTW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcbiBcdFx0Ly8gdGhlbiBmbGFnIGFsbCBcImNodW5rSWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG4gXHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDAsIHJlc29sdmVzID0gW107XG4gXHRcdGZvcig7aSA8IGNodW5rSWRzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0Y2h1bmtJZCA9IGNodW5rSWRzW2ldO1xuIFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuIFx0XHRcdFx0cmVzb2x2ZXMucHVzaChpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF1bMF0pO1xuIFx0XHRcdH1cbiBcdFx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuIFx0XHR9XG4gXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuIFx0XHRcdGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG4gXHRcdFx0XHRtb2R1bGVzW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0aWYocGFyZW50SnNvbnBGdW5jdGlvbikgcGFyZW50SnNvbnBGdW5jdGlvbihkYXRhKTtcblxuIFx0XHR3aGlsZShyZXNvbHZlcy5sZW5ndGgpIHtcbiBcdFx0XHRyZXNvbHZlcy5zaGlmdCgpKCk7XG4gXHRcdH1cblxuIFx0XHQvLyBhZGQgZW50cnkgbW9kdWxlcyBmcm9tIGxvYWRlZCBjaHVuayB0byBkZWZlcnJlZCBsaXN0XG4gXHRcdGRlZmVycmVkTW9kdWxlcy5wdXNoLmFwcGx5KGRlZmVycmVkTW9kdWxlcywgZXhlY3V0ZU1vZHVsZXMgfHwgW10pO1xuXG4gXHRcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gYWxsIGNodW5rcyByZWFkeVxuIFx0XHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiBcdH07XG4gXHRmdW5jdGlvbiBjaGVja0RlZmVycmVkTW9kdWxlcygpIHtcbiBcdFx0dmFyIHJlc3VsdDtcbiBcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRlZmVycmVkTW9kdWxlcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdHZhciBkZWZlcnJlZE1vZHVsZSA9IGRlZmVycmVkTW9kdWxlc1tpXTtcbiBcdFx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcbiBcdFx0XHRmb3IodmFyIGogPSAxOyBqIDwgZGVmZXJyZWRNb2R1bGUubGVuZ3RoOyBqKyspIHtcbiBcdFx0XHRcdHZhciBkZXBJZCA9IGRlZmVycmVkTW9kdWxlW2pdO1xuIFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2RlcElkXSAhPT0gMCkgZnVsZmlsbGVkID0gZmFsc2U7XG4gXHRcdFx0fVxuIFx0XHRcdGlmKGZ1bGZpbGxlZCkge1xuIFx0XHRcdFx0ZGVmZXJyZWRNb2R1bGVzLnNwbGljZShpLS0sIDEpO1xuIFx0XHRcdFx0cmVzdWx0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBkZWZlcnJlZE1vZHVsZVswXSk7XG4gXHRcdFx0fVxuIFx0XHR9XG5cbiBcdFx0cmV0dXJuIHJlc3VsdDtcbiBcdH1cblxuIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3NcbiBcdC8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuIFx0Ly8gUHJvbWlzZSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbiBcdHZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG4gXHRcdFwibGVhcm5lcl9kYXNoYm9hcmRcIjogMFxuIFx0fTtcblxuIFx0dmFyIGRlZmVycmVkTW9kdWxlcyA9IFtdO1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHR2YXIganNvbnBBcnJheSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSB8fCBbXTtcbiBcdHZhciBvbGRKc29ucEZ1bmN0aW9uID0ganNvbnBBcnJheS5wdXNoLmJpbmQoanNvbnBBcnJheSk7XG4gXHRqc29ucEFycmF5LnB1c2ggPSB3ZWJwYWNrSnNvbnBDYWxsYmFjaztcbiBcdGpzb25wQXJyYXkgPSBqc29ucEFycmF5LnNsaWNlKCk7XG4gXHRmb3IodmFyIGkgPSAwOyBpIDwganNvbnBBcnJheS5sZW5ndGg7IGkrKykgd2VicGFja0pzb25wQ2FsbGJhY2soanNvbnBBcnJheVtpXSk7XG4gXHR2YXIgcGFyZW50SnNvbnBGdW5jdGlvbiA9IG9sZEpzb25wRnVuY3Rpb247XG5cblxuIFx0Ly8gYWRkIGVudHJ5IG1vZHVsZSB0byBkZWZlcnJlZCBsaXN0XG4gXHRkZWZlcnJlZE1vZHVsZXMucHVzaChbXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS5zY3JpcHRzLnRzXCIsXCJ2ZW5kb3JzfmFib3V0fmFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbW11bml0eV9kYXNoYm9hcmR+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2Fyfjc4NTZjMDVhXCIsXCJ2ZW5kb3JzfmFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wfjdmOGJjYzY3XCIsXCJhYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmUwNmE0YTE3XCIsXCJjb2xsZWN0aW9uX3BsYXllcn5jcmVhdG9yX2Rhc2hib2FyZH5sZWFybmVyX2Rhc2hib2FyZH5saWJyYXJ5fnByb2ZpbGV+c3Rvcnlfdmlld2VyXCIsXCJjb2xsZWN0aW9uX3BsYXllcn5sZWFybmVyX2Rhc2hib2FyZH5saWJyYXJ5fnByb2ZpbGV+c3Rvcnlfdmlld2VyXCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBCYXNlIFRyYW5zY2x1c2lvbiBDb21wb25lbnQuXG4gKi9cbnJlcXVpcmUoJ2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9PcHBpYUZvb3RlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3NpZGViYXIvU2lkZWJhclN0YXR1c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvc3RhdGVmdWwvQmFja2dyb3VuZE1hc2tTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2Jhc2VDb250ZW50JywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB7XG4gICAgICAgICAgICAgICAgYnJlYWRjcnVtYjogJz9uYXZiYXJCcmVhZGNydW1iJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnY29udGVudCcsXG4gICAgICAgICAgICAgICAgZm9vdGVyOiAnP3BhZ2VGb290ZXInLFxuICAgICAgICAgICAgICAgIG5hdk9wdGlvbnM6ICc/bmF2T3B0aW9ucycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvYmFzZV9jb21wb25lbnRzL2Jhc2VfY29udGVudF9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckcm9vdFNjb3BlJywgJ0JhY2tncm91bmRNYXNrU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1NpZGViYXJTdGF0dXNTZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCAnU0lURV9GRUVEQkFDS19GT1JNX1VSTCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIEJhY2tncm91bmRNYXNrU2VydmljZSwgU2lkZWJhclN0YXR1c1NlcnZpY2UsIFVybFNlcnZpY2UsIFNJVEVfRkVFREJBQ0tfRk9STV9VUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlmcmFtZWQgPSBVcmxTZXJ2aWNlLmlzSWZyYW1lZCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNpdGVGZWVkYmFja0Zvcm1VcmwgPSBTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzU2lkZWJhclNob3duID0gU2lkZWJhclN0YXR1c1NlcnZpY2UuaXNTaWRlYmFyU2hvd247XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2xvc2VTaWRlYmFyT25Td2lwZSA9IFNpZGViYXJTdGF0dXNTZXJ2aWNlLmNsb3NlU2lkZWJhcjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc0JhY2tncm91bmRNYXNrQWN0aXZlID0gQmFja2dyb3VuZE1hc2tTZXJ2aWNlLmlzTWFza0FjdGl2ZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5ERVZfTU9ERSA9ICRyb290U2NvcGUuREVWX01PREU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2tpcFRvTWFpbkNvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFpbkNvbnRlbnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29wcGlhLW1haW4tY29udGVudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtYWluQ29udGVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVmFyaWFibGUgbWFpbkNvbnRlbnRFbGVtZW50IGlzIHVuZGVmaW5lZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC50YWJJbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LnNjcm9sbEludG9WaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3Igd2FybmluZ19sb2FkZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnd2FybmluZ0xvYWRlcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvYmFzZV9jb21wb25lbnRzL3dhcm5pbmdfbG9hZGVyX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChBbGVydHNTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5BbGVydHNTZXJ2aWNlID0gQWxlcnRzU2VydmljZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGJhY2tncm91bmQgYmFubmVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2JhY2tncm91bmRCYW5uZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvJyArXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NzaWJsZUJhbm5lckZpbGVuYW1lcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICdiYW5uZXJBLnN2ZycsICdiYW5uZXJCLnN2ZycsICdiYW5uZXJDLnN2ZycsICdiYW5uZXJELnN2ZydcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhbm5lckltYWdlRmlsZW5hbWUgPSBwb3NzaWJsZUJhbm5lckZpbGVuYW1lc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwb3NzaWJsZUJhbm5lckZpbGVuYW1lcy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5iYW5uZXJJbWFnZUZpbGVVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2JhY2tncm91bmQvJyArIGJhbm5lckltYWdlRmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBkaXNwbGF5aW5nIGFuaW1hdGVkIGxvYWRpbmcgZG90cy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdsb2FkaW5nRG90cycsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAgICAgICAgICAgICAnbG9hZGluZy1kb3RzLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkgeyB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHN1bW1hcnkgdGlsZSBmb3IgY29sbGVjdGlvbnMuXG4gKi9cbi8vIFRPRE8oIzcwOTIpOiBEZWxldGUgdGhpcyBmaWxlIG9uY2UgbWlncmF0aW9uIGlzIGNvbXBsZXRlIGFuZCB0aGVzZSBBbmd1bGFySlNcbi8vIGVxdWl2YWxlbnRzIG9mIHRoZSBBbmd1bGFyIGNvbnN0YW50cyBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbnZhciBjb2xsZWN0aW9uX3N1bW1hcnlfdGlsZV9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJjb21wb25lbnRzL3N1bW1hcnktdGlsZS9jb2xsZWN0aW9uLXN1bW1hcnktdGlsZS5jb25zdGFudHNcIik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ09MTEVDVElPTl9WSUVXRVJfVVJMJywgY29sbGVjdGlvbl9zdW1tYXJ5X3RpbGVfY29uc3RhbnRzXzEuQ29sbGVjdGlvblN1bW1hcnlUaWxlQ29uc3RhbnRzLkNPTExFQ1RJT05fVklFV0VSX1VSTCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ09MTEVDVElPTl9FRElUT1JfVVJMJywgY29sbGVjdGlvbl9zdW1tYXJ5X3RpbGVfY29uc3RhbnRzXzEuQ29sbGVjdGlvblN1bW1hcnlUaWxlQ29uc3RhbnRzLkNPTExFQ1RJT05fRURJVE9SX1VSTCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3Igc3VtbWFyeSB0aWxlIGZvciBjb2xsZWN0aW9ucy5cbiAqL1xudmFyIENvbGxlY3Rpb25TdW1tYXJ5VGlsZUNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb2xsZWN0aW9uU3VtbWFyeVRpbGVDb25zdGFudHMoKSB7XG4gICAgfVxuICAgIENvbGxlY3Rpb25TdW1tYXJ5VGlsZUNvbnN0YW50cy5DT0xMRUNUSU9OX1ZJRVdFUl9VUkwgPSAnL2NvbGxlY3Rpb24vPGNvbGxlY3Rpb25faWQ+JztcbiAgICBDb2xsZWN0aW9uU3VtbWFyeVRpbGVDb25zdGFudHMuQ09MTEVDVElPTl9FRElUT1JfVVJMID0gJy9jb2xsZWN0aW9uX2VkaXRvci9jcmVhdGUvPGNvbGxlY3Rpb25faWQ+JztcbiAgICByZXR1cm4gQ29sbGVjdGlvblN1bW1hcnlUaWxlQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuQ29sbGVjdGlvblN1bW1hcnlUaWxlQ29uc3RhbnRzID0gQ29sbGVjdGlvblN1bW1hcnlUaWxlQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTdW1tYXJ5IHRpbGUgZm9yIGNvbGxlY3Rpb25zLlxuICovXG5yZXF1aXJlKCdkb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lckRhc2hib2FyZEljb25zRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdHJ1bmNhdGUtYW5kLWNhcGl0YWxpemUuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9EYXRlVGltZUZvcm1hdFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1VzZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N1bW1hcnktdGlsZS9jb2xsZWN0aW9uLXN1bW1hcnktdGlsZS5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25TdW1tYXJ5VGlsZScsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgZ2V0Q29sbGVjdGlvbklkOiAnJmNvbGxlY3Rpb25JZCcsXG4gICAgICAgICAgICAgICAgZ2V0Q29sbGVjdGlvblRpdGxlOiAnJmNvbGxlY3Rpb25UaXRsZScsXG4gICAgICAgICAgICAgICAgZ2V0T2JqZWN0aXZlOiAnJm9iamVjdGl2ZScsXG4gICAgICAgICAgICAgICAgZ2V0Tm9kZUNvdW50OiAnJm5vZGVDb3VudCcsXG4gICAgICAgICAgICAgICAgZ2V0TGFzdFVwZGF0ZWRNc2VjOiAnJmxhc3RVcGRhdGVkTXNlYycsXG4gICAgICAgICAgICAgICAgZ2V0VGh1bWJuYWlsSWNvblVybDogJyZ0aHVtYm5haWxJY29uVXJsJyxcbiAgICAgICAgICAgICAgICBnZXRUaHVtYm5haWxCZ0NvbG9yOiAnJnRodW1ibmFpbEJnQ29sb3InLFxuICAgICAgICAgICAgICAgIGlzTGlua2VkVG9FZGl0b3JQYWdlOiAnPT9pc0xpbmtlZFRvRWRpdG9yUGFnZScsXG4gICAgICAgICAgICAgICAgZ2V0Q2F0ZWdvcnk6ICcmY2F0ZWdvcnknLFxuICAgICAgICAgICAgICAgIGlzUGxheWxpc3RUaWxlOiAnJmlzUGxheWxpc3RUaWxlJyxcbiAgICAgICAgICAgICAgICBzaG93TGVhcm5lckRhc2hib2FyZEljb25zSWZQb3NzaWJsZTogKCcmc2hvd0xlYXJuZXJEYXNoYm9hcmRJY29uc0lmUG9zc2libGUnKSxcbiAgICAgICAgICAgICAgICBpc0NvbnRhaW5lck5hcnJvdzogJyZjb250YWluZXJJc05hcnJvdycsXG4gICAgICAgICAgICAgICAgaXNPd25lZEJ5Q3VycmVudFVzZXI6ICcmYWN0aXZpdHlJc093bmVkQnlDdXJyZW50VXNlcicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnQUNUSVZJVFlfVFlQRV9DT0xMRUNUSU9OJywgJ0NPTExFQ1RJT05fVklFV0VSX1VSTCcsXG4gICAgICAgICAgICAgICAgJ0NPTExFQ1RJT05fRURJVE9SX1VSTCcsIGZ1bmN0aW9uIChEYXRlVGltZUZvcm1hdFNlcnZpY2UsIFVzZXJTZXJ2aWNlLCBBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04sIENPTExFQ1RJT05fVklFV0VSX1VSTCwgQ09MTEVDVElPTl9FRElUT1JfVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC51c2VySXNMb2dnZWRJbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLmdldFVzZXJJbmZvQXN5bmMoKS50aGVuKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC51c2VySXNMb2dnZWRJbiA9IHVzZXJJbmZvLmlzTG9nZ2VkSW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuREVGQVVMVF9FTVBUWV9USVRMRSA9ICdVbnRpdGxlZCc7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuQUNUSVZJVFlfVFlQRV9DT0xMRUNUSU9OID0gQUNUSVZJVFlfVFlQRV9DT0xMRUNUSU9OO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldExhc3RVcGRhdGVkRGF0ZXRpbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLmdldExvY2FsZUFiYnJldmlhdGVkRGF0ZXRpbWVTdHJpbmcoY3RybC5nZXRMYXN0VXBkYXRlZE1zZWMoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0Q29sbGVjdGlvbkxpbmsgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0VXJsID0gKGN0cmwuaXNMaW5rZWRUb0VkaXRvclBhZ2UgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENPTExFQ1RJT05fRURJVE9SX1VSTCA6IENPTExFQ1RJT05fVklFV0VSX1VSTCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwodGFyZ2V0VXJsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbl9pZDogY3RybC5nZXRDb2xsZWN0aW9uSWQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0Q29tcGxldGVUaHVtYm5haWxJY29uVXJsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKGN0cmwuZ2V0VGh1bWJuYWlsSWNvblVybCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRTdGF0aWNJbWFnZVVybCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNldEhvdmVyU3RhdGUgPSBmdW5jdGlvbiAoaG92ZXJTdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2xsZWN0aW9uSXNDdXJyZW50bHlIb3ZlcmVkT3ZlciA9IGhvdmVyU3RhdGU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBBbmd1bGFySHRtbEJpbmQgRGlyZWN0aXZlIChub3QgYXNzb2NpYXRlZCB3aXRoIHJldXNhYmxlXG4gKiBjb21wb25lbnRzLilcbiAqIE5COiBSZXVzYWJsZSBjb21wb25lbnQgZGlyZWN0aXZlcyBzaG91bGQgZ28gaW4gdGhlIGNvbXBvbmVudHMvIGZvbGRlci5cbiAqL1xuLy8gSFRNTCBiaW5kIGRpcmVjdGl2ZSB0aGF0IHRydXN0cyB0aGUgdmFsdWUgaXQgaXMgZ2l2ZW4gYW5kIGFsc28gZXZhbHVhdGVzXG4vLyBjdXN0b20gZGlyZWN0aXZlIHRhZ3MgaW4gdGhlIHByb3ZpZGVkIHZhbHVlLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdhbmd1bGFySHRtbEJpbmQnLCBbXG4gICAgJyRjb21waWxlJywgZnVuY3Rpb24gKCRjb21waWxlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbG0sIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2xlYW4gdXAgb2xkIHNjb3BlcyBpZiB0aGUgaHRtbCBjaGFuZ2VzLlxuICAgICAgICAgICAgICAgIC8vIFJlZmVyZW5jZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQyOTI3ODE0XG4gICAgICAgICAgICAgICAgdmFyIG5ld1Njb3BlO1xuICAgICAgICAgICAgICAgIHNjb3BlLiR3YXRjaChhdHRycy5odG1sRGF0YSwgZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXdTY29wZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3U2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbG0uZW1wdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3U2NvcGUgPSBzY29wZS4kbmV3KCk7XG4gICAgICAgICAgICAgICAgICAgIGVsbS5odG1sKG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgJGNvbXBpbGUoZWxtLmNvbnRlbnRzKCkpKG5ld1Njb3BlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBmZWVkYmFja1xuICAgbWVzc2FnZSBkb21haW4gb2JqZWN0cy5cbiAqL1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIEZlZWRiYWNrTWVzc2FnZVN1bW1hcnkgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmVlZGJhY2tNZXNzYWdlU3VtbWFyeShtZXNzYWdlSWQsIHRleHQsIHVwZGF0ZWRTdGF0dXMsIHN1Z2dlc3Rpb25IdG1sLCBjdXJyZW50Q29udGVudEh0bWwsIGRlc2NyaXB0aW9uLCBhdXRob3JVc2VybmFtZSwgYXV0aG9yUGljdHVyZURhdGFVcmwsIGNyZWF0ZWRPbikge1xuICAgICAgICB0aGlzLm1lc3NhZ2VJZCA9IG1lc3NhZ2VJZDtcbiAgICAgICAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgICAgICAgdGhpcy51cGRhdGVkU3RhdHVzID0gdXBkYXRlZFN0YXR1cztcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9uSHRtbCA9IHN1Z2dlc3Rpb25IdG1sO1xuICAgICAgICB0aGlzLmN1cnJlbnRDb250ZW50SHRtbCA9IGN1cnJlbnRDb250ZW50SHRtbDtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuICAgICAgICB0aGlzLmF1dGhvclVzZXJuYW1lID0gYXV0aG9yVXNlcm5hbWU7XG4gICAgICAgIHRoaXMuYXV0aG9yUGljdHVyZURhdGFVcmwgPSBhdXRob3JQaWN0dXJlRGF0YVVybDtcbiAgICAgICAgdGhpcy5jcmVhdGVkT24gPSBjcmVhdGVkT247XG4gICAgfVxuICAgIHJldHVybiBGZWVkYmFja01lc3NhZ2VTdW1tYXJ5O1xufSgpKTtcbmV4cG9ydHMuRmVlZGJhY2tNZXNzYWdlU3VtbWFyeSA9IEZlZWRiYWNrTWVzc2FnZVN1bW1hcnk7XG52YXIgRmVlZGJhY2tNZXNzYWdlU3VtbWFyeU9iamVjdEZhY3RvcnkgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmVlZGJhY2tNZXNzYWdlU3VtbWFyeU9iamVjdEZhY3RvcnkoKSB7XG4gICAgfVxuICAgIEZlZWRiYWNrTWVzc2FnZVN1bW1hcnlPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVOZXdNZXNzYWdlID0gZnVuY3Rpb24gKG5ld01lc3NhZ2VJZCwgbmV3TWVzc2FnZVRleHQsIGF1dGhvclVzZXJuYW1lLCBhdXRob3JQaWN0dXJlRGF0YVVybCkge1xuICAgICAgICByZXR1cm4gbmV3IEZlZWRiYWNrTWVzc2FnZVN1bW1hcnkobmV3TWVzc2FnZUlkLCBuZXdNZXNzYWdlVGV4dCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgYXV0aG9yVXNlcm5hbWUsIGF1dGhvclBpY3R1cmVEYXRhVXJsLCBuZXcgRGF0ZSgpKTtcbiAgICB9O1xuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ2ZlZWRiYWNrTWVzc2FnZVN1bW1hcnlCYWNrZW5kRGljdCcgaXMgYSBkaWN0IHdpdGhcbiAgICAvLyB1bmRlcnNjb3JlX2Nhc2VkIGtleXMgd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmdcbiAgICAvLyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy5cbiAgICBGZWVkYmFja01lc3NhZ2VTdW1tYXJ5T2JqZWN0RmFjdG9yeS5wcm90b3R5cGUuY3JlYXRlRnJvbUJhY2tlbmREaWN0ID0gZnVuY3Rpb24gKGZlZWRiYWNrTWVzc2FnZVN1bW1hcnlCYWNrZW5kRGljdCkge1xuICAgICAgICByZXR1cm4gbmV3IEZlZWRiYWNrTWVzc2FnZVN1bW1hcnkoZmVlZGJhY2tNZXNzYWdlU3VtbWFyeUJhY2tlbmREaWN0Lm1lc3NhZ2VfaWQsIGZlZWRiYWNrTWVzc2FnZVN1bW1hcnlCYWNrZW5kRGljdC50ZXh0LCBmZWVkYmFja01lc3NhZ2VTdW1tYXJ5QmFja2VuZERpY3QudXBkYXRlZF9zdGF0dXMsIGZlZWRiYWNrTWVzc2FnZVN1bW1hcnlCYWNrZW5kRGljdC5zdWdnZXN0aW9uX2h0bWwsIGZlZWRiYWNrTWVzc2FnZVN1bW1hcnlCYWNrZW5kRGljdC5jdXJyZW50X2NvbnRlbnRfaHRtbCwgZmVlZGJhY2tNZXNzYWdlU3VtbWFyeUJhY2tlbmREaWN0LmRlc2NyaXB0aW9uLCBmZWVkYmFja01lc3NhZ2VTdW1tYXJ5QmFja2VuZERpY3QuYXV0aG9yX3VzZXJuYW1lLCBmZWVkYmFja01lc3NhZ2VTdW1tYXJ5QmFja2VuZERpY3QuYXV0aG9yX3BpY3R1cmVfZGF0YV91cmwsIGZlZWRiYWNrTWVzc2FnZVN1bW1hcnlCYWNrZW5kRGljdC5jcmVhdGVkX29uKTtcbiAgICB9O1xuICAgIEZlZWRiYWNrTWVzc2FnZVN1bW1hcnlPYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIEZlZWRiYWNrTWVzc2FnZVN1bW1hcnlPYmplY3RGYWN0b3J5KTtcbiAgICByZXR1cm4gRmVlZGJhY2tNZXNzYWdlU3VtbWFyeU9iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5GZWVkYmFja01lc3NhZ2VTdW1tYXJ5T2JqZWN0RmFjdG9yeSA9IEZlZWRiYWNrTWVzc2FnZVN1bW1hcnlPYmplY3RGYWN0b3J5O1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnRmVlZGJhY2tNZXNzYWdlU3VtbWFyeU9iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKEZlZWRiYWNrTWVzc2FnZVN1bW1hcnlPYmplY3RGYWN0b3J5KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2YgZmVlZGJhY2sgdGhyZWFkXG4gICBkb21haW4gb2JqZWN0cy5cbiAqL1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIEZlZWRiYWNrVGhyZWFkU3VtbWFyeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGZWVkYmFja1RocmVhZFN1bW1hcnkoc3RhdHVzLCBvcmlnaW5hbEF1dGhvcklkLCBsYXN0VXBkYXRlZCwgbGFzdE1lc3NhZ2VUZXh0LCB0b3RhbE1lc3NhZ2VDb3VudCwgbGFzdE1lc3NhZ2VSZWFkLCBzZWNvbmRMYXN0TWVzc2FnZVJlYWQsIGF1dGhvckxhc3RNZXNzYWdlLCBhdXRob3JTZWNvbmRMYXN0TWVzc2FnZSwgZXhwbG9yYXRpb25UaXRsZSwgZXhwbG9yYXRpb25JZCwgdGhyZWFkSWQpIHtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBzdGF0dXM7XG4gICAgICAgIHRoaXMub3JpZ2luYWxBdXRob3JJZCA9IG9yaWdpbmFsQXV0aG9ySWQ7XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZWQgPSBsYXN0VXBkYXRlZDtcbiAgICAgICAgdGhpcy5sYXN0TWVzc2FnZVRleHQgPSBsYXN0TWVzc2FnZVRleHQ7XG4gICAgICAgIHRoaXMudG90YWxNZXNzYWdlQ291bnQgPSB0b3RhbE1lc3NhZ2VDb3VudDtcbiAgICAgICAgdGhpcy5sYXN0TWVzc2FnZVJlYWQgPSBsYXN0TWVzc2FnZVJlYWQ7XG4gICAgICAgIHRoaXMuc2Vjb25kTGFzdE1lc3NhZ2VSZWFkID0gc2Vjb25kTGFzdE1lc3NhZ2VSZWFkO1xuICAgICAgICB0aGlzLmF1dGhvckxhc3RNZXNzYWdlID0gYXV0aG9yTGFzdE1lc3NhZ2U7XG4gICAgICAgIHRoaXMuYXV0aG9yU2Vjb25kTGFzdE1lc3NhZ2UgPSBhdXRob3JTZWNvbmRMYXN0TWVzc2FnZTtcbiAgICAgICAgdGhpcy5leHBsb3JhdGlvblRpdGxlID0gZXhwbG9yYXRpb25UaXRsZTtcbiAgICAgICAgdGhpcy5leHBsb3JhdGlvbklkID0gZXhwbG9yYXRpb25JZDtcbiAgICAgICAgdGhpcy50aHJlYWRJZCA9IHRocmVhZElkO1xuICAgIH1cbiAgICBGZWVkYmFja1RocmVhZFN1bW1hcnkucHJvdG90eXBlLm1hcmtUaGVMYXN0VHdvTWVzc2FnZXNBc1JlYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmF1dGhvclNlY29uZExhc3RNZXNzYWdlKSB7XG4gICAgICAgICAgICB0aGlzLnNlY29uZExhc3RNZXNzYWdlUmVhZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXN0TWVzc2FnZVJlYWQgPSB0cnVlO1xuICAgIH07XG4gICAgRmVlZGJhY2tUaHJlYWRTdW1tYXJ5LnByb3RvdHlwZS5hcHBlbmROZXdNZXNzYWdlID0gZnVuY3Rpb24gKGxhc3RNZXNzYWdlVGV4dCwgYXV0aG9yTGFzdE1lc3NhZ2UpIHtcbiAgICAgICAgdGhpcy5sYXN0TWVzc2FnZVRleHQgPSBsYXN0TWVzc2FnZVRleHQ7XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB0aGlzLmF1dGhvclNlY29uZExhc3RNZXNzYWdlID0gdGhpcy5hdXRob3JMYXN0TWVzc2FnZTtcbiAgICAgICAgdGhpcy5hdXRob3JMYXN0TWVzc2FnZSA9IGF1dGhvckxhc3RNZXNzYWdlO1xuICAgICAgICB0aGlzLnRvdGFsTWVzc2FnZUNvdW50ICs9IDE7XG4gICAgICAgIHRoaXMubGFzdE1lc3NhZ2VSZWFkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zZWNvbmRMYXN0TWVzc2FnZVJlYWQgPSB0cnVlO1xuICAgIH07XG4gICAgcmV0dXJuIEZlZWRiYWNrVGhyZWFkU3VtbWFyeTtcbn0oKSk7XG5leHBvcnRzLkZlZWRiYWNrVGhyZWFkU3VtbWFyeSA9IEZlZWRiYWNrVGhyZWFkU3VtbWFyeTtcbnZhciBGZWVkYmFja1RocmVhZFN1bW1hcnlPYmplY3RGYWN0b3J5ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZlZWRiYWNrVGhyZWFkU3VtbWFyeU9iamVjdEZhY3RvcnkoKSB7XG4gICAgfVxuICAgIEZlZWRiYWNrVGhyZWFkU3VtbWFyeU9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uIChzdGF0dXMsIG9yaWdpbmFsQXV0aG9ySWQsIGxhc3RVcGRhdGVkLCBsYXN0TWVzc2FnZVRleHQsIHRvdGFsTWVzc2FnZUNvdW50LCBsYXN0TWVzc2FnZVJlYWQsIHNlY29uZExhc3RNZXNzYWdlUmVhZCwgYXV0aG9yTGFzdE1lc3NhZ2UsIGF1dGhvclNlY29uZExhc3RNZXNzYWdlLCBleHBsb3JhdGlvblRpdGxlLCBleHBsb3JhdGlvbklkLCB0aHJlYWRJZCkge1xuICAgICAgICByZXR1cm4gbmV3IEZlZWRiYWNrVGhyZWFkU3VtbWFyeShzdGF0dXMsIG9yaWdpbmFsQXV0aG9ySWQsIGxhc3RVcGRhdGVkLCBsYXN0TWVzc2FnZVRleHQsIHRvdGFsTWVzc2FnZUNvdW50LCBsYXN0TWVzc2FnZVJlYWQsIHNlY29uZExhc3RNZXNzYWdlUmVhZCwgYXV0aG9yTGFzdE1lc3NhZ2UsIGF1dGhvclNlY29uZExhc3RNZXNzYWdlLCBleHBsb3JhdGlvblRpdGxlLCBleHBsb3JhdGlvbklkLCB0aHJlYWRJZCk7XG4gICAgfTtcbiAgICBGZWVkYmFja1RocmVhZFN1bW1hcnlPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVGcm9tQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoZmVlZGJhY2tUaHJlYWRTdW1tYXJ5QmFja2VuZERpY3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGZWVkYmFja1RocmVhZFN1bW1hcnkoZmVlZGJhY2tUaHJlYWRTdW1tYXJ5QmFja2VuZERpY3Quc3RhdHVzLCBmZWVkYmFja1RocmVhZFN1bW1hcnlCYWNrZW5kRGljdC5vcmlnaW5hbF9hdXRob3JfaWQsIGZlZWRiYWNrVGhyZWFkU3VtbWFyeUJhY2tlbmREaWN0Lmxhc3RfdXBkYXRlZCwgZmVlZGJhY2tUaHJlYWRTdW1tYXJ5QmFja2VuZERpY3QubGFzdF9tZXNzYWdlX3RleHQsIGZlZWRiYWNrVGhyZWFkU3VtbWFyeUJhY2tlbmREaWN0LnRvdGFsX21lc3NhZ2VfY291bnQsIGZlZWRiYWNrVGhyZWFkU3VtbWFyeUJhY2tlbmREaWN0Lmxhc3RfbWVzc2FnZV9pc19yZWFkLCBmZWVkYmFja1RocmVhZFN1bW1hcnlCYWNrZW5kRGljdC5zZWNvbmRfbGFzdF9tZXNzYWdlX2lzX3JlYWQsIGZlZWRiYWNrVGhyZWFkU3VtbWFyeUJhY2tlbmREaWN0LmF1dGhvcl9sYXN0X21lc3NhZ2UsIGZlZWRiYWNrVGhyZWFkU3VtbWFyeUJhY2tlbmREaWN0LmF1dGhvcl9zZWNvbmRfbGFzdF9tZXNzYWdlLCBmZWVkYmFja1RocmVhZFN1bW1hcnlCYWNrZW5kRGljdC5leHBsb3JhdGlvbl90aXRsZSwgZmVlZGJhY2tUaHJlYWRTdW1tYXJ5QmFja2VuZERpY3QuZXhwbG9yYXRpb25faWQsIGZlZWRiYWNrVGhyZWFkU3VtbWFyeUJhY2tlbmREaWN0LnRocmVhZF9pZCk7XG4gICAgfTtcbiAgICBGZWVkYmFja1RocmVhZFN1bW1hcnlPYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIEZlZWRiYWNrVGhyZWFkU3VtbWFyeU9iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBGZWVkYmFja1RocmVhZFN1bW1hcnlPYmplY3RGYWN0b3J5O1xufSgpKTtcbmV4cG9ydHMuRmVlZGJhY2tUaHJlYWRTdW1tYXJ5T2JqZWN0RmFjdG9yeSA9IEZlZWRiYWNrVGhyZWFkU3VtbWFyeU9iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdGZWVkYmFja1RocmVhZFN1bW1hcnlPYmplY3RGYWN0b3J5Jywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShGZWVkYmFja1RocmVhZFN1bW1hcnlPYmplY3RGYWN0b3J5KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9fbWV0YWRhdGEgPSAodGhpcyAmJiB0aGlzLl9fbWV0YWRhdGEpIHx8IGZ1bmN0aW9uIChrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIG9mIGxlYXJuZXIgZGFzaGJvYXJkIGZyb20gdGhlXG4gKiBiYWNrZW5kLlxuICovXG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgaHR0cF8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvbW1vbi9odHRwXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIExlYXJuZXJEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMZWFybmVyRGFzaGJvYXJkQmFja2VuZEFwaVNlcnZpY2UoaHR0cCkge1xuICAgICAgICB0aGlzLmh0dHAgPSBodHRwO1xuICAgIH1cbiAgICBMZWFybmVyRGFzaGJvYXJkQmFja2VuZEFwaVNlcnZpY2UucHJvdG90eXBlLl9mZXRjaExlYXJuZXJEYXNoYm9hcmREYXRhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBIdHRwQ2xpZW50IHJldHVybnMgYW4gT2JzZXJ2YWJsZSwgdGhlIHRvUHJvbWlzZSBjb252ZXJ0cyBpdCBpbnRvIGFcbiAgICAgICAgLy8gUHJvbWlzZS5cbiAgICAgICAgcmV0dXJuIHRoaXMuaHR0cC5nZXQoJy9sZWFybmVyZGFzaGJvYXJkaGFuZGxlci9kYXRhJykudG9Qcm9taXNlKCk7XG4gICAgfTtcbiAgICBMZWFybmVyRGFzaGJvYXJkQmFja2VuZEFwaVNlcnZpY2UucHJvdG90eXBlLmZldGNoTGVhcm5lckRhc2hib2FyZERhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mZXRjaExlYXJuZXJEYXNoYm9hcmREYXRhKCk7XG4gICAgfTtcbiAgICB2YXIgX2E7XG4gICAgTGVhcm5lckRhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KSxcbiAgICAgICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFt0eXBlb2YgKF9hID0gdHlwZW9mIGh0dHBfMS5IdHRwQ2xpZW50ICE9PSBcInVuZGVmaW5lZFwiICYmIGh0dHBfMS5IdHRwQ2xpZW50KSA9PT0gXCJmdW5jdGlvblwiID8gX2EgOiBPYmplY3RdKVxuICAgIF0sIExlYXJuZXJEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZSk7XG4gICAgcmV0dXJuIExlYXJuZXJEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZTtcbn0oKSk7XG5leHBvcnRzLkxlYXJuZXJEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZSA9IExlYXJuZXJEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0xlYXJuZXJEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoTGVhcm5lckRhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlKSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3Igb2JqZWN0cyBkb21haW4uXG4gKi9cbnZhciBPYmplY3RzRG9tYWluQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE9iamVjdHNEb21haW5Db25zdGFudHMoKSB7XG4gICAgfVxuICAgIE9iamVjdHNEb21haW5Db25zdGFudHMuRlJBQ1RJT05fUEFSU0lOR19FUlJPUlMgPSB7XG4gICAgICAgIElOVkFMSURfQ0hBUlM6ICdQbGVhc2Ugb25seSB1c2UgbnVtZXJpY2FsIGRpZ2l0cywgc3BhY2VzIG9yIGZvcndhcmQgc2xhc2hlcyAoLyknLFxuICAgICAgICBJTlZBTElEX0ZPUk1BVDogJ1BsZWFzZSBlbnRlciBhIHZhbGlkIGZyYWN0aW9uIChlLmcuLCA1LzMgb3IgMSAyLzMpJyxcbiAgICAgICAgRElWSVNJT05fQllfWkVSTzogJ1BsZWFzZSBkbyBub3QgcHV0IDAgaW4gdGhlIGRlbm9taW5hdG9yJ1xuICAgIH07XG4gICAgT2JqZWN0c0RvbWFpbkNvbnN0YW50cy5OVU1CRVJfV0lUSF9VTklUU19QQVJTSU5HX0VSUk9SUyA9IHtcbiAgICAgICAgSU5WQUxJRF9WQUxVRTogJ1BsZWFzZSBlbnN1cmUgdGhhdCB2YWx1ZSBpcyBlaXRoZXIgYSBmcmFjdGlvbiBvciBhIG51bWJlcicsXG4gICAgICAgIElOVkFMSURfQ1VSUkVOQ1k6ICdQbGVhc2UgZW50ZXIgYSB2YWxpZCBjdXJyZW5jeSAoZS5nLiwgJDUgb3IgUnMgNSknLFxuICAgICAgICBJTlZBTElEX0NVUlJFTkNZX0ZPUk1BVDogJ1BsZWFzZSB3cml0ZSBjdXJyZW5jeSB1bml0cyBhdCB0aGUgYmVnaW5uaW5nJyxcbiAgICAgICAgSU5WQUxJRF9VTklUX0NIQVJTOiAnUGxlYXNlIGVuc3VyZSB0aGF0IHVuaXQgb25seSBjb250YWlucyBudW1iZXJzLCBhbHBoYWJldHMsICgsICksICosIF4sICcgK1xuICAgICAgICAgICAgJy8sIC0nXG4gICAgfTtcbiAgICBPYmplY3RzRG9tYWluQ29uc3RhbnRzLkNVUlJFTkNZX1VOSVRTID0ge1xuICAgICAgICBkb2xsYXI6IHtcbiAgICAgICAgICAgIG5hbWU6ICdkb2xsYXInLFxuICAgICAgICAgICAgYWxpYXNlczogWyckJywgJ2RvbGxhcnMnLCAnRG9sbGFycycsICdEb2xsYXInLCAnVVNEJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogWyckJ10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgcnVwZWU6IHtcbiAgICAgICAgICAgIG5hbWU6ICdydXBlZScsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ1JzJywgJ3J1cGVlcycsICfigrknLCAnUnVwZWVzJywgJ1J1cGVlJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogWydScyAnLCAn4oK5J10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgY2VudDoge1xuICAgICAgICAgICAgbmFtZTogJ2NlbnQnLFxuICAgICAgICAgICAgYWxpYXNlczogWydjZW50cycsICdDZW50cycsICdDZW50J10sXG4gICAgICAgICAgICBmcm9udF91bml0czogW10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIGRvbGxhcidcbiAgICAgICAgfSxcbiAgICAgICAgcGFpc2U6IHtcbiAgICAgICAgICAgIG5hbWU6ICdwYWlzZScsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ3BhaXNhJywgJ1BhaXNlJywgJ1BhaXNhJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogW10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIHJ1cGVlJ1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gT2JqZWN0c0RvbWFpbkNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLk9iamVjdHNEb21haW5Db25zdGFudHMgPSBPYmplY3RzRG9tYWluQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBmb290ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFGb290ZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9vcHBpYV9mb290ZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0aGF0IHByb3ZpZGVzIGluZm9ybWF0aW9uIGFib3V0IGhvdyB0byBkaXNwbGF5IHRoZVxuICogc3RhdHVzIGxhYmVsIGZvciBhIHRocmVhZCBpbiB0aGUgZmVlZGJhY2sgdGFiIG9mIHRoZSBleHBsb3JhdGlvbiBlZGl0b3IuXG4gKi9cbnZhciBjbG9uZURlZXBfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwibG9kYXNoL2Nsb25lRGVlcFwiKSk7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2UoKSB7XG4gICAgICAgIHRoaXMuU1RBVFVTX0NIT0lDRVMgPSBjbG9uZURlZXBfMS5kZWZhdWx0KFRocmVhZFN0YXR1c0Rpc3BsYXlTZXJ2aWNlXzEuX1NUQVRVU19DSE9JQ0VTKTtcbiAgICB9XG4gICAgVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2VfMSA9IFRocmVhZFN0YXR1c0Rpc3BsYXlTZXJ2aWNlO1xuICAgIFRocmVhZFN0YXR1c0Rpc3BsYXlTZXJ2aWNlLnByb3RvdHlwZS5nZXRMYWJlbENsYXNzID0gZnVuY3Rpb24gKHN0YXR1cykge1xuICAgICAgICBpZiAoc3RhdHVzID09PSAnb3BlbicpIHtcbiAgICAgICAgICAgIHJldHVybiAnbGFiZWwgbGFiZWwtaW5mbyc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc3RhdHVzID09PSAnY29tcGxpbWVudCcpIHtcbiAgICAgICAgICAgIHJldHVybiAnbGFiZWwgbGFiZWwtc3VjY2Vzcyc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJ2xhYmVsIGxhYmVsLWRlZmF1bHQnO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBUaHJlYWRTdGF0dXNEaXNwbGF5U2VydmljZS5wcm90b3R5cGUuZ2V0SHVtYW5SZWFkYWJsZVN0YXR1cyA9IGZ1bmN0aW9uIChzdGF0dXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBUaHJlYWRTdGF0dXNEaXNwbGF5U2VydmljZV8xLl9TVEFUVVNfQ0hPSUNFUy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKFRocmVhZFN0YXR1c0Rpc3BsYXlTZXJ2aWNlXzEuX1NUQVRVU19DSE9JQ0VTW2ldLmlkID09PSBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2VfMS5fU1RBVFVTX0NIT0lDRVNbaV0udGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfTtcbiAgICB2YXIgVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2VfMTtcbiAgICBUaHJlYWRTdGF0dXNEaXNwbGF5U2VydmljZS5fU1RBVFVTX0NIT0lDRVMgPSBbe1xuICAgICAgICAgICAgaWQ6ICdvcGVuJyxcbiAgICAgICAgICAgIHRleHQ6ICdPcGVuJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgICBpZDogJ2ZpeGVkJyxcbiAgICAgICAgICAgIHRleHQ6ICdGaXhlZCdcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgaWQ6ICdpZ25vcmVkJyxcbiAgICAgICAgICAgIHRleHQ6ICdJZ25vcmVkJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgICBpZDogJ2NvbXBsaW1lbnQnLFxuICAgICAgICAgICAgdGV4dDogJ0NvbXBsaW1lbnQnXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGlkOiAnbm90X2FjdGlvbmFibGUnLFxuICAgICAgICAgICAgdGV4dDogJ05vdCBBY3Rpb25hYmxlJ1xuICAgICAgICB9XTtcbiAgICBUaHJlYWRTdGF0dXNEaXNwbGF5U2VydmljZSA9IFRocmVhZFN0YXR1c0Rpc3BsYXlTZXJ2aWNlXzEgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2UpO1xuICAgIHJldHVybiBUaHJlYWRTdGF0dXNEaXNwbGF5U2VydmljZTtcbn0oKSk7XG5leHBvcnRzLlRocmVhZFN0YXR1c0Rpc3BsYXlTZXJ2aWNlID0gVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2U7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdUaHJlYWRTdGF0dXNEaXNwbGF5U2VydmljZScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2UpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciB0aGUgTGVhcm5lciBkYXNoYm9hcmQuXG4gKi9cbi8vIFRPRE8oIzcwOTIpOiBEZWxldGUgdGhpcyBmaWxlIG9uY2UgbWlncmF0aW9uIGlzIGNvbXBsZXRlIGFuZCB0aGVzZSBBbmd1bGFySlNcbi8vIGVxdWl2YWxlbnRzIG9mIHRoZSBBbmd1bGFyIGNvbnN0YW50cyBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbnZhciBsZWFybmVyX2Rhc2hib2FyZF9wYWdlX2NvbnN0YW50c18xID0gcmVxdWlyZShcInBhZ2VzL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS5jb25zdGFudHNcIik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUycsIGxlYXJuZXJfZGFzaGJvYXJkX3BhZ2VfY29uc3RhbnRzXzEuTGVhcm5lckRhc2hib2FyZFBhZ2VDb25zdGFudHMuTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUycsIGxlYXJuZXJfZGFzaGJvYXJkX3BhZ2VfY29uc3RhbnRzXzEuTGVhcm5lckRhc2hib2FyZFBhZ2VDb25zdGFudHMuTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRVhQTE9SQVRJT05TX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMnLCBsZWFybmVyX2Rhc2hib2FyZF9wYWdlX2NvbnN0YW50c18xLkxlYXJuZXJEYXNoYm9hcmRQYWdlQ29uc3RhbnRzLkVYUExPUkFUSU9OU19TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVUJTQ1JJUFRJT05fU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUycsIGxlYXJuZXJfZGFzaGJvYXJkX3BhZ2VfY29uc3RhbnRzXzEuTGVhcm5lckRhc2hib2FyZFBhZ2VDb25zdGFudHMuU1VCU0NSSVBUSU9OX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0ZFRURCQUNLX1RIUkVBRFNfU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUycsIGxlYXJuZXJfZGFzaGJvYXJkX3BhZ2VfY29uc3RhbnRzXzEuTGVhcm5lckRhc2hib2FyZFBhZ2VDb25zdGFudHMuRkVFREJBQ0tfVEhSRUFEU19TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciB0aGUgTGVhcm5lciBkYXNoYm9hcmQuXG4gKi9cbnZhciBMZWFybmVyRGFzaGJvYXJkUGFnZUNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMZWFybmVyRGFzaGJvYXJkUGFnZUNvbnN0YW50cygpIHtcbiAgICB9XG4gICAgTGVhcm5lckRhc2hib2FyZFBhZ2VDb25zdGFudHMuTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUyA9IHtcbiAgICAgICAgSU5DT01QTEVURTogJ0kxOE5fTEVBUk5FUl9EQVNIQk9BUkRfSU5DT01QTEVURV9TRUNUSU9OJyxcbiAgICAgICAgQ09NUExFVEVEOiAnSTE4Tl9MRUFSTkVSX0RBU0hCT0FSRF9DT01QTEVURURfU0VDVElPTicsXG4gICAgICAgIFNVQlNDUklQVElPTlM6ICdJMThOX0xFQVJORVJfREFTSEJPQVJEX1NVQlNDUklQVElPTlNfU0VDVElPTicsXG4gICAgICAgIEZFRURCQUNLOiAnSTE4Tl9MRUFSTkVSX0RBU0hCT0FSRF9GRUVEQkFDS19TRUNUSU9OJyxcbiAgICAgICAgUExBWUxJU1Q6ICdJMThOX0xFQVJORVJfREFTSEJPQVJEX1BMQVlMSVNUX1NFQ1RJT04nXG4gICAgfTtcbiAgICBMZWFybmVyRGFzaGJvYXJkUGFnZUNvbnN0YW50cy5MRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTID0ge1xuICAgICAgICBFWFBMT1JBVElPTlM6ICdJMThOX0RBU0hCT0FSRF9FWFBMT1JBVElPTlMnLFxuICAgICAgICBDT0xMRUNUSU9OUzogJ0kxOE5fREFTSEJPQVJEX0NPTExFQ1RJT05TJ1xuICAgIH07XG4gICAgTGVhcm5lckRhc2hib2FyZFBhZ2VDb25zdGFudHMuRVhQTE9SQVRJT05TX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMgPSB7XG4gICAgICAgIExBU1RfUExBWUVEOiB7XG4gICAgICAgICAgICBrZXk6ICdsYXN0X3BsYXllZCcsXG4gICAgICAgICAgICBpMThuSWQ6ICdJMThOX0xFQVJORVJfREFTSEJPQVJEX0VYUExPUkFUSU9OU19TT1JUX0JZX0xBU1RfUExBWUVEJ1xuICAgICAgICB9LFxuICAgICAgICBUSVRMRToge1xuICAgICAgICAgICAga2V5OiAndGl0bGUnLFxuICAgICAgICAgICAgaTE4bklkOiAnSTE4Tl9EQVNIQk9BUkRfRVhQTE9SQVRJT05TX1NPUlRfQllfVElUTEUnXG4gICAgICAgIH0sXG4gICAgICAgIENBVEVHT1JZOiB7XG4gICAgICAgICAgICBrZXk6ICdjYXRlZ29yeScsXG4gICAgICAgICAgICBpMThuSWQ6ICdJMThOX0RBU0hCT0FSRF9FWFBMT1JBVElPTlNfU09SVF9CWV9DQVRFR09SWSdcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGVhcm5lckRhc2hib2FyZFBhZ2VDb25zdGFudHMuU1VCU0NSSVBUSU9OX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMgPSB7XG4gICAgICAgIFVTRVJOQU1FOiB7XG4gICAgICAgICAgICBrZXk6ICdzdWJzY3JpYmVyX3VzZXJuYW1lJyxcbiAgICAgICAgICAgIGkxOG5JZDogJ0kxOE5fUFJFRkVSRU5DRVNfVVNFUk5BTUUnXG4gICAgICAgIH0sXG4gICAgICAgIElNUEFDVDoge1xuICAgICAgICAgICAga2V5OiAnc3Vic2NyaWJlcl9pbXBhY3QnLFxuICAgICAgICAgICAgaTE4bklkOiAnSTE4Tl9DUkVBVE9SX0lNUEFDVCdcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGVhcm5lckRhc2hib2FyZFBhZ2VDb25zdGFudHMuRkVFREJBQ0tfVEhSRUFEU19TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTID0ge1xuICAgICAgICBMQVNUX1VQREFURUQ6IHtcbiAgICAgICAgICAgIGtleTogJ2xhc3RfdXBkYXRlZCcsXG4gICAgICAgICAgICBpMThuSWQ6ICdJMThOX0RBU0hCT0FSRF9FWFBMT1JBVElPTlNfU09SVF9CWV9MQVNUX1VQREFURUQnXG4gICAgICAgIH0sXG4gICAgICAgIEVYUExPUkFUSU9OOiB7XG4gICAgICAgICAgICBrZXk6ICdleHBsb3JhdGlvbicsXG4gICAgICAgICAgICBpMThuSWQ6ICdJMThOX0RBU0hCT0FSRF9UQUJMRV9IRUFESU5HX0VYUExPUkFUSU9OJ1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gTGVhcm5lckRhc2hib2FyZFBhZ2VDb25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5MZWFybmVyRGFzaGJvYXJkUGFnZUNvbnN0YW50cyA9IExlYXJuZXJEYXNoYm9hcmRQYWdlQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVycyBmb3IgdGhlIGNyZWF0b3IgZGFzaGJvYXJkLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvJyArXG4gICAgJ2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICdsb2FkaW5nLWRvdHMuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N1bW1hcnktdGlsZS9jb2xsZWN0aW9uLXN1bW1hcnktdGlsZS5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvc3VtbWFyeS10aWxlL2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy90cnVuY2F0ZS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2RpcmVjdGl2ZXMvYW5ndWxhci1odG1sLWJpbmQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZmVlZGJhY2tfbWVzc2FnZS9GZWVkYmFja01lc3NhZ2VTdW1tYXJ5T2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2ZlZWRiYWNrX3RocmVhZC9GZWVkYmFja1RocmVhZFN1bW1hcnlPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lckRhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9mZWVkYmFjay10YWIvc2VydmljZXMvJyArXG4gICAgJ3RocmVhZC1zdGF0dXMtZGlzcGxheS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9sZWFybmVyLWRhc2hib2FyZC1wYWdlL3N1Z2dlc3Rpb24tbW9kYWwvJyArXG4gICAgJ3N1Z2dlc3Rpb24tbW9kYWwtZm9yLWxlYXJuZXItZGFzaGJvYXJkLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0RhdGVUaW1lRm9ybWF0U2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXNlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2xlYXJuZXJEYXNoYm9hcmRQYWdlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS9sZWFybmVyLWRhc2hib2FyZC1wYWdlLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckcm9vdFNjb3BlJywgJyRxJywgJyR3aW5kb3cnLCAnJGh0dHAnLCAnJHVpYk1vZGFsJyxcbiAgICAgICAgICAgICAgICAnQWxlcnRzU2VydmljZScsICdFWFBMT1JBVElPTlNfU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUycsXG4gICAgICAgICAgICAgICAgJ0FDVElWSVRZX1RZUEVfQ09MTEVDVElPTicsICdBQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OJyxcbiAgICAgICAgICAgICAgICAnU1VCU0NSSVBUSU9OX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMnLCAnRkFUQUxfRVJST1JfQ09ERVMnLFxuICAgICAgICAgICAgICAgICdMZWFybmVyRGFzaGJvYXJkQmFja2VuZEFwaVNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdMRUFSTkVSX0RBU0hCT0FSRF9TRUNUSU9OX0kxOE5fSURTJyxcbiAgICAgICAgICAgICAgICAnTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUycsICdUaHJlYWRTdGF0dXNEaXNwbGF5U2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0RhdGVUaW1lRm9ybWF0U2VydmljZScsICdGRUVEQkFDS19USFJFQURTX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMnLFxuICAgICAgICAgICAgICAgICdGZWVkYmFja1RocmVhZFN1bW1hcnlPYmplY3RGYWN0b3J5JyxcbiAgICAgICAgICAgICAgICAnRmVlZGJhY2tNZXNzYWdlU3VtbWFyeU9iamVjdEZhY3RvcnknLFxuICAgICAgICAgICAgICAgICdTdWdnZXN0aW9uTW9kYWxGb3JMZWFybmVyRGFzaGJvYXJkU2VydmljZScsICdVc2VyU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgJHEsICR3aW5kb3csICRodHRwLCAkdWliTW9kYWwsIEFsZXJ0c1NlcnZpY2UsIEVYUExPUkFUSU9OU19TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTLCBBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04sIEFDVElWSVRZX1RZUEVfRVhQTE9SQVRJT04sIFNVQlNDUklQVElPTl9TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTLCBGQVRBTF9FUlJPUl9DT0RFUywgTGVhcm5lckRhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUywgTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUywgVGhyZWFkU3RhdHVzRGlzcGxheVNlcnZpY2UsIERhdGVUaW1lRm9ybWF0U2VydmljZSwgRkVFREJBQ0tfVEhSRUFEU19TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTLCBGZWVkYmFja1RocmVhZFN1bW1hcnlPYmplY3RGYWN0b3J5LCBGZWVkYmFja01lc3NhZ2VTdW1tYXJ5T2JqZWN0RmFjdG9yeSwgU3VnZ2VzdGlvbk1vZGFsRm9yTGVhcm5lckRhc2hib2FyZFNlcnZpY2UsIFVzZXJTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5FWFBMT1JBVElPTlNfU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUyA9IChFWFBMT1JBVElPTlNfU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUyk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuU1VCU0NSSVBUSU9OX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMgPSAoU1VCU0NSSVBUSU9OX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkZFRURCQUNLX1RIUkVBRFNfU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUyA9IChGRUVEQkFDS19USFJFQURTX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkxFQVJORVJfREFTSEJPQVJEX1NFQ1RJT05fSTE4Tl9JRFMgPSAoTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUyk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUyA9IChMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRTdGF0aWNJbWFnZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLlBBR0VfU0laRSA9IDg7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuTWF0aCA9IHdpbmRvdy5NYXRoO1xuICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRQcm9maWxlSW1hZ2VEYXRhVXJsQXN5bmMoKS50aGVuKGZ1bmN0aW9uIChkYXRhVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnByb2ZpbGVQaWN0dXJlRGF0YVVybCA9IGRhdGFVcmw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJ0xvYWRpbmcnO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJuYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1c2VySW5mb1Byb21pc2UgPSBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCk7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJJbmZvUHJvbWlzZS50aGVuKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC51c2VybmFtZSA9IHVzZXJJbmZvLmdldFVzZXJuYW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGFzaGJvYXJkRGF0YVByb21pc2UgPSAoTGVhcm5lckRhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlLmZldGNoTGVhcm5lckRhc2hib2FyZERhdGEoKSk7XG4gICAgICAgICAgICAgICAgICAgIGRhc2hib2FyZERhdGFQcm9taXNlLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc0N1cnJlbnRFeHBTb3J0RGVzY2VuZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzQ3VycmVudFN1YnNjcmlwdGlvblNvcnREZXNjZW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNDdXJyZW50RmVlZGJhY2tTb3J0RGVzY2VuZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmN1cnJlbnRFeHBTb3J0VHlwZSA9IChFWFBMT1JBVElPTlNfU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUy5MQVNUX1BMQVlFRC5rZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jdXJyZW50U3Vic2NyaWJlcnNTb3J0VHlwZSA9IChTVUJTQ1JJUFRJT05fU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUy5VU0VSTkFNRS5rZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jdXJyZW50RmVlZGJhY2tUaHJlYWRzU29ydFR5cGUgPSAoRkVFREJBQ0tfVEhSRUFEU19TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTLkxBU1RfVVBEQVRFRC5rZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdGFydEluY29tcGxldGVFeHBJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN0YXJ0Q29tcGxldGVkRXhwSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdGFydEluY29tcGxldGVDb2xsZWN0aW9uSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdGFydENvbXBsZXRlZENvbGxlY3Rpb25JbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbXBsZXRlZEV4cGxvcmF0aW9uc0xpc3QgPSAocmVzcG9uc2VEYXRhLmNvbXBsZXRlZF9leHBsb3JhdGlvbnNfbGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbXBsZXRlZENvbGxlY3Rpb25zTGlzdCA9IChyZXNwb25zZURhdGEuY29tcGxldGVkX2NvbGxlY3Rpb25zX2xpc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pbmNvbXBsZXRlRXhwbG9yYXRpb25zTGlzdCA9IChyZXNwb25zZURhdGEuaW5jb21wbGV0ZV9leHBsb3JhdGlvbnNfbGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmluY29tcGxldGVDb2xsZWN0aW9uc0xpc3QgPSAocmVzcG9uc2VEYXRhLmluY29tcGxldGVfY29sbGVjdGlvbnNfbGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN1YnNjcmlwdGlvbnNMaXN0ID0gKHJlc3BvbnNlRGF0YS5zdWJzY3JpcHRpb25fbGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm51bWJlck5vbmV4aXN0ZW50SW5jb21wbGV0ZUV4cGxvcmF0aW9ucyA9IChyZXNwb25zZURhdGEubnVtYmVyX29mX25vbmV4aXN0ZW50X2FjdGl2aXRpZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaW5jb21wbGV0ZV9leHBsb3JhdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5udW1iZXJOb25leGlzdGVudEluY29tcGxldGVDb2xsZWN0aW9ucyA9IChyZXNwb25zZURhdGEubnVtYmVyX29mX25vbmV4aXN0ZW50X2FjdGl2aXRpZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaW5jb21wbGV0ZV9jb2xsZWN0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm51bWJlck5vbmV4aXN0ZW50Q29tcGxldGVkRXhwbG9yYXRpb25zID0gKHJlc3BvbnNlRGF0YS5udW1iZXJfb2Zfbm9uZXhpc3RlbnRfYWN0aXZpdGllc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jb21wbGV0ZWRfZXhwbG9yYXRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubnVtYmVyTm9uZXhpc3RlbnRDb21wbGV0ZWRDb2xsZWN0aW9ucyA9IChyZXNwb25zZURhdGEubnVtYmVyX29mX25vbmV4aXN0ZW50X2FjdGl2aXRpZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY29tcGxldGVkX2NvbGxlY3Rpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubnVtYmVyTm9uZXhpc3RlbnRFeHBsb3JhdGlvbnNGcm9tUGxheWxpc3QgPSAocmVzcG9uc2VEYXRhLm51bWJlcl9vZl9ub25leGlzdGVudF9hY3Rpdml0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmV4cGxvcmF0aW9uX3BsYXlsaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubnVtYmVyTm9uZXhpc3RlbnRDb2xsZWN0aW9uc0Zyb21QbGF5bGlzdCA9IChyZXNwb25zZURhdGEubnVtYmVyX29mX25vbmV4aXN0ZW50X2FjdGl2aXRpZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY29sbGVjdGlvbl9wbGF5bGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbXBsZXRlZFRvSW5jb21wbGV0ZUNvbGxlY3Rpb25zID0gKHJlc3BvbnNlRGF0YS5jb21wbGV0ZWRfdG9faW5jb21wbGV0ZV9jb2xsZWN0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhyZWFkU3VtbWFyeURpY3RzID0gcmVzcG9uc2VEYXRhLnRocmVhZF9zdW1tYXJpZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnRocmVhZFN1bW1hcmllcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRocmVhZFN1bW1hcnlEaWN0cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnRocmVhZFN1bW1hcmllcy5wdXNoKEZlZWRiYWNrVGhyZWFkU3VtbWFyeU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHRocmVhZFN1bW1hcnlEaWN0c1tpbmRleF0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubnVtYmVyT2ZVbnJlYWRUaHJlYWRzID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZURhdGEubnVtYmVyX29mX3VucmVhZF90aHJlYWRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5leHBsb3JhdGlvblBsYXlsaXN0ID0gcmVzcG9uc2VEYXRhLmV4cGxvcmF0aW9uX3BsYXlsaXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2xsZWN0aW9uUGxheWxpc3QgPSByZXNwb25zZURhdGEuY29sbGVjdGlvbl9wbGF5bGlzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuYWN0aXZlU2VjdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUy5JTkNPTVBMRVRFO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVTdWJzZWN0aW9uID0gKExFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMuRVhQTE9SQVRJT05TKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZmVlZGJhY2tUaHJlYWRBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubm9FeHBsb3JhdGlvbkFjdGl2aXR5ID0gKChjdHJsLmNvbXBsZXRlZEV4cGxvcmF0aW9uc0xpc3QubGVuZ3RoID09PSAwKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjdHJsLmluY29tcGxldGVFeHBsb3JhdGlvbnNMaXN0Lmxlbmd0aCA9PT0gMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5ub0NvbGxlY3Rpb25BY3Rpdml0eSA9ICgoY3RybC5jb21wbGV0ZWRDb2xsZWN0aW9uc0xpc3QubGVuZ3RoID09PSAwKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjdHJsLmluY29tcGxldGVDb2xsZWN0aW9uc0xpc3QubGVuZ3RoID09PSAwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm5vQWN0aXZpdHkgPSAoKGN0cmwubm9FeHBsb3JhdGlvbkFjdGl2aXR5KSAmJiAoY3RybC5ub0NvbGxlY3Rpb25BY3Rpdml0eSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY3RybC5leHBsb3JhdGlvblBsYXlsaXN0Lmxlbmd0aCA9PT0gMCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY3RybC5jb2xsZWN0aW9uUGxheWxpc3QubGVuZ3RoID09PSAwKSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoRkFUQUxfRVJST1JfQ09ERVMuaW5kZXhPZihlcnJvclJlc3BvbnNlLnN0YXR1cykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdGYWlsZWQgdG8gZ2V0IGxlYXJuZXIgZGFzaGJvYXJkIGRhdGEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRxLmFsbChbdXNlckluZm9Qcm9taXNlLCBkYXNoYm9hcmREYXRhUHJvbWlzZV0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5sb2FkaW5nRmVlZGJhY2tzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aHJlYWRJbmRleCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubmV3TWVzc2FnZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICcnXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0TGFiZWxDbGFzcyA9IFRocmVhZFN0YXR1c0Rpc3BsYXlTZXJ2aWNlLmdldExhYmVsQ2xhc3M7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0SHVtYW5SZWFkYWJsZVN0YXR1cyA9IChUaHJlYWRTdGF0dXNEaXNwbGF5U2VydmljZS5nZXRIdW1hblJlYWRhYmxlU3RhdHVzKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRMb2NhbGVBYmJyZXZpYXRlZERhdGV0aW1lU3RyaW5nID0gKERhdGVUaW1lRm9ybWF0U2VydmljZS5nZXRMb2NhbGVBYmJyZXZpYXRlZERhdGV0aW1lU3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRBY3RpdmVTZWN0aW9uID0gZnVuY3Rpb24gKG5ld0FjdGl2ZVNlY3Rpb25OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2ZVNlY3Rpb24gPSBuZXdBY3RpdmVTZWN0aW9uTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLmFjdGl2ZVNlY3Rpb24gPT09XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUy5GRUVEQkFDSyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZmVlZGJhY2tUaHJlYWRBY3RpdmUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmZlZWRiYWNrVGhyZWFkQWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0QWN0aXZlU3Vic2VjdGlvbiA9IGZ1bmN0aW9uIChuZXdBY3RpdmVTdWJzZWN0aW9uTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVTdWJzZWN0aW9uID0gbmV3QWN0aXZlU3Vic2VjdGlvbk5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0RXhwbG9yYXRpb25VcmwgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcvZXhwbG9yZS8nICsgZXhwbG9yYXRpb25JZDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRDb2xsZWN0aW9uVXJsID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcvY29sbGVjdGlvbi8nICsgY29sbGVjdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNoZWNrTW9iaWxlVmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoJHdpbmRvdy5pbm5lcldpZHRoIDwgNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRWaXNpYmxlRXhwbG9yYXRpb25MaXN0ID0gZnVuY3Rpb24gKHN0YXJ0Q29tcGxldGVkRXhwSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHJsLmNvbXBsZXRlZEV4cGxvcmF0aW9uc0xpc3Quc2xpY2Uoc3RhcnRDb21wbGV0ZWRFeHBJbmRleCwgTWF0aC5taW4oc3RhcnRDb21wbGV0ZWRFeHBJbmRleCArIGN0cmwuUEFHRV9TSVpFLCBjdHJsLmNvbXBsZXRlZEV4cGxvcmF0aW9uc0xpc3QubGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd1VzZXJuYW1lUG9wb3ZlciA9IGZ1bmN0aW9uIChzdWJzY3JpYmVyVXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBwb3BvdmVyIG9uIHRoZSBzdWJzY3JpcHRpb24gY2FyZCBpcyBvbmx5IHNob3duIGlmIHRoZSBsZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIHRoZSBzdWJzY3JpYmVyIHVzZXJuYW1lIGlzIGdyZWF0ZXIgdGhhbiAxMCBhbmQgdGhlIHVzZXIgaG92ZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvdmVyIHRoZSB0cnVuY2F0ZWQgdXNlcm5hbWUuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaWJlclVzZXJuYW1lLmxlbmd0aCA+IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdtb3VzZWVudGVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ29Ub1ByZXZpb3VzUGFnZSA9IGZ1bmN0aW9uIChzZWN0aW9uLCBzdWJzZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VjdGlvbiA9PT0gTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUy5JTkNPTVBMRVRFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnNlY3Rpb24gPT09IChMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTLkVYUExPUkFUSU9OUykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdGFydEluY29tcGxldGVFeHBJbmRleCA9IE1hdGgubWF4KGN0cmwuc3RhcnRJbmNvbXBsZXRlRXhwSW5kZXggLSBjdHJsLlBBR0VfU0laRSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN1YnNlY3Rpb24gPT09IChMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTLkNPTExFQ1RJT05TKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN0YXJ0SW5jb21wbGV0ZUNvbGxlY3Rpb25JbmRleCA9IE1hdGgubWF4KGN0cmwuc3RhcnRJbmNvbXBsZXRlQ29sbGVjdGlvbkluZGV4IC0gY3RybC5QQUdFX1NJWkUsIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlY3Rpb24gPT09IExFQVJORVJfREFTSEJPQVJEX1NFQ1RJT05fSTE4Tl9JRFMuQ09NUExFVEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnNlY3Rpb24gPT09IChMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTLkVYUExPUkFUSU9OUykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdGFydENvbXBsZXRlZEV4cEluZGV4ID0gTWF0aC5tYXgoY3RybC5zdGFydENvbXBsZXRlZEV4cEluZGV4IC0gY3RybC5QQUdFX1NJWkUsIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdWJzZWN0aW9uID09PSAoTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUy5DT0xMRUNUSU9OUykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdGFydENvbXBsZXRlZENvbGxlY3Rpb25JbmRleCA9IE1hdGgubWF4KGN0cmwuc3RhcnRDb21wbGV0ZWRDb2xsZWN0aW9uSW5kZXggLSBjdHJsLlBBR0VfU0laRSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdvVG9OZXh0UGFnZSA9IGZ1bmN0aW9uIChzZWN0aW9uLCBzdWJzZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VjdGlvbiA9PT0gTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUy5JTkNPTVBMRVRFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnNlY3Rpb24gPT09IChMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTLkVYUExPUkFUSU9OUykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwuc3RhcnRJbmNvbXBsZXRlRXhwSW5kZXggK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5QQUdFX1NJWkUgPD0gY3RybC5pbmNvbXBsZXRlRXhwbG9yYXRpb25zTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc3RhcnRJbmNvbXBsZXRlRXhwSW5kZXggKz0gY3RybC5QQUdFX1NJWkU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3Vic2VjdGlvbiA9PT0gKExFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMuQ09MTEVDVElPTlMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLnN0YXJ0SW5jb21wbGV0ZUNvbGxlY3Rpb25JbmRleCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLlBBR0VfU0laRSA8PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdGFydEluY29tcGxldGVDb2xsZWN0aW9uSW5kZXgubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN0YXJ0SW5jb21wbGV0ZUNvbGxlY3Rpb25JbmRleCArPSBjdHJsLlBBR0VfU0laRTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlY3Rpb24gPT09IExFQVJORVJfREFTSEJPQVJEX1NFQ1RJT05fSTE4Tl9JRFMuQ09NUExFVEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnNlY3Rpb24gPT09IChMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTLkVYUExPUkFUSU9OUykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwuc3RhcnRDb21wbGV0ZWRFeHBJbmRleCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLlBBR0VfU0laRSA8PSBjdHJsLmNvbXBsZXRlZEV4cGxvcmF0aW9uc0xpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN0YXJ0Q29tcGxldGVkRXhwSW5kZXggKz0gY3RybC5QQUdFX1NJWkU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3Vic2VjdGlvbiA9PT0gKExFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMuQ09MTEVDVElPTlMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLnN0YXJ0Q29tcGxldGVkQ29sbGVjdGlvbkluZGV4ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuUEFHRV9TSVpFIDw9IGN0cmwuc3RhcnRDb21wbGV0ZWRDb2xsZWN0aW9uSW5kZXgubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN0YXJ0Q29tcGxldGVkQ29sbGVjdGlvbkluZGV4ICs9IGN0cmwuUEFHRV9TSVpFO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNldEV4cGxvcmF0aW9uc1NvcnRpbmdPcHRpb25zID0gZnVuY3Rpb24gKHNvcnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc29ydFR5cGUgPT09IGN0cmwuY3VycmVudEV4cFNvcnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc0N1cnJlbnRFeHBTb3J0RGVzY2VuZGluZyA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFjdHJsLmlzQ3VycmVudEV4cFNvcnREZXNjZW5kaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jdXJyZW50RXhwU29ydFR5cGUgPSBzb3J0VHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRTdWJzY3JpcHRpb25Tb3J0aW5nT3B0aW9ucyA9IGZ1bmN0aW9uIChzb3J0VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvcnRUeXBlID09PSBjdHJsLmN1cnJlbnRTdWJzY3JpcHRpb25Tb3J0VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNDdXJyZW50U3Vic2NyaXB0aW9uU29ydERlc2NlbmRpbmcgPSAoIWN0cmwuaXNDdXJyZW50U3Vic2NyaXB0aW9uU29ydERlc2NlbmRpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jdXJyZW50U3Vic2NyaXB0aW9uU29ydFR5cGUgPSBzb3J0VHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRGZWVkYmFja1NvcnRpbmdPcHRpb25zID0gZnVuY3Rpb24gKHNvcnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc29ydFR5cGUgPT09IGN0cmwuY3VycmVudEZlZWRiYWNrVGhyZWFkc1NvcnRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc0N1cnJlbnRGZWVkYmFja1NvcnREZXNjZW5kaW5nID0gKCFjdHJsLmlzQ3VycmVudEZlZWRiYWNrU29ydERlc2NlbmRpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jdXJyZW50RmVlZGJhY2tUaHJlYWRzU29ydFR5cGUgPSBzb3J0VHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRWYWx1ZU9mRXhwbG9yYXRpb25Tb3J0S2V5ID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHBhc3NlZCBhcyBhIGN1c3RvbSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBgb3JkZXJCeWAsIHNvIHRoYXQgc3BlY2lhbCBjYXNlcyBjYW4gYmUgaGFuZGxlZCB3aGlsZSBzb3J0aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBleHBsb3JhdGlvbnMuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5jdXJyZW50RXhwU29ydFR5cGUgPT09XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRVhQTE9SQVRJT05TX1NPUlRfQllfS0VZU19BTkRfSTE4Tl9JRFMuTEFTVF9QTEFZRUQua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhwbG9yYXRpb25bY3RybC5jdXJyZW50RXhwU29ydFR5cGVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFZhbHVlT2ZTdWJzY3JpcHRpb25Tb3J0S2V5ID0gZnVuY3Rpb24gKHN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBwYXNzZWQgYXMgYSBjdXN0b20gY29tcGFyYXRvciBmdW5jdGlvbiB0b1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYG9yZGVyQnlgLCBzbyB0aGF0IHNwZWNpYWwgY2FzZXMgY2FuIGJlIGhhbmRsZWQgd2hpbGUgc29ydGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3Vic2NyaXB0aW9ucy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHN1YnNjcmlwdGlvbltjdHJsLmN1cnJlbnRTdWJzY3JpYmVyc1NvcnRUeXBlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLmN1cnJlbnRTdWJzY3JpYmVyc1NvcnRUeXBlID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNVQlNDUklQVElPTl9TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTLklNUEFDVC5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICh2YWx1ZSB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zb3J0RmVlZGJhY2tUaHJlYWRzRnVuY3Rpb24gPSBmdW5jdGlvbiAoZmVlZGJhY2tUaHJlYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmZWVkYmFja1RocmVhZFtjdHJsLmN1cnJlbnRGZWVkYmFja1RocmVhZHNTb3J0VHlwZV07XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBnZXRQbGF5bGlzdFNvcnRhYmxlT3B0aW9ucyA9IGZ1bmN0aW9uIChhY3Rpdml0eVR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3VpLWZsb2F0aW5nJzogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoZSwgdWkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdWkucGxhY2Vob2xkZXIuaGVpZ2h0KHVpLml0ZW0uaGVpZ2h0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0OiBmdW5jdGlvbiAoZSwgdWkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUgcXVvdGUtcHJvcHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFraW5nIHRvcCA6IDBweCB0byBhdm9pZCBpcnJlZ3VsYXIgY2hhbmdlIGluIHBvc2l0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1aS5oZWxwZXIuY3NzKHsgJ3RvcCc6ICcwIHB4JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBxdW90ZS1wcm9wcyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlOiBmdW5jdGlvbiAoZSwgdWkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluc2VydEV4cEluTGVhcm5lclBsYXlsaXN0VXJsID0gKFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKCgnL2xlYXJuZXJwbGF5bGlzdGFjdGl2aXR5aGFuZGxlci88YWN0aXZpdHlUeXBlPi8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8YWN0aXZpdHlJZD4nKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlUeXBlOiBhY3Rpdml0eVR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eUlkOiAoY3RybC5leHBsb3JhdGlvblBsYXlsaXN0W3VpLml0ZW0uc29ydGFibGUuaW5kZXhdLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoaW5zZXJ0RXhwSW5MZWFybmVyUGxheWxpc3RVcmwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiB1aS5pdGVtLnNvcnRhYmxlLmRyb3BpbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RvcDogZnVuY3Rpb24gKGUsIHVpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF4aXM6ICd5J1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jb2xsZWN0aW9uUGxheWxpc3RTb3J0YWJsZU9wdGlvbnMgPSBnZXRQbGF5bGlzdFNvcnRhYmxlT3B0aW9ucyhBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cGxvcmF0aW9uUGxheWxpc3RTb3J0YWJsZU9wdGlvbnMgPSBnZXRQbGF5bGlzdFNvcnRhYmxlT3B0aW9ucyhBQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbkNsaWNrVGhyZWFkID0gZnVuY3Rpb24gKHRocmVhZFN0YXR1cywgZXhwbG9yYXRpb25JZCwgdGhyZWFkSWQsIGV4cGxvcmF0aW9uVGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubG9hZGluZ0ZlZWRiYWNrcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhyZWFkRGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKCcvbGVhcm5lcmRhc2hib2FyZHRocmVhZGhhbmRsZXIvPHRocmVhZElkPicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJlYWRJZDogdGhyZWFkSWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5leHBsb3JhdGlvblRpdGxlID0gZXhwbG9yYXRpb25UaXRsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZmVlZGJhY2tUaHJlYWRBY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC50aHJlYWRTdGF0dXMgPSB0aHJlYWRTdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cGxvcmF0aW9uSWQgPSBleHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC50aHJlYWRJZCA9IHRocmVhZElkO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGN0cmwudGhyZWFkU3VtbWFyaWVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLnRocmVhZFN1bW1hcmllc1tpbmRleF0udGhyZWFkSWQgPT09IHRocmVhZElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocmVhZEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aHJlYWRTdW1tYXJ5ID0gY3RybC50aHJlYWRTdW1tYXJpZXNbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJlYWRTdW1tYXJ5Lm1hcmtUaGVMYXN0VHdvTWVzc2FnZXNBc1JlYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aHJlYWRTdW1tYXJ5Lmxhc3RNZXNzYWdlUmVhZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5udW1iZXJPZlVucmVhZFRocmVhZHMgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLmdldCh0aHJlYWREYXRhVXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlU3VtbWFyeURpY3RzID0gcmVzcG9uc2UuZGF0YS5tZXNzYWdlX3N1bW1hcnlfbGlzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm1lc3NhZ2VTdW1tYXJpZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCBtZXNzYWdlU3VtbWFyeURpY3RzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm1lc3NhZ2VTdW1tYXJpZXMucHVzaChGZWVkYmFja01lc3NhZ2VTdW1tYXJ5T2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QobWVzc2FnZVN1bW1hcnlEaWN0c1tpbmRleF0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5sb2FkaW5nRmVlZGJhY2tzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zaG93QWxsVGhyZWFkcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZmVlZGJhY2tUaHJlYWRBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocmVhZEluZGV4ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5hZGROZXdNZXNzYWdlID0gZnVuY3Rpb24gKHRocmVhZElkLCBuZXdNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoJy90aHJlYWRoYW5kbGVyLzx0aHJlYWRJZD4nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyZWFkSWQ6IHRocmVhZElkXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWRfc3RhdHVzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZWRfc3ViamVjdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBuZXdNZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5tZXNzYWdlU2VuZGluZ0luUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdCh1cmwsIHBheWxvYWQpLnN1Y2Nlc3MoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGhyZWFkU3VtbWFyeSA9IGN0cmwudGhyZWFkU3VtbWFyaWVzW3RocmVhZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnRocmVhZFN1bW1hcnkuYXBwZW5kTmV3TWVzc2FnZShuZXdNZXNzYWdlLCBjdHJsLnVzZXJuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm1lc3NhZ2VTZW5kaW5nSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubmV3TWVzc2FnZS50ZXh0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3TWVzc2FnZVN1bW1hcnkgPSAoRmVlZGJhY2tNZXNzYWdlU3VtbWFyeU9iamVjdEZhY3RvcnkuY3JlYXRlTmV3TWVzc2FnZShjdHJsLnRocmVhZFN1bW1hcnkudG90YWxNZXNzYWdlQ291bnQsIG5ld01lc3NhZ2UsIGN0cmwudXNlcm5hbWUsIGN0cmwucHJvZmlsZVBpY3R1cmVEYXRhVXJsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5tZXNzYWdlU3VtbWFyaWVzLnB1c2gobmV3TWVzc2FnZVN1bW1hcnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd1N1Z2dlc3Rpb25Nb2RhbCA9IGZ1bmN0aW9uIChuZXdDb250ZW50LCBvbGRDb250ZW50LCBkZXNjcmlwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgU3VnZ2VzdGlvbk1vZGFsRm9yTGVhcm5lckRhc2hib2FyZFNlcnZpY2Uuc2hvd1N1Z2dlc3Rpb25Nb2RhbCgnZWRpdF9leHBsb3JhdGlvbl9zdGF0ZV9jb250ZW50Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0NvbnRlbnQ6IG5ld0NvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkQ29udGVudDogb2xkQ29udGVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9wZW5SZW1vdmVBY3Rpdml0eU1vZGFsID0gZnVuY3Rpb24gKHNlY3Rpb25OYW1lSTE4bklkLCBzdWJzZWN0aW9uTmFtZSwgYWN0aXZpdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9sZWFybmVyLWRhc2hib2FyZC1wYWdlL21vZGFsLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3JlbW92ZS1hY3Rpdml0eS1mcm9tLWxlYXJuZXItZGFzaGJvYXJkLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY3Rpb25OYW1lSTE4bklkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VjdGlvbk5hbWVJMThuSWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNlY3Rpb25OYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2VjdGlvbk5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWN0aXZpdHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsICckaHR0cCcsICdzZWN0aW9uTmFtZUkxOG5JZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzdWJzZWN0aW9uTmFtZScsICdBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlLCAkaHR0cCwgc2VjdGlvbk5hbWVJMThuSWQsIHN1YnNlY3Rpb25OYW1lLCBBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04sIEFDVElWSVRZX1RZUEVfRVhQTE9SQVRJT04pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWN0aW9uTmFtZUkxOG5JZCA9IHNlY3Rpb25OYW1lSTE4bklkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN1YnNlY3Rpb25OYW1lID0gc3Vic2VjdGlvbk5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWN0aXZpdHlUaXRsZSA9IGFjdGl2aXR5LnRpdGxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aXZpdHlUeXBlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnNlY3Rpb25OYW1lID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTLkVYUExPUkFUSU9OUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eVR5cGUgPSBBQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdWJzZWN0aW9uTmFtZSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEU1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLkNPTExFQ1RJT05TKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5VHlwZSA9IEFDVElWSVRZX1RZUEVfQ09MTEVDVElPTjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU3Vic2VjdGlvbiBuYW1lIGlzIG5vdCB2YWxpZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlbW92ZUFjdGl2aXR5VXJsUHJlZml4ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlY3Rpb25OYW1lSTE4bklkID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMRUFSTkVSX0RBU0hCT0FSRF9TRUNUSU9OX0kxOE5fSURTLlBMQVlMSVNUKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUFjdGl2aXR5VXJsUHJlZml4ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcvbGVhcm5lcnBsYXlsaXN0YWN0aXZpdHloYW5kbGVyLyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlY3Rpb25OYW1lSTE4bklkID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMRUFSTkVSX0RBU0hCT0FSRF9TRUNUSU9OX0kxOE5fSURTLklOQ09NUExFVEUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWN0aXZpdHlVcmxQcmVmaXggPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJy9sZWFybmVyaW5jb21wbGV0ZWFjdGl2aXR5aGFuZGxlci8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZWN0aW9uIG5hbWUgaXMgbm90IHZhbGlkLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVtb3ZlQWN0aXZpdHlVcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwocmVtb3ZlQWN0aXZpdHlVcmxQcmVmaXggK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGFjdGl2aXR5VHlwZT4vPGFjdGl2aXR5SWQ+Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eVR5cGU6IGFjdGl2aXR5VHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlJZDogYWN0aXZpdHkuaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHBbJ2RlbGV0ZSddKHJlbW92ZUFjdGl2aXR5VXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkucmVzdWx0LnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWN0aW9uTmFtZUkxOG5JZCA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUy5JTkNPTVBMRVRFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWJzZWN0aW9uTmFtZSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMuRVhQTE9SQVRJT05TKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBjdHJsLmluY29tcGxldGVFeHBsb3JhdGlvbnNMaXN0LmluZGV4T2YoYWN0aXZpdHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaW5jb21wbGV0ZUV4cGxvcmF0aW9uc0xpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdWJzZWN0aW9uTmFtZSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExFQVJORVJfREFTSEJPQVJEX1NVQlNFQ1RJT05fSTE4Tl9JRFMuQ09MTEVDVElPTlMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGN0cmwuaW5jb21wbGV0ZUNvbGxlY3Rpb25zTGlzdC5pbmRleE9mKGFjdGl2aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmluY29tcGxldGVDb2xsZWN0aW9uc0xpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzZWN0aW9uTmFtZUkxOG5JZCA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUy5QTEFZTElTVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Vic2VjdGlvbk5hbWUgPT09XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMRUFSTkVSX0RBU0hCT0FSRF9TVUJTRUNUSU9OX0kxOE5fSURTLkVYUExPUkFUSU9OUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gY3RybC5leHBsb3JhdGlvblBsYXlsaXN0LmluZGV4T2YoYWN0aXZpdHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZXhwbG9yYXRpb25QbGF5bGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN1YnNlY3Rpb25OYW1lID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUy5DT0xMRUNUSU9OUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gY3RybC5jb2xsZWN0aW9uUGxheWxpc3QuaW5kZXhPZihhY3Rpdml0eSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2xsZWN0aW9uUGxheWxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKS5hbmltYXRpb24oJy5tZW51LXN1Yi1zZWN0aW9uJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciBOR19ISURFX0NMQVNTID0gJ25nLWhpZGUnO1xuICAgIHJldHVybiB7XG4gICAgICAgIGJlZm9yZUFkZENsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lLCBkb25lKSB7XG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09PSBOR19ISURFX0NMQVNTKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zbGlkZVVwKGRvbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZW1vdmVDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSwgZG9uZSkge1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PT0gTkdfSElERV9DTEFTUykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuaGlkZSgpLnNsaWRlRG93bihkb25lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgbGVhcm5lciBkYXNoYm9hcmQgcGFnZS5cbiAqL1xucmVxdWlyZShcImNvcmUtanMvZXM3L3JlZmxlY3RcIik7XG5yZXF1aXJlKFwiem9uZS5qc1wiKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBwbGF0Zm9ybV9icm93c2VyXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3NlclwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBodHRwXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29tbW9uL2h0dHBcIik7XG4vLyBUaGlzIGNvbXBvbmVudCBpcyBuZWVkZWQgdG8gZm9yY2UtYm9vdHN0cmFwIEFuZ3VsYXIgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGVcbi8vIGFwcC5cbnZhciBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQoKSB7XG4gICAgfVxuICAgIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkNvbXBvbmVudCh7XG4gICAgICAgICAgICBzZWxlY3RvcjogJ3NlcnZpY2UtYm9vdHN0cmFwJyxcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnJ1xuICAgICAgICB9KVxuICAgIF0sIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQpO1xuICAgIHJldHVybiBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50O1xufSgpKTtcbmV4cG9ydHMuU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQ7XG52YXIgYXBwX2NvbnN0YW50c18xID0gcmVxdWlyZShcImFwcC5jb25zdGFudHNcIik7XG52YXIgY29sbGVjdGlvbl9zdW1tYXJ5X3RpbGVfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuY29uc3RhbnRzXCIpO1xudmFyIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzXCIpO1xudmFyIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50c1wiKTtcbnZhciBzZXJ2aWNlc19jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJzZXJ2aWNlcy9zZXJ2aWNlcy5jb25zdGFudHNcIik7XG52YXIgbGVhcm5lcl9kYXNoYm9hcmRfcGFnZV9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJwYWdlcy9sZWFybmVyLWRhc2hib2FyZC1wYWdlL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UuY29uc3RhbnRzXCIpO1xudmFyIExlYXJuZXJEYXNoYm9hcmRQYWdlTW9kdWxlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExlYXJuZXJEYXNoYm9hcmRQYWdlTW9kdWxlKCkge1xuICAgIH1cbiAgICAvLyBFbXB0eSBwbGFjZWhvbGRlciBtZXRob2QgdG8gc2F0aXNmeSB0aGUgYENvbXBpbGVyYC5cbiAgICBMZWFybmVyRGFzaGJvYXJkUGFnZU1vZHVsZS5wcm90b3R5cGUubmdEb0Jvb3RzdHJhcCA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICBMZWFybmVyRGFzaGJvYXJkUGFnZU1vZHVsZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuTmdNb2R1bGUoe1xuICAgICAgICAgICAgaW1wb3J0czogW1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtX2Jyb3dzZXJfMS5Ccm93c2VyTW9kdWxlLFxuICAgICAgICAgICAgICAgIGh0dHBfMS5IdHRwQ2xpZW50TW9kdWxlXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZGVjbGFyYXRpb25zOiBbXG4gICAgICAgICAgICAgICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGVudHJ5Q29tcG9uZW50czogW1xuICAgICAgICAgICAgICAgIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgICAgICAgICBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25fc3VtbWFyeV90aWxlX2NvbnN0YW50c18xLkNvbGxlY3Rpb25TdW1tYXJ5VGlsZUNvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbnNfZXh0ZW5zaW9uX2NvbnN0YW50c18xLkludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgb2JqZWN0c19kb21haW5fY29uc3RhbnRzXzEuT2JqZWN0c0RvbWFpbkNvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlc19jb25zdGFudHNfMS5TZXJ2aWNlc0NvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBsZWFybmVyX2Rhc2hib2FyZF9wYWdlX2NvbnN0YW50c18xLkxlYXJuZXJEYXNoYm9hcmRQYWdlQ29uc3RhbnRzXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pXG4gICAgXSwgTGVhcm5lckRhc2hib2FyZFBhZ2VNb2R1bGUpO1xuICAgIHJldHVybiBMZWFybmVyRGFzaGJvYXJkUGFnZU1vZHVsZTtcbn0oKSk7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl9keW5hbWljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljXCIpO1xudmFyIHN0YXRpY18yID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGJvb3RzdHJhcEZuID0gZnVuY3Rpb24gKGV4dHJhUHJvdmlkZXJzKSB7XG4gICAgdmFyIHBsYXRmb3JtUmVmID0gcGxhdGZvcm1fYnJvd3Nlcl9keW5hbWljXzEucGxhdGZvcm1Ccm93c2VyRHluYW1pYyhleHRyYVByb3ZpZGVycyk7XG4gICAgcmV0dXJuIHBsYXRmb3JtUmVmLmJvb3RzdHJhcE1vZHVsZShMZWFybmVyRGFzaGJvYXJkUGFnZU1vZHVsZSk7XG59O1xudmFyIGRvd25ncmFkZWRNb2R1bGUgPSBzdGF0aWNfMi5kb3duZ3JhZGVNb2R1bGUoYm9vdHN0cmFwRm4pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJywgW1xuICAgICdkbmRMaXN0cycsICdoZWFkcm9vbScsICdpbmZpbml0ZS1zY3JvbGwnLCAnbmdBbmltYXRlJyxcbiAgICAnbmdBdWRpbycsICduZ0Nvb2tpZXMnLCAnbmdJbWdDcm9wJywgJ25nSm95UmlkZScsICduZ01hdGVyaWFsJyxcbiAgICAnbmdSZXNvdXJjZScsICduZ1Nhbml0aXplJywgJ25nVG91Y2gnLCAncGFzY2FscHJlY2h0LnRyYW5zbGF0ZScsXG4gICAgJ3RvYXN0cicsICd1aS5ib290c3RyYXAnLCAndWkuc29ydGFibGUnLCAndWkudHJlZScsICd1aS52YWxpZGF0ZScsXG4gICAgZG93bmdyYWRlZE1vZHVsZVxuXSlcbiAgICAvLyBUaGlzIGRpcmVjdGl2ZSBpcyB0aGUgZG93bmdyYWRlZCB2ZXJzaW9uIG9mIHRoZSBBbmd1bGFyIGNvbXBvbmVudCB0b1xuICAgIC8vIGJvb3RzdHJhcCB0aGUgQW5ndWxhciA4LlxuICAgIC5kaXJlY3RpdmUoJ3NlcnZpY2VCb290c3RyYXAnLCBzdGF0aWNfMS5kb3duZ3JhZGVDb21wb25lbnQoe1xuICAgIGNvbXBvbmVudDogU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxufSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTY3JpcHRzIGZvciB0aGUgbGVhcm5lciBkYXNoYm9hcmQgcGFnZS5cbiAqL1xuLy8gVGhlIG1vZHVsZSBuZWVkcyB0byBiZSBsb2FkZWQgYmVmb3JlIGV2ZXJ5dGhpbmcgZWxzZSBzaW5jZSBpdCBkZWZpbmVzIHRoZVxuLy8gbWFpbiBtb2R1bGUgdGhlIGVsZW1lbnRzIGFyZSBhdHRhY2hlZCB0by5cbnJlcXVpcmUoJ3BhZ2VzL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ0FwcC50cycpO1xucmVxdWlyZSgnYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9sZWFybmVyLWRhc2hib2FyZC1wYWdlL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UuY29udHJvbGxlci50cycpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGRpc3BsYXkgc3VnZ2VzdGlvbiBtb2RhbCBpbiBsZWFybmVyIHZpZXcuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1N1Z2dlc3Rpb25Nb2RhbFNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1N1Z2dlc3Rpb25Nb2RhbEZvckxlYXJuZXJEYXNoYm9hcmRTZXJ2aWNlJywgW1xuICAgICckdWliTW9kYWwnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkdWliTW9kYWwsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHZhciBfdGVtcGxhdGVVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2Uvc3VnZ2VzdGlvbi1tb2RhbC8nICtcbiAgICAgICAgICAgICdsZWFybmVyLWRhc2hib2FyZC1zdWdnZXN0aW9uLW1vZGFsLmRpcmVjdGl2ZS5odG1sJyk7XG4gICAgICAgIHZhciBfc2hvd0VkaXRTdGF0ZUNvbnRlbnRTdWdnZXN0aW9uTW9kYWwgPSBmdW5jdGlvbiAobmV3Q29udGVudCwgb2xkQ29udGVudCwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogX3RlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgICAgICAgICAgbmV3Q29udGVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ld0NvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG9sZENvbnRlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvbGRDb250ZW50O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLCAnU3VnZ2VzdGlvbk1vZGFsU2VydmljZScsXG4gICAgICAgICAgICAgICAgICAgICdkZXNjcmlwdGlvbicsICduZXdDb250ZW50JywgJ29sZENvbnRlbnQnLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSwgU3VnZ2VzdGlvbk1vZGFsU2VydmljZSwgZGVzY3JpcHRpb24sIG5ld0NvbnRlbnQsIG9sZENvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXdDb250ZW50ID0gbmV3Q29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5vbGRDb250ZW50ID0gb2xkQ29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdWdnZXN0aW9uTW9kYWxTZXJ2aWNlLmNhbmNlbFN1Z2dlc3Rpb24oJHVpYk1vZGFsSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2hvd1N1Z2dlc3Rpb25Nb2RhbDogZnVuY3Rpb24gKHN1Z2dlc3Rpb25UeXBlLCBleHRyYVBhcmFtcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWdnZXN0aW9uVHlwZSA9PT0gJ2VkaXRfZXhwbG9yYXRpb25fc3RhdGVfY29udGVudCcpIHtcbiAgICAgICAgICAgICAgICAgICAgX3Nob3dFZGl0U3RhdGVDb250ZW50U3VnZ2VzdGlvbk1vZGFsKGV4dHJhUGFyYW1zLm5ld0NvbnRlbnQsIGV4dHJhUGFyYW1zLm9sZENvbnRlbnQsIGV4dHJhUGFyYW1zLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gaGFuZGxlIGNvbW1vbiBjb2RlIGZvciBzdWdnZXN0aW9uIG1vZGFsIGRpc3BsYXkuXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBTdWdnZXN0aW9uTW9kYWxTZXJ2aWNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN1Z2dlc3Rpb25Nb2RhbFNlcnZpY2UoKSB7XG4gICAgICAgIHRoaXMuU1VHR0VTVElPTl9BQ0NFUFRFRF9NU0cgPSAoJ1RoaXMgc3VnZ2VzdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGFjY2VwdGVkLicpO1xuICAgICAgICB0aGlzLlNVR0dFU1RJT05fUkVKRUNURURfTVNHID0gKCdUaGlzIHN1Z2dlc3Rpb24gaGFzIGFscmVhZHkgYmVlbiByZWplY3RlZC4nKTtcbiAgICAgICAgdGhpcy5TVUdHRVNUSU9OX0lOVkFMSURfTVNHID0gKCdUaGlzIHN1Z2dlc3Rpb24gd2FzIG1hZGUgZm9yIGEgc3RhdGUgdGhhdCBubyBsb25nZXIgZXhpc3RzLicgK1xuICAgICAgICAgICAgJyBJdCBjYW5ub3QgYmUgYWNjZXB0ZWQuJyk7XG4gICAgICAgIHRoaXMuVU5TQVZFRF9DSEFOR0VTX01TRyA9ICgnWW91IGhhdmUgdW5zYXZlZCBjaGFuZ2VzIHRvIHRoaXMgZXhwbG9yYXRpb24uIFBsZWFzZSBzYXZlL2Rpc2NhcmQgeW91ciAnICtcbiAgICAgICAgICAgICd1bnNhdmVkIGNoYW5nZXMgaWYgeW91IHdpc2ggdG8gYWNjZXB0LicpO1xuICAgICAgICB0aGlzLkFDVElPTl9BQ0NFUFRfU1VHR0VTVElPTiA9ICdhY2NlcHQnO1xuICAgICAgICB0aGlzLkFDVElPTl9SRUpFQ1RfU1VHR0VTVElPTiA9ICdyZWplY3QnO1xuICAgICAgICB0aGlzLkFDVElPTl9SRVNVQk1JVF9TVUdHRVNUSU9OID0gJ3Jlc3VibWl0JztcbiAgICAgICAgdGhpcy5TVUdHRVNUSU9OX0FDQ0VQVEVEID0gJ2FjY2VwdGVkJztcbiAgICAgICAgdGhpcy5TVUdHRVNUSU9OX1JFSkVDVEVEID0gJ3JlamVjdGVkJztcbiAgICB9XG4gICAgLy8gVE9ETyhZYXNoSmlwa2F0ZSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgc2luY2UgJyR1aWJNb2RhbEluc3RhbmNlJyBpcyBhIEFuZ3VsYXJKUyBuYXRpdmUgb2JqZWN0IGFuZCBkb2VzIG5vdFxuICAgIC8vIGhhdmUgYSBUUyBpbnRlcmZhY2UuXG4gICAgU3VnZ2VzdGlvbk1vZGFsU2VydmljZS5wcm90b3R5cGUuYWNjZXB0U3VnZ2VzdGlvbiA9IGZ1bmN0aW9uICgkdWliTW9kYWxJbnN0YW5jZSwgcGFyYW1EaWN0KSB7XG4gICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKHBhcmFtRGljdCk7XG4gICAgfTtcbiAgICAvLyBUT0RPKFlhc2hKaXBrYXRlKTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBzaW5jZSAnJHVpYk1vZGFsSW5zdGFuY2UnIGlzIGEgQW5ndWxhckpTIG5hdGl2ZSBvYmplY3QgYW5kIGRvZXMgbm90XG4gICAgLy8gaGF2ZSBhIFRTIGludGVyZmFjZS5cbiAgICBTdWdnZXN0aW9uTW9kYWxTZXJ2aWNlLnByb3RvdHlwZS5yZWplY3RTdWdnZXN0aW9uID0gZnVuY3Rpb24gKCR1aWJNb2RhbEluc3RhbmNlLCBwYXJhbURpY3QpIHtcbiAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UocGFyYW1EaWN0KTtcbiAgICB9O1xuICAgIC8vIFRPRE8oWWFzaEppcGthdGUpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIHNpbmNlICckdWliTW9kYWxJbnN0YW5jZScgaXMgYSBBbmd1bGFySlMgbmF0aXZlIG9iamVjdCBhbmQgZG9lcyBub3RcbiAgICAvLyBoYXZlIGEgVFMgaW50ZXJmYWNlLlxuICAgIFN1Z2dlc3Rpb25Nb2RhbFNlcnZpY2UucHJvdG90eXBlLmNhbmNlbFN1Z2dlc3Rpb24gPSBmdW5jdGlvbiAoJHVpYk1vZGFsSW5zdGFuY2UpIHtcbiAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgfTtcbiAgICBTdWdnZXN0aW9uTW9kYWxTZXJ2aWNlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIFN1Z2dlc3Rpb25Nb2RhbFNlcnZpY2UpO1xuICAgIHJldHVybiBTdWdnZXN0aW9uTW9kYWxTZXJ2aWNlO1xufSgpKTtcbmV4cG9ydHMuU3VnZ2VzdGlvbk1vZGFsU2VydmljZSA9IFN1Z2dlc3Rpb25Nb2RhbFNlcnZpY2U7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdTdWdnZXN0aW9uTW9kYWxTZXJ2aWNlJywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShTdWdnZXN0aW9uTW9kYWxTZXJ2aWNlKSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgaW50ZXJhY3Rpb25zIGV4dGVuc2lvbnMuXG4gKi9cbnZhciBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMoKSB7XG4gICAgfVxuICAgIC8vIE1pbmltdW0gY29uZmlkZW5jZSByZXF1aXJlZCBmb3IgYSBwcmVkaWN0ZWQgYW5zd2VyIGdyb3VwIHRvIGJlIHNob3duIHRvXG4gICAgLy8gdXNlci4gR2VuZXJhbGx5IGEgdGhyZXNob2xkIG9mIDAuNy0wLjggaXMgYXNzdW1lZCB0byBiZSBhIGdvb2Qgb25lIGluXG4gICAgLy8gcHJhY3RpY2UsIGhvd2V2ZXIgdmFsdWUgbmVlZCBub3QgYmUgaW4gdGhvc2UgYm91bmRzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuQ09ERV9SRVBMX1BSRURJQ1RJT05fU0VSVklDRV9USFJFU0hPTEQgPSAwLjc7XG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5HUkFQSF9JTlBVVF9MRUZUX01BUkdJTiA9IDEyMDtcbiAgICAvLyBHaXZlcyB0aGUgc3RhZmYtbGluZXMgaHVtYW4gcmVhZGFibGUgdmFsdWVzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuTk9URV9OQU1FU19UT19NSURJX1ZBTFVFUyA9IHtcbiAgICAgICAgQTU6IDgxLFxuICAgICAgICBHNTogNzksXG4gICAgICAgIEY1OiA3NyxcbiAgICAgICAgRTU6IDc2LFxuICAgICAgICBENTogNzQsXG4gICAgICAgIEM1OiA3MixcbiAgICAgICAgQjQ6IDcxLFxuICAgICAgICBBNDogNjksXG4gICAgICAgIEc0OiA2NyxcbiAgICAgICAgRjQ6IDY1LFxuICAgICAgICBFNDogNjQsXG4gICAgICAgIEQ0OiA2MixcbiAgICAgICAgQzQ6IDYwXG4gICAgfTtcbiAgICAvLyBNaW5pbXVtIGNvbmZpZGVuY2UgcmVxdWlyZWQgZm9yIGEgcHJlZGljdGVkIGFuc3dlciBncm91cCB0byBiZSBzaG93biB0b1xuICAgIC8vIHVzZXIuIEdlbmVyYWxseSBhIHRocmVzaG9sZCBvZiAwLjctMC44IGlzIGFzc3VtZWQgdG8gYmUgYSBnb29kIG9uZSBpblxuICAgIC8vIHByYWN0aWNlLCBob3dldmVyIHZhbHVlIG5lZWQgbm90IGJlIGluIHRob3NlIGJvdW5kcy5cbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLlRFWFRfSU5QVVRfUFJFRElDVElPTl9TRVJWSUNFX1RIUkVTSE9MRCA9IDAuNztcbiAgICByZXR1cm4gSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLkludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMgPSBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==