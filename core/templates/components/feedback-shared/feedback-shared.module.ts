// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Shared module declaring and exporting all reusable
 * feedback dashboard components.
 */

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BaseModule} from 'base-components/base.module';
import {SharedComponentsModule} from 'components/shared-component.module';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {FeedbackEmptyStateComponent} from './feedback-empty-state/feedback-empty-state.component';
import {FeedbackFilterBarComponent} from './feedback-filter-bar/feedback-filter-bar.component';
import {FeedbackTableComponent} from './feedback-table/feedback-table.component';
import {FeedbackStatusChipComponent} from './feedback-status-chip/feedback-status-chip.component';
import {FeedbackDetailPageComponent} from './feedback-detail-page/feedback-detail-page.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    BaseModule,
    SharedComponentsModule,
    RichTextComponentsModule,
  ],
  declarations: [
    FeedbackEmptyStateComponent,
    FeedbackFilterBarComponent,
    FeedbackTableComponent,
    FeedbackStatusChipComponent,
    FeedbackDetailPageComponent,
  ],
  exports: [
    FeedbackEmptyStateComponent,
    FeedbackFilterBarComponent,
    FeedbackTableComponent,
    FeedbackStatusChipComponent,
    FeedbackDetailPageComponent,
  ],
})
export class FeedbackSharedModule {}
