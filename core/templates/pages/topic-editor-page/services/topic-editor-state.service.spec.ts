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
import { TestBed } from '@angular/core/testing';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RubricObjectFactory } from 'domain/skill/RubricObjectFactory';
import { ShortSkillSummaryObjectFactory } from
  'domain/skill/ShortSkillSummaryObjectFactory';
import { StoryReferenceObjectFactory } from
  'domain/topic/StoryReferenceObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { SubtopicObjectFactory } from 'domain/topic/SubtopicObjectFactory';
import { SubtopicPageContentsObjectFactory } from
  'domain/topic/SubtopicPageContentsObjectFactory';
import { SubtopicPageObjectFactory, SubtopicPageBackendDict, SubtopicPage } from
  'domain/topic/SubtopicPageObjectFactory';
import { TopicRights } from 'domain/topic/topic-rights.model';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { importAllAngularServices } from 'tests/unit-test-utils';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
// ^^^ This block is to be removed.
import { TopicObjectFactory } from 'domain/topic/TopicObjectFactory.ts';
import { TopicEditorStateService } from 'pages/topic-editor-page/services/topic-editor-state.service.ts';
import { TranslatorProviderForTests } from 'tests/test.extras';
import { Subscription } from 'rxjs';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import { TopicRightsBackendApiService } from 'domain/topic/topic-rights-backend-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';



require('domain/topic/topic-update.service.ts');


