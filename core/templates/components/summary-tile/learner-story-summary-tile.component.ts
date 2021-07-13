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
 * @fileoverview Component for a canonical story tile.
 */

import { Component, OnInit } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { TopicViewerDomainConstants } from 'domain/topic_viewer/topic-viewer-domain.constants';
import { Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { AppConstants } from 'app.constants';
import { StorySummary } from 'domain/story/story-summary.model';

@Component({
  selector: 'oppia-learner-story-summary-tile',
  templateUrl: 'learner-story-summary-tile.component.html'
})
export class LearnerStorySummaryTileComponent implements OnInit {
  @Input() storySummary: StorySummary;
  @Input() topicName?: string;
  nodeCount: number;
  completedNodeCount: number;
  storyProgress: number;
  thumbnailUrl: string = null;
  storyLink: string;
  storyTitle: string;
  storyCompleted: boolean = false;
  thumbnailBgColor: string;
  starImageUrl: string = '';

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  getStoryLink(): string {
    if (!this.storySummary.getClassroomUrlFragment() ||
      !this.storySummary.getTopicUrlFragment()) {
      return '#';
    }
    return this.urlInterpolationService.interpolateUrl(
      TopicViewerDomainConstants.STORY_VIEWER_URL_TEMPLATE, {
        classroom_url_fragment: this.storySummary.getClassroomUrlFragment(),
        story_url_fragment: this.storySummary.getUrlFragment(),
        topic_url_fragment: this.storySummary.getTopicUrlFragment()
      });
  }

  ngOnInit(): void {
    this.nodeCount = this.storySummary.getNodeTitles().length;
    this.completedNodeCount = this.storySummary.getCompletedNodeTitles().length;
    this.storyProgress = Math.floor(
      (this.completedNodeCount / this.nodeCount) * 100);
    if (this.storyProgress === 100) {
      this.storyCompleted = true;
    }

    if (this.storySummary.getThumbnailFilename()) {
      this.thumbnailUrl = (
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.STORY, this.storySummary.getId(),
          this.storySummary.getThumbnailFilename()));
    }
    this.storyLink = this.getStoryLink();
    this.storyTitle = this.storySummary.getTitle();
    this.thumbnailBgColor = this.storySummary.getThumbnailBgColor();
    if (!this.topicName) {
      this.topicName = this.storySummary.getTopicName();
    }
    this.starImageUrl = this.getStaticImageUrl('/learner_dashboard/star.svg');
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}

angular.module('oppia').directive(
  'oppiaLearnerStorySummaryTile', downgradeComponent(
    {component: LearnerStorySummaryTileComponent}));
