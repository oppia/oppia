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
 * @fileoverview Unit tests for EntityCreationService.
 */

import {Subtopic} from 'domain/topic/subtopic.model';
import {NgbModal, NgbModalRef, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {Topic} from 'domain/topic/topic-object.model';
import {TopicEditorStateService} from './topic-editor-state.service';
import {TopicEditorRoutingService} from './topic-editor-routing.service';
import {EntityCreationService} from './entity-creation.service';
import {CreateNewSkillModalService} from './create-new-skill-modal.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BrowserDynamicTestingModule} from '@angular/platform-browser-dynamic/testing';
import {CreateNewSubtopicModalComponent} from '../modal-templates/create-new-subtopic-modal.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

class MockNgbModal {
  open(): {result: Promise<string>} {
    return {
      result: Promise.resolve('1'),
    };
  }
}

describe('Entity creation service', () => {
  let topic: Topic;
  let topicEditorStateService: TopicEditorStateService;
  let topicEditorRoutingService: TopicEditorRoutingService;
  let entityCreationService: EntityCreationService;
  let createNewSkillModalService: CreateNewSkillModalService;
  let ngbModal: NgbModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [CreateNewSubtopicModalComponent],
      providers: [
        TopicEditorStateService,
        TopicEditorRoutingService,
        CreateNewSkillModalService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideModule(BrowserDynamicTestingModule, {
        set: {
          entryComponents: [CreateNewSubtopicModalComponent],
        },
      })
      .compileComponents();
  }));

  beforeEach(() => {
    ngbModal = TestBed.inject(NgbModal);
    topicEditorRoutingService = TestBed.inject(TopicEditorRoutingService);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    entityCreationService = TestBed.inject(EntityCreationService);
    createNewSkillModalService = TestBed.inject(CreateNewSkillModalService);
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
    let subtopic1 = Subtopic.createFromTitle(1, 'Subtopic1');
    let subtopic2 = Subtopic.createFromTitle(2, 'Subtopic2');
    let subtopic3 = Subtopic.createFromTitle(3, 'Subtopic3');
    topic.getSubtopics = () => {
      return [subtopic1, subtopic2, subtopic3];
    };
    topic.getId = () => {
      return '1';
    };
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
  });

  it('should call TopicEditorRoutingService to navigate to subtopic editor', fakeAsync(() => {
    spyOn(topicEditorRoutingService, 'navigateToSubtopicEditorWithId');
    entityCreationService.createSubtopic();
    tick();
    expect(
      topicEditorRoutingService.navigateToSubtopicEditorWithId
    ).toHaveBeenCalled();
  }));

  it('should open create subtopic modal', () => {
    let spy = spyOn(ngbModal, 'open').and.callThrough();
    entityCreationService.createSubtopic();

    expect(spy).toHaveBeenCalled();
  });

  it('should close create subtopic modal when cancel button is clicked', () => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        result: Promise.reject(),
      } as NgbModalRef;
    });
    let routingSpy = spyOn(
      topicEditorRoutingService,
      'navigateToSubtopicEditorWithId'
    );

    entityCreationService.createSubtopic();

    expect(routingSpy).not.toHaveBeenCalledWith('1');
  });

  it('should call CreateNewSkillModalService to navigate to skill editor', () => {
    spyOn(createNewSkillModalService, 'createNewSkill');

    entityCreationService.createSkill();

    expect(createNewSkillModalService.createNewSkill).toHaveBeenCalledWith([
      '1',
    ]);
  });
});
