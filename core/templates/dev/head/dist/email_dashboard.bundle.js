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
/******/ 		"email_dashboard": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17"]);
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

/***/ "./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-data.service.ts":
/*!*********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-data.service.ts ***!
  \*********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Services for oppia email dashboard page.
 */
angular.module('oppia').factory('EmailDashboardDataService', [
    '$http', '$q', function ($http, $q) {
        var QUERY_DATA_URL = '/emaildashboarddatahandler';
        var QUERY_STATUS_CHECK_URL = '/querystatuscheck';
        // No. of query results to display on a single page.
        var QUERIES_PER_PAGE = 10;
        // Store latest cursor value for fetching next query page.
        var latestCursor = null;
        // Array containing all fetched queries.
        var queries = [];
        // Index of currently-shown page of query results.
        var currentPageIndex = -1;
        var fetchQueriesPage = function (pageSize, cursor) {
            return $http.get(QUERY_DATA_URL, {
                params: {
                    num_queries_to_fetch: pageSize,
                    cursor: cursor
                }
            }).then(function (response) {
                return response.data;
            });
        };
        return {
            getQueries: function () {
                return queries;
            },
            getCurrentPageIndex: function () {
                return currentPageIndex;
            },
            getLatestCursor: function () {
                return latestCursor;
            },
            submitQuery: function (data) {
                var startQueryIndex = currentPageIndex * QUERIES_PER_PAGE;
                var endQueryIndex = (currentPageIndex + 1) * QUERIES_PER_PAGE;
                return $http.post(QUERY_DATA_URL, {
                    data: data
                }).then(function (response) {
                    var data = response.data;
                    var newQueries = [data.query];
                    queries = newQueries.concat(queries);
                    return queries.slice(startQueryIndex, endQueryIndex);
                });
            },
            getNextQueries: function () {
                var startQueryIndex = (currentPageIndex + 1) * QUERIES_PER_PAGE;
                var endQueryIndex = (currentPageIndex + 2) * QUERIES_PER_PAGE;
                if (queries.length >= endQueryIndex ||
                    (latestCursor === null && currentPageIndex !== -1)) {
                    currentPageIndex = currentPageIndex + 1;
                    return $q(function (resolver) {
                        resolver(queries.slice(startQueryIndex, endQueryIndex));
                    });
                }
                else {
                    currentPageIndex = currentPageIndex + 1;
                    return fetchQueriesPage(QUERIES_PER_PAGE, latestCursor)
                        .then(function (data) {
                        queries = queries.concat(data.recent_queries);
                        latestCursor = data.cursor;
                        return queries.slice(startQueryIndex, endQueryIndex);
                    });
                }
            },
            getPreviousQueries: function () {
                var startQueryIndex = (currentPageIndex - 1) * QUERIES_PER_PAGE;
                var endQueryIndex = currentPageIndex * QUERIES_PER_PAGE;
                currentPageIndex = currentPageIndex - 1;
                return queries.slice(startQueryIndex, endQueryIndex);
            },
            isNextPageAvailable: function () {
                var nextQueryIndex = (currentPageIndex + 1) * QUERIES_PER_PAGE;
                return (queries.length > nextQueryIndex) || Boolean(latestCursor);
            },
            isPreviousPageAvailable: function () {
                return (currentPageIndex > 0);
            },
            fetchQuery: function (queryId) {
                return $http.get(QUERY_STATUS_CHECK_URL, {
                    params: {
                        query_id: queryId
                    }
                }).then(function (response) {
                    var data = response.data;
                    queries.forEach(function (query, index, queries) {
                        if (query.id === queryId) {
                            queries[index] = data.query;
                        }
                    });
                    return data.query;
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-page.controller.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-page.controller.ts ***!
  \************************************************************************************************/
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
 * @fileoverview Controller for oppia email dashboard page.
 */
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! pages/email-dashboard-pages/email-dashboard-data.service.ts */ "./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-data.service.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('oppia').directive('emailDashboardPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/email-dashboard-pages/email-dashboard-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$rootScope', 'EmailDashboardDataService', 'UserService',
                function ($rootScope, EmailDashboardDataService, UserService) {
                    var ctrl = this;
                    ctrl.username = '';
                    $rootScope.loadingMessage = 'Loading';
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        ctrl.username = userInfo.getUsername();
                        $rootScope.loadingMessage = '';
                    });
                    ctrl.currentPageOfQueries = [];
                    ctrl.resetForm = function () {
                        ctrl.has_not_logged_in_for_n_days = null;
                        ctrl.inactive_in_last_n_days = null;
                        ctrl.created_at_least_n_exps = null;
                        ctrl.created_fewer_than_n_exps = null;
                        ctrl.edited_at_least_n_exps = null;
                        ctrl.edited_fewer_than_n_exps = null;
                    };
                    ctrl.submitQuery = function () {
                        var data = {
                            has_not_logged_in_for_n_days: ctrl.has_not_logged_in_for_n_days,
                            inactive_in_last_n_days: ctrl.inactive_in_last_n_days,
                            created_at_least_n_exps: ctrl.created_at_least_n_exps,
                            created_fewer_than_n_exps: ctrl.created_fewer_than_n_exps,
                            edited_at_least_n_exps: ctrl.edited_at_least_n_exps,
                            edited_fewer_than_n_exps: ctrl.edited_fewer_than_n_exps
                        };
                        EmailDashboardDataService.submitQuery(data).then(function (queries) {
                            ctrl.currentPageOfQueries = queries;
                        });
                        ctrl.resetForm();
                        ctrl.showSuccessMessage = true;
                    };
                    ctrl.getNextPageOfQueries = function () {
                        if (EmailDashboardDataService.isNextPageAvailable()) {
                            EmailDashboardDataService.getNextQueries().then(function (queries) {
                                ctrl.currentPageOfQueries = queries;
                            });
                        }
                    };
                    ctrl.getPreviousPageOfQueries = function () {
                        if (EmailDashboardDataService.isPreviousPageAvailable()) {
                            ctrl.currentPageOfQueries = (EmailDashboardDataService.getPreviousQueries());
                        }
                    };
                    ctrl.showNextButton = function () {
                        return EmailDashboardDataService.isNextPageAvailable();
                    };
                    ctrl.showPreviousButton = function () {
                        return EmailDashboardDataService.isPreviousPageAvailable();
                    };
                    ctrl.recheckStatus = function (index) {
                        var queryId = ctrl.currentPageOfQueries[index].id;
                        EmailDashboardDataService.fetchQuery(queryId).then(function (query) {
                            ctrl.currentPageOfQueries[index] = query;
                        });
                    };
                    ctrl.showLinkToResultPage = function (submitter, status) {
                        return (submitter === ctrl.username) && (status === 'completed');
                    };
                    EmailDashboardDataService.getNextQueries().then(function (queries) {
                        ctrl.currentPageOfQueries = queries;
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-page.module.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-page.module.ts ***!
  \********************************************************************************************/
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
var EmailDashboardPageModule = /** @class */ (function () {
    function EmailDashboardPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    EmailDashboardPageModule.prototype.ngDoBootstrap = function () { };
    EmailDashboardPageModule = __decorate([
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
    ], EmailDashboardPageModule);
    return EmailDashboardPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(EmailDashboardPageModule);
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

/***/ "./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-page.scripts.ts":
/*!*********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-page.scripts.ts ***!
  \*********************************************************************************************/
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
 * @fileoverview Directive scripts for oppia email dashboard page.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/email-dashboard-pages/email-dashboard-page.module.ts */ "./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! pages/email-dashboard-pages/email-dashboard-page.controller.ts */ "./core/templates/dev/head/pages/email-dashboard-pages/email-dashboard-page.controller.ts");


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9PcHBpYUZvb3RlckRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZXMvZW1haWwtZGFzaGJvYXJkLWRhdGEuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZXMvZW1haWwtZGFzaGJvYXJkLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZXMvZW1haWwtZGFzaGJvYXJkLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2VtYWlsLWRhc2hib2FyZC1wYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZS5zY3JpcHRzLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUF5QyxpQ0FBaUM7QUFDMUUsd0hBQWdILG1CQUFtQixFQUFFO0FBQ3JJO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBZ0IsdUJBQXVCO0FBQ3ZDOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxzSEFBMkM7QUFDbkQsbUJBQU8sQ0FBQyw4RkFBK0I7QUFDdkMsbUJBQU8sQ0FBQyxnSEFBd0M7QUFDaEQsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0MsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7Ozs7Ozs7Ozs7OztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGtIQUF5QztBQUNqRCxtQkFBTyxDQUFDLDBKQUE2RDtBQUNyRSxtQkFBTyxDQUFDLGtGQUF5QjtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QyxRQUFRO0FBQ3BEO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGtFQUFxQjtBQUM3QixtQkFBTyxDQUFDLG9EQUFTO0FBQ2pCLGFBQWEsbUJBQU8sQ0FBQyxpRUFBZTtBQUNwQyx5QkFBeUIsbUJBQU8sQ0FBQyxxR0FBMkI7QUFDNUQsZUFBZSxtQkFBTyxDQUFDLDhGQUF5QjtBQUNoRCxhQUFhLG1CQUFPLENBQUMsMEVBQXNCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0Esc0JBQXNCLG1CQUFPLENBQUMsaUVBQWU7QUFDN0MseUNBQXlDLG1CQUFPLENBQUMsb0hBQStDO0FBQ2hHLGlDQUFpQyxtQkFBTyxDQUFDLHFIQUF5QztBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9FQUFvRTtBQUNwRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsaUNBQWlDLG1CQUFPLENBQUMsNkhBQW1DO0FBQzVFLGVBQWUsbUJBQU8sQ0FBQyw4RkFBeUI7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOzs7Ozs7Ozs7Ozs7QUMxRkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyx3SkFBNEQ7QUFDcEUsbUJBQU8sQ0FBQyxnREFBUTtBQUNoQixtQkFBTyxDQUFDLGdLQUFnRTs7Ozs7Ozs7Ozs7O0FDcEJ4RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QiLCJmaWxlIjoiZW1haWxfZGFzaGJvYXJkLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIGluc3RhbGwgYSBKU09OUCBjYWxsYmFjayBmb3IgY2h1bmsgbG9hZGluZ1xuIFx0ZnVuY3Rpb24gd2VicGFja0pzb25wQ2FsbGJhY2soZGF0YSkge1xuIFx0XHR2YXIgY2h1bmtJZHMgPSBkYXRhWzBdO1xuIFx0XHR2YXIgbW9yZU1vZHVsZXMgPSBkYXRhWzFdO1xuIFx0XHR2YXIgZXhlY3V0ZU1vZHVsZXMgPSBkYXRhWzJdO1xuXG4gXHRcdC8vIGFkZCBcIm1vcmVNb2R1bGVzXCIgdG8gdGhlIG1vZHVsZXMgb2JqZWN0LFxuIFx0XHQvLyB0aGVuIGZsYWcgYWxsIFwiY2h1bmtJZHNcIiBhcyBsb2FkZWQgYW5kIGZpcmUgY2FsbGJhY2tcbiBcdFx0dmFyIG1vZHVsZUlkLCBjaHVua0lkLCBpID0gMCwgcmVzb2x2ZXMgPSBbXTtcbiBcdFx0Zm9yKDtpIDwgY2h1bmtJZHMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHRjaHVua0lkID0gY2h1bmtJZHNbaV07XG4gXHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG4gXHRcdFx0XHRyZXNvbHZlcy5wdXNoKGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSk7XG4gXHRcdFx0fVxuIFx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IDA7XG4gXHRcdH1cbiBcdFx0Zm9yKG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG4gXHRcdFx0aWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcbiBcdFx0XHRcdG1vZHVsZXNbbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRpZihwYXJlbnRKc29ucEZ1bmN0aW9uKSBwYXJlbnRKc29ucEZ1bmN0aW9uKGRhdGEpO1xuXG4gXHRcdHdoaWxlKHJlc29sdmVzLmxlbmd0aCkge1xuIFx0XHRcdHJlc29sdmVzLnNoaWZ0KCkoKTtcbiBcdFx0fVxuXG4gXHRcdC8vIGFkZCBlbnRyeSBtb2R1bGVzIGZyb20gbG9hZGVkIGNodW5rIHRvIGRlZmVycmVkIGxpc3RcbiBcdFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2guYXBwbHkoZGVmZXJyZWRNb2R1bGVzLCBleGVjdXRlTW9kdWxlcyB8fCBbXSk7XG5cbiBcdFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiBhbGwgY2h1bmtzIHJlYWR5XG4gXHRcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIFx0fTtcbiBcdGZ1bmN0aW9uIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCkge1xuIFx0XHR2YXIgcmVzdWx0O1xuIFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWRNb2R1bGVzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0dmFyIGRlZmVycmVkTW9kdWxlID0gZGVmZXJyZWRNb2R1bGVzW2ldO1xuIFx0XHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuIFx0XHRcdGZvcih2YXIgaiA9IDE7IGogPCBkZWZlcnJlZE1vZHVsZS5sZW5ndGg7IGorKykge1xuIFx0XHRcdFx0dmFyIGRlcElkID0gZGVmZXJyZWRNb2R1bGVbal07XG4gXHRcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbZGVwSWRdICE9PSAwKSBmdWxmaWxsZWQgPSBmYWxzZTtcbiBcdFx0XHR9XG4gXHRcdFx0aWYoZnVsZmlsbGVkKSB7XG4gXHRcdFx0XHRkZWZlcnJlZE1vZHVsZXMuc3BsaWNlKGktLSwgMSk7XG4gXHRcdFx0XHRyZXN1bHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IGRlZmVycmVkTW9kdWxlWzBdKTtcbiBcdFx0XHR9XG4gXHRcdH1cblxuIFx0XHRyZXR1cm4gcmVzdWx0O1xuIFx0fVxuXG4gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGFuZCBsb2FkaW5nIGNodW5rc1xuIFx0Ly8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4gXHQvLyBQcm9taXNlID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxuIFx0dmFyIGluc3RhbGxlZENodW5rcyA9IHtcbiBcdFx0XCJlbWFpbF9kYXNoYm9hcmRcIjogMFxuIFx0fTtcblxuIFx0dmFyIGRlZmVycmVkTW9kdWxlcyA9IFtdO1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHR2YXIganNvbnBBcnJheSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSB8fCBbXTtcbiBcdHZhciBvbGRKc29ucEZ1bmN0aW9uID0ganNvbnBBcnJheS5wdXNoLmJpbmQoanNvbnBBcnJheSk7XG4gXHRqc29ucEFycmF5LnB1c2ggPSB3ZWJwYWNrSnNvbnBDYWxsYmFjaztcbiBcdGpzb25wQXJyYXkgPSBqc29ucEFycmF5LnNsaWNlKCk7XG4gXHRmb3IodmFyIGkgPSAwOyBpIDwganNvbnBBcnJheS5sZW5ndGg7IGkrKykgd2VicGFja0pzb25wQ2FsbGJhY2soanNvbnBBcnJheVtpXSk7XG4gXHR2YXIgcGFyZW50SnNvbnBGdW5jdGlvbiA9IG9sZEpzb25wRnVuY3Rpb247XG5cblxuIFx0Ly8gYWRkIGVudHJ5IG1vZHVsZSB0byBkZWZlcnJlZCBsaXN0XG4gXHRkZWZlcnJlZE1vZHVsZXMucHVzaChbXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2VtYWlsLWRhc2hib2FyZC1wYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZS5zY3JpcHRzLnRzXCIsXCJ2ZW5kb3JzfmFib3V0fmFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbW11bml0eV9kYXNoYm9hcmR+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2Fyfjc4NTZjMDVhXCIsXCJhYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmUwNmE0YTE3XCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBCYXNlIFRyYW5zY2x1c2lvbiBDb21wb25lbnQuXG4gKi9cbnJlcXVpcmUoJ2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9PcHBpYUZvb3RlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3NpZGViYXIvU2lkZWJhclN0YXR1c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvc3RhdGVmdWwvQmFja2dyb3VuZE1hc2tTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2Jhc2VDb250ZW50JywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB7XG4gICAgICAgICAgICAgICAgYnJlYWRjcnVtYjogJz9uYXZiYXJCcmVhZGNydW1iJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnY29udGVudCcsXG4gICAgICAgICAgICAgICAgZm9vdGVyOiAnP3BhZ2VGb290ZXInLFxuICAgICAgICAgICAgICAgIG5hdk9wdGlvbnM6ICc/bmF2T3B0aW9ucycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvYmFzZV9jb21wb25lbnRzL2Jhc2VfY29udGVudF9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckcm9vdFNjb3BlJywgJ0JhY2tncm91bmRNYXNrU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1NpZGViYXJTdGF0dXNTZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCAnU0lURV9GRUVEQkFDS19GT1JNX1VSTCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIEJhY2tncm91bmRNYXNrU2VydmljZSwgU2lkZWJhclN0YXR1c1NlcnZpY2UsIFVybFNlcnZpY2UsIFNJVEVfRkVFREJBQ0tfRk9STV9VUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlmcmFtZWQgPSBVcmxTZXJ2aWNlLmlzSWZyYW1lZCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNpdGVGZWVkYmFja0Zvcm1VcmwgPSBTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzU2lkZWJhclNob3duID0gU2lkZWJhclN0YXR1c1NlcnZpY2UuaXNTaWRlYmFyU2hvd247XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2xvc2VTaWRlYmFyT25Td2lwZSA9IFNpZGViYXJTdGF0dXNTZXJ2aWNlLmNsb3NlU2lkZWJhcjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc0JhY2tncm91bmRNYXNrQWN0aXZlID0gQmFja2dyb3VuZE1hc2tTZXJ2aWNlLmlzTWFza0FjdGl2ZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5ERVZfTU9ERSA9ICRyb290U2NvcGUuREVWX01PREU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2tpcFRvTWFpbkNvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFpbkNvbnRlbnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29wcGlhLW1haW4tY29udGVudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtYWluQ29udGVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVmFyaWFibGUgbWFpbkNvbnRlbnRFbGVtZW50IGlzIHVuZGVmaW5lZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC50YWJJbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LnNjcm9sbEludG9WaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3Igd2FybmluZ19sb2FkZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnd2FybmluZ0xvYWRlcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvYmFzZV9jb21wb25lbnRzL3dhcm5pbmdfbG9hZGVyX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChBbGVydHNTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5BbGVydHNTZXJ2aWNlID0gQWxlcnRzU2VydmljZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3Igb2JqZWN0cyBkb21haW4uXG4gKi9cbnZhciBPYmplY3RzRG9tYWluQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE9iamVjdHNEb21haW5Db25zdGFudHMoKSB7XG4gICAgfVxuICAgIE9iamVjdHNEb21haW5Db25zdGFudHMuRlJBQ1RJT05fUEFSU0lOR19FUlJPUlMgPSB7XG4gICAgICAgIElOVkFMSURfQ0hBUlM6ICdQbGVhc2Ugb25seSB1c2UgbnVtZXJpY2FsIGRpZ2l0cywgc3BhY2VzIG9yIGZvcndhcmQgc2xhc2hlcyAoLyknLFxuICAgICAgICBJTlZBTElEX0ZPUk1BVDogJ1BsZWFzZSBlbnRlciBhIHZhbGlkIGZyYWN0aW9uIChlLmcuLCA1LzMgb3IgMSAyLzMpJyxcbiAgICAgICAgRElWSVNJT05fQllfWkVSTzogJ1BsZWFzZSBkbyBub3QgcHV0IDAgaW4gdGhlIGRlbm9taW5hdG9yJ1xuICAgIH07XG4gICAgT2JqZWN0c0RvbWFpbkNvbnN0YW50cy5OVU1CRVJfV0lUSF9VTklUU19QQVJTSU5HX0VSUk9SUyA9IHtcbiAgICAgICAgSU5WQUxJRF9WQUxVRTogJ1BsZWFzZSBlbnN1cmUgdGhhdCB2YWx1ZSBpcyBlaXRoZXIgYSBmcmFjdGlvbiBvciBhIG51bWJlcicsXG4gICAgICAgIElOVkFMSURfQ1VSUkVOQ1k6ICdQbGVhc2UgZW50ZXIgYSB2YWxpZCBjdXJyZW5jeSAoZS5nLiwgJDUgb3IgUnMgNSknLFxuICAgICAgICBJTlZBTElEX0NVUlJFTkNZX0ZPUk1BVDogJ1BsZWFzZSB3cml0ZSBjdXJyZW5jeSB1bml0cyBhdCB0aGUgYmVnaW5uaW5nJyxcbiAgICAgICAgSU5WQUxJRF9VTklUX0NIQVJTOiAnUGxlYXNlIGVuc3VyZSB0aGF0IHVuaXQgb25seSBjb250YWlucyBudW1iZXJzLCBhbHBoYWJldHMsICgsICksICosIF4sICcgK1xuICAgICAgICAgICAgJy8sIC0nXG4gICAgfTtcbiAgICBPYmplY3RzRG9tYWluQ29uc3RhbnRzLkNVUlJFTkNZX1VOSVRTID0ge1xuICAgICAgICBkb2xsYXI6IHtcbiAgICAgICAgICAgIG5hbWU6ICdkb2xsYXInLFxuICAgICAgICAgICAgYWxpYXNlczogWyckJywgJ2RvbGxhcnMnLCAnRG9sbGFycycsICdEb2xsYXInLCAnVVNEJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogWyckJ10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgcnVwZWU6IHtcbiAgICAgICAgICAgIG5hbWU6ICdydXBlZScsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ1JzJywgJ3J1cGVlcycsICfigrknLCAnUnVwZWVzJywgJ1J1cGVlJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogWydScyAnLCAn4oK5J10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgY2VudDoge1xuICAgICAgICAgICAgbmFtZTogJ2NlbnQnLFxuICAgICAgICAgICAgYWxpYXNlczogWydjZW50cycsICdDZW50cycsICdDZW50J10sXG4gICAgICAgICAgICBmcm9udF91bml0czogW10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIGRvbGxhcidcbiAgICAgICAgfSxcbiAgICAgICAgcGFpc2U6IHtcbiAgICAgICAgICAgIG5hbWU6ICdwYWlzZScsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ3BhaXNhJywgJ1BhaXNlJywgJ1BhaXNhJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogW10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIHJ1cGVlJ1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gT2JqZWN0c0RvbWFpbkNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLk9iamVjdHNEb21haW5Db25zdGFudHMgPSBPYmplY3RzRG9tYWluQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBmb290ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFGb290ZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9vcHBpYV9mb290ZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZXMgZm9yIG9wcGlhIGVtYWlsIGRhc2hib2FyZCBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdFbWFpbERhc2hib2FyZERhdGFTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsIGZ1bmN0aW9uICgkaHR0cCwgJHEpIHtcbiAgICAgICAgdmFyIFFVRVJZX0RBVEFfVVJMID0gJy9lbWFpbGRhc2hib2FyZGRhdGFoYW5kbGVyJztcbiAgICAgICAgdmFyIFFVRVJZX1NUQVRVU19DSEVDS19VUkwgPSAnL3F1ZXJ5c3RhdHVzY2hlY2snO1xuICAgICAgICAvLyBOby4gb2YgcXVlcnkgcmVzdWx0cyB0byBkaXNwbGF5IG9uIGEgc2luZ2xlIHBhZ2UuXG4gICAgICAgIHZhciBRVUVSSUVTX1BFUl9QQUdFID0gMTA7XG4gICAgICAgIC8vIFN0b3JlIGxhdGVzdCBjdXJzb3IgdmFsdWUgZm9yIGZldGNoaW5nIG5leHQgcXVlcnkgcGFnZS5cbiAgICAgICAgdmFyIGxhdGVzdEN1cnNvciA9IG51bGw7XG4gICAgICAgIC8vIEFycmF5IGNvbnRhaW5pbmcgYWxsIGZldGNoZWQgcXVlcmllcy5cbiAgICAgICAgdmFyIHF1ZXJpZXMgPSBbXTtcbiAgICAgICAgLy8gSW5kZXggb2YgY3VycmVudGx5LXNob3duIHBhZ2Ugb2YgcXVlcnkgcmVzdWx0cy5cbiAgICAgICAgdmFyIGN1cnJlbnRQYWdlSW5kZXggPSAtMTtcbiAgICAgICAgdmFyIGZldGNoUXVlcmllc1BhZ2UgPSBmdW5jdGlvbiAocGFnZVNpemUsIGN1cnNvcikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldChRVUVSWV9EQVRBX1VSTCwge1xuICAgICAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgICAgICBudW1fcXVlcmllc190b19mZXRjaDogcGFnZVNpemUsXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvcjogY3Vyc29yXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0UXVlcmllczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxdWVyaWVzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEN1cnJlbnRQYWdlSW5kZXg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudFBhZ2VJbmRleDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRMYXRlc3RDdXJzb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGF0ZXN0Q3Vyc29yO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1Ym1pdFF1ZXJ5OiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBzdGFydFF1ZXJ5SW5kZXggPSBjdXJyZW50UGFnZUluZGV4ICogUVVFUklFU19QRVJfUEFHRTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kUXVlcnlJbmRleCA9IChjdXJyZW50UGFnZUluZGV4ICsgMSkgKiBRVUVSSUVTX1BFUl9QQUdFO1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KFFVRVJZX0RBVEFfVVJMLCB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdRdWVyaWVzID0gW2RhdGEucXVlcnldO1xuICAgICAgICAgICAgICAgICAgICBxdWVyaWVzID0gbmV3UXVlcmllcy5jb25jYXQocXVlcmllcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVyaWVzLnNsaWNlKHN0YXJ0UXVlcnlJbmRleCwgZW5kUXVlcnlJbmRleCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0TmV4dFF1ZXJpZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRRdWVyeUluZGV4ID0gKGN1cnJlbnRQYWdlSW5kZXggKyAxKSAqIFFVRVJJRVNfUEVSX1BBR0U7XG4gICAgICAgICAgICAgICAgdmFyIGVuZFF1ZXJ5SW5kZXggPSAoY3VycmVudFBhZ2VJbmRleCArIDIpICogUVVFUklFU19QRVJfUEFHRTtcbiAgICAgICAgICAgICAgICBpZiAocXVlcmllcy5sZW5ndGggPj0gZW5kUXVlcnlJbmRleCB8fFxuICAgICAgICAgICAgICAgICAgICAobGF0ZXN0Q3Vyc29yID09PSBudWxsICYmIGN1cnJlbnRQYWdlSW5kZXggIT09IC0xKSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGFnZUluZGV4ID0gY3VycmVudFBhZ2VJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVyKHF1ZXJpZXMuc2xpY2Uoc3RhcnRRdWVyeUluZGV4LCBlbmRRdWVyeUluZGV4KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhZ2VJbmRleCA9IGN1cnJlbnRQYWdlSW5kZXggKyAxO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmV0Y2hRdWVyaWVzUGFnZShRVUVSSUVTX1BFUl9QQUdFLCBsYXRlc3RDdXJzb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVlcmllcyA9IHF1ZXJpZXMuY29uY2F0KGRhdGEucmVjZW50X3F1ZXJpZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF0ZXN0Q3Vyc29yID0gZGF0YS5jdXJzb3I7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcXVlcmllcy5zbGljZShzdGFydFF1ZXJ5SW5kZXgsIGVuZFF1ZXJ5SW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UHJldmlvdXNRdWVyaWVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0UXVlcnlJbmRleCA9IChjdXJyZW50UGFnZUluZGV4IC0gMSkgKiBRVUVSSUVTX1BFUl9QQUdFO1xuICAgICAgICAgICAgICAgIHZhciBlbmRRdWVyeUluZGV4ID0gY3VycmVudFBhZ2VJbmRleCAqIFFVRVJJRVNfUEVSX1BBR0U7XG4gICAgICAgICAgICAgICAgY3VycmVudFBhZ2VJbmRleCA9IGN1cnJlbnRQYWdlSW5kZXggLSAxO1xuICAgICAgICAgICAgICAgIHJldHVybiBxdWVyaWVzLnNsaWNlKHN0YXJ0UXVlcnlJbmRleCwgZW5kUXVlcnlJbmRleCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNOZXh0UGFnZUF2YWlsYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0UXVlcnlJbmRleCA9IChjdXJyZW50UGFnZUluZGV4ICsgMSkgKiBRVUVSSUVTX1BFUl9QQUdFO1xuICAgICAgICAgICAgICAgIHJldHVybiAocXVlcmllcy5sZW5ndGggPiBuZXh0UXVlcnlJbmRleCkgfHwgQm9vbGVhbihsYXRlc3RDdXJzb3IpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzUHJldmlvdXNQYWdlQXZhaWxhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChjdXJyZW50UGFnZUluZGV4ID4gMCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmV0Y2hRdWVyeTogZnVuY3Rpb24gKHF1ZXJ5SWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KFFVRVJZX1NUQVRVU19DSEVDS19VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeV9pZDogcXVlcnlJZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgICAgICBxdWVyaWVzLmZvckVhY2goZnVuY3Rpb24gKHF1ZXJ5LCBpbmRleCwgcXVlcmllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5LmlkID09PSBxdWVyeUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcmllc1tpbmRleF0gPSBkYXRhLnF1ZXJ5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEucXVlcnk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXIgZm9yIG9wcGlhIGVtYWlsIGRhc2hib2FyZCBwYWdlLlxuICovXG5yZXF1aXJlKCdiYXNlX2NvbXBvbmVudHMvQmFzZUNvbnRlbnREaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2VtYWlsLWRhc2hib2FyZC1wYWdlcy9lbWFpbC1kYXNoYm9hcmQtZGF0YS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdlbWFpbERhc2hib2FyZFBhZ2UnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZXMvZW1haWwtZGFzaGJvYXJkLXBhZ2UuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHJvb3RTY29wZScsICdFbWFpbERhc2hib2FyZERhdGFTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgRW1haWxEYXNoYm9hcmREYXRhU2VydmljZSwgVXNlclNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJuYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnTG9hZGluZyc7XG4gICAgICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLmdldFVzZXJJbmZvQXN5bmMoKS50aGVuKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC51c2VybmFtZSA9IHVzZXJJbmZvLmdldFVzZXJuYW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmN1cnJlbnRQYWdlT2ZRdWVyaWVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN0cmwucmVzZXRGb3JtID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5oYXNfbm90X2xvZ2dlZF9pbl9mb3Jfbl9kYXlzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaW5hY3RpdmVfaW5fbGFzdF9uX2RheXMgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jcmVhdGVkX2F0X2xlYXN0X25fZXhwcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNyZWF0ZWRfZmV3ZXJfdGhhbl9uX2V4cHMgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5lZGl0ZWRfYXRfbGVhc3Rfbl9leHBzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZWRpdGVkX2Zld2VyX3RoYW5fbl9leHBzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zdWJtaXRRdWVyeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc19ub3RfbG9nZ2VkX2luX2Zvcl9uX2RheXM6IGN0cmwuaGFzX25vdF9sb2dnZWRfaW5fZm9yX25fZGF5cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmFjdGl2ZV9pbl9sYXN0X25fZGF5czogY3RybC5pbmFjdGl2ZV9pbl9sYXN0X25fZGF5cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkX2F0X2xlYXN0X25fZXhwczogY3RybC5jcmVhdGVkX2F0X2xlYXN0X25fZXhwcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkX2Zld2VyX3RoYW5fbl9leHBzOiBjdHJsLmNyZWF0ZWRfZmV3ZXJfdGhhbl9uX2V4cHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGVkX2F0X2xlYXN0X25fZXhwczogY3RybC5lZGl0ZWRfYXRfbGVhc3Rfbl9leHBzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRlZF9mZXdlcl90aGFuX25fZXhwczogY3RybC5lZGl0ZWRfZmV3ZXJfdGhhbl9uX2V4cHNcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBFbWFpbERhc2hib2FyZERhdGFTZXJ2aWNlLnN1Ym1pdFF1ZXJ5KGRhdGEpLnRoZW4oZnVuY3Rpb24gKHF1ZXJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmN1cnJlbnRQYWdlT2ZRdWVyaWVzID0gcXVlcmllcztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5yZXNldEZvcm0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd1N1Y2Nlc3NNZXNzYWdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXROZXh0UGFnZU9mUXVlcmllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChFbWFpbERhc2hib2FyZERhdGFTZXJ2aWNlLmlzTmV4dFBhZ2VBdmFpbGFibGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVtYWlsRGFzaGJvYXJkRGF0YVNlcnZpY2UuZ2V0TmV4dFF1ZXJpZXMoKS50aGVuKGZ1bmN0aW9uIChxdWVyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY3VycmVudFBhZ2VPZlF1ZXJpZXMgPSBxdWVyaWVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFByZXZpb3VzUGFnZU9mUXVlcmllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChFbWFpbERhc2hib2FyZERhdGFTZXJ2aWNlLmlzUHJldmlvdXNQYWdlQXZhaWxhYmxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmN1cnJlbnRQYWdlT2ZRdWVyaWVzID0gKEVtYWlsRGFzaGJvYXJkRGF0YVNlcnZpY2UuZ2V0UHJldmlvdXNRdWVyaWVzKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dOZXh0QnV0dG9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEVtYWlsRGFzaGJvYXJkRGF0YVNlcnZpY2UuaXNOZXh0UGFnZUF2YWlsYWJsZSgpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dQcmV2aW91c0J1dHRvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFbWFpbERhc2hib2FyZERhdGFTZXJ2aWNlLmlzUHJldmlvdXNQYWdlQXZhaWxhYmxlKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwucmVjaGVja1N0YXR1cyA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5SWQgPSBjdHJsLmN1cnJlbnRQYWdlT2ZRdWVyaWVzW2luZGV4XS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIEVtYWlsRGFzaGJvYXJkRGF0YVNlcnZpY2UuZmV0Y2hRdWVyeShxdWVyeUlkKS50aGVuKGZ1bmN0aW9uIChxdWVyeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY3VycmVudFBhZ2VPZlF1ZXJpZXNbaW5kZXhdID0gcXVlcnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zaG93TGlua1RvUmVzdWx0UGFnZSA9IGZ1bmN0aW9uIChzdWJtaXR0ZXIsIHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChzdWJtaXR0ZXIgPT09IGN0cmwudXNlcm5hbWUpICYmIChzdGF0dXMgPT09ICdjb21wbGV0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgRW1haWxEYXNoYm9hcmREYXRhU2VydmljZS5nZXROZXh0UXVlcmllcygpLnRoZW4oZnVuY3Rpb24gKHF1ZXJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY3VycmVudFBhZ2VPZlF1ZXJpZXMgPSBxdWVyaWVzO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGNvbGxlY3Rpb24gcGxheWVyIHBhZ2UuXG4gKi9cbnJlcXVpcmUoXCJjb3JlLWpzL2VzNy9yZWZsZWN0XCIpO1xucmVxdWlyZShcInpvbmUuanNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl8xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgaHR0cF8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvbW1vbi9odHRwXCIpO1xuLy8gVGhpcyBjb21wb25lbnQgaXMgbmVlZGVkIHRvIGZvcmNlLWJvb3RzdHJhcCBBbmd1bGFyIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4vLyBhcHAuXG52YXIgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KCkge1xuICAgIH1cbiAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5Db21wb25lbnQoe1xuICAgICAgICAgICAgc2VsZWN0b3I6ICdzZXJ2aWNlLWJvb3RzdHJhcCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJydcbiAgICAgICAgfSlcbiAgICBdLCBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KTtcbiAgICByZXR1cm4gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbn0oKSk7XG5leHBvcnRzLlNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50O1xudmFyIGFwcF9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJhcHAuY29uc3RhbnRzXCIpO1xudmFyIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzXCIpO1xudmFyIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50c1wiKTtcbnZhciBFbWFpbERhc2hib2FyZFBhZ2VNb2R1bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRW1haWxEYXNoYm9hcmRQYWdlTW9kdWxlKCkge1xuICAgIH1cbiAgICAvLyBFbXB0eSBwbGFjZWhvbGRlciBtZXRob2QgdG8gc2F0aXNmeSB0aGUgYENvbXBpbGVyYC5cbiAgICBFbWFpbERhc2hib2FyZFBhZ2VNb2R1bGUucHJvdG90eXBlLm5nRG9Cb290c3RyYXAgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgRW1haWxEYXNoYm9hcmRQYWdlTW9kdWxlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5OZ01vZHVsZSh7XG4gICAgICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgICAgICAgcGxhdGZvcm1fYnJvd3Nlcl8xLkJyb3dzZXJNb2R1bGUsXG4gICAgICAgICAgICAgICAgaHR0cF8xLkh0dHBDbGllbnRNb2R1bGVcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZW50cnlDb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICAgICAgICAgIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25zX2V4dGVuc2lvbl9jb25zdGFudHNfMS5JbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xLk9iamVjdHNEb21haW5Db25zdGFudHMsXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pXG4gICAgXSwgRW1haWxEYXNoYm9hcmRQYWdlTW9kdWxlKTtcbiAgICByZXR1cm4gRW1haWxEYXNoYm9hcmRQYWdlTW9kdWxlO1xufSgpKTtcbnZhciBwbGF0Zm9ybV9icm93c2VyX2R5bmFtaWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyLWR5bmFtaWNcIik7XG52YXIgc3RhdGljXzIgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgYm9vdHN0cmFwRm4gPSBmdW5jdGlvbiAoZXh0cmFQcm92aWRlcnMpIHtcbiAgICB2YXIgcGxhdGZvcm1SZWYgPSBwbGF0Zm9ybV9icm93c2VyX2R5bmFtaWNfMS5wbGF0Zm9ybUJyb3dzZXJEeW5hbWljKGV4dHJhUHJvdmlkZXJzKTtcbiAgICByZXR1cm4gcGxhdGZvcm1SZWYuYm9vdHN0cmFwTW9kdWxlKEVtYWlsRGFzaGJvYXJkUGFnZU1vZHVsZSk7XG59O1xudmFyIGRvd25ncmFkZWRNb2R1bGUgPSBzdGF0aWNfMi5kb3duZ3JhZGVNb2R1bGUoYm9vdHN0cmFwRm4pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJywgW1xuICAgICdkbmRMaXN0cycsICdoZWFkcm9vbScsICdpbmZpbml0ZS1zY3JvbGwnLCAnbmdBbmltYXRlJyxcbiAgICAnbmdBdWRpbycsICduZ0Nvb2tpZXMnLCAnbmdJbWdDcm9wJywgJ25nSm95UmlkZScsICduZ01hdGVyaWFsJyxcbiAgICAnbmdSZXNvdXJjZScsICduZ1Nhbml0aXplJywgJ25nVG91Y2gnLCAncGFzY2FscHJlY2h0LnRyYW5zbGF0ZScsXG4gICAgJ3RvYXN0cicsICd1aS5ib290c3RyYXAnLCAndWkuc29ydGFibGUnLCAndWkudHJlZScsICd1aS52YWxpZGF0ZScsXG4gICAgZG93bmdyYWRlZE1vZHVsZVxuXSlcbiAgICAvLyBUaGlzIGRpcmVjdGl2ZSBpcyB0aGUgZG93bmdyYWRlZCB2ZXJzaW9uIG9mIHRoZSBBbmd1bGFyIGNvbXBvbmVudCB0b1xuICAgIC8vIGJvb3RzdHJhcCB0aGUgQW5ndWxhciA4LlxuICAgIC5kaXJlY3RpdmUoJ3NlcnZpY2VCb290c3RyYXAnLCBzdGF0aWNfMS5kb3duZ3JhZGVDb21wb25lbnQoe1xuICAgIGNvbXBvbmVudDogU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxufSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgc2NyaXB0cyBmb3Igb3BwaWEgZW1haWwgZGFzaGJvYXJkIHBhZ2UuXG4gKi9cbi8vIFRoZSBtb2R1bGUgbmVlZHMgdG8gYmUgbG9hZGVkIGJlZm9yZSBldmVyeXRoaW5nIGVsc2Ugc2luY2UgaXQgZGVmaW5lcyB0aGVcbi8vIG1haW4gbW9kdWxlIHRoZSBlbGVtZW50cyBhcmUgYXR0YWNoZWQgdG8uXG5yZXF1aXJlKCdwYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZXMvZW1haWwtZGFzaGJvYXJkLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdBcHAudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2VtYWlsLWRhc2hib2FyZC1wYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZS5jb250cm9sbGVyLnRzJyk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgaW50ZXJhY3Rpb25zIGV4dGVuc2lvbnMuXG4gKi9cbnZhciBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMoKSB7XG4gICAgfVxuICAgIC8vIE1pbmltdW0gY29uZmlkZW5jZSByZXF1aXJlZCBmb3IgYSBwcmVkaWN0ZWQgYW5zd2VyIGdyb3VwIHRvIGJlIHNob3duIHRvXG4gICAgLy8gdXNlci4gR2VuZXJhbGx5IGEgdGhyZXNob2xkIG9mIDAuNy0wLjggaXMgYXNzdW1lZCB0byBiZSBhIGdvb2Qgb25lIGluXG4gICAgLy8gcHJhY3RpY2UsIGhvd2V2ZXIgdmFsdWUgbmVlZCBub3QgYmUgaW4gdGhvc2UgYm91bmRzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuQ09ERV9SRVBMX1BSRURJQ1RJT05fU0VSVklDRV9USFJFU0hPTEQgPSAwLjc7XG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5HUkFQSF9JTlBVVF9MRUZUX01BUkdJTiA9IDEyMDtcbiAgICAvLyBHaXZlcyB0aGUgc3RhZmYtbGluZXMgaHVtYW4gcmVhZGFibGUgdmFsdWVzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuTk9URV9OQU1FU19UT19NSURJX1ZBTFVFUyA9IHtcbiAgICAgICAgQTU6IDgxLFxuICAgICAgICBHNTogNzksXG4gICAgICAgIEY1OiA3NyxcbiAgICAgICAgRTU6IDc2LFxuICAgICAgICBENTogNzQsXG4gICAgICAgIEM1OiA3MixcbiAgICAgICAgQjQ6IDcxLFxuICAgICAgICBBNDogNjksXG4gICAgICAgIEc0OiA2NyxcbiAgICAgICAgRjQ6IDY1LFxuICAgICAgICBFNDogNjQsXG4gICAgICAgIEQ0OiA2MixcbiAgICAgICAgQzQ6IDYwXG4gICAgfTtcbiAgICAvLyBNaW5pbXVtIGNvbmZpZGVuY2UgcmVxdWlyZWQgZm9yIGEgcHJlZGljdGVkIGFuc3dlciBncm91cCB0byBiZSBzaG93biB0b1xuICAgIC8vIHVzZXIuIEdlbmVyYWxseSBhIHRocmVzaG9sZCBvZiAwLjctMC44IGlzIGFzc3VtZWQgdG8gYmUgYSBnb29kIG9uZSBpblxuICAgIC8vIHByYWN0aWNlLCBob3dldmVyIHZhbHVlIG5lZWQgbm90IGJlIGluIHRob3NlIGJvdW5kcy5cbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLlRFWFRfSU5QVVRfUFJFRElDVElPTl9TRVJWSUNFX1RIUkVTSE9MRCA9IDAuNztcbiAgICByZXR1cm4gSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLkludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMgPSBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==