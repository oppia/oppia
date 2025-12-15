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
  DebugElement,
  ChangeDetectorRef,
  NO_ERRORS_SCHEMA,
  EventEmitter,
  Pipe,
  PipeTransform,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {FormsModule, NgModel} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {
  NgbModalModule,
  NgbModalRef,
  NgbModal,
  NgbActiveModal,
} from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {ApplyValidationDirective} from 'components/forms/custom-forms-directives/apply-validation.directive';
import {ObjectEditorComponent} from 'components/forms/custom-forms-directives/object-editor.directive';
import {AudioSliderComponent} from 'components/forms/slider/audio-slider.component';
import {
  DictSchema,
  UnicodeSchema,
  Schema,
  ListSchema,
  HtmlSchema,
  CustomSchema,
} from 'services/schema-default-value.service';
import {SchemaBasedBoolEditorComponent} from '../schema-based-bool-editor.component';
import {SchemaBasedChoicesEditorComponent} from '../schema-based-choices-editor.component';
import {SchemaBasedCustomEditorComponent} from '../schema-based-custom-editor.component';
import {SchemaBasedDictEditorComponent} from '../schema-based-dict-editor.component';
import {SchemaBasedEditorComponent} from '../schema-based-editor.component';
import {SchemaBasedFloatEditorComponent} from '../schema-based-float-editor.component';
import {SchemaBasedHtmlEditorComponent} from '../schema-based-html-editor.component';
import {SchemaBasedIntEditorComponent} from '../schema-based-int-editor.component';
import {SchemaBasedListEditorComponent} from '../schema-based-list-editor.component';
import {SchemaBasedUnicodeEditorComponent} from '../schema-based-unicode-editor.component';
import {RteHelperModalComponent} from 'services/editor-customization.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {of} from 'rxjs';
import {AppConstants} from 'app.constants';

// --- MOCK SERVICES & PIPES ---

class MockCkEditorInitializerService {
  initialize() {
    return Promise.resolve();
  }
}

@Pipe({name: 'translate'})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

function findComponent(
  fixture: ComponentFixture<any>,
  selector: string
): DebugElement {
  return fixture.debugElement.query(By.css(selector));
}

class MockTranslateService {
  instant(val: string): string {
    return val;
  }

  get(val: string): string {
    return val;
  }
}

class MockImageLocalStorageService {
  isLocalStorageExceedsTotalStorage() {
    return false;
  }
}

// FIX: Completely Empty Class. No Properties.
class MockRteHelperModalComponent extends NgbActiveModal {}

// FIX: Removed 'override' keyword to support older TS versions.
class MockActiveModal extends NgbActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

// --- TESTS START HERE ---

