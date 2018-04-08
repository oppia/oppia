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
 * @fileoverview Service to maintain the state of a single collection shared
 * throughout the collection editor. This service provides functionality for
 * retrieving the collection, saving it, and listening for changes.
 */

oppia.factory('CollectionLinearizerService', [
  'CollectionUpdateService',
  function(CollectionUpdateService) {
    var _getNextExplorationIds = function(collection, completedExpIds) {
      var explorationIds = collection.getExplorationIds();

      for (var i = 0; i < explorationIds.length; i++) {
        if (completedExpIds.indexOf(explorationIds[i]) === -1) {
          return [explorationIds[i]];
        }
      }
      return [];
    };

    // Given a non linear collection input, the function will linearize it by
    // picking the first node it encounters on the branch and ignore the others.
    var _getCollectionNodesInPlayableOrder = function(collection) {
      return collection.getCollectionNodes();
    };

    var addAfter = function(collection, curExplorationId, newExplorationId) {
      var curCollectionNode = collection.getCollectionNodeByExplorationId(
        curExplorationId);
    };

    var findNodeIndex = function(linearNodeList, explorationId) {
      var index = -1;
      for (var i = 0; i < linearNodeList.length; i++) {
        if (linearNodeList[i].getExplorationId() === explorationId) {
          index = i;
          break;
        }
      }
      return index;
    };

    var getNodeIndexLeftOf = function(linearNodeList, nodeIndex) {
      return nodeIndex > 0 ? nodeIndex - 1 : null;
    };

    var getNodeIndexRightOf = function(linearNodeList, nodeIndex) {
      var lastIndex = linearNodeList.length - 1;
      return nodeIndex < lastIndex ? nodeIndex + 1 : null;
    };

    // Swap the node at the specified index with the node immediately to the
    // left of it.
    var swapLeft = function(collection, linearNodeList, nodeIndex) {
      // There is a single case in the swap
      //   1. There is no node to the left of the current node

      var node = linearNodeList[nodeIndex];
      var leftNodeIndex = getNodeIndexLeftOf(linearNodeList, nodeIndex);

      if (leftNodeIndex === null) {
        // Case 1 is a no-op: there's nothing to swap with.
        return;
      }

      CollectionUpdateService.swapNodes(collection, leftNodeIndex, nodeIndex);
    };
    var swapRight = function(collection, linearNodeList, nodeIndex) {
      // Swapping right is the same as swapping the node one to the right
      // leftward.
      if (nodeIndex < linearNodeList.length - 1) {
        swapLeft(collection, linearNodeList, nodeIndex + 1);
      }
      // Otherwise it is a no-op (cannot swap the last node right).
    };

    var shiftNode = function(collection, explorationId, swapFunction) {
      // There is nothing to shift if the collection has only 1 node.
      if (collection.getCollectionNodeCount() > 1) {
        var linearNodeList = _getCollectionNodesInPlayableOrder(collection);
        var nodeIndex = findNodeIndex(linearNodeList, explorationId);
        if (nodeIndex === -1) {
          return false;
        }
        swapFunction(collection, linearNodeList, nodeIndex);
      }
      return true;
    };

    return {
      /**
       * Given a collection and a list of completed exploration IDs within the
       * context of that collection, returns a list of which explorations in the
       * collection is immediately playable by the user. NOTE: This function
       * does not assume that the collection is linear.
       */
      getNextExplorationIds: function(collection, completedExpIds) {
        return _getNextExplorationIds(collection, completedExpIds);
      },

      /**
       * Given a collection, returns a linear list of collection nodes which
       * represents a valid path for playing through this collection.
       */
      getCollectionNodesInPlayableOrder: function(collection) {
        return _getCollectionNodesInPlayableOrder(collection);
      },

      /**
       * Inserts a new collection node at the end of the collection's playable
       * list of explorations, based on the specified exploration ID and
       * exploration summary backend object.
       */
      appendCollectionNode: function(
          collection, explorationId, summaryBackendObject) {
        var linearNodeList = _getCollectionNodesInPlayableOrder(collection);
        CollectionUpdateService.addCollectionNode(
          collection, explorationId, summaryBackendObject);
        if (linearNodeList.length > 0) {
          var lastNode = linearNodeList[linearNodeList.length - 1];
          addAfter(collection, lastNode.getExplorationId(), explorationId);
        }
      },

      /**
       * Remove a collection node from a given collection which maps to the
       * specified exploration ID. This function ensures the linear structure of
       * the collection is maintained. Returns whether the provided exploration
       * ID is contained within the linearly playable path of the specified
       * collection.
       */
      removeCollectionNode: function(collection, explorationId) {
        if (!collection.containsCollectionNode(explorationId)) {
          return false;
        }

        // Delete the node
        CollectionUpdateService.deleteCollectionNode(collection, explorationId);
        return true;
      },

      /**
       * Looks up a collection node given an exploration ID in the specified
       * collection and attempts to shift it left in the linear ordering of the
       * collection. If the node is the first exploration played by the player,
       * then this function is a no-op. Returns false if the specified
       * exploration ID does not associate to any nodes in the collection.
       */
      shiftNodeLeft: function(collection, explorationId) {
        return shiftNode(collection, explorationId, swapLeft);
      },

      /**
       * Looks up a collection node given an exploration ID in the specified
       * collection and attempts to shift it right in the linear ordering of the
       * collection. If the node is the last exploration played by the player,
       * then this function is a no-op. Returns false if the specified
       * exploration ID does not associate to any nodes in the collection.
       */
      shiftNodeRight: function(collection, explorationId) {
        return shiftNode(collection, explorationId, swapRight);
      }
    };
  }
]);
