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
  '$q', '$uibModal', 'ContextService', 'AssetsBackendApiService',
  'UrlInterpolationService', 'ComputeGraphService',
  'ExtractImageFilenamesFromStateService',
  function($q, $uibModal, ContextService, AssetsBackendApiService,
      UrlInterpolationService, ComputeGraphService,
      ExtractImageFilenamesFromStateService) {
    var MAX_NUM_IMAGE_FILES_TO_DOWNLOAD_SIMULTANEOUSLY = 3;

    var _filenamesOfImageCurrentlyDownloading = [];
    var _filenamesOfImageToBeDownloaded = [];
    var _filenamesOfImageFailedToDownload = [];
    var _exploration = null;
    var _hasImagePreloaderServiceStarted = false;
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
    var _getImageUrl = function(filename, onLoadCallback, onErrorCallback) {
      AssetsBackendApiService.loadImage(
        ContextService.getExplorationId(), filename)
        .then(function(loadedImageFile) {
          if (_isInFailedDownload(loadedImageFile.filename)) {
            _removeFromFailedDownload(loadedImageFile.filename);
          }
          var objectUrl = URL.createObjectURL(loadedImageFile.data);
          onLoadCallback(objectUrl);
        }, function(filename) {
          onErrorCallback();
        });
    };

    /**
     * Checks if the given filename is in _filenamesOfImageFailedToDownload or
     * not.
     * @param {string} filename - The filename of the image which is to be
     *                            removed from the
     *                            _filenamesOfImageFailedToDownload array.
     */
    var _isInFailedDownload = function(filename) {
      return _filenamesOfImageFailedToDownload.indexOf(filename) >= 0;
    };

    /**
     * Removes the given filename from the _filenamesOfImageFailedToDownload.
     * @param {string} filename - The filename of the file which is to be
     *                            removed from the
     *                            _filenamesOfImageFailedToDownload array.
     */
    var _removeFromFailedDownload = function(filename) {
      var index = _filenamesOfImageFailedToDownload.indexOf(filename);
      _filenamesOfImageFailedToDownload.splice(index, 1);
    };

    /**
     * Gets image files names in Bfs order from the state.
     * @param {string} sourceStateName - The name of the starting state
     *                                   from which the filenames should
     *                                   be obtained.
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
     * Removes the filename from the _filenamesOfImageCurrentlyDownloading and
     * initiates the loading of the next image file.
     * @param {string} filename - The filename which is to be removed from the
     *                            _filenamesOfImageCurrentlyDownloading array.
     */
    var _removeCurrentAndLoadNextImage = function(filename) {
      _filenamesOfImageCurrentlyDownloading = (
        _filenamesOfImageCurrentlyDownloading.filter(
          function(imageFilename) {
            return filename !== imageFilename;
          })
      );
      if (_filenamesOfImageToBeDownloaded.length > 0) {
        var nextImageFilename = _filenamesOfImageToBeDownloaded.shift();
        _filenamesOfImageCurrentlyDownloading.push(nextImageFilename);
        _loadImage(nextImageFilename);
      }
    };

    /**
     * Handles the loading of the image file.
     * @param {string} imageFilename - The filename of the image to be loaded.
     */
    var _loadImage = function(imageFilename) {
      AssetsBackendApiService.loadImage(
        ContextService.getExplorationId(), imageFilename)
        .then(function(loadedImage) {
          _removeCurrentAndLoadNextImage(loadedImage.filename);
          if (_imageLoadedCallback[loadedImage.filename]) {
            var onLoadImageResolve = (
              (_imageLoadedCallback[loadedImage.filename]).resolveMethod);
            var objectUrl = URL.createObjectURL(loadedImage.data);
            onLoadImageResolve(objectUrl);
            _imageLoadedCallback[loadedImage.filename] = null;
          }
        }, function(filename) {
          if (_imageLoadedCallback[filename]) {
            var onFailedDownload = (
              (_imageLoadedCallback[filename]).rejectMethod);
            onFailedDownload();
            _imageLoadedCallback[filename] = null;
          }
          _filenamesOfImageFailedToDownload.push(filename);
          _removeCurrentAndLoadNextImage(filename);
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
      var imageFilesInGivenState = ExtractImageFilenamesFromStateService
        .getImageFilenamesInState(_states.getState(sourceStateName));
      _filenamesOfImageFailedToDownload = _filenamesOfImageFailedToDownload
        .filter(function(filename) {
          return imageFilesInGivenState.indexOf(filename) === -1;
        });
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

    /**
    * Gets the dimensions of the images from the filename provided.
    * @param {string} filename - The string from which the dimensions of the
    *                           images should be extracted.
    */
    var getDimensionsOfImage = function(filename) {
      var dimensionsRegex = RegExp(
        '[^/]+_height_([0-9]+)_width_([0-9]+)\.(png|jpeg|jpg|gif)$', 'g');
      imageDimensions = dimensionsRegex.exec(filename);
      if (imageDimensions) {
        dimensions = {
          height: Number(imageDimensions[1]),
          width: Number(imageDimensions[2])
        };
        return dimensions;
      } else {
        throw new Error(
          'The image name is invalid, it does not contain dimensions.');
      }
    };

    return {
      init: _init,
      kickOffImagePreloader: _kickOffImagePreloader,
      getDimensionsOfImage: getDimensionsOfImage,
      onStateChange: _onStateChange,
      isInFailedDownload: _isInFailedDownload,
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
              _isInFailedDownload(filename)) {
            _getImageUrl(filename, resolve, reject);
          } else {
            _imageLoadedCallback[filename] = {
              resolveMethod: resolve,
              rejectMethod: reject
            };
          }
        });
      },
      inExplorationPlayer: function() {
        return _hasImagePreloaderServiceStarted;
      }
    };
  }
]);
