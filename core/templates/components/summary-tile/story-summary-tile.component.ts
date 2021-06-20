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
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { downgradeComponent } from '@angular/upgrade/static';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { AppConstants } from 'app.constants';
import { StorySummary } from 'domain/story/story-summary.model';

@Component({
  selector: 'oppia-story-summary-tile',
  templateUrl: 'story-summary-tile.component.html'
})
export class StorySummaryTileComponent implements OnInit {
  @Input() classroomUrlFragment: string;
  @Input() storySummary: StorySummary;
  @Input() topicUrlFragment: string;
  initialCount: number;
  chaptersDisplayed: number;
  nodeCount: number;
  completedStoriesCount: number;
  storyProgress: number;
  thumbnailUrl: string;
  showButton: boolean;
  circumference = (20 * 2 * Math.PI);
  gapLength = 5;
  EXPLORE_PAGE_PREFIX = '/explore/';
  storyLink: string;
  storyTitle: string;
  strokeDashArrayValues: string | number;
  completedStrokeDashArrayValues: string;
  thumbnailBgColor: string;
  nodeTitles: string[];

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  getStoryLink(): string {
    // This component is being used in the topic editor as well and
    // we want to disable the linking in this case.
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return '#';
    }
    return this.urlInterpolationService.interpolateUrl(
      TopicViewerDomainConstants.STORY_VIEWER_URL_TEMPLATE, {
        classroom_url_fragment: this.classroomUrlFragment,
        story_url_fragment: this.storySummary.getUrlFragment(),
        topic_url_fragment: this.topicUrlFragment
      });
  }

  isChapterCompleted(title: string): boolean {
    return this.storySummary.isNodeCompleted(title);
  }

  isPreviousChapterCompleted(index: number): boolean {
    if (index === 0) {
      return true;
    }
    let previousNodeTitle = (
      this.storySummary.getNodeTitles()[index - 1]);
    return this.storySummary.isNodeCompleted(previousNodeTitle);
  }

  showAllChapters(): void {
    this.initialCount = this.chaptersDisplayed;
    this.chaptersDisplayed = this.nodeCount;
  }

  hideExtraChapters(): void {
    this.chaptersDisplayed = this.initialCount;
  }

  getStrokeDashArrayValues(): number | string {
    if (this.nodeCount === 1) {
      return '';
    }
    let segmentLength = (
      (
        this.circumference -
        (this.nodeCount * this.gapLength)) / this.nodeCount);
    return segmentLength.toString() + ' ' + this.gapLength.toString();
  }

  // Returns the exploration page URL for the provided chapter title.
  getChapterUrl(nodeTitle: string): string {
    let node = this.storySummary.getAllNodes().find(node => {
      return node.getTitle() === nodeTitle;
    });
    if (!node) {
      return '';
    }
    let urlParams = this.urlService.addField(
      '', 'story_url_fragment', this.storySummary.getUrlFragment());
    urlParams = this.urlService.addField(
      urlParams, 'topic_url_fragment', this.topicUrlFragment);
    urlParams = this.urlService.addField(
      urlParams, 'classroom_url_fragment', this.classroomUrlFragment);
    urlParams = this.urlService.addField(
      urlParams, 'node_id', node.getId());
    return (
      `${this.EXPLORE_PAGE_PREFIX}${node.getExplorationId()}${urlParams}`);
  }

  getCompletedStrokeDashArrayValues(): string {
    let completedStrokeValues = '';
    let remainingCircumference = this.circumference;
    if (this.completedStoriesCount === 0) {
      return '0 ' + this.circumference.toString();
    }
    if (this.completedStoriesCount === 1 && this.nodeCount === 1) {
      return '';
    }
    let segmentLength = (
      (
        this.circumference -
        (this.nodeCount * this.gapLength)) / this.nodeCount);
    for (let i = 1; i <= this.completedStoriesCount - 1; i++) {
      completedStrokeValues += (
        segmentLength.toString() + ' ' + this.gapLength.toString() + ' ');
      remainingCircumference -= (segmentLength + this.gapLength);
    }
    completedStrokeValues += (
      segmentLength.toString() + ' ' +
      (remainingCircumference - segmentLength).toString());
    return completedStrokeValues;
  }

  ngOnInit(): void {
    this.nodeCount = this.storySummary.getNodeTitles().length;
    this.completedStoriesCount = 0;
    for (let idx in this.storySummary.getNodeTitles()) {
      if (
        this.storySummary.isNodeCompleted(
          this.storySummary.getNodeTitles()[idx])) {
        this.completedStoriesCount++;
      }
    }
    this.storyProgress = Math.floor(
      (this.completedStoriesCount / this.nodeCount) * 100);

    this.chaptersDisplayed = 3;
    if (this.windowDimensionsService.getWidth() <= 800) {
      this.chaptersDisplayed = 2;
    }
    this.showButton = false;
    if (this.chaptersDisplayed !== this.nodeCount) {
      this.showButton = true;
    }

    if (this.storySummary.getThumbnailFilename()) {
      this.thumbnailUrl = (
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.STORY, this.storySummary.getId(),
          this.storySummary.getThumbnailFilename()));
    } else {
      this.thumbnailUrl = null;
    }
    this.getStrokeDashArrayValues();
    this.storyLink = this.getStoryLink();
    this.storyTitle = this.storySummary.getTitle();
    this.strokeDashArrayValues = this.getStrokeDashArrayValues();
    this.completedStrokeDashArrayValues =
      this.getCompletedStrokeDashArrayValues();
    this.thumbnailBgColor = this.storySummary.getThumbnailBgColor();
    this.nodeTitles = this.storySummary.getNodeTitles();
  }
}

angular.module('oppia').directive(
  'oppiaStorySummaryTile', downgradeComponent(
    {component: StorySummaryTileComponent}));
