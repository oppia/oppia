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
import { PassThrough } from 'node:stream';
import { WindowRef } from 'services/contextual/window-ref.service';
import { IdGenerationService } from 'services/id-generation.service';

interface ImageTypeMapping {
  [key: string]: {
    format: string,
    fileExtension: RegExp
  }
}

@Component({
  selector: 'oppia-image-uploader',
  templateUrl: './image-uploader.component.html'
})
export class ImageUploaderComponent {
  @Output() fileChanged: EventEmitter<File> = new EventEmitter();
  @Input() allowedImageFormats: string[];
  errorMessage: string;
  backgroundWhileUploading: boolean = false;
  @ViewChild('dropArea') dropAreaRef: ElementRef;
  @ViewChild('imageInput') imageInputRef: ElementRef;
  fileInputClassName: string;

  constructor(
    private idGenerationService: IdGenerationService,
    private windowRef: WindowRef
  ) { }

  ngOnInit(): void {
    // We generate a random class name to distinguish this input from
    // others in the DOM.
    this.fileInputClassName = (
      'image-uploader-file-input' + this.idGenerationService.generateNewId());
  }

  ngAfterViewInit(): void {
    this.dropAreaRef.nativeElement.addEventListener('drop', (event: Event) => {
      this.onDragEnd(event);
      let file = (<DragEvent>event).dataTransfer.files[0];
      this.errorMessage = this.validateUploadedFile(file, file.name);
      if (!this.errorMessage) {
        // Only fire this event if validations pass.
        this.fileChanged.emit(file);
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
    let fchng = this.fileChanged;
    let newFile: File = new File(["asd".repeat(34134)], "so.txt", { type: "text/plain" });
    if (!this.errorMessage) {
      // Only fir this event if validation pass.
      const HUNDRED_KB_IN_BYTES: number = 100 * 1024;

      if (file.size > HUNDRED_KB_IN_BYTES) {
        let width: number = 171;
        let stop: boolean = false;
        const reader: FileReader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function (event) {
          let imgElement: HTMLImageElement = document.createElement("img");
          imgElement.src = reader.result;
          imgElement.onload = function (e) {
            const canvas = document.createElement("canvas");
            let scale: number = e.target.height / e.target.width;
            width = Math.sqrt((100 * 1024) / (3.5 * scale));

            const MAX_WIDTH = width;
            if (imgElement.width > imgElement.height) {
              const scaleSize = MAX_WIDTH / e.target.width;
              canvas.width = MAX_WIDTH;
              canvas.height = e.target.height * scaleSize;
            }
            else {
              const scaleSize = MAX_WIDTH / e.target.height;
              canvas.height = MAX_WIDTH;
              canvas.width = e.target.width * scaleSize;
            }

            const ctx = canvas.getContext("2d");
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(function (blob) {
              newFile = new File([blob], file.name, { type: file.type });
              fchng.emit(newFile);
            });
          };

        };

      }
      else {
        this.fileChanged.emit(file);
      }
    }
  }

  validateUploadedFile(file: File, filename: string): string {
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

    return null;
  }
}

angular.module('oppia').directive('oppiaImageUploader',
  downgradeComponent({ component: ImageUploaderComponent }));