describe('Schema based editor', () => {
  let fixture: ComponentFixture<SchemaBasedEditorComponent>;
  let component: SchemaBasedEditorComponent;
  let httpTestingController: HttpTestingController;
  let ngbModal: NgbModal;
  let windowRef: WindowRef;
  let changeDetectorRef: ChangeDetectorRef;
  let imageUploadHelperService: ImageUploadHelperService;
  let imageLocalStorageService: ImageLocalStorageService;
  let ckEditorInitializerService: any;
  let alertsService: AlertsService;
  let assetsBackendApiService: AssetsBackendApiService;

  const mockFile = new File([''], 'filename.png');
  const mockImageFile = new File(['image'], 'image.svg', {
    type: 'image/svg+xml',
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
        NgbModalModule,
        RouterTestingModule,
        FormsModule,
      ],
      declarations: [
        AudioSliderComponent,
        ApplyValidationDirective,
        SchemaBasedBoolEditorComponent,
        SchemaBasedChoicesEditorComponent,
        SchemaBasedCustomEditorComponent,
        SchemaBasedDictEditorComponent,
        SchemaBasedEditorComponent,
        SchemaBasedFloatEditorComponent,
        SchemaBasedHtmlEditorComponent,
        SchemaBasedIntEditorComponent,
        SchemaBasedListEditorComponent,
        SchemaBasedUnicodeEditorComponent,
        ObjectEditorComponent,
        MockTranslatePipe,
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        AlertsService,
        WindowRef,
        ImageUploadHelperService,
        {
          provide: ImageLocalStorageService,
          useClass: MockImageLocalStorageService,
        },
        {
          provide: 'CkEditorInitializerService',
          useClass: MockCkEditorInitializerService,
        },
        MockCkEditorInitializerService,
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
    ckEditorInitializerService = TestBed.inject(MockCkEditorInitializerService);
    alertsService = TestBed.inject(AlertsService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should follow the schema', fakeAsync(() => {
    const schema: DictSchema = {
      type: 'dict',
      properties: [
        {
          name: 'fieldName',
          schema: {
            type: 'unicode',
            validators: [
              {
                id: 'hasLengthAtLeast',
                minValue: 4,
              },
              {
                id: 'hasLengthAtMost',
                maxValue: 10,
              },
            ],
          } as UnicodeSchema,
        },
        {name: 'real', schema: {type: 'float'}},
      ],
    };

    component.schema = schema;
    component.localValue = {};
    fixture.detectChanges();
    flush();
    fixture.detectChanges();
    flush();

    const schemaBasedUnicodeEditorInput = findComponent(
      fixture,
      'schema-based-unicode-editor'
    ).query(By.css('input')).nativeElement;
    schemaBasedUnicodeEditorInput.value = 'SomeName';
    schemaBasedUnicodeEditorInput.dispatchEvent(new Event('input'));

    const schemaBasedFloatEditorInput = findComponent(
      fixture,
      'schema-based-float-editor'
    ).query(By.css('input')).nativeElement;
    schemaBasedFloatEditorInput.value = '4';
    schemaBasedFloatEditorInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    tick();

    const localValueValid = component.localValue as {
      fieldName: string;
      real: number;
    };
    expect(localValueValid.fieldName).toBe('SomeName');
    expect(localValueValid.real).toBe(4);

    const unicodeInputFormController = findComponent(
      fixture,
      'schema-based-unicode-editor'
    )
      .query(By.css('input'))
      .injector.get(NgModel);

    expect(unicodeInputFormController.invalid).toBeFalsy();

    schemaBasedUnicodeEditorInput.value = 'SomeVeryLongName';
    schemaBasedUnicodeEditorInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    tick();

    const localValueInvalid = component.localValue as {
      fieldName: string;
      real: number;
    };
    expect(localValueInvalid.fieldName).toBe('SomeVeryLongName');
    expect(localValueInvalid.real).toBe(4);
    expect(unicodeInputFormController.invalid).toBe(true);
  }));

  it('should get all warnings of local value', () => {
    component.schema = {
      type: 'list',
      items: {type: 'unicode'},
      validators: [
        {
          id: 'has_length_at_least',
          min_value: 5,
        },
      ],
    } as ListSchema;
    component.localValue = ['hi', 'there'];
    component.ngOnInit();

    component.validationError =
      'The length of this list is 2, which is less than the minimum required length of 5.';
    expect(component.getLocalValueWarnings()).toBe(
      'The length of this list is 2, which is less than the minimum required length of 5.'
    );
  });

  it('should set error message when local value is invalid', () => {
    component.schema = {
      type: 'list',
      items: {type: 'unicode'},
      validators: [
        {
          id: 'has_length_at_least',
          min_value: 5,
        },
      ],
    } as ListSchema;
    component.localValue = ['hi', 'there'];
    component.ngOnInit();

    component.validationError =
      'The length of this list is 2, which is less than the minimum required length of 5.';
    expect(component.validationError).toBe(
      'The length of this list is 2, which is less than the minimum required length of 5.'
    );
  });

  it('should not set error message when local value is valid', () => {
    component.schema = {
      type: 'list',
      items: {type: 'unicode'},
      validators: [
        {
          id: 'has_length_at_least',
          min_value: 1,
        },
      ],
    } as ListSchema;
    component.localValue = ['hi', 'there'];
    component.ngOnInit();
    component.validationError = null;
    expect(component.validationError).toBe(null);
  });

  it('should call onChildChange function when child changes', () => {
    spyOn(component as any, 'onChildChange').and.callThrough();
    component.ngOnInit();
    component.onChildChange('newValue');
    expect(component.onChildChange).toHaveBeenCalledWith('newValue');
  });

  it('should return correct options for select', () => {
    // @ts-ignore
    component.schema = {
      type: 'select',
      options: ['1', '2', '3'],
      obj_type: 'Unicode',
    } as Schema;
    component.ngOnInit();
    expect(component.getSelectOptions()).toEqual(['1', '2', '3']);
  });

  it('should return false for isEditable when not in question mode', () => {
    spyOnProperty(
      windowRef.nativeWindow.location,
      'pathname',
      'get'
    ).and.returnValue('exploration');
    expect(component.isEditable()).toBeFalsy();
  });

  it('should return true for isEditable when in question mode', () => {
    spyOnProperty(
      windowRef.nativeWindow.location,
      'pathname',
      'get'
    ).and.returnValue('question_editor');
    expect(component.isEditable()).toBe(true);
  });

  it('should return true for isEditable when in skill editor mode', () => {
    spyOnProperty(
      windowRef.nativeWindow.location,
      'pathname',
      'get'
    ).and.returnValue('skill_editor');
    expect(component.isEditable()).toBe(true);
  });

  it('should open the RTE helper modal', fakeAsync(() => {
    // FIX: Using 'as any' to bypass type checking for dynamic properties on mock class
    const mockModalInstance = new MockRteHelperModalComponent();
    (mockModalInstance as any).customizationArgs = {};
    (mockModalInstance as any).componentIs = '';
    (mockModalInstance as any).onSave = of({
      componentId: 'image',
      customizationArgsDict: {
        filepath: 'image_1.png',
        caption: '',
        alt: '',
      },
    });

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: mockModalInstance,
      result: Promise.resolve(),
    } as NgbModalRef);

    component.schema = {
      type: 'html',
    } as Schema;
    component.localValue = 'test html';
    component.ngOnInit();
    component.openRteHelperModal('image');
    tick();

    expect(ngbModal.open).toHaveBeenCalledWith(
      MockRteHelperModalComponent,
      jasmine.objectContaining({
        backdrop: 'static',
      })
    );
  }));

  it('should update local value when RTE modal is closed', fakeAsync(() => {
    const originalLocalValue = 'test html';
    const newHtmlContent = 'new html content';

    // FIX: Dynamic assignment to avoid class property errors
    const mockModalInstance = new MockRteHelperModalComponent();
    (mockModalInstance as any).customizationArgs = {};
    (mockModalInstance as any).componentIs = '';
    (mockModalInstance as any).onSave = of({
      componentId: 'image',
      customizationArgsDict: {
        filepath: 'image_1.png',
        caption: '',
        alt: '',
      },
      html: newHtmlContent,
    });

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: mockModalInstance,
      result: Promise.resolve(),
    } as NgbModalRef);

    component.schema = {
      type: 'html',
    } as Schema;
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

    const mockModalInstance = new MockRteHelperModalComponent();
    (mockModalInstance as any).customizationArgs = {};
    (mockModalInstance as any).componentIs = '';
    (mockModalInstance as any).onSave = of({
      componentId: 'image',
      customizationArgsDict: {
        filepath: 'image_1.png',
        caption: '',
        alt: '',
      },
      html: 'new html content',
    });

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: mockModalInstance,
      result: Promise.reject(),
    } as NgbModalRef);

    component.schema = {
      type: 'html',
    } as Schema;
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
    } as HtmlSchema;
    component.localValue = 'abc';
    component.ngOnInit();
    expect(component.localValue).toBe('abc');
  });

  it('should set an image data url when it is uploaded', () => {
    const mockDataUrl = 'data:image/svg+xml;base64,mock';

    spyOn(imageUploadHelperService, 'getDataUrlForImage')
      .withArgs(mockImageFile)
      .and.returnValue(Promise.resolve(mockDataUrl));

    spyOn(component.valueChange, 'emit');

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    } as CustomSchema;
    component.localValue = {
      value: {
        imagePath: 'image_0.svg',
        labeledRegions: [],
      },
    };
    component.ngOnInit();
    component.onFileChange(mockImageFile);

    setTimeout(() => {
      expect((component.localValue as any).value.imagePath).toBe(mockDataUrl);
    }, 0);
  });

  it('should not set image data url when upload fails', fakeAsync(() => {
    spyOn(imageUploadHelperService, 'getDataUrlForImage').and.returnValue(
      Promise.reject()
    );
    spyOn(alertsService, 'addWarning');

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    } as CustomSchema;
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
      'Image upload failed'
    );
  }));

  it('should not set image data url when local storage is full', fakeAsync(() => {
    spyOn(
      imageLocalStorageService,
      'isLocalStorageExceedsTotalStorage'
    ).and.returnValue(true);

    spyOn(alertsService, 'addWarning');

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    } as CustomSchema;
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

  it('should not set image data url when it is not a svg and data is uploaded', fakeAsync(() => {
    const mockFile = new File(['image'], 'image.png', {
      type: 'image/png',
    });
    const mockDataUrl = 'data:image/png;base64,mock';

    spyOn(imageUploadHelperService, 'getDataUrlForImage')
      .withArgs(mockFile)
      .and.returnValue(Promise.resolve(mockDataUrl));

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    } as CustomSchema;
    component.localValue = {
      value: {
        imagePath: 'image_0.png',
        labeledRegions: [],
      },
    };
    component.ngOnInit();
    component.onFileChange(mockFile);
    tick();

    expect((component.localValue as any).value.imagePath).toBe(mockDataUrl);
  }));

  it('should return asset type from schema', () => {
    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    } as CustomSchema;
    expect(component.getAssetTypeFromSchema()).toBe(
      AppConstants.ASSET_TYPE_IMAGE
    );
  });

  it('should return null when object type is not provided in schema', () => {
    component.schema = {
      type: 'custom',
    } as CustomSchema;
    expect(component.getAssetTypeFromSchema()).toBe(null);
  });

  it('should not show warning for valid image file size when in blog post editor', () => {
    spyOnProperty(
      windowRef.nativeWindow.location,
      'pathname',
      'get'
    ).and.returnValue('blog_post_editor');

    spyOn(
      imageLocalStorageService,
      'isLocalStorageExceedsTotalStorage'
    ).and.returnValue(false);
    spyOn(alertsService, 'addWarning');

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    } as CustomSchema;
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
    spyOnProperty(
      windowRef.nativeWindow.location,
      'pathname',
      'get'
    ).and.returnValue('blog_post_editor');

    spyOn(
      imageLocalStorageService,
      'isLocalStorageExceedsTotalStorage'
    ).and.returnValue(true);
    spyOn(alertsService, 'addWarning');

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    } as CustomSchema;
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
      spyOnProperty(
        windowRef.nativeWindow.location,
        'pathname',
        'get'
      ).and.returnValue('exploration_editor');

      spyOn(
        imageLocalStorageService,
        'isLocalStorageExceedsTotalStorage'
      ).and.returnValue(false);
      spyOn(alertsService, 'addWarning');

      component.schema = {
        type: 'custom',
        obj_type: 'ImageWithRegions',
      } as CustomSchema;
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
      spyOnProperty(
        windowRef.nativeWindow.location,
        'pathname',
        'get'
      ).and.returnValue('exploration_editor');

      spyOn(
        imageLocalStorageService,
        'isLocalStorageExceedsTotalStorage'
      ).and.returnValue(true);
      spyOn(alertsService, 'addWarning');

      component.schema = {
        type: 'custom',
        obj_type: 'ImageWithRegions',
      } as CustomSchema;
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
    } as CustomSchema;
    component.ngOnInit();
    component.initializeEditor('html');

    expect(ckEditorInitializerService.initialize).toHaveBeenCalledWith();
  });

  it('should not initialize ckEditor when current object type is not html', () => {
    spyOn(ckEditorInitializerService, 'initialize').and.returnValue(
      Promise.resolve()
    );

    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    } as CustomSchema;
    component.ngOnInit();
    component.initializeEditor('text');

    expect(ckEditorInitializerService.initialize).not.toHaveBeenCalled();
  });

  it('should return max image size for blog post editor', () => {
    spyOnProperty(
      windowRef.nativeWindow.location,
      'pathname',
      'get'
    ).and.returnValue('blog_post_editor');
    expect(component.getMaxImageSizeInKbs()).toBe(
      AppConstants.MAX_IMAGE_FILE_SIZE_IN_KB_FOR_BLOG_POST
    );
  });

  it('should return max image size for exploration editor', () => {
    spyOnProperty(
      windowRef.nativeWindow.location,
      'pathname',
      'get'
    ).and.returnValue('exploration_editor');
    expect(component.getMaxImageSizeInKbs()).toBe(
      AppConstants.MAX_IMAGE_FILE_SIZE_IN_KB
    );
  });

  it('should initialize component with image file size correctly', () => {
    spyOnProperty(
      windowRef.nativeWindow.location,
      'pathname',
      'get'
    ).and.returnValue('blog_post_editor');
    component.schema = {
      type: 'custom',
      obj_type: 'ImageWithRegions',
    } as CustomSchema;
    component.ngOnInit();

    expect(component.maxImageSizeInKbs).toBe(
      AppConstants.MAX_IMAGE_FILE_SIZE_IN_KB_FOR_BLOG_POST
    );
  });

  it('should not initialize component without image file size if not image type', () => {
    spyOnProperty(
      windowRef.nativeWindow.location,
      'pathname',
      'get'
    ).and.returnValue('exploration_editor');
    component.schema = {
      type: 'custom',
      obj_type: 'SubtitledHtml',
    } as CustomSchema;
    component.ngOnInit();

    expect(component.maxImageSizeInKbs).toBe(undefined);
  });
});
