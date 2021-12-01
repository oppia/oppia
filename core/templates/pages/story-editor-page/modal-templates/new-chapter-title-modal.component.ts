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
 * @fileoverview Controller for new chapter title modal.
 */

import { ChangeDetectorRef, Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AppConstants } from "app.constants";
import { ConfirmOrCancelModal } from "components/common-layout-directives/common-elements/confirm-or-cancel-modal.component";
import { ExplorationIdValidationService } from "domain/exploration/exploration-id-validation.service";
import { StoryUpdateService } from "domain/story/story-update.service";
import { Story } from "domain/story/StoryObjectFactory";
import { ValidatorsService } from "services/validators.service";
import { StoryEditorStateService } from "../services/story-editor-state.service";
 
 
@Component({
  selector: 'oppia-new-chapter-title-modal',
  templateUrl: './new-chapter-title-modal.component.html'
})
export class CreateNewChapterModalComponent extends ConfirmOrCancelModal
  implements OnInit{
  @Input()  nodeTitles: string[];
  MAX_CHARS_IN_EXPLORATION_TITLE: number;
  title: string;
  invalidExpId: boolean;
  explorationId: string;
  errorMsg: string;
  invalidExpErrorString: string;
  story: Story;
  nodeId: string;
  editableThumbnailFilename: string;
  editableThumbnailBgColor: string;
  allowedBgColors: readonly string[];

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private explorationIdValidationService: ExplorationIdValidationService,
    private storyEditorStateService: StoryEditorStateService,
    private storyUpdateService: StoryUpdateService,
    private validatorsService: ValidatorsService,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.title = '';
    this.explorationId = '';
    this.invalidExpId = false;
    this.errorMsg = null;
    this.invalidExpErrorString = 'Please enter a valid exploration id.';
    this.MAX_CHARS_IN_EXPLORATION_TITLE =
      AppConstants.MAX_CHARS_IN_EXPLORATION_TITLE;
    this.story = this.storyEditorStateService.getStory();
    this.nodeId = this.story.getStoryContents().getNextNodeId();
    this.editableThumbnailFilename = '';
    this.editableThumbnailBgColor = '';
    this.allowedBgColors = (
      AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.chapter);
    this.storyUpdateService.addStoryNode(this.story, this.title);
  }

  updateThumbnailFilename(newThumbnailFilename: string): void {
    this.storyUpdateService.setStoryNodeThumbnailFilename(
      this.story, this.nodeId, newThumbnailFilename);
    this.editableThumbnailFilename = newThumbnailFilename;
  }

  updateThumbnailBgColor(newThumbnailBgColor: string): void {
    this.storyUpdateService.setStoryNodeThumbnailBgColor(
      this.story, this.nodeId, newThumbnailBgColor);
    this.editableThumbnailBgColor = newThumbnailBgColor;
  }
  updateTitle(): void {
    this.storyUpdateService.setStoryNodeTitle(
      this.story, this.nodeId, this.title);
  }
  cancel(): void {
    this.storyUpdateService.deleteStoryNode(this.story, this.nodeId);
    this.ngbActiveModal.dismiss('cancel');
  }

  updateExplorationId(): void {
    let nodes = this.story.getStoryContents().getNodes();
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].getExplorationId() === this.explorationId) {
        this.invalidExpErrorString = (
          'The given exploration already exists in the story.');
        this.invalidExpId = true;
        return;
      }
    }
    if (this.storyEditorStateService.isStoryPublished()) {
      this.explorationIdValidationService.isExpPublishedAsync(
          this.explorationId).then(function(expIdIsValid) {
            this.expIdIsValid = expIdIsValid;
            if (this.expIdIsValid) {
              this.soryUpdateService.setStoryNodeExplorationId(
                this.story, this.nodeId, this.explorationId);
              this.ngbActiveModal.close();
            } else {
              this.invalidExpId = true;
            }
          });
        } else {
          this.storyUpdateService.setStoryNodeExplorationId(
            this.story, this.nodeId, this.explorationId);
          this.ngbActiveModal.close();
        }
  }
  
  resetErrorMsg(): void {
    this.errorMsg = null;
    this.invalidExpId = false;
    this.invalidExpErrorString = 'Please enter a valid exploration id.';
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

  save(): void {
    if (this.nodeTitles.indexOf(this.title) !== -1) {
      this.errorMsg = 'A chapter with this title already exists';
      return;
    }
    this.updateTitle();
    this.updateExplorationId();
  }
}