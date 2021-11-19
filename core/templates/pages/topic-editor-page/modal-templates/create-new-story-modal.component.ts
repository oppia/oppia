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
 * @fileoverview Controller for create new story modal.
 */

import { NewlyCreatedStory } from 'domain/topic/newly-created-story.model';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service';
import { TopicEditorStateService } from '../services/topic-editor-state.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import constants from 'assets/constants';

@Component({
  selector: 'oppia-create-new-story-modal',
  templateUrl: './create-new-story-modal.component.html'
})

export class CreateNewStoryModalComponent extends ConfirmOrCancelModal {
  allowedBgColors: object = constants.ALLOWED_THUMBNAIL_BG_COLORS.story;
  validUrlFragmentRegex = new RegExp(constants.VALID_URL_FRAGMENT_REGEX);
  newlyCreatedStory: NewlyCreatedStory = NewlyCreatedStory.createDefault();
  storyUrlFragmentExists: boolean = false;
  hostname: string = this.windowRef.nativeWindow.location.hostname;
  classroomUrlFragment: string;
  topicUrlFragment: string;
  MAX_CHARS_IN_STORY_TITLE: number = constants.MAX_CHARS_IN_STORY_TITLE;
  MAX_CHARS_IN_STORY_URL_FRAGMENT: number = (
    constants.MAX_CHARS_IN_STORY_URL_FRAGMENT);
  MAX_CHARS_IN_STORY_DESCRIPTION: number = (
    constants.MAX_CHARS_IN_STORY_DESCRIPTION);

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private imageLocalStorageService: ImageLocalStorageService,
    private storyEditorStateService: StoryEditorStateService,
    private topicEditorStateService: TopicEditorStateService,
    private windowRef: WindowRef
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.classroomUrlFragment = (
      this.topicEditorStateService.getClassroomUrlFragment());
    this.topicUrlFragment = (
      this.topicEditorStateService.getTopic().getUrlFragment());
  }

  save(): void {
    this.ngbActiveModal.close(this.newlyCreatedStory);
  }

  cancel(): void {
    this.ngbActiveModal.dismiss('cancel');
  }

  onStoryUrlFragmentChange(): void {
    if (!this.newlyCreatedStory.urlFragment) {
      return;
    }

    this.storyEditorStateService.updateExistenceOfStoryUrlFragment(
      this.newlyCreatedStory.urlFragment, ()=> {
        this.storyUrlFragmentExists = (
          this.storyEditorStateService.getStoryWithUrlFragmentExists());
      });
  }

  isValid(): boolean {
    return Boolean(
     this.newlyCreatedStory.isValid() &&
     this.imageLocalStorageService.getStoredImagesData().length > 0 &&
     !this.storyUrlFragmentExists);
  }
}
