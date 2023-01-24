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

import { Injectable } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { Exploration } from 'domain/exploration/ExplorationObjectFactory';
import { ExtractImageFilenamesFromModelService } from 'pages/exploration-player-page/services/extract-image-filenames-from-model.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ComputeGraphService } from 'services/compute-graph.service';
import { ContextService } from 'services/context.service';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';

interface ImageCallback {
  // This property will be null when the SVG uploaded is not valid or when
  // the image is not yet uploaded.
  resolveMethod: (src: string | SafeResourceUrl | null) => void;
  rejectMethod: () => void;
}

export interface ImageDimensions {
  width: number;
  height: number;
  verticalPadding?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImagePreloaderService {
  constructor(
      private assetsBackendApiService: AssetsBackendApiService,
      private computeGraphService: ComputeGraphService,
      private contextService: ContextService,
      private ExtractImageFilenamesFromModelService:
        ExtractImageFilenamesFromModelService,
      private svgSanitizerService: SvgSanitizerService) {}

  // This property is initialized using int method and we need to do
  // non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private exploration!: Exploration;
  private filenamesOfImageCurrentlyDownloading: string[] = [];
  private filenamesOfImageToBeDownloaded: string[] = [];
  private filenamesOfImageFailedToDownload: string[] = [];
  private imagePreloaderServiceHasStarted: boolean = false;
  // Variable imageLoadedCallback is an object of objects (identified by the
  // filenames which are being downloaded at the time they are required by the
  // directive).The object contains the resolve method of the promise
  // attached with getInImageUrl method.
  private imageLoadedCallback: {[filename: string]: ImageCallback} = {};

  init(exploration: Exploration): void {
    this.exploration = exploration;
    this.imagePreloaderServiceHasStarted = true;
  }

  /**
   * Checks if the given filename is in this.filenamesOfImageFailedToDownload or
   * not.
   * @param {string} filename - The filename of the image which is to be
   *                            removed from the
   *                            this.filenamesOfImageFailedToDownload array.
   */
  isInFailedDownload(filename: string): boolean {
    return this.filenamesOfImageFailedToDownload.includes(filename);
  }

  /**
   * Initiates the image preloader beginning from the sourceStateName.
   * @param {string} sourceStateName - The name of the state from which
   *                                   preloader should start.
   */
  kickOffImagePreloader(sourceStateName: string): void {
    this.filenamesOfImageToBeDownloaded = (
      this.getImageFilenamesInBfsOrder(sourceStateName));
    const imageFilesInGivenState = (
      this.ExtractImageFilenamesFromModelService.getImageFilenamesInState(
        this.exploration.states.getState(sourceStateName)));
    this.filenamesOfImageFailedToDownload = (
      this.filenamesOfImageFailedToDownload.filter(
        filename => !imageFilesInGivenState.includes(filename)));
    while (
      this.filenamesOfImageCurrentlyDownloading.length <
      AppConstants.MAX_NUM_IMAGE_FILES_TO_DOWNLOAD_SIMULTANEOUSLY &&
      this.filenamesOfImageToBeDownloaded.length > 0
    ) {
      const imageFilename = this.filenamesOfImageToBeDownloaded.shift();
      if (imageFilename) {
        this.filenamesOfImageCurrentlyDownloading.push(imageFilename);
        this.loadImage(imageFilename);
      }
    }
  }

  /**
   * Cancels the preloading of the images that are being downloaded.
   */
  cancelPreloading(): void {
    this.assetsBackendApiService.abortAllCurrentImageDownloads();
    this.filenamesOfImageCurrentlyDownloading.length = 0;
  }

  /**
   * When the state changes, it decides whether to restart the preloader
   * starting from the 'stateName' state or not.
   * @param {string} stateName - The name of the state the user shifts to.
   */
  onStateChange(stateName: string): void {
    if (stateName !== this.exploration.getInitialState().name) {
      this.imageLoadedCallback = {};

      const state = this.exploration.states.getState(stateName);

      let numImageFilesCurrentlyDownloading = 0;
      let numImagesNeitherInCacheNorDownloading = 0;

      this.ExtractImageFilenamesFromModelService.getImageFilenamesInState(
        state
      ).forEach(filename => {
        var isFileCurrentlyDownloading = (
          this.filenamesOfImageCurrentlyDownloading.includes(filename));
        if (!this.assetsBackendApiService.isCached(filename) &&
            !isFileCurrentlyDownloading) {
          numImagesNeitherInCacheNorDownloading += 1;
        }
        if (isFileCurrentlyDownloading) {
          numImageFilesCurrentlyDownloading += 1;
        }
      });

      if (numImagesNeitherInCacheNorDownloading > 0 &&
          numImageFilesCurrentlyDownloading <= 1) {
        this.cancelPreloading();
        this.kickOffImagePreloader(stateName);
      }
    }
  }

  /**
  * Gets the dimensions of the images from the filename provided.
  * @param {string} filename - The string from which the dimensions of the
  *                           images should be extracted.
  */
  getDimensionsOfImage(filename: string): ImageDimensions {
    const dimensionsRegex = RegExp(
      '[^/]+_height_([0-9]+)_width_([0-9]+)\\.(png|jpeg|jpg|gif|svg)$', 'g');
    var imageDimensions = dimensionsRegex.exec(filename);
    if (imageDimensions) {
      var dimensions = {
        height: Number(imageDimensions[1]),
        width: Number(imageDimensions[2])
      };
      return dimensions;
    } else {
      throw new Error(
        `Input path ${filename} is invalid, it does not contain dimensions.`);
    }
  }

  /**
  * Gets the dimensions of the math SVGs from the SVG filename provided.
  * @param {string} filename - The string from which the dimensions of the
  *                           math SVGs should be extracted.
  */
  getDimensionsOfMathSvg(filename: string): ImageDimensions {
    var dimensionsRegex = RegExp(
      '[^/]+_height_([0-9d]+)_width_([0-9d]+)_vertical_([0-9d]+)\\.svg', 'g');
    var imageDimensions = dimensionsRegex.exec(filename);
    if (imageDimensions) {
      var dimensions = {
        height: Number(imageDimensions[1].replace('d', '.')),
        width: Number(imageDimensions[2].replace('d', '.')),
        verticalPadding: Number(imageDimensions[3].replace('d', '.'))
      };
      return dimensions;
    } else {
      throw new Error(
        `Input path ${filename} is invalid, it does not contain dimensions.`);
    }
  }

  isLoadingImageFile(filename: string): boolean {
    return this.filenamesOfImageCurrentlyDownloading.includes(filename);
  }

  restartImagePreloader(sourceStateName: string): void {
    this.cancelPreloading();
    this.kickOffImagePreloader(sourceStateName);
  }

  getFilenamesOfImageCurrentlyDownloading(): string[] {
    return this.filenamesOfImageCurrentlyDownloading;
  }

  private convertImageFileToSafeBase64Url(
      imageFile: Blob,
      callback: (
        // This property will be null when the SVG uploaded is not valid or when
        // the image is not yet uploaded. Also FileReader.result dependency is
        // of type null.
        src: string | SafeResourceUrl | null
      ) => void): void {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (imageFile.type === 'image/svg+xml') {
        callback(
          this.svgSanitizerService.getTrustedSvgResourceUrl(
            // Typecasting is needed because FileReader.result dependency is of
            // type ArrayBuffer | string | null.
            reader.result as string));
      } else {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(imageFile);
  }

  /**
   * Gets the Url for the image file.
   * @param {string} filename - Filename of the image whose Url is to be
   *                            created.
   * @param {function} onLoadCallback - Function that is called when the
   *                                    Url of the loaded image is obtained.
   */
  async getImageUrlAsync(
      filename: string
  ): Promise<string | SafeResourceUrl | null> {
    return new Promise((resolve, reject) => {
      let entityType = this.contextService.getEntityType();
      if (entityType && (this.assetsBackendApiService.isCached(filename) ||
          this.isInFailedDownload(filename))) {
        this.assetsBackendApiService.loadImage(
          entityType, this.contextService.getEntityId(), filename
        ).then(
          loadedImageFile => {
            if (this.isInFailedDownload(loadedImageFile.filename)) {
              this.removeFromFailedDownload(loadedImageFile.filename);
            }
            this.convertImageFileToSafeBase64Url(loadedImageFile.data, resolve);
          },
          reject);
      } else {
        this.imageLoadedCallback[filename] = {
          resolveMethod: resolve,
          rejectMethod: reject
        };
      }
    });
  }

  inExplorationPlayer(): boolean {
    return this.imagePreloaderServiceHasStarted;
  }

  /**
   * Removes the given filename from the this.filenamesOfImageFailedToDownload.
   * @param {string} filename - The filename of the file which is to be
   *                            removed from the
   *                            this.filenamesOfImageFailedToDownload array.
   */
  private removeFromFailedDownload(filename: string): void {
    var index = this.filenamesOfImageFailedToDownload.indexOf(filename);
    this.filenamesOfImageFailedToDownload.splice(index, 1);
  }

  /**
   * Gets image files names in Bfs order from the state.
   * @param {string} sourceStateName - The name of the starting state
   *                                   from which the filenames should
   *                                   be obtained.
   */
  private getImageFilenamesInBfsOrder(sourceStateName: string): string[] {
    const explorationInitStateName = this.exploration.getInitialState().name;
    var imageFilenames: string[] = [];
    if (explorationInitStateName) {
      var stateNamesInBfsOrder = (
        this.computeGraphService.computeBfsTraversalOfStates(
          explorationInitStateName, this.exploration.getStates(),
          sourceStateName));

      stateNamesInBfsOrder.forEach(stateName => {
        var state = this.exploration.states.getState(stateName);
        this.ExtractImageFilenamesFromModelService.getImageFilenamesInState(
          state).forEach(filename => imageFilenames.push(filename));
      });
    }
    return imageFilenames;
  }

  /**
   * Removes the filename from the filenamesOfImageCurrentlyDownloading and
   * initiates the loading of the next image file.
   * @param {string} filename - The filename which is to be removed from the
   *                            filenamesOfImageCurrentlyDownloading array.
   */
  private removeCurrentAndLoadNextImage(filename: string): void {
    this.filenamesOfImageCurrentlyDownloading.splice(
      this.filenamesOfImageCurrentlyDownloading.findIndex(
        imageFilename => filename === imageFilename),
      1);
    if (this.filenamesOfImageToBeDownloaded.length > 0) {
      var nextImageFilename = this.filenamesOfImageToBeDownloaded.shift();
      if (nextImageFilename) {
        this.filenamesOfImageCurrentlyDownloading.push(nextImageFilename);
        this.loadImage(nextImageFilename);
      }
    }
  }

  /**
   * Handles the loading of the image file.
   * @param {string} imageFilename - The filename of the image to be loaded.
   */
  private loadImage(imageFilename: string): void {
    this.assetsBackendApiService.loadImage(
      AppConstants.ENTITY_TYPE.EXPLORATION,
      this.contextService.getExplorationId(), imageFilename
    ).then(
      loadedImage => {
        this.removeCurrentAndLoadNextImage(loadedImage.filename);
        if (this.imageLoadedCallback[loadedImage.filename]) {
          var onLoadImageResolve = (
            this.imageLoadedCallback[loadedImage.filename].resolveMethod);
          this.convertImageFileToSafeBase64Url(
            loadedImage.data, onLoadImageResolve);
          delete this.imageLoadedCallback[loadedImage.filename];
        }
      },
      filename => {
        if (this.imageLoadedCallback[filename]) {
          this.imageLoadedCallback[filename].rejectMethod();
          delete this.imageLoadedCallback[filename];
        }
        this.filenamesOfImageFailedToDownload.push(filename);
        this.removeCurrentAndLoadNextImage(filename);
      });
  }
}

angular.module('oppia').factory(
  'ImagePreloaderService', downgradeInjectable(ImagePreloaderService));
