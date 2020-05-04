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
 * @fileoverview Controllers for the 'thanks' page.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';

@Component({
  selector: 'thanks-page',
  template: require('./thanks-page.component.html'),
  styleUrls: []
})
export class ThanksPageComponent implements OnInit {
  thanksImgUrl = '';
  constructor(private urlInterpolationService: UrlInterpolationService) {}
  ngOnInit() {
    this.thanksImgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/general/donate.png');
  }
}

angular.module('oppia').directive(
  'thanksPage', downgradeComponent({component: ThanksPageComponent}));
