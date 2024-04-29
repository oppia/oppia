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
 * @fileoverview Component for a lessons in learner dashboard
 */

import {Component, Input, OnInit} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';
import {AppConstants} from 'app.constants';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {StoryNode} from 'domain/story/story-node.model';

interface LessonUrl {
  classroom: string | undefined;
  topicFragment: string | undefined;
  story: string;
  currentStory: StoryNode;
}

interface ThumbnailUrl {
  filename: string;
  id: string;
}
@Component({
  selector: 'lesson-card',
  templateUrl: './lesson-card.component.html',
})
export class LessonCardComponent implements OnInit {
  @Input() story!: StorySummary | LearnerExplorationSummary | CollectionSummary;
  @Input() topic!: string;

  desc!: string;
  imgColor!: string;
  imgUrl!: string;
  lessonUrl!: string;
  progress!: number;
  title!: string;
  lessonTopic!: string;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService
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
    this.imgUrl = this.getStorySummaryThumbnailUrl({
      filename: storyModel.getThumbnailFilename(),
      id: storyModel.getId(),
    });

    const nextStory =
      completedStories === storyModel.getAllNodes().length
        ? completedStories - 1
        : completedStories;

    const lessonArgs = {
      classroom: storyModel.getClassroomUrlFragment(),
      topicFragment: storyModel.getTopicUrlFragment(),
      currentStory: storyModel.getAllNodes()[nextStory],
      story: storyModel.getUrlFragment(),
    };
    this.lessonUrl = this.getStorySummaryLessonUrl(lessonArgs);

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
    this.progress = 0;
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
    this.progress = 0;
    this.title = explorationModel.title;
    this.lessonUrl = `/explore/${explorationModel.id}`;
    this.lessonTopic = 'Community Lessons';
  }

  getStorySummaryThumbnailUrl({filename, id}: ThumbnailUrl): string {
    if (!filename) {
      return this.urlInterpolationService.getStaticImageUrl(
        '/subjects/Lightbulb.svg'
      );
    }
    return this.assetsBackendApiService.getThumbnailUrlForPreview(
      AppConstants.ENTITY_TYPE.STORY,
      id,
      filename
    );
  }

  getStorySummaryLessonUrl({
    classroom,
    topicFragment,
    story,
    currentStory,
  }: LessonUrl): string {
    return (
      `/explore/${currentStory.getExplorationId()}?` +
      Object.entries({
        topic_url_fragment: topicFragment,
        classroom_url_fragment: classroom,
        story_url_fragment: story,
        node_id: currentStory.getId(),
      })
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
    );
  }

  handleImageError(): void {
    this.imgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/subjects/Lightbulb.svg'
    );
  }

  setButtonText(): string {
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
