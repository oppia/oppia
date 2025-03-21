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
 * @fileoverview Component for classroom navigation links.
 */

import {Component, OnInit} from '@angular/core';
import {AppConstants} from 'app.constants';
import {
  ClassroomBackendApiService,
  ClassroomSummaryDict,
} from 'domain/classroom/classroom-backend-api.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-classroom-navigation-links',
  templateUrl: './classroom-navigation-links.component.html',
})
export class ClassroomNavigationLinksComponent implements OnInit {
  classroomSummaries: ClassroomSummaryDict[] = [];
  isLoading: boolean = true;
  currentUrl!: string;

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private classroomBackendApiService: ClassroomBackendApiService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private siteAnalyticsService: SiteAnalyticsService,
    private windowRef: WindowRef
  ) {}

  getClassroomThumbnail(
    classroomId: string,
    thumbnailFilename: string
  ): string {
    return this.assetsBackendApiService.getThumbnailUrlForPreview(
      AppConstants.ENTITY_TYPE.CLASSROOM,
      classroomId,
      thumbnailFilename
    );
  }

  getClassroomNameTranslationkey(classroomName: string): string {
    return this.i18nLanguageCodeService.getClassroomTranslationKeys(
      classroomName
    ).name;
  }

  isHackyClassroomNameTranslationDisplayed(classroomName: string): boolean {
    return this.i18nLanguageCodeService.isClassroomnNameTranslationAvailable(
      classroomName
    );
  }

  registerClassroomCardClickEvent(classroomName: string): void {
    this.siteAnalyticsService.registerClickClassroomCardEvent(
      'Classroom card in the navigation dropdown',
      classroomName
    );
  }

  ngOnInit(): void {
    this.currentUrl =
      this.windowRef.nativeWindow.location.pathname.split('/')[1];
    if (this.currentUrl !== 'signup') {
      this.classroomBackendApiService
        .getAllClassroomsSummaryAsync()
        .then((data: ClassroomSummaryDict[]) => {
          for (
            let i = 0;
            i < data.length && this.classroomSummaries.length < 2;
            i++
          ) {
            if (data[i].is_published) {
              this.classroomSummaries.push(data[i]);
            }
          }
          this.isLoading = false;
        });
    }
  }
}
