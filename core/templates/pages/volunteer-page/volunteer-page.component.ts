// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the volunteer page.
 */

import {Component, OnInit, OnDestroy} from '@angular/core';
import {ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {NgbCarouselConfig} from '@ng-bootstrap/ng-bootstrap';
import {Subscription} from 'rxjs';

import {PageTitleService} from 'services/page-title.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {AppConstants} from 'app.constants';
import {SiteAnalyticsService} from 'services/site-analytics.service';

import './volunteer-page.component.css';

@Component({
  selector: 'volunteer-page',
  templateUrl: './volunteer-page.component.html',
  styleUrls: ['./volunteer-page.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [NgbCarouselConfig],
})
export class VolunteerPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  bannerImgPath = '';
  footerImgPath = '';
  formLink = AppConstants.VOLUNTEER_FORM_LINK;
  art!: {
    images: string[];
    caption: {
      content: string;
      name: string;
      type: string;
    }[];
  };

  software!: {
    images: string[];
    caption: {
      content: string;
      name: string;
      type: string;
    }[];
  };

  outreach!: {
    images: string[];
    caption: {content: string; name: string; type: string}[];
  };

  lessonCreation!: {
    images: string[];
    caption: {content: string; name: string; type: string}[];
  };

  translation!: {
    images: string[];
    caption: {content: string; name: string; type: string}[];
  };

  volunteerExpectations = AppConstants.VOLUNTEER_EXPECTATIONS;

  outreachSkills = AppConstants.VOLUNTEER_PREFERRED_SKILLS.OUTREACH;

  softwareSkills = AppConstants.VOLUNTEER_PREFERRED_SKILLS.SOFTWARE;

  artAndDesignSkills = AppConstants.VOLUNTEER_PREFERRED_SKILLS.ART_AND_DESIGN;

  translationSkills = AppConstants.VOLUNTEER_PREFERRED_SKILLS.TRANSLATION;

  lessonCreationSkills =
    AppConstants.VOLUNTEER_PREFERRED_SKILLS.LESSON_CREATION;

  screenType!: 'desktop' | 'tablet' | 'mobile' | 'smallMobile';
  activeTabGroupIndex = 0;
  tabGroups = {
    desktop: [[0, 1, 2, 3, 4]],
    tablet: [
      [0, 1, 2],
      [3, 4],
    ],
    mobile: [[0, 1], [2, 3], [4]],
    smallMobile: [[0], [1], [2], [3], [4]],
  };
  selectedIndex = 0;

  constructor(
    private pageTitleService: PageTitleService,
    private urlInterpolationService: UrlInterpolationService,
    private ngbCarouselConfig: NgbCarouselConfig,
    private translateService: TranslateService,
    private windowDimensionsService: WindowDimensionsService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private siteAnalyticsService: SiteAnalyticsService
  ) {}

  getWebpExtendedName(fileName: string): string {
    return fileName.replace(/\.\w+$/g, '.webp');
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_VOLUNTEER_PAGE_TITLE'
    );
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );

    this.setScreenType();
    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(() => {
        this.setScreenType();
      })
    );

    this.bannerImgPath = '/volunteer/banner.webp';
    this.footerImgPath = '/volunteer/footer.webp';

    this.art = {
      images: [
        '/volunteer/profile_images/mark.jpg',
        '/volunteer/profile_images/liwei.jpg',
        '/volunteer/profile_images/pearl.jpg',
        '/volunteer/profile_images/molly.jpg',
      ],
      caption: [
        {
          content:
            'I contribute to Oppia because of its remarkable goal:' +
            ' to make a quality education available to those who may not' +
            ' have easy access to it.',
          name: 'Mark Halpin',
          type: 'Artist',
        },
        {
          content:
            'I joined Oppia driven by a deep passion for education. ' +
            'With over five years of experience in edtech, I am committed to ' +
            'leveraging technology to enhance and enrich the learning ' +
            'experience, making education accessible and engaging for all.',
          name: 'Liwei Zhang',
          type: 'Design team',
        },
        {
          content:
            'Oppia is able to give education to those who need it, ' +
            'nd knowing that the art we create helps learners  ' +
            'means the world to me.',
          name: 'Pearl Nunag',
          type: 'Graphics team',
        },
        {
          content:
            "At Oppia, not only do I work with great people, but I'm able " +
            'to contribute to their mission of bringing free, ' +
            'quality education to everyone.',
          name: 'Molly Rhodes',
          type: 'Graphics team',
        },
      ],
    };

    this.software = {
      images: [
        '/volunteer/profile_images/akshay.jpg',
        '/volunteer/profile_images/kevin-thomas.jpg',
        '/volunteer/profile_images/jay.jpg',
      ],
      caption: [
        {
          content:
            'As I got involved with Oppia, I became more and more ' +
            'invested in the ideals of it, which is to provide an ' +
            'easy to use learning platform in which anyone can share ' +
            'their knowledge about a subject to the world.',
          name: 'Akshay Anand',
          type: 'Full-Stack Developer',
        },
        {
          content:
            'Making quality education accessible and fun to ' +
            'experience is something that is important to me. ' +
            'I enjoy contributing to Oppia because it does exactly this.',
          name: 'Kevin Thomas',
          type: 'Full-Stack Developer',
        },
        {
          content:
            'I believe education is the route to social upliftment ' +
            'and progress. At Oppia, I get to be a part of this' +
            'movement to provide free and accessible education for all.',
          name: 'Jay Vivarekar',
          type: 'Web Developer',
        },
      ],
    };

    this.outreach = {
      images: [
        '/volunteer/profile_images/yiga.jpg',
        '/volunteer/profile_images/jennifer.jpg',
        '/volunteer/profile_images/erio.jpg',
        '/volunteer/profile_images/diana.jpg',
      ],
      caption: [
        {
          content:
            'I contribute to Oppia because I believe in its cause. ' +
            'Every child can do well at math if they’re taught in the right ' +
            'way and it is broken down in a language they understand. Also, ' +
            'no matter how good a product is, people will not know it ' +
            'without effective marketing.',
          name: 'Yiga Ikpae',
          type: 'Marketing team',
        },
        {
          content:
            "Oppia's mission and values inspire me daily. I volunteer " +
            'because everyone deserves an education and helping to market ' +
            'this opportunity is a privilege',
          name: 'Jennifer Nunez',
          type: 'Marketing team',
        },
        {
          content:
            'I love to tell stories through content creation. This not only ' +
            "amplifies Oppia's mission of providing free accessible " +
            'education but also fosters a sense of community and inspiration, ' +
            "encouraging more individuals to engage with Oppia's " +
            'educational resources.',
          name: 'Erio Crucecia',
          type: 'Video creation team',
        },
        {
          content:
            'I contribute to Oppia because seeing the community ' +
            'and the impact it creates makes me hopeful for the future of ' +
            'education, and I want to be a part of that change.',
          name: 'Diana Chen',
          type: 'Product Manager',
        },
      ],
    };

    this.lessonCreation = {
      images: [
        '/volunteer/profile_images/aanuoluwapo.jpg',
        '/volunteer/profile_images/viksar.jpg',
        '/volunteer/profile_images/jackson.jpg',
        '/volunteer/profile_images/abha.jpg',
      ],
      caption: [
        {
          content:
            'At Oppia, my love for writing stories as a ' +
            'creative intertwines with my passion for ' +
            'education.',
          name: 'Aanuoluwapo Adeoti',
          type: 'Lessons team',
        },
        {
          content:
            'Contributing to Oppia has been incredibly rewarding. ' +
            "I've always loved helping others, so being able to use " +
            'such a great platform to provide quality education to ' +
            'those in need is truly fulfilling.',
          name: 'Viksar Dubey',
          type: 'Practice questions team',
        },
        {
          content:
            'I feel so grateful to help children gain access to ' +
            'educational resources. I feel proud when I contribute, ' +
            'and excited when my team makes progress.',
          name: 'Christopher Jackson Felton',
          type: 'Lessons team',
        },
        {
          content:
            'Oppia has provided a platform, through which I can share my ' +
            'love of Maths with dedicated learners, around the world. I ' +
            'contribute to Oppia because it helps students learn important ' +
            'concepts in a fun and interactive way.',
          name: 'Abha Barge',
          type: 'Lessons team',
        },
      ],
    };

    this.translation = {
      images: [
        '/volunteer/profile_images/giovana.jpg',
        '/volunteer/profile_images/kanupriya.jpg',
        '/volunteer/profile_images/vanessa.jpg',
        '/volunteer/profile_images/pretty.jpg',
        '/volunteer/profile_images/anubhuti.jpg',
      ],
      caption: [
        {
          content:
            'I was always told that quality education is only for those who ' +
            'are privileged. But by volunteering at Oppia, I prove every day ' +
            'that a decent education is for everyone and I feel grateful to ' +
            'be able to help thousands of people worldwide on this journey.',
          name: 'Giovana Alonso',
          type: 'Brazilian Portuguese Translator',
        },
        {
          content:
            'Being a part of this magical world of online learning and ' +
            'volunteering at Oppia makes me believe that when you give the ' +
            'gift of education, you are giving happiness and smiles on ' +
            'faces, and that is the biggest gift…and YES, as a volunteer I ' +
            'am playing my part and helping kids all over the world.',
          name: 'Kanupriya Gupta',
          type: 'Hindi Translator',
        },
        {
          content:
            'Every small voluntary effort, when done with love and ' +
            "dedication, can achieve incredible results, and that's what " +
            "I'm doing at Oppia, hoping to achieve more results and help " +
            'accomplish what many say is impossible. Alone we are nothing, ' +
            'but together we change the world.',
          name: 'Vanessa Gelinski',
          type: 'Brazilian Portuguese Translator',
        },
        {
          content:
            'Empowering learners with knowledge is not just a task; for me, ' +
            "it's a passion. Contributing to Oppia affords to extend this " +
            'impact to the lives of many more children, and I am' +
            'truly grateful for the privilege.',
          name: 'Pretty Agu',
          type: 'Translations coordinator',
        },
        {
          content:
            'Volunteering with Oppia gives me immense ' +
            'satisfaction because it aligns with a tenet ' +
            'I firmly believe in: everyone should have access to basic ' +
            "education. I'm glad to be a part of the organization!",
          name: 'Anubhuti Varshney',
          type: 'Translations/Voiceovers Coordinator',
        },
      ],
    };

    this.ngbCarouselConfig.interval = 10000;
    this.ngbCarouselConfig.keyboard = true;
    this.ngbCarouselConfig.pauseOnHover = true;
    this.ngbCarouselConfig.pauseOnFocus = true;
    this.registerFirstTimePageViewEvent();
  }

  setScreenType(): void {
    const width = this.windowDimensionsService.getWidth();
    if (width < 440) {
      this.screenType = 'smallMobile';
    } else if (width < 641) {
      this.screenType = 'mobile';
    } else if (width < 769) {
      this.screenType = 'tablet';
    } else {
      this.screenType = 'desktop';
    }
    this.activeTabGroupIndex = 0;
  }

  incrementTabGroupIndex(): void {
    if (
      this.activeTabGroupIndex !==
      this.tabGroups[this.screenType].length - 1
    ) {
      this.activeTabGroupIndex++;
    }
  }

  decrementTabGroupIndex(): void {
    if (this.activeTabGroupIndex !== 0) {
      this.activeTabGroupIndex--;
    }
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  onClickVolunteerCTAButtonAtTop(): void {
    this.siteAnalyticsService.registerClickVolunteerCTAButtonEvent(
      'CTA button at the top of the Volunteer page'
    );
  }

  onClickVolunteerCTAButtonAtBottom(): void {
    this.siteAnalyticsService.registerClickVolunteerCTAButtonEvent(
      'CTA button at the bottom of the Volunteer page'
    );
  }

  registerFirstTimePageViewEvent(): void {
    this.siteAnalyticsService.registerFirstTimePageViewEvent(
      AppConstants.LAST_PAGE_VIEW_TIME_LOCAL_STORAGE_KEYS_FOR_GA.VOLUNTEER
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
