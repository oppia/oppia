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
/******/ 		"topic_viewer": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0"]);
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

/***/ "./core/templates/dev/head/components/summary-tile-directives/story-summary-tile/story-summary-tile.directive.ts":
/*!***********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile-directives/story-summary-tile/story-summary-tile.directive.ts ***!
  \***********************************************************************************************************************/
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
 * @fileoverview Component for a canonical story tile.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('storySummaryTileModule').directive('storySummaryTile', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getStoryId: '&storyId',
                getStoryTitle: '&title',
                getStoryDescription: '&description',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/summary-tile-directives/story-summary-tile/' +
                'story-summary-tile.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                function () {
                    var ctrl = this;
                    ctrl.getStoryLink = function () {
                        return UrlInterpolationService.getStoryUrl('/story', ctrl.getStoryId());
                    };
                    ctrl.getStaticImageUrl = function (url) {
                        return UrlInterpolationService.getStaticImageUrl(url);
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/topic_viewer/TopicViewerBackendApiService.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topic_viewer/TopicViewerBackendApiService.ts ***!
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
 * @fileoverview Service to get topic data.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.constant('TOPIC_DATA_URL_TEMPLATE', '/topic_data_handler/<topic_name>');
oppia.factory('TopicViewerBackendApiService', [
    '$http', '$q', 'UrlInterpolationService', 'TOPIC_DATA_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, TOPIC_DATA_URL_TEMPLATE) {
        var topicDataDict = null;
        var _fetchTopicData = function (topicName, successCallback, errorCallback) {
            var topicDataUrl = UrlInterpolationService.interpolateUrl(TOPIC_DATA_URL_TEMPLATE, {
                topic_name: topicName
            });
            $http.get(topicDataUrl).then(function (response) {
                topicDataDict = angular.copy(response.data);
                if (successCallback) {
                    successCallback(topicDataDict);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        return {
            fetchTopicData: function (topicName) {
                return $q(function (resolve, reject) {
                    _fetchTopicData(topicName, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/stories-list/stories-list.directive.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/stories-list/stories-list.directive.ts ***!
  \************************************************************************************************/
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
 * @fileoverview Directive for the stories list.
 */
__webpack_require__(/*! components/summary-tile-directives/story-summary-tile/story-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile-directives/story-summary-tile/story-summary-tile.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('storiesListModule').directive('storiesList', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getTopicId: '&topicId',
                getCanonicalStories: '&canonicalStoriesList',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topic-viewer-page/stories-list/stories-list.directive.html'),
            controller: ['WindowDimensionsService', '$scope', '$timeout',
                function (WindowDimensionsService, $scope, $timeout) {
                    var STORY_TILE_WIDTH_PX = 360;
                    $scope.leftmostCardIndices = 0;
                    var MAX_NUM_TILES_PER_ROW = 4;
                    $scope.tileDisplayCount = 0;
                    var initCarousels = function () {
                        $scope.canonicalStories = $scope.getCanonicalStories();
                        if (!$scope.canonicalStories) {
                            return;
                        }
                        var windowWidth = $(window).width();
                        $scope.tileDisplayCount = Math.min(Math.floor(windowWidth / (STORY_TILE_WIDTH_PX + 20)), MAX_NUM_TILES_PER_ROW);
                        $('.oppia-topic-viewer-carousel').css({
                            width: ($scope.tileDisplayCount * STORY_TILE_WIDTH_PX) + 'px'
                        });
                        var carouselJQuerySelector = ('.oppia-topic-viewer-carousel');
                        var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
                        var index = Math.ceil(carouselScrollPositionPx / STORY_TILE_WIDTH_PX);
                        $scope.leftmostCardIndices = index;
                    };
                    var isAnyCarouselCurrentlyScrolling = false;
                    $scope.scroll = function (isLeftScroll) {
                        if (isAnyCarouselCurrentlyScrolling) {
                            return;
                        }
                        var carouselJQuerySelector = ('.oppia-topic-viewer-carousel');
                        var direction = isLeftScroll ? -1 : 1;
                        var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
                        // Prevent scrolling if there more carousel pixed widths than
                        // there are tile widths.
                        if ($scope.canonicalStories.length <= $scope.tileDisplayCount) {
                            return;
                        }
                        carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);
                        if (isLeftScroll) {
                            $scope.leftmostCardIndices = Math.max(0, $scope.leftmostCardIndices - $scope.tileDisplayCount);
                        }
                        else {
                            $scope.leftmostCardIndices = Math.min($scope.canonicalStories.length - $scope.tileDisplayCount + 1, $scope.leftmostCardIndices + $scope.tileDisplayCount);
                        }
                        var newScrollPositionPx = carouselScrollPositionPx +
                            ($scope.tileDisplayCount * STORY_TILE_WIDTH_PX * direction);
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
                    var topicViewerWindowCutoffPx = 895;
                    $scope.topicViewerWindowIsNarrow = (WindowDimensionsService.getWidth() <= topicViewerWindowCutoffPx);
                    WindowDimensionsService.registerOnResizeHook(function () {
                        $scope.topicViewerWindowIsNarrow = (WindowDimensionsService.getWidth() <= topicViewerWindowCutoffPx);
                        $scope.$apply();
                    });
                    $scope.incrementLeftmostCardIndex = function () {
                        $scope.leftmostCardIndices++;
                    };
                    $scope.decrementLeftmostCardIndex = function () {
                        $scope.leftmostCardIndices--;
                    };
                    $timeout(function () {
                        initCarousels();
                    }, 390);
                    $(window).resize(function () {
                        initCarousels();
                        $scope.$apply();
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-navbar-breadcrumb/topic-viewer-navbar-breadcrumb.directive.ts":
/*!************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-navbar-breadcrumb/topic-viewer-navbar-breadcrumb.directive.ts ***!
  \************************************************************************************************************************************/
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
 * @fileoverview Directive for the navbar breadcrumb of the topic viewer.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('topicViewerNavbarBreadcrumbModule').directive('topicViewerNavbarBreadcrumb', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topic-viewer-page/topic-viewer-navbar-breadcrumb/' +
                'topic-viewer-navbar-breadcrumb.directive.html'),
            controller: ['$scope', 'TopicViewerBackendApiService', 'UrlService',
                function ($scope, TopicViewerBackendApiService, UrlService) {
                    TopicViewerBackendApiService.fetchTopicData(UrlService.getTopicNameFromLearnerUrl()).then(function (topicDataDict) {
                        $scope.topicName = topicDataDict.topic_name;
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.controller.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.controller.ts ***!
  \*****************************************************************************************/
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
 * @fileoverview Controllers for the topic viewer.
 */
__webpack_require__(/*! components/common-layout-directives/background-banner/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts");
__webpack_require__(/*! pages/topic-viewer-page/stories-list/stories-list.directive.ts */ "./core/templates/dev/head/pages/topic-viewer-page/stories-list/stories-list.directive.ts");
__webpack_require__(/*! pages/topic-viewer-page/topic-viewer-navbar-breadcrumb/topic-viewer-navbar-breadcrumb.directive.ts */ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-navbar-breadcrumb/topic-viewer-navbar-breadcrumb.directive.ts");
__webpack_require__(/*! domain/topic_viewer/TopicViewerBackendApiService.ts */ "./core/templates/dev/head/domain/topic_viewer/TopicViewerBackendApiService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('topicViewerPageModule').controller('TopicViewer', [
    '$rootScope', '$scope', '$window', 'AlertsService',
    'TopicViewerBackendApiService',
    'UrlService', 'FATAL_ERROR_CODES',
    function ($rootScope, $scope, $window, AlertsService, TopicViewerBackendApiService, UrlService, FATAL_ERROR_CODES) {
        $scope.setActiveTab = function (newActiveTabName) {
            $scope.activeTab = newActiveTabName;
        };
        $scope.setActiveTab('story');
        $scope.checkMobileView = function () {
            return ($window.innerWidth < 500);
        };
        $scope.topicName = UrlService.getTopicNameFromLearnerUrl();
        $rootScope.loadingMessage = 'Loading';
        TopicViewerBackendApiService.fetchTopicData($scope.topicName).then(function (topicDataDict) {
            $scope.canonicalStoriesList = topicDataDict.canonical_story_dicts;
            $rootScope.loadingMessage = '';
        }, function (errorResponse) {
            if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
                AlertsService.addWarning('Failed to get dashboard data');
            }
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


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/WindowDimensionsService.ts ***!
  \********************************************************************************/
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
 * @fileoverview Service for computing the window dimensions.
 */
oppia.factory('WindowDimensionsService', ['$window', function ($window) {
        var onResizeHooks = [];
        angular.element($window).bind('resize', function () {
            onResizeHooks.forEach(function (hookFn) {
                hookFn();
            });
        });
        return {
            getWidth: function () {
                return ($window.innerWidth || document.documentElement.clientWidth ||
                    document.body.clientWidth);
            },
            registerOnResizeHook: function (hookFn) {
                onResizeHooks.push(hookFn);
            },
            isWindowNarrow: function () {
                var NORMAL_NAVBAR_CUTOFF_WIDTH_PX = 768;
                return this.getWidth() <= NORMAL_NAVBAR_CUTOFF_WIDTH_PX;
            }
        };
    }]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3VtbWFyeS10aWxlLWRpcmVjdGl2ZXMvc3Rvcnktc3VtbWFyeS10aWxlL3N0b3J5LXN1bW1hcnktdGlsZS5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3RvcGljX3ZpZXdlci9Ub3BpY1ZpZXdlckJhY2tlbmRBcGlTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL3N0b3JpZXMtbGlzdC9zdG9yaWVzLWxpc3QuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL3RvcGljLXZpZXdlci1uYXZiYXItYnJlYWRjcnVtYi90b3BpYy12aWV3ZXItbmF2YmFyLWJyZWFkY3J1bWIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL3RvcGljLXZpZXdlci1wYWdlLmNvbnRyb2xsZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMiXSwibmFtZXMiOltd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QUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDM0dMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyIsImZpbGUiOiJ0b3BpY192aWV3ZXIuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRyZXR1cm4gcmVzdWx0O1xuIFx0fVxuXG4gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGFuZCBsb2FkaW5nIGNodW5rc1xuIFx0Ly8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4gXHQvLyBQcm9taXNlID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxuIFx0dmFyIGluc3RhbGxlZENodW5rcyA9IHtcbiBcdFx0XCJ0b3BpY192aWV3ZXJcIjogMFxuIFx0fTtcblxuIFx0dmFyIGRlZmVycmVkTW9kdWxlcyA9IFtdO1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHR2YXIganNvbnBBcnJheSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSB8fCBbXTtcbiBcdHZhciBvbGRKc29ucEZ1bmN0aW9uID0ganNvbnBBcnJheS5wdXNoLmJpbmQoanNvbnBBcnJheSk7XG4gXHRqc29ucEFycmF5LnB1c2ggPSB3ZWJwYWNrSnNvbnBDYWxsYmFjaztcbiBcdGpzb25wQXJyYXkgPSBqc29ucEFycmF5LnNsaWNlKCk7XG4gXHRmb3IodmFyIGkgPSAwOyBpIDwganNvbnBBcnJheS5sZW5ndGg7IGkrKykgd2VicGFja0pzb25wQ2FsbGJhY2soanNvbnBBcnJheVtpXSk7XG4gXHR2YXIgcGFyZW50SnNvbnBGdW5jdGlvbiA9IG9sZEpzb25wRnVuY3Rpb247XG5cblxuIFx0Ly8gYWRkIGVudHJ5IG1vZHVsZSB0byBkZWZlcnJlZCBsaXN0XG4gXHRkZWZlcnJlZE1vZHVsZXMucHVzaChbXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL3RvcGljLXZpZXdlci1wYWdlLmNvbnRyb2xsZXIudHNcIixcImFib3V0fmFkbWlufmFwcH5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lbWFpbF9kYXNoYm9hcmR+YzFlNTBjYzBcIl0pO1xuIFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiByZWFkeVxuIFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGJhY2tncm91bmQgYmFubmVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnYmFja2dyb3VuZEJhbm5lck1vZHVsZScpLmRpcmVjdGl2ZSgnYmFja2dyb3VuZEJhbm5lcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2JhY2tncm91bmQtYmFubmVyLycgK1xuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zc2libGVCYW5uZXJGaWxlbmFtZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnYmFubmVyQS5zdmcnLCAnYmFubmVyQi5zdmcnLCAnYmFubmVyQy5zdmcnLCAnYmFubmVyRC5zdmcnXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYW5uZXJJbWFnZUZpbGVuYW1lID0gcG9zc2libGVCYW5uZXJGaWxlbmFtZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGVCYW5uZXJGaWxlbmFtZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYmFubmVySW1hZ2VGaWxlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9iYWNrZ3JvdW5kLycgKyBiYW5uZXJJbWFnZUZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbXBvbmVudCBmb3IgYSBjYW5vbmljYWwgc3RvcnkgdGlsZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3N0b3J5U3VtbWFyeVRpbGVNb2R1bGUnKS5kaXJlY3RpdmUoJ3N0b3J5U3VtbWFyeVRpbGUnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGdldFN0b3J5SWQ6ICcmc3RvcnlJZCcsXG4gICAgICAgICAgICAgICAgZ2V0U3RvcnlUaXRsZTogJyZ0aXRsZScsXG4gICAgICAgICAgICAgICAgZ2V0U3RvcnlEZXNjcmlwdGlvbjogJyZkZXNjcmlwdGlvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUtZGlyZWN0aXZlcy9zdG9yeS1zdW1tYXJ5LXRpbGUvJyArXG4gICAgICAgICAgICAgICAgJ3N0b3J5LXN1bW1hcnktdGlsZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFN0b3J5TGluayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdG9yeVVybCgnL3N0b3J5JywgY3RybC5nZXRTdG9yeUlkKCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFN0YXRpY0ltYWdlVXJsID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKHVybCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGdldCB0b3BpYyBkYXRhLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5vcHBpYS5jb25zdGFudCgnVE9QSUNfREFUQV9VUkxfVEVNUExBVEUnLCAnL3RvcGljX2RhdGFfaGFuZGxlci88dG9waWNfbmFtZT4nKTtcbm9wcGlhLmZhY3RvcnkoJ1RvcGljVmlld2VyQmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgVE9QSUNfREFUQV9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgdmFyIHRvcGljRGF0YURpY3QgPSBudWxsO1xuICAgICAgICB2YXIgX2ZldGNoVG9waWNEYXRhID0gZnVuY3Rpb24gKHRvcGljTmFtZSwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgdG9waWNEYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoVE9QSUNfREFUQV9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICB0b3BpY19uYW1lOiB0b3BpY05hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHAuZ2V0KHRvcGljRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB0b3BpY0RhdGFEaWN0ID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHRvcGljRGF0YURpY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmV0Y2hUb3BpY0RhdGE6IGZ1bmN0aW9uICh0b3BpY05hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hUb3BpY0RhdGEodG9waWNOYW1lLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBzdG9yaWVzIGxpc3QuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvc3VtbWFyeS10aWxlLWRpcmVjdGl2ZXMvc3Rvcnktc3VtbWFyeS10aWxlLycgK1xuICAgICdzdG9yeS1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnc3Rvcmllc0xpc3RNb2R1bGUnKS5kaXJlY3RpdmUoJ3N0b3JpZXNMaXN0JywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgZ2V0VG9waWNJZDogJyZ0b3BpY0lkJyxcbiAgICAgICAgICAgICAgICBnZXRDYW5vbmljYWxTdG9yaWVzOiAnJmNhbm9uaWNhbFN0b3JpZXNMaXN0JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpYy12aWV3ZXItcGFnZS9zdG9yaWVzLWxpc3Qvc3Rvcmllcy1saXN0LmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJ1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlJywgJyRzY29wZScsICckdGltZW91dCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLCAkc2NvcGUsICR0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBTVE9SWV9USUxFX1dJRFRIX1BYID0gMzYwO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBNQVhfTlVNX1RJTEVTX1BFUl9ST1cgPSA0O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudGlsZURpc3BsYXlDb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbml0Q2Fyb3VzZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbm9uaWNhbFN0b3JpZXMgPSAkc2NvcGUuZ2V0Q2Fub25pY2FsU3RvcmllcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuY2Fub25pY2FsU3Rvcmllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aW5kb3dXaWR0aCA9ICQod2luZG93KS53aWR0aCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQgPSBNYXRoLm1pbihNYXRoLmZsb29yKHdpbmRvd1dpZHRoIC8gKFNUT1JZX1RJTEVfV0lEVEhfUFggKyAyMCkpLCBNQVhfTlVNX1RJTEVTX1BFUl9ST1cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnLm9wcGlhLXRvcGljLXZpZXdlci1jYXJvdXNlbCcpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICgkc2NvcGUudGlsZURpc3BsYXlDb3VudCAqIFNUT1JZX1RJTEVfV0lEVEhfUFgpICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2Fyb3VzZWxKUXVlcnlTZWxlY3RvciA9ICgnLm9wcGlhLXRvcGljLXZpZXdlci1jYXJvdXNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhcm91c2VsU2Nyb2xsUG9zaXRpb25QeCA9ICQoY2Fyb3VzZWxKUXVlcnlTZWxlY3Rvcikuc2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gTWF0aC5jZWlsKGNhcm91c2VsU2Nyb2xsUG9zaXRpb25QeCAvIFNUT1JZX1RJTEVfV0lEVEhfUFgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzQW55Q2Fyb3VzZWxDdXJyZW50bHlTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNjcm9sbCA9IGZ1bmN0aW9uIChpc0xlZnRTY3JvbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0FueUNhcm91c2VsQ3VycmVudGx5U2Nyb2xsaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhcm91c2VsSlF1ZXJ5U2VsZWN0b3IgPSAoJy5vcHBpYS10b3BpYy12aWV3ZXItY2Fyb3VzZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSBpc0xlZnRTY3JvbGwgPyAtMSA6IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ID0gJChjYXJvdXNlbEpRdWVyeVNlbGVjdG9yKS5zY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IHNjcm9sbGluZyBpZiB0aGVyZSBtb3JlIGNhcm91c2VsIHBpeGVkIHdpZHRocyB0aGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGVyZSBhcmUgdGlsZSB3aWR0aHMuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNhbm9uaWNhbFN0b3JpZXMubGVuZ3RoIDw9ICRzY29wZS50aWxlRGlzcGxheUNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ID0gTWF0aC5tYXgoMCwgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0xlZnRTY3JvbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlcyA9IE1hdGgubWF4KDAsICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzIC0gJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMgPSBNYXRoLm1pbigkc2NvcGUuY2Fub25pY2FsU3Rvcmllcy5sZW5ndGggLSAkc2NvcGUudGlsZURpc3BsYXlDb3VudCArIDEsICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzICsgJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1Njcm9sbFBvc2l0aW9uUHggPSBjYXJvdXNlbFNjcm9sbFBvc2l0aW9uUHggK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgkc2NvcGUudGlsZURpc3BsYXlDb3VudCAqIFNUT1JZX1RJTEVfV0lEVEhfUFggKiBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChjYXJvdXNlbEpRdWVyeVNlbGVjdG9yKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxMZWZ0OiBuZXdTY3JvbGxQb3NpdGlvblB4XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDgwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBbnlDYXJvdXNlbEN1cnJlbnRseVNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FueUNhcm91c2VsQ3VycmVudGx5U2Nyb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciB0b3BpY1ZpZXdlcldpbmRvd0N1dG9mZlB4ID0gODk1O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNWaWV3ZXJXaW5kb3dJc05hcnJvdyA9IChXaW5kb3dEaW1lbnNpb25zU2VydmljZS5nZXRXaWR0aCgpIDw9IHRvcGljVmlld2VyV2luZG93Q3V0b2ZmUHgpO1xuICAgICAgICAgICAgICAgICAgICBXaW5kb3dEaW1lbnNpb25zU2VydmljZS5yZWdpc3Rlck9uUmVzaXplSG9vayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNWaWV3ZXJXaW5kb3dJc05hcnJvdyA9IChXaW5kb3dEaW1lbnNpb25zU2VydmljZS5nZXRXaWR0aCgpIDw9IHRvcGljVmlld2VyV2luZG93Q3V0b2ZmUHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmluY3JlbWVudExlZnRtb3N0Q2FyZEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMrKztcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlY3JlbWVudExlZnRtb3N0Q2FyZEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMtLTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdENhcm91c2VscygpO1xuICAgICAgICAgICAgICAgICAgICB9LCAzOTApO1xuICAgICAgICAgICAgICAgICAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRDYXJvdXNlbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBuYXZiYXIgYnJlYWRjcnVtYiBvZiB0aGUgdG9waWMgdmlld2VyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCd0b3BpY1ZpZXdlck5hdmJhckJyZWFkY3J1bWJNb2R1bGUnKS5kaXJlY3RpdmUoJ3RvcGljVmlld2VyTmF2YmFyQnJlYWRjcnVtYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpYy12aWV3ZXItcGFnZS90b3BpYy12aWV3ZXItbmF2YmFyLWJyZWFkY3J1bWIvJyArXG4gICAgICAgICAgICAgICAgJ3RvcGljLXZpZXdlci1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnVG9waWNWaWV3ZXJCYWNrZW5kQXBpU2VydmljZScsICdVcmxTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBUb3BpY1ZpZXdlckJhY2tlbmRBcGlTZXJ2aWNlLCBVcmxTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIFRvcGljVmlld2VyQmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hUb3BpY0RhdGEoVXJsU2VydmljZS5nZXRUb3BpY05hbWVGcm9tTGVhcm5lclVybCgpKS50aGVuKGZ1bmN0aW9uICh0b3BpY0RhdGFEaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNOYW1lID0gdG9waWNEYXRhRGljdC50b3BpY19uYW1lO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXJzIGZvciB0aGUgdG9waWMgdmlld2VyLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9iYWNrZ3JvdW5kLWJhbm5lci8nICtcbiAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpYy12aWV3ZXItcGFnZS9zdG9yaWVzLWxpc3Qvc3Rvcmllcy1saXN0LmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWMtdmlld2VyLXBhZ2UvdG9waWMtdmlld2VyLW5hdmJhci1icmVhZGNydW1iLycgK1xuICAgICd0b3BpYy12aWV3ZXItbmF2YmFyLWJyZWFkY3J1bWIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdG9waWNfdmlld2VyL1RvcGljVmlld2VyQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljVmlld2VyUGFnZU1vZHVsZScpLmNvbnRyb2xsZXIoJ1RvcGljVmlld2VyJywgW1xuICAgICckcm9vdFNjb3BlJywgJyRzY29wZScsICckd2luZG93JywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICdUb3BpY1ZpZXdlckJhY2tlbmRBcGlTZXJ2aWNlJyxcbiAgICAnVXJsU2VydmljZScsICdGQVRBTF9FUlJPUl9DT0RFUycsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgVG9waWNWaWV3ZXJCYWNrZW5kQXBpU2VydmljZSwgVXJsU2VydmljZSwgRkFUQUxfRVJST1JfQ09ERVMpIHtcbiAgICAgICAgJHNjb3BlLnNldEFjdGl2ZVRhYiA9IGZ1bmN0aW9uIChuZXdBY3RpdmVUYWJOYW1lKSB7XG4gICAgICAgICAgICAkc2NvcGUuYWN0aXZlVGFiID0gbmV3QWN0aXZlVGFiTmFtZTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnNldEFjdGl2ZVRhYignc3RvcnknKTtcbiAgICAgICAgJHNjb3BlLmNoZWNrTW9iaWxlVmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoJHdpbmRvdy5pbm5lcldpZHRoIDwgNTAwKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnRvcGljTmFtZSA9IFVybFNlcnZpY2UuZ2V0VG9waWNOYW1lRnJvbUxlYXJuZXJVcmwoKTtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdMb2FkaW5nJztcbiAgICAgICAgVG9waWNWaWV3ZXJCYWNrZW5kQXBpU2VydmljZS5mZXRjaFRvcGljRGF0YSgkc2NvcGUudG9waWNOYW1lKS50aGVuKGZ1bmN0aW9uICh0b3BpY0RhdGFEaWN0KSB7XG4gICAgICAgICAgICAkc2NvcGUuY2Fub25pY2FsU3Rvcmllc0xpc3QgPSB0b3BpY0RhdGFEaWN0LmNhbm9uaWNhbF9zdG9yeV9kaWN0cztcbiAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChGQVRBTF9FUlJPUl9DT0RFUy5pbmRleE9mKGVycm9yUmVzcG9uc2Uuc3RhdHVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0ZhaWxlZCB0byBnZXQgZGFzaGJvYXJkIGRhdGEnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIG1hbmlwdWxhdGluZyB0aGUgcGFnZSBVUkwuIEFsc28gYWxsb3dzXG4gKiBmdW5jdGlvbnMgb24gJHdpbmRvdyB0byBiZSBtb2NrZWQgaW4gdW5pdCB0ZXN0cy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnVXJsU2VydmljZScsIFsnJHdpbmRvdycsIGZ1bmN0aW9uICgkd2luZG93KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGZvciB0ZXN0aW5nIHB1cnBvc2VzICh0byBtb2NrICR3aW5kb3cubG9jYXRpb24pXG4gICAgICAgICAgICBnZXRDdXJyZW50TG9jYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHdpbmRvdy5sb2NhdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRDdXJyZW50UXVlcnlTdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5zZWFyY2g7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyogQXMgcGFyYW1zW2tleV0gaXMgb3ZlcndyaXR0ZW4sIGlmIHF1ZXJ5IHN0cmluZyBoYXMgbXVsdGlwbGUgZmllbGRWYWx1ZXNcbiAgICAgICAgICAgICAgIGZvciBzYW1lIGZpZWxkTmFtZSwgdXNlIGdldFF1ZXJ5RmllbGRWYWx1ZXNBc0xpc3QoZmllbGROYW1lKSB0byBnZXQgaXRcbiAgICAgICAgICAgICAgIGluIGFycmF5IGZvcm0uICovXG4gICAgICAgICAgICBnZXRVcmxQYXJhbXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0ge307XG4gICAgICAgICAgICAgICAgdmFyIHBhcnRzID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5yZXBsYWNlKC9bPyZdKyhbXj0mXSspPShbXiZdKikvZ2ksIGZ1bmN0aW9uIChtLCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtc1tkZWNvZGVVUklDb21wb25lbnQoa2V5KV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNJZnJhbWVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIHZhciB1cmxQYXJ0cyA9IHBhdGhuYW1lLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybFBhcnRzWzFdID09PSAnZW1iZWQnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFBhdGhuYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkucGF0aG5hbWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVG9waWMgaWQgc2hvdWxkIGJlIGNvcnJlY3RseSByZXR1cm5lZCBmcm9tIHRvcGljIGVkaXRvciBhcyB3ZWxsIGFzXG4gICAgICAgICAgICAvLyBzdG9yeSBlZGl0b3IsIHNpbmNlIGJvdGggaGF2ZSB0b3BpYyBpZCBpbiB0aGVpciB1cmwuXG4gICAgICAgICAgICBnZXRUb3BpY0lkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcLyhzdG9yeXx0b3BpYylfZWRpdG9yXFwvKFxcd3wtKXsxMn0vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhuYW1lLnNwbGl0KCcvJylbMl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHRvcGljIGlkIHVybCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFRvcGljTmFtZUZyb21MZWFybmVyVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvKHN0b3J5fHRvcGljfHByYWN0aWNlX3Nlc3Npb24pL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUuc3BsaXQoJy8nKVsyXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFVSTCBmb3IgdG9waWMnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdG9yeUlkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcL3N0b3J5X2VkaXRvcihcXC8oXFx3fC0pezEyfSl7Mn0vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhuYW1lLnNwbGl0KCcvJylbM107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHN0b3J5IGlkIHVybCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0b3J5SWRJblBsYXllcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBxdWVyeSA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXJ5Lm1hdGNoKC9cXD9zdG9yeV9pZD0oKFxcd3wtKXsxMn0pL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVyeS5zcGxpdCgnPScpWzFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTa2lsbElkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2tpbGxJZCA9IHBhdGhuYW1lLnNwbGl0KCcvJylbMl07XG4gICAgICAgICAgICAgICAgaWYgKHNraWxsSWQubGVuZ3RoICE9PSAxMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTa2lsbCBJZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc2tpbGxJZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRRdWVyeUZpZWxkVmFsdWVzQXNMaXN0OiBmdW5jdGlvbiAoZmllbGROYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkVmFsdWVzID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuaW5kZXhPZignPycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRWFjaCBxdWVyeUl0ZW0gcmV0dXJuIG9uZSBmaWVsZC12YWx1ZSBwYWlyIGluIHRoZSB1cmwuXG4gICAgICAgICAgICAgICAgICAgIHZhciBxdWVyeUl0ZW1zID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5zbGljZSh0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLmluZGV4T2YoJz8nKSArIDEpLnNwbGl0KCcmJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVlcnlJdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGaWVsZE5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlJdGVtc1tpXS5zcGxpdCgnPScpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50RmllbGRWYWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudChxdWVyeUl0ZW1zW2ldLnNwbGl0KCc9JylbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRGaWVsZE5hbWUgPT09IGZpZWxkTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWVzLnB1c2goY3VycmVudEZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFZhbHVlcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZGRGaWVsZDogZnVuY3Rpb24gKHVybCwgZmllbGROYW1lLCBmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVuY29kZWRGaWVsZFZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIHZhciBlbmNvZGVkRmllbGROYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybCArICh1cmwuaW5kZXhPZignPycpICE9PSAtMSA/ICcmJyA6ICc/JykgKyBlbmNvZGVkRmllbGROYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJz0nICsgZW5jb2RlZEZpZWxkVmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0SGFzaDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLmhhc2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBjb21wdXRpbmcgdGhlIHdpbmRvdyBkaW1lbnNpb25zLlxuICovXG5vcHBpYS5mYWN0b3J5KCdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsIFsnJHdpbmRvdycsIGZ1bmN0aW9uICgkd2luZG93KSB7XG4gICAgICAgIHZhciBvblJlc2l6ZUhvb2tzID0gW107XG4gICAgICAgIGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KS5iaW5kKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBvblJlc2l6ZUhvb2tzLmZvckVhY2goZnVuY3Rpb24gKGhvb2tGbikge1xuICAgICAgICAgICAgICAgIGhvb2tGbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0V2lkdGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCR3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggfHxcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPblJlc2l6ZUhvb2s6IGZ1bmN0aW9uIChob29rRm4pIHtcbiAgICAgICAgICAgICAgICBvblJlc2l6ZUhvb2tzLnB1c2goaG9va0ZuKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc1dpbmRvd05hcnJvdzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBOT1JNQUxfTkFWQkFSX0NVVE9GRl9XSURUSF9QWCA9IDc2ODtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRXaWR0aCgpIDw9IE5PUk1BTF9OQVZCQVJfQ1VUT0ZGX1dJRFRIX1BYO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=