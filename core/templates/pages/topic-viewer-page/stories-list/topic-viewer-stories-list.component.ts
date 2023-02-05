// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the topic viewer stories list.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { StorySummary } from 'domain/story/story-summary.model';
import { I18nLanguageCodeService, TranslationKeyType } from 'services/i18n-language-code.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';

import './topic-viewer-stories-list.component.css';


@Component({
  selector: 'stories-list',
  templateUrl: './topic-viewer-stories-list.component.html',
  styleUrls: ['./topic-viewer-stories-list.component.css']
})
export class StoriesListComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() canonicalStorySummaries!: StorySummary[];
  @Input() classroomUrlFragment!: string;
  @Input() topicUrlFragment!: string;
  @Input() topicName!: string;
  @Input() topicDescription!: string;
  @Input() topicId!: string;
  topicNameTranslationKey!: string;
  topicDescTranslationKey!: string;

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  ngOnInit(): void {
    this.topicNameTranslationKey = this.i18nLanguageCodeService
      .getTopicTranslationKey(this.topicId, TranslationKeyType.TITLE);
    this.topicDescTranslationKey = this.i18nLanguageCodeService
      .getTopicTranslationKey(this.topicId, TranslationKeyType.DESCRIPTION);
  }

  isHackyTopicNameTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.topicNameTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isHackyTopicDescTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.topicDescTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  checkTabletView(): boolean {
    return this.windowDimensionsService.getWidth() < 768;
  }
}
angular.module('oppia').directive(
  'storiesList', downgradeComponent(
    {component: StoriesListComponent}));
