// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the post chapter recommendations component.
 */

import { Component, Input } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
@Component({
  selector: 'oppia-post-chapter-recommendations',
  template: require('./post-chapter-recommendations.component.html'),
})
export class PostChapterRecommendationsComponent {
  @Input() nextStoryNodeLink: string;
  @Input() nextStoryNodeThumbnailUrl: string;
  @Input() nextStoryNodeThumbnailBgColor: string;
  @Input() nextStoryNodeTitle: string;
  thumbnailUrl: string;
  thumbnailBgColor: string;
  constructor(
    private urlInterpolationService: UrlInterpolationService
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}
