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
 * @fileoverview Component for the subtopic viewer.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { SubtopicViewerBackendApiService } from 'domain/subtopic_viewer/subtopic-viewer-backend-api.service';
import { SubtopicPageContents } from 'domain/topic/subtopic-page-contents.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';

@Component({
  selector: 'oppia-subtopic-viewer-page',
  templateUrl: './subtopic-viewer-page.component.html',
  styleUrls: []
})
export class SubtopicViewerPageComponent implements OnInit, OnDestroy {
  nextSubtopicSummaryIsShown: boolean = false;
  topicUrlFragment: string;
  classroomUrlFragment: string;
  subtopicUrlFragment: string;
  pageContents: SubtopicPageContents;
  subtopicTitle: string;
  parentTopicId: string;
  nextSubtopic: Subtopic;
  constructor(
    private alertsService: AlertsService,
    private contextService: ContextService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private subtopicViewerBackendApiService: SubtopicViewerBackendApiService,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  checkMobileView(): boolean {
    return (this.windowDimensionsService.getWidth() < 500);
  }

  ngOnInit(): void {
    this.topicUrlFragment = (
      this.urlService.getTopicUrlFragmentFromLearnerUrl());
    this.classroomUrlFragment = (
      this.urlService.getClassroomUrlFragmentFromLearnerUrl());
    this.subtopicUrlFragment = (
      this.urlService.getSubtopicUrlFragmentFromLearnerUrl());

    this.loaderService.showLoadingScreen('Loading');
    this.subtopicViewerBackendApiService.fetchSubtopicDataAsync(
      this.topicUrlFragment,
      this.classroomUrlFragment,
      this.subtopicUrlFragment).then((subtopicDataObject) => {
      this.pageContents = subtopicDataObject.getPageContents();
      this.subtopicTitle = subtopicDataObject.getSubtopicTitle();
      this.parentTopicId = subtopicDataObject.getParentTopicId();
      this.contextService.setCustomEntityContext(
        AppConstants.ENTITY_TYPE.TOPIC, this.parentTopicId);
      this.pageTitleService.setPageTitle(
        `Review ${this.subtopicTitle} | Oppia`);
      this.pageTitleService.updateMetaTag(
        `Review the skill of ${this.subtopicTitle.toLowerCase()}.`);

      let nextSubtopic = subtopicDataObject.getNextSubtopic();
      if (nextSubtopic) {
        this.nextSubtopic = nextSubtopic;
        this.nextSubtopicSummaryIsShown = true;
      }

      this.loaderService.hideLoadingScreen();
    },
    (errorResponse) => {
      if (
        AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
        this.alertsService.addWarning('Failed to get subtopic data');
      }
    });
  }

  ngOnDestroy(): void {
    this.contextService.removeCustomEntityContext();
  }
}



angular.module('oppia').directive(
  'oppiaSubtopicViewerPage',
  downgradeComponent({component: SubtopicViewerPageComponent}));
