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

  lessonThumbnailUrl: string = '';
  lessonTitle: string = '';

  private readonly fallbackLessonThumbnailPath: string =
    '/splash/student_desk1x.webp';

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {}

  ngOnInit(): void {
    this.lessonTitle = this.storyTitle
      ? 'Lesson 1: ' + this.storyTitle
      : 'Lesson 1';
    this.lessonThumbnailUrl = this.getLessonThumbnailUrl();
  }

  private getLessonThumbnailUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      this.fallbackLessonThumbnailPath
    );
  }

  private getFallbackAvatarImageUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      this.fallbackLessonThumbnailPath
    );
  }
}
