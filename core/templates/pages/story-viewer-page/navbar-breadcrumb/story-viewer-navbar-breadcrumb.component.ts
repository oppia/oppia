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

import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {StoryViewerBackendApiService} from 'domain/story_viewer/story-viewer-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subscription} from 'rxjs';
import {UrlService} from 'services/contextual/url.service';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {ReadOnlyTopic} from 'domain/topic_viewer/read-only-topic-object.factory';

@Component({
  selector: 'oppia-story-viewer-navbar-breadcrumb',
  templateUrl: './story-viewer-navbar-breadcrumb.component.html',
  styleUrls: [],
})
export class StoryViewerNavbarBreadcrumbComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  topicName!: string;
  topicNameTranslationKey!: string;
  storyTitle!: string;
  storyTitleTranslationKey!: string;
  topicUrlFragment!: string;
  classroomUrlFragment!: string;
  storyUrlFragment!: string;
  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private storyViewerBackendApiService: StoryViewerBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private topicViewerBackendApiService: TopicViewerBackendApiService
  ) {}

  directiveSubscriptions = new Subscription();
  getTopicUrl(): string {
    return this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.TOPIC_VIEWER_STORY_URL_TEMPLATE,
      {
        topic_url_fragment: this.topicUrlFragment,
        classroom_url_fragment: this.classroomUrlFragment,
        story_url_fragment: this.storyUrlFragment,
      }
    );
  }

  ngOnInit(): void {
    this.topicUrlFragment = this.urlService.getTopicUrlFragmentFromLearnerUrl();
    this.classroomUrlFragment =
      this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    let storyUrlFragment = this.urlService.getStoryUrlFragmentFromLearnerUrl();
    if (storyUrlFragment === null) {
      throw new Error('Story url fragment is null');
    }
    this.storyUrlFragment = storyUrlFragment;
    this.storyViewerBackendApiService
      .fetchStoryDataAsync(
        this.topicUrlFragment,
        this.classroomUrlFragment,
        this.storyUrlFragment
      )
      .then(storyDataObject => {
        this.topicName = storyDataObject.topicName;
        this.storyTitleTranslationKey =
          this.i18nLanguageCodeService.getStoryTranslationKey(
            storyDataObject.id,
            TranslationKeyType.TITLE
          );
        this.storyTitle = storyDataObject.title;
      });

    this.topicViewerBackendApiService
      .fetchTopicDataAsync(this.topicUrlFragment, this.classroomUrlFragment)
      .then((readOnlyTopic: ReadOnlyTopic) => {
        this.topicNameTranslationKey =
          this.i18nLanguageCodeService.getTopicTranslationKey(
            readOnlyTopic.getTopicId(),
            TranslationKeyType.TITLE
          );
      });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  isHackyTopicNameTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.topicNameTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isHackyStoryTitleTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.storyTitleTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }
}
