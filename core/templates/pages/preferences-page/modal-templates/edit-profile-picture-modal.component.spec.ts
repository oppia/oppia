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
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { EditProfilePictureModalComponent } from './edit-profile-picture-modal.component';

describe('Delete Topic Modal Component', () => {
  let fixture: ComponentFixture<EditProfilePictureModalComponent>;
  let componentInstance: EditProfilePictureModalComponent;

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
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProfilePictureModalComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize cropper', () => {
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
    };
    componentInstance.confirm();
    expect(componentInstance.cropppedImageDataUrl).toEqual(pictureDataUrl);
  });
});
