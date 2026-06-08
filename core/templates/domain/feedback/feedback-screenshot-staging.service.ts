// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for staging feedback screenshots in session storage
 * until the enclosing feedback action is submitted.
 */

import {Injectable} from '@angular/core';

import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';

export interface StagedFeedbackScreenshot {
  filename: string;
  previewDataUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackScreenshotStagingService {
  constructor(
    private imageLocalStorageService: ImageLocalStorageService,
    private imageUploadHelperService: ImageUploadHelperService
  ) {}

  async stageScreenshotAsync(file: File): Promise<StagedFeedbackScreenshot> {
    const previewDataUrl = await this.readFileAsDataUrlAsync(file);
    const dimensions =
      await this.getImageDimensionsFromDataUrlAsync(previewDataUrl);
    const extension = file.type.split('/')[1];
    const filename = this.imageUploadHelperService.generateImageFilename(
      dimensions.height,
      dimensions.width,
      extension
    );
    this.imageLocalStorageService.saveImage(filename, previewDataUrl);
    if (!this.imageLocalStorageService.isInStorage(filename)) {
      throw new Error('Unable to stage feedback screenshot.');
    }
    return {
      filename,
      previewDataUrl,
    };
  }

  clearStagedScreenshot(filename: string): void {
    if (this.imageLocalStorageService.isInStorage(filename)) {
      this.imageLocalStorageService.deleteImage(filename);
    }
  }

  private async readFileAsDataUrlAsync(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(new Error('Unable to read feedback screenshot.'));
      reader.readAsDataURL(file);
    });
  }

  private async getImageDimensionsFromDataUrlAsync(
    dataUrl: string
  ): Promise<{height: number; width: number}> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () =>
        resolve({
          height: image.height,
          width: image.width,
        });
      image.onerror = () =>
        reject(new Error('Unable to load feedback screenshot preview.'));
      image.src = dataUrl;
    });
  }
}
