// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the contributor dashboard page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { InteractionExtensionsModule } from 'interactions/interactions.module';
import { TranslationLanguageSelectorComponent } from
  './translation-language-selector/translation-language-selector.component';
import { ReviewTranslationLanguageSelectorComponent } from './translation-language-selector/review-translation-language-selector.component';
import { TranslationTopicSelectorComponent } from
  './translation-topic-selector/translation-topic-selector.component';
import { LoginRequiredMessageComponent } from './login-required-message/login-required-message.component';
import { LoginRequiredModalContent } from './modal-templates/login-required-modal.component';
import { SmartRouterModule } from 'hybrid-router-module-provider';

import { OpportunitiesListItemComponent } from './opportunities-list-item/opportunities-list-item.component';
import { OpportunitiesListComponent } from './opportunities-list/opportunities-list.component';
import { TranslationSuggestionReviewModalComponent } from './modal-templates/translation-suggestion-review-modal.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { TranslationModalComponent } from './modal-templates/translation-modal.component';
import { TranslationOpportunitiesComponent } from './translation-opportunities/translation-opportunities.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { ContributionsAndReview } from './contributions-and-review/contributions-and-review.component';
import { QuestionOpportunitiesComponent } from './question-opportunities/question-opportunities.component';
import { ContributorDashboardPageComponent } from './contributor-dashboard-page.component';
import { AppErrorHandlerProvider } from 'pages/oppia-root/app-error-handler';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    InteractionExtensionsModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    RouterModule.forRoot([]),
    SharedComponentsModule,
    NgbModalModule,
    SharedFormsModule,
    OppiaCkEditorCopyToolBarModule,
    ToastrModule.forRoot(toastrConfig),
    MatSnackBarModule,
  ],
  declarations: [
    CertificateDownloadModalComponent,
    ContributorBadgesComponent,
    LoginRequiredMessageComponent,
    LoginRequiredModalContent,
    OpportunitiesListItemComponent,
    OpportunitiesListComponent,
    ReviewTranslationLanguageSelectorComponent,
    ContributorStatsComponent,
    BadgeComponent,
    TranslationLanguageSelectorComponent,
    TranslationOpportunitiesComponent,
    TranslationSuggestionReviewModalComponent,
    TranslationTopicSelectorComponent,
    TranslationModalComponent,
    ContributionsAndReview,
    QuestionOpportunitiesComponent,
    ContributorDashboardPageComponent,
    ContributorBadgesComponent
  ],
  entryComponents: [
    CertificateDownloadModalComponent,
    ContributorBadgesComponent,
    LoginRequiredMessageComponent,
    LoginRequiredModalContent,
    OpportunitiesListItemComponent,
    OpportunitiesListComponent,
    ReviewTranslationLanguageSelectorComponent,
    ContributorStatsComponent,
    BadgeComponent,
    TranslationLanguageSelectorComponent,
    TranslationOpportunitiesComponent,
    TranslationSuggestionReviewModalComponent,
    TranslationTopicSelectorComponent,
    TranslationModalComponent,
    ContributionsAndReview,
    QuestionOpportunitiesComponent,
    ContributorDashboardPageComponent
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: platformFeatureInitFactory,
      deps: [PlatformFeatureService],
      multi: true
    },
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    },
    AppErrorHandlerProvider,
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ]
})
class ContributorDashboardPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { SharedFormsModule } from 'components/forms/shared-forms.module';
import { ToastrModule } from 'ngx-toastr';
import { OppiaCkEditorCopyToolBarModule } from 'components/ck-editor-helpers/ck-editor-copy-toolbar/ck-editor-copy-toolbar.module';
import { ContributorStatsComponent } from './contributor-stats/contributor-stats.component';
import { CertificateDownloadModalComponent } from './modal-templates/certificate-download-modal.component';
import { ContributorBadgesComponent } from './contributor-badges/contributor-badges.component';
import { BadgeComponent } from './badge/badge.component';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(ContributorDashboardPageModule);
};
const downgradedModule = downgradeModule(bootstrapFnAsync);

declare var angular: ng.IAngularStatic;

angular.module('oppia').requires.push(downgradedModule);

angular.module('oppia').directive(
  // This directive is the downgraded version of the Angular component to
  // bootstrap the Angular 8.
  'oppiaAngularRoot',
  downgradeComponent({
    component: OppiaAngularRootComponent
  }) as angular.IDirectiveFactory);
