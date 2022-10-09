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
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { LearnerGroupBackendApiService } from 'domain/learner_group/learner-group-backend-api.service';
import { LearnerGroupSubtopicSummary } from 'domain/learner_group/learner-group-subtopic-summary.model';
import { LearnerGroupSyllabusBackendApiService } from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { StorySummary } from 'domain/story/story-summary.model';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { LearnerGroupUserProgress } from 'domain/learner_group/learner-group-user-progress.model';

import './learner-group-view-assigned-syllabus.component.css';
import { UrlService } from 'services/contextual/url.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { TopicViewerDomainConstants } from 'domain/topic_viewer/topic-viewer-domain.constants';
import { PracticeSessionPageConstants } from 'pages/practice-session-page/practice-session-page.constants';


@Component({
  selector: 'oppia-learner-group-view-assigned-syllabus',
  templateUrl: './learner-group-view-assigned-syllabus.component.html'
})
export class LearnerGroupViewAssignedSyllabusComponent implements OnInit {
  @Input() learnerGroup!: LearnerGroupData;
  @Input() learnerProgress!: LearnerGroupUserProgress;
  subtopicSummaries!: LearnerGroupSubtopicSummary[];
  storySummaries!: StorySummary[];
  displayOrderOfSyllabusItems: string[] = [];
  EXPLORE_PAGE_PREFIX = '/explore/';
  topicNames

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private ngbModal: NgbModal,
    private urlInterpolationService: UrlInterpolationService,
    private learnerGroupBackendApiService:
      LearnerGroupBackendApiService,
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService
  ) {}

  ngOnInit(): void {
    if (this.learnerGroup) {
      this.learnerGroupSyllabusBackendApiService
        .fetchLearnerSpecificProgressInAssignedSyllabus(
          this.learnerGroup.id).then(groupSyllabus => {
          this.subtopicSummaries = groupSyllabus.subtopicsProgress;
          this.storySummaries = groupSyllabus.storiesProgress;
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

  calculateCircularProgressCss(progress: number): string {
    let degree = (90 + (360 * progress / 100));
    let cssStyle = (
      `linear-gradient(${degree}deg, transparent 50%, #CCCCCC 50%)` +
      ', linear-gradient(90deg, #CCCCCC 50%, transparent 50%)');
    if (progress > 50) {
      degree = 3.6 * (progress - 50) - 90;
      cssStyle = (
        'linear-gradient(270deg, #00645C 50%, transparent 50%), ' +
        `linear-gradient(${degree}deg, #00645C 50%, #CCCCCC 50%)`);
    }
    return cssStyle;
  }

  getProgressOfStory(storySummary: StorySummary): number {
    return Math.round(
      (
        100 * storySummary.getCompletedNodeTitles().length /
        storySummary.getNodeTitles().length
      ) * 10
    ) / 10;
  }

  getStoryLink(storySummary: StorySummary): string {
    // This component is being used in the topic editor as well and
    // we want to disable the linking in this case.
    if (!storySummary.getClassroomUrlFragment() ||
      !storySummary.getTopicUrlFragment()) {
      return '#';
    }
    let storyLink = this.urlInterpolationService.interpolateUrl(
      TopicViewerDomainConstants.STORY_VIEWER_URL_TEMPLATE, {
        classroom_url_fragment: storySummary.getClassroomUrlFragment(),
        story_url_fragment: storySummary.getUrlFragment(),
        topic_url_fragment: storySummary.getTopicUrlFragment()
      });
    return storyLink;
  }

  getPracticeSessionLink(
      subtopicSummary: LearnerGroupSubtopicSummary
  ): string {
    let practiceSessionsLink = this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_URL, {
        topic_url_fragment: subtopicSummary.parentTopicUrlFragment,
        classroom_url_fragment: subtopicSummary.classroomUrlFragment,
        stringified_subtopic_ids: JSON.stringify([subtopicSummary.subtopicId])
      });
    return practiceSessionsLink;
  }

  getSubtopicMasteryLevel(
      subtopicSummary: LearnerGroupSubtopicSummary
  ): string {
    if (subtopicSummary.subtopicMastery === 1) {
      return 'I18N_SKILL_LEVEL_PROFICIENT';
    } else if (subtopicSummary.subtopicMastery >= 0.8) {
      return 'I18N_SKILL_LEVEL_INTERMEDIATE';
    } else if (subtopicSummary.subtopicMastery >= 0.6) {
      return 'I18N_SKILL_LEVEL_BEGINNER';
    } else if (subtopicSummary.subtopicMastery > 0) {
      return 'I18N_SKILL_LEVEL_NEEDS_WORK';
    }
    return 'I18N_LEARNER_GROUP_SYLLABUS_ITEM_NOT_STARTED_YET';
  }
}

angular.module('oppia').directive(
  'oppiaLearnerViewAssignedGroupSyllabus',
  downgradeComponent({component: LearnerGroupViewAssignedSyllabusComponent}));
