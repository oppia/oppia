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

describe('Feedback screenshot staging service', () => {
  let feedbackScreenshotStagingService: FeedbackScreenshotStagingService;
  let imageLocalStorageService: ImageLocalStorageService;
  let imageUploadHelperService: ImageUploadHelperService;
  let originalImage: typeof Image;
  const previewDataUrl = 'data:image/png;base64,aW1hZ2UtZGF0YQ==';

  class MockSuccessfulFileReader {
    result: string | ArrayBuffer | null = previewDataUrl;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
      null;
    onerror:
      | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
      | null = null;

    readAsDataURL(_file: File): void {
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }
  }

  class MockFailedFileReader {
    result: string | ArrayBuffer | null = null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
      null;
    onerror:
      | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
      | null = null;

    readAsDataURL(_file: File): void {
      if (this.onerror) {
        this.onerror({} as ProgressEvent<FileReader>);
      }
    }
  }

  class MockSuccessfulImage {
    height = 40;
    width = 80;
    onload: ((this: GlobalEventHandlers, ev: Event) => void) | null = null;
    onerror: ((this: GlobalEventHandlers, ev: Event) => void) | null = null;

    set src(_src: string) {
      if (this.onload) {
        this.onload(new Event('load'));
      }
    }
  }

  class MockFailedImage {
    height = 0;
    width = 0;
    onload: ((this: GlobalEventHandlers, ev: Event) => void) | null = null;
    onerror: ((this: GlobalEventHandlers, ev: Event) => void) | null = null;

    set src(_src: string) {
      if (this.onerror) {
        this.onerror(new Event('error'));
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
  });

  afterEach(() => {
    window.Image = originalImage;
  });

  it('should stage screenshot and return filename with preview data url', fakeAsync(() => {
    const file = new File(['image-data'], 'feedback.png', {
      type: 'image/png',
    });
    // This throws "Argument of type 'MockSuccessfulFileReader' is not
    // assignable to parameter of type 'FileReader'.". We need to suppress
    // this error because 'FileReader' has around 15 more properties. We have
    // only defined the properties we need in 'MockSuccessfulFileReader'.
    spyOn(window, 'FileReader').and.returnValue(new MockSuccessfulFileReader());
    // This throws "Type 'typeof MockSuccessfulImage' is not assignable to
    // type 'new() => HTMLImageElement'.". We need to suppress this error
    // because 'HTMLImageElement' has around 250 more properties. We have only
    // defined the properties we need in 'MockSuccessfulImage'.
    window.Image = MockSuccessfulImage;
    spyOn(imageUploadHelperService, 'generateImageFilename').and.returnValue(
      'img_filename.png'
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
      'img_filename.png',
      previewDataUrl
    );
    expect(imageLocalStorageService.isInStorage).toHaveBeenCalledWith(
      'img_filename.png'
    );
    expect(onSuccess).toHaveBeenCalledWith({
      filename: 'img_filename.png',
      previewDataUrl,
    });
  }));

  it('should reject when screenshot cannot be read', fakeAsync(() => {
    const file = new File(['image-data'], 'feedback.png', {
      type: 'image/png',
    });
    // This throws "Argument of type 'MockFailedFileReader' is not assignable
    // to parameter of type 'FileReader'.". We need to suppress this error
    // because 'FileReader' has around 15 more properties. We have only defined
    // the properties we need in 'MockFailedFileReader'.
    spyOn(window, 'FileReader').and.returnValue(new MockFailedFileReader());
    const onFailure = jasmine.createSpy('onFailure');

    feedbackScreenshotStagingService
      .stageScreenshotAsync(file)
      .catch(onFailure);
    flushMicrotasks();

    expect(onFailure).toHaveBeenCalledWith(
      new Error('Unable to read feedback screenshot.')
    );
  }));

  it('should reject when screenshot preview cannot be loaded', fakeAsync(() => {
    const file = new File(['image-data'], 'feedback.png', {
      type: 'image/png',
    });
    // This throws "Argument of type 'MockSuccessfulFileReader' is not
    // assignable to parameter of type 'FileReader'.". We need to suppress
    // this error because 'FileReader' has around 15 more properties. We have
    // only defined the properties we need in 'MockSuccessfulFileReader'.
    spyOn(window, 'FileReader').and.returnValue(new MockSuccessfulFileReader());
    // This throws "Type 'typeof MockFailedImage' is not assignable to type
    // 'new() => HTMLImageElement'.". We need to suppress this error because
    // 'HTMLImageElement' has around 250 more properties. We have only defined
    // the properties we need in 'MockFailedImage'.
    window.Image = MockFailedImage;
    const onFailure = jasmine.createSpy('onFailure');

    feedbackScreenshotStagingService
      .stageScreenshotAsync(file)
      .catch(onFailure);
    flushMicrotasks();

    expect(onFailure).toHaveBeenCalledWith(
      new Error('Unable to load feedback screenshot preview.')
    );
  }));

  it('should reject when screenshot cannot be staged in storage', fakeAsync(() => {
    const file = new File(['image-data'], 'feedback.png', {
      type: 'image/png',
    });
    // This throws "Argument of type 'MockSuccessfulFileReader' is not
    // assignable to parameter of type 'FileReader'.". We need to suppress
    // this error because 'FileReader' has around 15 more properties. We have
    // only defined the properties we need in 'MockSuccessfulFileReader'.
    spyOn(window, 'FileReader').and.returnValue(new MockSuccessfulFileReader());
    // This throws "Type 'typeof MockSuccessfulImage' is not assignable to
    // type 'new() => HTMLImageElement'.". We need to suppress this error
    // because 'HTMLImageElement' has around 250 more properties. We have only
    // defined the properties we need in 'MockSuccessfulImage'.
    window.Image = MockSuccessfulImage;
    spyOn(imageUploadHelperService, 'generateImageFilename').and.returnValue(
      'img_filename.png'
    );
    spyOn(imageLocalStorageService, 'saveImage');
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(false);
    const onFailure = jasmine.createSpy('onFailure');

    feedbackScreenshotStagingService
      .stageScreenshotAsync(file)
      .catch(onFailure);
    flushMicrotasks();

    expect(imageLocalStorageService.saveImage).toHaveBeenCalledWith(
      'img_filename.png',
      previewDataUrl
    );
    expect(onFailure).toHaveBeenCalledWith(
      new Error('Unable to stage feedback screenshot.')
    );
  }));

  it('should clear staged screenshot when it is in storage', () => {
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(true);
    spyOn(imageLocalStorageService, 'deleteImage');

    feedbackScreenshotStagingService.clearStagedScreenshot('img_filename.png');

    expect(imageLocalStorageService.isInStorage).toHaveBeenCalledWith(
      'img_filename.png'
    );
    expect(imageLocalStorageService.deleteImage).toHaveBeenCalledWith(
      'img_filename.png'
    );
  });

  it('should not delete staged screenshot when it is not in storage', () => {
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(false);
    spyOn(imageLocalStorageService, 'deleteImage');

    feedbackScreenshotStagingService.clearStagedScreenshot('img_filename.png');

    expect(imageLocalStorageService.isInStorage).toHaveBeenCalledWith(
      'img_filename.png'
    );
    expect(imageLocalStorageService.deleteImage).not.toHaveBeenCalled();
  });
});
