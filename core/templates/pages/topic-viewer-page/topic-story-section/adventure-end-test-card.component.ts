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
 * @fileoverview Adventure end test card component used in the redesigned topic viewer story section.
 */

import {Component, Input, OnInit} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';

import './adventure-end-test-card.component.css';

const FALLBACK_THUMBNAIL_IMAGE_PATH = '/splash/student_desk1x.webp';

@Component({
  selector: 'topic-adventure-end-test-card',
  templateUrl: './adventure-end-test-card.component.html',
  styleUrls: ['./adventure-end-test-card.component.css'],
})
export class AdventureEndTestCardComponent implements OnInit {
  @Input() practiceTitle: string = '';
  @Input() practiceDescription: string = '';
  @Input() thumbnailUrl: string = '';
  @Input() studyUrl: string = '';
  @Input() practiceUrl: string = '';
  @Input() cardBackgroundColor: string = '#ecf7f6';
  @Input() cardAccentColor: string = '#0b776d';

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
    return this.practiceDescription;
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
