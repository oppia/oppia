// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview The root component for angular application.
 */

/**
 * This file contains a component that "informs" the oppia-root directive that
 * angular has finished loading. This also contains services that are written
 * in angular but have to be accessed in ajs code.
 *
 * To have a new angular service accesible in ajs do the following:
 *   - import the service here.
 *   - create a static variable with the name of the service class in camelCase.
 *   - inject the service by providing it as an argument in the constructor.
 *   - in the ngAfterViewInit assign the serivce to the static varible
 *
 * Example:
 *   Let us assume that the service class is called MyService.
 *   - First import the service.
 *     import { MyService } from './path';
 *   - Then we create a static variable with the name of the service class.
 *     static myService: MyService;
 *   - Then we add it to the constructor
 *     constructor(
 *      ...
 *      private myService: MyService
 *     ...) {}
 *   - Then we assign the serivce to the static varible in ngAfterViewInit
 *     ngAfterViewInit() {
 *       ...
 *       OppiaAngularRootComponent.myService = this.myService
 *       ...
 *     }
 *
 * In case the above explanation was not clear or in case of doubts over what
 * is done here, please look at the description of the PR #9479.
 * https://github.com/oppia/oppia/pull/9479#issue-432536289
 * You can also find this example there under the "How does it solve the
 * Interceptor problem?" heading.
 *
 * File Structure:
 *   1 - imports
 *   2 - component declaration
 *   3 - static declaration of service-variables
 *   4 - constructor having all the services injected
 *   5 - ngAfterViewInit function assigning the injected service to static class
 *       variables and emitting an event to inform that angular has finished
 *       loading
 */

import { Component, Output, AfterViewInit, EventEmitter, Injector, NgZone } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { TranslateService } from '@ngx-translate/core';
import { TranslateCacheService } from 'ngx-translate-cache';
import { ClassroomBackendApiService } from
  'domain/classroom/classroom-backend-api.service';
import { ContextService } from 'services/context.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { PageTitleService } from 'services/page-title.service';
import { ProfilePageBackendApiService } from
  'pages/profile-page/profile-page-backend-api.service';
import { RatingComputationService } from
  'components/ratings/rating-computation/rating-computation.service';
import { ReviewTestBackendApiService } from
  'domain/review_test/review-test-backend-api.service';
import { StoryViewerBackendApiService } from
  'domain/story_viewer/story-viewer-backend-api.service';
import { ServicesConstants } from 'services/services.constants';
import 'third-party-imports/ckeditor.import.ts';

import { NoninteractiveCollapsible } from 'rich_text_components/Collapsible/directives/oppia-noninteractive-collapsible.component';
import { NoninteractiveImage } from 'rich_text_components/Image/directives/oppia-noninteractive-image.component';
import { NoninteractiveLink } from 'rich_text_components/Link/directives/oppia-noninteractive-link.component';
import { NoninteractiveMath } from 'rich_text_components/Math/directives/oppia-noninteractive-math.component';
import { NoninteractiveSkillreview } from 'rich_text_components/Skillreview/directives/oppia-noninteractive-skillreview.component';
import { NoninteractiveSvgdiagram } from 'rich_text_components/Svgdiagram/directives/oppia-noninteractive-svgdiagram.component';
import { NoninteractiveTabs } from 'rich_text_components/Tabs/directives/oppia-noninteractive-tabs.component';
import { NoninteractiveVideo } from 'rich_text_components/Video/directives/oppia-noninteractive-video.component';
import { CkEditorInitializerService } from './ck-editor-helpers/ck-editor-4-widgets.initializer';
import { HtmlEscaperService } from 'services/html-escaper.service';

const componentMap = {
  Collapsible: {
    component_class: NoninteractiveCollapsible,
  },
  Image: {
    component_class: NoninteractiveImage,
  },
  Link: {
    component_class: NoninteractiveLink,
  },
  Math: {
    component_class: NoninteractiveMath,
  },
  Skillreview: {
    component_class: NoninteractiveSkillreview,
  },
  Svgdiagram: {
    component_class: NoninteractiveSvgdiagram,
  },
  Tabs: {
    component_class: NoninteractiveTabs,
  },
  Video: {
    component_class: NoninteractiveVideo,
  }
};
@Component({
  selector: 'oppia-angular-root',
  template: ''
})
export class OppiaAngularRootComponent implements AfterViewInit {
  @Output()
    public initialized: EventEmitter<void> = new EventEmitter();
  static ajsTranslate;
  static classroomBackendApiService: ClassroomBackendApiService;
  static contextService: ContextService;
  static i18nLanguageCodeService: I18nLanguageCodeService;
  static ngZone: NgZone;
  static pageTitleService: PageTitleService;
  static profilePageBackendApiService: ProfilePageBackendApiService;
  static rteHelperService;
  static ratingComputationService: RatingComputationService;
  static reviewTestBackendApiService: ReviewTestBackendApiService;
  static storyViewerBackendApiService: StoryViewerBackendApiService;
  static translateService: TranslateService;
  static translateCacheService: TranslateCacheService;
  static ajsValueProvider: (string, unknown) => void;
  static injector: Injector;

  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private htmlEscaperService: HtmlEscaperService,
    private ngZone: NgZone,
    private pageTitleService: PageTitleService,
    private profilePageBackendApiService: ProfilePageBackendApiService,
    private ratingComputationService: RatingComputationService,
    private reviewTestBackendApiService: ReviewTestBackendApiService,
    private storyViewerBackendApiService: StoryViewerBackendApiService,
    private translateService: TranslateService,
    private translateCacheService: TranslateCacheService,
    private injector: Injector
  ) {
    for (const rteKey of Object.keys(ServicesConstants.RTE_COMPONENT_SPECS)) {
      const rteElement = createCustomElement(
        componentMap[rteKey].component_class,
        {injector: this.injector});
      customElements.define(
        'oppia-noninteractive-' +
        ServicesConstants.RTE_COMPONENT_SPECS[rteKey].frontend_id,
        rteElement
      );
    }
  }

  public ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      CkEditorInitializerService.ckEditorInitializer(
        OppiaAngularRootComponent.rteHelperService,
        this.htmlEscaperService,
        OppiaAngularRootComponent.contextService,
        this.ngZone
      );
    });
    OppiaAngularRootComponent.classroomBackendApiService = (
      this.classroomBackendApiService);
    OppiaAngularRootComponent.i18nLanguageCodeService = (
      this.i18nLanguageCodeService);
    OppiaAngularRootComponent.ngZone = this.ngZone;
    OppiaAngularRootComponent.pageTitleService = this.pageTitleService;
    OppiaAngularRootComponent.profilePageBackendApiService = (
      this.profilePageBackendApiService);
    OppiaAngularRootComponent.ratingComputationService = (
      this.ratingComputationService);
    OppiaAngularRootComponent.reviewTestBackendApiService = (
      this.reviewTestBackendApiService);
    OppiaAngularRootComponent.storyViewerBackendApiService = (
      this.storyViewerBackendApiService);
    OppiaAngularRootComponent.translateService = this.translateService;
    OppiaAngularRootComponent.translateCacheService = (
      this.translateCacheService);
    OppiaAngularRootComponent.injector = this.injector;

    // This emit triggers ajs to start its app.
    this.initialized.emit();
  }
}
