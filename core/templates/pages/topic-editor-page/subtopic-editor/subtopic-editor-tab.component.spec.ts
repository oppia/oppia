// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the subtopic editor tab component.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {StudyGuide} from 'domain/topic/study-guide.model';
import {SubtopicPage} from 'domain/topic/subtopic-page.model';
import {SubtopicEditorTabComponent} from './subtopic-editor-tab.component';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {SubtopicValidationService} from '../services/subtopic-validation.service';
import {TopicEditorRoutingService} from '../services/topic-editor-routing.service';
import {Topic} from 'domain/topic/topic-object.model';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {UrlFragmentEditorComponent} from '../../../components/url-fragment-editor/url-fragment-editor.component';
import {By} from '@angular/platform-browser';

class MockQuestionBackendApiService {
  async fetchTotalQuestionCountForSkillIdsAsync() {
    return Promise.resolve(2);
  }
}

class MockWindowDimensionsService {
  isWindowNarrow(): boolean {
    return false;
  }
}

class MockWindowRef {
  nativeWindow = {
    confirm() {
      return true;
    },
    location: {
      hostname: 'hostname',
      href: 'href',
      pathname: 'pathname',
      search: 'search',
      hash: 'hash',
    },
    open() {
      return;
    },
  };
}

class MockPlatformFeatureService {
  status = {
    ShowRestructuredStudyGuides: {
      isEnabled: false,
    },
  };
}

class MockNgbModalRef {
  componentInstance = {};
}

