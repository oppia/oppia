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
/******/ 	return __webpack_require__(__webpack_require__.s = "./core/templates/dev/head/pages/notifications-dashboard-page/notifications-dashboard-page.controller.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/pages/notifications-dashboard-page/notifications-dashboard-page.controller.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/notifications-dashboard-page/notifications-dashboard-page.controller.ts ***!
  \***************************************************************************************************************/
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
 * @fileoverview Data and controllers for the user's notifications dashboard.
 */
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
angular.module('notificationsDashboardPageModule').controller('NotificationsDashboard', ['$http', '$rootScope', '$scope',
    'DateTimeFormatService',
    function ($http, $rootScope, $scope, DateTimeFormatService) {
        $scope.getItemUrl = function (activityId, notificationType) {
            return ('/create/' + activityId + (notificationType === 'feedback_thread' ? '#/feedback' : ''));
        };
        $scope.navigateToProfile = function ($event, username) {
            $event.stopPropagation();
            window.location.href = '/profile/' + username;
        };
        $scope.getLocaleAbbreviatedDatetimeString = function (millisSinceEpoch) {
            return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
        };
        $rootScope.loadingMessage = 'Loading';
        $http.get('/notificationsdashboardhandler/data').then(function (response) {
            var data = response.data;
            $scope.recentNotifications = data.recent_notifications;
            $scope.jobQueuedMsec = data.job_queued_msec;
            $scope.lastSeenMsec = data.last_seen_msec || 0.0;
            $scope.currentUsername = data.username;
            $rootScope.loadingMessage = '';
        });
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/DateTimeFormatService.ts":
/*!*******************************************************************!*\
  !*** ./core/templates/dev/head/services/DateTimeFormatService.ts ***!
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
* @fileoverview Service for converting dates in milliseconds
* since the Epoch to human-readable dates.
*/
oppia.factory('DateTimeFormatService', ['$filter', function ($filter) {
        return {
            // Returns just the time if the local datetime representation has the
            // same date as the current date. Otherwise, returns just the date if the
            // local datetime representation has the same year as the current date.
            // Otherwise, returns the full date (with the year abbreviated).
            getLocaleAbbreviatedDatetimeString: function (millisSinceEpoch) {
                var date = new Date(millisSinceEpoch);
                if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
                    return date.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    });
                }
                else if (date.getFullYear() === new Date().getFullYear()) {
                    return $filter('date')(date, 'MMM d');
                }
                else {
                    return $filter('date')(date, 'shortDate');
                }
            },
            // Returns just the date.
            getLocaleDateString: function (millisSinceEpoch) {
                var date = new Date(millisSinceEpoch);
                return date.toLocaleDateString();
            },
            // Returns whether the date is at most one week before the current date.
            isRecent: function (millisSinceEpoch) {
                var ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
                return new Date().getTime() - millisSinceEpoch < ONE_WEEK_IN_MILLIS;
            }
        };
    }]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbm90aWZpY2F0aW9ucy1kYXNoYm9hcmQtcGFnZS9ub3RpZmljYXRpb25zLWRhc2hib2FyZC1wYWdlLmNvbnRyb2xsZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUF5QyxpQ0FBaUM7QUFDMUUsd0hBQWdILG1CQUFtQixFQUFFO0FBQ3JJO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7OztBQUdBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsc0dBQW1DO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOzs7Ozs7Ozs7Ozs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUsiLCJmaWxlIjoibm90aWZpY2F0aW9uc19kYXNoYm9hcmQuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9ub3RpZmljYXRpb25zLWRhc2hib2FyZC1wYWdlL25vdGlmaWNhdGlvbnMtZGFzaGJvYXJkLXBhZ2UuY29udHJvbGxlci50c1wiKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGF0YSBhbmQgY29udHJvbGxlcnMgZm9yIHRoZSB1c2VyJ3Mgbm90aWZpY2F0aW9ucyBkYXNoYm9hcmQuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL0RhdGVUaW1lRm9ybWF0U2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ25vdGlmaWNhdGlvbnNEYXNoYm9hcmRQYWdlTW9kdWxlJykuY29udHJvbGxlcignTm90aWZpY2F0aW9uc0Rhc2hib2FyZCcsIFsnJGh0dHAnLCAnJHJvb3RTY29wZScsICckc2NvcGUnLFxuICAgICdEYXRlVGltZUZvcm1hdFNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHJvb3RTY29wZSwgJHNjb3BlLCBEYXRlVGltZUZvcm1hdFNlcnZpY2UpIHtcbiAgICAgICAgJHNjb3BlLmdldEl0ZW1VcmwgPSBmdW5jdGlvbiAoYWN0aXZpdHlJZCwgbm90aWZpY2F0aW9uVHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuICgnL2NyZWF0ZS8nICsgYWN0aXZpdHlJZCArIChub3RpZmljYXRpb25UeXBlID09PSAnZmVlZGJhY2tfdGhyZWFkJyA/ICcjL2ZlZWRiYWNrJyA6ICcnKSk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5uYXZpZ2F0ZVRvUHJvZmlsZSA9IGZ1bmN0aW9uICgkZXZlbnQsIHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAkZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvcHJvZmlsZS8nICsgdXNlcm5hbWU7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5nZXRMb2NhbGVBYmJyZXZpYXRlZERhdGV0aW1lU3RyaW5nID0gZnVuY3Rpb24gKG1pbGxpc1NpbmNlRXBvY2gpIHtcbiAgICAgICAgICAgIHJldHVybiBEYXRlVGltZUZvcm1hdFNlcnZpY2UuZ2V0TG9jYWxlQWJicmV2aWF0ZWREYXRldGltZVN0cmluZyhtaWxsaXNTaW5jZUVwb2NoKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdMb2FkaW5nJztcbiAgICAgICAgJGh0dHAuZ2V0KCcvbm90aWZpY2F0aW9uc2Rhc2hib2FyZGhhbmRsZXIvZGF0YScpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAkc2NvcGUucmVjZW50Tm90aWZpY2F0aW9ucyA9IGRhdGEucmVjZW50X25vdGlmaWNhdGlvbnM7XG4gICAgICAgICAgICAkc2NvcGUuam9iUXVldWVkTXNlYyA9IGRhdGEuam9iX3F1ZXVlZF9tc2VjO1xuICAgICAgICAgICAgJHNjb3BlLmxhc3RTZWVuTXNlYyA9IGRhdGEubGFzdF9zZWVuX21zZWMgfHwgMC4wO1xuICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRVc2VybmFtZSA9IGRhdGEudXNlcm5hbWU7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgIH0pO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGNvbnZlcnRpbmcgZGF0ZXMgaW4gbWlsbGlzZWNvbmRzXG4qIHNpbmNlIHRoZSBFcG9jaCB0byBodW1hbi1yZWFkYWJsZSBkYXRlcy5cbiovXG5vcHBpYS5mYWN0b3J5KCdEYXRlVGltZUZvcm1hdFNlcnZpY2UnLCBbJyRmaWx0ZXInLCBmdW5jdGlvbiAoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gUmV0dXJucyBqdXN0IHRoZSB0aW1lIGlmIHRoZSBsb2NhbCBkYXRldGltZSByZXByZXNlbnRhdGlvbiBoYXMgdGhlXG4gICAgICAgICAgICAvLyBzYW1lIGRhdGUgYXMgdGhlIGN1cnJlbnQgZGF0ZS4gT3RoZXJ3aXNlLCByZXR1cm5zIGp1c3QgdGhlIGRhdGUgaWYgdGhlXG4gICAgICAgICAgICAvLyBsb2NhbCBkYXRldGltZSByZXByZXNlbnRhdGlvbiBoYXMgdGhlIHNhbWUgeWVhciBhcyB0aGUgY3VycmVudCBkYXRlLlxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCByZXR1cm5zIHRoZSBmdWxsIGRhdGUgKHdpdGggdGhlIHllYXIgYWJicmV2aWF0ZWQpLlxuICAgICAgICAgICAgZ2V0TG9jYWxlQWJicmV2aWF0ZWREYXRldGltZVN0cmluZzogZnVuY3Rpb24gKG1pbGxpc1NpbmNlRXBvY2gpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKG1pbGxpc1NpbmNlRXBvY2gpO1xuICAgICAgICAgICAgICAgIGlmIChkYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpID09PSBuZXcgRGF0ZSgpLnRvTG9jYWxlRGF0ZVN0cmluZygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlLnRvTG9jYWxlVGltZVN0cmluZyhbXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgaG91cjogJ251bWVyaWMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWludXRlOiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgICAgICAgICBob3VyMTI6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRhdGUuZ2V0RnVsbFllYXIoKSA9PT0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdkYXRlJykoZGF0ZSwgJ01NTSBkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignZGF0ZScpKGRhdGUsICdzaG9ydERhdGUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyBqdXN0IHRoZSBkYXRlLlxuICAgICAgICAgICAgZ2V0TG9jYWxlRGF0ZVN0cmluZzogZnVuY3Rpb24gKG1pbGxpc1NpbmNlRXBvY2gpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKG1pbGxpc1NpbmNlRXBvY2gpO1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMgd2hldGhlciB0aGUgZGF0ZSBpcyBhdCBtb3N0IG9uZSB3ZWVrIGJlZm9yZSB0aGUgY3VycmVudCBkYXRlLlxuICAgICAgICAgICAgaXNSZWNlbnQ6IGZ1bmN0aW9uIChtaWxsaXNTaW5jZUVwb2NoKSB7XG4gICAgICAgICAgICAgICAgdmFyIE9ORV9XRUVLX0lOX01JTExJUyA9IDcgKiAyNCAqIDYwICogNjAgKiAxMDAwO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIG1pbGxpc1NpbmNlRXBvY2ggPCBPTkVfV0VFS19JTl9NSUxMSVM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==