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
 * @fileoverview Practice card component used in the redesigned topic viewer story section.
 */

import {Component, Input, OnInit} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';

import './topic-practice-card.component.css';

const FALLBACK_THUMBNAIL_IMAGE_PATH = '/splash/student_desk1x.webp';

@Component({
  selector: 'topic-practice-card',
  templateUrl: './topic-practice-card.component.html',
  styleUrls: ['./topic-practice-card.component.css'],
})
export class TopicPracticeCardComponent implements OnInit {
  @Input() practiceTitle: string = '';
  @Input() practiceDescription: string = '';
  @Input() relatedLessonNumber: number | null = null;
  @Input() thumbnailUrl: string = '';
  @Input() studyUrl: string = '';
  @Input() practiceUrl: string = '#';

  resolvedThumbnailUrl: string = '';

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.resolvedThumbnailUrl =
      this.thumbnailUrl || this.getFallbackThumbnailUrl();
  }

  navigateTo(url: string): void {
    if (url) {
      this.windowRef.nativeWindow.location.assign(url);
    }
  }

  getResolvedDescription(): string {
    if (this.practiceDescription) {
      return this.practiceDescription;
    }

    const lessonSuffix =
      this.relatedLessonNumber !== null ? ` ${this.relatedLessonNumber}` : '';
    return `Practice the skills you've learned in lesson${lessonSuffix}.`;
  }

  getThumbnailAltText(): string {
    return this.practiceTitle
      ? 'Practice thumbnail for ' + this.practiceTitle
      : 'Practice thumbnail';
  }

  private getFallbackThumbnailUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      FALLBACK_THUMBNAIL_IMAGE_PATH
    );
  }
}
