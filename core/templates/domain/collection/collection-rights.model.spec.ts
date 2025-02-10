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
 * @fileoverview Tests for Collection Rights Model.
 */

import {CollectionRights} from 'domain/collection/collection-rights.model';

describe('Collection rights model', () => {
  it('should not be able to modify owner names', () => {
    var initialCollectionRightsBackendObject = {
      collection_id: '',
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A'],
    };

    var sampleCollectionRights = CollectionRights.create(
      initialCollectionRightsBackendObject
    );
    var ownerNames = sampleCollectionRights.getOwnerNames();
    ownerNames.push('B');

    expect(sampleCollectionRights.getOwnerNames()).toEqual(['A']);
  });

  it('should accept accept changes to the bindable list of collection nodes', () => {
    var initialCollectionRightsBackendObject = {
      collection_id: '',
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A'],
    };

    var sampleCollectionRights = CollectionRights.create(
      initialCollectionRightsBackendObject
    );
    var ownerNames = sampleCollectionRights.getBindableOwnerNames();
    ownerNames.push('B');

    expect(sampleCollectionRights.getOwnerNames()).toEqual(['A', 'B']);
  });

  it('should be able to set public when canEdit is true', () => {
    var initialCollectionRightsBackendObject = {
      collection_id: '',
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A'],
    };

    var sampleCollectionRights = CollectionRights.create(
      initialCollectionRightsBackendObject
    );
    expect(sampleCollectionRights.isPrivate()).toBe(true);
    expect(sampleCollectionRights.isPublic()).toBe(false);

    sampleCollectionRights.setPublic();
    expect(sampleCollectionRights.isPrivate()).toBe(false);
    expect(sampleCollectionRights.isPublic()).toBe(true);
  });

  it('should throw error and not be able to set public when canEdit is false', () => {
    var initialCollectionRightsBackendObject = {
      collection_id: '',
      can_edit: false,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A'],
    };

    var sampleCollectionRights = CollectionRights.create(
      initialCollectionRightsBackendObject
    );
    expect(sampleCollectionRights.isPrivate()).toBe(true);
    expect(sampleCollectionRights.isPublic()).toBe(false);

    expect(() => {
      sampleCollectionRights.setPublic();
    }).toThrowError('User is not allowed to edit this collection.');
    expect(sampleCollectionRights.isPrivate()).toBe(true);
    expect(sampleCollectionRights.isPublic()).toBe(false);
  });

  it('should be able to set private when canUnpublish is true', () => {
    var initialCollectionRightsBackendObject = {
      collection_id: '',
      can_edit: true,
      can_unpublish: true,
      is_private: false,
      owner_names: ['A'],
    };

    var sampleCollectionRights = CollectionRights.create(
      initialCollectionRightsBackendObject
    );
    expect(sampleCollectionRights.isPrivate()).toBe(false);
    expect(sampleCollectionRights.isPublic()).toBe(true);

    sampleCollectionRights.setPrivate();
    expect(sampleCollectionRights.isPrivate()).toBe(true);
    expect(sampleCollectionRights.isPublic()).toBe(false);
  });

  it('should throw error when when canUnpublish is false during unpublishing', () => {
    var noUnpublishCollectionRightsBackendObject = {
      collection_id: '',
      can_edit: true,
      can_unpublish: false,
      is_private: false,
      owner_names: ['A'],
    };

    var sampleCollectionRights = CollectionRights.create(
      noUnpublishCollectionRightsBackendObject
    );
    expect(sampleCollectionRights.isPrivate()).toBe(false);
    expect(sampleCollectionRights.isPublic()).toBe(true);

    expect(() => {
      sampleCollectionRights.setPrivate();
    }).toThrowError('User is not allowed to unpublish this collection.');
    // Verify that the status remains unchanged.
    expect(sampleCollectionRights.isPrivate()).toBe(false);
    expect(sampleCollectionRights.isPublic()).toBe(true);
  });

  it('should create an empty collection rights object', () => {
    var emptyCollectionRightsBackendObject =
      CollectionRights.createEmptyCollectionRights();

    expect(emptyCollectionRightsBackendObject.getCollectionId()).toBeNull();
    expect(emptyCollectionRightsBackendObject.canEdit()).toBeNull();
    expect(emptyCollectionRightsBackendObject.canUnpublish()).toBeNull();
    expect(emptyCollectionRightsBackendObject.isPrivate()).toBeNull();
    expect(emptyCollectionRightsBackendObject.getOwnerNames()).toEqual([]);
  });

  it('should make a copy from another collection rights', () => {
    var noUnpublishCollectionRightsBackendObject = {
      collection_id: '',
      can_edit: true,
      can_unpublish: false,
      is_private: false,
      owner_names: ['A'],
    };

    var sampleCollectionRights = CollectionRights.create(
      noUnpublishCollectionRightsBackendObject
    );

    var emptyCollectionRightsBackendObject =
      CollectionRights.createEmptyCollectionRights();

    emptyCollectionRightsBackendObject.copyFromCollectionRights(
      sampleCollectionRights
    );
    expect(emptyCollectionRightsBackendObject.getCollectionId()).toEqual('');
    expect(emptyCollectionRightsBackendObject.canEdit()).toBe(true);
    expect(emptyCollectionRightsBackendObject.canUnpublish()).toBe(false);
    expect(emptyCollectionRightsBackendObject.isPrivate()).toBe(false);
    expect(emptyCollectionRightsBackendObject.getOwnerNames()).toEqual(['A']);
  });
});
