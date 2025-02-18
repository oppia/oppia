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
import {SafeResourceUrl} from '@angular/platform-browser';
import {AppConstants} from 'app.constants';
import {ImagePreloaderService} from 'pages/exploration-player-page/services/image-preloader.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ContextService} from 'services/context.service';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';

export interface MathExpression {
  raw_latex: string;
  svg_filename: string;
}

interface ImageContainerStyle {
  height: string;
  width: string;
  'vertical-align': string;
}
@Component({
  selector: 'oppia-noninteractive-math',
  templateUrl: './math.component.html',
  styleUrls: [],
})
export class NoninteractiveMath implements OnInit, OnChanges {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() mathContentWithValue!: string | Object;
  imageContainerStyle!: ImageContainerStyle;
  // Null ff the SVG is not valid or not trusted.
  imageUrl!: string | ArrayBuffer | SafeResourceUrl | null;

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private htmlEscaperService: HtmlEscaperService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imagePreloaderService: ImagePreloaderService,
    private svgSanitizerService: SvgSanitizerService
  ) {}

  private _updateImage() {
    if (!this.mathContentWithValue) {
      return;
    }
    const mathExpressionContent = this.htmlEscaperService.escapedJsonToObj(
      this.mathContentWithValue as string
    ) as MathExpression;
    if (typeof mathExpressionContent === 'string') {
      return;
    }
    if (mathExpressionContent.hasOwnProperty('raw_latex')) {
      const svgFilename = mathExpressionContent.svg_filename;
      const dimensions =
        this.imagePreloaderService.getDimensionsOfMathSvg(svgFilename);
      this.imageContainerStyle = {
        height: dimensions.height + 'ex',
        width: dimensions.width + 'ex',
        'vertical-align': '-' + dimensions.verticalPadding + 'ex',
      };
    }
    // If viewing a concept card in the exploration player, don't use the
    // preloader service. Since, in that service, the image file names are
    // extracted from the state contents to be preloaded, but when
    // viewing a concept, the names are not available until the link is
    // clicked, at which point an API call is done to get the skill
    // details. So, the image file name will not be available to the
    // preloader service beforehand.
    if (
      this.imagePreloaderService.inExplorationPlayer() &&
      !(this.contextService.getEntityType() === AppConstants.ENTITY_TYPE.SKILL)
    ) {
      this.imagePreloaderService
        .getImageUrlAsync(mathExpressionContent.svg_filename)
        .then(objectUrl => (this.imageUrl = objectUrl));
    } else {
      // This is the case when user is not in the exploration player. We
      // don't pre-load the images in this case. So we directly assign
      // the url to the imageUrl.
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
          this.imageLocalStorageService.isInStorage(
            mathExpressionContent.svg_filename
          )
        ) {
          const imageData = this.imageLocalStorageService.getRawImageData(
            mathExpressionContent.svg_filename
          );
          if (imageData) {
            this.imageUrl =
              this.svgSanitizerService.getTrustedSvgResourceUrl(imageData);
          }
        } else {
          const entityType = this.contextService.getEntityType();
          if (entityType) {
            this.imageUrl = this.assetsBackendApiService.getImageUrlForPreview(
              entityType,
              this.contextService.getEntityId(),
              mathExpressionContent.svg_filename
            );
          }
        }
      } catch (e) {
        const additionalInfo =
          '\nEntity type: ' +
          this.contextService.getEntityType() +
          '\nEntity ID: ' +
          this.contextService.getEntityId() +
          '\nFilepath: ' +
          mathExpressionContent.svg_filename;
        if (e instanceof Error) {
          e.message += additionalInfo;
        }
        throw e;
      }
    }
  }

  ngOnInit(): void {
    this._updateImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.mathContentWithValue) {
      this._updateImage();
    }
  }
}
