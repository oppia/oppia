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
 * @fileoverview Unit tests for the story node editor directive.
 */
import { TestBed } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { importAllAngularServices } from 'tests/unit-test-utils';

class MockNgbModalRef {
  componentInstance: {
    skillSummaries: null,
    skillsInSameTopicCount: null,
    categorizedSkills: null,
    allowSkillsFromOtherTopics: null,
    untriagedSkillSummaries: null
  };
}

describe('Story node editor directive', function() {
  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();

  let ngbModal: NgbModal;
  var $scope = null;
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var directive = null;
  var story = null;
  var WindowDimensionsService = null;
  var StoryUpdateService = null;
  var ExplorationIdValidationService = null;
  var AlertsService = null;
  var StoryEditorStateService = null;
  var StoryObjectFactory = null;

  beforeEach(angular.mock.inject(function($injector) {
    ngbModal = TestBed.inject(NgbModal);
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    WindowDimensionsService = $injector.get('WindowDimensionsService');
    ExplorationIdValidationService = $injector.get(
      'ExplorationIdValidationService');
    AlertsService = $injector.get('AlertsService');
    StoryUpdateService = $injector.get('StoryUpdateService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    $q = $injector.get('$q');

    var sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      corresponding_topic_id: 'topic_id',
      url_fragment: 'story_title',
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [
          {
            id: 'node_1',
            title: 'Title 1',
            description: 'Description 1',
            prerequisite_skill_ids: ['skill_1'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false
          }, {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true
          }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    };
    story = StoryObjectFactory.createFromBackendDict(sampleStoryBackendObject);
    directive = $injector.get('storyNodeEditorDirective')[0];

    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(StoryEditorStateService, 'getSkillSummaries').and.returnValue(
      [{id: '1', description: 'Skill description'}]);
    spyOn(StoryEditorStateService, 'getStory').and.returnValue(story);
    spyOn(StoryEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math');
    spyOn(StoryEditorStateService, 'getTopicUrlFragment').and.returnValue(
      'fractions');
    spyOn(StoryEditorStateService, 'getTopicName').and.returnValue('addition');

    var MockTopicsAndSkillsDashboardBackendApiService = {
      fetchDashboardDataAsync: () => {
        var deferred = $q.defer();
        deferred.resolve({
          categorizedSkillsDict: {},
          untriagedSkillSummaries: {}
        });
        return deferred.promise;
      }
    };
    $scope.getId = () => 'node_1';
    $scope.getOutline = () => 'This is outline';
    $scope.getDescription = () => 'Chapter description';
    $scope.getExplorationId = () => 'Exp1';
    $scope.getThumbnailFilename = () => 'a.svg';
    $scope.getThumbnailBgColor = () => '#FFF';
    $scope.isOutlineFinalized = () => true;
    $scope.getDestinationNodeIds = () => ['node_2'];
    $scope.getPrerequisiteSkillIds = () => ['skill_1'];
    $scope.getAcquiredSkillIds = () => ['skill_2'];
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      TopicsAndSkillsDashboardBackendApiService:
      MockTopicsAndSkillsDashboardBackendApiService,
      NgbModal: ngbModal
    });
    ctrl.$onInit();
    $rootScope.$apply();
  }));

  it('should init the controller', function() {
    $scope.viewNodeEditor();
    expect($scope.chapterPreviewCardIsShown).toEqual(false);
    expect($scope.mainChapterCardIsShown).toEqual(true);
    expect($scope.explorationInputButtonsAreShown).toEqual(false);
  });

  it('should return skill editor URL', function() {
    expect($scope.getSkillEditorUrl('skill_1')).toEqual(
      '/skill_editor/skill_1');
  });

  it('should check if exploration can be saved', function() {
    $scope.checkCanSaveExpId();
    expect($scope.expIdCanBeSaved).toEqual(true);
  });

  it('should call StoryUpdate service remove prerequisite skill id',
    function() {
      var skillSpy = spyOn(
        StoryUpdateService, 'removePrerequisiteSkillIdFromNode');
      $scope.removePrerequisiteSkillId('skill_3');
      expect(skillSpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service remove acquired skill id', function() {
    var skillSpy = spyOn(StoryUpdateService, 'removeAcquiredSkillIdFromNode');
    $scope.removeAcquiredSkillId();
    expect(skillSpy).toHaveBeenCalled();
  });

  it('should toggle chapter preview card', function() {
    $scope.chapterPreviewCardIsShown = false;
    $scope.togglePreview();
    $scope.chapterPreviewCardIsShown = true;

    $scope.togglePreview();
    $scope.chapterPreviewCardIsShown = false;
  });

  it('should toggle prereq skill list', function() {
    $scope.prerequisiteSkillIsShown = true;
    $scope.togglePrerequisiteSkillsList();
    $scope.prerequisiteSkillIsShown = false;
  });

  it('should call StoryUpdate service to set story thumbnail filename',
    function() {
      var storySpy = spyOn(StoryUpdateService, 'setStoryNodeThumbnailFilename');
      $scope.updateThumbnailFilename('new_file.png');
      expect(storySpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to set story thumbnail filename',
    function() {
      var storySpy = spyOn(StoryUpdateService, 'setStoryNodeThumbnailBgColor');
      $scope.updateThumbnailBgColor('#333');
      expect(storySpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to finalize story node outline',
    function() {
      var storySpy = spyOn(StoryUpdateService, 'unfinalizeStoryNodeOutline');
      $scope.unfinalizeOutline();
      expect(storySpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to finalize story node outline',
    function() {
      var storySpy = spyOn(StoryUpdateService, 'finalizeStoryNodeOutline');
      $scope.finalizeOutline();
      expect(storySpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to update outline', function() {
    var storySpy = spyOn(StoryUpdateService, 'setStoryNodeOutline');
    $scope.updateOutline('New outline');
    expect(storySpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to update description', function() {
    var storySpy = spyOn(StoryUpdateService, 'setStoryNodeDescription');
    $scope.updateDescription('New description');
    expect(storySpy).toHaveBeenCalled();
  });

  it('should open and close node title editor', function() {
    $scope.openNodeTitleEditor();
    expect($scope.nodeTitleEditorIsShown).toEqual(true);
    $scope.closeNodeTitleEditor();
    expect($scope.nodeTitleEditorIsShown).toEqual(false);
  });

  it('should open add skill modal for adding prerequisite skill', function() {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>(
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('success')
        });
    });
    $scope.addPrerequisiteSkillId();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should open add skill modal for adding acquired skill', function() {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>(
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('success')
        });
    });
    $scope.addAcquiredSkillId();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should toggle chapter outline', function() {
    $scope.chapterOutlineIsShown = false;
    $scope.toggleChapterOutline();
    expect($scope.chapterOutlineIsShown).toEqual(true);

    $scope.toggleChapterOutline();
    expect($scope.chapterOutlineIsShown).toEqual(false);
  });

  it('should toggle acquired skills list', function() {
    $scope.acquiredSkillIsShown = false;
    $scope.toggleAcquiredSkillsList();
    expect($scope.acquiredSkillIsShown).toEqual(true);

    $scope.toggleAcquiredSkillsList();
    expect($scope.acquiredSkillIsShown).toEqual(false);
  });

  it('should toggle chapter card', function() {
    $scope.mainChapterCardIsShown = true;
    $scope.toggleChapterCard();
    expect($scope.mainChapterCardIsShown).toEqual(false);

    $scope.toggleChapterCard();
    expect($scope.mainChapterCardIsShown).toEqual(true);
  });

  it('should toggle chapter todo card', function() {
    $scope.chapterTodoCardIsShown = false;
    $scope.toggleChapterTodoCard();
    expect($scope.chapterTodoCardIsShown).toEqual(true);

    $scope.toggleChapterTodoCard();
    expect($scope.chapterTodoCardIsShown).toEqual(false);
  });

  it('should toggle exploration input buttons', function() {
    $scope.explorationInputButtonsAreShown = false;
    $scope.toggleExplorationInputButtons();
    expect($scope.explorationInputButtonsAreShown).toEqual(true);

    $scope.toggleExplorationInputButtons();
    expect($scope.explorationInputButtonsAreShown).toEqual(false);
  });

  it('should toggle chapter outline buttons', function() {
    $scope.chapterOutlineButtonsAreShown = false;
    $scope.toggleChapterOutlineButtons();
    expect($scope.chapterOutlineButtonsAreShown).toEqual(true);

    $scope.toggleChapterOutlineButtons();
    expect($scope.chapterOutlineButtonsAreShown).toEqual(false);
  });

  it('should call StoryUpdateService and ExplorationIdValidationService' +
      ' to set node exploration id if story is published',
  function() {
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(true);
    var deferred = $q.defer();
    deferred.resolve(true);
    var expSpy = spyOn(
      ExplorationIdValidationService, 'isExpPublishedAsync').and.returnValue(
      deferred.promise);
    var storyUpdateSpy = spyOn(StoryUpdateService, 'setStoryNodeExplorationId');

    $scope.updateExplorationId('exp10');
    $rootScope.$apply();
    expect(expSpy).toHaveBeenCalled();
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdateService to set node exploration id and set ' +
      'invalid exp error if story is published and exp id is invalid',
  function() {
    $scope.invalidExpErrorIsShown = false;
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(true);
    var deferred = $q.defer();
    deferred.resolve(false);
    var expSpy = spyOn(
      ExplorationIdValidationService, 'isExpPublishedAsync').and.returnValue(
      deferred.promise);
    var storyUpdateSpy = spyOn(
      StoryUpdateService, 'setStoryNodeExplorationId');

    $scope.updateExplorationId('exp10');
    $rootScope.$apply();
    expect(expSpy).toHaveBeenCalled();
    expect(storyUpdateSpy).not.toHaveBeenCalled();
    expect($scope.invalidExpErrorIsShown).toEqual(true);
  });

  it('should show error if story is published and exp id is null', function() {
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(true);
    var alertsSpy = spyOn(AlertsService, 'addInfoMessage');

    var storyUpdateSpy = spyOn(
      StoryUpdateService, 'setStoryNodeExplorationId');

    $scope.updateExplorationId(null);
    expect(storyUpdateSpy).not.toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdateService to set node exploration id and set ' +
      'invalid exp error if story is published and exp id is invalid',
  function() {
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(false);
    var deferred = $q.defer();
    deferred.resolve(false);

    var storyUpdateSpy = spyOn(
      StoryUpdateService, 'setStoryNodeExplorationId');

    $scope.updateExplorationId('exp10');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to set story node title', function() {
    var storyUpdateSpy = spyOn(
      StoryUpdateService, 'setStoryNodeTitle');
    $scope.updateTitle('Title 10');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should not call StoryUpdate service to set story node title and ' +
      'call AlertsService if the name is a duplicate', function() {
    var storyUpdateSpy = spyOn(
      StoryUpdateService, 'setStoryNodeTitle');
    var alertsSpy = spyOn(AlertsService, 'addInfoMessage');
    $scope.updateTitle('Title 2');
    expect(storyUpdateSpy).not.toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalled();
  });
});
