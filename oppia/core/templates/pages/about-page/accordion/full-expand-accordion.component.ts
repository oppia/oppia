// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the full expand accordion.
 */

import {Component, Input} from '@angular/core';
import './full-expand-accordion.component.css';
import {AccordionPanelData} from '../data.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

@Component({
  selector: 'oppia-full-expand-accordion',
  templateUrl: './full-expand-accordion.component.html',
  styleUrls: ['./full-expand-accordion.component.css'],
})
export class FullExpandAccordionComponent {
  /**
   * Whether the accordion should have the content height or 100% height.
   * @type {boolean}
   */
  @Input() dynamicHeight: boolean = false;
  /**
   * Custom classes for the list container.
   * @type {string[]}
   */
  @Input() listContainerCustomClasses: string[] = [];
  @Input() accordionData: AccordionPanelData[] = [];
  listIsCollapsed: boolean = false;
  panelIsCollapsed: boolean = true;
  activeIndex: number = 0;

  constructor(private urlInterpolationService: UrlInterpolationService) {}

  expandPanel(index: number): void {
    this.activeIndex = index;
    this.listIsCollapsed = true;
    this.panelIsCollapsed = false;
  }

  closePanel(): void {
    this.listIsCollapsed = false;
    this.panelIsCollapsed = true;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}
