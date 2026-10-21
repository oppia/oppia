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
import {TranslationModalComponent} from '../../pages/contributor-dashboard-page/modal-templates/translation-modal.component';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {ConfirmFormulaAsTextModalModule} from 'components/shared_parts/confirm-formula-as-text-modal.module';
import {ConfirmTranslationExitModalModule} from 'components/shared_parts/confirm-translation-exit-modal.module';
import {LazyLoadingModule} from 'components/shared_parts/lazy-loading.module';
import {MaterialModule} from 'modules/material.module';
import {OppiaCkEditorCopyToolBarModule} from 'components/ck-editor-helpers/ck-editor-copy-toolbar/ck-editor-copy-toolbar.module';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {SharedFormsModule} from 'components/forms/shared-forms.module';
import {StringUtilityPipesModule} from 'filters/string-utility-filters/string-utility-pipes.module';
import {TranslationModalUneditedConfirmationModalModule} from 'components/shared_parts/translation-modal-unedited-confirmation-modal.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    ConfirmFormulaAsTextModalModule,
    ConfirmTranslationExitModalModule,
    LazyLoadingModule,
    MaterialModule,
    OppiaCkEditorCopyToolBarModule,
    RichTextComponentsModule,
    SharedFormsModule,
    StringUtilityPipesModule,
    TranslationModalUneditedConfirmationModalModule,
  ],
  declarations: [TranslationModalComponent],
  exports: [TranslationModalComponent],
})
export class TranslationModalModule {}
