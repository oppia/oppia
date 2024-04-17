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
  topicFragment: string;
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
      let completedStories = this.story.getCompletedNodeTitles().length;

      this.desc = this.story.getTitle();
      this.imgColor = this.story.getThumbnailBgColor();
      this.imgUrl = this.getStorySummaryThumbnailUrl({
        filename: this.story.getThumbnailFilename(),
        id: this.story.getId(),
      });

      let nextStory =
        completedStories === this.story.getAllNodes().length
          ? completedStories - 1
          : completedStories;
      /* Last completed story index works because if 1 is completed, 1 index is 2nd item */
      let lessonArgs = {
        classroom: this.story.getClassroomUrlFragment(),
        topicFragment: this.story.getTopicUrlFragment(),
        currentStory: this.story.getAllNodes()[nextStory],
        story: this.story.getUrlFragment(),
      };
      this.lessonUrl = this.getStorySummaryLessonUrl(lessonArgs);

      this.title = `Chapter ${nextStory + 1}: ${this.story.getNodeTitles()[nextStory]}`;
      this.progress = Math.floor(
        (completedStories / this.story.getNodeTitles().length) * 100
      );
      this.lessonTopic = this.topic;
    } else {
      /* Implementation for explorations & collections */
      this.desc = this.story.objective;
      this.imgColor = this.story.thumbnailBgColor;
      this.imgUrl = this.urlInterpolationService.getStaticImageUrl(
        this.story.thumbnailIconUrl
      );
      this.progress = 0;
      this.title = this.story.title;

      if (this.story instanceof CollectionSummary) {
        this.lessonUrl = '';
        this.lessonTopic = 'Collections';
      } else {
        this.lessonUrl = `/explore/${this.story.id}`;
        this.lessonTopic = 'Community Lessons';
      }
    }
  }

  getProgress(arg: number): string {
    let leftCircle = 50 >= arg ? arg : 50;
    let rightCircle = arg > 50 ? arg - 50 : 0;

    return `linear-gradient(${50 >= arg ? 180 + (arg / 100) * 180 : 270}deg, #00645c ${leftCircle}%, transparent ${leftCircle}%), linear-gradient(0deg, #00645c ${rightCircle}%, lightgray ${rightCircle}%)`;
  }

  getStorySummaryThumbnailUrl({filename, id}: ThumbnailUrl): string {
    if (filename) {
      return this.assetsBackendApiService.getThumbnailUrlForPreview(
        AppConstants.ENTITY_TYPE.STORY,
        id,
        filename
      );
    }
    return '';
  }

  getStorySummaryLessonUrl({
    classroom,
    topicFragment,
    story,
    currentStory,
  }: LessonUrl): string {
    return classroom === undefined || topicFragment === undefined
      ? '#'
      : `/explore/${currentStory.getExplorationId()}?` +
          Object.entries({
            topic_url_fragment: topicFragment,
            classroom_url_fragment: classroom,
            story_url_fragment: story,
            node_id: currentStory.getId(),
          })
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
  }
}

angular
  .module('oppia')
  .directive(
    'lessonCardComponent',
    downgradeComponent({component: LessonCardComponent})
  );
