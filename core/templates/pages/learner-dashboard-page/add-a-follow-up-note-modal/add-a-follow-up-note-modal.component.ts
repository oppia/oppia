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
 * @fileoverview Component for add a follow up note modal.
 */
import {Component, Inject, Input, OnInit, Optional} from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import {AlertsService} from 'services/alerts.service';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {LessonFeedbackDetailResponse} from 'domain/feedback/feedback.model';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import './add-a-follow-up-note-modal.component.css';

@Component({
  selector: 'oppia-add-a-follow-up-note-modal',
  templateUrl: './add-a-follow-up-note-modal.component.html',
  styleUrls: ['./add-a-follow-up-note-modal.component.css'],
})
export class AddAFollowUpNoteModalComponent implements OnInit {
  @Input() detailFeedback!: LessonFeedbackDetailResponse;

  followUpText: string = '';
  isSubmittingFollowUp: boolean = false;

  constructor(
    private alertService: AlertsService,
    private feedbackBackendApiService: FeedbackBackendApiService,
    @Optional() private ngbActiveModal: NgbActiveModal,
    @Optional()
    private bottomSheetRef?: MatBottomSheetRef<AddAFollowUpNoteModalComponent>,
    @Optional()
    @Inject(MAT_BOTTOM_SHEET_DATA)
    private bottomSheetData?: {detailFeedback: LessonFeedbackDetailResponse}
  ) {}

  ngOnInit(): void {
    // When opened as a bottom sheet, the detail feedback arrives through
    // MAT_BOTTOM_SHEET_DATA instead of an input binding.
    if (!this.detailFeedback && this.bottomSheetData) {
      this.detailFeedback = this.bottomSheetData.detailFeedback;
    }
  }

  closemodal(): void {
    this.followUpText = '';
    this.isSubmittingFollowUp = false;
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
      return;
    }
    this.ngbActiveModal.dismiss();
  }

  async submit(): Promise<void> {
    this.isSubmittingFollowUp = true;

    try {
      await this.feedbackBackendApiService.submitMyFeedbackFollowUpAsync(
        this.detailFeedback.id,
        this.followUpText
      );

      this.alertService.addSuccessMessage(
        'Your follow up note has been sent successfully',
        7000,
        true
      );
      this.closemodal();
    } catch (error) {
      this.alertService.addWarning(
        'Your follow up note has not been sent successfully'
      );
    } finally {
      this.isSubmittingFollowUp = false;
    }
  }
}
