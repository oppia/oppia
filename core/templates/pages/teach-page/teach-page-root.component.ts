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
 * @fileoverview Root component for Teach Page.
 */

import { Component } from '@angular/core';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { PageTitleService } from 'services/page-title.service';

@Component({
  selector: 'oppia-teach-page-root',
  templateUrl: './teach-page-root.component.html'
})
export class TeachPageRootComponent {
  constructor(
    private pageTitleService: PageTitleService,
    private metaTagCustomizationService: MetaTagCustomizationService
  ) {}

  ngOnInit(): void {
    // Update default title and meta tags.
    this.pageTitleService.setPageTitle(
      'Guide to Oppia for Parents and Teachers | Oppia');
    this.metaTagCustomizationService.addOrReplaceMetaTags([
      {
        propertyType: 'name',
        propertyValue: 'description',
        content: 'The Oppia library is full of user-created lessons ' +
        'called \'explorations\'. Read about how to participate in the ' +
        'community and begin creating explorations.'
      }
    ]);
  }
}
