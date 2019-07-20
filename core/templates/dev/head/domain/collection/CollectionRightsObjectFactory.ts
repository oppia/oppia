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

import * as _ from 'lodash';

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export class CollectionRights {
  _collectionId: number;
  _canEdit: boolean;
  _canUnpublish: boolean;
  _isPrivate: boolean;
  _ownerNames: string[];
  constructor(collectionRightsObject) {
    this._collectionId = collectionRightsObject.collection_id;
    this._canEdit = collectionRightsObject.can_edit;
    this._canUnpublish = collectionRightsObject.can_unpublish;
    this._isPrivate = collectionRightsObject.is_private;
    this._ownerNames = collectionRightsObject.owner_names;
  }

  getCollectionId() {
    return this._collectionId;
  }

  // Returns true if the the user can edit the collection. This property is
  // immutable.
  canEdit() {
    return this._canEdit;
  }

  // Returns true if the user can unpublish the collection.
  canUnpublish() {
    return this._canUnpublish;
  }

  // Returns true if the collection is private.
  isPrivate() {
    return this._isPrivate;
  }

  // Returns true if the collection is public.
  isPublic() {
    return !this._isPrivate;
  }

  // Sets isPrivate to false only if the user can edit the corresponding
  // collection.
  setPublic() {
    if (this.canEdit()) {
      this._isPrivate = false;
    } else {
      throw new Error('User is not allowed to edit this collection.');
    }
  }

  // Sets isPrivate to true only if canUnpublish and canEdit are both true.
  setPrivate() {
    if (this.canEdit() && this.canUnpublish()) {
      this._isPrivate = true;
    } else {
      throw new Error('User is not allowed to unpublish this collection.');
    }
  }

  // Returns the owner names of the collection. This property is immutable.
  getOwnerNames() {
    return _.cloneDeep(this._ownerNames);
  }

  // Returns the reference to the internal ownerNames array; this function is
  // only meant to be used for Angular bindings and should never be used in
  // code. Please use getOwnerNames() and related functions, instead. Please
  // also be aware this exposes internal state of the collection rights domain
  // object, so changes to the array itself may internally break the domain
  // object.
  getBindableOwnerNames() {
    return this._ownerNames;
  }

  // Reassigns all values within this collection to match the existing
  // collection rights. This is performed as a deep copy such that none of the
  // internal, bindable objects are changed within this collection rights.
  // Note that the collection nodes within this collection will be completely
  // redefined as copies from the specified collection rights
  copyFromCollectionRights(otherCollectionRights) {
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
  create(collectionRightsBackendObject) {
    return new CollectionRights(_.cloneDeep(collectionRightsBackendObject));
  }

  // Create a new, empty collection rights object. This is not guaranteed to
  // pass validation tests.
  createEmptyCollectionRights() {
    return new CollectionRights({
      owner_names: []
    });
  }
}

var oppia = require('AppInit.ts').module;

oppia.factory(
  'CollectionRightsObjectFactory',
  downgradeInjectable(CollectionRightsObjectFactory));
