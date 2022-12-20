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
 * @fileoverview Component for a learner topic summary tile.
 */

import { Component, OnInit } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { AppConstants } from 'app.constants';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { ClassroomDomainConstants } from 'domain/classroom/classroom-domain.constants';

@Component({
  selector: 'oppia-learner-topic-summary-tile',
  templateUrl: './learner-topic-summary-tile.component.html'
})
export class LearnerTopicSummaryTileComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() topicSummary!: LearnerTopicSummary;
  thumbnailUrl!: string;
  topicLink!: string;
  totalPublishedNodeCount!: number;
  topicTitle!: string;
  thumbnailBgColor!: string;
  openInNewWindow = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  getTopicLink(): string {
    if (!this.topicSummary.classroom || !this.topicSummary.urlFragment) {
      return '#';
    }
    return this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.TOPIC_VIEWER_URL_TEMPLATE, {
        topic_url_fragment: this.topicSummary.urlFragment,
        classroom_url_fragment: this.topicSummary.classroom
      });
  }

  ngOnInit(): void {
    if (this.topicSummary.getThumbnailFilename()) {
      this.thumbnailUrl = (
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.TOPIC, this.topicSummary.getId(),
          this.topicSummary.getThumbnailFilename()));
    }
    this.topicLink = this.getTopicLink();
    this.topicTitle = this.topicSummary.name;
    this.thumbnailBgColor = this.topicSummary.thumbnailBgColor;
    this.totalPublishedNodeCount = this.topicSummary.totalPublishedNodeCount;
  }
}

angular.module('oppia').directive(
  'oppiaLearnerTopicSummaryTile', downgradeComponent(
    {component: LearnerTopicSummaryTileComponent}));
