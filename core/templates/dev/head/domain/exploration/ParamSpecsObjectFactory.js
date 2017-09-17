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
 * @fileoverview Factory for creating new frontend instances of ParamSpecs
 * domain objects. ParamSpecs map parameter names to the specifications
 * which defines them (represented as ParamSpec objects).
 */

oppia.factory('ParamSpecsObjectFactory', [
  'ParamSpecObjectFactory',
  function(ParamSpecObjectFactory) {
    var ParamSpecs = function(paramSpecs) {
      this.paramSpecs = paramSpecs;
    };

    ParamSpecs.prototype.paramNames = function() {
      return Object.keys(this.paramSpecs);
    };

    ParamSpecs.prototype.toBackendDict = function() {
      paramSpecsBackendDict = {};
      that = this;
      that.paramNames().map(function(paramName, unused_index) {
        paramSpecsBackendDict[paramName] =
          that.paramSpecs[paramName].toBackendDict();
      });
      return paramSpecsBackendDict;
    };

    ParamSpecs.createFromBackendDict = function(paramSpecsBackendDict) {
      paramSpecs = {};
      Object.keys(paramSpecsBackendDict).map(function(paramName, unused_index) {
        paramSpecs[paramName] = ParamSpecObjectFactory.createFromBackendDict(
          paramSpecsBackendDict[paramName]);
      });
      return new ParamSpecs(paramSpecs);
    };

    return ParamSpecs;
  }
]);

