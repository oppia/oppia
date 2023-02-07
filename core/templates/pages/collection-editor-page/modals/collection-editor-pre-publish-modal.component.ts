// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for collection editor pre publish modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { CollectionUpdateService } from 'domain/collection/collection-update.service';
import { Collection } from 'domain/collection/collection.model';
import { AlertsService } from 'services/alerts.service';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';

@Component({
  selector: 'oppia-collection-editor-pre-publish-modal',
  templateUrl: './collection-editor-pre-publish-modal.component.html'
})
export class CollectionEditorPrePublishModalComponent
  extends ConfirmOrCancelModal {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _collection!: Collection;
  // Below properties are null for default collection.
  newTitle!: string | null;
  newObjective!: string | null;
  newCategory!: string | null;
  requireTitleToBeSpecified: boolean = false;
  requireObjectiveToBeSpecified: boolean = false;
  requireCategoryToBeSpecified: boolean = false;
  CATEGORY_LIST = AppConstants.ALL_CATEGORIES;

  constructor(
    private alertsService: AlertsService,
    private collectionEditorStateService: CollectionEditorStateService,
    private collectionUpdateService: CollectionUpdateService,
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this._collection = this.collectionEditorStateService.getCollection();
    this.requireTitleToBeSpecified = !this._collection.getTitle();
    this.requireObjectiveToBeSpecified = !this._collection.getObjective();
    this.requireCategoryToBeSpecified = !this._collection.getCategory();

    this.newTitle = this._collection.getTitle();
    this.newObjective = this._collection.getObjective();
    this.newCategory = this._collection.getCategory();
  }

  isSavingAllowed(): boolean {
    return Boolean(this.newTitle && this.newObjective && this.newCategory);
  }

  save(): void {
    if (!this.newTitle) {
      this.alertsService.addWarning('Please specify a title');
      return;
    }
    if (!this.newObjective) {
      this.alertsService.addWarning('Please specify an objective');
      return;
    }
    if (!this.newCategory) {
      this.alertsService.addWarning('Please specify a category');
      return;
    }

    // Record any fields that have changed.
    var metadataList = [];
    if (this.newTitle !== this._collection.getTitle()) {
      metadataList.push('title');
      this.collectionUpdateService.setCollectionTitle(
        this._collection, this.newTitle);
    }
    if (this.newObjective !== this._collection.getObjective()) {
      metadataList.push('objective');
      this.collectionUpdateService.setCollectionObjective(
        this._collection, this.newObjective);
    }
    if (this.newCategory !== this._collection.getCategory()) {
      metadataList.push('category');
      this.collectionUpdateService.setCollectionCategory(
        this._collection, this.newCategory);
    }

    this.ngbActiveModal.close(metadataList);
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }
}
