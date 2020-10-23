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
 * @fileoverview Component for the collection player navbar
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { UrlService } from 'services/contextual/url.service.ts';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service.ts';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'collection-navbar',
  templateUrl: './collection-navbar.component.html',
  styleUrls: [],
})
export class CollectionNavbarComponent implements OnInit, OnDestroy {
  collectionTitle: string = '';
  collectionId: string = '';
  directiveSubscriptions = new Subscription();

  constructor(
    private urlService: UrlService,
    private readOnlyCollectionService: ReadOnlyCollectionBackendApiService
  ) {}

  ngOnInit(): void {
    this.collectionId = this.urlService.getCollectionIdFromUrl();
    this.directiveSubscriptions.add(
      this.readOnlyCollectionService.onCollectionLoad.subscribe(() => {
        return (
          this.collectionTitle =
          this.readOnlyCollectionService.getCollectionDetails(
            this.urlService.getCollectionIdFromUrl()
          ).title);
      })
    );
  }

  ngOnDestroy(): void {
    return this.directiveSubscriptions.unsubscribe();
  }
}
angular
  .module('oppia')
  .directive(
    'collectionNavbar',
    downgradeComponent({ component: CollectionNavbarComponent })
  );
