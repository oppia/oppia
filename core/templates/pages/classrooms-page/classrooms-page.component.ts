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
import {
  ClassroomBackendApiService,
  ClassroomSummaryDict,
} from 'domain/classroom/classroom-backend-api.service';
import {LoaderService} from 'services/loader.service';

@Component({
  selector: 'oppia-classrooms-page',
  templateUrl: './classrooms-page.component.html',
})
export class ClassroomsPageComponent {
  classroomSummaries: ClassroomSummaryDict[] = [];
  haveAtleastOnePrivateClassroom: boolean = false;
  privateClassroomSummary: ClassroomSummaryDict = {
    classroom_id: '',
    name: '',
    teaser_text: '',
    thumbnail_bg_color: '',
    thumbnail_filename: '',
    url_fragment: '',
    is_published: false,
  };

  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    private alertsService: AlertsService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');

    this.classroomBackendApiService
      .getAllClassroomsSummaryAsync()
      .then(data => {
        this.classroomSummaries = data;
        for (let i = 0; i < this.classroomSummaries.length; i++) {
          if (!this.classroomSummaries[i].is_published) {
            this.haveAtleastOnePrivateClassroom = true;
            break;
          }
        }
        this.loaderService.hideLoadingScreen();
      })
      .catch(err => {
        this.alertsService.addWarning('Failed to get classrooms data.');
      });
  }
}
