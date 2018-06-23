// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TopicEditorStateService.
 */

describe('Topic editor state service', function() {
  var TopicEditorStateService = null;
  var TopicObjectFactory = null;
  var SubtopicPageObjectFactory = null;
  var TopicRightsObjectFactory = null;
  var TopicUpdateService = null;
  var fakeEditableTopicBackendApiService = null;
  var fakeTopicRightsBackendApiService = null;

  var FakeEditableTopicBackendApiService = function() {
    var self = {};

    var _fetchOrUpdateTopic = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendTopicObject);
        } else {
          reject();
        }
      });
    };

    var _fetchSubtopicPage = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.backendSubtopicPageObject);
        } else {
          reject();
        }
      });
    };

    self.backendSubtopicPageObject = {};
    self.newBackendTopicObject = {};
    self.failure = null;
    self.fetchTopic = _fetchOrUpdateTopic;
    self.fetchSubtopicPage = _fetchSubtopicPage;
    self.updateTopic = _fetchOrUpdateTopic;

    return self;
  };

  var FakeTopicRightsBackendApiService = function() {
    var self = {};

    var _fetchTopicRights = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.backendTopicRightsObject);
        } else {
          reject();
        }
      });
    };

    self.backendTopicRightsObject = {};
    self.failure = null;
    self.fetchTopicRights = _fetchTopicRights;

    return self;
  };

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(module('oppia', function($provide) {
    fakeEditableTopicBackendApiService = (
      new FakeEditableTopicBackendApiService());
    $provide.value(
      'EditableTopicBackendApiService',
      [fakeEditableTopicBackendApiService][0]);

    fakeTopicRightsBackendApiService = (
      new FakeTopicRightsBackendApiService());
    $provide.value(
      'TopicRightsBackendApiService',
      [fakeTopicRightsBackendApiService][0]);
  }));

  beforeEach(inject(function($injector) {
    TopicEditorStateService = $injector.get(
      'TopicEditorStateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    SubtopicPageObjectFactory = $injector.get('SubtopicPageObjectFactory');
    TopicRightsObjectFactory = $injector.get(
      'TopicRightsObjectFactory');
    TopicUpdateService = $injector.get('TopicUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    fakeEditableTopicBackendApiService.newBackendTopicObject = {
      id: '0',
      name: 'Topic Name',
      description: 'Topic Description',
      canonical_story_ids: ['story_1'],
      additional_story_ids: ['story_2'],
      uncategorized_skill_ids: ['skill_1'],
      subtopics: [],
      language_code: 'en',
      next_subtopic_id: 1,
      subtopic_schema_version: '1',
      version: '1'
    };

    secondBackendTopicObject = {
      id: '0',
      name: 'Topic Name 2',
      description: 'Topic Description 2',
      canonical_story_ids: ['story_3'],
      additional_story_ids: ['story_4'],
      uncategorized_skill_ids: ['skill_5'],
      subtopics: [
        {
          id: 1,
          title: 'Title',
          skill_ids: 'skill_2'
        }, {
          id: 2,
          title: 'Title 2',
          skill_ids: 'skill_3'
        }
      ],
      language_code: 'en',
      next_subtopic_id: 3,
      subtopic_schema_version: '1',
      version: '1'
    };

    topicRightsObject = {
      id: '0',
      can_edit_topic: 'true',
      is_published: 'true',
      can_publish_topic: 'true'
    };
    fakeTopicRightsBackendApiService.backendTopicRightsObject = (
      topicRightsObject);

    secondTopicRightsObject = {
      id: '0',
      can_edit_topic: 'true',
      is_published: 'false',
      can_publish_topic: 'false'
    };

    subtopicPageObject = {
      id: 'topicId-0',
      topic_id: 'topicId',
      html_data: '<p>Data</p>',
      language_code: 'en'
    };
    fakeTopicRightsBackendApiService.backendSubtopicPageObject = (
      subtopicPageObject);

    secondSubtopicPageObject = {
      id: 'topicId-0',
      topic_id: 'topicId',
      html_data: '<p>Data</p>',
      language_code: 'en'
    };
  }));

  it('should request to load the topic from the backend', function() {
    spyOn(
      fakeEditableTopicBackendApiService, 'fetchTopic').and.callThrough();

    TopicEditorStateService.loadTopic(5);
    expect(fakeEditableTopicBackendApiService.fetchTopic).toHaveBeenCalled();
  });

  it('should request to load the subtopic page from the backend', function() {
    spyOn(
      fakeEditableTopicBackendApiService, 'fetchSubtopicPage'
    ).and.callThrough();

    TopicEditorStateService.loadSubtopicPage('topicId', 1);
    expect(
      fakeEditableTopicBackendApiService.fetchSubtopicPage).toHaveBeenCalled();
  });

  it('should not request to load the subtopic page from the backend after ' +
     'loading it once', function() {
    spyOn(
      fakeEditableTopicBackendApiService, 'fetchSubtopicPage'
    ).and.callThrough();

    subtopicPage = SubtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    TopicEditorStateService.loadSubtopicPage('topicId', 0);
    expect(
      fakeEditableTopicBackendApiService.fetchSubtopicPage
    ).not.toHaveBeenCalled();
  });

  it('should request to load the topic rights from the backend',
    function() {
      spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRights')
        .and.callThrough();

      TopicEditorStateService.loadTopic(5);
      expect(fakeTopicRightsBackendApiService.fetchTopicRights)
        .toHaveBeenCalled();
    }
  );

  it('should fire an init event after loading the first topic',
    function() {
      spyOn($rootScope, '$broadcast').and.callThrough();

      TopicEditorStateService.loadTopic(5);
      $rootScope.$apply();

      expect($rootScope.$broadcast).toHaveBeenCalledWith('topicInitialized');
    }
  );

  it('should fire a loaded event after loading a new subtopic page',
    function() {
      spyOn($rootScope, '$broadcast').and.callThrough();

      TopicEditorStateService.loadSubtopicPage('topicId', 1);
      $rootScope.$apply();

      expect($rootScope.$broadcast).toHaveBeenCalledWith('subtopicPageLoaded');
    }
  );

  it('should fire an update event after loading more topics', function() {
    // Load initial topic.
    TopicEditorStateService.loadTopic(5);
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').and.callThrough();

    // Load a second topic.
    TopicEditorStateService.loadTopic(1);
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith('topicReinitialized');
  });

  it('should track whether it is currently loading the topic', function() {
    expect(TopicEditorStateService.isLoadingTopic()).toBe(false);

    TopicEditorStateService.loadTopic(5);
    expect(TopicEditorStateService.isLoadingTopic()).toBe(true);

    $rootScope.$apply();
    expect(TopicEditorStateService.isLoadingTopic()).toBe(false);
  });

  it('should indicate a topic is no longer loading after an error',
    function() {
      expect(TopicEditorStateService.isLoadingTopic()).toBe(false);
      fakeEditableTopicBackendApiService.failure = 'Internal 500 error';

      TopicEditorStateService.loadTopic(5);
      expect(TopicEditorStateService.isLoadingTopic()).toBe(true);

      $rootScope.$apply();
      expect(TopicEditorStateService.isLoadingTopic()).toBe(false);
    }
  );

  it('it should report that a topic has loaded through loadTopic()',
    function() {
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(false);

      TopicEditorStateService.loadTopic(5);
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(false);

      $rootScope.$apply();
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(true);
    }
  );

  it('it should report that a topic has loaded through setTopic()',
    function() {
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(false);

      var newTopic = TopicObjectFactory.create(secondBackendTopicObject);
      TopicEditorStateService.setTopic(newTopic);
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(true);
    }
  );

  it('should initially return an interstitial topic', function() {
    var topic = TopicEditorStateService.getTopic();
    expect(topic.getId()).toEqual(null);
    expect(topic.getName()).toEqual('Topic name loading');
    expect(topic.getDescription()).toEqual('Topic description loading');
    expect(topic.getCanonicalStoryIds()).toEqual([]);
    expect(topic.getAdditionalStoryIds()).toEqual([]);
    expect(topic.getUncategorizedSkillIds()).toEqual([]);
    expect(topic.getSubtopics()).toEqual([]);
  });

  it('should initially return an interstitial subtopic page', function() {
    var subtopicPage = TopicEditorStateService.getSubtopicPage();
    expect(subtopicPage.getId()).toEqual(null);
    expect(subtopicPage.getTopicId()).toEqual(null);
    expect(subtopicPage.getHtmlData()).toEqual(null);
    expect(subtopicPage.getLanguageCode()).toEqual('en');
  });

  it('should initially return an interstitial topic rights object', function() {
    var topicRights = TopicEditorStateService.getTopicRights();
    expect(topicRights.isPublished()).toEqual(false);
    expect(topicRights.canEditTopic()).toEqual(false);
    expect(topicRights.canPublishTopic()).toEqual(false);
  });

  it('should be able to set a new topic with an in-place copy',
    function() {
      var previousTopic = TopicEditorStateService.getTopic();
      var expectedTopic = TopicObjectFactory.create(secondBackendTopicObject);
      expect(previousTopic).not.toEqual(expectedTopic);

      TopicEditorStateService.setTopic(expectedTopic);

      var actualTopic = TopicEditorStateService.getTopic();
      expect(actualTopic).toEqual(expectedTopic);

      expect(actualTopic).toBe(previousTopic);
      expect(actualTopic).not.toBe(expectedTopic);
    }
  );

  it('should be able to set a new topic rights with an in-place copy',
    function() {
      var previousTopicRights = TopicEditorStateService.getTopicRights();
      var expectedTopicRights = TopicRightsObjectFactory.createFromBackendDict(
        secondTopicRightsObject);
      expect(previousTopicRights).not.toEqual(expectedTopicRights);

      TopicEditorStateService.setTopicRights(expectedTopicRights);

      var actualTopicRights = TopicEditorStateService.getTopicRights();
      expect(actualTopicRights).toEqual(expectedTopicRights);

      expect(actualTopicRights).toBe(previousTopicRights);
      expect(actualTopicRights).not.toBe(expectedTopicRights);
    }
  );

  it('should fail to save the topic without first loading one',
    function() {
      expect(function() {
        TopicEditorStateService.saveTopic('Commit message');
      }).toThrow();
    }
  );

  it('should not save the topic if there are no pending changes',
    function() {
      TopicEditorStateService.loadTopic(5);
      $rootScope.$apply();

      spyOn($rootScope, '$broadcast').and.callThrough();
      expect(TopicEditorStateService.saveTopic(
        'Commit message')).toBe(false);
      expect($rootScope.$broadcast).not.toHaveBeenCalled();
    }
  );

  it('should be able to save the topic and pending changes', function() {
    spyOn(
      fakeEditableTopicBackendApiService,
      'updateTopic').and.callThrough();

    TopicEditorStateService.loadTopic(0);
    TopicUpdateService.setTopicName(
      TopicEditorStateService.getTopic(), 'New name');
    $rootScope.$apply();

    expect(TopicEditorStateService.saveTopic(
      'Commit message')).toBe(true);
    $rootScope.$apply();

    var expectedId = '0';
    var expectedVersion = '1';
    var expectedCommitMessage = 'Commit message';
    var updateTopicSpy = (
      fakeEditableTopicBackendApiService.updateTopic);
    expect(updateTopicSpy).toHaveBeenCalledWith(
      expectedId, expectedVersion, expectedCommitMessage, jasmine.any(Object));
  });

  it('should fire an update event after saving the topic', function() {
    TopicEditorStateService.loadTopic(5);
    TopicUpdateService.setTopicName(
      TopicEditorStateService.getTopic(), 'New name');
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').and.callThrough();
    TopicEditorStateService.saveTopic('Commit message');
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'topicReinitialized');
  });

  it('should track whether it is currently saving the topic', function() {
    TopicEditorStateService.loadTopic(5);
    TopicUpdateService.setTopicName(
      TopicEditorStateService.getTopic(), 'New name');
    $rootScope.$apply();

    expect(TopicEditorStateService.isSavingTopic()).toBe(false);
    TopicEditorStateService.saveTopic('Commit message');
    expect(TopicEditorStateService.isSavingTopic()).toBe(true);

    $rootScope.$apply();
    expect(TopicEditorStateService.isSavingTopic()).toBe(false);
  });

  it('should indicate a topic is no longer saving after an error',
    function() {
      TopicEditorStateService.loadTopic(5);
      TopicUpdateService.setTopicName(
        TopicEditorStateService.getTopic(), 'New name');
      $rootScope.$apply();

      expect(TopicEditorStateService.isSavingTopic()).toBe(false);
      fakeEditableTopicBackendApiService.failure = 'Internal 500 error';

      TopicEditorStateService.saveTopic('Commit message');
      expect(TopicEditorStateService.isSavingTopic()).toBe(true);

      $rootScope.$apply();
      expect(TopicEditorStateService.isSavingTopic()).toBe(false);
    }
  );
});
