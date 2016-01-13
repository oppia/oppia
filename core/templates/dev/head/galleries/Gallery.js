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

// Overwrite the default ui-bootstrap carousel template to remove the
// on-mouseover behaviour, as well as the left and right arrows.
angular.module('template/carousel/carousel.html', []).run([
    '$templateCache', function($templateCache) {
  $templateCache.put('template/carousel/carousel.html',
    '<div class=\"carousel\" ng-swipe-right=\"prev()\" ' +
    '     ng-swipe-left=\"next()\">\n' +
    '  <ol class=\"carousel-indicators\" ng-show=\"slides.length > 1\">\n' +
    '    <li ng-repeat=\"slide in slides track by $index\" ' +
    '        ng-class=\"{active: isActive(slide)}\" ' +
    '        ng-click=\"select(slide)\"></li>\n' +
    '  </ol>\n' +
    '  <div class=\"carousel-inner\" ng-transclude></div>\n' +
    '</div>\n');
}]);

oppia.constant('GALLERY_DATA_URL', '/galleryhandler/data');

// Keeps track of the current category and language selections.
oppia.factory('selectionDataService', [function() {
  var currentlySelectedCategories = [];
  var currentlySelectedLanguageCodes = [];

  return {
    getCurrentlySelectedCategories: function() {
      return angular.copy(currentlySelectedCategories);
    },
    getCurrentlySelectedLanguageCodes: function() {
      return angular.copy(currentlySelectedLanguageCodes);
    },
    clearCategories: function() {
      currentlySelectedCategories = [];
    },
    clearLanguageCodes: function() {
      currentlySelectedLanguageCodes = [];
    },
    addCategoriesToSelection: function(newCategories) {
      newCategories.forEach(function(category) {
        if (currentlySelectedCategories.indexOf(category) === -1) {
          currentlySelectedCategories.push(category);
        }
      });
    },
    addLanguageCodesToSelection: function(newLanguageCodes) {
      newLanguageCodes.forEach(function(languageCode) {
        if (currentlySelectedLanguageCodes.indexOf(languageCode) === -1) {
          currentlySelectedLanguageCodes.push(languageCode);
        }
      });
    },
    removeCategoriesFromSelection: function(removedCategories) {
      removedCategories.forEach(function(category) {
        var index = currentlySelectedCategories.indexOf(category);
        if (index !== -1) {
          currentlySelectedCategories.splice(index, 1);
        }
      });
    },
    removeLanguageCodesFromSelection: function(removedLanguageCodes) {
      removedLanguageCodes.forEach(function(languageCode) {
        var index = currentlySelectedLanguageCodes.indexOf(languageCode);
        if (index !== -1) {
          currentlySelectedLanguageCodes.splice(index, 1);
        }
      });
    }
  };
}]);

oppia.factory('searchService', [
    '$http', '$rootScope', 'GALLERY_DATA_URL', 'selectionDataService',
    function($http, $rootScope, GALLERY_DATA_URL, selectionDataService) {
  var _lastQuery = null;
  var _lastSelectedCategories = {};
  var _lastSelectedLanguageCodes = {};
  var _searchCursor = null;

  // Appends a suffix to the query describing allowed category and language
  // codes to filter on.
  var _getSuffixForQuery = function() {
    var querySuffix = '';

    var categories = selectionDataService.getCurrentlySelectedCategories();
    var categorySuffix = '';
    categories.forEach(function(category) {
      if (categorySuffix) {
        categorySuffix += '" OR "';
      }
      categorySuffix += category;
    });
    if (categorySuffix) {
      querySuffix += ' category=("' + categorySuffix + '")';
    }

    var languageCodes = (
      selectionDataService.getCurrentlySelectedLanguageCodes());
    var languageCodeSuffix = '';
    languageCodes.forEach(function(languageCode) {
      if (languageCodeSuffix) {
        languageCodeSuffix += '" OR "';
      }
      languageCodeSuffix += languageCode;
    });
    if (languageCodeSuffix) {
      querySuffix += ' language_code=("' + languageCodeSuffix + '")';
    }

    return querySuffix;
  };

  var hasPageFinishedLoading = function() {
    return _searchCursor === null;
  };

  var _isCurrentlyFetchingResults = false;

  return {
    // Note that an empty query results in all explorations being shown.
    executeSearchQuery: function(searchQuery, successCallback) {
      var queryUrl = GALLERY_DATA_URL + '?q=' + encodeURI(
        searchQuery + _getSuffixForQuery());

      _isCurrentlyFetchingResults = true;
      $http.get(queryUrl).success(function(data) {
        _lastQuery = searchQuery;
        _searchCursor = data.search_cursor;
        $rootScope.$broadcast(
          'refreshGalleryData', data, hasPageFinishedLoading());
        _isCurrentlyFetchingResults = false;
      });

      if (successCallback) {
        successCallback();
      }
    },
    loadMoreData: function(successCallback) {
      // If a new query is still being sent, do not fetch more results.
      if (_isCurrentlyFetchingResults) {
        return;
      }

      var queryUrl = GALLERY_DATA_URL + '?q=' + encodeURI(
        _lastQuery + _getSuffixForQuery());

      if (_searchCursor) {
        queryUrl += '&cursor=' + _searchCursor;
      }

      _isCurrentlyFetchingResults = true;
      $http.get(queryUrl).success(function(data) {
        _searchCursor = data.search_cursor;
        _isCurrentlyFetchingResults = false;
        if (successCallback) {
          successCallback(data, hasPageFinishedLoading());
        }
      });
    }
  };
}]);

