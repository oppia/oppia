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
 * @fileoverview Component for refresher exploration confirmation modal.
 */

import {Component, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ExplorationEngineService} from '../services/exploration-engine.service';

@Component({
  selector: 'oppia-refresher-confirmation-modal',
  templateUrl: './refresher-exploration-confirmation-modal.component.html',
})
export class RefresherExplorationConfirmationModal extends ConfirmOrCancelModal {
  confirmRedirectEventEmitter: EventEmitter<void> = new EventEmitter();
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  refresherExplorationId!: string;
  constructor(
    private ngbActiveModal: NgbActiveModal,
    private windowRef: WindowRef,
    private explorationEngineService: ExplorationEngineService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService
  ) {
    super(ngbActiveModal);
  }

  confirmRedirect(): void {
    this.confirmRedirectEventEmitter.emit();

    let collectionId: string = this.urlService.getUrlParams().collection_id;
    let parentIdList: string[] =
      this.urlService.getQueryFieldValuesAsList('parent');
    let EXPLORATION_URL_TEMPLATE: string = '/explore/<exploration_id>';
    let url = this.urlInterpolationService.interpolateUrl(
      EXPLORATION_URL_TEMPLATE,
      {
        exploration_id: this.refresherExplorationId,
      }
    );

    if (collectionId) {
      url = this.urlService.addField(url, 'collection_id', collectionId);
    }

    for (let i = 0; i < parentIdList.length; i++) {
      url = this.urlService.addField(url, 'parent', parentIdList[i]);
    }
    url = this.urlService.addField(
      url,
      'parent',
      this.explorationEngineService.getExplorationId()
    );

    // Wait a little before redirecting the page to ensure other
    // tasks started here (e.g. event recording) have sufficient
    // time to complete.
    // TODO(#20446): Find a reliable way to send events that
    // does not get interrupted with browser redirection.
    setTimeout(() => {
      this.windowRef.nativeWindow.open(url, '_self');
    }, 150);

    // Close the dialog to ensure the confirmation cannot be
    // called multiple times.
    this.ngbActiveModal.close();
  }
}
