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
 * @fileoverview Service to validate the consistency of a collection. These
 * checks are performable in the frontend to avoid sending a potentially invalid
 * collection to the backend, which performs similar validation checks to these
 * in collection_domain.Collection and subsequent domain objects.
 */

oppia.factory('CollectionValidationService', [
  'CollectionLinearizerService',
  function(CollectionLinearizerService) {
    var _getStartingExplorationIds = function(collection) {
      var startingCollectionNodes = collection.getStartingCollectionNodes();
      return startingCollectionNodes.map(function(collectionNode) {
        return collectionNode.getExplorationId();
      });
    };

    var _getNonexistentExplorationIds = function(collection) {
      return collection.getCollectionNodes().filter(function(collectionNode) {
        return !collectionNode.doesExplorationExist();
      }).map(function(collectionNode) {
        return collectionNode.getExplorationId();
      });
    };

    var _getPrivateExplorationIds = function(collection) {
      return collection.getCollectionNodes().filter(function(collectionNode) {
        return collectionNode.isExplorationPrivate();
      }).map(function(collectionNode) {
        return collectionNode.getExplorationId();
      });
    };

    // Validates that the tags for the collection are in the proper format,
    // returns true if all tags are in the correct format.
    var validateTagFormat = function(tags) {
      // Check to ensure that all tags follow the format specified in
      // TAG_REGEX.
      var tagRegex = new RegExp(GLOBALS.TAG_REGEX);
      return tags.every(function(tag) {
        return tag.match(tagRegex);
      });
    };

    // Validates that the tags for the collection do not have duplicates,
    // returns true if there are no duplicates.
    var validateDuplicateTags = function(tags) {
      return tags.every(function(tag, idx) {
        return tags.indexOf(tag, idx + 1) === -1;
      });
    };

    // Validates that the tags for the collection are normalized,
    // returns true if all tags were normalized.
    var validateTagsNormalized = function(tags) {
      return tags.every(function(tag) {
        return tag === tag.trim().replace(/\s+/g, ' ');
      });
    };

    var _validateCollection = function(collection, isPublic) {
      // NOTE TO DEVELOPERS: Please ensure that this validation logic is the
      // same as that in core.domain.collection_domain.Collection.validate().
      var issues = [];

      var collectionHasNodes = collection.getCollectionNodeCount() > 0;
      if (!collectionHasNodes) {
        issues.push(
          'There should be at least 1 exploration in the collection.');
      }

      var startingExpIds = _getStartingExplorationIds(collection);
      if (collectionHasNodes && startingExpIds.length !== 1) {
        issues.push(
          'There should be exactly 1 exploration initially available to the ' +
          'learner.');
      }

      var nonexistentExpIds = _getNonexistentExplorationIds(collection);
      if (nonexistentExpIds.length !== 0) {
        issues.push(
          'The following exploration(s) either do not exist, or you do not ' +
          'have edit access to add them to this collection: ' +
          nonexistentExpIds.join(', '));
      }

      if (isPublic) {
        var privateExpIds = _getPrivateExplorationIds(collection);
        if (privateExpIds.length !== 0) {
          issues.push(
            'Private explorations cannot be added to a public collection: ' +
            privateExpIds.join(', '));
        }
      }

      return issues;
    };

    return {
      /**
       * Returns a list of error strings found when validating the provided
       * collection. The validation methods used in this function are written to
       * match the validations performed in the backend. This function is
       * expensive, so it should be called sparingly.
       */
      findValidationIssuesForPrivateCollection: function(collection) {
        return _validateCollection(collection, false);
      },

      /**
       * Behaves in the same way as findValidationIssuesForPrivateCollection(),
       * except additional validation checks are performed which are specific to
       * public collections. This function is expensive, so it should be called
       * sparingly.
       */
      findValidationIssuesForPublicCollection: function(collection) {
        return _validateCollection(collection, true);
      },

      /**
       * Returns false if the tags are not validate.
       */
      isTagValid: function(tags) {
        return validateTagFormat(tags) && validateDuplicateTags(tags) &&
          validateTagsNormalized(tags);
      }
    };
  }]);
