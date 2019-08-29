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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/collection-player-page/collection-player-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","vendors~admin~collection_editor~collection_player~creator_dashboard~exploration_editor~exploration_p~7f8bcc67","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","collection_player~creator_dashboard~learner_dashboard~library~profile~story_viewer","collection_player~learner_dashboard~library~profile~story_viewer","collection_editor~collection_player"]);
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

/***/ "./core/templates/dev/head/components/button-directives/exploration-embed-button.service.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/exploration-embed-button.service.ts ***!
  \**************************************************************************************************/
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
angular.module('oppia').factory('ExplorationEmbedButtonService', [
    '$uibModal', 'SiteAnalyticsService', 'UrlInterpolationService',
    function ($uibModal, SiteAnalyticsService, UrlInterpolationService) {
        return {
            showModal: function (explorationId) {
                $uibModal.open({
                    backdrop: true,
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/button-directives/' +
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

/***/ "./core/templates/dev/head/components/common-layout-directives/common-elements/attribution-guide.directive.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-elements/attribution-guide.directive.ts ***!
  \********************************************************************************************************************/
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
angular.module('oppia').directive('attributionGuide', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/common-elements/' +
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

/***/ "./core/templates/dev/head/components/common-layout-directives/common-elements/sharing-links.directive.ts":
/*!****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-elements/sharing-links.directive.ts ***!
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
 * @fileoverview Directive for the Social Sharing Links.
 */
__webpack_require__(/*! components/button-directives/exploration-embed-button.service.ts */ "./core/templates/dev/head/components/button-directives/exploration-embed-button.service.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
angular.module('oppia').directive('sharingLinks', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                layoutType: '@',
                layoutAlignType: '@',
                shareType: '@',
                getExplorationId: '&explorationId',
                getCollectionId: '&collectionId'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/common-elements/' +
                'sharing-links.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$window', 'HtmlEscaperService',
                'ExplorationEmbedButtonService', 'SiteAnalyticsService',
                'DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR',
                function ($window, HtmlEscaperService, ExplorationEmbedButtonService, SiteAnalyticsService, DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR) {
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
                    ctrl.escapedTwitterText = (HtmlEscaperService.unescapedStrToEscapedStr(DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR));
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection playthrough domain objects.
 */
var cloneDeep_1 = __importDefault(__webpack_require__(/*! lodash/cloneDeep */ "./node_modules/lodash/cloneDeep.js"));
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var CollectionPlaythrough = /** @class */ (function () {
    // Stores information about a current playthrough of a collection for a
    // user.
    function CollectionPlaythrough(nextExplorationId, completedExplorationIds) {
        this._nextExplorationId = nextExplorationId;
        this._completedExplorationIds = completedExplorationIds;
    }
    // Returns the upcoming exploration ID. Changes to this are not
    // reflected in the collection.
    CollectionPlaythrough.prototype.getNextExplorationId = function () {
        return this._nextExplorationId;
    };
    CollectionPlaythrough.prototype.getNextRecommendedCollectionNodeCount = function () {
        // As the collection is linear, only a single node would be available,
        // after any node.
        return 1;
    };
    // Returns a list of explorations completed that are related to this
    // collection. Changes to this list are not reflected in this collection.
    CollectionPlaythrough.prototype.getCompletedExplorationIds = function () {
        return cloneDeep_1.default(this._completedExplorationIds);
    };
    CollectionPlaythrough.prototype.getCompletedExplorationNodeCount = function () {
        return this._completedExplorationIds.length;
    };
    CollectionPlaythrough.prototype.hasStartedCollection = function () {
        return this._completedExplorationIds.length !== 0;
    };
    // TODO(bhenning): Add setters for some of these properties. Setters allow
    // the collection editor to setup specifically configured playthrough
    // sessions of the collection player through this object (for example, the
    // editor would be able to fake which explorations were completed to see how
    // that particular configuration would look for a learner).
    CollectionPlaythrough.prototype.hasFinishedCollection = function () {
        return this._nextExplorationId === null;
    };
    return CollectionPlaythrough;
}());
exports.CollectionPlaythrough = CollectionPlaythrough;
var CollectionPlaythroughObjectFactory = /** @class */ (function () {
    function CollectionPlaythroughObjectFactory() {
    }
    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // collection playthrough python dict.
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'collectionPlaythroughBackendObject' is a dict with
    // underscore_cased keys which give tslint errors against underscore_casing
    // in favor of camelCasing.
    CollectionPlaythroughObjectFactory.prototype.createFromBackendObject = function (collectionPlaythroughBackendObject) {
        return new CollectionPlaythrough(collectionPlaythroughBackendObject.next_exploration_id, collectionPlaythroughBackendObject.completed_exploration_ids);
    };
    CollectionPlaythroughObjectFactory.prototype.create = function (nextExplorationId, completedExplorationIds) {
        return new CollectionPlaythrough(nextExplorationId, cloneDeep_1.default(completedExplorationIds));
    };
    CollectionPlaythroughObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], CollectionPlaythroughObjectFactory);
    return CollectionPlaythroughObjectFactory;
}());
exports.CollectionPlaythroughObjectFactory = CollectionPlaythroughObjectFactory;
angular.module('oppia').factory('CollectionPlaythroughObjectFactory', static_1.downgradeInjectable(CollectionPlaythroughObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/GuestCollectionProgressObjectFactory.ts":
/*!*******************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/GuestCollectionProgressObjectFactory.ts ***!
  \*******************************************************************************************/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating and mutating a domain object which
 * represents the progress of a guest playing through a collection.
 */
var cloneDeep_1 = __importDefault(__webpack_require__(/*! lodash/cloneDeep */ "./node_modules/lodash/cloneDeep.js"));
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var GuestCollectionProgress = /** @class */ (function () {
    function GuestCollectionProgress(completedExplorationsMap) {
        this._completedExplorationsMap = completedExplorationsMap;
    }
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
        return cloneDeep_1.default(this._completedExplorationsMap[collectionId]);
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
    GuestCollectionProgress.prototype.toJson = function () {
        return JSON.stringify(this._completedExplorationsMap);
    };
    return GuestCollectionProgress;
}());
exports.GuestCollectionProgress = GuestCollectionProgress;
var GuestCollectionProgressObjectFactory = /** @class */ (function () {
    function GuestCollectionProgressObjectFactory() {
    }
    // This function takes a JSON string which represents a raw collection
    // object and returns a new GuestCollectionProgress domain object. A null or
    // undefined string indicates that an empty progress object should be
    // created.
    GuestCollectionProgressObjectFactory.prototype.createFromJson = function (collectionProgressJson) {
        if (collectionProgressJson) {
            return new GuestCollectionProgress(JSON.parse(collectionProgressJson));
        }
        else {
            return new GuestCollectionProgress({});
        }
    };
    GuestCollectionProgressObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], GuestCollectionProgressObjectFactory);
    return GuestCollectionProgressObjectFactory;
}());
exports.GuestCollectionProgressObjectFactory = GuestCollectionProgressObjectFactory;
angular.module('oppia').factory('GuestCollectionProgressObjectFactory', static_1.downgradeInjectable(GuestCollectionProgressObjectFactory));


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
 * @fileoverview Service that records progress guests make during a collection
 * playthrough. Note that this service does not currently support saving a
 * user's progress when they create an account.
 */
// TODO(bhenning): Move this to a service which stores shared state across the
// frontend in a way that can be persisted in the backend upon account
// creation, such as exploration progress.
// TODO(bhenning): This should be reset upon login, otherwise the progress will
// be different depending on the user's logged in/logged out state.
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var GuestCollectionProgressObjectFactory_1 = __webpack_require__(/*! domain/collection/GuestCollectionProgressObjectFactory */ "./core/templates/dev/head/domain/collection/GuestCollectionProgressObjectFactory.ts");
var WindowRefService_1 = __webpack_require__(/*! services/contextual/WindowRefService */ "./core/templates/dev/head/services/contextual/WindowRefService.ts");
var GuestCollectionProgressService = /** @class */ (function () {
    function GuestCollectionProgressService(guestCollectionProgressObjectFactory, windowRef) {
        this.guestCollectionProgressObjectFactory = guestCollectionProgressObjectFactory;
        this.windowRef = windowRef;
        this.COLLECTION_STORAGE_KEY = 'collectionProgressStore_v1';
    }
    GuestCollectionProgressService.prototype.storeGuestCollectionProgress = function (guestCollectionProgress) {
        this.windowRef.nativeWindow.localStorage[this.COLLECTION_STORAGE_KEY] = (guestCollectionProgress.toJson());
    };
    GuestCollectionProgressService.prototype.loadGuestCollectionProgress = function () {
        return this.guestCollectionProgressObjectFactory.createFromJson(this.windowRef.nativeWindow.localStorage[this.COLLECTION_STORAGE_KEY]);
    };
    GuestCollectionProgressService.prototype.recordCompletedExploration = function (collectionId, explorationId) {
        var guestCollectionProgress = this.loadGuestCollectionProgress();
        var completedExplorationIdHasBeenAdded = (guestCollectionProgress.addCompletedExplorationId(collectionId, explorationId));
        if (completedExplorationIdHasBeenAdded) {
            this.storeGuestCollectionProgress(guestCollectionProgress);
        }
    };
    GuestCollectionProgressService.prototype.getValidCompletedExplorationIds = function (collection) {
        var collectionId = collection.getId();
        var guestCollectionProgress = this.loadGuestCollectionProgress();
        var completedExplorationIds = (guestCollectionProgress.getCompletedExplorationIds(collectionId));
        // Filter the exploration IDs by whether they are contained within the
        // specified collection structure.
        return completedExplorationIds.filter(function (expId) {
            return collection.containsCollectionNode(expId);
        });
    };
    // This method corresponds to collection_domain.get_next_exploration_id.
    GuestCollectionProgressService.prototype._getNextExplorationId = function (collection, completedIds) {
        var explorationIds = collection.getExplorationIds();
        for (var i = 0; i < explorationIds.length; i++) {
            if (completedIds.indexOf(explorationIds[i]) === -1) {
                return explorationIds[i];
            }
        }
        return null;
    };
    /**
     * Records that the specified exploration was completed in the context of
     * the specified collection, as a guest.
     */
    GuestCollectionProgressService.prototype.recordExplorationCompletedInCollection = function (collectionId, explorationId) {
        this.recordCompletedExploration(collectionId, explorationId);
    };
    /**
     * Returns whether the guest user has made any progress toward completing
     * the specified collection by completing at least one exploration related
     * to the collection. Note that this does not account for any completed
     * explorations which are no longer referenced by the collection;
     * getCompletedExplorationIds() should be used for that, instead.
     */
    GuestCollectionProgressService.prototype.hasCompletedSomeExploration = function (collectionId) {
        var guestCollectionProgress = this.loadGuestCollectionProgress();
        return guestCollectionProgress.hasCompletionProgress(collectionId);
    };
    /**
     * Given a collection object, returns the list of exploration IDs
     * completed by the guest user. The return list of exploration IDs will
     * not include any previously completed explorations for the given
     * collection that are no longer part of the collection.
     */
    GuestCollectionProgressService.prototype.getCompletedExplorationIds = function (collection) {
        return this.getValidCompletedExplorationIds(collection);
    };
    /**
     * Given a collection object a list of completed exploration IDs, returns
     * the next exploration ID the guest user can play as part of
     * completing the collection. If this method returns null, the
     * guest has completed the collection.
     */
    GuestCollectionProgressService.prototype.getNextExplorationId = function (collection, completedExplorationIds) {
        return this._getNextExplorationId(collection, completedExplorationIds);
    };
    var _a, _b;
    GuestCollectionProgressService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof GuestCollectionProgressObjectFactory_1.GuestCollectionProgressObjectFactory !== "undefined" && GuestCollectionProgressObjectFactory_1.GuestCollectionProgressObjectFactory) === "function" ? _a : Object, typeof (_b = typeof WindowRefService_1.WindowRef !== "undefined" && WindowRefService_1.WindowRef) === "function" ? _b : Object])
    ], GuestCollectionProgressService);
    return GuestCollectionProgressService;
}());
exports.GuestCollectionProgressService = GuestCollectionProgressService;
angular.module('oppia').factory('GuestCollectionProgressService', static_1.downgradeInjectable(GuestCollectionProgressService));


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
__webpack_require__(/*! components/common-layout-directives/common-elements/sharing-links.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/sharing-links.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('oppia').directive('collectionFooter', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-player-page/collection-footer/' +
                'collection-footer.directive.html'),
            controllerAs: '$ctrl',
            controller: ['UrlService', function (UrlService) {
                    var ctrl = this;
                    ctrl.collectionId = UrlService.getCollectionIdFromUrl();
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-local-nav/collection-local-nav.directive.ts":
/*!*********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-local-nav/collection-local-nav.directive.ts ***!
  \*********************************************************************************************************************/
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
 * @fileoverview Directive for the local navigation in the collection view.
 */
__webpack_require__(/*! domain/collection/ReadOnlyCollectionBackendApiService.ts */ "./core/templates/dev/head/domain/collection/ReadOnlyCollectionBackendApiService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('oppia').directive('collectionLocalNav', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-player-page/collection-local-nav/' +
                'collection-local-nav.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', 'ReadOnlyCollectionBackendApiService', 'UrlService',
                function ($scope, ReadOnlyCollectionBackendApiService, UrlService) {
                    var ctrl = this;
                    ctrl.collectionId = UrlService.getCollectionIdFromUrl();
                    $scope.$on('collectionLoaded', function () {
                        var collectionDetails = (ReadOnlyCollectionBackendApiService.getCollectionDetails(ctrl.collectionId));
                        ctrl.canEdit = collectionDetails.canEdit;
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-navbar/collection-navbar.directive.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-navbar/collection-navbar.directive.ts ***!
  \***************************************************************************************************************/
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
 * @fileoverview Directive for the collection player navbar
 */
__webpack_require__(/*! domain/collection/ReadOnlyCollectionBackendApiService.ts */ "./core/templates/dev/head/domain/collection/ReadOnlyCollectionBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('oppia').directive('collectionNavbar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-player-page/collection-navbar/' +
                'collection-navbar.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', 'ReadOnlyCollectionBackendApiService', 'UrlService',
                function ($scope, ReadOnlyCollectionBackendApiService, UrlService) {
                    var ctrl = this;
                    $scope.$on('collectionLoaded', function () {
                        ctrl.collectionTitle = (ReadOnlyCollectionBackendApiService.getCollectionDetails(UrlService.getCollectionIdFromUrl()).title);
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-player-page.directive.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-player-page.directive.ts ***!
  \**************************************************************************************************/
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
 * @fileoverview Directive for the learner's view of a collection.
 */
__webpack_require__(/*! components/common-layout-directives/common-elements/attribution-guide.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/attribution-guide.directive.ts");
__webpack_require__(/*! components/common-layout-directives/common-elements/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts");
__webpack_require__(/*! components/summary-tile/exploration-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile/exploration-summary-tile.directive.ts");
__webpack_require__(/*! domain/collection/CollectionObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionObjectFactory.ts");
__webpack_require__(/*! domain/collection/CollectionPlaythroughObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionPlaythroughObjectFactory.ts");
__webpack_require__(/*! domain/collection/GuestCollectionProgressService.ts */ "./core/templates/dev/head/domain/collection/GuestCollectionProgressService.ts");
__webpack_require__(/*! domain/collection/ReadOnlyCollectionBackendApiService.ts */ "./core/templates/dev/head/domain/collection/ReadOnlyCollectionBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/PageTitleService.ts */ "./core/templates/dev/head/services/PageTitleService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('oppia').animation('.oppia-collection-animate-slide', function () {
    return {
        enter: function (element) {
            element.hide().slideDown();
        },
        leave: function (element) {
            element.slideUp();
        }
    };
});
angular.module('oppia').directive('collectionPlayerPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-player-page/collection-player-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$anchorScroll', '$http', '$location', '$rootScope', '$scope',
                'AlertsService', 'CollectionObjectFactory',
                'CollectionPlaythroughObjectFactory', 'GuestCollectionProgressService',
                'PageTitleService', 'ReadOnlyCollectionBackendApiService',
                'UrlInterpolationService', 'UrlService', 'UserService',
                'WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS',
                function ($anchorScroll, $http, $location, $rootScope, $scope, AlertsService, CollectionObjectFactory, CollectionPlaythroughObjectFactory, GuestCollectionProgressService, PageTitleService, ReadOnlyCollectionBackendApiService, UrlInterpolationService, UrlService, UserService, WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS) {
                    var ctrl = this;
                    $rootScope.loadingMessage = 'Loading';
                    ctrl.collection = null;
                    ctrl.collectionPlaythrough = null;
                    ctrl.collectionId = UrlService.getCollectionIdFromUrl();
                    ctrl.explorationCardIsShown = false;
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                    // The pathIconParameters is an array containing the co-ordinates,
                    // background color and icon url for the icons generated on the path.
                    ctrl.pathIconParameters = [];
                    ctrl.activeHighlightedIconIndex = -1;
                    ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX = 220;
                    ctrl.ODD_SVG_HEIGHT_OFFSET_PX = 150;
                    ctrl.EVEN_SVG_HEIGHT_OFFSET_PX = 280;
                    ctrl.ICON_Y_INITIAL_PX = 35;
                    ctrl.ICON_Y_INCREMENT_PX = 110;
                    ctrl.ICON_X_MIDDLE_PX = 225;
                    ctrl.ICON_X_LEFT_PX = 55;
                    ctrl.ICON_X_RIGHT_PX = 395;
                    ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
                    ctrl.nextExplorationId = null;
                    ctrl.whitelistedCollectionIdsForGuestProgress = (WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS);
                    $anchorScroll.yOffset = -80;
                    $http.get('/collection_handler/data/' + ctrl.collectionId).then(function (response) {
                        response = response.data;
                        angular.element('meta[itemprop="name"]').attr('content', response.meta_name);
                        angular.element('meta[itemprop="description"]').attr('content', response.meta_description);
                        angular.element('meta[property="og:title"]').attr('content', response.meta_name);
                        angular.element('meta[property="og:description"]').attr('content', response.meta_description);
                    });
                    ctrl.setIconHighlight = function (index) {
                        ctrl.activeHighlightedIconIndex = index;
                    };
                    ctrl.unsetIconHighlight = function () {
                        ctrl.activeHighlightedIconIndex = -1;
                    };
                    ctrl.togglePreviewCard = function () {
                        ctrl.explorationCardIsShown = !ctrl.explorationCardIsShown;
                    };
                    ctrl.getCollectionNodeForExplorationId = function (explorationId) {
                        var collectionNode = (ctrl.collection.getCollectionNodeByExplorationId(explorationId));
                        if (!collectionNode) {
                            AlertsService.addWarning('There was an error loading the collection.');
                        }
                        return collectionNode;
                    };
                    ctrl.getNextRecommendedCollectionNodes = function () {
                        return ctrl.getCollectionNodeForExplorationId(ctrl.collectionPlaythrough.getNextExplorationId());
                    };
                    ctrl.getCompletedExplorationNodes = function () {
                        return ctrl.getCollectionNodeForExplorationId(ctrl.collectionPlaythrough.getCompletedExplorationIds());
                    };
                    ctrl.getNonRecommendedCollectionNodeCount = function () {
                        return ctrl.collection.getCollectionNodeCount() - (ctrl.collectionPlaythrough.getNextRecommendedCollectionNodeCount() + ctrl.collectionPlaythrough.getCompletedExplorationNodeCount());
                    };
                    ctrl.updateExplorationPreview = function (explorationId) {
                        ctrl.explorationCardIsShown = true;
                        ctrl.currentExplorationId = explorationId;
                        ctrl.summaryToPreview = ctrl.getCollectionNodeForExplorationId(explorationId).getExplorationSummaryObject();
                    };
                    // Calculates the SVG parameters required to draw the curved path.
                    ctrl.generatePathParameters = function () {
                        // The pathSvgParameters represents the final string of SVG
                        // parameters for the bezier curve to be generated. The default
                        // parameters represent the first curve ie. lesson 1 to lesson 3.
                        ctrl.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
                        var collectionNodeCount = ctrl.collection.getCollectionNodeCount();
                        // The sParameterExtension represents the co-ordinates following
                        // the 'S' (smooth curve to) command in SVG.
                        var sParameterExtension = '';
                        ctrl.pathIconParameters = ctrl.generatePathIconParameters();
                        if (collectionNodeCount === 1) {
                            ctrl.pathSvgParameters = '';
                        }
                        else if (collectionNodeCount === 2) {
                            ctrl.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
                        }
                        else {
                            // The x and y here represent the co-ordinates of the control
                            // points for the bezier curve (path).
                            var y = 500;
                            for (var i = 1; i < Math.floor(collectionNodeCount / 2); i++) {
                                var x = (i % 2) ? 30 : 470;
                                sParameterExtension += x + ' ' + y + ', ';
                                y += 20;
                                sParameterExtension += 250 + ' ' + y + ', ';
                                y += 200;
                            }
                            if (sParameterExtension !== '') {
                                ctrl.pathSvgParameters += ' S ' + sParameterExtension;
                            }
                        }
                        if (collectionNodeCount % 2 === 0) {
                            if (collectionNodeCount === 2) {
                                ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
                            }
                            else {
                                ctrl.svgHeight = y - ctrl.EVEN_SVG_HEIGHT_OFFSET_PX;
                            }
                        }
                        else {
                            if (collectionNodeCount === 1) {
                                ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
                            }
                            else {
                                ctrl.svgHeight = y - ctrl.ODD_SVG_HEIGHT_OFFSET_PX;
                            }
                        }
                    };
                    ctrl.generatePathIconParameters = function () {
                        var collectionNodes = ctrl.collection.getCollectionNodes();
                        var iconParametersArray = [];
                        iconParametersArray.push({
                            thumbnailIconUrl: collectionNodes[0].getExplorationSummaryObject().thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
                            left: '225px',
                            top: '35px',
                            thumbnailBgColor: collectionNodes[0].getExplorationSummaryObject().thumbnail_bg_color
                        });
                        // Here x and y represent the co-ordinates for the icons in the
                        // path.
                        var x = ctrl.ICON_X_MIDDLE_PX;
                        var y = ctrl.ICON_Y_INITIAL_PX;
                        var countMiddleIcon = 1;
                        for (var i = 1; i < ctrl.collection.getCollectionNodeCount(); i++) {
                            if (countMiddleIcon === 0 && x === ctrl.ICON_X_MIDDLE_PX) {
                                x = ctrl.ICON_X_LEFT_PX;
                                y += ctrl.ICON_Y_INCREMENT_PX;
                                countMiddleIcon = 1;
                            }
                            else if (countMiddleIcon === 1 && x === ctrl.ICON_X_MIDDLE_PX) {
                                x = ctrl.ICON_X_RIGHT_PX;
                                y += ctrl.ICON_Y_INCREMENT_PX;
                                countMiddleIcon = 0;
                            }
                            else {
                                x = ctrl.ICON_X_MIDDLE_PX;
                                y += ctrl.ICON_Y_INCREMENT_PX;
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
                    ctrl.getExplorationUrl = function (explorationId) {
                        return ('/explore/' + explorationId + '?collection_id=' +
                            ctrl.collectionId);
                    };
                    ctrl.getExplorationTitlePosition = function (index) {
                        if (index % 2 === 0) {
                            return '8px';
                        }
                        else if ((index + 1) % 2 === 0 && (index + 1) % 4 !== 0) {
                            return '30px';
                        }
                        else if ((index + 1) % 4 === 0) {
                            return '-40px';
                        }
                    };
                    $http.get('/collectionsummarieshandler/data', {
                        params: {
                            stringified_collection_ids: JSON.stringify([ctrl.collectionId])
                        }
                    }).then(function (response) {
                        ctrl.collectionSummary = response.data.summaries[0];
                    }, function () {
                        AlertsService.addWarning('There was an error while fetching the collection summary.');
                    });
                    // Load the collection the learner wants to view.
                    ReadOnlyCollectionBackendApiService.loadCollection(ctrl.collectionId).then(function (collectionBackendObject) {
                        ctrl.collection = CollectionObjectFactory.create(collectionBackendObject);
                        $rootScope.$broadcast('collectionLoaded');
                        PageTitleService.setPageTitle(ctrl.collection.getTitle() + ' - Oppia');
                        // Load the user's current progress in the collection. If the
                        // user is a guest, then either the defaults from the server will
                        // be used or the user's local progress, if any has been made and
                        // the collection is whitelisted.
                        var collectionAllowsGuestProgress = (ctrl.whitelistedCollectionIdsForGuestProgress.indexOf(ctrl.collectionId) !== -1);
                        UserService.getUserInfoAsync().then(function (userInfo) {
                            $rootScope.loadingMessage = '';
                            ctrl.isLoggedIn = userInfo.isLoggedIn();
                            if (!ctrl.isLoggedIn && collectionAllowsGuestProgress &&
                                GuestCollectionProgressService.hasCompletedSomeExploration(ctrl.collectionId)) {
                                var completedExplorationIds = (GuestCollectionProgressService.getCompletedExplorationIds(ctrl.collection));
                                var nextExplorationId = (GuestCollectionProgressService.getNextExplorationId(ctrl.collection, completedExplorationIds));
                                ctrl.collectionPlaythrough = (CollectionPlaythroughObjectFactory.create(nextExplorationId, completedExplorationIds));
                            }
                            else {
                                ctrl.collectionPlaythrough = (CollectionPlaythroughObjectFactory.createFromBackendObject(collectionBackendObject.playthrough_dict));
                            }
                            ctrl.nextExplorationId =
                                ctrl.collectionPlaythrough.getNextExplorationId();
                            ctrl.isCompletedExploration = function (explorationId) {
                                var completedExplorationIds = (ctrl.collectionPlaythrough.getCompletedExplorationIds());
                                return completedExplorationIds.indexOf(explorationId) > -1;
                            };
                        });
                    }, function () {
                        // TODO(bhenning): Handle not being able to load the collection.
                        // NOTE TO DEVELOPERS: Check the backend console for an indication
                        // as to why this error occurred; sometimes the errors are noisy,
                        // so they are not shown to the user.
                        AlertsService.addWarning('There was an error loading the collection.');
                    });
                    $scope.$watch('$ctrl.collection', function (newValue) {
                        if (newValue !== null) {
                            ctrl.generatePathParameters();
                        }
                    }, true);
                    ctrl.scrollToLocation = function (id) {
                        $location.hash(id);
                        $anchorScroll();
                    };
                    ctrl.closeOnClickingOutside = function () {
                        ctrl.explorationCardIsShown = false;
                    };
                    ctrl.onClickStopPropagation = function ($evt) {
                        $evt.stopPropagation();
                    };
                    // Touching anywhere outside the mobile preview should hide it.
                    document.addEventListener('touchstart', function () {
                        if (ctrl.explorationCardIsShown === true) {
                            ctrl.explorationCardIsShown = false;
                        }
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-player-page.module.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-player-page.module.ts ***!
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
 * @fileoverview Module for the collection player page.
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
var interactions_extension_constants_1 = __webpack_require__(/*! interactions/interactions-extension.constants */ "./extensions/interactions/interactions-extension.constants.ts");
var objects_domain_constants_1 = __webpack_require__(/*! domain/objects/objects-domain.constants */ "./core/templates/dev/head/domain/objects/objects-domain.constants.ts");
var CollectionPlayerPageModule = /** @class */ (function () {
    function CollectionPlayerPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    CollectionPlayerPageModule.prototype.ngDoBootstrap = function () { };
    CollectionPlayerPageModule = __decorate([
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
                interactions_extension_constants_1.InteractionsExtensionsConstants,
                objects_domain_constants_1.ObjectsDomainConstants,
            ]
        })
    ], CollectionPlayerPageModule);
    return CollectionPlayerPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(CollectionPlayerPageModule);
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

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-player-page.scripts.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-player-page.scripts.ts ***!
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
 * @fileoverview Directives required in collection player.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/collection-player-page/collection-player-page.module.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-player-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! pages/collection-player-page/collection-footer/collection-footer.directive.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-footer/collection-footer.directive.ts");
__webpack_require__(/*! pages/collection-player-page/collection-local-nav/collection-local-nav.directive.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-local-nav/collection-local-nav.directive.ts");
__webpack_require__(/*! pages/collection-player-page/collection-navbar/collection-navbar.directive.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-navbar/collection-navbar.directive.ts");
__webpack_require__(/*! pages/collection-player-page/collection-player-page.directive.ts */ "./core/templates/dev/head/pages/collection-player-page/collection-player-page.directive.ts");


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/WindowRefService.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/WindowRefService.ts ***!
  \*************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Service to wrap the window object.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var WindowRef = /** @class */ (function () {
    function WindowRef() {
    }
    WindowRef.prototype._window = function () {
        // return the global native browser window object
        return window;
    };
    Object.defineProperty(WindowRef.prototype, "nativeWindow", {
        get: function () {
            return this._window();
        },
        enumerable: true,
        configurable: true
    });
    WindowRef = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], WindowRef);
    return WindowRef;
}());
exports.WindowRef = WindowRef;


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvYnV0dG9uLWRpcmVjdGl2ZXMvZXhwbG9yYXRpb24tZW1iZWQtYnV0dG9uLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzL2F0dHJpYnV0aW9uLWd1aWRlLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy9zaGFyaW5nLWxpbmtzLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uUGxheXRocm91Z2hPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9jb2xsZWN0aW9uL0d1ZXN0Q29sbGVjdGlvblByb2dyZXNzT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY29sbGVjdGlvbi9HdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvT3BwaWFGb290ZXJEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLWZvb3Rlci9jb2xsZWN0aW9uLWZvb3Rlci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLWxvY2FsLW5hdi9jb2xsZWN0aW9uLWxvY2FsLW5hdi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLW5hdmJhci9jb2xsZWN0aW9uLW5hdmJhci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLXBsYXllci1wYWdlLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLXBsYXllci1wYWdlL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS5zY3JpcHRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93UmVmU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoi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Q0w7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxDQUFDO0FBQ0QiLCJmaWxlIjoiY29sbGVjdGlvbl9wbGF5ZXIuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuXG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcImNvbGxlY3Rpb25fcGxheWVyXCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLXBsYXllci1wYWdlL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2Uuc2NyaXB0cy50c1wiLFwidmVuZG9yc35hYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcn43ODU2YzA1YVwiLFwidmVuZG9yc35hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcH43ZjhiY2M2N1wiLFwiYWJvdXR+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29tbXVuaXR5X2Rhc2hib2FyZH5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lMDZhNGExN1wiLFwiY29sbGVjdGlvbl9wbGF5ZXJ+Y3JlYXRvcl9kYXNoYm9hcmR+bGVhcm5lcl9kYXNoYm9hcmR+bGlicmFyeX5wcm9maWxlfnN0b3J5X3ZpZXdlclwiLFwiY29sbGVjdGlvbl9wbGF5ZXJ+bGVhcm5lcl9kYXNoYm9hcmR+bGlicmFyeX5wcm9maWxlfnN0b3J5X3ZpZXdlclwiLFwiY29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJcIl0pO1xuIFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiByZWFkeVxuIFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIEJhc2UgVHJhbnNjbHVzaW9uIENvbXBvbmVudC5cbiAqL1xucmVxdWlyZSgnYmFzZV9jb21wb25lbnRzL1dhcm5pbmdMb2FkZXJEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL09wcGlhRm9vdGVyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc2lkZWJhci9TaWRlYmFyU3RhdHVzU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9zdGF0ZWZ1bC9CYWNrZ3JvdW5kTWFza1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnYmFzZUNvbnRlbnQnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHtcbiAgICAgICAgICAgICAgICBicmVhZGNydW1iOiAnP25hdmJhckJyZWFkY3J1bWInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdjb250ZW50JyxcbiAgICAgICAgICAgICAgICBmb290ZXI6ICc/cGFnZUZvb3RlcicsXG4gICAgICAgICAgICAgICAgbmF2T3B0aW9uczogJz9uYXZPcHRpb25zJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9iYXNlX2NvbXBvbmVudHMvYmFzZV9jb250ZW50X2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRyb290U2NvcGUnLCAnQmFja2dyb3VuZE1hc2tTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnU2lkZWJhclN0YXR1c1NlcnZpY2UnLCAnVXJsU2VydmljZScsICdTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQmFja2dyb3VuZE1hc2tTZXJ2aWNlLCBTaWRlYmFyU3RhdHVzU2VydmljZSwgVXJsU2VydmljZSwgU0lURV9GRUVEQkFDS19GT1JNX1VSTCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaWZyYW1lZCA9IFVybFNlcnZpY2UuaXNJZnJhbWVkKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2l0ZUZlZWRiYWNrRm9ybVVybCA9IFNJVEVfRkVFREJBQ0tfRk9STV9VUkw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNTaWRlYmFyU2hvd24gPSBTaWRlYmFyU3RhdHVzU2VydmljZS5pc1NpZGViYXJTaG93bjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jbG9zZVNpZGViYXJPblN3aXBlID0gU2lkZWJhclN0YXR1c1NlcnZpY2UuY2xvc2VTaWRlYmFyO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzQmFja2dyb3VuZE1hc2tBY3RpdmUgPSBCYWNrZ3JvdW5kTWFza1NlcnZpY2UuaXNNYXNrQWN0aXZlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkRFVl9NT0RFID0gJHJvb3RTY29wZS5ERVZfTU9ERTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5za2lwVG9NYWluQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYWluQ29udGVudEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3BwaWEtbWFpbi1jb250ZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1haW5Db250ZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdWYXJpYWJsZSBtYWluQ29udGVudEVsZW1lbnQgaXMgdW5kZWZpbmVkLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LnRhYkluZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB3YXJuaW5nX2xvYWRlci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCd3YXJuaW5nTG9hZGVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9iYXNlX2NvbXBvbmVudHMvd2FybmluZ19sb2FkZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnQWxlcnRzU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKEFsZXJ0c1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkFsZXJ0c1NlcnZpY2UgPSBBbGVydHNTZXJ2aWNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgdGhlICdlbWJlZCBleHBsb3JhdGlvbicgbW9kYWwuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdFeHBsb3JhdGlvbkVtYmVkQnV0dG9uU2VydmljZScsIFtcbiAgICAnJHVpYk1vZGFsJywgJ1NpdGVBbmFseXRpY3NTZXJ2aWNlJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHVpYk1vZGFsLCBTaXRlQW5hbHl0aWNzU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNob3dNb2RhbDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2J1dHRvbi1kaXJlY3RpdmVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2V4cGxvcmF0aW9uLWVtYmVkLWJ1dHRvbi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbklkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4cGxvcmF0aW9uSWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLCAnJHdpbmRvdycsICdleHBsb3JhdGlvbklkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlLCAkd2luZG93LCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmV4cGxvcmF0aW9uSWQgPSBleHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXJ2ZXJOYW1lID0gKCR3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgJHdpbmRvdy5sb2NhdGlvbi5ob3N0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2Nsb3NlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0VGV4dCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGVEaXYgPSBldnQuY3VycmVudFRhcmdldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnRCZWZvcmUoY29kZURpdi5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2Uuc2V0RW5kQWZ0ZXIoY29kZURpdi5sYXN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5hZGRSYW5nZShyYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFNpdGVBbmFseXRpY3NTZXJ2aWNlLnJlZ2lzdGVyT3BlbkVtYmVkSW5mb0V2ZW50KGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBhdHRyaWJ1dGlvbiBndWlkZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9Ccm93c2VyQ2hlY2tlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnYXR0cmlidXRpb25HdWlkZScsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAgICAgICAgICAgICAnYXR0cmlidXRpb24tZ3VpZGUuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnQnJvd3NlckNoZWNrZXJTZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCBmdW5jdGlvbiAoQnJvd3NlckNoZWNrZXJTZXJ2aWNlLCBVcmxTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc01vYmlsZURldmljZSA9IEJyb3dzZXJDaGVja2VyU2VydmljZS5pc01vYmlsZURldmljZSgpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlmcmFtZWQgPSBVcmxTZXJ2aWNlLmlzSWZyYW1lZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgYmFja2dyb3VuZCBiYW5uZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnYmFja2dyb3VuZEJhbm5lcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2Jhbm5lckEuc3ZnJywgJ2Jhbm5lckIuc3ZnJywgJ2Jhbm5lckMuc3ZnJywgJ2Jhbm5lckQuc3ZnJ1xuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmFubmVySW1hZ2VGaWxlbmFtZSA9IHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmJhbm5lckltYWdlRmlsZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKCcvYmFja2dyb3VuZC8nICsgYmFubmVySW1hZ2VGaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBTb2NpYWwgU2hhcmluZyBMaW5rcy5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9idXR0b24tZGlyZWN0aXZlcy9leHBsb3JhdGlvbi1lbWJlZC1idXR0b24uc2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TaXRlQW5hbHl0aWNzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzaGFyaW5nTGlua3MnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGxheW91dFR5cGU6ICdAJyxcbiAgICAgICAgICAgICAgICBsYXlvdXRBbGlnblR5cGU6ICdAJyxcbiAgICAgICAgICAgICAgICBzaGFyZVR5cGU6ICdAJyxcbiAgICAgICAgICAgICAgICBnZXRFeHBsb3JhdGlvbklkOiAnJmV4cGxvcmF0aW9uSWQnLFxuICAgICAgICAgICAgICAgIGdldENvbGxlY3Rpb25JZDogJyZjb2xsZWN0aW9uSWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICAgICAgICAgICAgICdzaGFyaW5nLWxpbmtzLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyR3aW5kb3cnLCAnSHRtbEVzY2FwZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnRXhwbG9yYXRpb25FbWJlZEJ1dHRvblNlcnZpY2UnLCAnU2l0ZUFuYWx5dGljc1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdERUZBVUxUX1RXSVRURVJfU0hBUkVfTUVTU0FHRV9FRElUT1InLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkd2luZG93LCBIdG1sRXNjYXBlclNlcnZpY2UsIEV4cGxvcmF0aW9uRW1iZWRCdXR0b25TZXJ2aWNlLCBTaXRlQW5hbHl0aWNzU2VydmljZSwgREVGQVVMVF9UV0lUVEVSX1NIQVJFX01FU1NBR0VfRURJVE9SKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5yZWdpc3RlclNoYXJlRXZlbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5zaGFyZVR5cGUgPT09ICdleHBsb3JhdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZXhwbG9yYXRpb25JZCA9IGN0cmwuZ2V0RXhwbG9yYXRpb25JZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3Rpdml0eVR5cGUgPSAnZXhwbG9yZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2aXR5SWQgPSBjdHJsLmV4cGxvcmF0aW9uSWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnJlZ2lzdGVyU2hhcmVFdmVudCA9IChTaXRlQW5hbHl0aWNzU2VydmljZS5yZWdpc3RlclNoYXJlRXhwbG9yYXRpb25FdmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dFbWJlZEV4cGxvcmF0aW9uTW9kYWwgPSAoRXhwbG9yYXRpb25FbWJlZEJ1dHRvblNlcnZpY2Uuc2hvd01vZGFsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjdHJsLnNoYXJlVHlwZSA9PT0gJ2NvbGxlY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb25JZCA9IGN0cmwuZ2V0Q29sbGVjdGlvbklkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2aXR5VHlwZSA9ICdjb2xsZWN0aW9uJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuYWN0aXZpdHlJZCA9IGN0cmwuY29sbGVjdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5yZWdpc3RlclNoYXJlRXZlbnQgPSAoU2l0ZUFuYWx5dGljc1NlcnZpY2UucmVnaXN0ZXJTaGFyZUNvbGxlY3Rpb25FdmVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignU2hhcmluZ0xpbmtzIGRpcmVjdGl2ZSBjYW4gb25seSBiZSB1c2VkIGVpdGhlciBpbiB0aGUnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY29sbGVjdGlvbiBwbGF5ZXIgb3IgdGhlIGV4cGxvcmF0aW9uIHBsYXllcicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2VydmVyTmFtZSA9ICgkd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArICR3aW5kb3cubG9jYXRpb24uaG9zdCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZXNjYXBlZFR3aXR0ZXJUZXh0ID0gKEh0bWxFc2NhcGVyU2VydmljZS51bmVzY2FwZWRTdHJUb0VzY2FwZWRTdHIoREVGQVVMVF9UV0lUVEVSX1NIQVJFX01FU1NBR0VfRURJVE9SKSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2xhc3Nyb29tVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9nZW5lcmFsL2NsYXNzcm9vbS5wbmcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmRcbiAqIGNvbGxlY3Rpb24gcGxheXRocm91Z2ggZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBjbG9uZURlZXBfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwibG9kYXNoL2Nsb25lRGVlcFwiKSk7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgQ29sbGVjdGlvblBsYXl0aHJvdWdoID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIC8vIFN0b3JlcyBpbmZvcm1hdGlvbiBhYm91dCBhIGN1cnJlbnQgcGxheXRocm91Z2ggb2YgYSBjb2xsZWN0aW9uIGZvciBhXG4gICAgLy8gdXNlci5cbiAgICBmdW5jdGlvbiBDb2xsZWN0aW9uUGxheXRocm91Z2gobmV4dEV4cGxvcmF0aW9uSWQsIGNvbXBsZXRlZEV4cGxvcmF0aW9uSWRzKSB7XG4gICAgICAgIHRoaXMuX25leHRFeHBsb3JhdGlvbklkID0gbmV4dEV4cGxvcmF0aW9uSWQ7XG4gICAgICAgIHRoaXMuX2NvbXBsZXRlZEV4cGxvcmF0aW9uSWRzID0gY29tcGxldGVkRXhwbG9yYXRpb25JZHM7XG4gICAgfVxuICAgIC8vIFJldHVybnMgdGhlIHVwY29taW5nIGV4cGxvcmF0aW9uIElELiBDaGFuZ2VzIHRvIHRoaXMgYXJlIG5vdFxuICAgIC8vIHJlZmxlY3RlZCBpbiB0aGUgY29sbGVjdGlvbi5cbiAgICBDb2xsZWN0aW9uUGxheXRocm91Z2gucHJvdG90eXBlLmdldE5leHRFeHBsb3JhdGlvbklkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbmV4dEV4cGxvcmF0aW9uSWQ7XG4gICAgfTtcbiAgICBDb2xsZWN0aW9uUGxheXRocm91Z2gucHJvdG90eXBlLmdldE5leHRSZWNvbW1lbmRlZENvbGxlY3Rpb25Ob2RlQ291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEFzIHRoZSBjb2xsZWN0aW9uIGlzIGxpbmVhciwgb25seSBhIHNpbmdsZSBub2RlIHdvdWxkIGJlIGF2YWlsYWJsZSxcbiAgICAgICAgLy8gYWZ0ZXIgYW55IG5vZGUuXG4gICAgICAgIHJldHVybiAxO1xuICAgIH07XG4gICAgLy8gUmV0dXJucyBhIGxpc3Qgb2YgZXhwbG9yYXRpb25zIGNvbXBsZXRlZCB0aGF0IGFyZSByZWxhdGVkIHRvIHRoaXNcbiAgICAvLyBjb2xsZWN0aW9uLiBDaGFuZ2VzIHRvIHRoaXMgbGlzdCBhcmUgbm90IHJlZmxlY3RlZCBpbiB0aGlzIGNvbGxlY3Rpb24uXG4gICAgQ29sbGVjdGlvblBsYXl0aHJvdWdoLnByb3RvdHlwZS5nZXRDb21wbGV0ZWRFeHBsb3JhdGlvbklkcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNsb25lRGVlcF8xLmRlZmF1bHQodGhpcy5fY29tcGxldGVkRXhwbG9yYXRpb25JZHMpO1xuICAgIH07XG4gICAgQ29sbGVjdGlvblBsYXl0aHJvdWdoLnByb3RvdHlwZS5nZXRDb21wbGV0ZWRFeHBsb3JhdGlvbk5vZGVDb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbXBsZXRlZEV4cGxvcmF0aW9uSWRzLmxlbmd0aDtcbiAgICB9O1xuICAgIENvbGxlY3Rpb25QbGF5dGhyb3VnaC5wcm90b3R5cGUuaGFzU3RhcnRlZENvbGxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb21wbGV0ZWRFeHBsb3JhdGlvbklkcy5sZW5ndGggIT09IDA7XG4gICAgfTtcbiAgICAvLyBUT0RPKGJoZW5uaW5nKTogQWRkIHNldHRlcnMgZm9yIHNvbWUgb2YgdGhlc2UgcHJvcGVydGllcy4gU2V0dGVycyBhbGxvd1xuICAgIC8vIHRoZSBjb2xsZWN0aW9uIGVkaXRvciB0byBzZXR1cCBzcGVjaWZpY2FsbHkgY29uZmlndXJlZCBwbGF5dGhyb3VnaFxuICAgIC8vIHNlc3Npb25zIG9mIHRoZSBjb2xsZWN0aW9uIHBsYXllciB0aHJvdWdoIHRoaXMgb2JqZWN0IChmb3IgZXhhbXBsZSwgdGhlXG4gICAgLy8gZWRpdG9yIHdvdWxkIGJlIGFibGUgdG8gZmFrZSB3aGljaCBleHBsb3JhdGlvbnMgd2VyZSBjb21wbGV0ZWQgdG8gc2VlIGhvd1xuICAgIC8vIHRoYXQgcGFydGljdWxhciBjb25maWd1cmF0aW9uIHdvdWxkIGxvb2sgZm9yIGEgbGVhcm5lcikuXG4gICAgQ29sbGVjdGlvblBsYXl0aHJvdWdoLnByb3RvdHlwZS5oYXNGaW5pc2hlZENvbGxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9uZXh0RXhwbG9yYXRpb25JZCA9PT0gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBDb2xsZWN0aW9uUGxheXRocm91Z2g7XG59KCkpO1xuZXhwb3J0cy5Db2xsZWN0aW9uUGxheXRocm91Z2ggPSBDb2xsZWN0aW9uUGxheXRocm91Z2g7XG52YXIgQ29sbGVjdGlvblBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb2xsZWN0aW9uUGxheXRocm91Z2hPYmplY3RGYWN0b3J5KCkge1xuICAgIH1cbiAgICAvLyBTdGF0aWMgY2xhc3MgbWV0aG9kcy4gTm90ZSB0aGF0IFwidGhpc1wiIGlzIG5vdCBhdmFpbGFibGUgaW4gc3RhdGljXG4gICAgLy8gY29udGV4dHMuIFRoaXMgZnVuY3Rpb24gdGFrZXMgYSBKU09OIG9iamVjdCB3aGljaCByZXByZXNlbnRzIGEgYmFja2VuZFxuICAgIC8vIGNvbGxlY3Rpb24gcGxheXRocm91Z2ggcHl0aG9uIGRpY3QuXG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnY29sbGVjdGlvblBsYXl0aHJvdWdoQmFja2VuZE9iamVjdCcgaXMgYSBkaWN0IHdpdGhcbiAgICAvLyB1bmRlcnNjb3JlX2Nhc2VkIGtleXMgd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmdcbiAgICAvLyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy5cbiAgICBDb2xsZWN0aW9uUGxheXRocm91Z2hPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVGcm9tQmFja2VuZE9iamVjdCA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uUGxheXRocm91Z2hCYWNrZW5kT2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sbGVjdGlvblBsYXl0aHJvdWdoKGNvbGxlY3Rpb25QbGF5dGhyb3VnaEJhY2tlbmRPYmplY3QubmV4dF9leHBsb3JhdGlvbl9pZCwgY29sbGVjdGlvblBsYXl0aHJvdWdoQmFja2VuZE9iamVjdC5jb21wbGV0ZWRfZXhwbG9yYXRpb25faWRzKTtcbiAgICB9O1xuICAgIENvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uIChuZXh0RXhwbG9yYXRpb25JZCwgY29tcGxldGVkRXhwbG9yYXRpb25JZHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xsZWN0aW9uUGxheXRocm91Z2gobmV4dEV4cGxvcmF0aW9uSWQsIGNsb25lRGVlcF8xLmRlZmF1bHQoY29tcGxldGVkRXhwbG9yYXRpb25JZHMpKTtcbiAgICB9O1xuICAgIENvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgQ29sbGVjdGlvblBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIENvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5Db2xsZWN0aW9uUGxheXRocm91Z2hPYmplY3RGYWN0b3J5ID0gQ29sbGVjdGlvblBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKENvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgYW5kIG11dGF0aW5nIGEgZG9tYWluIG9iamVjdCB3aGljaFxuICogcmVwcmVzZW50cyB0aGUgcHJvZ3Jlc3Mgb2YgYSBndWVzdCBwbGF5aW5nIHRocm91Z2ggYSBjb2xsZWN0aW9uLlxuICovXG52YXIgY2xvbmVEZWVwXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcImxvZGFzaC9jbG9uZURlZXBcIikpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzKGNvbXBsZXRlZEV4cGxvcmF0aW9uc01hcCkge1xuICAgICAgICB0aGlzLl9jb21wbGV0ZWRFeHBsb3JhdGlvbnNNYXAgPSBjb21wbGV0ZWRFeHBsb3JhdGlvbnNNYXA7XG4gICAgfVxuICAgIC8vIFJldHVybnMgd2hldGhlciB0aGUgZ3Vlc3QgaGFzIG1hZGUgYW55IHByb2dyZXNzIHRvd2FyZHMgY29tcGxldGluZyB0aGVcbiAgICAvLyBzcGVjaWZpZWQgY29sbGVjdGlvbiBJRC4gTm90ZSB0aGF0IHRoaXMgZG9lcyBub3QgYWNjb3VudCBmb3Igd2hldGhlciB0aGVcbiAgICAvLyBjb21wbGV0ZWQgZXhwbG9yYXRpb25zIGFyZSBzdGlsbCBjb250YWluZWQgd2l0aGluIHRoYXQgY29sbGVjdGlvbi5cbiAgICBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzcy5wcm90b3R5cGUuaGFzQ29tcGxldGlvblByb2dyZXNzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29tcGxldGVkRXhwbG9yYXRpb25zTWFwLmhhc093blByb3BlcnR5KGNvbGxlY3Rpb25JZCk7XG4gICAgfTtcbiAgICAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGV4cGxvcmF0aW9uIElEcyB3aGljaCBoYXZlIGJlZW4gY29tcGxldGVkIGJ5IHRoZVxuICAgIC8vIHNwZWNpZmllZCBjb2xsZWN0aW9uIElELCBvciBlbXB0eSBpZiBub25lIGhhdmUuXG4gICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MucHJvdG90eXBlLmdldENvbXBsZXRlZEV4cGxvcmF0aW9uSWRzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICBpZiAoIXRoaXMuaGFzQ29tcGxldGlvblByb2dyZXNzKGNvbGxlY3Rpb25JZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2xvbmVEZWVwXzEuZGVmYXVsdCh0aGlzLl9jb21wbGV0ZWRFeHBsb3JhdGlvbnNNYXBbY29sbGVjdGlvbklkXSk7XG4gICAgfTtcbiAgICAvLyBTcGVjaWZpZXMgdGhhdCBhIHNwZWNpZmljIGV4cGxvcmF0aW9uIElEIGhhcyBiZWVuIGNvbXBsZXRlZCBpbiB0aGVcbiAgICAvLyBjb250ZXh0IG9mIHRoZSBzcGVjaWZpZWQgY29sbGVjdGlvbi4gUmV0dXJucyB3aGV0aGVyIHRoYXQgZXhwbG9yYXRpb24gSURcbiAgICAvLyB3YXMgbm90IHByZXZpb3VzbHkgcmVnaXN0ZXJlZCBhcyBjb21wbGV0ZWQgZm9yIHRoZSBjb2xsZWN0aW9uLlxuICAgIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzLnByb3RvdHlwZS5hZGRDb21wbGV0ZWRFeHBsb3JhdGlvbklkID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgZXhwbG9yYXRpb25JZCkge1xuICAgICAgICB2YXIgY29tcGxldGVkRXhwbG9yYXRpb25JZHMgPSB0aGlzLmdldENvbXBsZXRlZEV4cGxvcmF0aW9uSWRzKGNvbGxlY3Rpb25JZCk7XG4gICAgICAgIGlmIChjb21wbGV0ZWRFeHBsb3JhdGlvbklkcy5pbmRleE9mKGV4cGxvcmF0aW9uSWQpID09PSAtMSkge1xuICAgICAgICAgICAgY29tcGxldGVkRXhwbG9yYXRpb25JZHMucHVzaChleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbXBsZXRlZEV4cGxvcmF0aW9uc01hcFtjb2xsZWN0aW9uSWRdID0gY29tcGxldGVkRXhwbG9yYXRpb25JZHM7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICAvLyBDb252ZXJ0cyB0aGlzIG9iamVjdCB0byBKU09OIGZvciBzdG9yYWdlLlxuICAgIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzLnByb3RvdHlwZS50b0pzb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLl9jb21wbGV0ZWRFeHBsb3JhdGlvbnNNYXApO1xuICAgIH07XG4gICAgcmV0dXJuIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzO1xufSgpKTtcbmV4cG9ydHMuR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MgPSBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzcztcbnZhciBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc09iamVjdEZhY3RvcnkgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NPYmplY3RGYWN0b3J5KCkge1xuICAgIH1cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHRha2VzIGEgSlNPTiBzdHJpbmcgd2hpY2ggcmVwcmVzZW50cyBhIHJhdyBjb2xsZWN0aW9uXG4gICAgLy8gb2JqZWN0IGFuZCByZXR1cm5zIGEgbmV3IEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzIGRvbWFpbiBvYmplY3QuIEEgbnVsbCBvclxuICAgIC8vIHVuZGVmaW5lZCBzdHJpbmcgaW5kaWNhdGVzIHRoYXQgYW4gZW1wdHkgcHJvZ3Jlc3Mgb2JqZWN0IHNob3VsZCBiZVxuICAgIC8vIGNyZWF0ZWQuXG4gICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVGcm9tSnNvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uUHJvZ3Jlc3NKc29uKSB7XG4gICAgICAgIGlmIChjb2xsZWN0aW9uUHJvZ3Jlc3NKc29uKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzKEpTT04ucGFyc2UoY29sbGVjdGlvblByb2dyZXNzSnNvbikpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzcyh7fSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzT2JqZWN0RmFjdG9yeSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc09iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc09iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5HdWVzdENvbGxlY3Rpb25Qcm9ncmVzc09iamVjdEZhY3RvcnkgPSBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc09iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc09iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzT2JqZWN0RmFjdG9yeSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX21ldGFkYXRhID0gKHRoaXMgJiYgdGhpcy5fX21ldGFkYXRhKSB8fCBmdW5jdGlvbiAoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0aGF0IHJlY29yZHMgcHJvZ3Jlc3MgZ3Vlc3RzIG1ha2UgZHVyaW5nIGEgY29sbGVjdGlvblxuICogcGxheXRocm91Z2guIE5vdGUgdGhhdCB0aGlzIHNlcnZpY2UgZG9lcyBub3QgY3VycmVudGx5IHN1cHBvcnQgc2F2aW5nIGFcbiAqIHVzZXIncyBwcm9ncmVzcyB3aGVuIHRoZXkgY3JlYXRlIGFuIGFjY291bnQuXG4gKi9cbi8vIFRPRE8oYmhlbm5pbmcpOiBNb3ZlIHRoaXMgdG8gYSBzZXJ2aWNlIHdoaWNoIHN0b3JlcyBzaGFyZWQgc3RhdGUgYWNyb3NzIHRoZVxuLy8gZnJvbnRlbmQgaW4gYSB3YXkgdGhhdCBjYW4gYmUgcGVyc2lzdGVkIGluIHRoZSBiYWNrZW5kIHVwb24gYWNjb3VudFxuLy8gY3JlYXRpb24sIHN1Y2ggYXMgZXhwbG9yYXRpb24gcHJvZ3Jlc3MuXG4vLyBUT0RPKGJoZW5uaW5nKTogVGhpcyBzaG91bGQgYmUgcmVzZXQgdXBvbiBsb2dpbiwgb3RoZXJ3aXNlIHRoZSBwcm9ncmVzcyB3aWxsXG4vLyBiZSBkaWZmZXJlbnQgZGVwZW5kaW5nIG9uIHRoZSB1c2VyJ3MgbG9nZ2VkIGluL2xvZ2dlZCBvdXQgc3RhdGUuXG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NPYmplY3RGYWN0b3J5XzEgPSByZXF1aXJlKFwiZG9tYWluL2NvbGxlY3Rpb24vR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NPYmplY3RGYWN0b3J5XCIpO1xudmFyIFdpbmRvd1JlZlNlcnZpY2VfMSA9IHJlcXVpcmUoXCJzZXJ2aWNlcy9jb250ZXh0dWFsL1dpbmRvd1JlZlNlcnZpY2VcIik7XG52YXIgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzU2VydmljZShndWVzdENvbGxlY3Rpb25Qcm9ncmVzc09iamVjdEZhY3RvcnksIHdpbmRvd1JlZikge1xuICAgICAgICB0aGlzLmd1ZXN0Q29sbGVjdGlvblByb2dyZXNzT2JqZWN0RmFjdG9yeSA9IGd1ZXN0Q29sbGVjdGlvblByb2dyZXNzT2JqZWN0RmFjdG9yeTtcbiAgICAgICAgdGhpcy53aW5kb3dSZWYgPSB3aW5kb3dSZWY7XG4gICAgICAgIHRoaXMuQ09MTEVDVElPTl9TVE9SQUdFX0tFWSA9ICdjb2xsZWN0aW9uUHJvZ3Jlc3NTdG9yZV92MSc7XG4gICAgfVxuICAgIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzU2VydmljZS5wcm90b3R5cGUuc3RvcmVHdWVzdENvbGxlY3Rpb25Qcm9ncmVzcyA9IGZ1bmN0aW9uIChndWVzdENvbGxlY3Rpb25Qcm9ncmVzcykge1xuICAgICAgICB0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3cubG9jYWxTdG9yYWdlW3RoaXMuQ09MTEVDVElPTl9TVE9SQUdFX0tFWV0gPSAoZ3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MudG9Kc29uKCkpO1xuICAgIH07XG4gICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5sb2FkR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmd1ZXN0Q29sbGVjdGlvblByb2dyZXNzT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tSnNvbih0aGlzLndpbmRvd1JlZi5uYXRpdmVXaW5kb3cubG9jYWxTdG9yYWdlW3RoaXMuQ09MTEVDVElPTl9TVE9SQUdFX0tFWV0pO1xuICAgIH07XG4gICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5yZWNvcmRDb21wbGV0ZWRFeHBsb3JhdGlvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQsIGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgdmFyIGd1ZXN0Q29sbGVjdGlvblByb2dyZXNzID0gdGhpcy5sb2FkR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MoKTtcbiAgICAgICAgdmFyIGNvbXBsZXRlZEV4cGxvcmF0aW9uSWRIYXNCZWVuQWRkZWQgPSAoZ3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3MuYWRkQ29tcGxldGVkRXhwbG9yYXRpb25JZChjb2xsZWN0aW9uSWQsIGV4cGxvcmF0aW9uSWQpKTtcbiAgICAgICAgaWYgKGNvbXBsZXRlZEV4cGxvcmF0aW9uSWRIYXNCZWVuQWRkZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcmVHdWVzdENvbGxlY3Rpb25Qcm9ncmVzcyhndWVzdENvbGxlY3Rpb25Qcm9ncmVzcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzU2VydmljZS5wcm90b3R5cGUuZ2V0VmFsaWRDb21wbGV0ZWRFeHBsb3JhdGlvbklkcyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgIHZhciBjb2xsZWN0aW9uSWQgPSBjb2xsZWN0aW9uLmdldElkKCk7XG4gICAgICAgIHZhciBndWVzdENvbGxlY3Rpb25Qcm9ncmVzcyA9IHRoaXMubG9hZEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzKCk7XG4gICAgICAgIHZhciBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcyA9IChndWVzdENvbGxlY3Rpb25Qcm9ncmVzcy5nZXRDb21wbGV0ZWRFeHBsb3JhdGlvbklkcyhjb2xsZWN0aW9uSWQpKTtcbiAgICAgICAgLy8gRmlsdGVyIHRoZSBleHBsb3JhdGlvbiBJRHMgYnkgd2hldGhlciB0aGV5IGFyZSBjb250YWluZWQgd2l0aGluIHRoZVxuICAgICAgICAvLyBzcGVjaWZpZWQgY29sbGVjdGlvbiBzdHJ1Y3R1cmUuXG4gICAgICAgIHJldHVybiBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcy5maWx0ZXIoZnVuY3Rpb24gKGV4cElkKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbi5jb250YWluc0NvbGxlY3Rpb25Ob2RlKGV4cElkKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAvLyBUaGlzIG1ldGhvZCBjb3JyZXNwb25kcyB0byBjb2xsZWN0aW9uX2RvbWFpbi5nZXRfbmV4dF9leHBsb3JhdGlvbl9pZC5cbiAgICBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2UucHJvdG90eXBlLl9nZXROZXh0RXhwbG9yYXRpb25JZCA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjb21wbGV0ZWRJZHMpIHtcbiAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWRzID0gY29sbGVjdGlvbi5nZXRFeHBsb3JhdGlvbklkcygpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4cGxvcmF0aW9uSWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoY29tcGxldGVkSWRzLmluZGV4T2YoZXhwbG9yYXRpb25JZHNbaV0pID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBleHBsb3JhdGlvbklkc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlY29yZHMgdGhhdCB0aGUgc3BlY2lmaWVkIGV4cGxvcmF0aW9uIHdhcyBjb21wbGV0ZWQgaW4gdGhlIGNvbnRleHQgb2ZcbiAgICAgKiB0aGUgc3BlY2lmaWVkIGNvbGxlY3Rpb24sIGFzIGEgZ3Vlc3QuXG4gICAgICovXG4gICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5yZWNvcmRFeHBsb3JhdGlvbkNvbXBsZXRlZEluQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQsIGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgdGhpcy5yZWNvcmRDb21wbGV0ZWRFeHBsb3JhdGlvbihjb2xsZWN0aW9uSWQsIGV4cGxvcmF0aW9uSWQpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBndWVzdCB1c2VyIGhhcyBtYWRlIGFueSBwcm9ncmVzcyB0b3dhcmQgY29tcGxldGluZ1xuICAgICAqIHRoZSBzcGVjaWZpZWQgY29sbGVjdGlvbiBieSBjb21wbGV0aW5nIGF0IGxlYXN0IG9uZSBleHBsb3JhdGlvbiByZWxhdGVkXG4gICAgICogdG8gdGhlIGNvbGxlY3Rpb24uIE5vdGUgdGhhdCB0aGlzIGRvZXMgbm90IGFjY291bnQgZm9yIGFueSBjb21wbGV0ZWRcbiAgICAgKiBleHBsb3JhdGlvbnMgd2hpY2ggYXJlIG5vIGxvbmdlciByZWZlcmVuY2VkIGJ5IHRoZSBjb2xsZWN0aW9uO1xuICAgICAqIGdldENvbXBsZXRlZEV4cGxvcmF0aW9uSWRzKCkgc2hvdWxkIGJlIHVzZWQgZm9yIHRoYXQsIGluc3RlYWQuXG4gICAgICovXG4gICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5oYXNDb21wbGV0ZWRTb21lRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgIHZhciBndWVzdENvbGxlY3Rpb25Qcm9ncmVzcyA9IHRoaXMubG9hZEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzKCk7XG4gICAgICAgIHJldHVybiBndWVzdENvbGxlY3Rpb25Qcm9ncmVzcy5oYXNDb21wbGV0aW9uUHJvZ3Jlc3MoY29sbGVjdGlvbklkKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEdpdmVuIGEgY29sbGVjdGlvbiBvYmplY3QsIHJldHVybnMgdGhlIGxpc3Qgb2YgZXhwbG9yYXRpb24gSURzXG4gICAgICogY29tcGxldGVkIGJ5IHRoZSBndWVzdCB1c2VyLiBUaGUgcmV0dXJuIGxpc3Qgb2YgZXhwbG9yYXRpb24gSURzIHdpbGxcbiAgICAgKiBub3QgaW5jbHVkZSBhbnkgcHJldmlvdXNseSBjb21wbGV0ZWQgZXhwbG9yYXRpb25zIGZvciB0aGUgZ2l2ZW5cbiAgICAgKiBjb2xsZWN0aW9uIHRoYXQgYXJlIG5vIGxvbmdlciBwYXJ0IG9mIHRoZSBjb2xsZWN0aW9uLlxuICAgICAqL1xuICAgIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzU2VydmljZS5wcm90b3R5cGUuZ2V0Q29tcGxldGVkRXhwbG9yYXRpb25JZHMgPSBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRWYWxpZENvbXBsZXRlZEV4cGxvcmF0aW9uSWRzKGNvbGxlY3Rpb24pO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSBjb2xsZWN0aW9uIG9iamVjdCBhIGxpc3Qgb2YgY29tcGxldGVkIGV4cGxvcmF0aW9uIElEcywgcmV0dXJuc1xuICAgICAqIHRoZSBuZXh0IGV4cGxvcmF0aW9uIElEIHRoZSBndWVzdCB1c2VyIGNhbiBwbGF5IGFzIHBhcnQgb2ZcbiAgICAgKiBjb21wbGV0aW5nIHRoZSBjb2xsZWN0aW9uLiBJZiB0aGlzIG1ldGhvZCByZXR1cm5zIG51bGwsIHRoZVxuICAgICAqIGd1ZXN0IGhhcyBjb21wbGV0ZWQgdGhlIGNvbGxlY3Rpb24uXG4gICAgICovXG4gICAgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5nZXROZXh0RXhwbG9yYXRpb25JZCA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0TmV4dEV4cGxvcmF0aW9uSWQoY29sbGVjdGlvbiwgY29tcGxldGVkRXhwbG9yYXRpb25JZHMpO1xuICAgIH07XG4gICAgdmFyIF9hLCBfYjtcbiAgICBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2UgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pLFxuICAgICAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW3R5cGVvZiAoX2EgPSB0eXBlb2YgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NPYmplY3RGYWN0b3J5XzEuR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NPYmplY3RGYWN0b3J5ICE9PSBcInVuZGVmaW5lZFwiICYmIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzT2JqZWN0RmFjdG9yeV8xLkd1ZXN0Q29sbGVjdGlvblByb2dyZXNzT2JqZWN0RmFjdG9yeSkgPT09IFwiZnVuY3Rpb25cIiA/IF9hIDogT2JqZWN0LCB0eXBlb2YgKF9iID0gdHlwZW9mIFdpbmRvd1JlZlNlcnZpY2VfMS5XaW5kb3dSZWYgIT09IFwidW5kZWZpbmVkXCIgJiYgV2luZG93UmVmU2VydmljZV8xLldpbmRvd1JlZikgPT09IFwiZnVuY3Rpb25cIiA/IF9iIDogT2JqZWN0XSlcbiAgICBdLCBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2UpO1xuICAgIHJldHVybiBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2U7XG59KCkpO1xuZXhwb3J0cy5HdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2UgPSBHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2U7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2UnLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzU2VydmljZSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBmb290ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFGb290ZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9vcHBpYV9mb290ZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBzaG93aW5nIGF1dGhvci9zaGFyZSBmb290ZXJcbiAqIGluIGNvbGxlY3Rpb24gcGxheWVyLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvJyArXG4gICAgJ3NoYXJpbmctbGlua3MuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnY29sbGVjdGlvbkZvb3RlcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uLXBsYXllci1wYWdlL2NvbGxlY3Rpb24tZm9vdGVyLycgK1xuICAgICAgICAgICAgICAgICdjb2xsZWN0aW9uLWZvb3Rlci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWydVcmxTZXJ2aWNlJywgZnVuY3Rpb24gKFVybFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb25JZCA9IFVybFNlcnZpY2UuZ2V0Q29sbGVjdGlvbklkRnJvbVVybCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFN0YXRpY0ltYWdlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmw7XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgbG9jYWwgbmF2aWdhdGlvbiBpbiB0aGUgY29sbGVjdGlvbiB2aWV3LlxuICovXG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9SZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25Mb2NhbE5hdicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UvY29sbGVjdGlvbi1sb2NhbC1uYXYvJyArXG4gICAgICAgICAgICAgICAgJ2NvbGxlY3Rpb24tbG9jYWwtbmF2LmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICdSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZScsICdVcmxTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZSwgVXJsU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY29sbGVjdGlvbklkID0gVXJsU2VydmljZS5nZXRDb2xsZWN0aW9uSWRGcm9tVXJsKCk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NvbGxlY3Rpb25Mb2FkZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sbGVjdGlvbkRldGFpbHMgPSAoUmVhZE9ubHlDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UuZ2V0Q29sbGVjdGlvbkRldGFpbHMoY3RybC5jb2xsZWN0aW9uSWQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY2FuRWRpdCA9IGNvbGxlY3Rpb25EZXRhaWxzLmNhbkVkaXQ7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgY29sbGVjdGlvbiBwbGF5ZXIgbmF2YmFyXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL1JlYWRPbmx5Q29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnY29sbGVjdGlvbk5hdmJhcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UvY29sbGVjdGlvbi1uYXZiYXIvJyArXG4gICAgICAgICAgICAgICAgJ2NvbGxlY3Rpb24tbmF2YmFyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICdSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZScsICdVcmxTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZSwgVXJsU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2NvbGxlY3Rpb25Mb2FkZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb25UaXRsZSA9IChSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS5nZXRDb2xsZWN0aW9uRGV0YWlscyhVcmxTZXJ2aWNlLmdldENvbGxlY3Rpb25JZEZyb21VcmwoKSkudGl0bGUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGxlYXJuZXIncyB2aWV3IG9mIGEgY29sbGVjdGlvbi5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICdhdHRyaWJ1dGlvbi1ndWlkZS5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N1bW1hcnktdGlsZS9leHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvblBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9SZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvUGFnZVRpdGxlU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXNlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuYW5pbWF0aW9uKCcub3BwaWEtY29sbGVjdGlvbi1hbmltYXRlLXNsaWRlJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGVudGVyOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5oaWRlKCkuc2xpZGVEb3duKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGxlYXZlOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5zbGlkZVVwKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25QbGF5ZXJQYWdlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLXBsYXllci1wYWdlLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRhbmNob3JTY3JvbGwnLCAnJGh0dHAnLCAnJGxvY2F0aW9uJywgJyRyb290U2NvcGUnLCAnJHNjb3BlJyxcbiAgICAgICAgICAgICAgICAnQWxlcnRzU2VydmljZScsICdDb2xsZWN0aW9uT2JqZWN0RmFjdG9yeScsXG4gICAgICAgICAgICAgICAgJ0NvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3RvcnknLCAnR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnUGFnZVRpdGxlU2VydmljZScsICdSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCAnVXNlclNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdXSElURUxJU1RFRF9DT0xMRUNUSU9OX0lEU19GT1JfU0FWSU5HX0dVRVNUX1BST0dSRVNTJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJGFuY2hvclNjcm9sbCwgJGh0dHAsICRsb2NhdGlvbiwgJHJvb3RTY29wZSwgJHNjb3BlLCBBbGVydHNTZXJ2aWNlLCBDb2xsZWN0aW9uT2JqZWN0RmFjdG9yeSwgQ29sbGVjdGlvblBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeSwgR3Vlc3RDb2xsZWN0aW9uUHJvZ3Jlc3NTZXJ2aWNlLCBQYWdlVGl0bGVTZXJ2aWNlLCBSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFVybFNlcnZpY2UsIFVzZXJTZXJ2aWNlLCBXSElURUxJU1RFRF9DT0xMRUNUSU9OX0lEU19GT1JfU0FWSU5HX0dVRVNUX1BST0dSRVNTKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdMb2FkaW5nJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jb2xsZWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jb2xsZWN0aW9uUGxheXRocm91Z2ggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb25JZCA9IFVybFNlcnZpY2UuZ2V0Q29sbGVjdGlvbklkRnJvbVVybCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cGxvcmF0aW9uQ2FyZElzU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRTdGF0aWNJbWFnZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsO1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgcGF0aEljb25QYXJhbWV0ZXJzIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGNvLW9yZGluYXRlcyxcbiAgICAgICAgICAgICAgICAgICAgLy8gYmFja2dyb3VuZCBjb2xvciBhbmQgaWNvbiB1cmwgZm9yIHRoZSBpY29ucyBnZW5lcmF0ZWQgb24gdGhlIHBhdGguXG4gICAgICAgICAgICAgICAgICAgIGN0cmwucGF0aEljb25QYXJhbWV0ZXJzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYWN0aXZlSGlnaGxpZ2h0ZWRJY29uSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5NSU5fSEVJR0hUX0ZPUl9QQVRIX1NWR19QWCA9IDIyMDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5PRERfU1ZHX0hFSUdIVF9PRkZTRVRfUFggPSAxNTA7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuRVZFTl9TVkdfSEVJR0hUX09GRlNFVF9QWCA9IDI4MDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5JQ09OX1lfSU5JVElBTF9QWCA9IDM1O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLklDT05fWV9JTkNSRU1FTlRfUFggPSAxMTA7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuSUNPTl9YX01JRERMRV9QWCA9IDIyNTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5JQ09OX1hfTEVGVF9QWCA9IDU1O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLklDT05fWF9SSUdIVF9QWCA9IDM5NTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zdmdIZWlnaHQgPSBjdHJsLk1JTl9IRUlHSFRfRk9SX1BBVEhfU1ZHX1BYO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm5leHRFeHBsb3JhdGlvbklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC53aGl0ZWxpc3RlZENvbGxlY3Rpb25JZHNGb3JHdWVzdFByb2dyZXNzID0gKFdISVRFTElTVEVEX0NPTExFQ1RJT05fSURTX0ZPUl9TQVZJTkdfR1VFU1RfUFJPR1JFU1MpO1xuICAgICAgICAgICAgICAgICAgICAkYW5jaG9yU2Nyb2xsLnlPZmZzZXQgPSAtODA7XG4gICAgICAgICAgICAgICAgICAgICRodHRwLmdldCgnL2NvbGxlY3Rpb25faGFuZGxlci9kYXRhLycgKyBjdHJsLmNvbGxlY3Rpb25JZCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudCgnbWV0YVtpdGVtcHJvcD1cIm5hbWVcIl0nKS5hdHRyKCdjb250ZW50JywgcmVzcG9uc2UubWV0YV9uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudCgnbWV0YVtpdGVtcHJvcD1cImRlc2NyaXB0aW9uXCJdJykuYXR0cignY29udGVudCcsIHJlc3BvbnNlLm1ldGFfZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50JywgcmVzcG9uc2UubWV0YV9uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudCgnbWV0YVtwcm9wZXJ0eT1cIm9nOmRlc2NyaXB0aW9uXCJdJykuYXR0cignY29udGVudCcsIHJlc3BvbnNlLm1ldGFfZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRJY29uSGlnaGxpZ2h0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2ZUhpZ2hsaWdodGVkSWNvbkluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudW5zZXRJY29uSGlnaGxpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVIaWdobGlnaHRlZEljb25JbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnRvZ2dsZVByZXZpZXdDYXJkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5leHBsb3JhdGlvbkNhcmRJc1Nob3duID0gIWN0cmwuZXhwbG9yYXRpb25DYXJkSXNTaG93bjtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRDb2xsZWN0aW9uTm9kZUZvckV4cGxvcmF0aW9uSWQgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25Ob2RlID0gKGN0cmwuY29sbGVjdGlvbi5nZXRDb2xsZWN0aW9uTm9kZUJ5RXhwbG9yYXRpb25JZChleHBsb3JhdGlvbklkKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb25Ob2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdUaGVyZSB3YXMgYW4gZXJyb3IgbG9hZGluZyB0aGUgY29sbGVjdGlvbi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uTm9kZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXROZXh0UmVjb21tZW5kZWRDb2xsZWN0aW9uTm9kZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3RybC5nZXRDb2xsZWN0aW9uTm9kZUZvckV4cGxvcmF0aW9uSWQoY3RybC5jb2xsZWN0aW9uUGxheXRocm91Z2guZ2V0TmV4dEV4cGxvcmF0aW9uSWQoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0Q29tcGxldGVkRXhwbG9yYXRpb25Ob2RlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHJsLmdldENvbGxlY3Rpb25Ob2RlRm9yRXhwbG9yYXRpb25JZChjdHJsLmNvbGxlY3Rpb25QbGF5dGhyb3VnaC5nZXRDb21wbGV0ZWRFeHBsb3JhdGlvbklkcygpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXROb25SZWNvbW1lbmRlZENvbGxlY3Rpb25Ob2RlQ291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3RybC5jb2xsZWN0aW9uLmdldENvbGxlY3Rpb25Ob2RlQ291bnQoKSAtIChjdHJsLmNvbGxlY3Rpb25QbGF5dGhyb3VnaC5nZXROZXh0UmVjb21tZW5kZWRDb2xsZWN0aW9uTm9kZUNvdW50KCkgKyBjdHJsLmNvbGxlY3Rpb25QbGF5dGhyb3VnaC5nZXRDb21wbGV0ZWRFeHBsb3JhdGlvbk5vZGVDb3VudCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC51cGRhdGVFeHBsb3JhdGlvblByZXZpZXcgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5leHBsb3JhdGlvbkNhcmRJc1Nob3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY3VycmVudEV4cGxvcmF0aW9uSWQgPSBleHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdW1tYXJ5VG9QcmV2aWV3ID0gY3RybC5nZXRDb2xsZWN0aW9uTm9kZUZvckV4cGxvcmF0aW9uSWQoZXhwbG9yYXRpb25JZCkuZ2V0RXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZXMgdGhlIFNWRyBwYXJhbWV0ZXJzIHJlcXVpcmVkIHRvIGRyYXcgdGhlIGN1cnZlZCBwYXRoLlxuICAgICAgICAgICAgICAgICAgICBjdHJsLmdlbmVyYXRlUGF0aFBhcmFtZXRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgcGF0aFN2Z1BhcmFtZXRlcnMgcmVwcmVzZW50cyB0aGUgZmluYWwgc3RyaW5nIG9mIFNWR1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyYW1ldGVycyBmb3IgdGhlIGJlemllciBjdXJ2ZSB0byBiZSBnZW5lcmF0ZWQuIFRoZSBkZWZhdWx0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJhbWV0ZXJzIHJlcHJlc2VudCB0aGUgZmlyc3QgY3VydmUgaWUuIGxlc3NvbiAxIHRvIGxlc3NvbiAzLlxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wYXRoU3ZnUGFyYW1ldGVycyA9ICdNMjUwIDgwICBDIDQ3MCAxMDAsIDQ3MCAyODAsIDI1MCAzMDAnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25Ob2RlQ291bnQgPSBjdHJsLmNvbGxlY3Rpb24uZ2V0Q29sbGVjdGlvbk5vZGVDb3VudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHNQYXJhbWV0ZXJFeHRlbnNpb24gcmVwcmVzZW50cyB0aGUgY28tb3JkaW5hdGVzIGZvbGxvd2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlICdTJyAoc21vb3RoIGN1cnZlIHRvKSBjb21tYW5kIGluIFNWRy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzUGFyYW1ldGVyRXh0ZW5zaW9uID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnBhdGhJY29uUGFyYW1ldGVycyA9IGN0cmwuZ2VuZXJhdGVQYXRoSWNvblBhcmFtZXRlcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2xsZWN0aW9uTm9kZUNvdW50ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wYXRoU3ZnUGFyYW1ldGVycyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY29sbGVjdGlvbk5vZGVDb3VudCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucGF0aFN2Z1BhcmFtZXRlcnMgPSAnTTI1MCA4MCAgQyA0NzAgMTAwLCA0NzAgMjgwLCAyNTAgMzAwJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSB4IGFuZCB5IGhlcmUgcmVwcmVzZW50IHRoZSBjby1vcmRpbmF0ZXMgb2YgdGhlIGNvbnRyb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwb2ludHMgZm9yIHRoZSBiZXppZXIgY3VydmUgKHBhdGgpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5ID0gNTAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgTWF0aC5mbG9vcihjb2xsZWN0aW9uTm9kZUNvdW50IC8gMik7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IChpICUgMikgPyAzMCA6IDQ3MDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc1BhcmFtZXRlckV4dGVuc2lvbiArPSB4ICsgJyAnICsgeSArICcsICc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgKz0gMjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNQYXJhbWV0ZXJFeHRlbnNpb24gKz0gMjUwICsgJyAnICsgeSArICcsICc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgKz0gMjAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc1BhcmFtZXRlckV4dGVuc2lvbiAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wYXRoU3ZnUGFyYW1ldGVycyArPSAnIFMgJyArIHNQYXJhbWV0ZXJFeHRlbnNpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbGxlY3Rpb25Ob2RlQ291bnQgJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbGxlY3Rpb25Ob2RlQ291bnQgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdmdIZWlnaHQgPSBjdHJsLk1JTl9IRUlHSFRfRk9SX1BBVEhfU1ZHX1BYO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdmdIZWlnaHQgPSB5IC0gY3RybC5FVkVOX1NWR19IRUlHSFRfT0ZGU0VUX1BYO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2xsZWN0aW9uTm9kZUNvdW50ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc3ZnSGVpZ2h0ID0gY3RybC5NSU5fSEVJR0hUX0ZPUl9QQVRIX1NWR19QWDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc3ZnSGVpZ2h0ID0geSAtIGN0cmwuT0REX1NWR19IRUlHSFRfT0ZGU0VUX1BYO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZW5lcmF0ZVBhdGhJY29uUGFyYW1ldGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xsZWN0aW9uTm9kZXMgPSBjdHJsLmNvbGxlY3Rpb24uZ2V0Q29sbGVjdGlvbk5vZGVzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWNvblBhcmFtZXRlcnNBcnJheSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWNvblBhcmFtZXRlcnNBcnJheS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHVtYm5haWxJY29uVXJsOiBjb2xsZWN0aW9uTm9kZXNbMF0uZ2V0RXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0KCkudGh1bWJuYWlsX2ljb25fdXJsLnJlcGxhY2UoJ3N1YmplY3RzJywgJ2ludmVydGVkX3N1YmplY3RzJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogJzIyNXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6ICczNXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHVtYm5haWxCZ0NvbG9yOiBjb2xsZWN0aW9uTm9kZXNbMF0uZ2V0RXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0KCkudGh1bWJuYWlsX2JnX2NvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhlcmUgeCBhbmQgeSByZXByZXNlbnQgdGhlIGNvLW9yZGluYXRlcyBmb3IgdGhlIGljb25zIGluIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGF0aC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4ID0gY3RybC5JQ09OX1hfTUlERExFX1BYO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHkgPSBjdHJsLklDT05fWV9JTklUSUFMX1BYO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvdW50TWlkZGxlSWNvbiA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGN0cmwuY29sbGVjdGlvbi5nZXRDb2xsZWN0aW9uTm9kZUNvdW50KCk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb3VudE1pZGRsZUljb24gPT09IDAgJiYgeCA9PT0gY3RybC5JQ09OX1hfTUlERExFX1BYKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSBjdHJsLklDT05fWF9MRUZUX1BYO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ICs9IGN0cmwuSUNPTl9ZX0lOQ1JFTUVOVF9QWDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnRNaWRkbGVJY29uID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY291bnRNaWRkbGVJY29uID09PSAxICYmIHggPT09IGN0cmwuSUNPTl9YX01JRERMRV9QWCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ID0gY3RybC5JQ09OX1hfUklHSFRfUFg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgKz0gY3RybC5JQ09OX1lfSU5DUkVNRU5UX1BYO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudE1pZGRsZUljb24gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGN0cmwuSUNPTl9YX01JRERMRV9QWDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeSArPSBjdHJsLklDT05fWV9JTkNSRU1FTlRfUFg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb25QYXJhbWV0ZXJzQXJyYXkucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbEljb25Vcmw6IGNvbGxlY3Rpb25Ob2Rlc1tpXS5nZXRFeHBsb3JhdGlvblN1bW1hcnlPYmplY3QoKS50aHVtYm5haWxfaWNvbl91cmwucmVwbGFjZSgnc3ViamVjdHMnLCAnaW52ZXJ0ZWRfc3ViamVjdHMnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogeCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogeSArICdweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbEJnQ29sb3I6IGNvbGxlY3Rpb25Ob2Rlc1tpXS5nZXRFeHBsb3JhdGlvblN1bW1hcnlPYmplY3QoKS50aHVtYm5haWxfYmdfY29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpY29uUGFyYW1ldGVyc0FycmF5O1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldEV4cGxvcmF0aW9uVXJsID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoJy9leHBsb3JlLycgKyBleHBsb3JhdGlvbklkICsgJz9jb2xsZWN0aW9uX2lkPScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY29sbGVjdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRFeHBsb3JhdGlvblRpdGxlUG9zaXRpb24gPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCAlIDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzhweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgoaW5kZXggKyAxKSAlIDIgPT09IDAgJiYgKGluZGV4ICsgMSkgJSA0ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICczMHB4JztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKChpbmRleCArIDEpICUgNCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnLTQwcHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkaHR0cC5nZXQoJy9jb2xsZWN0aW9uc3VtbWFyaWVzaGFuZGxlci9kYXRhJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5naWZpZWRfY29sbGVjdGlvbl9pZHM6IEpTT04uc3RyaW5naWZ5KFtjdHJsLmNvbGxlY3Rpb25JZF0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb25TdW1tYXJ5ID0gcmVzcG9uc2UuZGF0YS5zdW1tYXJpZXNbMF07XG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnVGhlcmUgd2FzIGFuIGVycm9yIHdoaWxlIGZldGNoaW5nIHRoZSBjb2xsZWN0aW9uIHN1bW1hcnkuJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBMb2FkIHRoZSBjb2xsZWN0aW9uIHRoZSBsZWFybmVyIHdhbnRzIHRvIHZpZXcuXG4gICAgICAgICAgICAgICAgICAgIFJlYWRPbmx5Q29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLmxvYWRDb2xsZWN0aW9uKGN0cmwuY29sbGVjdGlvbklkKS50aGVuKGZ1bmN0aW9uIChjb2xsZWN0aW9uQmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2xsZWN0aW9uID0gQ29sbGVjdGlvbk9iamVjdEZhY3RvcnkuY3JlYXRlKGNvbGxlY3Rpb25CYWNrZW5kT2JqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnY29sbGVjdGlvbkxvYWRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgUGFnZVRpdGxlU2VydmljZS5zZXRQYWdlVGl0bGUoY3RybC5jb2xsZWN0aW9uLmdldFRpdGxlKCkgKyAnIC0gT3BwaWEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIExvYWQgdGhlIHVzZXIncyBjdXJyZW50IHByb2dyZXNzIGluIHRoZSBjb2xsZWN0aW9uLiBJZiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVzZXIgaXMgYSBndWVzdCwgdGhlbiBlaXRoZXIgdGhlIGRlZmF1bHRzIGZyb20gdGhlIHNlcnZlciB3aWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBiZSB1c2VkIG9yIHRoZSB1c2VyJ3MgbG9jYWwgcHJvZ3Jlc3MsIGlmIGFueSBoYXMgYmVlbiBtYWRlIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxlY3Rpb24gaXMgd2hpdGVsaXN0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sbGVjdGlvbkFsbG93c0d1ZXN0UHJvZ3Jlc3MgPSAoY3RybC53aGl0ZWxpc3RlZENvbGxlY3Rpb25JZHNGb3JHdWVzdFByb2dyZXNzLmluZGV4T2YoY3RybC5jb2xsZWN0aW9uSWQpICE9PSAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCkudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc0xvZ2dlZEluID0gdXNlckluZm8uaXNMb2dnZWRJbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3RybC5pc0xvZ2dlZEluICYmIGNvbGxlY3Rpb25BbGxvd3NHdWVzdFByb2dyZXNzICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEd1ZXN0Q29sbGVjdGlvblByb2dyZXNzU2VydmljZS5oYXNDb21wbGV0ZWRTb21lRXhwbG9yYXRpb24oY3RybC5jb2xsZWN0aW9uSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcyA9IChHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2UuZ2V0Q29tcGxldGVkRXhwbG9yYXRpb25JZHMoY3RybC5jb2xsZWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXh0RXhwbG9yYXRpb25JZCA9IChHdWVzdENvbGxlY3Rpb25Qcm9ncmVzc1NlcnZpY2UuZ2V0TmV4dEV4cGxvcmF0aW9uSWQoY3RybC5jb2xsZWN0aW9uLCBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb25QbGF5dGhyb3VnaCA9IChDb2xsZWN0aW9uUGxheXRocm91Z2hPYmplY3RGYWN0b3J5LmNyZWF0ZShuZXh0RXhwbG9yYXRpb25JZCwgY29tcGxldGVkRXhwbG9yYXRpb25JZHMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY29sbGVjdGlvblBsYXl0aHJvdWdoID0gKENvbGxlY3Rpb25QbGF5dGhyb3VnaE9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmRPYmplY3QoY29sbGVjdGlvbkJhY2tlbmRPYmplY3QucGxheXRocm91Z2hfZGljdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm5leHRFeHBsb3JhdGlvbklkID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2xsZWN0aW9uUGxheXRocm91Z2guZ2V0TmV4dEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzQ29tcGxldGVkRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29tcGxldGVkRXhwbG9yYXRpb25JZHMgPSAoY3RybC5jb2xsZWN0aW9uUGxheXRocm91Z2guZ2V0Q29tcGxldGVkRXhwbG9yYXRpb25JZHMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcy5pbmRleE9mKGV4cGxvcmF0aW9uSWQpID4gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPKGJoZW5uaW5nKTogSGFuZGxlIG5vdCBiZWluZyBhYmxlIHRvIGxvYWQgdGhlIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOT1RFIFRPIERFVkVMT1BFUlM6IENoZWNrIHRoZSBiYWNrZW5kIGNvbnNvbGUgZm9yIGFuIGluZGljYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzIHRvIHdoeSB0aGlzIGVycm9yIG9jY3VycmVkOyBzb21ldGltZXMgdGhlIGVycm9ycyBhcmUgbm9pc3ksXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyB0aGV5IGFyZSBub3Qgc2hvd24gdG8gdGhlIHVzZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1RoZXJlIHdhcyBhbiBlcnJvciBsb2FkaW5nIHRoZSBjb2xsZWN0aW9uLicpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgnJGN0cmwuY29sbGVjdGlvbicsIGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5nZW5lcmF0ZVBhdGhQYXJhbWV0ZXJzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNjcm9sbFRvTG9jYXRpb24gPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRsb2NhdGlvbi5oYXNoKGlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhbmNob3JTY3JvbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jbG9zZU9uQ2xpY2tpbmdPdXRzaWRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5leHBsb3JhdGlvbkNhcmRJc1Nob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwub25DbGlja1N0b3BQcm9wYWdhdGlvbiA9IGZ1bmN0aW9uICgkZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBUb3VjaGluZyBhbnl3aGVyZSBvdXRzaWRlIHRoZSBtb2JpbGUgcHJldmlldyBzaG91bGQgaGlkZSBpdC5cbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLmV4cGxvcmF0aW9uQ2FyZElzU2hvd24gPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cGxvcmF0aW9uQ2FyZElzU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBjb2xsZWN0aW9uIHBsYXllciBwYWdlLlxuICovXG5yZXF1aXJlKFwiY29yZS1qcy9lczcvcmVmbGVjdFwiKTtcbnJlcXVpcmUoXCJ6b25lLmpzXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGh0dHBfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb21tb24vaHR0cFwiKTtcbi8vIFRoaXMgY29tcG9uZW50IGlzIG5lZWRlZCB0byBmb3JjZS1ib290c3RyYXAgQW5ndWxhciBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZVxuLy8gYXBwLlxudmFyIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCgpIHtcbiAgICB9XG4gICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuQ29tcG9uZW50KHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnc2VydmljZS1ib290c3RyYXAnLFxuICAgICAgICAgICAgdGVtcGxhdGU6ICcnXG4gICAgICAgIH0pXG4gICAgXSwgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCk7XG4gICAgcmV0dXJuIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQ7XG59KCkpO1xuZXhwb3J0cy5TZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbnZhciBhcHBfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiYXBwLmNvbnN0YW50c1wiKTtcbnZhciBpbnRlcmFjdGlvbnNfZXh0ZW5zaW9uX2NvbnN0YW50c18xID0gcmVxdWlyZShcImludGVyYWN0aW9ucy9pbnRlcmFjdGlvbnMtZXh0ZW5zaW9uLmNvbnN0YW50c1wiKTtcbnZhciBvYmplY3RzX2RvbWFpbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJkb21haW4vb2JqZWN0cy9vYmplY3RzLWRvbWFpbi5jb25zdGFudHNcIik7XG52YXIgQ29sbGVjdGlvblBsYXllclBhZ2VNb2R1bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29sbGVjdGlvblBsYXllclBhZ2VNb2R1bGUoKSB7XG4gICAgfVxuICAgIC8vIEVtcHR5IHBsYWNlaG9sZGVyIG1ldGhvZCB0byBzYXRpc2Z5IHRoZSBgQ29tcGlsZXJgLlxuICAgIENvbGxlY3Rpb25QbGF5ZXJQYWdlTW9kdWxlLnByb3RvdHlwZS5uZ0RvQm9vdHN0cmFwID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIENvbGxlY3Rpb25QbGF5ZXJQYWdlTW9kdWxlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5OZ01vZHVsZSh7XG4gICAgICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgICAgICAgcGxhdGZvcm1fYnJvd3Nlcl8xLkJyb3dzZXJNb2R1bGUsXG4gICAgICAgICAgICAgICAgaHR0cF8xLkh0dHBDbGllbnRNb2R1bGVcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZW50cnlDb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICAgICAgICAgIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25zX2V4dGVuc2lvbl9jb25zdGFudHNfMS5JbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xLk9iamVjdHNEb21haW5Db25zdGFudHMsXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pXG4gICAgXSwgQ29sbGVjdGlvblBsYXllclBhZ2VNb2R1bGUpO1xuICAgIHJldHVybiBDb2xsZWN0aW9uUGxheWVyUGFnZU1vZHVsZTtcbn0oKSk7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl9keW5hbWljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljXCIpO1xudmFyIHN0YXRpY18yID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGJvb3RzdHJhcEZuID0gZnVuY3Rpb24gKGV4dHJhUHJvdmlkZXJzKSB7XG4gICAgdmFyIHBsYXRmb3JtUmVmID0gcGxhdGZvcm1fYnJvd3Nlcl9keW5hbWljXzEucGxhdGZvcm1Ccm93c2VyRHluYW1pYyhleHRyYVByb3ZpZGVycyk7XG4gICAgcmV0dXJuIHBsYXRmb3JtUmVmLmJvb3RzdHJhcE1vZHVsZShDb2xsZWN0aW9uUGxheWVyUGFnZU1vZHVsZSk7XG59O1xudmFyIGRvd25ncmFkZWRNb2R1bGUgPSBzdGF0aWNfMi5kb3duZ3JhZGVNb2R1bGUoYm9vdHN0cmFwRm4pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJywgW1xuICAgICdkbmRMaXN0cycsICdoZWFkcm9vbScsICdpbmZpbml0ZS1zY3JvbGwnLCAnbmdBbmltYXRlJyxcbiAgICAnbmdBdWRpbycsICduZ0Nvb2tpZXMnLCAnbmdJbWdDcm9wJywgJ25nSm95UmlkZScsICduZ01hdGVyaWFsJyxcbiAgICAnbmdSZXNvdXJjZScsICduZ1Nhbml0aXplJywgJ25nVG91Y2gnLCAncGFzY2FscHJlY2h0LnRyYW5zbGF0ZScsXG4gICAgJ3RvYXN0cicsICd1aS5ib290c3RyYXAnLCAndWkuc29ydGFibGUnLCAndWkudHJlZScsICd1aS52YWxpZGF0ZScsXG4gICAgZG93bmdyYWRlZE1vZHVsZVxuXSlcbiAgICAvLyBUaGlzIGRpcmVjdGl2ZSBpcyB0aGUgZG93bmdyYWRlZCB2ZXJzaW9uIG9mIHRoZSBBbmd1bGFyIGNvbXBvbmVudCB0b1xuICAgIC8vIGJvb3RzdHJhcCB0aGUgQW5ndWxhciA4LlxuICAgIC5kaXJlY3RpdmUoJ3NlcnZpY2VCb290c3RyYXAnLCBzdGF0aWNfMS5kb3duZ3JhZGVDb21wb25lbnQoe1xuICAgIGNvbXBvbmVudDogU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxufSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmVzIHJlcXVpcmVkIGluIGNvbGxlY3Rpb24gcGxheWVyLlxuICovXG4vLyBUaGUgbW9kdWxlIG5lZWRzIHRvIGJlIGxvYWRlZCBiZWZvcmUgZXZlcnl0aGluZyBlbHNlIHNpbmNlIGl0IGRlZmluZXMgdGhlXG4vLyBtYWluIG1vZHVsZSB0aGUgZWxlbWVudHMgYXJlIGF0dGFjaGVkIHRvLlxucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLXBsYXllci1wYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgnQXBwLnRzJyk7XG5yZXF1aXJlKCdiYXNlX2NvbXBvbmVudHMvQmFzZUNvbnRlbnREaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UvY29sbGVjdGlvbi1mb290ZXIvJyArXG4gICAgJ2NvbGxlY3Rpb24tZm9vdGVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLWxvY2FsLW5hdi8nICtcbiAgICAnY29sbGVjdGlvbi1sb2NhbC1uYXYuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLXBsYXllci1wYWdlL2NvbGxlY3Rpb24tbmF2YmFyLycgK1xuICAgICdjb2xsZWN0aW9uLW5hdmJhci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb24tcGxheWVyLXBhZ2UvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS5kaXJlY3RpdmUudHMnKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byB3cmFwIHRoZSB3aW5kb3cgb2JqZWN0LlxuICovXG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgV2luZG93UmVmID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFdpbmRvd1JlZigpIHtcbiAgICB9XG4gICAgV2luZG93UmVmLnByb3RvdHlwZS5fd2luZG93ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyByZXR1cm4gdGhlIGdsb2JhbCBuYXRpdmUgYnJvd3NlciB3aW5kb3cgb2JqZWN0XG4gICAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoV2luZG93UmVmLnByb3RvdHlwZSwgXCJuYXRpdmVXaW5kb3dcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93aW5kb3coKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgV2luZG93UmVmID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIFdpbmRvd1JlZik7XG4gICAgcmV0dXJuIFdpbmRvd1JlZjtcbn0oKSk7XG5leHBvcnRzLldpbmRvd1JlZiA9IFdpbmRvd1JlZjtcbiJdLCJzb3VyY2VSb290IjoiIn0=