oppia.controller('Gallery', [
  '$scope', '$http', '$rootScope', '$modal', '$window', '$timeout',
  'ExplorationCreationButtonService', 'oppiaDebouncer', 'urlService',
  'GALLERY_DATA_URL', 'CATEGORY_LIST', 'searchService', 'selectionDataService',
  function(
      $scope, $http, $rootScope, $modal, $window, $timeout,
      createExplorationButtonService, oppiaDebouncer, urlService,
      GALLERY_DATA_URL, CATEGORY_LIST, searchService, selectionDataService) {
    $rootScope.loadingMessage = 'Loading';

    $http.get('/default_gallery_categories').success(function(data) {
      $scope.galleryGroups = data.activity_summary_dicts_by_category;

      $rootScope.$broadcast(
        'preferredLanguageCodesLoaded', data.preferred_language_codes);

      if (data.username) {
        if (urlService.getUrlParams().mode === 'create') {
          $scope.showCreateExplorationModal(CATEGORY_LIST);
        }
      }

      $rootScope.loadingMessage = '';
    });

    $scope.leftCheck = function(ind) {
      var tilesHtml = '.oppia-gallery-tiles:eq(n)'.replace('n', ind);

      // Checks if it is at the left most point.
      return parseInt($(tilesHtml).css('left')) >= 0;
    };

    $scope.scrollLeft = function(ind) {
      if (!$scope.leftCheck(ind)) {
        var tilesHtml = '.oppia-gallery-tiles:eq(n)'.replace('n', ind);
        $(tilesHtml).animate({
          left: '+=211.953'
        }, 500);
      }
    };

    $scope.rightLowerLimits = [];
    $scope.carouselDisplayWidth = $('.oppia-gallery-tiles-carousel').width();
    $scope.rightCheck = function(ind, galleryGroup) {
      var leftLowerLimit = $scope.rightLowerLimits[ind];

      var tilesHtml = '.oppia-gallery-tiles:eq(n)'.replace('n', ind);
      var left = parseInt($(tilesHtml).css('left'));

      var currCarouselWidth = $('.oppia-gallery-tiles-carousel').width();
      if (!leftLowerLimit || $scope.carouselDisplayWidth != currCarouselWidth) {
        var tileWidth = Math.floor(galleryGroup.length * 211.953);
        var galleryLength = $('.oppia-gallery-tiles-carousel').width();
        var leftLowerLimit = galleryLength - tileWidth;
        $scope.rightLowerLimits[ind] = leftLowerLimit;
      }
      // Checks if the elements are at the right most point
      return left <= leftLowerLimit;
    };

    $scope.scrollRight = function(ind, galleryGroup) {
      if (!$scope.rightCheck(ind, galleryGroup)) {
        var tilesHtml = '.oppia-gallery-tiles:eq(n)'.replace('n', ind);

        $(tilesHtml).animate({
          left: '-=211.953'
        }, 500);
      }
    };

    $window.addEventListener('scroll', function() {
      var oppiaBanner = $('.oppia-gallery-banner-container');
      var oppiaTagline = $('.oppia-gallery-banner-tagline');
      var bannerVanishRate = oppiaBanner.height();
      var taglineVanishRate = oppiaBanner.height() * 0.3;

      oppiaBanner.css({
        opacity: (bannerVanishRate - $(window).scrollTop()) / bannerVanishRate
      });
      oppiaTagline.css({
        opacity: (taglineVanishRate - $(window).scrollTop()) / taglineVanishRate
      });
    });

    $scope.CAROUSEL_INTERVAL = 3500;
    $scope.CAROUSEL_SLIDES = GLOBALS.CAROUSEL_SLIDES_CONFIG || [];

    // Preload images, otherwise they will only start showing up some time after
    // the carousel slide appears. See: http://stackoverflow.com/q/1373142
    for (var i = 0; i < $scope.CAROUSEL_SLIDES.length; i++) {
      var pic = new Image();
      pic.src = '/images/splash/' + $scope.CAROUSEL_SLIDES[i].image_filename;
    }

    $scope.showCreateExplorationModal = function() {
      createExplorationButtonService.showCreateExplorationModal(CATEGORY_LIST);
    };

    $scope.inSplashMode = ($scope.CAROUSEL_SLIDES.length > 0);
    $scope.$on('isInSearchMode', function() {
      removeSplashCarousel();
    });

    var removeSplashCarousel = function() {
      if ($scope.inSplashMode) {
        $('.oppia-gallery-container').fadeOut(function() {
          $scope.inSplashMode = false;
          $timeout(function() {
            $('.oppia-gallery-container').fadeIn();
          }, 50);
        });
      }
    };

    // SEARCH FUNCTIONALITY

    $scope.allExplorationsInOrder = [];

    // Called when the page loads, and after every search query.
    var _refreshGalleryData = function(data, hasPageFinishedLoading) {
      $scope.searchIsLoading = false;
      $scope.allExplorationsInOrder = data.explorations_list;
      $scope.finishedLoadingPage = hasPageFinishedLoading;
      $rootScope.loadingMessage = '';
    };

    $scope.pageLoaderIsBusy = false;
    $scope.showMoreExplorations = function() {
      if (!$rootScope.loadingMessage) {
        $scope.pageLoaderIsBusy = true;

        searchService.loadMoreData(function(data, hasPageFinishedLoading) {
          $scope.allExplorationsInOrder = $scope.allExplorationsInOrder.concat(
            data.explorations_list);
          $scope.finishedLoadingPage = hasPageFinishedLoading;
          $scope.pageLoaderIsBusy = false;
        });
      }
    };

    $scope.$on(
      'refreshGalleryData',
      function(evt, data, hasPageFinishedLoading) {
        _refreshGalleryData(data, hasPageFinishedLoading);
      }
    );

    $scope.showFullGalleryGroup = function(galleryGroup) {
      selectionDataService.clearCategories();
      selectionDataService.addCategoriesToSelection(galleryGroup.categories);
      // TODO(sll): is this line correct?
      selectionDataService.clearLanguageCodes();
      searchService.executeSearchQuery('', function() {
        removeSplashCarousel();
      });
      // TODO(sll): Clear the search query from the search bar, too.
    };
  }
]);

