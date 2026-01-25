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
import {
  ImageUploaderParameters,
  ImageUploaderData,
} from 'components/forms/custom-forms-directives/image-uploader.component';
import {NewlyCreatedTopic} from 'domain/topics_and_skills_dashboard/newly-created-topic.model';
import {TopicEditorStateService} from 'pages/topic-editor-page/services/topic-editor-state.service';
import {WindowRef} from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-create-new-topic-modal',
  templateUrl: './create-new-topic-modal.component.html',
})
export class CreateNewTopicModalComponent extends ConfirmOrCancelModal {
  allowedBgColors: readonly string[] =
    AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.topic;
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
  imageUploaderParameters!: ImageUploaderParameters;
  uploadedImageData: ImageUploaderData | null = null;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private windowRef: WindowRef,
    private topicEditorStateService: TopicEditorStateService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    // Initialize image uploader parameters for the topic thumbnail.
    this.imageUploaderParameters = {
      disabled: false,
      maxImageSizeInKB: 1024,
      imageName: 'Thumbnail',
      orientation: 'landscape',
      bgColor: this.allowedBgColors[0],
      allowedBgColors: this.allowedBgColors as string[],
      allowedImageFormats: ['svg'],
      aspectRatio: '4:3',
      previewDescriptionBgColor: '#2F6687',
    };
  }

  handleImageSave(imageData: ImageUploaderData): void {
    this.uploadedImageData = imageData;
    // Update the preview title when topic name changes.
    this.imageUploaderParameters.previewTitle = this.newlyCreatedTopic.name;
  }

  getImageData(): ImageUploaderData | null {
    return this.uploadedImageData;
  }

  save(): void {
    this.ngbActiveModal.close({
      topic: this.newlyCreatedTopic,
      imageData: this.uploadedImageData,
    });
  }

  cancel(): void {
    this.ngbActiveModal.dismiss('cancel');
  }

  isValid(): boolean {
    return Boolean(
      this.newlyCreatedTopic.isValid() && this.uploadedImageData !== null
    );
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
