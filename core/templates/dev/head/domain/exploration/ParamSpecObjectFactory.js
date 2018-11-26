// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of ParamSpec
 * domain objects.
 */

oppia.factory('ParamSpecObjectFactory', [
  'ParamTypeObjectFactory',
  function(ParamTypeObjectFactory) {
    /**
     * @constructor
     * @param {!ParamType} objType - The type of the parameter.
     */
    var ParamSpec = function(objType) {
      /** @member {ParamType} */
      this._objType = objType;
    };

    /** @returns {ParamType} - The type name of the parameter. */
    ParamSpec.prototype.getType = function() {
      return this._objType;
    };

    /** @returns {{obj_type: String}} - Basic dict for backend consumption. */
    ParamSpec.prototype.toBackendDict = function() {
      return {
        obj_type: this._objType.getName(),
      };
    };

    /**
     * @param {!{obj_type: String}} paramSpecBackendDict - Basic dict from
     *    backend.
     * @returns {ParamSpec} - A new ParamSpec instance.
     */
    ParamSpec.createFromBackendDict = function(paramSpecBackendDict) {
      return new ParamSpec(
        ParamTypeObjectFactory.getTypeFromBackendName(
          paramSpecBackendDict.obj_type));
    };

    /** @returns {ParamSpec} - A default instance for ParamSpec. */
    ParamSpec.createDefault = function() {
      return new ParamSpec(ParamTypeObjectFactory.getDefaultType());
    };

    return ParamSpec;
  }
]);
