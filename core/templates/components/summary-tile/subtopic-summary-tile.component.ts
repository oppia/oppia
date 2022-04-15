// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for a subtopic tile.
 */

import { Component, Input, OnInit } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { TopicViewerDomainConstants } from 'domain/topic_viewer/topic-viewer-domain.constants';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { AppConstants } from 'app.constants';
import { Subtopic } from 'domain/topic/subtopic.model';
import { downgradeComponent } from '@angular/upgrade/static';
import { I18nLanguageCodeService, TranslationKeyType } from 'services/i18n-language-code.service';

@Component({
  selector: 'oppia-subtopic-summary-tile',
  templateUrl: './subtopic-summary-tile.component.html'
})
export class SubtopicSummaryTileComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() classroomUrlFragment!: string;
  @Input() subtopic!: Subtopic;
  @Input() topicId!: string;
  @Input() topicUrlFragment!: string;
  thumbnailUrl!: string;
  thumbnailBgColor!: string;
  subtopicTitle!: string;
  subtopicTitleTranslationKey!: string;

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {}

  openSubtopicPage(): void {
    // This component is being used in the topic editor as well and
    // we want to disable the linking in this case.
    if (!this.classroomUrlFragment || !this.topicUrlFragment) {
      return;
    }
    this.windowRef.nativeWindow.open(
      this.urlInterpolationService.interpolateUrl(
        TopicViewerDomainConstants.SUBTOPIC_VIEWER_URL_TEMPLATE, {
          classroom_url_fragment: this.classroomUrlFragment,
          topic_url_fragment: this.topicUrlFragment,
          subtopic_url_fragment: this.subtopic.getUrlFragment()
        }
      ), '_self'
    );
  }

  ngOnInit(): void {
    this.thumbnailBgColor = this.subtopic.getThumbnailBgColor();
    this.subtopicTitle = this.subtopic.getTitle();
    if (this.subtopic.getThumbnailFilename()) {
      this.thumbnailUrl = (
        this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.TOPIC, this.topicId,
          this.subtopic.getThumbnailFilename()));
    } else {
      this.thumbnailUrl = null;
    }
    this.subtopicTitleTranslationKey = this.i18nLanguageCodeService.
      getSubtopicTranslationKey(
        this.topicId, this.subtopic.getUrlFragment(),
        TranslationKeyType.TITLE);
  }

  isHackySubtopicTitleTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.subtopicTitleTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }
}

angular.module('oppia').directive(
  'oppiaSubtopicSummaryTile', downgradeComponent({
    component: SubtopicSummaryTileComponent
  }) as angular.IDirectiveFactory);
