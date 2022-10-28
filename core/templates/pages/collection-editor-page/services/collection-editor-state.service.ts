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
 * @fileoverview Service to maintain the state of a single collection shared
 * throughout the collection editor. This service provides functionality for
 * retrieving the collection, saving it, and listening for changes.
 */

import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { CollectionRightsBackendApiService } from 'domain/collection/collection-rights-backend-api.service';
import { CollectionRights } from 'domain/collection/collection-rights.model';
import { Collection } from 'domain/collection/collection.model';
import { EditableCollectionBackendApiService } from 'domain/collection/editable-collection-backend-api.service';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { AlertsService } from 'services/alerts.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionEditorStateService {
  private _collection: Collection = Collection.createEmptyCollection();
  private _collectionRights: CollectionRights = (
    CollectionRights.createEmptyCollectionRights());

  private _collectionIsInitialized: boolean = false;
  private _collectionIsLoading: boolean = false;
  private _collectionIsBeingSaved: boolean = false;
  private _collectionInitializedEventEmitter: EventEmitter<void> = (
    new EventEmitter());

  constructor(
    private alertsService: AlertsService,
    private collectionRightsBackendApiService:
    CollectionRightsBackendApiService,
    private editableCollectionBackendApiService:
    EditableCollectionBackendApiService,
    private undoRedoService: UndoRedoService
  ) { }

  private _setCollection(collection: Collection) {
    this._collection.copyFromCollection(collection);
    if (this._collectionIsInitialized) {
      this._collectionInitializedEventEmitter.emit();
    } else {
      this._collectionInitializedEventEmitter.emit();
      this._collectionIsInitialized = true;
    }
  }

  private _updateCollection(newCollectionObject: Collection): void {
    this._setCollection(newCollectionObject);
  }

  private _setCollectionRights(collectionRights: CollectionRights): void {
    this._collectionRights.copyFromCollectionRights(collectionRights);
  }

  /**
   * Loads, or reloads, the collection stored by this service given a
   * specified collection ID. See setCollection() for more information on
   * additional behavior of this function.
   */
  loadCollection(collectionId: string): void {
    this._collectionIsLoading = true;
    this.editableCollectionBackendApiService.fetchCollectionAsync(
      collectionId).then(
      (newCollectionObject) => {
        this._updateCollection(newCollectionObject);
      },
      (error) => {
        this.alertsService.addWarning(
          error || 'There was an error when loading the collection.');
        this._collectionIsLoading = false;
      });
    this.collectionRightsBackendApiService.fetchCollectionRightsAsync(
      collectionId).then((newBackendCollectionRightsObject) => {
      this._setCollectionRights(newBackendCollectionRightsObject);
      this._collectionIsLoading = false;
    }, (error) => {
      this.alertsService.addWarning(
        error ||
          'There was an error when loading the collection rights.');
      this._collectionIsLoading = false;
    });
  }

  /**
   * Returns whether this service is currently attempting to load the
   * collection maintained by this service.
   */
  isLoadingCollection(): boolean {
    return this._collectionIsLoading;
  }

  /**
   * Returns whether a collection has yet been loaded using either
   * loadCollection() or setCollection().
   */
  hasLoadedCollection(): boolean {
    return this._collectionIsInitialized;
  }

  /**
   * Returns the current collection to be shared among the collection
   * editor. Please note any changes to this collection will be propogated
   * to all bindings to it. This collection object will be retained for the
   * lifetime of the editor. This function never returns null, though it may
   * return an empty collection object if the collection has not yet been
   * loaded for this editor instance.
   */
  getCollection(): Collection {
    return this._collection;
  }

  /**
   * Returns the current collection rights to be shared among the collection
   * editor. Please note any changes to this collection rights will be
   * propogated to all bindings to it. This collection rights object will
   * be retained for the lifetime of the editor. This function never returns
   * null, though it may return an empty collection rights object if the
   * collection rights has not yet been loaded for this editor instance.
   */
  getCollectionRights(): CollectionRights {
    return this._collectionRights;
  }

  /**
   * Sets the collection stored within this service, propogating changes to
   * all bindings to the collection returned by getCollection(). The first
   * time this is called it will fire a global event based on the
   * _collectionInitializedEventEmitter. All subsequent
   * calls will similarly fire a event based on
   * _collectionInitializedEventEmitter
   */
  setCollection(collection: Collection): void {
    this._setCollection(collection);
  }

  /**
   * Sets the collection rights stored within this service, propogating
   * changes to all bindings to the collection returned by
   * getCollectionRights(). The first time this is called it will fire a
   * global event based on the EVENT_COLLECTION_INITIALIZED constant. All
   * subsequent calls will similarly fire a EVENT_COLLECTION_REINITIALIZED
   * event.
   */
  setCollectionRights(collectionRights: CollectionRights): void {
    this._setCollectionRights(collectionRights);
  }

  /**
   * Attempts to save the current collection given a commit message. This
   * function cannot be called until after a collection has been initialized
   * in this service. Returns false if a save is not performed due to no
   * changes pending, or true if otherwise. This function, upon success,
   * will clear the UndoRedoService of pending changes. This function also
   * shares behavior with setCollection(), when it succeeds.
   */
  saveCollection(commitMessage: string, successCallback?: () => void): boolean {
    const collectionId = this._collection.getId();
    const collectionVersion = this._collection.getVersion();
    if (
      !collectionId ||
      !this._collectionIsInitialized ||
      !collectionVersion
    ) {
      return false;
    }

    // Don't attempt to save the collection if there are no changes pending.
    if (!this.undoRedoService.hasChanges()) {
      return false;
    }
    this._collectionIsBeingSaved = true;
    this.editableCollectionBackendApiService.updateCollectionAsync(
      collectionId, collectionVersion, commitMessage,
      this.undoRedoService.getCommittableChangeList()
    ).then(
      (collectionObject) => {
        this._updateCollection(collectionObject);
        this.undoRedoService.clearChanges();
        this._collectionIsBeingSaved = false;

        if (successCallback) {
          successCallback();
        }
      }, (error) => {
        this.alertsService.addWarning(
          error || 'There was an error when saving the collection.');
        this._collectionIsBeingSaved = false;
      });
    return true;
  }

  /**
   * Returns whether this service is currently attempting to save the
   * collection maintained by this service.
   */
  isSavingCollection(): boolean {
    return this._collectionIsBeingSaved;
  }

  get onCollectionInitialized(): EventEmitter<void> {
    return this._collectionInitializedEventEmitter;
  }
}

angular.module('oppia').factory('CollectionEditorStateService',
  downgradeInjectable(CollectionEditorStateService));
