// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for a classroom card.
 */

import {Component, Input} from '@angular/core';
import {AppConstants} from 'app.constants';
import {ClassroomSummaryDict} from 'domain/classroom/classroom-backend-api.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

@Component({
  selector: 'oppia-classroom-card',
  templateUrl: './classroom-card.component.html',
})
export class ClassroomCardComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() classroomSummary!: ClassroomSummaryDict;
  @Input() usedInCarousel!: boolean;
  classroomThumbnailUrl!: string;
  classroomNameTranslationKey!: string;

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  getName(): string {
    return this.classroomSummary.name;
  }

  getClassroomUrl(): string {
    return `/learn/${this.classroomSummary.url_fragment}`;
  }

  isHackyClassroomNameTranslationDisplayed(): boolean {
    if (!this.classroomSummary.name) {
      return false;
    }
    return this.i18nLanguageCodeService.isClassroomnNameTranslationAvailable(
      this.classroomSummary.name
    );
  }

  ngOnInit(): void {
    this.classroomThumbnailUrl =
      this.assetsBackendApiService.getThumbnailUrlForPreview(
        AppConstants.ENTITY_TYPE.CLASSROOM,
        this.classroomSummary.classroom_id,
        this.classroomSummary.thumbnail_filename
      );

    if (this.classroomSummary.name) {
      this.classroomNameTranslationKey =
        this.i18nLanguageCodeService.getClassroomTranslationKeys(
          this.classroomSummary.name
        ).name;
    }
  }
}
