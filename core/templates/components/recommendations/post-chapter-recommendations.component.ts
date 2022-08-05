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
import { UrlService } from 'services/contextual/url.service';
import { PracticeSessionPageConstants } from 'pages/practice-session-page/practice-session-page.constants';
@Component({
  selector: 'oppia-post-chapter-recommendations',
  templateUrl: './post-chapter-recommendations.component.html',
})
export class PostChapterRecommendationsComponent {
  // The below property will be undefined when the current chapter
  // is the last chapter of a story.
  @Input() nextStoryNodeLink: string | undefined;

  // The properties below will not be null because when being passed down as
  // input from the parent component, a null/undefined check is performed and
  // if the check fails, an empty string/false is passed down instead.
  @Input() nextStoryNodeThumbnailUrl!: string;
  @Input() nextStoryNodeThumbnailBgColor!: string;
  @Input() nextStoryNodeTitle!: string;

  // The below property will not be null because the property that is being
  // passed down as input from the parent component is initialized to
  // be false.
  @Input() practiceQuestionsAreEnabled!: boolean;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getPracticeTabUrl(): string {
    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.TOPIC_VIEWER_PAGE, {
        topic_url_fragment: this.urlService.getUrlParams().topic_url_fragment,
        classroom_url_fragment: (
          this.urlService.getUrlParams().classroom_url_fragment)
      }) + '/practice';
  }

  getRevisionTabUrl(): string {
    return this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.TOPIC_VIEWER_PAGE, {
        topic_url_fragment: this.urlService.getUrlParams().topic_url_fragment,
        classroom_url_fragment: (
          this.urlService.getUrlParams().classroom_url_fragment)
      }) + '/revision';
  }
}
