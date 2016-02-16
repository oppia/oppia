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
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

// TODO(bhenning): Consolidate the backend ExplorationChange and
// CollectionChange domain objects.

// TODO(bhenning): Add tests for this.
oppia.factory('ChangeObjectFactory', [function() {
    var ChangeObjectFactory = function(
        backendChangeObject, applyChangeToObject, reverseChangeToObject) {
      this.backendChangeObject = angular.copy(backendChangeObject);
      this.applyChangeToObject = applyChangeToObject;
      this.reverseChangeToObject = reverseChangeToObject;
    };

    // Instance methods

    // Returns the JSON object which represents a backend python dict of this
    // change. Changes to this object are not reflected in this domain object.
    ChangeObjectFactory.prototype.getBackendChangeObject = function() {
      return this.backendChangeObject;
    };

    // Applies this change to the related object (such as a frontend collection
    // domain object).
    ChangeObjectFactory.prototype.applyChange = function(domainObject) {
      this.applyChangeToObject(this.getBackendChangeObject(), domainObject);
    };

    // Reverse-applies this change to the related object (such as a frontend
    // collection domain object). Calling this may have unintentional side
    // effects if called without first calling applyChange().
    ChangeObjectFactory.prototype.reverseChange = function(domainObject) {
      this.reverseChangeToObject(this.getBackendChangeObject(), domainObject);
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. The first parameter is a JSON representation of a backend
    // python dict for the given change. The second parameter is a callback
    // which will receive both the backend change object dictionary (as
    // read-only) and the domain object in which to apply the change. The third
    // parameter is a callback which behaves in the same way as the second
    // parameter and takes the same inputs, except it should reverse the change
    // for the provided domain object.
    ChangeObjectFactory.create = function(
        backendChangeObject, applyChangeToObject, reverseChangeToObject) {
      return new ChangeObjectFactory(
        backendChangeObject, applyChangeToObject, reverseChangeToObject);
    };

    return ChangeObjectFactory;
  }
]);
