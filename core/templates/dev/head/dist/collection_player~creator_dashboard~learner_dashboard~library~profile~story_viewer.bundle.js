(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_player~creator_dashboard~learner_dashboard~library~profile~story_viewer"],{

/***/ "./core/templates/dev/head/components/ratings/rating-computation/rating-computation.service.ts":
/*!*****************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/ratings/rating-computation/rating-computation.service.ts ***!
  \*****************************************************************************************************/
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
 * @fileoverview Service for computing the average rating.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var RatingComputationService = /** @class */ (function () {
    function RatingComputationService() {
    }
    RatingComputationService_1 = RatingComputationService;
    RatingComputationService.areRatingsShown = function (ratingFrequencies) {
        var MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS = 1;
        var totalNumber = 0;
        for (var value in ratingFrequencies) {
            totalNumber += ratingFrequencies[value];
        }
        return totalNumber >= MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS;
    };
    RatingComputationService.prototype.computeAverageRating = function (ratingFrequencies) {
        if (!RatingComputationService_1.areRatingsShown(ratingFrequencies)) {
            return undefined;
        }
        else {
            var totalNumber = 0;
            var totalValue = 0.0;
            for (var value in ratingFrequencies) {
                totalValue += parseInt(value) * ratingFrequencies[value];
                totalNumber += ratingFrequencies[value];
            }
            if (totalNumber === 0) {
                return undefined;
            }
            return totalValue / totalNumber;
        }
    };
    var RatingComputationService_1;
    RatingComputationService = RatingComputationService_1 = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], RatingComputationService);
    return RatingComputationService;
}());
exports.RatingComputationService = RatingComputationService;
angular.module('oppia').factory('RatingComputationService', static_1.downgradeInjectable(RatingComputationService));


/***/ }),

