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
 * @fileoverview Component for the error 404 page.
 */

import { Component, OnInit } from '@angular/core';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { PageTitleService } from 'services/page-title.service';

@Component({
  selector: 'oppia-error-404-page',
  templateUrl: './error-404-page.component.html',
  styleUrls: []
})
export class Error404PageComponent implements OnInit {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private pageTitleService: PageTitleService) {}

  ngOnInit(): void {
    this.pageTitleService.setPageTitle('Error 404 - Oppia');
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}
