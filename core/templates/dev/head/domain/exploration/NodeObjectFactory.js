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
 * @fileoverview Factory for creating new frontend instances of Node
 * domain objects.
 */

oppia.factory('NodeObjectFactory', [function() {
  var Node = function(nodeType, inputs) {
    this.nodeType = nodeType;
    this.inputs = inputs;
  }

  Node.prototype.toBackendDict = function() {
    return {
      node_type: this.nodeType,
      inputs: this.inputs
    };
  };

  Node.createNew = function(nodeType, inputs) {
    return new Node(nodeType, inputs);
  };

  Node.createFromDict = function(nodeDict) {
    return new Node(nodeDict.node_type, nodeDict.inputs);
  };

  return Node;
}]);
