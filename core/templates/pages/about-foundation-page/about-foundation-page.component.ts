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

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { PageTitleService } from 'services/page-title.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';


@Component({
  selector: 'about-foundation-page',
  templateUrl: './about-foundation-page.component.html',
  styleUrls: []
})
export class AboutFoundationPageComponent implements OnInit {
  constructor(
    private pageTitleService: PageTitleService,
    private urlInterpolationService: UrlInterpolationService,
  ) {}
  ngOnInit(): void {
    this.pageTitleService.setDocumentTitle(
      'About the Oppia Foundation | Oppia'
    );
  }
}

angular.module('oppia').directive(
  'aboutFoundationPage',
  downgradeComponent({component: AboutFoundationPageComponent}));
