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
 * @fileoverview Component for landing page.
 */

require('base-components/base-content.component.ts');

import {Component, OnInit, OnDestroy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicLandingPageConstants} from 'pages/landing-pages/topic-landing-page/topic-landing-page.constants';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {PageTitleService} from 'services/page-title.service';

type TopicLandingPageDataKey =
  keyof typeof TopicLandingPageConstants.TOPIC_LANDING_PAGE_DATA;

type TopicLandingPageMathDataKey =
  keyof typeof TopicLandingPageConstants.TOPIC_LANDING_PAGE_DATA.math;

interface LessonsQuality {
  title: string;
  description: string;
  imagePngFilename: string;
  imageWebpFilename: string;
  imageAlt: string;
}

interface TopicData {
  topicTitle: string;
  topicTagline: string;
  collectionId: string;
  chapters: readonly string[];
}

@Component({
  selector: 'topic-landing-page',
  templateUrl: './topic-landing-page.component.html',
  styleUrls: [],
})
export class TopicLandingPageComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  backgroundBannerUrl!: string;
  lessonInDevicesPngImageSrc!: string;
  lessonInDevicesWebpImageSrc!: string;
  lessonsQualities!: LessonsQuality[];
  topicData!: TopicData;
  topicTitle!: string;
  directiveSubscriptions = new Subscription();

  constructor(
    private pageTitleService: PageTitleService,
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private urlService: UrlService,
    private translateService: TranslateService
  ) {}

  getLessonQualities(): LessonsQuality[] {
    return [
      {
        title: 'Fun storytelling',
        description:
          "Oppia's lessons tell stories using video and images to " +
          'help learners apply math concepts in everyday life.',
        imagePngFilename: 'fun_storytelling.png',
        imageWebpFilename: 'fun_storytelling.webp',
        imageAlt: 'Storytelling lessons presentation.',
      },
      {
        title: 'Accessible lessons',
        description:
          'Our lessons come with audio translations in different ' +
          "languages, can be used on mobile phones, and don't require a " +
          'lot of data so that they can be used and enjoyed by anyone, ' +
          'anywhere.',
        imagePngFilename: 'accessible_lessons.png',
        imageWebpFilename: 'accessible_lessons.webp',
        imageAlt: 'Lesson accessibility presentation.',
      },
      {
        title: 'Suitable for all',
        description:
          "No matter your level, there's a lesson for you! From learning " +
          this.topicData.chapters[0].toLowerCase() +
          ', to ' +
          this.topicData.chapters[1].toLowerCase() +
          ' - Oppia has you covered.',
        imagePngFilename: 'suitable_for_all.png',
        imageWebpFilename: 'suitable_for_all.webp',
        imageAlt: 'Lesson viewers and learners.',
      },
    ];
  }

  ngOnInit(): void {
    let pathArray = this.windowRef.nativeWindow.location.pathname.split('/');
    let subjectName = pathArray[1];
    let topicName = pathArray[2];

    this.topicData =
      TopicLandingPageConstants.TOPIC_LANDING_PAGE_DATA[
        subjectName as TopicLandingPageDataKey
      ][topicName as TopicLandingPageMathDataKey];
    this.topicTitle = this.topicData.topicTitle;

    this.lessonsQualities = this.getLessonQualities();
    this.backgroundBannerUrl = this.urlInterpolationService.getStaticImageUrl(
      '/background/bannerB.svg'
    );

    let topicImageUrlTemplate = '/landing/<subject>/<topic>/<filename>';
    this.lessonInDevicesPngImageSrc =
      this.urlInterpolationService.getStaticImageUrl(
        this.urlInterpolationService.interpolateUrl(topicImageUrlTemplate, {
          subject: subjectName,
          topic: topicName,
          filename: 'lesson_in_devices.png',
        })
      );
    this.lessonInDevicesWebpImageSrc =
      this.urlInterpolationService.getStaticImageUrl(
        this.urlInterpolationService.interpolateUrl(topicImageUrlTemplate, {
          subject: subjectName,
          topic: topicName,
          filename: 'lesson_in_devices.webp',
        })
      );
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  getLessonQualityImageSrc(filename: string): string {
    return this.urlInterpolationService.getStaticImageUrl(
      this.urlInterpolationService.interpolateUrl('/landing/<filename>', {
        filename: filename,
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_TOPIC_LANDING_PAGE_TITLE',
      {
        topicTitle: this.topicTitle,
        topicTagline: this.topicData.topicTagline,
      }
    );
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  onClickGetStartedButton(): void {
    let collectionId = this.topicData.collectionId;
    this.siteAnalyticsService.registerOpenCollectionFromLandingPageEvent(
      collectionId
    );
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = `/learn${this.urlService.getPathname()}`;
    }, 150);
  }

  goToClassroom(): void {
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = '/learn';
    }, 150);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
