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
 * @fileoverview Service to build changes to a collection. These changes may
 * then be used by other services, such as a backend API service to update the
 * collection in the backend. This service also registers all changes with the
 * undo/redo service.
 */

import {Injectable} from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import {CollectionDomainConstants} from 'domain/collection/collection-domain.constants';
import {Collection} from 'domain/collection/collection.model';
import {CollectionNode} from './collection-node.model';
import {
  BackendChangeObject,
  Change,
  CollectionChange,
  DomainObject,
} from 'domain/editor/undo_redo/change.model';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {LearnerExplorationSummaryBackendDict} from 'domain/summary/learner-exploration-summary.model';
import {Params} from '@angular/router';

type CollectionUpdateApply = (
  collectionChange: CollectionChange,
  collection: Collection
) => void;
type CollectionUpdateReverse = (
  collectionChange: CollectionChange,
  collection: Collection
) => void;
type ChangeBackendDict = (
  backendChangeObject: BackendChangeObject,
  domainObject: DomainObject
) => void;

@Injectable({
  providedIn: 'root',
})
export class CollectionUpdateService {
  constructor(private undoRedoService: UndoRedoService) {}

  private _applyChange(
    collection: Collection,
    command: string,
    params: Params | BackendChangeObject,
    apply: CollectionUpdateApply,
    reverse: CollectionUpdateReverse
  ): void {
    let changeDict = cloneDeep(params);
    changeDict.cmd = command;
    let changeObj = new Change(
      changeDict as BackendChangeObject,
      apply as ChangeBackendDict,
      reverse as ChangeBackendDict
    );
    this.undoRedoService.applyChange(changeObj, collection);
  }

  private _getParameterFromChangeDict(changeDict: Params, paramName: string) {
    return changeDict[paramName];
  }

  // Applies a collection property change, specifically. See _applyChange()
  // for details on the other behavior of this function.
  private _applyPropertyChange(
    collection: Collection,
    propertyName: string,
    // New value can be set to null.
    newValue: string | string[] | null,
    // Old value is null until the user provides it.
    oldValue: string | string[] | null,
    apply: CollectionUpdateApply,
    reverse: CollectionUpdateReverse
  ) {
    this._applyChange(
      collection,
      CollectionDomainConstants.CMD_EDIT_COLLECTION_PROPERTY,
      {
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
      },
      apply,
      reverse
    );
  }

  private _getNewPropertyValueFromChangeDict(changeDict: Params) {
    return this._getParameterFromChangeDict(changeDict, 'new_value');
  }

  private _getExplorationIdFromChangeDict(changeDict: Params): string {
    return this._getParameterFromChangeDict(changeDict, 'exploration_id');
  }

  private _getFirstIndexFromChangeDict(changeDict: Params): number {
    return this._getParameterFromChangeDict(changeDict, 'first_index');
  }

  private _getSecondIndexFromChangeDict(changeDict: Params): number {
    return this._getParameterFromChangeDict(changeDict, 'second_index');
  }

  addCollectionNode(
    collection: Collection,
    explorationId: string,
    explorationSummaryBackendObject: LearnerExplorationSummaryBackendDict
  ): void {
    let oldSummaryBackendObject = cloneDeep(explorationSummaryBackendObject);
    this._applyChange(
      collection,
      CollectionDomainConstants.CMD_ADD_COLLECTION_NODE,
      {
        exploration_id: explorationId,
      },
      (changeDict, collection) => {
        // Apply.
        let explorationId = this._getExplorationIdFromChangeDict(changeDict);
        let collectionNode =
          CollectionNode.createFromExplorationId(explorationId);
        collectionNode.setExplorationSummaryObject(oldSummaryBackendObject);
        collection.addCollectionNode(collectionNode);
      },
      (changeDict, collection) => {
        // Undo.
        let explorationId = this._getExplorationIdFromChangeDict(changeDict);
        collection.deleteCollectionNode(explorationId);
      }
    );
  }

  swapNodes(
    collection: Collection,
    firstIndex: number,
    secondIndex: number
  ): void {
    this._applyChange(
      collection,
      CollectionDomainConstants.CMD_SWAP_COLLECTION_NODES,
      {
        first_index: firstIndex,
        second_index: secondIndex,
      },
      (changeDict, collection) => {
        // Apply.
        let firstIndex = this._getFirstIndexFromChangeDict(changeDict);
        let secondIndex = this._getSecondIndexFromChangeDict(changeDict);

        collection.swapCollectionNodes(firstIndex, secondIndex);
      },
      (changeDict, collection) => {
        // Undo.
        let firstIndex = this._getFirstIndexFromChangeDict(changeDict);
        let secondIndex = this._getSecondIndexFromChangeDict(changeDict);

        collection.swapCollectionNodes(firstIndex, secondIndex);
      }
    );
  }

