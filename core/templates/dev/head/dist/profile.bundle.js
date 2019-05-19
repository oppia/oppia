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
/******/ 		"profile": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/profile-page/profile-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0","collection_player~creator_dashboard~exploration_editor~exploration_player~learner_dashboard~library~~88caa5df","collection_player~learner_dashboard~library~profile"]);
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

/***/ "./core/templates/dev/head/pages/profile-page/profile-page.controller.ts":
/*!*******************************************************************************!*\
  !*** ./core/templates/dev/head/pages/profile-page/profile-page.controller.ts ***!
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
/**
 * @fileoverview Data and controllers for the Oppia profile page.
 */
__webpack_require__(/*! components/common-layout-directives/background-banner/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts");
__webpack_require__(/*! components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.directive.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
angular.module('profilePageModule').controller('Profile', [
    '$http', '$log', '$rootScope', '$scope', '$window', 'DateTimeFormatService',
    'UrlInterpolationService', 'UserService',
    function ($http, $log, $rootScope, $scope, $window, DateTimeFormatService, UrlInterpolationService, UserService) {
        var profileDataUrl = '/profilehandler/data/' + GLOBALS.PROFILE_USERNAME;
        var DEFAULT_PROFILE_PICTURE_URL = UrlInterpolationService.getStaticImageUrl('/general/no_profile_picture.png');
        $scope.getLocaleDateString = function (millisSinceEpoch) {
            return DateTimeFormatService.getLocaleDateString(millisSinceEpoch);
        };
        $rootScope.loadingMessage = 'Loading';
        $http.get(profileDataUrl).then(function (response) {
            var data = response.data;
            $rootScope.loadingMessage = '';
            $scope.username = {
                title: 'Username',
                value: data.profile_username,
                helpText: (data.profile_username)
            };
            $scope.usernameIsLong = data.profile_username.length > 16;
            $scope.userBio = data.user_bio;
            $scope.userDisplayedStatistics = [{
                    title: 'Impact',
                    value: data.user_impact_score,
                    helpText: ('A rough measure of the impact of explorations created by this ' +
                        'user. Better ratings and more playthroughs improve this score.')
                }, {
                    title: 'Created',
                    value: data.created_exp_summary_dicts.length
                }, {
                    title: 'Edited',
                    value: data.edited_exp_summary_dicts.length
                }];
            $scope.userEditedExplorations = data.edited_exp_summary_dicts.sort(function (exploration1, exploration2) {
                if (exploration1.ratings > exploration2.ratings) {
                    return 1;
                }
                else if (exploration1.ratings === exploration2.ratings) {
                    if (exploration1.playthroughs > exploration2.playthroughs) {
                        return 1;
                    }
                    else if (exploration1.playthroughs > exploration2.playthroughs) {
                        return 0;
                    }
                    else {
                        return -1;
                    }
                }
                else {
                    return -1;
                }
            });
            $scope.userNotLoggedIn = !data.username;
            $scope.isAlreadySubscribed = data.is_already_subscribed;
            $scope.isUserVisitingOwnProfile = data.is_user_visiting_own_profile;
            $scope.subscriptionButtonPopoverText = '';
            $scope.currentPageNumber = 0;
            $scope.PAGE_SIZE = 6;
            $scope.startingExplorationNumber = 1;
            $scope.endingExplorationNumber = 6;
            $scope.Math = window.Math;
            $scope.profileIsOfCurrentUser = data.profile_is_of_current_user;
            $scope.changeSubscriptionStatus = function () {
                if ($scope.userNotLoggedIn) {
                    UserService.getLoginUrlAsync().then(function (loginUrl) {
                        if (loginUrl) {
                            window.location.href = loginUrl;
                        }
                        else {
                            throw Error('Login url not found.');
                        }
                    });
                }
                else {
                    if (!$scope.isAlreadySubscribed) {
                        $scope.isAlreadySubscribed = true;
                        $http.post('/subscribehandler', {
                            creator_username: data.profile_username
                        });
                    }
                    else {
                        $scope.isAlreadySubscribed = false;
                        $http.post('/unsubscribehandler', {
                            creator_username: data.profile_username
                        });
                    }
                    $scope.updateSubscriptionButtonPopoverText();
                }
            };
            $scope.updateSubscriptionButtonPopoverText = function () {
                if ($scope.userNotLoggedIn) {
                    $scope.subscriptionButtonPopoverText = ('Log in or sign up to subscribe to your favorite creators.');
                }
                else if ($scope.isAlreadySubscribed) {
                    $scope.subscriptionButtonPopoverText = ('Unsubscribe to stop receiving email notifications regarding new ' +
                        'explorations published by ' + $scope.username.value + '.');
                }
                else {
                    $scope.subscriptionButtonPopoverText = ('Receive email notifications, whenever ' +
                        $scope.username.value + ' publishes a new exploration.');
                }
            };
            $scope.updateSubscriptionButtonPopoverText();
            $scope.goToPreviousPage = function () {
                if ($scope.currentPageNumber === 0) {
                    $log.error('Error: cannot decrement page');
                }
                else {
                    $scope.currentPageNumber--;
                    $scope.startingExplorationNumber = ($scope.currentPageNumber * $scope.PAGE_SIZE + 1);
                    $scope.endingExplorationNumber = (($scope.currentPageNumber + 1) * $scope.PAGE_SIZE);
                }
            };
            $scope.goToNextPage = function () {
                if (($scope.currentPageNumber + 1) * $scope.PAGE_SIZE >= (data.edited_exp_summary_dicts.length)) {
                    $log.error('Error: Cannot increment page');
                }
                else {
                    $scope.currentPageNumber++;
                    $scope.startingExplorationNumber = ($scope.currentPageNumber * $scope.PAGE_SIZE + 1);
                    $scope.endingExplorationNumber = (Math.min($scope.numUserPortfolioExplorations, ($scope.currentPageNumber + 1) * $scope.PAGE_SIZE));
                }
            };
            $scope.getExplorationsToDisplay = function () {
                $scope.explorationsOnPage = [];
                if ($scope.userEditedExplorations.length === 0) {
                    return $scope.explorationsOnPage;
                }
                $scope.explorationIndexStart = ($scope.currentPageNumber * $scope.PAGE_SIZE);
                $scope.explorationIndexEnd = ($scope.explorationIndexStart + $scope.PAGE_SIZE - 1);
                for (var ind = $scope.explorationIndexStart; ind <= $scope.explorationIndexEnd; ind++) {
                    $scope.explorationsOnPage.push($scope.userEditedExplorations[ind]);
                    if (ind === $scope.userEditedExplorations.length - 1) {
                        break;
                    }
                }
                return $scope.explorationsOnPage;
            };
            $scope.numUserPortfolioExplorations = (data.edited_exp_summary_dicts.length);
            $scope.subjectInterests = data.subject_interests;
            $scope.firstContributionMsec = data.first_contribution_msec;
            $scope.profilePictureDataUrl = (data.profile_picture_data_url || DEFAULT_PROFILE_PICTURE_URL);
            $rootScope.loadingMessage = '';
        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy9jb252ZXJ0LXRvLXBsYWluLXRleHQuZmlsdGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3Byb2ZpbGUtcGFnZS9wcm9maWxlLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQVEsb0JBQW9CO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQWlCLDRCQUE0QjtBQUM3QztBQUNBO0FBQ0EsMEJBQWtCLDJCQUEyQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQWdCLHVCQUF1QjtBQUN2Qzs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdURBQXVEO0FBQ3ZELHVEQUF1RDtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyw0TUFDNEI7QUFDcEMsbUJBQU8sQ0FBQyxzT0FDbUM7QUFDM0MsbUJBQU8sQ0FBQyxzSUFBbUQ7QUFDM0QsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxrRkFBeUI7QUFDakMsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0REFBNEQsbUNBQW1DO0FBQy9GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOzs7Ozs7Ozs7Ozs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FLEdBQUc7QUFDdEU7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsNERBQTRELEdBQUcsRUFBRSxFQUFFO0FBQ25FO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0Esb0RBQW9ELEdBQUc7QUFDdkQ7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsdUJBQXVCO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUsiLCJmaWxlIjoicHJvZmlsZS5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBpbnN0YWxsIGEgSlNPTlAgY2FsbGJhY2sgZm9yIGNodW5rIGxvYWRpbmdcbiBcdGZ1bmN0aW9uIHdlYnBhY2tKc29ucENhbGxiYWNrKGRhdGEpIHtcbiBcdFx0dmFyIGNodW5rSWRzID0gZGF0YVswXTtcbiBcdFx0dmFyIG1vcmVNb2R1bGVzID0gZGF0YVsxXTtcbiBcdFx0dmFyIGV4ZWN1dGVNb2R1bGVzID0gZGF0YVsyXTtcblxuIFx0XHQvLyBhZGQgXCJtb3JlTW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcbiBcdFx0Ly8gdGhlbiBmbGFnIGFsbCBcImNodW5rSWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG4gXHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDAsIHJlc29sdmVzID0gW107XG4gXHRcdGZvcig7aSA8IGNodW5rSWRzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0Y2h1bmtJZCA9IGNodW5rSWRzW2ldO1xuIFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuIFx0XHRcdFx0cmVzb2x2ZXMucHVzaChpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF1bMF0pO1xuIFx0XHRcdH1cbiBcdFx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuIFx0XHR9XG4gXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuIFx0XHRcdGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG4gXHRcdFx0XHRtb2R1bGVzW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0aWYocGFyZW50SnNvbnBGdW5jdGlvbikgcGFyZW50SnNvbnBGdW5jdGlvbihkYXRhKTtcblxuIFx0XHR3aGlsZShyZXNvbHZlcy5sZW5ndGgpIHtcbiBcdFx0XHRyZXNvbHZlcy5zaGlmdCgpKCk7XG4gXHRcdH1cblxuIFx0XHQvLyBhZGQgZW50cnkgbW9kdWxlcyBmcm9tIGxvYWRlZCBjaHVuayB0byBkZWZlcnJlZCBsaXN0XG4gXHRcdGRlZmVycmVkTW9kdWxlcy5wdXNoLmFwcGx5KGRlZmVycmVkTW9kdWxlcywgZXhlY3V0ZU1vZHVsZXMgfHwgW10pO1xuXG4gXHRcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gYWxsIGNodW5rcyByZWFkeVxuIFx0XHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiBcdH07XG4gXHRmdW5jdGlvbiBjaGVja0RlZmVycmVkTW9kdWxlcygpIHtcbiBcdFx0dmFyIHJlc3VsdDtcbiBcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRlZmVycmVkTW9kdWxlcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdHZhciBkZWZlcnJlZE1vZHVsZSA9IGRlZmVycmVkTW9kdWxlc1tpXTtcbiBcdFx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcbiBcdFx0XHRmb3IodmFyIGogPSAxOyBqIDwgZGVmZXJyZWRNb2R1bGUubGVuZ3RoOyBqKyspIHtcbiBcdFx0XHRcdHZhciBkZXBJZCA9IGRlZmVycmVkTW9kdWxlW2pdO1xuIFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2RlcElkXSAhPT0gMCkgZnVsZmlsbGVkID0gZmFsc2U7XG4gXHRcdFx0fVxuIFx0XHRcdGlmKGZ1bGZpbGxlZCkge1xuIFx0XHRcdFx0ZGVmZXJyZWRNb2R1bGVzLnNwbGljZShpLS0sIDEpO1xuIFx0XHRcdFx0cmVzdWx0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBkZWZlcnJlZE1vZHVsZVswXSk7XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcInByb2ZpbGVcIjogMFxuIFx0fTtcblxuIFx0dmFyIGRlZmVycmVkTW9kdWxlcyA9IFtdO1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHR2YXIganNvbnBBcnJheSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSB8fCBbXTtcbiBcdHZhciBvbGRKc29ucEZ1bmN0aW9uID0ganNvbnBBcnJheS5wdXNoLmJpbmQoanNvbnBBcnJheSk7XG4gXHRqc29ucEFycmF5LnB1c2ggPSB3ZWJwYWNrSnNvbnBDYWxsYmFjaztcbiBcdGpzb25wQXJyYXkgPSBqc29ucEFycmF5LnNsaWNlKCk7XG4gXHRmb3IodmFyIGkgPSAwOyBpIDwganNvbnBBcnJheS5sZW5ndGg7IGkrKykgd2VicGFja0pzb25wQ2FsbGJhY2soanNvbnBBcnJheVtpXSk7XG4gXHR2YXIgcGFyZW50SnNvbnBGdW5jdGlvbiA9IG9sZEpzb25wRnVuY3Rpb247XG5cblxuIFx0Ly8gYWRkIGVudHJ5IG1vZHVsZSB0byBkZWZlcnJlZCBsaXN0XG4gXHRkZWZlcnJlZE1vZHVsZXMucHVzaChbXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3Byb2ZpbGUtcGFnZS9wcm9maWxlLXBhZ2UuY29udHJvbGxlci50c1wiLFwiYWJvdXR+YWRtaW5+YXBwfmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmVtYWlsX2Rhc2hib2FyZH5jMWU1MGNjMFwiLFwiY29sbGVjdGlvbl9wbGF5ZXJ+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5sZWFybmVyX2Rhc2hib2FyZH5saWJyYXJ5fn44OGNhYTVkZlwiLFwiY29sbGVjdGlvbl9wbGF5ZXJ+bGVhcm5lcl9kYXNoYm9hcmR+bGlicmFyeX5wcm9maWxlXCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBiYWNrZ3JvdW5kIGJhbm5lci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2JhY2tncm91bmRCYW5uZXJNb2R1bGUnKS5kaXJlY3RpdmUoJ2JhY2tncm91bmRCYW5uZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9iYWNrZ3JvdW5kLWJhbm5lci8nICtcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2Jhbm5lckEuc3ZnJywgJ2Jhbm5lckIuc3ZnJywgJ2Jhbm5lckMuc3ZnJywgJ2Jhbm5lckQuc3ZnJ1xuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmFubmVySW1hZ2VGaWxlbmFtZSA9IHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmJhbm5lckltYWdlRmlsZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKCcvYmFja2dyb3VuZC8nICsgYmFubmVySW1hZ2VGaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb252ZXJ0VG9QbGFpblRleHQgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0cmluZ1V0aWxpdHlGaWx0ZXJzTW9kdWxlJykuZmlsdGVyKCdjb252ZXJ0VG9QbGFpblRleHQnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgc3RyaXBwZWRUZXh0ID0gaW5wdXQucmVwbGFjZSgvKDwoW14+XSspPikvaWcsICcnKTtcbiAgICAgICAgICAgIHN0cmlwcGVkVGV4dCA9IHN0cmlwcGVkVGV4dC5yZXBsYWNlKC8mbmJzcDsvaWcsICcgJyk7XG4gICAgICAgICAgICBzdHJpcHBlZFRleHQgPSBzdHJpcHBlZFRleHQucmVwbGFjZSgvJnF1b3Q7L2lnLCAnJyk7XG4gICAgICAgICAgICB2YXIgdHJpbW1lZFRleHQgPSBzdHJpcHBlZFRleHQudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRyaW1tZWRUZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJpcHBlZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJpbW1lZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERhdGEgYW5kIGNvbnRyb2xsZXJzIGZvciB0aGUgT3BwaWEgcHJvZmlsZSBwYWdlLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9iYWNrZ3JvdW5kLWJhbm5lci8nICtcbiAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N1bW1hcnktdGlsZS1kaXJlY3RpdmVzL2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS8nICtcbiAgICAnZXhwbG9yYXRpb24tc3VtbWFyeS10aWxlLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLmZpbHRlci50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXNlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0RhdGVUaW1lRm9ybWF0U2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3Byb2ZpbGVQYWdlTW9kdWxlJykuY29udHJvbGxlcignUHJvZmlsZScsIFtcbiAgICAnJGh0dHAnLCAnJGxvZycsICckcm9vdFNjb3BlJywgJyRzY29wZScsICckd2luZG93JywgJ0RhdGVUaW1lRm9ybWF0U2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRsb2csICRyb290U2NvcGUsICRzY29wZSwgJHdpbmRvdywgRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgVXNlclNlcnZpY2UpIHtcbiAgICAgICAgdmFyIHByb2ZpbGVEYXRhVXJsID0gJy9wcm9maWxlaGFuZGxlci9kYXRhLycgKyBHTE9CQUxTLlBST0ZJTEVfVVNFUk5BTUU7XG4gICAgICAgIHZhciBERUZBVUxUX1BST0ZJTEVfUElDVFVSRV9VUkwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2dlbmVyYWwvbm9fcHJvZmlsZV9waWN0dXJlLnBuZycpO1xuICAgICAgICAkc2NvcGUuZ2V0TG9jYWxlRGF0ZVN0cmluZyA9IGZ1bmN0aW9uIChtaWxsaXNTaW5jZUVwb2NoKSB7XG4gICAgICAgICAgICByZXR1cm4gRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLmdldExvY2FsZURhdGVTdHJpbmcobWlsbGlzU2luY2VFcG9jaCk7XG4gICAgICAgIH07XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnTG9hZGluZyc7XG4gICAgICAgICRodHRwLmdldChwcm9maWxlRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICRzY29wZS51c2VybmFtZSA9IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ1VzZXJuYW1lJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogZGF0YS5wcm9maWxlX3VzZXJuYW1lLFxuICAgICAgICAgICAgICAgIGhlbHBUZXh0OiAoZGF0YS5wcm9maWxlX3VzZXJuYW1lKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRzY29wZS51c2VybmFtZUlzTG9uZyA9IGRhdGEucHJvZmlsZV91c2VybmFtZS5sZW5ndGggPiAxNjtcbiAgICAgICAgICAgICRzY29wZS51c2VyQmlvID0gZGF0YS51c2VyX2JpbztcbiAgICAgICAgICAgICRzY29wZS51c2VyRGlzcGxheWVkU3RhdGlzdGljcyA9IFt7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnSW1wYWN0JyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRhdGEudXNlcl9pbXBhY3Rfc2NvcmUsXG4gICAgICAgICAgICAgICAgICAgIGhlbHBUZXh0OiAoJ0Egcm91Z2ggbWVhc3VyZSBvZiB0aGUgaW1wYWN0IG9mIGV4cGxvcmF0aW9ucyBjcmVhdGVkIGJ5IHRoaXMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAndXNlci4gQmV0dGVyIHJhdGluZ3MgYW5kIG1vcmUgcGxheXRocm91Z2hzIGltcHJvdmUgdGhpcyBzY29yZS4nKVxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdDcmVhdGVkJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRhdGEuY3JlYXRlZF9leHBfc3VtbWFyeV9kaWN0cy5sZW5ndGhcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnRWRpdGVkJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRhdGEuZWRpdGVkX2V4cF9zdW1tYXJ5X2RpY3RzLmxlbmd0aFxuICAgICAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgJHNjb3BlLnVzZXJFZGl0ZWRFeHBsb3JhdGlvbnMgPSBkYXRhLmVkaXRlZF9leHBfc3VtbWFyeV9kaWN0cy5zb3J0KGZ1bmN0aW9uIChleHBsb3JhdGlvbjEsIGV4cGxvcmF0aW9uMikge1xuICAgICAgICAgICAgICAgIGlmIChleHBsb3JhdGlvbjEucmF0aW5ncyA+IGV4cGxvcmF0aW9uMi5yYXRpbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChleHBsb3JhdGlvbjEucmF0aW5ncyA9PT0gZXhwbG9yYXRpb24yLnJhdGluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4cGxvcmF0aW9uMS5wbGF5dGhyb3VnaHMgPiBleHBsb3JhdGlvbjIucGxheXRocm91Z2hzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChleHBsb3JhdGlvbjEucGxheXRocm91Z2hzID4gZXhwbG9yYXRpb24yLnBsYXl0aHJvdWdocykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRzY29wZS51c2VyTm90TG9nZ2VkSW4gPSAhZGF0YS51c2VybmFtZTtcbiAgICAgICAgICAgICRzY29wZS5pc0FscmVhZHlTdWJzY3JpYmVkID0gZGF0YS5pc19hbHJlYWR5X3N1YnNjcmliZWQ7XG4gICAgICAgICAgICAkc2NvcGUuaXNVc2VyVmlzaXRpbmdPd25Qcm9maWxlID0gZGF0YS5pc191c2VyX3Zpc2l0aW5nX293bl9wcm9maWxlO1xuICAgICAgICAgICAgJHNjb3BlLnN1YnNjcmlwdGlvbkJ1dHRvblBvcG92ZXJUZXh0ID0gJyc7XG4gICAgICAgICAgICAkc2NvcGUuY3VycmVudFBhZ2VOdW1iZXIgPSAwO1xuICAgICAgICAgICAgJHNjb3BlLlBBR0VfU0laRSA9IDY7XG4gICAgICAgICAgICAkc2NvcGUuc3RhcnRpbmdFeHBsb3JhdGlvbk51bWJlciA9IDE7XG4gICAgICAgICAgICAkc2NvcGUuZW5kaW5nRXhwbG9yYXRpb25OdW1iZXIgPSA2O1xuICAgICAgICAgICAgJHNjb3BlLk1hdGggPSB3aW5kb3cuTWF0aDtcbiAgICAgICAgICAgICRzY29wZS5wcm9maWxlSXNPZkN1cnJlbnRVc2VyID0gZGF0YS5wcm9maWxlX2lzX29mX2N1cnJlbnRfdXNlcjtcbiAgICAgICAgICAgICRzY29wZS5jaGFuZ2VTdWJzY3JpcHRpb25TdGF0dXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCRzY29wZS51c2VyTm90TG9nZ2VkSW4pIHtcbiAgICAgICAgICAgICAgICAgICAgVXNlclNlcnZpY2UuZ2V0TG9naW5VcmxBc3luYygpLnRoZW4oZnVuY3Rpb24gKGxvZ2luVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9naW5VcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGxvZ2luVXJsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0xvZ2luIHVybCBub3QgZm91bmQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuaXNBbHJlYWR5U3Vic2NyaWJlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzQWxyZWFkeVN1YnNjcmliZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdCgnL3N1YnNjcmliZWhhbmRsZXInLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRvcl91c2VybmFtZTogZGF0YS5wcm9maWxlX3VzZXJuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc0FscmVhZHlTdWJzY3JpYmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KCcvdW5zdWJzY3JpYmVoYW5kbGVyJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0b3JfdXNlcm5hbWU6IGRhdGEucHJvZmlsZV91c2VybmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZVN1YnNjcmlwdGlvbkJ1dHRvblBvcG92ZXJUZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVTdWJzY3JpcHRpb25CdXR0b25Qb3BvdmVyVGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnVzZXJOb3RMb2dnZWRJbikge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3Vic2NyaXB0aW9uQnV0dG9uUG9wb3ZlclRleHQgPSAoJ0xvZyBpbiBvciBzaWduIHVwIHRvIHN1YnNjcmliZSB0byB5b3VyIGZhdm9yaXRlIGNyZWF0b3JzLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICgkc2NvcGUuaXNBbHJlYWR5U3Vic2NyaWJlZCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3Vic2NyaXB0aW9uQnV0dG9uUG9wb3ZlclRleHQgPSAoJ1Vuc3Vic2NyaWJlIHRvIHN0b3AgcmVjZWl2aW5nIGVtYWlsIG5vdGlmaWNhdGlvbnMgcmVnYXJkaW5nIG5ldyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdleHBsb3JhdGlvbnMgcHVibGlzaGVkIGJ5ICcgKyAkc2NvcGUudXNlcm5hbWUudmFsdWUgKyAnLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN1YnNjcmlwdGlvbkJ1dHRvblBvcG92ZXJUZXh0ID0gKCdSZWNlaXZlIGVtYWlsIG5vdGlmaWNhdGlvbnMsIHdoZW5ldmVyICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVzZXJuYW1lLnZhbHVlICsgJyBwdWJsaXNoZXMgYSBuZXcgZXhwbG9yYXRpb24uJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRzY29wZS51cGRhdGVTdWJzY3JpcHRpb25CdXR0b25Qb3BvdmVyVGV4dCgpO1xuICAgICAgICAgICAgJHNjb3BlLmdvVG9QcmV2aW91c1BhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCRzY29wZS5jdXJyZW50UGFnZU51bWJlciA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdFcnJvcjogY2Fubm90IGRlY3JlbWVudCBwYWdlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudFBhZ2VOdW1iZXItLTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXJ0aW5nRXhwbG9yYXRpb25OdW1iZXIgPSAoJHNjb3BlLmN1cnJlbnRQYWdlTnVtYmVyICogJHNjb3BlLlBBR0VfU0laRSArIDEpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZW5kaW5nRXhwbG9yYXRpb25OdW1iZXIgPSAoKCRzY29wZS5jdXJyZW50UGFnZU51bWJlciArIDEpICogJHNjb3BlLlBBR0VfU0laRSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRzY29wZS5nb1RvTmV4dFBhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCgkc2NvcGUuY3VycmVudFBhZ2VOdW1iZXIgKyAxKSAqICRzY29wZS5QQUdFX1NJWkUgPj0gKGRhdGEuZWRpdGVkX2V4cF9zdW1tYXJ5X2RpY3RzLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxvZy5lcnJvcignRXJyb3I6IENhbm5vdCBpbmNyZW1lbnQgcGFnZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRQYWdlTnVtYmVyKys7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zdGFydGluZ0V4cGxvcmF0aW9uTnVtYmVyID0gKCRzY29wZS5jdXJyZW50UGFnZU51bWJlciAqICRzY29wZS5QQUdFX1NJWkUgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVuZGluZ0V4cGxvcmF0aW9uTnVtYmVyID0gKE1hdGgubWluKCRzY29wZS5udW1Vc2VyUG9ydGZvbGlvRXhwbG9yYXRpb25zLCAoJHNjb3BlLmN1cnJlbnRQYWdlTnVtYmVyICsgMSkgKiAkc2NvcGUuUEFHRV9TSVpFKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRzY29wZS5nZXRFeHBsb3JhdGlvbnNUb0Rpc3BsYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmV4cGxvcmF0aW9uc09uUGFnZSA9IFtdO1xuICAgICAgICAgICAgICAgIGlmICgkc2NvcGUudXNlckVkaXRlZEV4cGxvcmF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS5leHBsb3JhdGlvbnNPblBhZ2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRzY29wZS5leHBsb3JhdGlvbkluZGV4U3RhcnQgPSAoJHNjb3BlLmN1cnJlbnRQYWdlTnVtYmVyICogJHNjb3BlLlBBR0VfU0laRSk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmV4cGxvcmF0aW9uSW5kZXhFbmQgPSAoJHNjb3BlLmV4cGxvcmF0aW9uSW5kZXhTdGFydCArICRzY29wZS5QQUdFX1NJWkUgLSAxKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpbmQgPSAkc2NvcGUuZXhwbG9yYXRpb25JbmRleFN0YXJ0OyBpbmQgPD0gJHNjb3BlLmV4cGxvcmF0aW9uSW5kZXhFbmQ7IGluZCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5leHBsb3JhdGlvbnNPblBhZ2UucHVzaCgkc2NvcGUudXNlckVkaXRlZEV4cGxvcmF0aW9uc1tpbmRdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZCA9PT0gJHNjb3BlLnVzZXJFZGl0ZWRFeHBsb3JhdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS5leHBsb3JhdGlvbnNPblBhZ2U7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJHNjb3BlLm51bVVzZXJQb3J0Zm9saW9FeHBsb3JhdGlvbnMgPSAoZGF0YS5lZGl0ZWRfZXhwX3N1bW1hcnlfZGljdHMubGVuZ3RoKTtcbiAgICAgICAgICAgICRzY29wZS5zdWJqZWN0SW50ZXJlc3RzID0gZGF0YS5zdWJqZWN0X2ludGVyZXN0cztcbiAgICAgICAgICAgICRzY29wZS5maXJzdENvbnRyaWJ1dGlvbk1zZWMgPSBkYXRhLmZpcnN0X2NvbnRyaWJ1dGlvbl9tc2VjO1xuICAgICAgICAgICAgJHNjb3BlLnByb2ZpbGVQaWN0dXJlRGF0YVVybCA9IChkYXRhLnByb2ZpbGVfcGljdHVyZV9kYXRhX3VybCB8fCBERUZBVUxUX1BST0ZJTEVfUElDVFVSRV9VUkwpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICB9KTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgbWFuaXB1bGF0aW5nIHRoZSBwYWdlIFVSTC4gQWxzbyBhbGxvd3NcbiAqIGZ1bmN0aW9ucyBvbiAkd2luZG93IHRvIGJlIG1vY2tlZCBpbiB1bml0IHRlc3RzLlxuICovXG5vcHBpYS5mYWN0b3J5KCdVcmxTZXJ2aWNlJywgWyckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgZm9yIHRlc3RpbmcgcHVycG9zZXMgKHRvIG1vY2sgJHdpbmRvdy5sb2NhdGlvbilcbiAgICAgICAgICAgIGdldEN1cnJlbnRMb2NhdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkd2luZG93LmxvY2F0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEN1cnJlbnRRdWVyeVN0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLnNlYXJjaDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKiBBcyBwYXJhbXNba2V5XSBpcyBvdmVyd3JpdHRlbiwgaWYgcXVlcnkgc3RyaW5nIGhhcyBtdWx0aXBsZSBmaWVsZFZhbHVlc1xuICAgICAgICAgICAgICAgZm9yIHNhbWUgZmllbGROYW1lLCB1c2UgZ2V0UXVlcnlGaWVsZFZhbHVlc0FzTGlzdChmaWVsZE5hbWUpIHRvIGdldCBpdFxuICAgICAgICAgICAgICAgaW4gYXJyYXkgZm9ybS4gKi9cbiAgICAgICAgICAgIGdldFVybFBhcmFtczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgcGFydHMgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLnJlcGxhY2UoL1s/Jl0rKFtePSZdKyk9KFteJl0qKS9naSwgZnVuY3Rpb24gKG0sIGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zW2RlY29kZVVSSUNvbXBvbmVudChrZXkpXSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0lmcmFtZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgdmFyIHVybFBhcnRzID0gcGF0aG5hbWUuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXJsUGFydHNbMV0gPT09ICdlbWJlZCc7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UGF0aG5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5wYXRobmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBUb3BpYyBpZCBzaG91bGQgYmUgY29ycmVjdGx5IHJldHVybmVkIGZyb20gdG9waWMgZWRpdG9yIGFzIHdlbGwgYXNcbiAgICAgICAgICAgIC8vIHN0b3J5IGVkaXRvciwgc2luY2UgYm90aCBoYXZlIHRvcGljIGlkIGluIHRoZWlyIHVybC5cbiAgICAgICAgICAgIGdldFRvcGljSWRGcm9tVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvKHN0b3J5fHRvcGljKV9lZGl0b3JcXC8oXFx3fC0pezEyfS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aG5hbWUuc3BsaXQoJy8nKVsyXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgdG9waWMgaWQgdXJsJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0VG9waWNOYW1lRnJvbUxlYXJuZXJVcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC8oc3Rvcnl8dG9waWN8cHJhY3RpY2Vfc2Vzc2lvbikvZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZS5zcGxpdCgnLycpWzJdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgVVJMIGZvciB0b3BpYycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0b3J5SWRGcm9tVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvc3RvcnlfZWRpdG9yKFxcLyhcXHd8LSl7MTJ9KXsyfS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aG5hbWUuc3BsaXQoJy8nKVszXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgc3RvcnkgaWQgdXJsJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RvcnlJZEluUGxheWVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBpZiAocXVlcnkubWF0Y2goL1xcP3N0b3J5X2lkPSgoXFx3fC0pezEyfSkvZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5LnNwbGl0KCc9JylbMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFNraWxsSWRGcm9tVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIHZhciBza2lsbElkID0gcGF0aG5hbWUuc3BsaXQoJy8nKVsyXTtcbiAgICAgICAgICAgICAgICBpZiAoc2tpbGxJZC5sZW5ndGggIT09IDEyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFNraWxsIElkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBza2lsbElkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFF1ZXJ5RmllbGRWYWx1ZXNBc0xpc3Q6IGZ1bmN0aW9uIChmaWVsZE5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGRWYWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5pbmRleE9mKCc/JykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBFYWNoIHF1ZXJ5SXRlbSByZXR1cm4gb25lIGZpZWxkLXZhbHVlIHBhaXIgaW4gdGhlIHVybC5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5SXRlbXMgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLnNsaWNlKHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuaW5kZXhPZignPycpICsgMSkuc3BsaXQoJyYnKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWVyeUl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZpZWxkTmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChxdWVyeUl0ZW1zW2ldLnNwbGl0KCc9JylbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGaWVsZFZhbHVlID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5SXRlbXNbaV0uc3BsaXQoJz0nKVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEZpZWxkTmFtZSA9PT0gZmllbGROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZXMucHVzaChjdXJyZW50RmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVmFsdWVzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFkZEZpZWxkOiBmdW5jdGlvbiAodXJsLCBmaWVsZE5hbWUsIGZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZW5jb2RlZEZpZWxkVmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQoZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgdmFyIGVuY29kZWRGaWVsZE5hbWUgPSBlbmNvZGVVUklDb21wb25lbnQoZmllbGROYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXJsICsgKHVybC5pbmRleE9mKCc/JykgIT09IC0xID8gJyYnIDogJz8nKSArIGVuY29kZWRGaWVsZE5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnPScgKyBlbmNvZGVkRmllbGRWYWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRIYXNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkuaGFzaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9