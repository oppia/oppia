// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the topic viewer.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { ReadOnlyTopic } from
  'domain/topic_viewer/read-only-topic-object.factory';
import { StorySummary } from 'domain/story/story-summary.model';
import { Subtopic, SkillIdToDescriptionMap } from
  'domain/topic/subtopic.model';
import { DegreesOfMastery } from
  'domain/topic_viewer/read-only-topic-object.factory';
import { TopicViewerBackendApiService } from
  'domain/topic_viewer/topic-viewer-backend-api.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { WindowRef } from 'services/contextual/window-ref.service';


@Component({
  selector: 'topic-viewer-page',
  templateUrl: './topic-viewer-page.component.html',
  styleUrls: []
})
export class TopicViewerPageComponent implements OnInit {
  activeTab: string = '';
  canonicalStorySummaries: StorySummary[] = [];
  topicUrlFragment: string = '';
  classroomUrlFragment: string = '';
  topicIsLoading: boolean = true;
  topicId: string = '';
  topicName: string = '';
  topicDescription: string = '';
  chapterCount: number = 0;
  degreesOfMastery: DegreesOfMastery = {};
  subtopics: Subtopic[] = [];
  skillDescriptions: SkillIdToDescriptionMap = {};
  practiceTabIsDisplayed: boolean = false;

  constructor(
    private alertsService: AlertsService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private topicViewerBackendApiService: TopicViewerBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
  ) {}

  ngOnInit(): void {
    if (this.urlService.getPathname().endsWith('revision')) {
      this.activeTab = 'subtopics';
    } else if (this.urlService.getPathname().endsWith('practice')) {
      this.activeTab = 'practice';
    } else {
      if (!this.urlService.getPathname().endsWith('story')) {
        this.setUrlAccordingToActiveTab('story');
      }
      this.activeTab = 'story';
    }
    this.topicUrlFragment = (
      this.urlService.getTopicUrlFragmentFromLearnerUrl());
    this.classroomUrlFragment = (
      this.urlService.getClassroomUrlFragmentFromLearnerUrl());

    this.loaderService.showLoadingScreen('Loading');
    this.topicViewerBackendApiService.fetchTopicDataAsync(
      this.topicUrlFragment, this.classroomUrlFragment).then(
      (readOnlyTopic: ReadOnlyTopic) => {
        this.topicId = readOnlyTopic.getTopicId();
        this.topicName = readOnlyTopic.getTopicName();
        this.topicDescription = readOnlyTopic.getTopicDescription();
        this.pageTitleService.setDocumentTitle(
          `Learn ${this.topicName} | ` +
          `${readOnlyTopic.getPageTitleFragmentForWeb()} | Oppia`);
        this.pageTitleService.updateMetaTag(readOnlyTopic.getMetaTagContent());
        this.canonicalStorySummaries = (
          readOnlyTopic.getCanonicalStorySummaries());
        this.chapterCount = 0;
        for (let idx in this.canonicalStorySummaries) {
          this.chapterCount += (
            this.canonicalStorySummaries[idx].getNodeTitles().length);
        }
        this.degreesOfMastery = readOnlyTopic.getDegreesOfMastery();
        this.subtopics = readOnlyTopic.getSubtopics();
        this.skillDescriptions = readOnlyTopic.getSkillDescriptions();
        this.topicIsLoading = false;
        this.loaderService.hideLoadingScreen();
        this.practiceTabIsDisplayed = (
          readOnlyTopic.getPracticeTabIsDisplayed());
      },
      errorResponse => {
        let errorCodes = AppConstants.FATAL_ERROR_CODES;
        if (errorCodes.indexOf(errorResponse.status) !== -1) {
          this.alertsService.addWarning('Failed to get dashboard data');
        }
      }
    );
  }

  checkMobileView(): boolean {
    return this.windowDimensionsService.getWidth() < 500;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  setActiveTab(newActiveTabName: string): void {
    if (newActiveTabName === 'story') {
      this.setUrlAccordingToActiveTab('story');
    } else if (newActiveTabName === 'practice') {
      this.setUrlAccordingToActiveTab('practice');
    } else {
      this.setUrlAccordingToActiveTab('revision');
    }
    this.activeTab = newActiveTabName;
  }

  setUrlAccordingToActiveTab(newTabName: string): void {
    let getCurrentLocation = this.windowRef.nativeWindow.location.toString();
    if (this.activeTab === '') {
      this.windowRef.nativeWindow.history.pushState(
        {}, '', getCurrentLocation + '/' + newTabName);
    } else if (this.activeTab === 'subtopics') {
      this.windowRef.nativeWindow.history.pushState(
        {}, '', getCurrentLocation.replace('revision', newTabName));
    } else {
      this.windowRef.nativeWindow.history.pushState(
        {}, '', getCurrentLocation.replace(this.activeTab, newTabName));
    }
  }
}

angular.module('oppia').directive(
  'topicViewerPage', downgradeComponent(
    {component: TopicViewerPageComponent}));
