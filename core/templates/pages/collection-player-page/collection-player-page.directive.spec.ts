// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Collection player page directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { LoaderService } from 'services/loader.service';
import { AlertsService } from 'services/alerts.service';
import { GuestCollectionProgressService } from 'domain/collection/guest-collection-progress.service';
import { PageTitleService } from 'services/page-title.service';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { UserService } from 'services/user.service';
import { UrlService } from 'services/contextual/url.service';
import { Collection } from 'domain/collection/collection.model';

fdescribe('Collection player page directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $http = null;
  let $httpBackend = null;
  let $anchorScroll = null;
  let $timeout = null;
  let directive = null;
  let $uibModal = null;
  let $q;
  let undoRedoService: UndoRedoService = null;
  let loaderService: LoaderService = null;
  let alertsService: AlertsService = null;
  let guestCollectionProgressService:
    GuestCollectionProgressService = null;
  let pageTitleService: PageTitleService = null;
  let readOnlyCollectionBackendApiService:
    ReadOnlyCollectionBackendApiService = null;
  let userService: UserService = null;
  let urlService: UrlService = null

  const sampleCollectionBackendObject = {
    id: 'collectionId',
    title: 'title',
    objective: 'objective',
    category: 'category',
    version: 1,
    nodes: [],
    language_code: null,
    schema_version: null,
    tags: null,
    playthrough_dict: {
      next_exploration_id: 'expId',
      completed_exploration_ids: ['expId2']
    }
  };

  const sampleCollection = Collection.create(
    sampleCollectionBackendObject);

  const userInfoForCollectionCreator = {
    _isModerator: true,
    _isAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $http = $injector.get('$http');
    $httpBackend = $injector.get('$httpBackend');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    $anchorScroll = $injector.get('$anchorScroll');
    undoRedoService = $injector.get('UndoRedoService');
    loaderService = $injector.get('LoaderService');
    alertsService = $injector.get('AlertsService');
    userService = $injector.get('UserService');
    urlService = $injector.get('UrlService');
    readOnlyCollectionBackendApiService = $injector.get(
      'ReadOnlyCollectionBackendApiService');

    directive = $injector.get('collectionPlayerPageDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope,
      $http: $http,
    });
  }));

  it('should init', fakeAsync(function() {
    spyOn(urlService, 'getCollectionIdFromUrl').and.returnValue('collectionId');
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
    $httpBackend.expect('GET', '/collectionsummarieshandler/data' +
      '?stringified_collection_ids='
      + encodeURI(JSON.stringify(['collectionId']))).respond({
      data: {
        summaries: []
      }
    });

    ctrl.$onInit();
    $scope.$apply();
    $httpBackend.flush();
    tick();
  }));
});