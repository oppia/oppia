(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~b99a2721"],{

/***/ "./core/templates/dev/head/domain/utilities/AudioFileObjectFactory.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/AudioFileObjectFactory.ts ***!
  \****************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Object factory for creating audio files.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var AudioFile = /** @class */ (function () {
    function AudioFile(filename, data) {
        this.filename = filename;
        this.data = data;
    }
    return AudioFile;
}());
exports.AudioFile = AudioFile;
var AudioFileObjectFactory = /** @class */ (function () {
    function AudioFileObjectFactory() {
    }
    AudioFileObjectFactory.prototype.createNew = function (filename, data) {
        return new AudioFile(filename, data);
    };
    AudioFileObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], AudioFileObjectFactory);
    return AudioFileObjectFactory;
}());
exports.AudioFileObjectFactory = AudioFileObjectFactory;
angular.module('oppia').factory('AudioFileObjectFactory', static_1.downgradeInjectable(AudioFileObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/FileDownloadRequestObjectFactory.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/FileDownloadRequestObjectFactory.ts ***!
  \**************************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Object factory for creating audio files.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var FileDownloadRequest = /** @class */ (function () {
    function FileDownloadRequest(filename, canceler) {
        this.filename = filename;
        this.canceler = canceler;
    }
    return FileDownloadRequest;
}());
exports.FileDownloadRequest = FileDownloadRequest;
var FileDownloadRequestObjectFactory = /** @class */ (function () {
    function FileDownloadRequestObjectFactory() {
    }
    // TODO(YashJipkate): Replace 'any' with the exact type. This has kept as
    // 'any' since canceler is a 'Deferred' type object which is native to
    // AngularJS and does not have a type in native typescript.
    FileDownloadRequestObjectFactory.prototype.createNew = function (filename, canceler) {
        return new FileDownloadRequest(filename, canceler);
    };
    FileDownloadRequestObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], FileDownloadRequestObjectFactory);
    return FileDownloadRequestObjectFactory;
}());
exports.FileDownloadRequestObjectFactory = FileDownloadRequestObjectFactory;
angular.module('oppia').factory('FileDownloadRequestObjectFactory', static_1.downgradeInjectable(FileDownloadRequestObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/ImageFileObjectFactory.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/ImageFileObjectFactory.ts ***!
  \****************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Object factory for creating image files.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var ImageFile = /** @class */ (function () {
    function ImageFile(filename, data) {
        this.filename = filename;
        this.data = data;
    }
    return ImageFile;
}());
exports.ImageFile = ImageFile;
var ImageFileObjectFactory = /** @class */ (function () {
    function ImageFileObjectFactory() {
    }
    ImageFileObjectFactory.prototype.createNew = function (filename, data) {
        return new ImageFile(filename, data);
    };
    ImageFileObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], ImageFileObjectFactory);
    return ImageFileObjectFactory;
}());
exports.ImageFileObjectFactory = ImageFileObjectFactory;
angular.module('oppia').factory('ImageFileObjectFactory', static_1.downgradeInjectable(ImageFileObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-player-page/services/extract-image-filenames-from-state.service.ts":
/*!**********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-player-page/services/extract-image-filenames-from-state.service.ts ***!
  \**********************************************************************************************************************/
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
 * @fileoverview Service to extract image filenames in a State.
 */
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('oppia').factory('ExtractImageFilenamesFromStateService', [
    'HtmlEscaperService', function (HtmlEscaperService) {
        var INTERACTION_TYPE_MULTIPLE_CHOICE = 'MultipleChoiceInput';
        var INTERACTION_TYPE_ITEM_SELECTION = 'ItemSelectionInput';
        var INTERACTION_TYPE_IMAGE_CLICK_INPUT = 'ImageClickInput';
        var INTERACTION_TYPE_DRAG_AND_DROP_SORT = 'DragAndDropSortInput';
        var filenamesInState = [];
        /**
         * Gets the html from the state's content.
         * @param {object} state - The state from which the html of the content
         *                         should be returned.
         */
        var _getStateContentHtml = function (state) {
            return state.content.getHtml();
        };
        /**
         * Gets the html from the outcome of the answer groups and the default
         * outcome of the state.
         * @param {object} state - The state from which the html of the outcomes of
         *                         the answer groups should be returned.
         */
        var _getOutcomesHtml = function (state) {
            var outcomesHtml = '';
            state.interaction.answerGroups.forEach(function (answerGroup) {
                var answerGroupHtml = answerGroup.outcome.feedback.getHtml();
                outcomesHtml = outcomesHtml.concat(answerGroupHtml);
            });
            if (state.interaction.defaultOutcome !== null) {
                outcomesHtml = outcomesHtml.concat(state.interaction.defaultOutcome.feedback.getHtml());
            }
            return outcomesHtml;
        };
        /**
         * Gets the html from the hints in the state.
         * @param {object} state - The state whose hints' html should be returned.
         */
        var _getHintsHtml = function (state) {
            var hintsHtml = '';
            state.interaction.hints.forEach(function (hint) {
                var hintHtml = hint.hintContent.getHtml();
                hintsHtml = hintsHtml.concat(hintHtml);
            });
            return hintsHtml;
        };
        /**
         * Gets the html from the solution in the state.
         * @param {object} state - The state whose solution's html should be
         *                         returned.
         */
        var _getSolutionHtml = function (state) {
            return state.interaction.solution.explanation.getHtml();
        };
        /**
         * Gets all the html in a state.
         * @param {object} state - The state whose html is to be fetched.
         */
        var _getAllHtmlOfState = function (state) {
            var _allHtmlInTheState = [];
            // The order of the extracted image names is same as they appear in a
            // state. The images should be preloaded in the following order ---
            // content, customizationArgs of interactions, feedback of outcomes ()
            // including feedback of default outcome if any), hints, solution if any.
            _allHtmlInTheState.push(_getStateContentHtml(state));
            if (state.interaction.id === INTERACTION_TYPE_MULTIPLE_CHOICE ||
                state.interaction.id === INTERACTION_TYPE_ITEM_SELECTION ||
                state.interaction.id === INTERACTION_TYPE_DRAG_AND_DROP_SORT) {
                var customizationArgsHtml = '';
                state.interaction.customizationArgs.choices.value.forEach(function (value) {
                    customizationArgsHtml = customizationArgsHtml.concat(value);
                });
                _allHtmlInTheState.push(customizationArgsHtml);
            }
            _allHtmlInTheState.push(_getOutcomesHtml(state));
            _allHtmlInTheState.push(_getHintsHtml(state));
            if (state.interaction.solution !== null) {
                _allHtmlInTheState.push(_getSolutionHtml(state));
            }
            return _allHtmlInTheState;
        };
        /**
         * Extracts the filepath object from the filepath-value attribute of the
         * oppia-noninteractive-image tags in the strHtml(given string).
         * @param {string} strHtml - The string from which the object of
         *                           filepath should be extracted.
         */
        var _extractFilepathValueFromOppiaNonInteractiveImageTag = function (strHtml) {
            var filenames = [];
            var dummyElement = document.createElement('div');
            dummyElement.innerHTML = (HtmlEscaperService.escapedStrToUnescapedStr(strHtml));
            var imageTagList = dummyElement.getElementsByTagName('oppia-noninteractive-image');
            for (var i = 0; i < imageTagList.length; i++) {
                // We have the attribute of filepath in oppia-noninteractive-image tag.
                // But it actually contains the filename only. We use the variable
                // filename instead of filepath since in the end we are retrieving the
                // filenames in the exploration.
                var filename = JSON.parse(imageTagList[i].getAttribute('filepath-with-value'));
                filenames.push(filename);
            }
            return filenames;
        };
        /**
         * Gets the filenames of all the images that are a part of the state.
         * @param {object} state - The state from which the filenames of the image
         *                         should be extracted.
         */
        var _getImageFilenamesInState = function (state) {
            var filenamesInState = [];
            // The Image Click Input interaction has an image whose filename is
            // directly stored in the customizationArgs.imageAndRegion.value
            // .imagePath
            if (state.interaction.id === INTERACTION_TYPE_IMAGE_CLICK_INPUT) {
                var filename = (state.interaction.customizationArgs.imageAndRegions.value.imagePath);
                filenamesInState.push(filename);
            }
            var allHtmlOfState = _getAllHtmlOfState(state);
            allHtmlOfState.forEach(function (htmlStr) {
                filenamesInState = filenamesInState.concat(_extractFilepathValueFromOppiaNonInteractiveImageTag(htmlStr));
            });
            return filenamesInState;
        };
        return {
            getImageFilenamesInState: _getImageFilenamesInState
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-player-page/services/image-preloader.service.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-player-page/services/image-preloader.service.ts ***!
  \***************************************************************************************************/
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
 * @fileoverview Service to preload image into AssetsBackendApiService's cache.
 */
__webpack_require__(/*! pages/exploration-player-page/services/extract-image-filenames-from-state.service.ts */ "./core/templates/dev/head/pages/exploration-player-page/services/extract-image-filenames-from-state.service.ts");
__webpack_require__(/*! services/AssetsBackendApiService.ts */ "./core/templates/dev/head/services/AssetsBackendApiService.ts");
__webpack_require__(/*! services/ComputeGraphService.ts */ "./core/templates/dev/head/services/ComputeGraphService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
angular.module('oppia').factory('ImagePreloaderService', [
    '$q', 'AssetsBackendApiService', 'ComputeGraphService',
    'ContextService', 'ExtractImageFilenamesFromStateService', 'ENTITY_TYPE',
    function ($q, AssetsBackendApiService, ComputeGraphService, ContextService, ExtractImageFilenamesFromStateService, ENTITY_TYPE) {
        var MAX_NUM_IMAGE_FILES_TO_DOWNLOAD_SIMULTANEOUSLY = 3;
        var _filenamesOfImageCurrentlyDownloading = [];
        var _filenamesOfImageToBeDownloaded = [];
        var _filenamesOfImageFailedToDownload = [];
        var _exploration = null;
        var _states = null;
        var _hasImagePreloaderServiceStarted = false;
        // imageLoadedCallback is an object of objects (identified by the filenames
        // which are being downloaded at the time they are required by the
        // directive).The object contains the resolve method of the promise
        // attached with getInImageUrl method.
        var _imageLoadedCallback = {};
        var _hasImagePreloaderServiceStarted = false;
        var _init = function (exploration) {
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
        var _getImageUrl = function (filename, onLoadCallback, onErrorCallback) {
            AssetsBackendApiService.loadImage(ContextService.getEntityType(), ContextService.getEntityId(), filename)
                .then(function (loadedImageFile) {
                if (_isInFailedDownload(loadedImageFile.filename)) {
                    _removeFromFailedDownload(loadedImageFile.filename);
                }
                var objectUrl = URL.createObjectURL(loadedImageFile.data);
                onLoadCallback(objectUrl);
            }, function (filename) {
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
        var _isInFailedDownload = function (filename) {
            return _filenamesOfImageFailedToDownload.indexOf(filename) >= 0;
        };
        /**
         * Removes the given filename from the _filenamesOfImageFailedToDownload.
         * @param {string} filename - The filename of the file which is to be
         *                            removed from the
         *                            _filenamesOfImageFailedToDownload array.
         */
        var _removeFromFailedDownload = function (filename) {
            var index = _filenamesOfImageFailedToDownload.indexOf(filename);
            _filenamesOfImageFailedToDownload.splice(index, 1);
        };
        /**
         * Gets image files names in Bfs order from the state.
         * @param {string} sourceStateName - The name of the starting state
         *                                   from which the filenames should
         *                                   be obtained.
         */
        var _getImageFilenamesInBfsOrder = function (sourceStateName) {
            var stateNamesInBfsOrder = (ComputeGraphService.computeBfsTraversalOfStates(_exploration.getInitialState().name, _exploration.getStates(), sourceStateName));
            var imageFilenames = [];
            stateNamesInBfsOrder.forEach(function (stateName) {
                var state = _states.getState(stateName);
                ExtractImageFilenamesFromStateService.getImageFilenamesInState(state)
                    .forEach(function (filename) {
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
        var _removeCurrentAndLoadNextImage = function (filename) {
            _filenamesOfImageCurrentlyDownloading = (_filenamesOfImageCurrentlyDownloading.filter(function (imageFilename) {
                return filename !== imageFilename;
            }));
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
        var _loadImage = function (imageFilename) {
            AssetsBackendApiService.loadImage(ENTITY_TYPE.EXPLORATION, ContextService.getExplorationId(), imageFilename)
                .then(function (loadedImage) {
                _removeCurrentAndLoadNextImage(loadedImage.filename);
                if (_imageLoadedCallback[loadedImage.filename]) {
                    var onLoadImageResolve = ((_imageLoadedCallback[loadedImage.filename]).resolveMethod);
                    var objectUrl = URL.createObjectURL(loadedImage.data);
                    onLoadImageResolve(objectUrl);
                    _imageLoadedCallback[loadedImage.filename] = null;
                }
            }, function (filename) {
                if (_imageLoadedCallback[filename]) {
                    var onFailedDownload = ((_imageLoadedCallback[filename]).rejectMethod);
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
        var _kickOffImagePreloader = function (sourceStateName) {
            _filenamesOfImageToBeDownloaded = (_getImageFilenamesInBfsOrder(sourceStateName));
            var imageFilesInGivenState = ExtractImageFilenamesFromStateService
                .getImageFilenamesInState(_states.getState(sourceStateName));
            _filenamesOfImageFailedToDownload = _filenamesOfImageFailedToDownload
                .filter(function (filename) {
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
        var _cancelPreloading = function () {
            AssetsBackendApiService.abortAllCurrentImageDownloads();
            _filenamesOfImageCurrentlyDownloading = [];
        };
        /**
         * When the state changes, it decides whether to restart the preloader
         * starting from the 'stateName' state or not.
         * @param {string} stateName - The name of the state the user shifts to.
         */
        var _onStateChange = function (stateName) {
            if (stateName !== _exploration.getInitialState().name) {
                _imageLoadedCallback = {};
                var imageFilenamesInState = [];
                var noOfImageFilesCurrentlyDownloading = 0;
                var noOfImagesNeitherInCacheNorDownloading = 0;
                var state = _states.getState(stateName);
                imageFilenamesInState = (ExtractImageFilenamesFromStateService
                    .getImageFilenamesInState(state));
                imageFilenamesInState.forEach(function (filename) {
                    var isFileCurrentlyDownloading = (_filenamesOfImageCurrentlyDownloading.indexOf(filename) >= 0);
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
        var getDimensionsOfImage = function (filename) {
            var dimensionsRegex = RegExp('[^/]+_height_([0-9]+)_width_([0-9]+)\.(png|jpeg|jpg|gif)$', 'g');
            var imageDimensions = dimensionsRegex.exec(filename);
            if (imageDimensions) {
                var dimensions = {
                    height: Number(imageDimensions[1]),
                    width: Number(imageDimensions[2])
                };
                return dimensions;
            }
            else {
                throw new Error('The image name is invalid, it does not contain dimensions.');
            }
        };
        return {
            init: _init,
            kickOffImagePreloader: _kickOffImagePreloader,
            getDimensionsOfImage: getDimensionsOfImage,
            onStateChange: _onStateChange,
            isInFailedDownload: _isInFailedDownload,
            isLoadingImageFile: function (filename) {
                return _filenamesOfImageCurrentlyDownloading.indexOf(filename) !== -1;
            },
            restartImagePreloader: function (sourceStateName) {
                _cancelPreloading();
                _kickOffImagePreloader(sourceStateName);
            },
            getFilenamesOfImageCurrentlyDownloading: function () {
                return _filenamesOfImageCurrentlyDownloading;
            },
            getImageUrl: function (filename) {
                return $q(function (resolve, reject) {
                    if (AssetsBackendApiService.isCached(filename) ||
                        _isInFailedDownload(filename)) {
                        _getImageUrl(filename, resolve, reject);
                    }
                    else {
                        _imageLoadedCallback[filename] = {
                            resolveMethod: resolve,
                            rejectMethod: reject
                        };
                    }
                });
            },
            inExplorationPlayer: function () {
                return _hasImagePreloaderServiceStarted;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/AssetsBackendApiService.ts":
/*!*********************************************************************!*\
  !*** ./core/templates/dev/head/services/AssetsBackendApiService.ts ***!
  \*********************************************************************/
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
 * @fileoverview Service to serve as the interface for fetching and uploading
 * assets from Google Cloud Storage.
 */
__webpack_require__(/*! domain/utilities/AudioFileObjectFactory.ts */ "./core/templates/dev/head/domain/utilities/AudioFileObjectFactory.ts");
__webpack_require__(/*! domain/utilities/FileDownloadRequestObjectFactory.ts */ "./core/templates/dev/head/domain/utilities/FileDownloadRequestObjectFactory.ts");
__webpack_require__(/*! domain/utilities/ImageFileObjectFactory.ts */ "./core/templates/dev/head/domain/utilities/ImageFileObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/CsrfTokenService.ts */ "./core/templates/dev/head/services/CsrfTokenService.ts");
angular.module('oppia').factory('AssetsBackendApiService', [
    '$http', '$q', 'AudioFileObjectFactory', 'CsrfTokenService',
    'FileDownloadRequestObjectFactory', 'ImageFileObjectFactory',
    'UrlInterpolationService', 'DEV_MODE', 'ENTITY_TYPE',
    'GCS_RESOURCE_BUCKET_NAME',
    function ($http, $q, AudioFileObjectFactory, CsrfTokenService, FileDownloadRequestObjectFactory, ImageFileObjectFactory, UrlInterpolationService, DEV_MODE, ENTITY_TYPE, GCS_RESOURCE_BUCKET_NAME) {
        if (!DEV_MODE && !GCS_RESOURCE_BUCKET_NAME) {
            throw Error('GCS_RESOURCE_BUCKET_NAME is not set in prod.');
        }
        // List of filenames that have been requested for but have
        // yet to return a response.
        var _audioFilesCurrentlyBeingRequested = [];
        var _imageFilesCurrentlyBeingRequested = [];
        var ASSET_TYPE_AUDIO = 'audio';
        var ASSET_TYPE_IMAGE = 'image';
        var GCS_PREFIX = ('https://storage.googleapis.com/' +
            GCS_RESOURCE_BUCKET_NAME);
        var AUDIO_DOWNLOAD_URL_TEMPLATE = ((DEV_MODE ? '/assetsdevhandler' : GCS_PREFIX) +
            '/<entity_type>/<entity_id>/assets/audio/<filename>');
        var IMAGE_DOWNLOAD_URL_TEMPLATE = ((DEV_MODE ? '/assetsdevhandler' : GCS_PREFIX) +
            '/<entity_type>/<entity_id>/assets/image/<filename>');
        var AUDIO_UPLOAD_URL_TEMPLATE = '/createhandler/audioupload/<exploration_id>';
        // Map from asset filename to asset blob.
        var assetsCache = {};
        var _fetchFile = function (entityType, entityId, filename, assetType, successCallback, errorCallback) {
            var canceler = $q.defer();
            if (assetType === ASSET_TYPE_AUDIO) {
                _audioFilesCurrentlyBeingRequested.push(FileDownloadRequestObjectFactory.createNew(filename, canceler));
            }
            else {
                _imageFilesCurrentlyBeingRequested.push(FileDownloadRequestObjectFactory.createNew(filename, canceler));
            }
            $http({
                method: 'GET',
                responseType: 'blob',
                url: _getDownloadUrl(entityType, entityId, filename, assetType),
                timeout: canceler.promise
            }).success(function (data) {
                var assetBlob = null;
                try {
                    if (assetType === ASSET_TYPE_AUDIO) {
                        // Add type for audio assets. Without this, translations can
                        // not be played on Safari.
                        assetBlob = new Blob([data], { type: 'audio/mpeg' });
                    }
                    else {
                        assetBlob = new Blob([data]);
                    }
                }
                catch (exception) {
                    window.BlobBuilder = window.BlobBuilder ||
                        window.WebKitBlobBuilder ||
                        window.MozBlobBuilder ||
                        window.MSBlobBuilder;
                    if (exception.name === 'TypeError' && window.BlobBuilder) {
                        try {
                            var blobBuilder = new BlobBuilder();
                            blobBuilder.append(data);
                            assetBlob = blobBuilder.getBlob(assetType.concat('/*'));
                        }
                        catch (e) {
                            var additionalInfo = ('\nBlobBuilder construction error debug logs:' +
                                '\nAsset type: ' + assetType +
                                '\nData: ' + data);
                            e.message += additionalInfo;
                            throw e;
                        }
                    }
                    else {
                        var additionalInfo = ('\nBlob construction error debug logs:' +
                            '\nAsset type: ' + assetType +
                            '\nData: ' + data);
                        exception.message += additionalInfo;
                        throw exception;
                    }
                }
                assetsCache[filename] = assetBlob;
                if (assetType === ASSET_TYPE_AUDIO) {
                    successCallback(AudioFileObjectFactory.createNew(filename, assetBlob));
                }
                else {
                    successCallback(ImageFileObjectFactory.createNew(filename, assetBlob));
                }
            }).error(function () {
                errorCallback(filename);
            })['finally'](function () {
                _removeFromFilesCurrentlyBeingRequested(filename, assetType);
            });
        };
        var _abortAllCurrentDownloads = function (assetType) {
            if (assetType === ASSET_TYPE_AUDIO) {
                _audioFilesCurrentlyBeingRequested.forEach(function (request) {
                    request.canceler.resolve();
                });
                _audioFilesCurrentlyBeingRequested = [];
            }
            else {
                _imageFilesCurrentlyBeingRequested.forEach(function (request) {
                    request.canceler.resolve();
                });
                _imageFilesCurrentlyBeingRequested = [];
            }
        };
        var _removeFromFilesCurrentlyBeingRequested = function (filename, assetType) {
            if (_isAssetCurrentlyBeingRequested(filename, ASSET_TYPE_AUDIO)) {
                for (var index = 0; index <
                    _audioFilesCurrentlyBeingRequested.length; index++) {
                    if (_audioFilesCurrentlyBeingRequested[index].filename === filename) {
                        _audioFilesCurrentlyBeingRequested.splice(index, 1);
                        break;
                    }
                }
            }
            else if (_isAssetCurrentlyBeingRequested(filename, ASSET_TYPE_IMAGE)) {
                for (var index = 0; index <
                    _imageFilesCurrentlyBeingRequested.length; index++) {
                    if (_imageFilesCurrentlyBeingRequested[index].filename === filename) {
                        _imageFilesCurrentlyBeingRequested.splice(index, 1);
                        break;
                    }
                }
            }
        };
        var _saveAudio = function (explorationId, filename, rawAssetData, successCallback, errorCallback) {
            var form = new FormData();
            form.append('raw_audio_file', rawAssetData);
            form.append('payload', JSON.stringify({
                filename: filename
            }));
            CsrfTokenService.getTokenAsync().then(function (token) {
                form.append('csrf_token', token);
                $.ajax({
                    url: _getAudioUploadUrl(explorationId),
                    data: form,
                    processData: false,
                    contentType: false,
                    type: 'POST',
                    dataType: 'text',
                    dataFilter: function (data) {
                        // Remove the XSSI prefix.
                        var transformedData = data.substring(5);
                        return JSON.parse(transformedData);
                    },
                }).done(function (response) {
                    if (successCallback) {
                        successCallback(response);
                    }
                }).fail(function (data) {
                    // Remove the XSSI prefix.
                    var transformedData = data.responseText.substring(5);
                    var parsedResponse = angular.fromJson(transformedData);
                    console.error(parsedResponse);
                    if (errorCallback) {
                        errorCallback(parsedResponse);
                    }
                });
            });
        };
        var _getDownloadUrl = function (entityType, entityId, filename, assetType) {
            return UrlInterpolationService.interpolateUrl((assetType === ASSET_TYPE_AUDIO ? AUDIO_DOWNLOAD_URL_TEMPLATE :
                IMAGE_DOWNLOAD_URL_TEMPLATE), {
                entity_id: entityId,
                entity_type: entityType,
                filename: filename
            });
        };
        var _getAudioUploadUrl = function (explorationId) {
            return UrlInterpolationService.interpolateUrl(AUDIO_UPLOAD_URL_TEMPLATE, {
                exploration_id: explorationId
            });
        };
        var _isAssetCurrentlyBeingRequested = function (filename, assetType) {
            if (assetType === ASSET_TYPE_AUDIO) {
                return _audioFilesCurrentlyBeingRequested.some(function (request) {
                    return request.filename === filename;
                });
            }
            else {
                return _imageFilesCurrentlyBeingRequested.some(function (request) {
                    return request.filename === filename;
                });
            }
        };
        var _isCached = function (filename) {
            return assetsCache.hasOwnProperty(filename);
        };
        return {
            loadAudio: function (explorationId, filename) {
                return $q(function (resolve, reject) {
                    if (_isCached(filename)) {
                        resolve(AudioFileObjectFactory.createNew(filename, assetsCache[filename]));
                    }
                    else {
                        _fetchFile(ENTITY_TYPE.EXPLORATION, explorationId, filename, ASSET_TYPE_AUDIO, resolve, reject);
                    }
                });
            },
            loadImage: function (entityType, entityId, filename) {
                return $q(function (resolve, reject) {
                    if (_isCached(filename)) {
                        resolve(ImageFileObjectFactory.createNew(filename, assetsCache[filename]));
                    }
                    else {
                        _fetchFile(entityType, entityId, filename, ASSET_TYPE_IMAGE, resolve, reject);
                    }
                });
            },
            saveAudio: function (explorationId, filename, rawAssetData) {
                return $q(function (resolve, reject) {
                    _saveAudio(explorationId, filename, rawAssetData, resolve, reject);
                });
            },
            isCached: function (filename) {
                return _isCached(filename);
            },
            getAudioDownloadUrl: function (entityType, entityId, filename) {
                return _getDownloadUrl(entityType, entityId, filename, ASSET_TYPE_AUDIO);
            },
            abortAllCurrentAudioDownloads: function () {
                _abortAllCurrentDownloads(ASSET_TYPE_AUDIO);
            },
            abortAllCurrentImageDownloads: function () {
                _abortAllCurrentDownloads(ASSET_TYPE_IMAGE);
            },
            getAssetsFilesCurrentlyBeingRequested: function () {
                return { audio: _audioFilesCurrentlyBeingRequested,
                    image: _imageFilesCurrentlyBeingRequested
                };
            },
            getImageUrlForPreview: function (entityType, entityId, filename) {
                return _getDownloadUrl(entityType, entityId, filename, ASSET_TYPE_IMAGE);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/AutoplayedVideosService.ts":
/*!*********************************************************************!*\
  !*** ./core/templates/dev/head/services/AutoplayedVideosService.ts ***!
  \*********************************************************************/
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
 * @fileoverview Autoplayed videos service.
 */
// About this service:
// In the exploration player, a video should only autoplay when it is first seen
// on a new card, and not when the learner clicks back to previous cards in
// their exploration playthrough. This service maintains a list of videos that
// have been played, so that we know not to autoplay them on a second pass.
//
// Caveat: if the same video is shown twice in the exploration, the second and
// subsequent instances of that video will not autoplay. We believe this
// occurrence is rare, and have not accounted for it here. If it turns out
// to be an issue, we may need to instead assign a unique id to each rich-text
// component and use that id instead to determine whether to suppress
// autoplaying.
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var AutoplayedVideosService = /** @class */ (function () {
    function AutoplayedVideosService() {
        this.autoplayedVideosDict = {};
    }
    AutoplayedVideosService.prototype.addAutoplayedVideo = function (videoId) {
        this.autoplayedVideosDict[videoId] = true;
    };
    AutoplayedVideosService.prototype.hasVideoBeenAutoplayed = function (videoId) {
        return Boolean(this.autoplayedVideosDict[videoId]);
    };
    AutoplayedVideosService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], AutoplayedVideosService);
    return AutoplayedVideosService;
}());
exports.AutoplayedVideosService = AutoplayedVideosService;
angular.module('oppia').factory('AutoplayedVideosService', static_1.downgradeInjectable(AutoplayedVideosService));


/***/ }),

/***/ "./core/templates/dev/head/services/ComputeGraphService.ts":
/*!*****************************************************************!*\
  !*** ./core/templates/dev/head/services/ComputeGraphService.ts ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for computing a graphical representation of an
 * exploration.
 */
angular.module('oppia').factory('ComputeGraphService', [
    function () {
        var _computeGraphData = function (initStateId, states) {
            var nodes = {};
            var links = [];
            var finalStateIds = states.getFinalStateNames();
            states.getStateNames().forEach(function (stateName) {
                var interaction = states.getState(stateName).interaction;
                nodes[stateName] = stateName;
                if (interaction.id) {
                    var groups = interaction.answerGroups;
                    for (var h = 0; h < groups.length; h++) {
                        links.push({
                            source: stateName,
                            target: groups[h].outcome.dest,
                        });
                    }
                    if (interaction.defaultOutcome) {
                        links.push({
                            source: stateName,
                            target: interaction.defaultOutcome.dest,
                        });
                    }
                }
            });
            return {
                finalStateIds: finalStateIds,
                initStateId: initStateId,
                links: links,
                nodes: nodes
            };
        };
        var _computeBfsTraversalOfStates = function (initStateId, states, sourceStateName) {
            var stateGraph = _computeGraphData(initStateId, states);
            var stateNamesInBfsOrder = [];
            var queue = [];
            var seen = {};
            seen[sourceStateName] = true;
            queue.push(sourceStateName);
            while (queue.length > 0) {
                var currStateName = queue.shift();
                stateNamesInBfsOrder.push(currStateName);
                for (var e = 0; e < stateGraph.links.length; e++) {
                    var edge = stateGraph.links[e];
                    var dest = edge.target;
                    if (edge.source === currStateName && !seen.hasOwnProperty(dest)) {
                        seen[dest] = true;
                        queue.push(dest);
                    }
                }
            }
            return stateNamesInBfsOrder;
        };
        return {
            compute: function (initStateId, states) {
                return _computeGraphData(initStateId, states);
            },
            computeBfsTraversalOfStates: function (initStateId, states, sourceStateName) {
                return _computeBfsTraversalOfStates(initStateId, states, sourceStateName);
            }
        };
    }
]);


/***/ }),

/***/ "./extensions/rich_text_components/Collapsible/directives/OppiaNoninteractiveCollapsibleDirective.ts":
/*!***********************************************************************************************************!*\
  !*** ./extensions/rich_text_components/Collapsible/directives/OppiaNoninteractiveCollapsibleDirective.ts ***!
  \***********************************************************************************************************/
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
/**
 * @fileoverview Directive for the Collapsible rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('oppia').directive('oppiaNoninteractiveCollapsible', [
    'HtmlEscaperService', 'UrlInterpolationService',
    function (HtmlEscaperService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Collapsible' +
                '/directives/collapsible_directive.html'),
            controllerAs: '$ctrl',
            controller: ['$attrs', function ($attrs) {
                    var ctrl = this;
                    ctrl.heading = HtmlEscaperService.escapedJsonToObj($attrs.headingWithValue);
                    ctrl.content = HtmlEscaperService.escapedJsonToObj($attrs.contentWithValue);
                }]
        };
    }
]);


/***/ }),

/***/ "./extensions/rich_text_components/Image/directives/OppiaNoninteractiveImageDirective.ts":
/*!***********************************************************************************************!*\
  !*** ./extensions/rich_text_components/Image/directives/OppiaNoninteractiveImageDirective.ts ***!
  \***********************************************************************************************/
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
/**
 * @fileoverview Directive for the Image rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/exploration-player-page/services/image-preloader.service.ts */ "./core/templates/dev/head/pages/exploration-player-page/services/image-preloader.service.ts");
__webpack_require__(/*! services/AssetsBackendApiService.ts */ "./core/templates/dev/head/services/AssetsBackendApiService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('oppia').directive('oppiaNoninteractiveImage', [
    'AssetsBackendApiService', 'ContextService',
    'HtmlEscaperService', 'ImagePreloaderService',
    'UrlInterpolationService', 'LOADING_INDICATOR_URL',
    function (AssetsBackendApiService, ContextService, HtmlEscaperService, ImagePreloaderService, UrlInterpolationService, LOADING_INDICATOR_URL) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Image/directives/image_directive.html'),
            controllerAs: '$ctrl',
            controller: ['$attrs', function ($attrs) {
                    var ctrl = this;
                    ctrl.filepath = HtmlEscaperService.escapedJsonToObj($attrs.filepathWithValue);
                    ctrl.imageUrl = '';
                    ctrl.loadingIndicatorUrl = UrlInterpolationService.getStaticImageUrl(LOADING_INDICATOR_URL);
                    ctrl.isLoadingIndicatorShown = false;
                    ctrl.isTryAgainShown = false;
                    if (ImagePreloaderService.inExplorationPlayer()) {
                        ctrl.isLoadingIndicatorShown = true;
                        ctrl.dimensions = (ImagePreloaderService.getDimensionsOfImage(ctrl.filepath));
                        // For aligning the gif to the center of it's container
                        var loadingIndicatorSize = ((ctrl.dimensions.height < 124) ? 24 : 120);
                        ctrl.imageContainerStyle = {
                            height: ctrl.dimensions.height + 'px'
                        };
                        ctrl.loadingIndicatorStyle = {
                            height: loadingIndicatorSize + 'px',
                            width: loadingIndicatorSize + 'px'
                        };
                        ctrl.loadImage = function () {
                            ctrl.isLoadingIndicatorShown = true;
                            ctrl.isTryAgainShown = false;
                            ImagePreloaderService.getImageUrl(ctrl.filepath)
                                .then(function (objectUrl) {
                                ctrl.isTryAgainShown = false;
                                ctrl.isLoadingIndicatorShown = false;
                                ctrl.imageUrl = objectUrl;
                            }, function () {
                                ctrl.isTryAgainShown = true;
                                ctrl.isLoadingIndicatorShown = false;
                            });
                        };
                        ctrl.loadImage();
                    }
                    else {
                        // This is the case when user is in exploration editor or in
                        // preview mode. We don't have loading indicator or try again for
                        // showing images in the exploration editor or in preview mode. So
                        // we directly assign the url to the imageUrl.
                        ctrl.imageUrl = AssetsBackendApiService.getImageUrlForPreview(ContextService.getEntityType(), ContextService.getEntityId(), ctrl.filepath);
                    }
                    ctrl.imageCaption = '';
                    if ($attrs.captionWithValue) {
                        ctrl.imageCaption = HtmlEscaperService.escapedJsonToObj($attrs.captionWithValue);
                    }
                    ctrl.imageAltText = '';
                    if ($attrs.altWithValue) {
                        ctrl.imageAltText = HtmlEscaperService.escapedJsonToObj($attrs.altWithValue);
                    }
                }]
        };
    }
]);


/***/ }),

/***/ "./extensions/rich_text_components/Link/directives/OppiaNoninteractiveLinkDirective.ts":
/*!*********************************************************************************************!*\
  !*** ./extensions/rich_text_components/Link/directives/OppiaNoninteractiveLinkDirective.ts ***!
  \*********************************************************************************************/
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
/**
 * @fileoverview Directive for the Link rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('oppia').directive('oppiaNoninteractiveLink', [
    'HtmlEscaperService', 'UrlInterpolationService',
    function (HtmlEscaperService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Link/directives/link_directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$attrs', 'ContextService',
                function ($attrs, ContextService) {
                    var ctrl = this;
                    var untrustedUrl = encodeURI(HtmlEscaperService.escapedJsonToObj($attrs.urlWithValue));
                    if (untrustedUrl.indexOf('http://') !== 0 &&
                        untrustedUrl.indexOf('https://') !== 0) {
                        untrustedUrl = 'https://' + untrustedUrl;
                    }
                    ctrl.url = untrustedUrl;
                    ctrl.showUrlInTooltip = false;
                    ctrl.text = ctrl.url;
                    if ($attrs.textWithValue) {
                        // This is done for backward-compatibility; some old explorations
                        // have content parts that don't include a 'text' attribute on
                        // their links.
                        ctrl.text =
                            HtmlEscaperService.escapedJsonToObj($attrs.textWithValue);
                        // Note that this second 'if' condition is needed because a link may
                        // have an empty 'text' value.
                        if (ctrl.text) {
                            ctrl.showUrlInTooltip = true;
                        }
                        else {
                            ctrl.text = ctrl.url;
                        }
                    }
                    // This following check disbales the link in Editor being caught
                    // by tabbing while in Exploration Editor mode.
                    if (ContextService.isInExplorationEditorMode()) {
                        ctrl.tabIndexVal = -1;
                    }
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./extensions/rich_text_components/Math/directives/OppiaNoninteractiveMathDirective.ts":
/*!*********************************************************************************************!*\
  !*** ./extensions/rich_text_components/Math/directives/OppiaNoninteractiveMathDirective.ts ***!
  \*********************************************************************************************/
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
/**
 * @fileoverview Directive for the Math rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('oppia').directive('oppiaNoninteractiveMath', [
    'HtmlEscaperService', 'UrlInterpolationService',
    function (HtmlEscaperService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Math/directives/math_directive.html'),
            controllerAs: '$ctrl',
            controller: ['$attrs', function ($attrs) {
                    var ctrl = this;
                    ctrl.rawLatex = HtmlEscaperService.escapedJsonToObj($attrs.rawLatexWithValue);
                }]
        };
    }
]);


/***/ }),

/***/ "./extensions/rich_text_components/Tabs/directives/OppiaNoninteractiveTabsDirective.ts":
/*!*********************************************************************************************!*\
  !*** ./extensions/rich_text_components/Tabs/directives/OppiaNoninteractiveTabsDirective.ts ***!
  \*********************************************************************************************/
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
/**
 * @fileoverview Directive for the Tabs rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('oppia').directive('oppiaNoninteractiveTabs', [
    'HtmlEscaperService', 'UrlInterpolationService',
    function (HtmlEscaperService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Tabs/directives/tabs_directive.html'),
            controllerAs: '$ctrl',
            controller: ['$attrs', function ($attrs) {
                    var ctrl = this;
                    ctrl.tabContents = HtmlEscaperService.escapedJsonToObj($attrs.tabContentsWithValue);
                }]
        };
    }
]);


/***/ }),

/***/ "./extensions/rich_text_components/Video/directives/OppiaNoninteractiveVideoDirective.ts":
/*!***********************************************************************************************!*\
  !*** ./extensions/rich_text_components/Video/directives/OppiaNoninteractiveVideoDirective.ts ***!
  \***********************************************************************************************/
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
/**
 * @fileoverview Directive for the Video rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AutoplayedVideosService.ts */ "./core/templates/dev/head/services/AutoplayedVideosService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('oppia').directive('oppiaNoninteractiveVideo', [
    '$sce', 'HtmlEscaperService', 'UrlInterpolationService',
    function ($sce, HtmlEscaperService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Video/directives/video_directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$attrs', 'ContextService', '$element',
                'AutoplayedVideosService', 'PAGE_CONTEXT', '$timeout', '$window',
                function ($attrs, ContextService, $element, AutoplayedVideosService, PAGE_CONTEXT, $timeout, $window) {
                    var ctrl = this;
                    var start = (HtmlEscaperService.escapedJsonToObj($attrs.startWithValue));
                    var end = HtmlEscaperService.escapedJsonToObj($attrs.endWithValue);
                    ctrl.videoId = HtmlEscaperService.escapedJsonToObj($attrs.videoIdWithValue);
                    ctrl.timingParams = '&start=' + start + '&end=' + end;
                    ctrl.autoplaySuffix = '&autoplay=0';
                    $timeout(function () {
                        // Check whether creator wants to autoplay this video or not
                        var autoplayVal = HtmlEscaperService.escapedJsonToObj($attrs.autoplayWithValue);
                        // This code helps in visibility of video. It checks whether
                        // mid point of video frame is in the view or not.
                        var rect = angular.element($element)[0].getBoundingClientRect();
                        var clientHeight = $window.innerHeight;
                        var clientWidth = $window.innerWidth;
                        var isVisible = ((rect.left + rect.right) / 2 < clientWidth &&
                            (rect.top + rect.bottom) / 2 < clientHeight) &&
                            (rect.left > 0 && rect.right > 0);
                        // Autoplay if user is in learner view and creator has specified
                        // to autoplay given video.
                        if (ContextService.getPageContext() ===
                            PAGE_CONTEXT.EXPLORATION_PLAYER && autoplayVal) {
                            // If it has been autoplayed then do not autoplay again.
                            if (!AutoplayedVideosService.hasVideoBeenAutoplayed(ctrl.videoId) && isVisible) {
                                ctrl.autoplaySuffix = '&autoplay=1';
                                AutoplayedVideosService.addAutoplayedVideo(ctrl.videoId);
                            }
                        }
                        ctrl.videoUrl = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + ctrl.videoId + '?rel=0' +
                            ctrl.timingParams + ctrl.autoplaySuffix);
                    }, 900);
                    // (^)Here timeout is set to 900ms. This is time it takes to bring the
                    // frame to correct point in browser and bring user to the main
                    // content. Smaller delay causes checks to be performed even before
                    // the player displays the content of the new card.
                    // This following check disables the video in Editor being caught
                    // by tabbing while in Exploration Editor mode.
                    if (ContextService.isInExplorationEditorMode()) {
                        ctrl.tabIndexVal = -1;
                    }
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./extensions/rich_text_components/richTextComponentsRequires.ts":
/*!***********************************************************************!*\
  !*** ./extensions/rich_text_components/richTextComponentsRequires.ts ***!
  \***********************************************************************/
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
 * @fileoverview Requires for all the RTC directives.
 */
__webpack_require__(/*! rich_text_components/Collapsible/directives/OppiaNoninteractiveCollapsibleDirective.ts */ "./extensions/rich_text_components/Collapsible/directives/OppiaNoninteractiveCollapsibleDirective.ts");
__webpack_require__(/*! rich_text_components/Image/directives/OppiaNoninteractiveImageDirective.ts */ "./extensions/rich_text_components/Image/directives/OppiaNoninteractiveImageDirective.ts");
__webpack_require__(/*! rich_text_components/Link/directives/OppiaNoninteractiveLinkDirective.ts */ "./extensions/rich_text_components/Link/directives/OppiaNoninteractiveLinkDirective.ts");
__webpack_require__(/*! rich_text_components/Math/directives/OppiaNoninteractiveMathDirective.ts */ "./extensions/rich_text_components/Math/directives/OppiaNoninteractiveMathDirective.ts");
__webpack_require__(/*! rich_text_components/Tabs/directives/OppiaNoninteractiveTabsDirective.ts */ "./extensions/rich_text_components/Tabs/directives/OppiaNoninteractiveTabsDirective.ts");
__webpack_require__(/*! rich_text_components/Video/directives/OppiaNoninteractiveVideoDirective.ts */ "./extensions/rich_text_components/Video/directives/OppiaNoninteractiveVideoDirective.ts");


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL0F1ZGlvRmlsZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3V0aWxpdGllcy9GaWxlRG93bmxvYWRSZXF1ZXN0T2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL0ltYWdlRmlsZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tcGxheWVyLXBhZ2Uvc2VydmljZXMvZXh0cmFjdC1pbWFnZS1maWxlbmFtZXMtZnJvbS1zdGF0ZS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlL3NlcnZpY2VzL2ltYWdlLXByZWxvYWRlci5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0Fzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0F1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0NvbXB1dGVHcmFwaFNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vZXh0ZW5zaW9ucy9yaWNoX3RleHRfY29tcG9uZW50cy9Db2xsYXBzaWJsZS9kaXJlY3RpdmVzL09wcGlhTm9uaW50ZXJhY3RpdmVDb2xsYXBzaWJsZURpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9leHRlbnNpb25zL3JpY2hfdGV4dF9jb21wb25lbnRzL0ltYWdlL2RpcmVjdGl2ZXMvT3BwaWFOb25pbnRlcmFjdGl2ZUltYWdlRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvcmljaF90ZXh0X2NvbXBvbmVudHMvTGluay9kaXJlY3RpdmVzL09wcGlhTm9uaW50ZXJhY3RpdmVMaW5rRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvcmljaF90ZXh0X2NvbXBvbmVudHMvTWF0aC9kaXJlY3RpdmVzL09wcGlhTm9uaW50ZXJhY3RpdmVNYXRoRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvcmljaF90ZXh0X2NvbXBvbmVudHMvVGFicy9kaXJlY3RpdmVzL09wcGlhTm9uaW50ZXJhY3RpdmVUYWJzRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvcmljaF90ZXh0X2NvbXBvbmVudHMvVmlkZW8vZGlyZWN0aXZlcy9PcHBpYU5vbmludGVyYWN0aXZlVmlkZW9EaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vZXh0ZW5zaW9ucy9yaWNoX3RleHRfY29tcG9uZW50cy9yaWNoVGV4dENvbXBvbmVudHNSZXF1aXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QyxRQUFRO0FBQ3BEO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQSxhQUFhLG1CQUFPLENBQUMsaUVBQWU7QUFDcEMsZUFBZSxtQkFBTyxDQUFDLDhGQUF5QjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBOzs7Ozs7Ozs7Ozs7QUMvQ0E7QUFD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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0EsbUJBQW1CLFNBQVM7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQixPQUFPO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDN1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRCxtQkFBTyxDQUFDLDRJQUFzRDtBQUM5RCxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRCxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLDRGQUE4QjtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNELHFCQUFxQjtBQUMzRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxhQUFhO0FBQ2I7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUM7QUFDbkMsOERBQThEO0FBQzlEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DO0FBQ25DLDhEQUE4RDtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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O0FBQ2xGLG1CQUFPLENBQUMsdUtBQTBFO0FBQ2xGLG1CQUFPLENBQUMsMktBQ2tDIiwiZmlsZSI6ImFkbWlufmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+bW9kZXJhdG9yfnByYWN0aWNlX3Nlc3Npb25+cmV2aWV3X3Rlc3R+Yjk5YTI3MjEuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBPYmplY3QgZmFjdG9yeSBmb3IgY3JlYXRpbmcgYXVkaW8gZmlsZXMuXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBBdWRpb0ZpbGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQXVkaW9GaWxlKGZpbGVuYW1lLCBkYXRhKSB7XG4gICAgICAgIHRoaXMuZmlsZW5hbWUgPSBmaWxlbmFtZTtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIEF1ZGlvRmlsZTtcbn0oKSk7XG5leHBvcnRzLkF1ZGlvRmlsZSA9IEF1ZGlvRmlsZTtcbnZhciBBdWRpb0ZpbGVPYmplY3RGYWN0b3J5ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEF1ZGlvRmlsZU9iamVjdEZhY3RvcnkoKSB7XG4gICAgfVxuICAgIEF1ZGlvRmlsZU9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZU5ldyA9IGZ1bmN0aW9uIChmaWxlbmFtZSwgZGF0YSkge1xuICAgICAgICByZXR1cm4gbmV3IEF1ZGlvRmlsZShmaWxlbmFtZSwgZGF0YSk7XG4gICAgfTtcbiAgICBBdWRpb0ZpbGVPYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIEF1ZGlvRmlsZU9iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBBdWRpb0ZpbGVPYmplY3RGYWN0b3J5O1xufSgpKTtcbmV4cG9ydHMuQXVkaW9GaWxlT2JqZWN0RmFjdG9yeSA9IEF1ZGlvRmlsZU9iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdBdWRpb0ZpbGVPYmplY3RGYWN0b3J5Jywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShBdWRpb0ZpbGVPYmplY3RGYWN0b3J5KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE9iamVjdCBmYWN0b3J5IGZvciBjcmVhdGluZyBhdWRpbyBmaWxlcy5cbiAqL1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIEZpbGVEb3dubG9hZFJlcXVlc3QgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmlsZURvd25sb2FkUmVxdWVzdChmaWxlbmFtZSwgY2FuY2VsZXIpIHtcbiAgICAgICAgdGhpcy5maWxlbmFtZSA9IGZpbGVuYW1lO1xuICAgICAgICB0aGlzLmNhbmNlbGVyID0gY2FuY2VsZXI7XG4gICAgfVxuICAgIHJldHVybiBGaWxlRG93bmxvYWRSZXF1ZXN0O1xufSgpKTtcbmV4cG9ydHMuRmlsZURvd25sb2FkUmVxdWVzdCA9IEZpbGVEb3dubG9hZFJlcXVlc3Q7XG52YXIgRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnkgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnkoKSB7XG4gICAgfVxuICAgIC8vIFRPRE8oWWFzaEppcGthdGUpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGtlcHQgYXNcbiAgICAvLyAnYW55JyBzaW5jZSBjYW5jZWxlciBpcyBhICdEZWZlcnJlZCcgdHlwZSBvYmplY3Qgd2hpY2ggaXMgbmF0aXZlIHRvXG4gICAgLy8gQW5ndWxhckpTIGFuZCBkb2VzIG5vdCBoYXZlIGEgdHlwZSBpbiBuYXRpdmUgdHlwZXNjcmlwdC5cbiAgICBGaWxlRG93bmxvYWRSZXF1ZXN0T2JqZWN0RmFjdG9yeS5wcm90b3R5cGUuY3JlYXRlTmV3ID0gZnVuY3Rpb24gKGZpbGVuYW1lLCBjYW5jZWxlcikge1xuICAgICAgICByZXR1cm4gbmV3IEZpbGVEb3dubG9hZFJlcXVlc3QoZmlsZW5hbWUsIGNhbmNlbGVyKTtcbiAgICB9O1xuICAgIEZpbGVEb3dubG9hZFJlcXVlc3RPYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIEZpbGVEb3dubG9hZFJlcXVlc3RPYmplY3RGYWN0b3J5KTtcbiAgICByZXR1cm4gRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5GaWxlRG93bmxvYWRSZXF1ZXN0T2JqZWN0RmFjdG9yeSA9IEZpbGVEb3dubG9hZFJlcXVlc3RPYmplY3RGYWN0b3J5O1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKEZpbGVEb3dubG9hZFJlcXVlc3RPYmplY3RGYWN0b3J5KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE9iamVjdCBmYWN0b3J5IGZvciBjcmVhdGluZyBpbWFnZSBmaWxlcy5cbiAqL1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIEltYWdlRmlsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbWFnZUZpbGUoZmlsZW5hbWUsIGRhdGEpIHtcbiAgICAgICAgdGhpcy5maWxlbmFtZSA9IGZpbGVuYW1lO1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIH1cbiAgICByZXR1cm4gSW1hZ2VGaWxlO1xufSgpKTtcbmV4cG9ydHMuSW1hZ2VGaWxlID0gSW1hZ2VGaWxlO1xudmFyIEltYWdlRmlsZU9iamVjdEZhY3RvcnkgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeSgpIHtcbiAgICB9XG4gICAgSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeS5wcm90b3R5cGUuY3JlYXRlTmV3ID0gZnVuY3Rpb24gKGZpbGVuYW1lLCBkYXRhKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW1hZ2VGaWxlKGZpbGVuYW1lLCBkYXRhKTtcbiAgICB9O1xuICAgIEltYWdlRmlsZU9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIEltYWdlRmlsZU9iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5JbWFnZUZpbGVPYmplY3RGYWN0b3J5ID0gSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0ltYWdlRmlsZU9iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKEltYWdlRmlsZU9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBleHRyYWN0IGltYWdlIGZpbGVuYW1lcyBpbiBhIFN0YXRlLlxuICovXG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0V4dHJhY3RJbWFnZUZpbGVuYW1lc0Zyb21TdGF0ZVNlcnZpY2UnLCBbXG4gICAgJ0h0bWxFc2NhcGVyU2VydmljZScsIGZ1bmN0aW9uIChIdG1sRXNjYXBlclNlcnZpY2UpIHtcbiAgICAgICAgdmFyIElOVEVSQUNUSU9OX1RZUEVfTVVMVElQTEVfQ0hPSUNFID0gJ011bHRpcGxlQ2hvaWNlSW5wdXQnO1xuICAgICAgICB2YXIgSU5URVJBQ1RJT05fVFlQRV9JVEVNX1NFTEVDVElPTiA9ICdJdGVtU2VsZWN0aW9uSW5wdXQnO1xuICAgICAgICB2YXIgSU5URVJBQ1RJT05fVFlQRV9JTUFHRV9DTElDS19JTlBVVCA9ICdJbWFnZUNsaWNrSW5wdXQnO1xuICAgICAgICB2YXIgSU5URVJBQ1RJT05fVFlQRV9EUkFHX0FORF9EUk9QX1NPUlQgPSAnRHJhZ0FuZERyb3BTb3J0SW5wdXQnO1xuICAgICAgICB2YXIgZmlsZW5hbWVzSW5TdGF0ZSA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyB0aGUgaHRtbCBmcm9tIHRoZSBzdGF0ZSdzIGNvbnRlbnQuXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzdGF0ZSAtIFRoZSBzdGF0ZSBmcm9tIHdoaWNoIHRoZSBodG1sIG9mIHRoZSBjb250ZW50XG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCBiZSByZXR1cm5lZC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfZ2V0U3RhdGVDb250ZW50SHRtbCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlLmNvbnRlbnQuZ2V0SHRtbCgpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyB0aGUgaHRtbCBmcm9tIHRoZSBvdXRjb21lIG9mIHRoZSBhbnN3ZXIgZ3JvdXBzIGFuZCB0aGUgZGVmYXVsdFxuICAgICAgICAgKiBvdXRjb21lIG9mIHRoZSBzdGF0ZS5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHN0YXRlIC0gVGhlIHN0YXRlIGZyb20gd2hpY2ggdGhlIGh0bWwgb2YgdGhlIG91dGNvbWVzIG9mXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBhbnN3ZXIgZ3JvdXBzIHNob3VsZCBiZSByZXR1cm5lZC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfZ2V0T3V0Y29tZXNIdG1sID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgb3V0Y29tZXNIdG1sID0gJyc7XG4gICAgICAgICAgICBzdGF0ZS5pbnRlcmFjdGlvbi5hbnN3ZXJHcm91cHMuZm9yRWFjaChmdW5jdGlvbiAoYW5zd2VyR3JvdXApIHtcbiAgICAgICAgICAgICAgICB2YXIgYW5zd2VyR3JvdXBIdG1sID0gYW5zd2VyR3JvdXAub3V0Y29tZS5mZWVkYmFjay5nZXRIdG1sKCk7XG4gICAgICAgICAgICAgICAgb3V0Y29tZXNIdG1sID0gb3V0Y29tZXNIdG1sLmNvbmNhdChhbnN3ZXJHcm91cEh0bWwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoc3RhdGUuaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBvdXRjb21lc0h0bWwgPSBvdXRjb21lc0h0bWwuY29uY2F0KHN0YXRlLmludGVyYWN0aW9uLmRlZmF1bHRPdXRjb21lLmZlZWRiYWNrLmdldEh0bWwoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0Y29tZXNIdG1sO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyB0aGUgaHRtbCBmcm9tIHRoZSBoaW50cyBpbiB0aGUgc3RhdGUuXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzdGF0ZSAtIFRoZSBzdGF0ZSB3aG9zZSBoaW50cycgaHRtbCBzaG91bGQgYmUgcmV0dXJuZWQuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX2dldEhpbnRzSHRtbCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAgICAgdmFyIGhpbnRzSHRtbCA9ICcnO1xuICAgICAgICAgICAgc3RhdGUuaW50ZXJhY3Rpb24uaGludHMuZm9yRWFjaChmdW5jdGlvbiAoaGludCkge1xuICAgICAgICAgICAgICAgIHZhciBoaW50SHRtbCA9IGhpbnQuaGludENvbnRlbnQuZ2V0SHRtbCgpO1xuICAgICAgICAgICAgICAgIGhpbnRzSHRtbCA9IGhpbnRzSHRtbC5jb25jYXQoaGludEh0bWwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gaGludHNIdG1sO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyB0aGUgaHRtbCBmcm9tIHRoZSBzb2x1dGlvbiBpbiB0aGUgc3RhdGUuXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzdGF0ZSAtIFRoZSBzdGF0ZSB3aG9zZSBzb2x1dGlvbidzIGh0bWwgc2hvdWxkIGJlXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybmVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9nZXRTb2x1dGlvbkh0bWwgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZS5pbnRlcmFjdGlvbi5zb2x1dGlvbi5leHBsYW5hdGlvbi5nZXRIdG1sKCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIGFsbCB0aGUgaHRtbCBpbiBhIHN0YXRlLlxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gc3RhdGUgLSBUaGUgc3RhdGUgd2hvc2UgaHRtbCBpcyB0byBiZSBmZXRjaGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9nZXRBbGxIdG1sT2ZTdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAgICAgdmFyIF9hbGxIdG1sSW5UaGVTdGF0ZSA9IFtdO1xuICAgICAgICAgICAgLy8gVGhlIG9yZGVyIG9mIHRoZSBleHRyYWN0ZWQgaW1hZ2UgbmFtZXMgaXMgc2FtZSBhcyB0aGV5IGFwcGVhciBpbiBhXG4gICAgICAgICAgICAvLyBzdGF0ZS4gVGhlIGltYWdlcyBzaG91bGQgYmUgcHJlbG9hZGVkIGluIHRoZSBmb2xsb3dpbmcgb3JkZXIgLS0tXG4gICAgICAgICAgICAvLyBjb250ZW50LCBjdXN0b21pemF0aW9uQXJncyBvZiBpbnRlcmFjdGlvbnMsIGZlZWRiYWNrIG9mIG91dGNvbWVzICgpXG4gICAgICAgICAgICAvLyBpbmNsdWRpbmcgZmVlZGJhY2sgb2YgZGVmYXVsdCBvdXRjb21lIGlmIGFueSksIGhpbnRzLCBzb2x1dGlvbiBpZiBhbnkuXG4gICAgICAgICAgICBfYWxsSHRtbEluVGhlU3RhdGUucHVzaChfZ2V0U3RhdGVDb250ZW50SHRtbChzdGF0ZSkpO1xuICAgICAgICAgICAgaWYgKHN0YXRlLmludGVyYWN0aW9uLmlkID09PSBJTlRFUkFDVElPTl9UWVBFX01VTFRJUExFX0NIT0lDRSB8fFxuICAgICAgICAgICAgICAgIHN0YXRlLmludGVyYWN0aW9uLmlkID09PSBJTlRFUkFDVElPTl9UWVBFX0lURU1fU0VMRUNUSU9OIHx8XG4gICAgICAgICAgICAgICAgc3RhdGUuaW50ZXJhY3Rpb24uaWQgPT09IElOVEVSQUNUSU9OX1RZUEVfRFJBR19BTkRfRFJPUF9TT1JUKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1c3RvbWl6YXRpb25BcmdzSHRtbCA9ICcnO1xuICAgICAgICAgICAgICAgIHN0YXRlLmludGVyYWN0aW9uLmN1c3RvbWl6YXRpb25BcmdzLmNob2ljZXMudmFsdWUuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ3NIdG1sID0gY3VzdG9taXphdGlvbkFyZ3NIdG1sLmNvbmNhdCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgX2FsbEh0bWxJblRoZVN0YXRlLnB1c2goY3VzdG9taXphdGlvbkFyZ3NIdG1sKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9hbGxIdG1sSW5UaGVTdGF0ZS5wdXNoKF9nZXRPdXRjb21lc0h0bWwoc3RhdGUpKTtcbiAgICAgICAgICAgIF9hbGxIdG1sSW5UaGVTdGF0ZS5wdXNoKF9nZXRIaW50c0h0bWwoc3RhdGUpKTtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5pbnRlcmFjdGlvbi5zb2x1dGlvbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIF9hbGxIdG1sSW5UaGVTdGF0ZS5wdXNoKF9nZXRTb2x1dGlvbkh0bWwoc3RhdGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfYWxsSHRtbEluVGhlU3RhdGU7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFeHRyYWN0cyB0aGUgZmlsZXBhdGggb2JqZWN0IGZyb20gdGhlIGZpbGVwYXRoLXZhbHVlIGF0dHJpYnV0ZSBvZiB0aGVcbiAgICAgICAgICogb3BwaWEtbm9uaW50ZXJhY3RpdmUtaW1hZ2UgdGFncyBpbiB0aGUgc3RySHRtbChnaXZlbiBzdHJpbmcpLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RySHRtbCAtIFRoZSBzdHJpbmcgZnJvbSB3aGljaCB0aGUgb2JqZWN0IG9mXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZXBhdGggc2hvdWxkIGJlIGV4dHJhY3RlZC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfZXh0cmFjdEZpbGVwYXRoVmFsdWVGcm9tT3BwaWFOb25JbnRlcmFjdGl2ZUltYWdlVGFnID0gZnVuY3Rpb24gKHN0ckh0bWwpIHtcbiAgICAgICAgICAgIHZhciBmaWxlbmFtZXMgPSBbXTtcbiAgICAgICAgICAgIHZhciBkdW1teUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIGR1bW15RWxlbWVudC5pbm5lckhUTUwgPSAoSHRtbEVzY2FwZXJTZXJ2aWNlLmVzY2FwZWRTdHJUb1VuZXNjYXBlZFN0cihzdHJIdG1sKSk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VUYWdMaXN0ID0gZHVtbXlFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdvcHBpYS1ub25pbnRlcmFjdGl2ZS1pbWFnZScpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbWFnZVRhZ0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIHRoZSBhdHRyaWJ1dGUgb2YgZmlsZXBhdGggaW4gb3BwaWEtbm9uaW50ZXJhY3RpdmUtaW1hZ2UgdGFnLlxuICAgICAgICAgICAgICAgIC8vIEJ1dCBpdCBhY3R1YWxseSBjb250YWlucyB0aGUgZmlsZW5hbWUgb25seS4gV2UgdXNlIHRoZSB2YXJpYWJsZVxuICAgICAgICAgICAgICAgIC8vIGZpbGVuYW1lIGluc3RlYWQgb2YgZmlsZXBhdGggc2luY2UgaW4gdGhlIGVuZCB3ZSBhcmUgcmV0cmlldmluZyB0aGVcbiAgICAgICAgICAgICAgICAvLyBmaWxlbmFtZXMgaW4gdGhlIGV4cGxvcmF0aW9uLlxuICAgICAgICAgICAgICAgIHZhciBmaWxlbmFtZSA9IEpTT04ucGFyc2UoaW1hZ2VUYWdMaXN0W2ldLmdldEF0dHJpYnV0ZSgnZmlsZXBhdGgtd2l0aC12YWx1ZScpKTtcbiAgICAgICAgICAgICAgICBmaWxlbmFtZXMucHVzaChmaWxlbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmlsZW5hbWVzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyB0aGUgZmlsZW5hbWVzIG9mIGFsbCB0aGUgaW1hZ2VzIHRoYXQgYXJlIGEgcGFydCBvZiB0aGUgc3RhdGUuXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzdGF0ZSAtIFRoZSBzdGF0ZSBmcm9tIHdoaWNoIHRoZSBmaWxlbmFtZXMgb2YgdGhlIGltYWdlXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCBiZSBleHRyYWN0ZWQuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX2dldEltYWdlRmlsZW5hbWVzSW5TdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAgICAgdmFyIGZpbGVuYW1lc0luU3RhdGUgPSBbXTtcbiAgICAgICAgICAgIC8vIFRoZSBJbWFnZSBDbGljayBJbnB1dCBpbnRlcmFjdGlvbiBoYXMgYW4gaW1hZ2Ugd2hvc2UgZmlsZW5hbWUgaXNcbiAgICAgICAgICAgIC8vIGRpcmVjdGx5IHN0b3JlZCBpbiB0aGUgY3VzdG9taXphdGlvbkFyZ3MuaW1hZ2VBbmRSZWdpb24udmFsdWVcbiAgICAgICAgICAgIC8vIC5pbWFnZVBhdGhcbiAgICAgICAgICAgIGlmIChzdGF0ZS5pbnRlcmFjdGlvbi5pZCA9PT0gSU5URVJBQ1RJT05fVFlQRV9JTUFHRV9DTElDS19JTlBVVCkge1xuICAgICAgICAgICAgICAgIHZhciBmaWxlbmFtZSA9IChzdGF0ZS5pbnRlcmFjdGlvbi5jdXN0b21pemF0aW9uQXJncy5pbWFnZUFuZFJlZ2lvbnMudmFsdWUuaW1hZ2VQYXRoKTtcbiAgICAgICAgICAgICAgICBmaWxlbmFtZXNJblN0YXRlLnB1c2goZmlsZW5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGFsbEh0bWxPZlN0YXRlID0gX2dldEFsbEh0bWxPZlN0YXRlKHN0YXRlKTtcbiAgICAgICAgICAgIGFsbEh0bWxPZlN0YXRlLmZvckVhY2goZnVuY3Rpb24gKGh0bWxTdHIpIHtcbiAgICAgICAgICAgICAgICBmaWxlbmFtZXNJblN0YXRlID0gZmlsZW5hbWVzSW5TdGF0ZS5jb25jYXQoX2V4dHJhY3RGaWxlcGF0aFZhbHVlRnJvbU9wcGlhTm9uSW50ZXJhY3RpdmVJbWFnZVRhZyhodG1sU3RyKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmaWxlbmFtZXNJblN0YXRlO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0SW1hZ2VGaWxlbmFtZXNJblN0YXRlOiBfZ2V0SW1hZ2VGaWxlbmFtZXNJblN0YXRlXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gcHJlbG9hZCBpbWFnZSBpbnRvIEFzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlJ3MgY2FjaGUuXG4gKi9cbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlL3NlcnZpY2VzLycgK1xuICAgICdleHRyYWN0LWltYWdlLWZpbGVuYW1lcy1mcm9tLXN0YXRlLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0Fzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Db21wdXRlR3JhcGhTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Db250ZXh0U2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnSW1hZ2VQcmVsb2FkZXJTZXJ2aWNlJywgW1xuICAgICckcScsICdBc3NldHNCYWNrZW5kQXBpU2VydmljZScsICdDb21wdXRlR3JhcGhTZXJ2aWNlJyxcbiAgICAnQ29udGV4dFNlcnZpY2UnLCAnRXh0cmFjdEltYWdlRmlsZW5hbWVzRnJvbVN0YXRlU2VydmljZScsICdFTlRJVFlfVFlQRScsXG4gICAgZnVuY3Rpb24gKCRxLCBBc3NldHNCYWNrZW5kQXBpU2VydmljZSwgQ29tcHV0ZUdyYXBoU2VydmljZSwgQ29udGV4dFNlcnZpY2UsIEV4dHJhY3RJbWFnZUZpbGVuYW1lc0Zyb21TdGF0ZVNlcnZpY2UsIEVOVElUWV9UWVBFKSB7XG4gICAgICAgIHZhciBNQVhfTlVNX0lNQUdFX0ZJTEVTX1RPX0RPV05MT0FEX1NJTVVMVEFORU9VU0xZID0gMztcbiAgICAgICAgdmFyIF9maWxlbmFtZXNPZkltYWdlQ3VycmVudGx5RG93bmxvYWRpbmcgPSBbXTtcbiAgICAgICAgdmFyIF9maWxlbmFtZXNPZkltYWdlVG9CZURvd25sb2FkZWQgPSBbXTtcbiAgICAgICAgdmFyIF9maWxlbmFtZXNPZkltYWdlRmFpbGVkVG9Eb3dubG9hZCA9IFtdO1xuICAgICAgICB2YXIgX2V4cGxvcmF0aW9uID0gbnVsbDtcbiAgICAgICAgdmFyIF9zdGF0ZXMgPSBudWxsO1xuICAgICAgICB2YXIgX2hhc0ltYWdlUHJlbG9hZGVyU2VydmljZVN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgLy8gaW1hZ2VMb2FkZWRDYWxsYmFjayBpcyBhbiBvYmplY3Qgb2Ygb2JqZWN0cyAoaWRlbnRpZmllZCBieSB0aGUgZmlsZW5hbWVzXG4gICAgICAgIC8vIHdoaWNoIGFyZSBiZWluZyBkb3dubG9hZGVkIGF0IHRoZSB0aW1lIHRoZXkgYXJlIHJlcXVpcmVkIGJ5IHRoZVxuICAgICAgICAvLyBkaXJlY3RpdmUpLlRoZSBvYmplY3QgY29udGFpbnMgdGhlIHJlc29sdmUgbWV0aG9kIG9mIHRoZSBwcm9taXNlXG4gICAgICAgIC8vIGF0dGFjaGVkIHdpdGggZ2V0SW5JbWFnZVVybCBtZXRob2QuXG4gICAgICAgIHZhciBfaW1hZ2VMb2FkZWRDYWxsYmFjayA9IHt9O1xuICAgICAgICB2YXIgX2hhc0ltYWdlUHJlbG9hZGVyU2VydmljZVN0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIF9pbml0ID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uKSB7XG4gICAgICAgICAgICBfZXhwbG9yYXRpb24gPSBleHBsb3JhdGlvbjtcbiAgICAgICAgICAgIF9zdGF0ZXMgPSBleHBsb3JhdGlvbi5zdGF0ZXM7XG4gICAgICAgICAgICBfaGFzSW1hZ2VQcmVsb2FkZXJTZXJ2aWNlU3RhcnRlZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBVcmwgZm9yIHRoZSBpbWFnZSBmaWxlLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgLSBGaWxlbmFtZSBvZiB0aGUgaW1hZ2Ugd2hvc2UgVXJsIGlzIHRvIGJlXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZWQuXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uTG9hZENhbGxiYWNrIC0gRnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGVcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBVcmwgb2YgdGhlIGxvYWRlZCBpbWFnZSBpcyBvYnRhaW5lZC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfZ2V0SW1hZ2VVcmwgPSBmdW5jdGlvbiAoZmlsZW5hbWUsIG9uTG9hZENhbGxiYWNrLCBvbkVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIEFzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlLmxvYWRJbWFnZShDb250ZXh0U2VydmljZS5nZXRFbnRpdHlUeXBlKCksIENvbnRleHRTZXJ2aWNlLmdldEVudGl0eUlkKCksIGZpbGVuYW1lKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChsb2FkZWRJbWFnZUZpbGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoX2lzSW5GYWlsZWREb3dubG9hZChsb2FkZWRJbWFnZUZpbGUuZmlsZW5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIF9yZW1vdmVGcm9tRmFpbGVkRG93bmxvYWQobG9hZGVkSW1hZ2VGaWxlLmZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG9iamVjdFVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwobG9hZGVkSW1hZ2VGaWxlLmRhdGEpO1xuICAgICAgICAgICAgICAgIG9uTG9hZENhbGxiYWNrKG9iamVjdFVybCk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICBvbkVycm9yQ2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2tzIGlmIHRoZSBnaXZlbiBmaWxlbmFtZSBpcyBpbiBfZmlsZW5hbWVzT2ZJbWFnZUZhaWxlZFRvRG93bmxvYWQgb3JcbiAgICAgICAgICogbm90LlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgLSBUaGUgZmlsZW5hbWUgb2YgdGhlIGltYWdlIHdoaWNoIGlzIHRvIGJlXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWQgZnJvbSB0aGVcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VGYWlsZWRUb0Rvd25sb2FkIGFycmF5LlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9pc0luRmFpbGVkRG93bmxvYWQgPSBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBfZmlsZW5hbWVzT2ZJbWFnZUZhaWxlZFRvRG93bmxvYWQuaW5kZXhPZihmaWxlbmFtZSkgPj0gMDtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgdGhlIGdpdmVuIGZpbGVuYW1lIGZyb20gdGhlIF9maWxlbmFtZXNPZkltYWdlRmFpbGVkVG9Eb3dubG9hZC5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIC0gVGhlIGZpbGVuYW1lIG9mIHRoZSBmaWxlIHdoaWNoIGlzIHRvIGJlXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWQgZnJvbSB0aGVcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VGYWlsZWRUb0Rvd25sb2FkIGFycmF5LlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9yZW1vdmVGcm9tRmFpbGVkRG93bmxvYWQgPSBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IF9maWxlbmFtZXNPZkltYWdlRmFpbGVkVG9Eb3dubG9hZC5pbmRleE9mKGZpbGVuYW1lKTtcbiAgICAgICAgICAgIF9maWxlbmFtZXNPZkltYWdlRmFpbGVkVG9Eb3dubG9hZC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyBpbWFnZSBmaWxlcyBuYW1lcyBpbiBCZnMgb3JkZXIgZnJvbSB0aGUgc3RhdGUuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2VTdGF0ZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgc3RhcnRpbmcgc3RhdGVcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20gd2hpY2ggdGhlIGZpbGVuYW1lcyBzaG91bGRcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlIG9idGFpbmVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9nZXRJbWFnZUZpbGVuYW1lc0luQmZzT3JkZXIgPSBmdW5jdGlvbiAoc291cmNlU3RhdGVOYW1lKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGVOYW1lc0luQmZzT3JkZXIgPSAoQ29tcHV0ZUdyYXBoU2VydmljZS5jb21wdXRlQmZzVHJhdmVyc2FsT2ZTdGF0ZXMoX2V4cGxvcmF0aW9uLmdldEluaXRpYWxTdGF0ZSgpLm5hbWUsIF9leHBsb3JhdGlvbi5nZXRTdGF0ZXMoKSwgc291cmNlU3RhdGVOYW1lKSk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VGaWxlbmFtZXMgPSBbXTtcbiAgICAgICAgICAgIHN0YXRlTmFtZXNJbkJmc09yZGVyLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IF9zdGF0ZXMuZ2V0U3RhdGUoc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICBFeHRyYWN0SW1hZ2VGaWxlbmFtZXNGcm9tU3RhdGVTZXJ2aWNlLmdldEltYWdlRmlsZW5hbWVzSW5TdGF0ZShzdGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGltYWdlRmlsZW5hbWVzLnB1c2goZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VGaWxlbmFtZXM7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIHRoZSBmaWxlbmFtZSBmcm9tIHRoZSBfZmlsZW5hbWVzT2ZJbWFnZUN1cnJlbnRseURvd25sb2FkaW5nIGFuZFxuICAgICAgICAgKiBpbml0aWF0ZXMgdGhlIGxvYWRpbmcgb2YgdGhlIG5leHQgaW1hZ2UgZmlsZS5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIC0gVGhlIGZpbGVuYW1lIHdoaWNoIGlzIHRvIGJlIHJlbW92ZWQgZnJvbSB0aGVcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VDdXJyZW50bHlEb3dubG9hZGluZyBhcnJheS5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfcmVtb3ZlQ3VycmVudEFuZExvYWROZXh0SW1hZ2UgPSBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIF9maWxlbmFtZXNPZkltYWdlQ3VycmVudGx5RG93bmxvYWRpbmcgPSAoX2ZpbGVuYW1lc09mSW1hZ2VDdXJyZW50bHlEb3dubG9hZGluZy5maWx0ZXIoZnVuY3Rpb24gKGltYWdlRmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZW5hbWUgIT09IGltYWdlRmlsZW5hbWU7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBpZiAoX2ZpbGVuYW1lc09mSW1hZ2VUb0JlRG93bmxvYWRlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRJbWFnZUZpbGVuYW1lID0gX2ZpbGVuYW1lc09mSW1hZ2VUb0JlRG93bmxvYWRlZC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIF9maWxlbmFtZXNPZkltYWdlQ3VycmVudGx5RG93bmxvYWRpbmcucHVzaChuZXh0SW1hZ2VGaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgX2xvYWRJbWFnZShuZXh0SW1hZ2VGaWxlbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIYW5kbGVzIHRoZSBsb2FkaW5nIG9mIHRoZSBpbWFnZSBmaWxlLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW1hZ2VGaWxlbmFtZSAtIFRoZSBmaWxlbmFtZSBvZiB0aGUgaW1hZ2UgdG8gYmUgbG9hZGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9sb2FkSW1hZ2UgPSBmdW5jdGlvbiAoaW1hZ2VGaWxlbmFtZSkge1xuICAgICAgICAgICAgQXNzZXRzQmFja2VuZEFwaVNlcnZpY2UubG9hZEltYWdlKEVOVElUWV9UWVBFLkVYUExPUkFUSU9OLCBDb250ZXh0U2VydmljZS5nZXRFeHBsb3JhdGlvbklkKCksIGltYWdlRmlsZW5hbWUpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGxvYWRlZEltYWdlKSB7XG4gICAgICAgICAgICAgICAgX3JlbW92ZUN1cnJlbnRBbmRMb2FkTmV4dEltYWdlKGxvYWRlZEltYWdlLmZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoX2ltYWdlTG9hZGVkQ2FsbGJhY2tbbG9hZGVkSW1hZ2UuZmlsZW5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbkxvYWRJbWFnZVJlc29sdmUgPSAoKF9pbWFnZUxvYWRlZENhbGxiYWNrW2xvYWRlZEltYWdlLmZpbGVuYW1lXSkucmVzb2x2ZU1ldGhvZCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvYmplY3RVcmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGxvYWRlZEltYWdlLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBvbkxvYWRJbWFnZVJlc29sdmUob2JqZWN0VXJsKTtcbiAgICAgICAgICAgICAgICAgICAgX2ltYWdlTG9hZGVkQ2FsbGJhY2tbbG9hZGVkSW1hZ2UuZmlsZW5hbWVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoX2ltYWdlTG9hZGVkQ2FsbGJhY2tbZmlsZW5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbkZhaWxlZERvd25sb2FkID0gKChfaW1hZ2VMb2FkZWRDYWxsYmFja1tmaWxlbmFtZV0pLnJlamVjdE1ldGhvZCk7XG4gICAgICAgICAgICAgICAgICAgIG9uRmFpbGVkRG93bmxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgX2ltYWdlTG9hZGVkQ2FsbGJhY2tbZmlsZW5hbWVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VGYWlsZWRUb0Rvd25sb2FkLnB1c2goZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIF9yZW1vdmVDdXJyZW50QW5kTG9hZE5leHRJbWFnZShmaWxlbmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEluaXRpYXRlcyB0aGUgaW1hZ2UgcHJlbG9hZGVyIGJlZ2lubmluZyBmcm9tIHRoZSBzb3VyY2VTdGF0ZU5hbWUuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2VTdGF0ZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgc3RhdGUgZnJvbSB3aGljaFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlbG9hZGVyIHNob3VsZCBzdGFydC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfa2lja09mZkltYWdlUHJlbG9hZGVyID0gZnVuY3Rpb24gKHNvdXJjZVN0YXRlTmFtZSkge1xuICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VUb0JlRG93bmxvYWRlZCA9IChfZ2V0SW1hZ2VGaWxlbmFtZXNJbkJmc09yZGVyKHNvdXJjZVN0YXRlTmFtZSkpO1xuICAgICAgICAgICAgdmFyIGltYWdlRmlsZXNJbkdpdmVuU3RhdGUgPSBFeHRyYWN0SW1hZ2VGaWxlbmFtZXNGcm9tU3RhdGVTZXJ2aWNlXG4gICAgICAgICAgICAgICAgLmdldEltYWdlRmlsZW5hbWVzSW5TdGF0ZShfc3RhdGVzLmdldFN0YXRlKHNvdXJjZVN0YXRlTmFtZSkpO1xuICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VGYWlsZWRUb0Rvd25sb2FkID0gX2ZpbGVuYW1lc09mSW1hZ2VGYWlsZWRUb0Rvd25sb2FkXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW1hZ2VGaWxlc0luR2l2ZW5TdGF0ZS5pbmRleE9mKGZpbGVuYW1lKSA9PT0gLTE7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHdoaWxlIChfZmlsZW5hbWVzT2ZJbWFnZUN1cnJlbnRseURvd25sb2FkaW5nLmxlbmd0aCA8XG4gICAgICAgICAgICAgICAgTUFYX05VTV9JTUFHRV9GSUxFU19UT19ET1dOTE9BRF9TSU1VTFRBTkVPVVNMWSAmJlxuICAgICAgICAgICAgICAgIF9maWxlbmFtZXNPZkltYWdlVG9CZURvd25sb2FkZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBpbWFnZUZpbGVuYW1lID0gX2ZpbGVuYW1lc09mSW1hZ2VUb0JlRG93bmxvYWRlZC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIF9maWxlbmFtZXNPZkltYWdlQ3VycmVudGx5RG93bmxvYWRpbmcucHVzaChpbWFnZUZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICBfbG9hZEltYWdlKGltYWdlRmlsZW5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2FuY2VscyB0aGUgcHJlbG9hZGluZyBvZiB0aGUgaW1hZ2VzIHRoYXQgYXJlIGJlaW5nIGRvd25sb2FkZWQuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX2NhbmNlbFByZWxvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBBc3NldHNCYWNrZW5kQXBpU2VydmljZS5hYm9ydEFsbEN1cnJlbnRJbWFnZURvd25sb2FkcygpO1xuICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VDdXJyZW50bHlEb3dubG9hZGluZyA9IFtdO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogV2hlbiB0aGUgc3RhdGUgY2hhbmdlcywgaXQgZGVjaWRlcyB3aGV0aGVyIHRvIHJlc3RhcnQgdGhlIHByZWxvYWRlclxuICAgICAgICAgKiBzdGFydGluZyBmcm9tIHRoZSAnc3RhdGVOYW1lJyBzdGF0ZSBvciBub3QuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgc3RhdGUgdGhlIHVzZXIgc2hpZnRzIHRvLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9vblN0YXRlQ2hhbmdlID0gZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgaWYgKHN0YXRlTmFtZSAhPT0gX2V4cGxvcmF0aW9uLmdldEluaXRpYWxTdGF0ZSgpLm5hbWUpIHtcbiAgICAgICAgICAgICAgICBfaW1hZ2VMb2FkZWRDYWxsYmFjayA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBpbWFnZUZpbGVuYW1lc0luU3RhdGUgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgbm9PZkltYWdlRmlsZXNDdXJyZW50bHlEb3dubG9hZGluZyA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIG5vT2ZJbWFnZXNOZWl0aGVySW5DYWNoZU5vckRvd25sb2FkaW5nID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdGUgPSBfc3RhdGVzLmdldFN0YXRlKHN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgaW1hZ2VGaWxlbmFtZXNJblN0YXRlID0gKEV4dHJhY3RJbWFnZUZpbGVuYW1lc0Zyb21TdGF0ZVNlcnZpY2VcbiAgICAgICAgICAgICAgICAgICAgLmdldEltYWdlRmlsZW5hbWVzSW5TdGF0ZShzdGF0ZSkpO1xuICAgICAgICAgICAgICAgIGltYWdlRmlsZW5hbWVzSW5TdGF0ZS5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNGaWxlQ3VycmVudGx5RG93bmxvYWRpbmcgPSAoX2ZpbGVuYW1lc09mSW1hZ2VDdXJyZW50bHlEb3dubG9hZGluZy5pbmRleE9mKGZpbGVuYW1lKSA+PSAwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFBc3NldHNCYWNrZW5kQXBpU2VydmljZS5pc0NhY2hlZChmaWxlbmFtZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICFpc0ZpbGVDdXJyZW50bHlEb3dubG9hZGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9PZkltYWdlc05laXRoZXJJbkNhY2hlTm9yRG93bmxvYWRpbmcgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNGaWxlQ3VycmVudGx5RG93bmxvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vT2ZJbWFnZUZpbGVzQ3VycmVudGx5RG93bmxvYWRpbmcgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChub09mSW1hZ2VzTmVpdGhlckluQ2FjaGVOb3JEb3dubG9hZGluZyA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgbm9PZkltYWdlRmlsZXNDdXJyZW50bHlEb3dubG9hZGluZyA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIF9jYW5jZWxQcmVsb2FkaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIF9raWNrT2ZmSW1hZ2VQcmVsb2FkZXIoc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIGltYWdlcyBmcm9tIHRoZSBmaWxlbmFtZSBwcm92aWRlZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgLSBUaGUgc3RyaW5nIGZyb20gd2hpY2ggdGhlIGRpbWVuc2lvbnMgb2YgdGhlXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBpbWFnZXMgc2hvdWxkIGJlIGV4dHJhY3RlZC5cbiAgICAgICAgKi9cbiAgICAgICAgdmFyIGdldERpbWVuc2lvbnNPZkltYWdlID0gZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICB2YXIgZGltZW5zaW9uc1JlZ2V4ID0gUmVnRXhwKCdbXi9dK19oZWlnaHRfKFswLTldKylfd2lkdGhfKFswLTldKylcXC4ocG5nfGpwZWd8anBnfGdpZikkJywgJ2cnKTtcbiAgICAgICAgICAgIHZhciBpbWFnZURpbWVuc2lvbnMgPSBkaW1lbnNpb25zUmVnZXguZXhlYyhmaWxlbmFtZSk7XG4gICAgICAgICAgICBpZiAoaW1hZ2VEaW1lbnNpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpbWVuc2lvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogTnVtYmVyKGltYWdlRGltZW5zaW9uc1sxXSksXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBOdW1iZXIoaW1hZ2VEaW1lbnNpb25zWzJdKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpbWVuc2lvbnM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbWFnZSBuYW1lIGlzIGludmFsaWQsIGl0IGRvZXMgbm90IGNvbnRhaW4gZGltZW5zaW9ucy4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluaXQ6IF9pbml0LFxuICAgICAgICAgICAga2lja09mZkltYWdlUHJlbG9hZGVyOiBfa2lja09mZkltYWdlUHJlbG9hZGVyLFxuICAgICAgICAgICAgZ2V0RGltZW5zaW9uc09mSW1hZ2U6IGdldERpbWVuc2lvbnNPZkltYWdlLFxuICAgICAgICAgICAgb25TdGF0ZUNoYW5nZTogX29uU3RhdGVDaGFuZ2UsXG4gICAgICAgICAgICBpc0luRmFpbGVkRG93bmxvYWQ6IF9pc0luRmFpbGVkRG93bmxvYWQsXG4gICAgICAgICAgICBpc0xvYWRpbmdJbWFnZUZpbGU6IGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfZmlsZW5hbWVzT2ZJbWFnZUN1cnJlbnRseURvd25sb2FkaW5nLmluZGV4T2YoZmlsZW5hbWUpICE9PSAtMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN0YXJ0SW1hZ2VQcmVsb2FkZXI6IGZ1bmN0aW9uIChzb3VyY2VTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBfY2FuY2VsUHJlbG9hZGluZygpO1xuICAgICAgICAgICAgICAgIF9raWNrT2ZmSW1hZ2VQcmVsb2FkZXIoc291cmNlU3RhdGVOYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRGaWxlbmFtZXNPZkltYWdlQ3VycmVudGx5RG93bmxvYWRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2ZpbGVuYW1lc09mSW1hZ2VDdXJyZW50bHlEb3dubG9hZGluZztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRJbWFnZVVybDogZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlLmlzQ2FjaGVkKGZpbGVuYW1lKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgX2lzSW5GYWlsZWREb3dubG9hZChmaWxlbmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9nZXRJbWFnZVVybChmaWxlbmFtZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9pbWFnZUxvYWRlZENhbGxiYWNrW2ZpbGVuYW1lXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlTWV0aG9kOiByZXNvbHZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdE1ldGhvZDogcmVqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5FeHBsb3JhdGlvblBsYXllcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfaGFzSW1hZ2VQcmVsb2FkZXJTZXJ2aWNlU3RhcnRlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBzZXJ2ZSBhcyB0aGUgaW50ZXJmYWNlIGZvciBmZXRjaGluZyBhbmQgdXBsb2FkaW5nXG4gKiBhc3NldHMgZnJvbSBHb29nbGUgQ2xvdWQgU3RvcmFnZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9BdWRpb0ZpbGVPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0ZpbGVEb3dubG9hZFJlcXVlc3RPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0ltYWdlRmlsZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0NzcmZUb2tlblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0Fzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICdBdWRpb0ZpbGVPYmplY3RGYWN0b3J5JywgJ0NzcmZUb2tlblNlcnZpY2UnLFxuICAgICdGaWxlRG93bmxvYWRSZXF1ZXN0T2JqZWN0RmFjdG9yeScsICdJbWFnZUZpbGVPYmplY3RGYWN0b3J5JyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCAnREVWX01PREUnLCAnRU5USVRZX1RZUEUnLFxuICAgICdHQ1NfUkVTT1VSQ0VfQlVDS0VUX05BTUUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIEF1ZGlvRmlsZU9iamVjdEZhY3RvcnksIENzcmZUb2tlblNlcnZpY2UsIEZpbGVEb3dubG9hZFJlcXVlc3RPYmplY3RGYWN0b3J5LCBJbWFnZUZpbGVPYmplY3RGYWN0b3J5LCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgREVWX01PREUsIEVOVElUWV9UWVBFLCBHQ1NfUkVTT1VSQ0VfQlVDS0VUX05BTUUpIHtcbiAgICAgICAgaWYgKCFERVZfTU9ERSAmJiAhR0NTX1JFU09VUkNFX0JVQ0tFVF9OQU1FKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignR0NTX1JFU09VUkNFX0JVQ0tFVF9OQU1FIGlzIG5vdCBzZXQgaW4gcHJvZC4nKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBMaXN0IG9mIGZpbGVuYW1lcyB0aGF0IGhhdmUgYmVlbiByZXF1ZXN0ZWQgZm9yIGJ1dCBoYXZlXG4gICAgICAgIC8vIHlldCB0byByZXR1cm4gYSByZXNwb25zZS5cbiAgICAgICAgdmFyIF9hdWRpb0ZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQgPSBbXTtcbiAgICAgICAgdmFyIF9pbWFnZUZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQgPSBbXTtcbiAgICAgICAgdmFyIEFTU0VUX1RZUEVfQVVESU8gPSAnYXVkaW8nO1xuICAgICAgICB2YXIgQVNTRVRfVFlQRV9JTUFHRSA9ICdpbWFnZSc7XG4gICAgICAgIHZhciBHQ1NfUFJFRklYID0gKCdodHRwczovL3N0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vJyArXG4gICAgICAgICAgICBHQ1NfUkVTT1VSQ0VfQlVDS0VUX05BTUUpO1xuICAgICAgICB2YXIgQVVESU9fRE9XTkxPQURfVVJMX1RFTVBMQVRFID0gKChERVZfTU9ERSA/ICcvYXNzZXRzZGV2aGFuZGxlcicgOiBHQ1NfUFJFRklYKSArXG4gICAgICAgICAgICAnLzxlbnRpdHlfdHlwZT4vPGVudGl0eV9pZD4vYXNzZXRzL2F1ZGlvLzxmaWxlbmFtZT4nKTtcbiAgICAgICAgdmFyIElNQUdFX0RPV05MT0FEX1VSTF9URU1QTEFURSA9ICgoREVWX01PREUgPyAnL2Fzc2V0c2RldmhhbmRsZXInIDogR0NTX1BSRUZJWCkgK1xuICAgICAgICAgICAgJy88ZW50aXR5X3R5cGU+LzxlbnRpdHlfaWQ+L2Fzc2V0cy9pbWFnZS88ZmlsZW5hbWU+Jyk7XG4gICAgICAgIHZhciBBVURJT19VUExPQURfVVJMX1RFTVBMQVRFID0gJy9jcmVhdGVoYW5kbGVyL2F1ZGlvdXBsb2FkLzxleHBsb3JhdGlvbl9pZD4nO1xuICAgICAgICAvLyBNYXAgZnJvbSBhc3NldCBmaWxlbmFtZSB0byBhc3NldCBibG9iLlxuICAgICAgICB2YXIgYXNzZXRzQ2FjaGUgPSB7fTtcbiAgICAgICAgdmFyIF9mZXRjaEZpbGUgPSBmdW5jdGlvbiAoZW50aXR5VHlwZSwgZW50aXR5SWQsIGZpbGVuYW1lLCBhc3NldFR5cGUsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGNhbmNlbGVyID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIGlmIChhc3NldFR5cGUgPT09IEFTU0VUX1RZUEVfQVVESU8pIHtcbiAgICAgICAgICAgICAgICBfYXVkaW9GaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkLnB1c2goRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnkuY3JlYXRlTmV3KGZpbGVuYW1lLCBjYW5jZWxlcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgX2ltYWdlRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZC5wdXNoKEZpbGVEb3dubG9hZFJlcXVlc3RPYmplY3RGYWN0b3J5LmNyZWF0ZU5ldyhmaWxlbmFtZSwgY2FuY2VsZXIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlVHlwZTogJ2Jsb2InLFxuICAgICAgICAgICAgICAgIHVybDogX2dldERvd25sb2FkVXJsKGVudGl0eVR5cGUsIGVudGl0eUlkLCBmaWxlbmFtZSwgYXNzZXRUeXBlKSxcbiAgICAgICAgICAgICAgICB0aW1lb3V0OiBjYW5jZWxlci5wcm9taXNlXG4gICAgICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFzc2V0QmxvYiA9IG51bGw7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0VHlwZSA9PT0gQVNTRVRfVFlQRV9BVURJTykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHR5cGUgZm9yIGF1ZGlvIGFzc2V0cy4gV2l0aG91dCB0aGlzLCB0cmFuc2xhdGlvbnMgY2FuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3QgYmUgcGxheWVkIG9uIFNhZmFyaS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0QmxvYiA9IG5ldyBCbG9iKFtkYXRhXSwgeyB0eXBlOiAnYXVkaW8vbXBlZycgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldEJsb2IgPSBuZXcgQmxvYihbZGF0YV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LkJsb2JCdWlsZGVyID0gd2luZG93LkJsb2JCdWlsZGVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuV2ViS2l0QmxvYkJ1aWxkZXIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5Nb3pCbG9iQnVpbGRlciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lk1TQmxvYkJ1aWxkZXI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChleGNlcHRpb24ubmFtZSA9PT0gJ1R5cGVFcnJvcicgJiYgd2luZG93LkJsb2JCdWlsZGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBibG9iQnVpbGRlciA9IG5ldyBCbG9iQnVpbGRlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2JCdWlsZGVyLmFwcGVuZChkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldEJsb2IgPSBibG9iQnVpbGRlci5nZXRCbG9iKGFzc2V0VHlwZS5jb25jYXQoJy8qJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWRkaXRpb25hbEluZm8gPSAoJ1xcbkJsb2JCdWlsZGVyIGNvbnN0cnVjdGlvbiBlcnJvciBkZWJ1ZyBsb2dzOicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXFxuQXNzZXQgdHlwZTogJyArIGFzc2V0VHlwZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdcXG5EYXRhOiAnICsgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5tZXNzYWdlICs9IGFkZGl0aW9uYWxJbmZvO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWRkaXRpb25hbEluZm8gPSAoJ1xcbkJsb2IgY29uc3RydWN0aW9uIGVycm9yIGRlYnVnIGxvZ3M6JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1xcbkFzc2V0IHR5cGU6ICcgKyBhc3NldFR5cGUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdcXG5EYXRhOiAnICsgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBleGNlcHRpb24ubWVzc2FnZSArPSBhZGRpdGlvbmFsSW5mbztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhc3NldHNDYWNoZVtmaWxlbmFtZV0gPSBhc3NldEJsb2I7XG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0VHlwZSA9PT0gQVNTRVRfVFlQRV9BVURJTykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soQXVkaW9GaWxlT2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoZmlsZW5hbWUsIGFzc2V0QmxvYikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKEltYWdlRmlsZU9iamVjdEZhY3RvcnkuY3JlYXRlTmV3KGZpbGVuYW1lLCBhc3NldEJsb2IpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhmaWxlbmFtZSk7XG4gICAgICAgICAgICB9KVsnZmluYWxseSddKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfcmVtb3ZlRnJvbUZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQoZmlsZW5hbWUsIGFzc2V0VHlwZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9hYm9ydEFsbEN1cnJlbnREb3dubG9hZHMgPSBmdW5jdGlvbiAoYXNzZXRUeXBlKSB7XG4gICAgICAgICAgICBpZiAoYXNzZXRUeXBlID09PSBBU1NFVF9UWVBFX0FVRElPKSB7XG4gICAgICAgICAgICAgICAgX2F1ZGlvRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZC5mb3JFYWNoKGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuY2FuY2VsZXIucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF9hdWRpb0ZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIF9pbWFnZUZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQuZm9yRWFjaChmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmNhbmNlbGVyLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBfaW1hZ2VGaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfcmVtb3ZlRnJvbUZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQgPSBmdW5jdGlvbiAoZmlsZW5hbWUsIGFzc2V0VHlwZSkge1xuICAgICAgICAgICAgaWYgKF9pc0Fzc2V0Q3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQoZmlsZW5hbWUsIEFTU0VUX1RZUEVfQVVESU8pKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8XG4gICAgICAgICAgICAgICAgICAgIF9hdWRpb0ZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfYXVkaW9GaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkW2luZGV4XS5maWxlbmFtZSA9PT0gZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hdWRpb0ZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoX2lzQXNzZXRDdXJyZW50bHlCZWluZ1JlcXVlc3RlZChmaWxlbmFtZSwgQVNTRVRfVFlQRV9JTUFHRSkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDxcbiAgICAgICAgICAgICAgICAgICAgX2ltYWdlRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZC5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9pbWFnZUZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWRbaW5kZXhdLmZpbGVuYW1lID09PSBmaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2ltYWdlRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfc2F2ZUF1ZGlvID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQsIGZpbGVuYW1lLCByYXdBc3NldERhdGEsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgICAgIGZvcm0uYXBwZW5kKCdyYXdfYXVkaW9fZmlsZScsIHJhd0Fzc2V0RGF0YSk7XG4gICAgICAgICAgICBmb3JtLmFwcGVuZCgncGF5bG9hZCcsIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWVcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIENzcmZUb2tlblNlcnZpY2UuZ2V0VG9rZW5Bc3luYygpLnRoZW4oZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgZm9ybS5hcHBlbmQoJ2NzcmZfdG9rZW4nLCB0b2tlbik7XG4gICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBfZ2V0QXVkaW9VcGxvYWRVcmwoZXhwbG9yYXRpb25JZCksXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGZvcm0sXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAndGV4dCcsXG4gICAgICAgICAgICAgICAgICAgIGRhdGFGaWx0ZXI6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIFhTU0kgcHJlZml4LlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybWVkRGF0YSA9IGRhdGEuc3Vic3RyaW5nKDUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UodHJhbnNmb3JtZWREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KS5kb25lKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkuZmFpbChmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIFhTU0kgcHJlZml4LlxuICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtZWREYXRhID0gZGF0YS5yZXNwb25zZVRleHQuc3Vic3RyaW5nKDUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyc2VkUmVzcG9uc2UgPSBhbmd1bGFyLmZyb21Kc29uKHRyYW5zZm9ybWVkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IocGFyc2VkUmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhwYXJzZWRSZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldERvd25sb2FkVXJsID0gZnVuY3Rpb24gKGVudGl0eVR5cGUsIGVudGl0eUlkLCBmaWxlbmFtZSwgYXNzZXRUeXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoKGFzc2V0VHlwZSA9PT0gQVNTRVRfVFlQRV9BVURJTyA/IEFVRElPX0RPV05MT0FEX1VSTF9URU1QTEFURSA6XG4gICAgICAgICAgICAgICAgSU1BR0VfRE9XTkxPQURfVVJMX1RFTVBMQVRFKSwge1xuICAgICAgICAgICAgICAgIGVudGl0eV9pZDogZW50aXR5SWQsXG4gICAgICAgICAgICAgICAgZW50aXR5X3R5cGU6IGVudGl0eVR5cGUsXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXRBdWRpb1VwbG9hZFVybCA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICByZXR1cm4gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoQVVESU9fVVBMT0FEX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uX2lkOiBleHBsb3JhdGlvbklkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9pc0Fzc2V0Q3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQgPSBmdW5jdGlvbiAoZmlsZW5hbWUsIGFzc2V0VHlwZSkge1xuICAgICAgICAgICAgaWYgKGFzc2V0VHlwZSA9PT0gQVNTRVRfVFlQRV9BVURJTykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfYXVkaW9GaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkLnNvbWUoZnVuY3Rpb24gKHJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3QuZmlsZW5hbWUgPT09IGZpbGVuYW1lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pbWFnZUZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQuc29tZShmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdC5maWxlbmFtZSA9PT0gZmlsZW5hbWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfaXNDYWNoZWQgPSBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBhc3NldHNDYWNoZS5oYXNPd25Qcm9wZXJ0eShmaWxlbmFtZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBsb2FkQXVkaW86IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCBmaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfaXNDYWNoZWQoZmlsZW5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKEF1ZGlvRmlsZU9iamVjdEZhY3RvcnkuY3JlYXRlTmV3KGZpbGVuYW1lLCBhc3NldHNDYWNoZVtmaWxlbmFtZV0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9mZXRjaEZpbGUoRU5USVRZX1RZUEUuRVhQTE9SQVRJT04sIGV4cGxvcmF0aW9uSWQsIGZpbGVuYW1lLCBBU1NFVF9UWVBFX0FVRElPLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbG9hZEltYWdlOiBmdW5jdGlvbiAoZW50aXR5VHlwZSwgZW50aXR5SWQsIGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9pc0NhY2hlZChmaWxlbmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoZmlsZW5hbWUsIGFzc2V0c0NhY2hlW2ZpbGVuYW1lXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2ZldGNoRmlsZShlbnRpdHlUeXBlLCBlbnRpdHlJZCwgZmlsZW5hbWUsIEFTU0VUX1RZUEVfSU1BR0UsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzYXZlQXVkaW86IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCBmaWxlbmFtZSwgcmF3QXNzZXREYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX3NhdmVBdWRpbyhleHBsb3JhdGlvbklkLCBmaWxlbmFtZSwgcmF3QXNzZXREYXRhLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzQ2FjaGVkOiBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2lzQ2FjaGVkKGZpbGVuYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBdWRpb0Rvd25sb2FkVXJsOiBmdW5jdGlvbiAoZW50aXR5VHlwZSwgZW50aXR5SWQsIGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9nZXREb3dubG9hZFVybChlbnRpdHlUeXBlLCBlbnRpdHlJZCwgZmlsZW5hbWUsIEFTU0VUX1RZUEVfQVVESU8pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFib3J0QWxsQ3VycmVudEF1ZGlvRG93bmxvYWRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX2Fib3J0QWxsQ3VycmVudERvd25sb2FkcyhBU1NFVF9UWVBFX0FVRElPKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhYm9ydEFsbEN1cnJlbnRJbWFnZURvd25sb2FkczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9hYm9ydEFsbEN1cnJlbnREb3dubG9hZHMoQVNTRVRfVFlQRV9JTUFHRSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0QXNzZXRzRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGF1ZGlvOiBfYXVkaW9GaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkLFxuICAgICAgICAgICAgICAgICAgICBpbWFnZTogX2ltYWdlRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0SW1hZ2VVcmxGb3JQcmV2aWV3OiBmdW5jdGlvbiAoZW50aXR5VHlwZSwgZW50aXR5SWQsIGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9nZXREb3dubG9hZFVybChlbnRpdHlUeXBlLCBlbnRpdHlJZCwgZmlsZW5hbWUsIEFTU0VUX1RZUEVfSU1BR0UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBBdXRvcGxheWVkIHZpZGVvcyBzZXJ2aWNlLlxuICovXG4vLyBBYm91dCB0aGlzIHNlcnZpY2U6XG4vLyBJbiB0aGUgZXhwbG9yYXRpb24gcGxheWVyLCBhIHZpZGVvIHNob3VsZCBvbmx5IGF1dG9wbGF5IHdoZW4gaXQgaXMgZmlyc3Qgc2VlblxuLy8gb24gYSBuZXcgY2FyZCwgYW5kIG5vdCB3aGVuIHRoZSBsZWFybmVyIGNsaWNrcyBiYWNrIHRvIHByZXZpb3VzIGNhcmRzIGluXG4vLyB0aGVpciBleHBsb3JhdGlvbiBwbGF5dGhyb3VnaC4gVGhpcyBzZXJ2aWNlIG1haW50YWlucyBhIGxpc3Qgb2YgdmlkZW9zIHRoYXRcbi8vIGhhdmUgYmVlbiBwbGF5ZWQsIHNvIHRoYXQgd2Uga25vdyBub3QgdG8gYXV0b3BsYXkgdGhlbSBvbiBhIHNlY29uZCBwYXNzLlxuLy9cbi8vIENhdmVhdDogaWYgdGhlIHNhbWUgdmlkZW8gaXMgc2hvd24gdHdpY2UgaW4gdGhlIGV4cGxvcmF0aW9uLCB0aGUgc2Vjb25kIGFuZFxuLy8gc3Vic2VxdWVudCBpbnN0YW5jZXMgb2YgdGhhdCB2aWRlbyB3aWxsIG5vdCBhdXRvcGxheS4gV2UgYmVsaWV2ZSB0aGlzXG4vLyBvY2N1cnJlbmNlIGlzIHJhcmUsIGFuZCBoYXZlIG5vdCBhY2NvdW50ZWQgZm9yIGl0IGhlcmUuIElmIGl0IHR1cm5zIG91dFxuLy8gdG8gYmUgYW4gaXNzdWUsIHdlIG1heSBuZWVkIHRvIGluc3RlYWQgYXNzaWduIGEgdW5pcXVlIGlkIHRvIGVhY2ggcmljaC10ZXh0XG4vLyBjb21wb25lbnQgYW5kIHVzZSB0aGF0IGlkIGluc3RlYWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdG8gc3VwcHJlc3Ncbi8vIGF1dG9wbGF5aW5nLlxudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlKCkge1xuICAgICAgICB0aGlzLmF1dG9wbGF5ZWRWaWRlb3NEaWN0ID0ge307XG4gICAgfVxuICAgIEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlLnByb3RvdHlwZS5hZGRBdXRvcGxheWVkVmlkZW8gPSBmdW5jdGlvbiAodmlkZW9JZCkge1xuICAgICAgICB0aGlzLmF1dG9wbGF5ZWRWaWRlb3NEaWN0W3ZpZGVvSWRdID0gdHJ1ZTtcbiAgICB9O1xuICAgIEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlLnByb3RvdHlwZS5oYXNWaWRlb0JlZW5BdXRvcGxheWVkID0gZnVuY3Rpb24gKHZpZGVvSWQpIHtcbiAgICAgICAgcmV0dXJuIEJvb2xlYW4odGhpcy5hdXRvcGxheWVkVmlkZW9zRGljdFt2aWRlb0lkXSk7XG4gICAgfTtcbiAgICBBdXRvcGxheWVkVmlkZW9zU2VydmljZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBBdXRvcGxheWVkVmlkZW9zU2VydmljZSk7XG4gICAgcmV0dXJuIEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlO1xufSgpKTtcbmV4cG9ydHMuQXV0b3BsYXllZFZpZGVvc1NlcnZpY2UgPSBBdXRvcGxheWVkVmlkZW9zU2VydmljZTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0F1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlJywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShBdXRvcGxheWVkVmlkZW9zU2VydmljZSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBjb21wdXRpbmcgYSBncmFwaGljYWwgcmVwcmVzZW50YXRpb24gb2YgYW5cbiAqIGV4cGxvcmF0aW9uLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdDb21wdXRlR3JhcGhTZXJ2aWNlJywgW1xuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF9jb21wdXRlR3JhcGhEYXRhID0gZnVuY3Rpb24gKGluaXRTdGF0ZUlkLCBzdGF0ZXMpIHtcbiAgICAgICAgICAgIHZhciBub2RlcyA9IHt9O1xuICAgICAgICAgICAgdmFyIGxpbmtzID0gW107XG4gICAgICAgICAgICB2YXIgZmluYWxTdGF0ZUlkcyA9IHN0YXRlcy5nZXRGaW5hbFN0YXRlTmFtZXMoKTtcbiAgICAgICAgICAgIHN0YXRlcy5nZXRTdGF0ZU5hbWVzKCkuZm9yRWFjaChmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uID0gc3RhdGVzLmdldFN0YXRlKHN0YXRlTmFtZSkuaW50ZXJhY3Rpb247XG4gICAgICAgICAgICAgICAgbm9kZXNbc3RhdGVOYW1lXSA9IHN0YXRlTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24uaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGdyb3VwcyA9IGludGVyYWN0aW9uLmFuc3dlckdyb3VwcztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaCA9IDA7IGggPCBncm91cHMubGVuZ3RoOyBoKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmtzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogc3RhdGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogZ3JvdXBzW2hdLm91dGNvbWUuZGVzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5kZWZhdWx0T3V0Y29tZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlua3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBzdGF0ZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBpbnRlcmFjdGlvbi5kZWZhdWx0T3V0Y29tZS5kZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZmluYWxTdGF0ZUlkczogZmluYWxTdGF0ZUlkcyxcbiAgICAgICAgICAgICAgICBpbml0U3RhdGVJZDogaW5pdFN0YXRlSWQsXG4gICAgICAgICAgICAgICAgbGlua3M6IGxpbmtzLFxuICAgICAgICAgICAgICAgIG5vZGVzOiBub2Rlc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9jb21wdXRlQmZzVHJhdmVyc2FsT2ZTdGF0ZXMgPSBmdW5jdGlvbiAoaW5pdFN0YXRlSWQsIHN0YXRlcywgc291cmNlU3RhdGVOYW1lKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGVHcmFwaCA9IF9jb21wdXRlR3JhcGhEYXRhKGluaXRTdGF0ZUlkLCBzdGF0ZXMpO1xuICAgICAgICAgICAgdmFyIHN0YXRlTmFtZXNJbkJmc09yZGVyID0gW107XG4gICAgICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgICAgIHZhciBzZWVuID0ge307XG4gICAgICAgICAgICBzZWVuW3NvdXJjZVN0YXRlTmFtZV0gPSB0cnVlO1xuICAgICAgICAgICAgcXVldWUucHVzaChzb3VyY2VTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VyclN0YXRlTmFtZSA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgc3RhdGVOYW1lc0luQmZzT3JkZXIucHVzaChjdXJyU3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IHN0YXRlR3JhcGgubGlua3MubGVuZ3RoOyBlKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVkZ2UgPSBzdGF0ZUdyYXBoLmxpbmtzW2VdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVzdCA9IGVkZ2UudGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWRnZS5zb3VyY2UgPT09IGN1cnJTdGF0ZU5hbWUgJiYgIXNlZW4uaGFzT3duUHJvcGVydHkoZGVzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlZW5bZGVzdF0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUucHVzaChkZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdGF0ZU5hbWVzSW5CZnNPcmRlcjtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbXB1dGU6IGZ1bmN0aW9uIChpbml0U3RhdGVJZCwgc3RhdGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jb21wdXRlR3JhcGhEYXRhKGluaXRTdGF0ZUlkLCBzdGF0ZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVCZnNUcmF2ZXJzYWxPZlN0YXRlczogZnVuY3Rpb24gKGluaXRTdGF0ZUlkLCBzdGF0ZXMsIHNvdXJjZVN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfY29tcHV0ZUJmc1RyYXZlcnNhbE9mU3RhdGVzKGluaXRTdGF0ZUlkLCBzdGF0ZXMsIHNvdXJjZVN0YXRlTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIENvbGxhcHNpYmxlIHJpY2gtdGV4dCBjb21wb25lbnQuXG4gKlxuICogSU1QT1JUQU5UIE5PVEU6IFRoZSBuYW1pbmcgY29udmVudGlvbiBmb3IgY3VzdG9taXphdGlvbiBhcmdzIHRoYXQgYXJlIHBhc3NlZFxuICogaW50byB0aGUgZGlyZWN0aXZlIGlzOiB0aGUgbmFtZSBvZiB0aGUgcGFyYW1ldGVyLCBmb2xsb3dlZCBieSAnV2l0aCcsXG4gKiBmb2xsb3dlZCBieSB0aGUgbmFtZSBvZiB0aGUgYXJnLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFOb25pbnRlcmFjdGl2ZUNvbGxhcHNpYmxlJywgW1xuICAgICdIdG1sRXNjYXBlclNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChIdG1sRXNjYXBlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RXh0ZW5zaW9uUmVzb3VyY2VVcmwoJy9yaWNoX3RleHRfY29tcG9uZW50cy9Db2xsYXBzaWJsZScgK1xuICAgICAgICAgICAgICAgICcvZGlyZWN0aXZlcy9jb2xsYXBzaWJsZV9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckYXR0cnMnLCBmdW5jdGlvbiAoJGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5oZWFkaW5nID0gSHRtbEVzY2FwZXJTZXJ2aWNlLmVzY2FwZWRKc29uVG9PYmooJGF0dHJzLmhlYWRpbmdXaXRoVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbnRlbnQgPSBIdG1sRXNjYXBlclNlcnZpY2UuZXNjYXBlZEpzb25Ub09iaigkYXR0cnMuY29udGVudFdpdGhWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgSW1hZ2UgcmljaC10ZXh0IGNvbXBvbmVudC5cbiAqXG4gKiBJTVBPUlRBTlQgTk9URTogVGhlIG5hbWluZyBjb252ZW50aW9uIGZvciBjdXN0b21pemF0aW9uIGFyZ3MgdGhhdCBhcmUgcGFzc2VkXG4gKiBpbnRvIHRoZSBkaXJlY3RpdmUgaXM6IHRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIsIGZvbGxvd2VkIGJ5ICdXaXRoJyxcbiAqIGZvbGxvd2VkIGJ5IHRoZSBuYW1lIG9mIHRoZSBhcmcuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlL3NlcnZpY2VzL2ltYWdlLXByZWxvYWRlci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Bc3NldHNCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ29udGV4dFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0h0bWxFc2NhcGVyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdvcHBpYU5vbmludGVyYWN0aXZlSW1hZ2UnLCBbXG4gICAgJ0Fzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlJywgJ0NvbnRleHRTZXJ2aWNlJyxcbiAgICAnSHRtbEVzY2FwZXJTZXJ2aWNlJywgJ0ltYWdlUHJlbG9hZGVyU2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ0xPQURJTkdfSU5ESUNBVE9SX1VSTCcsXG4gICAgZnVuY3Rpb24gKEFzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlLCBDb250ZXh0U2VydmljZSwgSHRtbEVzY2FwZXJTZXJ2aWNlLCBJbWFnZVByZWxvYWRlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBMT0FESU5HX0lORElDQVRPUl9VUkwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRFeHRlbnNpb25SZXNvdXJjZVVybCgnL3JpY2hfdGV4dF9jb21wb25lbnRzL0ltYWdlL2RpcmVjdGl2ZXMvaW1hZ2VfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJGF0dHJzJywgZnVuY3Rpb24gKCRhdHRycykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZmlsZXBhdGggPSBIdG1sRXNjYXBlclNlcnZpY2UuZXNjYXBlZEpzb25Ub09iaigkYXR0cnMuZmlsZXBhdGhXaXRoVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmltYWdlVXJsID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubG9hZGluZ0luZGljYXRvclVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKExPQURJTkdfSU5ESUNBVE9SX1VSTCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNMb2FkaW5nSW5kaWNhdG9yU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1RyeUFnYWluU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEltYWdlUHJlbG9hZGVyU2VydmljZS5pbkV4cGxvcmF0aW9uUGxheWVyKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNMb2FkaW5nSW5kaWNhdG9yU2hvd24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5kaW1lbnNpb25zID0gKEltYWdlUHJlbG9hZGVyU2VydmljZS5nZXREaW1lbnNpb25zT2ZJbWFnZShjdHJsLmZpbGVwYXRoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgYWxpZ25pbmcgdGhlIGdpZiB0byB0aGUgY2VudGVyIG9mIGl0J3MgY29udGFpbmVyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbG9hZGluZ0luZGljYXRvclNpemUgPSAoKGN0cmwuZGltZW5zaW9ucy5oZWlnaHQgPCAxMjQpID8gMjQgOiAxMjApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pbWFnZUNvbnRhaW5lclN0eWxlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogY3RybC5kaW1lbnNpb25zLmhlaWdodCArICdweCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmxvYWRpbmdJbmRpY2F0b3JTdHlsZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGxvYWRpbmdJbmRpY2F0b3JTaXplICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogbG9hZGluZ0luZGljYXRvclNpemUgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5sb2FkSW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc0xvYWRpbmdJbmRpY2F0b3JTaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc1RyeUFnYWluU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbWFnZVByZWxvYWRlclNlcnZpY2UuZ2V0SW1hZ2VVcmwoY3RybC5maWxlcGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKG9iamVjdFVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzVHJ5QWdhaW5TaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzTG9hZGluZ0luZGljYXRvclNob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaW1hZ2VVcmwgPSBvYmplY3RVcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzVHJ5QWdhaW5TaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNMb2FkaW5nSW5kaWNhdG9yU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmxvYWRJbWFnZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY2FzZSB3aGVuIHVzZXIgaXMgaW4gZXhwbG9yYXRpb24gZWRpdG9yIG9yIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwcmV2aWV3IG1vZGUuIFdlIGRvbid0IGhhdmUgbG9hZGluZyBpbmRpY2F0b3Igb3IgdHJ5IGFnYWluIGZvclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2hvd2luZyBpbWFnZXMgaW4gdGhlIGV4cGxvcmF0aW9uIGVkaXRvciBvciBpbiBwcmV2aWV3IG1vZGUuIFNvXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBkaXJlY3RseSBhc3NpZ24gdGhlIHVybCB0byB0aGUgaW1hZ2VVcmwuXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmltYWdlVXJsID0gQXNzZXRzQmFja2VuZEFwaVNlcnZpY2UuZ2V0SW1hZ2VVcmxGb3JQcmV2aWV3KENvbnRleHRTZXJ2aWNlLmdldEVudGl0eVR5cGUoKSwgQ29udGV4dFNlcnZpY2UuZ2V0RW50aXR5SWQoKSwgY3RybC5maWxlcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY3RybC5pbWFnZUNhcHRpb24gPSAnJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRhdHRycy5jYXB0aW9uV2l0aFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmltYWdlQ2FwdGlvbiA9IEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy5jYXB0aW9uV2l0aFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdHJsLmltYWdlQWx0VGV4dCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJGF0dHJzLmFsdFdpdGhWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pbWFnZUFsdFRleHQgPSBIdG1sRXNjYXBlclNlcnZpY2UuZXNjYXBlZEpzb25Ub09iaigkYXR0cnMuYWx0V2l0aFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIExpbmsgcmljaC10ZXh0IGNvbXBvbmVudC5cbiAqXG4gKiBJTVBPUlRBTlQgTk9URTogVGhlIG5hbWluZyBjb252ZW50aW9uIGZvciBjdXN0b21pemF0aW9uIGFyZ3MgdGhhdCBhcmUgcGFzc2VkXG4gKiBpbnRvIHRoZSBkaXJlY3RpdmUgaXM6IHRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIsIGZvbGxvd2VkIGJ5ICdXaXRoJyxcbiAqIGZvbGxvd2VkIGJ5IHRoZSBuYW1lIG9mIHRoZSBhcmcuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0NvbnRleHRTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFOb25pbnRlcmFjdGl2ZUxpbmsnLCBbXG4gICAgJ0h0bWxFc2NhcGVyU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKEh0bWxFc2NhcGVyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRFeHRlbnNpb25SZXNvdXJjZVVybCgnL3JpY2hfdGV4dF9jb21wb25lbnRzL0xpbmsvZGlyZWN0aXZlcy9saW5rX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRhdHRycycsICdDb250ZXh0U2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRhdHRycywgQ29udGV4dFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdW50cnVzdGVkVXJsID0gZW5jb2RlVVJJKEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy51cmxXaXRoVmFsdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVudHJ1c3RlZFVybC5pbmRleE9mKCdodHRwOi8vJykgIT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHVudHJ1c3RlZFVybC5pbmRleE9mKCdodHRwczovLycpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bnRydXN0ZWRVcmwgPSAnaHR0cHM6Ly8nICsgdW50cnVzdGVkVXJsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXJsID0gdW50cnVzdGVkVXJsO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dVcmxJblRvb2x0aXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC50ZXh0ID0gY3RybC51cmw7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkYXR0cnMudGV4dFdpdGhWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBkb25lIGZvciBiYWNrd2FyZC1jb21wYXRpYmlsaXR5OyBzb21lIG9sZCBleHBsb3JhdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhdmUgY29udGVudCBwYXJ0cyB0aGF0IGRvbid0IGluY2x1ZGUgYSAndGV4dCcgYXR0cmlidXRlIG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGVpciBsaW5rcy5cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGV4dCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSHRtbEVzY2FwZXJTZXJ2aWNlLmVzY2FwZWRKc29uVG9PYmooJGF0dHJzLnRleHRXaXRoVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgc2Vjb25kICdpZicgY29uZGl0aW9uIGlzIG5lZWRlZCBiZWNhdXNlIGEgbGluayBtYXlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhdmUgYW4gZW1wdHkgJ3RleHQnIHZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwudGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd1VybEluVG9vbHRpcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnRleHQgPSBjdHJsLnVybDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGZvbGxvd2luZyBjaGVjayBkaXNiYWxlcyB0aGUgbGluayBpbiBFZGl0b3IgYmVpbmcgY2F1Z2h0XG4gICAgICAgICAgICAgICAgICAgIC8vIGJ5IHRhYmJpbmcgd2hpbGUgaW4gRXhwbG9yYXRpb24gRWRpdG9yIG1vZGUuXG4gICAgICAgICAgICAgICAgICAgIGlmIChDb250ZXh0U2VydmljZS5pc0luRXhwbG9yYXRpb25FZGl0b3JNb2RlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGFiSW5kZXhWYWwgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgTWF0aCByaWNoLXRleHQgY29tcG9uZW50LlxuICpcbiAqIElNUE9SVEFOVCBOT1RFOiBUaGUgbmFtaW5nIGNvbnZlbnRpb24gZm9yIGN1c3RvbWl6YXRpb24gYXJncyB0aGF0IGFyZSBwYXNzZWRcbiAqIGludG8gdGhlIGRpcmVjdGl2ZSBpczogdGhlIG5hbWUgb2YgdGhlIHBhcmFtZXRlciwgZm9sbG93ZWQgYnkgJ1dpdGgnLFxuICogZm9sbG93ZWQgYnkgdGhlIG5hbWUgb2YgdGhlIGFyZy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ29wcGlhTm9uaW50ZXJhY3RpdmVNYXRoJywgW1xuICAgICdIdG1sRXNjYXBlclNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChIdG1sRXNjYXBlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RXh0ZW5zaW9uUmVzb3VyY2VVcmwoJy9yaWNoX3RleHRfY29tcG9uZW50cy9NYXRoL2RpcmVjdGl2ZXMvbWF0aF9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckYXR0cnMnLCBmdW5jdGlvbiAoJGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5yYXdMYXRleCA9IEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy5yYXdMYXRleFdpdGhWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgVGFicyByaWNoLXRleHQgY29tcG9uZW50LlxuICpcbiAqIElNUE9SVEFOVCBOT1RFOiBUaGUgbmFtaW5nIGNvbnZlbnRpb24gZm9yIGN1c3RvbWl6YXRpb24gYXJncyB0aGF0IGFyZSBwYXNzZWRcbiAqIGludG8gdGhlIGRpcmVjdGl2ZSBpczogdGhlIG5hbWUgb2YgdGhlIHBhcmFtZXRlciwgZm9sbG93ZWQgYnkgJ1dpdGgnLFxuICogZm9sbG93ZWQgYnkgdGhlIG5hbWUgb2YgdGhlIGFyZy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ29wcGlhTm9uaW50ZXJhY3RpdmVUYWJzJywgW1xuICAgICdIdG1sRXNjYXBlclNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChIdG1sRXNjYXBlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RXh0ZW5zaW9uUmVzb3VyY2VVcmwoJy9yaWNoX3RleHRfY29tcG9uZW50cy9UYWJzL2RpcmVjdGl2ZXMvdGFic19kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckYXR0cnMnLCBmdW5jdGlvbiAoJGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC50YWJDb250ZW50cyA9IEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy50YWJDb250ZW50c1dpdGhWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgVmlkZW8gcmljaC10ZXh0IGNvbXBvbmVudC5cbiAqXG4gKiBJTVBPUlRBTlQgTk9URTogVGhlIG5hbWluZyBjb252ZW50aW9uIGZvciBjdXN0b21pemF0aW9uIGFyZ3MgdGhhdCBhcmUgcGFzc2VkXG4gKiBpbnRvIHRoZSBkaXJlY3RpdmUgaXM6IHRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIsIGZvbGxvd2VkIGJ5ICdXaXRoJyxcbiAqIGZvbGxvd2VkIGJ5IHRoZSBuYW1lIG9mIHRoZSBhcmcuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0F1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Db250ZXh0U2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ29wcGlhTm9uaW50ZXJhY3RpdmVWaWRlbycsIFtcbiAgICAnJHNjZScsICdIdG1sRXNjYXBlclNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkc2NlLCBIdG1sRXNjYXBlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RXh0ZW5zaW9uUmVzb3VyY2VVcmwoJy9yaWNoX3RleHRfY29tcG9uZW50cy9WaWRlby9kaXJlY3RpdmVzL3ZpZGVvX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRhdHRycycsICdDb250ZXh0U2VydmljZScsICckZWxlbWVudCcsXG4gICAgICAgICAgICAgICAgJ0F1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlJywgJ1BBR0VfQ09OVEVYVCcsICckdGltZW91dCcsICckd2luZG93JyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJGF0dHJzLCBDb250ZXh0U2VydmljZSwgJGVsZW1lbnQsIEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlLCBQQUdFX0NPTlRFWFQsICR0aW1lb3V0LCAkd2luZG93KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gKEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy5zdGFydFdpdGhWYWx1ZSkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZW5kID0gSHRtbEVzY2FwZXJTZXJ2aWNlLmVzY2FwZWRKc29uVG9PYmooJGF0dHJzLmVuZFdpdGhWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudmlkZW9JZCA9IEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy52aWRlb0lkV2l0aFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC50aW1pbmdQYXJhbXMgPSAnJnN0YXJ0PScgKyBzdGFydCArICcmZW5kPScgKyBlbmQ7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYXV0b3BsYXlTdWZmaXggPSAnJmF1dG9wbGF5PTAnO1xuICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIGNyZWF0b3Igd2FudHMgdG8gYXV0b3BsYXkgdGhpcyB2aWRlbyBvciBub3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdXRvcGxheVZhbCA9IEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy5hdXRvcGxheVdpdGhWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGNvZGUgaGVscHMgaW4gdmlzaWJpbGl0eSBvZiB2aWRlby4gSXQgY2hlY2tzIHdoZXRoZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1pZCBwb2ludCBvZiB2aWRlbyBmcmFtZSBpcyBpbiB0aGUgdmlldyBvciBub3QuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVjdCA9IGFuZ3VsYXIuZWxlbWVudCgkZWxlbWVudClbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2xpZW50SGVpZ2h0ID0gJHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjbGllbnRXaWR0aCA9ICR3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1Zpc2libGUgPSAoKHJlY3QubGVmdCArIHJlY3QucmlnaHQpIC8gMiA8IGNsaWVudFdpZHRoICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHJlY3QudG9wICsgcmVjdC5ib3R0b20pIC8gMiA8IGNsaWVudEhlaWdodCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocmVjdC5sZWZ0ID4gMCAmJiByZWN0LnJpZ2h0ID4gMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBdXRvcGxheSBpZiB1c2VyIGlzIGluIGxlYXJuZXIgdmlldyBhbmQgY3JlYXRvciBoYXMgc3BlY2lmaWVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byBhdXRvcGxheSBnaXZlbiB2aWRlby5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDb250ZXh0U2VydmljZS5nZXRQYWdlQ29udGV4dCgpID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBBR0VfQ09OVEVYVC5FWFBMT1JBVElPTl9QTEFZRVIgJiYgYXV0b3BsYXlWYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBpdCBoYXMgYmVlbiBhdXRvcGxheWVkIHRoZW4gZG8gbm90IGF1dG9wbGF5IGFnYWluLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghQXV0b3BsYXllZFZpZGVvc1NlcnZpY2UuaGFzVmlkZW9CZWVuQXV0b3BsYXllZChjdHJsLnZpZGVvSWQpICYmIGlzVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmF1dG9wbGF5U3VmZml4ID0gJyZhdXRvcGxheT0xJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXV0b3BsYXllZFZpZGVvc1NlcnZpY2UuYWRkQXV0b3BsYXllZFZpZGVvKGN0cmwudmlkZW9JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC52aWRlb1VybCA9ICRzY2UudHJ1c3RBc1Jlc291cmNlVXJsKCdodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nICsgY3RybC52aWRlb0lkICsgJz9yZWw9MCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGltaW5nUGFyYW1zICsgY3RybC5hdXRvcGxheVN1ZmZpeCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDkwMCk7XG4gICAgICAgICAgICAgICAgICAgIC8vICheKUhlcmUgdGltZW91dCBpcyBzZXQgdG8gOTAwbXMuIFRoaXMgaXMgdGltZSBpdCB0YWtlcyB0byBicmluZyB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gZnJhbWUgdG8gY29ycmVjdCBwb2ludCBpbiBicm93c2VyIGFuZCBicmluZyB1c2VyIHRvIHRoZSBtYWluXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnRlbnQuIFNtYWxsZXIgZGVsYXkgY2F1c2VzIGNoZWNrcyB0byBiZSBwZXJmb3JtZWQgZXZlbiBiZWZvcmVcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHBsYXllciBkaXNwbGF5cyB0aGUgY29udGVudCBvZiB0aGUgbmV3IGNhcmQuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgZm9sbG93aW5nIGNoZWNrIGRpc2FibGVzIHRoZSB2aWRlbyBpbiBFZGl0b3IgYmVpbmcgY2F1Z2h0XG4gICAgICAgICAgICAgICAgICAgIC8vIGJ5IHRhYmJpbmcgd2hpbGUgaW4gRXhwbG9yYXRpb24gRWRpdG9yIG1vZGUuXG4gICAgICAgICAgICAgICAgICAgIGlmIChDb250ZXh0U2VydmljZS5pc0luRXhwbG9yYXRpb25FZGl0b3JNb2RlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGFiSW5kZXhWYWwgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgUmVxdWlyZXMgZm9yIGFsbCB0aGUgUlRDIGRpcmVjdGl2ZXMuXG4gKi9cbnJlcXVpcmUoJ3JpY2hfdGV4dF9jb21wb25lbnRzL0NvbGxhcHNpYmxlL2RpcmVjdGl2ZXMvJyArXG4gICAgJ09wcGlhTm9uaW50ZXJhY3RpdmVDb2xsYXBzaWJsZURpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncmljaF90ZXh0X2NvbXBvbmVudHMvSW1hZ2UvZGlyZWN0aXZlcy8nICtcbiAgICAnT3BwaWFOb25pbnRlcmFjdGl2ZUltYWdlRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdyaWNoX3RleHRfY29tcG9uZW50cy9MaW5rL2RpcmVjdGl2ZXMvT3BwaWFOb25pbnRlcmFjdGl2ZUxpbmtEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3JpY2hfdGV4dF9jb21wb25lbnRzL01hdGgvZGlyZWN0aXZlcy9PcHBpYU5vbmludGVyYWN0aXZlTWF0aERpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncmljaF90ZXh0X2NvbXBvbmVudHMvVGFicy9kaXJlY3RpdmVzL09wcGlhTm9uaW50ZXJhY3RpdmVUYWJzRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdyaWNoX3RleHRfY29tcG9uZW50cy9WaWRlby9kaXJlY3RpdmVzLycgK1xuICAgICdPcHBpYU5vbmludGVyYWN0aXZlVmlkZW9EaXJlY3RpdmUudHMnKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=