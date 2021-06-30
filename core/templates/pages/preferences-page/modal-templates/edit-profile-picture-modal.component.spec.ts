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

import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { EditProfilePictureModalComponent } from './edit-profile-picture-modal.component';
import Cropper from 'cropperjs';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Delete Topic Modal Component', () => {
  let fixture: ComponentFixture<EditProfilePictureModalComponent>;
  let componentInstance: EditProfilePictureModalComponent;
  let changeDetectorRef: ChangeDetectorRef;

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
    componentInstance.croppableImageRef = {
      nativeElement: document.createElement('img')
    };
    componentInstance.initializeCropper();
    expect(componentInstance.cropper).toBeDefined();
    expect(changeDetectorRef.detectChanges).toHaveBeenCalled();
  });

  it('should reset', () => {
    componentInstance.reset();
    expect(componentInstance.uploadedImage).toBeNull();
    expect(componentInstance.cropppedImageDataUrl).toEqual('');
  });

  it('should handle invalid image', () => {
    spyOn(componentInstance, 'reset');
    componentInstance.onInvalidImageLoaded();
    expect(componentInstance.reset).toHaveBeenCalled();
    expect(componentInstance.invalidImageWarningIsShown).toBeTrue();
  });

  it('should confirm profile picture', () => {
  //   let pictureDataUrl = 'picture_data';
  //   spyOnProperty(componentInstance, 'cropper').and.returnValue({
  //     getCroppedCanvas: (params) => {
  //       return pictureDataUrl;
  //     }
  //   });
  //   componentInstance.confirm();
  //   expect(componentInstance.cropppedImageDataUrl).toEqual(pictureDataUrl);
  });
});
