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
 * @fileoverview Module for the skill editor page.
 */

import 'core-js/es7/reflect';
import 'zone.js';

import { Component, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';

// This component is needed to force-bootstrap Angular at the beginning of the
// app.
@Component({
  selector: 'service-bootstrap',
  template: ''
})
export class ServiceBootstrapComponent {}

import { AppConstants } from 'app.constants';
import { EditorDomainConstants } from
  'domain/editor/editor-domain.constants';
import { InteractionsExtensionsConstants } from
  'interactions/interactions-extension.constants';
import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { QuestionDomainConstants } from
  'domain/question/question-domain.constants';
import { QuestionsListConstants } from
  'components/question-directives/questions-list/questions-list.constants';
import { ServicesConstants } from 'services/services.constants';
import { SkillDomainConstants } from 'domain/skill/skill-domain.constants';
import { SkillEditorPageConstants } from
  'pages/skill-editor-page/skill-editor-page.constants';

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
    EditorDomainConstants,
    ObjectsDomainConstants,
    QuestionDomainConstants,
    QuestionsListConstants,
    ServicesConstants,
    SkillDomainConstants,
    SkillEditorPageConstants,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    }
  ]
})
class SkillEditorPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFn = (extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(SkillEditorPageModule);
};
const downgradedModule = downgradeModule(bootstrapFn);

declare var angular: ng.IAngularStatic;

angular.module('oppia', [
  'dndLists', 'headroom', 'infinite-scroll', 'ngAnimate',
  'ngAudio', require('angular-cookies'), 'ngJoyRide', 'ngMaterial',
  'ngSanitize', 'ngTouch', 'pascalprecht.translate',
  'toastr', 'ui.bootstrap', 'ui.codemirror', 'ui.sortable', 'ui.tree',
  'ui.validate', downgradedModule
])
  // This directive is the downgraded version of the Angular component to
  // bootstrap the Angular 8.
  .directive(
    'serviceBootstrap',
    downgradeComponent({
      component: ServiceBootstrapComponent
    }) as angular.IDirectiveFactory);
