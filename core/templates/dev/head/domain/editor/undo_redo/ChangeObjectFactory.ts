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
 * @fileoverview Factory for creating and mutating instances of frontend change
 * domain objects. This frontend object represents both CollectionChange and
 * ExplorationChange backend domain objects.
 */

// TODO(bhenning): Consolidate the backend ExplorationChange and
// CollectionChange domain objects.

import * as cloneDeep from 'lodash/cloneDeep';

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export class Change {
  // TODO(#7176): Replace 'any' with the exact type. This (and elsewhere
  // throughout) has been kept as 'any' because 'backendChangeObject' is a
  // dict with possible underscore_cased keys which give tslint errors
  // against underscore_casing in favor of camelCasing. Also,
  // 'applyChangeToObject' and 'reverseChangeToObject' are functions whose
  // return type depends upon the arguments passed to the constructor.
  _backendChangeObject: any;
  _applyChangeToObject: any;
  _reverseChangeToObject: any;

  constructor(
      backendChangeObject: any, applyChangeToObject: any,
      reverseChangeToObject: any) {
    this._backendChangeObject = cloneDeep(backendChangeObject);
    this._applyChangeToObject = applyChangeToObject;
    this._reverseChangeToObject = reverseChangeToObject;
  }

  // Returns the JSON object which represents a backend python dict of this
  // change. Changes to this object are not reflected in this domain object.
  // TODO(#7176): Replace 'any' with the exact type. This (and elsewhere
  // throughout) has been kept as 'any' because 'backendChangeObject' is a
  // dict with possible underscore_cased keys which give tslint errors
  // against underscore_casing in favor of camelCasing. Also,
  // 'applyChangeToObject' and 'reverseChangeToObject' are functions whose
  // return type depends upon the arguments passed to the constructor.
  getBackendChangeObject(): any {
    return cloneDeep(this._backendChangeObject);
  }

  // TODO(#7176): Replace 'any' with the exact type. This (and elsewhere
  // throughout) has been kept as 'any' because 'backendChangeObject' is a
  // dict with possible underscore_cased keys which give tslint errors
  // against underscore_casing in favor of camelCasing. Also,
  // 'applyChangeToObject' and 'reverseChangeToObject' are functions whose
  // return type depends upon the arguments passed to the constructor.
  setBackendChangeObject(backendChangeObject: any): any {
    return this._backendChangeObject = cloneDeep(backendChangeObject);
  }

  // Applies this change to the related object (such as a frontend collection
  // domain object).
  // TODO(#7176): Replace 'any' with the exact type. This (and elsewhere
  // throughout) has been kept as 'any' because 'backendChangeObject' is a
  // dict with possible underscore_cased keys which give tslint errors
  // against underscore_casing in favor of camelCasing. Also,
  // 'applyChangeToObject' and 'reverseChangeToObject' are functions whose
  // return type depends upon the arguments passed to the constructor.
  applyChange(domainObject: any): void {
    this._applyChangeToObject(this._backendChangeObject, domainObject);
  }

  // Reverse-applies this change to the related object (such as a frontend
  // collection domain object). This method should only be used to reverse a
  // change that was previously applied by calling the applyChange() method.
  // TODO(#7176): Replace 'any' with the exact type. This (and elsewhere
  // throughout) has been kept as 'any' because 'backendChangeObject' is a
  // dict with possible underscore_cased keys which give tslint errors
  // against underscore_casing in favor of camelCasing. Also,
  // 'applyChangeToObject' and 'reverseChangeToObject' are functions whose
  // return type depends upon the arguments passed to the constructor.
  reverseChange(domainObject: any): void {
    this._reverseChangeToObject(this._backendChangeObject, domainObject);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ChangeObjectFactory {
  // Static class methods. Note that "this" is not available in static
  // contexts. The first parameter is a JSON representation of a backend
  // python dict for the given change. The second parameter is a callback
  // which will receive both the backend change object dictionary (as
  // read-only) and the domain object in which to apply the change. The third
  // parameter is a callback which behaves in the same way as the second
  // parameter and takes the same inputs, except it should reverse the change
  // for the provided domain object.
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'backendChangeObject' is a dict with possible
  // underscore_cased keys which give tslint errors against underscore_casing
  // in favor of camelCasing. Also, 'applyChangeToObject' and
  // 'reverseChangeToObject' are functions whose return type depends upon the
  // arguments passed to the constructor.
  create(
      backendChangeObject: any, applyChangeToObject: any,
      reverseChangeToObject: any): Change {
    return new Change(
      backendChangeObject, applyChangeToObject, reverseChangeToObject);
  }
}

angular.module('oppia').factory(
  'ChangeObjectFactory', downgradeInjectable(ChangeObjectFactory));
