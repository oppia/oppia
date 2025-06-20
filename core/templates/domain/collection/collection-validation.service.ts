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

import {Injectable} from '@angular/core';

import {AppConstants} from 'app.constants';
import {Collection} from 'domain/collection/collection.model';

@Injectable({
  providedIn: 'root',
})
export class CollectionValidationService {
  _getNonexistentExplorationIds(collection: Collection): string[] {
    return collection
      .getCollectionNodes()
      .filter(collectionNode => {
        return !collectionNode.doesExplorationExist();
      })
      .map(collectionNode => {
        return collectionNode.getExplorationId();
      });
  }

  _getPrivateExplorationIds(collection: Collection): string[] {
    return collection
      .getCollectionNodes()
      .filter(collectionNode => {
        return collectionNode.isExplorationPrivate();
      })
      .map(collectionNode => {
        return collectionNode.getExplorationId();
      });
  }

  // Validates that the tags for the collection are in the proper format,
  // returns true if all tags are in the correct format.
  validateTagFormat(tags: string[]): boolean {
    // Check to ensure that all tags follow the format specified in
    // TAG_REGEX.
    var tagRegex = new RegExp(AppConstants.TAG_REGEX);
    return tags.every(tag => {
      return tag.match(tagRegex);
    });
  }

  // Validates that the tags for the collection do not have duplicates,
  // returns true if there are no duplicates.
  validateDuplicateTags(tags: string[]): boolean {
    return tags.every((tag: string, idx: number) => {
      return tags.indexOf(tag, idx + 1) === -1;
    });
  }

  // Validates that the tags for the collection are normalized,
  // returns true if all tags were normalized.
  validateTagsNormalized(tags: string[]): boolean {
    return tags.every((tag: string) => {
      return tag === tag.trim().replace(/\s+/g, ' ');
    });
  }

  _validateCollection(collection: Collection, isPublic: boolean): string[] {
    // NOTE TO DEVELOPERS: Please ensure that this validation logic is the
    // same as that in core.domain.collection_domain.Collection.validate().
    var issues = [];

    var collectionHasNodes = collection.getCollectionNodeCount() > 0;
    if (!collectionHasNodes) {
      issues.push('There should be at least 1 exploration in the collection.');
    }

    var nonexistentExpIds = this._getNonexistentExplorationIds(collection);
    if (nonexistentExpIds.length !== 0) {
      issues.push(
        'The following exploration(s) either do not exist, or you do not ' +
          'have edit access to add them to this collection: ' +
          nonexistentExpIds.join(', ')
      );
    }

    if (isPublic) {
      var privateExpIds = this._getPrivateExplorationIds(collection);
      if (privateExpIds.length !== 0) {
        issues.push(
          'Private explorations cannot be added to a public collection: ' +
            privateExpIds.join(', ')
        );
      }
    }

    return issues;
  }

  /**
   * Returns a list of error strings found when validating the provided
   * collection. The validation methods used in this function are written to
   * match the validations performed in the backend. This function is
   * expensive, so it should be called sparingly.
   */
  findValidationIssuesForPrivateCollection(collection: Collection): string[] {
    return this._validateCollection(collection, false);
  }

  /**
   * Behaves in the same way as findValidationIssuesForPrivateCollection(),
   * except additional validation checks are performed which are specific to
   * public collections. This function is expensive, so it should be called
   * sparingly.
   */
  findValidationIssuesForPublicCollection(collection: Collection): string[] {
    return this._validateCollection(collection, true);
  }

  /**
   * Returns false if the tags are not validate.
   */
  isTagValid(tags: string[]): boolean {
    return (
      this.validateTagFormat(tags) &&
      this.validateDuplicateTags(tags) &&
      this.validateTagsNormalized(tags)
    );
  }
}
