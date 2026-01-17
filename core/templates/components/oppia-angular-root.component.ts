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

import {
  Component,
  Output,
  AfterViewInit,
  EventEmitter,
  Injector,
  NgZone,
  Type,
} from '@angular/core';
import {createCustomElement} from '@angular/elements';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {PageTitleService} from 'services/page-title.service';
import {ProfilePageBackendApiService} from 'pages/profile-page/profile-page-backend-api.service';
import {RatingComputationService} from 'components/ratings/rating-computation/rating-computation.service';
import {ReviewTestBackendApiService} from 'domain/review_test/review-test-backend-api.service';
import {StoryViewerBackendApiService} from 'domain/story_viewer/story-viewer-backend-api.service';
import {ServicesConstants} from 'services/services.constants';

import '../third-party-imports/ckeditor.import';

import {NoninteractiveCollapsible} from 'rich_text_components/Collapsible/directives/oppia-noninteractive-collapsible.component';
import {NoninteractiveImage} from 'rich_text_components/Image/directives/oppia-noninteractive-image.component';
import {NoninteractiveLink} from 'rich_text_components/Link/directives/oppia-noninteractive-link.component';
import {NoninteractiveMath} from 'rich_text_components/Math/directives/oppia-noninteractive-math.component';
import {NoninteractiveSkillreview} from 'rich_text_components/Skillreview/directives/oppia-noninteractive-skillreview.component';
import {NoninteractiveTabs} from 'rich_text_components/Tabs/directives/oppia-noninteractive-tabs.component';
import {NoninteractiveVideo} from 'rich_text_components/Video/directives/oppia-noninteractive-video.component';
import {NoninteractiveWorkedexample} from 'rich_text_components/Workedexample/directives/oppia-noninteractive-workedexample.component';
import {CkEditorInitializerService} from './ck-editor-helpers/ck-editor-4-widgets.initializer';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {MetaTagCustomizationService} from 'services/contextual/meta-tag-customization.service';
import {AppConstants} from 'app.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {I18nService} from 'i18n/i18n.service';
import {RteHelperService} from 'services/rte-helper.service';

interface ComponentMap {
  [key: string]: {
    component_class: Type<unknown>;
  };
}

const componentMap: ComponentMap = {
  Collapsible: {
    component_class: NoninteractiveCollapsible as Type<unknown>,
  },
  Image: {
    component_class: NoninteractiveImage as Type<unknown>,
  },
  Link: {
    component_class: NoninteractiveLink as Type<unknown>,
  },
  Math: {
    component_class: NoninteractiveMath as Type<unknown>,
  },
  Skillreview: {
    component_class: NoninteractiveSkillreview as Type<unknown>,
  },
  Tabs: {
    component_class: NoninteractiveTabs as Type<unknown>,
  },
  Video: {
    component_class: NoninteractiveVideo as Type<unknown>,
  },
  Workedexample: {
    component_class: NoninteractiveWorkedexample as Type<unknown>,
  },
};

export const registerCustomElements = (injector: Injector): void => {
  const rteSpecs = ServicesConstants.RTE_COMPONENT_SPECS as unknown as Record<
    string,
    {frontend_id: string}
  >;
  for (const rteKey of Object.keys(rteSpecs)) {
    if (componentMap[rteKey]) {
      const rteElement = createCustomElement(
        componentMap[rteKey].component_class,
        {injector}
      );
      const frontendId = rteSpecs[rteKey].frontend_id;
      if (
        customElements.get(`oppia-noninteractive-ckeditor-${frontendId}`) ===
        undefined
      ) {
        customElements.define(
          `oppia-noninteractive-ckeditor-${frontendId}`,
          rteElement
        );
      }
    }
  }
};

@Component({
  selector: 'oppia-angular-root',
  templateUrl: './oppia-angular-root.component.html',
})
export class OppiaAngularRootComponent implements AfterViewInit {
  @Output() public initialized: EventEmitter<void> = new EventEmitter();
  direction: string = 'ltr';

