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
 * @fileoverview Component for the story node editor.
 */

import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { CuratedExplorationValidationService } from 'domain/exploration/curated-exploration-validation.service';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { StoryUpdateService } from 'domain/story/story-update.service';
import { Story } from 'domain/story/story.model';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { PageTitleService } from 'services/page-title.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { StoryEditorStateService } from '../services/story-editor-state.service';
import { PlatformFeatureService } from 'services/platform-feature.service';

@Component({
  selector: 'oppia-story-node-editor',
  templateUrl: './story-node-editor.component.html'
})
export class StoryNodeEditorComponent implements OnInit, OnDestroy {
  @Input() nodeId: string;
  @Input() outline: string;
  @Input() description: string;
  @Input() explorationId: string;
  @Input() thumbnailFilename: string;
  @Input() thumbnailBgColor: string;
  @Input() outlineIsFinalized: boolean;
  @Input() destinationNodeIds: string[];
  @Input() prerequisiteSkillIds: string[];
  @Input() acquiredSkillIds: string[];
  @Input() plannedPublicationDateMsecs: number;

  chapterPreviewCardIsShown = false;
  mainChapterCardIsShown = true;
  explorationInputButtonsAreShown = false;
  chapterOutlineButtonsAreShown = false;
  skillIdToSummaryMap = {};
  chapterOutlineIsShown: boolean = false;
  chapterTodoCardIsShown: boolean = false;
  prerequisiteSkillIsShown: boolean = false;
  acquiredSkillIsShown = false;
  explorationIdPattern = /^[a-zA-Z0-9_-]+$/;
  expIdCanBeSaved = true;

  story: Story;
  storyNodeIds: string[];
  nodeIdToTitleMap: Object;
  skillInfoHasLoaded = false;
  allowedBgColors = AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.chapter;
  isStoryPublished: () => boolean;
  currentTitle: string;
  editableTitle: string;
  currentDescription: string;
  editableDescription: string;
  editableThumbnailFilename: string;
  editableThumbnailBgColor: string;
  oldOutline: string;
  editableOutline: string;
  currentExplorationId: string;
  expIdIsValid: boolean;
  invalidExpErrorIsShown: boolean;
  nodeTitleEditorIsShown: boolean;
  plannedPublicationDate: Date | null;
  editablePlannedPublicationDate: Date | null;
  plannedPublicationDateIsInPast: boolean = false;

  OUTLINE_SCHEMA = {
    type: 'html',
    ui_config: {
      startupFocusEnabled: false,
      rows: 100
    }
  };

  private _categorizedSkills = {};
  private _untriagedSkillSummaries = {};

  subscriptions = new Subscription();
  newNodeId: string;
  availableNodes;

