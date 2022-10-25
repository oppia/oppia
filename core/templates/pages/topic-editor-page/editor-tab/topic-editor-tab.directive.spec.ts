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
 * @fileoverview Unit tests for the topic editor tab directive.
 */

import { EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fakeAsync, tick } from '@angular/core/testing';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { StoryReference } from 'domain/topic/story-reference-object.model';

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

describe('Topic editor tab directive', function() {
  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  var $scope = null;
  var $uibModalInstance = null;
  var ctrl = null;
  var $rootScope = null;
  var topic = null;
  var $q = null;
  let ngbModal: NgbModal = null;
  var skillSummary = null;
  var story1 = null;
  var story2 = null;
  var directive = null;
  var TopicEditorStateService = null;
  var TopicObjectFactory = null;
  var SkillCreationService = null;
  var EntityCreationService = null;
  var TopicUpdateService = null;
  var StoryCreationService = null;
  var UndoRedoService = null;
  var TopicEditorRoutingService = null;
  var QuestionBackendApiService = null;
  var mockStorySummariesInitializedEventEmitter = new EventEmitter();

  var mockTasdReinitializedEventEmitter = null;
  var topicInitializedEventEmitter = null;
  var topicReinitializedEventEmitter = null;
  var MockWindowDimensionsService = {
    isWindowNarrow: () => false
  };
  var MockTopicsAndSkillsDashboardBackendApiService = {
    get onTopicsAndSkillsDashboardReinitialized() {
      return mockTasdReinitializedEventEmitter;
    }
  };

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
    $scope = $rootScope.$new();
    $uibModalInstance = $injector.get('$uibModal');
    ngbModal = $injector.get('NgbModal');
    $q = $injector.get('$q');
    ngbModal = $injector.get('NgbModal');
    directive = $injector.get('topicEditorTabDirective')[0];
    ngbModal = $injector.get('NgbModal');
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    var MockContextSerivce = {
      getEntityType: () => 'topic',
      getEntityId: () => 'dkfn32sxssasd'
    };
    var MockImageUploadHelperService = {
      getTrustedResourceUrlForThumbnailFilename: (
          filename, entityType, entityId) => (
        entityType + '/' + entityId + '/' + filename)
    };
    SkillCreationService = $injector.get('SkillCreationService');
    TopicUpdateService = $injector.get('TopicUpdateService');
    StoryCreationService = $injector.get('StoryCreationService');
    UndoRedoService = $injector.get('UndoRedoService');
    EntityCreationService = $injector.get('EntityCreationService');
    TopicEditorRoutingService = $injector.get('TopicEditorRoutingService');
    QuestionBackendApiService = $injector.get('QuestionBackendApiService');
    mockTasdReinitializedEventEmitter = new EventEmitter();

    topicInitializedEventEmitter = new EventEmitter();
    topicReinitializedEventEmitter = new EventEmitter();

    spyOnProperty(TopicEditorStateService, 'onTopicInitialized').and.callFake(
      function() {
        return topicInitializedEventEmitter;
      });
    spyOnProperty(
      TopicEditorStateService, 'onTopicReinitialized').and.callFake(
      function() {
        return topicReinitializedEventEmitter;
      });

    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      ContextService: MockContextSerivce,
      ImageUploadHelperService: MockImageUploadHelperService,
      SkillCreationService: SkillCreationService,
      UndoRedoService: UndoRedoService,
      TopicUpdateService: TopicUpdateService,
      TopicEditorRoutingService: TopicEditorRoutingService,
      WindowDimensionsService: MockWindowDimensionsService,
      StoryCreationService: StoryCreationService,
      TopicEditorStateService: TopicEditorStateService,
      EntityCreationService: EntityCreationService,
      TopicsAndSkillsDashboardBackendApiService:
        MockTopicsAndSkillsDashboardBackendApiService,
      QuestionBackendApiService: QuestionBackendApiService
    });
    var subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    topic = TopicObjectFactory.createInterstitialTopic();
    skillSummary = ShortSkillSummary.create(
      'skill_1', 'Description 1');
    subtopic._skillSummaries = [skillSummary];
    topic._uncategorizedSkillSummaries = [skillSummary];
    topic._subtopics = [subtopic];
    story1 = StoryReference.createFromStoryId('storyId1');
    story2 = StoryReference.createFromStoryId('storyId2');
    topic._canonicalStoryReferences = [story1, story2];
    topic.setName('New Name');
    topic.setUrlFragment('topic-url-fragment');
    TopicEditorStateService.setTopic(topic);
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOnProperty(
      TopicEditorStateService, 'onStorySummariesInitialized').and.returnValue(
      mockStorySummariesInitializedEventEmitter);
    ctrl.$onInit();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should initialize the variables', function() {
    expect($scope.topic).toEqual(topic);
    expect($scope.allowedBgColors).toEqual(['#C6DCDA']);
    expect($scope.topicDescriptionChanged).toEqual(false);
    expect($scope.subtopicsListIsShown).toEqual(true);
    expect($scope.storiesListIsShown).toEqual(true);
    expect($scope.SUBTOPIC_LIST).toEqual('subtopic');
    expect($scope.SKILL_LIST).toEqual('skill');
    expect($scope.STORY_LIST).toEqual('story');
  });

  it('should call EntityCreationService to create skill', function() {
    var skillSpy = spyOn(EntityCreationService, 'createSkill');
    $scope.createSkill();
    expect(skillSpy).toHaveBeenCalled();
  });

  it('should toggle the subtopic card', function() {
    var index = 1;
    expect($scope.subtopicCardSelectedIndexes[index]).toEqual(undefined);
    $scope.toggleSubtopicCard(index);
    expect($scope.subtopicCardSelectedIndexes[index]).toEqual(true);
    $scope.toggleSubtopicCard(index);
    expect($scope.subtopicCardSelectedIndexes[index]).toEqual(false);
    $scope.toggleSubtopicCard(index);
    expect($scope.subtopicCardSelectedIndexes[index]).toEqual(true);
  });

  it('should open the reassign modal', function() {
    var uibModalSpy = spyOn($uibModalInstance, 'open').and.returnValue({
      result: Promise.resolve()
    });
    $scope.reassignSkillsInSubtopics();
    expect(uibModalSpy).toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if skill is removed from subtopic',
    function() {
      var removeSkillSpy = (
        spyOn(TopicUpdateService, 'removeSkillFromSubtopic'));
      $scope.removeSkillFromSubtopic(0, null);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should call the TopicUpdateService if skill is removed from topic',
    function() {
      var removeSkillSpy = (
        spyOn(TopicUpdateService, 'removeSkillFromSubtopic'));
      $scope.removeSkillFromTopic(0, skillSummary);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should show subtopic edit options', function() {
    $scope.showSubtopicEditOptions(1);
    expect($scope.subtopicEditOptionsAreShown).toEqual(1);
    $scope.showSubtopicEditOptions(2);
    expect($scope.subtopicEditOptionsAreShown).toEqual(2);
  });

  it('should show skill edit options', function() {
    $scope.showSkillEditOptions(0, 1);
    expect($scope.selectedSkillEditOptionsIndex[0][1]).toEqual(true);
    $scope.showSkillEditOptions(0, 1);
    expect($scope.selectedSkillEditOptionsIndex).toEqual({});
  });

  it('should get the classroom URL fragment', function() {
    expect($scope.getClassroomUrlFragment()).toEqual('staging');
    spyOn(
      TopicEditorStateService,
      'getClassroomUrlFragment').and.returnValue('classroom-frag');
    expect($scope.getClassroomUrlFragment()).toEqual('classroom-frag');
  });

  it('should open save changes warning modal before creating skill',
    function() {
      class MockNgbModalRef {
        componentInstance: {
          body: 'xyz';
        };
      }
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve()
        }) as NgbModalRef;
      });
      $scope.createSkill();
      expect(modalSpy).toHaveBeenCalled();
    });

  it('should call TopicEditorStateService to load topic when ' +
      'topics and skills dashboard is reinitialized',
  function() {
    var refreshTopicSpy = spyOn(TopicEditorStateService, 'loadTopic');
    MockTopicsAndSkillsDashboardBackendApiService.
      onTopicsAndSkillsDashboardReinitialized.emit();
    expect(refreshTopicSpy).toHaveBeenCalled();
  });

  it('should call EntityCreationService to create subtopic', function() {
    var skillSpy = spyOn(EntityCreationService, 'createSubtopic');
    $scope.createSubtopic();
    expect(skillSpy).toHaveBeenCalled();
  });

  it('should show mark the changes in description', function() {
    expect($scope.topicDescriptionChanged).toEqual(false);
    $scope.updateTopicDescriptionStatus('New description');
    expect($scope.topicDescriptionChanged).toEqual(true);
  });

  it('should call the TopicUpdateService if name is updated', function() {
    var topicNameSpy = spyOn(TopicUpdateService, 'setTopicName');
    spyOn(TopicEditorStateService, 'updateExistenceOfTopicName').and.callFake(
      (newName, successCallback) => successCallback());
    $scope.updateTopicName('Different Name');
    expect(topicNameSpy).toHaveBeenCalled();
  });

  it('should not call updateExistenceOfTopicName if name is empty',
    function() {
      var topicNameSpy = spyOn(TopicUpdateService, 'setTopicName');
      spyOn(TopicEditorStateService, 'updateExistenceOfTopicName');
      $scope.updateTopicName('');
      expect(topicNameSpy).toHaveBeenCalled();
      expect(
        TopicEditorStateService.updateExistenceOfTopicName
      ).not.toHaveBeenCalled();
    });

  it('should not call the TopicUpdateService if name is same', function() {
    var topicNameSpy = spyOn(TopicUpdateService, 'setTopicName');
    $scope.updateTopicName('New Name');
    expect(topicNameSpy).not.toHaveBeenCalled();
  });

  it('should not call the TopicUpdateService if url fragment is same',
    function() {
      var topicUrlFragmentSpy = spyOn(
        TopicUpdateService, 'setTopicUrlFragment');
      $scope.updateTopicUrlFragment('topic-url-fragment');
      expect(topicUrlFragmentSpy).not.toHaveBeenCalled();
    });

  it('should not call the getTopicWithUrlFragmentExists if url fragment' +
     'is not correct', function() {
    var topicUrlFragmentSpy = spyOn(
      TopicUpdateService, 'setTopicUrlFragment');
    var topicUrlFragmentExists = spyOn(
      TopicEditorStateService, 'getTopicWithUrlFragmentExists');
    spyOn(
      TopicEditorStateService,
      'updateExistenceOfTopicUrlFragment').and.callFake(
      (newUrlFragment, successCallback, errorCallback) => errorCallback());
    $scope.updateTopicUrlFragment('topic-url fragment');
    expect(topicUrlFragmentSpy).toHaveBeenCalled();
    expect(topicUrlFragmentExists).not.toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if url fragment is updated',
    function() {
      var topicUrlFragmentSpy = spyOn(
        TopicUpdateService, 'setTopicUrlFragment');
      spyOn(
        TopicEditorStateService,
        'updateExistenceOfTopicUrlFragment').and.callFake(
        (newUrlFragment, successCallback, errorCallback) => successCallback());
      $scope.updateTopicUrlFragment('topic');
      expect(topicUrlFragmentSpy).toHaveBeenCalled();
    });

  it('should not update topic url fragment existence for empty url fragment',
    function() {
      var topicUrlFragmentSpy = spyOn(
        TopicUpdateService, 'setTopicUrlFragment');
      spyOn(TopicEditorStateService, 'updateExistenceOfTopicUrlFragment');
      $scope.updateTopicUrlFragment('');
      expect(topicUrlFragmentSpy).toHaveBeenCalled();
      expect(
        TopicEditorStateService.updateExistenceOfTopicUrlFragment
      ).not.toHaveBeenCalled();
    });

  it('should call the TopicUpdateService if thumbnail is updated', function() {
    var topicThumbnailSpy = (
      spyOn(TopicUpdateService, 'setTopicThumbnailFilename'));
    $scope.updateTopicThumbnailFilename('img2.svg');
    expect(topicThumbnailSpy).toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if thumbnail is updated', function() {
    $scope.updateTopicThumbnailFilename('img2.svg');
    var topicThumbnailSpy = (
      spyOn(TopicUpdateService, 'setTopicThumbnailFilename'));
    $scope.updateTopicThumbnailFilename('img2.svg');
    expect(topicThumbnailSpy).not.toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if topic description is updated',
    function() {
      var topicDescriptionSpy = (
        spyOn(TopicUpdateService, 'setTopicDescription'));
      $scope.updateTopicDescription('New description');
      expect(topicDescriptionSpy).toHaveBeenCalled();
    });

  it('should not call the TopicUpdateService if topic description is same',
    function() {
      $scope.updateTopicDescription('New description');
      var topicDescriptionSpy = (
        spyOn(TopicUpdateService, 'setTopicDescription'));
      $scope.updateTopicDescription('New description');
      expect(topicDescriptionSpy).not.toHaveBeenCalled();
    });

  it('should call the TopicUpdateService if topic meta tag content is updated',
    function() {
      var topicMetaTagContentSpy = (
        spyOn(TopicUpdateService, 'setMetaTagContent'));
      $scope.updateTopicMetaTagContent('new meta tag content');
      expect(topicMetaTagContentSpy).toHaveBeenCalled();
    });

  it('should not call the TopicUpdateService if topic description is same',
    function() {
      $scope.updateTopicMetaTagContent('New meta tag content');
      var topicMetaTagContentSpy = (
        spyOn(TopicUpdateService, 'setMetaTagContent'));
      $scope.updateTopicMetaTagContent('New meta tag content');
      expect(topicMetaTagContentSpy).not.toHaveBeenCalled();
    });

  it('should call the TopicUpdateService if topic page title is updated',
    function() {
      var topicPageTitleFragmentForWebSpy = spyOn(
        TopicUpdateService, 'setPageTitleFragmentForWeb');
      $scope.updateTopicPageTitleFragmentForWeb('new page title');
      expect(topicPageTitleFragmentForWebSpy).toHaveBeenCalled();
    });

  it('should not call the TopicUpdateService if topic page title is same',
    function() {
      $scope.updateTopicPageTitleFragmentForWeb('New page title');
      var topicPageTitleFragmentForWebSpy = spyOn(
        TopicUpdateService, 'setPageTitleFragmentForWeb');
      $scope.updateTopicPageTitleFragmentForWeb('New page title');
      expect(topicPageTitleFragmentForWebSpy).not.toHaveBeenCalled();
    });

  it('should set the practice tab as displayed if there are the defined ' +
      'minimum number of practice questions in the topic', function() {
    var topicPracticeTabSpy = (
      spyOn(TopicUpdateService, 'setPracticeTabIsDisplayed'));
    $scope.skillQuestionCountDict = {skill1: 3, skill2: 6};
    $scope.updatePracticeTabIsDisplayed(true);
    expect(topicPracticeTabSpy).not.toHaveBeenCalled();
    $scope.skillQuestionCountDict = {skill1: 3, skill2: 7};
    $scope.updatePracticeTabIsDisplayed(true);
    expect(topicPracticeTabSpy).toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if skill is deleted from topic',
    function() {
      var topicDeleteSpy = (
        spyOn(TopicUpdateService, 'removeUncategorizedSkill'));
      $scope.deleteUncategorizedSkillFromTopic();
      expect(topicDeleteSpy).toHaveBeenCalled();
    });

  it('should call the TopicUpdateService if thumbnail bg color is updated',
    function() {
      var topicThumbnailBGSpy = (
        spyOn(TopicUpdateService, 'setTopicThumbnailBgColor'));
      $scope.updateTopicThumbnailBgColor('#FFFFFF');
      expect(topicThumbnailBGSpy).toHaveBeenCalled();
    });

  it('should call TopicEditorRoutingService to navigate to skill', function() {
    var topicThumbnailBGSpy = (
      spyOn(TopicEditorRoutingService, 'navigateToSkillEditorWithId'));
    $scope.navigateToSkill('id1');
    expect(topicThumbnailBGSpy).toHaveBeenCalledWith('id1');
  });

  it('should return skill editor URL', function() {
    var skillId = 'asd4242a';
    expect($scope.getSkillEditorUrl(skillId)).toEqual(
      '/skill_editor/' + skillId);
  });

  it('should not call the TopicUpdateService if thumbnail bg color is same',
    function() {
      $scope.updateTopicThumbnailBgColor('#FFFFFF');
      var topicThumbnailBGSpy = (
        spyOn(TopicUpdateService, 'setTopicThumbnailBgColor'));
      $scope.updateTopicThumbnailBgColor('#FFFFFF');
      expect(topicThumbnailBGSpy).not.toHaveBeenCalled();
    });

  it('should toggle topic preview', function() {
    expect($scope.topicPreviewCardIsShown).toEqual(false);
    $scope.togglePreview();
    expect($scope.topicPreviewCardIsShown).toEqual(true);
  });

  it('should return image path', function() {
    var urlString = '/assets/images/img1.svg';
    expect($scope.getStaticImageUrl('/img1.svg')).toEqual(urlString);
  });

  it('should call StoryCreation Service', function() {
    var storySpy = spyOn(StoryCreationService, 'createNewCanonicalStory');
    $scope.createCanonicalStory();
    expect(storySpy).toHaveBeenCalled();
  });

  it('should open save pending changes modal if changes are made', function() {
    class MockNgbModalRef {
      componentInstance: {
        body: 'xyz';
      };
    }
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve()
      }) as NgbModalRef;
    });
    $scope.createCanonicalStory();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should call TopicRoutingService to navigate to subtopic', function() {
    var topicRoutingSpy = (
      spyOn(TopicEditorRoutingService, 'navigateToSubtopicEditorWithId'));
    $scope.navigateToSubtopic(2);
    expect(topicRoutingSpy).toHaveBeenCalledWith(2);
  });

  it('should call TopicEditorService and TopicUpdateService ' +
      'on to delete subtopic', function() {
    var topicEditorSpy = spyOn(TopicEditorStateService, 'deleteSubtopicPage');
    var topicUpdateSpy = (
      spyOn(TopicUpdateService, 'deleteSubtopic'));
    $scope.deleteSubtopic();
    expect(topicEditorSpy).toHaveBeenCalled();
    expect(topicUpdateSpy).toHaveBeenCalled();
  });

  it('should return preview footer text for topic preview', function() {
    expect($scope.getPreviewFooter()).toEqual('2 Stories');
    topic._canonicalStoryReferences = [];
    expect($scope.getPreviewFooter()).toEqual('0 Stories');
    topic._canonicalStoryReferences = [story1];
    expect($scope.getPreviewFooter()).toEqual('1 Story');
  });

  it('should only toggle preview of entity lists in mobile view', function() {
    expect($scope.mainTopicCardIsShown).toEqual(true);
    $scope.togglePreviewListCards('topic');
    expect($scope.mainTopicCardIsShown).toEqual(true);

    MockWindowDimensionsService.isWindowNarrow = () => true;
    expect($scope.subtopicsListIsShown).toEqual(true);
    expect($scope.storiesListIsShown).toEqual(true);

    $scope.togglePreviewListCards('subtopic');
    expect($scope.subtopicsListIsShown).toEqual(false);
    expect($scope.storiesListIsShown).toEqual(true);

    $scope.togglePreviewListCards('story');
    expect($scope.subtopicsListIsShown).toEqual(false);
    expect($scope.storiesListIsShown).toEqual(false);

    expect($scope.mainTopicCardIsShown).toEqual(true);
    $scope.togglePreviewListCards('topic');
    expect($scope.mainTopicCardIsShown).toEqual(false);

    MockWindowDimensionsService.isWindowNarrow = () => false;
  });

  it('should toggle uncategorized skill options', function() {
    $scope.toggleUncategorizedSkillOptions(10);
    expect($scope.uncategorizedEditOptionsIndex).toEqual(10);
    $scope.toggleUncategorizedSkillOptions(20);
    expect($scope.uncategorizedEditOptionsIndex).toEqual(20);
  });

  it('should open ChangeSubtopicAssignment modal when change ' +
      'subtopic assignment is called', function() {
    class MockNgbModalRef {
      componentInstance: {
        subtopics: null;
      };
    }
    var deferred = $q.defer();
    deferred.resolve(1);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return (
        {
          componentInstance: MockNgbModalRef,
          result: deferred.promise
        } as NgbModalRef);
    });
    $scope.changeSubtopicAssignment(1, skillSummary);
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should open ChangeSubtopicAssignment modal and call TopicUpdateService',
    function() {
      class MockNgbModalRef {
        componentInstance: {
          subtopics: null;
        };
      }
      var deferred = $q.defer();
      deferred.resolve(1);
      spyOn(ngbModal, 'open').and.returnValue(
        {
          componentInstance: MockNgbModalRef,
          result: deferred.promise
        } as NgbModalRef
      );
      var moveSkillUpdateSpy = spyOn(
        TopicUpdateService, 'moveSkillToSubtopic');
      $scope.changeSubtopicAssignment(null, skillSummary);
      $rootScope.$apply();
      expect(moveSkillUpdateSpy).toHaveBeenCalled();
    });

  it('should not call the TopicUpdateService if subtopicIds are same',
    function() {
      class MockNgbModalRef {
        componentInstance: {
          subtopics: null;
        };
      }
      var deferred = $q.defer();
      deferred.resolve(1);
      spyOn(ngbModal, 'open').and.returnValue(
        {
          componentInstance: MockNgbModalRef,
          result: deferred.promise
        } as NgbModalRef
      );
      var moveSkillSpy = (
        spyOn(TopicUpdateService, 'moveSkillToSubtopic'));
      $scope.changeSubtopicAssignment(1, skillSummary);
      $rootScope.$apply();
      expect(moveSkillSpy).not.toHaveBeenCalled();
    });

  it('should record the index of the subtopic being moved', function() {
    $scope.onRearrangeSubtopicStart(10);
    expect($scope.fromIndex).toEqual(10);
    $scope.onRearrangeSubtopicStart(6);
    expect($scope.fromIndex).toEqual(6);
  });

  it('should call the TopicUpdateService to rearrange subtopic', function() {
    $scope.fromIndex = 0;
    var moveSubtopicSpy = (
      spyOn(TopicUpdateService, 'rearrangeSubtopic'));
    $scope.onRearrangeSubtopicEnd(1);
    expect(moveSubtopicSpy).toHaveBeenCalled();
  });

  it('should not call the TopicUpdateService to rearrange subtopic if ' +
      'subtopic is moved to the same position', function() {
    $scope.fromIndex = 0;
    var moveSubtopicSpy = (
      spyOn(TopicUpdateService, 'rearrangeSubtopic'));
    $scope.onRearrangeSubtopicEnd(0);
    expect(moveSubtopicSpy).not.toHaveBeenCalled();
  });

  it('should react to event when story summaries are initialized', () => {
    spyOn(TopicEditorStateService, 'getCanonicalStorySummaries');
    mockStorySummariesInitializedEventEmitter.emit();
    expect(
      TopicEditorStateService.getCanonicalStorySummaries).toHaveBeenCalled();
  });

  it('should call initEditor on initialization of topic', function() {
    spyOn(ctrl, 'initEditor').and.callThrough();
    topicInitializedEventEmitter.emit();
    topicReinitializedEventEmitter.emit();
    expect(ctrl.initEditor).toHaveBeenCalledTimes(2);
  });

  it('should call the TopicUpdateService if skillId is added in the ' +
     'diagnostic test', fakeAsync(function() {
    var updateSkillIdForDiagnosticTestSpy = spyOn(
      TopicUpdateService, 'updateDiagnosticTestSkills');
    $scope.selectedSkillForDiagnosticTest = skillSummary;
    $scope.availableSkillSummariesForDiagnosticTest = [skillSummary];
    $scope.addSkillForDiagnosticTest();
    $rootScope.$apply();
    tick();
    expect(updateSkillIdForDiagnosticTestSpy).toHaveBeenCalledWith(
      $scope.topic, $scope.selectedSkillSummariesForDiagnosticTest);
  }));

  it('should call the TopicUpdateService if any skillId is removed from the ' +
     'diagnostic test', function() {
    var updateSkillIdForDiagnosticTestSpy = spyOn(
      TopicUpdateService, 'updateDiagnosticTestSkills');
    $scope.selectedSkillSummariesForDiagnosticTest = [skillSummary];

    $scope.removeSkillFromDiagnosticTest(skillSummary);
    expect(updateSkillIdForDiagnosticTestSpy).toHaveBeenCalledWith(
      $scope.topic, $scope.selectedSkillSummariesForDiagnosticTest);
  });

  it('should get eligible skill for diagnostic test selection', function() {
    $scope.skillQuestionCountDict = {
      skill_1: 3
    };
    topic._uncategorizedSkillSummaries = [];
    topic._subtopics = [];
    expect($scope.getEligibleSkillSummariesForDiagnosticTest()).toEqual([]);

    spyOn($scope.topic, 'getAvailableSkillSummariesForDiagnosticTest')
      .and.returnValue([skillSummary]);
    expect($scope.getEligibleSkillSummariesForDiagnosticTest()).toEqual(
      [skillSummary]);
  });

  it('should be able to present diagnostic test dropdown selector correctly',
    function() {
      expect($scope.diagnosticTestSkillsDropdownIsShown).toBeFalse();
      $scope.presentDiagnosticTestSkillDropdown();
      expect($scope.diagnosticTestSkillsDropdownIsShown).toBeTrue();

      $scope.removeDiagnosticTestSkillDropdown();
      expect($scope.diagnosticTestSkillsDropdownIsShown).toBeFalse();
    });
});
