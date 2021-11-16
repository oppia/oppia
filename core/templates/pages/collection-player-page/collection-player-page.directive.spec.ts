// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 * @fileoverview Unit tests for the Collection player page directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AlertsService } from 'services/alerts.service';
import { GuestCollectionProgressService } from 'domain/collection/guest-collection-progress.service';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { UserService } from 'services/user.service';
import { UrlService } from 'services/contextual/url.service';
import { Collection } from 'domain/collection/collection.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { CollectionPlaythrough } from 'domain/collection/collection-playthrough.model';
import { UserInfo } from 'domain/user/user-info.model';

describe('Collection player page directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $http = null;
  let $httpBackend = null;
  let directive = null;
  let alertsService: AlertsService = null;
  let guestCollectionProgressService:
    GuestCollectionProgressService = null;
  let readOnlyCollectionBackendApiService:
    ReadOnlyCollectionBackendApiService = null;
  let userService: UserService = null;
  let urlService: UrlService = null;
  let urlInterpolationService: UrlInterpolationService = null;

  let $anchorScroll = jasmine.createSpy('anchorScroll');
  let alertsSpy = null;
  let sampleCollection = null;
  let sampleCollectionBackendObject = null;
  let collectionNodesList = null;
  let collectionNodeBackendObject = null;

  const userInfoForCollectionCreator = new UserInfo(
    ['USER_ROLE'], true, false, false, false, true,
    'en', 'username1', 'tester@example.com', true
  );


  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $http = $injector.get('$http');
    $httpBackend = $injector.get('$httpBackend');
    $scope = $rootScope.$new();
    alertsService = $injector.get('AlertsService');
    userService = $injector.get('UserService');
    urlService = $injector.get('UrlService');
    urlInterpolationService = $injector.get('UrlInterpolationService');
    guestCollectionProgressService = $injector.get(
      'GuestCollectionProgressService');
    readOnlyCollectionBackendApiService = $injector.get(
      'ReadOnlyCollectionBackendApiService');

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

    collectionNodesList = [
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '225px',
        top: '35px',
        thumbnailBgColor: '#cd672b'
      },
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '395px',
        top: '145px',
        thumbnailBgColor: '#cd672b'
      },
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '225px',
        top: '255px',
        thumbnailBgColor: '#cd672b'
      },
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '55px',
        top: '365px',
        thumbnailBgColor: '#cd672b'
      },
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '225px',
        top: '475px',
        thumbnailBgColor: '#cd672b'
      },
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '395px',
        top: '585px',
        thumbnailBgColor: '#cd672b'
      }
    ];

    sampleCollection = Collection.create(
      sampleCollectionBackendObject);

    spyOn(urlService, 'getCollectionIdFromUrl').and.returnValue('collectionId');
    alertsSpy = spyOn(alertsService, 'addWarning').and.returnValue(null);

    directive = $injector.get('collectionPlayerPageDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope,
      $http: $http,
      $anchorScroll: $anchorScroll,
      WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS: ['collectionId']
    });
  }));

  it('should set properties when initialized', fakeAsync(function() {
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(guestCollectionProgressService, 'hasCompletedSomeExploration')
      .and.returnValue(true);
    spyOn(document, 'addEventListener').and.callFake((eventName, handler) => {
      setTimeout(() =>{
        ctrl.explorationCardIsShown = true;
        handler();
      });
    });
    $httpBackend.expect('GET', '/collection_handler/data/collectionId')
      .respond({
        data: {
          meta_name: 'meta_name',
          meta_description: 'meta_description'
        }
      });
    $httpBackend.expect(
      'GET', '/collectionsummarieshandler/data' +
      '?stringified_collection_ids=' +
      encodeURI(JSON.stringify(['collectionId']))).respond({
      data: {
        summaries: []
      }
    });

    ctrl.$onInit();
    $httpBackend.flush();
    tick();

    expect(ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX).toBe(220);
    expect(ctrl.ODD_SVG_HEIGHT_OFFSET_PX).toBe(150);
    expect(ctrl.ICON_Y_INITIAL_PX).toBe(35);
    expect(ctrl.ICON_Y_INCREMENT_PX).toBe(110);
    expect(ctrl.ICON_X_MIDDLE_PX).toBe(225);
    expect(ctrl.ICON_X_LEFT_PX).toBe(55);
    expect(ctrl.ICON_X_RIGHT_PX).toBe(395);
    expect(ctrl.collection).toEqual(sampleCollection);
  }));

  it('should throw warning message when an invalid collection ' +
    'is fetched from backend', fakeAsync(function() {
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.rejectWith();
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    ctrl.$onInit();
    $scope.$apply();
    tick();

    expect(alertsSpy).toHaveBeenCalledWith(
      'There was an error loading the collection.');
  }));

  it('should throw warning message when an invalid collection summary ' +
    'is fetched from the backend', fakeAsync(function() {
    ctrl.collection = sampleCollection;
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));
    $httpBackend.expect('GET', '/collection_handler/data/collectionId')
      .respond({
        data: {
          meta_name: 'meta_name',
          meta_description: 'meta_description'
        }
      });
    $httpBackend.expect(
      'GET', '/collectionsummarieshandler/data' +
      '?stringified_collection_ids=' +
      encodeURI(JSON.stringify(['collectionId']))).respond(500);

    ctrl.$onInit();
    $scope.$apply();
    $httpBackend.flush();
    tick();

    expect(alertsSpy).toHaveBeenCalledWith(
      'There was an error while fetching the collection summary.');
  }));

  it('should scroll to the given location when calling ' +
    '\scrollToLocation\'', function() {
    ctrl.scrollToLocation('location');

    expect($anchorScroll).toHaveBeenCalled();
  });

  it('should stop event propagation when click event is emitted', () => {
    let eventSpy = jasmine.createSpyObj(
      'event', ['stopPropagation']);

    ctrl.onClickStopPropagation(eventSpy);

    expect(eventSpy.stopPropagation).toHaveBeenCalled();
  });

  it('should close exploration card on clicking outside', () => {
    ctrl.explorationCardIsShown = true;

    ctrl.closeOnClickingOutside();

    expect(ctrl.explorationCardIsShown).toBe(false);
  });

  it('should return exploration title position given index ' +
    'when calling \'getExplorationTitlePosition\'', function() {
    // Case 1.
    let result = ctrl.getExplorationTitlePosition(2);
    expect(result).toBe('8px');

    // Case 2.
    result = ctrl.getExplorationTitlePosition(1);
    expect(result).toBe('30px');

    // Case 3.
    result = ctrl.getExplorationTitlePosition(3);
    expect(result).toBe('-40px');
  });

  it('should return exploration url given exploration id', function() {
    ctrl.collectionId = 'colId1';
    let url = ctrl.getExplorationUrl('id1');

    expect(url).toBe('/explore/id1?collection_id=colId1');
  });

  it('should generate path icon parameters', fakeAsync(function() {
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    ctrl.$onInit();
    tick();
    let pathIconParameters = ctrl.generatePathIconParameters();

    expect(pathIconParameters).toEqual(collectionNodesList);
  }));

  it('should check whether the exploration is completed', fakeAsync(function() {
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    ctrl.$onInit();
    tick();
    let result = ctrl.isCompletedExploration();

    expect(result).toEqual(false);
  }));

  it('should trigger \'$watch\' when collection is ' +
    'updated', fakeAsync(function() {
    let $watchSpy = spyOn($scope, '$watch').and.callThrough();
    sampleCollectionBackendObject.nodes = [collectionNodeBackendObject];
    sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    ctrl.$onInit();
    tick();

    ctrl.collection = sampleCollection;
    $scope.$digest();
    expect($watchSpy).toHaveBeenCalled();
  }));

  it('should generate empty path parameters when collection ' +
    'node count is one', fakeAsync(function() {
    sampleCollectionBackendObject.nodes = [collectionNodeBackendObject];
    sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    ctrl.$onInit();
    tick();
    ctrl.generatePathParameters();

    expect(ctrl.pathSvgParameters).toBe('');
  }));

  it('should generate path parameters when collection ' +
    'node count is two', fakeAsync(function() {
    sampleCollectionBackendObject.nodes = [
      collectionNodeBackendObject,
      collectionNodeBackendObject
    ];
    sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    ctrl.$onInit();
    tick();
    ctrl.generatePathParameters();

    expect(ctrl.pathSvgParameters).toBe('M250 80  C 470 100, 470 280, 250 300');
  }));

  it('should generate path parameters when collection ' +
    'node count is three', fakeAsync(function() {
    sampleCollectionBackendObject.nodes = [
      collectionNodeBackendObject,
      collectionNodeBackendObject,
      collectionNodeBackendObject
    ];
    sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);

    // Loading collections.
    ctrl.$onInit();
    tick();
    ctrl.generatePathParameters();

    expect(ctrl.pathSvgParameters).toBe('M250 80  C 470 100, 470 280, 250 300');
  }));

  it('should generate path parameters when collection ' +
    'node count is four', fakeAsync(function() {
    sampleCollectionBackendObject.nodes = [
      collectionNodeBackendObject,
      collectionNodeBackendObject,
      collectionNodeBackendObject,
      collectionNodeBackendObject
    ];
    sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    ctrl.$onInit();
    tick();
    ctrl.generatePathParameters();

    expect(ctrl.pathSvgParameters).toBe(
      'M250 80  C 470 100, 470 280, 250 300 S 30 500, 250 520, ');
  }));

  it('should return static image url given image path', function() {
    let urlInterpolationSpy = spyOn(
      urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('imageUrl');

    let url = ctrl.getStaticImageUrl('/imagepath');

    expect(urlInterpolationSpy).toHaveBeenCalledWith('/imagepath');
    expect(url).toBe('imageUrl');
  });

  it('should set icon hight when calling \'setIconHighlight\'', function() {
    // Default value.
    ctrl.activeHighlightedIconIndex = -1;

    ctrl.setIconHighlight(10);
    expect(ctrl.activeHighlightedIconIndex).toBe(10);

    ctrl.unsetIconHighlight();
    expect(ctrl.activeHighlightedIconIndex).toBe(-1);
  });

  it('should toggle preview card when calling ' +
    '\'togglePreviewCard\'', function() {
    ctrl.explorationCardIsShown = false;

    ctrl.togglePreviewCard();
    expect(ctrl.explorationCardIsShown).toBe(true);

    ctrl.togglePreviewCard();
    expect(ctrl.explorationCardIsShown).toBe(false);
  });

  it('should return collecton node from exploration id', function() {
    ctrl.collection = sampleCollection;

    let result = ctrl.getCollectionNodeForExplorationId('exp_id');

    expect(result).toEqual(sampleCollection.nodes[0]);
  });

  it('should update exploration preview card when calling ' +
    '\'updateExplorationPreview\'', function() {
    ctrl.explorationCardIsShown = false;

    ctrl.collection = sampleCollection;
    ctrl.updateExplorationPreview('exp_id');

    expect(ctrl.explorationCardIsShown).toBe(true);
    expect(ctrl.currentExplorationId).toBe('exp_id');
  });

  it('should show warning message if we try to ' +
    'load a collection with invalid id', function() {
    ctrl.collection = sampleCollection;

    ctrl.getCollectionNodeForExplorationId('invalidId');

    expect(alertsSpy).toHaveBeenCalledWith(
      'There was an error loading the collection.');
  });

  it('should return next recommended collection node', fakeAsync(function() {
    ctrl.collection = sampleCollection;
    ctrl.collectionPlaythrough = (
      CollectionPlaythrough.create('exp_id', ['exp_id0']));

    let result = ctrl.getNextRecommendedCollectionNodes();

    expect(result).toEqual(sampleCollection.nodes[0]);
  }));

  it('should return completed collection node', fakeAsync(function() {
    ctrl.collection = sampleCollection;
    ctrl.collectionPlaythrough = (
      CollectionPlaythrough.create('exp_id0', ['exp_id']));

    let result = ctrl.getCompletedExplorationNodes();

    expect(result).toEqual(sampleCollection.nodes[0]);
  }));

  it('should return non recommended collection node ' +
    'count', fakeAsync(function() {
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(new UserInfo(
        ['USER_ROLE'], true, false, false, false, true,
        'en', 'username1', 'tester@example.com', false
      )));
    spyOn(guestCollectionProgressService, 'hasCompletedSomeExploration')
      .and.returnValue(true);

    // Loading collections.
    ctrl.$onInit();
    tick();

    let result = ctrl.getNonRecommendedCollectionNodeCount();
    expect(result).toEqual(5);
  }));
});
