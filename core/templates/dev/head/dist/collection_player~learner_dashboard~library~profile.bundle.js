(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_player~learner_dashboard~library~profile"],{

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3Byb2ZpbGUtbGluay1kaXJlY3RpdmVzL2NpcmN1bGFyLWltYWdlL2NpcmN1bGFyLWltYWdlLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3N1bW1hcnktdGlsZS1kaXJlY3RpdmVzL2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS9leHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2ZpbHRlcnMvc3VtbWFyaXplLW5vbm5lZ2F0aXZlLW51bWJlci5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvY29udGV4dHVhbC9XaW5kb3dEaW1lbnNpb25zU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyw4TEFDeUI7QUFDakMsbUJBQU8sQ0FBQyx3SkFBNEQ7QUFDcEUsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQsbUJBQU8sQ0FBQyxvS0FBa0U7QUFDMUUsbUJBQU8sQ0FBQyxzSUFBbUQ7QUFDM0QsbUJBQU8sQ0FBQywwS0FBcUU7QUFDN0UsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0MsbUJBQU8sQ0FBQyxrRkFBeUI7QUFDakMsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0MsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQ0FBK0MscUNBQXFDO0FBQ3BGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyIsImZpbGUiOiJjb2xsZWN0aW9uX3BsYXllcn5sZWFybmVyX2Rhc2hib2FyZH5saWJyYXJ5fnByb2ZpbGUuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXNwbGF5cyBjaXJjbGVkIGltYWdlcyB3aXRoIGxpbmtpbmcgKHdoZW4gYXZhaWxhYmxlKS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2NpcmN1bGFySW1hZ2VNb2R1bGUnKS5kaXJlY3RpdmUoJ2NpcmN1bGFySW1hZ2UnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIHNyYzogJyYnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcmPydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL3Byb2ZpbGUtbGluay1kaXJlY3RpdmVzL2NpcmN1bGFyLWltYWdlLycgK1xuICAgICAgICAgICAgICAgICdjaXJjdWxhci1pbWFnZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzTGlua0F2YWlsYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHJsLmxpbmsoKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb21wb25lbnQgZm9yIGFuIGV4cGxvcmF0aW9uIHN1bW1hcnkgdGlsZS5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9wcm9maWxlLWxpbmstZGlyZWN0aXZlcy9jaXJjdWxhci1pbWFnZS8nICtcbiAgICAnY2lyY3VsYXItaW1hZ2UuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lckRhc2hib2FyZEljb25zRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N1bW1hcml6ZS1ub25uZWdhdGl2ZS1udW1iZXIuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdHJ1bmNhdGUtYW5kLWNhcGl0YWxpemUuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdHJ1bmNhdGUuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3JhdGluZ3MvcmF0aW5nLWNvbXB1dGF0aW9uL3JhdGluZy1jb21wdXRhdGlvbi5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9EYXRlVGltZUZvcm1hdFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1VzZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvblN1bW1hcnlUaWxlTW9kdWxlJykuZGlyZWN0aXZlKCdleHBsb3JhdGlvblN1bW1hcnlUaWxlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgZ2V0Q29sbGVjdGlvbklkOiAnJmNvbGxlY3Rpb25JZCcsXG4gICAgICAgICAgICAgICAgZ2V0RXhwbG9yYXRpb25JZDogJyZleHBsb3JhdGlvbklkJyxcbiAgICAgICAgICAgICAgICBnZXRFeHBsb3JhdGlvblRpdGxlOiAnJmV4cGxvcmF0aW9uVGl0bGUnLFxuICAgICAgICAgICAgICAgIGdldExhc3RVcGRhdGVkTXNlYzogJyZsYXN0VXBkYXRlZE1zZWMnLFxuICAgICAgICAgICAgICAgIGdldE51bVZpZXdzOiAnJm51bVZpZXdzJyxcbiAgICAgICAgICAgICAgICBnZXRPYmplY3RpdmU6ICcmb2JqZWN0aXZlJyxcbiAgICAgICAgICAgICAgICBnZXRDYXRlZ29yeTogJyZjYXRlZ29yeScsXG4gICAgICAgICAgICAgICAgZ2V0UmF0aW5nczogJyZyYXRpbmdzJyxcbiAgICAgICAgICAgICAgICBnZXRDb250cmlidXRvcnNTdW1tYXJ5OiAnJmNvbnRyaWJ1dG9yc1N1bW1hcnknLFxuICAgICAgICAgICAgICAgIGdldFRodW1ibmFpbEljb25Vcmw6ICcmdGh1bWJuYWlsSWNvblVybCcsXG4gICAgICAgICAgICAgICAgZ2V0VGh1bWJuYWlsQmdDb2xvcjogJyZ0aHVtYm5haWxCZ0NvbG9yJyxcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIG5vdCBudWxsLCB0aGUgbmV3IGV4cGxvcmF0aW9uIG9wZW5zIGluIGEgbmV3IHdpbmRvdyB3aGVuXG4gICAgICAgICAgICAgICAgLy8gdGhlIHN1bW1hcnkgdGlsZSBpcyBjbGlja2VkLlxuICAgICAgICAgICAgICAgIG9wZW5Jbk5ld1dpbmRvdzogJ0BvcGVuSW5OZXdXaW5kb3cnLFxuICAgICAgICAgICAgICAgIGlzQ29tbXVuaXR5T3duZWQ6ICcmaXNDb21tdW5pdHlPd25lZCcsXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBub3QgdW5kZWZpbmVkLCBjb2xsZWN0aW9uIHByZXZpZXcgdGlsZSBmb3IgbW9iaWxlXG4gICAgICAgICAgICAgICAgLy8gd2lsbCBiZSBkaXNwbGF5ZWQuXG4gICAgICAgICAgICAgICAgaXNDb2xsZWN0aW9uUHJldmlld1RpbGU6ICdAaXNDb2xsZWN0aW9uUHJldmlld1RpbGUnLFxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBzY3JlZW4gd2lkdGggaXMgYmVsb3cgdGhlIHRocmVzaG9sZCBkZWZpbmVkIGhlcmUsIHRoZSBtb2JpbGVcbiAgICAgICAgICAgICAgICAvLyB2ZXJzaW9uIG9mIHRoZSBzdW1tYXJ5IHRpbGUgaXMgZGlzcGxheWVkLiBUaGlzIGF0dHJpYnV0ZSBpc1xuICAgICAgICAgICAgICAgIC8vIG9wdGlvbmFsOiBpZiBpdCBpcyBub3Qgc3BlY2lmaWVkLCBpdCBpcyB0cmVhdGVkIGFzIDAsIHdoaWNoIG1lYW5zXG4gICAgICAgICAgICAgICAgLy8gdGhhdCB0aGUgZGVza3RvcCB2ZXJzaW9uIG9mIHRoZSBzdW1tYXJ5IHRpbGUgaXMgYWx3YXlzIGRpc3BsYXllZC5cbiAgICAgICAgICAgICAgICBtb2JpbGVDdXRvZmZQeDogJ0Btb2JpbGVDdXRvZmZQeCcsXG4gICAgICAgICAgICAgICAgaXNQbGF5bGlzdFRpbGU6ICcmaXNQbGF5bGlzdFRpbGUnLFxuICAgICAgICAgICAgICAgIGdldFBhcmVudEV4cGxvcmF0aW9uSWRzOiAnJnBhcmVudEV4cGxvcmF0aW9uSWRzJyxcbiAgICAgICAgICAgICAgICBzaG93TGVhcm5lckRhc2hib2FyZEljb25zSWZQb3NzaWJsZTogKCcmc2hvd0xlYXJuZXJEYXNoYm9hcmRJY29uc0lmUG9zc2libGUnKSxcbiAgICAgICAgICAgICAgICBpc0NvbnRhaW5lck5hcnJvdzogJyZjb250YWluZXJJc05hcnJvdycsXG4gICAgICAgICAgICAgICAgaXNPd25lZEJ5Q3VycmVudFVzZXI6ICcmYWN0aXZpdHlJc093bmVkQnlDdXJyZW50VXNlcicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUtZGlyZWN0aXZlcy9leHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUvJyArXG4gICAgICAgICAgICAgICAgJ2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcuZXhwbG9yYXRpb24tc3VtbWFyeS1hdmF0YXJzJykub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZmluZCgnLm1hc2snKS5hdHRyKCdjbGFzcycsICdleHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUtbWFzayBtYXNrJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFzIGFuaW1hdGlvbiBkdXJhdGlvbiB0aW1lIG1heSBiZSA0MDBtcywgLnN0b3AodHJ1ZSkgaXMgdXNlZCB0b1xuICAgICAgICAgICAgICAgICAgICAvLyBwcmV2ZW50IHRoZSBlZmZlY3RzIHF1ZXVlIGZhbGxpbmcgYmVoaW5kIHRoZSBtb3VzZSBtb3ZlbWVudC5cbiAgICAgICAgICAgICAgICAgICAgLy8gLmhpZGUoMSkgYW5kIC5zaG93KDEpIHVzZWQgdG8gcGxhY2UgdGhlIGFuaW1hdGlvbiBpbiB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gZWZmZWN0cyBxdWV1ZS5cbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcuYXZhdGFycy1udW0tbWludXMtb25lJykuc3RvcCh0cnVlKS5oaWRlKDEsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZmluZCgnLmFsbC1hdmF0YXJzJykuc3RvcCh0cnVlKS5zbGlkZURvd24oKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcuZXhwbG9yYXRpb24tc3VtbWFyeS1hdmF0YXJzJykub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZmluZCgnLm1hc2snKS5hdHRyKCdjbGFzcycsICd0b3Atc2VjdGlvbi1tYXNrIG1hc2snKTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5maW5kKCcuYWxsLWF2YXRhcnMnKS5zdG9wKHRydWUpLnNsaWRlVXAoNDAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmZpbmQoJy5hdmF0YXJzLW51bS1taW51cy1vbmUnKS5zdG9wKHRydWUpLnNob3coMSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRodHRwJywgJyR3aW5kb3cnLCAnRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCAnVXNlclNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsICR3aW5kb3csIERhdGVUaW1lRm9ybWF0U2VydmljZSwgUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlLCBVcmxTZXJ2aWNlLCBVc2VyU2VydmljZSwgV2luZG93RGltZW5zaW9uc1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVzZXJJc0xvZ2dlZEluID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgVXNlclNlcnZpY2UuZ2V0VXNlckluZm9Bc3luYygpLnRoZW4oZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXNlcklzTG9nZ2VkSW4gPSB1c2VySW5mby5pc0xvZ2dlZEluKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTiA9IChjb25zdGFudHMuQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250cmlidXRvcnNTdW1tYXJ5ID0gJHNjb3BlLmdldENvbnRyaWJ1dG9yc1N1bW1hcnkoKSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbnRyaWJ1dG9ycyA9IE9iamVjdC5rZXlzKGNvbnRyaWJ1dG9yc1N1bW1hcnkpLnNvcnQoZnVuY3Rpb24gKGNvbnRyaWJ1dG9yVXNlcm5hbWUxLCBjb250cmlidXRvclVzZXJuYW1lMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbW1pdHNPZkNvbnRyaWJ1dG9yMSA9IGNvbnRyaWJ1dG9yc1N1bW1hcnlbY29udHJpYnV0b3JVc2VybmFtZTFdLm51bV9jb21taXRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbW1pdHNPZkNvbnRyaWJ1dG9yMiA9IGNvbnRyaWJ1dG9yc1N1bW1hcnlbY29udHJpYnV0b3JVc2VybmFtZTJdLm51bV9jb21taXRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbW1pdHNPZkNvbnRyaWJ1dG9yMiAtIGNvbW1pdHNPZkNvbnRyaWJ1dG9yMTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1JlZnJlc2hlckV4cGxvcmF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuZ2V0UGFyZW50RXhwbG9yYXRpb25JZHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzUmVmcmVzaGVyRXhwbG9yYXRpb24gPSAoJHNjb3BlLmdldFBhcmVudEV4cGxvcmF0aW9uSWRzKCkubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmF2YXRhcnNMaXN0ID0gW107XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5NQVhfQVZBVEFSU19UT19ESVNQTEFZID0gNTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNldEhvdmVyU3RhdGUgPSBmdW5jdGlvbiAoaG92ZXJTdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmV4cGxvcmF0aW9uSXNDdXJyZW50bHlIb3ZlcmVkT3ZlciA9IGhvdmVyU3RhdGU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2FkUGFyZW50RXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uLmhyZWYgPSAkc2NvcGUuZ2V0RXhwbG9yYXRpb25MaW5rKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRBdmVyYWdlUmF0aW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuZ2V0UmF0aW5ncygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlLmNvbXB1dGVBdmVyYWdlUmF0aW5nKCRzY29wZS5nZXRSYXRpbmdzKCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0TGFzdFVwZGF0ZWREYXRldGltZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLmdldExhc3RVcGRhdGVkTXNlYygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLmdldExvY2FsZUFiYnJldmlhdGVkRGF0ZXRpbWVTdHJpbmcoJHNjb3BlLmdldExhc3RVcGRhdGVkTXNlYygpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldEV4cGxvcmF0aW9uTGluayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLmdldEV4cGxvcmF0aW9uSWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnIyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gJy9leHBsb3JlLycgKyAkc2NvcGUuZ2V0RXhwbG9yYXRpb25JZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1cmxQYXJhbXMgPSBVcmxTZXJ2aWNlLmdldFVybFBhcmFtcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnRFeHBsb3JhdGlvbklkcyA9ICRzY29wZS5nZXRQYXJlbnRFeHBsb3JhdGlvbklkcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xsZWN0aW9uSWRUb0FkZCA9ICRzY29wZS5nZXRDb2xsZWN0aW9uSWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBjb2xsZWN0aW9uIElEIHdpdGggdGhlIG9uZSBpbiB0aGUgVVJMIGlmIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhpc3RzIGluIHVybFBhcmFtcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50RXhwbG9yYXRpb25JZHMgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsUGFyYW1zLmhhc093blByb3BlcnR5KCdjb2xsZWN0aW9uX2lkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbklkVG9BZGQgPSB1cmxQYXJhbXMuY29sbGVjdGlvbl9pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbGxlY3Rpb25JZFRvQWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IFVybFNlcnZpY2UuYWRkRmllbGQocmVzdWx0LCAnY29sbGVjdGlvbl9pZCcsIGNvbGxlY3Rpb25JZFRvQWRkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudEV4cGxvcmF0aW9uSWRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyZW50RXhwbG9yYXRpb25JZHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBVcmxTZXJ2aWNlLmFkZEZpZWxkKHJlc3VsdCwgJ3BhcmVudCcsIHBhcmVudEV4cGxvcmF0aW9uSWRzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5tb2JpbGVDdXRvZmZQeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1vYmlsZUN1dG9mZlB4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNXaW5kb3dMYXJnZSA9IChXaW5kb3dEaW1lbnNpb25zU2VydmljZS5nZXRXaWR0aCgpID49ICRzY29wZS5tb2JpbGVDdXRvZmZQeCk7XG4gICAgICAgICAgICAgICAgICAgIFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnJlZ2lzdGVyT25SZXNpemVIb29rKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1dpbmRvd0xhcmdlID0gKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCkgPj0gJHNjb3BlLm1vYmlsZUN1dG9mZlB4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRDb21wbGV0ZVRodW1ibmFpbEljb25VcmwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJHNjb3BlLmdldFRodW1ibmFpbEljb25VcmwoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTdW1tYXJpemVOb25uZWdhdGl2ZU51bWJlciBmaWx0ZXIgZm9yIE9wcGlhLlxuICovXG4vLyBGaWx0ZXIgdGhhdCBzdW1tYXJpemVzIGEgbGFyZ2UgbnVtYmVyIHRvIGEgZGVjaW1hbCBmb2xsb3dlZCBieVxuLy8gdGhlIGFwcHJvcHJpYXRlIG1ldHJpYyBwcmVmaXggKEssIE0gb3IgQikuIEZvciBleGFtcGxlLCAxNjc2NTZcbi8vIGJlY29tZXMgMTY3LjdLLlxuLy8gVXNlcnMgb2YgdGhpcyBmaWx0ZXIgc2hvdWxkIGVuc3VyZSB0aGF0IHRoZSBpbnB1dCBpcyBhIG5vbi1uZWdhdGl2ZSBudW1iZXIuXG5hbmd1bGFyLm1vZHVsZSgnZmlsdGVyc01vZHVsZScpLmZpbHRlcignc3VtbWFyaXplTm9ubmVnYXRpdmVOdW1iZXInLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICBpbnB1dCA9IE51bWJlcihpbnB1dCk7XG4gICAgICAgICAgICAvLyBOaW5lIHplcm9zIGZvciBiaWxsaW9ucyAoZS5nLiAxNDYwMDg3ODg3ODggLS0+IDE0Ni4wQikuXG4gICAgICAgICAgICAvLyBTaXggemVyb3MgZm9yIG1pbGxpb25zIChlLmcuIDE0NjAwODc4OCAtLT4gMTQ2LjBNKS5cbiAgICAgICAgICAgIC8vIFRocmVlIHplcm9zIGZvciB0aG91c2FuZHMgKGUuZy4gMTQ2MDA4IC0tPiAxNDYuMEspLlxuICAgICAgICAgICAgLy8gTm8gY2hhbmdlIGZvciBzbWFsbCBudW1iZXJzIChlLmcuIDEyIC0tPiAxMikuXG4gICAgICAgICAgICByZXR1cm4gKGlucHV0ID49IDEuMGUrOSA/IChpbnB1dCAvIDEuMGUrOSkudG9GaXhlZCgxKSArICdCJyA6XG4gICAgICAgICAgICAgICAgaW5wdXQgPj0gMS4wZSs2ID8gKGlucHV0IC8gMS4wZSs2KS50b0ZpeGVkKDEpICsgJ00nIDpcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQgPj0gMS4wZSszID8gKGlucHV0IC8gMS4wZSszKS50b0ZpeGVkKDEpICsgJ0snIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0KTtcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgY29tcHV0aW5nIHRoZSB3aW5kb3cgZGltZW5zaW9ucy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnV2luZG93RGltZW5zaW9uc1NlcnZpY2UnLCBbJyR3aW5kb3cnLCBmdW5jdGlvbiAoJHdpbmRvdykge1xuICAgICAgICB2YXIgb25SZXNpemVIb29rcyA9IFtdO1xuICAgICAgICBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdykuYmluZCgncmVzaXplJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgb25SZXNpemVIb29rcy5mb3JFYWNoKGZ1bmN0aW9uIChob29rRm4pIHtcbiAgICAgICAgICAgICAgICBob29rRm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldFdpZHRoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgkd2luZG93LmlubmVyV2lkdGggfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIHx8XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT25SZXNpemVIb29rOiBmdW5jdGlvbiAoaG9va0ZuKSB7XG4gICAgICAgICAgICAgICAgb25SZXNpemVIb29rcy5wdXNoKGhvb2tGbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNXaW5kb3dOYXJyb3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgTk9STUFMX05BVkJBUl9DVVRPRkZfV0lEVEhfUFggPSA3Njg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0V2lkdGgoKSA8PSBOT1JNQUxfTkFWQkFSX0NVVE9GRl9XSURUSF9QWDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9