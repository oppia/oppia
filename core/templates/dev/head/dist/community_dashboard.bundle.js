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
/******/ 		"community_dashboard": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","community_dashboard~library~preferences"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/AppInit.ts":
/*!********************************************!*\
  !*** ./core/templates/dev/head/AppInit.ts ***!
  \********************************************/
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
 * @fileoverview File for initializing the main oppia module.
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
var MainAngularModule = /** @class */ (function () {
    function MainAngularModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    MainAngularModule.prototype.ngDoBootstrap = function () { };
    MainAngularModule = __decorate([
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
        })
    ], MainAngularModule);
    return MainAngularModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(MainAngularModule);
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

/***/ "./core/templates/dev/head/components/common-layout-directives/common-elements/lazy-loading.directive.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-elements/lazy-loading.directive.ts ***!
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
 * @fileoverview Directive for displaying animated lazy loading container.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('lazyLoading', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/common-elements/' +
                'lazy-loading.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/ExplorationDraftObjectFactory.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/ExplorationDraftObjectFactory.ts ***!
  \*************************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating instances of ExplorationDraft
 * domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var ExplorationDraft = /** @class */ (function () {
    function ExplorationDraft(draftChanges, draftChangeListId) {
        this.draftChanges = draftChanges;
        this.draftChangeListId = draftChangeListId;
    }
    /**
     * Checks whether the draft object has been overwritten by another
     * draft which has been committed to the back-end. If the supplied draft id
     * has a different value then a newer changeList must have been committed
     * to the back-end.
     * @param {Integer} - currentDraftId. The id of the draft changes whch was
     *  retrieved from the back-end.
     * @returns {Boolean} - True iff the currentDraftId is the same as the
     * draftChangeListId corresponding to this draft.
     */
    ExplorationDraft.prototype.isValid = function (currentDraftId) {
        return (currentDraftId === this.draftChangeListId);
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been typed
    // as 'any' since 'draftChanges' is an array of dicts with possible
    // underscore_cased keys. A thorough check needs to be done to assure of
    // its exact type.
    ExplorationDraft.prototype.getChanges = function () {
        return this.draftChanges;
    };
    return ExplorationDraft;
}());
exports.ExplorationDraft = ExplorationDraft;
var ExplorationDraftObjectFactory = /** @class */ (function () {
    function ExplorationDraftObjectFactory() {
    }
    ExplorationDraftObjectFactory.prototype.createFromLocalStorageDict = function (explorationDraftDict) {
        return new ExplorationDraft(explorationDraftDict.draftChanges, explorationDraftDict.draftChangeListId);
    };
    ExplorationDraftObjectFactory.prototype.toLocalStorageDict = function (
    // TODO(#7165): Replace 'any' with the exact type. This has been typed
    // as 'any' since 'changeList' is an array of dicts with possible
    // underscore_cased keys. A thorough check needs to be done to assure of
    // its exact type.
    changeList, draftChangeListId) {
        return {
            draftChanges: changeList,
            draftChangeListId: draftChangeListId
        };
    };
    ExplorationDraftObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], ExplorationDraftObjectFactory);
    return ExplorationDraftObjectFactory;
}());
exports.ExplorationDraftObjectFactory = ExplorationDraftObjectFactory;
angular.module('oppia').factory('ExplorationDraftObjectFactory', static_1.downgradeInjectable(ExplorationDraftObjectFactory));


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

/***/ "./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.constants.ajs.ts":
/*!**********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.constants.ajs.ts ***!
  \**********************************************************************************************************/
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
 * @fileoverview Constants to be used in the community dashboard page.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var community_dashboard_page_constants_ts_1 = __webpack_require__(/*! pages/community-dashboard-page/community-dashboard-page.constants.ts */ "./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.constants.ts");
angular.module('oppia').constant('COMMUNITY_DASHBOARD_TABS_DETAILS', community_dashboard_page_constants_ts_1.CommunityDashboardConstants.COMMUNITY_DASHBOARD_TABS_DETAILS);
angular.module('oppia').constant('DEFAULT_OPPORTUNITY_LANGUAGE_CODE', community_dashboard_page_constants_ts_1.CommunityDashboardConstants.DEFAULT_OPPORTUNITY_LANGUAGE_CODE);


/***/ }),

/***/ "./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.constants.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.constants.ts ***!
  \******************************************************************************************************/
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
 * @fileoverview Constants for the creator dashboard page.
 */
