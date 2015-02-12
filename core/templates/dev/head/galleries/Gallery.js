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

oppia.constant('GALLERY_DATA_URL', '/galleryhandler/data');

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

oppia.filter('selectedLanguageCodesFilter', function() {
  return function(items, selectedLanguageCodes) {
    if (!items) {
      return [];
    }

    // If no languages are selected, show all explorations.
    if (selectedLanguageCodes.length === 0) {
      return items;
    }

    return items.filter(function(item) {
      return selectedLanguageCodes.indexOf(item.language_code) !== -1;
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
        $rootScope.$broadcast('categorySelectionChanged');
      };
    }]
  };
});

oppia.factory('searchService', [
    '$http', '$rootScope', 'GALLERY_DATA_URL', function($http, $rootScope, GALLERY_DATA_URL) {
  var _selectedCategories = {};
  var _selectedLanguageCodes = [];
  var _lastQuery = null;
  var _searchCursor = null;

  // Appends a suffix to the query describing allowed category and language
  // codes to filter on.
  var _getSuffixForQuery = function() {
    var _categories = '';
    var _allCategoriesAreSelected = true;
    for (var key in _selectedCategories) {
      if (_selectedCategories[key]) {
        if (_categories) {
          _categories += '" OR "';
        }
        _categories += key;
      } else {
        _allCategoriesAreSelected = false;
      }
    }

    var querySuffix = _allCategoriesAreSelected ? '' : ' category=("' + _categories + '")';
    if (_selectedLanguageCodes.length > 0) {
      querySuffix += ' language_code=("' + _selectedLanguageCodes.join('" OR "') + '")';
    }
    return querySuffix;
  };

  var hasPageFinishedLoading = function() {
    return _searchCursor === null;
  };

  return {
    // Note that an empty query results in all explorations being shown.
    executeSearchQuery: function(searchQuery, successCallback) {
      if (_lastQuery === searchQuery) {
        return;
      }

      var queryUrl = GALLERY_DATA_URL + '?q=' + encodeURI(searchQuery + _getSuffixForQuery());

      $http.get(queryUrl).success(function(data) {
        _lastQuery = searchQuery;
        _searchCursor = data.search_cursor;
        $rootScope.$broadcast('refreshGalleryData', data, hasPageFinishedLoading());
        if (successCallback) {
          successCallback();
        }
      });
    },
    loadMoreData: function(successCallback) {
       var queryUrl = GALLERY_DATA_URL + '?q=' + encodeURI(_lastQuery + _getSuffixForQuery());
      if (_searchCursor) {
        queryUrl += '&cursor=' + _searchCursor;
      }

      $http.get(queryUrl).success(function(data) {
        _searchCursor = data.search_cursor;
        if (successCallback) {
          successCallback(data, hasPageFinishedLoading());
        }
      });
    },
    init: function(selectedCategories, selectedLanguageCodes) {
      _selectedCategories = selectedCategories;
      _selectedLanguageCodes = selectedLanguageCodes;
    }
  };
}]);

oppia.controller('Gallery', [
    '$scope', '$http', '$rootScope', '$window', 'createExplorationButtonService',
    'oppiaDatetimeFormatter', 'oppiaDebouncer', 'urlService', 'GALLERY_DATA_URL',
    'searchService',
    function($scope, $http, $rootScope, $window, createExplorationButtonService,
             oppiaDatetimeFormatter, oppiaDebouncer, urlService, GALLERY_DATA_URL,
             searchService) {
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

  $scope.currentUserIsModerator = false;

  // SEARCH FUNCTIONALITY

  $scope.showBannerImage = true;
  $scope.$on('hasTypedInSearchBar', function() {
    $scope.showBannerImage = false;
  });

  $scope.getCategoryList = function() {
    return Object.keys($scope.selectedCategories);
  };

  $scope.LANGUAGE_CHOICES = GLOBALS.LANGUAGE_CODES_AND_NAMES.map(function(languageItem) {
    return {
      id: languageItem.code,
      text: languageItem.name
    };
  });

  $scope.allExplorationsInOrder = [];

  // Called when the page loads, and after every search query.
  var _refreshGalleryData = function(data, hasPageFinishedLoading) {
    $scope.searchIsLoading = false;
    $scope.allExplorationsInOrder = data.featured.concat(data['public']);
    $scope.finishedLoadingPage = hasPageFinishedLoading;
    $rootScope.loadingMessage = '';
  };

  $scope.pageLoaderIsBusy = false;
  $scope.showMoreExplorations = function(data) {
    if (!$rootScope.loadingMessage) {
      $scope.pageLoaderIsBusy = true;

      searchService.loadMoreData(function(data, hasPageFinishedLoading) {
        $scope.allExplorationsInOrder = $scope.allExplorationsInOrder.concat(
          data.featured).concat(data['public']);
        $scope.finishedLoadingPage = hasPageFinishedLoading;
        $scope.pageLoaderIsBusy = false;
      });
    }
  };

  $scope.$on('categorySelectionChanged', function(evt) {
    searchService.executeSearchQuery();
  });

  $scope.onLanguageCodeSelectionChange = function() {
    searchService.executeSearchQuery();
  };

  $scope.selectedCategories = {};
  $scope.selectedLanguageCodes = [];

  // Retrieves gallery data from the server.
  $http.get(GALLERY_DATA_URL).success(function(data) {
    if (data.is_moderator) {
      $scope.currentUserIsModerator = true;
    }

    var _categories = {};
    data['public'].map(function(expDict) {
      _categories[expDict.category] = true;
    });
    data.featured.map(function(expDict) {
      _categories[expDict.category] = true;
    });

    $scope.selectedCategories = _categories;
    $scope.selectedLanguageCodes = data.preferred_language_codes;

    searchService.init($scope.selectedCategories, $scope.selectedLanguageCodes);

    // TODO(sll): Page the initial load as well.
    _refreshGalleryData(data, true);

    if (data.username) {
      var urlParams = urlService.getUrlParams();
      if (urlParams.mode === 'create') {
        $scope.showCreateExplorationModal($scope.getCategoryList());
      }
    }
  });

  $scope.$on('refreshGalleryData', function(evt, data, hasPageFinishedLoading) {
    _refreshGalleryData(data, hasPageFinishedLoading);
  });

  // SIDEBAR-RELATED METHODS

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


oppia.controller('SearchBar', [
    '$scope', '$rootScope', '$timeout', 'searchService', 'oppiaDebouncer',
    function($scope, $rootScope, $timeout, searchService, oppiaDebouncer) {

  $scope.searchIsLoading = false;
  $scope.searchQuery = '';

  var _onSearchQueryChangeExec = function() {
    $scope.searchIsLoading = true;
    searchService.executeSearchQuery($scope.searchQuery, function() {
      $scope.searchIsLoading = false;
    });
  };

  var _hasTypedInSearchBar = false;

  $scope.onSearchQueryChange = function(evt) {
    if (!_hasTypedInSearchBar) {
      _hasTypedInSearchBar = true;
      $rootScope.$broadcast('hasTypedInSearchBar');
    }

    // Query immediately when the enter or space key is pressed.
    if (evt.keyCode == 13 || evt.keyCode == 32) {
      _onSearchQueryChangeExec();
    } else {
      oppiaDebouncer.debounce(_onSearchQueryChangeExec, 400)();
    }
  };
}]);
