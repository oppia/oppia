// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the create new subtopic modal component.
 */

import {Topic} from 'domain/topic/topic-object.model';
import {
  ComponentFixture,
  waitForAsync,
  TestBed,
  fakeAsync,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {WindowRef} from 'services/contextual/window-ref.service';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {TopicEditorStateService} from 'pages/topic-editor-page/services/topic-editor-state.service';
import {SubtopicValidationService} from 'pages/topic-editor-page/services/subtopic-validation.service';
import {HtmlLengthService} from 'services/html-length.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {AppConstants} from 'app.constants';
import {CreateNewSubtopicModalComponent} from './create-new-subtopic-modal.component';
import {Subtopic} from 'domain/topic/subtopic.model';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {SubtopicPage} from 'domain/topic/subtopic-page.model';
import {StudyGuide} from 'domain/topic/study-guide.model';
import {UrlFragmentEditorComponent} from '../../../components/url-fragment-editor/url-fragment-editor.component';
import {By} from '@angular/platform-browser';

class MockWindowRef {
  nativeWindow = {
    location: {
      hostname: 'local',
    },
  };
}

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockTopicEditorStateService {
  private topicReinitializedEventEmitter: EventEmitter<void> =
    new EventEmitter();

  getTopic() {
    return new Topic(
      '',
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
      '',
      '',
      {},
      false,
      '',
      '',
      []
    );
  }

  getClassroomUrlFragment() {
    return 'non';
  }

  deleteSubtopicPage() {}

  get onTopicReinitialized(): EventEmitter<void> {
    return this.topicReinitializedEventEmitter;
  }

  setSubtopicPage() {}
  setStudyGuide() {}
}

class MockPlatformFeatureService {
  status = {
    ShowRestructuredStudyGuides: {
      isEnabled: false,
    },
    EnableWorkedExamplesRteComponent: {
      isEnabled: false,
    },
  };
}

class MockHtmlLengthService {
  computeHtmlLength(html: string, calculationType: string): number {
    return html.length;
  }
}

describe('create new subtopic modal', function () {
  let component: CreateNewSubtopicModalComponent;
  let fixture: ComponentFixture<CreateNewSubtopicModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let topicUpdateService: TopicUpdateService;
  let topicEditorStateService: MockTopicEditorStateService;
  let subtopicValidationService: SubtopicValidationService;
  let platformFeatureService: MockPlatformFeatureService;
  let htmlLengthService: MockHtmlLengthService;
  let topic: Topic;
  let DefaultSubtopicPageSchema = {
    type: 'html',
    ui_config: {
      rte_component_config_id: 'SKILL_AND_STUDY_GUIDE_EDITOR_COMPONENTS',
      rows: 100,
    },
  };
  let AllComponentsSchema = {
    type: 'html',
    ui_config: {
      rte_component_config_id: 'ALL_COMPONENTS',
      rows: 100,
    },
  };

  beforeEach(waitForAsync(() => {
    topicEditorStateService = new MockTopicEditorStateService();
    platformFeatureService = new MockPlatformFeatureService();
    htmlLengthService = new MockHtmlLengthService();

    TestBed.configureTestingModule({
      declarations: [
        CreateNewSubtopicModalComponent,
        UrlFragmentEditorComponent,
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: TopicEditorStateService,
          useValue: topicEditorStateService,
        },
        {
          provide: PlatformFeatureService,
          useValue: platformFeatureService,
        },
        {
          provide: HtmlLengthService,
          useValue: htmlLengthService,
        },
        TopicUpdateService,
        SubtopicValidationService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewSubtopicModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    TestBed.inject(WindowRef);
    topicUpdateService = TestBed.inject(TopicUpdateService);
    subtopicValidationService = TestBed.inject(SubtopicValidationService);

    topic = new Topic(
      '',
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
      '',
      '',
      {},
      false,
      '',
      '',
      []
    );
    let subtopic1 = Subtopic.createFromTitle(1, 'Subtopic1');
    topic.getSubtopics = function () {
      return [subtopic1];
    };
    topic.getId = function () {
      return '1';
    };
    topic.getNextSubtopicId = function () {
      return 1;
    };
    topic.getUrlFragment = function () {
      return 'topic-url-fragment';
    };
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);

    fixture.detectChanges();
  });

  it('should assign default values to modal when initialized', () => {
    component.ngOnInit();
    expect(component.SUBTOPIC_PAGE_SCHEMA).toEqual(DefaultSubtopicPageSchema);
    expect(component.subtopicId).toBe(1);
    expect(component.hostname).toBe('local');
    expect(component.classroomUrlFragment).toBe('non');
    expect(component.schemaEditorIsShown).toBe(false);
    expect(component.subtopicUrlFragmentExists).toBe(false);
    expect(component.errorMsg).toBe(null);
    expect(component.htmlData).toBe('');
    expect(component.sectionHeadingPlaintext).toBe('');
    expect(component.sectionContentHtml).toBe('');
    expect(component.editableThumbnailFilename).toBe('');
    expect(component.editableThumbnailBgColor).toBe('');
    expect(component.editableUrlFragment).toBe('');
    expect(component.subtopicTitle).toBe('');
    expect(component.MAX_CHARS_IN_SUBTOPIC_TITLE).toBe(
      AppConstants.MAX_CHARS_IN_SUBTOPIC_TITLE
    );
    expect(component.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT).toBe(
      AppConstants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT
    );
    expect(component.MAX_CHARS_IN_STUDY_GUIDE_SECTION_HEADING).toBe(
      AppConstants.MAX_CHARS_IN_STUDY_GUIDE_SECTION_HEADING
    );
    expect(component.generatedUrlPrefix).toBe(
      'local/learn/non /topic-url-fragment/studyguide'
    );
  });

  it('should update htmlData when localValueChange is called', () => {
    component.localValueChange('working fine');
    expect(component.htmlData).toBe('working fine');
  });

  it('should update sectionContentHtml when localContentValueChange is called', () => {
    component.localContentValueChange('section content');
    expect(component.sectionContentHtml).toBe('section content');
  });

  it('should return ALL_COMPONENTS schema when EnableWorkedExamplesRteComponent is disabled', () => {
    platformFeatureService.status.EnableWorkedExamplesRteComponent.isEnabled =
      false;
    let SUBTOPIC_PAGE_SCHEMA = component.getSchema();
    expect(SUBTOPIC_PAGE_SCHEMA).toEqual(AllComponentsSchema);
  });

  it(
    'should show Schema editor when user clicks' +
      'on "Give a description or explanation of the subtopic." button',
    () => {
      let SUBTOPIC_PAGE_SCHEMA = component.getSchema();
      expect(SUBTOPIC_PAGE_SCHEMA).toEqual(AllComponentsSchema);

      component.showSchemaEditor();
      expect(component.schemaEditorIsShown).toBe(true);
    }
  );

  it(
    'should update editableThumbnailFilename when ' +
      'filename updated in "Thumbnail Image" modal',
    () => {
      let newFileName = 'shivamOppiaFile';
      component.updateSubtopicThumbnailFilename(newFileName);

      expect(component.editableThumbnailFilename).toBe(newFileName);
    }
  );

  it(
    'should update ThumbnailBgColor when ' +
      'user select new color in "Thumbnail Image" modal',
    () => {
      let newThumbnailBgColor = 'red';
      component.updateSubtopicThumbnailBgColor(newThumbnailBgColor);

      expect(component.editableThumbnailBgColor).toBe(newThumbnailBgColor);
    }
  );

  it(
    'should reset errorMsg when user' + ' enter data in "Title" input area',
    () => {
      component.errorMsg = 'Some error';
      component.resetErrorMsg();

      expect(component.errorMsg).toBe(null);
    }
  );

  it('should check if section content length is exceeded', () => {
    component.sectionContentHtml = 'short content';
    let computeHtmlLengthSpy = spyOn(htmlLengthService, 'computeHtmlLength');
    computeHtmlLengthSpy.and.returnValue(500);
    let isExceeded = component.isSectionContentLengthExceeded();
    expect(isExceeded).toBe(false);

    computeHtmlLengthSpy.and.returnValue(6500);
    isExceeded = component.isSectionContentLengthExceeded();
    expect(isExceeded).toBe(true);
  });

  it('should check whether subtopic is valid for legacy mode', () => {
    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = false;
    component.editableThumbnailFilename = 'examplefilename';
    component.subtopicTitle = 'title';
    component.htmlData = 'data';
    component.editableUrlFragment = 'url';

    spyOn(component, 'isUrlFragmentValid').and.returnValue(true);
    let isSubtopicValid = component.isSubtopicValid();
    expect(isSubtopicValid).toBe(true);
  });

  it('should check whether subtopic is valid for restructured study guides mode', () => {
    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = true;
    component.editableThumbnailFilename = 'examplefilename';
    component.subtopicTitle = 'title';
    component.sectionHeadingPlaintext = 'section heading';
    component.sectionContentHtml = 'section content';
    component.editableUrlFragment = 'url';

    spyOn(component, 'isUrlFragmentValid').and.returnValue(true);
    let isSubtopicValid = component.isSubtopicValid();
    expect(isSubtopicValid).toBe(true);
  });

  it('should return false when subtopic is not valid', () => {
    component.editableThumbnailFilename = '';
    component.subtopicTitle = '';
    component.htmlData = '';
    component.editableUrlFragment = '';

    let isSubtopicValid = component.isSubtopicValid();
    expect(isSubtopicValid).toBe(false);
  });

  it('should check if url fragment is valid', () => {
    component.editableUrlFragment = 'valid-url-fragment';
    spyOn(subtopicValidationService, 'isUrlFragmentValid').and.returnValue(
      true
    );

    let isValid = component.isUrlFragmentValid();
    expect(isValid).toBe(true);
    expect(subtopicValidationService.isUrlFragmentValid).toHaveBeenCalledWith(
      'valid-url-fragment'
    );
  });

  it('should check if restructured study guides feature is enabled', () => {
    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = true;
    expect(component.isShowRestructuredStudyGuidesFeatureEnabled()).toBe(true);

    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = false;
    expect(component.isShowRestructuredStudyGuidesFeatureEnabled()).toBe(false);
  });

  it('should check if worked examples RTE component feature is enabled', () => {
    platformFeatureService.status.EnableWorkedExamplesRteComponent.isEnabled =
      true;
    expect(component.isEnableWorkedexamplesRteComponentFeatureEnabled()).toBe(
      true
    );

    platformFeatureService.status.EnableWorkedExamplesRteComponent.isEnabled =
      false;
    expect(component.isEnableWorkedexamplesRteComponentFeatureEnabled()).toBe(
      false
    );
  });

  it('should not create subtopic when "Cancel" button clicked', fakeAsync(() => {
    spyOn(topicEditorStateService, 'deleteSubtopicPage');
    spyOn(topicEditorStateService.onTopicReinitialized, 'emit');
    spyOn(ngbActiveModal, 'dismiss');

    component.cancel();

    expect(topicEditorStateService.deleteSubtopicPage).toHaveBeenCalledWith(
      '1',
      1
    );
    expect(
      topicEditorStateService.onTopicReinitialized.emit
    ).toHaveBeenCalled();
    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  }));

  it(
    'should check whether subtopicUrlFragmentExists when user enter data' +
      ' in "Enter the url fragment for the subtopic" input area',
    () => {
      spyOn(
        subtopicValidationService,
        'doesSubtopicWithUrlFragmentExist'
      ).and.returnValue(true);
      component.checkSubtopicExistence();

      expect(component.subtopicUrlFragmentExists).toBe(true);
    }
  );

  it('should update editableUrlFragment and call checkSubtopicExistence', () => {
    spyOn(component, 'checkSubtopicExistence');
    const newUrlFragment = 'new-url-fragment';
    component.onUrlFragmentChange(newUrlFragment);
    expect(component.editableUrlFragment).toBe(newUrlFragment);
    expect(component.checkSubtopicExistence).toHaveBeenCalled();
  });

  it('should save create new subtopic in legacy mode when "Create Subtopic" button clicked', () => {
    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = false;
    component.subtopicId = 123;
    component.subtopicTitle = 'Test Subtopic';
    component.editableUrlFragment = 'test-url';
    component.htmlData = 'test html data';

    spyOn(subtopicValidationService, 'checkValidSubtopicName').and.returnValue(
      true
    );
    spyOn(topicUpdateService, 'addSubtopic');
    spyOn(topicUpdateService, 'setSubtopicTitle');
    spyOn(topicUpdateService, 'setSubtopicThumbnailFilename');
    spyOn(topicUpdateService, 'setSubtopicThumbnailBgColor');
    spyOn(topicUpdateService, 'setSubtopicUrlFragment');
    spyOn(topicUpdateService, 'setSubtopicPageContentsHtml');
    spyOn(SubtopicPage, 'createDefault').and.callThrough();
    spyOn(topicEditorStateService, 'setSubtopicPage');
    spyOn(ngbActiveModal, 'close');

    component.save();

    expect(topicUpdateService.addSubtopic).toHaveBeenCalledWith(
      topic,
      'Test Subtopic',
      'test-url'
    );
    expect(topicUpdateService.setSubtopicTitle).toHaveBeenCalledWith(
      topic,
      123,
      'Test Subtopic'
    );
    expect(topicUpdateService.setSubtopicUrlFragment).toHaveBeenCalledWith(
      topic,
      123,
      'test-url'
    );
    expect(SubtopicPage.createDefault).toHaveBeenCalledWith('1', 123);
    expect(topicEditorStateService.setSubtopicPage).toHaveBeenCalled();
    expect(ngbActiveModal.close).toHaveBeenCalledWith(123);
  });

  it('should save new subtopic in restructured study guides mode when "Create Subtopic" button clicked', () => {
    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = true;
    component.subtopicId = 123;
    component.subtopicTitle = 'Test Subtopic';
    component.editableUrlFragment = 'test-url';
    component.sectionHeadingPlaintext = 'Test Heading';
    component.sectionContentHtml = 'Test Content';

    spyOn(subtopicValidationService, 'checkValidSubtopicName').and.returnValue(
      true
    );
    spyOn(topicUpdateService, 'addSubtopic');
    spyOn(topicUpdateService, 'setSubtopicTitle');
    spyOn(topicUpdateService, 'setSubtopicThumbnailFilename');
    spyOn(topicUpdateService, 'setSubtopicThumbnailBgColor');
    spyOn(topicUpdateService, 'setSubtopicUrlFragment');
    spyOn(topicUpdateService, 'updateSection');
    spyOn(StudyGuide, 'createDefault').and.callThrough();
    spyOn(topicEditorStateService, 'setStudyGuide');
    spyOn(ngbActiveModal, 'close');

    component.save();

    expect(topicUpdateService.addSubtopic).toHaveBeenCalledWith(
      topic,
      'Test Subtopic',
      'test-url'
    );
    expect(topicUpdateService.setSubtopicTitle).toHaveBeenCalledWith(
      topic,
      123,
      'Test Subtopic'
    );
    expect(topicUpdateService.setSubtopicUrlFragment).toHaveBeenCalledWith(
      topic,
      123,
      'test-url'
    );
    expect(StudyGuide.createDefault).toHaveBeenCalledWith('1', 123);
    expect(topicUpdateService.updateSection).toHaveBeenCalledWith(
      jasmine.any(Object),
      0,
      'Test Heading',
      'Test Content',
      123
    );
    expect(topicEditorStateService.setStudyGuide).toHaveBeenCalled();
    expect(ngbActiveModal.close).toHaveBeenCalledWith(123);
  });

  it(
    'should not close modal if subtopic name is not valid' +
      ' when "Create Subtopic" button clicked',
    () => {
      spyOn(ngbActiveModal, 'close');
      spyOn(
        subtopicValidationService,
        'checkValidSubtopicName'
      ).and.returnValue(false);

      component.save();

      expect(component.errorMsg).toBe(
        'A subtopic with this title already exists'
      );
      expect(ngbActiveModal.close).not.toHaveBeenCalled();
    }
  );

  it('should call onUrlFragmentChange when urlFragmentChange event is emitted', () => {
    spyOn(component, 'onUrlFragmentChange');
    const childComponent = fixture.debugElement.query(
      By.directive(UrlFragmentEditorComponent)
    );
    const testFragment = 'test-subtopic-url-fragment';
    childComponent.triggerEventHandler('urlFragmentChange', testFragment);
    expect(component.onUrlFragmentChange).toHaveBeenCalledWith(testFragment);
  });

  it('should call addSubtopic with correct parameters', () => {
    component.subtopicTitle = 'Test Title';
    component.editableUrlFragment = 'test-fragment';
    spyOn(topicUpdateService, 'addSubtopic');
    spyOn(topicUpdateService, 'setSubtopicThumbnailFilename');
    spyOn(topicUpdateService, 'setSubtopicThumbnailBgColor');

    component.addSubtopic();

    expect(topicUpdateService.addSubtopic).toHaveBeenCalledWith(
      topic,
      'Test Title',
      'test-fragment'
    );
  });

  it('should set subtopic thumbnail properties correctly', () => {
    component.subtopicId = 123;
    component.editableThumbnailFilename = 'test-image.jpg';
    component.editableThumbnailBgColor = '#FF0000';

    spyOn(topicUpdateService, 'setSubtopicThumbnailFilename');
    spyOn(topicUpdateService, 'setSubtopicThumbnailBgColor');

    component.addSubtopic();

    expect(
      topicUpdateService.setSubtopicThumbnailFilename
    ).toHaveBeenCalledWith(topic, 123, 'test-image.jpg');
    expect(topicUpdateService.setSubtopicThumbnailBgColor).toHaveBeenCalledWith(
      topic,
      123,
      '#FF0000'
    );
  });
});