  constructor(
    private alertsService: AlertsService,
    private curatedExplorationValidationService:
    CuratedExplorationValidationService,
    private changeDetectorRef: ChangeDetectorRef,
    private focusManagerService: FocusManagerService,
    private ngbModal: NgbModal,
    private pageTitleService: PageTitleService,
    private skillBackendApiService: SkillBackendApiService,
    private storyEditorStateService: StoryEditorStateService,
    private storyUpdateService: StoryUpdateService,
    private topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService,
    private windowDimensionsService: WindowDimensionsService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  isSerialChapterFeatureFlagEnabled(): boolean {
    return (
      this.platformFeatureService.
        status.SerialChapterLaunchCurriculumAdminView.isEnabled);
  }

  private _init(): void {
    this.story = this.storyEditorStateService.getStory();
    this.storyNodeIds = this.story.getStoryContents().getNodeIds();
    this.nodeIdToTitleMap = this.story.getStoryContents().getNodeIdsToTitleMap(
      this.storyNodeIds);
    this.skillInfoHasLoaded = false;

    this._recalculateAvailableNodes();

    let skillSummaries = this.storyEditorStateService.getSkillSummaries();

    this.topicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
      .then((response) => {
        this._categorizedSkills = response.categorizedSkillsDict;
        this._untriagedSkillSummaries = response.untriagedSkillSummaries;
        this.skillInfoHasLoaded = true;
      });

    for (let idx in skillSummaries) {
      this.skillIdToSummaryMap[skillSummaries[idx].id] =
      skillSummaries[idx].description;
    }

    this.isStoryPublished = this.storyEditorStateService.isStoryPublished;
    this.currentTitle = this.nodeIdToTitleMap[this.nodeId];
    this.pageTitleService.setNavbarSubtitleForMobileView(this.currentTitle);
    this.editableTitle = this.currentTitle;
    this.currentDescription = this.description;
    this.editableDescription = this.currentDescription;
    this.editableThumbnailFilename = this.thumbnailFilename;
    this.editableThumbnailBgColor = this.thumbnailBgColor;
    this.oldOutline = this.outline;
    this.editableOutline = this.outline;
    this.currentExplorationId = this.explorationId;
    this.expIdIsValid = true;
    this.invalidExpErrorIsShown = false;
    this.nodeTitleEditorIsShown = false;
    this.plannedPublicationDate = this.plannedPublicationDateMsecs ? new Date(
      this.plannedPublicationDateMsecs) : null;
    this.editablePlannedPublicationDate = this.plannedPublicationDate;

    this.updateCurrentNodeIsPublishable();
  }

  getSkillEditorUrl(skillId: string): string {
    return '/skill_editor/' + skillId;
  }

  getPrerequisiteSkillsDescription(): void {
    const skills = this.prerequisiteSkillIds;

    if (skills && skills.length > 0) {
      this.skillBackendApiService.fetchMultiSkillsAsync(skills).then(
        (response) => {
          for (let idx in response) {
            this.skillIdToSummaryMap[response[idx].getId()] = (
              response[idx].getDescription());
          }
        }, (error) => {
          this.alertsService.addWarning('');
        });
    }
  }

  checkCanSaveExpId(): void {
    this.expIdCanBeSaved = this.explorationIdPattern.test(
      this.explorationId) || !this.explorationId;
    this.invalidExpErrorIsShown = false;
  }

  updateTitle(newTitle: string): void {
    if (newTitle !== this.currentTitle) {
      let titleIsValid = true;

      for (let idx in this.story.getStoryContents().getNodes()) {
        let node = this.story.getStoryContents().getNodes()[idx];
        if (node.getTitle() === newTitle) {
          titleIsValid = false;
          this.alertsService.addInfoMessage(
            'A chapter already exists with given title.', 5000
          );
        }
      }

      if (titleIsValid) {
        this.storyUpdateService.setStoryNodeTitle(
          this.story, this.nodeId, newTitle);
        this.currentTitle = newTitle;
        this.updateCurrentNodeIsPublishable();
      }
    }
  }

  updateDescription(newDescription: string): void {
    if (newDescription !== this.currentDescription) {
      this.storyUpdateService.setStoryNodeDescription(
        this.story, this.nodeId, newDescription);
      this.currentDescription = newDescription;
      this.updateCurrentNodeIsPublishable();
    }
  }

  updatePlannedPublicationDate(dateString: string | null): void {
    let newPlannedPublicationDate = dateString ? new Date(dateString) : null;

    if (newPlannedPublicationDate !== this.plannedPublicationDate) {
      if (newPlannedPublicationDate) {
        let currentDateTime = new Date();
        if (newPlannedPublicationDate.getTime() < currentDateTime.getTime()) {
          this.plannedPublicationDateIsInPast = true;
          if (this.plannedPublicationDate) {
            this.storyUpdateService.setStoryNodePlannedPublicationDateMsecs(
              this.story, this.nodeId, null);
          }
          this.plannedPublicationDate = null;
          this.editablePlannedPublicationDate = null;
          return;
        } else if (this.plannedPublicationDate === null ||
          this.plannedPublicationDate.getTime() !==
          newPlannedPublicationDate.getTime()) {
          this.storyUpdateService.setStoryNodePlannedPublicationDateMsecs(
            this.story, this.nodeId, newPlannedPublicationDate.getTime());
          this.plannedPublicationDate = newPlannedPublicationDate;
          this.plannedPublicationDateIsInPast = false;
        }
      } else {
        this.storyUpdateService.setStoryNodePlannedPublicationDateMsecs(
          this.story, this.nodeId, null);
        this.plannedPublicationDate = null;
        this.plannedPublicationDateIsInPast = false;
      }
    }

    this.updateCurrentNodeIsPublishable();
  }

  updateThumbnailFilename(newThumbnailFilename: string): void {
    if (newThumbnailFilename !== this.editableThumbnailFilename) {
      this.storyUpdateService.setStoryNodeThumbnailFilename(
        this.story, this.nodeId, newThumbnailFilename);
      this.updateCurrentNodeIsPublishable();
    }
  }

  updateThumbnailBgColor(newThumbnailBgColor: string): void {
    if (newThumbnailBgColor !== this.editableThumbnailBgColor) {
      this.storyUpdateService.setStoryNodeThumbnailBgColor(
        this.story, this.nodeId, newThumbnailBgColor);
      this.editableThumbnailBgColor = newThumbnailBgColor;
      this.updateCurrentNodeIsPublishable();
    }
  }

  updateCurrentNodeIsPublishable(): void {
    if (this.currentTitle && this.currentDescription && this.explorationId &&
      (this.editableThumbnailBgColor || this.editableThumbnailFilename) &&
      this.outlineIsFinalized && this.plannedPublicationDate) {
      this.storyEditorStateService.setCurrentNodeAsPublishable(true);
    } else {
      this.storyEditorStateService.setCurrentNodeAsPublishable(false);
    }
  }

  viewNodeEditor(nodeId: string): void {
    this.storyEditorStateService.onViewStoryNodeEditor.emit(nodeId);
  }

  finalizeOutline(): void {
    this.storyUpdateService.finalizeStoryNodeOutline(this.story, this.nodeId);
    this.outlineIsFinalized = true;
    this.updateCurrentNodeIsPublishable();
  }

  updateExplorationId(explorationId: string): void {
    this.toggleExplorationInputButtons();

    if (this.storyEditorStateService.isStoryPublished()) {
      if (explorationId === '' || explorationId === null) {
        this.alertsService.addInfoMessage(
          'You cannot remove an exploration from a published story.', 5000);
        return;
      }

      this.curatedExplorationValidationService.isExpPublishedAsync(
        explorationId)
        .then((expIdIsValid) => {
          this.expIdIsValid = expIdIsValid;

          if (this.expIdIsValid) {
            this.storyUpdateService.setStoryNodeExplorationId(
              this.story, this.nodeId, explorationId);
            this.currentExplorationId = explorationId;
          } else {
            this.invalidExpErrorIsShown = true;
          }
        });
    } else {
      if (explorationId === '') {
        this.alertsService.addInfoMessage(
          'Please click the delete icon to remove an exploration ' +
          'from the story.', 5000);
        return;
      }

      this.storyUpdateService.setStoryNodeExplorationId(
        this.story, this.nodeId, explorationId);
      this.currentExplorationId = explorationId;
      if (explorationId === null) {
        this.explorationId = null;
      }
    }
  }

  removePrerequisiteSkillId(skillId: string): void {
    this.storyUpdateService.removePrerequisiteSkillIdFromNode(
      this.story, this.nodeId, skillId);
  }

  addPrerequisiteSkillId(): void {
    let sortedSkillSummaries = this.storyEditorStateService.getSkillSummaries();
    let allowSkillsFromOtherTopics = true;
    let skillsInSameTopicCount = 0;
    let modalRef: NgbModalRef = this.ngbModal.open(
      SelectSkillModalComponent, {
        backdrop: 'static',
        windowClass: 'skill-select-modal',
        size: 'xl'
      }
    );

    modalRef.componentInstance.skillSummaries = sortedSkillSummaries;
    modalRef.componentInstance.skillsInSameTopicCount = (
      skillsInSameTopicCount);
    modalRef.componentInstance.categorizedSkills = this._categorizedSkills;
    modalRef.componentInstance.allowSkillsFromOtherTopics = (
      allowSkillsFromOtherTopics);
    modalRef.componentInstance.untriagedSkillSummaries = (
      this._untriagedSkillSummaries);

    modalRef.result.then((summary) => {
      try {
        this.skillIdToSummaryMap[summary.id] = summary.description;
        this.storyUpdateService.addPrerequisiteSkillIdToNode(
          this.story, this.nodeId, summary.id);
        // The catch parameter type can only be any or unknown. The type
        // 'unknown' is safer than type 'any' because it reminds us
        // that we need to performsome sorts of type-checks before
        // operating on our values.
      } catch (err: unknown) {
        if (err instanceof Error) {
          this.alertsService.addInfoMessage(
            err.message, 5000);
        }
      }
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  addAcquiredSkillId(): void {
    let sortedSkillSummaries = (
      this.storyEditorStateService.getSkillSummaries());
    let allowSkillsFromOtherTopics = false;
    let skillsInSameTopicCount = 0;
    let topicName = this.storyEditorStateService.getTopicName();
    let categorizedSkillsInTopic = {};
    categorizedSkillsInTopic[topicName] = this._categorizedSkills[topicName];
    let modalRef: NgbModalRef = this.ngbModal.open(
      SelectSkillModalComponent, {
        backdrop: 'static',
        windowClass: 'skill-select-modal',
        size: 'xl'
      });

    modalRef.componentInstance.skillSummaries = sortedSkillSummaries;
    modalRef.componentInstance.skillsInSameTopicCount = (
      skillsInSameTopicCount);
    modalRef.componentInstance.categorizedSkills = this._categorizedSkills;
    modalRef.componentInstance.allowSkillsFromOtherTopics = (
      allowSkillsFromOtherTopics);
    modalRef.componentInstance.untriagedSkillSummaries = (
      this._untriagedSkillSummaries);

    modalRef.result.then((summary) => {
      try {
        this.storyUpdateService.addAcquiredSkillIdToNode(
          this.story, this.nodeId, summary.id);
      } catch (err) {
        this.alertsService.addInfoMessage(
          'Given skill is already an acquired skill', 5000);
      }
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  removeAcquiredSkillId(skillId: string): void {
    this.storyUpdateService.removeAcquiredSkillIdFromNode(
      this.story, this.nodeId, skillId);
  }

  unfinalizeOutline(): void {
    this.storyUpdateService.unfinalizeStoryNodeOutline(this.story, this.nodeId);
    this.outlineIsFinalized = false;
    this.updateCurrentNodeIsPublishable();
  }

  openNodeTitleEditor(): void {
    this.nodeTitleEditorIsShown = true;
  }

  closeNodeTitleEditor(): void {
    this.nodeTitleEditorIsShown = false;
  }

  isOutlineModified(outline: string): boolean {
    return this.oldOutline !== outline;
  }

  updateOutline(newOutline: string): void {
    if (this.isOutlineModified(newOutline)) {
      this.storyUpdateService.setStoryNodeOutline(
        this.story, this.nodeId, newOutline);
      this.oldOutline = newOutline;
    }
  }

  togglePreview(): void {
    this.chapterPreviewCardIsShown = !this.chapterPreviewCardIsShown;
  }

  togglePrerequisiteSkillsList(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.prerequisiteSkillIsShown = !this.prerequisiteSkillIsShown;
    }
  }

  toggleChapterOutline(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.chapterOutlineIsShown = !this.chapterOutlineButtonsAreShown;
    }
  }

  toggleAcquiredSkillsList(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.acquiredSkillIsShown = !this.acquiredSkillIsShown;
    }
  }

  toggleChapterCard(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.mainChapterCardIsShown = !this.mainChapterCardIsShown;
    }
  }

  toggleChapterTodoCard(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.chapterTodoCardIsShown = !this.chapterTodoCardIsShown;
    }
  }

  toggleExplorationInputButtons(): void {
    this.explorationInputButtonsAreShown = (
      !this.explorationInputButtonsAreShown);
  }

  updateLocalEditableOutline($event: string): void {
    if (this.editableOutline !== $event) {
      this.editableOutline = $event;
      if (!this.chapterOutlineButtonsAreShown && $event) {
        this.toggleChapterOutlineButtons();
      }
      this.changeDetectorRef.detectChanges();
    }
  }

  toggleChapterOutlineButtons(): void {
    this.chapterOutlineButtonsAreShown = !this.chapterOutlineButtonsAreShown;
  }

  _recalculateAvailableNodes(): void {
    this.newNodeId = null;
    this.availableNodes = [];
    let linearNodesList = this.story.getStoryContents().getLinearNodesList();

    let linearNodeIds = linearNodesList.map((node) => node.getId());

    for (let i = 0; i < this.storyNodeIds.length; i++) {
      if (this.storyNodeIds[i] === this.nodeId) {
        continue;
      }

      if (this.destinationNodeIds.indexOf(this.storyNodeIds[i])) {
        continue;
      }

      if (linearNodeIds.indexOf(this.storyNodeIds[i]) === -1) {
        this.availableNodes.push({
          id: this.storyNodeIds[i],
          text: this.nodeIdToTitleMap[this.storyNodeIds[i]]
        });
      }
    }
  }

  ngOnInit(): void {
    this.pageTitleService.setNavbarTitleForMobileView('Chapter Editor');
    this.chapterOutlineIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.chapterTodoCardIsShown = (
      !this.windowDimensionsService.isWindowNarrow());
    this.prerequisiteSkillIsShown = (
      !this.windowDimensionsService.isWindowNarrow());
    this.acquiredSkillIsShown = (
      !this.windowDimensionsService.isWindowNarrow());

    this.subscriptions.add(
      this.storyEditorStateService.onStoryInitialized.subscribe(
        () => this._init())
    );

    this.subscriptions.add(
      this.storyEditorStateService.onStoryReinitialized.subscribe(
        () => this._init())
    );

    this.subscriptions.add(
      this.storyEditorStateService.onRecalculateAvailableNodes.subscribe(
        () => this._recalculateAvailableNodes()
      )
    );

    this._init();

    // The setTimeout is required because at execution time,
    // the element may not be present in the DOM yet.Thus it ensure
    // that the element is visible before focussing.
    setTimeout(() => {
      this.focusManagerService.setFocusWithoutScroll('storyNodeDesc');
    }, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaStoryNodeEditor', downgradeComponent({
  component: StoryNodeEditorComponent
}));
