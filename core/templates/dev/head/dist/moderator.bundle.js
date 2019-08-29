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
/******/ 		"moderator": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/moderator-page/moderator-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~b9580ed0","admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~d3595155","admin~exploration_editor~exploration_player~moderator~practice_session~review_test~skill_editor~stor~7734cddb"]);
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

/***/ "./core/templates/dev/head/pages/moderator-page/moderator-page.controller.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/pages/moderator-page/moderator-page.controller.ts ***!
  \***********************************************************************************/
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
 * @fileoverview Data and controllers for the Oppia moderator page.
 */
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-editor.directive.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
angular.module('oppia').directive('moderatorPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/moderator-page/moderator-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$http', '$rootScope', 'AlertsService', 'DateTimeFormatService',
                function ($http, $rootScope, AlertsService, DateTimeFormatService) {
                    var ctrl = this;
                    $rootScope.loadingMessage = 'Loading';
                    ctrl.getDatetimeAsString = function (millisSinceEpoch) {
                        return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
                    };
                    ctrl.getExplorationCreateUrl = function (explorationId) {
                        return '/create/' + explorationId;
                    };
                    ctrl.getActivityCreateUrl = function (reference) {
                        return ((reference.type === ('exploration' ? '/create' : undefined)) +
                            '/' + reference.id);
                    };
                    ctrl.allCommits = [];
                    ctrl.allFeedbackMessages = [];
                    // Map of exploration ids to objects containing a single key: title.
                    ctrl.explorationData = {};
                    ctrl.displayedFeaturedActivityReferences = [];
                    ctrl.lastSavedFeaturedActivityReferences = [];
                    ctrl.FEATURED_ACTIVITY_REFERENCES_SCHEMA = {
                        type: 'list',
                        items: {
                            type: 'dict',
                            properties: [{
                                    name: 'type',
                                    schema: {
                                        type: 'unicode',
                                        choices: ['exploration', 'collection']
                                    }
                                }, {
                                    name: 'id',
                                    schema: {
                                        type: 'unicode'
                                    }
                                }]
                        }
                    };
                    var RECENT_COMMITS_URL = ('/recentcommitshandler/recent_commits' +
                        '?query_type=all_non_private_commits');
                    // TODO(sll): Update this to also support collections.
                    $http.get(RECENT_COMMITS_URL).then(function (response) {
                        // Update the explorationData object with information about newly-
                        // discovered explorations.
                        var data = response.data;
                        var explorationIdsToExplorationData = data.exp_ids_to_exp_data;
                        for (var expId in explorationIdsToExplorationData) {
                            if (!ctrl.explorationData.hasOwnProperty(expId)) {
                                ctrl.explorationData[expId] = (explorationIdsToExplorationData[expId]);
                            }
                        }
                        ctrl.allCommits = data.results;
                        $rootScope.loadingMessage = '';
                    });
                    $http.get('/recent_feedback_messages').then(function (response) {
                        ctrl.allFeedbackMessages = response.data.results;
                    });
                    $http.get('/moderatorhandler/featured').then(function (response) {
                        ctrl.displayedFeaturedActivityReferences = (response.data.featured_activity_references);
                        ctrl.lastSavedFeaturedActivityReferences = angular.copy(ctrl.displayedFeaturedActivityReferences);
                    });
                    ctrl.isSaveFeaturedActivitiesButtonDisabled = function () {
                        return angular.equals(ctrl.displayedFeaturedActivityReferences, ctrl.lastSavedFeaturedActivityReferences);
                    };
                    ctrl.saveFeaturedActivityReferences = function () {
                        AlertsService.clearWarnings();
                        var activityReferencesToSave = angular.copy(ctrl.displayedFeaturedActivityReferences);
                        $http.post('/moderatorhandler/featured', {
                            featured_activity_reference_dicts: activityReferencesToSave
                        }).then(function () {
                            ctrl.lastSavedFeaturedActivityReferences = (activityReferencesToSave);
                            AlertsService.addSuccessMessage('Featured activities saved.');
                        });
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/moderator-page/moderator-page.module.ts":
/*!*******************************************************************************!*\
  !*** ./core/templates/dev/head/pages/moderator-page/moderator-page.module.ts ***!
  \*******************************************************************************/
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
 * @fileoverview Module for the moderator page.
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
var ModeratorPageModule = /** @class */ (function () {
    function ModeratorPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    ModeratorPageModule.prototype.ngDoBootstrap = function () { };
    ModeratorPageModule = __decorate([
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
    ], ModeratorPageModule);
    return ModeratorPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(ModeratorPageModule);
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

/***/ "./core/templates/dev/head/pages/moderator-page/moderator-page.scripts.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/pages/moderator-page/moderator-page.scripts.ts ***!
  \********************************************************************************/
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
 * @fileoverview Scripts for the Oppia moderator page.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/moderator-page/moderator-page.module.ts */ "./core/templates/dev/head/pages/moderator-page/moderator-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! pages/moderator-page/moderator-page.controller.ts */ "./core/templates/dev/head/pages/moderator-page/moderator-page.controller.ts");


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL09wcGlhRm9vdGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL21vZGVyYXRvci1wYWdlL21vZGVyYXRvci1wYWdlLmNvbnRyb2xsZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbW9kZXJhdG9yLXBhZ2UvbW9kZXJhdG9yLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL21vZGVyYXRvci1wYWdlL21vZGVyYXRvci1wYWdlLnNjcmlwdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQVEsb0JBQW9CO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQWlCLDRCQUE0QjtBQUM3QztBQUNBO0FBQ0EsMEJBQWtCLDJCQUEyQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFD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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsaUNBQWlDLG1CQUFPLENBQUMsNkhBQW1DO0FBQzVFLGVBQWUsbUJBQU8sQ0FBQyw4RkFBeUI7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOzs7Ozs7Ozs7Ozs7QUMxRkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyw4SEFBK0M7QUFDdkQsbUJBQU8sQ0FBQyxnREFBUTtBQUNoQixtQkFBTyxDQUFDLHNJQUFtRCIsImZpbGUiOiJtb2RlcmF0b3IuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuXG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcIm1vZGVyYXRvclwiOiAwXG4gXHR9O1xuXG4gXHR2YXIgZGVmZXJyZWRNb2R1bGVzID0gW107XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdHZhciBqc29ucEFycmF5ID0gd2luZG93W1wid2VicGFja0pzb25wXCJdID0gd2luZG93W1wid2VicGFja0pzb25wXCJdIHx8IFtdO1xuIFx0dmFyIG9sZEpzb25wRnVuY3Rpb24gPSBqc29ucEFycmF5LnB1c2guYmluZChqc29ucEFycmF5KTtcbiBcdGpzb25wQXJyYXkucHVzaCA9IHdlYnBhY2tKc29ucENhbGxiYWNrO1xuIFx0anNvbnBBcnJheSA9IGpzb25wQXJyYXkuc2xpY2UoKTtcbiBcdGZvcih2YXIgaSA9IDA7IGkgPCBqc29ucEFycmF5Lmxlbmd0aDsgaSsrKSB3ZWJwYWNrSnNvbnBDYWxsYmFjayhqc29ucEFycmF5W2ldKTtcbiBcdHZhciBwYXJlbnRKc29ucEZ1bmN0aW9uID0gb2xkSnNvbnBGdW5jdGlvbjtcblxuXG4gXHQvLyBhZGQgZW50cnkgbW9kdWxlIHRvIGRlZmVycmVkIGxpc3RcbiBcdGRlZmVycmVkTW9kdWxlcy5wdXNoKFtcIi4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbW9kZXJhdG9yLXBhZ2UvbW9kZXJhdG9yLXBhZ2Uuc2NyaXB0cy50c1wiLFwidmVuZG9yc35hYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcn43ODU2YzA1YVwiLFwiYWJvdXR+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29tbXVuaXR5X2Rhc2hib2FyZH5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lMDZhNGExN1wiLFwiYWRtaW5+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5tb2RlcmF0b3J+cHJhY3RpY2Vfc2Vzc2lvbn5yZXZpZXdfdGVzdH5iOTU4MGVkMFwiLFwiYWRtaW5+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5tb2RlcmF0b3J+cHJhY3RpY2Vfc2Vzc2lvbn5yZXZpZXdfdGVzdH5kMzU5NTE1NVwiLFwiYWRtaW5+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5tb2RlcmF0b3J+cHJhY3RpY2Vfc2Vzc2lvbn5yZXZpZXdfdGVzdH5za2lsbF9lZGl0b3J+c3Rvcn43NzM0Y2RkYlwiXSk7XG4gXHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIHJlYWR5XG4gXHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgQmFzZSBUcmFuc2NsdXNpb24gQ29tcG9uZW50LlxuICovXG5yZXF1aXJlKCdiYXNlX2NvbXBvbmVudHMvV2FybmluZ0xvYWRlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvT3BwaWFGb290ZXJEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9zaWRlYmFyL1NpZGViYXJTdGF0dXNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL3N0YXRlZnVsL0JhY2tncm91bmRNYXNrU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdiYXNlQ29udGVudCcsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdHJhbnNjbHVkZToge1xuICAgICAgICAgICAgICAgIGJyZWFkY3J1bWI6ICc/bmF2YmFyQnJlYWRjcnVtYicsXG4gICAgICAgICAgICAgICAgY29udGVudDogJ2NvbnRlbnQnLFxuICAgICAgICAgICAgICAgIGZvb3RlcjogJz9wYWdlRm9vdGVyJyxcbiAgICAgICAgICAgICAgICBuYXZPcHRpb25zOiAnP25hdk9wdGlvbnMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2Jhc2VfY29tcG9uZW50cy9iYXNlX2NvbnRlbnRfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHJvb3RTY29wZScsICdCYWNrZ3JvdW5kTWFza1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdTaWRlYmFyU3RhdHVzU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ1NJVEVfRkVFREJBQ0tfRk9STV9VUkwnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBCYWNrZ3JvdW5kTWFza1NlcnZpY2UsIFNpZGViYXJTdGF0dXNTZXJ2aWNlLCBVcmxTZXJ2aWNlLCBTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pZnJhbWVkID0gVXJsU2VydmljZS5pc0lmcmFtZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zaXRlRmVlZGJhY2tGb3JtVXJsID0gU0lURV9GRUVEQkFDS19GT1JNX1VSTDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1NpZGViYXJTaG93biA9IFNpZGViYXJTdGF0dXNTZXJ2aWNlLmlzU2lkZWJhclNob3duO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNsb3NlU2lkZWJhck9uU3dpcGUgPSBTaWRlYmFyU3RhdHVzU2VydmljZS5jbG9zZVNpZGViYXI7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNCYWNrZ3JvdW5kTWFza0FjdGl2ZSA9IEJhY2tncm91bmRNYXNrU2VydmljZS5pc01hc2tBY3RpdmU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuREVWX01PREUgPSAkcm9vdFNjb3BlLkRFVl9NT0RFO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNraXBUb01haW5Db250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1haW5Db250ZW50RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvcHBpYS1tYWluLWNvbnRlbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbWFpbkNvbnRlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1ZhcmlhYmxlIG1haW5Db250ZW50RWxlbWVudCBpcyB1bmRlZmluZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQudGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC5zY3JvbGxJbnRvVmlldygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHdhcm5pbmdfbG9hZGVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3dhcm5pbmdMb2FkZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2Jhc2VfY29tcG9uZW50cy93YXJuaW5nX2xvYWRlcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWydBbGVydHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoQWxlcnRzU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuQWxlcnRzU2VydmljZSA9IEFsZXJ0c1NlcnZpY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBmb290ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFGb290ZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9vcHBpYV9mb290ZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGF0YSBhbmQgY29udHJvbGxlcnMgZm9yIHRoZSBPcHBpYSBtb2RlcmF0b3IgcGFnZS5cbiAqL1xucmVxdWlyZSgnYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ21vZGVyYXRvclBhZ2UnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9tb2RlcmF0b3ItcGFnZS9tb2RlcmF0b3ItcGFnZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckaHR0cCcsICckcm9vdFNjb3BlJywgJ0FsZXJ0c1NlcnZpY2UnLCAnRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJGh0dHAsICRyb290U2NvcGUsIEFsZXJ0c1NlcnZpY2UsIERhdGVUaW1lRm9ybWF0U2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnTG9hZGluZyc7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0RGF0ZXRpbWVBc1N0cmluZyA9IGZ1bmN0aW9uIChtaWxsaXNTaW5jZUVwb2NoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLmdldExvY2FsZUFiYnJldmlhdGVkRGF0ZXRpbWVTdHJpbmcobWlsbGlzU2luY2VFcG9jaCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0RXhwbG9yYXRpb25DcmVhdGVVcmwgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcvY3JlYXRlLycgKyBleHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldEFjdGl2aXR5Q3JlYXRlVXJsID0gZnVuY3Rpb24gKHJlZmVyZW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgocmVmZXJlbmNlLnR5cGUgPT09ICgnZXhwbG9yYXRpb24nID8gJy9jcmVhdGUnIDogJy9jcmVhdGVfY29sbGVjdGlvbicpKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJy8nICsgcmVmZXJlbmNlLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5hbGxDb21taXRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYWxsRmVlZGJhY2tNZXNzYWdlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAvLyBNYXAgb2YgZXhwbG9yYXRpb24gaWRzIHRvIG9iamVjdHMgY29udGFpbmluZyBhIHNpbmdsZSBrZXk6IHRpdGxlLlxuICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cGxvcmF0aW9uRGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmRpc3BsYXllZEZlYXR1cmVkQWN0aXZpdHlSZWZlcmVuY2VzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubGFzdFNhdmVkRmVhdHVyZWRBY3Rpdml0eVJlZmVyZW5jZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5GRUFUVVJFRF9BQ1RJVklUWV9SRUZFUkVOQ0VTX1NDSEVNQSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdsaXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2RpY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAndHlwZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndW5pY29kZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hvaWNlczogWydleHBsb3JhdGlvbicsICdjb2xsZWN0aW9uJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd1bmljb2RlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgUkVDRU5UX0NPTU1JVFNfVVJMID0gKCcvcmVjZW50Y29tbWl0c2hhbmRsZXIvcmVjZW50X2NvbW1pdHMnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc/cXVlcnlfdHlwZT1hbGxfbm9uX3ByaXZhdGVfY29tbWl0cycpO1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IFVwZGF0ZSB0aGlzIHRvIGFsc28gc3VwcG9ydCBjb2xsZWN0aW9ucy5cbiAgICAgICAgICAgICAgICAgICAgJGh0dHAuZ2V0KFJFQ0VOVF9DT01NSVRTX1VSTCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZXhwbG9yYXRpb25EYXRhIG9iamVjdCB3aXRoIGluZm9ybWF0aW9uIGFib3V0IG5ld2x5LVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGlzY292ZXJlZCBleHBsb3JhdGlvbnMuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZHNUb0V4cGxvcmF0aW9uRGF0YSA9IGRhdGEuZXhwX2lkc190b19leHBfZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGV4cElkIGluIGV4cGxvcmF0aW9uSWRzVG9FeHBsb3JhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwuZXhwbG9yYXRpb25EYXRhLmhhc093blByb3BlcnR5KGV4cElkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cGxvcmF0aW9uRGF0YVtleHBJZF0gPSAoZXhwbG9yYXRpb25JZHNUb0V4cGxvcmF0aW9uRGF0YVtleHBJZF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuYWxsQ29tbWl0cyA9IGRhdGEucmVzdWx0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRodHRwLmdldCgnL3JlY2VudF9mZWVkYmFja19tZXNzYWdlcycpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFsbEZlZWRiYWNrTWVzc2FnZXMgPSByZXNwb25zZS5kYXRhLnJlc3VsdHM7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkaHR0cC5nZXQoJy9tb2RlcmF0b3JoYW5kbGVyL2ZlYXR1cmVkJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZGlzcGxheWVkRmVhdHVyZWRBY3Rpdml0eVJlZmVyZW5jZXMgPSAocmVzcG9uc2UuZGF0YS5mZWF0dXJlZF9hY3Rpdml0eV9yZWZlcmVuY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubGFzdFNhdmVkRmVhdHVyZWRBY3Rpdml0eVJlZmVyZW5jZXMgPSBhbmd1bGFyLmNvcHkoY3RybC5kaXNwbGF5ZWRGZWF0dXJlZEFjdGl2aXR5UmVmZXJlbmNlcyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzU2F2ZUZlYXR1cmVkQWN0aXZpdGllc0J1dHRvbkRpc2FibGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuZXF1YWxzKGN0cmwuZGlzcGxheWVkRmVhdHVyZWRBY3Rpdml0eVJlZmVyZW5jZXMsIGN0cmwubGFzdFNhdmVkRmVhdHVyZWRBY3Rpdml0eVJlZmVyZW5jZXMpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNhdmVGZWF0dXJlZEFjdGl2aXR5UmVmZXJlbmNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJXYXJuaW5ncygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdGl2aXR5UmVmZXJlbmNlc1RvU2F2ZSA9IGFuZ3VsYXIuY29weShjdHJsLmRpc3BsYXllZEZlYXR1cmVkQWN0aXZpdHlSZWZlcmVuY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoJy9tb2RlcmF0b3JoYW5kbGVyL2ZlYXR1cmVkJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVkX2FjdGl2aXR5X3JlZmVyZW5jZV9kaWN0czogYWN0aXZpdHlSZWZlcmVuY2VzVG9TYXZlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmxhc3RTYXZlZEZlYXR1cmVkQWN0aXZpdHlSZWZlcmVuY2VzID0gKGFjdGl2aXR5UmVmZXJlbmNlc1RvU2F2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRTdWNjZXNzTWVzc2FnZSgnRmVhdHVyZWQgYWN0aXZpdGllcyBzYXZlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgbW9kZXJhdG9yIHBhZ2UuXG4gKi9cbnJlcXVpcmUoXCJjb3JlLWpzL2VzNy9yZWZsZWN0XCIpO1xucmVxdWlyZShcInpvbmUuanNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl8xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgaHR0cF8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvbW1vbi9odHRwXCIpO1xuLy8gVGhpcyBjb21wb25lbnQgaXMgbmVlZGVkIHRvIGZvcmNlLWJvb3RzdHJhcCBBbmd1bGFyIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4vLyBhcHAuXG52YXIgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KCkge1xuICAgIH1cbiAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5Db21wb25lbnQoe1xuICAgICAgICAgICAgc2VsZWN0b3I6ICdzZXJ2aWNlLWJvb3RzdHJhcCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJydcbiAgICAgICAgfSlcbiAgICBdLCBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KTtcbiAgICByZXR1cm4gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbn0oKSk7XG5leHBvcnRzLlNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50O1xudmFyIGFwcF9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJhcHAuY29uc3RhbnRzXCIpO1xudmFyIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzXCIpO1xudmFyIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50c1wiKTtcbnZhciBNb2RlcmF0b3JQYWdlTW9kdWxlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1vZGVyYXRvclBhZ2VNb2R1bGUoKSB7XG4gICAgfVxuICAgIC8vIEVtcHR5IHBsYWNlaG9sZGVyIG1ldGhvZCB0byBzYXRpc2Z5IHRoZSBgQ29tcGlsZXJgLlxuICAgIE1vZGVyYXRvclBhZ2VNb2R1bGUucHJvdG90eXBlLm5nRG9Cb290c3RyYXAgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgTW9kZXJhdG9yUGFnZU1vZHVsZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuTmdNb2R1bGUoe1xuICAgICAgICAgICAgaW1wb3J0czogW1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtX2Jyb3dzZXJfMS5Ccm93c2VyTW9kdWxlLFxuICAgICAgICAgICAgICAgIGh0dHBfMS5IdHRwQ2xpZW50TW9kdWxlXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZGVjbGFyYXRpb25zOiBbXG4gICAgICAgICAgICAgICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGVudHJ5Q29tcG9uZW50czogW1xuICAgICAgICAgICAgICAgIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgICAgICAgICBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEuSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBvYmplY3RzX2RvbWFpbl9jb25zdGFudHNfMS5PYmplY3RzRG9tYWluQ29uc3RhbnRzLFxuICAgICAgICAgICAgXVxuICAgICAgICB9KVxuICAgIF0sIE1vZGVyYXRvclBhZ2VNb2R1bGUpO1xuICAgIHJldHVybiBNb2RlcmF0b3JQYWdlTW9kdWxlO1xufSgpKTtcbnZhciBwbGF0Zm9ybV9icm93c2VyX2R5bmFtaWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyLWR5bmFtaWNcIik7XG52YXIgc3RhdGljXzIgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgYm9vdHN0cmFwRm4gPSBmdW5jdGlvbiAoZXh0cmFQcm92aWRlcnMpIHtcbiAgICB2YXIgcGxhdGZvcm1SZWYgPSBwbGF0Zm9ybV9icm93c2VyX2R5bmFtaWNfMS5wbGF0Zm9ybUJyb3dzZXJEeW5hbWljKGV4dHJhUHJvdmlkZXJzKTtcbiAgICByZXR1cm4gcGxhdGZvcm1SZWYuYm9vdHN0cmFwTW9kdWxlKE1vZGVyYXRvclBhZ2VNb2R1bGUpO1xufTtcbnZhciBkb3duZ3JhZGVkTW9kdWxlID0gc3RhdGljXzIuZG93bmdyYWRlTW9kdWxlKGJvb3RzdHJhcEZuKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScsIFtcbiAgICAnZG5kTGlzdHMnLCAnaGVhZHJvb20nLCAnaW5maW5pdGUtc2Nyb2xsJywgJ25nQW5pbWF0ZScsXG4gICAgJ25nQXVkaW8nLCAnbmdDb29raWVzJywgJ25nSW1nQ3JvcCcsICduZ0pveVJpZGUnLCAnbmdNYXRlcmlhbCcsXG4gICAgJ25nUmVzb3VyY2UnLCAnbmdTYW5pdGl6ZScsICduZ1RvdWNoJywgJ3Bhc2NhbHByZWNodC50cmFuc2xhdGUnLFxuICAgICd0b2FzdHInLCAndWkuYm9vdHN0cmFwJywgJ3VpLnNvcnRhYmxlJywgJ3VpLnRyZWUnLCAndWkudmFsaWRhdGUnLFxuICAgIGRvd25ncmFkZWRNb2R1bGVcbl0pXG4gICAgLy8gVGhpcyBkaXJlY3RpdmUgaXMgdGhlIGRvd25ncmFkZWQgdmVyc2lvbiBvZiB0aGUgQW5ndWxhciBjb21wb25lbnQgdG9cbiAgICAvLyBib290c3RyYXAgdGhlIEFuZ3VsYXIgOC5cbiAgICAuZGlyZWN0aXZlKCdzZXJ2aWNlQm9vdHN0cmFwJywgc3RhdGljXzEuZG93bmdyYWRlQ29tcG9uZW50KHtcbiAgICBjb21wb25lbnQ6IFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbn0pKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2NyaXB0cyBmb3IgdGhlIE9wcGlhIG1vZGVyYXRvciBwYWdlLlxuICovXG4vLyBUaGUgbW9kdWxlIG5lZWRzIHRvIGJlIGxvYWRlZCBiZWZvcmUgZXZlcnl0aGluZyBlbHNlIHNpbmNlIGl0IGRlZmluZXMgdGhlXG4vLyBtYWluIG1vZHVsZSB0aGUgZWxlbWVudHMgYXJlIGF0dGFjaGVkIHRvLlxucmVxdWlyZSgncGFnZXMvbW9kZXJhdG9yLXBhZ2UvbW9kZXJhdG9yLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdBcHAudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL21vZGVyYXRvci1wYWdlL21vZGVyYXRvci1wYWdlLmNvbnRyb2xsZXIudHMnKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=