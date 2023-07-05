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
 * @fileoverview Module for the pencil code editor interaction.
 */

import { NgModule } from '@angular/core';

import { MaterialModule } from 'modules/material.module';
import { PencilCodeEditor } from './directives/oppia-interactive-pencil-code-editor.component';
import { PencilCodeResetConfirmation } from './directives/pencil-code-reset-confirmation.component';
import { ResponePencilCodeEditor } from './directives/oppia-response-pencil-code-editor.component';
import { ShortResponePencilCodeEditor } from './directives/oppia-short-response-pencil-code-editor.component';
import { TranslateModule } from '@ngx-translate/core';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    SharedPipesModule,
    CommonModule,
    MaterialModule,
    TranslateModule
  ],
  declarations: [
    PencilCodeEditor,
    PencilCodeResetConfirmation,
    ResponePencilCodeEditor,
    ShortResponePencilCodeEditor
  ],
  entryComponents: [
    PencilCodeEditor,
    PencilCodeResetConfirmation,
    ResponePencilCodeEditor,
    ShortResponePencilCodeEditor
  ],
  exports: [
    PencilCodeEditor,
    PencilCodeResetConfirmation,
    ResponePencilCodeEditor,
    ShortResponePencilCodeEditor
  ],
})

export class PencilCodeEditorModule {}
