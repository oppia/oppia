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

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ImageDimensions, ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { AppConstants } from 'app.constants';
import { downgradeComponent } from '@angular/upgrade/static';

interface Dimension {
  height: string;
  width: string;
}
@Component({
  selector: 'oppia-noninteractive-image',
  templateUrl: './image.component.html',
  styleUrls: []
})
export class NoninteractiveImage implements OnInit, OnChanges {
  @Input() filepathWithValue: string;
  @Input() altWithValue: string = '';
  @Input() captionWithValue: string = '';
  filepath: string;
  imageUrl: string = '';
  imageAltText: string = '';
  imageCaption: string = '';
  loadingIndicatorUrl;
  isLoadingIndicatorShown: boolean = false;
  isTryAgainShown: boolean = false;
  dimensions: ImageDimensions;
  imageContainerStyle: Dimension;
  loadingIndicatorStyle: Dimension;
  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private htmlEscaperService: HtmlEscaperService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imagePreloaderService: ImagePreloaderService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _updateViewOnNewImage(): void {
    if (
      !this.filepathWithValue || !this.altWithValue || !this.captionWithValue
    ) {
      return;
    }
    this.filepath = this.htmlEscaperService.escapedJsonToObj(
      this.filepathWithValue) as string;
    if (!this.filepath) {
      return;
    }
    this.loadingIndicatorUrl = this.urlInterpolationService.getStaticImageUrl(
      AppConstants.LOADING_INDICATOR_URL);
    this.dimensions = this.imagePreloaderService.getDimensionsOfImage(
      this.filepath);
    this.imageContainerStyle = {
      height: this.dimensions.height + 'px',
      width: this.dimensions.width + 'px'
    };
    // If viewing a concept card in the exploration player, don't use the
    // preloader service. Since, in that service, the image file names are
    // extracted from the state contents to be preloaded, but when
    // viewing a concept, the names are not available until the link is
    // clicked, at which point an API call is done to get the skill
    // details. So, the image file name will not be available to the
    // preloader service beforehand.
    if (
      this.imagePreloaderService.inExplorationPlayer() &&
      this.contextService.getEntityType() !== AppConstants.ENTITY_TYPE.SKILL
    ) {
      const loadingIndicatorSize = this.dimensions.height < 124 ? 24 : 120;
      this.loadingIndicatorStyle = {
        height: loadingIndicatorSize + 'px',
        width: loadingIndicatorSize + 'px'
      };

      this.loadImage();
    } else {
      // This is the case when user is not in the exploration player. We
      // don't have loading indicator or try again for showing images in
      // this case. So we directly assign the url to the imageUrl.
      try {
        // For IMAGE_SAVE_DESTINATION_LOCAL_STORAGE mode we first try to
        // fetch images through the storage and if it doesn't exist we try
        // fetching it through server.
        // This is required for the translation suggestion as there can be
        // target entity's images in the translatable content which needs
        // to be fetched from the server.
        if (
          this.contextService.getImageSaveDestination() ===
                AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE && (
            this.imageLocalStorageService.isInStorage(this.filepath))) {
          this.imageUrl = this.imageLocalStorageService.getObjectUrlForImage(
            this.filepath);
        } else {
          this.imageUrl = this.assetsBackendApiService.getImageUrlForPreview(
            this.contextService.getEntityType(),
            this.contextService.getEntityId(),
            this.filepath);
        }
      } catch (e) {
        const additionalInfo = (
          '\nEntity type: ' + this.contextService.getEntityType() +
          '\nEntity ID: ' + this.contextService.getEntityId() +
          '\nFilepath: ' + this.filepath);
        e.message += additionalInfo;
        throw e;
      }

      this.imageCaption = '';
      if (this.captionWithValue) {
        this.imageCaption = this.htmlEscaperService.escapedJsonToObj(
          this.captionWithValue) as string;
      }
      this.imageAltText = '';
      if (this.altWithValue) {
        this.imageAltText = this.htmlEscaperService.escapedJsonToObj(
          this.altWithValue) as string;
      }
    }
  }

  ngOnInit(): void {
    this._updateViewOnNewImage();
  }

  loadImage(): void {
    this.isLoadingIndicatorShown = true;
    this.isTryAgainShown = false;
    this.imagePreloaderService.getImageUrlAsync(
      this.filepath).then(objectUrl => {
      this.isTryAgainShown = false;
      this.isLoadingIndicatorShown = false;
      this.imageUrl = objectUrl;
    }, () => {
      this.isTryAgainShown = true;
      this.isLoadingIndicatorShown = false;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.filepathWithValue ||
      changes.altWithValue ||
      changes.captionWithValue
    ) {
      this._updateViewOnNewImage();
    }
  }
}

angular.module('oppia').directive('oppiaNoninteractiveImage',
  downgradeComponent({
    component: NoninteractiveImage
  }) as angular.IDirectiveFactory);
