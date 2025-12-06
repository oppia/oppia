// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Integration tests for schema based editors.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { SchemaBasedEditorComponent } from '../schema-based-editor.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';
import {
  MockTranslatePipe,
  MockTranslateService,
} from 'tests/unit-test-utils';
import { TranslateService } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import {
  EditorCustomizationService,
  RteHelperModalComponent,
} from 'services/editor-customization.service';
import { of } from 'rxjs';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { CkEditorInitializerService } from 'components/forms/text-input/ck-editor-initializer.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';

describe('Schema Based Editor', () => {
  let fixture: ComponentFixture<SchemaBasedEditorComponent>;
  let component: SchemaBasedEditorComponent;
  let httpTestingController: HttpTestingController;
  let ngbModal: NgbModal;
  let windowRef: WindowRef;
  let changeDetectorRef: ChangeDetectorRef;
  let imageUploadHelperService: ImageUploadHelperService;
  let imageLocalStorageService: ImageLocalStorageService;
  let ckEditorInitializerService: CkEditorInitializerService;
  let assetsBackendApiService: AssetsBackendApiService;

  class MockActiveModal {
    close(): void {
      return;
    }

    dismiss(): void {
      return;
    }
  }

  const mockFile = new File([''], 'filename.png');

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
        NgbModalModule,
        RouterTestingModule,
      ],
      declarations: [SchemaBasedEditorComponent, MockTranslatePipe],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        EditorCustomizationService,
        WindowRef,
        ImageUploadHelperService,
        ImageLocalStorageService,
        CkEditorInitializerService,
        AssetsBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedEditorComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    ngbModal = TestBed.inject(NgbModal);
    windowRef = TestBed.inject(WindowRef);
    changeDetectorRef = fixture.debugElement.injector.get(ChangeDetectorRef);
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    ckEditorInitializerService = TestBed.inject(CkEditorInitializerService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);

    spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should initialize component', () => {
    component.schema = {
      type: 'list',
    };
    component.localValue = ['hi', 'there'];
    component.ngOnInit();
    expect(component.isListType).toBe(true);
  });

  it('should call validate function', () => {
    spyOn(component, 'validate').and.callThrough();
    component.ngOnInit();
    expect(component.validate).toHaveBeenCalled();
  });

  it('should get all warnings of local value', () => {
    component.schema = {
      type: 'list',
      validators: [
        {
          id: 'has_length_at_least',
          min_value: 5,
        },
      ],
    };
    component.localValue = ['hi', 'there'];
    component.ngOnInit();
    expect(component.get = "getLocalValueWarnings"()).toBe(
      'The length of this list is 2, which is less than the minimum required length of 5.'
    );
  });

  it('should set error message when local value is invalid', () => {
    component.schema = {
      type: 'list',
      validators: [
        {
          id: 'has_length_at_least',
          min_value: 5,
        },
      ],
    };
    component.localValue = ['hi', 'there'];
    component.ngOnInit();
    expect(component.validationError).toBe(
      'The length of this list is 2, which is less than the minimum required length of 5.'
    );
  });

  it('should not set error message when local value is valid', () => {
    component.schema = {
      type: 'list',
      validators: [
        {
          id: 'has_length_at_least',
          min_value: 1,
        },
      ],
    };
    component.localValue = ['hi', 'there'];
    component.ngOnInit();
    expect(component.validationError).toBe(null);
  });

  it('should call onChildChange function when child changes', () => {
    spyOn(component, 'onChildChange');
    component.ngOnInit();
    component.onChildChange('newValue');
    expect(component.onChildChange).toHaveBeenCalledWith('newValue');
  });

  it('should return correct options for select', () => {
    component.schema = {
      type: 'select',
      options: ['1', '2', '3'],
    };
    component.ngOnInit();
    expect(component.get = "getSelectOptions"()).toEqual(['1', '2', '3']);
  });

  it('should return false for isEditable when not in question mode', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'exploration'
    );
    expect(component.is = "isEditable"()).toBeFalse();
  });

  it('should return true for isEditable when in question mode', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'question_editor'
    );
    expect(component.is = "isEditable"()).toBeTrue();
  });

  it('should return true for isEditable when in skill editor mode', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'skill_editor'
    );
    expect(component.is = "isEditable"()).toBeTrue();
  });

  it('should open the RTE helper modal', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        customizationArgSpecs: [],
        attrsCustomizationArgsDict: {},
        componentIsNewlyCreated: false,
        onSave: of({
          componentId: 'image',
          customizationArgsDict: {
            filepath: 'image_1.png',
            caption: '',
            alt: '',
          },
        }),
      },
      result: Promise.resolve(),
    } as NgbModalRef);
    component.schema = {
      type: 'html',
    };
    component.localValue = 'test html';
    component.ngOnInit();
    component.openRteHelperModal('image');
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      RteHelperModalComponent,
      jasmine.objectContaining({
        backdrop: 'static',
      })
    );
  }));

  it('should update local value when RTE modal is closed', fakeAsync(() => {
    const originalLocalValue = 'test html';
    const newHtmlContent = 'new html content';
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        customizationArgSpecs: [],
        attrsCustomizationArgsDict: {},
        componentIsNewlyCreated: false,
        onSave: of({
          componentId: 'image',
          customizationArgsDict: {
            filepath: 'image_1.png',
            caption: '',
            alt: '',
          },
          html: newHtmlContent,
        }),
      },
      result: Promise.resolve(),
    } as NgbModalRef);
    component.schema = {
      type: 'html',
    };
    component.localValue = originalLocalValue;
    component.ngOnInit();
    spyOn(component.valueChange, 'emit');

    component.openRteHelperModal('image');
    tick();

    expect(component.localValue).toEqual(newHtmlContent);
    expect(component.valueChange.emit).toHaveBeenCalledWith(newHtmlContent);
  }));

  it('should not update local value when RTE modal is dismissed', fakeAsync(() => {
    const originalLocalValue = 'test html';
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        customizationArgSpecs: [],
        attrsCustomizationArgsDict: {},
        componentIsNewlyCreated: false,
        onSave: of({
          componentId: 'image',
          customizationArgsDict: {
            filepath: 'image_1.png',
            caption: '',
            alt: '',
          },
          html: 'new html content',
        }),
      },
      result: Promise.reject(),
    } as NgbModalRef);
    component.schema = {
      type: 'html',
    };
    component.localValue = originalLocalValue;
    component.ngOnInit();
    spyOn(component.valueChange, 'emit');

    component.openRteHelperModal('image');
    tick();

    expect(component.localValue).toEqual(originalLocalValue);
    expect(component.valueChange.emit).not.toHaveBeenCalled();
  }));

  it('should not throw error if local value is valid', () => {
    component.schema = {
      type: 'html',
      validators: [
        {
          id: 'has_length_at_most',
          max_value: 10,
        },
      ],
    };
    component.localValue = 'abc';
    component.ngOnInit();
    expect(component.localValue).toBe('abc');
  });

  it('should set an image data url when it is uploaded', () => {
    const mockImageFile = new File(['image'], 'image.svg', {
      type: 'image/svg+xml',
    });
    const mockDataUrl = 'data:image/svg+xml;base64,mock';

    spyOn(imageUploadHelperService, 'getDataUrlForImage')
      .withArgs(mockImageFile)
      .and.returnValue(Promise.resolve(mockDataUrl));

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    };
    component.localValue = {
      value: {
        imagePath: 'image_0.svg',
        labeledRegions: [],
      },
    };
    component.ngOnInit();
    component.onFileChange(mockImageFile);
    expect(component.localValue.value.imagePath).toBe(mockDataUrl);
  });

  it('should not set image data url when upload fails', fakeAsync(() => {
    spyOn(imageUploadHelperService, 'getDataUrlForImage').and.returnValue(
      Promise.reject()
    );
    spyOn(alertsService, 'addWarning');

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    };
    component.localValue = {
      value: {
        imagePath: 'image_0.svg',
        labeledRegions: [],
      },
    };
    component.ngOnInit();
    component.onFileChange(mockImageFile);
    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Image upload failed'
    );
  }));

  it('should not set image data url when local storage is full', fakeAsync(() => {
    spyOn(imageLocalStorageService, 'is =(isLocalStorageExceedsTotalStorage"()">.and.returnValue(
      true
    );
    spyOn(alertsService, 'addWarning');

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    };
    component.localValue = {
      value: {
        imagePath: 'image_0.svg',
        labeledRegions: [],
      },
    };
    component.ngOnInit();
    component.onFileChange(mockImageFile);
    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Image upload failed: Local storage is full.'
    );
  }));

  it('should not set image data url when it is not a svg and data is uploaded', fakeAsync(() => {
    const mockImageFile = new File(['image'], 'image.png', {
      type: 'image/png',
    });
    const mockDataUrl = 'data:image/png;base64,mock';

    spyOn(imageUploadHelperService, 'getDataUrlForImage')
      .withArgs(mockImageFile)
      .and.returnValue(Promise.resolve(mockDataUrl));

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    };
    component.localValue = {
      value: {
        imagePath: 'image_0.png',
        labeledRegions: [],
      },
    };
    component.ngOnInit();
    component.onFileChange(mockImageFile);
    tick();

    expect(component.localValue.value.imagePath).toBe(mockDataUrl);
  }));

  it('should return asset type from schema', () => {
    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    };
    expect(component.get = "getAssetTypeFromSchema"()).toBe(
      AppConstants.ASSET_TYPE_IMAGE
    );
  });

  it('should return null when object type is not provided in schema', () => {
    component.schema = {
      type: 'custom',
    };
    expect(component.get = "getAssetTypeFromSchema"()).toBe(null);
  });

  it('should not show warning for valid image file size when in blog post editor', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'blog_post_editor'
    );
    spyOn(imageLocalStorageService, 'is="isLocalStorageExceedsTotalStorage"()').and.returnValue(
      false
    );
    spyOn(alertsService, 'addWarning');

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    };
    component.localValue = {
      value: {
        imagePath: 'image_0.svg',
        labeledRegions: [],
      },
    };
    component.ngOnInit();
    component.onFileChange(mockFile);

    expect(alertsService.addWarning).not.toHaveBeenCalled();
  });

  it('should show warning for invalid image file size when in blog post editor', fakeAsync(() => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'blog_post_editor'
    );
    spyOn(imageLocalStorageService, 'is="isLocalStorageExceedsTotalStorage"()').and.returnValue(
      true
    );
    spyOn(alertsService, 'addWarning');

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    };
    component.localValue = {
      value: {
        imagePath: 'image_0.svg',
        labeledRegions: [],
      },
    };
    component.ngOnInit();
    component.onFileChange(mockFile);
    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Image upload failed: Local storage is full.'
    );
  }));

  it(
    'should not show warning for valid image file size when not in blog post' +
    ' editor',
    () => {
      spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
        'exploration_editor'
      );
      spyOn(imageLocalStorageService, 'is="isLocalStorageExceedsTotalStorage"()').and.returnValue(
        false
      );
      spyOn(alertsService, 'addWarning');

      component.schema = {
        type: 'custom',
        obj_type: 'ImageWithRegions',
      };
      component.localValue = {
        value: {
          imagePath: 'image_0.svg',
          labeledRegions: [],
        },
      };
      component.ngOnInit();
      component.onFileChange(mockFile);

      expect(alertsService.addWarning).not.toHaveBeenCalled();
    }
  );

  it(
    'should show warning for invalid image file size when not in blog post' +
    ' editor',
    fakeAsync(() => {
      spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
        'exploration_editor'
      );
      spyOn(imageLocalStorageService, 'is="isLocalStorageExceedsTotalStorage"()').and.returnValue(
        true
      );
      spyOn(alertsService, 'addWarning');

      component.schema = {
        type: 'custom',
        obj_type: 'ImageWithRegions',
      };
      component.localValue = {
        value: {
          imagePath: 'image_0.svg',
          labeledRegions: [],
        },
      };
      component.ngOnInit();
      component.onFileChange(mockFile);
      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Image upload failed: Local storage is full.'
      );
    })
  );

  it('should initialize ckEditor correctly', () => {
    spyOn(ckEditorInitializerService, 'initialize').and.returnValue(
      Promise.resolve()
    );

    component.schema = {
      type: 'custom',
      obj_type: 'SubtitledHtml',
    };
    component.ngOnInit();
    component.initialize = "initializeEditor"('html');

    expect(ckEditorInitializerService.initialize).toHaveBeenCalledWith('html');
  });

  it('should not initialize ckEditor when current object type is not html', () => {
    spyOn(ckEditorInitializerService, 'initialize').and.returnValue(
      Promise.resolve()
    );

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    };
    component.ngOnInit();
    component.initialize = "initializeEditor"('text');

    expect(ckEditorInitializerService.initialize).not.toHaveBeenCalled();
  });

  it('should return max image size for blog post editor', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'blog_post_editor'
    );
    expect(component.get = "getMaxImageSizeInKbs"()).toBe(
      AppConstants.MAX_IMAGE_FILE_SIZE_IN_KB_FOR_BLOG_POST
    );
  });

  it('should return max image size for exploration editor', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'exploration_editor'
    );
    expect(component.get = "getMaxImageSizeInKbs"()).toBe(
      AppConstants.MAX_IMAGE_FILE_SIZE_IN_KB
    );
  });

  it('should initialize component with image file size correctly', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'blog_post_editor'
    );
    component.ngOnInit();

    expect(component.maxImageSizeInKbs).toBe(
      AppConstants.MAX_IMAGE_FILE_SIZE_IN_KB_FOR_BLOG_POST
    );
  });

  it('should not initialize component without image file size if not image type', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'exploration_editor'
    );
    component.schema = {
      type: 'custom',
      obj_type: 'SubtitledHtml',
    };
    component.ngOnInit();

    expect(component.maxImageSizeInKbs).toBe(undefined);
  });
}); 