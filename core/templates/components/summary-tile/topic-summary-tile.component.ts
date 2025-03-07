// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for a topic tile.
 */

import {Component, Input} from '@angular/core';
import {AppConstants} from 'app.constants';
import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';

@Component({
  selector: 'oppia-topic-summary-tile',
  templateUrl: './topic-summary-tile.component.html',
})
export class TopicSummaryTileComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() topicSummary!: CreatorTopicSummary;
  @Input() classroomUrlFragment!: string;
  @Input() isPublished!: boolean;
  topicNameTranslationKey!: string;
  thumbnailUrl: string = '';

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void {
    if (this.topicSummary.getThumbnailFilename()) {
      this.thumbnailUrl =
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.TOPIC,
          this.topicSummary.getId(),
          this.topicSummary.getThumbnailFilename()
        );
    }
    this.topicNameTranslationKey =
      this.i18nLanguageCodeService.getTopicTranslationKey(
        this.topicSummary.getId(),
        TranslationKeyType.TITLE
      );
  }

  getTopicPageUrl(): string {
    return this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.TOPIC_VIEWER_URL_TEMPLATE,
      {
        topic_url_fragment: this.topicSummary.getUrlFragment(),
        classroom_url_fragment: this.classroomUrlFragment,
      }
    );
  }

  getColorValueInHexForm(colorValue: number): string {
    colorValue = colorValue < 0 ? 0 : colorValue;
    let colorValueString = colorValue.toString(16);
    return colorValueString.length === 1
      ? '0' + colorValueString
      : colorValueString;
  }

  getDarkerThumbnailBgColor(): string {
    let bgColor = this.topicSummary.getThumbnailBgColor();
    // Remove the '#' from the first position.
    bgColor = bgColor.slice(1);

    // Get RGB values of new darker color.
    let newRValue = this.getColorValueInHexForm(
      parseInt(bgColor.substring(0, 2), 16) - 100
    );
    let newGValue = this.getColorValueInHexForm(
      parseInt(bgColor.substring(2, 4), 16) - 100
    );
    let newBValue = this.getColorValueInHexForm(
      parseInt(bgColor.substring(4, 6), 16) - 100
    );

    return '#' + newRValue + newGValue + newBValue;
  }

  isHackyTopicNameTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.topicNameTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}
