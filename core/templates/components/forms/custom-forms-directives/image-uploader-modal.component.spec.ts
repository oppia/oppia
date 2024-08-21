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

    componentInstance.initializeCropper();

    expect(componentInstance.cropper).toBeDefined();
  });

  it('should initialize cropper when window is narrow', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    fixture.detectChanges();
    componentInstance.croppableImageRef = new ElementRef(
      document.createElement('img')
    );

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

  it('should handle image upload and confirm image', () => {
    const dataBase64Mock = 'VEhJUyBJUyBUSEUgQU5TV0VSCg==';
    const arrayBuffer = Uint8Array.from(window.atob(dataBase64Mock), c =>
      c.charCodeAt(0)
    );
    const file = new File([arrayBuffer], 'filename.png');

    const fileReaderMock = {
      readAsDataURL: jasmine
        .createSpy('readAsDataURL')
        .and.callFake(function () {
          const event = {
            target: {result: 'base64ImageData'},
          } as ProgressEvent<FileReader>;
          if (this.onload) {
            this.onload(event);
          }
        }),
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      onload: null as
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null,
    };

    spyOn(window, 'FileReader').and.returnValue(
      fileReaderMock as unknown as FileReader
    );

    componentInstance.onFileChanged(file);
    expect(componentInstance.invalidImageWarningIsShown).toBeFalse();

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
  });

  it(
    'should confirm and set croppedImageDataUrl same as uploadedImage ' +
      'in case of Thumbnail',
    () => {
      componentInstance.imageUploaderParameters.imageName = 'Thumbnail';
      componentInstance.ngOnInit();
      let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});
      componentInstance.invalidImageWarningIsShown = false;

      componentInstance.onFileChanged(file);

      expect(componentInstance.invalidImageWarningIsShown).toBeFalse();

      const confirmSpy = spyOn(componentInstance, 'confirm').and.callThrough();

      componentInstance.confirm();

      expect(confirmSpy).toHaveBeenCalled();
      expect(componentInstance.croppedImageDataUrl).toEqual(
        componentInstance.uploadedImage as string
      );
    }
  );

  it('should remove invalid tags and attributes', () => {
    componentInstance.ngOnInit();
    let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});
    componentInstance.invalidImageWarningIsShown = false;

    componentInstance.onFileChanged(file);
    expect(componentInstance.areInvalidTagsOrAttrsPresent()).toBeFalse();
    expect(componentInstance.invalidImageWarningIsShown).toBeFalse();
  });

  it(
    'should update background color if the new color is different' +
      ' from the current color',
    () => {
      componentInstance.imageUploaderParameters.bgColor = 'red';
      componentInstance.updateBackgroundColor('blue');
      expect(componentInstance.imageUploaderParameters.bgColor).toBe('blue');
    }
  );

  it(
    'should not update background color if the new color is the same' +
      'as the current color',
    () => {
      componentInstance.imageUploaderParameters.bgColor = 'red';
      componentInstance.updateBackgroundColor('red');
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
    expect(componentInstance.invalidImageWarningIsShown).toBeTrue();
  });

  it('should not initialize cropper if croppableImageRef is null', () => {
    spyOn(componentInstance, 'initializeCropper');
    const mockCroppableImageRef = {nativeElement: {}} as ElementRef;
    componentInstance.croppableImageRef = mockCroppableImageRef;
    componentInstance.imageUploaderParameters.imageName = 'Image';
    componentInstance.ngOnInit();
    let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});
    componentInstance.invalidImageWarningIsShown = false;

    componentInstance.onFileChanged(file);

    expect(componentInstance.initializeCropper).not.toHaveBeenCalled();
  });

  it('should throw error if cropper is not initialized', () => {
    expect(() => {
      componentInstance.confirm();
    }).toThrowError('Cropper has not been initialized');
  });

  it('should handle file read errors', () => {
    spyOn(componentInstance, 'onInvalidImageLoaded');
    const file = new File([], 'invalid.png');
    const reader = new FileReader();

    spyOn(reader, 'readAsDataURL').and.callFake(function () {
      const errorEvent = new ProgressEvent('error');
      this.onerror(errorEvent);
    });

    spyOn(window, 'FileReader').and.returnValue(reader);

    componentInstance.onFileChanged(file);
    expect(componentInstance.onInvalidImageLoaded).toHaveBeenCalled();
  });
});
