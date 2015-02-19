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

oppia.factory('searchService', [
    '$http', '$rootScope', 'GALLERY_DATA_URL',
    function($http, $rootScope, GALLERY_DATA_URL) {
  var _CATEGORY_LIST = [
    'Architecture',
    'Art',
    'Biology',
    'Business',
    'Chemistry',
    'Computing',
    'Economics',
    'Education',
    'Engineering',
    'Environment',
    'Geography',
    'Government',
    'Hobbies',
    'Languages',
    'Law',
    'Life Skills',
    'Mathematics',
    'Medicine',
    'Music',
    'Philosophy',
    'Physics',
    'Programming',
    'Psychology',
    'Puzzles',
    'Reading',
    'Religion',
    'Sport',
    'Statistics',
    'Welcome'
  ];
  var _lastQuery = null;
  var _lastSelectedCategories = {};
  var _lastSelectedLanguageCodes = {};
  var _searchCursor = null;

  // Appends a suffix to the query describing allowed category and language
  // codes to filter on.
  var _getSuffixForQuery = function(selectedCategories, selectedLanguageCodes) {
    var querySuffix = '';

    var _categories = '';
    for (var key in selectedCategories) {
      if (selectedCategories[key]) {
        if (_categories) {
          _categories += '" OR "';
        }
        _categories += key;
      }
    }
    if (_categories) {
      querySuffix += ' category=("' + _categories + '")';
    }

    var _languageCodes = '';
    for (var key in selectedLanguageCodes) {
      if (selectedLanguageCodes[key]) {
        if (_languageCodes) {
          _languageCodes += '" OR "';
        }
        _languageCodes += key;
      }
    }
    if (_languageCodes) {
      querySuffix += ' language_code=("' + _languageCodes + '")';
    }

    return querySuffix;
  };

  var hasPageFinishedLoading = function() {
    return _searchCursor === null;
  };

  return {
    // Note that an empty query results in all explorations being shown.
    executeSearchQuery: function(searchQuery, selectedCategories, selectedLanguageCodes, successCallback) {
      var queryUrl = GALLERY_DATA_URL + '?q=' + encodeURI(
        searchQuery + _getSuffixForQuery(selectedCategories, selectedLanguageCodes));

      $http.get(queryUrl).success(function(data) {
        _lastQuery = searchQuery;
        _lastSelectedCategories = angular.copy(selectedCategories);
        _lastSelectedLanguageCodes = angular.copy(selectedLanguageCodes);
        _searchCursor = data.search_cursor;
        $rootScope.$broadcast('refreshGalleryData', data, hasPageFinishedLoading());
      });

      if (successCallback) {
        successCallback();
      }
    },
    loadMoreData: function(successCallback) {
       var queryUrl = GALLERY_DATA_URL + '?q=' + encodeURI(
        _lastQuery + _getSuffixForQuery(_lastSelectedCategories, _lastSelectedLanguageCodes));

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
    getCategoryList: function() {
      return _CATEGORY_LIST;
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
  $scope.CAROUSEL_INTERVAL = 2500;

  $scope.CAROUSEL_SLIDES = [{
    explorationId: '14',
    explorationSubject: 'astronomy',
    imageUrl: '/images/splash-image-0.jpg'
  }, {
    explorationId: '9',
    explorationSubject: 'music',
    imageUrl: '/images/splash-image-1.jpg'
  }, {
    explorationId: '1',
    explorationSubject: 'programming',
    imageUrl: '/images/splash-image-2.jpg'
  }];

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
    'Computing': _COLOR_SHARKFIN,
    'Economics': _COLOR_SALMON,
    'Education': _COLOR_TEAL,
    'Engineering': _COLOR_GUNMETAL,
    'Environment': _COLOR_GUNMETAL,
    'Geography': _COLOR_SALMON,
    'Government': _COLOR_SALMON,
    'Hobbies': _COLOR_TEAL,
    'Languages': _COLOR_SUNNYSIDE,
    'Law': _COLOR_SALMON,
    'Life Skills': _COLOR_TEAL,
    'Mathematics': _COLOR_SHARKFIN,
    'Medicine': _COLOR_GUNMETAL,
    'Music': _COLOR_SUNNYSIDE,
    'Philosophy': _COLOR_SALMON,
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

  $scope.showCreateExplorationModal = function() {
    createExplorationButtonService.showCreateExplorationModal(searchService.getCategoryList());
  };

  $scope.currentUserIsModerator = false;

  $scope.inSplashMode = true;
  $scope.$on('hasChangedSearchQuery', function() {
    $scope.inSplashMode = false;
  });

  // SEARCH FUNCTIONALITY

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

  $scope.$on('refreshGalleryData', function(evt, data, hasPageFinishedLoading) {
    _refreshGalleryData(data, hasPageFinishedLoading);
  });

  // Retrieves gallery data from the server.
  $http.get(GALLERY_DATA_URL).success(function(data) {
    $scope.currentUserIsModerator = Boolean(data.is_moderator);

    $rootScope.$broadcast(
      'preferredLanguageCodesLoaded', data.preferred_language_codes);

    // TODO(sll): Page the initial load as well.
    _refreshGalleryData(data, true);

    if (data.username) {
      if (urlService.getUrlParams().mode === 'create') {
        $scope.showCreateExplorationModal(searchService.getCategoryList());
      }
    }
  });
}]);


oppia.controller('SearchBar', [
    '$scope', '$rootScope', 'searchService', 'oppiaDebouncer', 'createExplorationButtonService', 'urlService',
    function($scope, $rootScope, searchService, oppiaDebouncer, createExplorationButtonService, urlService) {

  $scope.searchIsLoading = false;
  $scope.ALL_CATEGORIES = searchService.getCategoryList().map(function(categoryName) {
    return {
      id: categoryName,
      text: categoryName
    }
  });
  $scope.ALL_LANGUAGE_CODES = GLOBALS.LANGUAGE_CODES_AND_NAMES.map(function(languageItem) {
    return {
      id: languageItem.code,
      text: languageItem.name
    };
  });

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
      totalCount === 0 ? 'All ' + itemsName.charAt(0).toUpperCase() + itemsName.substr(1) :
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
    } else {
      selections[optionName] = !selections[optionName];
    }

    _updateSelectionDetails(itemsType);
    _onSearchQueryChangeExec();
  };

  var _searchBarFullyLoaded = false;

  var _hasChangedSearchQuery = Boolean(urlService.getUrlParams().q);
  var _onSearchQueryChangeExec = function() {
    $scope.searchIsLoading = true;
    searchService.executeSearchQuery(
        $scope.searchQuery, $scope.selectionDetails.categories.selections,
        $scope.selectionDetails.languageCodes.selections, function() {
      $scope.searchIsLoading = false;
      if (!_hasChangedSearchQuery && _searchBarFullyLoaded) {
        _hasChangedSearchQuery = true;
        $rootScope.$broadcast('hasChangedSearchQuery');
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

  $scope.$on('preferredLanguageCodesLoaded', function(evt, preferredLanguageCodesList) {
    for (var i = 0; i < preferredLanguageCodesList.length; i++) {
      $scope.toggleSelection('languageCodes', preferredLanguageCodesList[i]);
    }
    _searchBarFullyLoaded = true;
  });

  $scope.showCreateExplorationModal = function() {
    createExplorationButtonService.showCreateExplorationModal(searchService.getCategoryList());
  };
  $scope.showUploadExplorationModal = function() {
    createExplorationButtonService.showUploadExplorationModal(searchService.getCategoryList());
  };
}]);
