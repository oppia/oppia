(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~b9580ed0"],{

/***/ "./core/templates/dev/head/directives/angular-html-bind.directive.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/directives/angular-html-bind.directive.ts ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview AngularHtmlBind Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */
// HTML bind directive that trusts the value it is given and also evaluates
// custom directive tags in the provided value.
angular.module('oppia').directive('angularHtmlBind', [
    '$compile', function ($compile) {
        return {
            restrict: 'E',
            link: function (scope, elm, attrs) {
                // Clean up old scopes if the html changes.
                // Reference: https://stackoverflow.com/a/42927814
                var newScope;
                scope.$watch(attrs.htmlData, function (newValue) {
                    if (newScope) {
                        newScope.$destroy();
                    }
                    elm.empty();
                    newScope = scope.$new();
                    elm.html(newValue);
                    $compile(elm.contents())(newScope);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/directives/mathjax-bind.directive.ts":
/*!**********************************************************************!*\
  !*** ./core/templates/dev/head/directives/mathjax-bind.directive.ts ***!
  \**********************************************************************/
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
 * @fileoverview MathjaxBind Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */
__webpack_require__(/*! mathjaxConfig.ts */ "./core/templates/dev/head/mathjaxConfig.ts");
angular.module('oppia').directive('mathjaxBind', [function () {
        return {
            restrict: 'E',
            controller: [
                '$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                    $scope.$watch($attrs.mathjaxData, function (value) {
                        var $script = angular.element('<script type="math/tex">').html(value === undefined ? '' : value);
                        $element.html('');
                        $element.append($script);
                        MathJax.Hub.Queue(['Reprocess', MathJax.Hub, $element[0]]);
                    });
                }
            ]
        };
    }]);


/***/ }),

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

/***/ "./core/templates/dev/head/mathjaxConfig.ts":
/*!**************************************************!*\
  !*** ./core/templates/dev/head/mathjaxConfig.ts ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

window.MathJax = {
    skipStartupTypeset: true,
    messageStyle: 'none',
    'HTML-CSS': {
        imageFont: null,
        linebreaks: {
            automatic: true,
            width: '500px'
        },
        scale: 91,
        showMathMenu: false
    }
};


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

/***/ "./extensions/rich_text_components/Collapsible/directives/oppia-noninteractive-collapsible.directive.ts":
/*!**************************************************************************************************************!*\
  !*** ./extensions/rich_text_components/Collapsible/directives/oppia-noninteractive-collapsible.directive.ts ***!
  \**************************************************************************************************************/
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
__webpack_require__(/*! directives/angular-html-bind.directive.ts */ "./core/templates/dev/head/directives/angular-html-bind.directive.ts");
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
                '/directives/collapsible.directive.html'),
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

/***/ "./extensions/rich_text_components/Image/directives/oppia-noninteractive-image.directive.ts":
/*!**************************************************************************************************!*\
  !*** ./extensions/rich_text_components/Image/directives/oppia-noninteractive-image.directive.ts ***!
  \**************************************************************************************************/
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
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Image/directives/image.directive.html'),
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

/***/ "./extensions/rich_text_components/Link/directives/oppia-noninteractive-link.directive.ts":
/*!************************************************************************************************!*\
  !*** ./extensions/rich_text_components/Link/directives/oppia-noninteractive-link.directive.ts ***!
  \************************************************************************************************/
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
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Link/directives/link.directive.html'),
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

/***/ "./extensions/rich_text_components/Math/directives/oppia-noninteractive-math.directive.ts":
/*!************************************************************************************************!*\
  !*** ./extensions/rich_text_components/Math/directives/oppia-noninteractive-math.directive.ts ***!
  \************************************************************************************************/
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
__webpack_require__(/*! directives/mathjax-bind.directive.ts */ "./core/templates/dev/head/directives/mathjax-bind.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('oppia').directive('oppiaNoninteractiveMath', [
    'HtmlEscaperService', 'UrlInterpolationService',
    function (HtmlEscaperService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Math/directives/math.directive.html'),
            controllerAs: '$ctrl',
            controller: ['$attrs', function ($attrs) {
                    var ctrl = this;
                    ctrl.rawLatex = HtmlEscaperService.escapedJsonToObj($attrs.rawLatexWithValue);
                }]
        };
    }
]);


/***/ }),

/***/ "./extensions/rich_text_components/Tabs/directives/oppia-noninteractive-tabs.directive.ts":
/*!************************************************************************************************!*\
  !*** ./extensions/rich_text_components/Tabs/directives/oppia-noninteractive-tabs.directive.ts ***!
  \************************************************************************************************/
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
__webpack_require__(/*! directives/angular-html-bind.directive.ts */ "./core/templates/dev/head/directives/angular-html-bind.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('oppia').directive('oppiaNoninteractiveTabs', [
    'HtmlEscaperService', 'UrlInterpolationService',
    function (HtmlEscaperService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Tabs/directives/tabs.directive.html'),
            controllerAs: '$ctrl',
            controller: ['$attrs', function ($attrs) {
                    var ctrl = this;
                    ctrl.tabContents = HtmlEscaperService.escapedJsonToObj($attrs.tabContentsWithValue);
                }]
        };
    }
]);


/***/ }),

