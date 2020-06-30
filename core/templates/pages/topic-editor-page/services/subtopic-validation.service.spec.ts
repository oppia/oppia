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
 * @fileoverview Unit tests for SubtopicValidationService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// topic-editor-state.service.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.


describe('Subtopic validation service', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  var TopicObjectFactory = null;
  var TopicEditorStateService = null;
  var EntityCreationService = null;
  var SubtopicValidationService = null;
  var SubtopicObjectFactory = null;

  beforeEach(angular.mock.inject(function($injector) {
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');
    EntityCreationService = $injector.get('EntityCreationService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    SubtopicValidationService = $injector.get('SubtopicValidationService');

    var topic = TopicObjectFactory.createInterstitialTopic();
    var subtopic1 = SubtopicObjectFactory.createFromTitle(1, 'Subtopic1');
    var subtopic2 = SubtopicObjectFactory.createFromTitle(1, 'Subtopic2');
    var subtopic3 = SubtopicObjectFactory.createFromTitle(1, 'Subtopic3');
    topic.getSubtopics = function() {
      return [subtopic1, subtopic2, subtopic3];
    };
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
  }));

  it('should validate subtopic name correctly', function() {
    expect(SubtopicValidationService.checkValidSubtopicName(
      'Random name')).toEqual(true);
    expect(SubtopicValidationService.checkValidSubtopicName(
      'Subtopic1')).toEqual(false);
    expect(SubtopicValidationService.checkValidSubtopicName(
      'Subtopic2')).toEqual(false);
    expect(SubtopicValidationService.checkValidSubtopicName(
      'Subtopic3')).toEqual(false);
    expect(SubtopicValidationService.checkValidSubtopicName(
      'Subtopic4')).toEqual(true);
  });
});
