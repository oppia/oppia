// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Modal and functionality for the create collection button.
 */

import {Injectable} from '@angular/core';

import {AlertsService} from 'services/alerts.service';
import {CollectionCreationBackendService} from 'components/entity-creation-services/collection-creation-backend-api.service';
import {LoaderService} from 'services/loader.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root',
})
export class CollectionCreationService {
  // TODO(#9154): Remove static when migration is complete.
  static collectionCreationInProgress: boolean = false;

  constructor(
    private collectionCreationBackendService: CollectionCreationBackendService,
    private alertsService: AlertsService,
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private loaderService: LoaderService,
    private windowRef: WindowRef
  ) {}

  CREATE_NEW_COLLECTION_URL_TEMPLATE =
    '/collection_editor/create/<collection_id>';

  createNewCollection(): void {
    if (CollectionCreationService.collectionCreationInProgress) {
      return;
    }

    CollectionCreationService.collectionCreationInProgress = true;
    this.alertsService.clearWarnings();

    this.loaderService.showLoadingScreen('Creating collection');

    this.collectionCreationBackendService.createCollectionAsync().then(
      response => {
        this.siteAnalyticsService.registerCreateNewCollectionEvent(
          response.collectionId
        );

        setTimeout(() => {
          this.windowRef.nativeWindow.location.href =
            this.urlInterpolationService.interpolateUrl(
              this.CREATE_NEW_COLLECTION_URL_TEMPLATE,
              {
                collection_id: response.collectionId,
              }
            );
          CollectionCreationService.collectionCreationInProgress = false;
        }, 150);
      },
      () => {
        this.loaderService.hideLoadingScreen();
        CollectionCreationService.collectionCreationInProgress = false;
      }
    );
  }
}
