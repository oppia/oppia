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

import { Topic } from 'domain/topic/topic-object.model';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WindowRef } from 'services/contextual/window-ref.service';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
import { TopicEditorStateService } from 'pages/topic-editor-page/services/topic-editor-state.service';
import { SubtopicValidationService } from 'pages/topic-editor-page/services/subtopic-validation.service';
import { AppConstants } from 'app.constants';
import { CreateNewSubtopicModalComponent } from './create-new-subtopic-modal.component';
import { Subtopic } from 'domain/topic/subtopic.model';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { SubtopicPage } from 'domain/topic/subtopic-page.model';

class MockWindowRef {
  nativeWindow = {
    location: {
      hostname: 'local'
    }
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
  getTopic() {
    return new Topic(
      '', 'Topic name loading', 'Abbrev. name loading',
      'Url Fragment loading', 'Topic description loading', 'en',
      [], [], [], 1, 1, [], '', '', {}, false, '', '', []
    );
  }

  getClassroomUrlFragment() {
    return 'non';
  }

  deleteSubtopicPage() {
  }

  get onTopicReinitialized(): EventEmitter<void> {
    let topicReinitializedEventEmitter: EventEmitter<void> = (
      new EventEmitter());
    return topicReinitializedEventEmitter;
  }

  setSubtopicPage() {
  }
}

describe('create new subtopic modal', function() {
  let component: CreateNewSubtopicModalComponent;
  let fixture: ComponentFixture<CreateNewSubtopicModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let topicUpdateService: TopicUpdateService;
  let topicEditorStateService: MockTopicEditorStateService;
  let subtopicValidationService: SubtopicValidationService;
  let topic: Topic;
  let DefaultSubtopicPageSchema = {
    type: 'html',
    ui_config: {
      rows: 100
    }
  };

  beforeEach(waitForAsync(() => {
    topicEditorStateService = new MockTopicEditorStateService();
    TestBed.configureTestingModule({
      declarations: [
        CreateNewSubtopicModalComponent
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          provide: TopicEditorStateService,
          useValue: topicEditorStateService
        },
        TopicUpdateService,
        SubtopicValidationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
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
      '', 'Topic name loading', 'Abbrev. name loading',
      'Url Fragment loading', 'Topic description loading', 'en',
      [], [], [], 1, 1, [], '', '', {}, false, '', '', []
    );
    let subtopic1 = Subtopic.createFromTitle(1, 'Subtopic1');
    topic.getSubtopics = function() {
      return [subtopic1];
    };
    topic.getId = function() {
      return '1';
    };
    topic.getNextSubtopicId = function() {
      return 1;
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
    expect(component.MAX_CHARS_IN_SUBTOPIC_TITLE)
      .toBe(AppConstants.MAX_CHARS_IN_SUBTOPIC_TITLE);
    expect(component.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT)
      .toBe(AppConstants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT);

    component.localValueChange('working fine');
    expect(component.htmlData).toBe('working fine');
  });

  it('should show Schema editor when user clicks' +
    'on \"Give a description or explanation of the subtopic.\" button', () => {
    let SUBTOPIC_PAGE_SCHEMA = component.getSchema();
    expect(SUBTOPIC_PAGE_SCHEMA).toEqual(DefaultSubtopicPageSchema);

    component.showSchemaEditor();
    expect(component.schemaEditorIsShown).toBe(true);
  });

  it('should update editableThumbnailFilename when ' +
  'filename updated in \"Thubmnail Image\" modal', () => {
    let newFileName = 'shivamOppiaFile';
    component.updateSubtopicThumbnailFilename(newFileName);

    expect(component.editableThumbnailFilename).toBe(newFileName);
  });

  it('should update ThumbnailBgColor when ' +
    'user select new color in \"Thubmnail Image\" modal', () => {
    let newThumbnailBgColor = 'red';
    component.updateSubtopicThumbnailBgColor(newThumbnailBgColor);

    expect(component.editableThumbnailBgColor).toBe(newThumbnailBgColor);
  });

  it('should reset errorMsg when user' +
  ' enter data in \"Title\" input area', () => {
    component.resetErrorMsg();

    expect(component.errorMsg).toBe(null);
  });

  it('should check whether subtopic is valid when' +
  ' \"Create Subtopic\" button clicked', () => {
    component.editableThumbnailFilename = 'examplefilename';
    component.subtopicTitle = 'title';
    component.htmlData = 'data';
    component.editableUrlFragment = 'url';

    let isSubtopicValid = component.isSubtopicValid();

    spyOn(subtopicValidationService, 'isUrlFragmentValid')
      .and.returnValue(true);
    expect(isSubtopicValid).toBe(true);
  });

  it('should not create subtopic when \"Cancel\" button clicked',
    fakeAsync(() => {
      spyOn(topicEditorStateService, 'deleteSubtopicPage');

      component.cancel();

      expect(topicEditorStateService.deleteSubtopicPage).toHaveBeenCalled();
    }));

  it('should check whether subtopicUrlFragmentExists when user enter data' +
  ' in \"Enter the url fragment for the subtopic\" input area', () => {
    spyOn(subtopicValidationService, 'doesSubtopicWithUrlFragmentExist')
      .and.returnValue(true);
    component.checkSubtopicExistence();

    expect(component.subtopicUrlFragmentExists).toBe(true);
  });

  it('should save create new subtoic when' +
  ' \"Create Subtopic\" button clicked', () => {
    component.subtopicId = 123;
    spyOn(subtopicValidationService, 'checkValidSubtopicName')
      .and.returnValue(true);
    spyOn(topicUpdateService, 'setSubtopicTitle');
    spyOn(topicUpdateService, 'addSubtopic');
    spyOn(topicUpdateService, 'setSubtopicThumbnailFilename').and.stub();
    spyOn(topicUpdateService, 'setSubtopicThumbnailBgColor').and.stub();
    spyOn(topicUpdateService, 'setSubtopicUrlFragment');
    spyOn(SubtopicPage, 'createDefault').and.callThrough();
    spyOn(topicEditorStateService, 'setSubtopicPage').and.callThrough();
    spyOn(ngbActiveModal, 'close');

    component.save();

    expect(topicUpdateService.addSubtopic).toHaveBeenCalled();
    expect(topicUpdateService.setSubtopicTitle).toHaveBeenCalled();
    expect(topicUpdateService.setSubtopicUrlFragment).toHaveBeenCalled();
    expect(SubtopicPage.createDefault).toHaveBeenCalled();
    expect(topicEditorStateService.setSubtopicPage).toHaveBeenCalled();
    expect(ngbActiveModal.close).toHaveBeenCalled();
  });

  it('should not close modal if subtopic name is not valid' +
  ' when \"Create Subtopic\" button clicked', () => {
    spyOn(ngbActiveModal, 'close');

    spyOn(subtopicValidationService, 'checkValidSubtopicName')
      .and.returnValue(false);
    component.save();
    expect(component.errorMsg)
      .toBe('A subtopic with this title already exists');
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });
});
