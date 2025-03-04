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

import {Component, OnDestroy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {ClassroomData} from 'domain/classroom/classroom-data.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {LoaderService} from 'services/loader.service';
import {PageTitleService} from 'services/page-title.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import './classroom-page.component.css';
import {UserService} from 'services/user.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';

export interface ClassroomTranslationKeys {
  name: string;
  courseDetails: string;
  topicListIntro: string;
  teaserText: string;
  [key: string]: string;
}

@Component({
  selector: 'oppia-classroom-page',
  templateUrl: './classroom-page.component.html',
  styleUrls: ['./classroom-page.component.css'],
})
export class ClassroomPageComponent implements OnDestroy {
  directiveSubscriptions = new Subscription();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  classroomDisplayName!: string;
  classroomUrlFragment!: string;
  bannerImageFileUrl!: string;
  classroomData!: ClassroomData;
  beginWithFirstTopicButtonText: string = '';
  begineWithFirstTopicDescriptionText: string = '';
  firstTopicUrl: string = '';
  publicClassroomsCount!: number;
  showPrivateClassroomBanner: boolean = false;
  classroomThumbnail = '';
  classroomBanner = '';
  classroomTranslationKeys!: ClassroomTranslationKeys;

  constructor(
    private accessValidationBackendApiService: AccessValidationBackendApiService,
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
    private translateService: TranslateService,
    private platformFeatureService: PlatformFeatureService,
    private userService: UserService,
    private assetsBackendApiService: AssetsBackendApiService
  ) {}

  setClassroomMedia(classroomData: ClassroomData): void {
    const classroomId = classroomData.getClassroomId();
    const thumbnailFilename = classroomData.getThumbnailData().filename;
    const bannerFilename = classroomData.getBannerData().filename;

    this.classroomThumbnail = thumbnailFilename
      ? this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.CLASSROOM,
          classroomId,
          thumbnailFilename
        )
      : this.urlInterpolationService.getStaticImageUrl(
          '/classroom/default-classroom-thumbnail.svg'
        );

    this.classroomBanner = bannerFilename
      ? this.assetsBackendApiService.getImageUrlForPreview(
          AppConstants.ENTITY_TYPE.CLASSROOM,
          classroomId,
          bannerFilename
        )
      : this.urlInterpolationService.getStaticImageUrl(
          '/classroom/default-classroom-background.png'
        );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  ngOnInit(): void {
    this.classroomUrlFragment =
      this.urlService.getClassroomUrlFragmentFromUrl();
    this.bannerImageFileUrl =
      this.urlInterpolationService.getStaticImageUrl('/splash/books.svg');

    this.loaderService.showLoadingScreen('Loading');
    this.isDiagnosticTestFeatureFlagEnabled();

    this.accessValidationBackendApiService
      .validateAccessToClassroomPage(this.classroomUrlFragment)
      .then(
        () => {
          this.classroomBackendApiService
            .fetchClassroomDataAsync(this.classroomUrlFragment)
            .then(
              classroomData => {
                this.classroomData = classroomData;
                this.classroomDisplayName = this.capitalizePipe.transform(
                  classroomData.getName()
                );

                this.setClassroomMedia(classroomData);

                this.publicClassroomsCount =
                  classroomData.getPublicClassroomsCount();

                this.classroomTranslationKeys =
                  this.i18nLanguageCodeService.getClassroomTranslationKeys(
                    classroomData.getName()
                  );
                this.setPageTitle();
                this.subscribeToOnLangChange();
                this.loaderService.hideLoadingScreen();
                this.classroomBackendApiService.onInitializeTranslation.emit();
                this.siteAnalyticsService.registerClassroomPageViewed();
                if (
                  classroomData &&
                  classroomData.getTopicSummaries().length > 0
                ) {
                  let firstTopic = classroomData.getTopicSummaries()[0].name;
                  this.firstTopicUrl =
                    `/learn/${classroomData.getUrlFragment()}/` +
                    classroomData.getTopicSummaries()[0].urlFragment;

                  this.beginWithFirstTopicButtonText =
                    this.translateService.instant(
                      'I18N_CLASSROOM_PAGE_BEGIN_WITH_FIRST_TOPIC_BUTTON',
                      {
                        firstTopic: firstTopic,
                      }
                    );

                  this.begineWithFirstTopicDescriptionText =
                    this.translateService.instant(
                      'I18N_CLASSROOM_PAGE_NEW_TO_MATH_TEXT',
                      {
                        firstTopic: firstTopic,
                      }
                    );
                }
                this.userService.getUserInfoAsync().then(userInfo => {
                  this.showPrivateClassroomBanner =
                    userInfo.isCurriculumAdmin() &&
                    !this.classroomData.getIsPublished();
                });
              },
              errorResponse => {
                if (
                  AppConstants.FATAL_ERROR_CODES.indexOf(
                    errorResponse.status
                  ) !== -1
                ) {
                  this.alertsService.addWarning('Failed to get classroom data');
                }
              }
            );
        },
        err => {
          // Note to developers:
          // This callback is triggered when the provided classroom does not exist,
          // this will raise page not found exception.
          // No further action is needed.
        }
      );
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    if (this.isHackyClassroomTranslationDisplayed('name')) {
      let translatedTitle = this.translateService.instant(
        this.classroomTranslationKeys.name
      );
      this.pageTitleService.setDocumentTitle(translatedTitle);
    } else {
      this.pageTitleService.setDocumentTitle(this.classroomDisplayName);
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  // This method is used to choose whether to display the translation
  // for a classroom property.
  isHackyClassroomTranslationDisplayed(property: string): boolean {
    if (
      !(
        this.classroomTranslationKeys &&
        property in this.classroomTranslationKeys
      )
    ) {
      return false;
    }
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.classroomTranslationKeys[property]
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  isDiagnosticTestFeatureFlagEnabled(): boolean {
    return this.platformFeatureService.status.DiagnosticTest.isEnabled;
  }

  isDiagnosticTestEnabled(): boolean {
    return this.classroomData.getIsDiagnosticTestEnabled();
  }
}
