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
 * @fileoverview Component for the Story Editor Unpublish Modal Component.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformFeatureService} from 'services/platform-feature.service';

@Component({
  selector: 'oppia-story-editor-unpublish-modal',
  templateUrl: './story-editor-unpublish-modal.component.html',
})
export class StoryEditorUnpublishModalComponent {
  constructor(
    private platformFeatureService: PlatformFeatureService,
    private activeModal: NgbActiveModal
  ) {}

  unpublishedChapters: number[] = [];

  badContentReasonText: string =
    'Bad content (no new explorations ' + 'will be added)';

  splitChapterReasonText: string =
    'Split Chapters' + ' (requires new explorations to be added)';

  selectedReasonText: string = this.badContentReasonText;
  unpublishingReason: string = 'BAD_CONTENT';

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirm(): void {
    if (this.isSerialChapterFeatureFlagEnabled()) {
      this.activeModal.close(this.unpublishingReason);
    } else {
      this.activeModal.close();
    }
  }

  isSerialChapterFeatureFlagEnabled(): boolean {
    return this.platformFeatureService.status
      .SerialChapterLaunchCurriculumAdminView.isEnabled;
  }

  setReason(reason: string): void {
    this.unpublishingReason = reason;
    if (reason === 'BAD_CONTENT') {
      this.selectedReasonText = this.badContentReasonText;
    } else if (reason === 'CHAPTER_NEEDS_SPLITTING') {
      this.selectedReasonText = this.splitChapterReasonText;
    }
  }
}