  /**
   * Removes an exploration from a collection and records the change in
   * the undo/redo service.
   */
  deleteCollectionNode(collection: Collection, explorationId: string): void {
    let oldCollectionNode =
      collection.getCollectionNodeByExplorationId(explorationId);
    this._applyChange(
      collection,
      CollectionDomainConstants.CMD_DELETE_COLLECTION_NODE,
      {
        exploration_id: explorationId,
      },
      (changeDict, collection) => {
        // Apply.
        let explorationId = this._getExplorationIdFromChangeDict(changeDict);
        collection.deleteCollectionNode(explorationId);
      },
      (changeDict, collection) => {
        // Undo.
        collection.addCollectionNode(oldCollectionNode);
      }
    );
  }

  /**
   * Changes the title of a collection and records the change in the
   * undo/redo service.
   */
  // Collection title is null for the default collection.
  setCollectionTitle(collection: Collection, title: string | null): void {
    const oldTitle = collection.getTitle();
    this._applyPropertyChange(
      collection,
      CollectionDomainConstants.COLLECTION_PROPERTY_TITLE,
      title,
      oldTitle,
      (changeDict, collection) => {
        // ---- Apply ----
        let title = this._getNewPropertyValueFromChangeDict(changeDict);
        collection.setTitle(title);
      },
      (changeDict, collection) => {
        // ---- Undo ----
        collection.setTitle(oldTitle);
      }
    );
  }

  /**
   * Changes the category of a collection and records the change in the
   * undo/redo service.
   */
  // Collection category is null for the default collection.
  setCollectionCategory(collection: Collection, category: string | null): void {
    let oldCategory = collection.getCategory();
    this._applyPropertyChange(
      collection,
      CollectionDomainConstants.COLLECTION_PROPERTY_CATEGORY,
      category,
      oldCategory,
      (changeDict, collection) => {
        // Apply.
        const newCategory = this._getNewPropertyValueFromChangeDict(changeDict);
        collection.setCategory(newCategory);
      },
      (changeDict, collection) => {
        // Undo.
        collection.setCategory(oldCategory);
      }
    );
  }

  /**
   * Changes the objective of a collection and records the change in the
   * undo/redo service.
   */
  // Collection objective is null for the default collection.
  setCollectionObjective(
    collection: Collection,
    objective: string | null
  ): void {
    let oldObjective = collection.getObjective();
    this._applyPropertyChange(
      collection,
      CollectionDomainConstants.COLLECTION_PROPERTY_OBJECTIVE,
      objective,
      oldObjective,
      (changeDict, collection) => {
        // Apply.
        let objective = this._getNewPropertyValueFromChangeDict(changeDict);
        collection.setObjective(objective);
      },
      (changeDict, collection) => {
        // Undo.
        collection.setObjective(oldObjective);
      }
    );
  }

  /**
   * Changes the language code of a collection and records the change in
   * the undo/redo service.
   */
  // Collection language code is null for the default collection.
  setCollectionLanguageCode(
    collection: Collection,
    languageCode: string | null
  ): void {
    let oldLanguageCode = collection.getLanguageCode();
    this._applyPropertyChange(
      collection,
      CollectionDomainConstants.COLLECTION_PROPERTY_LANGUAGE_CODE,
      languageCode,
      oldLanguageCode,
      (changeDict, collection) => {
        // Apply.
        let languageCode = this._getNewPropertyValueFromChangeDict(changeDict);
        collection.setLanguageCode(languageCode);
      },
      (changeDict, collection) => {
        // Undo.
        collection.setLanguageCode(oldLanguageCode);
      }
    );
  }

  /**
   * Changes the tags of a collection and records the change in
   * the undo/redo service.
   */
  setCollectionTags(collection: Collection, tags: string[]): void {
    const oldTags = collection.getTags();
    this._applyPropertyChange(
      collection,
      CollectionDomainConstants.COLLECTION_PROPERTY_TAGS,
      tags,
      oldTags,
      (changeDict, collection) => {
        // Apply.
        let tags = this._getNewPropertyValueFromChangeDict(changeDict);
        collection.setTags(tags);
      },
      (changeDict, collection) => {
        // Undo.
        collection.setTags(oldTags);
      }
    );
  }

  /**
   * Returns whether the given change object constructed by this service
   * is adding a new collection node to a collection.
   */
  isAddingCollectionNode(changeObject: Change): boolean {
    let backendChangeObject = changeObject.getBackendChangeObject();
    return (
      backendChangeObject.cmd ===
      CollectionDomainConstants.CMD_ADD_COLLECTION_NODE
    );
  }

  /**
   * Returns the exploration ID referenced by the specified change object,
   * or undefined if the given changeObject does not reference an
   * exploration ID. The change object is expected to be one constructed
   * by this service.
   */
  getExplorationIdFromChangeObject(changeObject: Change): string {
    return this._getExplorationIdFromChangeDict(
      changeObject.getBackendChangeObject()
    );
  }
}
