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

// TODO(#7222): Remove the following block of unnnecessary imports once
// topic-editor-state.service.ts is upgraded to Angular 8.
import { StoryReferenceObjectFactory } from
  'domain/topic/StoryReferenceObjectFactory';
import { SubtopicPage } from
  'domain/topic/subtopic-page.model';
import { TopicRights } from 'domain/topic/topic-rights.model';
import { importAllAngularServices } from 'tests/unit-test-utils';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';
import { Subscription } from 'rxjs';

require('domain/topic/TopicObjectFactory.ts');
require('domain/topic/topic-update.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');

describe('Topic editor state service', function() {
  var TopicEditorStateService = null;
  var TopicObjectFactory = null;
  var topicUpdateService = null;
  var fakeEditableTopicBackendApiService = null;
  var fakeTopicRightsBackendApiService = null;
  var secondSubtopicPageObject = null;
  var secondBackendTopicObject = null;
  var secondTopicRightsObject = null;
  var $rootScope = null;
  var $q = null;

  var testSubscriptions = null;
  var subtopicPageLoadedSpy = null;

  const topicInitializedSpy = jasmine.createSpy('topicInitialized');
  const topicReinitializedSpy = jasmine.createSpy('topicReinitialized');

  var FakeEditableTopicBackendApiService = function() {
    var self = {
      newBackendSubtopicPageObject: null,
      newBackendTopicObject: null,
      backendStorySummariesObject: null,
      failure: null,
      fetchTopicAsync: null,
      fetchSubtopicPageAsync: null,
      updateTopicAsync: null,
      fetchStoriesAsync: null
    };

    var _fetchOrUpdateTopicAsync = async function() {
      return new Promise(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendTopicObject);
        } else {
          reject();
        }
      });
    };

    var _fetchStoriesAsync = async function() {
      return new Promise(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.backendStorySummariesObject);
        } else {
          reject();
        }
      });
    };

    var _fetchSubtopicPage = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendSubtopicPageObject);
        } else {
          reject();
        }
      });
    };

    self.newBackendSubtopicPageObject = {};
    self.newBackendTopicObject = {};
    self.backendStorySummariesObject = [];
    self.failure = null;
    self.fetchTopicAsync = _fetchOrUpdateTopicAsync;
    self.fetchSubtopicPageAsync = _fetchSubtopicPage;
    self.updateTopicAsync = _fetchOrUpdateTopicAsync;
    self.fetchStoriesAsync = _fetchStoriesAsync;

    return self;
  };

  var FakeTopicRightsBackendApiService = function() {
    var self = {
      backendTopicRightsObject: null,
      failure: null,
      fetchTopicRightsAsync: null
    };

    var _fetchTopicRightsAsync = async function() {
      return new Promise(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.backendTopicRightsObject);
        } else {
          reject();
        }
      });
    };

    self.backendTopicRightsObject = {};
    self.failure = null;
    self.fetchTopicRightsAsync = _fetchTopicRightsAsync;

    return self;
  };

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'StoryReferenceObjectFactory', new StoryReferenceObjectFactory());
  }));
  importAllAngularServices();

  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));
  beforeEach(angular.mock.module('oppia', function($provide) {
    fakeEditableTopicBackendApiService = (
      FakeEditableTopicBackendApiService());
    $provide.value(
      'EditableTopicBackendApiService',
      [fakeEditableTopicBackendApiService][0]);

    fakeTopicRightsBackendApiService = (
      FakeTopicRightsBackendApiService());
    $provide.value(
      'TopicRightsBackendApiService',
      [fakeTopicRightsBackendApiService][0]);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    TopicEditorStateService = $injector.get(
      'TopicEditorStateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    topicUpdateService = TestBed.get(TopicUpdateService);
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    fakeEditableTopicBackendApiService.newBackendTopicObject = {
      topicDict: {
        id: '0',
        name: 'Topic Name',
        description: 'Topic Description',
        canonical_story_references: [{
          story_id: 'story_1',
          story_is_published: true
        }],
        additional_story_references: [{
          story_id: 'story_2',
          story_is_published: true
        }],
        uncategorized_skill_ids: ['skill_1'],
        subtopics: [],
        language_code: 'en',
        next_subtopic_id: 1,
        subtopic_schema_version: '1',
        version: '1'
      },
      groupedSkillSummaries: {},
      skillIdToDescriptionDict: {
        skill_1: 'Description 1'
      },
      skillIdToRubricsDict: {
        skill_1: [{
          difficulty: 'Easy',
          explanations: ['Easy explanation']
        }, {
          difficulty: 'Medium',
          explanations: ['Medium explanation']
        }, {
          difficulty: 'Hard',
          explanations: ['Hard explanation']
        }]
      }
    };

    secondBackendTopicObject = {
      topicDict: {
        id: '0',
        name: 'Topic Name 2',
        description: 'Topic Description 2',
        canonical_story_references: [{
          story_id: 'story_3',
          story_is_published: true
        }],
        additional_story_references: [{
          story_id: 'story_4',
          story_is_published: true
        }],
        uncategorized_skill_ids: ['skill_5'],
        subtopics: [
          {
            id: 1,
            title: 'Title',
            skill_ids: ['skill_2']
          }, {
            id: 2,
            title: 'Title 2',
            skill_ids: ['skill_3']
          }
        ],
        language_code: 'en',
        next_subtopic_id: 3,
        subtopic_schema_version: '1',
        version: '1'
      },
      groupedSkillSummaries: {},
      skillIdToDescriptionDict: {
        skill_2: 'Description 2',
        skill_3: 'Description 3',
        skill_5: 'Description 5'
      },
      skillIdToRubricsDict: {
        skill_2: [],
        skill_3: [],
        skill_5: []
      }
    };

    var topicRightsObject = {
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

    var subtopicPageObject = {
      id: 'validTopicId-0',
      topic_id: 'validTopicId',
      page_contents: {
        subtitled_html: {
          html: '<p>Data</p>',
          content_id: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {}
          }
        }
      },
      language_code: 'en'
    };
    fakeEditableTopicBackendApiService.newBackendSubtopicPageObject = (
      subtopicPageObject);

    secondSubtopicPageObject = {
      id: 'validTopicId-0',
      topic_id: 'validTopicId',
      page_contents: {
        subtitled_html: {
          html: '<p>Data</p>',
          content_id: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {}
          }
        }
      },
      language_code: 'en'
    };
  }));

  beforeEach(() => {
    subtopicPageLoadedSpy = jasmine.createSpy('subtopicPageLoaded');
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      TopicEditorStateService.onSubtopicPageLoaded.subscribe(
        subtopicPageLoadedSpy));
    testSubscriptions.add(TopicEditorStateService.onTopicInitialized.subscribe(
      topicInitializedSpy));
    testSubscriptions.add(
      TopicEditorStateService.onTopicReinitialized.subscribe(
        topicReinitializedSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should request to load the topic from the backend', function() {
    spyOn(
      fakeEditableTopicBackendApiService, 'fetchTopicAsync').and.callThrough();

    TopicEditorStateService.loadTopic(5);
    expect(
      fakeEditableTopicBackendApiService.fetchTopicAsync).toHaveBeenCalled();
  });

  it('should request to load the subtopic page from the backend', function() {
    spyOn(
      fakeEditableTopicBackendApiService, 'fetchSubtopicPageAsync'
    ).and.callThrough();

    TopicEditorStateService.loadSubtopicPage('validTopicId', 1);
    expect(
      fakeEditableTopicBackendApiService.fetchSubtopicPageAsync
    ).toHaveBeenCalled();
  });

  it('should not request to load the subtopic page from the backend after ' +
     'loading it once', function() {
    spyOn(
      fakeEditableTopicBackendApiService, 'fetchSubtopicPageAsync'
    ).and.callThrough();

    var subtopicPage = SubtopicPage.createFromBackendDict(
      secondSubtopicPageObject);
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    TopicEditorStateService.loadSubtopicPage('validTopicId', 0);
    expect(
      fakeEditableTopicBackendApiService.fetchSubtopicPageAsync
    ).not.toHaveBeenCalled();
  });

  it('should not add duplicate subtopic pages to the local cache', function() {
    var subtopicPage = SubtopicPage.createFromBackendDict(
      secondSubtopicPageObject);
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    subtopicPage.getPageContents().setHtml('<p>New Data</p>');
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    expect(
      TopicEditorStateService.getSubtopicPage().getPageContents().getHtml()
    ).toEqual('<p>New Data</p>');
  });

  it('should correctly delete newly created subtopic pages from the ' +
    'local cache', function() {
    var subtopicPage = SubtopicPage.createFromBackendDict(
      secondSubtopicPageObject);
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    subtopicPage.setId('validTopicId-1');
    subtopicPage.getPageContents().setHtml('<p>Data 1</p>');
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    subtopicPage.setId('validTopicId-2');
    subtopicPage.getPageContents().setHtml('<p>Data 2</p>');
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(3);
    TopicEditorStateService.deleteSubtopicPage('validTopicId', 1);
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(2);

    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getId()
    ).toEqual('validTopicId-0');
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getPageContents()
        .getHtml()
    ).toEqual('<p>Data</p>');
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[1].getId()
    ).toEqual('validTopicId-1');
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[1].getPageContents()
        .getHtml()
    ).toEqual('<p>Data 2</p>');
  });

  it('should correctly delete new subtopic pages without changing already ' +
    'existing subtopic pages from the local cache', function() {
    var subtopicPage = SubtopicPage.createFromBackendDict(
      secondSubtopicPageObject);
    subtopicPage.setId('validTopicId-1');
    subtopicPage.getPageContents().setHtml('<p>Data 1</p>');
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    TopicEditorStateService.loadSubtopicPage('validTopicId', 0);
    $rootScope.$apply();
    expect(subtopicPageLoadedSpy).toHaveBeenCalled();
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toBe(2);
    TopicEditorStateService.deleteSubtopicPage('validTopicId', 1);

    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getId()
    ).toEqual('validTopicId-0');
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getPageContents()
        .getHtml()
    ).toEqual('<p>Data</p>');
  });

  it('should correctly delete already existing subtopic pages without ' +
    'changing newly created subtopic pages from the local cache', function() {
    var subtopicPage = SubtopicPage.createFromBackendDict(
      secondSubtopicPageObject);
    subtopicPage.setId('validTopicId-1');
    subtopicPage.getPageContents().setHtml('<p>Data 1</p>');
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    TopicEditorStateService.loadSubtopicPage('validTopicId', 0);
    $rootScope.$apply();
    expect(subtopicPageLoadedSpy).toHaveBeenCalled();
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toBe(2);
    TopicEditorStateService.deleteSubtopicPage('validTopicId', 0);

    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getId()
    ).toEqual('validTopicId-1');
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getPageContents()
        .getHtml()
    ).toEqual('<p>Data 1</p>');
  });

  it('should request to load the topic rights from the backend',
    function() {
      spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
        .and.callThrough();

      TopicEditorStateService.loadTopic(5);
      expect(fakeTopicRightsBackendApiService.fetchTopicRightsAsync)
        .toHaveBeenCalled();
    }
  );

  it('should fire an init event after loading the first topic',
    fakeAsync(() => {
      spyOn(fakeEditableTopicBackendApiService, 'updateTopicAsync')
        .and.callThrough();
      spyOn(fakeEditableTopicBackendApiService, 'fetchTopicAsync')
        .and.callThrough();
      spyOn(fakeEditableTopicBackendApiService, 'fetchStoriesAsync')
        .and.callThrough();
      spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
        .and.callThrough();
      TopicEditorStateService.loadTopic(5);
      flushMicrotasks();
      $rootScope.$apply();
      var skillIdToRubricsObject =
        TopicEditorStateService.getSkillIdToRubricsObject();
      expect(skillIdToRubricsObject.skill_1.length).toEqual(3);
      expect(topicInitializedSpy).toHaveBeenCalled();
    }));

  it('should fire a loaded event after loading a new subtopic page',
    function() {
      TopicEditorStateService.loadSubtopicPage('validTopicId', 1);
      $rootScope.$apply();
      expect(subtopicPageLoadedSpy).toHaveBeenCalled();
    }
  );

  it('should fire an update event after loading more topics', fakeAsync(() => {
    spyOn(fakeEditableTopicBackendApiService, 'updateTopicAsync')
      .and.callThrough();
    spyOn(fakeEditableTopicBackendApiService, 'fetchTopicAsync')
      .and.callThrough();
    spyOn(fakeEditableTopicBackendApiService, 'fetchStoriesAsync')
      .and.callThrough();
    spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
      .and.callThrough();
    // Load initial topic.
    TopicEditorStateService.loadTopic(5);
    flushMicrotasks();
    $rootScope.$apply();

    // Load a second topic.
    TopicEditorStateService.loadTopic(1);
    flushMicrotasks();
    $rootScope.$apply();

    expect(topicReinitializedSpy).toHaveBeenCalled();
  }));

  it('should track whether it is currently' +
    'loading the topic', fakeAsync(() => {
    spyOn(fakeEditableTopicBackendApiService, 'updateTopicAsync')
      .and.callThrough();
    spyOn(fakeEditableTopicBackendApiService, 'fetchTopicAsync')
      .and.callThrough();
    spyOn(fakeEditableTopicBackendApiService, 'fetchStoriesAsync')
      .and.callThrough();
    spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
      .and.callThrough();
    expect(TopicEditorStateService.isLoadingTopic()).toBe(false);

    TopicEditorStateService.loadTopic(5);
    expect(TopicEditorStateService.isLoadingTopic()).toBe(true);

    flushMicrotasks();
    $rootScope.$apply();
    expect(TopicEditorStateService.isLoadingTopic()).toBe(false);
  }));

  it('should indicate a topic is no longer loading after an error',
    fakeAsync(() => {
      spyOn(fakeEditableTopicBackendApiService, 'updateTopicAsync')
        .and.callThrough();
      spyOn(fakeEditableTopicBackendApiService, 'fetchTopicAsync')
        .and.callThrough();
      spyOn(fakeEditableTopicBackendApiService, 'fetchStoriesAsync')
        .and.callThrough();
      spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
        .and.callThrough();
      expect(TopicEditorStateService.isLoadingTopic()).toBe(false);
      fakeEditableTopicBackendApiService.failure = 'Internal 500 error';

      TopicEditorStateService.loadTopic(5);
      expect(TopicEditorStateService.isLoadingTopic()).toBe(true);

      flushMicrotasks();
      $rootScope.$apply();
      expect(TopicEditorStateService.isLoadingTopic()).toBe(false);
    }));

  it('should report that a topic has loaded through loadTopic()',
    fakeAsync(() => {
      spyOn(fakeEditableTopicBackendApiService, 'updateTopicAsync')
        .and.callThrough();
      spyOn(fakeEditableTopicBackendApiService, 'fetchTopicAsync')
        .and.callThrough();
      spyOn(fakeEditableTopicBackendApiService, 'fetchStoriesAsync')
        .and.callThrough();
      spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
        .and.callThrough();
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(false);

      TopicEditorStateService.loadTopic(5);
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(false);

      flushMicrotasks();
      $rootScope.$apply();
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(true);
    }));

  it('should report that a topic has loaded through setTopic()',
    function() {
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(false);

      var newTopic = TopicObjectFactory.create(
        secondBackendTopicObject.topicDict,
        secondBackendTopicObject.skillIdToDescriptionDict);
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
    expect(topic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(topic.getSubtopics()).toEqual([]);
  });

  it('should initially return an interstitial subtopic page', function() {
    var subtopicPage = TopicEditorStateService.getSubtopicPage();
    expect(subtopicPage.getId()).toEqual(null);
    expect(subtopicPage.getTopicId()).toEqual(null);
    expect(subtopicPage.getPageContents()).toEqual(null);
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
      var expectedTopic = TopicObjectFactory.create(
        secondBackendTopicObject.topicDict,
        secondBackendTopicObject.skillIdToDescriptionDict
      );
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
      var expectedTopicRights = TopicRights.createFromBackendDict(
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
      }).toThrowError('Cannot save a topic before one is loaded.');
    }
  );

  it('should not save the topic if there are no pending changes',
    fakeAsync(() => {
      spyOn(fakeEditableTopicBackendApiService, 'updateTopicAsync')
        .and.callThrough();
      spyOn(fakeEditableTopicBackendApiService, 'fetchTopicAsync')
        .and.callThrough();
      spyOn(fakeEditableTopicBackendApiService, 'fetchStoriesAsync')
        .and.callThrough();
      spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
        .and.callThrough();
      TopicEditorStateService.loadTopic(5);
      flushMicrotasks();
      $rootScope.$apply();
      expect(TopicEditorStateService.saveTopic(
        'Commit message')).toBe(false);
    }));

  it('should be able to save the topic and pending changes', fakeAsync(() => {
    spyOn(fakeEditableTopicBackendApiService, 'updateTopicAsync')
      .and.callThrough();
    spyOn(fakeEditableTopicBackendApiService, 'fetchTopicAsync')
      .and.callThrough();
    spyOn(fakeEditableTopicBackendApiService, 'fetchStoriesAsync')
      .and.callThrough();
    spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
      .and.callThrough();

    TopicEditorStateService.loadTopic(0);
    flushMicrotasks();
    topicUpdateService.setTopicName(
      TopicEditorStateService.getTopic(), 'New name');
    $rootScope.$apply();

    expect(TopicEditorStateService.saveTopic(
      'Commit message')).toBe(true);
    $rootScope.$apply();

    var expectedId = '0';
    var expectedVersion = '1';
    var expectedCommitMessage = 'Commit message';
    var updateTopicSpy = (
      fakeEditableTopicBackendApiService.updateTopicAsync);
    expect(updateTopicSpy).toHaveBeenCalledWith(
      expectedId, expectedVersion, expectedCommitMessage, jasmine.any(Object));
  }));

  it('should fire an update event after saving the topic', fakeAsync(() => {
    spyOn(fakeEditableTopicBackendApiService, 'updateTopicAsync')
      .and.callThrough();
    spyOn(fakeEditableTopicBackendApiService, 'fetchTopicAsync')
      .and.callThrough();
    spyOn(fakeEditableTopicBackendApiService, 'fetchStoriesAsync')
      .and.callThrough();
    spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
      .and.callThrough();
    TopicEditorStateService.loadTopic(5);
    topicUpdateService.setTopicName(
      TopicEditorStateService.getTopic(), 'New name');
    flushMicrotasks();
    $rootScope.$apply();

    TopicEditorStateService.saveTopic('Commit message');
    flushMicrotasks();
    $rootScope.$apply();

    expect(topicReinitializedSpy).toHaveBeenCalled();
  }));

  it('should track whether it is currently saving the topic', fakeAsync(() => {
    spyOn(fakeEditableTopicBackendApiService, 'updateTopicAsync')
      .and.callThrough();
    spyOn(fakeEditableTopicBackendApiService, 'fetchTopicAsync')
      .and.callThrough();
    spyOn(fakeEditableTopicBackendApiService, 'fetchStoriesAsync')
      .and.callThrough();
    spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
      .and.callThrough();
    TopicEditorStateService.loadTopic(5);
    flushMicrotasks();
    topicUpdateService.setTopicName(
      TopicEditorStateService.getTopic(), 'New name');
    $rootScope.$apply();

    expect(TopicEditorStateService.isSavingTopic()).toBe(false);
    TopicEditorStateService.saveTopic('Commit message');
    expect(TopicEditorStateService.isSavingTopic()).toBe(true);

    flushMicrotasks();
    $rootScope.$apply();
    expect(TopicEditorStateService.isSavingTopic()).toBe(false);
  }));

  it('should indicate a topic is no longer saving after an error',
    fakeAsync(() => {
      spyOn(fakeEditableTopicBackendApiService, 'updateTopicAsync')
        .and.callThrough();
      spyOn(fakeEditableTopicBackendApiService, 'fetchTopicAsync')
        .and.callThrough();
      spyOn(fakeEditableTopicBackendApiService, 'fetchStoriesAsync')
        .and.callThrough();
      spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRightsAsync')
        .and.callThrough();
      TopicEditorStateService.loadTopic(5);
      flushMicrotasks();
      topicUpdateService.setTopicName(
        TopicEditorStateService.getTopic(), 'New name');
      $rootScope.$apply();

      expect(TopicEditorStateService.isSavingTopic()).toBe(false);
      fakeEditableTopicBackendApiService.failure = 'Internal 500 error';

      TopicEditorStateService.saveTopic('Commit message');
      expect(TopicEditorStateService.isSavingTopic()).toBe(true);

      flushMicrotasks();
      $rootScope.$apply();
      expect(TopicEditorStateService.isSavingTopic()).toBe(false);
    }));
});
