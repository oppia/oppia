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

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { ImageDimensions, ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';

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
  svgUrl: string | SafeResourceUrl;

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private htmlEscaperService: HtmlEscaperService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imagePreloaderService: ImagePreloaderService,
    private svgSanitizerService: SvgSanitizerService
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
      this.svgUrl = this.svgSanitizerService.getTrustedSvgResourceUrl(
        this.imageLocalStorageService.getRawImageData(
          this.filename));
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
