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
 * @fileoverview Component for the feedback popup.
 */

import { Component, Output, EventEmitter } from '@angular/core';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { BackgroundMaskService } from 'services/stateful/background-mask.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { UserService } from 'services/user.service';
import { FeedbackPopupBackendApiService } from '../services/feedback-popup-backend-api.service';
import { PlayerPositionService } from '../services/player-position.service';

@Component({
  selector: 'oppia-feedback-popup',
  templateUrl: './feedback-popup.component.html'
})
export class FeedbackPopupComponent {
  feedbackUrl: string;
  feedbackText: string = '';
  isSubmitterAnonymized: boolean = false;
  isLoggedIn: boolean;
  feedbackPopoverId: string;
  feedbackTitle: string;
  feedbackSubmitted: boolean = false;
  @Output() closePopover: EventEmitter<void> = new EventEmitter();

  constructor(
    private backgroundMaskService: BackgroundMaskService,
    private focusManagerService: FocusManagerService,
    private playerPositionService: PlayerPositionService,
    private userService: UserService,
    private windowDimensionsService: WindowDimensionsService,
    private feedbackPopupBackendApiService: FeedbackPopupBackendApiService
  ) {}

  ngOnInit(): void {
    this.userService.getUserInfoAsync().then((userInfo) => {
      this.isLoggedIn = userInfo.isLoggedIn();
    });
    this.feedbackPopoverId = (
      'feedbackPopover' + Math.random().toString(36).slice(2));
    this.feedbackTitle = (
      'Feedback when the user was at card "' +
        this.playerPositionService.getCurrentStateName() + '"');

    if (this.windowDimensionsService.isWindowNarrow()) {
      this.backgroundMaskService.activateMask();
    }

    this.focusManagerService.setFocus(this.feedbackPopoverId);
  }

  saveFeedback(): void {
    if (this.feedbackText) {
      this.feedbackPopupBackendApiService.submitFeedbackAsync(
        this.feedbackTitle,
        this.feedbackText,
        !this.isSubmitterAnonymized && this.isLoggedIn,
        this.playerPositionService.getCurrentStateName()
      ).then(() => {
        this.feedbackSubmitted = true;
        setTimeout(() => {
          this.close();
        }, 2000);
      });
    }
  }

  close(): void {
    this.closePopover.emit();
  }

  ngOnDestroy(): void {
    this.backgroundMaskService.deactivateMask();
  }
}
