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
 * @fileoverview Component for create new story modal.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { NewlyCreatedStory } from 'domain/topic/newly-created-story.model';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service';
import { TopicEditorStateService } from '../services/topic-editor-state.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { AppConstants } from 'app.constants';
import { ContextService } from 'services/context.service';

@Component({
  selector: 'oppia-create-new-story-modal',
  templateUrl: './create-new-story-modal.component.html'
})
export class CreateNewStoryModalComponent extends ConfirmOrCancelModal
  implements OnInit {
  storyUrlFragmentExists: boolean;
  hostname: string;
  classroomUrlFragment: string;
  topicUrlFragment: string;
  MAX_CHARS_IN_STORY_TITLE: number;
  MAX_CHARS_IN_STORY_URL_FRAGMENT: number;
  MAX_CHARS_IN_STORY_DESCRIPTION: number;
  allowedBgColors: readonly string[];
  newlyCreatedStory: NewlyCreatedStory;
  validUrlFragmentRegex = new RegExp(AppConstants.VALID_URL_FRAGMENT_REGEX);

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private contextService: ContextService,
    private imageLocalStorageService: ImageLocalStorageService,
    private storyEditorStateService: StoryEditorStateService,
    private topicEditorStateService: TopicEditorStateService,
    private windowRef: WindowRef,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.storyUrlFragmentExists = false;
    this.hostname = this.windowRef.nativeWindow.location.hostname;
    this.classroomUrlFragment = (
      this.topicEditorStateService.getClassroomUrlFragment());
    this.topicUrlFragment = (
      this.topicEditorStateService.getTopic().getUrlFragment());
    this.allowedBgColors = AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.story;
    this.MAX_CHARS_IN_STORY_TITLE = AppConstants.MAX_CHARS_IN_STORY_TITLE;
    this.MAX_CHARS_IN_STORY_URL_FRAGMENT = (
      AppConstants.MAX_CHARS_IN_STORY_URL_FRAGMENT);
    this.MAX_CHARS_IN_STORY_DESCRIPTION = (
      AppConstants.MAX_CHARS_IN_STORY_DESCRIPTION);
    this.newlyCreatedStory = NewlyCreatedStory.createDefault();
    this.contextService.setImageSaveDestinationToLocalStorage();
  }

  save(): void {
    this.ngbActiveModal.close(this.newlyCreatedStory);
  }

  cancel(): void {
    this.ngbActiveModal.dismiss('cancel');
  }

  onStoryUrlFragmentChange(urlFrag: string): void {
    this.newlyCreatedStory.urlFragment = urlFrag;
    this.changeDetectorRef.detectChanges();
    if (!this.newlyCreatedStory.urlFragment) {
      return;
    }

    this.storyEditorStateService.updateExistenceOfStoryUrlFragment(
      this.newlyCreatedStory.urlFragment, () => {
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
