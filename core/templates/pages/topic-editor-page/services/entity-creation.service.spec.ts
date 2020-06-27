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
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Entity creation service', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  var $rootScope = null;
  var $uibModal = null;
  var $window = null;
  var $q = null;
  var $location = null;
  var SkillCreationService = null;
  var TopicObjectFactory = null;
  var TopicEditorStateService = null;
  var TopicEditorRoutingService = null;
  var EntityCreationService = null;
  var SubtopicObjectFactory = null;

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $location = $injector.get('$location');
    $window = $injector.get('$window');
    $q = $injector.get('$q');
    $uibModal = $injector.get('$uibModal');
    SkillCreationService = $injector.get('SkillCreationService');
    TopicEditorRoutingService = $injector.get('TopicEditorRoutingService');
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
        spyOn(TopicEditorRoutingService, 'navigateToSubtopicEditorWithId'));
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
    $location.path('/subtopic_editor/2');
    expect(TopicEditorRoutingService.getSubtopicIdFromUrl()).toEqual('2');
  });
});
