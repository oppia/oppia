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
 * @fileoverview Unit tests for the topic editor tab component.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {StoryReference} from 'domain/topic/story-reference-object.model';
import {Topic} from 'domain/topic/topic-object.model';
import {AppConstants} from 'app.constants';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicEditorStateService} from 'pages/topic-editor-page/services/topic-editor-state.service';
import {SkillCreationService} from 'components/entity-creation-services/skill-creation.service';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {StoryCreationBackendApiService} from 'components/entity-creation-services/story-creation-backend-api.service';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {EntityCreationService} from 'pages/topic-editor-page/services/entity-creation.service';
import {TopicEditorRoutingService} from '../services/topic-editor-routing.service';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {TopicEditorTabComponent} from './topic-editor-tab.component';
import {ContextService} from 'services/context.service';
import {RearrangeSkillsInSubtopicsModalComponent} from '../modal-templates/rearrange-skills-in-subtopics-modal.component';
import {ChangeSubtopicAssignmentModalComponent} from '../modal-templates/change-subtopic-assignment-modal.component';
import {SavePendingChangesModalComponent} from 'components/save-pending-changes/save-pending-changes-modal.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {UrlFragmentEditorComponent} from '../../../components/url-fragment-editor/url-fragment-editor.component';
import {By} from '@angular/platform-browser';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve('1'),
    };
  }
}

class MockContextService {
  getExplorationId() {
    return 'explorationId';
  }

  getEntityType() {
    return 'topic';
  }

  getEntityId() {
    return 'dkfn32sxssasd';
  }
}

class MockImageUploadHelperService {
  getTrustedResourceUrlForThumbnailFilename(filename, entityType, entityId) {
    return entityType + '/' + entityId + '/' + filename;
  }
}

