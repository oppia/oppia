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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { Subscription } from 'rxjs';

import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { UrlService } from 'services/contextual/url.service';

@Component({
  selector: 'collection-navbar',
  templateUrl: './collection-navbar.component.html',
  styleUrls: [],
})
export class CollectionNavbarComponent implements OnInit, OnDestroy {
  collectionTitle: string = '';
  directiveSubscriptions = new Subscription();

  constructor(
    private urlService: UrlService,
    private readOnlyCollectionBackendApiService:
      ReadOnlyCollectionBackendApiService
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.readOnlyCollectionBackendApiService.onCollectionLoad.subscribe(
        () => {
          let title = (
            this.readOnlyCollectionBackendApiService.getCollectionDetails(
              this.urlService.getCollectionIdFromUrl()).title);
          if (title === null) {
            throw new Error('Collection title is null');
          }
          this.collectionTitle = title;
        }
      )
    );
  }

  ngOnDestroy(): void {
    return this.directiveSubscriptions.unsubscribe();
  }
}
angular.module('oppia').directive('collectionNavbar', downgradeComponent(
  {component: CollectionNavbarComponent}));
