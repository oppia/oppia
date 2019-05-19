/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
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
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-page.controller.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-page-services/email-dashboard-data/email-dashboard-data.service.ts":
/*!***********************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-page-services/email-dashboard-data/email-dashboard-data.service.ts ***!
  \***********************************************************************************************************************************************/
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
angular.module('emailDashboardPageModule').factory('EmailDashboardDataService', [
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

/***/ "./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-page.controller.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-page.controller.ts ***!
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
 * @fileoverview Controller for oppia email dashboard page.
 */
__webpack_require__(/*! pages/email-dashboard-page/email-dashboard-page-services/email-dashboard-data/email-dashboard-data.service.ts */ "./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-page-services/email-dashboard-data/email-dashboard-data.service.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('emailDashboardPageModule').controller('EmailDashboard', [
    '$rootScope', '$scope', 'EmailDashboardDataService', 'UserService',
    function ($rootScope, $scope, EmailDashboardDataService, UserService) {
        $scope.username = '';
        $rootScope.loadingMessage = 'Loading';
        UserService.getUserInfoAsync().then(function (userInfo) {
            $scope.username = userInfo.getUsername();
            $rootScope.loadingMessage = '';
        });
        $scope.currentPageOfQueries = [];
        $scope.resetForm = function () {
            $scope.has_not_logged_in_for_n_days = null;
            $scope.inactive_in_last_n_days = null;
            $scope.created_at_least_n_exps = null;
            $scope.created_fewer_than_n_exps = null;
            $scope.edited_at_least_n_exps = null;
            $scope.edited_fewer_than_n_exps = null;
        };
        $scope.submitQuery = function () {
            var data = {
                has_not_logged_in_for_n_days: $scope.has_not_logged_in_for_n_days,
                inactive_in_last_n_days: $scope.inactive_in_last_n_days,
                created_at_least_n_exps: $scope.created_at_least_n_exps,
                created_fewer_than_n_exps: $scope.created_fewer_than_n_exps,
                edited_at_least_n_exps: $scope.edited_at_least_n_exps,
                edited_fewer_than_n_exps: $scope.edited_fewer_than_n_exps
            };
            EmailDashboardDataService.submitQuery(data).then(function (queries) {
                $scope.currentPageOfQueries = queries;
            });
            $scope.resetForm();
            $scope.showSuccessMessage = true;
        };
        $scope.getNextPageOfQueries = function () {
            if (EmailDashboardDataService.isNextPageAvailable()) {
                EmailDashboardDataService.getNextQueries().then(function (queries) {
                    $scope.currentPageOfQueries = queries;
                });
            }
        };
        $scope.getPreviousPageOfQueries = function () {
            if (EmailDashboardDataService.isPreviousPageAvailable()) {
                $scope.currentPageOfQueries = (EmailDashboardDataService.getPreviousQueries());
            }
        };
        $scope.showNextButton = function () {
            return EmailDashboardDataService.isNextPageAvailable();
        };
        $scope.showPreviousButton = function () {
            return EmailDashboardDataService.isPreviousPageAvailable();
        };
        $scope.recheckStatus = function (index) {
            var queryId = $scope.currentPageOfQueries[index].id;
            EmailDashboardDataService.fetchQuery(queryId).then(function (query) {
                $scope.currentPageOfQueries[index] = query;
            });
        };
        $scope.showLinkToResultPage = function (submitter, status) {
            return (submitter === $scope.username) && (status === 'completed');
        };
        EmailDashboardDataService.getNextQueries().then(function (queries) {
            $scope.currentPageOfQueries = queries;
        });
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/UserService.ts":
/*!*********************************************************!*\
  !*** ./core/templates/dev/head/services/UserService.ts ***!
  \*********************************************************/
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
 * @fileoverview Service for user data.
 */
oppia.factory('UserService', [
    '$http', '$q', '$window', 'UrlInterpolationService', 'UserInfoObjectFactory',
    'DEFAULT_PROFILE_IMAGE_PATH',
    function ($http, $q, $window, UrlInterpolationService, UserInfoObjectFactory, DEFAULT_PROFILE_IMAGE_PATH) {
        var PREFERENCES_DATA_URL = '/preferenceshandler/data';
        var userInfo = null;
        var getUserInfoAsync = function () {
            if (GLOBALS.userIsLoggedIn) {
                if (userInfo) {
                    return $q.resolve(userInfo);
                }
                return $http.get('/userinfohandler').then(function (response) {
                    userInfo = UserInfoObjectFactory.createFromBackendDict(response.data);
                    return userInfo;
                });
            }
            else {
                return $q.resolve(UserInfoObjectFactory.createDefault());
            }
        };
        return {
            getProfileImageDataUrlAsync: function () {
                var profilePictureDataUrl = (UrlInterpolationService.getStaticImageUrl(DEFAULT_PROFILE_IMAGE_PATH));
                if (GLOBALS.userIsLoggedIn) {
                    return $http.get('/preferenceshandler/profile_picture').then(function (response) {
                        if (response.data.profile_picture_data_url) {
                            profilePictureDataUrl = response.data.profile_picture_data_url;
                        }
                        return profilePictureDataUrl;
                    });
                }
                else {
                    return $q.resolve(profilePictureDataUrl);
                }
            },
            setProfileImageDataUrlAsync: function (newProfileImageDataUrl) {
                return $http.put(PREFERENCES_DATA_URL, {
                    update_type: 'profile_picture_data_url',
                    data: newProfileImageDataUrl
                });
            },
            getLoginUrlAsync: function () {
                var urlParameters = {
                    current_url: $window.location.href
                };
                return $http.get('/url_handler', { params: urlParameters }).then(function (response) {
                    return response.data.login_url;
                });
            },
            getUserInfoAsync: getUserInfoAsync
        };
    }
]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZW1haWwtZGFzaGJvYXJkLXBhZ2UvZW1haWwtZGFzaGJvYXJkLXBhZ2Utc2VydmljZXMvZW1haWwtZGFzaGJvYXJkLWRhdGEvZW1haWwtZGFzaGJvYXJkLWRhdGEuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZS9lbWFpbC1kYXNoYm9hcmQtcGFnZS5jb250cm9sbGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1VzZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUF5QyxpQ0FBaUM7QUFDMUUsd0hBQWdILG1CQUFtQixFQUFFO0FBQ3JJO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7OztBQUdBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDhQQUNrRDtBQUMxRCxtQkFBTyxDQUFDLGtGQUF5QjtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTs7Ozs7Ozs7Ozs7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRCx3QkFBd0I7QUFDMUU7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImVtYWlsX2Rhc2hib2FyZC5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2VtYWlsLWRhc2hib2FyZC1wYWdlL2VtYWlsLWRhc2hib2FyZC1wYWdlLmNvbnRyb2xsZXIudHNcIik7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2VzIGZvciBvcHBpYSBlbWFpbCBkYXNoYm9hcmQgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2VtYWlsRGFzaGJvYXJkUGFnZU1vZHVsZScpLmZhY3RvcnkoJ0VtYWlsRGFzaGJvYXJkRGF0YVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgZnVuY3Rpb24gKCRodHRwLCAkcSkge1xuICAgICAgICB2YXIgUVVFUllfREFUQV9VUkwgPSAnL2VtYWlsZGFzaGJvYXJkZGF0YWhhbmRsZXInO1xuICAgICAgICB2YXIgUVVFUllfU1RBVFVTX0NIRUNLX1VSTCA9ICcvcXVlcnlzdGF0dXNjaGVjayc7XG4gICAgICAgIC8vIE5vLiBvZiBxdWVyeSByZXN1bHRzIHRvIGRpc3BsYXkgb24gYSBzaW5nbGUgcGFnZS5cbiAgICAgICAgdmFyIFFVRVJJRVNfUEVSX1BBR0UgPSAxMDtcbiAgICAgICAgLy8gU3RvcmUgbGF0ZXN0IGN1cnNvciB2YWx1ZSBmb3IgZmV0Y2hpbmcgbmV4dCBxdWVyeSBwYWdlLlxuICAgICAgICB2YXIgbGF0ZXN0Q3Vyc29yID0gbnVsbDtcbiAgICAgICAgLy8gQXJyYXkgY29udGFpbmluZyBhbGwgZmV0Y2hlZCBxdWVyaWVzLlxuICAgICAgICB2YXIgcXVlcmllcyA9IFtdO1xuICAgICAgICAvLyBJbmRleCBvZiBjdXJyZW50bHktc2hvd24gcGFnZSBvZiBxdWVyeSByZXN1bHRzLlxuICAgICAgICB2YXIgY3VycmVudFBhZ2VJbmRleCA9IC0xO1xuICAgICAgICB2YXIgZmV0Y2hRdWVyaWVzUGFnZSA9IGZ1bmN0aW9uIChwYWdlU2l6ZSwgY3Vyc29yKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KFFVRVJZX0RBVEFfVVJMLCB7XG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgIG51bV9xdWVyaWVzX3RvX2ZldGNoOiBwYWdlU2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiBjdXJzb3JcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRRdWVyaWVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHF1ZXJpZXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q3VycmVudFBhZ2VJbmRleDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50UGFnZUluZGV4O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldExhdGVzdEN1cnNvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsYXRlc3RDdXJzb3I7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3VibWl0UXVlcnk6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0UXVlcnlJbmRleCA9IGN1cnJlbnRQYWdlSW5kZXggKiBRVUVSSUVTX1BFUl9QQUdFO1xuICAgICAgICAgICAgICAgIHZhciBlbmRRdWVyeUluZGV4ID0gKGN1cnJlbnRQYWdlSW5kZXggKyAxKSAqIFFVRVJJRVNfUEVSX1BBR0U7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoUVVFUllfREFUQV9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1F1ZXJpZXMgPSBbZGF0YS5xdWVyeV07XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJpZXMgPSBuZXdRdWVyaWVzLmNvbmNhdChxdWVyaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHF1ZXJpZXMuc2xpY2Uoc3RhcnRRdWVyeUluZGV4LCBlbmRRdWVyeUluZGV4KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXROZXh0UXVlcmllczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzdGFydFF1ZXJ5SW5kZXggPSAoY3VycmVudFBhZ2VJbmRleCArIDEpICogUVVFUklFU19QRVJfUEFHRTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kUXVlcnlJbmRleCA9IChjdXJyZW50UGFnZUluZGV4ICsgMikgKiBRVUVSSUVTX1BFUl9QQUdFO1xuICAgICAgICAgICAgICAgIGlmIChxdWVyaWVzLmxlbmd0aCA+PSBlbmRRdWVyeUluZGV4IHx8XG4gICAgICAgICAgICAgICAgICAgIChsYXRlc3RDdXJzb3IgPT09IG51bGwgJiYgY3VycmVudFBhZ2VJbmRleCAhPT0gLTEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYWdlSW5kZXggPSBjdXJyZW50UGFnZUluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZXIocXVlcmllcy5zbGljZShzdGFydFF1ZXJ5SW5kZXgsIGVuZFF1ZXJ5SW5kZXgpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGFnZUluZGV4ID0gY3VycmVudFBhZ2VJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmZXRjaFF1ZXJpZXNQYWdlKFFVRVJJRVNfUEVSX1BBR0UsIGxhdGVzdEN1cnNvcilcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyaWVzID0gcXVlcmllcy5jb25jYXQoZGF0YS5yZWNlbnRfcXVlcmllcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXRlc3RDdXJzb3IgPSBkYXRhLmN1cnNvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVyaWVzLnNsaWNlKHN0YXJ0UXVlcnlJbmRleCwgZW5kUXVlcnlJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRQcmV2aW91c1F1ZXJpZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRRdWVyeUluZGV4ID0gKGN1cnJlbnRQYWdlSW5kZXggLSAxKSAqIFFVRVJJRVNfUEVSX1BBR0U7XG4gICAgICAgICAgICAgICAgdmFyIGVuZFF1ZXJ5SW5kZXggPSBjdXJyZW50UGFnZUluZGV4ICogUVVFUklFU19QRVJfUEFHRTtcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFnZUluZGV4ID0gY3VycmVudFBhZ2VJbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHF1ZXJpZXMuc2xpY2Uoc3RhcnRRdWVyeUluZGV4LCBlbmRRdWVyeUluZGV4KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc05leHRQYWdlQXZhaWxhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRRdWVyeUluZGV4ID0gKGN1cnJlbnRQYWdlSW5kZXggKyAxKSAqIFFVRVJJRVNfUEVSX1BBR0U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChxdWVyaWVzLmxlbmd0aCA+IG5leHRRdWVyeUluZGV4KSB8fCBCb29sZWFuKGxhdGVzdEN1cnNvcik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNQcmV2aW91c1BhZ2VBdmFpbGFibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGN1cnJlbnRQYWdlSW5kZXggPiAwKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZXRjaFF1ZXJ5OiBmdW5jdGlvbiAocXVlcnlJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoUVVFUllfU1RBVFVTX0NIRUNLX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5X2lkOiBxdWVyeUlkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJpZXMuZm9yRWFjaChmdW5jdGlvbiAocXVlcnksIGluZGV4LCBxdWVyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnkuaWQgPT09IHF1ZXJ5SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyaWVzW2luZGV4XSA9IGRhdGEucXVlcnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5xdWVyeTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udHJvbGxlciBmb3Igb3BwaWEgZW1haWwgZGFzaGJvYXJkIHBhZ2UuXG4gKi9cbnJlcXVpcmUoJ3BhZ2VzL2VtYWlsLWRhc2hib2FyZC1wYWdlL2VtYWlsLWRhc2hib2FyZC1wYWdlLXNlcnZpY2VzLycgK1xuICAgICdlbWFpbC1kYXNoYm9hcmQtZGF0YS9lbWFpbC1kYXNoYm9hcmQtZGF0YS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2VtYWlsRGFzaGJvYXJkUGFnZU1vZHVsZScpLmNvbnRyb2xsZXIoJ0VtYWlsRGFzaGJvYXJkJywgW1xuICAgICckcm9vdFNjb3BlJywgJyRzY29wZScsICdFbWFpbERhc2hib2FyZERhdGFTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCBFbWFpbERhc2hib2FyZERhdGFTZXJ2aWNlLCBVc2VyU2VydmljZSkge1xuICAgICAgICAkc2NvcGUudXNlcm5hbWUgPSAnJztcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdMb2FkaW5nJztcbiAgICAgICAgVXNlclNlcnZpY2UuZ2V0VXNlckluZm9Bc3luYygpLnRoZW4oZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAkc2NvcGUudXNlcm5hbWUgPSB1c2VySW5mby5nZXRVc2VybmFtZSgpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICB9KTtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlT2ZRdWVyaWVzID0gW107XG4gICAgICAgICRzY29wZS5yZXNldEZvcm0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuaGFzX25vdF9sb2dnZWRfaW5fZm9yX25fZGF5cyA9IG51bGw7XG4gICAgICAgICAgICAkc2NvcGUuaW5hY3RpdmVfaW5fbGFzdF9uX2RheXMgPSBudWxsO1xuICAgICAgICAgICAgJHNjb3BlLmNyZWF0ZWRfYXRfbGVhc3Rfbl9leHBzID0gbnVsbDtcbiAgICAgICAgICAgICRzY29wZS5jcmVhdGVkX2Zld2VyX3RoYW5fbl9leHBzID0gbnVsbDtcbiAgICAgICAgICAgICRzY29wZS5lZGl0ZWRfYXRfbGVhc3Rfbl9leHBzID0gbnVsbDtcbiAgICAgICAgICAgICRzY29wZS5lZGl0ZWRfZmV3ZXJfdGhhbl9uX2V4cHMgPSBudWxsO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc3VibWl0UXVlcnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBoYXNfbm90X2xvZ2dlZF9pbl9mb3Jfbl9kYXlzOiAkc2NvcGUuaGFzX25vdF9sb2dnZWRfaW5fZm9yX25fZGF5cyxcbiAgICAgICAgICAgICAgICBpbmFjdGl2ZV9pbl9sYXN0X25fZGF5czogJHNjb3BlLmluYWN0aXZlX2luX2xhc3Rfbl9kYXlzLFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRfYXRfbGVhc3Rfbl9leHBzOiAkc2NvcGUuY3JlYXRlZF9hdF9sZWFzdF9uX2V4cHMsXG4gICAgICAgICAgICAgICAgY3JlYXRlZF9mZXdlcl90aGFuX25fZXhwczogJHNjb3BlLmNyZWF0ZWRfZmV3ZXJfdGhhbl9uX2V4cHMsXG4gICAgICAgICAgICAgICAgZWRpdGVkX2F0X2xlYXN0X25fZXhwczogJHNjb3BlLmVkaXRlZF9hdF9sZWFzdF9uX2V4cHMsXG4gICAgICAgICAgICAgICAgZWRpdGVkX2Zld2VyX3RoYW5fbl9leHBzOiAkc2NvcGUuZWRpdGVkX2Zld2VyX3RoYW5fbl9leHBzXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgRW1haWxEYXNoYm9hcmREYXRhU2VydmljZS5zdWJtaXRRdWVyeShkYXRhKS50aGVuKGZ1bmN0aW9uIChxdWVyaWVzKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlT2ZRdWVyaWVzID0gcXVlcmllcztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJHNjb3BlLnJlc2V0Rm9ybSgpO1xuICAgICAgICAgICAgJHNjb3BlLnNob3dTdWNjZXNzTWVzc2FnZSA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5nZXROZXh0UGFnZU9mUXVlcmllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChFbWFpbERhc2hib2FyZERhdGFTZXJ2aWNlLmlzTmV4dFBhZ2VBdmFpbGFibGUoKSkge1xuICAgICAgICAgICAgICAgIEVtYWlsRGFzaGJvYXJkRGF0YVNlcnZpY2UuZ2V0TmV4dFF1ZXJpZXMoKS50aGVuKGZ1bmN0aW9uIChxdWVyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50UGFnZU9mUXVlcmllcyA9IHF1ZXJpZXM7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5nZXRQcmV2aW91c1BhZ2VPZlF1ZXJpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoRW1haWxEYXNoYm9hcmREYXRhU2VydmljZS5pc1ByZXZpb3VzUGFnZUF2YWlsYWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlT2ZRdWVyaWVzID0gKEVtYWlsRGFzaGJvYXJkRGF0YVNlcnZpY2UuZ2V0UHJldmlvdXNRdWVyaWVzKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2hvd05leHRCdXR0b24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gRW1haWxEYXNoYm9hcmREYXRhU2VydmljZS5pc05leHRQYWdlQXZhaWxhYmxlKCk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5zaG93UHJldmlvdXNCdXR0b24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gRW1haWxEYXNoYm9hcmREYXRhU2VydmljZS5pc1ByZXZpb3VzUGFnZUF2YWlsYWJsZSgpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUucmVjaGVja1N0YXR1cyA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgdmFyIHF1ZXJ5SWQgPSAkc2NvcGUuY3VycmVudFBhZ2VPZlF1ZXJpZXNbaW5kZXhdLmlkO1xuICAgICAgICAgICAgRW1haWxEYXNoYm9hcmREYXRhU2VydmljZS5mZXRjaFF1ZXJ5KHF1ZXJ5SWQpLnRoZW4oZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlT2ZRdWVyaWVzW2luZGV4XSA9IHF1ZXJ5O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5zaG93TGlua1RvUmVzdWx0UGFnZSA9IGZ1bmN0aW9uIChzdWJtaXR0ZXIsIHN0YXR1cykge1xuICAgICAgICAgICAgcmV0dXJuIChzdWJtaXR0ZXIgPT09ICRzY29wZS51c2VybmFtZSkgJiYgKHN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpO1xuICAgICAgICB9O1xuICAgICAgICBFbWFpbERhc2hib2FyZERhdGFTZXJ2aWNlLmdldE5leHRRdWVyaWVzKCkudGhlbihmdW5jdGlvbiAocXVlcmllcykge1xuICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlT2ZRdWVyaWVzID0gcXVlcmllcztcbiAgICAgICAgfSk7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIHVzZXIgZGF0YS5cbiAqL1xub3BwaWEuZmFjdG9yeSgnVXNlclNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJyR3aW5kb3cnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCAnVXNlckluZm9PYmplY3RGYWN0b3J5JyxcbiAgICAnREVGQVVMVF9QUk9GSUxFX0lNQUdFX1BBVEgnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsICR3aW5kb3csIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBVc2VySW5mb09iamVjdEZhY3RvcnksIERFRkFVTFRfUFJPRklMRV9JTUFHRV9QQVRIKSB7XG4gICAgICAgIHZhciBQUkVGRVJFTkNFU19EQVRBX1VSTCA9ICcvcHJlZmVyZW5jZXNoYW5kbGVyL2RhdGEnO1xuICAgICAgICB2YXIgdXNlckluZm8gPSBudWxsO1xuICAgICAgICB2YXIgZ2V0VXNlckluZm9Bc3luYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChHTE9CQUxTLnVzZXJJc0xvZ2dlZEluKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZXNvbHZlKHVzZXJJbmZvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3VzZXJpbmZvaGFuZGxlcicpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJJbmZvID0gVXNlckluZm9PYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJJbmZvO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUoVXNlckluZm9PYmplY3RGYWN0b3J5LmNyZWF0ZURlZmF1bHQoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRQcm9maWxlSW1hZ2VEYXRhVXJsQXN5bmM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvZmlsZVBpY3R1cmVEYXRhVXJsID0gKFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKERFRkFVTFRfUFJPRklMRV9JTUFHRV9QQVRIKSk7XG4gICAgICAgICAgICAgICAgaWYgKEdMT0JBTFMudXNlcklzTG9nZ2VkSW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3ByZWZlcmVuY2VzaGFuZGxlci9wcm9maWxlX3BpY3R1cmUnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEucHJvZmlsZV9waWN0dXJlX2RhdGFfdXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZVBpY3R1cmVEYXRhVXJsID0gcmVzcG9uc2UuZGF0YS5wcm9maWxlX3BpY3R1cmVfZGF0YV91cmw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvZmlsZVBpY3R1cmVEYXRhVXJsO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZXNvbHZlKHByb2ZpbGVQaWN0dXJlRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldFByb2ZpbGVJbWFnZURhdGFVcmxBc3luYzogZnVuY3Rpb24gKG5ld1Byb2ZpbGVJbWFnZURhdGFVcmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAucHV0KFBSRUZFUkVOQ0VTX0RBVEFfVVJMLCB7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZV90eXBlOiAncHJvZmlsZV9waWN0dXJlX2RhdGFfdXJsJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogbmV3UHJvZmlsZUltYWdlRGF0YVVybFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldExvZ2luVXJsQXN5bmM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXJsUGFyYW1ldGVycyA9IHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudF91cmw6ICR3aW5kb3cubG9jYXRpb24uaHJlZlxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3VybF9oYW5kbGVyJywgeyBwYXJhbXM6IHVybFBhcmFtZXRlcnMgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEubG9naW5fdXJsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFVzZXJJbmZvQXN5bmM6IGdldFVzZXJJbmZvQXN5bmNcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=