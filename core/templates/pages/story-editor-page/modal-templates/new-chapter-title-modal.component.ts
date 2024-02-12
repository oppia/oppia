// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for new chapter title modal.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import newChapterConstants from 'assets/constants';
import { CuratedExplorationValidationService } from 'domain/exploration/curated-exploration-validation.service';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { StoryUpdateService } from 'domain/story/story-update.service';
import { Story } from 'domain/story/story.model';
import { ValidatorsService } from 'services/validators.service';
import { StoryEditorStateService } from '../services/story-editor-state.service';
import { PlatformFeatureService } from 'services/platform-feature.service';

@Component({
  selector: 'oppia-new-chapter-title-modal',
  templateUrl: './new-chapter-title-modal.component.html'
})
export class NewChapterTitleModalComponent implements OnInit {
  @Input() nodeTitles!: string | string[];
  title!: string;
  explorationId!: string;
  invalidExpId!: boolean;
  errorMsg!: string | null;
  invalidExpErrorStrings!: string[];
  MAX_CHARS_IN_EXPLORATION_TITLE = AppConstants.MAX_CHARS_IN_EXPLORATION_TITLE;
  story!: Story;
  nodeId!: string;
  editableThumbnailBgColor!: string;
  editableThumbnailFilename!: string;
  categoryIsDefault!: boolean;
  statesWithRestrictedInteractions!: string | string[];
  statesWithTooFewMultipleChoiceOptions!: string | string[];
  allowedBgColors = (
    newChapterConstants.ALLOWED_THUMBNAIL_BG_COLORS.chapter);

  constructor(
    private curatedExplorationValidationService:
     CuratedExplorationValidationService,
    private editableStoryBackendApiService: EditableStoryBackendApiService,
    private ngbActiveModal: NgbActiveModal,
    private storyEditorStateService: StoryEditorStateService,
    private storyUpdateService: StoryUpdateService,
    private validatorsService: ValidatorsService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  ngOnInit(): void {
    this.init();
  }

  addStoryNodeWithData(): void {
    this.storyUpdateService.addStoryNode(this.story, this.title);
    this.storyUpdateService.setStoryNodeTitle(
      this.story, this.nodeId, this.title);
    this.storyUpdateService.setStoryNodeThumbnailFilename(
      this.story, this.nodeId, this.editableThumbnailFilename);
    this.storyUpdateService.setStoryNodeThumbnailBgColor(
      this.story, this.nodeId, this.editableThumbnailBgColor);
    if (this.platformFeatureService.status.
      SerialChapterLaunchCurriculumAdminView.isEnabled) {
      this.storyUpdateService.setStoryNodeStatus(
        this.story, this.nodeId, 'Draft');
    }
  }

  init(): void {
    this.title = '';
    this.explorationId = '';
    this.editableThumbnailFilename = '';
    this.invalidExpId = false;
    this.errorMsg = null;
    this.invalidExpErrorStrings = ['Please enter a valid exploration id.'];
    this.story = this.storyEditorStateService.getStory();
    this.nodeId = this.story.getStoryContents().getNextNodeId();
    this.editableThumbnailBgColor = '';
    this.categoryIsDefault = true;
    this.statesWithRestrictedInteractions = [];
    this.statesWithTooFewMultipleChoiceOptions = [];
  }

  updateThumbnailFilename(newThumbnailFilename: string): void {
    this.editableThumbnailFilename = newThumbnailFilename;
  }

  updateThumbnailBgColor(newThumbnailBgColor: string): void {
    this.editableThumbnailBgColor = newThumbnailBgColor;
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }

  updateExplorationId(): void {
    var nodes = this.story.getStoryContents().getNodes();
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getExplorationId() === this.explorationId) {
        this.invalidExpErrorStrings = [
          'The given exploration already exists in the story.'];
        this.invalidExpId = true;
        return;
      }
    }
    this.storyUpdateService.setStoryNodeExplorationId(
      this.story, this.nodeId, this.explorationId);

    this.ngbActiveModal.close();
  }

  resetErrorMsg(): void {
    this.errorMsg = null;
    this.invalidExpId = false;
    this.categoryIsDefault = true;
    this.invalidExpErrorStrings = ['Please enter a valid exploration id.'];
  }

  validateExplorationId(): boolean {
    return this.validatorsService.isValidExplorationId(
      this.explorationId, false);
  }

  isValid(): boolean {
    return Boolean(
      this.title &&
      this.validatorsService.isValidExplorationId(this.explorationId, false) &&
      this.editableThumbnailFilename);
  }

  async saveAsync(): Promise<void> {
    if (this.nodeTitles.indexOf(this.title) !== -1) {
      this.errorMsg = 'A chapter with this title already exists';
      return;
    }

    const expIsPublished = (
      await this.curatedExplorationValidationService.isExpPublishedAsync(
        this.explorationId));
    if (!expIsPublished) {
      this.invalidExpErrorStrings = [
        'This exploration does not exist or is not published yet.'
      ];
      this.invalidExpId = true;
      return;
    }

    this.invalidExpId = false;

    const categoryIsDefault = (
      await this.curatedExplorationValidationService.isDefaultCategoryAsync(
        this.explorationId));
    if (!categoryIsDefault) {
      this.categoryIsDefault = false;
      return;
    }
    this.categoryIsDefault = true;

    this.statesWithRestrictedInteractions = (
      await this.curatedExplorationValidationService
        .getStatesWithRestrictedInteractions(this.explorationId));
    if (this.statesWithRestrictedInteractions.length > 0) {
      return;
    }

    this.statesWithTooFewMultipleChoiceOptions = (
      await this.curatedExplorationValidationService
        .getStatesWithInvalidMultipleChoices(this.explorationId));
    if (this.statesWithTooFewMultipleChoiceOptions.length > 0) {
      return;
    }

    const validationErrorMessages = (
      await this.editableStoryBackendApiService.validateExplorationsAsync(
        this.story.getId(), [this.explorationId]
      ));
    if (validationErrorMessages.length > 0) {
      this.invalidExpId = true;
      this.invalidExpErrorStrings = validationErrorMessages;
      return;
    }
    this.invalidExpId = false;

    this.addStoryNodeWithData();
    this.updateExplorationId();
  }
}

angular.module('oppia').directive('oppiaNewChapterTitleModal',
  downgradeComponent({
    component: NewChapterTitleModalComponent
  }) as angular.IDirectiveFactory);
