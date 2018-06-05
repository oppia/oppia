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
    var _hasImagePreloaderServiceStarted = false;

    var _init = function(exploration) {
      _exploration = exploration;
      _states = exploration.states;
      _hasImagePreloaderServiceStarted = true;
    };

    /**
     * Gets the Url for the image file.
     * @param {string} filename - Filename of the image whose Url is to be
     *                            created.
     * @param {function} onLoadCallback - Function that is called when the
     *                                    Url of the loaded image is obtained.
     */
    var _getImageUrl = function(filename, onLoadCallback) {
      AssetsBackendApiService.loadImage(
        ExplorationContextService.getExplorationId(), filename)
        .then(function(loadedImageFile) {
          var objectUrl = URL.createObjectURL(loadedImageFile.data);
          onLoadCallback(objectUrl);
        });
    };

    /**
     * Gets image files names in Bfs order from the state.
     * @param {string} sourceStateName - The name of the starting state
     *                                        from which the filenames should
     *                                        be obtained.
     */
    var _getImageFilenamesInBfsOrder = function(sourceStateName) {
      var stateNamesInBfsOrder = (
        ComputeGraphService.computeBfsTraversalOfStates(
          _exploration.getInitialState().name,
          _exploration.getStates(),
          sourceStateName));
      var imageFilenames = [];

      stateNamesInBfsOrder.forEach(function(stateName) {
        var state = _states.getState(stateName);
        ExtractImageFilenamesFromStateService.getImageFilenamesInState(state)
          .forEach(function(filename) {
            imageFilenames.push(filename);
          });
      });
      return imageFilenames;
    };

    /**
     * Handles the loading of the image file.
     * @param {string} imageFilename - The filename of the image to be loaded.
     */
    var _loadImage = function(imageFilename) {
      AssetsBackendApiService.loadImage(
        ExplorationContextService.getExplorationId(), imageFilename
      ).then(function(loadedImage) {
        _filenamesOfImageCurrentlyDownloading = (
          _filenamesOfImageCurrentlyDownloading.filter(function(imageFilename) {
            return loadedImage.filename !== imageFilename;
          })
        );
        if (_filenamesOfImageToBeDownloaded.length > 0) {
          var nextImageFilename = _filenamesOfImageToBeDownloaded.shift();
          _filenamesOfImageCurrentlyDownloading.push(nextImageFilename);
          _loadImage(nextImageFilename);
        }
        if (_imageLoadedCallback[loadedImage.filename]) {
          var onLoadImageResolve = (
            (_imageLoadedCallback[loadedImage.filename]).resolveMethod);
          _getImageUrl(loadedImage.filename, onLoadImageResolve);
          _imageLoadedCallback[loadedImage.filename] = null;
        }
      });
    };

    /**
     * Initiates the image preloader beginning from the sourceStateName.
     * @param {string} sourceStateName - The name of the state from which
     *                                   preloader should start.
     */
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

    /**
     * Cancels the preloading of the images that are being downloaded.
     */
    var _cancelPreloading = function() {
      AssetsBackendApiService.abortAllCurrentImageDownloads();
      _filenamesOfImageCurrentlyDownloading = [];
    };

    /**
     * When the state changes, it decides whether to restart the preloader
     * starting from the 'stateName' state or not.
     * @param {string} stateName - The name of the state the user shifts to.
     */
    var _onStateChange = function(stateName) {
      if (stateName !== _exploration.getInitialState().name) {
        _imageLoadedCallback = {};
        var imageFilenamesInState = [];
        var noOfImageFilesCurrentlyDownloading = 0;
        var noOfImagesNeitherInCacheNorDownloading = 0;

        var state = _states.getState(stateName);
        imageFilenamesInState = (
          ExtractImageFilenamesFromStateService
            .getImageFilenamesInState(state));
        imageFilenamesInState.forEach(function(filename) {
          var isFileCurrentlyDownloading = (
            _filenamesOfImageCurrentlyDownloading.indexOf(filename) >= 0
          );
          if (!AssetsBackendApiService.isCached(filename) &&
              !isFileCurrentlyDownloading) {
            noOfImagesNeitherInCacheNorDownloading += 1;
          }
          if (isFileCurrentlyDownloading) {
            noOfImageFilesCurrentlyDownloading += 1;
          }
        });
        if (noOfImagesNeitherInCacheNorDownloading > 0 &&
            noOfImageFilesCurrentlyDownloading <= 1) {
          _cancelPreloading();
          _kickOffImagePreloader(stateName);
        }
      }
    };

    return {
      init: _init,
      kickOffImagePreloader: _kickOffImagePreloader,
      onStateChange: _onStateChange,
      isLoadingImageFile: function(filename) {
        return _filenamesOfImageCurrentlyDownloading.indexOf(filename) !== -1;
      },
      restartImagePreloader: function(sourceStateName) {
        _cancelPreloading();
        _kickOffImagePreloader(sourceStateName);
      },
      getFilenamesOfImageCurrentlyDownloading: function() {
        return _filenamesOfImageCurrentlyDownloading;
      },
      getImageUrl: function(filename) {
        return $q(function(resolve, reject){
          if (AssetsBackendApiService.isCached(filename) ||
            !_hasImagePreloaderServiceStarted) {
            _getImageUrl(filename, resolve);
          } else {
            _imageLoadedCallback[filename] = {
              resolveMethod: resolve,
              rejectMethod: reject
            };
          }
        });
      }
    };
  }
]);