describe('Topic editor tab directive', () => {
  let component: TopicEditorTabComponent;
  let fixture: ComponentFixture<TopicEditorTabComponent>;
  let ngbModal: NgbModal;
  let urlInterpolationService: UrlInterpolationService;
  let topicEditorStateService: TopicEditorStateService;
  let entityCreationService: EntityCreationService;
  let topicUpdateService: TopicUpdateService;
  let storyCreationService: StoryCreationBackendApiService;
  let undoRedoService: UndoRedoService;
  let topicEditorRoutingService: TopicEditorRoutingService;
  let windowDimensionsService: WindowDimensionsService;
  let topic;
  let skillSummary;
  let story1;
  let story2;
  let mockStorySummariesInitializedEventEmitter = new EventEmitter();
  let mockTasdReinitializedEventEmitter = new EventEmitter();
  let topicInitializedEventEmitter = new EventEmitter();
  let topicReinitializedEventEmitter = new EventEmitter();
  let MockWindowDimensionsService = {
    isWindowNarrow: () => false,
  };
  let MockTopicsAndSkillsDashboardBackendApiService = {
    get onTopicsAndSkillsDashboardReinitialized() {
      return mockTasdReinitializedEventEmitter;
    },
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      declarations: [
        TopicEditorTabComponent,
        RearrangeSkillsInSubtopicsModalComponent,
        ChangeSubtopicAssignmentModalComponent,
        SavePendingChangesModalComponent,
        UrlFragmentEditorComponent,
      ],
      providers: [
        UrlInterpolationService,
        TopicEditorStateService,
        SkillCreationService,
        TopicUpdateService,
        StoryCreationBackendApiService,
        UndoRedoService,
        EntityCreationService,
        TopicEditorRoutingService,
        QuestionBackendApiService,
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useValue: MockTopicsAndSkillsDashboardBackendApiService,
        },
        {
          provide: WindowDimensionsService,
          useValue: MockWindowDimensionsService,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: ContextService,
          useClass: MockContextService,
        },
        {
          provide: ImageUploadHelperService,
          useClass: MockImageUploadHelperService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicEditorTabComponent);
    component = fixture.componentInstance;

    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    ngbModal = TestBed.inject(NgbModal);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    topicUpdateService = TestBed.inject(TopicUpdateService);
    storyCreationService = TestBed.inject(StoryCreationBackendApiService);
    undoRedoService = TestBed.inject(UndoRedoService);
    entityCreationService = TestBed.inject(EntityCreationService);
    topicEditorRoutingService = TestBed.inject(TopicEditorRoutingService);

    spyOnProperty(topicEditorStateService, 'onTopicInitialized').and.callFake(
      () => {
        return topicInitializedEventEmitter;
      }
    );
    spyOnProperty(topicEditorStateService, 'onTopicReinitialized').and.callFake(
      () => {
        return topicReinitializedEventEmitter;
      }
    );

    let subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    topic = new Topic(
      'id',
      'Topic name loading',
      'Abbrev. name loading',
      'Url Fragment loading',
      'Topic description loading',
      'en',
      [],
      [],
      [],
      1,
      1,
      [],
      'str',
      '',
      {},
      false,
      '',
      '',
      []
    );
    skillSummary = ShortSkillSummary.create('skill_1', 'Description 1');
    subtopic._skillSummaries = [skillSummary];
    topic._uncategorizedSkillSummaries = [skillSummary];
    topic._subtopics = [subtopic];
    story1 = StoryReference.createFromStoryId('storyId1');
    story2 = StoryReference.createFromStoryId('storyId2');
    topic._canonicalStoryReferences = [story1, story2];
    topic.setName('New Name');
    topic.setUrlFragment('topic-url-fragment');
    topicEditorStateService.setTopic(topic);

    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOnProperty(
      topicEditorStateService,
      'onStorySummariesInitialized'
    ).and.returnValue(mockStorySummariesInitializedEventEmitter);
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.callFake(value => {
      return '/assets/images' + value;
    });

    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should change list order properly', () => {
    spyOn(topicUpdateService, 'rearrangeSubtopic').and.stub();
    spyOn(component, 'initEditor').and.stub();

    component.subtopics = [null, null, null];
    component.topic = null;
    component.drop({
      previousIndex: 1,
      currentIndex: 2,
    } as CdkDragDrop<Subtopic[]>);

    expect(topicUpdateService.rearrangeSubtopic).toHaveBeenCalled();
    expect(component.initEditor).toHaveBeenCalled();
  });

  it('should initialize the variables', () => {
    expect(component.topic).toEqual(topic);
    expect(component.allowedBgColors).toEqual(['#C6DCDA']);
    expect(component.topicDescriptionChanged).toEqual(false);
    expect(component.subtopicsListIsShown).toEqual(true);
    expect(component.storiesListIsShown).toEqual(true);
    expect(component.SUBTOPIC_LIST).toEqual('subtopic');
    expect(component.SKILL_LIST).toEqual('skill');
    expect(component.STORY_LIST).toEqual('story');
    expect(component.maxCharsInTopicName).toEqual(
      AppConstants.MAX_CHARS_IN_TOPIC_NAME
    );
    expect(component.MAX_CHARS_IN_TOPIC_URL_FRAGMENT).toEqual(
      AppConstants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT
    );
    expect(component.maxCharsInTopicDescription).toEqual(
      AppConstants.MAX_CHARS_IN_TOPIC_DESCRIPTION
    );
    expect(component.maxCharsInPageTitleFragmentForWeb).toEqual(
      AppConstants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB
    );
    expect(component.maxCharsInMetaTagContent).toEqual(
      AppConstants.MAX_CHARS_IN_META_TAG_CONTENT
    );
    expect(component.minCharsInPageTitleFragmentForWeb).toEqual(
      AppConstants.MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB
    );
  });

  it('should call EntityCreationService to create skill', () => {
    let skillSpy = spyOn(entityCreationService, 'createSkill');
    component.createSkill();
    expect(skillSpy).toHaveBeenCalled();
  });

  it('should toggle the subtopic card', () => {
    let index = 1;
    expect(component.subtopicCardSelectedIndexes[index]).toEqual(undefined);
    component.toggleSubtopicCard(index);
    expect(component.subtopicCardSelectedIndexes[index]).toEqual(true);
    component.toggleSubtopicCard(index);
    expect(component.subtopicCardSelectedIndexes[index]).toEqual(false);
    component.toggleSubtopicCard(index);
    expect(component.subtopicCardSelectedIndexes[index]).toEqual(true);
  });

  it('should open the reassign modal', fakeAsync(() => {
    class MockNgbModalRef {
      componentInstance: {
        subtopics: null;
      };
    }
    let uibModalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockNgbModalRef,
      result: Promise.resolve(1),
    } as NgbModalRef);
    component.reassignSkillsInSubtopics();
    tick();

    expect(uibModalSpy).toHaveBeenCalled();
  }));

  it('should call the TopicUpdateService if skill is removed from subtopic', () => {
    let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
    component.removeSkillFromSubtopic(0, null);
    expect(removeSkillSpy).toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if skill is removed from topic', () => {
    let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
    component.removeSkillFromTopic(0, skillSummary);
    expect(removeSkillSpy).toHaveBeenCalled();
  });

  it('should show subtopic edit options', () => {
    component.showSubtopicEditOptions(1);
    expect(component.subtopicEditOptionsAreShown).toEqual(1);
    component.showSubtopicEditOptions(2);
    expect(component.subtopicEditOptionsAreShown).toEqual(2);
  });

  it('should show skill edit options', () => {
    component.showSkillEditOptions();
    expect(component.skillOptionDialogueBox).toBe(true);

    component.showSkillEditOptions(0, 1);
    expect(component.selectedSkillEditOptionsIndex[0][1]).toEqual(true);
    expect(component.skillOptionDialogueBox).toBe(false);

    component.showSkillEditOptions(0, 1);
    expect(component.selectedSkillEditOptionsIndex).toEqual({});
  });

  it('should get the classroom URL fragment', () => {
    expect(component.classroomUrlFragment).toBeNull();
    topicEditorStateService._updateClassroomUrlFragment('classroom-frag');
    component.ngOnInit();
    expect(component.classroomUrlFragment).toEqual('classroom-frag');
  });

  it('should get the classroom name', () => {
    expect(component.classroomName).toBeNull();
    topicEditorStateService._updateClassroomName('classroom-name');
    component.ngOnInit();
    expect(component.classroomName).toEqual('classroom-name');
  });

  it('should get the curriculum admin usernames', () => {
    expect(component.curriculumAdminUsernames).toEqual([]);
    topicEditorStateService._updateCurriculumAdminUsernames([
      'admin1',
      'admin2',
    ]);
    component.ngOnInit();
    expect(component.curriculumAdminUsernames).toEqual(['admin1', 'admin2']);
  });

  it('should return true in isAssignedToAClassroom if the topic is assigned to a classroom.', () => {
    component.classroomName = 'classroom-name';
    component.classroomUrlFragment = 'classroom-frag';

    expect(component.isAssignedToAClassroom()).toBeTrue();
  });

  it('should return false in isAssignedToAClassroom if the topic is not assigned to a classroom.', () => {
    component.classroomName = null;
    component.classroomUrlFragment = null;

    expect(component.isAssignedToAClassroom()).toBeFalse();
  });

  it('should open save changes warning modal before creating skill', () => {
    class MockNgbModalRef {
      componentInstance: {
        body: 'xyz';
      };
    }
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve(),
      } as NgbModalRef;
    });
    component.createSkill();
    expect(modalSpy).toHaveBeenCalled();
  });

  it(
    'should call TopicEditorStateService to load topic when ' +
      'topics and skills dashboard is reinitialized',
    fakeAsync(() => {
      let refreshTopicSpy = spyOn(topicEditorStateService, 'loadTopic');

      MockTopicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized.emit();
      tick();

      expect(refreshTopicSpy).toHaveBeenCalled();
    })
  );

  it('should call EntityCreationService to create subtopic', () => {
    let skillSpy = spyOn(entityCreationService, 'createSubtopic');
    component.createSubtopic();
    expect(skillSpy).toHaveBeenCalled();
  });

  it('should show mark the changes in description', () => {
    expect(component.topicDescriptionChanged).toEqual(false);
    component.updateTopicDescriptionStatus('New description');
    expect(component.topicDescriptionChanged).toEqual(true);
  });

  it('should call the TopicUpdateService if name is updated', () => {
    let topicNameSpy = spyOn(topicUpdateService, 'setTopicName');
    spyOn(topicEditorStateService, 'updateExistenceOfTopicName').and.callFake(
      (newName, successCallback) => successCallback()
    );
    component.updateTopicName('Different Name');
    expect(topicNameSpy).toHaveBeenCalled();
  });

  it('should not call updateExistenceOfTopicName if name is empty', () => {
    let topicNameSpy = spyOn(topicUpdateService, 'setTopicName');
    spyOn(topicEditorStateService, 'updateExistenceOfTopicName');
    component.updateTopicName('');
    expect(topicNameSpy).toHaveBeenCalled();
    expect(
      topicEditorStateService.updateExistenceOfTopicName
    ).not.toHaveBeenCalled();
  });

  it('should not call the TopicUpdateService if name is same', () => {
    let topicNameSpy = spyOn(topicUpdateService, 'setTopicName');
    component.updateTopicName('New Name');
    expect(topicNameSpy).not.toHaveBeenCalled();
  });

  it('should not call the TopicUpdateService if url fragment is same', () => {
    let topicUrlFragmentSpy = spyOn(topicUpdateService, 'setTopicUrlFragment');
    component.updateTopicUrlFragment('topic-url-fragment');
    expect(topicUrlFragmentSpy).not.toHaveBeenCalled();
  });

  it(
    'should not call the getTopicWithUrlFragmentExists if url fragment' +
      'is not correct',
    () => {
      let topicUrlFragmentSpy = spyOn(
        topicUpdateService,
        'setTopicUrlFragment'
      );
      let topicUrlFragmentExists = spyOn(
        topicEditorStateService,
        'getTopicWithUrlFragmentExists'
      );
      spyOn(
        topicEditorStateService,
        'updateExistenceOfTopicUrlFragment'
      ).and.callFake((newUrlFragment, successCallback, errorCallback) =>
        errorCallback()
      );
      component.updateTopicUrlFragment('topic-url fragment');
      expect(topicUrlFragmentSpy).toHaveBeenCalled();
      expect(topicUrlFragmentExists).not.toHaveBeenCalled();
    }
  );

  it('should call the TopicUpdateService if url fragment is updated', () => {
    let topicUrlFragmentSpy = spyOn(topicUpdateService, 'setTopicUrlFragment');
    spyOn(
      topicEditorStateService,
      'updateExistenceOfTopicUrlFragment'
    ).and.callFake((newUrlFragment, successCallback, errorCallback) =>
      successCallback()
    );
    component.updateTopicUrlFragment('topic');
    expect(topicUrlFragmentSpy).toHaveBeenCalled();
  });

  it('should not update topic url fragment existence for empty url fragment', () => {
    let topicUrlFragmentSpy = spyOn(topicUpdateService, 'setTopicUrlFragment');
    spyOn(topicEditorStateService, 'updateExistenceOfTopicUrlFragment');
    component.updateTopicUrlFragment('');
    expect(topicUrlFragmentSpy).toHaveBeenCalled();
    expect(
      topicEditorStateService.updateExistenceOfTopicUrlFragment
    ).not.toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if thumbnail is updated', () => {
    let topicThumbnailSpy = spyOn(
      topicUpdateService,
      'setTopicThumbnailFilename'
    );
    component.updateTopicThumbnailFilename('img2.svg');
    expect(topicThumbnailSpy).toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if thumbnail is updated', () => {
    component.updateTopicThumbnailFilename('img2.svg');
    let topicThumbnailSpy = spyOn(
      topicUpdateService,
      'setTopicThumbnailFilename'
    );
    component.updateTopicThumbnailFilename('img2.svg');
    expect(topicThumbnailSpy).not.toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if topic description is updated', () => {
    let topicDescriptionSpy = spyOn(topicUpdateService, 'setTopicDescription');
    component.updateTopicDescription('New description');
    expect(topicDescriptionSpy).toHaveBeenCalled();
  });

  it('should not call the TopicUpdateService if topic description is same', () => {
    component.updateTopicDescription('New description');
    let topicDescriptionSpy = spyOn(topicUpdateService, 'setTopicDescription');
    component.updateTopicDescription('New description');
    expect(topicDescriptionSpy).not.toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if topic meta tag content is updated', () => {
    let topicMetaTagContentSpy = spyOn(topicUpdateService, 'setMetaTagContent');
    component.updateTopicMetaTagContent('new meta tag content');
    expect(topicMetaTagContentSpy).toHaveBeenCalled();
  });

  it('should not call the TopicUpdateService if topic description is same', () => {
    component.updateTopicMetaTagContent('New meta tag content');
    let topicMetaTagContentSpy = spyOn(topicUpdateService, 'setMetaTagContent');
    component.updateTopicMetaTagContent('New meta tag content');
    expect(topicMetaTagContentSpy).not.toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if topic page title is updated', () => {
    let topicPageTitleFragmentForWebSpy = spyOn(
      topicUpdateService,
      'setPageTitleFragmentForWeb'
    );
    component.updateTopicPageTitleFragmentForWeb('new page title');
    expect(topicPageTitleFragmentForWebSpy).toHaveBeenCalled();
  });

  it('should not call the TopicUpdateService if topic page title is same', () => {
    component.updateTopicPageTitleFragmentForWeb('New page title');
    let topicPageTitleFragmentForWebSpy = spyOn(
      topicUpdateService,
      'setPageTitleFragmentForWeb'
    );
    component.updateTopicPageTitleFragmentForWeb('New page title');
    expect(topicPageTitleFragmentForWebSpy).not.toHaveBeenCalled();
  });

  it(
    'should set the practice tab as displayed if there are the defined ' +
      'minimum number of practice questions in the topic',
    () => {
      let topicPracticeTabSpy = spyOn(
        topicUpdateService,
        'setPracticeTabIsDisplayed'
      );
      component.skillQuestionCountDict = {skill1: 3, skill2: 6};
      component.updatePracticeTabIsDisplayed(true);
      expect(topicPracticeTabSpy).not.toHaveBeenCalled();
      component.skillQuestionCountDict = {skill1: 3, skill2: 7};
      component.updatePracticeTabIsDisplayed(true);
      expect(topicPracticeTabSpy).toHaveBeenCalled();
    }
  );

  it('should call the TopicUpdateService if skill is deleted from topic', () => {
    let topicDeleteSpy = spyOn(topicUpdateService, 'removeUncategorizedSkill');
    component.deleteUncategorizedSkillFromTopic(null);
    expect(topicDeleteSpy).toHaveBeenCalled();
  });

  it('should call the TopicUpdateService if thumbnail bg color is updated', () => {
    let topicThumbnailBGSpy = spyOn(
      topicUpdateService,
      'setTopicThumbnailBgColor'
    );
    component.updateTopicThumbnailBgColor('#FFFFFF');
    expect(topicThumbnailBGSpy).toHaveBeenCalled();
  });

  it('should call TopicEditorRoutingService to navigate to skill', () => {
    let topicThumbnailBGSpy = spyOn(
      topicEditorRoutingService,
      'navigateToSkillEditorWithId'
    );
    component.navigateToSkill('id1');
    expect(topicThumbnailBGSpy).toHaveBeenCalledWith('id1');
  });

  it('should return skill editor URL', () => {
    let skillId = 'asd4242a';
    expect(component.getSkillEditorUrl(skillId)).toEqual(
      '/skill_editor/' + skillId
    );
  });

  it('should not call the TopicUpdateService if thumbnail bg color is same', () => {
    component.updateTopicThumbnailBgColor('#FFFFFF');
    let topicThumbnailBGSpy = spyOn(
      topicUpdateService,
      'setTopicThumbnailBgColor'
    );
    component.updateTopicThumbnailBgColor('#FFFFFF');
    expect(topicThumbnailBGSpy).not.toHaveBeenCalled();
  });

  it('should toggle topic preview', () => {
    expect(component.topicPreviewCardIsShown).toEqual(false);
    component.togglePreview();
    expect(component.topicPreviewCardIsShown).toEqual(true);
  });

  it('should return image path', () => {
    let urlString = '/assets/images/img1.svg';
    expect(component.getStaticImageUrl('/img1.svg')).toEqual(urlString);
  });

  it('should call StoryCreation Service', () => {
    let storySpy = spyOn(storyCreationService, 'createNewCanonicalStory');
    component.createCanonicalStory();
    expect(storySpy).toHaveBeenCalled();
  });

  it('should open save pending changes modal if changes are made', () => {
    class MockNgbModalRef {
      componentInstance: {
        body: 'xyz';
      };
    }
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve(),
      } as NgbModalRef;
    });
    component.createCanonicalStory();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should call TopicRoutingService to navigate to subtopic', () => {
    let topicRoutingSpy = spyOn(
      topicEditorRoutingService,
      'navigateToSubtopicEditorWithId'
    );
    component.navigateToSubtopic(2, '');
    expect(topicRoutingSpy).toHaveBeenCalledWith(2);
  });

  it(
    'should call TopicEditorService and TopicUpdateService ' +
      'on to delete subtopic',
    () => {
      let topicEditorSpy = spyOn(topicEditorStateService, 'deleteSubtopicPage');
      let topicUpdateSpy = spyOn(topicUpdateService, 'deleteSubtopic');
      component.deleteSubtopic(2);
      expect(topicEditorSpy).toHaveBeenCalled();
      expect(topicUpdateSpy).toHaveBeenCalled();
    }
  );

  it('should return preview footer text for topic preview', () => {
    expect(component.getPreviewFooter()).toEqual('2 Stories');
    topic._canonicalStoryReferences = [];
    expect(component.getPreviewFooter()).toEqual('0 Stories');
    topic._canonicalStoryReferences = [story1];
    expect(component.getPreviewFooter()).toEqual('1 Story');
  });

  it('should only toggle preview of entity lists in mobile view', fakeAsync(() => {
    let MockWindowDimensionsServiceSpy = spyOn(
      windowDimensionsService,
      'isWindowNarrow'
    );

    expect(component.mainTopicCardIsShown).toEqual(true);
    component.togglePreviewListCards('topic');
    expect(component.mainTopicCardIsShown).toEqual(true);
    tick();

    MockWindowDimensionsServiceSpy.and.returnValue(true);
    expect(component.subtopicsListIsShown).toEqual(true);
    expect(component.storiesListIsShown).toEqual(true);
    tick();

    component.togglePreviewListCards('subtopic');
    expect(component.subtopicsListIsShown).toEqual(false);
    expect(component.storiesListIsShown).toEqual(true);
    tick();

    component.togglePreviewListCards('story');
    expect(component.subtopicsListIsShown).toEqual(false);
    expect(component.storiesListIsShown).toEqual(false);
    tick();

    expect(component.mainTopicCardIsShown).toEqual(true);
    component.togglePreviewListCards('topic');
    expect(component.mainTopicCardIsShown).toEqual(false);
    tick();
  }));

  it('should toggle uncategorized skill options', () => {
    component.toggleUncategorizedSkillOptions(10);
    expect(component.uncategorizedEditOptionsIndex).toEqual(10);
    component.toggleUncategorizedSkillOptions(20);
    expect(component.uncategorizedEditOptionsIndex).toEqual(20);
  });

  it(
    'should open ChangeSubtopicAssignment modal when change ' +
      'subtopic assignment is called',
    () => {
      class MockNgbModalRef {
        componentInstance: {
          subtopics: null;
        };
      }

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve(1),
        } as NgbModalRef;
      });
      component.changeSubtopicAssignment(1, skillSummary);
      expect(modalSpy).toHaveBeenCalled();
    }
  );

  it('should open ChangeSubtopicAssignment modal and call TopicUpdateService', fakeAsync(() => {
    let moveSkillUpdateSpy = spyOn(topicUpdateService, 'moveSkillToSubtopic');
    class MockNgbModalRef {
      componentInstance: {
        subtopics: null;
      };
    }
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockNgbModalRef,
      result: Promise.resolve(2),
    } as NgbModalRef);

    component.changeSubtopicAssignment(1, skillSummary);
    tick();

    expect(moveSkillUpdateSpy).toHaveBeenCalled();
  }));

  it('should not call the TopicUpdateService if subtopicIds are same', fakeAsync(() => {
    class MockNgbModalRef {
      componentInstance: {
        subtopics: null;
      };
    }

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockNgbModalRef,
      result: Promise.resolve(1),
    } as NgbModalRef);
    let moveSkillSpy = spyOn(topicUpdateService, 'moveSkillToSubtopic');
    component.changeSubtopicAssignment(1, skillSummary);
    tick();
    expect(moveSkillSpy).not.toHaveBeenCalled();
  }));

  it('should react to event when story summaries are initialized', () => {
    spyOn(topicEditorStateService, 'getCanonicalStorySummaries');
    mockStorySummariesInitializedEventEmitter.emit();
    expect(
      topicEditorStateService.getCanonicalStorySummaries
    ).toHaveBeenCalled();
  });

  it('should call initEditor on initialization of topic', () => {
    spyOn(component, 'initEditor').and.callThrough();
    topicInitializedEventEmitter.emit();
    topicReinitializedEventEmitter.emit();
    expect(component.initEditor).toHaveBeenCalled();
  });

  it(
    'should call the TopicUpdateService if skillId is added in the ' +
      'diagnostic test',
    fakeAsync(() => {
      let updateSkillIdForDiagnosticTestSpy = spyOn(
        topicUpdateService,
        'updateDiagnosticTestSkills'
      );
      component.skillForDiagnosticTestFormControl.setValue(skillSummary);
      component.availableSkillSummariesForDiagnosticTest = [skillSummary];
      component.addSkillForDiagnosticTest();
      tick();
      tick();
      expect(updateSkillIdForDiagnosticTestSpy).toHaveBeenCalledWith(
        component.topic,
        component.selectedSkillSummariesForDiagnosticTest
      );
    })
  );

  it(
    'should call the TopicUpdateService if any skillId is removed from the ' +
      'diagnostic test',
    () => {
      let updateSkillIdForDiagnosticTestSpy = spyOn(
        topicUpdateService,
        'updateDiagnosticTestSkills'
      );
      component.selectedSkillSummariesForDiagnosticTest = [skillSummary];

      component.removeSkillFromDiagnosticTest(skillSummary);
      expect(updateSkillIdForDiagnosticTestSpy).toHaveBeenCalledWith(
        component.topic,
        component.selectedSkillSummariesForDiagnosticTest
      );
    }
  );

  it('should get eligible skill for diagnostic test selection', () => {
    component.skillQuestionCountDict = {
      skill_1: 3,
    };
    topic._uncategorizedSkillSummaries = [];
    topic._subtopics = [];
    expect(component.getEligibleSkillSummariesForDiagnosticTest()).toEqual([]);

    spyOn(
      component.topic,
      'getAvailableSkillSummariesForDiagnosticTest'
    ).and.returnValue([skillSummary]);
    expect(component.getEligibleSkillSummariesForDiagnosticTest()).toEqual([
      skillSummary,
    ]);
  });

  it('should be able to present diagnostic test dropdown selector correctly', () => {
    expect(component.diagnosticTestSkillsDropdownIsShown).toBeFalse();
    component.presentDiagnosticTestSkillDropdown();
    expect(component.diagnosticTestSkillsDropdownIsShown).toBeTrue();

    component.removeDiagnosticTestSkillDropdown();
    expect(component.diagnosticTestSkillsDropdownIsShown).toBeFalse();
  });

  it('should call onChangeTopicEditorUrlFragment when urlFragmentChange event is emitted', () => {
    spyOn(component, 'onChangeTopicEditorUrlFragment');
    const childComponent = fixture.debugElement.query(
      By.directive(UrlFragmentEditorComponent)
    );
    const testFragment = 'test-topic-url-fragment';
    childComponent.triggerEventHandler('urlFragmentChange', testFragment);
    expect(component.onChangeTopicEditorUrlFragment).toHaveBeenCalledWith(
      testFragment
    );
  });

  it('should call updateTopicUrlFragment when blur event is triggered', () => {
    spyOn(component, 'updateTopicUrlFragment');
    const childComponent = fixture.debugElement.query(
      By.directive(UrlFragmentEditorComponent)
    );
    childComponent.triggerEventHandler('blur', {});
    expect(component.updateTopicUrlFragment).toHaveBeenCalled();
  });

  it('should update editableTopicUrlFragment and call updateTopicUrlFragment', () => {
    spyOn(component, 'updateTopicUrlFragment');
    const newUrlFragment = 'new-topic-url';
    component.onChangeTopicEditorUrlFragment(newUrlFragment);
    expect(component.editableTopicUrlFragment).toBe(newUrlFragment);
    expect(component.updateTopicUrlFragment).toHaveBeenCalledWith(
      newUrlFragment
    );
  });
});
