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
 * @fileoverview Component for topic-viewer subtopics list.
 */

import {Component, Input, OnInit} from '@angular/core';

import {Subtopic} from 'domain/topic/subtopic.model';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';

import './subtopics-list.component.css';

@Component({
  selector: 'subtopics-list',
  templateUrl: './subtopics-list.component.html',
  styleUrls: ['./subtopics-list.component.css'],
})
export class SubtopicsListComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() classroomUrlFragment!: string;
  @Input() subtopicsList!: Subtopic[];
  @Input() topicId!: string;
  @Input() topicUrlFragment!: string;
  @Input() topicName!: string;
  topicNameTranslationKey!: string;

  constructor(private i18nLanguageCodeService: I18nLanguageCodeService) {}

  ngOnInit(): void {
    this.topicNameTranslationKey =
      this.i18nLanguageCodeService.getTopicTranslationKey(
        this.topicId,
        TranslationKeyType.TITLE
      );
  }

  isHackyTopicNameTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.topicNameTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }
}
