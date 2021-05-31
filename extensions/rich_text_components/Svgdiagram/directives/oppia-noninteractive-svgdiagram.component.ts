// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Svgdiagram rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the component is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { ImageDimensions, ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';

@Component({
  selector: 'oppia-noninteractive-svgdiagram',
  templateUrl: './svgdiagram.component.html',
  styleUrls: []
})
export class NoninteractiveSvgdiagram implements OnInit, OnChanges {
  @Input() svgFilenameWithValue: string;
  @Input() altWithValue: string;

  dimensions: ImageDimensions;
  filename: string;
  svgAltText: string = '';
  svgContainerStyle: { height: string, width: string };
  svgUrl: string;

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private htmlEscaperService: HtmlEscaperService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imagePreloaderService: ImagePreloaderService
  ) {}

  private _updateViewOnSvgFileChange(): void {
    if (!this.svgFilenameWithValue || !this.altWithValue) {
      return;
    }
    this.filename = this.htmlEscaperService.escapedJsonToObj(
      this.svgFilenameWithValue) as string;
    if (!this.filename) {
      return;
    }
    this.dimensions = this.imagePreloaderService.getDimensionsOfImage(
      this.filename);
    this.svgContainerStyle = {
      height: this.dimensions.height + 'px',
      width: this.dimensions.width + 'px'
    };
    if (this.contextService.getImageSaveDestination() === (
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE)) {
      this.svgUrl = this.imageLocalStorageService.getObjectUrlForImage(
        this.filename);
    } else {
      this.svgUrl = this.assetsBackendApiService.getImageUrlForPreview(
        this.contextService.getEntityType(), this.contextService.getEntityId(),
        this.filename);
    }

    if (this.altWithValue) {
      this.svgAltText = this.htmlEscaperService.escapedJsonToObj(
        this.altWithValue) as string;
    }
  }

  ngOnInit(): void {
    this._updateViewOnSvgFileChange();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.svgFilenameWithValue || changes.altWithValue) {
      this._updateViewOnSvgFileChange();
    }
  }
}

angular.module('oppia').directive(
  'oppiaNoninteractiveSvgdiagram', downgradeComponent({
    component: NoninteractiveSvgdiagram
  }) as angular.IDirectiveFactory);
