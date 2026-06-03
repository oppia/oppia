// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Slimmed-down story section for the redesigned topic viewer
 * page. This component intentionally exposes a minimal, input-driven API so
 * parents can supply precomputed values (title, description, URL fragments,
 * and counts) and the component remains presentational.
 */

import {Component, Input, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

import './topic-story-section.component.css';

@Component({
  selector: 'topic-story-section',
  templateUrl: './topic-story-section.component.html',
  styleUrls: ['./topic-story-section.component.css'],
})
export class TopicStorySectionComponent implements OnInit {
  @Input() storyTitle!: string;
  @Input() storyDescription!: string;

  @Input() classroomUrlFragment!: string;
  @Input() topicUrlFragment!: string;

  @Input() practiceCount: number = 0;
  @Input() lessonCount: number = 0;

  private readonly primaryAvatarImagePath: string =
    '/avatar/oppia_avatar_large_100px.svg';
  private readonly fallbackAvatarImagePath: string =
    '/general/collection_mascot.svg';

  oppiaAvatarImageUrl: string = '';
  studyGuideUrl: string = '#';

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    if (!this.classroomUrlFragment) {
      this.classroomUrlFragment =
        this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    }
    if (!this.topicUrlFragment) {
      this.topicUrlFragment =
        this.urlService.getTopicUrlFragmentFromLearnerUrl();
    }
    this.oppiaAvatarImageUrl = this.getPrimaryAvatarImageUrl();
    this.studyGuideUrl = this.getStudyGuideUrl();
  }

  onAvatarImageError(): void {
    if (this.oppiaAvatarImageUrl !== this.getFallbackAvatarImageUrl()) {
      this.oppiaAvatarImageUrl = this.getFallbackAvatarImageUrl();
    }
  }

  getLessonCountText(): string {
    return this.translateService.instant('I18N_TOPIC_VIEWER_LESSON_COUNT', {
      lessonCountValue: this.lessonCount,
      messageFormat: true,
    });
  }

  getPracticeCountText(): string {
    return this.translateService.instant('I18N_TOPIC_VIEWER_PRACTICE_COUNT', {
      practiceCountValue: this.practiceCount,
      messageFormat: true,
    });
  }

  getStoryMetaText(): string {
    // Compose meta text from translated count fragments. We join with a
    // comma here; some locales may prefer a different ordering — the ARIA
    // label below uses a single translation key for full sentence.
    return this.getLessonCountText() + ', ' + this.getPracticeCountText();
  }

  getStoryMetaAriaLabel(): string {
    return this.translateService.instant('I18N_TOPIC_VIEWER_STORY_META_ARIA', {
      lessonCountValue: this.lessonCount,
      practiceCountValue: this.practiceCount,
      messageFormat: true,
    });
  }

  private getStudyGuideUrl(): string {
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return '#';
    }
    return this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.TOPIC_VIEWER_STUDYGUIDE_URL_TEMPLATE,
      {
        classroom_url_fragment: this.classroomUrlFragment,
        topic_url_fragment: this.topicUrlFragment,
      }
    );
  }

  private getPrimaryAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      this.primaryAvatarImagePath
    );
  }

  private getFallbackAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticCopyrightedImageUrl(
      this.fallbackAvatarImagePath
    );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}
