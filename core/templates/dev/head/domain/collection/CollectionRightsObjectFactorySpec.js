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
 * @fileoverview Tests for CollectionRightsObjectFactory.
 */

describe('Collection rights object factory', function() {
  var CollectionRightsObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    CollectionRightsObjectFactory = $injector.get(
      'CollectionRightsObjectFactory');
  }));

  it('should be able to set public', function() {
    var initialCollectionRightsBackendObject = {
      collection_id: 0,
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A']
    };

    sampleCollectionRights = CollectionRightsObjectFactory.create(
      initialCollectionRightsBackendObject);
    expect(sampleCollectionRights.isPrivate()).toBe(true);

    sampleCollectionRights.setPublic();
    expect(sampleCollectionRights.isPrivate()).toBe(false);
  });

  it('should be able to set private when canUnpublish is true', function() {
    var initialCollectionRightsBackendObject = {
      collection_id: 0,
      can_edit: true,
      can_unpublish: true,
      is_private: false,
      owner_names: ['A']
    };

    sampleCollectionRights = CollectionRightsObjectFactory.create(
      initialCollectionRightsBackendObject);
    expect(sampleCollectionRights.isPrivate()).toBe(false);

    sampleCollectionRights.setPrivate();
    expect(sampleCollectionRights.isPrivate()).toBe(true);
  });

  it('should not be able to set private when canUnpublish is false',
     function() {
    var noUnpublishCollectionRightsBackendObject = {
      collection_id: 0,
      can_edit: true,
      can_unpublish: false,
      is_private: false,
      owner_names: ['A']
    };

    sampleCollectionRights = CollectionRightsObjectFactory.create(
      noUnpublishCollectionRightsBackendObject);
    expect(sampleCollectionRights.isPrivate()).toBe(false);

    sampleCollectionRights.setPrivate();
    expect(sampleCollectionRights.isPrivate()).toBe(false);
  });
});
