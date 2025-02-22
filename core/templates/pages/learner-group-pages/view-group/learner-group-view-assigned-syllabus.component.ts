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
 * @fileoverview Component for the learner group view of assigned syllabus.
 */

import {Component, Input, OnInit} from '@angular/core';
import {AppConstants} from 'app.constants';
import {UrlService} from 'services/contextual/url.service';
import {LearnerGroupSubtopicSummary} from 'domain/learner_group/learner-group-subtopic-summary.model';
import {LearnerGroupSyllabusBackendApiService} from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import {LearnerGroupData} from 'domain/learner_group/learner-group.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {LearnerGroupUserProgress} from 'domain/learner_group/learner-group-user-progress.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicViewerDomainConstants} from 'domain/topic_viewer/topic-viewer-domain.constants';
import {PracticeSessionPageConstants} from 'pages/practice-session-page/practice-session-page.constants';

import './learner-group-view-assigned-syllabus.component.css';

@Component({
  selector: 'oppia-learner-group-view-assigned-syllabus',
  templateUrl: './learner-group-view-assigned-syllabus.component.html',
})
export class LearnerGroupViewAssignedSyllabusComponent implements OnInit {
  @Input() learnerGroup!: LearnerGroupData;
  @Input() learnerProgress!: LearnerGroupUserProgress;
  subtopicSummaries!: LearnerGroupSubtopicSummary[];
  storySummaries!: StorySummary[];
  displayOrderOfSyllabusItems: string[] = [];

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private learnerGroupSyllabusBackendApiService: LearnerGroupSyllabusBackendApiService
  ) {}

  ngOnInit(): void {
    if (this.learnerGroup) {
      this.learnerGroupSyllabusBackendApiService
        .fetchLearnerSpecificProgressInAssignedSyllabus(this.learnerGroup.id)
        .then(groupSyllabus => {
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
      thumbnailUrl = this.assetsBackendApiService.getThumbnailUrlForPreview(
        AppConstants.ENTITY_TYPE.TOPIC,
        subtopicSummary.parentTopicId,
        subtopicSummary.thumbnailFilename
      );
    }
    return thumbnailUrl;
  }

  getStoryThumbnailUrl(storySummary: StorySummary): string {
    let thumbnailUrl = '';
    if (storySummary.getThumbnailFilename()) {
      thumbnailUrl = this.assetsBackendApiService.getThumbnailUrlForPreview(
        AppConstants.ENTITY_TYPE.STORY,
        storySummary.getId(),
        storySummary.getThumbnailFilename()
      );
    }
    return thumbnailUrl;
  }

  calculateCircularProgressCss(progress: number): string {
    let degree = 90 + (360 * progress) / 100;
    let cssStyle =
      `linear-gradient(${degree}deg, transparent 50%, #CCCCCC 50%)` +
      ', linear-gradient(90deg, #CCCCCC 50%, transparent 50%)';
    if (progress > 50) {
      degree = 3.6 * (progress - 50) - 90;
      cssStyle =
        'linear-gradient(270deg, #00645C 50%, transparent 50%), ' +
        `linear-gradient(${degree}deg, #00645C 50%, #CCCCCC 50%)`;
    }
    return cssStyle;
  }

  getProgressOfStory(storySummary: StorySummary): number {
    return (
      Math.round(
        ((100 * storySummary.getCompletedNodeTitles().length) /
          storySummary.getNodeTitles().length) *
          10
      ) / 10
    );
  }

  getStoryLink(storySummary: StorySummary): string {
    const classroomUrlFragment = storySummary.getClassroomUrlFragment();
    const topicUrlFragment = storySummary.getTopicUrlFragment();
    if (classroomUrlFragment === undefined || topicUrlFragment === undefined) {
      return '#';
    }
    let storyLink = this.urlInterpolationService.interpolateUrl(
      TopicViewerDomainConstants.STORY_VIEWER_URL_TEMPLATE,
      {
        classroom_url_fragment: classroomUrlFragment,
        story_url_fragment: storySummary.getUrlFragment(),
        topic_url_fragment: topicUrlFragment,
      }
    );
    return storyLink;
  }

  getStoryNodeLink(storySummary: StorySummary): string {
    const classroomUrlFragment = storySummary.getClassroomUrlFragment();
    const topicUrlFragment = storySummary.getTopicUrlFragment();
    let storyNodeToDisplay = storySummary.getAllNodes().find(node => {
      if (!storySummary.getCompletedNodeTitles().includes(node.getTitle())) {
        return node;
      }
    });
    if (!storyNodeToDisplay) {
      storyNodeToDisplay = storySummary.getAllNodes()[0];
    }
    const explorationId = storyNodeToDisplay.getExplorationId();
    if (
      classroomUrlFragment === undefined ||
      topicUrlFragment === undefined ||
      explorationId === null
    ) {
      return '#';
    }
    let storyNodeLink = this.urlInterpolationService.interpolateUrl(
      '/explore/<exp_id>',
      {exp_id: explorationId}
    );
    storyNodeLink = this.urlService.addField(
      storyNodeLink,
      'topic_url_fragment',
      topicUrlFragment
    );
    storyNodeLink = this.urlService.addField(
      storyNodeLink,
      'classroom_url_fragment',
      classroomUrlFragment
    );
    storyNodeLink = this.urlService.addField(
      storyNodeLink,
      'story_url_fragment',
      storySummary.getUrlFragment()
    );
    storyNodeLink = this.urlService.addField(
      storyNodeLink,
      'node_id',
      storyNodeToDisplay.getId()
    );
    return storyNodeLink;
  }

  getPracticeSessionLink(subtopicSummary: LearnerGroupSubtopicSummary): string {
    const classroomUrlFragment = subtopicSummary.classroomUrlFragment;
    const topicUrlFragment = subtopicSummary.parentTopicUrlFragment;
    if (classroomUrlFragment === undefined || topicUrlFragment === undefined) {
      return '#';
    }
    let practiceSessionsLink = this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_URL,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment: classroomUrlFragment,
        stringified_subtopic_ids: JSON.stringify([subtopicSummary.subtopicId]),
      }
    );
    return practiceSessionsLink;
  }

  getSubtopicMasteryLevel(
    subtopicSummary: LearnerGroupSubtopicSummary
  ): string {
    let masteryLevel = 'I18N_LEARNER_GROUP_SYLLABUS_ITEM_NOT_STARTED_YET';
    const subtopicMastery = subtopicSummary.subtopicMastery;
    if (!subtopicMastery) {
      return masteryLevel;
    }
    if (subtopicMastery >= 1) {
      masteryLevel = 'I18N_SKILL_LEVEL_PROFICIENT';
    } else if (subtopicMastery >= 0.8) {
      masteryLevel = 'I18N_SKILL_LEVEL_INTERMEDIATE';
    } else if (subtopicMastery >= 0.6) {
      masteryLevel = 'I18N_SKILL_LEVEL_BEGINNER';
    } else if (subtopicMastery > 0) {
      masteryLevel = 'I18N_SKILL_LEVEL_NEEDS_WORK';
    }
    return masteryLevel;
  }
}
