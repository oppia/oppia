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
 * @fileoverview Component for the navbar breadcrumb of the story viewer.
 */

import { ClassroomDomainConstants } from 'domain/classroom/classroom-domain.constants';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { UrlService } from 'services/contextual/url.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

@Component({
  selector: 'oppia-story-viewer-navbar-breadcrumb',
  templateUrl: './story-viewer-navbar-breadcrumb.component.html',
  styleUrls: []
})
export class StoryViewerNavbarBreadcrumbComponent implements OnInit, OnDestroy {
  topicName: string;
  storyTitle: string;
  topicUrlFragment: string;
  classroomUrlFragment: string;
  storyUrlFragment: string;
  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private storyViewerBackendApiService: StoryViewerBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService
  ) {}

  directiveSubscriptions = new Subscription();
  getTopicUrl(): string {
    return this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.TOPIC_VIEWER_STORY_URL_TEMPLATE, {
        topic_url_fragment: this.topicUrlFragment,
        classroom_url_fragment: this.classroomUrlFragment,
        story_url_fragment: this.storyUrlFragment
      });
  }

  ngOnInit(): void {
    this.topicUrlFragment = (
      this.urlService.getTopicUrlFragmentFromLearnerUrl());
    this.classroomUrlFragment =
     (this.urlService.getClassroomUrlFragmentFromLearnerUrl());
    this.storyUrlFragment =
     (this.urlService.getStoryUrlFragmentFromLearnerUrl());
    this.storyViewerBackendApiService.fetchStoryDataAsync(
      this.topicUrlFragment,
      this.classroomUrlFragment,
      this.storyUrlFragment).then(
      (storyDataObject) => {
        this.topicName = storyDataObject.topicName;
        this.storyTitle = storyDataObject.title;
      });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}

angular.module('oppia').directive('oppiaStoryViewerNavbarBreadcrumb',
  downgradeComponent({component: StoryViewerNavbarBreadcrumbComponent}));
