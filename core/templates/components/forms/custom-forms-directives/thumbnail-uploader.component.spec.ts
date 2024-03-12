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
 * @fileoverview Unit tests for ThumbnailUploaderComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, SimpleChanges} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {of} from 'rxjs';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ContextService} from 'services/context.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {EditThumbnailModalComponent} from './edit-thumbnail-modal.component';
import {ThumbnailUploaderComponent} from './thumbnail-uploader.component';

describe('ThumbnailUploaderComponent', () => {
  let fixture: ComponentFixture<ThumbnailUploaderComponent>;
  let component: ThumbnailUploaderComponent;
  let contextService: ContextService;
  let imageUploadHelperService: ImageUploadHelperService;
  let assetsBackendApiService: AssetsBackendApiService;
  let imageLocalStorageService: ImageLocalStorageService;
  let alertsService: AlertsService;
  let ngbModal: NgbModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ThumbnailUploaderComponent,
        EditThumbnailModalComponent,
        MockTranslatePipe,
      ],
      providers: [ImageUploadHelperService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThumbnailUploaderComponent);
    component = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    alertsService = TestBed.inject(AlertsService);
    ngbModal = TestBed.inject(NgbModal);
  });

  it('should set uploaded and editable thumbnail on initialization', () => {
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('expId');
    component.filename = 'thumbnail-1';

    expect(component.thumbnailIsLoading).toBeTrue();

    component.ngOnInit();

    expect(component.editableThumbnailDataUrl).toBe(
      '/assetsdevhandler/exploration/expId/assets/thumbnail/thumbnail-1'
    );
    expect(component.uploadedImage).toBe(
      '/assetsdevhandler/exploration/expId/assets/thumbnail/thumbnail-1'
    );
    expect(component.thumbnailIsLoading).toBeFalse();
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

    // Since a thumbnail is unavailable a placeholder will be used. Hence,
    // the value of hidePlaceholder should not change.
    expect(component.hidePlaceholder).toBeTrue();
  });

  it(
    'should update the thumbnail image when thumbnail filename' + ' changes',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');
      component.filename = 'thumbnail-1';
      let changes: SimpleChanges = {
        filename: {
          currentValue: 'thumbnail-2',
          previousValue: 'thumbnail-1',
          firstChange: false,
          isFirstChange: () => false,
        },
      };
      component.ngOnInit();

      expect(component.editableThumbnailDataUrl).toBe(
        '/assetsdevhandler/exploration/expId/assets/thumbnail/thumbnail-1'
      );

      component.ngOnChanges(changes);

      expect(component.editableThumbnailDataUrl).toBe(
        '/assetsdevhandler/exploration/expId/assets/thumbnail/thumbnail-2'
      );
      expect(component.thumbnailIsLoading).toBeFalse();
    }
  );

  it(
    'should not update the thumbnail image when new thumbnail is same as' +
      ' the old one',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');
      spyOn(
        imageUploadHelperService,
        'getTrustedResourceUrlForThumbnailFilename'
      );
      component.filename = 'thumbnail-1';
      let changes: SimpleChanges = {
        filename: {
          currentValue: 'thumbnail-1',
          previousValue: 'thumbnail-1',
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.thumbnailIsLoading = false;

      component.ngOnChanges(changes);

      expect(
        imageUploadHelperService.getTrustedResourceUrlForThumbnailFilename
      ).not.toHaveBeenCalled();
      expect(component.thumbnailIsLoading).toBeFalse();
    }
  );

  it(
    'should throw error if no image is present for a preview during file' +
      ' changed',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue(undefined);

      expect(() => {
        component.filenameChanges('newFile', 'oldFile');
      }).toThrowError('No image present for preview');
    }
  );

  it(
    'should not show edit thumbnail modal if editing thumbnail is' +
      ' disabled',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');
      component.disabled = true;
      spyOn(ngbModal, 'open');

      expect(component.openInUploadMode).toBe(false);

      component.showEditThumbnailModal();

      // Here, openInUpload mode is not set as which means, showEditThumbnailModal
      // returned as soon as the first check was executed.
      expect(component.openInUploadMode).toBe(false);
      expect(ngbModal.open).not.toHaveBeenCalled();
    }
  );

  it(
    'should show edit thumbnail modal when user clicks on edit button and' +
      ' post thumbnail to server if local storage is not used and modal is' +
      ' opened in upload mode',
    fakeAsync(() => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');
      class MockNgbModalRef {
        result = Promise.resolve({
          dimensions: {
            height: 50,
            width: 50,
          },
          openInUploadMode: true,
          newThumbnailDataUrl: 'data:image/png;base64,xyz',
          newBgColor: '#newcol',
        });

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

      // Set useLocalStorage as false to trigger fetching.
      component.useLocalStorage = false;
      component.disabled = false;
      component.bgColor = '#ff9933';
      let promise = of({
        filename: 'filename',
      });

      spyOn(ngbModal, 'open').and.returnValue(ngbModalRef as NgbModalRef);
      spyOn(imageUploadHelperService, 'generateImageFilename').and.returnValue(
        'image_file_name.svg'
      );
      spyOn(
        imageUploadHelperService,
        'convertImageDataToImageFile'
      ).and.returnValue(new File([''], 'filename', {type: 'image/jpeg'}));
      spyOn(assetsBackendApiService, 'postThumbnailFile').and.returnValue(
        promise
      );
      spyOn(promise.toPromise(), 'then').and.resolveTo({filename: 'filename'});

      const updateFilenameSpy = spyOn(component.updateFilename, 'emit');
      const updateBgColorSpy = spyOn(component.updateBgColor, 'emit');

      expect(component.thumbnailIsLoading).toBe(true);

      component.showEditThumbnailModal();
      tick();

      expect(ngbModal.open).toHaveBeenCalledWith(EditThumbnailModalComponent, {
        backdrop: 'static',
      });
      expect(component.tempImageName).toBe('image_file_name.svg');
      expect(component.uploadedImage).toBe('data:image/png;base64,xyz');
      expect(component.thumbnailIsLoading).toBe(false);
      expect(updateFilenameSpy).toHaveBeenCalledWith('image_file_name.svg');
      expect(updateBgColorSpy).toHaveBeenCalledWith('#newcol');
    })
  );

  it(
    'should show edit thumbnail modal when user clicks on edit button and' +
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

      component.useLocalStorage = false;
      component.disabled = false;
      component.bgColor = '#ff9933';

      spyOn(ngbModal, 'open').and.returnValue(ngbModalRef as NgbModalRef);
      spyOn(
        imageUploadHelperService,
        'convertImageDataToImageFile'
      ).and.returnValue(new File([''], 'filename', {type: 'image/jpeg'}));

      const updateFilenameSpy = spyOn(component.updateFilename, 'emit');
      const updateBgColorSpy = spyOn(component.updateBgColor, 'emit');

      expect(component.thumbnailIsLoading).toBe(true);

      component.showEditThumbnailModal();
      tick();

      expect(ngbModal.open).toHaveBeenCalledWith(EditThumbnailModalComponent, {
        backdrop: 'static',
      });
      expect(component.thumbnailIsLoading).toBe(false);
      expect(updateFilenameSpy).not.toHaveBeenCalled();
      expect(updateBgColorSpy).toHaveBeenCalledWith('#newcol');
    })
  );

  it(
    'should show edit thumbnail modal when user clicks on edit button and' +
      ' save uploaded thumbnail to local storage if local storage' +
      ' is used',
    fakeAsync(() => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');
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

      component.useLocalStorage = true;
      component.disabled = false;
      component.allowedBgColors = ['#ff9933'];

      const imageSaveSpy = spyOn(component.imageSave, 'emit');

      spyOn(ngbModal, 'open').and.returnValue(ngbModalRef as NgbModalRef);
      spyOn(imageUploadHelperService, 'generateImageFilename').and.returnValue(
        'image_file_name.svg'
      );
      spyOn(imageLocalStorageService, 'saveImage');
      spyOn(imageLocalStorageService, 'setThumbnailBgColor');

      expect(component.thumbnailIsLoading).toBe(true);

      component.showEditThumbnailModal();
      tick();

      expect(ngbModal.open).toHaveBeenCalledWith(EditThumbnailModalComponent, {
        backdrop: 'static',
      });
      expect(component.thumbnailIsLoading).toBe(false);
      expect(imageLocalStorageService.saveImage).toHaveBeenCalledWith(
        'image_file_name.svg',
        'data:image/png;base64,xyz'
      );
      expect(imageLocalStorageService.setThumbnailBgColor).toHaveBeenCalledWith(
        '#newcol'
      );
      expect(imageSaveSpy).toHaveBeenCalled();
    })
  );

  it(
    'should close edit thumbnail modal when cancel button' + ' is clicked',
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

      component.showEditThumbnailModal();

      expect(ngbModal.open).toHaveBeenCalledWith(EditThumbnailModalComponent, {
        backdrop: 'static',
      });
    })
  );

  it('should raise an alert if an empty file is uploaded', () => {
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('expId');
    spyOn(alertsService, 'addWarning');
    spyOn(
      imageUploadHelperService,
      'convertImageDataToImageFile'
    ).and.returnValue(null);

    component.saveThumbnailImageData('imageUrl', () => {});

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Could not get resampled file.'
    );
  });

  it('should throw error if no image is present for a preview', () => {
    spyOn(contextService, 'getEntityType').and.returnValue(undefined);
    // This is just a mock base 64 in order to test the FileReader event.
    let dataBase64Mock = 'VEhJUyBJUyBUSEUgQU5TV0VSCg==';
    const arrayBuffer = Uint8Array.from(window.atob(dataBase64Mock), c =>
      c.charCodeAt(0)
    );
    let file = new File([arrayBuffer], 'filename.mp3');

    expect(() => {
      component.postImageToServer(file, () => {});
    }).toThrowError('No image present for preview');
  });
});