/***/ "./extensions/rich_text_components/Video/directives/oppia-noninteractive-video.directive.ts":
/*!**************************************************************************************************!*\
  !*** ./extensions/rich_text_components/Video/directives/oppia-noninteractive-video.directive.ts ***!
  \**************************************************************************************************/
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
            templateUrl: UrlInterpolationService.getExtensionResourceUrl('/rich_text_components/Video/directives/video.directive.html'),
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
__webpack_require__(/*! rich_text_components/Collapsible/directives/oppia-noninteractive-collapsible.directive.ts */ "./extensions/rich_text_components/Collapsible/directives/oppia-noninteractive-collapsible.directive.ts");
__webpack_require__(/*! rich_text_components/Image/directives/oppia-noninteractive-image.directive.ts */ "./extensions/rich_text_components/Image/directives/oppia-noninteractive-image.directive.ts");
__webpack_require__(/*! rich_text_components/Link/directives/oppia-noninteractive-link.directive.ts */ "./extensions/rich_text_components/Link/directives/oppia-noninteractive-link.directive.ts");
__webpack_require__(/*! rich_text_components/Math/directives/oppia-noninteractive-math.directive.ts */ "./extensions/rich_text_components/Math/directives/oppia-noninteractive-math.directive.ts");
__webpack_require__(/*! rich_text_components/Tabs/directives/oppia-noninteractive-tabs.directive.ts */ "./extensions/rich_text_components/Tabs/directives/oppia-noninteractive-tabs.directive.ts");
__webpack_require__(/*! rich_text_components/Video/directives/oppia-noninteractive-video.directive.ts */ "./extensions/rich_text_components/Video/directives/oppia-noninteractive-video.directive.ts");


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kaXJlY3RpdmVzL2FuZ3VsYXItaHRtbC1iaW5kLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kaXJlY3RpdmVzL21hdGhqYXgtYmluZC5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3V0aWxpdGllcy9BdWRpb0ZpbGVPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi91dGlsaXRpZXMvRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3V0aWxpdGllcy9JbWFnZUZpbGVPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL21hdGhqYXhDb25maWcudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tcGxheWVyLXBhZ2Uvc2VydmljZXMvZXh0cmFjdC1pbWFnZS1maWxlbmFtZXMtZnJvbS1zdGF0ZS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlL3NlcnZpY2VzL2ltYWdlLXByZWxvYWRlci5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0Fzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0F1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0NvbXB1dGVHcmFwaFNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vZXh0ZW5zaW9ucy9yaWNoX3RleHRfY29tcG9uZW50cy9Db2xsYXBzaWJsZS9kaXJlY3RpdmVzL29wcGlhLW5vbmludGVyYWN0aXZlLWNvbGxhcHNpYmxlLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9leHRlbnNpb25zL3JpY2hfdGV4dF9jb21wb25lbnRzL0ltYWdlL2RpcmVjdGl2ZXMvb3BwaWEtbm9uaW50ZXJhY3RpdmUtaW1hZ2UuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvcmljaF90ZXh0X2NvbXBvbmVudHMvTGluay9kaXJlY3RpdmVzL29wcGlhLW5vbmludGVyYWN0aXZlLWxpbmsuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvcmljaF90ZXh0X2NvbXBvbmVudHMvTWF0aC9kaXJlY3RpdmVzL29wcGlhLW5vbmludGVyYWN0aXZlLW1hdGguZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvcmljaF90ZXh0X2NvbXBvbmVudHMvVGFicy9kaXJlY3RpdmVzL29wcGlhLW5vbmludGVyYWN0aXZlLXRhYnMuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvcmljaF90ZXh0X2NvbXBvbmVudHMvVmlkZW8vZGlyZWN0aXZlcy9vcHBpYS1ub25pbnRlcmFjdGl2ZS12aWRlby5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vZXh0ZW5zaW9ucy9yaWNoX3RleHRfY29tcG9uZW50cy9yaWNoVGV4dENvbXBvbmVudHNSZXF1aXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLG9FQUFrQjtBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUNqQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0EsYUFBYSxtQkFBTyxDQUFDLGlFQUFlO0FBQ3BDLGVBQWUsbUJBQU8sQ0FBQyw4RkFBeUI7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTs7Ozs7Ozs7Ozs7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBLGFBQWEsbUJBQU8sQ0FBQyxpRUFBZTtBQUNwQyxlQUFlLG1CQUFPLENBQUMsOEZBQXlCO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QyxRQUFRO0FBQ3BEO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQSxhQUFhLG1CQUFPLENBQUMsaUVBQWU7QUFDcEMsZUFBZSxtQkFBTyxDQUFDLDhGQUF5QjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBOzs7Ozs7Ozs7Ozs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGdHQUFnQztBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIseUJBQXlCO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDRNQUMyQztBQUNuRCxtQkFBTyxDQUFDLDBHQUFxQztBQUM3QyxtQkFBTyxDQUFDLGtHQUFpQztBQUN6QyxtQkFBTyxDQUFDLHdGQUE0QjtBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBLG1CQUFtQixTQUFTO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsT0FBTztBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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b2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfm1vZGVyYXRvcn5wcmFjdGljZV9zZXNzaW9ufnJldmlld190ZXN0fmI5NTgwZWQwLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQW5ndWxhckh0bWxCaW5kIERpcmVjdGl2ZSAobm90IGFzc29jaWF0ZWQgd2l0aCByZXVzYWJsZVxuICogY29tcG9uZW50cy4pXG4gKiBOQjogUmV1c2FibGUgY29tcG9uZW50IGRpcmVjdGl2ZXMgc2hvdWxkIGdvIGluIHRoZSBjb21wb25lbnRzLyBmb2xkZXIuXG4gKi9cbi8vIEhUTUwgYmluZCBkaXJlY3RpdmUgdGhhdCB0cnVzdHMgdGhlIHZhbHVlIGl0IGlzIGdpdmVuIGFuZCBhbHNvIGV2YWx1YXRlc1xuLy8gY3VzdG9tIGRpcmVjdGl2ZSB0YWdzIGluIHRoZSBwcm92aWRlZCB2YWx1ZS5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnYW5ndWxhckh0bWxCaW5kJywgW1xuICAgICckY29tcGlsZScsIGZ1bmN0aW9uICgkY29tcGlsZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxtLCBhdHRycykge1xuICAgICAgICAgICAgICAgIC8vIENsZWFuIHVwIG9sZCBzY29wZXMgaWYgdGhlIGh0bWwgY2hhbmdlcy5cbiAgICAgICAgICAgICAgICAvLyBSZWZlcmVuY2U6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80MjkyNzgxNFxuICAgICAgICAgICAgICAgIHZhciBuZXdTY29wZTtcbiAgICAgICAgICAgICAgICBzY29wZS4kd2F0Y2goYXR0cnMuaHRtbERhdGEsIGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV3U2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1Njb3BlLiRkZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxtLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1Njb3BlID0gc2NvcGUuJG5ldygpO1xuICAgICAgICAgICAgICAgICAgICBlbG0uaHRtbChuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICRjb21waWxlKGVsbS5jb250ZW50cygpKShuZXdTY29wZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1hdGhqYXhCaW5kIERpcmVjdGl2ZSAobm90IGFzc29jaWF0ZWQgd2l0aCByZXVzYWJsZVxuICogY29tcG9uZW50cy4pXG4gKiBOQjogUmV1c2FibGUgY29tcG9uZW50IGRpcmVjdGl2ZXMgc2hvdWxkIGdvIGluIHRoZSBjb21wb25lbnRzLyBmb2xkZXIuXG4gKi9cbnJlcXVpcmUoJ21hdGhqYXhDb25maWcudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnbWF0aGpheEJpbmQnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRlbGVtZW50JywgJyRhdHRycycsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgkYXR0cnMubWF0aGpheERhdGEsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRzY3JpcHQgPSBhbmd1bGFyLmVsZW1lbnQoJzxzY3JpcHQgdHlwZT1cIm1hdGgvdGV4XCI+JykuaHRtbCh2YWx1ZSA9PT0gdW5kZWZpbmVkID8gJycgOiB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZWxlbWVudC5odG1sKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbGVtZW50LmFwcGVuZCgkc2NyaXB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGhKYXguSHViLlF1ZXVlKFsnUmVwcm9jZXNzJywgTWF0aEpheC5IdWIsICRlbGVtZW50WzBdXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE9iamVjdCBmYWN0b3J5IGZvciBjcmVhdGluZyBhdWRpbyBmaWxlcy5cbiAqL1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIEF1ZGlvRmlsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBdWRpb0ZpbGUoZmlsZW5hbWUsIGRhdGEpIHtcbiAgICAgICAgdGhpcy5maWxlbmFtZSA9IGZpbGVuYW1lO1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIH1cbiAgICByZXR1cm4gQXVkaW9GaWxlO1xufSgpKTtcbmV4cG9ydHMuQXVkaW9GaWxlID0gQXVkaW9GaWxlO1xudmFyIEF1ZGlvRmlsZU9iamVjdEZhY3RvcnkgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQXVkaW9GaWxlT2JqZWN0RmFjdG9yeSgpIHtcbiAgICB9XG4gICAgQXVkaW9GaWxlT2JqZWN0RmFjdG9yeS5wcm90b3R5cGUuY3JlYXRlTmV3ID0gZnVuY3Rpb24gKGZpbGVuYW1lLCBkYXRhKSB7XG4gICAgICAgIHJldHVybiBuZXcgQXVkaW9GaWxlKGZpbGVuYW1lLCBkYXRhKTtcbiAgICB9O1xuICAgIEF1ZGlvRmlsZU9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgQXVkaW9GaWxlT2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIEF1ZGlvRmlsZU9iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5BdWRpb0ZpbGVPYmplY3RGYWN0b3J5ID0gQXVkaW9GaWxlT2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0F1ZGlvRmlsZU9iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKEF1ZGlvRmlsZU9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgT2JqZWN0IGZhY3RvcnkgZm9yIGNyZWF0aW5nIGF1ZGlvIGZpbGVzLlxuICovXG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgRmlsZURvd25sb2FkUmVxdWVzdCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGaWxlRG93bmxvYWRSZXF1ZXN0KGZpbGVuYW1lLCBjYW5jZWxlcikge1xuICAgICAgICB0aGlzLmZpbGVuYW1lID0gZmlsZW5hbWU7XG4gICAgICAgIHRoaXMuY2FuY2VsZXIgPSBjYW5jZWxlcjtcbiAgICB9XG4gICAgcmV0dXJuIEZpbGVEb3dubG9hZFJlcXVlc3Q7XG59KCkpO1xuZXhwb3J0cy5GaWxlRG93bmxvYWRSZXF1ZXN0ID0gRmlsZURvd25sb2FkUmVxdWVzdDtcbnZhciBGaWxlRG93bmxvYWRSZXF1ZXN0T2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGaWxlRG93bmxvYWRSZXF1ZXN0T2JqZWN0RmFjdG9yeSgpIHtcbiAgICB9XG4gICAgLy8gVE9ETyhZYXNoSmlwa2F0ZSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMga2VwdCBhc1xuICAgIC8vICdhbnknIHNpbmNlIGNhbmNlbGVyIGlzIGEgJ0RlZmVycmVkJyB0eXBlIG9iamVjdCB3aGljaCBpcyBuYXRpdmUgdG9cbiAgICAvLyBBbmd1bGFySlMgYW5kIGRvZXMgbm90IGhhdmUgYSB0eXBlIGluIG5hdGl2ZSB0eXBlc2NyaXB0LlxuICAgIEZpbGVEb3dubG9hZFJlcXVlc3RPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVOZXcgPSBmdW5jdGlvbiAoZmlsZW5hbWUsIGNhbmNlbGVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgRmlsZURvd25sb2FkUmVxdWVzdChmaWxlbmFtZSwgY2FuY2VsZXIpO1xuICAgIH07XG4gICAgRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBGaWxlRG93bmxvYWRSZXF1ZXN0T2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLkZpbGVEb3dubG9hZFJlcXVlc3RPYmplY3RGYWN0b3J5ID0gRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdGaWxlRG93bmxvYWRSZXF1ZXN0T2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgT2JqZWN0IGZhY3RvcnkgZm9yIGNyZWF0aW5nIGltYWdlIGZpbGVzLlxuICovXG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgSW1hZ2VGaWxlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEltYWdlRmlsZShmaWxlbmFtZSwgZGF0YSkge1xuICAgICAgICB0aGlzLmZpbGVuYW1lID0gZmlsZW5hbWU7XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgfVxuICAgIHJldHVybiBJbWFnZUZpbGU7XG59KCkpO1xuZXhwb3J0cy5JbWFnZUZpbGUgPSBJbWFnZUZpbGU7XG52YXIgSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbWFnZUZpbGVPYmplY3RGYWN0b3J5KCkge1xuICAgIH1cbiAgICBJbWFnZUZpbGVPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVOZXcgPSBmdW5jdGlvbiAoZmlsZW5hbWUsIGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbWFnZUZpbGUoZmlsZW5hbWUsIGRhdGEpO1xuICAgIH07XG4gICAgSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBJbWFnZUZpbGVPYmplY3RGYWN0b3J5KTtcbiAgICByZXR1cm4gSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLkltYWdlRmlsZU9iamVjdEZhY3RvcnkgPSBJbWFnZUZpbGVPYmplY3RGYWN0b3J5O1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeSkpO1xuIiwid2luZG93Lk1hdGhKYXggPSB7XG4gICAgc2tpcFN0YXJ0dXBUeXBlc2V0OiB0cnVlLFxuICAgIG1lc3NhZ2VTdHlsZTogJ25vbmUnLFxuICAgICdIVE1MLUNTUyc6IHtcbiAgICAgICAgaW1hZ2VGb250OiBudWxsLFxuICAgICAgICBsaW5lYnJlYWtzOiB7XG4gICAgICAgICAgICBhdXRvbWF0aWM6IHRydWUsXG4gICAgICAgICAgICB3aWR0aDogJzUwMHB4J1xuICAgICAgICB9LFxuICAgICAgICBzY2FsZTogOTEsXG4gICAgICAgIHNob3dNYXRoTWVudTogZmFsc2VcbiAgICB9XG59O1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGV4dHJhY3QgaW1hZ2UgZmlsZW5hbWVzIGluIGEgU3RhdGUuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL0h0bWxFc2NhcGVyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnRXh0cmFjdEltYWdlRmlsZW5hbWVzRnJvbVN0YXRlU2VydmljZScsIFtcbiAgICAnSHRtbEVzY2FwZXJTZXJ2aWNlJywgZnVuY3Rpb24gKEh0bWxFc2NhcGVyU2VydmljZSkge1xuICAgICAgICB2YXIgSU5URVJBQ1RJT05fVFlQRV9NVUxUSVBMRV9DSE9JQ0UgPSAnTXVsdGlwbGVDaG9pY2VJbnB1dCc7XG4gICAgICAgIHZhciBJTlRFUkFDVElPTl9UWVBFX0lURU1fU0VMRUNUSU9OID0gJ0l0ZW1TZWxlY3Rpb25JbnB1dCc7XG4gICAgICAgIHZhciBJTlRFUkFDVElPTl9UWVBFX0lNQUdFX0NMSUNLX0lOUFVUID0gJ0ltYWdlQ2xpY2tJbnB1dCc7XG4gICAgICAgIHZhciBJTlRFUkFDVElPTl9UWVBFX0RSQUdfQU5EX0RST1BfU09SVCA9ICdEcmFnQW5kRHJvcFNvcnRJbnB1dCc7XG4gICAgICAgIHZhciBmaWxlbmFtZXNJblN0YXRlID0gW107XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBodG1sIGZyb20gdGhlIHN0YXRlJ3MgY29udGVudC5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHN0YXRlIC0gVGhlIHN0YXRlIGZyb20gd2hpY2ggdGhlIGh0bWwgb2YgdGhlIGNvbnRlbnRcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGJlIHJldHVybmVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9nZXRTdGF0ZUNvbnRlbnRIdG1sID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUuY29udGVudC5nZXRIdG1sKCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBodG1sIGZyb20gdGhlIG91dGNvbWUgb2YgdGhlIGFuc3dlciBncm91cHMgYW5kIHRoZSBkZWZhdWx0XG4gICAgICAgICAqIG91dGNvbWUgb2YgdGhlIHN0YXRlLlxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gc3RhdGUgLSBUaGUgc3RhdGUgZnJvbSB3aGljaCB0aGUgaHRtbCBvZiB0aGUgb3V0Y29tZXMgb2ZcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGFuc3dlciBncm91cHMgc2hvdWxkIGJlIHJldHVybmVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9nZXRPdXRjb21lc0h0bWwgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgICAgIHZhciBvdXRjb21lc0h0bWwgPSAnJztcbiAgICAgICAgICAgIHN0YXRlLmludGVyYWN0aW9uLmFuc3dlckdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChhbnN3ZXJHcm91cCkge1xuICAgICAgICAgICAgICAgIHZhciBhbnN3ZXJHcm91cEh0bWwgPSBhbnN3ZXJHcm91cC5vdXRjb21lLmZlZWRiYWNrLmdldEh0bWwoKTtcbiAgICAgICAgICAgICAgICBvdXRjb21lc0h0bWwgPSBvdXRjb21lc0h0bWwuY29uY2F0KGFuc3dlckdyb3VwSHRtbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5pbnRlcmFjdGlvbi5kZWZhdWx0T3V0Y29tZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG91dGNvbWVzSHRtbCA9IG91dGNvbWVzSHRtbC5jb25jYXQoc3RhdGUuaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUuZmVlZGJhY2suZ2V0SHRtbCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRjb21lc0h0bWw7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBodG1sIGZyb20gdGhlIGhpbnRzIGluIHRoZSBzdGF0ZS5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHN0YXRlIC0gVGhlIHN0YXRlIHdob3NlIGhpbnRzJyBodG1sIHNob3VsZCBiZSByZXR1cm5lZC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfZ2V0SGludHNIdG1sID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgaGludHNIdG1sID0gJyc7XG4gICAgICAgICAgICBzdGF0ZS5pbnRlcmFjdGlvbi5oaW50cy5mb3JFYWNoKGZ1bmN0aW9uIChoaW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGhpbnRIdG1sID0gaGludC5oaW50Q29udGVudC5nZXRIdG1sKCk7XG4gICAgICAgICAgICAgICAgaGludHNIdG1sID0gaGludHNIdG1sLmNvbmNhdChoaW50SHRtbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBoaW50c0h0bWw7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBodG1sIGZyb20gdGhlIHNvbHV0aW9uIGluIHRoZSBzdGF0ZS5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHN0YXRlIC0gVGhlIHN0YXRlIHdob3NlIHNvbHV0aW9uJ3MgaHRtbCBzaG91bGQgYmVcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuZWQuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX2dldFNvbHV0aW9uSHRtbCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlLmludGVyYWN0aW9uLnNvbHV0aW9uLmV4cGxhbmF0aW9uLmdldEh0bWwoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgYWxsIHRoZSBodG1sIGluIGEgc3RhdGUuXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzdGF0ZSAtIFRoZSBzdGF0ZSB3aG9zZSBodG1sIGlzIHRvIGJlIGZldGNoZWQuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX2dldEFsbEh0bWxPZlN0YXRlID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgX2FsbEh0bWxJblRoZVN0YXRlID0gW107XG4gICAgICAgICAgICAvLyBUaGUgb3JkZXIgb2YgdGhlIGV4dHJhY3RlZCBpbWFnZSBuYW1lcyBpcyBzYW1lIGFzIHRoZXkgYXBwZWFyIGluIGFcbiAgICAgICAgICAgIC8vIHN0YXRlLiBUaGUgaW1hZ2VzIHNob3VsZCBiZSBwcmVsb2FkZWQgaW4gdGhlIGZvbGxvd2luZyBvcmRlciAtLS1cbiAgICAgICAgICAgIC8vIGNvbnRlbnQsIGN1c3RvbWl6YXRpb25BcmdzIG9mIGludGVyYWN0aW9ucywgZmVlZGJhY2sgb2Ygb3V0Y29tZXMgKClcbiAgICAgICAgICAgIC8vIGluY2x1ZGluZyBmZWVkYmFjayBvZiBkZWZhdWx0IG91dGNvbWUgaWYgYW55KSwgaGludHMsIHNvbHV0aW9uIGlmIGFueS5cbiAgICAgICAgICAgIF9hbGxIdG1sSW5UaGVTdGF0ZS5wdXNoKF9nZXRTdGF0ZUNvbnRlbnRIdG1sKHN0YXRlKSk7XG4gICAgICAgICAgICBpZiAoc3RhdGUuaW50ZXJhY3Rpb24uaWQgPT09IElOVEVSQUNUSU9OX1RZUEVfTVVMVElQTEVfQ0hPSUNFIHx8XG4gICAgICAgICAgICAgICAgc3RhdGUuaW50ZXJhY3Rpb24uaWQgPT09IElOVEVSQUNUSU9OX1RZUEVfSVRFTV9TRUxFQ1RJT04gfHxcbiAgICAgICAgICAgICAgICBzdGF0ZS5pbnRlcmFjdGlvbi5pZCA9PT0gSU5URVJBQ1RJT05fVFlQRV9EUkFHX0FORF9EUk9QX1NPUlQpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VzdG9taXphdGlvbkFyZ3NIdG1sID0gJyc7XG4gICAgICAgICAgICAgICAgc3RhdGUuaW50ZXJhY3Rpb24uY3VzdG9taXphdGlvbkFyZ3MuY2hvaWNlcy52YWx1ZS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjdXN0b21pemF0aW9uQXJnc0h0bWwgPSBjdXN0b21pemF0aW9uQXJnc0h0bWwuY29uY2F0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBfYWxsSHRtbEluVGhlU3RhdGUucHVzaChjdXN0b21pemF0aW9uQXJnc0h0bWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2FsbEh0bWxJblRoZVN0YXRlLnB1c2goX2dldE91dGNvbWVzSHRtbChzdGF0ZSkpO1xuICAgICAgICAgICAgX2FsbEh0bWxJblRoZVN0YXRlLnB1c2goX2dldEhpbnRzSHRtbChzdGF0ZSkpO1xuICAgICAgICAgICAgaWYgKHN0YXRlLmludGVyYWN0aW9uLnNvbHV0aW9uICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgX2FsbEh0bWxJblRoZVN0YXRlLnB1c2goX2dldFNvbHV0aW9uSHRtbChzdGF0ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIF9hbGxIdG1sSW5UaGVTdGF0ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEV4dHJhY3RzIHRoZSBmaWxlcGF0aCBvYmplY3QgZnJvbSB0aGUgZmlsZXBhdGgtdmFsdWUgYXR0cmlidXRlIG9mIHRoZVxuICAgICAgICAgKiBvcHBpYS1ub25pbnRlcmFjdGl2ZS1pbWFnZSB0YWdzIGluIHRoZSBzdHJIdG1sKGdpdmVuIHN0cmluZykuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJIdG1sIC0gVGhlIHN0cmluZyBmcm9tIHdoaWNoIHRoZSBvYmplY3Qgb2ZcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlcGF0aCBzaG91bGQgYmUgZXh0cmFjdGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9leHRyYWN0RmlsZXBhdGhWYWx1ZUZyb21PcHBpYU5vbkludGVyYWN0aXZlSW1hZ2VUYWcgPSBmdW5jdGlvbiAoc3RySHRtbCkge1xuICAgICAgICAgICAgdmFyIGZpbGVuYW1lcyA9IFtdO1xuICAgICAgICAgICAgdmFyIGR1bW15RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgZHVtbXlFbGVtZW50LmlubmVySFRNTCA9IChIdG1sRXNjYXBlclNlcnZpY2UuZXNjYXBlZFN0clRvVW5lc2NhcGVkU3RyKHN0ckh0bWwpKTtcbiAgICAgICAgICAgIHZhciBpbWFnZVRhZ0xpc3QgPSBkdW1teUVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ29wcGlhLW5vbmludGVyYWN0aXZlLWltYWdlJyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGltYWdlVGFnTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIFdlIGhhdmUgdGhlIGF0dHJpYnV0ZSBvZiBmaWxlcGF0aCBpbiBvcHBpYS1ub25pbnRlcmFjdGl2ZS1pbWFnZSB0YWcuXG4gICAgICAgICAgICAgICAgLy8gQnV0IGl0IGFjdHVhbGx5IGNvbnRhaW5zIHRoZSBmaWxlbmFtZSBvbmx5LiBXZSB1c2UgdGhlIHZhcmlhYmxlXG4gICAgICAgICAgICAgICAgLy8gZmlsZW5hbWUgaW5zdGVhZCBvZiBmaWxlcGF0aCBzaW5jZSBpbiB0aGUgZW5kIHdlIGFyZSByZXRyaWV2aW5nIHRoZVxuICAgICAgICAgICAgICAgIC8vIGZpbGVuYW1lcyBpbiB0aGUgZXhwbG9yYXRpb24uXG4gICAgICAgICAgICAgICAgdmFyIGZpbGVuYW1lID0gSlNPTi5wYXJzZShpbWFnZVRhZ0xpc3RbaV0uZ2V0QXR0cmlidXRlKCdmaWxlcGF0aC13aXRoLXZhbHVlJykpO1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lcy5wdXNoKGZpbGVuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmaWxlbmFtZXM7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBmaWxlbmFtZXMgb2YgYWxsIHRoZSBpbWFnZXMgdGhhdCBhcmUgYSBwYXJ0IG9mIHRoZSBzdGF0ZS5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHN0YXRlIC0gVGhlIHN0YXRlIGZyb20gd2hpY2ggdGhlIGZpbGVuYW1lcyBvZiB0aGUgaW1hZ2VcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGJlIGV4dHJhY3RlZC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfZ2V0SW1hZ2VGaWxlbmFtZXNJblN0YXRlID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgZmlsZW5hbWVzSW5TdGF0ZSA9IFtdO1xuICAgICAgICAgICAgLy8gVGhlIEltYWdlIENsaWNrIElucHV0IGludGVyYWN0aW9uIGhhcyBhbiBpbWFnZSB3aG9zZSBmaWxlbmFtZSBpc1xuICAgICAgICAgICAgLy8gZGlyZWN0bHkgc3RvcmVkIGluIHRoZSBjdXN0b21pemF0aW9uQXJncy5pbWFnZUFuZFJlZ2lvbi52YWx1ZVxuICAgICAgICAgICAgLy8gLmltYWdlUGF0aFxuICAgICAgICAgICAgaWYgKHN0YXRlLmludGVyYWN0aW9uLmlkID09PSBJTlRFUkFDVElPTl9UWVBFX0lNQUdFX0NMSUNLX0lOUFVUKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGVuYW1lID0gKHN0YXRlLmludGVyYWN0aW9uLmN1c3RvbWl6YXRpb25BcmdzLmltYWdlQW5kUmVnaW9ucy52YWx1ZS5pbWFnZVBhdGgpO1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lc0luU3RhdGUucHVzaChmaWxlbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYWxsSHRtbE9mU3RhdGUgPSBfZ2V0QWxsSHRtbE9mU3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgYWxsSHRtbE9mU3RhdGUuZm9yRWFjaChmdW5jdGlvbiAoaHRtbFN0cikge1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lc0luU3RhdGUgPSBmaWxlbmFtZXNJblN0YXRlLmNvbmNhdChfZXh0cmFjdEZpbGVwYXRoVmFsdWVGcm9tT3BwaWFOb25JbnRlcmFjdGl2ZUltYWdlVGFnKGh0bWxTdHIpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZpbGVuYW1lc0luU3RhdGU7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRJbWFnZUZpbGVuYW1lc0luU3RhdGU6IF9nZXRJbWFnZUZpbGVuYW1lc0luU3RhdGVcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBwcmVsb2FkIGltYWdlIGludG8gQXNzZXRzQmFja2VuZEFwaVNlcnZpY2UncyBjYWNoZS5cbiAqL1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tcGxheWVyLXBhZ2Uvc2VydmljZXMvJyArXG4gICAgJ2V4dHJhY3QtaW1hZ2UtZmlsZW5hbWVzLWZyb20tc3RhdGUuc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQXNzZXRzQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0NvbXB1dGVHcmFwaFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0NvbnRleHRTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdJbWFnZVByZWxvYWRlclNlcnZpY2UnLCBbXG4gICAgJyRxJywgJ0Fzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlJywgJ0NvbXB1dGVHcmFwaFNlcnZpY2UnLFxuICAgICdDb250ZXh0U2VydmljZScsICdFeHRyYWN0SW1hZ2VGaWxlbmFtZXNGcm9tU3RhdGVTZXJ2aWNlJywgJ0VOVElUWV9UWVBFJyxcbiAgICBmdW5jdGlvbiAoJHEsIEFzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlLCBDb21wdXRlR3JhcGhTZXJ2aWNlLCBDb250ZXh0U2VydmljZSwgRXh0cmFjdEltYWdlRmlsZW5hbWVzRnJvbVN0YXRlU2VydmljZSwgRU5USVRZX1RZUEUpIHtcbiAgICAgICAgdmFyIE1BWF9OVU1fSU1BR0VfRklMRVNfVE9fRE9XTkxPQURfU0lNVUxUQU5FT1VTTFkgPSAzO1xuICAgICAgICB2YXIgX2ZpbGVuYW1lc09mSW1hZ2VDdXJyZW50bHlEb3dubG9hZGluZyA9IFtdO1xuICAgICAgICB2YXIgX2ZpbGVuYW1lc09mSW1hZ2VUb0JlRG93bmxvYWRlZCA9IFtdO1xuICAgICAgICB2YXIgX2ZpbGVuYW1lc09mSW1hZ2VGYWlsZWRUb0Rvd25sb2FkID0gW107XG4gICAgICAgIHZhciBfZXhwbG9yYXRpb24gPSBudWxsO1xuICAgICAgICB2YXIgX3N0YXRlcyA9IG51bGw7XG4gICAgICAgIHZhciBfaGFzSW1hZ2VQcmVsb2FkZXJTZXJ2aWNlU3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICAvLyBpbWFnZUxvYWRlZENhbGxiYWNrIGlzIGFuIG9iamVjdCBvZiBvYmplY3RzIChpZGVudGlmaWVkIGJ5IHRoZSBmaWxlbmFtZXNcbiAgICAgICAgLy8gd2hpY2ggYXJlIGJlaW5nIGRvd25sb2FkZWQgYXQgdGhlIHRpbWUgdGhleSBhcmUgcmVxdWlyZWQgYnkgdGhlXG4gICAgICAgIC8vIGRpcmVjdGl2ZSkuVGhlIG9iamVjdCBjb250YWlucyB0aGUgcmVzb2x2ZSBtZXRob2Qgb2YgdGhlIHByb21pc2VcbiAgICAgICAgLy8gYXR0YWNoZWQgd2l0aCBnZXRJbkltYWdlVXJsIG1ldGhvZC5cbiAgICAgICAgdmFyIF9pbWFnZUxvYWRlZENhbGxiYWNrID0ge307XG4gICAgICAgIHZhciBfaGFzSW1hZ2VQcmVsb2FkZXJTZXJ2aWNlU3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgX2luaXQgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb24pIHtcbiAgICAgICAgICAgIF9leHBsb3JhdGlvbiA9IGV4cGxvcmF0aW9uO1xuICAgICAgICAgICAgX3N0YXRlcyA9IGV4cGxvcmF0aW9uLnN0YXRlcztcbiAgICAgICAgICAgIF9oYXNJbWFnZVByZWxvYWRlclNlcnZpY2VTdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgdGhlIFVybCBmb3IgdGhlIGltYWdlIGZpbGUuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIEZpbGVuYW1lIG9mIHRoZSBpbWFnZSB3aG9zZSBVcmwgaXMgdG8gYmVcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlZC5cbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gb25Mb2FkQ2FsbGJhY2sgLSBGdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZVxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFVybCBvZiB0aGUgbG9hZGVkIGltYWdlIGlzIG9idGFpbmVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9nZXRJbWFnZVVybCA9IGZ1bmN0aW9uIChmaWxlbmFtZSwgb25Mb2FkQ2FsbGJhY2ssIG9uRXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgQXNzZXRzQmFja2VuZEFwaVNlcnZpY2UubG9hZEltYWdlKENvbnRleHRTZXJ2aWNlLmdldEVudGl0eVR5cGUoKSwgQ29udGV4dFNlcnZpY2UuZ2V0RW50aXR5SWQoKSwgZmlsZW5hbWUpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGxvYWRlZEltYWdlRmlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChfaXNJbkZhaWxlZERvd25sb2FkKGxvYWRlZEltYWdlRmlsZS5maWxlbmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgX3JlbW92ZUZyb21GYWlsZWREb3dubG9hZChsb2FkZWRJbWFnZUZpbGUuZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgb2JqZWN0VXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChsb2FkZWRJbWFnZUZpbGUuZGF0YSk7XG4gICAgICAgICAgICAgICAgb25Mb2FkQ2FsbGJhY2sob2JqZWN0VXJsKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgIG9uRXJyb3JDYWxsYmFjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVja3MgaWYgdGhlIGdpdmVuIGZpbGVuYW1lIGlzIGluIF9maWxlbmFtZXNPZkltYWdlRmFpbGVkVG9Eb3dubG9hZCBvclxuICAgICAgICAgKiBub3QuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIFRoZSBmaWxlbmFtZSBvZiB0aGUgaW1hZ2Ugd2hpY2ggaXMgdG8gYmVcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZCBmcm9tIHRoZVxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZmlsZW5hbWVzT2ZJbWFnZUZhaWxlZFRvRG93bmxvYWQgYXJyYXkuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX2lzSW5GYWlsZWREb3dubG9hZCA9IGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIF9maWxlbmFtZXNPZkltYWdlRmFpbGVkVG9Eb3dubG9hZC5pbmRleE9mKGZpbGVuYW1lKSA+PSAwO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyB0aGUgZ2l2ZW4gZmlsZW5hbWUgZnJvbSB0aGUgX2ZpbGVuYW1lc09mSW1hZ2VGYWlsZWRUb0Rvd25sb2FkLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgLSBUaGUgZmlsZW5hbWUgb2YgdGhlIGZpbGUgd2hpY2ggaXMgdG8gYmVcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZCBmcm9tIHRoZVxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZmlsZW5hbWVzT2ZJbWFnZUZhaWxlZFRvRG93bmxvYWQgYXJyYXkuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX3JlbW92ZUZyb21GYWlsZWREb3dubG9hZCA9IGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gX2ZpbGVuYW1lc09mSW1hZ2VGYWlsZWRUb0Rvd25sb2FkLmluZGV4T2YoZmlsZW5hbWUpO1xuICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VGYWlsZWRUb0Rvd25sb2FkLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIGltYWdlIGZpbGVzIG5hbWVzIGluIEJmcyBvcmRlciBmcm9tIHRoZSBzdGF0ZS5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZVN0YXRlTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzdGFydGluZyBzdGF0ZVxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbSB3aGljaCB0aGUgZmlsZW5hbWVzIHNob3VsZFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmUgb2J0YWluZWQuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX2dldEltYWdlRmlsZW5hbWVzSW5CZnNPcmRlciA9IGZ1bmN0aW9uIChzb3VyY2VTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZU5hbWVzSW5CZnNPcmRlciA9IChDb21wdXRlR3JhcGhTZXJ2aWNlLmNvbXB1dGVCZnNUcmF2ZXJzYWxPZlN0YXRlcyhfZXhwbG9yYXRpb24uZ2V0SW5pdGlhbFN0YXRlKCkubmFtZSwgX2V4cGxvcmF0aW9uLmdldFN0YXRlcygpLCBzb3VyY2VTdGF0ZU5hbWUpKTtcbiAgICAgICAgICAgIHZhciBpbWFnZUZpbGVuYW1lcyA9IFtdO1xuICAgICAgICAgICAgc3RhdGVOYW1lc0luQmZzT3JkZXIuZm9yRWFjaChmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gX3N0YXRlcy5nZXRTdGF0ZShzdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIEV4dHJhY3RJbWFnZUZpbGVuYW1lc0Zyb21TdGF0ZVNlcnZpY2UuZ2V0SW1hZ2VGaWxlbmFtZXNJblN0YXRlKHN0YXRlKVxuICAgICAgICAgICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VGaWxlbmFtZXMucHVzaChmaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZUZpbGVuYW1lcztcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgdGhlIGZpbGVuYW1lIGZyb20gdGhlIF9maWxlbmFtZXNPZkltYWdlQ3VycmVudGx5RG93bmxvYWRpbmcgYW5kXG4gICAgICAgICAqIGluaXRpYXRlcyB0aGUgbG9hZGluZyBvZiB0aGUgbmV4dCBpbWFnZSBmaWxlLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgLSBUaGUgZmlsZW5hbWUgd2hpY2ggaXMgdG8gYmUgcmVtb3ZlZCBmcm9tIHRoZVxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZmlsZW5hbWVzT2ZJbWFnZUN1cnJlbnRseURvd25sb2FkaW5nIGFycmF5LlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9yZW1vdmVDdXJyZW50QW5kTG9hZE5leHRJbWFnZSA9IGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VDdXJyZW50bHlEb3dubG9hZGluZyA9IChfZmlsZW5hbWVzT2ZJbWFnZUN1cnJlbnRseURvd25sb2FkaW5nLmZpbHRlcihmdW5jdGlvbiAoaW1hZ2VGaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlbmFtZSAhPT0gaW1hZ2VGaWxlbmFtZTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGlmIChfZmlsZW5hbWVzT2ZJbWFnZVRvQmVEb3dubG9hZGVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEltYWdlRmlsZW5hbWUgPSBfZmlsZW5hbWVzT2ZJbWFnZVRvQmVEb3dubG9hZGVkLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VDdXJyZW50bHlEb3dubG9hZGluZy5wdXNoKG5leHRJbWFnZUZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICBfbG9hZEltYWdlKG5leHRJbWFnZUZpbGVuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZXMgdGhlIGxvYWRpbmcgb2YgdGhlIGltYWdlIGZpbGUuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbWFnZUZpbGVuYW1lIC0gVGhlIGZpbGVuYW1lIG9mIHRoZSBpbWFnZSB0byBiZSBsb2FkZWQuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX2xvYWRJbWFnZSA9IGZ1bmN0aW9uIChpbWFnZUZpbGVuYW1lKSB7XG4gICAgICAgICAgICBBc3NldHNCYWNrZW5kQXBpU2VydmljZS5sb2FkSW1hZ2UoRU5USVRZX1RZUEUuRVhQTE9SQVRJT04sIENvbnRleHRTZXJ2aWNlLmdldEV4cGxvcmF0aW9uSWQoKSwgaW1hZ2VGaWxlbmFtZSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAobG9hZGVkSW1hZ2UpIHtcbiAgICAgICAgICAgICAgICBfcmVtb3ZlQ3VycmVudEFuZExvYWROZXh0SW1hZ2UobG9hZGVkSW1hZ2UuZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChfaW1hZ2VMb2FkZWRDYWxsYmFja1tsb2FkZWRJbWFnZS5maWxlbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uTG9hZEltYWdlUmVzb2x2ZSA9ICgoX2ltYWdlTG9hZGVkQ2FsbGJhY2tbbG9hZGVkSW1hZ2UuZmlsZW5hbWVdKS5yZXNvbHZlTWV0aG9kKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9iamVjdFVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwobG9hZGVkSW1hZ2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIG9uTG9hZEltYWdlUmVzb2x2ZShvYmplY3RVcmwpO1xuICAgICAgICAgICAgICAgICAgICBfaW1hZ2VMb2FkZWRDYWxsYmFja1tsb2FkZWRJbWFnZS5maWxlbmFtZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChfaW1hZ2VMb2FkZWRDYWxsYmFja1tmaWxlbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uRmFpbGVkRG93bmxvYWQgPSAoKF9pbWFnZUxvYWRlZENhbGxiYWNrW2ZpbGVuYW1lXSkucmVqZWN0TWV0aG9kKTtcbiAgICAgICAgICAgICAgICAgICAgb25GYWlsZWREb3dubG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICBfaW1hZ2VMb2FkZWRDYWxsYmFja1tmaWxlbmFtZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfZmlsZW5hbWVzT2ZJbWFnZUZhaWxlZFRvRG93bmxvYWQucHVzaChmaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgX3JlbW92ZUN1cnJlbnRBbmRMb2FkTmV4dEltYWdlKGZpbGVuYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogSW5pdGlhdGVzIHRoZSBpbWFnZSBwcmVsb2FkZXIgYmVnaW5uaW5nIGZyb20gdGhlIHNvdXJjZVN0YXRlTmFtZS5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZVN0YXRlTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzdGF0ZSBmcm9tIHdoaWNoXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVsb2FkZXIgc2hvdWxkIHN0YXJ0LlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9raWNrT2ZmSW1hZ2VQcmVsb2FkZXIgPSBmdW5jdGlvbiAoc291cmNlU3RhdGVOYW1lKSB7XG4gICAgICAgICAgICBfZmlsZW5hbWVzT2ZJbWFnZVRvQmVEb3dubG9hZGVkID0gKF9nZXRJbWFnZUZpbGVuYW1lc0luQmZzT3JkZXIoc291cmNlU3RhdGVOYW1lKSk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VGaWxlc0luR2l2ZW5TdGF0ZSA9IEV4dHJhY3RJbWFnZUZpbGVuYW1lc0Zyb21TdGF0ZVNlcnZpY2VcbiAgICAgICAgICAgICAgICAuZ2V0SW1hZ2VGaWxlbmFtZXNJblN0YXRlKF9zdGF0ZXMuZ2V0U3RhdGUoc291cmNlU3RhdGVOYW1lKSk7XG4gICAgICAgICAgICBfZmlsZW5hbWVzT2ZJbWFnZUZhaWxlZFRvRG93bmxvYWQgPSBfZmlsZW5hbWVzT2ZJbWFnZUZhaWxlZFRvRG93bmxvYWRcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbWFnZUZpbGVzSW5HaXZlblN0YXRlLmluZGV4T2YoZmlsZW5hbWUpID09PSAtMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgd2hpbGUgKF9maWxlbmFtZXNPZkltYWdlQ3VycmVudGx5RG93bmxvYWRpbmcubGVuZ3RoIDxcbiAgICAgICAgICAgICAgICBNQVhfTlVNX0lNQUdFX0ZJTEVTX1RPX0RPV05MT0FEX1NJTVVMVEFORU9VU0xZICYmXG4gICAgICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VUb0JlRG93bmxvYWRlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGltYWdlRmlsZW5hbWUgPSBfZmlsZW5hbWVzT2ZJbWFnZVRvQmVEb3dubG9hZGVkLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgX2ZpbGVuYW1lc09mSW1hZ2VDdXJyZW50bHlEb3dubG9hZGluZy5wdXNoKGltYWdlRmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIF9sb2FkSW1hZ2UoaW1hZ2VGaWxlbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYW5jZWxzIHRoZSBwcmVsb2FkaW5nIG9mIHRoZSBpbWFnZXMgdGhhdCBhcmUgYmVpbmcgZG93bmxvYWRlZC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfY2FuY2VsUHJlbG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIEFzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlLmFib3J0QWxsQ3VycmVudEltYWdlRG93bmxvYWRzKCk7XG4gICAgICAgICAgICBfZmlsZW5hbWVzT2ZJbWFnZUN1cnJlbnRseURvd25sb2FkaW5nID0gW107XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGVuIHRoZSBzdGF0ZSBjaGFuZ2VzLCBpdCBkZWNpZGVzIHdoZXRoZXIgdG8gcmVzdGFydCB0aGUgcHJlbG9hZGVyXG4gICAgICAgICAqIHN0YXJ0aW5nIGZyb20gdGhlICdzdGF0ZU5hbWUnIHN0YXRlIG9yIG5vdC5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzdGF0ZSB0aGUgdXNlciBzaGlmdHMgdG8uXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX29uU3RhdGVDaGFuZ2UgPSBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICBpZiAoc3RhdGVOYW1lICE9PSBfZXhwbG9yYXRpb24uZ2V0SW5pdGlhbFN0YXRlKCkubmFtZSkge1xuICAgICAgICAgICAgICAgIF9pbWFnZUxvYWRlZENhbGxiYWNrID0ge307XG4gICAgICAgICAgICAgICAgdmFyIGltYWdlRmlsZW5hbWVzSW5TdGF0ZSA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBub09mSW1hZ2VGaWxlc0N1cnJlbnRseURvd25sb2FkaW5nID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgbm9PZkltYWdlc05laXRoZXJJbkNhY2hlTm9yRG93bmxvYWRpbmcgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IF9zdGF0ZXMuZ2V0U3RhdGUoc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpbWFnZUZpbGVuYW1lc0luU3RhdGUgPSAoRXh0cmFjdEltYWdlRmlsZW5hbWVzRnJvbVN0YXRlU2VydmljZVxuICAgICAgICAgICAgICAgICAgICAuZ2V0SW1hZ2VGaWxlbmFtZXNJblN0YXRlKHN0YXRlKSk7XG4gICAgICAgICAgICAgICAgaW1hZ2VGaWxlbmFtZXNJblN0YXRlLmZvckVhY2goZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc0ZpbGVDdXJyZW50bHlEb3dubG9hZGluZyA9IChfZmlsZW5hbWVzT2ZJbWFnZUN1cnJlbnRseURvd25sb2FkaW5nLmluZGV4T2YoZmlsZW5hbWUpID49IDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUFzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlLmlzQ2FjaGVkKGZpbGVuYW1lKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIWlzRmlsZUN1cnJlbnRseURvd25sb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub09mSW1hZ2VzTmVpdGhlckluQ2FjaGVOb3JEb3dubG9hZGluZyArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0ZpbGVDdXJyZW50bHlEb3dubG9hZGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9PZkltYWdlRmlsZXNDdXJyZW50bHlEb3dubG9hZGluZyArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKG5vT2ZJbWFnZXNOZWl0aGVySW5DYWNoZU5vckRvd25sb2FkaW5nID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICBub09mSW1hZ2VGaWxlc0N1cnJlbnRseURvd25sb2FkaW5nIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgX2NhbmNlbFByZWxvYWRpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgX2tpY2tPZmZJbWFnZVByZWxvYWRlcihzdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgaW1hZ2VzIGZyb20gdGhlIGZpbGVuYW1lIHByb3ZpZGVkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIFRoZSBzdHJpbmcgZnJvbSB3aGljaCB0aGUgZGltZW5zaW9ucyBvZiB0aGVcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlcyBzaG91bGQgYmUgZXh0cmFjdGVkLlxuICAgICAgICAqL1xuICAgICAgICB2YXIgZ2V0RGltZW5zaW9uc09mSW1hZ2UgPSBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIHZhciBkaW1lbnNpb25zUmVnZXggPSBSZWdFeHAoJ1teL10rX2hlaWdodF8oWzAtOV0rKV93aWR0aF8oWzAtOV0rKVxcLihwbmd8anBlZ3xqcGd8Z2lmKSQnLCAnZycpO1xuICAgICAgICAgICAgdmFyIGltYWdlRGltZW5zaW9ucyA9IGRpbWVuc2lvbnNSZWdleC5leGVjKGZpbGVuYW1lKTtcbiAgICAgICAgICAgIGlmIChpbWFnZURpbWVuc2lvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGltZW5zaW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBOdW1iZXIoaW1hZ2VEaW1lbnNpb25zWzFdKSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IE51bWJlcihpbWFnZURpbWVuc2lvbnNbMl0pXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGltZW5zaW9ucztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGltYWdlIG5hbWUgaXMgaW52YWxpZCwgaXQgZG9lcyBub3QgY29udGFpbiBkaW1lbnNpb25zLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5pdDogX2luaXQsXG4gICAgICAgICAgICBraWNrT2ZmSW1hZ2VQcmVsb2FkZXI6IF9raWNrT2ZmSW1hZ2VQcmVsb2FkZXIsXG4gICAgICAgICAgICBnZXREaW1lbnNpb25zT2ZJbWFnZTogZ2V0RGltZW5zaW9uc09mSW1hZ2UsXG4gICAgICAgICAgICBvblN0YXRlQ2hhbmdlOiBfb25TdGF0ZUNoYW5nZSxcbiAgICAgICAgICAgIGlzSW5GYWlsZWREb3dubG9hZDogX2lzSW5GYWlsZWREb3dubG9hZCxcbiAgICAgICAgICAgIGlzTG9hZGluZ0ltYWdlRmlsZTogZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9maWxlbmFtZXNPZkltYWdlQ3VycmVudGx5RG93bmxvYWRpbmcuaW5kZXhPZihmaWxlbmFtZSkgIT09IC0xO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3RhcnRJbWFnZVByZWxvYWRlcjogZnVuY3Rpb24gKHNvdXJjZVN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIF9jYW5jZWxQcmVsb2FkaW5nKCk7XG4gICAgICAgICAgICAgICAgX2tpY2tPZmZJbWFnZVByZWxvYWRlcihzb3VyY2VTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEZpbGVuYW1lc09mSW1hZ2VDdXJyZW50bHlEb3dubG9hZGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfZmlsZW5hbWVzT2ZJbWFnZUN1cnJlbnRseURvd25sb2FkaW5nO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEltYWdlVXJsOiBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXNzZXRzQmFja2VuZEFwaVNlcnZpY2UuaXNDYWNoZWQoZmlsZW5hbWUpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBfaXNJbkZhaWxlZERvd25sb2FkKGZpbGVuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2dldEltYWdlVXJsKGZpbGVuYW1lLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2ltYWdlTG9hZGVkQ2FsbGJhY2tbZmlsZW5hbWVdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVNZXRob2Q6IHJlc29sdmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0TWV0aG9kOiByZWplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbkV4cGxvcmF0aW9uUGxheWVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9oYXNJbWFnZVByZWxvYWRlclNlcnZpY2VTdGFydGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHNlcnZlIGFzIHRoZSBpbnRlcmZhY2UgZm9yIGZldGNoaW5nIGFuZCB1cGxvYWRpbmdcbiAqIGFzc2V0cyBmcm9tIEdvb2dsZSBDbG91ZCBTdG9yYWdlLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0F1ZGlvRmlsZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ3NyZlRva2VuU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQXNzZXRzQmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ0F1ZGlvRmlsZU9iamVjdEZhY3RvcnknLCAnQ3NyZlRva2VuU2VydmljZScsXG4gICAgJ0ZpbGVEb3dubG9hZFJlcXVlc3RPYmplY3RGYWN0b3J5JywgJ0ltYWdlRmlsZU9iamVjdEZhY3RvcnknLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdERVZfTU9ERScsICdFTlRJVFlfVFlQRScsXG4gICAgJ0dDU19SRVNPVVJDRV9CVUNLRVRfTkFNRScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgQXVkaW9GaWxlT2JqZWN0RmFjdG9yeSwgQ3NyZlRva2VuU2VydmljZSwgRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnksIEltYWdlRmlsZU9iamVjdEZhY3RvcnksIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBERVZfTU9ERSwgRU5USVRZX1RZUEUsIEdDU19SRVNPVVJDRV9CVUNLRVRfTkFNRSkge1xuICAgICAgICBpZiAoIURFVl9NT0RFICYmICFHQ1NfUkVTT1VSQ0VfQlVDS0VUX05BTUUpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdHQ1NfUkVTT1VSQ0VfQlVDS0VUX05BTUUgaXMgbm90IHNldCBpbiBwcm9kLicpO1xuICAgICAgICB9XG4gICAgICAgIC8vIExpc3Qgb2YgZmlsZW5hbWVzIHRoYXQgaGF2ZSBiZWVuIHJlcXVlc3RlZCBmb3IgYnV0IGhhdmVcbiAgICAgICAgLy8geWV0IHRvIHJldHVybiBhIHJlc3BvbnNlLlxuICAgICAgICB2YXIgX2F1ZGlvRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZCA9IFtdO1xuICAgICAgICB2YXIgX2ltYWdlRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZCA9IFtdO1xuICAgICAgICB2YXIgQVNTRVRfVFlQRV9BVURJTyA9ICdhdWRpbyc7XG4gICAgICAgIHZhciBBU1NFVF9UWVBFX0lNQUdFID0gJ2ltYWdlJztcbiAgICAgICAgdmFyIEdDU19QUkVGSVggPSAoJ2h0dHBzOi8vc3RvcmFnZS5nb29nbGVhcGlzLmNvbS8nICtcbiAgICAgICAgICAgIEdDU19SRVNPVVJDRV9CVUNLRVRfTkFNRSk7XG4gICAgICAgIHZhciBBVURJT19ET1dOTE9BRF9VUkxfVEVNUExBVEUgPSAoKERFVl9NT0RFID8gJy9hc3NldHNkZXZoYW5kbGVyJyA6IEdDU19QUkVGSVgpICtcbiAgICAgICAgICAgICcvPGVudGl0eV90eXBlPi88ZW50aXR5X2lkPi9hc3NldHMvYXVkaW8vPGZpbGVuYW1lPicpO1xuICAgICAgICB2YXIgSU1BR0VfRE9XTkxPQURfVVJMX1RFTVBMQVRFID0gKChERVZfTU9ERSA/ICcvYXNzZXRzZGV2aGFuZGxlcicgOiBHQ1NfUFJFRklYKSArXG4gICAgICAgICAgICAnLzxlbnRpdHlfdHlwZT4vPGVudGl0eV9pZD4vYXNzZXRzL2ltYWdlLzxmaWxlbmFtZT4nKTtcbiAgICAgICAgdmFyIEFVRElPX1VQTE9BRF9VUkxfVEVNUExBVEUgPSAnL2NyZWF0ZWhhbmRsZXIvYXVkaW91cGxvYWQvPGV4cGxvcmF0aW9uX2lkPic7XG4gICAgICAgIC8vIE1hcCBmcm9tIGFzc2V0IGZpbGVuYW1lIHRvIGFzc2V0IGJsb2IuXG4gICAgICAgIHZhciBhc3NldHNDYWNoZSA9IHt9O1xuICAgICAgICB2YXIgX2ZldGNoRmlsZSA9IGZ1bmN0aW9uIChlbnRpdHlUeXBlLCBlbnRpdHlJZCwgZmlsZW5hbWUsIGFzc2V0VHlwZSwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgY2FuY2VsZXIgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgaWYgKGFzc2V0VHlwZSA9PT0gQVNTRVRfVFlQRV9BVURJTykge1xuICAgICAgICAgICAgICAgIF9hdWRpb0ZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQucHVzaChGaWxlRG93bmxvYWRSZXF1ZXN0T2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoZmlsZW5hbWUsIGNhbmNlbGVyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBfaW1hZ2VGaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkLnB1c2goRmlsZURvd25sb2FkUmVxdWVzdE9iamVjdEZhY3RvcnkuY3JlYXRlTmV3KGZpbGVuYW1lLCBjYW5jZWxlcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgcmVzcG9uc2VUeXBlOiAnYmxvYicsXG4gICAgICAgICAgICAgICAgdXJsOiBfZ2V0RG93bmxvYWRVcmwoZW50aXR5VHlwZSwgZW50aXR5SWQsIGZpbGVuYW1lLCBhc3NldFR5cGUpLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IGNhbmNlbGVyLnByb21pc2VcbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXNzZXRCbG9iID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXRUeXBlID09PSBBU1NFVF9UWVBFX0FVRElPKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdHlwZSBmb3IgYXVkaW8gYXNzZXRzLiBXaXRob3V0IHRoaXMsIHRyYW5zbGF0aW9ucyBjYW5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdCBiZSBwbGF5ZWQgb24gU2FmYXJpLlxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRCbG9iID0gbmV3IEJsb2IoW2RhdGFdLCB7IHR5cGU6ICdhdWRpby9tcGVnJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0QmxvYiA9IG5ldyBCbG9iKFtkYXRhXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuQmxvYkJ1aWxkZXIgPSB3aW5kb3cuQmxvYkJ1aWxkZXIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5XZWJLaXRCbG9iQnVpbGRlciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lk1vekJsb2JCdWlsZGVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuTVNCbG9iQnVpbGRlcjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4Y2VwdGlvbi5uYW1lID09PSAnVHlwZUVycm9yJyAmJiB3aW5kb3cuQmxvYkJ1aWxkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2JCdWlsZGVyID0gbmV3IEJsb2JCdWlsZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvYkJ1aWxkZXIuYXBwZW5kKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0QmxvYiA9IGJsb2JCdWlsZGVyLmdldEJsb2IoYXNzZXRUeXBlLmNvbmNhdCgnLyonKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsSW5mbyA9ICgnXFxuQmxvYkJ1aWxkZXIgY29uc3RydWN0aW9uIGVycm9yIGRlYnVnIGxvZ3M6JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdcXG5Bc3NldCB0eXBlOiAnICsgYXNzZXRUeXBlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1xcbkRhdGE6ICcgKyBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLm1lc3NhZ2UgKz0gYWRkaXRpb25hbEluZm87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsSW5mbyA9ICgnXFxuQmxvYiBjb25zdHJ1Y3Rpb24gZXJyb3IgZGVidWcgbG9nczonICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXFxuQXNzZXQgdHlwZTogJyArIGFzc2V0VHlwZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1xcbkRhdGE6ICcgKyBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2VwdGlvbi5tZXNzYWdlICs9IGFkZGl0aW9uYWxJbmZvO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFzc2V0c0NhY2hlW2ZpbGVuYW1lXSA9IGFzc2V0QmxvYjtcbiAgICAgICAgICAgICAgICBpZiAoYXNzZXRUeXBlID09PSBBU1NFVF9UWVBFX0FVRElPKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhBdWRpb0ZpbGVPYmplY3RGYWN0b3J5LmNyZWF0ZU5ldyhmaWxlbmFtZSwgYXNzZXRCbG9iKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soSW1hZ2VGaWxlT2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoZmlsZW5hbWUsIGFzc2V0QmxvYikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGZpbGVuYW1lKTtcbiAgICAgICAgICAgIH0pWydmaW5hbGx5J10oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9yZW1vdmVGcm9tRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZChmaWxlbmFtZSwgYXNzZXRUeXBlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2Fib3J0QWxsQ3VycmVudERvd25sb2FkcyA9IGZ1bmN0aW9uIChhc3NldFR5cGUpIHtcbiAgICAgICAgICAgIGlmIChhc3NldFR5cGUgPT09IEFTU0VUX1RZUEVfQVVESU8pIHtcbiAgICAgICAgICAgICAgICBfYXVkaW9GaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkLmZvckVhY2goZnVuY3Rpb24gKHJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5jYW5jZWxlci5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgX2F1ZGlvRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZCA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgX2ltYWdlRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZC5mb3JFYWNoKGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuY2FuY2VsZXIucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF9pbWFnZUZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9yZW1vdmVGcm9tRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZCA9IGZ1bmN0aW9uIChmaWxlbmFtZSwgYXNzZXRUeXBlKSB7XG4gICAgICAgICAgICBpZiAoX2lzQXNzZXRDdXJyZW50bHlCZWluZ1JlcXVlc3RlZChmaWxlbmFtZSwgQVNTRVRfVFlQRV9BVURJTykpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDxcbiAgICAgICAgICAgICAgICAgICAgX2F1ZGlvRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZC5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9hdWRpb0ZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWRbaW5kZXhdLmZpbGVuYW1lID09PSBmaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2F1ZGlvRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChfaXNBc3NldEN1cnJlbnRseUJlaW5nUmVxdWVzdGVkKGZpbGVuYW1lLCBBU1NFVF9UWVBFX0lNQUdFKSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPFxuICAgICAgICAgICAgICAgICAgICBfaW1hZ2VGaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2ltYWdlRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZFtpbmRleF0uZmlsZW5hbWUgPT09IGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW1hZ2VGaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9zYXZlQXVkaW8gPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCwgZmlsZW5hbWUsIHJhd0Fzc2V0RGF0YSwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgZm9ybS5hcHBlbmQoJ3Jhd19hdWRpb19maWxlJywgcmF3QXNzZXREYXRhKTtcbiAgICAgICAgICAgIGZvcm0uYXBwZW5kKCdwYXlsb2FkJywgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgQ3NyZlRva2VuU2VydmljZS5nZXRUb2tlbkFzeW5jKCkudGhlbihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgICAgICBmb3JtLmFwcGVuZCgnY3NyZl90b2tlbicsIHRva2VuKTtcbiAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICB1cmw6IF9nZXRBdWRpb1VwbG9hZFVybChleHBsb3JhdGlvbklkKSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZm9ybSxcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YUZpbHRlcjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgWFNTSSBwcmVmaXguXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtZWREYXRhID0gZGF0YS5zdWJzdHJpbmcoNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh0cmFuc2Zvcm1lZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pLmRvbmUoZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgWFNTSSBwcmVmaXguXG4gICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1lZERhdGEgPSBkYXRhLnJlc3BvbnNlVGV4dC5zdWJzdHJpbmcoNSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJzZWRSZXNwb25zZSA9IGFuZ3VsYXIuZnJvbUpzb24odHJhbnNmb3JtZWREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihwYXJzZWRSZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKHBhcnNlZFJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZ2V0RG93bmxvYWRVcmwgPSBmdW5jdGlvbiAoZW50aXR5VHlwZSwgZW50aXR5SWQsIGZpbGVuYW1lLCBhc3NldFR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybCgoYXNzZXRUeXBlID09PSBBU1NFVF9UWVBFX0FVRElPID8gQVVESU9fRE9XTkxPQURfVVJMX1RFTVBMQVRFIDpcbiAgICAgICAgICAgICAgICBJTUFHRV9ET1dOTE9BRF9VUkxfVEVNUExBVEUpLCB7XG4gICAgICAgICAgICAgICAgZW50aXR5X2lkOiBlbnRpdHlJZCxcbiAgICAgICAgICAgICAgICBlbnRpdHlfdHlwZTogZW50aXR5VHlwZSxcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldEF1ZGlvVXBsb2FkVXJsID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChBVURJT19VUExPQURfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGV4cGxvcmF0aW9uSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2lzQXNzZXRDdXJyZW50bHlCZWluZ1JlcXVlc3RlZCA9IGZ1bmN0aW9uIChmaWxlbmFtZSwgYXNzZXRUeXBlKSB7XG4gICAgICAgICAgICBpZiAoYXNzZXRUeXBlID09PSBBU1NFVF9UWVBFX0FVRElPKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9hdWRpb0ZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQuc29tZShmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdC5maWxlbmFtZSA9PT0gZmlsZW5hbWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2ltYWdlRmlsZXNDdXJyZW50bHlCZWluZ1JlcXVlc3RlZC5zb21lKGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0LmZpbGVuYW1lID09PSBmaWxlbmFtZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9pc0NhY2hlZCA9IGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0c0NhY2hlLmhhc093blByb3BlcnR5KGZpbGVuYW1lKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxvYWRBdWRpbzogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQsIGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9pc0NhY2hlZChmaWxlbmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoQXVkaW9GaWxlT2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoZmlsZW5hbWUsIGFzc2V0c0NhY2hlW2ZpbGVuYW1lXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2ZldGNoRmlsZShFTlRJVFlfVFlQRS5FWFBMT1JBVElPTiwgZXhwbG9yYXRpb25JZCwgZmlsZW5hbWUsIEFTU0VUX1RZUEVfQVVESU8sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb2FkSW1hZ2U6IGZ1bmN0aW9uIChlbnRpdHlUeXBlLCBlbnRpdHlJZCwgZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2lzQ2FjaGVkKGZpbGVuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShJbWFnZUZpbGVPYmplY3RGYWN0b3J5LmNyZWF0ZU5ldyhmaWxlbmFtZSwgYXNzZXRzQ2FjaGVbZmlsZW5hbWVdKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfZmV0Y2hGaWxlKGVudGl0eVR5cGUsIGVudGl0eUlkLCBmaWxlbmFtZSwgQVNTRVRfVFlQRV9JTUFHRSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNhdmVBdWRpbzogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQsIGZpbGVuYW1lLCByYXdBc3NldERhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfc2F2ZUF1ZGlvKGV4cGxvcmF0aW9uSWQsIGZpbGVuYW1lLCByYXdBc3NldERhdGEsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNDYWNoZWQ6IGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfaXNDYWNoZWQoZmlsZW5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEF1ZGlvRG93bmxvYWRVcmw6IGZ1bmN0aW9uIChlbnRpdHlUeXBlLCBlbnRpdHlJZCwgZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2dldERvd25sb2FkVXJsKGVudGl0eVR5cGUsIGVudGl0eUlkLCBmaWxlbmFtZSwgQVNTRVRfVFlQRV9BVURJTyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWJvcnRBbGxDdXJyZW50QXVkaW9Eb3dubG9hZHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfYWJvcnRBbGxDdXJyZW50RG93bmxvYWRzKEFTU0VUX1RZUEVfQVVESU8pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFib3J0QWxsQ3VycmVudEltYWdlRG93bmxvYWRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX2Fib3J0QWxsQ3VycmVudERvd25sb2FkcyhBU1NFVF9UWVBFX0lNQUdFKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBc3NldHNGaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgYXVkaW86IF9hdWRpb0ZpbGVzQ3VycmVudGx5QmVpbmdSZXF1ZXN0ZWQsXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiBfaW1hZ2VGaWxlc0N1cnJlbnRseUJlaW5nUmVxdWVzdGVkXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRJbWFnZVVybEZvclByZXZpZXc6IGZ1bmN0aW9uIChlbnRpdHlUeXBlLCBlbnRpdHlJZCwgZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2dldERvd25sb2FkVXJsKGVudGl0eVR5cGUsIGVudGl0eUlkLCBmaWxlbmFtZSwgQVNTRVRfVFlQRV9JTUFHRSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEF1dG9wbGF5ZWQgdmlkZW9zIHNlcnZpY2UuXG4gKi9cbi8vIEFib3V0IHRoaXMgc2VydmljZTpcbi8vIEluIHRoZSBleHBsb3JhdGlvbiBwbGF5ZXIsIGEgdmlkZW8gc2hvdWxkIG9ubHkgYXV0b3BsYXkgd2hlbiBpdCBpcyBmaXJzdCBzZWVuXG4vLyBvbiBhIG5ldyBjYXJkLCBhbmQgbm90IHdoZW4gdGhlIGxlYXJuZXIgY2xpY2tzIGJhY2sgdG8gcHJldmlvdXMgY2FyZHMgaW5cbi8vIHRoZWlyIGV4cGxvcmF0aW9uIHBsYXl0aHJvdWdoLiBUaGlzIHNlcnZpY2UgbWFpbnRhaW5zIGEgbGlzdCBvZiB2aWRlb3MgdGhhdFxuLy8gaGF2ZSBiZWVuIHBsYXllZCwgc28gdGhhdCB3ZSBrbm93IG5vdCB0byBhdXRvcGxheSB0aGVtIG9uIGEgc2Vjb25kIHBhc3MuXG4vL1xuLy8gQ2F2ZWF0OiBpZiB0aGUgc2FtZSB2aWRlbyBpcyBzaG93biB0d2ljZSBpbiB0aGUgZXhwbG9yYXRpb24sIHRoZSBzZWNvbmQgYW5kXG4vLyBzdWJzZXF1ZW50IGluc3RhbmNlcyBvZiB0aGF0IHZpZGVvIHdpbGwgbm90IGF1dG9wbGF5LiBXZSBiZWxpZXZlIHRoaXNcbi8vIG9jY3VycmVuY2UgaXMgcmFyZSwgYW5kIGhhdmUgbm90IGFjY291bnRlZCBmb3IgaXQgaGVyZS4gSWYgaXQgdHVybnMgb3V0XG4vLyB0byBiZSBhbiBpc3N1ZSwgd2UgbWF5IG5lZWQgdG8gaW5zdGVhZCBhc3NpZ24gYSB1bmlxdWUgaWQgdG8gZWFjaCByaWNoLXRleHRcbi8vIGNvbXBvbmVudCBhbmQgdXNlIHRoYXQgaWQgaW5zdGVhZCB0byBkZXRlcm1pbmUgd2hldGhlciB0byBzdXBwcmVzc1xuLy8gYXV0b3BsYXlpbmcuXG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgQXV0b3BsYXllZFZpZGVvc1NlcnZpY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQXV0b3BsYXllZFZpZGVvc1NlcnZpY2UoKSB7XG4gICAgICAgIHRoaXMuYXV0b3BsYXllZFZpZGVvc0RpY3QgPSB7fTtcbiAgICB9XG4gICAgQXV0b3BsYXllZFZpZGVvc1NlcnZpY2UucHJvdG90eXBlLmFkZEF1dG9wbGF5ZWRWaWRlbyA9IGZ1bmN0aW9uICh2aWRlb0lkKSB7XG4gICAgICAgIHRoaXMuYXV0b3BsYXllZFZpZGVvc0RpY3RbdmlkZW9JZF0gPSB0cnVlO1xuICAgIH07XG4gICAgQXV0b3BsYXllZFZpZGVvc1NlcnZpY2UucHJvdG90eXBlLmhhc1ZpZGVvQmVlbkF1dG9wbGF5ZWQgPSBmdW5jdGlvbiAodmlkZW9JZCkge1xuICAgICAgICByZXR1cm4gQm9vbGVhbih0aGlzLmF1dG9wbGF5ZWRWaWRlb3NEaWN0W3ZpZGVvSWRdKTtcbiAgICB9O1xuICAgIEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlKTtcbiAgICByZXR1cm4gQXV0b3BsYXllZFZpZGVvc1NlcnZpY2U7XG59KCkpO1xuZXhwb3J0cy5BdXRvcGxheWVkVmlkZW9zU2VydmljZSA9IEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQXV0b3BsYXllZFZpZGVvc1NlcnZpY2UnLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlKSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGNvbXB1dGluZyBhIGdyYXBoaWNhbCByZXByZXNlbnRhdGlvbiBvZiBhblxuICogZXhwbG9yYXRpb24uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NvbXB1dGVHcmFwaFNlcnZpY2UnLCBbXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX2NvbXB1dGVHcmFwaERhdGEgPSBmdW5jdGlvbiAoaW5pdFN0YXRlSWQsIHN0YXRlcykge1xuICAgICAgICAgICAgdmFyIG5vZGVzID0ge307XG4gICAgICAgICAgICB2YXIgbGlua3MgPSBbXTtcbiAgICAgICAgICAgIHZhciBmaW5hbFN0YXRlSWRzID0gc3RhdGVzLmdldEZpbmFsU3RhdGVOYW1lcygpO1xuICAgICAgICAgICAgc3RhdGVzLmdldFN0YXRlTmFtZXMoKS5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJhY3Rpb24gPSBzdGF0ZXMuZ2V0U3RhdGUoc3RhdGVOYW1lKS5pbnRlcmFjdGlvbjtcbiAgICAgICAgICAgICAgICBub2Rlc1tzdGF0ZU5hbWVdID0gc3RhdGVOYW1lO1xuICAgICAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5pZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZ3JvdXBzID0gaW50ZXJhY3Rpb24uYW5zd2VyR3JvdXBzO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBoID0gMDsgaCA8IGdyb3Vwcy5sZW5ndGg7IGgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlua3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBzdGF0ZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBncm91cHNbaF0ub3V0Y29tZS5kZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLmRlZmF1bHRPdXRjb21lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5rcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHN0YXRlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IGludGVyYWN0aW9uLmRlZmF1bHRPdXRjb21lLmRlc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmaW5hbFN0YXRlSWRzOiBmaW5hbFN0YXRlSWRzLFxuICAgICAgICAgICAgICAgIGluaXRTdGF0ZUlkOiBpbml0U3RhdGVJZCxcbiAgICAgICAgICAgICAgICBsaW5rczogbGlua3MsXG4gICAgICAgICAgICAgICAgbm9kZXM6IG5vZGVzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2NvbXB1dGVCZnNUcmF2ZXJzYWxPZlN0YXRlcyA9IGZ1bmN0aW9uIChpbml0U3RhdGVJZCwgc3RhdGVzLCBzb3VyY2VTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZUdyYXBoID0gX2NvbXB1dGVHcmFwaERhdGEoaW5pdFN0YXRlSWQsIHN0YXRlcyk7XG4gICAgICAgICAgICB2YXIgc3RhdGVOYW1lc0luQmZzT3JkZXIgPSBbXTtcbiAgICAgICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICAgICAgdmFyIHNlZW4gPSB7fTtcbiAgICAgICAgICAgIHNlZW5bc291cmNlU3RhdGVOYW1lXSA9IHRydWU7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKHNvdXJjZVN0YXRlTmFtZSk7XG4gICAgICAgICAgICB3aGlsZSAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyU3RhdGVOYW1lID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICBzdGF0ZU5hbWVzSW5CZnNPcmRlci5wdXNoKGN1cnJTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgc3RhdGVHcmFwaC5saW5rcy5sZW5ndGg7IGUrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZWRnZSA9IHN0YXRlR3JhcGgubGlua3NbZV07XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXN0ID0gZWRnZS50YXJnZXQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlZGdlLnNvdXJjZSA9PT0gY3VyclN0YXRlTmFtZSAmJiAhc2Vlbi5oYXNPd25Qcm9wZXJ0eShkZXN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VlbltkZXN0XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKGRlc3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlTmFtZXNJbkJmc09yZGVyO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29tcHV0ZTogZnVuY3Rpb24gKGluaXRTdGF0ZUlkLCBzdGF0ZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2NvbXB1dGVHcmFwaERhdGEoaW5pdFN0YXRlSWQsIHN0YXRlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcHV0ZUJmc1RyYXZlcnNhbE9mU3RhdGVzOiBmdW5jdGlvbiAoaW5pdFN0YXRlSWQsIHN0YXRlcywgc291cmNlU3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jb21wdXRlQmZzVHJhdmVyc2FsT2ZTdGF0ZXMoaW5pdFN0YXRlSWQsIHN0YXRlcywgc291cmNlU3RhdGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgQ29sbGFwc2libGUgcmljaC10ZXh0IGNvbXBvbmVudC5cbiAqXG4gKiBJTVBPUlRBTlQgTk9URTogVGhlIG5hbWluZyBjb252ZW50aW9uIGZvciBjdXN0b21pemF0aW9uIGFyZ3MgdGhhdCBhcmUgcGFzc2VkXG4gKiBpbnRvIHRoZSBkaXJlY3RpdmUgaXM6IHRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIsIGZvbGxvd2VkIGJ5ICdXaXRoJyxcbiAqIGZvbGxvd2VkIGJ5IHRoZSBuYW1lIG9mIHRoZSBhcmcuXG4gKi9cbnJlcXVpcmUoJ2RpcmVjdGl2ZXMvYW5ndWxhci1odG1sLWJpbmQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFOb25pbnRlcmFjdGl2ZUNvbGxhcHNpYmxlJywgW1xuICAgICdIdG1sRXNjYXBlclNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChIdG1sRXNjYXBlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RXh0ZW5zaW9uUmVzb3VyY2VVcmwoJy9yaWNoX3RleHRfY29tcG9uZW50cy9Db2xsYXBzaWJsZScgK1xuICAgICAgICAgICAgICAgICcvZGlyZWN0aXZlcy9jb2xsYXBzaWJsZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckYXR0cnMnLCBmdW5jdGlvbiAoJGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5oZWFkaW5nID0gSHRtbEVzY2FwZXJTZXJ2aWNlLmVzY2FwZWRKc29uVG9PYmooJGF0dHJzLmhlYWRpbmdXaXRoVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbnRlbnQgPSBIdG1sRXNjYXBlclNlcnZpY2UuZXNjYXBlZEpzb25Ub09iaigkYXR0cnMuY29udGVudFdpdGhWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgSW1hZ2UgcmljaC10ZXh0IGNvbXBvbmVudC5cbiAqXG4gKiBJTVBPUlRBTlQgTk9URTogVGhlIG5hbWluZyBjb252ZW50aW9uIGZvciBjdXN0b21pemF0aW9uIGFyZ3MgdGhhdCBhcmUgcGFzc2VkXG4gKiBpbnRvIHRoZSBkaXJlY3RpdmUgaXM6IHRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIsIGZvbGxvd2VkIGJ5ICdXaXRoJyxcbiAqIGZvbGxvd2VkIGJ5IHRoZSBuYW1lIG9mIHRoZSBhcmcuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlL3NlcnZpY2VzL2ltYWdlLXByZWxvYWRlci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Bc3NldHNCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ29udGV4dFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0h0bWxFc2NhcGVyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdvcHBpYU5vbmludGVyYWN0aXZlSW1hZ2UnLCBbXG4gICAgJ0Fzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlJywgJ0NvbnRleHRTZXJ2aWNlJyxcbiAgICAnSHRtbEVzY2FwZXJTZXJ2aWNlJywgJ0ltYWdlUHJlbG9hZGVyU2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ0xPQURJTkdfSU5ESUNBVE9SX1VSTCcsXG4gICAgZnVuY3Rpb24gKEFzc2V0c0JhY2tlbmRBcGlTZXJ2aWNlLCBDb250ZXh0U2VydmljZSwgSHRtbEVzY2FwZXJTZXJ2aWNlLCBJbWFnZVByZWxvYWRlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBMT0FESU5HX0lORElDQVRPUl9VUkwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRFeHRlbnNpb25SZXNvdXJjZVVybCgnL3JpY2hfdGV4dF9jb21wb25lbnRzL0ltYWdlL2RpcmVjdGl2ZXMvaW1hZ2UuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJGF0dHJzJywgZnVuY3Rpb24gKCRhdHRycykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZmlsZXBhdGggPSBIdG1sRXNjYXBlclNlcnZpY2UuZXNjYXBlZEpzb25Ub09iaigkYXR0cnMuZmlsZXBhdGhXaXRoVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmltYWdlVXJsID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubG9hZGluZ0luZGljYXRvclVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKExPQURJTkdfSU5ESUNBVE9SX1VSTCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNMb2FkaW5nSW5kaWNhdG9yU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1RyeUFnYWluU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEltYWdlUHJlbG9hZGVyU2VydmljZS5pbkV4cGxvcmF0aW9uUGxheWVyKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNMb2FkaW5nSW5kaWNhdG9yU2hvd24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5kaW1lbnNpb25zID0gKEltYWdlUHJlbG9hZGVyU2VydmljZS5nZXREaW1lbnNpb25zT2ZJbWFnZShjdHJsLmZpbGVwYXRoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgYWxpZ25pbmcgdGhlIGdpZiB0byB0aGUgY2VudGVyIG9mIGl0J3MgY29udGFpbmVyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbG9hZGluZ0luZGljYXRvclNpemUgPSAoKGN0cmwuZGltZW5zaW9ucy5oZWlnaHQgPCAxMjQpID8gMjQgOiAxMjApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pbWFnZUNvbnRhaW5lclN0eWxlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogY3RybC5kaW1lbnNpb25zLmhlaWdodCArICdweCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmxvYWRpbmdJbmRpY2F0b3JTdHlsZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGxvYWRpbmdJbmRpY2F0b3JTaXplICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogbG9hZGluZ0luZGljYXRvclNpemUgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5sb2FkSW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc0xvYWRpbmdJbmRpY2F0b3JTaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc1RyeUFnYWluU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbWFnZVByZWxvYWRlclNlcnZpY2UuZ2V0SW1hZ2VVcmwoY3RybC5maWxlcGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKG9iamVjdFVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzVHJ5QWdhaW5TaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzTG9hZGluZ0luZGljYXRvclNob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaW1hZ2VVcmwgPSBvYmplY3RVcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzVHJ5QWdhaW5TaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNMb2FkaW5nSW5kaWNhdG9yU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmxvYWRJbWFnZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY2FzZSB3aGVuIHVzZXIgaXMgaW4gZXhwbG9yYXRpb24gZWRpdG9yIG9yIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwcmV2aWV3IG1vZGUuIFdlIGRvbid0IGhhdmUgbG9hZGluZyBpbmRpY2F0b3Igb3IgdHJ5IGFnYWluIGZvclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2hvd2luZyBpbWFnZXMgaW4gdGhlIGV4cGxvcmF0aW9uIGVkaXRvciBvciBpbiBwcmV2aWV3IG1vZGUuIFNvXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBkaXJlY3RseSBhc3NpZ24gdGhlIHVybCB0byB0aGUgaW1hZ2VVcmwuXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmltYWdlVXJsID0gQXNzZXRzQmFja2VuZEFwaVNlcnZpY2UuZ2V0SW1hZ2VVcmxGb3JQcmV2aWV3KENvbnRleHRTZXJ2aWNlLmdldEVudGl0eVR5cGUoKSwgQ29udGV4dFNlcnZpY2UuZ2V0RW50aXR5SWQoKSwgY3RybC5maWxlcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY3RybC5pbWFnZUNhcHRpb24gPSAnJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRhdHRycy5jYXB0aW9uV2l0aFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmltYWdlQ2FwdGlvbiA9IEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy5jYXB0aW9uV2l0aFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdHJsLmltYWdlQWx0VGV4dCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJGF0dHJzLmFsdFdpdGhWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pbWFnZUFsdFRleHQgPSBIdG1sRXNjYXBlclNlcnZpY2UuZXNjYXBlZEpzb25Ub09iaigkYXR0cnMuYWx0V2l0aFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIExpbmsgcmljaC10ZXh0IGNvbXBvbmVudC5cbiAqXG4gKiBJTVBPUlRBTlQgTk9URTogVGhlIG5hbWluZyBjb252ZW50aW9uIGZvciBjdXN0b21pemF0aW9uIGFyZ3MgdGhhdCBhcmUgcGFzc2VkXG4gKiBpbnRvIHRoZSBkaXJlY3RpdmUgaXM6IHRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIsIGZvbGxvd2VkIGJ5ICdXaXRoJyxcbiAqIGZvbGxvd2VkIGJ5IHRoZSBuYW1lIG9mIHRoZSBhcmcuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0NvbnRleHRTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFOb25pbnRlcmFjdGl2ZUxpbmsnLCBbXG4gICAgJ0h0bWxFc2NhcGVyU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKEh0bWxFc2NhcGVyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRFeHRlbnNpb25SZXNvdXJjZVVybCgnL3JpY2hfdGV4dF9jb21wb25lbnRzL0xpbmsvZGlyZWN0aXZlcy9saW5rLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRhdHRycycsICdDb250ZXh0U2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRhdHRycywgQ29udGV4dFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdW50cnVzdGVkVXJsID0gZW5jb2RlVVJJKEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy51cmxXaXRoVmFsdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVudHJ1c3RlZFVybC5pbmRleE9mKCdodHRwOi8vJykgIT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHVudHJ1c3RlZFVybC5pbmRleE9mKCdodHRwczovLycpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bnRydXN0ZWRVcmwgPSAnaHR0cHM6Ly8nICsgdW50cnVzdGVkVXJsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXJsID0gdW50cnVzdGVkVXJsO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dVcmxJblRvb2x0aXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC50ZXh0ID0gY3RybC51cmw7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkYXR0cnMudGV4dFdpdGhWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBkb25lIGZvciBiYWNrd2FyZC1jb21wYXRpYmlsaXR5OyBzb21lIG9sZCBleHBsb3JhdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhdmUgY29udGVudCBwYXJ0cyB0aGF0IGRvbid0IGluY2x1ZGUgYSAndGV4dCcgYXR0cmlidXRlIG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGVpciBsaW5rcy5cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGV4dCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSHRtbEVzY2FwZXJTZXJ2aWNlLmVzY2FwZWRKc29uVG9PYmooJGF0dHJzLnRleHRXaXRoVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgc2Vjb25kICdpZicgY29uZGl0aW9uIGlzIG5lZWRlZCBiZWNhdXNlIGEgbGluayBtYXlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhdmUgYW4gZW1wdHkgJ3RleHQnIHZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwudGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd1VybEluVG9vbHRpcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnRleHQgPSBjdHJsLnVybDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGZvbGxvd2luZyBjaGVjayBkaXNiYWxlcyB0aGUgbGluayBpbiBFZGl0b3IgYmVpbmcgY2F1Z2h0XG4gICAgICAgICAgICAgICAgICAgIC8vIGJ5IHRhYmJpbmcgd2hpbGUgaW4gRXhwbG9yYXRpb24gRWRpdG9yIG1vZGUuXG4gICAgICAgICAgICAgICAgICAgIGlmIChDb250ZXh0U2VydmljZS5pc0luRXhwbG9yYXRpb25FZGl0b3JNb2RlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGFiSW5kZXhWYWwgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgTWF0aCByaWNoLXRleHQgY29tcG9uZW50LlxuICpcbiAqIElNUE9SVEFOVCBOT1RFOiBUaGUgbmFtaW5nIGNvbnZlbnRpb24gZm9yIGN1c3RvbWl6YXRpb24gYXJncyB0aGF0IGFyZSBwYXNzZWRcbiAqIGludG8gdGhlIGRpcmVjdGl2ZSBpczogdGhlIG5hbWUgb2YgdGhlIHBhcmFtZXRlciwgZm9sbG93ZWQgYnkgJ1dpdGgnLFxuICogZm9sbG93ZWQgYnkgdGhlIG5hbWUgb2YgdGhlIGFyZy5cbiAqL1xucmVxdWlyZSgnZGlyZWN0aXZlcy9tYXRoamF4LWJpbmQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFOb25pbnRlcmFjdGl2ZU1hdGgnLCBbXG4gICAgJ0h0bWxFc2NhcGVyU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKEh0bWxFc2NhcGVyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRFeHRlbnNpb25SZXNvdXJjZVVybCgnL3JpY2hfdGV4dF9jb21wb25lbnRzL01hdGgvZGlyZWN0aXZlcy9tYXRoLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRhdHRycycsIGZ1bmN0aW9uICgkYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnJhd0xhdGV4ID0gSHRtbEVzY2FwZXJTZXJ2aWNlLmVzY2FwZWRKc29uVG9PYmooJGF0dHJzLnJhd0xhdGV4V2l0aFZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBUYWJzIHJpY2gtdGV4dCBjb21wb25lbnQuXG4gKlxuICogSU1QT1JUQU5UIE5PVEU6IFRoZSBuYW1pbmcgY29udmVudGlvbiBmb3IgY3VzdG9taXphdGlvbiBhcmdzIHRoYXQgYXJlIHBhc3NlZFxuICogaW50byB0aGUgZGlyZWN0aXZlIGlzOiB0aGUgbmFtZSBvZiB0aGUgcGFyYW1ldGVyLCBmb2xsb3dlZCBieSAnV2l0aCcsXG4gKiBmb2xsb3dlZCBieSB0aGUgbmFtZSBvZiB0aGUgYXJnLlxuICovXG5yZXF1aXJlKCdkaXJlY3RpdmVzL2FuZ3VsYXItaHRtbC1iaW5kLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ29wcGlhTm9uaW50ZXJhY3RpdmVUYWJzJywgW1xuICAgICdIdG1sRXNjYXBlclNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChIdG1sRXNjYXBlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RXh0ZW5zaW9uUmVzb3VyY2VVcmwoJy9yaWNoX3RleHRfY29tcG9uZW50cy9UYWJzL2RpcmVjdGl2ZXMvdGFicy5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckYXR0cnMnLCBmdW5jdGlvbiAoJGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC50YWJDb250ZW50cyA9IEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy50YWJDb250ZW50c1dpdGhWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgVmlkZW8gcmljaC10ZXh0IGNvbXBvbmVudC5cbiAqXG4gKiBJTVBPUlRBTlQgTk9URTogVGhlIG5hbWluZyBjb252ZW50aW9uIGZvciBjdXN0b21pemF0aW9uIGFyZ3MgdGhhdCBhcmUgcGFzc2VkXG4gKiBpbnRvIHRoZSBkaXJlY3RpdmUgaXM6IHRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIsIGZvbGxvd2VkIGJ5ICdXaXRoJyxcbiAqIGZvbGxvd2VkIGJ5IHRoZSBuYW1lIG9mIHRoZSBhcmcuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0F1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Db250ZXh0U2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ29wcGlhTm9uaW50ZXJhY3RpdmVWaWRlbycsIFtcbiAgICAnJHNjZScsICdIdG1sRXNjYXBlclNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkc2NlLCBIdG1sRXNjYXBlclNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RXh0ZW5zaW9uUmVzb3VyY2VVcmwoJy9yaWNoX3RleHRfY29tcG9uZW50cy9WaWRlby9kaXJlY3RpdmVzL3ZpZGVvLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRhdHRycycsICdDb250ZXh0U2VydmljZScsICckZWxlbWVudCcsXG4gICAgICAgICAgICAgICAgJ0F1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlJywgJ1BBR0VfQ09OVEVYVCcsICckdGltZW91dCcsICckd2luZG93JyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJGF0dHJzLCBDb250ZXh0U2VydmljZSwgJGVsZW1lbnQsIEF1dG9wbGF5ZWRWaWRlb3NTZXJ2aWNlLCBQQUdFX0NPTlRFWFQsICR0aW1lb3V0LCAkd2luZG93KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gKEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy5zdGFydFdpdGhWYWx1ZSkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZW5kID0gSHRtbEVzY2FwZXJTZXJ2aWNlLmVzY2FwZWRKc29uVG9PYmooJGF0dHJzLmVuZFdpdGhWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudmlkZW9JZCA9IEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy52aWRlb0lkV2l0aFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC50aW1pbmdQYXJhbXMgPSAnJnN0YXJ0PScgKyBzdGFydCArICcmZW5kPScgKyBlbmQ7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYXV0b3BsYXlTdWZmaXggPSAnJmF1dG9wbGF5PTAnO1xuICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIGNyZWF0b3Igd2FudHMgdG8gYXV0b3BsYXkgdGhpcyB2aWRlbyBvciBub3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdXRvcGxheVZhbCA9IEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKCRhdHRycy5hdXRvcGxheVdpdGhWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGNvZGUgaGVscHMgaW4gdmlzaWJpbGl0eSBvZiB2aWRlby4gSXQgY2hlY2tzIHdoZXRoZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1pZCBwb2ludCBvZiB2aWRlbyBmcmFtZSBpcyBpbiB0aGUgdmlldyBvciBub3QuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVjdCA9IGFuZ3VsYXIuZWxlbWVudCgkZWxlbWVudClbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2xpZW50SGVpZ2h0ID0gJHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjbGllbnRXaWR0aCA9ICR3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1Zpc2libGUgPSAoKHJlY3QubGVmdCArIHJlY3QucmlnaHQpIC8gMiA8IGNsaWVudFdpZHRoICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHJlY3QudG9wICsgcmVjdC5ib3R0b20pIC8gMiA8IGNsaWVudEhlaWdodCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocmVjdC5sZWZ0ID4gMCAmJiByZWN0LnJpZ2h0ID4gMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBdXRvcGxheSBpZiB1c2VyIGlzIGluIGxlYXJuZXIgdmlldyBhbmQgY3JlYXRvciBoYXMgc3BlY2lmaWVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byBhdXRvcGxheSBnaXZlbiB2aWRlby5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDb250ZXh0U2VydmljZS5nZXRQYWdlQ29udGV4dCgpID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBBR0VfQ09OVEVYVC5FWFBMT1JBVElPTl9QTEFZRVIgJiYgYXV0b3BsYXlWYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBpdCBoYXMgYmVlbiBhdXRvcGxheWVkIHRoZW4gZG8gbm90IGF1dG9wbGF5IGFnYWluLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghQXV0b3BsYXllZFZpZGVvc1NlcnZpY2UuaGFzVmlkZW9CZWVuQXV0b3BsYXllZChjdHJsLnZpZGVvSWQpICYmIGlzVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmF1dG9wbGF5U3VmZml4ID0gJyZhdXRvcGxheT0xJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXV0b3BsYXllZFZpZGVvc1NlcnZpY2UuYWRkQXV0b3BsYXllZFZpZGVvKGN0cmwudmlkZW9JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC52aWRlb1VybCA9ICRzY2UudHJ1c3RBc1Jlc291cmNlVXJsKCdodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nICsgY3RybC52aWRlb0lkICsgJz9yZWw9MCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGltaW5nUGFyYW1zICsgY3RybC5hdXRvcGxheVN1ZmZpeCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDkwMCk7XG4gICAgICAgICAgICAgICAgICAgIC8vICheKUhlcmUgdGltZW91dCBpcyBzZXQgdG8gOTAwbXMuIFRoaXMgaXMgdGltZSBpdCB0YWtlcyB0byBicmluZyB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gZnJhbWUgdG8gY29ycmVjdCBwb2ludCBpbiBicm93c2VyIGFuZCBicmluZyB1c2VyIHRvIHRoZSBtYWluXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnRlbnQuIFNtYWxsZXIgZGVsYXkgY2F1c2VzIGNoZWNrcyB0byBiZSBwZXJmb3JtZWQgZXZlbiBiZWZvcmVcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHBsYXllciBkaXNwbGF5cyB0aGUgY29udGVudCBvZiB0aGUgbmV3IGNhcmQuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgZm9sbG93aW5nIGNoZWNrIGRpc2FibGVzIHRoZSB2aWRlbyBpbiBFZGl0b3IgYmVpbmcgY2F1Z2h0XG4gICAgICAgICAgICAgICAgICAgIC8vIGJ5IHRhYmJpbmcgd2hpbGUgaW4gRXhwbG9yYXRpb24gRWRpdG9yIG1vZGUuXG4gICAgICAgICAgICAgICAgICAgIGlmIChDb250ZXh0U2VydmljZS5pc0luRXhwbG9yYXRpb25FZGl0b3JNb2RlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudGFiSW5kZXhWYWwgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgUmVxdWlyZXMgZm9yIGFsbCB0aGUgUlRDIGRpcmVjdGl2ZXMuXG4gKi9cbnJlcXVpcmUoJ3JpY2hfdGV4dF9jb21wb25lbnRzL0NvbGxhcHNpYmxlL2RpcmVjdGl2ZXMvJyArXG4gICAgJ29wcGlhLW5vbmludGVyYWN0aXZlLWNvbGxhcHNpYmxlLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncmljaF90ZXh0X2NvbXBvbmVudHMvSW1hZ2UvZGlyZWN0aXZlcy8nICtcbiAgICAnb3BwaWEtbm9uaW50ZXJhY3RpdmUtaW1hZ2UuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdyaWNoX3RleHRfY29tcG9uZW50cy9MaW5rL2RpcmVjdGl2ZXMvJyArXG4gICAgJ29wcGlhLW5vbmludGVyYWN0aXZlLWxpbmsuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdyaWNoX3RleHRfY29tcG9uZW50cy9NYXRoL2RpcmVjdGl2ZXMvJyArXG4gICAgJ29wcGlhLW5vbmludGVyYWN0aXZlLW1hdGguZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdyaWNoX3RleHRfY29tcG9uZW50cy9UYWJzL2RpcmVjdGl2ZXMvJyArXG4gICAgJ29wcGlhLW5vbmludGVyYWN0aXZlLXRhYnMuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdyaWNoX3RleHRfY29tcG9uZW50cy9WaWRlby9kaXJlY3RpdmVzLycgK1xuICAgICdvcHBpYS1ub25pbnRlcmFjdGl2ZS12aWRlby5kaXJlY3RpdmUudHMnKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=