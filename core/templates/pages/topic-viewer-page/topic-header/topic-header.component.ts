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
 * @fileoverview Component for topic header.
 */

import {Component, Input, OnInit} from '@angular/core';
import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';
import './topic-header.component.css';

@Component({
  selector: 'topic-header',
  templateUrl: './topic-header.component.html',
  styleUrls: ['./topic-header.component.css'],
})
export class TopicHeaderComponent implements OnInit {
  @Input() topicName!: string;
  @Input() topicDescription!: string;
  @Input() topicId!: string;
  @Input() classroomName!: string | null;
  @Input() showStudySkillsBreadcrumb: boolean = false;
  @Input() classroomUrlFragment: string = '';
  @Input() topicUrlFragment: string = '';

  topicNameTranslationKey!: string;
  topicDescTranslationKey!: string;
  classroomNameTranslationKey!: string;

  constructor(private i18nLanguageCodeService: I18nLanguageCodeService) {}

  get capitalizedClassroomName(): string {
    return this.capitalize(this.classroomName ?? '');
  }

  get capitalizedClassroomUrlFragment(): string {
    return this.capitalize(this.classroomUrlFragment);
  }

  ngOnInit(): void {
    this.topicNameTranslationKey =
      this.i18nLanguageCodeService.getTopicTranslationKey(
        this.topicId,
        TranslationKeyType.TITLE
      );
    this.topicDescTranslationKey =
      this.i18nLanguageCodeService.getTopicTranslationKey(
        this.topicId,
        TranslationKeyType.DESCRIPTION
      );

    if (this.classroomName) {
      this.classroomNameTranslationKey =
        this.i18nLanguageCodeService.getClassroomTranslationKeys(
          this.classroomName
        ).name;
    }
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
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

  isHackyClassroomNameTranslationDisplayed(): boolean {
    if (!this.classroomName) {
      return false;
    }
    return this.i18nLanguageCodeService.isClassroomnNameTranslationAvailable(
      this.classroomName
    );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  getClassroomUrl(): string {
    return this.classroomUrlFragment
      ? `/learn/${this.classroomUrlFragment}`
      : '/learn';
  }

  getTopicStoryUrl(): string {
    return this.classroomUrlFragment && this.topicUrlFragment
      ? ClassroomDomainConstants.TOPIC_VIEWER_STORY_URL_TEMPLATE.replace(
          '<classroom_url_fragment>',
          encodeURIComponent(this.classroomUrlFragment)
        ).replace(
          '<topic_url_fragment>',
          encodeURIComponent(this.topicUrlFragment)
        )
      : '/learn';
  }
}
