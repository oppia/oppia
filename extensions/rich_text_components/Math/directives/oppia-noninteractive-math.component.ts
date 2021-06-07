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

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';

export interface MathExpression {
  'raw_latex': string;
  'svg_filename': string;
}

interface ImageContainerStyle {
  height: string;
  width: string;
  'vertical-align': string;
}
@Component({
  selector: 'oppia-noninteractive-math',
  templateUrl: './math.component.html',
  styleUrls: []
})
export class NoninteractiveMath implements OnInit {
  @Input() mathContentWithValue: string;
  imageContainerStyle: ImageContainerStyle;
  imageUrl: string;

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private htmlEscaperService: HtmlEscaperService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imagePreloaderService: ImagePreloaderService
  ) {}

  ngOnInit(): void {
    const mathExpressionContent = this.htmlEscaperService.escapedJsonToObj(
      this.mathContentWithValue) as MathExpression;
    if (mathExpressionContent.hasOwnProperty('raw_latex')) {
      const svgFilename = mathExpressionContent.svg_filename;
      const dimensions = this.imagePreloaderService.getDimensionsOfMathSvg(
        svgFilename);
      this.imageContainerStyle = {
        height: dimensions.height + 'ex',
        width: dimensions.width + 'ex',
        'vertical-align': '-' + dimensions.verticalPadding + 'ex'
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
      this.imagePreloaderService.getImageUrlAsync(
        mathExpressionContent.svg_filename
      ).then(
        objectUrl => this.imageUrl = objectUrl
      );
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
          AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE && (
            this.imageLocalStorageService.isInStorage(
              mathExpressionContent.svg_filename))) {
          this.imageUrl = this.imageLocalStorageService.getObjectUrlForImage(
            mathExpressionContent.svg_filename);
        } else {
          this.imageUrl = this.assetsBackendApiService.getImageUrlForPreview(
            this.contextService.getEntityType(),
            this.contextService.getEntityId(),
            mathExpressionContent.svg_filename);
        }
      } catch (e) {
        const additionalInfo = (
          '\nEntity type: ' + this.contextService.getEntityType() +
          '\nEntity ID: ' + this.contextService.getEntityId() +
          '\nFilepath: ' + mathExpressionContent.svg_filename);
        e.message += additionalInfo;
        throw e;
      }
    }
  }
}

angular.module('oppia').directive(
  'oppiaNoninteractiveMath', downgradeComponent({
    component: NoninteractiveMath
  }) as angular.IDirectiveFactory);
