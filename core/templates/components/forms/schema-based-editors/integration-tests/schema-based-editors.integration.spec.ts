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

import { DebugElement } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NgbTooltipModule, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { DynamicContentModule } from 'components/interaction-display/dynamic-content.module';
import { OppiaCkEditor4Module } from 'components/ck-editor-helpers/ckeditor4.module';
import { CodeMirrorModule } from 'components/code-mirror/codemirror.module';
import { ApplyValidationDirective } from 'components/forms/custom-forms-directives/apply-validation.directive';
import { CustomFormsComponentsModule } from 'components/forms/custom-forms-directives/custom-form-components.module';
import { ObjectEditorComponent } from 'components/forms/custom-forms-directives/object-editor.directive';
import { AudioSliderComponent } from 'components/forms/slider/audio-slider.component';
import { DirectivesModule } from 'directives/directives.module';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { MaterialModule } from 'modules/material.module';
import { DictSchema, UnicodeSchema } from 'services/schema-default-value.service';
import { MockTranslateModule } from 'tests/unit-test-utils';
import { SchemaBasedBoolEditorComponent } from '../schema-based-bool-editor.component';
import { SchemaBasedChoicesEditorComponent } from '../schema-based-choices-editor.component';
import { SchemaBasedCustomEditorComponent } from '../schema-based-custom-editor.component';
import { SchemaBasedDictEditorComponent } from '../schema-based-dict-editor.component';
import { SchemaBasedEditorComponent } from '../schema-based-editor.component';
import { SchemaBasedFloatEditorComponent } from '../schema-based-float-editor.component';
import { SchemaBasedHtmlEditorComponent } from '../schema-based-html-editor.component';
import { SchemaBasedIntEditorComponent } from '../schema-based-int-editor.component';
import { SchemaBasedListEditorComponent } from '../schema-based-list-editor.component';
import { SchemaBasedUnicodeEditor } from '../schema-based-unicode-editor.component';
import { RteHelperModalComponent } from 'services/editor-customization.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { CkEditorInitializerService } from 'components/forms/text-input/ck-editor-initializer.service';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';


export function findComponent<T>(
  fixture: ComponentFixture<T>,
  selector: string
): DebugElement {
  return fixture.debugElement.query(By.css(selector));
}

export class MockTranslateService {
  instant(val: string): string {
    return val;
  }

  get(val: string): string {
    return val;
  }
}

