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
 * @fileoverview Factory for creating new frontend instances of ParamSpecs
 * domain objects. ParamSpecs map parameter names to the specifications
 * which defines them (represented as ParamSpec objects).
 */

oppia.factory('ParamSpecsObjectFactory', [
  'ParamSpecObjectFactory',
  function(ParamSpecObjectFactory) {
    /**
     * @constructor
     * @param {Object.<String, ParamSpec>} paramDict - params and their specs
     *    for this object will hold.
     */
    var ParamSpecs = function(paramDict) {
      /** @member {Object.<String, ParamSpec>} */
      this.paramDict = paramDict;
    };

    /**
     * @returns {Object.<String, ParamSpec>} the map of params to their specs.
     */
    ParamSpecs.prototype.getParamDict = function() {
      return this.paramDict;
    };

    /** @returns {Array.<String>} - The names of the current parameter specs. */
    ParamSpecs.prototype.getParamNames = function() {
      return Object.keys(this.paramDict);
    };

    /**
     * Adds a new parameter only if it didn't exist already. Does nothing
     * otherwise.
     * @param {!String} paramName - The parameter to add a spec for.
     * @param {ParamSpec=} paramSpec - The specification of the parameter.
     * @returns {Boolean} - True when the parameter was newly added.
     */
    ParamSpecs.prototype.addParamIfNew = function(paramName, paramSpec) {
      if (!this.paramDict.hasOwnProperty(paramName)) {
        this.paramDict[paramName] =
          paramSpec || ParamSpecObjectFactory.createDefault();
        return true;
      }
      return false;
    };

    /**
     * @returns {Object.<String, {obj_type: String}>} - Basic dict for backend
     *    consumption.
     */
    ParamSpecs.prototype.toBackendDict = function() {
      var paramSpecsBackendDict = {};
      var that = this;
      this.getParamNames().forEach(function(paramName) {
        paramSpecsBackendDict[paramName] =
          that.paramDict[paramName].toBackendDict();
      });
      return paramSpecsBackendDict;
    };

    /**
     * @param {!Object.<String, {obj_type: String}>} paramSpecsBackendDict -
     *    Basic dict of backend representation.
     * @returns {ParamSpecs} - An instance with properties from the backend
     *    dict.
     */
    ParamSpecs.createFromBackendDict = function(paramSpecsBackendDict) {
      var paramDict = {};
      Object.keys(paramSpecsBackendDict).forEach(function(paramName) {
        paramDict[paramName] = ParamSpecObjectFactory.createFromBackendDict(
          paramSpecsBackendDict[paramName]);
      });
      return new ParamSpecs(paramDict);
    };

    return ParamSpecs;
  }
]);
