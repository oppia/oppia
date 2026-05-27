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
 * @fileoverview Unit tests for FeedbackScreenshotStagingService.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';

import {FeedbackScreenshotStagingService} from 'domain/feedback/feedback-screenshot-staging.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';

describe('FeedbackScreenshotStagingService', () => {
  let feedbackScreenshotStagingService: FeedbackScreenshotStagingService;
  let imageLocalStorageService: ImageLocalStorageService;
  let imageUploadHelperService: ImageUploadHelperService;

  const PREVIEW_DATA_URL = 'data:image/png;base64,aW1hZ2UtZGF0YQ==';
  const IMAGE_FILENAME = 'img_filename.png';

  let fileReaderResult: string | null;
  let fileReaderShouldFail: boolean;
  let imageHeight: number;
  let imageWidth: number;
  let imageShouldFail: boolean;
  let originalImage: typeof Image;

  class MockFileReader {
    result = fileReaderResult;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    readAsDataURL(file: File): void {
      if (fileReaderShouldFail) {
        if (this.onerror !== null) {
          this.onerror();
        }
        return;
      }

      if (this.onload !== null) {
        this.onload();
      }
    }
  }

  class MockImage {
    height = imageHeight;
    width = imageWidth;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(url: string) {
      if (imageShouldFail) {
        if (this.onerror !== null) {
          this.onerror();
        }
        return;
      }

      if (this.onload !== null) {
        this.onload();
      }
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    feedbackScreenshotStagingService = TestBed.inject(
      FeedbackScreenshotStagingService
    );
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
    originalImage = window.Image;

    fileReaderResult = PREVIEW_DATA_URL;
    fileReaderShouldFail = false;
    imageHeight = 40;
    imageWidth = 80;
    imageShouldFail = false;

    spyOn(window, 'FileReader').and.returnValue(new MockFileReader());

    // This throws "Type 'typeof MockImage' is not assignable to type 'typeof
    // Image'.". We need to suppress this error because 'HTMLImageElement' has
    // browser properties that are not needed here.
    // @ts-expect-error
    window.Image = MockImage;
  });

  afterEach(() => {
    window.Image = originalImage;
  });

  it('should stage a screenshot and resolve with filename and previewDataUrl', fakeAsync(() => {
    const file = new File(['image-data'], 'feedback.png', {
      type: 'image/png',
    });

    spyOn(imageUploadHelperService, 'generateImageFilename').and.returnValue(
      IMAGE_FILENAME
    );
    spyOn(imageLocalStorageService, 'saveImage');
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(true);

    const onSuccess = jasmine.createSpy('onSuccess');
    feedbackScreenshotStagingService.stageScreenshotAsync(file).then(onSuccess);
    flushMicrotasks();

    expect(imageUploadHelperService.generateImageFilename).toHaveBeenCalledWith(
      40,
      80,
      'png'
    );
    expect(imageLocalStorageService.saveImage).toHaveBeenCalledWith(
      IMAGE_FILENAME,
      PREVIEW_DATA_URL
    );
    expect(imageLocalStorageService.isInStorage).toHaveBeenCalledWith(
      IMAGE_FILENAME
    );
    expect(onSuccess).toHaveBeenCalledWith({
      filename: IMAGE_FILENAME,
      previewDataUrl: PREVIEW_DATA_URL,
    });
  }));

  it('should derive the file extension from the MIME type of the file', fakeAsync(() => {
    const jpegFile = new File(['image-data'], 'feedback.jpeg', {
      type: 'image/jpeg',
    });
    imageHeight = 100;
    imageWidth = 200;

    spyOn(imageUploadHelperService, 'generateImageFilename').and.returnValue(
      'img_jpeg.jpeg'
    );
    spyOn(imageLocalStorageService, 'saveImage');
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(true);

    feedbackScreenshotStagingService.stageScreenshotAsync(jpegFile);
    flushMicrotasks();

    expect(imageUploadHelperService.generateImageFilename).toHaveBeenCalledWith(
      100,
      200,
      'jpeg'
    );
  }));

  it('should reject when the FileReader fails to read the file', fakeAsync(() => {
    const file = new File(['image-data'], 'feedback.png', {
      type: 'image/png',
    });
    fileReaderShouldFail = true;

    const onFailure = jasmine.createSpy('onFailure');
    feedbackScreenshotStagingService
      .stageScreenshotAsync(file)
      .catch(onFailure);
    flushMicrotasks();

    expect(onFailure).toHaveBeenCalledWith(
      new Error('Unable to read feedback screenshot.')
    );
  }));

  it('should reject when the Image element fails to load the data URL', fakeAsync(() => {
    const file = new File(['image-data'], 'feedback.png', {
      type: 'image/png',
    });
    imageShouldFail = true;

    const onFailure = jasmine.createSpy('onFailure');
    feedbackScreenshotStagingService
      .stageScreenshotAsync(file)
      .catch(onFailure);
    flushMicrotasks();

    expect(onFailure).toHaveBeenCalledWith(
      new Error('Unable to load feedback screenshot preview.')
    );
  }));

  it('should reject when saveImage does not persist the file in storage', fakeAsync(() => {
    const file = new File(['image-data'], 'feedback.png', {
      type: 'image/png',
    });

    spyOn(imageUploadHelperService, 'generateImageFilename').and.returnValue(
      IMAGE_FILENAME
    );
    spyOn(imageLocalStorageService, 'saveImage');
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(false);

    const onFailure = jasmine.createSpy('onFailure');
    feedbackScreenshotStagingService
      .stageScreenshotAsync(file)
      .catch(onFailure);
    flushMicrotasks();

    expect(imageLocalStorageService.saveImage).toHaveBeenCalledWith(
      IMAGE_FILENAME,
      PREVIEW_DATA_URL
    );
    expect(onFailure).toHaveBeenCalledWith(
      new Error('Unable to stage feedback screenshot.')
    );
  }));

  it('should delete the image from storage when it is present', () => {
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(true);
    spyOn(imageLocalStorageService, 'deleteImage');

    feedbackScreenshotStagingService.clearStagedScreenshot(IMAGE_FILENAME);

    expect(imageLocalStorageService.isInStorage).toHaveBeenCalledWith(
      IMAGE_FILENAME
    );
    expect(imageLocalStorageService.deleteImage).toHaveBeenCalledWith(
      IMAGE_FILENAME
    );
  });

  it('should not call deleteImage when the filename is not in storage', () => {
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(false);
    spyOn(imageLocalStorageService, 'deleteImage');

    feedbackScreenshotStagingService.clearStagedScreenshot(IMAGE_FILENAME);

    expect(imageLocalStorageService.isInStorage).toHaveBeenCalledWith(
      IMAGE_FILENAME
    );
    expect(imageLocalStorageService.deleteImage).not.toHaveBeenCalled();
  });
});
