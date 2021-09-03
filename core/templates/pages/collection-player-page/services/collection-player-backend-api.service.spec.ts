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
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { CollectionNodeBackendDict } from 'domain/collection/collection-node.model';
import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { CollectionPlayerBackendApiService } from './collection-player-backend-api.service';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Collection Player Backend Api Service', () => {
  let cpbas: CollectionPlayerBackendApiService;
  let httpTestingController: HttpTestingController;
  let sampleCollection: Collection;
  let sampleCollectionBackendObject: CollectionBackendDict;
  let collectionNodeBackendObject: CollectionNodeBackendDict;
  let readOnlyCollectionBackendApiService:
    ReadOnlyCollectionBackendApiService;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;
  let alertsService: AlertsService;
  let collectionHandlerResponse;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    cpbas = TestBed.inject(CollectionPlayerBackendApiService);
    readOnlyCollectionBackendApiService =
      TestBed.inject(ReadOnlyCollectionBackendApiService);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
    alertsService = TestBed.inject(AlertsService);

    collectionHandlerResponse = {
      can_edit: true,
      collection: sampleCollection,
      is_admin: true,
      is_logged_in: true,
      is_moderator: true,
      is_super_admin: true,
      is_topic_manager: true,
      meta_description: 'meta_description',
      meta_name: 'meta_name',
      session_id: 'session_id',
      user_email: '123@gmail.com',
      username: 'username',
    };

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
        thumbnail_bg_color: '#cd672b',
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
    sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return response for collection summary', fakeAsync(() => {
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

  it('should not return response for collection summary', fakeAsync(() => {
    let requestUrl = '/collectionsummarieshandler/data?' +
    'stringified_collection_ids=%5B%22collectionId%22%5D';

    cpbas.fetchCollectionSummariesAsync(
      'collectionId').then(successHandler, failHandler);

    spyOn(cpbas, 'fetchCollectionSummariesAsync').and.callThrough();
    const req2 = httpTestingController.expectOne(requestUrl);
    expect(req2.request.method).toEqual('GET');

    req2.flush({
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'There was an error while fetching the collection summary.');
  }));

  it('should elements with attributes', fakeAsync(() => {
    let requestUrl = '/collectionsummarieshandler/data/collectionId';

    cpbas.bindAttr('collectionId');
    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');

    var angularElementSpy = spyOn(angular, 'element');

    var elementNameItemProp = $('<div>');
    angularElementSpy.withArgs(
      'meta[itemprop="name"]').and.returnValue(elementNameItemProp);

    var elementDescriptionItemProp = $('<div>');
    angularElementSpy.withArgs(
      'meta[itemprop="description"]').and.returnValue(
      elementDescriptionItemProp);

    var elementTitleProperty = $('<div>');
    angularElementSpy.withArgs(
      'meta[property="og:title"]').and.returnValue(elementTitleProperty);

    var elementDescriptionProperty = $('<div>');
    angularElementSpy.withArgs(
      'meta[property="og:description"]').and.returnValue(
      elementDescriptionProperty);

    expect(elementNameItemProp.attr('content')).toBe(sampleCollection.title);
    expect(elementDescriptionItemProp.attr('content')).toBe(
      sampleCollection.objective);
    expect(elementTitleProperty.attr('content')).toBe(sampleCollection.title);
    expect(elementDescriptionProperty.attr('content')).toBe(
      sampleCollection.objective);
  }));
});
