// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for uploading images.
 */

import { Component, ElementRef, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { BlogDashboardPageService } from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import { ContextService } from 'services/context.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { IdGenerationService } from 'services/id-generation.service';

interface ImageTypeMapping {
  [key: string]: {
    format: string;
    fileExtension: RegExp;
  };
}

@Component({
  selector: 'oppia-image-uploader',
  templateUrl: './image-uploader.component.html'
})
export class ImageUploaderComponent {
  @Output() fileChanged: EventEmitter<File> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() allowedImageFormats!: string[];
  @Input() isBlogPostThumbnailUploader!: boolean;
  @ViewChild('dropArea') dropAreaRef!: ElementRef;
  @ViewChild('imageInput') imageInputRef!: ElementRef;
  fileInputClassName!: string;
  // The errorMessage will be null if the uploaded file is valid .
  errorMessage!: string | null;
  backgroundWhileUploading: boolean = false;
  licenseUrl = AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LICENSE.ROUTE;

  constructor(
    private blogDashboardPageService: BlogDashboardPageService,
    private idGenerationService: IdGenerationService,
    private windowRef: WindowRef,
    private contextService: ContextService,
  ) { }

  ngOnInit(): void {
    // We generate a random class name to distinguish this input from
    // others in the DOM.
    this.fileInputClassName = (
      'image-uploader-file-input' + this.idGenerationService.generateNewId());
  }

  ngAfterViewInit(): void {
    this.dropAreaRef.nativeElement.addEventListener(
      'drop', (event: DragEvent) => {
        this.onDragEnd(event);
        if (event.dataTransfer !== null) {
          let file = event.dataTransfer.files[0];
          this.errorMessage = this.validateUploadedFile(file, file.name);
          if (!this.errorMessage) {
            // Only fire this event if validations pass.
            this.fileChanged.emit(file);
          }
        }
      });

    this.dropAreaRef.nativeElement
      .addEventListener('dragover', (event: Event) => {
        event.preventDefault();
        this.backgroundWhileUploading = true;
      });

    this.dropAreaRef.nativeElement
      .addEventListener('dragleave', this.onDragEnd.bind(this));

    // If the user accidentally drops an image outside of the image-uploader
    // we want to prevent the browser from applying normal drag-and-drop
    // logic, which is to load the image in the browser tab.
    this.windowRef.nativeWindow.addEventListener('dragover', (event: Event) => {
      event.preventDefault();
    });

    this.windowRef.nativeWindow.addEventListener('drop', (event: Event) => {
      event.preventDefault();
    });
  }

  onDragEnd(e: Event): void {
    e.preventDefault();
    this.backgroundWhileUploading = false;
  }

  handleFile(): void {
    let file: File = this.imageInputRef.nativeElement.files[0];
    let filename: string = this.imageInputRef.nativeElement.value.split(
      /(\\|\/)/g).pop();
    this.errorMessage = this.validateUploadedFile(file, filename);
    if (!this.errorMessage) {
      // Only fire this event if validation pass.
      this.fileChanged.emit(file);
    }
    // After the file has been emitted, the file input can be cleared. This is
    // to allow reupload of the same file after modification (e.g. manually
    // fixing validation errors).
    this.imageInputRef.nativeElement.value = '';
  }

  validateUploadedFile(file: File, filename: string): string | null {
    if (!file || !file.size || !file.type.match('image.*')) {
      return 'This file is not recognized as an image';
    }

    let imageTypeMapping: ImageTypeMapping = {
      jpeg: {
        format: 'image/jpeg',
        fileExtension: /\.jp(e?)g$/,
      },
      jpg: {
        format: 'image/jpg',
        fileExtension: /\.jp(e?)g$/,
      },
      gif: {
        format: 'image/gif',
        fileExtension: /\.gif$/,
      },
      png: {
        format: 'image/png',
        fileExtension: /\.png$/,
      },
      svg: {
        format: 'image/svg\\+xml',
        fileExtension: /\.svg$/,
      }
    };

    let imageHasInvalidFormat: boolean = true;

    for (let i = 0; i < this.allowedImageFormats.length; i++) {
      let imageType: string = this.allowedImageFormats[i];
      if (!imageTypeMapping.hasOwnProperty(imageType)) {
        return (
          imageType + ' is not in the list of allowed image formats.'
        );
      }
      if (file.type.match(imageTypeMapping[imageType].format)) {
        imageHasInvalidFormat = false;
        if (
          !file.name.match(imageTypeMapping[imageType].fileExtension)) {
          return (
            'This image format does not match the filename extension.'
          );
        }
      }
    }

    if (imageHasInvalidFormat) {
      return 'This image format is not supported';
    }

    let maxAllowedFileSize: number;
    let fileSizeUnit: string;
    if (
      this.contextService.getEntityType() === AppConstants.ENTITY_TYPE.BLOG_POST
    ) {
      const ONE_MB_IN_BYTES: number = 1 * 1024 * 1024;
      maxAllowedFileSize = ONE_MB_IN_BYTES;
      fileSizeUnit = 'MB';
    } else {
      const HUNDRED_KB_IN_BYTES: number = 100 * 1024;
      maxAllowedFileSize = HUNDRED_KB_IN_BYTES;
      fileSizeUnit = 'KB';
    }
    if (file.size > maxAllowedFileSize) {
      let currentSize: string = (
        (file.size * 100 / maxAllowedFileSize).toFixed(1)
      );
      return `The maximum allowed file size is ${maxAllowedFileSize / 1024}` +
        ` KB (${currentSize} ${fileSizeUnit} given).`;
    }
    return null;
  }
}

angular.module('oppia').directive('oppiaImageUploader',
  downgradeComponent({ component: ImageUploaderComponent }));
