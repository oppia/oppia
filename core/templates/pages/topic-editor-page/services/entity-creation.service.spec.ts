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
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

import { Subtopic } from 'domain/topic/subtopic.model';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fakeAsync, tick } from '@angular/core/testing';

describe('Entity creation service', function() {
  importAllAngularServices();

  var $rootScope = null;
  var topic = null;
  var TopicObjectFactory = null;
  var TopicEditorStateService = null;
  var TopicEditorRoutingService = null;
  var EntityCreationService = null;
  var CreateNewSkillModalService = null;
  let ngbModal: NgbModal = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve('1')
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    ngbModal = $injector.get('NgbModal');
    TopicEditorRoutingService = $injector.get('TopicEditorRoutingService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    EntityCreationService = $injector.get('EntityCreationService');
    CreateNewSkillModalService = $injector.get('CreateNewSkillModalService');
    topic = TopicObjectFactory.createInterstitialTopic();
    var subtopic1 = Subtopic.createFromTitle(1, 'Subtopic1');
    var subtopic2 = Subtopic.createFromTitle(2, 'Subtopic2');
    var subtopic3 = Subtopic.createFromTitle(3, 'Subtopic3');
    topic.getSubtopics = function() {
      return [subtopic1, subtopic2, subtopic3];
    };
    topic.getId = function() {
      return '1';
    };
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
  }));

  it('should call TopicEditorRoutingService to navigate to subtopic editor',
    fakeAsync(() => {
      spyOn(TopicEditorRoutingService, 'navigateToSubtopicEditorWithId');
      EntityCreationService.createSubtopic();
      $rootScope.$apply();
      tick();
      expect(TopicEditorRoutingService.navigateToSubtopicEditorWithId)
        .toHaveBeenCalledWith('1');
    }));

  it('should open create subtopic modal', function() {
    var spy = spyOn(ngbModal, 'open').and.callThrough();
    EntityCreationService.createSubtopic();

    expect(spy).toHaveBeenCalled();
  });

  it('should close create subtopic modal when cancel button is clicked',
    function() {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          result: Promise.reject()
        } as NgbModalRef);
      });
      var routingSpy = (
        spyOn(TopicEditorRoutingService, 'navigateToSubtopicEditorWithId'));

      EntityCreationService.createSubtopic();
      $rootScope.$apply();

      expect(routingSpy).not.toHaveBeenCalledWith('1');
    });

  it('should call CreateNewSkillModalService to navigate to skill editor',
    function() {
      spyOn(CreateNewSkillModalService, 'createNewSkill');

      EntityCreationService.createSkill();
      $rootScope.$apply();

      expect(CreateNewSkillModalService.createNewSkill)
        .toHaveBeenCalledWith(['1']);
    });
});