  static classroomBackendApiService: ClassroomBackendApiService;
  static pageContextService: PageContextService;
  static i18nLanguageCodeService: I18nLanguageCodeService;
  static ngZone: NgZone;
  static pageTitleService: PageTitleService;
  static profilePageBackendApiService: ProfilePageBackendApiService;
  static rteElementsAreInitialized: boolean = false;
  static rteHelperService: RteHelperService;
  static ratingComputationService: RatingComputationService;
  static reviewTestBackendApiService: ReviewTestBackendApiService;
  static storyViewerBackendApiService: StoryViewerBackendApiService;
  static ajsValueProvider: (key: string, value: unknown) => void;
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
    private injector: Injector,
    private pageContextService: PageContextService
  ) {
    if (OppiaAngularRootComponent.rteElementsAreInitialized) {
      return;
    }
    OppiaAngularRootComponent.rteHelperService = this.rteHelperService;
    registerCustomElements(this.injector);
    OppiaAngularRootComponent.rteElementsAreInitialized = true;
  }

  public ngAfterViewInit(): void {
    if (!OppiaAngularRootComponent.pageContextService) {
      OppiaAngularRootComponent.pageContextService = this.pageContextService;
    }
    this.ngZone.runOutsideAngular(() => {
      CkEditorInitializerService.ckEditorInitializer(
        OppiaAngularRootComponent.rteHelperService as unknown as Parameters<
          typeof CkEditorInitializerService.ckEditorInitializer
        >[0],
        this.htmlEscaperService,
        this.pageContextService,
        this.ngZone
      );
    });
    OppiaAngularRootComponent.classroomBackendApiService =
      this.classroomBackendApiService;
    OppiaAngularRootComponent.i18nLanguageCodeService =
      this.i18nLanguageCodeService;
    OppiaAngularRootComponent.ngZone = this.ngZone;
    OppiaAngularRootComponent.pageTitleService = this.pageTitleService;
    OppiaAngularRootComponent.profilePageBackendApiService =
      this.profilePageBackendApiService;
    OppiaAngularRootComponent.ratingComputationService =
      this.ratingComputationService;
    OppiaAngularRootComponent.reviewTestBackendApiService =
      this.reviewTestBackendApiService;
    OppiaAngularRootComponent.storyViewerBackendApiService =
      this.storyViewerBackendApiService;
    OppiaAngularRootComponent.injector = this.injector;

    this.metaTagCustomizationService.addOrReplaceMetaTags([
      {
        propertyType: 'name',
        propertyValue: 'application-name',
        content: AppConstants.SITE_NAME,
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-square310x310logo',
        content: this.urlInterpolationService.getStaticCopyrightedImageUrl(
          '/assets/images/logo/msapplication-large.png'
        ),
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-wide310x150logo',
        content: this.urlInterpolationService.getStaticCopyrightedImageUrl(
          '/assets/images/logo/msapplication-wide.png'
        ),
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-square150x150logo',
        content: this.urlInterpolationService.getStaticCopyrightedImageUrl(
          '/assets/images/logo/msapplication-square.png'
        ),
      },
      {
        propertyType: 'name',
        propertyValue: 'msapplication-square70x70logo',
        content: this.urlInterpolationService.getStaticCopyrightedImageUrl(
          '/assets/images/logo/msapplication-tiny.png'
        ),
      },
      {
        propertyType: 'property',
        propertyValue: 'og:url',
        content: this.urlService.getCurrentLocation().href,
      },
      {
        propertyType: 'property',
        propertyValue: 'og:image',
        content: this.urlInterpolationService.getStaticImageUrl(
          '/logo/288x288_logo_mint.webp'
        ),
      },
    ]);

    this.i18nService.directionChangeEventEmitter.subscribe(direction => {
      this.direction = direction;
    });
    this.i18nService.initialize();

    this.initialized.emit();
  }
}
