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
 * @fileoverview Unit Tests for CollectionPlayerBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { CollectionNodeBackendDict } from 'domain/collection/collection-node.model';
import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { GuestCollectionProgressService } from 'domain/collection/guest-collection-progress.service';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { UserInfo } from 'domain/user/user-info.model';
import { UserService } from 'services/user.service';
import { CollectionPlayerBackendApiService } from './collection-player-backend-api.service';

describe('Collection Player Backend Api Service', () => {
  let cpbas: CollectionPlayerBackendApiService;
  let httpTestingController: HttpTestingController;
  let sampleCollection: Collection;
  let sampleCollectionBackendObject: CollectionBackendDict;
  let collectionNodeBackendObject: CollectionNodeBackendDict;
  let readOnlyCollectionBackendApiService:
    ReadOnlyCollectionBackendApiService;
  let userService: UserService;
  let guestCollectionProgressService: GuestCollectionProgressService;

  const userInfoForCollectionCreator = new UserInfo(
    ['USER_ROLE'], true, false, false, false, true,
    'en', 'username1', 'tester@example.com', true
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    cpbas = TestBed.inject(CollectionPlayerBackendApiService);
    readOnlyCollectionBackendApiService =
      TestBed.inject(ReadOnlyCollectionBackendApiService);
    guestCollectionProgressService = TestBed.inject(
      GuestCollectionProgressService);
    userService = TestBed.inject(UserService);

    collectionNodeBackendObject = {
      exploration_id: 'exp_id',
      exploration_summary: {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      }
    };

    sampleCollectionBackendObject = {
      id: 'collectionId',
      title: 'title',
      objective: 'objective',
      category: 'category',
      version: 1,
      nodes: [
        collectionNodeBackendObject,
        collectionNodeBackendObject,
        collectionNodeBackendObject,
        collectionNodeBackendObject,
        collectionNodeBackendObject,
        collectionNodeBackendObject
      ],
      language_code: null,
      schema_version: null,
      tags: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };

    sampleCollection = Collection.create(sampleCollectionBackendObject);
    sampleCollectionBackendObject.nodes = [collectionNodeBackendObject];
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
  }));

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return response for collection summary', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));
    spyOn(guestCollectionProgressService, 'hasCompletedSomeExploration')
      .and.returnValue(true);
    let requestUrl = '/collectionsummarieshandler/data?' +
    'stringified_collection_ids=%5B%22collectionId%22%5D';

    cpbas.fetchCollectionSummariesAsync('collectionId').then(
      (dataUrl) => {
        expect(dataUrl).toEqual({ stringified_collection_ids: '' });
      });

    const req2 = httpTestingController.expectOne(requestUrl);
    expect(req2.request.method).toEqual('GET');
    req2.flush({stringified_collection_ids: ''});

    flushMicrotasks();
  }));
});
