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
 * @fileoverview Maintenance page root component.
 */

import {AfterViewInit, Component, OnInit} from '@angular/core';
import {markAngularContentReady} from 'pages/oppia-root/bootstrap-module';
import {PageHeadService} from 'services/page-head.service';

const DESCRIPTION =
  'Oppia is currently undergoing scheduled maintenance. ' +
  'Please check back later.';

export const MAINTENANCE_PAGE_TITLE = 'Oppia Maintenance Page';
export const MAINTENANCE_PAGE_META = [
  {
    PROPERTY_TYPE: 'itemprop',
    PROPERTY_VALUE: 'description',
    CONTENT: DESCRIPTION,
  },
  {
    PROPERTY_TYPE: 'property',
    PROPERTY_VALUE: 'og:description',
    CONTENT: DESCRIPTION,
  },
] as const;

@Component({
  selector: 'oppia-maintenance-page-root',
  templateUrl: './maintenance-page-root.component.html',
})
export class MaintenancePageRootComponent implements OnInit, AfterViewInit {
  constructor(private pageHeadService: PageHeadService) {}

  ngOnInit(): void {
    // The maintenance page is always English and its title is not translated,
    // so the lightweight bootstrap does not need the translation loader.
    this.pageHeadService.updateTitleAndMetaTags(
      MAINTENANCE_PAGE_TITLE,
      MAINTENANCE_PAGE_META
    );
  }

  ngAfterViewInit(): void {
    // The child page view is laid out by this point, so revealing it cannot
    // create a layout shift against the prerendered markup.
    markAngularContentReady();
  }
}
