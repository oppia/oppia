// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for create new subtopic modal controller.
 */

import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import createSubtopicConstants from 'assets/constants';
import { SubtopicPage } from 'domain/topic/subtopic-page.model';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
import { Topic } from 'domain/topic/TopicObjectFactory';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SubtopicValidationService } from '../services/subtopic-validation.service';
import { TopicEditorStateService } from '../services/topic-editor-state.service';

interface SubtopicPageSchema {
    'type': string,
    'ui_config': {
       rows: number;
   }
}

@Component({
  templateUrl: 'create-new-subtopic-modal.component.html',
  selector: 'oppia-create-new-subtopic-modal'
})
export class CreateNewSubtopicModalComponent {
  @Input() topic: Topic;
  hostname: string;
  classroomUrlFragment: string;
  SUBTOPIC_PAGE_SCHEMA: SubtopicPageSchema;
  htmlData: string;
  schemaEditorIsShown: boolean;
  editableThumbnailFilename: string;
  editableThumbnailBgColor: string;
  editableUrlFragment: string;
  allowedBgColors: string | readonly ['#FFFFFF'];
  subtopicId: number;
  MAX_CHARS_IN_SUBTOPIC_TITLE: number;
  MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT: number;
  subtopicTitle: string;
  errorMsg: string;
  subtopicUrlFragmentExists: boolean;
  subtopicPage: SubtopicPage;

  constructor(
    private topicEditorStateService: TopicEditorStateService,
    private topicUpdateService: TopicUpdateService,
    private subtopicValidationService: SubtopicValidationService,
    private windowRef: WindowRef,
    private ngbModalInstance: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.hostname = this.windowRef.nativeWindow.location.hostname;
    this.classroomUrlFragment = (
      this.topicEditorStateService.getClassroomUrlFragment());
    this.SUBTOPIC_PAGE_SCHEMA = {
      type: 'html',
      ui_config: {
        rows: 100
      }
    };
    this.htmlData = '';
    this.schemaEditorIsShown = false;
    this.editableThumbnailFilename = '';
    this.editableThumbnailBgColor = '';
    this.editableUrlFragment = '';
    this.allowedBgColors = (
      createSubtopicConstants.ALLOWED_THUMBNAIL_BG_COLORS.subtopic);
    this.subtopicId = this.topic.getNextSubtopicId();
    this.MAX_CHARS_IN_SUBTOPIC_TITLE = AppConstants.MAX_CHARS_IN_SUBTOPIC_TITLE;
    this.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT = (
      AppConstants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT);
    this.subtopicTitle = '';
    this.errorMsg = null;
    this.subtopicUrlFragmentExists = false;
    this.topicUpdateService.addSubtopic(
      this.topic, this.subtopicTitle,
      this.editableUrlFragment, this.allowedBgColors,
      this.editableThumbnailFilename);
  }

  showSchemaEditor(): void {
    this.schemaEditorIsShown = true;
  }

  updateSubtopicThumbnailFilename(newThumbnailFilename: string): void {
    this.editableThumbnailFilename = newThumbnailFilename;
    this.topicUpdateService.setSubtopicThumbnailFilename(
      this.topic, this.subtopicId, newThumbnailFilename);
  }

  updateSubtopicThumbnailBgColor(newThumbnailBgColor: string): void {
    this.editableThumbnailBgColor = newThumbnailBgColor;
    this.topicUpdateService.setSubtopicThumbnailBgColor(
      this.topic, this.subtopicId, newThumbnailBgColor);
  }

  resetErrorMsg(): void {
    this.errorMsg = null;
  }

  isSubtopicValid(): boolean {
    return Boolean(
      this.editableThumbnailFilename &&
        this.subtopicTitle &&
        this.htmlData &&
        this.editableUrlFragment &&
        this.isUrlFragmentValid());
  }

  cancel(): void {
    this.topicEditorStateService.deleteSubtopicPage(
      this.topic.getId(), this.subtopicId);
    this.topicUpdateService.deleteSubtopic(this.topic, this.subtopicId);
    this.topicEditorStateService.onTopicReinitialized.emit();
    this.ngbModalInstance.dismiss('cancel');
  }

  isUrlFragmentValid(): boolean {
    return this.subtopicValidationService.isUrlFragmentValid(
      this.editableUrlFragment);
  }

  checkSubtopicExistence(): void {
    this.subtopicUrlFragmentExists = (
      this.subtopicValidationService.doesSubtopicWithUrlFragmentExist(
        this.editableUrlFragment));
  }

  save(): void {
    if (!this.subtopicValidationService.checkValidSubtopicName(
      this.subtopicTitle)) {
      this.errorMsg = 'A subtopic with this title already exists';
      return;
    }

    this.topicUpdateService.setSubtopicTitle(
      this.topic, this.subtopicId, this.subtopicTitle);
    this.topicUpdateService.setSubtopicUrlFragment(
      this.topic, this.subtopicId, this.editableUrlFragment);

    this.subtopicPage = SubtopicPage.createDefault(
      this.topic.getId(), this.subtopicId);

    var subtitledHtml = angular.copy(
      this.subtopicPage.getPageContents().getSubtitledHtml());
    subtitledHtml.html = this.htmlData;
    this.topicUpdateService.setSubtopicPageContentsHtml(
      this.subtopicPage, this.subtopicId, subtitledHtml);
    this.subtopicPage.getPageContents().setHtml(this.htmlData);
    this.topicEditorStateService.setSubtopicPage(this.subtopicPage);
    this.topicUpdateService.setSubtopicTitle(
      this.topic, this.subtopicId, this.subtopicTitle);
    this.ngbModalInstance.close(this.subtopicId);
  }
}
