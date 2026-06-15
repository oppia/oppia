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
 * @fileoverview Redesigned story section for the topic viewer page.
 */

import {Component, Input, OnInit} from '@angular/core';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

import './topic-story-section.component.css';

const PRIMARY_AVATAR_IMAGE_PATH = '/avatar/oppia_avatar_large_100px.svg';
const FALLBACK_AVATAR_IMAGE_PATH = '/general/collection_mascot.svg';

@Component({
  selector: 'topic-story-section',
  templateUrl: './topic-story-section.component.html',
  styleUrls: ['./topic-story-section.component.css'],
})
export class TopicStorySectionComponent implements OnInit {
  @Input() storyTitle!: string;
  @Input() storyDescription!: string;

  @Input() practiceCount: number = 0;
  @Input() lessonCount: number = 0;

  oppiaAvatarImageUrl: string = '';
  studyGuideUrl: string = '#';

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {}

  ngOnInit(): void {
    this.oppiaAvatarImageUrl = this.getPrimaryAvatarImageUrl();
    this.studyGuideUrl = this.getStudyGuideUrl();
  }

  onAvatarImageError(): void {
    if (this.oppiaAvatarImageUrl !== this.getFallbackAvatarImageUrl()) {
      this.oppiaAvatarImageUrl = this.getFallbackAvatarImageUrl();
    }
  }

  getLessonCountText(): string {
    return this.lessonCount === 1
      ? this.lessonCount + ' lesson'
      : this.lessonCount + ' lessons';
  }

  getPracticeCountText(): string {
    return this.practiceCount === 1
      ? this.practiceCount + ' practice'
      : this.practiceCount + ' practices';
  }

  getStoryMetaText(): string {
    return this.getLessonCountText() + ', ' + this.getPracticeCountText();
  }

  getStoryMetaAriaLabel(): string {
    return (
      this.getLessonCountText() +
      ' and ' +
      this.getPracticeCountText() +
      ' available'
    );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  private getStudyGuideUrl(): string {
    return this.urlService.getLearnerTopicStudyGuideUrl();
  }

  private getPrimaryAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      PRIMARY_AVATAR_IMAGE_PATH
    );
  }

  private getFallbackAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticCopyrightedImageUrl(
      FALLBACK_AVATAR_IMAGE_PATH
    );
  }
}
