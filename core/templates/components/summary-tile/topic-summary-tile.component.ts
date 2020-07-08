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

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { ClassroomDomainConstants } from
  'domain/classroom/classroom-domain.constants';
import { TopicSummary } from 'domain/topic/TopicSummaryObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { TranslateService } from 'services/translate.service';

@Component({
  selector: 'topic-summary-tile',
  templateUrl: './topic-summary-tile.component.html',
  styleUrls: []
})
export class TopicSummaryTileComponent implements OnInit {
  @Input() topicSummary: TopicSummary;
  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private translateService: TranslateService,
    private urlInterpolationService: UrlInterpolationService) {
    this.translateService.use('en');
  }
  ngOnInit(): void {
    this.translateService.use(
      this.i18nLanguageCodeService.getCurrentI18nLanguageCode());
    this.i18nLanguageCodeService.onI18nLanguageCodeChange.subscribe(
      (code) => this.translateService.use(code));
  }
  getTopicLink(): string {
    return this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.TOPIC_VIEWER_URL_TEMPLATE, {
        topic_name: this.topicSummary.getName()});
  }
  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}

angular.module('oppia').directive(
  'topicSummaryTile', downgradeComponent(
    {component: TopicSummaryTileComponent}));
