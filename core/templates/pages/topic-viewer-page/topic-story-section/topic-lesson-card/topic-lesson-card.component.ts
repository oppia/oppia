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
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';

import './topic-lesson-card.component.css';

const FALLBACK_THUMBNAIL_IMAGE_PATH = '/splash/student_desk1x.webp';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';
const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';

@Component({
  selector: 'topic-lesson-card',
  templateUrl: './topic-lesson-card.component.html',
  styleUrls: ['./topic-lesson-card.component.css'],
})
export class TopicLessonCardComponent implements OnInit, OnChanges {
  @Input() lessonTitle: string = '';
  @Input() lessonDescription: string = '';
  @Input() thumbnailUrl: string = '';
  @Input() startUrl: string = '';
  @Input() lessonProgressStatus:
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'coming_soon' = 'not_started';
  @Input() totalCheckpointsCount: number = 0;
  @Input() visitedCheckpointsCount: number = 0;

  resolvedThumbnailUrl: string = '';
  _checkpointStatuses: string[] = [];

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.resolvedThumbnailUrl =
      this.thumbnailUrl || this.getFallbackThumbnailUrl();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.lessonProgressStatus ||
      changes.totalCheckpointsCount ||
      changes.visitedCheckpointsCount
    ) {
      this._checkpointStatuses = this._computeCheckpointStatuses();
    }
  }

  get checkpointStatuses(): string[] {
    return this._checkpointStatuses;
  }

  private _computeCheckpointStatuses(): string[] {
    if (
      this.lessonProgressStatus === 'coming_soon' ||
      this.totalCheckpointsCount === 0
    ) {
      return [];
    }

    const totalNodes = this.totalCheckpointsCount + 1;
    const statuses: string[] = [];
    const visitedCheckpointCount = Math.min(
      Math.max(this.visitedCheckpointsCount, 0),
      this.totalCheckpointsCount
    );

    const reachedCheckpointCount = Math.max(visitedCheckpointCount - 1, 0);

    if (
      this.lessonProgressStatus === 'completed' ||
      visitedCheckpointCount >= this.totalCheckpointsCount
    ) {
      for (let i = 0; i < totalNodes; i++) {
        statuses.push(CHECKPOINT_STATUS_COMPLETED);
      }
      return statuses;
    }

    const currentNodeIndex = reachedCheckpointCount;

    for (let i = 0; i < totalNodes; i++) {
      if (i < currentNodeIndex) {
        statuses.push(CHECKPOINT_STATUS_COMPLETED);
      } else if (i === currentNodeIndex) {
        statuses.push(CHECKPOINT_STATUS_IN_PROGRESS);
      } else {
        statuses.push(CHECKPOINT_STATUS_INCOMPLETE);
      }
    }

    return statuses;
  }

  get progressPercent(): number {
    if (
      this.totalCheckpointsCount === 0 ||
      this.lessonProgressStatus === 'coming_soon'
    ) {
      return 0;
    }
    const visitedCheckpointCount = Math.min(
      Math.max(this.visitedCheckpointsCount, 0),
      this.totalCheckpointsCount
    );
    if (
      this.lessonProgressStatus === 'completed' ||
      visitedCheckpointCount >= this.totalCheckpointsCount
    ) {
      return 100;
    }
    const reachedCheckpointCount = Math.max(visitedCheckpointCount - 1, 0);
    return Math.floor(
      (reachedCheckpointCount / this.totalCheckpointsCount) * 100
    );
  }

  get showCheckpointBar(): boolean {
    return (
      this.lessonProgressStatus !== 'coming_soon' &&
      this.totalCheckpointsCount > 0
    );
  }

  navigateTo(url: string): void {
    if (url) {
      this.windowRef.nativeWindow.location.assign(url);
    }
  }

  getThumbnailAltText(): string {
    return this.lessonTitle
      ? 'Lesson thumbnail for ' + this.lessonTitle
      : 'Lesson thumbnail';
  }

  private getFallbackThumbnailUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      FALLBACK_THUMBNAIL_IMAGE_PATH
    );
  }
}
