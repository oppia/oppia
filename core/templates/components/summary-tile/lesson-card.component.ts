// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for a lesson
 */

import {Component, Input, OnInit} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';
import {AppConstants} from 'app.constants';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {StoryNode} from 'domain/story/story-node.model';

@Component({
  selector: 'lesson-card',
  templateUrl: './lesson-card.component.html',
})
export class LessonCardComponent implements OnInit {
  @Input() story!: StorySummary | LearnerExplorationSummary | CollectionSummary;
  @Input() topic!: string;
  @Input() isCommunityLessonComplete?: boolean;
  @Input() isGoal?: boolean;

  desc!: string;
  imgColor!: string;
  imgUrl!: string;
  lessonUrl!: string;
  progress!: number;
  title!: string;
  lessonTopic!: string;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    if (this.story instanceof StorySummary) {
      this.setStorySummary(this.story);
    } else if (this.story instanceof CollectionSummary) {
      this.setCollectionSummary(this.story);
    } else {
      this.setExplorationSummary(this.story);
    }
  }

  setStorySummary(storyModel: StorySummary): void {
    const completedStories = storyModel.getCompletedNodeTitles().length;
    this.desc = storyModel.getTitle();
    this.imgColor = storyModel.getThumbnailBgColor();
    this.imgUrl = this.getStorySummaryThumbnailUrl(
      storyModel.getThumbnailFilename(),
      storyModel.getId()
    );

    const nextStory =
      completedStories === storyModel.getAllNodes().length
        ? completedStories - 1
        : completedStories;

    this.lessonUrl = this.getStorySummaryLessonUrl(
      storyModel.getClassroomUrlFragment(),
      storyModel.getTopicUrlFragment(),
      storyModel.getUrlFragment(),
      storyModel.getAllNodes()[nextStory]
    );

    this.title = `Chapter ${nextStory + 1}: ${storyModel.getNodeTitles()[nextStory]}`;
    this.progress = Math.floor(
      (completedStories / storyModel.getNodeTitles().length) * 100
    );
    this.lessonTopic = this.topic;
  }

  setCollectionSummary(collectionModel: CollectionSummary): void {
    this.desc = collectionModel.objective;
    this.imgColor = collectionModel.thumbnailBgColor;
    this.imgUrl = this.urlInterpolationService.getStaticImageUrl(
      collectionModel.thumbnailIconUrl
    );

    // TODO(#18384): Get correct progress and state for button text.
    this.progress = this.isCommunityLessonComplete ? 100 : 0;
    this.title = collectionModel.title;
    this.lessonUrl = `/collection/${collectionModel.id}`;
    this.lessonTopic = 'Collections';
  }

  setExplorationSummary(explorationModel: LearnerExplorationSummary): void {
    this.desc = explorationModel.objective;
    this.imgColor = explorationModel.thumbnailBgColor;
    this.imgUrl = this.urlInterpolationService.getStaticImageUrl(
      explorationModel.thumbnailIconUrl
    );

    // TODO(#18384): Get correct progress and state for button text.
    this.progress = this.isCommunityLessonComplete ? 100 : 0;
    this.title = explorationModel.title;
    this.lessonUrl = `/explore/${explorationModel.id}`;
    this.lessonTopic = 'Community Lesson';
  }

  getStorySummaryThumbnailUrl(filename: string, id: string): string {
    return this.assetsBackendApiService.getThumbnailUrlForPreview(
      AppConstants.ENTITY_TYPE.STORY,
      id,
      filename
    );
  }

  getStorySummaryLessonUrl(
    classroomUrl: string | undefined,
    topicUrl: string | undefined,
    storyUrl: string,
    currentStory: StoryNode
  ): string {
    const explorationId = currentStory.getExplorationId();
    if (!classroomUrl || !topicUrl || explorationId === null) {
      throw new Error('Class and/or topic does not exist');
    }
    let resultUrl = this.urlInterpolationService.interpolateUrl(
      '/explore/<exp_id>',
      {exp_id: explorationId}
    );
    resultUrl = this.urlService.addField(
      resultUrl,
      'topic_url_fragment',
      topicUrl
    );
    resultUrl = this.urlService.addField(
      resultUrl,
      'classroom_url_fragment',
      classroomUrl
    );
    resultUrl = this.urlService.addField(
      resultUrl,
      'story_url_fragment',
      storyUrl
    );
    resultUrl = this.urlService.addField(
      resultUrl,
      'node_id',
      currentStory.getId()
    );
    return resultUrl;
  }

  getButtonTranslationKey(): string {
    switch (this.progress) {
      case 100:
        return 'I18N_LEARNER_DASHBOARD_CARD_BUTTON_REDO';
      case 0:
        return 'I18N_LEARNER_DASHBOARD_CARD_BUTTON_START';
      default:
        return 'I18N_LEARNER_DASHBOARD_CARD_BUTTON_RESUME';
    }
  }
}

angular
  .module('oppia')
  .directive(
    'lessonCardComponent',
    downgradeComponent({component: LessonCardComponent})
  );