oppia.controller('SearchBar', [
  '$scope', '$rootScope', 'searchService', 'oppiaDebouncer',
  'ExplorationCreationButtonService', 'urlService', 'CATEGORY_LIST',
  'selectionDataService',
  function(
      $scope, $rootScope, searchService, oppiaDebouncer,
      createExplorationButtonService, urlService, CATEGORY_LIST,
      selectionDataService) {
    $scope.searchIsLoading = false;
    $scope.ALL_CATEGORIES = CATEGORY_LIST.map(function(categoryName) {
      return {
        id: categoryName,
        text: categoryName
      };
    });
    $scope.ALL_LANGUAGE_CODES = GLOBALS.LANGUAGE_CODES_AND_NAMES.map(
      function(languageItem) {
        return {
          id: languageItem.code,
          text: languageItem.name
        };
      }
    );

    $scope.searchQuery = '';
    $scope.selectionDetails = {
      categories: {
        description: '',
        itemsName: 'categories',
        masterList: $scope.ALL_CATEGORIES,
        numSelections: 0,
        selections: {},
        summary: ''
      },
      languageCodes: {
        description: '',
        itemsName: 'languages',
        masterList: $scope.ALL_LANGUAGE_CODES,
        numSelections: 0,
        selections: {},
        summary: ''
      }
    };

    // Update the description, numSelections and summary fields of the relevant
    // entry of $scope.selectionDetails.
    var _updateSelectionDetails = function(itemsType) {
      var itemsName = $scope.selectionDetails[itemsType].itemsName;
      var masterList = $scope.selectionDetails[itemsType].masterList;

      var selectedItems = [];
      for (var i = 0; i < masterList.length; i++) {
        if ($scope.selectionDetails[itemsType].selections[masterList[i].id]) {
          selectedItems.push(masterList[i].text);
        }
      }

      var totalCount = selectedItems.length;
      $scope.selectionDetails[itemsType].numSelections = totalCount;

      $scope.selectionDetails[itemsType].summary = (
        totalCount === 0 ? (
          'All ' + itemsName.charAt(0).toUpperCase() + itemsName.substr(1)) :
        totalCount === 1 ? selectedItems[0] :
        totalCount + ' ' + itemsName);

      $scope.selectionDetails[itemsType].description = (
        selectedItems.length > 0 ? selectedItems.join(', ') :
        'All ' + itemsName + ' selected');
    };

    $scope.toggleSelection = function(itemsType, optionName) {
      var selections = $scope.selectionDetails[itemsType].selections;
      if (!selections.hasOwnProperty(optionName)) {
        selections[optionName] = true;
        if (itemsType === 'categories') {
          selectionDataService.addCategoriesToSelection([optionName]);
        } else if (itemsType === 'languageCodes') {
          selectionDataService.addLanguageCodesToSelection([optionName]);
        } else {
          throw Error('Invalid item type: ' + itemsType);
        }
      } else {
        selections[optionName] = !selections[optionName];
        if (itemsType === 'categories') {
          selectionDataService.removeCategoriesFromSelection([optionName]);
        } else if (itemsType === 'languageCodes') {
          selectionDataService.removeLanguageCodesFromSelection([optionName]);
        } else {
          throw Error('Invalid item type: ' + itemsType);
        }
      }

      _updateSelectionDetails(itemsType);
      _onSearchQueryChangeExec();
    };

    var _searchBarFullyLoaded = false;

    var _isInSearchMode = Boolean(urlService.getUrlParams().q);
    var _onSearchQueryChangeExec = function() {
      $scope.searchIsLoading = true;
      searchService.executeSearchQuery($scope.searchQuery, function() {
        $scope.searchIsLoading = false;
        if (!_isInSearchMode && _searchBarFullyLoaded) {
          _isInSearchMode = true;
          $rootScope.$broadcast('isInSearchMode');
        }
      });
    };

    // Initialize the selection descriptions and summaries.
    for (var itemsType in $scope.selectionDetails) {
      _updateSelectionDetails(itemsType);
    }

    $scope.onSearchQueryChange = function(evt) {
      // Query immediately when the enter or space key is pressed.
      if (evt.keyCode == 13 || evt.keyCode == 32) {
        _onSearchQueryChangeExec();
      } else {
        oppiaDebouncer.debounce(_onSearchQueryChangeExec, 400)();
      }
    };

    $scope.$on(
      'preferredLanguageCodesLoaded',
      function(evt, preferredLanguageCodesList) {
        for (var i = 0; i < preferredLanguageCodesList.length; i++) {
          var selections = $scope.selectionDetails.languageCodes.selections;
          var languageCode = preferredLanguageCodesList[i];
          if (!selections.hasOwnProperty(languageCode)) {
            selections[languageCode] = true;
          } else {
            selections[languageCode] = !selections[languageCode];
          }
        }
        _updateSelectionDetails('languageCodes');
        _searchBarFullyLoaded = true;
      }
    );

    $scope.showCreateExplorationModal = function() {
      createExplorationButtonService.showCreateExplorationModal(
        CATEGORY_LIST);
    };
    $scope.showUploadExplorationModal = function() {
      createExplorationButtonService.showUploadExplorationModal(
        CATEGORY_LIST);
    };
  }
]);
