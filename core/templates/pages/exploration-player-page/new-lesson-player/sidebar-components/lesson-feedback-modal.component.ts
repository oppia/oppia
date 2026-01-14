// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for flag exploration modal.
 */

import {Component, Optional} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import './lesson-feedback-modal.component.css';
import {FeedbackPopupBackendApiService} from 'pages/exploration-player-page/services/feedback-popup-backend-api.service';
import {UserService} from 'services/user.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {AppConstants} from 'app.constants';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';

@Component({
  selector: 'oppia-lesson-feedback-modal',
  templateUrl: './lesson-feedback-modal.component.html',
  styleUrls: ['./lesson-feedback-modal.component.css'],
})
export class LessonFeedbackModalComponent {
  feedbackModalId!: string;
  feedbackTitle!: string;
  feedbackText: string = '';
  isSubmitterAnonymized: boolean = false;
  isLoggedIn: boolean = false;
  MAX_REVIEW_MESSAGE_LENGTH = AppConstants.MAX_REVIEW_MESSAGE_LENGTH;
  thankYouModalIsShown: boolean = false;

  constructor(
    @Optional() private ngbActiveModal: NgbActiveModal,
    @Optional() private bottomSheetRef: MatBottomSheetRef,
    private focusManagerService: FocusManagerService,
    private playerPositionService: PlayerPositionService,
    private userService: UserService,
    private feedbackPopupBackendApiService: FeedbackPopupBackendApiService
  ) {}

  ngOnInit(): void {
    this.userService.getUserInfoAsync().then(userInfo => {
      this.isLoggedIn = userInfo.isLoggedIn();
    });
    this.feedbackModalId =
      'feedbackPopover' + Math.random().toString(36).slice(2);
    this.feedbackTitle =
      'Feedback when the user was at card "' +
      this.playerPositionService.getCurrentStateName() +
      '"';

    this.focusManagerService.setFocus(this.feedbackModalId);
  }

  saveFeedback(): void {
    if (this.feedbackText) {
      this.feedbackPopupBackendApiService.submitFeedbackAsync(
        this.feedbackTitle,
        this.feedbackText,
        !this.isSubmitterAnonymized && this.isLoggedIn,
        this.playerPositionService.getCurrentStateName()
      );
    }

    this.thankYouModalIsShown = true;
  }

  closeModal(): void {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss('cancel');
    } else if (this.ngbActiveModal) {
      this.ngbActiveModal.dismiss('cancel');
    }
  }
}
