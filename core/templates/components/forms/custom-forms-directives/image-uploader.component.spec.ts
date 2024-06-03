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
 * @fileoverview Unit tests for ImageUploaderComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ContextService} from 'services/context.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ImageUploaderModalComponent} from './image-uploader-modal.component';
import {ImageUploaderComponent} from './image-uploader.component';

describe('ImageUploaderComponent', () => {
  let fixture: ComponentFixture<ImageUploaderComponent>;
  let component: ImageUploaderComponent;
  let contextService: ContextService;
  let imageUploadHelperService: ImageUploadHelperService;
  let ngbModal: NgbModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ImageUploaderComponent,
        ImageUploaderModalComponent,
        MockTranslatePipe,
      ],
      providers: [ImageUploadHelperService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageUploaderComponent);
    component = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
    ngbModal = TestBed.inject(NgbModal);
  });

  it('should set uploaded and editable thumbnail on initialization', () => {
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('expId');
    component.filename = 'thumbnail-1';

    expect(component.imageIsLoading).toBeTrue();

    component.ngOnInit();

    expect(component.editableImageDataUrl).toBe(
      '/assetsdevhandler/exploration/expId/assets/thumbnail/thumbnail-1'
    );
    expect(component.uploadedImage).toBe(
      '/assetsdevhandler/exploration/expId/assets/thumbnail/thumbnail-1'
    );
    expect(component.imageIsLoading).toBeFalse();
  });

  it(
    'should throw error if no image is present for a preview during file' +
      ' changed',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue(undefined);
      component.filename = 'thumbnail-1';

      expect(() => {
        component.ngOnInit();
      }).toThrowError('No image present for preview');
    }
  );

  it('should display placeholder image when filename is null', () => {
    component.filename = '';

    expect(component.hidePlaceholder).toBeTrue();

    component.ngOnInit();

    // Since a image is unavailable a placeholder will be used. Hence,
    // the value of hidePlaceholder should not change.
    expect(component.hidePlaceholder).toBeTrue();
  });

  it(
    'should not show image uploader modal if editing image is' + ' disabled',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');
      component.disabled = true;
      spyOn(ngbModal, 'open');

      expect(component.openInUploadMode).toBe(false);

      component.showImageUploaderModal();

      // Here, openInUpload mode is not set as which means, showImageUploaderModal
      // returned as soon as the first check was executed.
      expect(component.openInUploadMode).toBe(false);
      expect(ngbModal.open).not.toHaveBeenCalled();
    }
  );

  it(
    'should show image uploader modal when user clicks on edit button and' +
      ' save background color if not opened in upload mode',
    fakeAsync(() => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');
      // Modal is not opened in upload mode.
      class MockNgbModalRef {
        result = Promise.resolve({
          dimensions: {
            height: 50,
            width: 50,
          },
          openInUploadMode: false,
          newThumbnailDataUrl: 'data:image/png;base64,xyz',
          newBgColor: '#newcol',
        });

        componentInstance = {
          bgColor: null,
          allowedBgColors: [],
          aspectRatio: null,
          dimensions: null,
          previewDescription: null,
          previewDescriptionBgColor: null,
          previewFooter: null,
          previewTitle: null,
          uploadedImage: null,
          uploadedImageMimeType: null,
          tempBgColor: null,
        };
      }
      let ngbModalRef = new MockNgbModalRef();

      component.disabled = false;
      component.bgColor = '#ff9933';

      spyOn(ngbModal, 'open').and.returnValue(ngbModalRef as NgbModalRef);
      spyOn(
        imageUploadHelperService,
        'convertImageDataToImageFile'
      ).and.returnValue(new File([''], 'filename', {type: 'image/jpeg'}));

      const updateFilenameSpy = spyOn(component.updateFilename, 'emit');
      const updateBgColorSpy = spyOn(component.updateBgColor, 'emit');

      expect(component.imageIsLoading).toBe(true);

      component.showImageUploaderModal();
      tick();

      expect(ngbModal.open).toHaveBeenCalledWith(ImageUploaderModalComponent, {
        backdrop: 'static',
      });
      expect(component.imageIsLoading).toBe(false);
      expect(updateFilenameSpy).toHaveBeenCalled();
      expect(updateBgColorSpy).toHaveBeenCalledWith('#newcol');
    })
  );

  it('should show correct placeholder image according to orientation', fakeAsync(() => {
    component.orientation = 'portrait';
    expect(component.isImageInPortraitMode()).toBeTrue();
    component.ngOnInit();
    expect(component.placeholderImageUrl).toContain(
      '/icons/story-image-icon.png'
    );

    component.orientation = 'landscape';
    expect(component.isImageInPortraitMode()).toBeFalse();
    component.ngOnInit();
    expect(component.placeholderImageUrl).toContain(
      '/icons/story-image-icon-landscape.png'
    );
  }));

  it(
    'should close image uploader modal when cancel button' + ' is clicked',
    fakeAsync(() => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');
      class MockNgbModalRef {
        componentInstance = {
          bgColor: null,
          allowedBgColors: null,
          aspectRatio: null,
          dimensions: null,
          previewDescription: null,
          previewDescriptionBgColor: null,
          previewFooter: null,
          previewTitle: null,
          uploadedImage: null,
          uploadedImageMimeType: null,
          tempBgColor: null,
        };
      }
      let ngbModalRef = new MockNgbModalRef();

      component.disabled = false;
      component.allowedBgColors = ['#ff9933'];

      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          componentInstance: ngbModalRef,
          result: Promise.reject('cancel'),
        } as NgbModalRef;
      });

      component.showImageUploaderModal();

      expect(ngbModal.open).toHaveBeenCalledWith(ImageUploaderModalComponent, {
        backdrop: 'static',
      });
    })
  );
});
