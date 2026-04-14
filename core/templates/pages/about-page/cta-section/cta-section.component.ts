// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for the CTA section on the About page.
 */

import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgbCarousel} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

import './cta-section.component.css';

interface VolunteerRoleData {
  title: string;
  iconUrl: string;
  description: string;
  listItems: string[];
}

interface DonorStatementData {
  heading: string;
  subtext: string;
  customClass: string;
}

interface PartnerCtaBoxData {
  title: string;
  subtext: string;
  imagePath: string;
  imageAltTextI18nKey: string;
  imageClassName: string;
  buttonHrefDesktop: string;
  buttonHrefMobile: string;
  buttonDesktopTestClassName: string;
  buttonMobileTestClassName: string;
  buttonClickOutput: 'partner' | 'partnerLearnMore';
  buttonCustomClasses: string[];
  buttonText: string;
}

@Component({
  selector: 'oppia-about-cta-section',
  templateUrl: './cta-section.component.html',
  styleUrls: ['./cta-section.component.css'],
})
export class CtaSectionComponent {
  @Input() screenType!: 'desktop' | 'tablet' | 'mobile';
  @Input() volunteerFormLink: string = '';
  @Input() partnershipsFormLink: string = '';
  @Input() isLanguageRTL: boolean = false;

  @Output() donateButtonClicked = new EventEmitter<void>();
  @Output() volunteerButtonClicked = new EventEmitter<void>();
  @Output() volunteerLearnMoreClicked = new EventEmitter<void>();
  @Output() partnerButtonClicked = new EventEmitter<void>();
  @Output() partnerLearnMoreClicked = new EventEmitter<void>();

  @ViewChild('volunteerCarousel') volunteerCarousel!: NgbCarousel;
  @ViewChild('volunteerCarouselMobile') volunteerCarouselMobile!: NgbCarousel;