describe('Subtopic editor tab', () => {
  let component: SubtopicEditorTabComponent;
  let fixture: ComponentFixture<SubtopicEditorTabComponent>;
  let skillSummary: ShortSkillSummary;
  let ngbModal: NgbModal;
  let topicEditorStateService: TopicEditorStateService;
  let topicUpdateService: TopicUpdateService;
  let subtopicValidationService: SubtopicValidationService;
  let topicEditorRoutingService: TopicEditorRoutingService;
  let platformFeatureService: PlatformFeatureService;
  let subtopic: Subtopic;
  let wds: WindowDimensionsService;
  let topicInitializedEventEmitter = new EventEmitter();
  let topicReinitializedEventEmitter = new EventEmitter();
  let subtopicPageLoadedEventEmitter = new EventEmitter();
  let studyGuideLoadedEventEmitter = new EventEmitter();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SubtopicEditorTabComponent, UrlFragmentEditorComponent],
      providers: [
        TopicEditorStateService,
        TopicEditorRoutingService,
        {
          provide: QuestionBackendApiService,
          useClass: MockQuestionBackendApiService,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubtopicEditorTabComponent);
    ngbModal = TestBed.inject(NgbModal);
    component = fixture.componentInstance;
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    topicUpdateService = TestBed.inject(TopicUpdateService);
    subtopicValidationService = TestBed.inject(SubtopicValidationService);
    topicEditorRoutingService = TestBed.inject(TopicEditorRoutingService);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    wds = TestBed.inject(WindowDimensionsService);

    let topic = new Topic(
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
    let subtopic = Subtopic.createFromTitle(1, 'Subtopic1');
    subtopic._skillIds = ['skill_1'];
    subtopic.setUrlFragment('dummy-url');
    skillSummary = ShortSkillSummary.create('skill_1', 'Description 1');
    topic._uncategorizedSkillSummaries = [skillSummary];
    let subtopicPage = SubtopicPage.createDefault('asd2r42', 1);
    let studyGuide = StudyGuide.createDefault('study_guide_id', 1);
    topic._id = 'sndsjfn42';

    component.studyGuide = studyGuide;
    component.sections = studyGuide.getSections();
    component.subtopicId = 1;

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
    spyOnProperty(topicEditorStateService, 'onSubtopicPageLoaded').and.callFake(
      () => {
        return subtopicPageLoadedEventEmitter;
      }
    );
    spyOnProperty(topicEditorStateService, 'onStudyGuideLoaded').and.callFake(
      () => {
        return studyGuideLoadedEventEmitter;
      }
    );

    topic.getSubtopicById = id => {
      return id === 99 ? null : subtopic;
    };
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOn(topicEditorStateService, 'hasLoadedTopic').and.returnValue(true);
    spyOn(topicEditorStateService, 'getSubtopicPage').and.returnValue(
      subtopicPage
    );
    spyOn(topicEditorStateService, 'getStudyGuide').and.returnValue(studyGuide);
    spyOn(topicEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math'
    );
    component.ngOnInit();
    component.initEditor();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize the variables', () => {
    expect(component.editableTitle).toEqual('Subtopic1');
    expect(component.generatedUrlPrefix).toContain('hostname/learn/math');
  });

  it('should initialize with restructured study guides feature disabled', () => {
    expect(component.isShowRestructuredStudyGuidesFeatureEnabled()).toBe(false);
    expect(component.sections).toEqual([]);
  });

  it('should initialize with restructured study guides feature enabled', () => {
    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = true;
    spyOn(topicEditorStateService, 'loadStudyGuide');
    component.initEditor();
    expect(topicEditorStateService.loadStudyGuide).toHaveBeenCalled();
  });

  it('should call topicUpdateService if subtopic title updates', () => {
    let titleSpy = spyOn(topicUpdateService, 'setSubtopicTitle');
    component.updateSubtopicTitle('New title');
    expect(titleSpy).toHaveBeenCalled();
  });

  it('should call topicUpdateService if subtopic title is not updated', () => {
    component.updateSubtopicTitle('New title');
    let titleSpy = spyOn(topicUpdateService, 'setSubtopicTitle');
    component.updateSubtopicTitle('New title');
    expect(titleSpy).not.toHaveBeenCalled();
  });

  it('should call topicUpdateService if subtopic url fragment is updated', () => {
    let urlFragmentSpy = spyOn(topicUpdateService, 'setSubtopicUrlFragment');
    spyOn(subtopicValidationService, 'isUrlFragmentValid').and.returnValue(
      true
    );
    spyOn(
      subtopicValidationService,
      'doesSubtopicWithUrlFragmentExist'
    ).and.returnValue(false);
    component.updateSubtopicUrlFragment('new-url');
    expect(urlFragmentSpy).toHaveBeenCalled();
  });

  it('should not call topicUpdateService when url fragment has not changed', () => {
    component.updateSubtopicUrlFragment('subtopic-url');
    component.initialSubtopicUrlFragment = 'subtopic-url';
    let urlFragmentSpy = spyOn(topicUpdateService, 'setSubtopicUrlFragment');
    component.updateSubtopicUrlFragment('subtopic-url');
    expect(urlFragmentSpy).not.toHaveBeenCalled();
  });

  it('should not call topicUpdateService if subtopic url fragment is invalid', () => {
    let urlFragmentSpy = spyOn(topicUpdateService, 'setSubtopicUrlFragment');
    spyOn(subtopicValidationService, 'isUrlFragmentValid').and.returnValue(
      false
    );
    component.updateSubtopicUrlFragment('new url');
    expect(urlFragmentSpy).not.toHaveBeenCalled();
  });

  it('should not call topicUpdateService if subtopic url fragment exists', () => {
    let urlFragmentSpy = spyOn(topicUpdateService, 'setSubtopicUrlFragment');
    spyOn(subtopicValidationService, 'isUrlFragmentValid').and.returnValue(
      true
    );
    spyOn(
      subtopicValidationService,
      'doesSubtopicWithUrlFragmentExist'
    ).and.returnValue(true);
    component.updateSubtopicUrlFragment('existing-url');
    expect(urlFragmentSpy).not.toHaveBeenCalled();
  });

  it('should call topicUpdateService if subtopic thumbnail updates', () => {
    let thumbnailSpy = spyOn(
      topicUpdateService,
      'setSubtopicThumbnailFilename'
    );
    component.updateSubtopicThumbnailFilename('img.svg');
    expect(thumbnailSpy).toHaveBeenCalled();
  });

  it('should not call topicUpdateService if subtopic thumbnail is not updated', () => {
    component.updateSubtopicThumbnailFilename('img.svg');
    let thumbnailSpy = spyOn(
      topicUpdateService,
      'setSubtopicThumbnailFilename'
    );
    component.updateSubtopicThumbnailFilename('img.svg');
    expect(thumbnailSpy).not.toHaveBeenCalled();
  });

  it('should call topicUpdateService if subtopic thumbnail bg color updates', () => {
    let thumbnailBgSpy = spyOn(
      topicUpdateService,
      'setSubtopicThumbnailBgColor'
    );
    component.updateSubtopicThumbnailBgColor('#FFFFFF');
    expect(thumbnailBgSpy).toHaveBeenCalled();
  });

  it(
    'should not call topicUpdateService if subtopic ' +
      'thumbnail bg color is not updated',
    () => {
      component.updateSubtopicThumbnailBgColor('#FFFFFF');
      let thumbnailBgSpy = spyOn(
        topicUpdateService,
        'setSubtopicThumbnailBgColor'
      );
      component.updateSubtopicThumbnailBgColor('#FFFFFF');
      expect(thumbnailBgSpy).not.toHaveBeenCalled();
    }
  );

  it('should return skill editor URL', () => {
    let skillId = 'asd4242a';
    expect(component.getSkillEditorUrl(skillId)).toEqual(
      '/skill_editor/' + skillId
    );
  });

  it('should show schema editor', () => {
    expect(component.schemaEditorIsShown).toEqual(false);
    component.showSchemaEditor();
    expect(component.schemaEditorIsShown).toEqual(true);
  });

  it('should return if skill is deleted', () => {
    let skillSummary = ShortSkillSummary.create('1', 'Skill description');
    expect(component.isSkillDeleted(skillSummary)).toEqual(false);
  });

  it('should call topicUpdateService when skill is rearranged', () => {
    let removeSkillSpy = spyOn(topicUpdateService, 'rearrangeSkillInSubtopic');
    let skillSummaries = [
      ShortSkillSummary.createFromBackendDict({
        skill_id: '1',
        skill_description: 'Skill Description',
      }),
      ShortSkillSummary.createFromBackendDict({
        skill_id: '2',
        skill_description: 'Skill Description',
      }),
    ];
    subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    subtopic._skillSummaries = skillSummaries;
    const event = {
      previousIndex: 1,
      currentIndex: 2,
    } as CdkDragDrop<string[]>;
    component.drop(event);
    expect(removeSkillSpy).toHaveBeenCalled();
  });

  it('should set the error message if subtopic title is invalid', () => {
    expect(component.errorMsg).toEqual(null);
    spyOn(subtopicValidationService, 'checkValidSubtopicName').and.callFake(
      () => false
    );
    component.updateSubtopicTitle('New Subtopic1');
    expect(component.errorMsg).toEqual(
      'A subtopic with this title already exists'
    );
  });

  it('should reset the error message', () => {
    spyOn(subtopicValidationService, 'checkValidSubtopicName').and.callFake(
      () => false
    );
    component.updateSubtopicTitle('New Subtopic1');
    expect(component.errorMsg).toEqual(
      'A subtopic with this title already exists'
    );
    component.resetErrorMsg();
    expect(component.errorMsg).toEqual(null);
  });

  it('should call topicUpdateService to update the SubtopicPageContent', () => {
    let updateSubtopicSpy = spyOn(
      topicUpdateService,
      'setSubtopicPageContentsHtml'
    );
    component.htmlData = 'new html data';
    component.updateHtmlData();
    expect(updateSubtopicSpy).toHaveBeenCalled();
  });

  it('should call the topicUpdateService if skill is removed from subtopic', () => {
    let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
    spyOn(component, 'initEditor');
    component.removeSkillFromSubtopic({} as ShortSkillSummary);
    expect(removeSkillSpy).toHaveBeenCalled();
    expect(component.initEditor).toHaveBeenCalled();
  });

  it('should call the topicUpdateService if skill is removed from topic', () => {
    let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
    let removeUncategorizedSkillSpy = spyOn(
      topicUpdateService,
      'removeUncategorizedSkill'
    );
    spyOn(component, 'initEditor');
    component.removeSkillFromTopic(skillSummary);
    expect(removeSkillSpy).toHaveBeenCalled();
    expect(removeUncategorizedSkillSpy).toHaveBeenCalled();
    expect(component.initEditor).toHaveBeenCalled();
  });

  it('should set skill edit options index', () => {
    component.showSkillEditOptions(10);
    expect(component.selectedSkillEditOptionsIndex).toEqual(10);
    component.showSkillEditOptions(20);
    expect(component.selectedSkillEditOptionsIndex).toEqual(20);
  });

  it('should toggle skill edit options index when same index is clicked', () => {
    component.showSkillEditOptions(10);
    expect(component.selectedSkillEditOptionsIndex).toEqual(10);
    component.showSkillEditOptions(10);
    expect(component.selectedSkillEditOptionsIndex).toEqual(-1);
  });

  it(
    'should toggle skills list preview only in mobile view' +
      'when window is narrow',
    () => {
      spyOn(wds, 'isWindowNarrow').and.returnValue(true);
      expect(component.skillsListIsShown).toEqual(true);
      component.togglePreviewSkillCard();
      expect(component.skillsListIsShown).toEqual(false);
      component.togglePreviewSkillCard();
      expect(component.skillsListIsShown).toEqual(true);
    }
  );

  it('should not toggle skills list preview when window is not narrow', () => {
    spyOn(wds, 'isWindowNarrow').and.returnValue(false);
    component.skillsListIsShown = true;
    component.togglePreviewSkillCard();
    expect(component.skillsListIsShown).toEqual(true);
  });

  it(
    'should toggle subtopic editor card only in mobile view' +
      'when window is narrow',
    () => {
      spyOn(wds, 'isWindowNarrow').and.returnValue(true);
      expect(component.subtopicEditorCardIsShown).toEqual(true);
      component.toggleSubtopicEditorCard();
      expect(component.subtopicEditorCardIsShown).toEqual(false);
      component.toggleSubtopicEditorCard();
      expect(component.subtopicEditorCardIsShown).toEqual(true);
    }
  );

  it('should not toggle subtopic editor card when window is not narrow', () => {
    spyOn(wds, 'isWindowNarrow').and.returnValue(false);
    component.subtopicEditorCardIsShown = true;
    component.toggleSubtopicEditorCard();
    expect(component.subtopicEditorCardIsShown).toEqual(true);
  });

  it('should toggle sections list only in mobile view when window is narrow', () => {
    spyOn(wds, 'isWindowNarrow').and.returnValue(true);
    component.sectionsListIsShown = true;
    component.toggleSectionsList();
    expect(component.sectionsListIsShown).toEqual(false);
    component.toggleSectionsList();
    expect(component.sectionsListIsShown).toEqual(true);
  });

  it('should not toggle sections list when window is not narrow', () => {
    spyOn(wds, 'isWindowNarrow').and.returnValue(false);
    component.sectionsListIsShown = true;
    component.toggleSectionsList();
    expect(component.sectionsListIsShown).toEqual(true);
  });

  it('should toggle subtopic preview', () => {
    expect(component.subtopicPreviewCardIsShown).toEqual(false);
    component.toggleSubtopicPreview();
    expect(component.subtopicPreviewCardIsShown).toEqual(true);
    component.toggleSubtopicPreview();
    expect(component.subtopicPreviewCardIsShown).toEqual(false);
  });

  it('should call topicEditorRoutingService to navigate To Topic Editor', () => {
    let navigateSpy = spyOn(topicEditorRoutingService, 'navigateToMainTab');
    component.navigateToTopicEditor();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('should call initEditor when topic is initialized', () => {
    spyOn(component, 'initEditor').and.callThrough();
    topicInitializedEventEmitter.emit();
    expect(component.initEditor).toHaveBeenCalledTimes(1);
    topicReinitializedEventEmitter.emit();
    expect(component.initEditor).toHaveBeenCalledTimes(2);
  });

  it('should handle subtopic page loaded event', () => {
    (topicEditorStateService.getSubtopicPage as jasmine.Spy).and.returnValue({
      getPageContents: () => ({getHtml: () => 'test html'}),
    } as SubtopicPage);
    subtopicPageLoadedEventEmitter.emit();
    expect(component.htmlData).toEqual('test html');
  });

  it(
    'should subscribe to onStudyGuideLoaded when restructured' +
      ' study guides feature is enabled',
    () => {
      spyOn(
        component,
        'isShowRestructuredStudyGuidesFeatureEnabled'
      ).and.returnValue(true);
      let newStudyGuide = StudyGuide.createDefault('new_study_guide_id', 2);
      let mockSections = [];
      spyOn(newStudyGuide, 'getSections').and.returnValue(mockSections);
      (topicEditorStateService.getStudyGuide as jasmine.Spy).and.returnValue(
        newStudyGuide
      );
      component.ngOnInit();
      studyGuideLoadedEventEmitter.emit();
      expect(component.studyGuide).toBe(newStudyGuide);
      expect(component.sections).toBe(mockSections);
      expect(topicEditorStateService.getStudyGuide).toHaveBeenCalled();
    }
  );

  it('should hide the html data input on canceling', () => {
    component.schemaEditorIsShown = true;
    component.htmlDataBeforeUpdate = 'original html';
    component.htmlData = 'modified html';
    spyOn(component, 'updateHtmlData');
    component.cancelHtmlDataChange();
    expect(component.htmlData).toEqual('original html');
    expect(component.updateHtmlData).toHaveBeenCalled();
    expect(component.schemaEditorIsShown).toEqual(false);
  });

  it('should redirect to topic editor if subtopic id is invalid', () => {
    spyOn(topicEditorRoutingService, 'getSubtopicIdFromUrl').and.returnValue(
      99
    );
    let navigateSpy = spyOn(topicEditorRoutingService, 'navigateToMainTab');
    component.initEditor();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('should call onSubtopicUrlFragmentChange when urlFragmentChange event is emitted', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    spyOn(component, 'onSubtopicUrlFragmentChange');
    const childComponent = fixture.debugElement.query(
      By.directive(UrlFragmentEditorComponent)
    );
    expect(childComponent).toBeTruthy();
    const testFragment = 'test-subtopic-url-fragment';
    childComponent.triggerEventHandler('urlFragmentChange', testFragment);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.onSubtopicUrlFragmentChange).toHaveBeenCalledWith(
      testFragment
    );
  });

  it('should update editableUrlFragment and call updateSubtopicUrlFragment', () => {
    spyOn(component, 'updateSubtopicUrlFragment');
    const newUrlFragment = 'new-subtopic-url';
    component.onSubtopicUrlFragmentChange(newUrlFragment);
    expect(component.editableUrlFragment).toBe(newUrlFragment);
    expect(component.updateSubtopicUrlFragment).toHaveBeenCalledWith(
      newUrlFragment
    );
  });

  it('should change active section index', () => {
    component.sections = [
      {
        heading: {
          content_id: 'section_heading_0',
          unicode_str: 'Section 1',
        },
        content: {
          content_id: 'section_content_1',
          html: 'Section 1 content',
        },
      },
      {
        heading: {
          content_id: 'section_heading_2',
          unicode_str: 'Section 2',
        },
        content: {
          content_id: 'section_content_3',
          html: 'Section 2 content',
        },
      },
    ];
    component.activeSectionIndex = -1;
    component.studyGuide = {
      getSections: () => component.sections,
    } as StudyGuide;

    component.changeActiveSectionIndex(0);
    expect(component.activeSectionIndex).toEqual(0);

    component.changeActiveSectionIndex(0);
    expect(component.activeSectionIndex).toEqual(-1);
  });

  it(
    'should open delete study guide section modal when ' +
      'clicking on delete button',
    fakeAsync(() => {
      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: new MockNgbModalRef(),
        result: Promise.resolve(),
      } as NgbModalRef);
      let deleteSectionSpy = spyOn(
        topicUpdateService,
        'deleteSection'
      ).and.callThrough();

      component.ngOnInit();
      component.deleteSection(0, '');
      tick();

      expect(modalSpy).toHaveBeenCalled();
      expect(deleteSectionSpy).toHaveBeenCalled();
    })
  );

  it(
    'should close delete section modal when ' + 'clicking on cancel button',
    fakeAsync(() => {
      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: new MockNgbModalRef(),
        result: Promise.reject(),
      } as NgbModalRef);
      let deleteSectionSpy = spyOn(
        topicUpdateService,
        'deleteSection'
      ).and.callThrough();

      component.ngOnInit();
      component.deleteSection(0, '');
      tick();

      expect(modalSpy).toHaveBeenCalled();
      expect(deleteSectionSpy).not.toHaveBeenCalled();
    })
  );

  it(
    'should open add section modal when ' + 'clicking on add button',
    fakeAsync(() => {
      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: new MockNgbModalRef(),
        result: Promise.resolve({
          sectionHeadingPlaintext: 'heading',
          sectionContentHtml: 'content',
        }),
      } as NgbModalRef);
      let addSectionSpy = spyOn(
        topicUpdateService,
        'addSection'
      ).and.callThrough();

      component.ngOnInit();
      component.openAddSectionModal();
      tick();

      expect(modalSpy).toHaveBeenCalled();
      expect(addSectionSpy).toHaveBeenCalled();
    })
  );

  it(
    'should close add section modal when ' + 'clicking on cancel button',
    fakeAsync(() => {
      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: new MockNgbModalRef(),
        result: Promise.reject(),
      } as NgbModalRef);
      let addSectionSpy = spyOn(
        topicUpdateService,
        'addSection'
      ).and.callThrough();

      component.ngOnInit();
      component.openAddSectionModal();
      tick();

      expect(modalSpy).toHaveBeenCalled();
      expect(addSectionSpy).not.toHaveBeenCalled();
    })
  );

  it('should initialize mobile view settings correctly', () => {
    spyOn(wds, 'isWindowNarrow').and.returnValue(true);
    component.ngOnInit();
    expect(component.sectionsListIsShown).toEqual(false);
    expect(component.skillsListIsShown).toEqual(false);
  });

  it('should initialize desktop view settings correctly', () => {
    spyOn(wds, 'isWindowNarrow').and.returnValue(false);
    component.ngOnInit();
    expect(component.sectionsListIsShown).toEqual(true);
    expect(component.skillsListIsShown).toEqual(true);
  });
});
