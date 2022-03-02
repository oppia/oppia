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
 * @fileoverview Unit tests for edit profile picture modal.
 */

import { ChangeDetectorRef, ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Cropper from 'cropperjs';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { EditProfilePictureModalComponent } from './edit-profile-picture-modal.component';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { of } from 'rxjs';

describe('Edit Profile Picture Modal Component', () => {
  let fixture: ComponentFixture<EditProfilePictureModalComponent>;
  let componentInstance: EditProfilePictureModalComponent;
  let windowDimensionsService: WindowDimensionsService;
  let resizeEvent = new Event('resize');

  class MockChangeDetectorRef {
    detectChanges(): void {}
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        EditProfilePictureModalComponent,
        MockTranslatePipe
      ],
      providers: [
        NgbActiveModal,
        SvgSanitizerService,
        {
          provide: ChangeDetectorRef,
          useClass: MockChangeDetectorRef
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent)
          }
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProfilePictureModalComponent);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    componentInstance = fixture.componentInstance;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize cropper when window is not narrow', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(false);
    fixture.detectChanges();
    componentInstance.croppableImageRef = (
      new ElementRef(document.createElement('img')));

    componentInstance.initializeCropper();

    expect(componentInstance.cropper).toBeDefined();
  });

  it('should initialize cropper when window is narrow', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(true);
    fixture.detectChanges();
    componentInstance.croppableImageRef = (
      new ElementRef(document.createElement('img')));

    componentInstance.initializeCropper();

    expect(componentInstance.cropper).toBeDefined();
  });

  it('should reset', () => {
    componentInstance.reset();
    expect(componentInstance.uploadedImage).toBeNull();
    expect(componentInstance.cropppedImageDataUrl).toEqual('');
  });

  it('should handle image', () => {
    spyOn(componentInstance, 'initializeCropper');
    // This is just a mock base 64 in order to test the FileReader event.
    let dataBase64Mock = 'VEhJUyBJUyBUSEUgQU5TV0VSCg==';
    const arrayBuffer = Uint8Array.from(
      window.atob(dataBase64Mock), c => c.charCodeAt(0));
    let file = new File([arrayBuffer], 'filename.mp3');
    componentInstance.onFileChanged(file);
    expect(componentInstance.invalidImageWarningIsShown).toBeFalse();
  });

  it('should remove invalid tags and attributes', ()=> {
    const svgString = (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1.4' +
      '29ex" viewBox="0 -511.5 572.5 615.4" focusable="false" style="verti' +
      'cal-align: -0.241ex;"><g stroke="currentColor" fill="currentColor" ' +
      'stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-widt' +
      'h="1" d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402' +
      'Q368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T' +
      '463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z" ' +
      'data-name="dataName"/></g><circel></circel></svg>'
    );
    let file = new File([svgString], 'test.svg', {type: 'image/svg+xml'});
    componentInstance.invalidImageWarningIsShown = false;

    componentInstance.onFileChanged(file);
    expect(componentInstance.invalidImageWarningIsShown).toBeFalse();
  });

  it('should handle invalid image', () => {
    spyOn(componentInstance, 'reset');
    componentInstance.onInvalidImageLoaded();
    expect(componentInstance.reset).toHaveBeenCalled();
    expect(componentInstance.invalidImageWarningIsShown).toBeTrue();
  });

  it('should confirm profile picture', () => {
    let pictureDataUrl = 'picture_data';
    componentInstance.cropper = {
      getCroppedCanvas(options) {
        return {
          toDataURL: () => pictureDataUrl
        };
      }
    } as Cropper;
    componentInstance.confirm();
    expect(componentInstance.cropppedImageDataUrl).toEqual(pictureDataUrl);
  });

  it('should throw error if cropper is not initialized', () => {
    expect(() => {
      componentInstance.confirm();
    }).toThrowError('Cropper has not been initialized');
  });
});
