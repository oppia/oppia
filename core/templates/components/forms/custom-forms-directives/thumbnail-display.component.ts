// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for thumbnail display.
 */

import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';

@Component({
  selector: 'oppia-svg-thumbnail-display',
  templateUrl: './thumbnail-display.component.html',
  styleUrls: []
})
export class ThumbnailDisplayComponent implements OnInit, OnChanges {
  constructor(
    private sanitizer: DomSanitizer,
    private svgSanitizerService: SvgSanitizerService) {}
  @Input() imgSrc: string;
  @Input() height: string;
  @Input() width: string;
  @Input() classes: string[];
  @Input() background: string;
  imageSource = null;

  ngOnInit(): void {
    this.checkSvgData();
  }

  /**
   * Check if the SVG data is valid or not.
   */
  checkSvgData(): void {
    // If the SVG image is passed as base64 data.
    if (this.imgSrc.indexOf('data:image/svg+xml;base64') !== -1) {
      const safeResoruceUrl = this.svgSanitizerService.getTrustedSvgResourceUrl(
        this.imgSrc);
      if (safeResoruceUrl === null) {
        this.imgSrc = null;
      } else {
        this.imageSource = safeResoruceUrl;
      }
    } else {
      this.imageSource = this.imgSrc;
    }
  }

  ngOnChanges(): void {
    this.checkSvgData();
  }
}

angular.module('oppia').directive(
  'oppiaSvgThumbnailDisplay', downgradeComponent(
    {component: ThumbnailDisplayComponent}));
