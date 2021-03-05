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
 * @fileoverview Controller for refresher exploration confirmation modal.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'refresher-exploration-confirmation-modal',
  templateUrl: './refresher-exploration-confirmation-modal.component.html'
})
export class RefresherExplorationConfirmationModalComponent {
  @Input() redirectConfirmationCallback: () => void;
  @Input() refresherExplorationId: string;
  constructor(
      private ngbActiveModal: NgbActiveModal,
      private window: WindowRef,
      private urlInterpolationService: UrlInterpolationService,
      private urlService: UrlService
  ) { }

  confirmRedirect(): void {
    this.redirectConfirmationCallback();

    let collectionId = this.urlService.getUrlParams().collection_id;
    let parentIdList = this.urlService.getQueryFieldValuesAsList(
      'parent');
    let EXPLORATION_URL_TEMPLATE = '/explore/<exploration_id>';
    let url = this.urlInterpolationService.interpolateUrl(
      EXPLORATION_URL_TEMPLATE, {
        exploration_id: this.refresherExplorationId
      });
    if (collectionId) {
      url = this.urlService.addField(
        url, 'collection_id', collectionId);
    }
    for (var i = 0; i < parentIdList.length; i++) {
      url = this.urlService.addField(url, 'parent', parentIdList[i]);
    }
    // Url = this.urlService.addField(
    //   url, 'parent', ExplorationEngineService.getExplorationId());

    // Wait a little before redirecting the page to ensure other
    // tasks started here (e.g. event recording) have sufficient
    // time to complete.
    // TODO(bhenning): Find a reliable way to send events that
    // does not get interrupted with browser redirection.
    // $timeout(function() {
    //   $window.open(url, '_self');
    // }, 150);
    setTimeout(() => {
      this.window._window().open(url, '_self');
    }, 150);

    // Close the dialog to ensure the confirmation cannot be
    // called multiple times.
    this.ngbActiveModal.close();
  }
}

angular.module('oppia')
  .directive(
    'refresherExplorationConfirmationModal',
    downgradeComponent({
      component: RefresherExplorationConfirmationModalComponent
    }));
