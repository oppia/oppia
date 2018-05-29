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
 * @fileoverview Service to preload image into AssetsBackendApiService's cache.
 */

oppia.factory('ImagePreloaderService', [
  '$uibModal', 'ExplorationContextService', 'AssetsBackendApiService',
  'ExplorationPlayerStateService', 'UrlInterpolationService',
  'ComputeGraphService', 'ExtractImageFilenamesFromStateService',
  function($uibModal, ExplorationContextService, AssetsBackendApiService,
      ExplorationPlayerStateService, UrlInterpolationService,
      ComputeGraphService, ExtractImageFilenamesFromStateService) {
    var MAX_NUM_IMAGE_FILES_TO_DOWNLOAD_SIMULTANEOUSLY = 3;

    var _filenamesOfImageCurrentlyDownloading = [];
    var _filenamesOfImageToBeDownloaded = [];
    var _exploration = null;
    var _imageLoadedCallback = null;
    var _recentlyRequestedImageFilenames = [];

    var _immediatelyLoadImage = null;
    var _init = function(exploration) {
      _exploration = exploration;
      _states = exploration.states;
    };

    var _getImageFilenamesInBfsOrder = function(sourceStateName) {
      console.log("entered GetImageFilenamesInBfsOrder");
      var stateNamesInBfsOrder =
        ComputeGraphService.computeBfsTraversalOfStates(
          _exploration.getInitialState().name,
          _exploration.getStates(),
          sourceStateName);
      var imageFilenames = [];
  
      stateNamesInBfsOrder.forEach(function(stateName) {
        var state = _states.getState(stateName);
        ExtractImageFilenamesFromStateService.getImageFilenamesInState(state).
          forEach(function(filename) {
            imageFilenames.push(filename);
          });
      });
      console.log(" In _getImageFilesInBfsOrder -- Image Filenames are "+ imageFilenames);
      return imageFilenames;
    };

    var _loadImage = function(imageFilename) {
      console.log("ImagePreloaderService  _loadImage get the images before hand " + imageFilename);
      AssetsBackendApiService.loadImage(
        ExplorationContextService.getExplorationId(), imageFilename
      ).then(function(loadedImage) {
        console.log("The image has been loaded with the help of the _loadImage in ImagePreloader , the filename is " + loadedImage.filename);
        for (var i = 0;
          i < _filenamesOfImageCurrentlyDownloading.length; i++) {
          if (_filenamesOfImageCurrentlyDownloading[i] ===
              loadedImage.filename) {
            _filenamesOfImageCurrentlyDownloading.splice(i, 1);
            break;
          }
        }
        if (_filenamesOfImageToBeDownloaded.length > 0) {
          var nextImageFilename = _filenamesOfImageToBeDownloaded.shift();
          _filenamesOfImageCurrentlyDownloading.push(nextImageFilename);
          _loadImage(nextImageFilename);
        }
        if(_immediatelyLoadImage) {
          _cancelPreloading();
          _kickOffImagePreloader(_immediatelyLoadImage.sourceStateName);
        }
        if(_imageLoadedCallback) {
          _imageLoadedCallback(loadedImage.filename);
        }
      });
    };

    var _kickOffImagePreloader = function(sourceStateName) {
      _filenamesOfImageToBeDownloaded =
        _getImageFilenamesInBfsOrder(sourceStateName);
      while (_filenamesOfImageCurrentlyDownloading.length <
        MAX_NUM_IMAGE_FILES_TO_DOWNLOAD_SIMULTANEOUSLY &&
          _filenamesOfImageToBeDownloaded.length > 0) {
        var imageFilename = _filenamesOfImageToBeDownloaded.shift();
        _filenamesOfImageCurrentlyDownloading.push(imageFilename);
        _loadImage(imageFilename);
      }
    };

    var _cancelPreloading = function() {
      AssetsBackendApiService.abortAllCurrentImageDownloads();
      _filenamesOfImageCurrentlyDownloading = [];
    };

    var _onStateChange = function(stateName) {
      console.log("entered on state change  ");
      var imageFilenamesInState = [];
      var imageFilenamesInStateCurrentlyBeingRequested = [];
      // Images that are not there in the cache and are not currently being downloaded
      var imagesNeitherInCacheNorBeingRequested = [];
      
      var state = _states.getState(stateName);
      imageFilenamesInState = ExtractImageFilenamesFromStateService.getImageFilenamesInState(state);
      
      imageFilenamesInState.forEach(function(filename) {
        if (! AssetsBackendApiService.isCached(filename) &&
          (_filenamesOfImageCurrentlyDownloading.indexOf(filename) === -1)) {
          imagesNeitherInCacheNorBeingRequested.push(filename);
          }
        if(_filenamesOfImageCurrentlyDownloading.indexOf(filename) !== -1) {
          imageFilenamesInStateCurrentlyBeingRequested.push(filename);
        }
      });
      if (imagesNeitherInCacheNorBeingRequested.length &&
        imageFilenamesInStateCurrentlyBeingRequested.length <=1) {
        _cancelPreloading();
        _kickOffImagePreloader(stateName);
      }
    };

    return {
      init: function(exploration) {
        _init(exploration);
      },
      kickOffImagePreloader: function(sourceStateName) {
        console.log("entered ImagePreloader Kickoff");
        _kickOffImagePreloader(sourceStateName);
      },
      onStateChange: _onStateChange,
      addToRecentlyRequestedImageFilenames: function(filename) {
        _recentlyRequestedImageFilenames.push(filename);
      },
      getRecentlyRequestedImageFilenames: function(filename) {
        return _recentlyRequestedImageFilenames;
      },
      removeFromRecentlyRequestedImageFilenames: function(filename) {
        var index = _recentlyRequestedImageFilenames.indexOf(filename);
        if(index > -1) {
          _recentlyRequestedImageFilenames.splice(index,1);
        }
      },
      setImageLoadedCallback: function(imageLoadedCallback) {
        _imageLoadedCallback = imageLoadedCallback;
      },
      immediatelyLoadImage: function(sourceStateName, filenames) {
        _immediatelyLoadImage = {
          'sourceStateName': sourceStateName
        };
        _cancelPreloading();
        // In this case we request for all the files whose filename was received.
        filenames.forEach(function(filename) {
          _loadImage(filename);
        });
      },
      isLoadingImageFile: function(filename) {
        return _filenamesOfImageCurrentlyDownloading.indexOf(filename) !== -1;
      },
      getFilenamesOfImageCurrentlyDownloading: function() {
        return _filenamesOfImageCurrentlyDownloading;
      }
    };
  }
]);
