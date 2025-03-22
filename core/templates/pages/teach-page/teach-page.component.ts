// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the teach page.
 */
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';

import {AppConstants} from 'app.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {UserService} from 'services/user.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {Subscription} from 'rxjs';
import {NgbCarousel} from '@ng-bootstrap/ng-bootstrap';
import {AccordionPanelData} from 'pages/about-page/data.model';

import './teach-page.component.css';

export interface Testimonial {
  personDetails: string;
  role:
    | 'I18N_TEACH_PAGE_TESTIMONIAL_ROLE_TEACHER'
    | 'I18N_TEACH_PAGE_TESTIMONIAL_ROLE_PARENT';
  quote: string;
  imageUrl: string;
  imageUrlWebp: string;
  altText: string;
}

@Component({
  selector: 'teach-page',
  templateUrl: './teach-page.component.html',
  styleUrls: ['./teach-page.component.css'],
})
export class TeachPageComponent implements OnInit, OnDestroy, AfterViewInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @ViewChild('creatorsCarouselContainer')
  creatorsCarouselContainer!: ElementRef;
  @ViewChild('testimonialsCarousel') testimonialsCarousel!: NgbCarousel;
  parentsTeachersPdfGuideLink = AppConstants.PARENTS_TEACHERS_PDF_GUIDE_LINK;
  teacherStoryTaggedBlogsLink = AppConstants.TEACHER_STORY_TAGGED_BLOGS_LINK;
  androidUrl = `/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ANDROID.ROUTE}`;
  displayedTestimonialId!: number;
  libraryUrl!: string;
  testimonials: readonly Testimonial[] = [];
  isWindowNarrow: boolean = false;
  userIsLoggedIn: boolean = false;
  directiveSubscriptions = new Subscription();
  lessonCreationData: AccordionPanelData[] = [
    {
      title: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_1_TITLE',
      text: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_1_TEXT',
      customPanelClassNames: [
        'oppia-teach-lesson-panel',
        'e2e-test-teach-page-lesson-panel',
      ],
      customTitleClassNames: [
        'oppia-teach-lesson-panel-title',
        'e2e-test-teach-page-lesson-panel-title',
      ],
      image: '/teach/skill-tree-image',
      altText: 'Skill tree image',
      panelIsCollapsed: true,
    },
    {
      title: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_2_TITLE',
      text: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_2_TEXT',
      customPanelClassNames: ['oppia-teach-lesson-panel'],
      customTitleClassNames: ['oppia-teach-lesson-panel-title'],
      image: '/teach/skill-table-image',
      altText: 'Skill table image',
      panelIsCollapsed: true,
    },
    {
      title: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_3_TITLE',
      text: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_3_TEXT',
      customPanelClassNames: ['oppia-teach-lesson-panel'],
      customTitleClassNames: ['oppia-teach-lesson-panel-title'],
      panelIsCollapsed: true,
    },
    {
      title: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_4_TITLE',
      text: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_4_TEXT',
      customPanelClassNames: ['oppia-teach-lesson-panel'],
      customTitleClassNames: ['oppia-teach-lesson-panel-title'],
      panelIsCollapsed: true,
    },
    {
      title: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_5_TITLE',
      text: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_5_TEXT',
      customPanelClassNames: ['oppia-teach-lesson-panel'],
      customTitleClassNames: ['oppia-teach-lesson-panel-title'],
      panelIsCollapsed: true,
    },
    {
      title: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_6_TITLE',
      text: 'I18N_TEACH_PAGE_LESSON_CREATION_STEP_6_TEXT',
      customPanelClassNames: ['oppia-teach-lesson-panel'],
      customTitleClassNames: ['oppia-teach-lesson-panel-title'],
      panelIsCollapsed: true,
    },
  ];
  creatorsData = AppConstants.LESSON_CREATORS_DATA_TEACH_PAGE;
  screenType!: 'desktop' | 'tablet' | 'mobile';
  creatorsIndicesObject = {
    desktop: [[0, 1, 2, 3, 4, 5]],
    tablet: [
      [0, 1, 2],
      [3, 4, 5],
    ],
    mobile: [
      [0, 1],
      [2, 3],
      [4, 5],
    ],
  };
  activeCreatorsSlideIndex = 0;
  activeCreatorsIndices!: number[];
  creatorsCarouselLeftArrowIsDisabled = true;
  creatorsCarouselRightArrowIsDisabled = false;
  pageIsLoaded = false;

  constructor(
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
    private userService: UserService,
    private loaderService: LoaderService,
    public renderer: Renderer2,
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {}

  ngOnInit(): void {
    this.displayedTestimonialId = 0;
    this.setScreenType();
    this.testimonials = AppConstants.TESTIMONIAlS_DATA_TEACHERS;
    this.libraryUrl = '/community-library';
    this.loaderService.showLoadingScreen('Loading');
    this.userService.getUserInfoAsync().then(userInfo => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
      this.loaderService.hideLoadingScreen();
    });
    this.isWindowNarrow = this.windowDimensionsService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(() => {
        this.setScreenType();
        this.isWindowNarrow = this.windowDimensionsService.isWindowNarrow();
      })
    );
    this.registerFirstTimePageViewEvent();
  }

  ngAfterViewInit(): void {
    this.creatorsCarouselContainer.nativeElement.addEventListener(
      'scroll',
      this.toggleCreatorsCarouselArrowsDisablityStatusDesktop.bind(this)
    );
    this.pageIsLoaded = true;
  }

  setScreenType(): void {
    const width = this.windowDimensionsService.getWidth();
    if (width < 553) {
      this.screenType = 'mobile';
    } else if (width < 769) {
      this.screenType = 'tablet';
    } else {
      this.screenType = 'desktop';
    }
    this.activeCreatorsSlideIndex = 0;
    if (this.pageIsLoaded) {
      this.toggleCreatorsCarouselArrowsDisablityStatusDesktop();
      this.toggleCreatorsCarouselArrowsDisablityStatusMobile();
    }
    this.setActiveCreatorsIndices();
  }

  showPreviousCreators(): void {
    if (this.screenType === 'desktop') {
      this.renderer.setProperty(
        this.creatorsCarouselContainer.nativeElement,
        'scrollLeft',
        0
      );
      this.toggleCreatorsCarouselArrowsDisablityStatusDesktop();
    } else {
      if (this.activeCreatorsSlideIndex === 0) {
        return;
      }
      this.activeCreatorsSlideIndex--;
      this.setActiveCreatorsIndices();
      this.toggleCreatorsCarouselArrowsDisablityStatusMobile();
    }
  }

  showNextCreators(): void {
    if (this.screenType === 'desktop') {
      const scrollWidth =
        this.creatorsCarouselContainer.nativeElement.scrollWidth;
      if (!this.isLanguageRTL()) {
        this.renderer.setProperty(
          this.creatorsCarouselContainer.nativeElement,
          'scrollLeft',
          scrollWidth
        );
      } else {
        this.renderer.setProperty(
          this.creatorsCarouselContainer.nativeElement,
          'scrollLeft',
          -scrollWidth
        );
      }
      this.toggleCreatorsCarouselArrowsDisablityStatusDesktop();
    } else {
      if (
        this.activeCreatorsSlideIndex ===
        this.creatorsIndicesObject[this.screenType].length - 1
      ) {
        return;
      }
      this.activeCreatorsSlideIndex++;
      this.setActiveCreatorsIndices();
      this.toggleCreatorsCarouselArrowsDisablityStatusMobile();
    }
  }

  setActiveCreatorsIndices(): void {
    this.activeCreatorsIndices =
      this.creatorsIndicesObject[this.screenType][
        this.activeCreatorsSlideIndex
      ];
  }

  toggleCreatorsCarouselArrowsDisablityStatusMobile(): void {
    if (this.screenType === 'desktop') {
      return;
    }
    this.creatorsCarouselLeftArrowIsDisabled =
      this.activeCreatorsSlideIndex === 0;
    this.creatorsCarouselRightArrowIsDisabled =
      this.activeCreatorsSlideIndex ===
      this.creatorsIndicesObject[this.screenType].length - 1;
  }

  toggleCreatorsCarouselArrowsDisablityStatusDesktop(): void {
    if (this.screenType !== 'desktop') {
      return;
    }
    // Here, the absolute value is used to accomodate the RTL UI logic.
    let scrollLeft = Math.abs(
      this.creatorsCarouselContainer.nativeElement.scrollLeft
    );
    let scrollWidth = Math.abs(
      this.creatorsCarouselContainer.nativeElement.scrollWidth
    );
    let clientWidth = Math.abs(
      this.creatorsCarouselContainer.nativeElement.clientWidth
    );

    scrollLeft = Math.round(scrollLeft);
    scrollWidth = Math.round(scrollWidth);
    clientWidth = Math.round(clientWidth);

    this.creatorsCarouselLeftArrowIsDisabled = scrollLeft === 0;
    this.creatorsCarouselRightArrowIsDisabled =
      scrollLeft === scrollWidth - clientWidth;
  }

  moveTestimonialCarouselToPreviousSlide(): void {
    this.testimonialsCarousel.prev();
  }

  moveTestimonialCarouselToNextSlide(): void {
    this.testimonialsCarousel.next();
  }

  onClickAccessAndroidButton(): void {
    this.windowRef.nativeWindow.location.href = '/android';
  }

  onClickStartLearningButton(): void {
    this.siteAnalyticsService.registerClickStartLearningButtonEvent();
    this.windowRef.nativeWindow.location.href = '/learn';
    return;
  }

  onClickVisitClassroomButton(): void {
    this.siteAnalyticsService.registerClickVisitClassroomButtonEvent();
    this.windowRef.nativeWindow.location.href = '/learn';
    return;
  }

  onClickBrowseLibraryButton(): void {
    this.siteAnalyticsService.registerClickBrowseLibraryButtonEvent();
    this.windowRef.nativeWindow.location.href = '/community-library';
    return;
  }

  onClickGuideParentsButton(): void {
    this.siteAnalyticsService.registerClickGuideParentsButtonEvent();
    this.windowRef.nativeWindow.location.href = '/teach';
    return;
  }

  onClickTipforParentsButton(): void {
    this.siteAnalyticsService.registerClickTipforParentsButtonEvent();
    this.windowRef.nativeWindow.location.href = '/teach';
    return;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  onClickExploreLessonsButton(): void {
    this.siteAnalyticsService.registerClickExploreLessonsButtonEvent();
  }

  onClickGetAndroidAppButton(): void {
    this.siteAnalyticsService.registerClickGetAndroidAppButtonEvent();
  }

  registerFirstTimePageViewEvent(): void {
    this.siteAnalyticsService.registerFirstTimePageViewEvent(
      AppConstants.LAST_PAGE_VIEW_TIME_LOCAL_STORAGE_KEYS_FOR_GA.TEACH
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
    this.creatorsCarouselContainer.nativeElement.removeEventListener(
      'scroll',
      this.toggleCreatorsCarouselArrowsDisablityStatusDesktop.bind(this)
    );
  }
}
