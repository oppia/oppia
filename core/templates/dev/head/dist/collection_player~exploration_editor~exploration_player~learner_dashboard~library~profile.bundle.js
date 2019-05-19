(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_player~exploration_editor~exploration_player~learner_dashboard~library~profile"],{

/***/ "./core/templates/dev/head/components/profile-link-directives/circular-image/circular-image.directive.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/profile-link-directives/circular-image/circular-image.directive.ts ***!
  \***************************************************************************************************************/
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
 * @fileoverview Displays circled images with linking (when available).
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('circularImageModule').directive('circularImage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                src: '&',
                link: '&?'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/profile-link-directives/circular-image/' +
                'circular-image.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () {
                    var ctrl = this;
                    ctrl.isLinkAvailable = function () {
                        return ctrl.link() ? true : false;
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.directive.ts":
/*!***********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.directive.ts ***!
  \***********************************************************************************************************************************/
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
 * @fileoverview Component for an exploration summary tile.
 */
__webpack_require__(/*! components/profile-link-directives/circular-image/circular-image.directive.ts */ "./core/templates/dev/head/components/profile-link-directives/circular-image/circular-image.directive.ts");
__webpack_require__(/*! domain/learner_dashboard/LearnerDashboardIconsDirective.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIconsDirective.ts");
__webpack_require__(/*! filters/summarize-nonnegative-number.filter.ts */ "./core/templates/dev/head/filters/summarize-nonnegative-number.filter.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate-and-capitalize.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate-and-capitalize.filter.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
__webpack_require__(/*! components/ratings/rating-computation/rating-computation.service.ts */ "./core/templates/dev/head/components/ratings/rating-computation/rating-computation.service.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('explorationSummaryTileModule').directive('explorationSummaryTile', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getCollectionId: '&collectionId',
                getExplorationId: '&explorationId',
                getExplorationTitle: '&explorationTitle',
                getLastUpdatedMsec: '&lastUpdatedMsec',
                getNumViews: '&numViews',
                getObjective: '&objective',
                getCategory: '&category',
                getRatings: '&ratings',
                getContributorsSummary: '&contributorsSummary',
                getThumbnailIconUrl: '&thumbnailIconUrl',
                getThumbnailBgColor: '&thumbnailBgColor',
                // If this is not null, the new exploration opens in a new window when
                // the summary tile is clicked.
                openInNewWindow: '@openInNewWindow',
                isCommunityOwned: '&isCommunityOwned',
                // If this is not undefined, collection preview tile for mobile
                // will be displayed.
                isCollectionPreviewTile: '@isCollectionPreviewTile',
                // If the screen width is below the threshold defined here, the mobile
                // version of the summary tile is displayed. This attribute is
                // optional: if it is not specified, it is treated as 0, which means
                // that the desktop version of the summary tile is always displayed.
                mobileCutoffPx: '@mobileCutoffPx',
                isPlaylistTile: '&isPlaylistTile',
                getParentExplorationIds: '&parentExplorationIds',
                showLearnerDashboardIconsIfPossible: ('&showLearnerDashboardIconsIfPossible'),
                isContainerNarrow: '&containerIsNarrow',
                isOwnedByCurrentUser: '&activityIsOwnedByCurrentUser',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/summary-tile-directives/exploration-summary-tile/' +
                'exploration-summary-tile.directive.html'),
            link: function (scope, element) {
                element.find('.exploration-summary-avatars').on('mouseenter', function () {
                    element.find('.mask').attr('class', 'exploration-summary-tile-mask mask');
                    // As animation duration time may be 400ms, .stop(true) is used to
                    // prevent the effects queue falling behind the mouse movement.
                    // .hide(1) and .show(1) used to place the animation in the
                    // effects queue.
                    element.find('.avatars-num-minus-one').stop(true).hide(1, function () {
                        element.find('.all-avatars').stop(true).slideDown();
                    });
                });
                element.find('.exploration-summary-avatars').on('mouseleave', function () {
                    element.find('.mask').attr('class', 'top-section-mask mask');
                    element.find('.all-avatars').stop(true).slideUp(400, function () {
                        element.find('.avatars-num-minus-one').stop(true).show(1);
                    });
                });
            },
            controller: [
                '$scope', '$http', '$window', 'DateTimeFormatService',
                'RatingComputationService', 'UrlService', 'UserService',
                'WindowDimensionsService',
                function ($scope, $http, $window, DateTimeFormatService, RatingComputationService, UrlService, UserService, WindowDimensionsService) {
                    $scope.userIsLoggedIn = null;
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        $scope.userIsLoggedIn = userInfo.isLoggedIn();
                    });
                    $scope.ACTIVITY_TYPE_EXPLORATION = (constants.ACTIVITY_TYPE_EXPLORATION);
                    var contributorsSummary = $scope.getContributorsSummary() || {};
                    $scope.contributors = Object.keys(contributorsSummary).sort(function (contributorUsername1, contributorUsername2) {
                        var commitsOfContributor1 = contributorsSummary[contributorUsername1].num_commits;
                        var commitsOfContributor2 = contributorsSummary[contributorUsername2].num_commits;
                        return commitsOfContributor2 - commitsOfContributor1;
                    });
                    $scope.isRefresherExploration = false;
                    if ($scope.getParentExplorationIds()) {
                        $scope.isRefresherExploration = ($scope.getParentExplorationIds().length > 0);
                    }
                    $scope.avatarsList = [];
                    $scope.MAX_AVATARS_TO_DISPLAY = 5;
                    $scope.setHoverState = function (hoverState) {
                        $scope.explorationIsCurrentlyHoveredOver = hoverState;
                    };
                    $scope.loadParentExploration = function () {
                        $window.location.href = $scope.getExplorationLink();
                    };
                    $scope.getAverageRating = function () {
                        if (!$scope.getRatings()) {
                            return null;
                        }
                        return RatingComputationService.computeAverageRating($scope.getRatings());
                    };
                    $scope.getLastUpdatedDatetime = function () {
                        if (!$scope.getLastUpdatedMsec()) {
                            return null;
                        }
                        return DateTimeFormatService.getLocaleAbbreviatedDatetimeString($scope.getLastUpdatedMsec());
                    };
                    $scope.getExplorationLink = function () {
                        if (!$scope.getExplorationId()) {
                            return '#';
                        }
                        else {
                            var result = '/explore/' + $scope.getExplorationId();
                            var urlParams = UrlService.getUrlParams();
                            var parentExplorationIds = $scope.getParentExplorationIds();
                            var collectionIdToAdd = $scope.getCollectionId();
                            // Replace the collection ID with the one in the URL if it
                            // exists in urlParams.
                            if (parentExplorationIds &&
                                urlParams.hasOwnProperty('collection_id')) {
                                collectionIdToAdd = urlParams.collection_id;
                            }
                            if (collectionIdToAdd) {
                                result = UrlService.addField(result, 'collection_id', collectionIdToAdd);
                            }
                            if (parentExplorationIds) {
                                for (var i = 0; i < parentExplorationIds.length - 1; i++) {
                                    result = UrlService.addField(result, 'parent', parentExplorationIds[i]);
                                }
                            }
                            return result;
                        }
                    };
                    if (!$scope.mobileCutoffPx) {
                        $scope.mobileCutoffPx = 0;
                    }
                    $scope.isWindowLarge = (WindowDimensionsService.getWidth() >= $scope.mobileCutoffPx);
                    WindowDimensionsService.registerOnResizeHook(function () {
                        $scope.isWindowLarge = (WindowDimensionsService.getWidth() >= $scope.mobileCutoffPx);
                        $scope.$apply();
                    });
                    $scope.getCompleteThumbnailIconUrl = function () {
                        return UrlInterpolationService.getStaticImageUrl($scope.getThumbnailIconUrl());
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/filters/summarize-nonnegative-number.filter.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/filters/summarize-nonnegative-number.filter.ts ***!
  \********************************************************************************/
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
 * @fileoverview SummarizeNonnegativeNumber filter for Oppia.
 */
// Filter that summarizes a large number to a decimal followed by
// the appropriate metric prefix (K, M or B). For example, 167656
// becomes 167.7K.
// Users of this filter should ensure that the input is a non-negative number.
angular.module('filtersModule').filter('summarizeNonnegativeNumber', [function () {
        return function (input) {
            input = Number(input);
            // Nine zeros for billions (e.g. 146008788788 --> 146.0B).
            // Six zeros for millions (e.g. 146008788 --> 146.0M).
            // Three zeros for thousands (e.g. 146008 --> 146.0K).
            // No change for small numbers (e.g. 12 --> 12).
            return (input >= 1.0e+9 ? (input / 1.0e+9).toFixed(1) + 'B' :
                input >= 1.0e+6 ? (input / 1.0e+6).toFixed(1) + 'M' :
                    input >= 1.0e+3 ? (input / 1.0e+3).toFixed(1) + 'K' :
                        input);
        };
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

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3Byb2ZpbGUtbGluay1kaXJlY3RpdmVzL2NpcmN1bGFyLWltYWdlL2NpcmN1bGFyLWltYWdlLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3N1bW1hcnktdGlsZS1kaXJlY3RpdmVzL2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS9leHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2ZpbHRlcnMvc3VtbWFyaXplLW5vbm5lZ2F0aXZlLW51bWJlci5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsOExBQ3lC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QUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDM0dMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyIsImZpbGUiOiJjb2xsZWN0aW9uX3BsYXllcn5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfmxlYXJuZXJfZGFzaGJvYXJkfmxpYnJhcnl+cHJvZmlsZS5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpc3BsYXlzIGNpcmNsZWQgaW1hZ2VzIHdpdGggbGlua2luZyAod2hlbiBhdmFpbGFibGUpLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnY2lyY3VsYXJJbWFnZU1vZHVsZScpLmRpcmVjdGl2ZSgnY2lyY3VsYXJJbWFnZScsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgc3JjOiAnJicsXG4gICAgICAgICAgICAgICAgbGluazogJyY/J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvcHJvZmlsZS1saW5rLWRpcmVjdGl2ZXMvY2lyY3VsYXItaW1hZ2UvJyArXG4gICAgICAgICAgICAgICAgJ2NpcmN1bGFyLWltYWdlLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNMaW5rQXZhaWxhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN0cmwubGluaygpID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbXBvbmVudCBmb3IgYW4gZXhwbG9yYXRpb24gc3VtbWFyeSB0aWxlLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL3Byb2ZpbGUtbGluay1kaXJlY3RpdmVzL2NpcmN1bGFyLWltYWdlLycgK1xuICAgICdjaXJjdWxhci1pbWFnZS5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9sZWFybmVyX2Rhc2hib2FyZC9MZWFybmVyRGFzaGJvYXJkSWNvbnNEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2ZpbHRlcnMvc3VtbWFyaXplLW5vbm5lZ2F0aXZlLW51bWJlci5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy90cnVuY2F0ZS1hbmQtY2FwaXRhbGl6ZS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy90cnVuY2F0ZS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvcmF0aW5ncy9yYXRpbmctY29tcHV0YXRpb24vcmF0aW5nLWNvbXB1dGF0aW9uLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0RhdGVUaW1lRm9ybWF0U2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXNlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9XaW5kb3dEaW1lbnNpb25zU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uU3VtbWFyeVRpbGVNb2R1bGUnKS5kaXJlY3RpdmUoJ2V4cGxvcmF0aW9uU3VtbWFyeVRpbGUnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBnZXRDb2xsZWN0aW9uSWQ6ICcmY29sbGVjdGlvbklkJyxcbiAgICAgICAgICAgICAgICBnZXRFeHBsb3JhdGlvbklkOiAnJmV4cGxvcmF0aW9uSWQnLFxuICAgICAgICAgICAgICAgIGdldEV4cGxvcmF0aW9uVGl0bGU6ICcmZXhwbG9yYXRpb25UaXRsZScsXG4gICAgICAgICAgICAgICAgZ2V0TGFzdFVwZGF0ZWRNc2VjOiAnJmxhc3RVcGRhdGVkTXNlYycsXG4gICAgICAgICAgICAgICAgZ2V0TnVtVmlld3M6ICcmbnVtVmlld3MnLFxuICAgICAgICAgICAgICAgIGdldE9iamVjdGl2ZTogJyZvYmplY3RpdmUnLFxuICAgICAgICAgICAgICAgIGdldENhdGVnb3J5OiAnJmNhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBnZXRSYXRpbmdzOiAnJnJhdGluZ3MnLFxuICAgICAgICAgICAgICAgIGdldENvbnRyaWJ1dG9yc1N1bW1hcnk6ICcmY29udHJpYnV0b3JzU3VtbWFyeScsXG4gICAgICAgICAgICAgICAgZ2V0VGh1bWJuYWlsSWNvblVybDogJyZ0aHVtYm5haWxJY29uVXJsJyxcbiAgICAgICAgICAgICAgICBnZXRUaHVtYm5haWxCZ0NvbG9yOiAnJnRodW1ibmFpbEJnQ29sb3InLFxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgbm90IG51bGwsIHRoZSBuZXcgZXhwbG9yYXRpb24gb3BlbnMgaW4gYSBuZXcgd2luZG93IHdoZW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgc3VtbWFyeSB0aWxlIGlzIGNsaWNrZWQuXG4gICAgICAgICAgICAgICAgb3BlbkluTmV3V2luZG93OiAnQG9wZW5Jbk5ld1dpbmRvdycsXG4gICAgICAgICAgICAgICAgaXNDb21tdW5pdHlPd25lZDogJyZpc0NvbW11bml0eU93bmVkJyxcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIG5vdCB1bmRlZmluZWQsIGNvbGxlY3Rpb24gcHJldmlldyB0aWxlIGZvciBtb2JpbGVcbiAgICAgICAgICAgICAgICAvLyB3aWxsIGJlIGRpc3BsYXllZC5cbiAgICAgICAgICAgICAgICBpc0NvbGxlY3Rpb25QcmV2aWV3VGlsZTogJ0Bpc0NvbGxlY3Rpb25QcmV2aWV3VGlsZScsXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHNjcmVlbiB3aWR0aCBpcyBiZWxvdyB0aGUgdGhyZXNob2xkIGRlZmluZWQgaGVyZSwgdGhlIG1vYmlsZVxuICAgICAgICAgICAgICAgIC8vIHZlcnNpb24gb2YgdGhlIHN1bW1hcnkgdGlsZSBpcyBkaXNwbGF5ZWQuIFRoaXMgYXR0cmlidXRlIGlzXG4gICAgICAgICAgICAgICAgLy8gb3B0aW9uYWw6IGlmIGl0IGlzIG5vdCBzcGVjaWZpZWQsIGl0IGlzIHRyZWF0ZWQgYXMgMCwgd2hpY2ggbWVhbnNcbiAgICAgICAgICAgICAgICAvLyB0aGF0IHRoZSBkZXNrdG9wIHZlcnNpb24gb2YgdGhlIHN1bW1hcnkgdGlsZSBpcyBhbHdheXMgZGlzcGxheWVkLlxuICAgICAgICAgICAgICAgIG1vYmlsZUN1dG9mZlB4OiAnQG1vYmlsZUN1dG9mZlB4JyxcbiAgICAgICAgICAgICAgICBpc1BsYXlsaXN0VGlsZTogJyZpc1BsYXlsaXN0VGlsZScsXG4gICAgICAgICAgICAgICAgZ2V0UGFyZW50RXhwbG9yYXRpb25JZHM6ICcmcGFyZW50RXhwbG9yYXRpb25JZHMnLFxuICAgICAgICAgICAgICAgIHNob3dMZWFybmVyRGFzaGJvYXJkSWNvbnNJZlBvc3NpYmxlOiAoJyZzaG93TGVhcm5lckRhc2hib2FyZEljb25zSWZQb3NzaWJsZScpLFxuICAgICAgICAgICAgICAgIGlzQ29udGFpbmVyTmFycm93OiAnJmNvbnRhaW5lcklzTmFycm93JyxcbiAgICAgICAgICAgICAgICBpc093bmVkQnlDdXJyZW50VXNlcjogJyZhY3Rpdml0eUlzT3duZWRCeUN1cnJlbnRVc2VyJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL3N1bW1hcnktdGlsZS1kaXJlY3RpdmVzL2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS8nICtcbiAgICAgICAgICAgICAgICAnZXhwbG9yYXRpb24tc3VtbWFyeS10aWxlLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LmZpbmQoJy5leHBsb3JhdGlvbi1zdW1tYXJ5LWF2YXRhcnMnKS5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcubWFzaycpLmF0dHIoJ2NsYXNzJywgJ2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS1tYXNrIG1hc2snKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXMgYW5pbWF0aW9uIGR1cmF0aW9uIHRpbWUgbWF5IGJlIDQwMG1zLCAuc3RvcCh0cnVlKSBpcyB1c2VkIHRvXG4gICAgICAgICAgICAgICAgICAgIC8vIHByZXZlbnQgdGhlIGVmZmVjdHMgcXVldWUgZmFsbGluZyBiZWhpbmQgdGhlIG1vdXNlIG1vdmVtZW50LlxuICAgICAgICAgICAgICAgICAgICAvLyAuaGlkZSgxKSBhbmQgLnNob3coMSkgdXNlZCB0byBwbGFjZSB0aGUgYW5pbWF0aW9uIGluIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBlZmZlY3RzIHF1ZXVlLlxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmZpbmQoJy5hdmF0YXJzLW51bS1taW51cy1vbmUnKS5zdG9wKHRydWUpLmhpZGUoMSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcuYWxsLWF2YXRhcnMnKS5zdG9wKHRydWUpLnNsaWRlRG93bigpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LmZpbmQoJy5leHBsb3JhdGlvbi1zdW1tYXJ5LWF2YXRhcnMnKS5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcubWFzaycpLmF0dHIoJ2NsYXNzJywgJ3RvcC1zZWN0aW9uLW1hc2sgbWFzaycpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmZpbmQoJy5hbGwtYXZhdGFycycpLnN0b3AodHJ1ZSkuc2xpZGVVcCg0MDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZmluZCgnLmF2YXRhcnMtbnVtLW1pbnVzLW9uZScpLnN0b3AodHJ1ZSkuc2hvdygxKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJGh0dHAnLCAnJHdpbmRvdycsICdEYXRlVGltZUZvcm1hdFNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdSYXRpbmdDb21wdXRhdGlvblNlcnZpY2UnLCAnVXJsU2VydmljZScsICdVc2VyU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgJHdpbmRvdywgRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLCBSYXRpbmdDb21wdXRhdGlvblNlcnZpY2UsIFVybFNlcnZpY2UsIFVzZXJTZXJ2aWNlLCBXaW5kb3dEaW1lbnNpb25zU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXNlcklzTG9nZ2VkSW4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCkudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS51c2VySXNMb2dnZWRJbiA9IHVzZXJJbmZvLmlzTG9nZ2VkSW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5BQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OID0gKGNvbnN0YW50cy5BQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRyaWJ1dG9yc1N1bW1hcnkgPSAkc2NvcGUuZ2V0Q29udHJpYnV0b3JzU3VtbWFyeSgpIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29udHJpYnV0b3JzID0gT2JqZWN0LmtleXMoY29udHJpYnV0b3JzU3VtbWFyeSkuc29ydChmdW5jdGlvbiAoY29udHJpYnV0b3JVc2VybmFtZTEsIGNvbnRyaWJ1dG9yVXNlcm5hbWUyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29tbWl0c09mQ29udHJpYnV0b3IxID0gY29udHJpYnV0b3JzU3VtbWFyeVtjb250cmlidXRvclVzZXJuYW1lMV0ubnVtX2NvbW1pdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29tbWl0c09mQ29udHJpYnV0b3IyID0gY29udHJpYnV0b3JzU3VtbWFyeVtjb250cmlidXRvclVzZXJuYW1lMl0ubnVtX2NvbW1pdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tbWl0c09mQ29udHJpYnV0b3IyIC0gY29tbWl0c09mQ29udHJpYnV0b3IxO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzUmVmcmVzaGVyRXhwbG9yYXRpb24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5nZXRQYXJlbnRFeHBsb3JhdGlvbklkcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNSZWZyZXNoZXJFeHBsb3JhdGlvbiA9ICgkc2NvcGUuZ2V0UGFyZW50RXhwbG9yYXRpb25JZHMoKS5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYXZhdGFyc0xpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLk1BWF9BVkFUQVJTX1RPX0RJU1BMQVkgPSA1O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0SG92ZXJTdGF0ZSA9IGZ1bmN0aW9uIChob3ZlclN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25Jc0N1cnJlbnRseUhvdmVyZWRPdmVyID0gaG92ZXJTdGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvYWRQYXJlbnRFeHBsb3JhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24uaHJlZiA9ICRzY29wZS5nZXRFeHBsb3JhdGlvbkxpbmsoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldEF2ZXJhZ2VSYXRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5nZXRSYXRpbmdzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBSYXRpbmdDb21wdXRhdGlvblNlcnZpY2UuY29tcHV0ZUF2ZXJhZ2VSYXRpbmcoJHNjb3BlLmdldFJhdGluZ3MoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRMYXN0VXBkYXRlZERhdGV0aW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuZ2V0TGFzdFVwZGF0ZWRNc2VjKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBEYXRlVGltZUZvcm1hdFNlcnZpY2UuZ2V0TG9jYWxlQWJicmV2aWF0ZWREYXRldGltZVN0cmluZygkc2NvcGUuZ2V0TGFzdFVwZGF0ZWRNc2VjKCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0RXhwbG9yYXRpb25MaW5rID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuZ2V0RXhwbG9yYXRpb25JZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcjJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSAnL2V4cGxvcmUvJyArICRzY29wZS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVybFBhcmFtcyA9IFVybFNlcnZpY2UuZ2V0VXJsUGFyYW1zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudEV4cGxvcmF0aW9uSWRzID0gJHNjb3BlLmdldFBhcmVudEV4cGxvcmF0aW9uSWRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25JZFRvQWRkID0gJHNjb3BlLmdldENvbGxlY3Rpb25JZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIGNvbGxlY3Rpb24gSUQgd2l0aCB0aGUgb25lIGluIHRoZSBVUkwgaWYgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBleGlzdHMgaW4gdXJsUGFyYW1zLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnRFeHBsb3JhdGlvbklkcyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmxQYXJhbXMuaGFzT3duUHJvcGVydHkoJ2NvbGxlY3Rpb25faWQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uSWRUb0FkZCA9IHVybFBhcmFtcy5jb2xsZWN0aW9uX2lkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sbGVjdGlvbklkVG9BZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gVXJsU2VydmljZS5hZGRGaWVsZChyZXN1bHQsICdjb2xsZWN0aW9uX2lkJywgY29sbGVjdGlvbklkVG9BZGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50RXhwbG9yYXRpb25JZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJlbnRFeHBsb3JhdGlvbklkcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IFVybFNlcnZpY2UuYWRkRmllbGQocmVzdWx0LCAncGFyZW50JywgcGFyZW50RXhwbG9yYXRpb25JZHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLm1vYmlsZUN1dG9mZlB4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubW9iaWxlQ3V0b2ZmUHggPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1dpbmRvd0xhcmdlID0gKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCkgPj0gJHNjb3BlLm1vYmlsZUN1dG9mZlB4KTtcbiAgICAgICAgICAgICAgICAgICAgV2luZG93RGltZW5zaW9uc1NlcnZpY2UucmVnaXN0ZXJPblJlc2l6ZUhvb2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzV2luZG93TGFyZ2UgPSAoV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKSA+PSAkc2NvcGUubW9iaWxlQ3V0b2ZmUHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldENvbXBsZXRlVGh1bWJuYWlsSWNvblVybCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgkc2NvcGUuZ2V0VGh1bWJuYWlsSWNvblVybCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFN1bW1hcml6ZU5vbm5lZ2F0aXZlTnVtYmVyIGZpbHRlciBmb3IgT3BwaWEuXG4gKi9cbi8vIEZpbHRlciB0aGF0IHN1bW1hcml6ZXMgYSBsYXJnZSBudW1iZXIgdG8gYSBkZWNpbWFsIGZvbGxvd2VkIGJ5XG4vLyB0aGUgYXBwcm9wcmlhdGUgbWV0cmljIHByZWZpeCAoSywgTSBvciBCKS4gRm9yIGV4YW1wbGUsIDE2NzY1NlxuLy8gYmVjb21lcyAxNjcuN0suXG4vLyBVc2VycyBvZiB0aGlzIGZpbHRlciBzaG91bGQgZW5zdXJlIHRoYXQgdGhlIGlucHV0IGlzIGEgbm9uLW5lZ2F0aXZlIG51bWJlci5cbmFuZ3VsYXIubW9kdWxlKCdmaWx0ZXJzTW9kdWxlJykuZmlsdGVyKCdzdW1tYXJpemVOb25uZWdhdGl2ZU51bWJlcicsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIGlucHV0ID0gTnVtYmVyKGlucHV0KTtcbiAgICAgICAgICAgIC8vIE5pbmUgemVyb3MgZm9yIGJpbGxpb25zIChlLmcuIDE0NjAwODc4ODc4OCAtLT4gMTQ2LjBCKS5cbiAgICAgICAgICAgIC8vIFNpeCB6ZXJvcyBmb3IgbWlsbGlvbnMgKGUuZy4gMTQ2MDA4Nzg4IC0tPiAxNDYuME0pLlxuICAgICAgICAgICAgLy8gVGhyZWUgemVyb3MgZm9yIHRob3VzYW5kcyAoZS5nLiAxNDYwMDggLS0+IDE0Ni4wSykuXG4gICAgICAgICAgICAvLyBObyBjaGFuZ2UgZm9yIHNtYWxsIG51bWJlcnMgKGUuZy4gMTIgLS0+IDEyKS5cbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQgPj0gMS4wZSs5ID8gKGlucHV0IC8gMS4wZSs5KS50b0ZpeGVkKDEpICsgJ0InIDpcbiAgICAgICAgICAgICAgICBpbnB1dCA+PSAxLjBlKzYgPyAoaW5wdXQgLyAxLjBlKzYpLnRvRml4ZWQoMSkgKyAnTScgOlxuICAgICAgICAgICAgICAgICAgICBpbnB1dCA+PSAxLjBlKzMgPyAoaW5wdXQgLyAxLjBlKzMpLnRvRml4ZWQoMSkgKyAnSycgOlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQpO1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBtYW5pcHVsYXRpbmcgdGhlIHBhZ2UgVVJMLiBBbHNvIGFsbG93c1xuICogZnVuY3Rpb25zIG9uICR3aW5kb3cgdG8gYmUgbW9ja2VkIGluIHVuaXQgdGVzdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1VybFNlcnZpY2UnLCBbJyR3aW5kb3cnLCBmdW5jdGlvbiAoJHdpbmRvdykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBmb3IgdGVzdGluZyBwdXJwb3NlcyAodG8gbW9jayAkd2luZG93LmxvY2F0aW9uKVxuICAgICAgICAgICAgZ2V0Q3VycmVudExvY2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICR3aW5kb3cubG9jYXRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkuc2VhcmNoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qIEFzIHBhcmFtc1trZXldIGlzIG92ZXJ3cml0dGVuLCBpZiBxdWVyeSBzdHJpbmcgaGFzIG11bHRpcGxlIGZpZWxkVmFsdWVzXG4gICAgICAgICAgICAgICBmb3Igc2FtZSBmaWVsZE5hbWUsIHVzZSBnZXRRdWVyeUZpZWxkVmFsdWVzQXNMaXN0KGZpZWxkTmFtZSkgdG8gZ2V0IGl0XG4gICAgICAgICAgICAgICBpbiBhcnJheSBmb3JtLiAqL1xuICAgICAgICAgICAgZ2V0VXJsUGFyYW1zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0cyA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkucmVwbGFjZSgvWz8mXSsoW149Jl0rKT0oW14mXSopL2dpLCBmdW5jdGlvbiAobSwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXNbZGVjb2RlVVJJQ29tcG9uZW50KGtleSldID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSWZyYW1lZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICB2YXIgdXJsUGFydHMgPSBwYXRobmFtZS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmxQYXJ0c1sxXSA9PT0gJ2VtYmVkJztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRQYXRobmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLnBhdGhuYW1lO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRvcGljIGlkIHNob3VsZCBiZSBjb3JyZWN0bHkgcmV0dXJuZWQgZnJvbSB0b3BpYyBlZGl0b3IgYXMgd2VsbCBhc1xuICAgICAgICAgICAgLy8gc3RvcnkgZWRpdG9yLCBzaW5jZSBib3RoIGhhdmUgdG9waWMgaWQgaW4gdGhlaXIgdXJsLlxuICAgICAgICAgICAgZ2V0VG9waWNJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC8oc3Rvcnl8dG9waWMpX2VkaXRvclxcLyhcXHd8LSl7MTJ9L2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZS5zcGxpdCgnLycpWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCB0b3BpYyBpZCB1cmwnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRUb3BpY05hbWVGcm9tTGVhcm5lclVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcLyhzdG9yeXx0b3BpY3xwcmFjdGljZV9zZXNzaW9uKS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lLnNwbGl0KCcvJylbMl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBVUkwgZm9yIHRvcGljJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RvcnlJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC9zdG9yeV9lZGl0b3IoXFwvKFxcd3wtKXsxMn0pezJ9L2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZS5zcGxpdCgnLycpWzNdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBzdG9yeSBpZCB1cmwnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdG9yeUlkSW5QbGF5ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcXVlcnkgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpO1xuICAgICAgICAgICAgICAgIGlmIChxdWVyeS5tYXRjaCgvXFw/c3RvcnlfaWQ9KChcXHd8LSl7MTJ9KS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcXVlcnkuc3BsaXQoJz0nKVsxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U2tpbGxJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgdmFyIHNraWxsSWQgPSBwYXRobmFtZS5zcGxpdCgnLycpWzJdO1xuICAgICAgICAgICAgICAgIGlmIChza2lsbElkLmxlbmd0aCAhPT0gMTIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU2tpbGwgSWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNraWxsSWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UXVlcnlGaWVsZFZhbHVlc0FzTGlzdDogZnVuY3Rpb24gKGZpZWxkTmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBmaWVsZFZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLmluZGV4T2YoJz8nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVhY2ggcXVlcnlJdGVtIHJldHVybiBvbmUgZmllbGQtdmFsdWUgcGFpciBpbiB0aGUgdXJsLlxuICAgICAgICAgICAgICAgICAgICB2YXIgcXVlcnlJdGVtcyA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuc2xpY2UodGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5pbmRleE9mKCc/JykgKyAxKS5zcGxpdCgnJicpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXJ5SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50RmllbGROYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5SXRlbXNbaV0uc3BsaXQoJz0nKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZpZWxkVmFsdWUgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlJdGVtc1tpXS5zcGxpdCgnPScpWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RmllbGROYW1lID09PSBmaWVsZE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlcy5wdXNoKGN1cnJlbnRGaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRWYWx1ZXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWRkRmllbGQ6IGZ1bmN0aW9uICh1cmwsIGZpZWxkTmFtZSwgZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBlbmNvZGVkRmllbGRWYWx1ZSA9IGVuY29kZVVSSUNvbXBvbmVudChmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5jb2RlZEZpZWxkTmFtZSA9IGVuY29kZVVSSUNvbXBvbmVudChmaWVsZE5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmwgKyAodXJsLmluZGV4T2YoJz8nKSAhPT0gLTEgPyAnJicgOiAnPycpICsgZW5jb2RlZEZpZWxkTmFtZSArXG4gICAgICAgICAgICAgICAgICAgICc9JyArIGVuY29kZWRGaWVsZFZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEhhc2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5oYXNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgY29tcHV0aW5nIHRoZSB3aW5kb3cgZGltZW5zaW9ucy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnV2luZG93RGltZW5zaW9uc1NlcnZpY2UnLCBbJyR3aW5kb3cnLCBmdW5jdGlvbiAoJHdpbmRvdykge1xuICAgICAgICB2YXIgb25SZXNpemVIb29rcyA9IFtdO1xuICAgICAgICBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdykuYmluZCgncmVzaXplJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgb25SZXNpemVIb29rcy5mb3JFYWNoKGZ1bmN0aW9uIChob29rRm4pIHtcbiAgICAgICAgICAgICAgICBob29rRm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldFdpZHRoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgkd2luZG93LmlubmVyV2lkdGggfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIHx8XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT25SZXNpemVIb29rOiBmdW5jdGlvbiAoaG9va0ZuKSB7XG4gICAgICAgICAgICAgICAgb25SZXNpemVIb29rcy5wdXNoKGhvb2tGbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNXaW5kb3dOYXJyb3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgTk9STUFMX05BVkJBUl9DVVRPRkZfV0lEVEhfUFggPSA3Njg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0V2lkdGgoKSA8PSBOT1JNQUxfTkFWQkFSX0NVVE9GRl9XSURUSF9QWDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9