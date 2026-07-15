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
 * @fileoverview Component for the navbar of the collection editor.
 */

import {Component} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {CollectionRightsBackendApiService} from 'domain/collection/collection-rights-backend-api.service';
import {CollectionRights} from 'domain/collection/collection-rights.model';
import {CollectionValidationService} from 'domain/collection/collection-validation.service';
import {Collection} from 'domain/collection/collection.model';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {Subscription} from 'rxjs';
import {UrlService} from 'services/contextual/url.service';
import {CollectionEditorRoutingService} from '../services/collection-editor-routing.service';
import {CollectionEditorStateService} from '../services/collection-editor-state.service';
import {CollectionEditorPrePublishModalComponent} from '../modals/collection-editor-pre-publish-modal.component';
import {CollectionEditorSaveModalComponent} from '../modals/collection-editor-save-modal.component';

@Component({
  selector: 'collection-editor-navbar',
  templateUrl: './collection-editor-navbar.component.html',
})
export class CollectionEditorNavbarComponent {
  directiveSubscriptions = new Subscription();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  collectionRights!: CollectionRights;
  validationIssues!: string[];
  collection!: Collection;
  collectionId!: string;
  editButtonHovering: boolean = false;
  playerButtonHovering: boolean = false;

  constructor(
    private ngbModal: NgbModal,
    private collectionEditorRoutingService: CollectionEditorRoutingService,
    private collectionEditorStateService: CollectionEditorStateService,
    private collectionRightsBackendApiService: CollectionRightsBackendApiService,
    private collectionValidationService: CollectionValidationService,
    private undoRedoService: UndoRedoService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.collectionEditorStateService.onCollectionInitialized.subscribe(() =>
        this._validateCollection()
      )
    );

    this.directiveSubscriptions.add(
      this.undoRedoService
        .getUndoRedoChangeEventEmitter()
        .subscribe(() => this._validateCollection())
    );

    this.collectionId = this.urlService.getCollectionIdFromEditorUrl();
    this.collection = this.collectionEditorStateService.getCollection();
    this.collectionRights =
      this.collectionEditorStateService.getCollectionRights();

    this.validationIssues = [];
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  onEditButtonHover(): void {
    this.editButtonHovering = !this.editButtonHovering;
  }

  onPlayerButtonHover(): void {
    this.playerButtonHovering = !this.playerButtonHovering;
  }

  private _validateCollection() {
    if (this.collectionRights.isPrivate()) {
      this.validationIssues =
        this.collectionValidationService.findValidationIssuesForPrivateCollection(
          this.collection
        );
    } else {
      this.validationIssues =
        this.collectionValidationService.findValidationIssuesForPrivateCollection(
          this.collection
        );
    }
  }

  private _makeCollectionPublic(): void {
    // TODO(bhenning): This also needs a confirmation of destructive
    // action since it is not reversible.
    this.collectionRightsBackendApiService
      .setCollectionPublicAsync(this.collectionId, this.collection.getVersion())
      .then(() => {
        this.collectionRights.setPublic();
        this.collectionEditorStateService.setCollectionRights(
          this.collectionRights
        );
      });
  }

  getWarningsCount(): number {
    return this.validationIssues.length;
  }

  getChangeListCount(): number {
    return this.undoRedoService.getChangeCount();
  }

  isCollectionSaveable(): boolean {
    return this.getChangeListCount() > 0 && this.validationIssues.length === 0;
  }

  isCollectionPublishable(): boolean {
    return (
      Boolean(this.collectionRights.isPrivate()) &&
      this.getChangeListCount() === 0 &&
      this.validationIssues.length === 0
    );
  }

  saveChanges(): void {
    let modalRef: NgbModalRef = this.ngbModal.open(
      CollectionEditorSaveModalComponent,
      {
        backdrop: 'static',
      }
    );

    modalRef.componentInstance.isCollectionPrivate =
      this.collectionRights.isPrivate();

    modalRef.result.then(
      (commitMessage: string) => {
        this.collectionEditorStateService.saveCollection(commitMessage);
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  publishCollection(): void {
    let additionalMetadataNeeded =
      !this.collection.getTitle() ||
      !this.collection.getObjective() ||
      !this.collection.getCategory();

    if (additionalMetadataNeeded) {
      let modalRef = this.ngbModal.open(
        CollectionEditorPrePublishModalComponent,
        {
          backdrop: 'static',
        }
      );

      modalRef.result.then(
        metadataList => {
          let commitMessage = 'Add metadata: ' + metadataList.join(', ') + '.';
          this.collectionEditorStateService.saveCollection(
            commitMessage,
            this._makeCollectionPublic.bind(this)
          );
        },
        () => {}
      );
    } else {
      this._makeCollectionPublic();
    }
  }

  isLoadingCollection(): boolean {
    return this.collectionEditorStateService.isLoadingCollection();
  }

  isSaveInProgress(): boolean {
    return this.collectionEditorStateService.isSavingCollection();
  }

  getActiveTabName(): string {
    return this.collectionEditorRoutingService.getActiveTabName();
  }

  selectMainTab(): void {
    this.collectionEditorRoutingService.navigateToEditTab();
  }

  selectSettingsTab(): void {
    this.collectionEditorRoutingService.navigateToSettingsTab();
  }

  selectStatsTab(): void {
    this.collectionEditorRoutingService.navigateToStatsTab();
  }

  selectHistoryTab(): void {
    this.collectionEditorRoutingService.navigateToHistoryTab();
  }
}
