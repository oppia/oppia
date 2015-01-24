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
 * @fileoverview Data and controllers for the Oppia contributors' gallery page.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.filter('selectedCategoriesFilter', function() {
  return function(items, selectedCategories, fieldName) {
    if (!items) {
      return [];
    }

    return items.filter(function(item) {
      return selectedCategories[item[fieldName]];
    });
  };
});

oppia.filter('selectedLanguagesFilter', function() {
  return function(items, selectedLanguages) {
    if (!items) {
      return [];
    }

    // If no languages are selected, show all explorations.
    if (selectedLanguages.length === 0) {
      return items;
    }

    return items.filter(function(item) {
      return selectedLanguages.indexOf(item.language) !== -1;
    });
  };
});

oppia.directive('checkboxGroup', function() {
  return {
    restrict: 'E',
    scope: {
      allCategoriesLabel: '@',
      // Dict where each key is the name of a category, and each
      // value is true/false according to whether the category is
      // selected or not. It is assumed that not all categories
      // are unselected at the outset.
      model: '='
    },
    templateUrl: 'checkboxGroup/master',
    controller: ['$scope', '$rootScope', function($scope, $rootScope) {
      var someCategoryUnchecked = false;
      for (var key in $scope.model) {
        if (!$scope.model[key]) {
          someCategoryUnchecked = true;
        }
      }

      $scope.allCategoriesSelected = !someCategoryUnchecked;
      $scope.individualCategoryCheckboxStatuses = {};
      for (var key in $scope.model) {
        if (someCategoryUnchecked) {
          $scope.individualCategoryCheckboxStatuses[key] = $scope.model[key];
        } else {
          $scope.individualCategoryCheckboxStatuses[key] = false;
        }
      }

      $scope.onChangeSelection = function(allCategoriesCheckboxChanged) {
        if (allCategoriesCheckboxChanged) {
          if ($scope.allCategoriesSelected) {
            for (var key in $scope.model) {
              $scope.model[key] = true;
              $scope.individualCategoryCheckboxStatuses[key] = false;
            }
          } else {
            $scope.allCategoriesSelected = true;
          }
        } else {
          var someCategoryCheckboxIsChecked = false;
          var someCategoryCheckboxIsUnchecked = false;
          for (var key in $scope.model) {
            if ($scope.individualCategoryCheckboxStatuses[key]) {
              someCategoryCheckboxIsChecked = true;
            } else {
              someCategoryCheckboxIsUnchecked = true;
            }
          }

          if (someCategoryCheckboxIsChecked && someCategoryCheckboxIsUnchecked) {
            $scope.allCategoriesSelected = false;
            for (var key in $scope.model) {
              $scope.model[key] = $scope.individualCategoryCheckboxStatuses[key];
            }
          } else {
            for (var key in $scope.model) {
              $scope.model[key] = true;
            }
            $scope.allCategoriesSelected = true;
          }
        }
        $rootScope.$broadcast('galleryQueryChanged', $scope.model);
      };
    }]
  };
});

