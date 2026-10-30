// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for image uploader modal.
 */

import {ChangeDetectorRef, ElementRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Cropper from 'cropperjs';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ImageUploaderModalComponent} from './image-uploader-modal.component';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {of} from 'rxjs';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, tick} from '@angular/core/testing';

describe('Image Uploader Modal', () => {
  let fixture: ComponentFixture<ImageUploaderModalComponent>;
  let componentInstance: ImageUploaderModalComponent;
  let windowDimensionsService: WindowDimensionsService;
  let resizeEvent = new Event('resize');
  const svgString =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1.4' +
    '29ex" viewBox="0 -511.5 572.5 615.4" focusable="false" style="verti' +
    'cal-align: -0.241ex;"><g stroke="currentColor" fill="currentColor" ' +
    'stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-widt' +
    'h="1" d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402' +
    'Q368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T' +
    '463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z" ' +
    'data-name="dataName"/></g><circel></circel></svg>';
  // Base64 data URL for the SVG above, matching what FileReader.readAsDataURL
  // produces for an SVG file.
  const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svgString);

  // The component reads files and images using the real FileReader and Image
  // APIs. Those APIs dispatch their load/error events asynchronously on the
  // DOM event loop, which fakeAsync's tick() does not flush. Depending on
  // those events made the coverage of onFileChanged order-dependent and flaky
  // (see issue #27509). The mocks below let each test drive the callbacks
  // synchronously so that the component always behaves deterministically.
  const MOCKED_IMAGE_HEIGHT = 40;
  const MOCKED_IMAGE_WIDTH = 30;
  let mockedFileReadResult = '';
  let mockedFileReadShouldError = false;
  let mockFileReader: MockFileReader;
  let mockImage: MockImage;

  class MockFileReader {
    result: string | null = null;
    onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
    onerror: (() => void) | null = null;

    readAsDataURL(): void {
      if (mockedFileReadShouldError) {
        this.onerror?.();
        return;
      }
      this.onload?.({
        target: {result: mockedFileReadResult},
      } as unknown as ProgressEvent<FileReader>);
    }
  }

  class MockImage {
    height = MOCKED_IMAGE_HEIGHT;
    width = MOCKED_IMAGE_WIDTH;
    onload: (() => void) | null = null;
    sourceUrl = '';

    get src(): string {
      return this.sourceUrl;
    }

    set src(value: string) {
      this.sourceUrl = value;
      // Fire onload synchronously so that the image-load handling in
      // onFileChanged is always exercised, regardless of test order.
      this.onload?.();
    }
  }

  class MockChangeDetectorRef {
    detectChanges(): void {}
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ImageUploaderModalComponent, MockTranslatePipe],
      imports: [HttpClientTestingModule],
      providers: [
        NgbActiveModal,
        SvgSanitizerService,
        {
          provide: ChangeDetectorRef,
          useClass: MockChangeDetectorRef,
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    mockedFileReadResult = '';
    mockedFileReadShouldError = false;
    mockFileReader = new MockFileReader();
    mockImage = new MockImage();
    // Jasmine's returnValue spies are constructable, which is required here
    // because the component calls `new FileReader()` and `new Image()`.
    spyOn(window, 'FileReader').and.returnValue(
      mockFileReader as unknown as FileReader
    );
    spyOn(window, 'Image').and.returnValue(
      mockImage as unknown as HTMLImageElement
    );
    fixture = TestBed.createComponent(ImageUploaderModalComponent);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    componentInstance = fixture.componentInstance;
    componentInstance.imageUploaderParameters = {
      disabled: false,
      allowedBgColors: [],
      aspectRatio: '4:3',
      allowedImageFormats: ['png', 'svg', 'jpeg'],
      bgColor: '',
      imageName: 'Image',
      maxImageSizeInKB: 1000,
      orientation: 'portrait',
      filename: '',
      previewDescription: '',
      previewDescriptionBgColor: '',
      previewFooter: '',
      previewImageUrl: '',
      previewTitle: '',
    };
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize cropper when window is not narrow', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    fixture.detectChanges();
    componentInstance.croppableImageRef = new ElementRef(
      document.createElement('img')
    );

    // Trigger change detection to propagate the updated input property to the component.
    // Without this, Angular's change detection might not run before ngOnInit(), leading to
    // stale property values if the component relies on the updated input during initialization.
    fixture.detectChanges();
    componentInstance.initializeCropper();

    expect(componentInstance.cropper).toBeDefined();
  });

  it('should initialize cropper when window is narrow', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    fixture.detectChanges();
    componentInstance.croppableImageRef = new ElementRef(
      document.createElement('img')
    );

    fixture.detectChanges();
    componentInstance.initializeCropper();

    expect(componentInstance.cropper).toBeDefined();
  });

  it('should reset', () => {
    componentInstance.reset();
    expect(componentInstance.uploadedImage).toBeNull();
    expect(componentInstance.invalidTagsAndAttributes).toEqual({
      tags: [],
      attrs: [],
    });
  });

  it('should handle image upload and confirm image', fakeAsync(() => {
    // The component's own change detection renders the croppable image once
    // this upload completes, so stub out initializeCropper to avoid building a
    // real Cropper (which loads the image over XHR).
    const initializeCropperSpy = spyOn(componentInstance, 'initializeCropper');
    componentInstance.croppableImageRef = new ElementRef(
      document.createElement('img')
    );
    mockedFileReadResult = 'base64ImageData';
    const file = new File([''], 'filename.png', {type: 'image/png'});

    componentInstance.onFileChanged(file);
    tick();

    expect(componentInstance.invalidImageWarningIsShown).toBe(false);
    // A non-base64-SVG upload falls back to the decoded file contents.
    expect(componentInstance.uploadedImage).toBe('base64ImageData');
    expect(componentInstance.dimensions).toEqual({
      height: MOCKED_IMAGE_HEIGHT,
      width: MOCKED_IMAGE_WIDTH,
    });
    expect(componentInstance.imageType).toBe('image/png');
    expect(initializeCropperSpy).toHaveBeenCalled();

    const imageDataUrl = 'base64ImageData';
    componentInstance.cropper = {
      getCroppedCanvas: () => {
        return {
          toDataURL: () => imageDataUrl,
        };
      },
    } as Cropper;

    componentInstance.confirm();
    expect(componentInstance.croppedImageDataUrl).toEqual(imageDataUrl);
  }));

  it(
    'should confirm and set croppedImageDataUrl same as uploadedImage ' +
      'in case of Thumbnail',
    fakeAsync(() => {
      componentInstance.imageUploaderParameters.imageName = 'Thumbnail';
      fixture.detectChanges();

      componentInstance.ngOnInit();
      mockedFileReadResult = svgDataUrl;
      let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});
      componentInstance.invalidImageWarningIsShown = false;

      componentInstance.onFileChanged(file);
      tick();

      expect(componentInstance.invalidImageWarningIsShown).toBe(false);
      // Thumbnails keep the sanitized SVG data URL as the uploaded image.
      expect(componentInstance.uploadedImage).toEqual(
        jasmine.stringMatching(/^data:image\/svg\+xml;base64,/)
      );

      const confirmSpy = spyOn(componentInstance, 'confirm').and.callThrough();
      componentInstance.confirm();

      expect(confirmSpy).toHaveBeenCalled();
      expect(componentInstance.croppedImageDataUrl).toEqual(
        componentInstance.uploadedImage as string
      );
    })
  );

  it('should detect invalid tags and attributes in an uploaded SVG', fakeAsync(() => {
    // Stub initializeCropper so the real change detection below does not build
    // a real Cropper (which loads the image over XHR).
    spyOn(componentInstance, 'initializeCropper');
    componentInstance.ngOnInit();
    mockedFileReadResult = svgDataUrl;
    let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});
    componentInstance.invalidImageWarningIsShown = false;
    fixture.detectChanges();

    componentInstance.onFileChanged(file);
    tick();

    // The test SVG contains an unsupported tag ('circel') and attribute
    // ('data-name'), which the component surfaces as invalid tags/attrs.
    expect(componentInstance.invalidTagsAndAttributes).toEqual({
      tags: ['circel'],
      attrs: ['path:data-name'],
    });
    expect(componentInstance.areInvalidTagsOrAttrsPresent()).toBe(true);
    expect(componentInstance.invalidImageWarningIsShown).toBe(false);
  }));

  it(
    'should update background color if the new color is different' +
      ' from the current color',
    () => {
      componentInstance.imageUploaderParameters.bgColor = 'red';
      componentInstance.updateBackgroundColor('blue');
      fixture.detectChanges();

      expect(componentInstance.imageUploaderParameters.bgColor).toBe('blue');
    }
  );

  it(
    'should not update background color if the new color is the same' +
      'as the current color',
    () => {
      componentInstance.imageUploaderParameters.bgColor = 'red';
      componentInstance.updateBackgroundColor('red');
      fixture.detectChanges();

      expect(componentInstance.imageUploaderParameters.bgColor).toBe('red');
    }
  );

  it('should set uploadedImage if previewImageUrl is provided', () => {
    componentInstance.imageUploaderParameters.imageName = 'Thumbnail';
    componentInstance.imageUploaderParameters.previewImageUrl = 'test_url';
    componentInstance.ngOnInit();

    expect(componentInstance.uploadedImage).toBe('test_url');
  });

  it('should handle invalid image', () => {
    spyOn(componentInstance, 'reset');
    componentInstance.onInvalidImageLoaded();
    expect(componentInstance.reset).toHaveBeenCalled();
    expect(componentInstance.invalidImageWarningIsShown).toBe(true);
  });

  it('should check if image is uploaded', () => {
    componentInstance.uploadedImage = null;
    expect(componentInstance.isImageUploaded()).toBe(false);

    componentInstance.uploadedImage = 'some-image-url';
    expect(componentInstance.isImageUploaded()).toBe(true);
  });

  it('should not initialize cropper if there is no croppable image', fakeAsync(() => {
    const initializeCropperSpy = spyOn(componentInstance, 'initializeCropper');
    componentInstance.imageUploaderParameters.imageName = 'Image';
    componentInstance.ngOnInit();
    fixture.detectChanges();
    // An empty result produces a falsy uploadedImage, so the croppable image
    // element is never rendered and croppableImageRef stays undefined.
    mockedFileReadResult = '';
    const file = new File([''], 'empty.png', {type: 'image/png'});
    componentInstance.invalidImageWarningIsShown = false;

    componentInstance.onFileChanged(file);
    tick();

    expect(initializeCropperSpy).not.toHaveBeenCalled();
  }));

  it('should set dimensions and initialize cropper after the image loads', fakeAsync(() => {
    const initializeCropperSpy = spyOn(componentInstance, 'initializeCropper');
    componentInstance.imageUploaderParameters.imageName = 'Image';
    componentInstance.ngOnInit();
    fixture.detectChanges();
    componentInstance.croppableImageRef = new ElementRef(
      document.createElement('img')
    );
    mockedFileReadResult = svgDataUrl;
    let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});

    componentInstance.onFileChanged(file);
    tick();

    expect(componentInstance.dimensions).toEqual({
      height: MOCKED_IMAGE_HEIGHT,
      width: MOCKED_IMAGE_WIDTH,
    });
    expect(initializeCropperSpy).toHaveBeenCalled();
    expect(componentInstance.imageType).toBe('image/svg+xml');
  }));

  it('should throw error if cropper is not initialized', () => {
    expect(() => {
      componentInstance.confirm();
    }).toThrowError('Cropper has not been initialized');
  });

  it('should handle file read errors', fakeAsync(() => {
    spyOn(componentInstance, 'onInvalidImageLoaded');
    mockedFileReadShouldError = true;
    const file = new File([], 'invalid.png');

    componentInstance.onFileChanged(file);
    tick();

    expect(componentInstance.onInvalidImageLoaded).toHaveBeenCalled();
  }));
});
