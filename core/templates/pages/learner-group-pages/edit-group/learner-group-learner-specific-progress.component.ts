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
 * @fileoverview Component for the learner group learner specific progress.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ChapterProgressSummary } from
  'domain/exploration/chapter-progress-summary.model';
import { LearnerGroupSyllabusBackendApiService }
  from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { LearnerGroupUserProgress } from
  'domain/learner_group/learner-group-user-progress.model';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';

import './learner-group-learner-specific-progress.component.css';


@Component({
  selector: 'oppia-learner-group-learner-specific-progress',
  templateUrl: './learner-group-learner-specific-progress.component.html',
  styleUrls: ['./learner-group-learner-specific-progress.component.css']
})
export class LearnerGroupLearnerSpecificProgressComponent {
  @Input() learnerProgress!: LearnerGroupUserProgress;
  @Input() storiesChaptersProgress!: ChapterProgressSummary[];
  activeTab!: string;
  topicNames: string[] = [];
  storyIds: string[] = [];
  latestChapterProgressIndex = 0;
  cummulativeStoryChaptersCount: number[] = [];
  EDIT_OVERVIEW_SECTIONS_I18N_IDS = (
    LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS);

  constructor(
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService,
    private storyViewerBackendApiService: StoryViewerBackendApiService
  ) {}

  ngOnInit(): void {
    this.activeTab = this.EDIT_OVERVIEW_SECTIONS_I18N_IDS.SKILLS_ANALYSIS;
    if (this.learnerProgress) {
      this.learnerProgress.subtopicsProgress.forEach(subtopicProgress => {
        if (!this.topicNames.includes(subtopicProgress.parentTopicName)) {
          this.topicNames.push(subtopicProgress.parentTopicName);
        }
      });
      this.learnerProgress.storiesProgress.forEach(storyProgress => {
        this.storyIds.push(storyProgress.getId());
        let previousChaptersCount = (
          this.cummulativeStoryChaptersCount.slice(-1).pop());
        if (previousChaptersCount) {
          this.cummulativeStoryChaptersCount.push(
            previousChaptersCount + storyProgress.getNodeTitles().length);
        } else {
          this.cummulativeStoryChaptersCount.push(
            storyProgress.getNodeTitles().length);
        }
      });

      this.storyViewerBackendApiService.fetchProgressInStoriesChapters(
        this.learnerProgress.username, this.storyIds
      ).then(storiesChaptersProgress => {
        this.storiesChaptersProgress = storiesChaptersProgress;
      });
    }
  }

  isTabActive(tabName: string): boolean {
    return this.activeTab === tabName;
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
  }

  getProfileImageDataUrl(dataUrl: string): string {
    return decodeURIComponent(dataUrl);
  }

  getAllCheckpointsProgressOfChapter(
      storyIndex: number, chapterIndex: number
  ): number[] {
    let chapterProgressIndex = chapterIndex;
    if (storyIndex !== 0) {
      chapterProgressIndex += (
        this.cummulativeStoryChaptersCount[storyIndex - 1]
      );
    }
    const chapterProgress = this.storiesChaptersProgress[chapterProgressIndex];
    if (this.isChapterCompleted(storyIndex, chapterIndex)) {
      return Array(chapterProgress.totalCheckpoints).fill(1);
    }
    let allCheckpointsProgress: number[] = [];
    for (let i = 0; i < chapterProgress.totalCheckpoints; i++) {
      if (i < (chapterProgress.visitedCheckpoints - 1)) {
        allCheckpointsProgress.push(1);
      } else if (i === (chapterProgress.visitedCheckpoints - 1)) {
        allCheckpointsProgress.push(2);
      } else {
        allCheckpointsProgress.push(0);
      }
    }
    return allCheckpointsProgress;
  }

  isChapterCompleted(storyIndex: number, chapterIndex: number): boolean {
    const story = this.learnerProgress.storiesProgress[storyIndex];
    const chapterTitle = story.getNodeTitles()[chapterIndex];
    if (story.getCompletedNodeTitles().includes(chapterTitle)) {
      return true;
    }
    return false;
  }

  getCompletedProgressBarWidth(
      storyIndex: number, chapterIndex: number
  ): number {
    const checkpointsProgress = this.getAllCheckpointsProgressOfChapter(
      storyIndex, chapterIndex);
    const completedCheckpoints = checkpointsProgress.filter(
      checkpointProgress => checkpointProgress === 1
    ).length;
    const spaceBetweenEachNode = 100 / (checkpointsProgress.length - 1);
    return (
      ((completedCheckpoints - 1) * spaceBetweenEachNode) +
      (spaceBetweenEachNode / 2));
  }

  getVisitedCheckpointsCount(
      storyIndex: number, chapterIndex: number
  ): number {
    const checkpointsProgress = this.getAllCheckpointsProgressOfChapter(
      storyIndex, chapterIndex);
    return checkpointsProgress.filter(
      checkpointProgress => (
        checkpointProgress === 1 || checkpointProgress === 2
      )
    ).length;
  }

  getStrugglingWithSubtopicsCount(topicName: string): number {
    return this.learnerProgress.subtopicsProgress.filter(
      subtopicProgress => (
        subtopicProgress.parentTopicName === topicName &&
        subtopicProgress.subtopicMastery &&
        subtopicProgress.subtopicMastery < 0.6
      )
    ).length;
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupLearnerSpecificProgress',
  downgradeComponent(
    {component: LearnerGroupLearnerSpecificProgressComponent}
  )
);