oppia.controller('Gallery', [
    '$scope', '$http', '$rootScope', '$window', 'createExplorationButtonService',
    'oppiaDatetimeFormatter', 'oppiaDebouncer', 'urlService',
    function($scope, $http, $rootScope, $window, createExplorationButtonService,
             oppiaDatetimeFormatter, oppiaDebouncer, urlService) {
  $scope.galleryDataUrl = '/galleryhandler/data';
  $scope.currentUserIsModerator = false;
  $scope.searchIsLoading = false;
  $scope.pageLoaderIsBusy = false;

  // Default color.
  var _COLOR_TEAL = 'teal';
  // Social sciences.
  var _COLOR_SALMON = 'salmon';
  // Art.
  var _COLOR_SUNNYSIDE = 'sunnyside';
  // Mathematics and computing.
  var _COLOR_SHARKFIN = 'sharkfin';
  // Science.
  var _COLOR_GUNMETAL = 'gunmetal';

  var CATEGORY_TO_DEFAULT_COLOR = {
    'Architecture': _COLOR_SUNNYSIDE,
    'Art': _COLOR_SUNNYSIDE,
    'Biology': _COLOR_GUNMETAL,
    'Business': _COLOR_SALMON,
    'Chemistry': _COLOR_GUNMETAL,
    'Coding': _COLOR_SHARKFIN,
    'Computing': _COLOR_SHARKFIN,
    'Education': _COLOR_TEAL,
    'Engineering': _COLOR_GUNMETAL,
    'Environment': _COLOR_GUNMETAL,
    'Geography': _COLOR_SALMON,
    'Government': _COLOR_SALMON,
    'Languages': _COLOR_SUNNYSIDE,
    'Law': _COLOR_SALMON,
    'Life Skills': _COLOR_TEAL,
    'Mathematics': _COLOR_SHARKFIN,
    'Medicine': _COLOR_GUNMETAL,
    'Music': _COLOR_SUNNYSIDE,
    'Philosophy': _COLOR_SALMON,
    'Photography': _COLOR_SUNNYSIDE,
    'Physics': _COLOR_GUNMETAL,
    'Programming': _COLOR_SHARKFIN,
    'Psychology': _COLOR_SALMON,
    'Puzzles': _COLOR_TEAL,
    'Reading': _COLOR_TEAL,
    'Religion': _COLOR_SALMON,
    'Sport': _COLOR_SUNNYSIDE,
    'Statistics': _COLOR_SHARKFIN,
    'Welcome': _COLOR_TEAL
  };

  // TODO(sll): Modify this once explorations can specify their own images.
  $scope.getImageSrcUrl = function(exploration) {
    return '/images/gallery/default.png';
  };

  // TODO(sll): Modify this once explorations can specify their own images.
  $scope.getImageContainerClass = function(exploration) {
    var color = CATEGORY_TO_DEFAULT_COLOR.hasOwnProperty(exploration.category) ?
      CATEGORY_TO_DEFAULT_COLOR[exploration.category] : _COLOR_TEAL;
    return 'oppia-gallery-tile-image-translucent oppia-gallery-tile-image-' + color;
  };

  $scope.getCategoryList = function() {
    return Object.keys($scope.selectedCategories);
  };

  $scope.getFormattedObjective = function(objective) {
    objective = objective.trim();
    return objective.charAt(0).toUpperCase() + objective.slice(1);
  };

  $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
    return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
  };

  $rootScope.loadingMessage = 'Loading';

  $scope.showCreateExplorationModal = (
    createExplorationButtonService.showCreateExplorationModal);
  $scope.showUploadExplorationModal = (
    createExplorationButtonService.showUploadExplorationModal);

  $scope.searchQuery = '';

  $scope.onSearchQueryChange = function(evt) {
    // Query immediately when the enter or space key is pressed.
    if (evt.keyCode == 13 || evt.keyCode == 32) {
      $scope.onSearchQueryChangeExec();
    } else {
      $scope.delayedOnSearchQueryChangeExec();
    }
  };

  $scope.onSearchQueryChangeExec = function() {
    if (!$scope.searchQuery) {
      $http.get($scope.galleryDataUrl).success($scope.getGalleryData);
    } else {
      $scope.searchIsLoading = true;
      $http.get($scope.galleryDataUrl + '?q=' + $scope.searchQuery).success(
        $scope.getGalleryData);
    }
  };

  $scope.delayedOnSearchQueryChangeExec = oppiaDebouncer.debounce(
    $scope.onSearchQueryChangeExec, 400);

  $scope.LANGUAGE_CHOICES = GLOBALS.ALL_LANGUAGE_NAMES.map(function(languageName) {
    return {
      id: languageName,
      text: languageName
    };
  });

  var _DEFAULT_LANGUAGE = 'English';
  // This is a list.
  $scope.selectedLanguages = [_DEFAULT_LANGUAGE];

  var _INITIAL_NUM_ITEMS = 2;
  var _INCREMENT_SIZE = 1;

  $scope.numItemsShown = _INITIAL_NUM_ITEMS;
  $scope.allExplorationsInOrder = [];

  // Called only once.
  $scope.getGalleryData = function(data) {
    $scope.searchIsLoading = false;
    $scope.featuredExplorations = data.featured;
    $scope.publicExplorations = data['public'];

    $scope.allExplorationsInOrder = $scope.featuredExplorations.concat(
      $scope.publicExplorations);

    $scope.selectedCategories = {};
    $scope.allExplorationsInOrder.map(function(expDict) {
      // This is a dict.
      $scope.selectedCategories[expDict.category] = true;
    });

    $scope.showGalleryData($scope.allExplorationsInOrder);
    $rootScope.loadingMessage = '';
  };

  // Called as needed to show more explorations.
  $scope.showGalleryData = function(data) {
    if (data.length > $scope.numItemsShown) {
      $scope.finishedLoadingPage = false;
      $scope.shownExplorationsInOrder = data.slice(0, $scope.numItemsShown);
    } else {
      $scope.finishedLoadingPage = true;
      $scope.shownExplorationsInOrder = data;
    }
    $scope.pageLoaderIsBusy = false;
  };

  $scope.$on('galleryQueryChanged', function(event, selectedCategories) {
    $scope.numItemsShown = _INITIAL_NUM_ITEMS;
    $scope.shownExplorationsInOrder = $scope.allExplorationsInOrder.filter(function(expDict) {
      return selectedCategories[expDict.category] === true;
    }).slice(0, $scope.numItemsShown);

    $scope.finishedLoadingPage = false;
  });

  $scope.showMoreExplorations = function(data) {
    console.log("LOADING");
    $scope.pageLoaderIsBusy = true;
    $scope.numItemsShown += _INCREMENT_SIZE;
    $scope.showGalleryData($scope.allExplorationsInOrder);
  };

  // Retrieves gallery data from the server.
  $http.get($scope.galleryDataUrl).success(function(data) {
    if (data.is_moderator) {
      $scope.currentUserIsModerator = true;
    }

    $scope.getGalleryData(data);

    if (data.username) {
      var urlParams = urlService.getUrlParams();
      if (urlParams.mode === 'create') {
        $scope.showCreateExplorationModal($scope.getCategoryList());
      }
    }
  });

  $scope.gallerySidebarIsActive = false;
  $scope.toggleGallerySidebar = function() {
    $scope.gallerySidebarIsActive = !$scope.gallerySidebarIsActive;
  };

  $scope.isScreenLarge = function() {
    return Math.max(document.documentElement.clientWidth, $window.innerWidth || 0) > 768;
  };

  $scope.screenIsLarge = $scope.isScreenLarge();
  $window.addEventListener('resize', function() {
    $scope.screenIsLarge = $scope.isScreenLarge();
    if ($scope.screenIsLarge) {
      $scope.gallerySidebarIsActive = false;
    }
    $scope.$apply();
  });
}]);
