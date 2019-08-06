// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection rights domain objects.
 */

import * as cloneDeep from 'lodash/cloneDeep';

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export interface ICollectionRights {
  getCollectionId: () => number;
  canEdit: () => boolean;
  isPrivate: () => boolean;
  canUnpublish: () => boolean;
  getOwnerNames: () => string[];
}

export class CollectionRights {
  _collectionId: number;
  _canEdit: boolean;
  _canUnpublish: boolean;
  _isPrivate: boolean;
  _ownerNames: string[];

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'collectionRightsObject' is a dict with
  // underscore_cased keys which give tslint errors against underscore_casing
  // in favor of camelCasing.
  constructor(collectionRightsObject: any) {
    this._collectionId = collectionRightsObject.collection_id;
    this._canEdit = collectionRightsObject.can_edit;
    this._canUnpublish = collectionRightsObject.can_unpublish;
    this._isPrivate = collectionRightsObject.is_private;
    this._ownerNames = collectionRightsObject.owner_names;
  }

  getCollectionId(): number {
    return this._collectionId;
  }

  // Returns true if the the user can edit the collection. This property is
  // immutable.
  canEdit(): boolean {
    return this._canEdit;
  }

  // Returns true if the user can unpublish the collection.
  canUnpublish(): boolean {
    return this._canUnpublish;
  }

  // Returns true if the collection is private.
  isPrivate(): boolean {
    return this._isPrivate;
  }

  // Returns true if the collection is public.
  isPublic(): boolean {
    return !this._isPrivate;
  }

  // Sets isPrivate to false only if the user can edit the corresponding
  // collection.
  setPublic(): void {
    if (this.canEdit()) {
      this._isPrivate = false;
    } else {
      throw new Error('User is not allowed to edit this collection.');
    }
  }

  // Sets isPrivate to true only if canUnpublish and canEdit are both true.
  setPrivate(): void {
    if (this.canEdit() && this.canUnpublish()) {
      this._isPrivate = true;
    } else {
      throw new Error('User is not allowed to unpublish this collection.');
    }
  }

  // Returns the owner names of the collection. This property is immutable.
  getOwnerNames(): string[] {
    return cloneDeep(this._ownerNames);
  }

  // Returns the reference to the internal ownerNames array; this function is
  // only meant to be used for Angular bindings and should never be used in
  // code. Please use getOwnerNames() and related functions, instead. Please
  // also be aware this exposes internal state of the collection rights domain
  // object, so changes to the array itself may internally break the domain
  // object.
  getBindableOwnerNames(): string[] {
    return this._ownerNames;
  }

  // Reassigns all values within this collection to match the existing
  // collection rights. This is performed as a deep copy such that none of the
  // internal, bindable objects are changed within this collection rights.
  // Note that the collection nodes within this collection will be completely
  // redefined as copies from the specified collection rights
  copyFromCollectionRights(otherCollectionRights: ICollectionRights): void {
    this._collectionId = otherCollectionRights.getCollectionId();
    this._canEdit = otherCollectionRights.canEdit();
    this._isPrivate = otherCollectionRights.isPrivate();
    this._canUnpublish = otherCollectionRights.canUnpublish();
    this._ownerNames = otherCollectionRights.getOwnerNames();
  }
}

@Injectable({
  providedIn: 'root'
})
export class CollectionRightsObjectFactory {
  // Static class methods. Note that "this" is not available in static
  // contexts. This function takes a JSON object which represents a backend
  // collection python dict.
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'collectionRightsBackendObject' is a dict with
  // underscore_cased keys which give tslint errors against underscore_casing
  // in favor of camelCasing.
  create(collectionRightsBackendObject: any): CollectionRights {
    return new CollectionRights(cloneDeep(collectionRightsBackendObject));
  }

  // Create a new, empty collection rights object. This is not guaranteed to
  // pass validation tests.
  createEmptyCollectionRights(): CollectionRights {
    return new CollectionRights({
      owner_names: []
    });
  }
}

angular.module('oppia').factory(
  'CollectionRightsObjectFactory',
  downgradeInjectable(CollectionRightsObjectFactory));
