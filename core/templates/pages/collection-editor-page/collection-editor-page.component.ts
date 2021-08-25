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
 * @fileoverview Primary component for the collection editor page.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import { UrlService } from 'services/contextual/url.service';
import { PageTitleService } from 'services/page-title.service';
import { CollectionEditorRoutingService } from './services/collection-editor-routing.service';
import { CollectionEditorStateService } from './services/collection-editor-state.service';

@Component({
  selector: 'oppia-collection-editor-page',
  templateUrl: './collection-editor-page.component.html'
})
export class CollectionEditorPageComponent {
  directiveSubscriptions = new Subscription();

  constructor(
    private collectionEditorRoutingService: CollectionEditorRoutingService,
    private collectionEditorStateService: CollectionEditorStateService,
    private pageTitleService: PageTitleService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.collectionEditorStateService.onCollectionInitialized.subscribe(
        () => this.setTitle()
      )
    );
    // Load the collection to be edited.
    this.collectionEditorStateService.loadCollection(
      this.urlService.getCollectionIdFromEditorUrl());
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  setTitle(): void {
    var title = (
      this.collectionEditorStateService.getCollection().getTitle());
    if (title) {
      this.pageTitleService.setPageTitle(title + ' - Oppia Editor');
    } else {
      this.pageTitleService.setPageTitle(
        'Untitled Collection - Oppia Editor');
    }
  }

  getActiveTabName(): string {
    return this.collectionEditorRoutingService.getActiveTabName();
  }
}

angular.module('oppia').directive('oppiaCollectionEditorPage',
  downgradeComponent({
    component: CollectionEditorPageComponent
  }) as angular.IDirectiveFactory);
