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
 * @fileoverview Root component for Classroom Page.
 */

import { Component } from '@angular/core';

import { AppConstants } from 'app.constants';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
import { PageHeadService } from 'services/page-head.service';
import { UrlService } from 'services/contextual/url.service';

@Component({
  selector: 'oppia-classroom-page-root',
  templateUrl: './classroom-page-root.component.html'
})
export class ClassroomPageRootComponent {
  constructor(
    private accessValidationBackendApiService:
      AccessValidationBackendApiService,
    private pageHeadService: PageHeadService,
    private urlService: UrlService,
  ) {}

  errorPageIsShown: boolean = false;
  pageIsShown: boolean = false;
  classroomUrlFragment!: string;

  ngOnInit(): void {
    this.classroomUrlFragment = (
      this.urlService.getClassroomUrlFragmentFromUrl());

    this.accessValidationBackendApiService.validateAccessToClassroomPage(
      this.classroomUrlFragment).then(() => {
      this.errorPageIsShown = false;
      this.pageIsShown = true;
      this.pageHeadService.updateTitleAndMetaTags(
        AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CLASSROOM.TITLE,
        AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CLASSROOM.META);
    }, () => {
      this.errorPageIsShown = true;
    });
  }
}
