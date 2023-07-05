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
 * @fileoverview Module for the Custom Form components.
 */

import 'core-js/es7/reflect';
import 'zone.js';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { DynamicContentModule } from 'components/interaction-display/dynamic-content.module';
import { MaterialModule } from 'modules/material.module';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { TranslateModule } from '@ngx-translate/core';
import { CustomFormsComponentsModule } from './custom-forms-directives/custom-form-components.module';
import { SchemaBasedEditorComponent } from './schema-based-editors/schema-based-editor.component';
import { AudioSliderComponent } from './slider/audio-slider.component';
import { ObjectEditorComponent } from './custom-forms-directives/object-editor.directive';
import { DirectivesModule } from 'directives/directives.module';
import { SchemaBasedIntEditorComponent } from './schema-based-editors/schema-based-int-editor.component';
import { ApplyValidationDirective } from './custom-forms-directives/apply-validation.directive';
import { MatInputModule } from '@angular/material/input';
import { SchemaBasedFloatEditorComponent } from './schema-based-editors/schema-based-float-editor.component';
import { SchemaBasedBoolEditorComponent } from './schema-based-editors/schema-based-bool-editor.component';
import { SchemaBasedChoicesEditorComponent } from './schema-based-editors/schema-based-choices-editor.component';
import { SchemaBasedCustomEditorComponent } from './schema-based-editors/schema-based-custom-editor.component';
import { SchemaBasedDictEditorComponent } from './schema-based-editors/schema-based-dict-editor.component';
import { SchemaBasedHtmlEditorComponent } from './schema-based-editors/schema-based-html-editor.component';
import { OppiaCkEditor4Module } from 'components/ck-editor-helpers/ckeditor4.module';
import { MarkAudioAsNeedingUpdateModalComponent } from 'components/forms/forms-templates/mark-audio-as-needing-update-modal.component';
import { SchemaBasedListEditorComponent } from './schema-based-editors/schema-based-list-editor.component';
import { SchemaBasedExpressionEditorComponent } from './schema-based-editors/schema-based-expression-editor.component';
import { SchemaBasedUnicodeEditor } from './schema-based-editors/schema-based-unicode-editor.component';
import { CodeMirrorModule } from 'components/code-mirror/codemirror.module';
import { MarkTranslationsAsNeedingUpdateModalComponent } from './forms-templates/mark-translations-as-needing-update-modal.component';

@NgModule({
  imports: [
    CommonModule,
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
    TranslateModule
  ],
  declarations: [
    AudioSliderComponent,
    ApplyValidationDirective,
    SchemaBasedBoolEditorComponent,
    SchemaBasedChoicesEditorComponent,
    SchemaBasedCustomEditorComponent,
    SchemaBasedDictEditorComponent,
    SchemaBasedEditorComponent,
    MarkAudioAsNeedingUpdateModalComponent,
    MarkTranslationsAsNeedingUpdateModalComponent,
    SchemaBasedExpressionEditorComponent,
    SchemaBasedFloatEditorComponent,
    SchemaBasedHtmlEditorComponent,
    SchemaBasedIntEditorComponent,
    SchemaBasedListEditorComponent,
    SchemaBasedUnicodeEditor,
    ObjectEditorComponent
  ],
  entryComponents: [
    AudioSliderComponent,
    SchemaBasedBoolEditorComponent,
    SchemaBasedChoicesEditorComponent,
    SchemaBasedCustomEditorComponent,
    SchemaBasedDictEditorComponent,
    SchemaBasedEditorComponent,
    SchemaBasedExpressionEditorComponent,
    SchemaBasedFloatEditorComponent,
    SchemaBasedHtmlEditorComponent,
    SchemaBasedIntEditorComponent,
    SchemaBasedListEditorComponent,
    SchemaBasedUnicodeEditor,
    ObjectEditorComponent,
    MarkTranslationsAsNeedingUpdateModalComponent,
    MarkAudioAsNeedingUpdateModalComponent,
  ],
  exports: [
    AudioSliderComponent,
    ApplyValidationDirective,
    CustomFormsComponentsModule,
    SchemaBasedBoolEditorComponent,
    SchemaBasedChoicesEditorComponent,
    SchemaBasedCustomEditorComponent,
    SchemaBasedDictEditorComponent,
    SchemaBasedEditorComponent,
    SchemaBasedExpressionEditorComponent,
    SchemaBasedFloatEditorComponent,
    SchemaBasedHtmlEditorComponent,
    SchemaBasedIntEditorComponent,
    SchemaBasedListEditorComponent,
    SchemaBasedUnicodeEditor,
    MarkTranslationsAsNeedingUpdateModalComponent,
    MarkAudioAsNeedingUpdateModalComponent,
    ObjectEditorComponent
  ],
})

export class SharedFormsModule { }