describe('Schema based editor', () => {
  let fixture: ComponentFixture<SchemaBasedEditorComponent>;
  let component: SchemaBasedEditorComponent;
  let httpTestingController: HttpTestingController;
  let ngbModal: NgbModal;
  let windowRef: WindowRef;
  let changeDetectorRef: ChangeDetectorRef;
  let imageUploadHelperService: ImageUploadHelperService;
  let imageLocalStorageService: ImageLocalStorageService;
  let ckEditorInitializerService: CkEditorInitializerService;
  let alertsService: AlertsService;
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
        SchemaBasedUnicodeEditor,
        ObjectEditorComponent,
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
    alertsService = TestBed.inject(AlertsService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);

    spyOn(changeDetectorRef.constructor.prototype, 'detectChanges');
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
        { name: 'real', schema: { type: 'float' } },
      ],
    };
    const schemaBasedEditorFixture = TestBed.createComponent(
      SchemaBasedEditorComponent
    );
    const schemaBasedEditorComponent =
      schemaBasedEditorFixture.componentInstance;
    schemaBasedEditorComponent.schema = schema;
    schemaBasedEditorComponent.localValue = {};
    schemaBasedEditorFixture.detectChanges();
    flush();
    schemaBasedEditorFixture.detectChanges();
    flush();

    const changeValuesInUI = (fieldName?: string, real?: number) => {
      if (fieldName !== undefined) {
        schemaBasedUnicodeEditorInput.value = fieldName;
        schemaBasedUnicodeEditorInput.dispatchEvent(new Event('input'));
      }

      if (real !== undefined) {
        schemaBasedFloatEditorInput.value = real;
        schemaBasedFloatEditorInput.dispatchEvent(new Event('input'));
      }
      schemaBasedEditorFixture.detectChanges();
      tick();
    };

    // eslint-disable-next-line max-len
    const expectTopLevelComponentValueToBe = (
      fieldNameValue: string,
      real: number
    ) => {
      const localValue = schemaBasedEditorComponent.localValue as {
        fieldName: string;
        real: number;
      };
      expect(localValue.fieldName).toBe(fieldNameValue);
      expect(localValue.real).toBe(real);
    };

    // Check that the initial values for the UI fields are populated correctly.
    const schemaBasedUnicodeEditorInput = findComponent(
      schemaBasedEditorFixture,
      'schema-based-unicode-editor'
    ).query(By.css('input')).nativeElement;
    const schemaBasedFloatEditorInput = findComponent(
      schemaBasedEditorFixture,
      'schema-based-float-editor'
    ).query(By.css('input')).nativeElement;
    const unicodeInputFormController = findComponent(
      schemaBasedEditorFixture,
      'schema-based-unicode-editor'
    )
      .query(By.css('input'))
      .injector.get(NgModel);
    expect(schemaBasedUnicodeEditorInput.value).toBe('');
    expect(schemaBasedFloatEditorInput.value).toBe('');


    changeValuesInUI('SomeName', 4);


    expectTopLevelComponentValueToBe('SomeName', 4);


    expect(unicodeInputFormController.invalid).toBeFalsy();
    changeValuesInUI('SomeVeryLongName');
    expectTopLevelComponentValueToBe('SomeVeryLongName', 4);
    expect(unicodeInputFormController.invalid).toBe(true);
  }));

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
    expect(component.getLocalValueWarnings()).toBe(
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
    expect(component.getSelectOptions()).toEqual(['1', '2', '3']);
  });

  it('should return false for isEditable when not in question mode', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'exploration'
    );
    expect(component.isEditable()).toBeFalsy();
  });

  it('should return true for isEditable when in question mode', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'question_editor'
    );
    expect(component.isEditable()).toBe(true);
  });

  it('should return true for isEditable when in skill editor mode', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'skill_editor'
    );
    expect(component.isEditable()).toBe(true);
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

    spyOn(imageLocalStorageService, 'isLocalStorageExceedsTotalStorage').and.returnValue(
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
    expect(component.getAssetTypeFromSchema()).toBe(
      AppConstants.ASSET_TYPE_IMAGE
    );
  });

  it('should return null when object type is not provided in schema', () => {
    component.schema = {
      type: 'custom',
    };
    expect(component.getAssetTypeFromSchema()).toBe(null);
  });

  it('should not show warning for valid image file size when in blog post editor', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'blog_post_editor'
    );

    spyOn(imageLocalStorageService, 'isLocalStorageExceedsTotalStorage').and.returnValue(
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

    spyOn(imageLocalStorageService, 'isLocalStorageExceedsTotalStorage').and.returnValue(
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

      spyOn(imageLocalStorageService, 'isLocalStorageExceedsTotalStorage').and.returnValue(
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

      spyOn(imageLocalStorageService, 'isLocalStorageExceedsTotalStorage').and.returnValue(
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
    component.initializeEditor('html');

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
    component.initializeEditor('text');

    expect(ckEditorInitializerService.initialize).not.toHaveBeenCalled();
  });

  it('should return max image size for blog post editor', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'blog_post_editor'
    );
    expect(component.getMaxImageSizeInKbs()).toBe(
      AppConstants.MAX_IMAGE_FILE_SIZE_IN_KB_FOR_BLOG_POST
    );
  });

  it('should return max image size for exploration editor', () => {
    spyOn(windowRef.nativeWindow.location, 'pathname').and.returnValue(
      'exploration_editor'
    );
    expect(component.getMaxImageSizeInKbs()).toBe(
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