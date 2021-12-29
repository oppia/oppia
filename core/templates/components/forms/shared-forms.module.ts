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
import { DynamicContentModule } from 'components/angular-html-bind/dynamic-content.module';
import { MaterialModule } from 'modules/material.module';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { TranslateModule } from '@ngx-translate/core';
import { CustomFormsComponentsModule } from './custom-forms-directives/custom-form-components.module';
import { SchemaBasedEditorDirective } from './schema-based-editors/schema-based-editor.directive';
import { AudioSliderComponent } from './slider/audio-slider.component';
import { MarkAllAudioAndTranslationsAsNeedingUpdateModalComponent } from 'components/forms/forms-templates/mark-all-audio-and-translations-as-needing-update-modal.component';
import { MarkAudioAsNeedingUpdateModalComponent } from 'components/forms/forms-templates/mark-audio-as-needing-update-modal.component';

@NgModule({
  imports: [
    CommonModule,
    CustomFormsComponentsModule,
    DynamicContentModule,
    FormsModule,
    MaterialModule,
    NgbTooltipModule,
    NgbModalModule,
    ReactiveFormsModule,
    SharedPipesModule,
    TranslateModule
  ],
  declarations: [
    AudioSliderComponent,
    MarkAllAudioAndTranslationsAsNeedingUpdateModalComponent,
    MarkAudioAsNeedingUpdateModalComponent,
    SchemaBasedEditorDirective,
  ],
  entryComponents: [
    AudioSliderComponent,
    MarkAllAudioAndTranslationsAsNeedingUpdateModalComponent,
    MarkAudioAsNeedingUpdateModalComponent
  ],
  exports: [
    AudioSliderComponent,
    CustomFormsComponentsModule,
    SchemaBasedEditorDirective
  ],
})

export class SharedFormsModule { }
