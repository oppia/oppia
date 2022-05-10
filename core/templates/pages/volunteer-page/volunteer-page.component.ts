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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

import { PageTitleService } from 'services/page-title.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';


@Component({
  selector: 'volunteer-page',
  templateUrl: './volunteer-page.component.html',
  styleUrls: [],
  encapsulation: ViewEncapsulation.None,
  providers: [NgbCarouselConfig]
})
export class VolunteerPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  mapImgPath = '';
  art = {};
  development = {};
  learnerFeedback = {};
  lessonCreation = {};

  constructor(
    private pageTitleService: PageTitleService,
    private urlInterpolationService: UrlInterpolationService,
    private ngbCarouselConfig: NgbCarouselConfig,
    private translateService: TranslateService
  ) {}

  getWebpExtendedName(fileName: string): string {
    return fileName.replace(/\.\w+$/g, '.webp');
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_VOLUNTEER_PAGE_TITLE');
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
    this.mapImgPath = '/volunteer/map.png';

    this.art = {
      images: [
        '/volunteer/profile_images/mark.jpg',
        '/volunteer/profile_images/tuna.jpg',
      ],
      caption: [
        {
          content: (
            '“I contribute to Oppia because of its remarkable goal:' +
            ' to make a quality education available to those who may not' +
            ' have easy access to it.“'),
          name: '- Mark Halpin',
          type: 'Artist'
        },
        {
          content: (
            '“Oppia turns my drawings into little seeds' +
            ' for the better world.“'),
          name: '- Tuna R. Terzi',
          type: 'Artist'
        }
      ]
    };

    this.development = {
      images: [
        '/volunteer/profile_images/akshay.jpg',
        '/volunteer/profile_images/diana.jpg',
        '/volunteer/profile_images/kevin-thomas.jpg',
        '/volunteer/profile_images/nithesh.jpg',
      ],
      caption: [
        {
          content: (
            '“As I got involved with Oppia, I became more and more ' +
            'invested in the ideals of it, which is to provide an ' +
            'easy to use learning platform in which anyone can share ' +
            'their knowledge about a subject to the world.“'),
          name: '- Akshay Anand',
          type: 'Full-Stack Developer'
        },
        {
          content: (
            '“I contribute to Oppia because seeing the community ' +
            'and the impact it creates makes me hopeful for the future of ' +
            'education, and I want to be a part of that change.“'),
          name: '- Diana Chen',
          type: 'Product Manager'
        },
        {
          content: (
            '“Making quality education accessible and fun to ' +
            'experience is something that is important to me. ' +
            'I enjoy contributing to Oppia because it does exactly this.“'),
          name: '- Kevin Thomas',
          type: 'Full-Stack Developer'
        },
        {
          content: (
            '“The lessons are interesting, informative and ' +
            'gripping for students. Being able to build tools to efficiently ' +
            'create such lessons is what I enjoy.“'),
          name: '- Nithesh Hariharan',
          type: 'Full-Stack Developer and QA Lead'
        }
      ]
    };

    this.learnerFeedback = {
      images: [
        '/volunteer/profile_images/riya.png',
        '/volunteer/profile_images/wala.jpg',
      ],
      caption: [
        {
          content: (
            '“Oppia has given me the opportunity to profoundly ' +
            'impact the lives of many underprivileged children by ' +
            'providing them with free quality education. ' +
            'I am grateful to be a part of this venture.“'),
          name: '- Riya Sogani',
          type: 'Learner Feedback Program Volunteer, India'
        },
        {
          content: (
            '“Oppia has given me the chance to feel that I am ' +
            'causing a positive ripple effect around me. ' +
            'It is delightful to see underprivileged children\'s lives ' +
            'improving because of Oppia\'s lessons. ' +
            'These lessons taught them more than just mathematics in joyful ' +
            'ways: they enhanced their confidence, technical skills, and ' +
            'reading and writing skills!“'),
          name: '- Wala Awad',
          type: 'Learner Feedback Program Volunteer, Palestine'
        }
      ]
    };

    this.lessonCreation = {
      images: [
        '/volunteer/profile_images/anubhuti.jpg',
        '/volunteer/profile_images/anmol.jpg',
        '/volunteer/profile_images/nitya.jpg',
      ],
      caption: [
        {
          content: (
            '“Volunteering with Oppia gives me immense ' +
            'satisfaction because it aligns with a tenet ' +
            'I firmly believe in: everyone should have access to basic ' +
            'education. I\'m glad to be a part of the organization!“'),
          name: '- Anubhuti Varshney',
          type: 'Translations/Voiceovers Coordinator'
        },
        {
          content: (
            '“I strongly identify with Oppia\'s objective of ' +
            'providing free, enjoyable and accessible education to all.“'),
          name: '- Anmol Shukla',
          type: 'Developer and Lesson Creator'
        },
        {
          content: (
            '“I love to write, and volunteering with Oppia as a ' +
            'lesson creator has enabled me to apply my writing ' +
            'skills towards a good cause. Every child should have access ' +
            'to quality educational topics and, with Oppia, ' +
            'I have the opportunity to make a difference.“'),
          name: '- Nitya Sunkad',
          type: 'Math Lesson Creator'
        }
      ]
    };

    this.ngbCarouselConfig.interval = 10000;
    this.ngbCarouselConfig.keyboard = true;
    this.ngbCarouselConfig.pauseOnHover = true;
    this.ngbCarouselConfig.pauseOnFocus = true;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
