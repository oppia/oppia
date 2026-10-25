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
import {Subject} from 'rxjs';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, tick} from '@angular/core/testing';

describe('Image Uploader Modal', () => {
  let fixture: ComponentFixture<ImageUploaderModalComponent>;
  let componentInstance: ImageUploaderModalComponent;
  let windowDimensionsService: WindowDimensionsService;
  let resizeEventSubject: Subject<Event>;
  let fileReaderSpy: jasmine.Spy;
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
    resizeEventSubject = new Subject<Event>();
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
            getResizeEvent: () => resizeEventSubject.asObservable(),
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
    const mockImage = document.createElement('img');
    Object.defineProperty(mockImage, 'height', {value: 100});
    Object.defineProperty(mockImage, 'width', {value: 100});
    Object.defineProperty(mockImage, 'src', {
      set() {
        if (mockImage.onload) {
          mockImage.onload(new Event('load'));
        }
      },
    });
    spyOn(window, 'Image').and.returnValue(mockImage);

    fileReaderSpy = spyOn(FileReader.prototype, 'readAsDataURL').and.callFake(
      function (this: FileReader) {
        if (this.onload) {
          this.onload({
            target: {
              result: 'data:image/svg+xml;base64,' + btoa(svgString),
            },
          } as ProgressEvent<FileReader>);
        }
      }
    );
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
    spyOn(componentInstance, 'initializeCropper');
    const dataBase64Mock = 'VEhJUyBJUyBUSEUgQU5TV0VSCg==';
    const arrayBuffer = Uint8Array.from(window.atob(dataBase64Mock), c =>
      c.charCodeAt(0)
    );
    const file = new File([arrayBuffer], 'filename.png');

    const imageDataUrl = 'data:image/png;base64,' + dataBase64Mock;
    fileReaderSpy.and.callFake(function (this: FileReader) {
      const event = {
        target: {result: imageDataUrl},
      } as ProgressEvent<FileReader>;
      if (this.onload) {
        this.onload(event);
      }
    });

    componentInstance.onFileChanged(file);
    // Advance the virtual clock to process pending asynchronous operations like file reading.
    // This ensures any Promise resolutions or setTimeout calls in onFileChanged complete before
    // proceeding. Without this, image loading might not finish before we check upload status.
    tick();

    expect(componentInstance.invalidImageWarningIsShown).toBe(false);

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
      let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});
      componentInstance.invalidImageWarningIsShown = false;

      componentInstance.onFileChanged(file);
      tick();

      expect(componentInstance.invalidImageWarningIsShown).toBe(false);

      const confirmSpy = spyOn(componentInstance, 'confirm').and.callThrough();
      componentInstance.confirm();

      expect(confirmSpy).toHaveBeenCalled();
      expect(componentInstance.croppedImageDataUrl).toEqual(
        componentInstance.uploadedImage as string
      );
    })
  );

  it('should remove invalid tags and attributes', fakeAsync(() => {
    componentInstance.imageUploaderParameters.imageName = 'Thumbnail';
    componentInstance.ngOnInit();
    const cleanSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';
    fileReaderSpy.and.callFake(function (this: FileReader) {
      if (this.onload) {
        this.onload({
          target: {
            result: 'data:image/svg+xml;base64,' + btoa(cleanSvg),
          },
        } as ProgressEvent<FileReader>);
      }
    });
    let file = new File([cleanSvg], 'test.svg', {type: 'image/svg+xml'});
    componentInstance.invalidImageWarningIsShown = false;
    fixture.detectChanges();

    componentInstance.onFileChanged(file);
    tick();

    expect(componentInstance.areInvalidTagsOrAttrsPresent()).toBe(false);
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

  it('should not initialize cropper if croppableImageRef is null', fakeAsync(() => {
    spyOn(componentInstance, 'initializeCropper');
    componentInstance.imageUploaderParameters.imageName = 'Image';
    componentInstance.ngOnInit();
    fixture.detectChanges();
    Object.defineProperty(componentInstance, 'croppableImageRef', {
      get: () => null,
      set: () => {},
      configurable: true,
    });

    let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});
    componentInstance.invalidImageWarningIsShown = false;

    componentInstance.onFileChanged(file);
    tick();

    expect(componentInstance.initializeCropper).not.toHaveBeenCalled();
  }));

  it(
    'should initialize cropper in onFileChanged if not thumbnail and' +
      ' croppableImageRef is present',
    fakeAsync(() => {
      spyOn(componentInstance, 'initializeCropper');
      componentInstance.croppableImageRef = new ElementRef(
        document.createElement('img')
      );
      componentInstance.imageUploaderParameters.imageName = 'Image';
      componentInstance.ngOnInit();
      let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});
      componentInstance.invalidImageWarningIsShown = false;
      fixture.detectChanges();

      componentInstance.onFileChanged(file);
      tick();

      expect(componentInstance.initializeCropper).toHaveBeenCalled();
    })
  );

  it('should not initialize cropper when croppableImageRef is not defined', () => {
    componentInstance.croppableImageRef = undefined as never;
    componentInstance.initializeCropper();
    expect(componentInstance.cropper).toBeUndefined();
  });

  it('should get issue URL', () => {
    const svgSanitizerService = TestBed.inject(SvgSanitizerService);
    spyOn(svgSanitizerService, 'getIssueURL').and.returnValue(
      'https://github.com/oppia/oppia/issues/new'
    );
    const invalidTagsAndAttrs = {tags: ['script'], attrs: ['onload']};
    expect(componentInstance.getIssueURL(invalidTagsAndAttrs)).toBe(
      'https://github.com/oppia/oppia/issues/new'
    );
    expect(svgSanitizerService.getIssueURL).toHaveBeenCalledWith(
      invalidTagsAndAttrs
    );
  });

  it('should check if there is more than one background color', () => {
    componentInstance.imageUploaderParameters.allowedBgColors = ['#fff'];
    expect(componentInstance.hasMoreThanOneBgColor()).toBeFalse();

    componentInstance.imageUploaderParameters.allowedBgColors = [
      '#fff',
      '#000',
    ];
    expect(componentInstance.hasMoreThanOneBgColor()).toBeTrue();
  });

  it('should check if invalid tags or attributes are present', () => {
    componentInstance.invalidTagsAndAttributes = {tags: [], attrs: []};
    expect(componentInstance.areInvalidTagsOrAttrsPresent()).toBeFalse();

    componentInstance.invalidTagsAndAttributes = {tags: ['script'], attrs: []};
    expect(componentInstance.areInvalidTagsOrAttrsPresent()).toBeTrue();

    componentInstance.invalidTagsAndAttributes = {tags: [], attrs: ['onerror']};
    expect(componentInstance.areInvalidTagsOrAttrsPresent()).toBeTrue();
  });

  it(
    'should get trusted SVG resource URL when uploaded image is SVG and' +
      ' not thumbnail',
    fakeAsync(() => {
      spyOn(componentInstance, 'initializeCropper');
      const svgSanitizerService = TestBed.inject(SvgSanitizerService);
      spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl').and.returnValue(
        'trusted-svg-url'
      );
      componentInstance.imageUploaderParameters.imageName = 'Image';
      fixture.detectChanges();

      let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});
      componentInstance.onFileChanged(file);
      tick();

      expect(svgSanitizerService.getTrustedSvgResourceUrl).toHaveBeenCalled();
      expect(componentInstance.uploadedImage).toBe('trusted-svg-url');
    })
  );

  it('should handle viewDestroyedError when detectChanges throws', fakeAsync(() => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    spyOn(changeDetectorRef, 'detectChanges').and.throwError(
      'Attempt to use a destroyed view: detectChanges thrown.'
    );
    let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});

    expect(() => {
      componentInstance.onFileChanged(file);
      tick();
    }).not.toThrowError();
  }));

  it('should update windowIsNarrow on window resize', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    componentInstance.ngOnInit();
    expect(componentInstance.windowIsNarrow).toBeFalse();

    (windowDimensionsService.isWindowNarrow as jasmine.Spy).and.returnValue(
      true
    );
    resizeEventSubject.next(new Event('resize'));
    expect(componentInstance.windowIsNarrow).toBeTrue();
  });

  it('should throw error if cropper is not initialized', () => {
    expect(() => {
      componentInstance.confirm();
    }).toThrowError('Cropper has not been initialized');
  });

  it('should handle file read errors', fakeAsync(() => {
    spyOn(componentInstance, 'onInvalidImageLoaded');
    const file = new File([], 'invalid.png');

    fileReaderSpy.and.callFake(function (this: FileReader) {
      const errorEvent = new ProgressEvent(
        'error'
      ) as ProgressEvent<FileReader>;
      this.onerror?.(errorEvent);
    });

    componentInstance.onFileChanged(file);
    tick();

    expect(componentInstance.onInvalidImageLoaded).toHaveBeenCalled();
  }));
});