/***/ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIconsDirective.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIconsDirective.ts ***!
  \********************************************************************************************/
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
 * @fileoverview Directive for showing learner dashboard icons.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('learnerDashboardIcons', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getActivityType: '&activityType',
                getActivityId: '&activityId',
                getActivityTitle: '&activityTitle',
                activityActive: '=activityActive',
                isContainerNarrow: '&containerIsNarrow',
                isAddToPlaylistIconShown: '&addToPlaylistIconIsShown'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/domain/learner_dashboard/' +
                'learner_dashboard_icons_directive.html'),
            controller: [
                '$scope', 'LearnerDashboardIdsBackendApiService',
                'LearnerDashboardActivityIdsObjectFactory',
                'LearnerPlaylistService', 'ACTIVITY_TYPE_COLLECTION',
                'ACTIVITY_TYPE_EXPLORATION',
                function ($scope, LearnerDashboardIdsBackendApiService, LearnerDashboardActivityIdsObjectFactory, LearnerPlaylistService, ACTIVITY_TYPE_COLLECTION, ACTIVITY_TYPE_EXPLORATION) {
                    $scope.activityIsCurrentlyHoveredOver = true;
                    $scope.playlistTooltipIsEnabled = false;
                    $scope.enablePlaylistTooltip = function () {
                        $scope.playlistTooltipIsEnabled = true;
                    };
                    $scope.disablePlaylistTooltip = function () {
                        $scope.playlistTooltipIsEnabled = false;
                    };
                    $scope.$watch('activityActive', function (value) {
                        $scope.activityIsCurrentlyHoveredOver = $scope.activityActive;
                    });
                    LearnerDashboardIdsBackendApiService.fetchLearnerDashboardIds().then(function (response) {
                        $scope.learnerDashboardActivityIds = (LearnerDashboardActivityIdsObjectFactory.createFromBackendDict(response.learner_dashboard_activity_ids));
                    });
                    $scope.setHoverState = function (hoverState) {
                        $scope.activityIsCurrentlyHoveredOver = hoverState;
                    };
                    $scope.canActivityBeAddedToLearnerPlaylist = function (activityId) {
                        if ($scope.learnerDashboardActivityIds) {
                            if ($scope.learnerDashboardActivityIds.includesActivity(activityId)) {
                                return false;
                            }
                            else {
                                if ($scope.isContainerNarrow()) {
                                    return true;
                                }
                                else {
                                    return $scope.activityIsCurrentlyHoveredOver;
                                }
                            }
                        }
                    };
                    $scope.belongsToLearnerPlaylist = function () {
                        var activityType = $scope.getActivityType();
                        if ($scope.learnerDashboardActivityIds) {
                            /* eslint-disable max-len */
                            if (activityType === ACTIVITY_TYPE_EXPLORATION) {
                                return ($scope.learnerDashboardActivityIds.belongsToExplorationPlaylist($scope.getActivityId()));
                            }
                            else if (activityType === ACTIVITY_TYPE_COLLECTION) {
                                return ($scope.learnerDashboardActivityIds.belongsToCollectionPlaylist($scope.getActivityId()));
                            }
                            /* eslint-enable max-len */
                        }
                    };
                    $scope.belongsToCompletedActivities = function () {
                        var activityType = $scope.getActivityType();
                        if ($scope.learnerDashboardActivityIds) {
                            /* eslint-disable max-len */
                            if (activityType === ACTIVITY_TYPE_EXPLORATION) {
                                return ($scope.learnerDashboardActivityIds.belongsToCompletedExplorations($scope.getActivityId()));
                            }
                            else if (activityType === ACTIVITY_TYPE_COLLECTION) {
                                return ($scope.learnerDashboardActivityIds.belongsToCompletedCollections($scope.getActivityId()));
                            }
                            /* eslint-enable max-len */
                        }
                    };
                    $scope.belongsToIncompleteActivities = function () {
                        var activityType = $scope.getActivityType();
                        if ($scope.learnerDashboardActivityIds) {
                            /* eslint-disable max-len */
                            if (activityType === ACTIVITY_TYPE_EXPLORATION) {
                                return ($scope.learnerDashboardActivityIds.belongsToIncompleteExplorations($scope.getActivityId()));
                            }
                            else if (activityType === ACTIVITY_TYPE_COLLECTION) {
                                return ($scope.learnerDashboardActivityIds.belongsToIncompleteCollections($scope.getActivityId()));
                            }
                            /* eslint-enable max-len */
                        }
                    };
                    $scope.addToLearnerPlaylist = function (activityId, activityType) {
                        var isSuccessfullyAdded = (LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType));
                        if (isSuccessfullyAdded) {
                            if (activityType === ACTIVITY_TYPE_EXPLORATION) {
                                /* eslint-disable max-len */
                                $scope.learnerDashboardActivityIds.addToExplorationLearnerPlaylist(activityId);
                                /* eslint-enable max-len */
                            }
                            else if (activityType === ACTIVITY_TYPE_COLLECTION) {
                                /* eslint-disable max-len */
                                $scope.learnerDashboardActivityIds.addToCollectionLearnerPlaylist(activityId);
                                /* eslint-enable max-len */
                            }
                            $scope.disablePlaylistTooltip();
                        }
                    };
                    $scope.removeFromLearnerPlaylist = function (activityId, activityTitle, activityType) {
                        var isSuccessfullyRemoved = (LearnerPlaylistService.removeFromLearnerPlaylist(activityId, activityTitle, activityType, $scope.learnerDashboardActivityIds));
                    };
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
angular.module('oppia').filter('convertToPlainText', [function () {
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
    }]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/truncate-and-capitalize.filter.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/truncate-and-capitalize.filter.ts ***!
  \**************************************************************************************************/
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
 * @fileoverview TruncateAndCapitalize filter for Oppia.
 */
// Note that this filter does not truncate at the middle of a word.
angular.module('oppia').filter('truncateAndCapitalize', [function () {
        return function (input, maxNumberOfCharacters) {
            if (!input) {
                return input;
            }
            var words = input.trim().match(/\S+/g);
            // Capitalize the first word and add it to the result.
            var result = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            // Add the remaining words to the result until the character limit is
            // reached.
            for (var i = 1; i < words.length; i++) {
                if (!maxNumberOfCharacters ||
                    result.length + 1 + words[i].length <= maxNumberOfCharacters) {
                    result += ' ';
                    result += words[i];
                }
                else {
                    result += '...';
                    break;
                }
            }
            return result;
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts ***!
  \***********************************************************************************/
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
 * @fileoverview Truncate filter for Oppia.
 */
__webpack_require__(/*! filters/string-utility-filters/convert-to-plain-text.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts");
// Filter that truncates long descriptors.
angular.module('oppia').filter('truncate', ['$filter', function ($filter) {
        return function (input, length, suffix) {
            if (!input) {
                return '';
            }
            if (isNaN(length)) {
                length = 70;
            }
            if (suffix === undefined) {
                suffix = '...';
            }
            if (!angular.isString(input)) {
                input = String(input);
            }
            input = $filter('convertToPlainText')(input);
            return (input.length <= length ? input : (input.substring(0, length - suffix.length) + suffix));
        };
    }]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3JhdGluZ3MvcmF0aW5nLWNvbXB1dGF0aW9uL3JhdGluZy1jb21wdXRhdGlvbi5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9sZWFybmVyX2Rhc2hib2FyZC9MZWFybmVyRGFzaGJvYXJkSWNvbnNEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL2NvbnZlcnQtdG8tcGxhaW4tdGV4dC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLWFuZC1jYXBpdGFsaXplLmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9maWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdHJ1bmNhdGUuZmlsdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBLGFBQWEsbUJBQU8sQ0FBQyxpRUFBZTtBQUNwQyxlQUFlLG1CQUFPLENBQUMsOEZBQXlCO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7Ozs7Ozs7Ozs7OztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQsdURBQXVEO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUM3Qkw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGtCQUFrQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUN4Q0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGdLQUFnRTtBQUN4RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLIiwiZmlsZSI6ImNvbGxlY3Rpb25fcGxheWVyfmNyZWF0b3JfZGFzaGJvYXJkfmxlYXJuZXJfZGFzaGJvYXJkfmxpYnJhcnl+cHJvZmlsZX5zdG9yeV92aWV3ZXIuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBjb21wdXRpbmcgdGhlIGF2ZXJhZ2UgcmF0aW5nLlxuICovXG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJhdGluZ0NvbXB1dGF0aW9uU2VydmljZSgpIHtcbiAgICB9XG4gICAgUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlXzEgPSBSYXRpbmdDb21wdXRhdGlvblNlcnZpY2U7XG4gICAgUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlLmFyZVJhdGluZ3NTaG93biA9IGZ1bmN0aW9uIChyYXRpbmdGcmVxdWVuY2llcykge1xuICAgICAgICB2YXIgTUlOSU1VTV9BQ0NFUFRBQkxFX05VTUJFUl9PRl9SQVRJTkdTID0gMTtcbiAgICAgICAgdmFyIHRvdGFsTnVtYmVyID0gMDtcbiAgICAgICAgZm9yICh2YXIgdmFsdWUgaW4gcmF0aW5nRnJlcXVlbmNpZXMpIHtcbiAgICAgICAgICAgIHRvdGFsTnVtYmVyICs9IHJhdGluZ0ZyZXF1ZW5jaWVzW3ZhbHVlXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG90YWxOdW1iZXIgPj0gTUlOSU1VTV9BQ0NFUFRBQkxFX05VTUJFUl9PRl9SQVRJTkdTO1xuICAgIH07XG4gICAgUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlLnByb3RvdHlwZS5jb21wdXRlQXZlcmFnZVJhdGluZyA9IGZ1bmN0aW9uIChyYXRpbmdGcmVxdWVuY2llcykge1xuICAgICAgICBpZiAoIVJhdGluZ0NvbXB1dGF0aW9uU2VydmljZV8xLmFyZVJhdGluZ3NTaG93bihyYXRpbmdGcmVxdWVuY2llcykpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdG90YWxOdW1iZXIgPSAwO1xuICAgICAgICAgICAgdmFyIHRvdGFsVmFsdWUgPSAwLjA7XG4gICAgICAgICAgICBmb3IgKHZhciB2YWx1ZSBpbiByYXRpbmdGcmVxdWVuY2llcykge1xuICAgICAgICAgICAgICAgIHRvdGFsVmFsdWUgKz0gcGFyc2VJbnQodmFsdWUpICogcmF0aW5nRnJlcXVlbmNpZXNbdmFsdWVdO1xuICAgICAgICAgICAgICAgIHRvdGFsTnVtYmVyICs9IHJhdGluZ0ZyZXF1ZW5jaWVzW3ZhbHVlXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0b3RhbE51bWJlciA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdG90YWxWYWx1ZSAvIHRvdGFsTnVtYmVyO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlXzE7XG4gICAgUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlID0gUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlXzEgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlKTtcbiAgICByZXR1cm4gUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlO1xufSgpKTtcbmV4cG9ydHMuUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlID0gUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnUmF0aW5nQ29tcHV0YXRpb25TZXJ2aWNlJywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShSYXRpbmdDb21wdXRhdGlvblNlcnZpY2UpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBzaG93aW5nIGxlYXJuZXIgZGFzaGJvYXJkIGljb25zLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2xlYXJuZXJEYXNoYm9hcmRJY29ucycsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGdldEFjdGl2aXR5VHlwZTogJyZhY3Rpdml0eVR5cGUnLFxuICAgICAgICAgICAgICAgIGdldEFjdGl2aXR5SWQ6ICcmYWN0aXZpdHlJZCcsXG4gICAgICAgICAgICAgICAgZ2V0QWN0aXZpdHlUaXRsZTogJyZhY3Rpdml0eVRpdGxlJyxcbiAgICAgICAgICAgICAgICBhY3Rpdml0eUFjdGl2ZTogJz1hY3Rpdml0eUFjdGl2ZScsXG4gICAgICAgICAgICAgICAgaXNDb250YWluZXJOYXJyb3c6ICcmY29udGFpbmVySXNOYXJyb3cnLFxuICAgICAgICAgICAgICAgIGlzQWRkVG9QbGF5bGlzdEljb25TaG93bjogJyZhZGRUb1BsYXlsaXN0SWNvbklzU2hvd24nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvZG9tYWluL2xlYXJuZXJfZGFzaGJvYXJkLycgK1xuICAgICAgICAgICAgICAgICdsZWFybmVyX2Rhc2hib2FyZF9pY29uc19kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzT2JqZWN0RmFjdG9yeScsXG4gICAgICAgICAgICAgICAgJ0xlYXJuZXJQbGF5bGlzdFNlcnZpY2UnLCAnQUNUSVZJVFlfVFlQRV9DT0xMRUNUSU9OJyxcbiAgICAgICAgICAgICAgICAnQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTicsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlLCBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNPYmplY3RGYWN0b3J5LCBMZWFybmVyUGxheWxpc3RTZXJ2aWNlLCBBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04sIEFDVElWSVRZX1RZUEVfRVhQTE9SQVRJT04pIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFjdGl2aXR5SXNDdXJyZW50bHlIb3ZlcmVkT3ZlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5wbGF5bGlzdFRvb2x0aXBJc0VuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVuYWJsZVBsYXlsaXN0VG9vbHRpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5wbGF5bGlzdFRvb2x0aXBJc0VuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGlzYWJsZVBsYXlsaXN0VG9vbHRpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5wbGF5bGlzdFRvb2x0aXBJc0VuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgnYWN0aXZpdHlBY3RpdmUnLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3Rpdml0eUlzQ3VycmVudGx5SG92ZXJlZE92ZXIgPSAkc2NvcGUuYWN0aXZpdHlBY3RpdmU7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBMZWFybmVyRGFzaGJvYXJkSWRzQmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hMZWFybmVyRGFzaGJvYXJkSWRzKCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMgPSAoTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QocmVzcG9uc2UubGVhcm5lcl9kYXNoYm9hcmRfYWN0aXZpdHlfaWRzKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0SG92ZXJTdGF0ZSA9IGZ1bmN0aW9uIChob3ZlclN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWN0aXZpdHlJc0N1cnJlbnRseUhvdmVyZWRPdmVyID0gaG92ZXJTdGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbkFjdGl2aXR5QmVBZGRlZFRvTGVhcm5lclBsYXlsaXN0ID0gZnVuY3Rpb24gKGFjdGl2aXR5SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMuaW5jbHVkZXNBY3Rpdml0eShhY3Rpdml0eUlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmlzQ29udGFpbmVyTmFycm93KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS5hY3Rpdml0eUlzQ3VycmVudGx5SG92ZXJlZE92ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5iZWxvbmdzVG9MZWFybmVyUGxheWxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aXZpdHlUeXBlID0gJHNjb3BlLmdldEFjdGl2aXR5VHlwZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2aXR5VHlwZSA9PT0gQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMuYmVsb25nc1RvRXhwbG9yYXRpb25QbGF5bGlzdCgkc2NvcGUuZ2V0QWN0aXZpdHlJZCgpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFjdGl2aXR5VHlwZSA9PT0gQUNUSVZJVFlfVFlQRV9DT0xMRUNUSU9OKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5iZWxvbmdzVG9Db2xsZWN0aW9uUGxheWxpc3QoJHNjb3BlLmdldEFjdGl2aXR5SWQoKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmJlbG9uZ3NUb0NvbXBsZXRlZEFjdGl2aXRpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aXZpdHlUeXBlID0gJHNjb3BlLmdldEFjdGl2aXR5VHlwZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2aXR5VHlwZSA9PT0gQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCRzY29wZS5sZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMuYmVsb25nc1RvQ29tcGxldGVkRXhwbG9yYXRpb25zKCRzY29wZS5nZXRBY3Rpdml0eUlkKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYWN0aXZpdHlUeXBlID09PSBBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgkc2NvcGUubGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLmJlbG9uZ3NUb0NvbXBsZXRlZENvbGxlY3Rpb25zKCRzY29wZS5nZXRBY3Rpdml0eUlkKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5iZWxvbmdzVG9JbmNvbXBsZXRlQWN0aXZpdGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpdml0eVR5cGUgPSAkc2NvcGUuZ2V0QWN0aXZpdHlUeXBlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZpdHlUeXBlID09PSBBQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5iZWxvbmdzVG9JbmNvbXBsZXRlRXhwbG9yYXRpb25zKCRzY29wZS5nZXRBY3Rpdml0eUlkKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYWN0aXZpdHlUeXBlID09PSBBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgkc2NvcGUubGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLmJlbG9uZ3NUb0luY29tcGxldGVDb2xsZWN0aW9ucygkc2NvcGUuZ2V0QWN0aXZpdHlJZCgpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWRkVG9MZWFybmVyUGxheWxpc3QgPSBmdW5jdGlvbiAoYWN0aXZpdHlJZCwgYWN0aXZpdHlUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNTdWNjZXNzZnVsbHlBZGRlZCA9IChMZWFybmVyUGxheWxpc3RTZXJ2aWNlLmFkZFRvTGVhcm5lclBsYXlsaXN0KGFjdGl2aXR5SWQsIGFjdGl2aXR5VHlwZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzc2Z1bGx5QWRkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZpdHlUeXBlID09PSBBQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5hZGRUb0V4cGxvcmF0aW9uTGVhcm5lclBsYXlsaXN0KGFjdGl2aXR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYWN0aXZpdHlUeXBlID09PSBBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLmFkZFRvQ29sbGVjdGlvbkxlYXJuZXJQbGF5bGlzdChhY3Rpdml0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5kaXNhYmxlUGxheWxpc3RUb29sdGlwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmVGcm9tTGVhcm5lclBsYXlsaXN0ID0gZnVuY3Rpb24gKGFjdGl2aXR5SWQsIGFjdGl2aXR5VGl0bGUsIGFjdGl2aXR5VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzU3VjY2Vzc2Z1bGx5UmVtb3ZlZCA9IChMZWFybmVyUGxheWxpc3RTZXJ2aWNlLnJlbW92ZUZyb21MZWFybmVyUGxheWxpc3QoYWN0aXZpdHlJZCwgYWN0aXZpdHlUaXRsZSwgYWN0aXZpdHlUeXBlLCAkc2NvcGUubGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb252ZXJ0VG9QbGFpblRleHQgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmlsdGVyKCdjb252ZXJ0VG9QbGFpblRleHQnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgc3RyaXBwZWRUZXh0ID0gaW5wdXQucmVwbGFjZSgvKDwoW14+XSspPikvaWcsICcnKTtcbiAgICAgICAgICAgIHN0cmlwcGVkVGV4dCA9IHN0cmlwcGVkVGV4dC5yZXBsYWNlKC8mbmJzcDsvaWcsICcgJyk7XG4gICAgICAgICAgICBzdHJpcHBlZFRleHQgPSBzdHJpcHBlZFRleHQucmVwbGFjZSgvJnF1b3Q7L2lnLCAnJyk7XG4gICAgICAgICAgICB2YXIgdHJpbW1lZFRleHQgPSBzdHJpcHBlZFRleHQudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRyaW1tZWRUZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJpcHBlZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJpbW1lZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBUcnVuY2F0ZUFuZENhcGl0YWxpemUgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xuLy8gTm90ZSB0aGF0IHRoaXMgZmlsdGVyIGRvZXMgbm90IHRydW5jYXRlIGF0IHRoZSBtaWRkbGUgb2YgYSB3b3JkLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmlsdGVyKCd0cnVuY2F0ZUFuZENhcGl0YWxpemUnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0LCBtYXhOdW1iZXJPZkNoYXJhY3RlcnMpIHtcbiAgICAgICAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgd29yZHMgPSBpbnB1dC50cmltKCkubWF0Y2goL1xcUysvZyk7XG4gICAgICAgICAgICAvLyBDYXBpdGFsaXplIHRoZSBmaXJzdCB3b3JkIGFuZCBhZGQgaXQgdG8gdGhlIHJlc3VsdC5cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB3b3Jkc1swXS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHdvcmRzWzBdLnNsaWNlKDEpO1xuICAgICAgICAgICAgLy8gQWRkIHRoZSByZW1haW5pbmcgd29yZHMgdG8gdGhlIHJlc3VsdCB1bnRpbCB0aGUgY2hhcmFjdGVyIGxpbWl0IGlzXG4gICAgICAgICAgICAvLyByZWFjaGVkLlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB3b3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghbWF4TnVtYmVyT2ZDaGFyYWN0ZXJzIHx8XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5sZW5ndGggKyAxICsgd29yZHNbaV0ubGVuZ3RoIDw9IG1heE51bWJlck9mQ2hhcmFjdGVycykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJyAnO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gd29yZHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJy4uLic7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBUcnVuY2F0ZSBmaWx0ZXIgZm9yIE9wcGlhLlxuICovXG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvY29udmVydC10by1wbGFpbi10ZXh0LmZpbHRlci50cycpO1xuLy8gRmlsdGVyIHRoYXQgdHJ1bmNhdGVzIGxvbmcgZGVzY3JpcHRvcnMuXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5maWx0ZXIoJ3RydW5jYXRlJywgWyckZmlsdGVyJywgZnVuY3Rpb24gKCRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCwgbGVuZ3RoLCBzdWZmaXgpIHtcbiAgICAgICAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNOYU4obGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgIGxlbmd0aCA9IDcwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN1ZmZpeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3VmZml4ID0gJy4uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNTdHJpbmcoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBTdHJpbmcoaW5wdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5wdXQgPSAkZmlsdGVyKCdjb252ZXJ0VG9QbGFpblRleHQnKShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0Lmxlbmd0aCA8PSBsZW5ndGggPyBpbnB1dCA6IChpbnB1dC5zdWJzdHJpbmcoMCwgbGVuZ3RoIC0gc3VmZml4Lmxlbmd0aCkgKyBzdWZmaXgpKTtcbiAgICAgICAgfTtcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9