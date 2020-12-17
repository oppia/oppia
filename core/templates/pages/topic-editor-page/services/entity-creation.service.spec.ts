// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EntityCreationService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// topic-editor-state.service.ts is upgraded to Angular 8.
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SpyLocation } from '@angular/common/testing';
import { Location } from '@angular/common';

import { TopicEditorRoutingService } from './topic-editor-routing.service';
import { angularServices } from 'services/angular-services.index';
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

describe('Entity creation service', function() {
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();

  var $rootScope = null;
  var $uibModal = null;
  var $q = null;
  var TopicObjectFactory = null;
  var TopicEditorStateService = null;
  let topicEditorRoutingService : TopicEditorRoutingService;
  let location;
  var EntityCreationService = null;
  var SubtopicObjectFactory = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TopicEditorRoutingService,
        {provide: Location, useClass: SpyLocation}]
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    for (let servicePair of angularServices) {
      $provide.value(
        servicePair[0], TestBed.get(servicePair[1]));
    }
    $provide.value(
      'TopicEditorRoutingService', TestBed.get(TopicEditorRoutingService));
    topicEditorRoutingService = TestBed.get(TopicEditorRoutingService);
    location = TestBed.get(Location);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    $uibModal = $injector.get('$uibModal');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    EntityCreationService = $injector.get('EntityCreationService');

    var topic = TopicObjectFactory.createInterstitialTopic();
    var subtopic1 = SubtopicObjectFactory.createFromTitle(1, 'Subtopic1');
    var subtopic2 = SubtopicObjectFactory.createFromTitle(1, 'Subtopic2');
    var subtopic3 = SubtopicObjectFactory.createFromTitle(1, 'Subtopic3');
    topic.getSubtopics = function() {
      return [subtopic1, subtopic2, subtopic3];
    };
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
  }));


  it('should call TopicEditorRoutingService to navigate to subtopic editor',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve('1')
      });

      var routingSpy = (
        spyOn(topicEditorRoutingService, 'navigateToSubtopicEditorWithId'));
      EntityCreationService.createSubtopic();
      $rootScope.$apply();
      expect(routingSpy).toHaveBeenCalledWith('1');
    });

  it('should open create subtopic modal', function() {
    var spy = spyOn($uibModal, 'open').and.callThrough();
    EntityCreationService.createSubtopic();

    expect(spy).toHaveBeenCalled();
  });

  it('should return subtopic Id from URL', function() {
    location.go('/subtopic_editor/2');
    expect(topicEditorRoutingService.getSubtopicIdFromUrl()).toEqual(2);
  });
});
