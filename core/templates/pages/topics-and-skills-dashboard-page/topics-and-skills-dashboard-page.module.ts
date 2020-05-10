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
 * @fileoverview Module for the story viewer page.
 */

import 'core-js/es7/reflect';
import 'zone.js';

import { Component, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// This component is needed to force-bootstrap Angular at the beginning of the
// app.
@Component({
  selector: 'service-bootstrap',
  template: ''
})
export class ServiceBootstrapComponent {}

import { AppConstants } from 'app.constants';
import { InteractionsExtensionsConstants } from
  'interactions/interactions-extension.constants';
import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { ServicesConstants } from 'services/services.constants';
import { SkillDomainConstants } from 'domain/skill/skill-domain.constants';
import { TopicDomainConstants } from 'domain/topic/topic-domain.constants';
/* eslint-disable max-len */
import { TopicsAndSkillsDashboardDomainConstants } from
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants';
import { TopicsAndSkillsDashboardPageConstants } from
  'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';
/* eslint-enable max-len */

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  declarations: [
    ServiceBootstrapComponent
  ],
  entryComponents: [
    ServiceBootstrapComponent
  ],
  providers: [
    AppConstants,
    InteractionsExtensionsConstants,
    ObjectsDomainConstants,
    ServicesConstants,
    SkillDomainConstants,
    TopicDomainConstants,
    TopicsAndSkillsDashboardDomainConstants,
    TopicsAndSkillsDashboardPageConstants,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    }
  ]
})
class TopicsAndSkillsDashboardPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFn = (extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(TopicsAndSkillsDashboardPageModule);
};
const downgradedModule = downgradeModule(bootstrapFn);

declare var angular: ng.IAngularStatic;

angular.module('oppia', [
  'dndLists', 'headroom', 'infinite-scroll', 'ngAnimate',
  'ngAudio', require('angular-cookies'), 'ngJoyRide', 'ngMaterial',
  'ngSanitize', 'ngTouch', 'pascalprecht.translate',
  'toastr', 'ui.bootstrap', 'ui.sortable', 'ui.tree', 'ui.validate',
  downgradedModule
])
  // This directive is the downgraded version of the Angular component to
  // bootstrap the Angular 8.
  .directive(
    'serviceBootstrap',
    downgradeComponent({
      component: ServiceBootstrapComponent
    }) as angular.IDirectiveFactory);