var CommunityDashboardConstants = /** @class */ (function () {
    function CommunityDashboardConstants() {
    }
    CommunityDashboardConstants.COMMUNITY_DASHBOARD_TABS_DETAILS = {
        myContributionTab: {
            ariaLabel: 'Check your contributions.',
            tabName: 'My contribution',
            description: '',
            customizationOptions: []
        },
        questionTab: {
            ariaLabel: 'See opportunities for adding new questions.',
            tabName: 'Submit Question',
            description: 'Provide question in a topic of your choice for ' +
                'students to answer.',
            customizationOptions: ['sort']
        },
        translationTab: {
            ariaLabel: 'See opportunities for translation.',
            tabName: 'Translate Text',
            description: 'Translate the text in the lessons to break the ' +
                'language barrier for non-English speaker.',
            customizationOptions: ['language', 'sort']
        },
        voiceoverTab: {
            ariaLabel: 'See opportunities for voiceover.',
            tabName: 'Voiceover',
            description: 'Create voiceover in a language of your own choice ' +
                'to give user a full experience.',
            customizationOptions: ['language', 'sort']
        },
        artTab: {
            ariaLabel: 'See opportunities for art.',
            tabName: 'Submit art',
            description: 'Design digital art that makes the lessons even ' +
                'more engaging.',
            customizationOptions: ['sort']
        }
    };
    CommunityDashboardConstants.DEFAULT_OPPORTUNITY_LANGUAGE_CODE = 'hi';
    return CommunityDashboardConstants;
}());
exports.CommunityDashboardConstants = CommunityDashboardConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.controller.ts":
/*!*******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.controller.ts ***!
  \*******************************************************************************************************/
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
 * @fileoverview Directive for the community dashboard page.
 */
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! components/common-layout-directives/common-elements/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts");
__webpack_require__(/*! pages/community-dashboard-page/translation-opportunities/translation-opportunities.directive.ts */ "./core/templates/dev/head/pages/community-dashboard-page/translation-opportunities/translation-opportunities.directive.ts");
__webpack_require__(/*! pages/community-dashboard-page/voiceover-opportunities/voiceover-opportunities.directive.ts */ "./core/templates/dev/head/pages/community-dashboard-page/voiceover-opportunities/voiceover-opportunities.directive.ts");
__webpack_require__(/*! domain/utilities/LanguageUtilService.ts */ "./core/templates/dev/head/domain/utilities/LanguageUtilService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/LocalStorageService.ts */ "./core/templates/dev/head/services/LocalStorageService.ts");
__webpack_require__(/*! pages/community-dashboard-page/community-dashboard-page.constants.ajs.ts */ "./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.constants.ajs.ts");
angular.module('oppia').directive('communityDashboardPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/community-dashboard-page/' +
                'community-dashboard-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$window', 'LanguageUtilService', 'LocalStorageService',
                'TranslationLanguageService', 'COMMUNITY_DASHBOARD_TABS_DETAILS',
                'DEFAULT_OPPORTUNITY_LANGUAGE_CODE',
                function ($window, LanguageUtilService, LocalStorageService, TranslationLanguageService, COMMUNITY_DASHBOARD_TABS_DETAILS, DEFAULT_OPPORTUNITY_LANGUAGE_CODE) {
                    var ctrl = this;
                    var prevSelectedLanguageCode = (LocalStorageService.getLastSelectedTranslationLanguageCode());
                    var allAudioLanguageCodes = LanguageUtilService
                        .getAllVoiceoverLanguageCodes();
                    ctrl.languageCodesAndDescriptions = (allAudioLanguageCodes.map(function (languageCode) {
                        return {
                            id: languageCode,
                            description: (LanguageUtilService.getAudioLanguageDescription(languageCode))
                        };
                    }));
                    ctrl.languageCode = (allAudioLanguageCodes.indexOf(prevSelectedLanguageCode) !== -1 ?
                        prevSelectedLanguageCode : DEFAULT_OPPORTUNITY_LANGUAGE_CODE);
                    TranslationLanguageService.setActiveLanguageCode(ctrl.languageCode);
                    ctrl.onChangeLanguage = function () {
                        TranslationLanguageService.setActiveLanguageCode(ctrl.languageCode);
                        LocalStorageService.updateLastSelectedTranslationLanguageCode(ctrl.languageCode);
                    };
                    ctrl.showLanguageSelector = function () {
                        var activeTabDetail = ctrl.tabsDetails[ctrl.activeTabName];
                        return (activeTabDetail.customizationOptions.indexOf('language') !== -1);
                    };
                    ctrl.activeTabName = 'myContributionTab';
                    ctrl.tabsDetails = COMMUNITY_DASHBOARD_TABS_DETAILS;
                    ctrl.OPPIA_AVATAR_IMAGE_URL = (UrlInterpolationService.getStaticImageUrl('/avatar/oppia_avatar_100px.svg'));
                    ctrl.onTabClick = function (activeTabName) {
                        ctrl.activeTabName = activeTabName;
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.scripts.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.scripts.ts ***!
  \****************************************************************************************************/
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
 * @fileoverview Directive scripts for the community dashboard page.
 */
__webpack_require__(/*! AppInit.ts */ "./core/templates/dev/head/AppInit.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! pages/community-dashboard-page/community-dashboard-page.controller.ts */ "./core/templates/dev/head/pages/community-dashboard-page/community-dashboard-page.controller.ts");


/***/ }),

/***/ "./core/templates/dev/head/pages/community-dashboard-page/opportunities-list-item/opportunities-list-item.directive.ts":
/*!*****************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/community-dashboard-page/opportunities-list-item/opportunities-list-item.directive.ts ***!
  \*****************************************************************************************************************************/
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
 * @fileoverview Directive for the item view of an opportunity.
 */
__webpack_require__(/*! components/common-layout-directives/common-elements/lazy-loading.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/lazy-loading.directive.ts");
angular.module('oppia').directive('opportunitiesListItem', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getOpportunity: '&opportunity',
            },
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/community-dashboard-page/opportunities-list-item/' +
                'opportunities-list-item.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', function ($scope) {
                    var ctrl = this;
                    ctrl.loadingView = false;
                    ctrl.opportunity = $scope.getOpportunity();
                    if (ctrl.opportunity) {
                        if (ctrl.opportunity.progressPercentage) {
                            ctrl.progressPercentage = (ctrl.opportunity.progressPercentage + '%');
                            ctrl.progresBarStyle = { width: ctrl.progressPercentage };
                        }
                    }
                    else {
                        ctrl.loadingView = true;
                    }
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/community-dashboard-page/opportunities-list/opportunities-list.directive.ts":
/*!*******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/community-dashboard-page/opportunities-list/opportunities-list.directive.ts ***!
  \*******************************************************************************************************************/
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
 * @fileoverview Directive for the list view of opportunities.
 */
__webpack_require__(/*! pages/community-dashboard-page/opportunities-list-item/opportunities-list-item.directive.ts */ "./core/templates/dev/head/pages/community-dashboard-page/opportunities-list-item/opportunities-list-item.directive.ts");
angular.module('oppia').directive('opportunitiesList', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                isDataLoading: '&dataLoading',
                getOpportunities: '&opportunities',
                isMoreOpportunitiesAvailable: '&moreAvailable',
                progressBarRequired: '@',
                onLoadMoreOpportunities: '&'
            },
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/community-dashboard-page/opportunities-list/' +
                'opportunities-list.directive.html'),
            controllerAs: '$ctrl',
            controller: ['$scope', function ($scope) {
                    var ctrl = this;
                    ctrl.showMoreOpportunities = $scope.onLoadMoreOpportunities;
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/community-dashboard-page/services/contribution-opportunities-backend-api.service.ts":
/*!***************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/community-dashboard-page/services/contribution-opportunities-backend-api.service.ts ***!
  \***************************************************************************************************************************/
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
 * @fileoverview Service for fetching the opportunities available for
 * contributors to contribute.
 */
angular.module('oppia').factory('ContributionOpportunitiesBackendApiService', [
    '$http', 'UrlInterpolationService', 'OPPORTUNITY_TYPE_TRANSLATION',
    'OPPORTUNITY_TYPE_VOICEOVER', function ($http, UrlInterpolationService, OPPORTUNITY_TYPE_TRANSLATION, OPPORTUNITY_TYPE_VOICEOVER) {
        var urlTemplate = '/opportunitiessummaryhandler/<opportunityType>';
        return {
            fetchTranslationOpportunities: function (languageCode, cursor, successCallback) {
                return $http.get(UrlInterpolationService.interpolateUrl(urlTemplate, { opportunityType: OPPORTUNITY_TYPE_TRANSLATION }), {
                    params: {
                        language_code: languageCode,
                        cursor: cursor
                    }
                }).then(function (response) {
                    successCallback(response.data);
                });
            },
            fetchVoiceoverOpportunities: function (languageCode, cursor, successCallback) {
                return $http.get(UrlInterpolationService.interpolateUrl(urlTemplate, { opportunityType: OPPORTUNITY_TYPE_VOICEOVER }), {
                    params: {
                        language_code: languageCode,
                        cursor: cursor
                    }
                }).then(function (response) {
                    successCallback(response.data);
                });
            },
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/community-dashboard-page/services/contribution-opportunities.service.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/community-dashboard-page/services/contribution-opportunities.service.ts ***!
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
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */
__webpack_require__(/*! pages/community-dashboard-page/services/contribution-opportunities-backend-api.service.ts */ "./core/templates/dev/head/pages/community-dashboard-page/services/contribution-opportunities-backend-api.service.ts");
angular.module('oppia').factory('ContributionOpportunitiesService', [
    'ContributionOpportunitiesBackendApiService',
    function (ContributionOpportunitiesBackendApiService) {
        var translationOpportunitiesCursor = null;
        var voiceoverOpportunitiesCursor = null;
        var moreTranslationOpportunitiesAvailable = true;
        var moreVoiceoverOpportunitiesAvailable = true;
        var _getTranslationOpportunities = function (languageCode, cursor, successCallback) {
            ContributionOpportunitiesBackendApiService.fetchTranslationOpportunities(languageCode, cursor, function (data) {
                moreTranslationOpportunitiesAvailable = data.more;
                translationOpportunitiesCursor = data.next_cursor;
                successCallback(data.opportunities, data.more);
            });
        };
        var _getVoiceoverOpportunities = function (languageCode, cursor, successCallback) {
            ContributionOpportunitiesBackendApiService.fetchVoiceoverOpportunities(languageCode, cursor, function (data) {
                moreVoiceoverOpportunitiesAvailable = data.more;
                voiceoverOpportunitiesCursor = data.next_cursor;
                successCallback(data.opportunities, data.more);
            });
        };
        return {
            getTranslationOpportunities: function (languageCode, successCallback) {
                _getTranslationOpportunities(languageCode, '', successCallback);
            },
            getVoiceoverOpportunities: function (languageCode, successCallback) {
                _getVoiceoverOpportunities(languageCode, '', successCallback);
            },
            getMoreTranslationOpportunities: function (languageCode, successCallback) {
                if (moreTranslationOpportunitiesAvailable) {
                    _getTranslationOpportunities(languageCode, translationOpportunitiesCursor, successCallback);
                }
            },
            getMoreVoiceoverOpportunities: function (languageCode, successCallback) {
                if (moreVoiceoverOpportunitiesAvailable) {
                    _getVoiceoverOpportunities(languageCode, voiceoverOpportunitiesCursor, successCallback);
                }
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/community-dashboard-page/translation-opportunities/translation-opportunities.directive.ts":
/*!*********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/community-dashboard-page/translation-opportunities/translation-opportunities.directive.ts ***!
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
 * @fileoverview Directive for the translation opportunities.
 */
__webpack_require__(/*! pages/community-dashboard-page/opportunities-list/opportunities-list.directive.ts */ "./core/templates/dev/head/pages/community-dashboard-page/opportunities-list/opportunities-list.directive.ts");
__webpack_require__(/*! pages/community-dashboard-page/services/contribution-opportunities.service.ts */ "./core/templates/dev/head/pages/community-dashboard-page/services/contribution-opportunities.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/translation-tab/services/translation-language.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/services/translation-language.service.ts");
angular.module('oppia').directive('translationOpportunities', ['UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/community-dashboard-page/translation-opportunities/' +
                'translation-opportunities.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', 'ContributionOpportunitiesService',
                'TranslationLanguageService', function ($scope, ContributionOpportunitiesService, TranslationLanguageService) {
                    var ctrl = this;
                    ctrl.opportunities = [];
                    ctrl.opportunitiesAreLoading = true;
                    ctrl.moreOpportunitiesAvailable = true;
                    var updateWithNewOpportunities = function (opportunities, more) {
                        for (var index in opportunities) {
                            var opportunity = opportunities[index];
                            var subheading = (opportunity.topic_name + ' - ' + opportunity.story_title);
                            var heading = opportunity.chapter_title;
                            var progressPercentage = '0.00';
                            var totalContentCount = opportunity.content_count;
                            var languageCode = (TranslationLanguageService.getActiveLanguageCode());
                            var languageDescription = (TranslationLanguageService.getActiveLanguageDescription());
                            if (opportunity.translation_counts.hasOwnProperty(languageCode) && (totalContentCount > 0)) {
                                var progressPercentage = ((opportunity.translation_counts[languageCode] /
                                    totalContentCount) * 100).toFixed(2);
                            }
                            ctrl.opportunities.push({
                                heading: heading,
                                subheading: subheading,
                                progressPercentage: progressPercentage,
                                actionButtonTitle: 'Translate'
                            });
                        }
                        ctrl.moreOpportunitiesAvailable = more;
                        ctrl.opportunitiesAreLoading = false;
                    };
                    $scope.$on('activeLanguageChanged', function () {
                        ctrl.opportunities = [];
                        ctrl.opportunitiesAreLoading = true;
                        ctrl.moreOpportunitiesAvailable = true;
                        ContributionOpportunitiesService.getTranslationOpportunities(TranslationLanguageService.getActiveLanguageCode(), updateWithNewOpportunities);
                    });
                    ctrl.onLoadMoreOpportunities = function () {
                        if (!ctrl.opportunitiesAreLoading &&
                            ctrl.moreOpportunitiesAvailable) {
                            ctrl.opportunitiesAreLoading = true;
                            ContributionOpportunitiesService.getMoreTranslationOpportunities(TranslationLanguageService.getActiveLanguageCode(), updateWithNewOpportunities);
                        }
                    };
                    ContributionOpportunitiesService.getTranslationOpportunities(TranslationLanguageService.getActiveLanguageCode(), updateWithNewOpportunities);
                }
            ]
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/pages/community-dashboard-page/voiceover-opportunities/voiceover-opportunities.directive.ts":
/*!*****************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/community-dashboard-page/voiceover-opportunities/voiceover-opportunities.directive.ts ***!
  \*****************************************************************************************************************************/
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
 * @fileoverview Directive for the voiceover opportunities.
 */
__webpack_require__(/*! pages/community-dashboard-page/opportunities-list/opportunities-list.directive.ts */ "./core/templates/dev/head/pages/community-dashboard-page/opportunities-list/opportunities-list.directive.ts");
__webpack_require__(/*! pages/community-dashboard-page/services/contribution-opportunities.service.ts */ "./core/templates/dev/head/pages/community-dashboard-page/services/contribution-opportunities.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/translation-tab/services/translation-language.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/services/translation-language.service.ts");
angular.module('oppia').directive('voiceoverOpportunities', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/community-dashboard-page/translation-opportunities/' +
                'translation-opportunities.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', 'ContributionOpportunitiesService',
                'TranslationLanguageService', function ($scope, ContributionOpportunitiesService, TranslationLanguageService) {
                    var ctrl = this;
                    ctrl.opportunities = [];
                    ctrl.opportunitiesAreLoading = true;
                    ctrl.moreOpportunitiesAvailable = true;
                    ctrl.progressBarRequired = false;
                    var updateWithNewOpportunities = function (opportunities, more) {
                        for (var index in opportunities) {
                            var opportunity = opportunities[index];
                            var subheading = (opportunity.topic_name + ' - ' + opportunity.story_title);
                            var heading = opportunity.chapter_title;
                            ctrl.opportunities.push({
                                heading: heading,
                                subheading: subheading,
                                actionButtonTitle: 'Request to Voiceover'
                            });
                        }
                        ctrl.moreOpportunitiesAvailable = more;
                        ctrl.opportunitiesAreLoading = false;
                    };
                    $scope.$on('activeLanguageChanged', function () {
                        ctrl.opportunities = [];
                        ctrl.opportunitiesAreLoading = true;
                        ContributionOpportunitiesService.getVoiceoverOpportunities(TranslationLanguageService.getActiveLanguageCode(), updateWithNewOpportunities);
                    });
                    ctrl.onLoadMoreOpportunities = function () {
                        if (!ctrl.opportunitiesAreLoading &&
                            ctrl.moreOpportunitiesAvailable) {
                            ctrl.opportunitiesAreLoading = true;
                            ContributionOpportunitiesService.getMoreVoiceoverOpportunities(TranslationLanguageService.getActiveLanguageCode(), updateWithNewOpportunities);
                        }
                    };
                    ContributionOpportunitiesService.getVoiceoverOpportunities(TranslationLanguageService.getActiveLanguageCode(), updateWithNewOpportunities);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/services/translation-language.service.ts":
/*!************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/translation-tab/services/translation-language.service.ts ***!
  \************************************************************************************************************************/
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
 * @fileoverview A service that maintains a record of which language
 * in the translation tab is currently active.
 */
__webpack_require__(/*! domain/utilities/LanguageUtilService.ts */ "./core/templates/dev/head/domain/utilities/LanguageUtilService.ts");
angular.module('oppia').factory('TranslationLanguageService', [
    '$log', '$rootScope', 'LanguageUtilService',
    function ($log, $rootScope, LanguageUtilService) {
        var activeLanguageCode = null;
        var allAudioLanguageCodes = (LanguageUtilService.getAllVoiceoverLanguageCodes());
        return {
            getActiveLanguageCode: function () {
                return activeLanguageCode;
            },
            setActiveLanguageCode: function (newActiveLanguageCode) {
                if (allAudioLanguageCodes.indexOf(newActiveLanguageCode) < 0) {
                    $log.error('Invalid active language code: ' + newActiveLanguageCode);
                    return;
                }
                activeLanguageCode = newActiveLanguageCode;
                $rootScope.$broadcast('activeLanguageChanged');
            },
            getActiveLanguageDescription: function () {
                return LanguageUtilService.getAudioLanguageDescription(activeLanguageCode);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/LocalStorageService.ts":
/*!*****************************************************************!*\
  !*** ./core/templates/dev/head/services/LocalStorageService.ts ***!
  \*****************************************************************/
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
 * @fileoverview Utility service for saving data locally on the client machine.
 */
__webpack_require__(/*! domain/exploration/ExplorationDraftObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/ExplorationDraftObjectFactory.ts");
// Service for saving exploration draft changes to local storage.
//
// Note that the draft is only saved if localStorage exists and works
// (i.e. has storage capacity).
angular.module('oppia').factory('LocalStorageService', [
    'ExplorationDraftObjectFactory',
    function (ExplorationDraftObjectFactory) {
        // Check that local storage exists and works as expected.
        // If it does storage stores the localStorage object,
        // else storage is undefined or false.
        var storage = (function () {
            var test = 'test';
            var result;
            try {
                localStorage.setItem(test, test);
                result = localStorage.getItem(test) === test;
                localStorage.removeItem(test);
                return result && localStorage;
            }
            catch (exception) { }
        }());
        var LAST_SELECTED_TRANSLATION_LANGUAGE_KEY = ('last_selected_translation_lang');
        /**
         * Create the key to access the changeList in localStorage
         * @param {String} explorationId - The exploration id of the changeList
         *   to be accessed.
         */
        var _createExplorationDraftKey = function (explorationId) {
            return 'draft_' + explorationId;
        };
        return {
            /**
             * Check that localStorage is available to the client.
             * @returns {boolean} true iff the client has access to localStorage.
             */
            isStorageAvailable: function () {
                return Boolean(storage);
            },
            /**
             * Save the given changeList to localStorage along with its
             * draftChangeListId
             * @param {String} explorationId - The id of the exploration
             *   associated with the changeList to be saved.
             * @param {List} changeList - The exploration change list to be saved.
             * @param {Integer} draftChangeListId - The id of the draft to be saved.
             */
            saveExplorationDraft: function (explorationId, changeList, draftChangeListId) {
                var localSaveKey = _createExplorationDraftKey(explorationId);
                if (storage) {
                    var draftDict = ExplorationDraftObjectFactory.toLocalStorageDict(changeList, draftChangeListId);
                    storage.setItem(localSaveKey, JSON.stringify(draftDict));
                }
            },
            /**
             * Retrieve the local save of the changeList associated with the given
             * exploration id.
             * @param {String} explorationId - The exploration id of the change list
             *   to be retrieved.
             * @returns {Object} The local save draft object if it exists,
             *   else null.
             */
            getExplorationDraft: function (explorationId) {
                if (storage) {
                    var draftDict = JSON.parse(storage.getItem(_createExplorationDraftKey(explorationId)));
                    if (draftDict) {
                        return ExplorationDraftObjectFactory.createFromLocalStorageDict(draftDict);
                    }
                }
                return null;
            },
            /**
             * Remove the local save of the changeList associated with the given
             * exploration id.
             * @param {String} explorationId - The exploration id of the change list
             *   to be removed.
             */
            removeExplorationDraft: function (explorationId) {
                if (storage) {
                    storage.removeItem(_createExplorationDraftKey(explorationId));
                }
            },
            /**
             * Save the given language code to localStorage along.
             * @param {List} changeList - The last selected language code to be saved.
             */
            updateLastSelectedTranslationLanguageCode: function (languageCode) {
                if (storage) {
                    storage.setItem(LAST_SELECTED_TRANSLATION_LANGUAGE_KEY, languageCode);
                }
            },
            /**
             * Retrieve the local save of the last selected language for translation.
             * @returns {String} The local save of the last selected language for
             *   translation if it exists, else null.
             */
            getLastSelectedTranslationLanguageCode: function () {
                if (storage) {
                    var languageCode = (storage.getItem(LAST_SELECTED_TRANSLATION_LANGUAGE_KEY));
                    return languageCode;
                }
                return null;
            },
        };
    }
]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvQXBwSW5pdC50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9iYXNlX2NvbXBvbmVudHMvQmFzZUNvbnRlbnREaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL1dhcm5pbmdMb2FkZXJEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzL2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvbGF6eS1sb2FkaW5nLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvT3BwaWFGb290ZXJEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS5jb25zdGFudHMuYWpzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS9jb21tdW5pdHktZGFzaGJvYXJkLXBhZ2UuY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS9jb21tdW5pdHktZGFzaGJvYXJkLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb21tdW5pdHktZGFzaGJvYXJkLXBhZ2UvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlLnNjcmlwdHMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL29wcG9ydHVuaXRpZXMtbGlzdC1pdGVtL29wcG9ydHVuaXRpZXMtbGlzdC1pdGVtLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb21tdW5pdHktZGFzaGJvYXJkLXBhZ2Uvb3Bwb3J0dW5pdGllcy1saXN0L29wcG9ydHVuaXRpZXMtbGlzdC5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL3NlcnZpY2VzL2NvbnRyaWJ1dGlvbi1vcHBvcnR1bml0aWVzLWJhY2tlbmQtYXBpLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL3NlcnZpY2VzL2NvbnRyaWJ1dGlvbi1vcHBvcnR1bml0aWVzLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL3RyYW5zbGF0aW9uLW9wcG9ydHVuaXRpZXMvdHJhbnNsYXRpb24tb3Bwb3J0dW5pdGllcy5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL3ZvaWNlb3Zlci1vcHBvcnR1bml0aWVzL3ZvaWNlb3Zlci1vcHBvcnR1bml0aWVzLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS90cmFuc2xhdGlvbi10YWIvc2VydmljZXMvdHJhbnNsYXRpb24tbGFuZ3VhZ2Uuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9Mb2NhbFN0b3JhZ2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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YnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuXG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcImNvbW11bml0eV9kYXNoYm9hcmRcIjogMFxuIFx0fTtcblxuIFx0dmFyIGRlZmVycmVkTW9kdWxlcyA9IFtdO1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHR2YXIganNvbnBBcnJheSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSB8fCBbXTtcbiBcdHZhciBvbGRKc29ucEZ1bmN0aW9uID0ganNvbnBBcnJheS5wdXNoLmJpbmQoanNvbnBBcnJheSk7XG4gXHRqc29ucEFycmF5LnB1c2ggPSB3ZWJwYWNrSnNvbnBDYWxsYmFjaztcbiBcdGpzb25wQXJyYXkgPSBqc29ucEFycmF5LnNsaWNlKCk7XG4gXHRmb3IodmFyIGkgPSAwOyBpIDwganNvbnBBcnJheS5sZW5ndGg7IGkrKykgd2VicGFja0pzb25wQ2FsbGJhY2soanNvbnBBcnJheVtpXSk7XG4gXHR2YXIgcGFyZW50SnNvbnBGdW5jdGlvbiA9IG9sZEpzb25wRnVuY3Rpb247XG5cblxuIFx0Ly8gYWRkIGVudHJ5IG1vZHVsZSB0byBkZWZlcnJlZCBsaXN0XG4gXHRkZWZlcnJlZE1vZHVsZXMucHVzaChbXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS9jb21tdW5pdHktZGFzaGJvYXJkLXBhZ2Uuc2NyaXB0cy50c1wiLFwidmVuZG9yc35hYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcn43ODU2YzA1YVwiLFwiYWJvdXR+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29tbXVuaXR5X2Rhc2hib2FyZH5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lMDZhNGExN1wiLFwiY29tbXVuaXR5X2Rhc2hib2FyZH5saWJyYXJ5fnByZWZlcmVuY2VzXCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBGaWxlIGZvciBpbml0aWFsaXppbmcgdGhlIG1haW4gb3BwaWEgbW9kdWxlLlxuICovXG5yZXF1aXJlKFwiY29yZS1qcy9lczcvcmVmbGVjdFwiKTtcbnJlcXVpcmUoXCJ6b25lLmpzXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGh0dHBfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb21tb24vaHR0cFwiKTtcbi8vIFRoaXMgY29tcG9uZW50IGlzIG5lZWRlZCB0byBmb3JjZS1ib290c3RyYXAgQW5ndWxhciBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZVxuLy8gYXBwLlxudmFyIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCgpIHtcbiAgICB9XG4gICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuQ29tcG9uZW50KHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnc2VydmljZS1ib290c3RyYXAnLFxuICAgICAgICAgICAgdGVtcGxhdGU6ICcnXG4gICAgICAgIH0pXG4gICAgXSwgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCk7XG4gICAgcmV0dXJuIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQ7XG59KCkpO1xuZXhwb3J0cy5TZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbnZhciBNYWluQW5ndWxhck1vZHVsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNYWluQW5ndWxhck1vZHVsZSgpIHtcbiAgICB9XG4gICAgLy8gRW1wdHkgcGxhY2Vob2xkZXIgbWV0aG9kIHRvIHNhdGlzZnkgdGhlIGBDb21waWxlcmAuXG4gICAgTWFpbkFuZ3VsYXJNb2R1bGUucHJvdG90eXBlLm5nRG9Cb290c3RyYXAgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgTWFpbkFuZ3VsYXJNb2R1bGUgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLk5nTW9kdWxlKHtcbiAgICAgICAgICAgIGltcG9ydHM6IFtcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybV9icm93c2VyXzEuQnJvd3Nlck1vZHVsZSxcbiAgICAgICAgICAgICAgICBodHRwXzEuSHR0cENsaWVudE1vZHVsZVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uczogW1xuICAgICAgICAgICAgICAgIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBlbnRyeUNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG4gICAgICAgICAgICBdLFxuICAgICAgICB9KVxuICAgIF0sIE1haW5Bbmd1bGFyTW9kdWxlKTtcbiAgICByZXR1cm4gTWFpbkFuZ3VsYXJNb2R1bGU7XG59KCkpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfZHluYW1pY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pY1wiKTtcbnZhciBzdGF0aWNfMiA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBib290c3RyYXBGbiA9IGZ1bmN0aW9uIChleHRyYVByb3ZpZGVycykge1xuICAgIHZhciBwbGF0Zm9ybVJlZiA9IHBsYXRmb3JtX2Jyb3dzZXJfZHluYW1pY18xLnBsYXRmb3JtQnJvd3NlckR5bmFtaWMoZXh0cmFQcm92aWRlcnMpO1xuICAgIHJldHVybiBwbGF0Zm9ybVJlZi5ib290c3RyYXBNb2R1bGUoTWFpbkFuZ3VsYXJNb2R1bGUpO1xufTtcbnZhciBkb3duZ3JhZGVkTW9kdWxlID0gc3RhdGljXzIuZG93bmdyYWRlTW9kdWxlKGJvb3RzdHJhcEZuKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScsIFtcbiAgICAnZG5kTGlzdHMnLCAnaGVhZHJvb20nLCAnaW5maW5pdGUtc2Nyb2xsJywgJ25nQW5pbWF0ZScsXG4gICAgJ25nQXVkaW8nLCAnbmdDb29raWVzJywgJ25nSW1nQ3JvcCcsICduZ0pveVJpZGUnLCAnbmdNYXRlcmlhbCcsXG4gICAgJ25nUmVzb3VyY2UnLCAnbmdTYW5pdGl6ZScsICduZ1RvdWNoJywgJ3Bhc2NhbHByZWNodC50cmFuc2xhdGUnLFxuICAgICd0b2FzdHInLCAndWkuYm9vdHN0cmFwJywgJ3VpLnNvcnRhYmxlJywgJ3VpLnRyZWUnLCAndWkudmFsaWRhdGUnLFxuICAgIGRvd25ncmFkZWRNb2R1bGVcbl0pXG4gICAgLy8gVGhpcyBkaXJlY3RpdmUgaXMgdGhlIGRvd25ncmFkZWQgdmVyc2lvbiBvZiB0aGUgQW5ndWxhciBjb21wb25lbnQgdG9cbiAgICAvLyBib290c3RyYXAgdGhlIEFuZ3VsYXIgOC5cbiAgICAuZGlyZWN0aXZlKCdzZXJ2aWNlQm9vdHN0cmFwJywgc3RhdGljXzEuZG93bmdyYWRlQ29tcG9uZW50KHtcbiAgICBjb21wb25lbnQ6IFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbn0pKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgQmFzZSBUcmFuc2NsdXNpb24gQ29tcG9uZW50LlxuICovXG5yZXF1aXJlKCdiYXNlX2NvbXBvbmVudHMvV2FybmluZ0xvYWRlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvT3BwaWFGb290ZXJEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9zaWRlYmFyL1NpZGViYXJTdGF0dXNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL3N0YXRlZnVsL0JhY2tncm91bmRNYXNrU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdiYXNlQ29udGVudCcsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdHJhbnNjbHVkZToge1xuICAgICAgICAgICAgICAgIGJyZWFkY3J1bWI6ICc/bmF2YmFyQnJlYWRjcnVtYicsXG4gICAgICAgICAgICAgICAgY29udGVudDogJ2NvbnRlbnQnLFxuICAgICAgICAgICAgICAgIGZvb3RlcjogJz9wYWdlRm9vdGVyJyxcbiAgICAgICAgICAgICAgICBuYXZPcHRpb25zOiAnP25hdk9wdGlvbnMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2Jhc2VfY29tcG9uZW50cy9iYXNlX2NvbnRlbnRfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHJvb3RTY29wZScsICdCYWNrZ3JvdW5kTWFza1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdTaWRlYmFyU3RhdHVzU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ1NJVEVfRkVFREJBQ0tfRk9STV9VUkwnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBCYWNrZ3JvdW5kTWFza1NlcnZpY2UsIFNpZGViYXJTdGF0dXNTZXJ2aWNlLCBVcmxTZXJ2aWNlLCBTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pZnJhbWVkID0gVXJsU2VydmljZS5pc0lmcmFtZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zaXRlRmVlZGJhY2tGb3JtVXJsID0gU0lURV9GRUVEQkFDS19GT1JNX1VSTDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1NpZGViYXJTaG93biA9IFNpZGViYXJTdGF0dXNTZXJ2aWNlLmlzU2lkZWJhclNob3duO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNsb3NlU2lkZWJhck9uU3dpcGUgPSBTaWRlYmFyU3RhdHVzU2VydmljZS5jbG9zZVNpZGViYXI7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNCYWNrZ3JvdW5kTWFza0FjdGl2ZSA9IEJhY2tncm91bmRNYXNrU2VydmljZS5pc01hc2tBY3RpdmU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuREVWX01PREUgPSAkcm9vdFNjb3BlLkRFVl9NT0RFO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNraXBUb01haW5Db250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1haW5Db250ZW50RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvcHBpYS1tYWluLWNvbnRlbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbWFpbkNvbnRlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1ZhcmlhYmxlIG1haW5Db250ZW50RWxlbWVudCBpcyB1bmRlZmluZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQudGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC5zY3JvbGxJbnRvVmlldygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHdhcm5pbmdfbG9hZGVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3dhcm5pbmdMb2FkZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2Jhc2VfY29tcG9uZW50cy93YXJuaW5nX2xvYWRlcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWydBbGVydHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoQWxlcnRzU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuQWxlcnRzU2VydmljZSA9IEFsZXJ0c1NlcnZpY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBiYWNrZ3JvdW5kIGJhbm5lci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdiYWNrZ3JvdW5kQmFubmVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zc2libGVCYW5uZXJGaWxlbmFtZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnYmFubmVyQS5zdmcnLCAnYmFubmVyQi5zdmcnLCAnYmFubmVyQy5zdmcnLCAnYmFubmVyRC5zdmcnXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYW5uZXJJbWFnZUZpbGVuYW1lID0gcG9zc2libGVCYW5uZXJGaWxlbmFtZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGVCYW5uZXJGaWxlbmFtZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYmFubmVySW1hZ2VGaWxlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9iYWNrZ3JvdW5kLycgKyBiYW5uZXJJbWFnZUZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgZGlzcGxheWluZyBhbmltYXRlZCBsYXp5IGxvYWRpbmcgY29udGFpbmVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2xhenlMb2FkaW5nJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICAgICAgICAgICAgICdsYXp5LWxvYWRpbmcuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtmdW5jdGlvbiAoKSB7IH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGluc3RhbmNlcyBvZiBFeHBsb3JhdGlvbkRyYWZ0XG4gKiBkb21haW4gb2JqZWN0cy5cbiAqL1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIEV4cGxvcmF0aW9uRHJhZnQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXhwbG9yYXRpb25EcmFmdChkcmFmdENoYW5nZXMsIGRyYWZ0Q2hhbmdlTGlzdElkKSB7XG4gICAgICAgIHRoaXMuZHJhZnRDaGFuZ2VzID0gZHJhZnRDaGFuZ2VzO1xuICAgICAgICB0aGlzLmRyYWZ0Q2hhbmdlTGlzdElkID0gZHJhZnRDaGFuZ2VMaXN0SWQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENoZWNrcyB3aGV0aGVyIHRoZSBkcmFmdCBvYmplY3QgaGFzIGJlZW4gb3ZlcndyaXR0ZW4gYnkgYW5vdGhlclxuICAgICAqIGRyYWZ0IHdoaWNoIGhhcyBiZWVuIGNvbW1pdHRlZCB0byB0aGUgYmFjay1lbmQuIElmIHRoZSBzdXBwbGllZCBkcmFmdCBpZFxuICAgICAqIGhhcyBhIGRpZmZlcmVudCB2YWx1ZSB0aGVuIGEgbmV3ZXIgY2hhbmdlTGlzdCBtdXN0IGhhdmUgYmVlbiBjb21taXR0ZWRcbiAgICAgKiB0byB0aGUgYmFjay1lbmQuXG4gICAgICogQHBhcmFtIHtJbnRlZ2VyfSAtIGN1cnJlbnREcmFmdElkLiBUaGUgaWQgb2YgdGhlIGRyYWZ0IGNoYW5nZXMgd2hjaCB3YXNcbiAgICAgKiAgcmV0cmlldmVkIGZyb20gdGhlIGJhY2stZW5kLlxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSAtIFRydWUgaWZmIHRoZSBjdXJyZW50RHJhZnRJZCBpcyB0aGUgc2FtZSBhcyB0aGVcbiAgICAgKiBkcmFmdENoYW5nZUxpc3RJZCBjb3JyZXNwb25kaW5nIHRvIHRoaXMgZHJhZnQuXG4gICAgICovXG4gICAgRXhwbG9yYXRpb25EcmFmdC5wcm90b3R5cGUuaXNWYWxpZCA9IGZ1bmN0aW9uIChjdXJyZW50RHJhZnRJZCkge1xuICAgICAgICByZXR1cm4gKGN1cnJlbnREcmFmdElkID09PSB0aGlzLmRyYWZ0Q2hhbmdlTGlzdElkKTtcbiAgICB9O1xuICAgIC8vIFRPRE8oIzcxNjUpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4gdHlwZWRcbiAgICAvLyBhcyAnYW55JyBzaW5jZSAnZHJhZnRDaGFuZ2VzJyBpcyBhbiBhcnJheSBvZiBkaWN0cyB3aXRoIHBvc3NpYmxlXG4gICAgLy8gdW5kZXJzY29yZV9jYXNlZCBrZXlzLiBBIHRob3JvdWdoIGNoZWNrIG5lZWRzIHRvIGJlIGRvbmUgdG8gYXNzdXJlIG9mXG4gICAgLy8gaXRzIGV4YWN0IHR5cGUuXG4gICAgRXhwbG9yYXRpb25EcmFmdC5wcm90b3R5cGUuZ2V0Q2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZHJhZnRDaGFuZ2VzO1xuICAgIH07XG4gICAgcmV0dXJuIEV4cGxvcmF0aW9uRHJhZnQ7XG59KCkpO1xuZXhwb3J0cy5FeHBsb3JhdGlvbkRyYWZ0ID0gRXhwbG9yYXRpb25EcmFmdDtcbnZhciBFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeSgpIHtcbiAgICB9XG4gICAgRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUZyb21Mb2NhbFN0b3JhZ2VEaWN0ID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uRHJhZnREaWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwbG9yYXRpb25EcmFmdChleHBsb3JhdGlvbkRyYWZ0RGljdC5kcmFmdENoYW5nZXMsIGV4cGxvcmF0aW9uRHJhZnREaWN0LmRyYWZ0Q2hhbmdlTGlzdElkKTtcbiAgICB9O1xuICAgIEV4cGxvcmF0aW9uRHJhZnRPYmplY3RGYWN0b3J5LnByb3RvdHlwZS50b0xvY2FsU3RvcmFnZURpY3QgPSBmdW5jdGlvbiAoXG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiB0eXBlZFxuICAgIC8vIGFzICdhbnknIHNpbmNlICdjaGFuZ2VMaXN0JyBpcyBhbiBhcnJheSBvZiBkaWN0cyB3aXRoIHBvc3NpYmxlXG4gICAgLy8gdW5kZXJzY29yZV9jYXNlZCBrZXlzLiBBIHRob3JvdWdoIGNoZWNrIG5lZWRzIHRvIGJlIGRvbmUgdG8gYXNzdXJlIG9mXG4gICAgLy8gaXRzIGV4YWN0IHR5cGUuXG4gICAgY2hhbmdlTGlzdCwgZHJhZnRDaGFuZ2VMaXN0SWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRyYWZ0Q2hhbmdlczogY2hhbmdlTGlzdCxcbiAgICAgICAgICAgIGRyYWZ0Q2hhbmdlTGlzdElkOiBkcmFmdENoYW5nZUxpc3RJZFxuICAgICAgICB9O1xuICAgIH07XG4gICAgRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLkV4cGxvcmF0aW9uRHJhZnRPYmplY3RGYWN0b3J5ID0gRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgZm9vdGVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ29wcGlhRm9vdGVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvb3BwaWFfZm9vdGVyX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkgeyB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyB0byBiZSB1c2VkIGluIHRoZSBjb21tdW5pdHkgZGFzaGJvYXJkIHBhZ2UuXG4gKi9cbi8vIFRPRE8oIzcwOTIpOiBEZWxldGUgdGhpcyBmaWxlIG9uY2UgbWlncmF0aW9uIGlzIGNvbXBsZXRlIGFuZCB0aGVzZSBBbmd1bGFySlNcbi8vIGVxdWl2YWxlbnRzIG9mIHRoZSBBbmd1bGFyIGNvbnN0YW50cyBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbnZhciBjb21tdW5pdHlfZGFzaGJvYXJkX3BhZ2VfY29uc3RhbnRzX3RzXzEgPSByZXF1aXJlKFwicGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS5jb25zdGFudHMudHNcIik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ09NTVVOSVRZX0RBU0hCT0FSRF9UQUJTX0RFVEFJTFMnLCBjb21tdW5pdHlfZGFzaGJvYXJkX3BhZ2VfY29uc3RhbnRzX3RzXzEuQ29tbXVuaXR5RGFzaGJvYXJkQ29uc3RhbnRzLkNPTU1VTklUWV9EQVNIQk9BUkRfVEFCU19ERVRBSUxTKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdERUZBVUxUX09QUE9SVFVOSVRZX0xBTkdVQUdFX0NPREUnLCBjb21tdW5pdHlfZGFzaGJvYXJkX3BhZ2VfY29uc3RhbnRzX3RzXzEuQ29tbXVuaXR5RGFzaGJvYXJkQ29uc3RhbnRzLkRFRkFVTFRfT1BQT1JUVU5JVFlfTEFOR1VBR0VfQ09ERSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgdGhlIGNyZWF0b3IgZGFzaGJvYXJkIHBhZ2UuXG4gKi9cbnZhciBDb21tdW5pdHlEYXNoYm9hcmRDb25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29tbXVuaXR5RGFzaGJvYXJkQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBDb21tdW5pdHlEYXNoYm9hcmRDb25zdGFudHMuQ09NTVVOSVRZX0RBU0hCT0FSRF9UQUJTX0RFVEFJTFMgPSB7XG4gICAgICAgIG15Q29udHJpYnV0aW9uVGFiOiB7XG4gICAgICAgICAgICBhcmlhTGFiZWw6ICdDaGVjayB5b3VyIGNvbnRyaWJ1dGlvbnMuJyxcbiAgICAgICAgICAgIHRhYk5hbWU6ICdNeSBjb250cmlidXRpb24nLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICcnLFxuICAgICAgICAgICAgY3VzdG9taXphdGlvbk9wdGlvbnM6IFtdXG4gICAgICAgIH0sXG4gICAgICAgIHF1ZXN0aW9uVGFiOiB7XG4gICAgICAgICAgICBhcmlhTGFiZWw6ICdTZWUgb3Bwb3J0dW5pdGllcyBmb3IgYWRkaW5nIG5ldyBxdWVzdGlvbnMuJyxcbiAgICAgICAgICAgIHRhYk5hbWU6ICdTdWJtaXQgUXVlc3Rpb24nLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcm92aWRlIHF1ZXN0aW9uIGluIGEgdG9waWMgb2YgeW91ciBjaG9pY2UgZm9yICcgK1xuICAgICAgICAgICAgICAgICdzdHVkZW50cyB0byBhbnN3ZXIuJyxcbiAgICAgICAgICAgIGN1c3RvbWl6YXRpb25PcHRpb25zOiBbJ3NvcnQnXVxuICAgICAgICB9LFxuICAgICAgICB0cmFuc2xhdGlvblRhYjoge1xuICAgICAgICAgICAgYXJpYUxhYmVsOiAnU2VlIG9wcG9ydHVuaXRpZXMgZm9yIHRyYW5zbGF0aW9uLicsXG4gICAgICAgICAgICB0YWJOYW1lOiAnVHJhbnNsYXRlIFRleHQnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUcmFuc2xhdGUgdGhlIHRleHQgaW4gdGhlIGxlc3NvbnMgdG8gYnJlYWsgdGhlICcgK1xuICAgICAgICAgICAgICAgICdsYW5ndWFnZSBiYXJyaWVyIGZvciBub24tRW5nbGlzaCBzcGVha2VyLicsXG4gICAgICAgICAgICBjdXN0b21pemF0aW9uT3B0aW9uczogWydsYW5ndWFnZScsICdzb3J0J11cbiAgICAgICAgfSxcbiAgICAgICAgdm9pY2VvdmVyVGFiOiB7XG4gICAgICAgICAgICBhcmlhTGFiZWw6ICdTZWUgb3Bwb3J0dW5pdGllcyBmb3Igdm9pY2VvdmVyLicsXG4gICAgICAgICAgICB0YWJOYW1lOiAnVm9pY2VvdmVyJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlIHZvaWNlb3ZlciBpbiBhIGxhbmd1YWdlIG9mIHlvdXIgb3duIGNob2ljZSAnICtcbiAgICAgICAgICAgICAgICAndG8gZ2l2ZSB1c2VyIGEgZnVsbCBleHBlcmllbmNlLicsXG4gICAgICAgICAgICBjdXN0b21pemF0aW9uT3B0aW9uczogWydsYW5ndWFnZScsICdzb3J0J11cbiAgICAgICAgfSxcbiAgICAgICAgYXJ0VGFiOiB7XG4gICAgICAgICAgICBhcmlhTGFiZWw6ICdTZWUgb3Bwb3J0dW5pdGllcyBmb3IgYXJ0LicsXG4gICAgICAgICAgICB0YWJOYW1lOiAnU3VibWl0IGFydCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Rlc2lnbiBkaWdpdGFsIGFydCB0aGF0IG1ha2VzIHRoZSBsZXNzb25zIGV2ZW4gJyArXG4gICAgICAgICAgICAgICAgJ21vcmUgZW5nYWdpbmcuJyxcbiAgICAgICAgICAgIGN1c3RvbWl6YXRpb25PcHRpb25zOiBbJ3NvcnQnXVxuICAgICAgICB9XG4gICAgfTtcbiAgICBDb21tdW5pdHlEYXNoYm9hcmRDb25zdGFudHMuREVGQVVMVF9PUFBPUlRVTklUWV9MQU5HVUFHRV9DT0RFID0gJ2hpJztcbiAgICByZXR1cm4gQ29tbXVuaXR5RGFzaGJvYXJkQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuQ29tbXVuaXR5RGFzaGJvYXJkQ29uc3RhbnRzID0gQ29tbXVuaXR5RGFzaGJvYXJkQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBjb21tdW5pdHkgZGFzaGJvYXJkIHBhZ2UuXG4gKi9cbnJlcXVpcmUoJ2Jhc2VfY29tcG9uZW50cy9CYXNlQ29udGVudERpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICdiYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS90cmFuc2xhdGlvbi1vcHBvcnR1bml0aWVzLycgK1xuICAgICd0cmFuc2xhdGlvbi1vcHBvcnR1bml0aWVzLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL3ZvaWNlb3Zlci1vcHBvcnR1bml0aWVzLycgK1xuICAgICd2b2ljZW92ZXItb3Bwb3J0dW5pdGllcy5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvTGFuZ3VhZ2VVdGlsU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvTG9jYWxTdG9yYWdlU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2NvbW11bml0eURhc2hib2FyZFBhZ2UnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb21tdW5pdHktZGFzaGJvYXJkLXBhZ2UvJyArXG4gICAgICAgICAgICAgICAgJ2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckd2luZG93JywgJ0xhbmd1YWdlVXRpbFNlcnZpY2UnLCAnTG9jYWxTdG9yYWdlU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1RyYW5zbGF0aW9uTGFuZ3VhZ2VTZXJ2aWNlJywgJ0NPTU1VTklUWV9EQVNIQk9BUkRfVEFCU19ERVRBSUxTJyxcbiAgICAgICAgICAgICAgICAnREVGQVVMVF9PUFBPUlRVTklUWV9MQU5HVUFHRV9DT0RFJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHdpbmRvdywgTGFuZ3VhZ2VVdGlsU2VydmljZSwgTG9jYWxTdG9yYWdlU2VydmljZSwgVHJhbnNsYXRpb25MYW5ndWFnZVNlcnZpY2UsIENPTU1VTklUWV9EQVNIQk9BUkRfVEFCU19ERVRBSUxTLCBERUZBVUxUX09QUE9SVFVOSVRZX0xBTkdVQUdFX0NPREUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldlNlbGVjdGVkTGFuZ3VhZ2VDb2RlID0gKExvY2FsU3RvcmFnZVNlcnZpY2UuZ2V0TGFzdFNlbGVjdGVkVHJhbnNsYXRpb25MYW5ndWFnZUNvZGUoKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhbGxBdWRpb0xhbmd1YWdlQ29kZXMgPSBMYW5ndWFnZVV0aWxTZXJ2aWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0QWxsVm9pY2VvdmVyTGFuZ3VhZ2VDb2RlcygpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmxhbmd1YWdlQ29kZXNBbmREZXNjcmlwdGlvbnMgPSAoYWxsQXVkaW9MYW5ndWFnZUNvZGVzLm1hcChmdW5jdGlvbiAobGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBsYW5ndWFnZUNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IChMYW5ndWFnZVV0aWxTZXJ2aWNlLmdldEF1ZGlvTGFuZ3VhZ2VEZXNjcmlwdGlvbihsYW5ndWFnZUNvZGUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmxhbmd1YWdlQ29kZSA9IChhbGxBdWRpb0xhbmd1YWdlQ29kZXMuaW5kZXhPZihwcmV2U2VsZWN0ZWRMYW5ndWFnZUNvZGUpICE9PSAtMSA/XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2U2VsZWN0ZWRMYW5ndWFnZUNvZGUgOiBERUZBVUxUX09QUE9SVFVOSVRZX0xBTkdVQUdFX0NPREUpO1xuICAgICAgICAgICAgICAgICAgICBUcmFuc2xhdGlvbkxhbmd1YWdlU2VydmljZS5zZXRBY3RpdmVMYW5ndWFnZUNvZGUoY3RybC5sYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uQ2hhbmdlTGFuZ3VhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBUcmFuc2xhdGlvbkxhbmd1YWdlU2VydmljZS5zZXRBY3RpdmVMYW5ndWFnZUNvZGUoY3RybC5sYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgTG9jYWxTdG9yYWdlU2VydmljZS51cGRhdGVMYXN0U2VsZWN0ZWRUcmFuc2xhdGlvbkxhbmd1YWdlQ29kZShjdHJsLmxhbmd1YWdlQ29kZSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd0xhbmd1YWdlU2VsZWN0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aXZlVGFiRGV0YWlsID0gY3RybC50YWJzRGV0YWlsc1tjdHJsLmFjdGl2ZVRhYk5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChhY3RpdmVUYWJEZXRhaWwuY3VzdG9taXphdGlvbk9wdGlvbnMuaW5kZXhPZignbGFuZ3VhZ2UnKSAhPT0gLTEpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2ZVRhYk5hbWUgPSAnbXlDb250cmlidXRpb25UYWInO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnRhYnNEZXRhaWxzID0gQ09NTVVOSVRZX0RBU0hCT0FSRF9UQUJTX0RFVEFJTFM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuT1BQSUFfQVZBVEFSX0lNQUdFX1VSTCA9IChVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2F2YXRhci9vcHBpYV9hdmF0YXJfMTAwcHguc3ZnJykpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uVGFiQ2xpY2sgPSBmdW5jdGlvbiAoYWN0aXZlVGFiTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVUYWJOYW1lID0gYWN0aXZlVGFiTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBzY3JpcHRzIGZvciB0aGUgY29tbXVuaXR5IGRhc2hib2FyZCBwYWdlLlxuICovXG5yZXF1aXJlKCdBcHBJbml0LnRzJyk7XG5yZXF1aXJlKCdBcHAudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS8nICtcbiAgICAnY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlLmNvbnRyb2xsZXIudHMnKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgaXRlbSB2aWV3IG9mIGFuIG9wcG9ydHVuaXR5LlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvJyArXG4gICAgJ2xhenktbG9hZGluZy5kaXJlY3RpdmUudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3Bwb3J0dW5pdGllc0xpc3RJdGVtJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgZ2V0T3Bwb3J0dW5pdHk6ICcmb3Bwb3J0dW5pdHknLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL29wcG9ydHVuaXRpZXMtbGlzdC1pdGVtLycgK1xuICAgICAgICAgICAgICAgICdvcHBvcnR1bml0aWVzLWxpc3QtaXRlbS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5sb2FkaW5nVmlldyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9wcG9ydHVuaXR5ID0gJHNjb3BlLmdldE9wcG9ydHVuaXR5KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLm9wcG9ydHVuaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5vcHBvcnR1bml0eS5wcm9ncmVzc1BlcmNlbnRhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnByb2dyZXNzUGVyY2VudGFnZSA9IChjdHJsLm9wcG9ydHVuaXR5LnByb2dyZXNzUGVyY2VudGFnZSArICclJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wcm9ncmVzQmFyU3R5bGUgPSB7IHdpZHRoOiBjdHJsLnByb2dyZXNzUGVyY2VudGFnZSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5sb2FkaW5nVmlldyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGxpc3QgdmlldyBvZiBvcHBvcnR1bml0aWVzLlxuICovXG5yZXF1aXJlKCdwYWdlcy9jb21tdW5pdHktZGFzaGJvYXJkLXBhZ2Uvb3Bwb3J0dW5pdGllcy1saXN0LWl0ZW0vJyArXG4gICAgJ29wcG9ydHVuaXRpZXMtbGlzdC1pdGVtLmRpcmVjdGl2ZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdvcHBvcnR1bml0aWVzTGlzdCcsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGlzRGF0YUxvYWRpbmc6ICcmZGF0YUxvYWRpbmcnLFxuICAgICAgICAgICAgICAgIGdldE9wcG9ydHVuaXRpZXM6ICcmb3Bwb3J0dW5pdGllcycsXG4gICAgICAgICAgICAgICAgaXNNb3JlT3Bwb3J0dW5pdGllc0F2YWlsYWJsZTogJyZtb3JlQXZhaWxhYmxlJyxcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0JhclJlcXVpcmVkOiAnQCcsXG4gICAgICAgICAgICAgICAgb25Mb2FkTW9yZU9wcG9ydHVuaXRpZXM6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL29wcG9ydHVuaXRpZXMtbGlzdC8nICtcbiAgICAgICAgICAgICAgICAnb3Bwb3J0dW5pdGllcy1saXN0LmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsIGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dNb3JlT3Bwb3J0dW5pdGllcyA9ICRzY29wZS5vbkxvYWRNb3JlT3Bwb3J0dW5pdGllcztcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBmZXRjaGluZyB0aGUgb3Bwb3J0dW5pdGllcyBhdmFpbGFibGUgZm9yXG4gKiBjb250cmlidXRvcnMgdG8gY29udHJpYnV0ZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQ29udHJpYnV0aW9uT3Bwb3J0dW5pdGllc0JhY2tlbmRBcGlTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdPUFBPUlRVTklUWV9UWVBFX1RSQU5TTEFUSU9OJyxcbiAgICAnT1BQT1JUVU5JVFlfVFlQRV9WT0lDRU9WRVInLCBmdW5jdGlvbiAoJGh0dHAsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBPUFBPUlRVTklUWV9UWVBFX1RSQU5TTEFUSU9OLCBPUFBPUlRVTklUWV9UWVBFX1ZPSUNFT1ZFUikge1xuICAgICAgICB2YXIgdXJsVGVtcGxhdGUgPSAnL29wcG9ydHVuaXRpZXNzdW1tYXJ5aGFuZGxlci88b3Bwb3J0dW5pdHlUeXBlPic7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmZXRjaFRyYW5zbGF0aW9uT3Bwb3J0dW5pdGllczogZnVuY3Rpb24gKGxhbmd1YWdlQ29kZSwgY3Vyc29yLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKHVybFRlbXBsYXRlLCB7IG9wcG9ydHVuaXR5VHlwZTogT1BQT1JUVU5JVFlfVFlQRV9UUkFOU0xBVElPTiB9KSwge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlX2NvZGU6IGxhbmd1YWdlQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogY3Vyc29yXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmV0Y2hWb2ljZW92ZXJPcHBvcnR1bml0aWVzOiBmdW5jdGlvbiAobGFuZ3VhZ2VDb2RlLCBjdXJzb3IsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwodXJsVGVtcGxhdGUsIHsgb3Bwb3J0dW5pdHlUeXBlOiBPUFBPUlRVTklUWV9UWVBFX1ZPSUNFT1ZFUiB9KSwge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlX2NvZGU6IGxhbmd1YWdlQ29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogY3Vyc29yXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBBIHNlcnZpY2UgZm9yIGhhbmRsaW5nIGNvbnRyaWJ1dGlvbiBvcHBvcnR1bml0aWVzIGluIGRpZmZlcmVudFxuICogZmllbGRzLlxuICovXG5yZXF1aXJlKCdwYWdlcy9jb21tdW5pdHktZGFzaGJvYXJkLXBhZ2Uvc2VydmljZXMvJyArXG4gICAgJ2NvbnRyaWJ1dGlvbi1vcHBvcnR1bml0aWVzLWJhY2tlbmQtYXBpLnNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NvbnRyaWJ1dGlvbk9wcG9ydHVuaXRpZXNTZXJ2aWNlJywgW1xuICAgICdDb250cmlidXRpb25PcHBvcnR1bml0aWVzQmFja2VuZEFwaVNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChDb250cmlidXRpb25PcHBvcnR1bml0aWVzQmFja2VuZEFwaVNlcnZpY2UpIHtcbiAgICAgICAgdmFyIHRyYW5zbGF0aW9uT3Bwb3J0dW5pdGllc0N1cnNvciA9IG51bGw7XG4gICAgICAgIHZhciB2b2ljZW92ZXJPcHBvcnR1bml0aWVzQ3Vyc29yID0gbnVsbDtcbiAgICAgICAgdmFyIG1vcmVUcmFuc2xhdGlvbk9wcG9ydHVuaXRpZXNBdmFpbGFibGUgPSB0cnVlO1xuICAgICAgICB2YXIgbW9yZVZvaWNlb3Zlck9wcG9ydHVuaXRpZXNBdmFpbGFibGUgPSB0cnVlO1xuICAgICAgICB2YXIgX2dldFRyYW5zbGF0aW9uT3Bwb3J0dW5pdGllcyA9IGZ1bmN0aW9uIChsYW5ndWFnZUNvZGUsIGN1cnNvciwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICBDb250cmlidXRpb25PcHBvcnR1bml0aWVzQmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hUcmFuc2xhdGlvbk9wcG9ydHVuaXRpZXMobGFuZ3VhZ2VDb2RlLCBjdXJzb3IsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgbW9yZVRyYW5zbGF0aW9uT3Bwb3J0dW5pdGllc0F2YWlsYWJsZSA9IGRhdGEubW9yZTtcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGlvbk9wcG9ydHVuaXRpZXNDdXJzb3IgPSBkYXRhLm5leHRfY3Vyc29yO1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhkYXRhLm9wcG9ydHVuaXRpZXMsIGRhdGEubW9yZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXRWb2ljZW92ZXJPcHBvcnR1bml0aWVzID0gZnVuY3Rpb24gKGxhbmd1YWdlQ29kZSwgY3Vyc29yLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIENvbnRyaWJ1dGlvbk9wcG9ydHVuaXRpZXNCYWNrZW5kQXBpU2VydmljZS5mZXRjaFZvaWNlb3Zlck9wcG9ydHVuaXRpZXMobGFuZ3VhZ2VDb2RlLCBjdXJzb3IsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgbW9yZVZvaWNlb3Zlck9wcG9ydHVuaXRpZXNBdmFpbGFibGUgPSBkYXRhLm1vcmU7XG4gICAgICAgICAgICAgICAgdm9pY2VvdmVyT3Bwb3J0dW5pdGllc0N1cnNvciA9IGRhdGEubmV4dF9jdXJzb3I7XG4gICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGRhdGEub3Bwb3J0dW5pdGllcywgZGF0YS5tb3JlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0VHJhbnNsYXRpb25PcHBvcnR1bml0aWVzOiBmdW5jdGlvbiAobGFuZ3VhZ2VDb2RlLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBfZ2V0VHJhbnNsYXRpb25PcHBvcnR1bml0aWVzKGxhbmd1YWdlQ29kZSwgJycsIHN1Y2Nlc3NDYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Vm9pY2VvdmVyT3Bwb3J0dW5pdGllczogZnVuY3Rpb24gKGxhbmd1YWdlQ29kZSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX2dldFZvaWNlb3Zlck9wcG9ydHVuaXRpZXMobGFuZ3VhZ2VDb2RlLCAnJywgc3VjY2Vzc0NhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRNb3JlVHJhbnNsYXRpb25PcHBvcnR1bml0aWVzOiBmdW5jdGlvbiAobGFuZ3VhZ2VDb2RlLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAobW9yZVRyYW5zbGF0aW9uT3Bwb3J0dW5pdGllc0F2YWlsYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBfZ2V0VHJhbnNsYXRpb25PcHBvcnR1bml0aWVzKGxhbmd1YWdlQ29kZSwgdHJhbnNsYXRpb25PcHBvcnR1bml0aWVzQ3Vyc29yLCBzdWNjZXNzQ2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRNb3JlVm9pY2VvdmVyT3Bwb3J0dW5pdGllczogZnVuY3Rpb24gKGxhbmd1YWdlQ29kZSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1vcmVWb2ljZW92ZXJPcHBvcnR1bml0aWVzQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIF9nZXRWb2ljZW92ZXJPcHBvcnR1bml0aWVzKGxhbmd1YWdlQ29kZSwgdm9pY2VvdmVyT3Bwb3J0dW5pdGllc0N1cnNvciwgc3VjY2Vzc0NhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHRyYW5zbGF0aW9uIG9wcG9ydHVuaXRpZXMuXG4gKi9cbnJlcXVpcmUoJ3BhZ2VzL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS9vcHBvcnR1bml0aWVzLWxpc3QvJyArXG4gICAgJ29wcG9ydHVuaXRpZXMtbGlzdC5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS9zZXJ2aWNlcy8nICtcbiAgICAnY29udHJpYnV0aW9uLW9wcG9ydHVuaXRpZXMuc2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvdHJhbnNsYXRpb24tdGFiL3NlcnZpY2VzLycgK1xuICAgICd0cmFuc2xhdGlvbi1sYW5ndWFnZS5zZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3RyYW5zbGF0aW9uT3Bwb3J0dW5pdGllcycsIFsnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbW11bml0eS1kYXNoYm9hcmQtcGFnZS90cmFuc2xhdGlvbi1vcHBvcnR1bml0aWVzLycgK1xuICAgICAgICAgICAgICAgICd0cmFuc2xhdGlvbi1vcHBvcnR1bml0aWVzLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICdDb250cmlidXRpb25PcHBvcnR1bml0aWVzU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1RyYW5zbGF0aW9uTGFuZ3VhZ2VTZXJ2aWNlJywgZnVuY3Rpb24gKCRzY29wZSwgQ29udHJpYnV0aW9uT3Bwb3J0dW5pdGllc1NlcnZpY2UsIFRyYW5zbGF0aW9uTGFuZ3VhZ2VTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vcHBvcnR1bml0aWVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN0cmwub3Bwb3J0dW5pdGllc0FyZUxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm1vcmVPcHBvcnR1bml0aWVzQXZhaWxhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVwZGF0ZVdpdGhOZXdPcHBvcnR1bml0aWVzID0gZnVuY3Rpb24gKG9wcG9ydHVuaXRpZXMsIG1vcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGluZGV4IGluIG9wcG9ydHVuaXRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3Bwb3J0dW5pdHkgPSBvcHBvcnR1bml0aWVzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3ViaGVhZGluZyA9IChvcHBvcnR1bml0eS50b3BpY19uYW1lICsgJyAtICcgKyBvcHBvcnR1bml0eS5zdG9yeV90aXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhlYWRpbmcgPSBvcHBvcnR1bml0eS5jaGFwdGVyX3RpdGxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9ncmVzc1BlcmNlbnRhZ2UgPSAnMC4wMCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvdGFsQ29udGVudENvdW50ID0gb3Bwb3J0dW5pdHkuY29udGVudF9jb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFuZ3VhZ2VDb2RlID0gKFRyYW5zbGF0aW9uTGFuZ3VhZ2VTZXJ2aWNlLmdldEFjdGl2ZUxhbmd1YWdlQ29kZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFuZ3VhZ2VEZXNjcmlwdGlvbiA9IChUcmFuc2xhdGlvbkxhbmd1YWdlU2VydmljZS5nZXRBY3RpdmVMYW5ndWFnZURlc2NyaXB0aW9uKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHBvcnR1bml0eS50cmFuc2xhdGlvbl9jb3VudHMuaGFzT3duUHJvcGVydHkobGFuZ3VhZ2VDb2RlKSAmJiAodG90YWxDb250ZW50Q291bnQgPiAwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvZ3Jlc3NQZXJjZW50YWdlID0gKChvcHBvcnR1bml0eS50cmFuc2xhdGlvbl9jb3VudHNbbGFuZ3VhZ2VDb2RlXSAvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbENvbnRlbnRDb3VudCkgKiAxMDApLnRvRml4ZWQoMik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwub3Bwb3J0dW5pdGllcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGluZzogaGVhZGluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViaGVhZGluZzogc3ViaGVhZGluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3NQZXJjZW50YWdlOiBwcm9ncmVzc1BlcmNlbnRhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbkJ1dHRvblRpdGxlOiAnVHJhbnNsYXRlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5tb3JlT3Bwb3J0dW5pdGllc0F2YWlsYWJsZSA9IG1vcmU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm9wcG9ydHVuaXRpZXNBcmVMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2FjdGl2ZUxhbmd1YWdlQ2hhbmdlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwub3Bwb3J0dW5pdGllcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5vcHBvcnR1bml0aWVzQXJlTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm1vcmVPcHBvcnR1bml0aWVzQXZhaWxhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbnRyaWJ1dGlvbk9wcG9ydHVuaXRpZXNTZXJ2aWNlLmdldFRyYW5zbGF0aW9uT3Bwb3J0dW5pdGllcyhUcmFuc2xhdGlvbkxhbmd1YWdlU2VydmljZS5nZXRBY3RpdmVMYW5ndWFnZUNvZGUoKSwgdXBkYXRlV2l0aE5ld09wcG9ydHVuaXRpZXMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbkxvYWRNb3JlT3Bwb3J0dW5pdGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3RybC5vcHBvcnR1bml0aWVzQXJlTG9hZGluZyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubW9yZU9wcG9ydHVuaXRpZXNBdmFpbGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm9wcG9ydHVuaXRpZXNBcmVMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb250cmlidXRpb25PcHBvcnR1bml0aWVzU2VydmljZS5nZXRNb3JlVHJhbnNsYXRpb25PcHBvcnR1bml0aWVzKFRyYW5zbGF0aW9uTGFuZ3VhZ2VTZXJ2aWNlLmdldEFjdGl2ZUxhbmd1YWdlQ29kZSgpLCB1cGRhdGVXaXRoTmV3T3Bwb3J0dW5pdGllcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIENvbnRyaWJ1dGlvbk9wcG9ydHVuaXRpZXNTZXJ2aWNlLmdldFRyYW5zbGF0aW9uT3Bwb3J0dW5pdGllcyhUcmFuc2xhdGlvbkxhbmd1YWdlU2VydmljZS5nZXRBY3RpdmVMYW5ndWFnZUNvZGUoKSwgdXBkYXRlV2l0aE5ld09wcG9ydHVuaXRpZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHZvaWNlb3ZlciBvcHBvcnR1bml0aWVzLlxuICovXG5yZXF1aXJlKCdwYWdlcy9jb21tdW5pdHktZGFzaGJvYXJkLXBhZ2Uvb3Bwb3J0dW5pdGllcy1saXN0LycgK1xuICAgICdvcHBvcnR1bml0aWVzLWxpc3QuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb21tdW5pdHktZGFzaGJvYXJkLXBhZ2Uvc2VydmljZXMvJyArXG4gICAgJ2NvbnRyaWJ1dGlvbi1vcHBvcnR1bml0aWVzLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3RyYW5zbGF0aW9uLXRhYi9zZXJ2aWNlcy8nICtcbiAgICAndHJhbnNsYXRpb24tbGFuZ3VhZ2Uuc2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCd2b2ljZW92ZXJPcHBvcnR1bml0aWVzJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29tbXVuaXR5LWRhc2hib2FyZC1wYWdlL3RyYW5zbGF0aW9uLW9wcG9ydHVuaXRpZXMvJyArXG4gICAgICAgICAgICAgICAgJ3RyYW5zbGF0aW9uLW9wcG9ydHVuaXRpZXMuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJ0NvbnRyaWJ1dGlvbk9wcG9ydHVuaXRpZXNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnVHJhbnNsYXRpb25MYW5ndWFnZVNlcnZpY2UnLCBmdW5jdGlvbiAoJHNjb3BlLCBDb250cmlidXRpb25PcHBvcnR1bml0aWVzU2VydmljZSwgVHJhbnNsYXRpb25MYW5ndWFnZVNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9wcG9ydHVuaXRpZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vcHBvcnR1bml0aWVzQXJlTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubW9yZU9wcG9ydHVuaXRpZXNBdmFpbGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnByb2dyZXNzQmFyUmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVwZGF0ZVdpdGhOZXdPcHBvcnR1bml0aWVzID0gZnVuY3Rpb24gKG9wcG9ydHVuaXRpZXMsIG1vcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGluZGV4IGluIG9wcG9ydHVuaXRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3Bwb3J0dW5pdHkgPSBvcHBvcnR1bml0aWVzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3ViaGVhZGluZyA9IChvcHBvcnR1bml0eS50b3BpY19uYW1lICsgJyAtICcgKyBvcHBvcnR1bml0eS5zdG9yeV90aXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhlYWRpbmcgPSBvcHBvcnR1bml0eS5jaGFwdGVyX3RpdGxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwub3Bwb3J0dW5pdGllcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGluZzogaGVhZGluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViaGVhZGluZzogc3ViaGVhZGluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uQnV0dG9uVGl0bGU6ICdSZXF1ZXN0IHRvIFZvaWNlb3ZlcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubW9yZU9wcG9ydHVuaXRpZXNBdmFpbGFibGUgPSBtb3JlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5vcHBvcnR1bml0aWVzQXJlTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdhY3RpdmVMYW5ndWFnZUNoYW5nZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm9wcG9ydHVuaXRpZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwub3Bwb3J0dW5pdGllc0FyZUxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgQ29udHJpYnV0aW9uT3Bwb3J0dW5pdGllc1NlcnZpY2UuZ2V0Vm9pY2VvdmVyT3Bwb3J0dW5pdGllcyhUcmFuc2xhdGlvbkxhbmd1YWdlU2VydmljZS5nZXRBY3RpdmVMYW5ndWFnZUNvZGUoKSwgdXBkYXRlV2l0aE5ld09wcG9ydHVuaXRpZXMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbkxvYWRNb3JlT3Bwb3J0dW5pdGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3RybC5vcHBvcnR1bml0aWVzQXJlTG9hZGluZyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubW9yZU9wcG9ydHVuaXRpZXNBdmFpbGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm9wcG9ydHVuaXRpZXNBcmVMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb250cmlidXRpb25PcHBvcnR1bml0aWVzU2VydmljZS5nZXRNb3JlVm9pY2VvdmVyT3Bwb3J0dW5pdGllcyhUcmFuc2xhdGlvbkxhbmd1YWdlU2VydmljZS5nZXRBY3RpdmVMYW5ndWFnZUNvZGUoKSwgdXBkYXRlV2l0aE5ld09wcG9ydHVuaXRpZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBDb250cmlidXRpb25PcHBvcnR1bml0aWVzU2VydmljZS5nZXRWb2ljZW92ZXJPcHBvcnR1bml0aWVzKFRyYW5zbGF0aW9uTGFuZ3VhZ2VTZXJ2aWNlLmdldEFjdGl2ZUxhbmd1YWdlQ29kZSgpLCB1cGRhdGVXaXRoTmV3T3Bwb3J0dW5pdGllcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBBIHNlcnZpY2UgdGhhdCBtYWludGFpbnMgYSByZWNvcmQgb2Ygd2hpY2ggbGFuZ3VhZ2VcbiAqIGluIHRoZSB0cmFuc2xhdGlvbiB0YWIgaXMgY3VycmVudGx5IGFjdGl2ZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9MYW5ndWFnZVV0aWxTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdUcmFuc2xhdGlvbkxhbmd1YWdlU2VydmljZScsIFtcbiAgICAnJGxvZycsICckcm9vdFNjb3BlJywgJ0xhbmd1YWdlVXRpbFNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkbG9nLCAkcm9vdFNjb3BlLCBMYW5ndWFnZVV0aWxTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBhY3RpdmVMYW5ndWFnZUNvZGUgPSBudWxsO1xuICAgICAgICB2YXIgYWxsQXVkaW9MYW5ndWFnZUNvZGVzID0gKExhbmd1YWdlVXRpbFNlcnZpY2UuZ2V0QWxsVm9pY2VvdmVyTGFuZ3VhZ2VDb2RlcygpKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldEFjdGl2ZUxhbmd1YWdlQ29kZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY3RpdmVMYW5ndWFnZUNvZGU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0QWN0aXZlTGFuZ3VhZ2VDb2RlOiBmdW5jdGlvbiAobmV3QWN0aXZlTGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFsbEF1ZGlvTGFuZ3VhZ2VDb2Rlcy5pbmRleE9mKG5ld0FjdGl2ZUxhbmd1YWdlQ29kZSkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoJ0ludmFsaWQgYWN0aXZlIGxhbmd1YWdlIGNvZGU6ICcgKyBuZXdBY3RpdmVMYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFjdGl2ZUxhbmd1YWdlQ29kZSA9IG5ld0FjdGl2ZUxhbmd1YWdlQ29kZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2FjdGl2ZUxhbmd1YWdlQ2hhbmdlZCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFjdGl2ZUxhbmd1YWdlRGVzY3JpcHRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTGFuZ3VhZ2VVdGlsU2VydmljZS5nZXRBdWRpb0xhbmd1YWdlRGVzY3JpcHRpb24oYWN0aXZlTGFuZ3VhZ2VDb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlIGZvciBzYXZpbmcgZGF0YSBsb2NhbGx5IG9uIHRoZSBjbGllbnQgbWFjaGluZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL0V4cGxvcmF0aW9uRHJhZnRPYmplY3RGYWN0b3J5LnRzJyk7XG4vLyBTZXJ2aWNlIGZvciBzYXZpbmcgZXhwbG9yYXRpb24gZHJhZnQgY2hhbmdlcyB0byBsb2NhbCBzdG9yYWdlLlxuLy9cbi8vIE5vdGUgdGhhdCB0aGUgZHJhZnQgaXMgb25seSBzYXZlZCBpZiBsb2NhbFN0b3JhZ2UgZXhpc3RzIGFuZCB3b3Jrc1xuLy8gKGkuZS4gaGFzIHN0b3JhZ2UgY2FwYWNpdHkpLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnTG9jYWxTdG9yYWdlU2VydmljZScsIFtcbiAgICAnRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnknLFxuICAgIGZ1bmN0aW9uIChFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeSkge1xuICAgICAgICAvLyBDaGVjayB0aGF0IGxvY2FsIHN0b3JhZ2UgZXhpc3RzIGFuZCB3b3JrcyBhcyBleHBlY3RlZC5cbiAgICAgICAgLy8gSWYgaXQgZG9lcyBzdG9yYWdlIHN0b3JlcyB0aGUgbG9jYWxTdG9yYWdlIG9iamVjdCxcbiAgICAgICAgLy8gZWxzZSBzdG9yYWdlIGlzIHVuZGVmaW5lZCBvciBmYWxzZS5cbiAgICAgICAgdmFyIHN0b3JhZ2UgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRlc3QgPSAndGVzdCc7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0ZXN0LCB0ZXN0KTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSh0ZXN0KSA9PT0gdGVzdDtcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0ZXN0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0ICYmIGxvY2FsU3RvcmFnZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChleGNlcHRpb24pIHsgfVxuICAgICAgICB9KCkpO1xuICAgICAgICB2YXIgTEFTVF9TRUxFQ1RFRF9UUkFOU0xBVElPTl9MQU5HVUFHRV9LRVkgPSAoJ2xhc3Rfc2VsZWN0ZWRfdHJhbnNsYXRpb25fbGFuZycpO1xuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIHRoZSBrZXkgdG8gYWNjZXNzIHRoZSBjaGFuZ2VMaXN0IGluIGxvY2FsU3RvcmFnZVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXhwbG9yYXRpb25JZCAtIFRoZSBleHBsb3JhdGlvbiBpZCBvZiB0aGUgY2hhbmdlTGlzdFxuICAgICAgICAgKiAgIHRvIGJlIGFjY2Vzc2VkLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9jcmVhdGVFeHBsb3JhdGlvbkRyYWZ0S2V5ID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgIHJldHVybiAnZHJhZnRfJyArIGV4cGxvcmF0aW9uSWQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENoZWNrIHRoYXQgbG9jYWxTdG9yYWdlIGlzIGF2YWlsYWJsZSB0byB0aGUgY2xpZW50LlxuICAgICAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIHRoZSBjbGllbnQgaGFzIGFjY2VzcyB0byBsb2NhbFN0b3JhZ2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlzU3RvcmFnZUF2YWlsYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBCb29sZWFuKHN0b3JhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2F2ZSB0aGUgZ2l2ZW4gY2hhbmdlTGlzdCB0byBsb2NhbFN0b3JhZ2UgYWxvbmcgd2l0aCBpdHNcbiAgICAgICAgICAgICAqIGRyYWZ0Q2hhbmdlTGlzdElkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXhwbG9yYXRpb25JZCAtIFRoZSBpZCBvZiB0aGUgZXhwbG9yYXRpb25cbiAgICAgICAgICAgICAqICAgYXNzb2NpYXRlZCB3aXRoIHRoZSBjaGFuZ2VMaXN0IHRvIGJlIHNhdmVkLlxuICAgICAgICAgICAgICogQHBhcmFtIHtMaXN0fSBjaGFuZ2VMaXN0IC0gVGhlIGV4cGxvcmF0aW9uIGNoYW5nZSBsaXN0IHRvIGJlIHNhdmVkLlxuICAgICAgICAgICAgICogQHBhcmFtIHtJbnRlZ2VyfSBkcmFmdENoYW5nZUxpc3RJZCAtIFRoZSBpZCBvZiB0aGUgZHJhZnQgdG8gYmUgc2F2ZWQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNhdmVFeHBsb3JhdGlvbkRyYWZ0OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCwgY2hhbmdlTGlzdCwgZHJhZnRDaGFuZ2VMaXN0SWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYWxTYXZlS2V5ID0gX2NyZWF0ZUV4cGxvcmF0aW9uRHJhZnRLZXkoZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRyYWZ0RGljdCA9IEV4cGxvcmF0aW9uRHJhZnRPYmplY3RGYWN0b3J5LnRvTG9jYWxTdG9yYWdlRGljdChjaGFuZ2VMaXN0LCBkcmFmdENoYW5nZUxpc3RJZCk7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JhZ2Uuc2V0SXRlbShsb2NhbFNhdmVLZXksIEpTT04uc3RyaW5naWZ5KGRyYWZ0RGljdCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHJpZXZlIHRoZSBsb2NhbCBzYXZlIG9mIHRoZSBjaGFuZ2VMaXN0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW5cbiAgICAgICAgICAgICAqIGV4cGxvcmF0aW9uIGlkLlxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGV4cGxvcmF0aW9uSWQgLSBUaGUgZXhwbG9yYXRpb24gaWQgb2YgdGhlIGNoYW5nZSBsaXN0XG4gICAgICAgICAgICAgKiAgIHRvIGJlIHJldHJpZXZlZC5cbiAgICAgICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBsb2NhbCBzYXZlIGRyYWZ0IG9iamVjdCBpZiBpdCBleGlzdHMsXG4gICAgICAgICAgICAgKiAgIGVsc2UgbnVsbC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0RXhwbG9yYXRpb25EcmFmdDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZHJhZnREaWN0ID0gSlNPTi5wYXJzZShzdG9yYWdlLmdldEl0ZW0oX2NyZWF0ZUV4cGxvcmF0aW9uRHJhZnRLZXkoZXhwbG9yYXRpb25JZCkpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRyYWZ0RGljdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cGxvcmF0aW9uRHJhZnRPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21Mb2NhbFN0b3JhZ2VEaWN0KGRyYWZ0RGljdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZW1vdmUgdGhlIGxvY2FsIHNhdmUgb2YgdGhlIGNoYW5nZUxpc3QgYXNzb2NpYXRlZCB3aXRoIHRoZSBnaXZlblxuICAgICAgICAgICAgICogZXhwbG9yYXRpb24gaWQuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXhwbG9yYXRpb25JZCAtIFRoZSBleHBsb3JhdGlvbiBpZCBvZiB0aGUgY2hhbmdlIGxpc3RcbiAgICAgICAgICAgICAqICAgdG8gYmUgcmVtb3ZlZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVtb3ZlRXhwbG9yYXRpb25EcmFmdDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgICAgICBzdG9yYWdlLnJlbW92ZUl0ZW0oX2NyZWF0ZUV4cGxvcmF0aW9uRHJhZnRLZXkoZXhwbG9yYXRpb25JZCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNhdmUgdGhlIGdpdmVuIGxhbmd1YWdlIGNvZGUgdG8gbG9jYWxTdG9yYWdlIGFsb25nLlxuICAgICAgICAgICAgICogQHBhcmFtIHtMaXN0fSBjaGFuZ2VMaXN0IC0gVGhlIGxhc3Qgc2VsZWN0ZWQgbGFuZ3VhZ2UgY29kZSB0byBiZSBzYXZlZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdXBkYXRlTGFzdFNlbGVjdGVkVHJhbnNsYXRpb25MYW5ndWFnZUNvZGU6IGZ1bmN0aW9uIChsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgICAgICBzdG9yYWdlLnNldEl0ZW0oTEFTVF9TRUxFQ1RFRF9UUkFOU0xBVElPTl9MQU5HVUFHRV9LRVksIGxhbmd1YWdlQ29kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0cmlldmUgdGhlIGxvY2FsIHNhdmUgb2YgdGhlIGxhc3Qgc2VsZWN0ZWQgbGFuZ3VhZ2UgZm9yIHRyYW5zbGF0aW9uLlxuICAgICAgICAgICAgICogQHJldHVybnMge1N0cmluZ30gVGhlIGxvY2FsIHNhdmUgb2YgdGhlIGxhc3Qgc2VsZWN0ZWQgbGFuZ3VhZ2UgZm9yXG4gICAgICAgICAgICAgKiAgIHRyYW5zbGF0aW9uIGlmIGl0IGV4aXN0cywgZWxzZSBudWxsLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRMYXN0U2VsZWN0ZWRUcmFuc2xhdGlvbkxhbmd1YWdlQ29kZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYW5ndWFnZUNvZGUgPSAoc3RvcmFnZS5nZXRJdGVtKExBU1RfU0VMRUNURURfVFJBTlNMQVRJT05fTEFOR1VBR0VfS0VZKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZUNvZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=