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
 *
 * All of the RTE components follow this pattern of updateView and ngOnChanges.
 * This is because these are also web-components (So basically, we can create
 * this component using document.createElement). CKEditor creates instances of
 * these on the fly and runs ngOnInit before we can set the @Input properties.
 * When the input properties are not set, we get errors in the console.
 * The `if` condition in update view prevents that from happening.
 * The `if` condition in the updateView and ngOnChanges might look like the
 * literal opposite but that's not the case. We know from the previous
 * statements above that the if condition in the updateView is for preventing
 * the code to run until all the values needed for successful execution are
 * present. The if condition in ngOnChanges is to optimize the re-runs of
 * updateView and only re-run when a property we care about has changed in
 * value.
 */

import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  ImageDimensions,
  ImagePreloaderService,
} from 'pages/exploration-player-page/services/image-preloader.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ContextService} from 'services/context.service';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {AppConstants} from 'app.constants';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';
import {SafeResourceUrl} from '@angular/platform-browser';

interface Dimension {
  height: string;
  width: string;
}
@Component({
  selector: 'oppia-noninteractive-image',
  templateUrl: './image.component.html',
  styleUrls: [],
})
export class NoninteractiveImage implements OnInit, OnChanges {
  @Input() altTextIsDisplayed: boolean = false;
  @Input() altWithValue: string = '';
  @Input() captionWithValue: string = '';
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() filepathWithValue!: string;
  filepath!: string;
  dimensions!: ImageDimensions;
  miniatureImageContainerStyle!: Dimension;
  imageContainerStyle!: Dimension;
  loadingIndicatorStyle!: Dimension;
  imageUrl: SafeResourceUrl | string = '';
  imageAltText: string = '';
  imageCaption: string = '';
  loadingIndicatorUrl: string = '';
  isLoadingIndicatorShown: boolean = false;
  isTryAgainShown: boolean = false;
  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private htmlEscaperService: HtmlEscaperService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imagePreloaderService: ImagePreloaderService,
    private urlInterpolationService: UrlInterpolationService,
    private svgSanitizerService: SvgSanitizerService
  ) {}

  private _updateViewOnNewImage(): void {
    if (
      !this.filepathWithValue ||
      !this.altWithValue ||
      !this.captionWithValue
    ) {
      return;
    }
    this.filepath = this.htmlEscaperService.escapedJsonToObj(
      this.filepathWithValue
    ) as string;
    if (!this.filepath) {
      return;
    }
    this.loadingIndicatorUrl = this.urlInterpolationService.getStaticImageUrl(
      AppConstants.LOADING_INDICATOR_URL
    );
    this.dimensions = this.imagePreloaderService.getDimensionsOfImage(
      this.filepath
    );
    this.imageContainerStyle = {
      height: this.dimensions.height + 'px',
      width: this.dimensions.width + 'px',
    };
    this.miniatureImageContainerStyle = {
      height: '50px',
      width: '50px',
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
        width: loadingIndicatorSize + 'px',
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
            AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE &&
          this.imageLocalStorageService.isInStorage(this.filepath)
        ) {
          const base64Url = this.imageLocalStorageService.getRawImageData(
            this.filepath
          );
          if (base64Url) {
            const mimeType = base64Url.split(';')[0];
            if (mimeType === AppConstants.SVG_MIME_TYPE) {
              const svgResourceUrl =
                this.svgSanitizerService.getTrustedSvgResourceUrl(base64Url);
              if (svgResourceUrl) {
                this.imageUrl = svgResourceUrl;
              }
            } else {
              this.imageUrl = base64Url;
            }
          }
        } else {
          const entityType = this.contextService.getEntityType();
          if (entityType) {
            this.imageUrl = this.assetsBackendApiService.getImageUrlForPreview(
              entityType,
              this.contextService.getEntityId(),
              this.filepath
            );
          }
        }
        // Unknown type is used because we don't know which type of error is
        // thrown.
      } catch (e: unknown) {
        const entityType = this.contextService.getEntityType();
        if (entityType) {
          const additionalInfo =
            '\nEntity type: ' +
            entityType +
            '\nEntity ID: ' +
            this.contextService.getEntityId() +
            '\nFilepath: ' +
            this.filepath;
          if (e instanceof Error) {
            e.message += additionalInfo;
          }
        }
        throw e;
      }
    }
    // We set the alt text and caption for the image, regardless of when
    // user is in the exploration player or not in the exploration player.
    this.imageAltText = '';
    if (this.altWithValue) {
      this.imageAltText = this.htmlEscaperService.escapedJsonToObj(
        this.altWithValue
      ) as string;
    }
    this.imageCaption = '';
    if (this.captionWithValue) {
      this.imageCaption = this.htmlEscaperService.escapedJsonToObj(
        this.captionWithValue
      ) as string;
    }
  }

  ngOnInit(): void {
    this._updateViewOnNewImage();
  }

  loadImage(): void {
    this.isLoadingIndicatorShown = true;
    this.isTryAgainShown = false;
    this.imagePreloaderService.getImageUrlAsync(this.filepath).then(
      objectUrl => {
        this.isTryAgainShown = false;
        this.isLoadingIndicatorShown = false;
        if (objectUrl === null) {
          throw new Error('Object url is null');
        }
        this.imageUrl = objectUrl;
      },
      () => {
        this.isTryAgainShown = true;
        this.isLoadingIndicatorShown = false;
      }
    );
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
