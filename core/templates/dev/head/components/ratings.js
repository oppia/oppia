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
 * @fileoverview Tools for displaying and awarding ratings.
 *
 * @author Jacob Davis
 */

// A service that maintains a record of which state in the exploration is
// currently active.
oppia.factory('ratingVisibilityService', [function() {
  return {
    areRatingsShown: function(ratingFrequencies) {
      var MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS = 3;

      var totalNumber = 0;
      for (var value in ratingFrequencies) {
        totalNumber += ratingFrequencies[value];
      }

      return totalNumber >= MINIMUM_ACCEPTABLE_NUMBER_OF_RATINGS;
    }
  };
}]);


oppia.directive('ratingFromValue', [function() {
  return {
    // This will display a star-rating based on the given data. Exactly one of
    // 'ratingValue' and 'ratingFrequencies' should be specified.
    //  - ratingValue: an integer 1-5 giving the rating
    //  - ratingFrequencies: a dictionary with keys '1' to '5' giving the
    //    number of times each rating has been awarded; from this the average
    //    rating will be computed and displayed.
    //  - isEditable: true or false; whether the rating is user-editable.
    //  - onEdit: should be supplied iff isEditable is true, and be a function
    //    that will be supplied with the new rating when the rating is changed.
    restrict: 'E',
    scope: {
      ratingValue: '=',
      isEditable: '=',
      onEdit: '='
    },
    templateUrl: 'rating/fromValue',
    controller: ['$scope', function($scope) {

      var POSSIBLE_RATINGS = [1, 2, 3, 4, 5];
      $scope.stars = POSSIBLE_RATINGS.map(function(starValue) {
        return {
          cssClass: 'fa-star-o',
          value: starValue
        };
      });

      var STATUS_ACTIVE = 'active';
      var STATUS_INACTIVE = 'inactive';
      var STATUS_RATING_SET = 'rating_set';
      $scope.status = STATUS_INACTIVE;

      var displayValue = function(ratingValue) {
        for (var i = 0; i < $scope.stars.length; i++) {
          $scope.stars[i].cssClass =
            ratingValue === undefined ? 'fa-star-o' :
            ratingValue < $scope.stars[i].value - 0.75 ? 'fa-star-o' :
            ratingValue < $scope.stars[i].value - 0.25 ? 'fa-star-half-o' : 'fa-star';

          if ($scope.status === STATUS_ACTIVE && ratingValue >= $scope.stars[i].value) {
            $scope.stars[i].cssClass += ' oppia-rating-star-active';
          }
        }
      };

      displayValue($scope.ratingValue);
      $scope.$watch('ratingValue', function() {
        displayValue($scope.ratingValue);
      });

      $scope.clickStar = function(starValue) {
        if ($scope.isEditable && $scope.status === STATUS_ACTIVE) {
          $scope.status = STATUS_RATING_SET;
          $scope.ratingValue = starValue;
          displayValue(starValue);
          $scope.onEdit(starValue);
        }
      };
      $scope.enterStar = function(starValue) {
        if (
            $scope.isEditable &&
            ($scope.status === STATUS_ACTIVE ||
              $scope.status === STATUS_INACTIVE)) {
          $scope.status = STATUS_ACTIVE;
          displayValue(starValue);
        }
      };
      $scope.leaveArea = function() {
        $scope.status = STATUS_INACTIVE;
        displayValue($scope.ratingValue);
      };

      $scope.getCursorStyle = function() {
        return 'cursor: ' + ($scope.isEditable ? 'pointer' : 'auto');
      }
    }]
  };
}]);


oppia.directive('ratingFromFrequencies', [function() {
  return {
    restrict: 'E',
    scope: {
      ratingFrequencies: '&'
    },
    templateUrl: 'rating/fromFrequencies',
    controller: [
        '$scope', 'ratingVisibilityService',
        function($scope, ratingVisibilityService) {

      $scope.computeAverageRating = function(ratingFrequencies) {
        if (!ratingVisibilityService.areRatingsShown(ratingFrequencies)) {
          return undefined;
        } else {
          var totalNumber = 0;
          var totalValue = 0.0;
          for (var value in ratingFrequencies) {
            totalValue += value * ratingFrequencies[value];
            totalNumber += ratingFrequencies[value];
          }
          return totalValue / totalNumber;
        }
      };

      $scope.ratingValue = $scope.computeAverageRating(
        $scope.ratingFrequencies());
    }]
  };
}]);
