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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Topic editor tab directive', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  var $scope = null;
  var $uibModalInstance = null;
  var ctrl = null;
  var $rootScope = null;
  var topic = null;
  var $q = null;
  var skillSummary = null;
  var story1 = null;
  var story2 = null;
  var ContextService = null;
  var ImageUploadHelperService = null;
  var directive = null;
  var TopicEditorStateService = null;
  var TopicObjectFactory = null;
  var SkillCreationService = null;
  var EntityCreationService = null;
  var SkillSummaryObjectFactory = null;
  var TopicUpdateService = null;
  var StoryCreationService = null;
  var SubtopicObjectFactory = null;
  var StoryReferenceObjectFactory = null;
  var UndoRedoService = null;
  var WindowDimensionsService = null;
  var TopicEditorRoutingService = null;
  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ContextService = $injector.get('ContextService');
    $uibModalInstance = $injector.get('$uibModal');
    $q = $injector.get('$q');
    ImageUploadHelperService = $injector.get('ImageUploadHelperService');
    WindowDimensionsService = $injector.get('WindowDimensionsService');
    directive = $injector.get('topicEditorTabDirective')[0];
    TopicEditorStateService = $injector.get('TopicEditorStateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    var MockContextSerivce = {
      getEntityType: () => 'topic',
      getEntityId: () => 'dkfn32sxssasd'
    };
    var MockImageUploadHelperService = {
      getTrustedResourceUrlForThumbnailFilename: (filename,
          entityType,
          entityId) => (entityType + '/' + entityId + '/' + filename)
    };
    var MockWindowDimensionsService = {
      isWindowNarrow: () => false
    };
    SkillCreationService = $injector.get('SkillCreationService');
    TopicUpdateService = $injector.get('TopicUpdateService');
    StoryCreationService = $injector.get('StoryCreationService');
    UndoRedoService = $injector.get('UndoRedoService');
    SkillSummaryObjectFactory = $injector.get('ShortSkillSummaryObjectFactory');
    EntityCreationService = $injector.get('EntityCreationService');
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');
    StoryReferenceObjectFactory = $injector.get('StoryReferenceObjectFactory');
    TopicEditorRoutingService = $injector.get('TopicEditorRoutingService');
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
      EntityCreationService: EntityCreationService
    });
    var subtopic = SubtopicObjectFactory.createFromTitle(1, 'subtopic1');
    topic = TopicObjectFactory.createInterstitialTopic();
    skillSummary = SkillSummaryObjectFactory.create(
      'skill_1', 'Description 1');
    subtopic._skillSummaries = [skillSummary];
    topic._uncategorizedSkillSummaries = [skillSummary];
    topic._subtopics = [subtopic];
    story1 = StoryReferenceObjectFactory.createFromStoryId('storyId1');
    story2 = StoryReferenceObjectFactory.createFromStoryId('storyId2');
    topic._canonicalStoryReferences = [story1, story2];
    spyOn(TopicEditorStateService, 'getTopic').and.returnValue(topic);
    ctrl.$onInit();
  }));

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

  it('should open save changes warning modal before creating skill',
    function() {
      spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
      var uibModalSpy = spyOn($uibModalInstance, 'open').and.callThrough();
      $scope.createSkill();
      expect(uibModalSpy).toHaveBeenCalled();
    });

  it('should call TopicEditorStateService to load topic when ' +
      'topics and skills dashboard is reinitialized',
  function() {
    var refreshTopicSpy = spyOn(TopicEditorStateService, 'loadTopic');
    $rootScope.$broadcast('topicsAndSkillsDashboardReinitialized');
    expect(refreshTopicSpy).toHaveBeenCalled();
  });

  it('should call EntityCreationService to create subtopic', function() {
    var skillSpy = spyOn(EntityCreationService, 'createSubtopic');
    $scope.createSubtopic();
    expect(skillSpy).toHaveBeenCalled();
  });

  it('show mark the changes in description', function() {
    expect($scope.topicDescriptionChanged).toEqual(false);
    $scope.updateTopicDescriptionStatus('New description');
    expect($scope.topicDescriptionChanged).toEqual(true);
  });

  it('should call the TopicUpdateService if name is updated', function() {
    var topicNameSpy = spyOn(TopicUpdateService, 'setTopicName');
    $scope.updateTopicName('New Name');
    expect(topicNameSpy).toHaveBeenCalled();
  });

  it('should not call the TopicUpdateService if name is same', function() {
    $scope.updateTopicName('New Name');
    var topicNameSpy = spyOn(TopicUpdateService, 'setTopicName');
    $scope.updateTopicName('New Name');
    expect(topicNameSpy).not.toHaveBeenCalled();
  });

  it('should not call the TopicUpdateService if abbreviated name is same',
    function() {
      $scope.updateAbbreviatedTopicName('topic');
      var abbrevTopicNameSpy = spyOn(
        TopicUpdateService, 'setAbbreviatedTopicName');
      $scope.updateAbbreviatedTopicName('topic');
      expect(abbrevTopicNameSpy).not.toHaveBeenCalled();
    });

  it('should call the TopicUpdateService if abbreviated name is updated',
    function() {
      var abbrevTopicNameSpy = spyOn(
        TopicUpdateService, 'setAbbreviatedTopicName');
      $scope.updateAbbreviatedTopicName('topic');
      expect(abbrevTopicNameSpy).toHaveBeenCalled();
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
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(1);
    var uibModalSpy = spyOn($uibModalInstance, 'open').and.callThrough();
    $scope.createCanonicalStory();
    expect(uibModalSpy).toHaveBeenCalled();
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

  it('should toggle preview of entity lists', function() {
    expect($scope.subtopicsListIsShown).toEqual(true);
    expect($scope.storiesListIsShown).toEqual(true);

    $scope.togglePreviewListCards('subtopic');
    expect($scope.subtopicsListIsShown).toEqual(false);
    expect($scope.storiesListIsShown).toEqual(true);

    $scope.togglePreviewListCards('story');
    expect($scope.subtopicsListIsShown).toEqual(false);
    expect($scope.storiesListIsShown).toEqual(false);
  });

  it('should toggle uncategorized skill options', function() {
    $scope.toggleUncategorizedSkillOptions(10);
    expect($scope.uncategorizedEditOptionsIndex).toEqual(10);
    $scope.toggleUncategorizedSkillOptions(20);
    expect($scope.uncategorizedEditOptionsIndex).toEqual(20);
  });

  it('should open ChangeSubtopicAssignment modal when change ' +
      'subtopic assignment is called', function() {
    var modalSpy = spyOn($uibModalInstance, 'open').and.callThrough();
    $scope.changeSubtopicAssignment(1, skillSummary);
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should open ChangeSubtopicAssignment modal and call TopicUpdateService',
    function() {
      var deferred = $q.defer();
      deferred.resolve(1);
      spyOn($uibModalInstance, 'open').and.returnValue(
        {result: deferred.promise});
      var moveSkillUpdateSpy = spyOn(
        TopicUpdateService, 'moveSkillToSubtopic');
      $scope.changeSubtopicAssignment(null, skillSummary);
      $rootScope.$apply();
      expect(moveSkillUpdateSpy).toHaveBeenCalled();
    });

  it('should not call the TopicUpdateService if subtopicIds are same',
    function() {
      var deferred = $q.defer();
      deferred.resolve(1);
      spyOn($uibModalInstance, 'open').and.returnValue(
        {result: deferred.promise});
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
});
