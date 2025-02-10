// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the navbar of the story editor.
 */

import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {EditableStoryBackendApiService} from 'domain/story/editable-story-backend-api.service';
import {StoryValidationService} from 'domain/story/story-validation.service';
import {Story} from 'domain/story/story.model';
import {StoryNode} from 'domain/story/story-node.model';
import {Subscription} from 'rxjs';
import {AlertsService} from 'services/alerts.service';
import {StoryEditorStateService} from '../services/story-editor-state.service';
import {StoryUpdateService} from 'domain/story/story-update.service';
import {StoryEditorSaveModalComponent} from '../modal-templates/story-editor-save-modal.component';
import {StoryEditorUnpublishModalComponent} from '../modal-templates/story-editor-unpublish-modal.component';
import {Component, Input, OnInit} from '@angular/core';
import {StoryEditorNavigationService} from '../services/story-editor-navigation.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {DraftChapterConfirmationModalComponent} from '../modal-templates/draft-chapter-confirmation-modal.component';

@Component({
  selector: 'oppia-story-editor-navbar',
  templateUrl: './story-editor-navbar.component.html',
})
export class StoryEditorNavbarComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() commitMessage!: string;
  validationIssues!: string[];
  prepublishValidationIssues!: string | string[];
  story!: Story;
  storyNode!: StoryNode;
  activeTab!: string;
  forceValidateExplorations: boolean = false;
  storyIsPublished: boolean = false;
  warningsAreShown: boolean = false;
  showNavigationOptions: boolean = false;
  showStoryEditOptions: boolean = false;
  currentTab!: string;

  constructor(
    private storyEditorStateService: StoryEditorStateService,
    private undoRedoService: UndoRedoService,
    private storyValidationService: StoryValidationService,
    private editableStoryBackendApiService: EditableStoryBackendApiService,
    private ngbModal: NgbModal,
    private alertsService: AlertsService,
    private storyEditorNavigationService: StoryEditorNavigationService,
    private platformFeatureService: PlatformFeatureService,
    private storyUpdateService: StoryUpdateService
  ) {}

  EDITOR = 'Editor';
  PREVIEW = 'Preview';
  directiveSubscriptions = new Subscription();
  explorationValidationIssues: string[] = [];

  isSerialChapterFeatureFlagEnabled(): boolean {
    return this.platformFeatureService.status
      .SerialChapterLaunchCurriculumAdminView.isEnabled;
  }

  isStoryPublished(): boolean {
    return this.storyEditorStateService.isStoryPublished();
  }

  isSaveInProgress(): boolean {
    return this.storyEditorStateService.isSavingStory();
  }

  isChapterStatusBeingChanged(): boolean {
    return this.storyEditorStateService.isChangingChapterStatus();
  }

  getChangeListLength(): number {
    return this.undoRedoService.getChangeCount();
  }

  getWarningsCount(): number {
    return this.validationIssues.length;
  }

  getTotalWarningsCount(): number {
    return (
      this.validationIssues.length +
      this.explorationValidationIssues.length +
      this.prepublishValidationIssues.length
    );
  }

  isStorySaveable(): boolean {
    if (this.storyEditorStateService.isStoryPublished()) {
      return (
        this.getChangeListLength() > 0 && this.getTotalWarningsCount() === 0
      );
    }
    return this.getChangeListLength() > 0 && this.getWarningsCount() === 0;
  }

  isChapterPublishable(): boolean {
    return this.storyEditorStateService.isCurrentNodePublishable();
  }

  isPublishButtonDisabled(): boolean {
    return this.storyEditorStateService.getNewChapterPublicationIsDisabled();
  }

  areChaptersBeingPublished(): boolean {
    return this.storyEditorStateService.areChaptersBeingPublished();
  }

  isWarningTooltipDisabled(): boolean {
    return this.isStorySaveable() || this.getTotalWarningsCount() === 0;
  }

  getAllStoryWarnings(): string {
    return this.validationIssues
      .concat(this.explorationValidationIssues)
      .concat(this.prepublishValidationIssues)
      .join('\n');
  }

  discardChanges(): void {
    this.undoRedoService.clearChanges();
    this.storyEditorStateService.loadStory(this.story.getId());
    this._validateStory();
    this.forceValidateExplorations = true;
  }

  private _validateStory(): void {
    this.story = this.storyEditorStateService.getStory();
    this.validationIssues = this.story.validate();
    let nodes = this.story.getStoryContents().getNodes();
    if (this.currentTab === 'chapter_editor') {
      this.getStoryNodeData();
    }
    let skillIdsInTopic = this.storyEditorStateService
      .getSkillSummaries()
      .map(skill => skill.id);
    if (this.validationIssues.length === 0 && nodes.length > 0) {
      let prerequisiteSkillValidationIssues =
        this.storyValidationService.validatePrerequisiteSkillsInStoryContents(
          skillIdsInTopic,
          this.story.getStoryContents()
        );
      this.validationIssues = this.validationIssues.concat(
        prerequisiteSkillValidationIssues
      );
    }
    if (this.storyEditorStateService.getStoryWithUrlFragmentExists()) {
      this.validationIssues.push('Story URL fragment already exists.');
    }
    this.forceValidateExplorations = true;
    this._validateExplorations();
    let storyPrepublishValidationIssues = this.story.prepublishValidate();
    let nodePrepublishValidationIssues = Array.prototype.concat.apply(
      [],
      nodes.map(node => node.prepublishValidate())
    );
    this.prepublishValidationIssues = storyPrepublishValidationIssues.concat(
      nodePrepublishValidationIssues
    );
  }

  private _validateExplorations(): void {
    let nodes = this.story.getStoryContents().getNodes();
    let explorationIds: string[] = [];

    if (
      this.storyEditorStateService.areAnyExpIdsChanged() ||
      this.forceValidateExplorations
    ) {
      this.explorationValidationIssues = [];
      for (let i = 0; i < nodes.length; i++) {
        let explorationId = nodes[i].getExplorationId();
        if (explorationId !== null) {
          explorationIds.push(explorationId);
        } else {
          this.explorationValidationIssues.push(
            "Some chapters don't have exploration IDs provided."
          );
        }
      }
      this.forceValidateExplorations = false;
      if (explorationIds.length > 0) {
        this.editableStoryBackendApiService
          .validateExplorationsAsync(this.story.getId(), explorationIds)
          .then(validationIssues => {
            this.explorationValidationIssues =
              this.explorationValidationIssues.concat(validationIssues);
          });
      }
    }
    this.storyEditorStateService.resetExpIdsChanged();
  }

  saveChanges(): void {
    const modalRef = this.ngbModal.open(StoryEditorSaveModalComponent, {
      backdrop: 'static',
    });
    modalRef.componentInstance.bindedMessage = this.commitMessage;
    modalRef.result.then(
      commitMessage => {
        this.storyEditorStateService.saveStory(
          commitMessage,
          () => {},
          (errorMessage: string) => {
            this.alertsService.addInfoMessage(errorMessage, 5000);
          }
        );
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  saveChangesInReadyToPublishChapter(): void {
    if (!this.isChapterPublishable()) {
      const modalRef = this.ngbModal.open(
        DraftChapterConfirmationModalComponent,
        {backdrop: 'static'}
      );
      modalRef.result.then(
        () => {
          this.storyUpdateService.setStoryNodeStatus(
            this.story,
            this.storyNode.getId(),
            'Draft'
          );
          this.saveChanges();
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
    } else {
      this.saveChanges();
    }
  }

  publishStory(): void {
    this.storyEditorStateService.changeStoryPublicationStatus(true, () => {
      this.storyIsPublished = this.storyEditorStateService.isStoryPublished();
    });
  }

  unpublishStory(): void {
    this.ngbModal
      .open(StoryEditorUnpublishModalComponent, {backdrop: 'static'})
      .result.then(
        () => {
          this.storyEditorStateService.changeStoryPublicationStatus(
            false,
            () => {
              this.storyIsPublished =
                this.storyEditorStateService.isStoryPublished();
              this.forceValidateExplorations = true;
              this._validateStory();
            }
          );
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  changeChapterStatus(newStatus: string): void {
    this.storyEditorStateService.setChapterStatusIsChanging(true);
    if (newStatus === 'Published') {
      let selectedChapterIndexInPublishUptoDropdown =
        this.storyEditorStateService.getSelectedChapterIndexInPublishUptoDropdown();
      let nodes = this.story.getStoryContents().getLinearNodesList();
      let lastPublishedChapterIndex = -1;
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].getStatus() === 'Published') {
          lastPublishedChapterIndex = i;
        }
      }

      if (
        selectedChapterIndexInPublishUptoDropdown < lastPublishedChapterIndex
      ) {
        const modalRef = this.ngbModal.open(
          StoryEditorUnpublishModalComponent,
          {backdrop: 'static'}
        );
        let unpublishedChapters = [];
        for (
          let i = Number(selectedChapterIndexInPublishUptoDropdown) + 1;
          i <= lastPublishedChapterIndex;
          i++
        ) {
          unpublishedChapters.push(Number(i) + 1);
        }
        modalRef.componentInstance.unpublishedChapters = unpublishedChapters;
        modalRef.result.then(
          unpublishingReason => {
            for (
              let i = Number(selectedChapterIndexInPublishUptoDropdown) + 1;
              i <= lastPublishedChapterIndex;
              i++
            ) {
              this.storyUpdateService.setStoryNodeStatus(
                this.story,
                nodes[i].getId(),
                'Draft'
              );
              this.storyUpdateService.setStoryNodeUnpublishingReason(
                this.story,
                nodes[i].getId(),
                unpublishingReason
              );
              if (nodes[i].getPlannedPublicationDateMsecs()) {
                this.storyUpdateService.setStoryNodePlannedPublicationDateMsecs(
                  this.story,
                  nodes[i].getId(),
                  null
                );
              }
            }
            if (Number(selectedChapterIndexInPublishUptoDropdown) === -1) {
              this.unpublishStory();
            }
            this.storyEditorStateService.saveStory(
              'Unpublished chapters',
              () => {
                this.storyEditorStateService.loadStory(this.story.getId());
                this._validateStory();
              },
              (errorMessage: string) => {
                this.alertsService.addInfoMessage(errorMessage, 5000);
              }
            );
          },
          () => {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          }
        );
      } else {
        for (
          let i = Number(lastPublishedChapterIndex) + 1;
          i <= selectedChapterIndexInPublishUptoDropdown;
          i++
        ) {
          this.storyUpdateService.setStoryNodeStatus(
            this.story,
            nodes[i].getId(),
            'Published'
          );
          this.storyUpdateService.setStoryNodeUnpublishingReason(
            this.story,
            nodes[i].getId(),
            null
          );
          if (nodes[i].getFirstPublicationDateMsecs() === null) {
            let currentDate = new Date();
            this.storyUpdateService.setStoryNodeFirstPublicationDateMsecs(
              this.story,
              nodes[i].getId(),
              currentDate.getTime()
            );
          }
        }
        if (lastPublishedChapterIndex === -1) {
          this.publishStory();
        }
        this.storyEditorStateService.saveStory(
          'Published chapters',
          () => {
            this.storyEditorStateService.loadStory(this.story.getId());
            this._validateStory();
          },
          (errorMessage: string) => {
            this.alertsService.addInfoMessage(errorMessage, 5000);
          }
        );
      }
      return;
    }

    let oldStatus = this.storyNode.getStatus();
    this.storyUpdateService.setStoryNodeStatus(
      this.story,
      this.storyNode.getId(),
      newStatus
    );
    this.storyEditorStateService.saveChapter(
      () => {},
      () => {
        this.storyUpdateService.setStoryNodeStatus(
          this.story,
          this.storyNode.getId(),
          oldStatus
        );
      }
    );
  }

  toggleWarningText(): void {
    this.warningsAreShown = !this.warningsAreShown;
  }

  toggleNavigationOptions(): void {
    this.showNavigationOptions = !this.showNavigationOptions;
  }

  toggleStoryEditOptions(): void {
    this.showStoryEditOptions = !this.showStoryEditOptions;
  }

  selectMainTab(): void {
    this.activeTab = this.EDITOR;
    this.storyEditorNavigationService.navigateToStoryEditor();
    this.showNavigationOptions = false;
  }

  selectPreviewTab(): void {
    this.activeTab = this.PREVIEW;
    this.storyEditorNavigationService.navigateToStoryPreviewTab();
    this.showNavigationOptions = false;
  }

  getStoryNodeData(): void {
    let nodeId = this.storyEditorNavigationService.getChapterId();
    let nodeIndex = this.story.getStoryContents().getNodeIndex(nodeId);
    this.storyNode = this.story.getStoryContents().getLinearNodesList()[
      nodeIndex
    ];
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryInitialized.subscribe(() =>
        this._validateStory()
      )
    );
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryReinitialized.subscribe(() =>
        this._validateStory()
      )
    );
    this.directiveSubscriptions.add(
      this.storyEditorNavigationService.onChangeActiveTab.subscribe(tab => {
        this.currentTab = tab;
        if (tab === 'chapter_editor') {
          this.getStoryNodeData();
        }
      })
    );
    this.forceValidateExplorations = true;
    this.warningsAreShown = false;
    this.activeTab = this.EDITOR;
    this.currentTab = this.storyEditorNavigationService.getActiveTab();
    this.showNavigationOptions = false;
    this.showStoryEditOptions = false;
    this.story = this.storyEditorStateService.getStory();
    this.validationIssues = [];
    this.prepublishValidationIssues = [];
    this.directiveSubscriptions.add(
      this.undoRedoService
        .getUndoRedoChangeEventEmitter()
        .subscribe(() => this._validateStory())
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
