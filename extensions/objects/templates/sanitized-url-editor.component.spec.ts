// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for sanitized URL editor.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {ChangeDetectorRef} from '@angular/core';
import {
  async,
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {SanitizedUrlEditorComponent} from './sanitized-url-editor.component';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {DirectivesModule} from 'directives/directives.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';

describe('SanitizedUrlEditorComponent', () => {
  let component: SanitizedUrlEditorComponent;
  let fixture: ComponentFixture<SanitizedUrlEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        SharedFormsModule,
        DirectivesModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      declarations: [SanitizedUrlEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [TranslateService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SanitizedUrlEditorComponent);
    component = fixture.componentInstance;
  });

  it('should return SCHEMA when called', () => {
    expect(component.getSchema()).toEqual({
      type: 'unicode',
      validators: [
        {
          id: 'is_nonempty',
        },
        {
          id: 'is_regex_matched',
          regexPattern: '(^https:\\/\\/.*)|(^(?!.*:\\/\\/)(.*))',
        },
      ],
      ui_config: {
        placeholder: 'https://www.example.com',
      },
    });
  });

  it('should update value when the user types a url in the text field', () => {
    spyOn(component.valueChanged, 'emit');
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );
    component.value = '';

    component.updateValue('http://oppia.org/');

    expect(component.value).toBe('http://oppia.org/');
    expect(component.valueChanged.emit).toHaveBeenCalledWith(
      'http://oppia.org/'
    );
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should not update value when the value does not change', () => {
    spyOn(component.valueChanged, 'emit');
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );
    component.value = 'http://oppia.org/';

    component.updateValue('http://oppia.org/');

    expect(component.value).toBe('http://oppia.org/');
    expect(component.valueChanged.emit).not.toHaveBeenCalledWith(
      'http://oppia.org/'
    );
    expect(detectChangesSpy).not.toHaveBeenCalled();
  });

  it('should emit the correct form validity when validation changes', fakeAsync(() => {
    fixture.detectChanges();
    flush();
    // The statusChanges property in the form used in the component is an
    // observable which is triggered by changes to the form state in the
    // template. Since we are not doing template-based testing, we need to
    // mock the statusChanges property of the form.
    const mockFormStatusChangeEmitter = new EventEmitter();
    spyOnProperty(component.form, 'statusChanges').and.returnValue(
      mockFormStatusChangeEmitter
    );
    const validityChangeSpy = spyOn(component.validityChange, 'emit');
    component.ngAfterViewInit();

    expect(validityChangeSpy).not.toHaveBeenCalled();

    mockFormStatusChangeEmitter.emit('INVALID');
    // The subscription to statusChanges is asynchronous, so we need to
    // tick() to trigger the callback.
    tick();
    expect(validityChangeSpy).toHaveBeenCalledWith({validUrl: false});

    mockFormStatusChangeEmitter.emit();
    // The subscription to statusChanges is asynchronous, so we need to
    // tick() to trigger the callback.
    tick();
    expect(validityChangeSpy).toHaveBeenCalledWith({validUrl: true});
  }));
});
