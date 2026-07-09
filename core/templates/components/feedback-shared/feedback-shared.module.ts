/**
 * @fileoverview Shared module declaring and exporting all reusable
 * feedback dashboard components.
 */

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FeedbackEmptyStateComponent} from './feedback-empty-state/feedback-empty-state.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [FeedbackEmptyStateComponent],
  exports: [FeedbackEmptyStateComponent],
})
export class FeedbackSharedModule {}
