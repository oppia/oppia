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
 * @fileoverview Classrooms page component.
 */

import {Component} from '@angular/core';
import {AlertsService} from 'services/alerts.service';
import {Router} from '@angular/router';
import {
  ClassroomBackendApiService,
  ClassroomSummaryDict,
} from 'domain/classroom/classroom-backend-api.service';
import {LoaderService} from 'services/loader.service';
import {AppConstants} from 'app.constants';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';

@Component({
  selector: 'oppia-classrooms-page',
  templateUrl: './classrooms-page.component.html',
})
export class ClassroomsPageComponent {
  classroomSummaries: ClassroomSummaryDict[] = [];
  hasPublicClassrooms: boolean = false;
  privateClassroomSummary: ClassroomSummaryDict = {
    classroom_id: '',
    name: '',
    teaser_text: '',
    thumbnail_bg_color: '',
    thumbnail_filename: '',
    url_fragment: '',
    is_published: false,
  };

  DEV_MODE = AppConstants.DEV_MODE;

  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    private alertsService: AlertsService,
    private loaderService: LoaderService,
    private router: Router,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private siteAnalyticsService: SiteAnalyticsService
  ) {}

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  registerClassroomCardClickEvent(classroomName: string): void {
    this.siteAnalyticsService.registerClickClassroomCardEvent(
      'Classroom card in the classrooms page',
      classroomName
    );
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');

    this.classroomBackendApiService
      .getAllClassroomsSummaryAsync()
      .then(data => {
        let singlePublicClassroomUrlFragment = '';
        let publicClassroomCount = 0;
        this.classroomSummaries = data;
        for (let i = 0; i < this.classroomSummaries.length; i++) {
          if (this.classroomSummaries[i].is_published) {
            publicClassroomCount += 1;
            singlePublicClassroomUrlFragment =
              this.classroomSummaries[i].url_fragment;
          } else {
            this.hasPublicClassrooms = true;
          }
        }

        if (publicClassroomCount === 1) {
          this.router.navigate([`/learn/${singlePublicClassroomUrlFragment}`]);
        } else {
          this.loaderService.hideLoadingScreen();
        }
      })
      .catch(err => {
        this.alertsService.addWarning('Failed to get classrooms data.');
      });
  }
}
