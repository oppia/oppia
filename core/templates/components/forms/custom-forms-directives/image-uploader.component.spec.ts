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
  let imageUploaderParameters = {
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
    component.imageUploaderParameters = imageUploaderParameters;
  });

  it('should set editable image on initialization', () => {
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('expId');
    component.imageUploaderParameters.filename = 'image-filename';
    component.imageUploaderParameters.imageName = 'Thumbnail';
    component.ngOnInit();
    expect(component.editableImageDataUrl).toBe(
      '/assetsdevhandler/exploration/expId/assets/thumbnail/image-filename'
    );

    component.imageUploaderParameters.imageName = 'Banner';
    component.ngOnInit();
    expect(component.editableImageDataUrl).toBe(
      '/assetsdevhandler/exploration/expId/assets/image/image-filename'
    );
  });

  it(
    'should throw error if no image is present for a preview during file' +
      ' changed',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue(undefined);
      component.imageUploaderParameters.filename = 'thumbnail-1';

      expect(() => {
        component.ngOnInit();
      }).toThrowError('No image present for preview');
    }
  );

  it('should display placeholder image when filename is null', () => {
    component.imageUploaderParameters.filename = '';
    component.ngOnInit();
    expect(component.hidePlaceholder).toBeFalse();
  });

  it(
    'should not show image uploader modal if editing image is' + ' disabled',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');
      component.imageUploaderParameters.disabled = true;
      spyOn(ngbModal, 'open');

      component.showImageUploaderModal();

      expect(ngbModal.open).not.toHaveBeenCalled();
    }
  );

  it(
    'should show image uploader modal when user clicks on edit button and' +
      ' save background color if not opened in upload mode',
    fakeAsync(() => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');
      class MockNgbModalRef {
        result = Promise.resolve({
          dimensions: {
            height: 50,
            width: 50,
          },
          newThumbnailDataUrl: 'data:image/png;base64,xyz',
          newBgColor: '#newcol',
        });

        componentInstance = imageUploadHelperService;
      }
      let ngbModalRef = new MockNgbModalRef();

      component.imageUploaderParameters.disabled = false;
      component.imageUploaderParameters.bgColor = '#ff9933';

      spyOn(ngbModal, 'open').and.returnValue(ngbModalRef as NgbModalRef);
      spyOn(
        imageUploadHelperService,
        'convertImageDataToImageFile'
      ).and.returnValue(new File([''], 'filename', {type: 'image/jpeg'}));

      const imageSaveSpy = spyOn(component.imageSave, 'emit');

      component.showImageUploaderModal();
      tick();

      expect(ngbModal.open).toHaveBeenCalledWith(ImageUploaderModalComponent, {
        backdrop: 'static',
      });
      expect(imageSaveSpy).toHaveBeenCalled();
    })
  );

  it('should show correct placeholder image according to orientation', fakeAsync(() => {
    component.imageUploaderParameters.filename = '';
    component.imageUploaderParameters.orientation = 'portrait';
    expect(component.isImageInPortraitMode()).toBeTrue();
    component.ngOnInit();
    expect(component.placeholderImageUrl).toContain(
      '/icons/story-image-icon.png'
    );

    component.imageUploaderParameters.orientation = 'landscape';
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
        componentInstance = imageUploadHelperService;
      }
      let ngbModalRef = new MockNgbModalRef();

      component.imageUploaderParameters.disabled = false;
      component.imageUploaderParameters.allowedBgColors = ['#ff9933'];

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

  it('should return early if imageBlobData is null', fakeAsync(() => {
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('expId');
    class MockNgbModalRef {
      result = Promise.resolve({
        newImageDataUrl: 'data:image/png;base64,xyz',
        newBgColor: '#newcol',
      });
      componentInstance = imageUploadHelperService;
    }
    let ngbModalRef = new MockNgbModalRef();

    component.imageUploaderParameters.disabled = false;

    spyOn(ngbModal, 'open').and.returnValue(ngbModalRef as NgbModalRef);
    spyOn(
      imageUploadHelperService,
      'convertImageDataToImageFile'
    ).and.returnValue(null);

    const imageSaveSpy = spyOn(component.imageSave, 'emit');

    component.showImageUploaderModal();
    tick();

    expect(imageSaveSpy).not.toHaveBeenCalled();
  }));
});
