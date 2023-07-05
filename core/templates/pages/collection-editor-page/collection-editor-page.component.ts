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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { UrlService } from 'services/contextual/url.service';
import { PageTitleService } from 'services/page-title.service';
import { CollectionEditorRoutingService } from './services/collection-editor-routing.service';
import { CollectionEditorStateService } from './services/collection-editor-state.service';

@Component({
  selector: 'oppia-collection-editor-page',
  templateUrl: './collection-editor-page.component.html'
})
export class CollectionEditorPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();

  constructor(
    private collectionEditorRoutingService: CollectionEditorRoutingService,
    private collectionEditorStateService: CollectionEditorStateService,
    private pageTitleService: PageTitleService,
    private urlService: UrlService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.collectionEditorStateService.onCollectionInitialized.subscribe(
        () => {
          // The onLangChange event is initially fired before the collection is
          // initialized. Hence the first setTitle() call needs to made
          // manually, and the onLangChange subscription is added after
          // the collection is initialized.
          this.setTitle();
          this.subscribeToOnLangChange();
        }
      )
    );
    // Load the collection to be edited.
    this.collectionEditorStateService.loadCollection(
      this.urlService.getCollectionIdFromEditorUrl());
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setTitle();
      })
    );
  }

  setTitle(): void {
    var title = (
      this.collectionEditorStateService.getCollection().getTitle());
    let translatedTitle: string;
    if (title) {
      translatedTitle = this.translateService.instant(
        'I18N_COLLECTION_EDITOR_PAGE_TITLE', {
          collectionTitle: title
        });
    } else {
      translatedTitle = this.translateService.instant(
        'I18N_COLLECTION_EDITOR_UNTITLED_COLLECTION_PAGE_TITLE');
    }
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  getActiveTabName(): string {
    return this.collectionEditorRoutingService.getActiveTabName();
  }
}

angular.module('oppia').directive('oppiaCollectionEditorPage',
  downgradeComponent({
    component: CollectionEditorPageComponent
  }) as angular.IDirectiveFactory);
