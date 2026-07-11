/**
 * @fileoverview Shared module declaring and exporting all reusable
 * feedback dashboard components.
 */

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BaseModule} from 'base-components/base.module';
import {SharedComponentsModule} from 'components/shared-component.module';
import {FeedbackEmptyStateComponent} from './feedback-empty-state/feedback-empty-state.component';
import {FeedbackFilterBarComponent} from './feedback-filter-bar/feedback-filter-bar.component';
import {FeedbackTableComponent} from './feedback-table/feedback-table.component';
import {FeedbackStatusChipComponent} from './feedback-status-chip/feedback-status-chip.component';
import {FeedbackDetailPageComponent} from './feedback-detail-page/feedback-detail-page.component';
import {FeedbackDetailFieldComponent} from './feedback-detail-page/feedback-detail-field.component';
import {FeedbackDetailSectionComponent} from './feedback-detail-page/feedback-detail-section.component';
import {FeedbackDetailSessionInfoComponent} from './feedback-detail-page/feedback-detail-session-info.component';

@NgModule({
  imports: [CommonModule, FormsModule, BaseModule, SharedComponentsModule],
  declarations: [
    FeedbackEmptyStateComponent,
    FeedbackFilterBarComponent,
    FeedbackTableComponent,
    FeedbackStatusChipComponent,
    FeedbackDetailPageComponent,
    FeedbackDetailFieldComponent,
    FeedbackDetailSectionComponent,
    FeedbackDetailSessionInfoComponent,
  ],
  exports: [
    FeedbackEmptyStateComponent,
    FeedbackFilterBarComponent,
    FeedbackTableComponent,
    FeedbackStatusChipComponent,
    FeedbackDetailPageComponent,
    FeedbackDetailFieldComponent,
    FeedbackDetailSectionComponent,
    FeedbackDetailSessionInfoComponent,
  ],
})
export class FeedbackSharedModule {}
