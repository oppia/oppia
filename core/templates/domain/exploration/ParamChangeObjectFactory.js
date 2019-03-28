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
 * @fileoverview Factory for creating new frontend instances of ParamChange
 * domain objects.
 */

oppia.factory('ParamChangeObjectFactory', [function() {
  var ParamChange = function(customizationArgs, generatorId, name) {
    this.customizationArgs = customizationArgs;
    this.generatorId = generatorId;
    this.name = name;
  };

  var DEFAULT_CUSTOMIZATION_ARGS = {
    Copier: {
      parse_with_jinja: true,
      value: '5'
    },
    RandomSelector: {
      list_of_values: ['sample value']
    }
  };

  ParamChange.prototype.toBackendDict = function() {
    return {
      customization_args: this.customizationArgs,
      generator_id: this.generatorId,
      name: this.name
    };
  };

  ParamChange.prototype.resetCustomizationArgs = function() {
    this.customizationArgs = angular.copy(
      DEFAULT_CUSTOMIZATION_ARGS[this.generatorId]);
  };

  ParamChange.createFromBackendDict = function(paramChangeBackendDict) {
    return new ParamChange(
      paramChangeBackendDict.customization_args,
      paramChangeBackendDict.generator_id,
      paramChangeBackendDict.name);
  };

  ParamChange.createEmpty = function(paramName) {
    return new ParamChange({
      parse_with_jinja: true,
      value: ''
    }, 'Copier', paramName);
  };

  ParamChange.createDefault = function(paramName) {
    return new ParamChange(
      angular.copy(DEFAULT_CUSTOMIZATION_ARGS.Copier), 'Copier', paramName);
  };

  return ParamChange;
}]);