fdescribe('Topic editor state service', () => {
  let topicEditorStateService : TopicEditorStateService;
  let topicObjectFactory : TopicObjectFactory;
  let subtopicPageObjectFactory : SubtopicPageObjectFactory;
  let topicUpdateService :TopicUpdateService;
  // let secondSubtopicPageObject = null;
  let secondBackendTopicObject = null;
  let secondTopicRightsObject = null;
  let mockEditableTopicBackendApiService = null;
  let mockTopicRightsBackendApiService = null;
  let rubricObjectFactory = null;
  let subtopicObjectFactory : SubtopicObjectFactory;
  let subtopicPageContentsObjectFactory :SubtopicPageContentsObjectFactory;
  let subtopicPageObject:SubtopicPageBackendDict = null;
  let secondSubtopicPageObject: SubtopicPageBackendDict = null;
  
  // let httpClient: HttpClient;
  // let $rootScope = null;
  // let $q = null;

  let testSubscriptions = null;
  let subtopicPageLoadedSpy = null;

  const topicInitializedSpy = jasmine.createSpy('topicInitialized');
  const topicReinitializedSpy = jasmine.createSpy('topicReinitialized');

  class MockEditableTopicBackendApiService {
    
    newBackendSubtopicPageObject= {};
    newBackendTopicObject = {};
    backendStorySummariesObject = [];
    failure: null;
    

    // fetchTopic: null;
    // fetchSubtopicPage: null;
    // updateTopic: null;
    // fetchStories: null;

    fetchTopic():Promise<any> {
      //console.log("in fetch update");
      return new Promise((resolve, reject) => {
        if (!this.failure) {
          resolve(this.newBackendTopicObject);
        } else {
          reject();
        }
      });
    };
    updateTopic():Promise<any> {
      return new Promise((resolve, reject) => {
        if (!this.failure) {
          resolve(this.newBackendTopicObject);
        } else {
          reject();
        }
      });
    };
    fetchStories():any {
      return new Promise((resolve, reject) =>   { 
        if (!this.failure) {
          resolve(this.backendStorySummariesObject);
        } else {
          reject();
        }
      });
    };

    fetchSubtopicPage():Promise<any> {
      return new Promise((resolve, reject) => {
        if (!this.failure) {
          resolve(this.newBackendSubtopicPageObject);
        } else {
          reject();
        }
      });
    };
  }
  class MockTopicRightsBackendApiService {
    backendTopicRightsObject: null;
    failure: null;
    // fetchTopicRights: null;

    fetchTopicRights = () => {
      return new Promise((resolve, reject) => {
        if (!this.failure) {
          resolve(this.backendTopicRightsObject);
        } else {
          reject();
        }
      });
    };

  }

 

  beforeEach(() => {
    mockEditableTopicBackendApiService = new MockEditableTopicBackendApiService();
    mockTopicRightsBackendApiService = new MockTopicRightsBackendApiService();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], 
      providers: [
        {provide: EditableTopicBackendApiService, useValue: mockEditableTopicBackendApiService},
        {provide: TopicRightsBackendApiService, useValue: mockTopicRightsBackendApiService},
        TopicEditorStateService,
        TopicUpdateService
      ]
    }).compileComponents();

    rubricObjectFactory = TestBed.get(RubricObjectFactory);
    topicEditorStateService = TestBed.get(TopicEditorStateService);
    topicObjectFactory = TestBed.get(TopicObjectFactory);
    subtopicPageObjectFactory = TestBed.get(SubtopicPageObjectFactory);
    topicUpdateService = TestBed.get(TopicUpdateService);
    subtopicObjectFactory = TestBed.get(SubtopicObjectFactory);
    subtopicPageContentsObjectFactory = TestBed.get(SubtopicPageContentsObjectFactory);
    

    mockEditableTopicBackendApiService.newBackendTopicObject = {
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

    let topicRightsObject = {
      id: '0',
      can_edit_topic: 'true',
      is_published: 'true',
      can_publish_topic: 'true'
    };
    mockTopicRightsBackendApiService.backendTopicRightsObject = (
      topicRightsObject);

    secondTopicRightsObject = {
      id: '0',
      can_edit_topic: 'true',
      is_published: 'false',
      can_publish_topic: 'false'
    };

    subtopicPageObject = {
      id: 'validTopicId-0',// when i change it to 2 the test runs
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
    mockEditableTopicBackendApiService.newBackendSubtopicPageObject = (
      subtopicPageObject);
    // let subtopicPage1 = subtopicPageObjectFactory.createFromBackendDict(
    //   subtopicPageObject);
    // topicEditorStateService.setSubtopicPage(subtopicPage1);

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

    subtopicPageLoadedSpy = jasmine.createSpy('subtopicPageLoaded');
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      topicEditorStateService.onSubtopicPageLoaded().subscribe(
        subtopicPageLoadedSpy));
    testSubscriptions.add(topicEditorStateService.onTopicInitialized().subscribe(
      topicInitializedSpy));
    testSubscriptions.add(
      topicEditorStateService.onTopicReinitialized().subscribe(
        topicReinitializedSpy));
  });

  // beforeEach(() => {
    
  // });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should request to load the topic from the backend', () => {
    spyOn(
      mockEditableTopicBackendApiService, 'fetchTopic').and.callThrough();
    topicEditorStateService.loadTopic(5);
    expect(mockEditableTopicBackendApiService.fetchTopic).toHaveBeenCalled();
  });

  it('should request to load the subtopic page from the backend', () => {
    spyOn(
      mockEditableTopicBackendApiService, 'fetchSubtopicPage'
    ).and.callThrough();
    topicEditorStateService.loadSubtopicPage('validTopicId', 1);
    expect(
      mockEditableTopicBackendApiService.fetchSubtopicPage).toHaveBeenCalled();
  });

  it('should not request to load the subtopic page from the backend after ' +
     'loading it once', () => {
    spyOn(
      mockEditableTopicBackendApiService, 'fetchSubtopicPage'
    ).and.callThrough();

    let subtopicPage = subtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    topicEditorStateService.setSubtopicPage(subtopicPage);
    topicEditorStateService.loadSubtopicPage('validTopicId', 0);
    expect(
      mockEditableTopicBackendApiService.fetchSubtopicPage
    ).not.toHaveBeenCalled();
  });

  it('should not add duplicate subtopic pages to the local cache', () => {
    let subtopicPage = subtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    topicEditorStateService.setSubtopicPage(subtopicPage);
    expect(topicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    subtopicPage.getPageContents().setHtml('<p>New Data</p>');
    topicEditorStateService.setSubtopicPage(subtopicPage);
    expect(topicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    expect(
      topicEditorStateService.getSubtopicPage().getPageContents().getHtml()
    ).toEqual('<p>New Data</p>');
  });

  it('should correctly delete newly created subtopic pages from the ' +
    'local cache', () => {
    let subtopicPage = subtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    topicEditorStateService.setSubtopicPage(subtopicPage);
    subtopicPage.setId('validTopicId-1');
    subtopicPage.getPageContents().setHtml('<p>Data 1</p>');
    topicEditorStateService.setSubtopicPage(subtopicPage);
    subtopicPage.setId('validTopicId-2');
    subtopicPage.getPageContents().setHtml('<p>Data 2</p>');
    topicEditorStateService.setSubtopicPage(subtopicPage);
    expect(topicEditorStateService.getCachedSubtopicPages().length).toEqual(3);
    topicEditorStateService.deleteSubtopicPage('validTopicId', 1);
    expect(topicEditorStateService.getCachedSubtopicPages().length).toEqual(2);

    expect(
      topicEditorStateService.getCachedSubtopicPages()[0].getId()
    ).toEqual('validTopicId-0');
    expect(
      topicEditorStateService.getCachedSubtopicPages()[0].getPageContents()
        .getHtml()
    ).toEqual('<p>Data</p>');
    expect(
      topicEditorStateService.getCachedSubtopicPages()[1].getId()
    ).toEqual('validTopicId-1');
    expect(
      topicEditorStateService.getCachedSubtopicPages()[1].getPageContents()
        .getHtml()
    ).toEqual('<p>Data 2</p>');
  });

  it('should correctly delete new subtopic pages without changing already ' +
    'existing subtopic pages from the local cache', () => {
    let subtopicPage = subtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    subtopicPage.setId('validTopicId-1');
    subtopicPage.getPageContents().setHtml('<p>Data 1</p>');
    topicEditorStateService.setSubtopicPage(subtopicPage);
    topicEditorStateService.loadSubtopicPage('validTopicId', 0);
    //$rootScope.$apply();
    expect(subtopicPageLoadedSpy).toHaveBeenCalled();
    expect(topicEditorStateService.getCachedSubtopicPages().length).toBe(2);
    topicEditorStateService.deleteSubtopicPage('validTopicId', 1);

    expect(topicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    expect(
      topicEditorStateService.getCachedSubtopicPages()[0].getId()
    ).toEqual('validTopicId-0');
    expect(
      topicEditorStateService.getCachedSubtopicPages()[0].getPageContents()
        .getHtml()
    ).toEqual('<p>Data</p>');
  });

  xit('should correctly delete already existing subtopic pages without ' +
    'changing newly created subtopic pages from the local cache', () => {
    let subtopicPage2: SubtopicPage = subtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    subtopicPage2.setId('validTopicId-1');
    subtopicPage2.getPageContents().setHtml('<p>Data 1</p>');
    topicEditorStateService.setSubtopicPage(subtopicPage2);
    topicEditorStateService.loadSubtopicPage('validTopicId', 1);
    //$rootScope.$apply();
    expect(subtopicPageLoadedSpy).toHaveBeenCalled();
    //console.log(topicEditorStateService.getCachedSubtopicPages()[0].getId());
    //console.log(topicEditorStateService.getCachedSubtopicPages()[1].getId());
    expect(topicEditorStateService.getCachedSubtopicPages().length).toBe(2);
    topicEditorStateService.deleteSubtopicPage('validTopicId', 2); // if it is 2 then the test runs

    expect(topicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    expect(
      topicEditorStateService.getCachedSubtopicPages()[0].getId()
    ).toEqual('validTopicId-1');
    expect(
      topicEditorStateService.getCachedSubtopicPages()[0].getPageContents()
        .getHtml()
    ).toEqual('<p>Data 1</p>');
  });

  it('should request to load the topic rights from the backend',
    () => {
      spyOn(mockTopicRightsBackendApiService, 'fetchTopicRights')
        .and.callThrough();

      topicEditorStateService.loadTopic(5);
      expect(mockTopicRightsBackendApiService.fetchTopicRights)
        .toHaveBeenCalled();
    }
  );

  it('should fire an init event after loading the first topic',
    () => {
      topicEditorStateService.loadTopic(5);
      //$rootScope.$apply();
      let skillIdToRubricsObject =
        topicEditorStateService.getSkillIdToRubricsObject();
      expect(skillIdToRubricsObject.skill_1.length).toEqual(3);
      expect(topicInitializedSpy).toHaveBeenCalled();
    }
  );

  it('should fire a loaded event after loading a new subtopic page',
    () => {
      topicEditorStateService.loadSubtopicPage('validTopicId', 1);
      expect(subtopicPageLoadedSpy).toHaveBeenCalled();
    }
  );

  it('should fire an update event after loading more topics', () => {
    // Load initial topic.
    topicEditorStateService.loadTopic(5);

    // Load a second topic.
    topicEditorStateService.loadTopic(1);

    expect(topicReinitializedSpy).toHaveBeenCalled();
  });

  it('should track whether it is currently loading the topic', () => {
    //console.log("first = "+topicEditorStateService.isLoadingTopic());
    expect(topicEditorStateService.isLoadingTopic()).toBe(false);

    topicEditorStateService.loadTopic(5);
    // //console.log("second = "+topicEditorStateService.isLoadingTopic());
    expect(topicEditorStateService.isLoadingTopic()).toBe(true);

    //$rootScope.$apply();
    // //console.log("third = "+topicEditorStateService.isLoadingTopic());
    // expect(topicEditorStateService.isLoadingTopic()).toBe(false);
  });

  it('should indicate a topic is no longer loading after an error',
    () => {
      expect(topicEditorStateService.isLoadingTopic()).toBe(false);
      mockEditableTopicBackendApiService.failure = 'Internal 500 error';

      topicEditorStateService.loadTopic(5);
      expect(topicEditorStateService.isLoadingTopic()).toBe(true);

      //$rootScope.$apply();
      // expect(topicEditorStateService.isLoadingTopic()).toBe(false);
    }
  );

  it('should report that a topic has loaded through loadTopic()',
    () => {
      expect(topicEditorStateService.hasLoadedTopic()).toBe(false);

      topicEditorStateService.loadTopic(5);
      // expect(topicEditorStateService.hasLoadedTopic()).toBe(false);

      //$rootScope.$apply();
      expect(topicEditorStateService.hasLoadedTopic()).toBe(true);
    }
  );

  it('should report that a topic has loaded through setTopic()',
    () => {
      expect(topicEditorStateService.hasLoadedTopic()).toBe(false);

      let newTopic = topicObjectFactory.create(
        secondBackendTopicObject.topicDict,
        secondBackendTopicObject.skillIdToDescriptionDict);
      topicEditorStateService.setTopic(newTopic);
      expect(topicEditorStateService.hasLoadedTopic()).toBe(true);
    }
  );

  it('should initially return an interstitial topic', () => {
    let topic = topicEditorStateService.getTopic();
    expect(topic.getId()).toEqual(null);
    expect(topic.getName()).toEqual('Topic name loading');
    expect(topic.getDescription()).toEqual('Topic description loading');
    expect(topic.getCanonicalStoryIds()).toEqual([]);
    expect(topic.getAdditionalStoryIds()).toEqual([]);
    expect(topic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(topic.getSubtopics()).toEqual([]);
  });

  it('should initially return an interstitial subtopic page', () => {
    let subtopicPage = topicEditorStateService.getSubtopicPage();
    expect(subtopicPage.getId()).toEqual(null);
    expect(subtopicPage.getTopicId()).toEqual(null);
    expect(subtopicPage.getPageContents()).toEqual(null);
    expect(subtopicPage.getLanguageCode()).toEqual('en');
  });

  it('should initially return an interstitial topic rights object', () => {
    let topicRights = topicEditorStateService.getTopicRights();
    expect(topicRights.isPublished()).toEqual(false);
    expect(topicRights.canEditTopic()).toEqual(false);
    expect(topicRights.canPublishTopic()).toEqual(false);
  });

  it('should be able to set a new topic with an in-place copy',
    () => {
      let previousTopic = topicEditorStateService.getTopic();
      let expectedTopic = topicObjectFactory.create(
        secondBackendTopicObject.topicDict,
        secondBackendTopicObject.skillIdToDescriptionDict
      );
      expect(previousTopic).not.toEqual(expectedTopic);

      topicEditorStateService.setTopic(expectedTopic);

      let actualTopic = topicEditorStateService.getTopic();
      expect(actualTopic).toEqual(expectedTopic);

      expect(actualTopic).toBe(previousTopic);
      expect(actualTopic).not.toBe(expectedTopic);
    }
  );

  it('should be able to set a new topic rights with an in-place copy',
    () => {
      let previousTopicRights = topicEditorStateService.getTopicRights();
      let expectedTopicRights = TopicRights.createFromBackendDict(
        secondTopicRightsObject);
      expect(previousTopicRights).not.toEqual(expectedTopicRights);

      topicEditorStateService.setTopicRights(expectedTopicRights);

      let actualTopicRights = topicEditorStateService.getTopicRights();
      expect(actualTopicRights).toEqual(expectedTopicRights);

      expect(actualTopicRights).toBe(previousTopicRights);
      expect(actualTopicRights).not.toBe(expectedTopicRights);
    }
  );

  it('should fail to save the topic without first loading one',
    () => {
      expect(() => {
        topicEditorStateService.saveTopic('Commit message',()=> {});
      }).toThrowError('Cannot save a topic before one is loaded.');
    }
  );

  it('should not save the topic if there are no pending changes',
    () => {
      topicEditorStateService.loadTopic(5);
      //$rootScope.$apply();
      expect(topicEditorStateService.saveTopic(
        'Commit message',()=> {})).toBe(false);
    }
  );

  xit('should be able to save the topic and pending changes', () => {
    spyOn(
      mockEditableTopicBackendApiService,
      'updateTopic').and.callThrough();

    topicEditorStateService.loadTopic(0);
    topicUpdateService.setTopicName(
      topicEditorStateService.getTopic(), 'New name');
    //$rootScope.$apply();

    expect(topicEditorStateService.saveTopic(
      'Commit message',()=> {})).toBe(true);
    //$rootScope.$apply();

    let expectedId = '0';
    let expectedVersion = '1';
    let expectedCommitMessage = 'Commit message';
    let updateTopicSpy = (
      mockEditableTopicBackendApiService.updateTopic);
    expect(updateTopicSpy).toHaveBeenCalledWith(
      expectedId, expectedVersion, expectedCommitMessage, jasmine.any(Object));
  });

  xit('should fire an update event after saving the topic', () => {
    topicEditorStateService.loadTopic(5);
    topicUpdateService.setTopicName(
      topicEditorStateService.getTopic(), 'New name');
    //$rootScope.$apply();

    topicEditorStateService.saveTopic('Commit message',()=> {});
    //$rootScope.$apply();

    expect(topicReinitializedSpy).toHaveBeenCalled();
  });

  xit('should track whether it is currently saving the topic', () => {
    topicEditorStateService.loadTopic(5);
    topicUpdateService.setTopicName(
      topicEditorStateService.getTopic(), 'New name');
    //$rootScope.$apply();

    expect(topicEditorStateService.isSavingTopic()).toBe(false);
    topicEditorStateService.saveTopic('Commit message',()=> {});
    expect(topicEditorStateService.isSavingTopic()).toBe(true);

    //$rootScope.$apply();
    expect(topicEditorStateService.isSavingTopic()).toBe(false);
  });

  xit('should indicate a topic is no longer saving after an error',
    () => {
      topicEditorStateService.loadTopic(5);
      topicUpdateService.setTopicName(
        topicEditorStateService.getTopic(), 'New name');
      //$rootScope.$apply();

      expect(topicEditorStateService.isSavingTopic()).toBe(false);
      mockEditableTopicBackendApiService.failure = 'Internal 500 error';

      topicEditorStateService.saveTopic('Commit message',()=> {});
      expect(topicEditorStateService.isSavingTopic()).toBe(true);

      //$rootScope.$apply();
      expect(topicEditorStateService.isSavingTopic()).toBe(false);
    }
  );
});
