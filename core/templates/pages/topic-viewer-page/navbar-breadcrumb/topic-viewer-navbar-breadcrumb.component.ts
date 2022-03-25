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
 * @fileoverview Component for the navbar breadcrumb of the topic viewer.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { ReadOnlyTopic } from
  'domain/topic_viewer/read-only-topic-object.factory';
import { TopicViewerBackendApiService } from
  'domain/topic_viewer/topic-viewer-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { I18nLanguageCodeService, TranslationKeyType } from 'services/i18n-language-code.service';

@Component({
  selector: 'topic-viewer-navbar-breadcrumb',
  templateUrl: './topic-viewer-navbar-breadcrumb.component.html',
  styleUrls: []
})
export class TopicViewerNavbarBreadcrumbComponent implements OnInit {
  topicName: string = '';
  topicNameTranslationKey: string = '';
  constructor(
    private topicViewerBackendApiService: TopicViewerBackendApiService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.topicViewerBackendApiService.fetchTopicDataAsync(
      this.urlService.getTopicUrlFragmentFromLearnerUrl(),
      this.urlService.getClassroomUrlFragmentFromLearnerUrl()).then(
      (readOnlyTopic: ReadOnlyTopic) => {
        this.topicName = readOnlyTopic.getTopicName();
        this.topicNameTranslationKey = (
          this.i18nLanguageCodeService.getTopicTranslationKey(
            readOnlyTopic.getTopicId(),
            TranslationKeyType.TITLE
          )
        );
      });
  }

  isHackyTopicNameTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.topicNameTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}
angular.module('oppia').directive(
  'topicViewerNavbarBreadcrumb', downgradeComponent(
    {component: TopicViewerNavbarBreadcrumbComponent}));
