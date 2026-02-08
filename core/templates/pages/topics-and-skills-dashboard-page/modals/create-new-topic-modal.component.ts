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
 * @fileoverview Modal for the creating new topic.
 */

import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {NewlyCreatedTopic} from 'domain/topics_and_skills_dashboard/newly-created-topic.model';
import {TopicEditorStateService} from 'pages/topic-editor-page/services/topic-editor-state.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ImageUploaderData} from 'components/forms/custom-forms-directives/image-uploader.component';

@Component({
  selector: 'oppia-create-new-topic-modal',
  templateUrl: './create-new-topic-modal.component.html',
})
export class CreateNewTopicModalComponent extends ConfirmOrCancelModal {
  allowedBgColors: string[] = Object.values(
    AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.topic
  );
  validUrlFragmentRegex = new RegExp(AppConstants.VALID_URL_FRAGMENT_REGEX);
  newlyCreatedTopic: NewlyCreatedTopic = NewlyCreatedTopic.createDefault();
  hostname: string = this.windowRef.nativeWindow.location.hostname;
  MAX_CHARS_IN_TOPIC_NAME: number = AppConstants.MAX_CHARS_IN_TOPIC_NAME;
  MAX_CHARS_IN_TOPIC_DESCRIPTION: number =
    AppConstants.MAX_CHARS_IN_TOPIC_DESCRIPTION;

  MAX_CHARS_IN_TOPIC_URL_FRAGMENT =
    AppConstants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT;

  topicUrlFragmentExists: boolean = false;
  topicNameExists: boolean = false;
  maxWebTitleFrag = AppConstants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB;
  minWebTitleFrag = AppConstants.MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB;
  generatedUrlPrefix = `${this.hostname}/learn/staging`;
  thumbnailImage: Blob | null = null;
  thumbnailFilename: string = '';
  thumbnailBgColor: string = this.allowedBgColors[0] || '';

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private windowRef: WindowRef,
    private topicEditorStateService: TopicEditorStateService
  ) {
    super(ngbActiveModal);
  }

  save(): void {
    this.ngbActiveModal.close({
      topic: this.newlyCreatedTopic,
      thumbnailImage: this.thumbnailImage,
      thumbnailFilename: this.thumbnailFilename,
      thumbnailBgColor: this.thumbnailBgColor,
    });
  }

  cancel(): void {
    this.ngbActiveModal.dismiss('cancel');
  }

  isValid(): boolean {
    return Boolean(
      this.newlyCreatedTopic.isValid() && this.thumbnailImage !== null
    );
  }

  onImageSave(imageData: ImageUploaderData): void {
    this.thumbnailImage = imageData.image_data;
    this.thumbnailFilename = imageData.filename;
    this.thumbnailBgColor = imageData.bg_color;
  }

  onUrlFragmentChange(urlFragment: string): void {
    this.newlyCreatedTopic.urlFragment = urlFragment;
    this.onTopicUrlFragmentChange();
  }

  onTopicUrlFragmentChange(): void {
    if (!this.newlyCreatedTopic.urlFragment) {
      return;
    }
    this.topicEditorStateService.updateExistenceOfTopicUrlFragment(
      this.newlyCreatedTopic.urlFragment,
      () => {
        this.topicUrlFragmentExists =
          this.topicEditorStateService.getTopicWithUrlFragmentExists();
      },
      () => {
        return;
      }
    );
  }

  onTopicNameChange(): void {
    if (!this.newlyCreatedTopic.name) {
      return;
    }

    this.newlyCreatedTopic.name = this.newlyCreatedTopic.name
      .replace(/\s+/g, ' ')
      .trim();
    this.topicEditorStateService.updateExistenceOfTopicName(
      this.newlyCreatedTopic.name,
      () => {
        this.topicNameExists =
          this.topicEditorStateService.getTopicWithNameExists();
      }
    );
  }
}
