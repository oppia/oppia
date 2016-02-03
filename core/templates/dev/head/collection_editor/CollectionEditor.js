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
 * @fileoverview Primary controller for the collection editor page.
 *
 * @author mgowano@google.com (Abraham Mgowano)
 */

// TODO(bhenning): These constants should be provided by the backend.
oppia.constant(
  'COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');
oppia.constant(
  'WRITABLE_COLLECTION_DATA_URL_TEMPLATE',
  '/collection_editor_handler/data/<collection_id>');

oppia.controller('CollectionEditor', ['$scope',
  'WritableCollectionBackendApiService', 'SkillListObjectFactory',
  'warningsData', function(
    $scope, WritableCollectionBackendApiService, SkillListObjectFactory,
    warningsData) {
    $scope.collection = null;
    $scope.collectionId = GLOBALS.collectionId;
    $scope.collectionSkillList = SkillListObjectFactory.create([]);

    // Get the id of the collection to be loaded
    var pathnameArray = window.location.pathname.split('/');
    for (var i = 0; i < pathnameArray.length; i++) {
      if (pathnameArray[i] === 'create') {
        $scope.collectionId = pathnameArray[i + 1];
        break;
      }
    }

    // Load the collection to be edited.
    WritableCollectionBackendApiService.fetchWritableCollection(
      $scope.collectionId).then(
        function(collection) {
          $scope.collection = collection;
          $scope.collectionSkillList.setSkills(collection.skills);
        }, function(error) {
          warningsData.addWarning(
            error || 'There was an error loading the collection.');
        });

    var _getCollectionNodeByExplorationId = function(explorationId) {
      for (var i = 0; i < $scope.collection.nodes.length; i++) {
        var collectionNode = $scope.collection.nodes[i];
        if (collectionNode.exploration_id == explorationId) {
          return collectionNode;
        }
      }
      return null;
    };

    // To be used after mutating the prerequisite and/or acquired skill lists.
    var _resetSkillList = function() {
      // TODO(bhenning): This can be made far more optimal once individual
      // prerequisite and acquired skill lists are also stored in the skill list
      // frontend domain object.
      $scope.collectionSkillList.clearSkills();
      for (var i = 0; i < $scope.collection.nodes.length; i++) {
        var collectionNode = $scope.collection.nodes[i];
        var prerequisiteSkills = SkillListObjectFactory.create(
          collectionNode.prerequisite_skills);
        var acquiredSkills = SkillListObjectFactory.create(
          collectionNode.acquired_skills);
        $scope.collectionSkillList.concatSkillList(prerequisiteSkills);
        $scope.collectionSkillList.concatSkillList(acquiredSkills);
      }
      $scope.collectionSkillList.sortSkills();
    };

    // Stores a pending list of changes.
    $scope.changeList = [];

    $scope.addChange = function(change) {
      $scope.changeList.push(change);
    };

    $scope.addPrerequisiteSkill = function(skillName, explorationId) {
      var collectionNode = _getCollectionNodeByExplorationId(explorationId);
      var prerequisiteSkills = collectionNode.prerequisite_skills;
      prerequisiteSkills.push(skillName);
      _resetSkillList();
    };

    $scope.deletePrerequisiteSkill = function(skillIndex, explorationId) {
      var collectionNode = _getCollectionNodeByExplorationId(explorationId);
      var prerequisiteSkills = collectionNode.prerequisite_skills;
      var skillName = prerequisiteSkills[skillIndex];
      prerequisiteSkills.splice(skillIndex, 1);
      _resetSkillList();
    };

    $scope.addAcquiredSkill = function(skillName, explorationId) {
      var collectionNode = _getCollectionNodeByExplorationId(explorationId);
      var acquiredSkills = collectionNode.acquired_skills;
      acquiredSkills.push(skillName);
      _resetSkillList();
    };

    $scope.deleteAcquiredSkill = function(skillIndex, explorationId) {
      var collectionNode = _getCollectionNodeByExplorationId(explorationId);
      var acquiredSkills = collectionNode.acquired_skills;
      var skillName = acquiredSkills[skillIndex];
      acquiredSkills.splice(skillIndex, 1);
      _resetSkillList();
    };

    $scope.deleteCollectionNode = function(explorationId) {
      for (var i = 0; i < $scope.collection.nodes.length; i++) {
        var collectionNode = $scope.collection.nodes[i];
        if (collectionNode.exploration_id == explorationId) {
          $scope.collection.nodes.splice(i, 1);
          return;
        }
      }
      warningsData.fatalWarning(
        'Internal collection editor error. Could not delete exploration by ' +
        'ID: ' + explorationId);
    };

    $scope.hasCollectionNode = function(explorationId) {
      return _getCollectionNodeByExplorationId(explorationId) != null;
    };

    $scope.addCollectionNode = function(explorationId) {
      if (!_getCollectionNodeByExplorationId(explorationId)) {
        var newNode = {
          exploration_id: explorationId,
          acquired_skills: [],
          prerequisite_skills: [],
          exploration: {
            id: explorationId,
            exists: true,
            newlyCreated: true
          }
        };
        $scope.collection.nodes.push(newNode);
        return true;
      } else {
      }
    };

    $scope.setCollectionTitle = function(newTitle) {
      $scope.collection.title = newTitle;
    };

    $scope.setCollectionObjective = function(newObjective) {
      $scope.collection.objective = newObjective;
    };

    $scope.setCollectionCategory = function(newCategory) {
      $scope.collection.category = newCategory;
    };

    // An explicit save is needed to push all changes to the backend at once
    // because some likely working states of the collection will cause
    // validation errors when trying to incrementally save them.
    $scope.saveCollection = function(commitMessage) {
      // Don't attempt to save the collection if there are no changes pending.
      if ($scope.changeList.length == 0) {
        return;
      }
      WritableCollectionBackendApiService.updateCollection(
        $scope.collection.id, $scope.collection.version, commitMessage,
        $scope.changeList).then(function(collection) {
          $scope.collection = collection;
          $scope.changeList = [];
        }, function(error) {
          warningsData.addWarning(
            error || 'There was an error updating the collection.');
        });
    };
  }]);
