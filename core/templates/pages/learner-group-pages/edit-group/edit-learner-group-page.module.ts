// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the edit learner group page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from
  '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { EditLearnerGroupPageComponent } from
  './edit-learner-group-page.component';
import { LearnerGroupOverviewComponent } from
  './learner-group-overview.component';
import { LearnerGroupSyllabusComponent } from
  './learner-group-syllabus.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { AddSyllabusItemsComponent } from
  '../create-group/add-syllabus-items.component';
import { RemoveItemModalComponent } from
  '../templates/remove-item-modal.component';
import { SyllabusAdditionSuccessModalComponent } from
  '../templates/syllabus-addition-success-modal.component';
import { LearnerGroupPreferencesComponent } from
  './learner-group-preferences.component';
import { LearnerGroupDetailsComponent } from
  '../create-group/learner-group-details.component';
import { InviteLearnersModalComponent } from
  '../templates/invite-learners-modal.component';
import { InviteLearnersComponent } from
  '../create-group/invite-learners.component';
import { LearnerGroupLearnersProgressComponent } from
  './learner-group-learners-progress.component';
import { LearnerGroupLearnerSpecificProgressComponent } from
  './learner-group-learner-specific-progress.component';
import { InviteSuccessfulModalComponent } from
  '../templates/invite-successful-modal.component';
import { DeleteLearnerGroupModalComponent } from
  '../templates/delete-learner-group-modal.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    RouterModule.forRoot([]),
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    EditLearnerGroupPageComponent,
    LearnerGroupOverviewComponent,
    LearnerGroupSyllabusComponent,
    LearnerGroupLearnersProgressComponent,
    LearnerGroupPreferencesComponent,
    LearnerGroupLearnerSpecificProgressComponent,
    AddSyllabusItemsComponent,
    InviteLearnersComponent,
    LearnerGroupDetailsComponent,
    RemoveItemModalComponent,
    SyllabusAdditionSuccessModalComponent,
    InviteLearnersModalComponent,
    InviteSuccessfulModalComponent,
    DeleteLearnerGroupModalComponent
  ],
  entryComponents: [
    EditLearnerGroupPageComponent,
    LearnerGroupOverviewComponent,
    LearnerGroupSyllabusComponent,
    LearnerGroupLearnersProgressComponent,
    LearnerGroupPreferencesComponent,
    LearnerGroupLearnerSpecificProgressComponent,
    AddSyllabusItemsComponent,
    InviteLearnersComponent,
    LearnerGroupDetailsComponent,
    RemoveItemModalComponent,
    SyllabusAdditionSuccessModalComponent,
    InviteLearnersModalComponent,
    InviteSuccessfulModalComponent,
    DeleteLearnerGroupModalComponent
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
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ]
})
class EditLearnerGroupPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { ToastrModule } from 'ngx-toastr';
import { SmartRouterModule } from 'hybrid-router-module-provider';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(EditLearnerGroupPageModule);
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
