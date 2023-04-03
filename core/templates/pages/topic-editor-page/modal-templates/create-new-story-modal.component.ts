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
 * @fileoverview Component for create new story modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { NewlyCreatedStory } from 'domain/topic/newly-created-story.model';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { TopicEditorStateService } from '../services/topic-editor-state.service';

@Component({
  selector: 'oppia-create-new-story-modal',
  templateUrl: './create-new-story-modal.component.html'
})
export class CreateNewStoryModalComponent extends ConfirmOrCancelModal {
  constructor(
    private imageLocalStorageService: ImageLocalStorageService,
    private ngbActiveModal: NgbActiveModal,
    private storyEditorStateService: StoryEditorStateService,
    private topicEditorStateService: TopicEditorStateService,
    private windowRef: WindowRef
  ) {
    super(ngbActiveModal);
  }

  validUrlFragmentRegex = new RegExp(
    AppConstants.VALID_URL_FRAGMENT_REGEX);

  story = NewlyCreatedStory.createDefault();
  MAX_CHARS_IN_STORY_TITLE = AppConstants.MAX_CHARS_IN_STORY_TITLE;
  MAX_CHARS_IN_STORY_URL_FRAGMENT = (
    AppConstants.MAX_CHARS_IN_STORY_URL_FRAGMENT);

  MAX_CHARS_IN_STORY_DESCRIPTION = (
    AppConstants.MAX_CHARS_IN_STORY_DESCRIPTION);

  allowedBgColors = (
    AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.story);

  storyUrlFragmentExists = false;
  hostname = this.windowRef.nativeWindow.location.hostname;

  classroomUrlFragment = (
    this.topicEditorStateService.getClassroomUrlFragment());

  topicUrlFragment = (
    this.topicEditorStateService.getTopic()?.getUrlFragment());

  onStoryUrlFragmentChange(): void {
    if (!this.story.urlFragment) {
      return;
    }
    this.storyEditorStateService.updateExistenceOfStoryUrlFragment(
      this.story.urlFragment, () => {
        this.storyUrlFragmentExists = (
          this.storyEditorStateService.getStoryWithUrlFragmentExists());
      });
  }

  save(): void {
    this.ngbActiveModal.close(this.story);
  }

  cancel(): void {
    this.ngbActiveModal.dismiss('cancel');
  }

  isValid(): boolean {
    return Boolean(
      this.story.isValid() &&
      this.imageLocalStorageService.getStoredImagesData().length > 0 &&
      !this.storyUrlFragmentExists);
  }
}
