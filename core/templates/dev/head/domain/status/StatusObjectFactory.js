// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new Status domain objects to be used
 * when returning success results from functions.
 */

oppia.factory('StatusObjectFactory', [function() {
  var Status = function(reason, value) {
    this._reason = reason;
    this._value = value;
  };

  // Static class methods. Note that "this" is not available in
  // static contexts.
  Status.createSuccess = function(reason) {
    return new Status(reason, true);
  };

  Status.createFailure = function(reason) {
    return new Status(reason, false);
  };

  Status.prototype.getReason = function() {
    return this._reason;
  };

  Status.prototype.getValue = function() {
    return this._value;
  };

  return Status;
}]);
