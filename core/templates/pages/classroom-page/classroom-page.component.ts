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

import { Component, OnDestroy } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AppConstants } from 'app.constants';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { ClassroomData } from 'domain/classroom/classroom-data.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import './classroom-page.component.css';

@Component({
  selector: 'oppia-classroom-page',
  templateUrl: './classroom-page.component.html'
})
export class ClassroomPageComponent implements OnDestroy {
  directiveSubscriptions = new Subscription();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  classroomDisplayName!: string;
  classroomNameTranslationKey!: string;
  classroomUrlFragment!: string;
  bannerImageFileUrl!: string;
  classroomData!: ClassroomData;

  constructor(
    private accessValidationBackendApiService:
      AccessValidationBackendApiService,
    private alertsService: AlertsService,
    private capitalizePipe: CapitalizePipe,
    private classroomBackendApiService: ClassroomBackendApiService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowRef: WindowRef,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.classroomUrlFragment = (
      this.urlService.getClassroomUrlFragmentFromUrl());
    this.bannerImageFileUrl = this.urlInterpolationService.getStaticImageUrl(
      '/splash/books.svg');

    this.loaderService.showLoadingScreen('Loading');

    this.accessValidationBackendApiService.validateAccessToClassroomPage(
      this.classroomUrlFragment).then(() => {
      this.classroomBackendApiService.fetchClassroomDataAsync(
        this.classroomUrlFragment).then((classroomData) => {
        this.classroomData = classroomData;
        this.classroomDisplayName = this.capitalizePipe.transform(
          classroomData.getName());
        this.classroomNameTranslationKey = this.i18nLanguageCodeService.
          getClassroomTranslationKey(this.classroomDisplayName);
        this.setPageTitle();
        this.subscribeToOnLangChange();
        this.loaderService.hideLoadingScreen();
        this.classroomBackendApiService.onInitializeTranslation.emit();
        this.siteAnalyticsService.registerClassroomPageViewed();
      }, (errorResponse) => {
        if (AppConstants.FATAL_ERROR_CODES.indexOf(
          errorResponse.status) !== -1) {
          this.alertsService.addWarning('Failed to get dashboard data');
        }
      });
    }, (err) => {
      // User provided classroom doesnot exist. Redirect to default classroom.
      this.windowRef.nativeWindow.history.pushState(
        null, 'classroom', AppConstants.DEFAULT_CLASSROOM_URL_FRAGMENT);
      this.ngOnInit();
    });
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_CLASSROOM_PAGE_TITLE', {
        classroomName: this.classroomDisplayName
      });
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  // This method is used to choose whether to display the classroom name or
  // the classroom name translation in the UI.
  isHackyClassroomTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.classroomNameTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaClassroomPage',
  downgradeComponent({
    component: ClassroomPageComponent
  }) as angular.IDirectiveFactory);
