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
 * @fileoverview Component for the classroom page.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { ClassroomData } from 'domain/classroom/classroom-data.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';

@Component({
  selector: 'oppia-classroom-page',
  templateUrl: './classroom-page.component.html'
})
export class ClassroomPageComponent {
  classroomDisplayName: string = '';
  classroomUrlFragment: string = '';
  bannerImageFileUrl: string = '';
  classroomData: ClassroomData;

  constructor(
    private alertsService: AlertsService,
    private capitalizePipe: CapitalizePipe,
    private classroomBackendApiService: ClassroomBackendApiService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
  ) {}

  ngOnInit(): void {
    this.classroomUrlFragment = (
      this.urlService.getClassroomUrlFragmentFromUrl());
    this.bannerImageFileUrl = this.urlInterpolationService.getStaticImageUrl(
      '/splash/books.svg');

    this.loaderService.showLoadingScreen('Loading');
    this.classroomBackendApiService.fetchClassroomDataAsync(
      this.classroomUrlFragment).then((classroomData) => {
      this.classroomData = classroomData;
      this.classroomDisplayName = this.capitalizePipe.transform(
        classroomData.getName());
      this.pageTitleService.setPageTitle(
        `Learn ${this.classroomDisplayName} with Oppia | Oppia`);
      this.loaderService.hideLoadingScreen();
      this.classroomBackendApiService.onInitializeTranslation.emit();
      this.siteAnalyticsService.registerClassroomPageViewed();
    }, (errorResponse) => {
      if (AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
        this.alertsService.addWarning('Failed to get dashboard data');
      }
    });
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}

angular.module('oppia').directive('oppiaClassroomPage',
  downgradeComponent({
    component: ClassroomPageComponent
  }) as angular.IDirectiveFactory);
