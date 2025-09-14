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

import {Component, OnInit} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicViewerDomainConstants} from 'domain/topic_viewer/topic-viewer-domain.constants';
import {Input} from '@angular/core';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {AppConstants} from 'app.constants';
import {StorySummary} from 'domain/story/story-summary.model';
import {UrlService} from 'services/contextual/url.service';

@Component({
  selector: 'oppia-learner-story-summary-tile',
  templateUrl: './learner-story-summary-tile.component.html',
})
export class LearnerStorySummaryTileComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() storySummary!: StorySummary;
  @Input() displayArea!: string;
  @Input() topicName!: string;
  @Input() redesignFeatureFlag!: boolean;
  nodeCount!: number;
  completedNodeCount!: number;
  storyProgress!: number;
  thumbnailUrl!: string;
  storyLink!: string;
  storyTitle!: string;
  nextIncompleteNodeTitle!: string;
  thumbnailBgColor!: string;
  starImageUrl!: string;
  storyCompleted: boolean = false;
  cardIsHovered: boolean = false;
  openInNewWindow = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService,
    private urlService: UrlService
  ) {}

  getStoryLink(): string {
    const classroomUrlFragment = this.storySummary.getClassroomUrlFragment();
    const topicUrlFragment = this.storySummary.getTopicUrlFragment();
    if (classroomUrlFragment === undefined || topicUrlFragment === undefined) {
      return '#';
    }
    if (this.isDisplayAreaHome()) {
      var allNodes = this.storySummary.getAllNodes();
      var node = allNodes[this.completedNodeCount];
      if (node && node.getExplorationId()) {
        let explorationId = node.getExplorationId();
        if (explorationId) {
          let result = this.urlInterpolationService.interpolateUrl(
            '/explore/<exp_id>',
            {
              exp_id: explorationId,
            }
          );
          result = this.urlService.addField(
            result,
            'topic_url_fragment',
            topicUrlFragment
          );
          result = this.urlService.addField(
            result,
            'classroom_url_fragment',
            classroomUrlFragment
          );
          result = this.urlService.addField(
            result,
            'story_url_fragment',
            this.storySummary.getUrlFragment()
          );
          result = this.urlService.addField(result, 'node_id', node.getId());
          return result;
        }
      }
    }

    return this.urlInterpolationService.interpolateUrl(
      TopicViewerDomainConstants.STORY_VIEWER_URL_TEMPLATE,
      {
        classroom_url_fragment: classroomUrlFragment,
        story_url_fragment: this.storySummary.getUrlFragment(),
        topic_url_fragment: topicUrlFragment,
      }
    );
  }

  ngOnInit(): void {
    this.nodeCount = this.storySummary.getNodeTitles().length;
    this.completedNodeCount = this.storySummary.getCompletedNodeTitles().length;
    this.storyProgress = Math.floor(
      (this.completedNodeCount / this.nodeCount) * 100
    );
    if (this.storyProgress === 100) {
      this.storyCompleted = true;
    }

    if (this.storySummary.getThumbnailFilename()) {
      this.thumbnailUrl =
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.STORY,
          this.storySummary.getId(),
          this.storySummary.getThumbnailFilename()
        );
    }
    this.storyLink = this.getStoryLink();
    this.storyTitle = this.storySummary.getTitle();
    this.thumbnailBgColor = this.storySummary.getThumbnailBgColor();
    if (this.nodeCount !== this.completedNodeCount) {
      let nextIncompleteNode =
        this.storySummary.getNodeTitles()[this.completedNodeCount];
      this.nextIncompleteNodeTitle = `Chapter ${this.completedNodeCount + 1}: ${nextIncompleteNode}`;
    }
    this.starImageUrl = this.getStaticImageUrl('/learner_dashboard/star.svg');
  }

  isDisplayAreaHome(): boolean {
    if (this.displayArea === 'homeTab') {
      return true;
    }
    return false;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  isCardHovered(): string {
    if (this.displayArea === 'homeTab' && this.cardIsHovered) {
      return '-webkit-filter: blur(2px); filter: blur(2px);';
    }
    return 'height: 144px; width: 192px;';
  }
}
