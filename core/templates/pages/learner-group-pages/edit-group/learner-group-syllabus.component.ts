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
 * @fileoverview Component for the learner group syllabus.
 */

import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { LearnerGroupBackendApiService } from 'domain/learner_group/learner-group-backend-api.service';
import { LearnerGroupSubtopicSummary } from 'domain/learner_group/learner-group-subtopic-summary.model';
import { LearnerGroupSyllabusBackendApiService } from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { StorySummary } from 'domain/story/story-summary.model';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { SyllabusAdditionSuccessModalComponent } from '../templates/syllabus-addition-success-modal.component';
import { RemoveItemModalComponent } from
  '../templates/remove-item-modal.component';

import './learner-group-syllabus.component.css';


@Component({
  selector: 'oppia-learner-group-syllabus',
  templateUrl: './learner-group-syllabus.component.html',
  styleUrls: ['./learner-group-syllabus.component.css']
})
export class LearnerGroupSyllabusComponent implements OnInit {
  @Input() learnerGroup!: LearnerGroupData;
  subtopicSummaries!: LearnerGroupSubtopicSummary[];
  storySummaries!: StorySummary[];
  displayOrderOfSyllabusItems: string[] = [];
  addNewSyllabusItemsModeIsActive = false;
  newlyAddedStorySummaries: StorySummary[] = [];
  newlyAddedSubtopicSummaries: LearnerGroupSubtopicSummary[] = [];
  newlyAddedStoryIds: string[] = [];
  newlyAddedSubtopicIds: string[] = [];

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private ngbModal: NgbModal,
    private learnerGroupBackendApiService:
      LearnerGroupBackendApiService,
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService
  ) {}

  ngOnInit(): void {
    if (this.learnerGroup) {
      this.learnerGroupSyllabusBackendApiService.fetchLearnerGroupSyllabus(
        this.learnerGroup.id).then(groupSyllabus => {
        this.subtopicSummaries = groupSyllabus.subtopicPageSummaries;
        this.storySummaries = groupSyllabus.storySummaries;
        this.setDisplayOrderOfSyllabusItems();
      });
    }
  }

  setDisplayOrderOfSyllabusItems(): void {
    let topicNameToSyllabusMap: Record<string, string[]> = {};

    this.storySummaries.map((summary, index) => {
      const topicName = summary.getTopicName();
      if (topicName && topicNameToSyllabusMap.hasOwnProperty(topicName)) {
        topicNameToSyllabusMap[topicName].push(`story-${index}`);
      } else if (topicName) {
        topicNameToSyllabusMap[topicName] = [`story-${index}`];
      }
    });

    this.subtopicSummaries.map((summary, index) => {
      const topicName = summary.parentTopicName;
      if (topicName && topicNameToSyllabusMap.hasOwnProperty(topicName)) {
        topicNameToSyllabusMap[topicName].push(`subtopic-${index}`);
      } else if (topicName) {
        topicNameToSyllabusMap[topicName] = [`subtopic-${index}`];
      }
    });

    this.displayOrderOfSyllabusItems = [];
    Object.values(topicNameToSyllabusMap).forEach(syllabus => {
      this.displayOrderOfSyllabusItems.push(...syllabus);
    });
  }

  isDisplayedItemStory(item: string): boolean {
    return item.startsWith('story');
  }

  isDisplayedItemSubtopic(item: string): boolean {
    return item.startsWith('subtopic');
  }

  getIndexToDisplay(item: string): number {
    return parseInt(item.split('-')[1]);
  }

  getSubtopicThumbnailUrl(
      subtopicSummary: LearnerGroupSubtopicSummary
  ): string {
    let thumbnailUrl = '';
    if (subtopicSummary.thumbnailFilename) {
      thumbnailUrl = (
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.TOPIC, subtopicSummary.parentTopicId,
          subtopicSummary.thumbnailFilename
        )
      );
    }
    return thumbnailUrl;
  }

  getStoryThumbnailUrl(storySummary: StorySummary): string {
    let thumbnailUrl = '';
    if (storySummary.getThumbnailFilename()) {
      thumbnailUrl = (
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.STORY, storySummary.getId(),
          storySummary.getThumbnailFilename()
        )
      );
    }
    return thumbnailUrl;
  }

  toggleAddNewSyllabusItemsMode(): void {
    this.addNewSyllabusItemsModeIsActive = (
      !this.addNewSyllabusItemsModeIsActive
    );
  }

  isAddNewSyllabusItemsModeActive(): boolean {
    return this.addNewSyllabusItemsModeIsActive;
  }

  isNewSyllabusAdded(): boolean {
    return (
      this.newlyAddedStoryIds.length > 0 ||
      this.newlyAddedSubtopicIds.length > 0
    );
  }

  updateNewlyAddedStoryIds(storyIds: string[]): void {
    this.newlyAddedStoryIds = storyIds;
  }

  updateNewlyAddedSubtopicIds(subtopicIds: string[]): void {
    this.newlyAddedSubtopicIds = subtopicIds;
  }

  updateNewlyAddedStorySummaries(storySummaries: StorySummary[]): void {
    this.newlyAddedStorySummaries = storySummaries;
  }

  updateNewlyAddedSubtopicSummaries(
      subtopicSummaries: LearnerGroupSubtopicSummary[]
  ): void {
    this.newlyAddedSubtopicSummaries = subtopicSummaries;
  }

  saveNewSyllabusItems(): void {
    this.learnerGroup.addStoryIds(this.newlyAddedStoryIds);
    this.learnerGroup.addSubtopicPageIds(this.newlyAddedSubtopicIds);
    this.learnerGroupBackendApiService.updateLearnerGroupAsync(
      this.learnerGroup).then((learnerGroup) => {
      this.subtopicSummaries.push(...this.newlyAddedSubtopicSummaries);
      this.storySummaries.push(...this.newlyAddedStorySummaries);
      this.newlyAddedStoryIds = [];
      this.newlyAddedSubtopicIds = [];
      this.newlyAddedStorySummaries = [];
      this.newlyAddedSubtopicSummaries = [];
      this.learnerGroup = learnerGroup;
      this.setDisplayOrderOfSyllabusItems();
    });

    let modelRef = this.ngbModal.open(
      SyllabusAdditionSuccessModalComponent, {
        backdrop: true,
        windowClass: 'added-syllabus-items-successfully-modal'
      });

    modelRef.componentInstance.itemsAddedCount = (
      this.newlyAddedStoryIds.length + this.newlyAddedSubtopicIds.length
    );
    modelRef.result.then(() => {
      this.toggleAddNewSyllabusItemsMode();
    }, () => {
      this.ngOnInit();
    });
  }

  removeSubtopicPageIdFromSyllabus(subtopicPageId: string): void {
    let modalRef = this.ngbModal.open(
      RemoveItemModalComponent, {
        backdrop: true,
        windowClass: 'remove-syllabus-item-modal'
      });
    modalRef.componentInstance.confirmationTitle = 'Remove Skill';
    modalRef.componentInstance.confirmationMessage = (
      'Are you sure you want to remove this item from the syllabus?'
    );

    modalRef.result.then(() => {
      this.learnerGroup.removeSubtopicPageId(subtopicPageId);
      this.learnerGroupBackendApiService.updateLearnerGroupAsync(
        this.learnerGroup).then((learnerGroup) => {
        this.subtopicSummaries = this.subtopicSummaries.filter(
          subtopicSummary => subtopicSummary.subtopicPageId !== subtopicPageId
        );
        this.learnerGroup = learnerGroup;
        this.setDisplayOrderOfSyllabusItems();
      });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  removeStoryIdFromSyllabus(storyId: string): void {
    let modalRef = this.ngbModal.open(
      RemoveItemModalComponent, {
        backdrop: true,
        windowClass: 'remove-syllabus-item-modal'
      });
    modalRef.componentInstance.confirmationTitle = 'Remove Lesson';
    modalRef.componentInstance.confirmationMessage = (
      'Are you sure you want to remove this item from the syllabus?'
    );

    modalRef.result.then(() => {
      this.learnerGroup.removeStoryId(storyId);
      this.learnerGroupBackendApiService.updateLearnerGroupAsync(
        this.learnerGroup).then((learnerGroup) => {
        this.storySummaries = this.storySummaries.filter(
          storySummary => storySummary.getId() !== storyId);
        this.learnerGroup = learnerGroup;
        this.setDisplayOrderOfSyllabusItems();
      });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}
