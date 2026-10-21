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
 * @fileoverview Auto-generated granular module for one shared component.
 * Each component lives in its own module so pages import only what they use.
 */

import {NgModule} from '@angular/core';
import {StateEditorComponent} from '../state-editor/state-editor.component';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {MaterialModule} from 'modules/material.module';
import {StateContentEditorModule} from 'components/shared_parts/state-content-editor.module';
import {StateHintsEditorModule} from 'components/shared_parts/state-hints-editor.module';
import {StateInteractionEditorModule} from 'components/shared_parts/state-interaction-editor.module';
import {StateResponsesModule} from 'components/shared_parts/state-responses.module';
import {StateSkillEditorModule} from 'components/shared_parts/state-skill-editor.module';
import {StateSolutionEditorModule} from 'components/shared_parts/state-solution-editor.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    MaterialModule,
    StateContentEditorModule,
    StateHintsEditorModule,
    StateInteractionEditorModule,
    StateResponsesModule,
    StateSkillEditorModule,
    StateSolutionEditorModule,
  ],
  declarations: [StateEditorComponent],
  exports: [StateEditorComponent],
})
export class StateEditorModule {}
