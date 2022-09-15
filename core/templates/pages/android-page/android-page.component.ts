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
 * @fileoverview Component for the about foundation page.
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { PageTitleService } from 'services/page-title.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';


@Component({
  selector: 'android-page',
  templateUrl: './android-page.component.html',
  styleUrls: []
})
export class AndroidPageComponent implements OnInit, OnDestroy {
  @ViewChild('feature1') featureRef1: ElementRef<Element>;
  @ViewChild('feature2') featureRef2: ElementRef<Element>;
  @ViewChild('feature3') featureRef3: ElementRef<Element>;
  @ViewChild('feature4') featureRef4: ElementRef<Element>;

  featuresShown = 0;

  directiveSubscriptions = new Subscription();
  constructor(
    private pageTitleService: PageTitleService,
    private urlInterpolationService: UrlInterpolationService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  ngAfterViewInit(): void {
    this.setPageTitle();
    const featuresSectionObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && this.featuresShown < 4) {
        this.featuresShown++;
      }
    });
    featuresSectionObserver.observe(this.featureRef1.nativeElement);
    featuresSectionObserver.observe(this.featureRef2.nativeElement);
    featuresSectionObserver.observe(this.featureRef3.nativeElement);
    featuresSectionObserver.observe(this.featureRef4.nativeElement);
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_ABOUT_FOUNDATION_PAGE_TITLE');
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'androidPage',
  downgradeComponent({component: AndroidPageComponent}));
