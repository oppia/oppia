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
  '$q', '$uibModal', 'ExplorationContextService', 'AssetsBackendApiService',
  'ExplorationPlayerStateService', 'UrlInterpolationService',
  'ComputeGraphService', 'ExtractImageFilenamesFromStateService',
  function($q, $uibModal, ExplorationContextService, AssetsBackendApiService,
      ExplorationPlayerStateService, UrlInterpolationService,
      ComputeGraphService, ExtractImageFilenamesFromStateService) {
    var MAX_NUM_IMAGE_FILES_TO_DOWNLOAD_SIMULTANEOUSLY = 3;

    var _filenamesOfImageCurrentlyDownloading = [];
    var _filenamesOfImageToBeDownloaded = [];
    var _exploration = null;
    // imageLoadedCallback is an object of objects (identified by the filenames
    // which are being downloaded at the time they are required by the 
    // directive).The object contains the resolve method of the promise 
    // attached with getInImageUrl method.
    var _imageLoadedCallback = {};
    var _recentlyRequestedImageFilenames = [];

    var _init = function(exploration) {
      _exploration = exploration;
      _states = exploration.states;
    };

    var _removeFromRecentlyRequestedImageFilenames = function(filename) {
      var index = _recentlyRequestedImageFilenames.indexOf(filename);
      if (index > -1) {
        _recentlyRequestedImageFilenames.splice(index, 1);
      }
    };

    var _getUrlUsingFileInCache = function(filename, onLoadCallback) {
      AssetsBackendApiService.loadImage(
        ExplorationContextService.getExplorationId(), filename)
        .then(function(loadedImageFile) {
          var objectUrl = URL.createObjectURL(loadedImageFile.data);
          _removeFromRecentlyRequestedImageFilenames(loadedImageFile.filename);
          if (onLoadCallback) {
            onLoadCallback(objectUrl);
          }
        });
    };

    /**
    * Called when an image file finishes loading.
    * @param {string} imageFilename - Filename of the image file that
    *                                 finished loading.
    */

    var _onFinishedLoadingImage = function(imageFilename, onLoadImageResolve) {
      if (_recentlyRequestedImageFilenames.indexOf(imageFilename) !== -1) {
        _getUrlUsingFileInCache(imageFilename, onLoadImageResolve);
      }
    };

    var _getImageFilenamesInBfsOrder = function(sourceStateName) {
      var stateNamesInBfsOrder = (
        ComputeGraphService.computeBfsTraversalOfStates(
          _exploration.getInitialState().name,
          _exploration.getStates(),
          sourceStateName));
      var imageFilenames = [];

      stateNamesInBfsOrder.forEach(function(stateName) {
        var state = _states.getState(stateName);
        ExtractImageFilenamesFromStateService.getImageFilenamesInState(state).
          forEach(function(filename) {
            imageFilenames.push(filename);
          });
      });
      return imageFilenames;
    };

    var _loadImage = function(imageFilename) {
      AssetsBackendApiService.loadImage(
        ExplorationContextService.getExplorationId(), imageFilename
      ).then(function(loadedImage) {
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
        if (_imageLoadedCallback[loadedImage.filename]) {
          var onLoadImageResolve = (
            (_imageLoadedCallback[loadedImage.filename]).resolve);
          _onFinishedLoadingImage(loadedImage.filename, onLoadImageResolve);
          _imageLoadedCallback[loadedImage.filename] = null;
        }
      });
    };

    var _kickOffImagePreloader = function(sourceStateName) {
      _filenamesOfImageToBeDownloaded = (
        _getImageFilenamesInBfsOrder(sourceStateName));
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
      if(stateName !== _exploration.getInitialState().name) {
        _imageLoadedCallback = {};
        var imageFilenamesInState = [];
        var imageFilenamesInStateCurrentlyBeingRequested = [];
        // Images that are not there in the cache and are not currently
        // being downloaded
        var imagesNeitherInCacheNorBeingRequested = [];

        var state = _states.getState(stateName);
        imageFilenamesInState = (
          ExtractImageFilenamesFromStateService
            .getImageFilenamesInState(state));
        imageFilenamesInState.forEach(function(filename) {
          if (!AssetsBackendApiService.isCached(filename) &&
            (_filenamesOfImageCurrentlyDownloading.indexOf(filename) === -1)) {
            imagesNeitherInCacheNorBeingRequested.push(filename);
          }
          if (_filenamesOfImageCurrentlyDownloading.indexOf(filename) !== -1) {
            imageFilenamesInStateCurrentlyBeingRequested.push(filename);
          }
        });
        if (imagesNeitherInCacheNorBeingRequested.length &&
          imageFilenamesInStateCurrentlyBeingRequested.length <= 1) {
          _cancelPreloading();
          _kickOffImagePreloader(stateName);
        }
      }
    };

    return {
      init: function(exploration) {
        _init(exploration);
      },
      kickOffImagePreloader: function(sourceStateName) {
        _kickOffImagePreloader(sourceStateName);
      },
      onStateChange: _onStateChange,
      addToRecentlyRequestedImageFilenames: function(filename) {
        _recentlyRequestedImageFilenames.push(filename);
      },
      removeFromRecentlyRequestedImageFilenames:
        _removeFromRecentlyRequestedImageFilenames,
      isLoadingImageFile: function(filename) {
        return _filenamesOfImageCurrentlyDownloading.indexOf(filename) !== -1;
      },
      getFilenamesOfImageCurrentlyDownloading: function() {
        return _filenamesOfImageCurrentlyDownloading;
      },
      getImageUrl: function(filename) {
        return $q(function(resolve, reject){
          if (AssetsBackendApiService.isCached(filename)) {
            _getUrlUsingFileInCache(filename, resolve, reject);
          } else {
            _imageLoadedCallback[filename] = {
              'resolve': resolve,
              'reject': reject
            };
          }
        });
      }
    };
  }
]);
