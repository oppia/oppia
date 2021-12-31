// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the exploration player page.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ContextService } from 'services/context.service';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { UrlService } from 'services/contextual/url.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { PageTitleService } from 'services/page-title.service';

require('interactions/interactionsRequires.ts');

@Component({
  selector: 'oppia-exploration-player-page',
  templateUrl: './exploration-player-page.component.html'
})
export class ExplorationPlayerPageComponent {
  pageIsIframed: boolean = false;

  constructor(
    private contextService: ContextService,
    private keyboardShortcutService: KeyboardShortcutService,
    private metaTagCustomizationService: MetaTagCustomizationService,
    private pageTitleService: PageTitleService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    let explorationId = this.contextService.getExplorationId();
    this.readOnlyExplorationBackendApiService.fetchExplorationAsync(
      explorationId, null
    ).then((response) => {
      this.pageTitleService.setDocumentTitle(
        response.exploration.title + ' - Oppia');
      this.metaTagCustomizationService.addOrReplaceMetaTags([
        {
          propertyType: 'itemprop',
          propertyValue: 'name',
          content: response.exploration.title
        },
        {
          propertyType: 'itemprop',
          propertyValue: 'description',
          content: response.exploration.objective
        },
        {
          propertyType: 'property',
          propertyValue: 'og:title',
          content: response.exploration.title
        },
        {
          propertyType: 'property',
          propertyValue: 'og:description',
          content: response.exploration.objective
        }
      ]);
    });

    this.pageIsIframed = this.urlService.isIframed();
    this.keyboardShortcutService.bindExplorationPlayerShortcuts();
  }
}

angular.module('oppia').directive('oppiaExplorationPlayerPage',
  downgradeComponent({
    component: ExplorationPlayerPageComponent
  }) as angular.IDirectiveFactory
);
