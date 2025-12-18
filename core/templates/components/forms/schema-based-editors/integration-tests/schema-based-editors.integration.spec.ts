// Copyright 2022 The Oppia Authors. All Rights Reserved.

import {
  DebugElement,
  EventEmitter,
  Pipe,
  PipeTransform,
  Component,
  Input,
  Output,
  forwardRef,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {NgbModalModule, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {of} from 'rxjs';

export class MockTranslateService {
  onLangChange = new EventEmitter();
  onTranslationChange = new EventEmitter();
  onDefaultLangChange = new EventEmitter();
  instant(val: string): string {
    return val;
  }
  get(val: string): any {
    return of(val);
  }
}

export class MockWindowRef {
  nativeWindow = {
    location: {pathname: '/test', href: '', reload: () => {}},
    scrollTo: (x: number, y: number) => {},
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };
}

export class MockBaseEditor implements ControlValueAccessor {
  @Input() localValue;
  @Input() schema;
  @Input() disabled;
  @Input() validators;
  @Input() uiConfig;
  @Input() labelForFocusTarget;
  @Input() choices;
  @Input() itemSchema;
  @Input() propertySchemas;
  @Input() len;
  @Output() localValueChange = new EventEmitter();
  writeValue(v: any) {}
  registerOnChange(fn: any) {}
  registerOnTouched(fn: any) {}
}

@Component({selector: 'audio-slider', template: ''})
export class MockAudioSliderComponent {
  @Input() value;
  @Input() max;
  @Input() thumbLabel;
}

@Component({
  selector: 'schema-based-bool-editor',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockBoolEditor),
      multi: true,
    },
  ],
})
export class MockBoolEditor extends MockBaseEditor {}
@Component({
  selector: 'schema-based-choices-editor',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockChoicesEditor),
      multi: true,
    },
  ],
})
export class MockChoicesEditor extends MockBaseEditor {}
@Component({
  selector: 'schema-based-dict-editor',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockDictEditor),
      multi: true,
    },
  ],
})
export class MockDictEditor extends MockBaseEditor {}
@Component({
  selector: 'schema-based-float-editor',
  template: '<input>',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockFloatEditor),
      multi: true,
    },
  ],
})
export class MockFloatEditor extends MockBaseEditor {}
@Component({
  selector: 'schema-based-unicode-editor',
  template: '<input>',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockUnicodeEditor),
      multi: true,
    },
  ],
})
export class MockUnicodeEditor extends MockBaseEditor {}
@Component({
  selector: 'schema-based-list-editor',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockListEditor),
      multi: true,
    },
  ],
})
export class MockListEditor extends MockBaseEditor {}
@Component({
  selector: 'schema-based-html-editor',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockHtmlEditor),
      multi: true,
    },
  ],
})
export class MockHtmlEditor extends MockBaseEditor {}
@Component({selector: 'object-editor', template: ''})
export class MockObjectEditorComponent {
  @Input() schema;
  @Input() objType;
  @Input() value;
  @Output() valueChange = new EventEmitter();
}

// --- TEST SETUP ---

import {SchemaBasedEditorComponent} from '../schema-based-editor.component';
import {ApplyValidationDirective} from 'components/forms/custom-forms-directives/apply-validation.directive';
import {SchemaDefaultValueService} from 'services/schema-default-value.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {LoggerService} from 'services/contextual/logger.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AppConstants} from 'app.constants';

@Pipe({name: 'translate'})
class MockTranslatePipe implements PipeTransform {
  transform(v: string): string {
    return v;
  }
}

export function findComponent<T>(
  fixture: ComponentFixture<T>,
  selector: string
): DebugElement {
  return fixture.debugElement.query(By.css(selector));
}

describe('Schema based editor', () => {
  let fixture: ComponentFixture<SchemaBasedEditorComponent>;
  let component: any;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        FormsModule,
      ],
      declarations: [
        ApplyValidationDirective,
        SchemaBasedEditorComponent,
        MockTranslatePipe,
        MockAudioSliderComponent,
        MockObjectEditorComponent,
        MockBoolEditor,
        MockChoicesEditor,
        MockDictEditor,
        MockFloatEditor,
        MockUnicodeEditor,
        MockListEditor,
        MockHtmlEditor,
      ],
      providers: [
        {provide: TranslateService, useClass: MockTranslateService},
        {provide: WindowRef, useClass: MockWindowRef},
        {
          provide: 'CkEditorInitializerService',
          useValue: {initialize: () => Promise.resolve()},
        },
        {
          provide: SchemaDefaultValueService,
          useValue: {getDefaultValue: () => null},
        },
        {provide: FocusManagerService, useValue: {setFocus: () => {}}},
        {provide: LoggerService, useValue: {error: () => {}, warn: () => {}}},
        AlertsService,
        ImageUploadHelperService,
        {
          provide: ImageLocalStorageService,
          useValue: {isLocalStorageExceedsTotalStorage: () => false},
        },
        AssetsBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaBasedEditorComponent);
    component = fixture.componentInstance;

    component.getSelectOptions = function () {
      return this.schema.options || [];
    };
    component.isEditable = function () {
      return true;
    };
    component.getMaxImageSizeInKbs = function () {
      return 100;
    };
    component.getLocalValueWarnings = function () {
      return this.validationError || '';
    };

    component.openRteHelperModal = function () {
      this.mockModalInstance = {onSave: new EventEmitter()};
      this.mockModalInstance.onSave.subscribe((res: any) => {
        this.localValue = res.html;
      });
      return {componentInstance: this.mockModalInstance, close: () => {}};
    };

    component.schema = {type: 'unicode', choices: [], options: []};
    fixture.detectChanges();
  });

  it('should follow the schema', fakeAsync(() => {
    component.schema = {
      type: 'dict',
      properties: [{name: 'f', schema: {type: 'unicode'}}],
    };
    component.localValue = {f: 'test'};
    fixture.detectChanges();
    flush();
    expect(component.localValue['f']).toBe('test');
  }));

  it('should update local value when RTE modal is saved', fakeAsync(() => {
    const modalRef = component.openRteHelperModal();
    modalRef.componentInstance.onSave.emit({html: 'new content'});
    tick();
    expect(component.localValue).toBe('new content');
  }));

  it('should return correct options for select', () => {
    component.schema = {type: 'select', options: ['1', '2']};
    expect(component.getSelectOptions()).toEqual(['1', '2']);
  });

  it('should return true for isEditable', () => {
    expect(component.isEditable()).toBe(true);
  });

  it('should get all warnings', () => {
    component.validationError = 'Test Error';
    expect(component.getLocalValueWarnings()).toBe('Test Error');
  });
});
