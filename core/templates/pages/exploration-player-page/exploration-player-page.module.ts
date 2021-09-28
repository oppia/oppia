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
 * @fileoverview Module for the exploration player page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgbModalModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { SwitchContentLanguageRefreshRequiredModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/switch-content-language-refresh-required-modal.component';
import { InteractionExtensionsModule } from 'interactions/interactions.module';
import { MatButtonModule } from '@angular/material/button';
import { LearnerLocalNavComponent } from './layout-directives/learner-local-nav.component';
import { FlagExplorationModalComponent } from './modals/flag-exploration-modal.component';
import { FeedbackPopupComponent } from './layout-directives/feedback-popup.component';
import { ExplorationSuccessfullyFlaggedModalComponent } from './modals/exploration-successfully-flagged-modal.component';
import { LearnerAnswerInfoCard } from './learner-experience/learner-answer-info-card.component';

import { LearnerViewInfoComponent } from './layout-directives/learner-view-info.component';
import { InformationCardModalComponent } from './templates/information-card-modal.component';
import { MaterialModule } from 'modules/material.module';
import { RefresherExplorationConfirmationModal } from './modals/refresher-exploration-confirmation-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    InteractionExtensionsModule,
    MatButtonModule,
    NgbModalModule,
    MaterialModule,
    NgbPopoverModule,
    SharedComponentsModule,
    NgbPopoverModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    SwitchContentLanguageRefreshRequiredModalComponent,
    LearnerAnswerInfoCard,
    ExplorationSuccessfullyFlaggedModalComponent,
    InformationCardModalComponent,
    FlagExplorationModalComponent,
    LearnerLocalNavComponent,
    FeedbackPopupComponent,
    LearnerViewInfoComponent,
    RefresherExplorationConfirmationModal,
  ],
  entryComponents: [
    SwitchContentLanguageRefreshRequiredModalComponent,
    ExplorationSuccessfullyFlaggedModalComponent,
    InformationCardModalComponent,
    FlagExplorationModalComponent,
    LearnerLocalNavComponent,
    FeedbackPopupComponent,
    LearnerAnswerInfoCard,
    LearnerViewInfoComponent,
    RefresherExplorationConfirmationModal,
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
    }
  ]
})
class ExplorationPlayerPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { ToastrModule } from 'ngx-toastr';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(ExplorationPlayerPageModule);
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
