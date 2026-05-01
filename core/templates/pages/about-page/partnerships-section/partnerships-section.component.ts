// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the partnerships section on the About page.
 */

import {Component, Input} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

import './partnerships-section.component.css';
import {AboutPartnerData} from '../data.model';

@Component({
  selector: 'oppia-about-partnerships-section',
  templateUrl: './partnerships-section.component.html',
  styleUrls: ['./partnerships-section.component.css'],
})
export class PartnershipsSectionComponent {
  @Input() partnersData: AboutPartnerData[] = [];

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
}
