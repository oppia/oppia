// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of ParamMetadata
 * domain objects.
 */

oppia.factory('ParamMetadataObjectFactory', [function() {
  /**
   * @private @constructor
   * Provide metadata when a parameter is changed by a GET or SET action
   * @param {String} action - set or get
   * @param {String} paramName - parameter's name
   * @param {String} source - location where the parameter was defined
   * e.g. answer, content, feedback or param_changes (changing value of param)
   * @param {String} sourceInd - index of this parameter in a set of changes
   */
  var ParamMetadata = function(action, paramName, source, sourceInd) {
    this.action = action;
    this.paramName = paramName;
    this.source = source;
    this.sourceInd = sourceInd;
  };

  /**
   * Metadata about the SET action of a parameter
   * @param {String} paramName - parameter's name
   * @param {String} source - location where the parameter was defined
   * e.g. answer, content, feedback or param_changes (changing value of param)
   * @param {String} sourceInd - index of this parameter in a set of changes
   * @returns {ParamMetadata} - A new ParamMetadata instance
   */
  ParamMetadata.createWithSetAction = function(paramName, source, sourceInd) {
    return new ParamMetadata('set', paramName, source, sourceInd);
  };

  /**
   * Metadata about the GET action of a parameter
   * @param {String} paramName - parameter's name
   * @param {String} source - location where the parameter was defined
   * e.g. answer, content, feedback or param_changes (changing value of param)
   * @param {String} sourceInd - index of this parameter in a set of changes
   * @returns {ParamMetadata} - A new ParamMetadata instance
   */
  ParamMetadata.createWithGetAction = function(paramMetadataDict) {
    return new ParamMetadata('get', paramName, source, sourceInd);
  };

  return ParamMetadata;
}]);
