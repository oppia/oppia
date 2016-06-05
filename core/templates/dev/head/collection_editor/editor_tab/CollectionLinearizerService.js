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
 * retrieving the collection, saving it, and listening for changes. The service
 * also maintains a list of all skills stored within the collection.
 */

oppia.factory('CollectionLinearizerService', [
  'CollectionUpdateService', 'SkillListObjectFactory',
  function(CollectionUpdateService, SkillListObjectFactory) {
    var _getNextExplorationIds = function(collection, completedExpIds) {
      var acquiredSkillList = completedExpIds.reduce(
        function(skillList, explorationId) {
          var collectionNode = collection.getCollectionNodeByExplorationId(
            explorationId);
          skillList.addSkillsFromSkillList(
            collectionNode.getAcquiredSkillList());
          return skillList;
        }, SkillListObjectFactory.create([]));

      // Pick all collection nodes whose prerequisite skills are satisified by
      // the currently acquired skills and which have not yet been completed.
      return collection.getExplorationIds().filter(function(explorationId) {
        var collectionNode = collection.getCollectionNodeByExplorationId(
          explorationId);
        return completedExpIds.indexOf(explorationId) == -1 &&
          acquiredSkillList.isSupersetOfSkillList(
            collectionNode.getPrerequisiteSkillList());
      });
    };

    var _getCollectionNodesInPlayableOrder = function(collection) {
      var nodeList = collection.getStartingCollectionNodes();
      var completedExpIds = nodeList.map(function(collectionNode) {
        return collectionNode.getExplorationId();
      });

      var nextExpIds = _getNextExplorationIds(collection, completedExpIds);
      while (nextExpIds.length > 0) {
        completedExpIds = completedExpIds.concat(nextExpIds);
        nodeList.push(collection.getCollectionNodeByExplorationId(
            nextExpIds[0]));
        nextExpIds = _getNextExplorationIds(collection, completedExpIds);
      }
      return nodeList;
    };

    var _addAfter = function(collection, curExplorationId, newExplorationId) {
      // In order for the new node to succeed the current node, the new node
      // must require the acquired skills of the current node.
      var curCollectionNode = collection.getCollectionNodeByExplorationId(
        curExplorationId);
      var curAcquiredSkillList = curCollectionNode.getAcquiredSkillList();
      CollectionUpdateService.setPrerequisiteSkills(
        collection, newExplorationId, curAcquiredSkillList.getSkills());
    };

    var _findNodeIndex = function(linearNodeList, explorationId) {
      var index = -1;
      for (var i = 0; i < linearNodeList.length; i++) {
        if (linearNodeList[i].getExplorationId() == explorationId) {
          index = i;
          break;
        }
      }
      return index;
    };

    var _getNodeLeftOf = function(linearNodeList, nodeIndex) {
      return nodeIndex > 0 ? linearNodeList[nodeIndex - 1] : null;
    };

    var _getNodeRightOf = function(linearNodeList, nodeIndex) {
      var lastIndex = linearNodeList.length - 1;
      return nodeIndex < lastIndex ? linearNodeList[nodeIndex + 1] : null;
    };

    // Swap the node at the specified index with the node immediately to the
    // left of it.
    var _swapLeft = function(collection, linearNodeList, nodeIndex) {
      // There are three cases when swapping a node left:
      //   1. There is a node right of it but not left
      //   2. There is a node left of it but not right
      //   3. There are nodes both to the left and right of it

      var node = linearNodeList[nodeIndex];
      var leftNode = _getNodeLeftOf(linearNodeList, nodeIndex);
      var rightNode = _getNodeRightOf(linearNodeList, nodeIndex);
      if (!leftNode) {
        // Case 1 is a no-op: there's nothing to swap with.
        return;
      }

      // Case 2 involves two shifts. Take for instance: a->b
      // First, b needs to have the same prerequisites as a: a, b
      var leftPrereqSkills = leftNode.getPrerequisiteSkillList().getSkills();
      CollectionUpdateService.setPrerequisiteSkills(
        collection, node.getExplorationId(), leftPrereqSkills);

      // Second, a needs to prerequire b's acquired skills: b->a
      var centerAcquiredSkills = node.getAcquiredSkillList().getSkills();
      CollectionUpdateService.setPrerequisiteSkills(
        collection, leftNode.getExplorationId(), centerAcquiredSkills);

      if (rightNode) {
        // Case 3 has a third shift beyond case two. With example: a->b->c
        // Step 1: a, b->c
        // Step 2: b->c
        //          \
        //           -a
        // Step 3 involves updating c to prerequire a's acquired skills: b->a->c
        var leftAcquiredSkills = leftNode.getAcquiredSkillList().getSkills();
        CollectionUpdateService.setPrerequisiteSkills(
          collection, rightNode.getExplorationId(), leftAcquiredSkills);
      }
    };
    var _swapRight = function(collection, linearNodeList, nodeIndex) {
      // Swapping right is the same as swapping the node one to the right
      // leftward.
      if (nodeIndex < linearNodeList.length - 1) {
        _swapLeft(collection, linearNodeList, nodeIndex + 1);
      }
      // Otherwise it is a no-op (cannot swap the last node right).
    };

    var _shiftNode = function(collection, explorationId, swapFunction) {
      // There is nothing to shift if the collection has only 1 node.
      if (collection.getCollectionNodeCount() > 1) {
        var linearNodeList = _getCollectionNodesInPlayableOrder(collection);
        var nodeIndex = _findNodeIndex(linearNodeList, explorationId);
        if (nodeIndex == -1) {
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
       * collection is immediately playablen by the user. NOTE: This function
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
       * exploration summary backend object. This will use the exploration's
       * title as its implicit skill that is acquired when it is completed as
       * part of the collection. This skill will not be updated if the title of
       * the exploration changes in the future.
       */
      appendCollectionNode: function(
          collection, explorationId, summaryBackendObject) {
        var linearNodeList = _getCollectionNodesInPlayableOrder(collection);
        CollectionUpdateService.addCollectionNode(
          collection, explorationId, summaryBackendObject);
        CollectionUpdateService.setAcquiredSkills(
          collection, explorationId, [summaryBackendObject.title]);

        if (linearNodeList.length > 0) {
          var lastNode = linearNodeList[linearNodeList.length - 1];
          _addAfter(collection, lastNode.getExplorationId(), explorationId);
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
        // Relinking is only needed if more than just the specified node is in
        // the collection.
        if (collection.getCollectionNodeCount() > 1) {
          var linearNodeList = _getCollectionNodesInPlayableOrder(collection);
          var nodeIndex = _findNodeIndex(linearNodeList, explorationId);
          if (nodeIndex == -1) {
            return false;
          }

          // Ensure any present left/right nodes are appropriately linked after
          // the node is removed.
          var leftNode = _getNodeLeftOf(linearNodeList, nodeIndex);
          var rightNode = _getNodeRightOf(linearNodeList, nodeIndex);
          var newPrerequisiteSkills = [];
          if (leftNode) {
            newPrerequisiteSkills = leftNode.getAcquiredSkillList().getSkills();
          }
          if (rightNode) {
            CollectionUpdateService.setPrerequisiteSkills(
              collection, rightNode.getExplorationId(), newPrerequisiteSkills);
          }
        }
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
        return _shiftNode(collection, explorationId, _swapLeft);
      },

      /**
       * Looks up a collection node given an exploration ID in the specified
       * collection and attempts to shift it right in the linear ordering of the
       * collection. If the node is the last exploration played by the player,
       * then this function is a no-op. Returns false if the specified
       * exploration ID does not associate to any nodes in the collection.
       */
      shiftNodeRight: function(collection, explorationId) {
        return _shiftNode(collection, explorationId, _swapRight);
      }
    };
  }]);
