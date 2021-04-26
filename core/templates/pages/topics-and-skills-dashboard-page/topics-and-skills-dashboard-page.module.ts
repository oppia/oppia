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

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';

import { RequestInterceptor } from 'services/request-interceptor.service';
import { SelectTopicsComponent } from './topic-selector/select-topics.component';
import { SkillsListComponent } from './skills-list/skills-list.component';
import { DeleteSkillModalComponent } from './modals/delete-skill-modal.component';
import { UnassignSkillFromTopicsModalComponent } from './modals/unassign-skill-from-topics-modal.component';
import { TopicsListComponent } from './topics-list/topics-list.component';
import { DeleteTopicModalComponent } from './modals/delete-topic-modal.component';
import { AssignSkillToTopicModalComponent } from './modals/assign-skill-to-topic-modal.component';
import { MergeSkillModalComponent } from 'components/skill-selector/merge-skill-modal.component';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedComponentsModule
  ],
  declarations: [
    OppiaAngularRootComponent,
    SkillsListComponent,
    DeleteSkillModalComponent,
    UnassignSkillFromTopicsModalComponent,
    SelectTopicsComponent,
    AssignSkillToTopicModalComponent,
    MergeSkillModalComponent,
    TopicsListComponent,
    DeleteTopicModalComponent,
  ],
  entryComponents: [
    OppiaAngularRootComponent,
    SkillsListComponent,
    DeleteSkillModalComponent,
    UnassignSkillFromTopicsModalComponent,
    SelectTopicsComponent,
    AssignSkillToTopicModalComponent,
    MergeSkillModalComponent,
    TopicsListComponent,
    DeleteTopicModalComponent,
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

angular.module('oppia').requires.push(downgradedModule);

angular.module('oppia').directive(
  // This directive is the downgraded version of the Angular component to
  // bootstrap the Angular 8.
  'oppiaAngularRoot',
  downgradeComponent({
    component: OppiaAngularRootComponent
  }) as angular.IDirectiveFactory);
