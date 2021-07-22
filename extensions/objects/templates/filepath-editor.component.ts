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
 * @fileoverview Component for filepath editor.
 */

// This component can only be used in the context of an exploration.
/**
 * NOTE: These are some hacky behavior in the component class. Apologies in
 * advance if you were stuck on one of these for a long time.
 *
 * 1. Whenever changing a property of the data property of this component
 * class, please make sure the object is reassigned. Angular's change detection
 * uses the `===` operator which would only return false when the object
 * changes. You can use the spread operator to achieve the desired result.
 * Eg: this.data = {..this.data};
 *
 * 2. Angular treats SVG+XMl as dangerous by default. To show this image in the
 * view, we run our own security (for our own safety) and circumvent the angular
 * security. When we circumvent Angular's security checks, it attaches some
 * additional information to inform the Angular's view engine to not run
 * security checks on the image data. This can only be done the in html file
 * using property binding (i.e. [src]). If we use this in the ts file, by doing
 * `const img = new Image; img.src = circumventedValue;`, Angular will raise
 * errors.
 * In addition to this, our custom functions will also fail for this data. To
 * overcome this, during the migration of this component, a new property called
 * imgData was introduced. This contains the not circumvented value for svgs or
 * just the normal image data for other file formats. While updating
 * `this.data.metadata.uploadedImageData`, make sure that you also update
 * imgData. Failing to do so could lead to unpredictable behavior.
 */
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';

const gifFrames = require('gif-frames');
const gifshot = require('gifshot');

interface FilepathData {
  mode: number;
  metadata: {
    uploadedFile?: File;
    uploadedImageData?: string | SafeResourceUrl;
    originalWidth?: number;
    originalHeight?: number;
    savedImageFilename?: string;
    savedImageUrl?: string;
  };
  crop: boolean;
}

interface Dimensions {
  height: number;
  width: number;
}

// Reference: https://github.com/yahoo/gifshot#creategifoptions-callback.
interface GifshotCallbackObject {
  image: string,
  cameraStream: MediaStream,
  error: boolean,
  errorCode: string,
  errorMsg: string,
  savedRenderingContexts: ImageData
}

@Component({
  selector: 'filepath-editor',
  templateUrl: './filepath-editor.component.html',
  styleUrls: []
})
export class FilepathEditorComponent implements OnInit {
  @Input() modalId;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  @Output() validityChange = new EventEmitter<Record<'empty', boolean>>();
  svgFilenameEditorIsShown = false;
  imageEditorIsShown = false;

  ngOnInit(): void {
    if (!this.value) {
      return
    }
    if (this.value.endsWith('.svg')) {
      this.svgFilenameEditorIsShown = true;
    } else {
      this.imageEditorIsShown = true;
    }
  }

  valueHasChanged(event) {
    console.log('valueHasChanged');
    this.valueChanged.emit(event);
  }
  validityHasChanged(event) {
    console.log('validityHasChanged');
  }
  onClickCreateImage() {
    this.svgFilenameEditorIsShown = true;
    this.imageEditorIsShown = false;
  }
  onClickUploadImage() {
    this.imageEditorIsShown = true;
    this.svgFilenameEditorIsShown = false;
  }
}

angular.module('oppia').directive(
  'filepathEditor', downgradeComponent({
    component: FilepathEditorComponent
  }) as angular.IDirectiveFactory);
