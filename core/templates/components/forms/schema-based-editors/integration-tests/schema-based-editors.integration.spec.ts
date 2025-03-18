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
 * @fileoverview Integration tests for Schema Based Editors
 */

import {DebugElement} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {FormsModule, NgModel, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {By} from '@angular/platform-browser';
import {NgbTooltipModule, NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {DynamicContentModule} from 'components/interaction-display/dynamic-content.module';
import {OppiaCkEditor4Module} from 'components/ck-editor-helpers/ckeditor4.module';
import {CodeMirrorModule} from 'components/code-mirror/codemirror.module';
import {ApplyValidationDirective} from 'components/forms/custom-forms-directives/apply-validation.directive';
import {CustomFormsComponentsModule} from 'components/forms/custom-forms-directives/custom-form-components.module';
import {ObjectEditorComponent} from 'components/forms/custom-forms-directives/object-editor.directive';
import {AudioSliderComponent} from 'components/forms/slider/audio-slider.component';
import {DirectivesModule} from 'directives/directives.module';
import {SharedPipesModule} from 'filters/shared-pipes.module';
import {MaterialModule} from 'modules/material.module';
import {DictSchema, UnicodeSchema} from 'services/schema-default-value.service';
import {MockTranslateModule} from 'tests/unit-test-utils';
import {SchemaBasedBoolEditorComponent} from '../schema-based-bool-editor.component';
import {SchemaBasedChoicesEditorComponent} from '../schema-based-choices-editor.component';
import {SchemaBasedCustomEditorComponent} from '../schema-based-custom-editor.component';
import {SchemaBasedDictEditorComponent} from '../schema-based-dict-editor.component';
import {SchemaBasedEditorComponent} from '../schema-based-editor.component';
import {SchemaBasedFloatEditorComponent} from '../schema-based-float-editor.component';
import {SchemaBasedHtmlEditorComponent} from '../schema-based-html-editor.component';
import {SchemaBasedIntEditorComponent} from '../schema-based-int-editor.component';
import {SchemaBasedListEditorComponent} from '../schema-based-list-editor.component';
import {SchemaBasedUnicodeEditor} from '../schema-based-unicode-editor.component';

// eslint-disable-next-line func-style
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
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CodeMirrorModule,
        CustomFormsComponentsModule,
        OppiaCkEditor4Module,
        DirectivesModule,
        DynamicContentModule,
        FormsModule,
        MatInputModule,
        MaterialModule,
        NgbTooltipModule,
        NgbModalModule,
        ReactiveFormsModule,
        SharedPipesModule,
        MockTranslateModule,
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
      providers: [{provide: TranslateService, useClass: MockTranslateService}],
    }).compileComponents();
  }));

  it('should follow the schema', fakeAsync(() => {
    // Create the component.
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

    // Change the values in the UI.
    changeValuesInUI('SomeName', 4);

    // Check that the changes are propagated correctly to the top level
    // component.
    expectTopLevelComponentValueToBe('SomeName', 4);

    // Check if the form validation becomes false when value is not valid.
    expect(unicodeInputFormController.invalid).toBeFalse();
    changeValuesInUI('SomeVeryLongName');
    expectTopLevelComponentValueToBe('SomeVeryLongName', 4);
    expect(unicodeInputFormController.invalid).toBeTrue();
  }));
});
