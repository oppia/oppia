// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Lesson card component used in the redesigned topic viewer story section.
 */

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';

const FALLBACK_THUMBNAIL_IMAGE_PATH = '/splash/student_desk1x.webp';
const LESSON_THUMBNAIL_ALT_TEXT_PREFIX = 'Lesson thumbnail for ';
const DEFAULT_LESSON_THUMBNAIL_ALT_TEXT = 'Lesson thumbnail';

export type LessonProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'coming_soon';

@Component({
  selector: 'topic-lesson-card',
  templateUrl: './topic-lesson-card.component.html',
  styleUrls: ['./topic-lesson-card.component.css'],
})
export class TopicLessonCardComponent implements OnInit, OnChanges {
  @Input() lessonNumber: number = 1;
  @Input() lessonTitle: string = '';
  @Input() lessonDescription: string = '';
  @Input() thumbnailUrl: string = '';
  @Input() startUrl: string = '';
  @Input() studyUrl: string = '';
  @Input() practiceUrl: string = '';
  @Input() hasPracticeQuestions: boolean = false;
  @Input() moduleAccentColor: string = '#00645c';
  @Input() isActiveLesson: boolean = false;
  @Input() lessonProgressStatus: LessonProgressStatus = 'not_started';
  @Input() isNewLessonLabelVisible: boolean = false;
  @Input() isComingSoonSectionCard: boolean = false;
  @Input() navigatedLessonNumber: number | null = null;
  @Output() startLessonClick = new EventEmitter<{
    lessonNumber: number;
    startUrl: string;
  }>();

  resolvedThumbnailUrl: string = '';
  isExpanded: boolean = false;
  private previousLessonProgressStatus: LessonProgressStatus = 'not_started';

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.resolvedThumbnailUrl =
      this.thumbnailUrl || this.getFallbackThumbnailUrl();
    // Expand the active (next) lesson, the first lesson, or the navigated
    // lesson so their Play/Practice/Study actions are visible.
    this.isExpanded =
      !this.isComingSoonSectionCard &&
      (this.navigatedLessonNumber === this.lessonNumber ||
        (this.isActiveLesson && this.lessonProgressStatus !== 'completed') ||
        (this.lessonNumber === 1 && this.lessonProgressStatus !== 'completed'));
    this.previousLessonProgressStatus = this.lessonProgressStatus;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.navigatedLessonNumber) {
      // Auto-expand this lesson if it's the navigated lesson from the navbar.
      if (
        !this.isComingSoonSectionCard &&
        this.navigatedLessonNumber === this.lessonNumber
      ) {
        this.isExpanded = true;
      }
    }

    if (changes.lessonProgressStatus) {
      const currentStatus = changes.lessonProgressStatus
        .currentValue as LessonProgressStatus;
      if (
        currentStatus === 'completed' &&
        this.previousLessonProgressStatus !== 'completed' &&
        !this.isComingSoonSectionCard
      ) {
        this.isExpanded = false;
      }
      this.previousLessonProgressStatus = currentStatus;
    }
  }

  get isComingSoonLesson(): boolean {
    return this.lessonProgressStatus === 'coming_soon';
  }

  get isCompletedLesson(): boolean {
    return this.lessonProgressStatus === 'completed';
  }

  navigateTo(url: string): void {
    if (url) {
      this.windowRef.nativeWindow.location.assign(url);
    }
  }

  onStartButtonClick(): void {
    if (!this.startUrl || this.isComingSoonLesson) {
      return;
    }

    this.startLessonClick.emit({
      lessonNumber: this.lessonNumber,
      startUrl: this.startUrl,
    });
  }

  onPracticeButtonClick(): void {
    if (this.isComingSoonLesson || !this.hasPracticeQuestions) {
      return;
    }
    this.navigateTo(this.practiceUrl);
  }

  onStudyButtonClick(): void {
    if (this.isComingSoonLesson) {
      return;
    }
    this.navigateTo(this.studyUrl || this.startUrl);
  }

  toggleExpanded(): void {
    if (this.isComingSoonSectionCard) {
      return;
    }
    this.isExpanded = !this.isExpanded;
  }

  onPlayAgainClick(): void {
    if (!this.startUrl || this.isComingSoonLesson) {
      return;
    }

    const separator = this.startUrl.includes('?') ? '&' : '?';
    const restartUrl = `${this.startUrl}${separator}restart=1`;
    this.startLessonClick.emit({
      lessonNumber: this.lessonNumber,
      startUrl: restartUrl,
    });
  }

  getThumbnailAltText(): string {
    return this.lessonTitle
      ? LESSON_THUMBNAIL_ALT_TEXT_PREFIX + this.lessonTitle
      : DEFAULT_LESSON_THUMBNAIL_ALT_TEXT;
  }

  private getFallbackThumbnailUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      FALLBACK_THUMBNAIL_IMAGE_PATH
    );
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}
