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
 * @fileoverview Component for a learner topic goals summary tile.
 */

import { Component, OnInit } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { AppConstants } from 'app.constants';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { UrlService } from 'services/contextual/url.service';
import { StoryNode } from 'domain/story/story-node.model';
import { StorySummary } from 'domain/story/story-summary.model';

@Component({
  selector: 'oppia-learner-topic-goals-summary-tile',
  templateUrl: './learner-topic-goals-summary-tile.component.html'
})
export class LearnerTopicGoalsSummaryTileComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() topicSummary!: LearnerTopicSummary;
  @Input() displayArea!: string;
  @Input() topicName!: string;
  incompleteStoryNodes!: StoryNode[];
  storySummaryToDisplay!: StorySummary;
  storyName!: string;
  storyProgress!: number;
  storyNodeToDisplay!: StoryNode;
  thumbnailBgColor!: string;
  storyNodeLink!: string;
  storyNodeTitle!: string;
  starImageUrl!: string;
  // Set thumbnail url to null if the thumbnail file is not available.
  thumbnailUrl: string | null = null;
  isStoryChapterDisplayed: boolean = false;
  cardIsHovered: boolean = false;
  openInNewWindow: boolean = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService,
    private urlService: UrlService,
  ) {}

  getAllIncompleteStoryNodes(): StoryNode[] {
    let allStorySummaries: StorySummary[] = (
      this.topicSummary.getCanonicalStorySummaryDicts()
    );
    let allIncompleteStoryNodes: StoryNode[] = [];
    allStorySummaries.map(storySummary => {
      if (allIncompleteStoryNodes.length === 0) {
        let allNodes = storySummary.getAllNodes();
        let completedStoryNodes: string[] = (
          storySummary.getCompletedNodeTitles()
        );
        allIncompleteStoryNodes = allNodes.filter(node => {
          return (!completedStoryNodes.includes(node.getTitle()));
        });
        this.storySummaryToDisplay = storySummary;
      }
    });
    return allIncompleteStoryNodes;
  }

  getStoryNodeLink(): string {
    const classroomUrlFragment = (
      this.storySummaryToDisplay.getClassroomUrlFragment());
    const topicUrlFragment = this.storySummaryToDisplay.getTopicUrlFragment();
    const explorationId = this.storyNodeToDisplay.getExplorationId();
    if (classroomUrlFragment === undefined || topicUrlFragment === undefined ||
      explorationId === null) {
      return '#';
    }
    let result = this.urlInterpolationService.interpolateUrl(
      '/explore/<exp_id>', { exp_id: explorationId });
    result = this.urlService.addField(
      result, 'topic_url_fragment', topicUrlFragment);
    result = this.urlService.addField(
      result, 'classroom_url_fragment', classroomUrlFragment);
    result = this.urlService.addField(
      result, 'story_url_fragment',
      this.storySummaryToDisplay.getUrlFragment());
    result = this.urlService.addField(
      result, 'node_id', this.storyNodeToDisplay.getId());
    return result;
  }

  ngOnInit(): void {
    this.incompleteStoryNodes = this.getAllIncompleteStoryNodes();
    if (this.incompleteStoryNodes.length > 0) {
      this.storyNodeToDisplay = this.incompleteStoryNodes[0];

      let thumbnailFilename = this.storyNodeToDisplay.getThumbnailFilename();
      if (thumbnailFilename) {
        this.thumbnailUrl = (
          this.assetsBackendApiService.getThumbnailUrlForPreview(
            AppConstants.ENTITY_TYPE.STORY, this.storySummaryToDisplay.getId(),
            thumbnailFilename));
      }

      this.storyNodeTitle = this.storyNodeToDisplay.getTitle();
      let thumbnailBgColor = this.storyNodeToDisplay.getThumbnailBgColor();
      if (thumbnailBgColor) {
        this.thumbnailBgColor = thumbnailBgColor;
      }
      this.storyName = this.storySummaryToDisplay.getTitle();

      this.storyNodeLink = this.getStoryNodeLink();
      let totalStoryNodesCount = (
        this.storySummaryToDisplay.getAllNodes().length
      );
      let completedNodesCount = (
        this.storySummaryToDisplay.getCompletedNodeTitles().length
      );
      this.storyProgress = Math.floor(
        (completedNodesCount / totalStoryNodesCount) * 100);
    }
  }

  isCardHovered(): string {
    if (this.cardIsHovered) {
      return '-webkit-filter: blur(2px); filter: blur(2px);';
    }
    return 'height: 144px; width: 192px;';
  }
}

angular.module('oppia').directive(
  'oppiaLearnerTopicSummaryTile', downgradeComponent(
    {component: LearnerTopicGoalsSummaryTileComponent}));
