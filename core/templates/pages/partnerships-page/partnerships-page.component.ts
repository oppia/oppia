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
 * @fileoverview Component for the partnerships page.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { PageTitleService } from 'services/page-title.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';


@Component({
  selector: 'partnerships-page',
  templateUrl: './partnerships-page.component.html',
  styleUrls: []
})
export class PartnershipsPageComponent implements OnInit {
  partnershipsImgUrl: string = '';
  formIconUrl: string = '';
  callIconUrl: string = '';
  changeIconUrl: string = '';

  constructor(
    private pageTitleService: PageTitleService,
    private urlInterpolationService: UrlInterpolationService,
  ) {}

  ngOnInit(): void {
    this.pageTitleService.setDocumentTitle('Partnerships | Oppia');
    this.partnershipsImgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/general/partnerships_hero_image.png');
    this.formIconUrl = this.urlInterpolationService.getStaticImageUrl(
      '/icons/icon_form.png');
    this.callIconUrl = this.urlInterpolationService.getStaticImageUrl(
      '/icons/icon_call.png');
    this.changeIconUrl = this.urlInterpolationService.getStaticImageUrl(
      '/icons/icon_change.png');
  }
}

angular.module('oppia').directive(
  'partnershipsPage',
  downgradeComponent({component: PartnershipsPageComponent}));