  // Volunteer CTA is the default tab.
  selectedTabIndex = 1;
  donorStatements: DonorStatementData[] = [
    {
      heading: 'I18N_ABOUT_PAGE_CTA_DONOR_STATEMENT_HEADING1',
      subtext: 'I18N_ABOUT_PAGE_CTA_DONOR_STATEMENT_SUBTEXT1',
      customClass: 'oppia-about-statement-type1',
    },
    {
      heading: 'I18N_ABOUT_PAGE_CTA_DONOR_STATEMENT_HEADING2',
      subtext: 'I18N_ABOUT_PAGE_CTA_DONOR_STATEMENT_SUBTEXT2',
      customClass: 'oppia-about-statement-type1',
    },
    {
      heading: 'I18N_ABOUT_PAGE_CTA_DONOR_STATEMENT_HEADING3',
      subtext: 'I18N_ABOUT_PAGE_CTA_DONOR_STATEMENT_SUBTEXT3',
      customClass: 'oppia-about-statement-type2',
    },
  ];
  volunteerRolesDetails: VolunteerRoleData[] = [
    {
      title: 'I18N_ABOUT_PAGE_CTA_OUTREACH_TITLE',
      iconUrl: '/icons/outreach-icon',
      description: 'I18N_ABOUT_PAGE_CTA_OUTREACH_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_OUTREACH_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_OUTREACH_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_OUTREACH_LIST_ITEM3',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_SOFTWARE_TITLE',
      iconUrl: '/icons/software-icon',
      description: 'I18N_ABOUT_PAGE_CTA_SOFTWARE_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_SOFTWARE_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_SOFTWARE_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_SOFTWARE_LIST_ITEM3',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_ART_TITLE',
      iconUrl: '/icons/art-icon',
      description: 'I18N_ABOUT_PAGE_CTA_ART_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_ART_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_ART_LIST_ITEM2',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_TRANSLATION_TITLE',
      iconUrl: '/icons/translation-icon',
      description: 'I18N_ABOUT_PAGE_CTA_TRANSLATION_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_TRANSLATION_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_TRANSLATION_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_TRANSLATION_LIST_ITEM3',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_LESSON_TITLE',
      iconUrl: '/icons/lesson-icon',
      description: 'I18N_ABOUT_PAGE_CTA_LESSON_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_LESSON_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_LESSON_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_LESSON_LIST_ITEM3',
      ],
    },
  ];
  volunteerRolesIndices = {
    desktop: [
      [0, 1, 2],
      [2, 3, 4],
    ],
    tablet: [
      [0, 1],
      [2, 3],
      [3, 4],
    ],
    mobile: [[0], [1], [2], [3], [4]],
  };
  partnerCtaBoxes: PartnerCtaBoxData[] = [
    {
      title: 'I18N_ABOUT_PAGE_CTA_PARTNER_OUR_PARTNERS',
      subtext: 'I18N_ABOUT_PAGE_CTA_PARTNER_OUR_PARTNERS_SUBTEXT',
      imagePath: '/about/partners',
      imageAltTextI18nKey: 'I18N_ABOUT_PAGE_PARTNERS_IMAGE_ALT',
      imageClassName: 'oppia-about-cta-partners-image',
      buttonHrefDesktop: '',
      buttonHrefMobile: '',
      buttonDesktopTestClassName: 'e2e-test-about-page-desktop-partner-button',
      buttonMobileTestClassName: 'e2e-test-about-page-mobile-partner-button',
      buttonClickOutput: 'partner',
      buttonCustomClasses: [
        'oppia-about-cta-button',
        'oppia-about-cta-subtext',
      ],
      buttonText: 'I18N_ABOUT_PAGE_CTA_PARTNER_BUTTON_TEXT',
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_PARTNER_SCHOOLS',
      subtext: 'I18N_ABOUT_PAGE_CTA_PARTNER_SCHOOLS_SUBTEXT',
      imagePath: '/about/schools',
      imageAltTextI18nKey: 'I18N_ABOUT_PAGE_SCHOOLS_IMAGE_ALT',
      imageClassName: 'oppia-about-cta-schools-image',
      buttonHrefDesktop: '/partnerships',
      buttonHrefMobile: '/partnerships',
      buttonDesktopTestClassName:
        'e2e-test-about-page-partner-learn-more-desktop-button',
      buttonMobileTestClassName:
        'e2e-test-about-page-partner-learn-more-mobile-button',
      buttonClickOutput: 'partnerLearnMore',
      buttonCustomClasses: [
        'oppia-about-cta-button',
        'oppia-about-secondary-button',
        'oppia-about-cta-subtext',
      ],
      buttonText: 'I18N_ABOUT_PAGE_LEARN_MORE',
    },
  ];

  constructor(private urlInterpolationService: UrlInterpolationService) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getImageSet(imagePrefix: string, imageExt: string, sizes: number[]): string {
    let imageSet = '';
    for (let i = 0; i < sizes.length; i++) {
      const sizeAfterRemovingPeriod = sizes[i].toString().replace('.', '');
      imageSet +=
        this.getStaticImageUrl(
          `${imagePrefix}${sizeAfterRemovingPeriod}x.${imageExt}`
        ) +
        ' ' +
        sizes[i] +
        'x';
      if (i < sizes.length - 1) {
        imageSet += ', ';
      }
    }
    return imageSet;
  }

  moveCarouselToPreviousSlide(): void {
    if (this.screenType === 'mobile') {
      this.volunteerCarouselMobile.prev();
    } else {
      this.volunteerCarousel.prev();
    }
  }

  moveCarouselToNextSlide(): void {
    if (this.screenType === 'mobile') {
      this.volunteerCarouselMobile.next();
    } else {
      this.volunteerCarousel.next();
    }
  }

  onPartnerBoxButtonClick(outputName: 'partner' | 'partnerLearnMore'): void {
    if (outputName === 'partner') {
      this.partnerButtonClicked.emit();
    } else {
      this.partnerLearnMoreClicked.emit();
    }
  }

  getPartnerButtonHref(box: PartnerCtaBoxData, mobile: boolean): string {
    if (box.buttonClickOutput === 'partner') {
      return this.partnershipsFormLink;
    }
    return mobile ? box.buttonHrefMobile : box.buttonHrefDesktop;
  }

  getPartnerButtonTestClass(box: PartnerCtaBoxData, mobile: boolean): string {
    return mobile
      ? box.buttonMobileTestClassName
      : box.buttonDesktopTestClassName;
  }

  getPartnerButtonClasses(box: PartnerCtaBoxData, mobile: boolean): string[] {
    return [
      ...box.buttonCustomClasses,
      this.getPartnerButtonTestClass(box, mobile),
    ];
  }
}
