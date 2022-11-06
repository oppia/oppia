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
import { EventEmitter } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { ConceptCard } from 'domain/skill/ConceptCardObjectFactory';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { StoryUpdateService } from 'domain/story/story-update.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

class MockNgbModalRef {
  componentInstance: {
    skillSummaries: null;
    skillsInSameTopicCount: null;
    categorizedSkills: null;
    allowSkillsFromOtherTopics: null;
    untriagedSkillSummaries: null;
  };
}

describe('Story node editor directive', function() {
  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();

  let ngbModal: NgbModal;
  var $scope = null;
  var ctrl = null;
  var $q = null;
  let $timeout = null;
  var $rootScope = null;
  var directive = null;
  var story = null;
  var WindowDimensionsService = null;
  var storyUpdateService: StoryUpdateService = null;
  var CuratedExplorationValidationService = null;
  var AlertsService = null;
  var StoryEditorStateService = null;
  var StoryObjectFactory = null;
  let focusManagerService: FocusManagerService = null;

  beforeEach(angular.mock.inject(function($injector) {
    ngbModal = TestBed.inject(NgbModal);
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    WindowDimensionsService = $injector.get('WindowDimensionsService');
    CuratedExplorationValidationService = $injector.get(
      'CuratedExplorationValidationService');
    AlertsService = $injector.get('AlertsService');
    storyUpdateService = $injector.get('StoryUpdateService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    focusManagerService = $injector.get('FocusManagerService');
    $q = $injector.get('$q');
    $timeout = $injector.get('$timeout');

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

    var MockSkillBackendApiService = {
      fetchMultiSkillsAsync: (skillIds) => {
        // The skillId ='2' case is used to test the case when the
        // SkillBackendApiService rejects the request.
        if (skillIds[0] === '2') {
          return $q.reject();
        } else {
          var deferred = $q.defer();
          deferred.resolve([
            new Skill(
              '1', 'test', [], [],
              new ConceptCard(
                new SubtitledHtml(
                  '', '1'), [], RecordedVoiceovers.createEmpty()),
              'en', 1, 1, '0', true, []),
            new Skill(
              '2', 'test2', [], [],
              new ConceptCard(
                new SubtitledHtml(
                  '', '1'), [], RecordedVoiceovers.createEmpty()),
              'en', 1, 1, '0', true, []),
            new Skill(
              '3', 'test3', [], [],
              new ConceptCard(
                new SubtitledHtml(
                  '', '1'), [], RecordedVoiceovers.createEmpty()),
              'en', 1, 1, '0', true, [])
          ]);
          return deferred.promise;
        }
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
      SkillBackendApiService:
      MockSkillBackendApiService,
      NgbModal: ngbModal
    });
    ctrl.$onInit();
    $rootScope.$apply();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

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

  it('should fetch the descriptions for prerequisite skills', function() {
    spyOn($scope, 'getPrerequisiteSkillIds').and.returnValues(['1', '2', '3']);

    $scope.getPrerequisiteSkillsDescription();
    $rootScope.$apply();

    expect($scope.skillIdToSummaryMap).toEqual(
      {1: 'test', 2: 'test2', 3: 'test3'}
    );
  });

  it('should call Alerts Service if getting skill desc. fails', function() {
    spyOn($scope, 'getPrerequisiteSkillIds').and.returnValue(['2']);
    var alertsSpy = spyOn(AlertsService, 'addWarning').and.callThrough();

    $scope.getPrerequisiteSkillsDescription();
    $rootScope.$apply();

    expect(alertsSpy).toHaveBeenCalled();
  });

  it('should check if exploration can be saved', function() {
    $scope.checkCanSaveExpId();
    expect($scope.expIdCanBeSaved).toEqual(true);
  });

  it('should call StoryUpdate service remove prerequisite skill id',
    function() {
      var skillSpy = spyOn(
        storyUpdateService, 'removePrerequisiteSkillIdFromNode');
      $scope.removePrerequisiteSkillId('skill_3');
      expect(skillSpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service remove acquired skill id', function() {
    var skillSpy = spyOn(storyUpdateService, 'removeAcquiredSkillIdFromNode');
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
      var storySpy = spyOn(storyUpdateService, 'setStoryNodeThumbnailFilename');
      $scope.updateThumbnailFilename('new_file.png');
      expect(storySpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to set story thumbnail filename',
    function() {
      var storySpy = spyOn(storyUpdateService, 'setStoryNodeThumbnailBgColor');
      $scope.updateThumbnailBgColor('#333');
      expect(storySpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to finalize story node outline',
    function() {
      var storySpy = spyOn(storyUpdateService, 'unfinalizeStoryNodeOutline');
      $scope.unfinalizeOutline();
      expect(storySpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to finalize story node outline',
    function() {
      var storySpy = spyOn(storyUpdateService, 'finalizeStoryNodeOutline');
      $scope.finalizeOutline();
      expect(storySpy).toHaveBeenCalled();
    });

  it('should call StoryUpdate service to update outline', function() {
    var storySpy = spyOn(storyUpdateService, 'setStoryNodeOutline');
    $scope.updateOutline('New outline');
    expect(storySpy).toHaveBeenCalled();
  });

  it('should call StoryUpdate service to update description', function() {
    var storySpy = spyOn(storyUpdateService, 'setStoryNodeDescription');
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
      return (
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('success')
        }) as NgbModalRef;
    });
    $scope.addPrerequisiteSkillId();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should show alert message when we try to ' +
    'add a prerequisite skill id which already exists', fakeAsync(function() {
    spyOn(storyUpdateService, 'addPrerequisiteSkillIdToNode')
      .and.callFake(() => {
        throw new Error('Given skill is already a prerequisite skill');
      });
    let alertsSpy = spyOn(AlertsService, 'addInfoMessage')
      .and.returnValue(null);
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return (
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('success')
        }
      ) as NgbModalRef;
    });

    $scope.addPrerequisiteSkillId();
    tick();
    $scope.$apply();

    expect(alertsSpy).toHaveBeenCalledWith(
      'Given skill is already a prerequisite skill', 5000);
  }));

  it('should open add skill modal for adding acquired skill', function() {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return (
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('success')
        }) as NgbModalRef;
    });
    $scope.addAcquiredSkillId();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should show alert message when we try to ' +
    'add a acquired skill id which already exists', fakeAsync(function() {
    spyOn(storyUpdateService, 'addAcquiredSkillIdToNode')
      .and.callFake(() => {
        throw new Error('skill id already exist.');
      });
    let alertsSpy = spyOn(AlertsService, 'addInfoMessage')
      .and.returnValue(null);
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return (
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('success')
        }) as NgbModalRef;
    });

    $scope.addAcquiredSkillId();
    tick();
    $scope.$apply();

    expect(alertsSpy).toHaveBeenCalledWith(
      'Given skill is already an acquired skill', 5000);
  }));

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

  it('should call StoryUpdateService and CuratedExplorationValidationService' +
      ' to set node exploration id if story is published',
  function() {
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(true);
    var deferred = $q.defer();
    deferred.resolve(true);
    var expSpy = spyOn(
      CuratedExplorationValidationService, 'isExpPublishedAsync'
    ).and.returnValue(deferred.promise);
    var storyUpdateSpy = spyOn(storyUpdateService, 'setStoryNodeExplorationId');

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
      CuratedExplorationValidationService, 'isExpPublishedAsync'
    ).and.returnValue(deferred.promise);
    var storyUpdateSpy = spyOn(
      storyUpdateService, 'setStoryNodeExplorationId');

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
      storyUpdateService, 'setStoryNodeExplorationId');

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
      storyUpdateService, 'setStoryNodeExplorationId');

    $scope.updateExplorationId(null);
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should show alert message if we try to update ' +
    'exploration id with empty value', function() {
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(false);
    var deferred = $q.defer();
    deferred.resolve(false);
    spyOn(storyUpdateService, 'setStoryNodeExplorationId');
    let alertsSpy = spyOn(AlertsService, 'addInfoMessage')
      .and.returnValue(null);

    $scope.updateExplorationId('');
    expect(alertsSpy).toHaveBeenCalledWith(
      'Please click the delete icon to remove an exploration ' +
      'from the story.', 5000);
  });

  it('should call StoryUpdate service to set story node title', function() {
    var storyUpdateSpy = spyOn(
      storyUpdateService, 'setStoryNodeTitle');
    $scope.updateTitle('Title 10');
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should not call StoryUpdate service to set story node title and ' +
      'call AlertsService if the name is a duplicate', function() {
    var storyUpdateSpy = spyOn(
      storyUpdateService, 'setStoryNodeTitle');
    var alertsSpy = spyOn(AlertsService, 'addInfoMessage');
    $scope.updateTitle('Title 2');
    expect(storyUpdateSpy).not.toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalled();
  });

  it('should focus on story node when story is initialized', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(StoryEditorStateService, 'onStoryInitialized')
      .and.returnValue(mockEventEmitter);
    let focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll')
      .and.returnValue(null);

    ctrl.$onInit();
    $rootScope.$apply();
    $timeout.flush();
    mockEventEmitter.emit();

    expect(focusSpy).toHaveBeenCalled();
  });

  it('should focus on story node when story is reinitialized', () => {
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(StoryEditorStateService, 'onStoryReinitialized')
      .and.returnValue(mockEventEmitter);
    let focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll')
      .and.returnValue(null);

    ctrl.$onInit();
    $rootScope.$apply();
    $timeout.flush();
    mockEventEmitter.emit();

    expect(focusSpy).toHaveBeenCalled();
  });

  it('should focus on story node after recalculation of available node', () => {
    $scope.getDestinationNodeIds = () => [];
    let mockEventEmitter = new EventEmitter();
    spyOnProperty(StoryEditorStateService, 'onRecalculateAvailableNodes')
      .and.returnValue(mockEventEmitter);
    let focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll')
      .and.returnValue(null);

    ctrl.$onInit();
    $rootScope.$apply();
    $timeout.flush();

    $scope.storyNodeIds = ['node1'];
    mockEventEmitter.emit();

    expect(focusSpy).toHaveBeenCalled();
  });
});
