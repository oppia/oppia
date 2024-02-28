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
// Relative path used as an work around to get the angular compiler and webpack
// build to not complain.
// TODO(#16309): Fix relative imports.
import '../third-party-imports/ckeditor.import';

import { NoninteractiveCollapsible } from 'rich_text_components/Collapsible/directives/oppia-noninteractive-collapsible.component';
import { NoninteractiveImage } from 'rich_text_components/Image/directives/oppia-noninteractive-image.component';
import { NoninteractiveLink } from 'rich_text_components/Link/directives/oppia-noninteractive-link.component';
import { NoninteractiveMath } from 'rich_text_components/Math/directives/oppia-noninteractive-math.component';
import { NoninteractiveSkillreview } from 'rich_text_components/Skillreview/directives/oppia-noninteractive-skillreview.component';
import { NoninteractiveTabs } from 'rich_text_components/Tabs/directives/oppia-noninteractive-tabs.component';
import { NoninteractiveVideo } from 'rich_text_components/Video/directives/oppia-noninteractive-video.component';
import { CkEditorInitializerService } from './ck-editor-helpers/ck-editor-4-widgets.initializer';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { AppConstants } from 'app.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { I18nService } from 'i18n/i18n.service';
import { RteHelperService } from 'services/rte-helper.service';

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
  Tabs: {
    component_class: NoninteractiveTabs,
  },
  Video: {
    component_class: NoninteractiveVideo,
  }
};

export const registerCustomElements = (injector: Injector): void => {
  for (const rteKey of Object.keys(ServicesConstants.RTE_COMPONENT_SPECS)) {
    const rteElement = createCustomElement(
      componentMap[rteKey].component_class,
      {injector});
    // Check if the custom elements have been previously defined. We can't
    // redefine custom elements with the same id. Root cause for the element
    // being already defined is not yet known. Can possibly be a side effect of
    // webpack and AoT bundles co-existing.
    // TODO(#16718): Investigate custom element already defined error.
    if (
      customElements.get(
        'oppia-noninteractive-ckeditor-' +
        ServicesConstants.RTE_COMPONENT_SPECS[rteKey].frontend_id
      ) !== undefined
    ) {
      continue;
    }
    customElements.define(
      'oppia-noninteractive-ckeditor-' +
      ServicesConstants.RTE_COMPONENT_SPECS[rteKey].frontend_id,
      rteElement
    );
  }
};

@Component({
  selector: 'oppia-angular-root',
  templateUrl: './oppia-angular-root.component.html'
})
export class OppiaAngularRootComponent implements AfterViewInit {
  @Output() public initialized: EventEmitter<void> = new EventEmitter();
  direction: string = 'ltr';

  static classroomBackendApiService: ClassroomBackendApiService;
  static contextService: ContextService;
  static i18nLanguageCodeService: I18nLanguageCodeService;
  static ngZone: NgZone;
  static pageTitleService: PageTitleService;
  static profilePageBackendApiService: ProfilePageBackendApiService;
  static rteElementsAreInitialized: boolean = false;
  static rteHelperService;
  static ratingComputationService: RatingComputationService;
  static reviewTestBackendApiService: ReviewTestBackendApiService;
  static storyViewerBackendApiService: StoryViewerBackendApiService;
  static ajsValueProvider: (string, unknown) => void;
  static injector: Injector;

  constructor(
    private classroomBackendApiService: ClassroomBackendApiService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private htmlEscaperService: HtmlEscaperService,
    private i18nService: I18nService,
    private metaTagCustomizationService: MetaTagCustomizationService,
    private ngZone: NgZone,
    private pageTitleService: PageTitleService,
    private profilePageBackendApiService: ProfilePageBackendApiService,
    private ratingComputationService: RatingComputationService,
    private reviewTestBackendApiService: ReviewTestBackendApiService,
    private rteHelperService: RteHelperService,
    private storyViewerBackendApiService: StoryViewerBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private injector: Injector
  ) {
    if (OppiaAngularRootComponent.rteElementsAreInitialized) {
      return;
    }
    OppiaAngularRootComponent.rteHelperService = this.rteHelperService;
    registerCustomElements(this.injector);
    OppiaAngularRootComponent.rteElementsAreInitialized = true;
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
    OppiaAngularRootComponent.injector = this.injector;

    // Initialize dynamic meta tags.
    this.metaTagCustomizationService.addOrReplaceMetaTags([
      {
        propertyType: 'name',
        propertyValue: 'application-name',
        content: AppConstants.SITE_NAME
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-square310x310logo',
        content: this.getAssetUrl(
          '/assets/images/logo/msapplication-large.png')
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-wide310x150logo',
        content: this.getAssetUrl(
          '/assets/images/logo/msapplication-wide.png')
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-square150x150logo',
        content: this.getAssetUrl(
          '/assets/images/logo/msapplication-square.png')
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-square70x70logo',
        content: this.getAssetUrl(
          '/assets/images/logo/msapplication-tiny.png')
      },
      {
        propertyType: 'property',
        propertyValue: 'og:url',
        content: this.urlService.getCurrentLocation().href
      },
      {
        propertyType: 'property',
        propertyValue: 'og:image',
        content: this.urlInterpolationService.getStaticImageUrl(
          '/logo/288x288_logo_mint.webp')
      }
    ]);

    // Initialize translations.
    this.i18nService.directionChangeEventEmitter.subscribe((direction) => {
      this.direction = direction;
    });
    this.i18nService.initialize();

    // This emit triggers ajs to start its app.
    this.initialized.emit();
  }

  getAssetUrl(path: string): string {
    return this.urlInterpolationService.getFullStaticAssetUrl(path);
  }
}
