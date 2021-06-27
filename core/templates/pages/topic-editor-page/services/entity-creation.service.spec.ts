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
 * @fileoverview Unit tests for EntityCreationService.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Subtopic } from 'domain/topic/subtopic.model';
import { Topic, TopicObjectFactory } from 'domain/topic/TopicObjectFactory';
import { CreateNewSkillModalComponent } from 'pages/topics-and-skills-dashboard-page/create-new-skill-modal.component';
import { CreateNewSkillModalService } from './create-new-skill-modal.service';
import { EntityCreationService } from './entity-creation.service';
import { TopicEditorRoutingService } from './topic-editor-routing.service';
import { TopicEditorStateService } from './topic-editor-state.service';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Entity creation service', () => {
  let topicObjectFactory: TopicObjectFactory;
  let topicEditorStateService: TopicEditorStateService;
  let topicEditorRoutingService: TopicEditorRoutingService;
  let entityCreationService: EntityCreationService;
  let ngbModal: NgbModal;
  let topic: Topic;
  let createNewSkillModalService: CreateNewSkillModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserDynamicTestingModule,
        HttpClientTestingModule,
        NgbModule
      ],
      declarations: [CreateNewSkillModalComponent],
      providers: [
        EntityCreationService,
        TopicEditorStateService,
        TopicEditorRoutingService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [CreateNewSkillModalComponent],
      }
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    topicEditorRoutingService = TestBed.inject(TopicEditorRoutingService);
    topicObjectFactory = TestBed.inject(TopicObjectFactory);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    entityCreationService = TestBed.inject(EntityCreationService);
    ngbModal = TestBed.inject(NgbModal);
    createNewSkillModalService = TestBed.inject(CreateNewSkillModalService);

    topic = topicObjectFactory.createInterstitialTopic();
    let subtopic1 = Subtopic.createFromBackendDict(
      {id: 1, title: 'Subtopic1', skill_ids: [], thumbnail_filename: null,
        thumbnail_bg_color: null, url_fragment: null}, {});
    let subtopic2 = Subtopic.createFromBackendDict(
      {id: 1, title: 'Subtopic1', skill_ids: [], thumbnail_filename: null,
        thumbnail_bg_color: null, url_fragment: null}, {});
    let subtopic3 = Subtopic.createFromBackendDict(
      {id: 1, title: 'Subtopic1', skill_ids: [], thumbnail_filename: null,
        thumbnail_bg_color: null, url_fragment: null}, {});
    topic.getSubtopics = () => {
      return [subtopic1, subtopic2, subtopic3];
    };
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
  }));


  it('should call TopicEditorRoutingService to navigate to subtopic editor',
    fakeAsync(() => {
      class MockNgbModalRef {
        result = Promise.resolve({
          subtopicId: 123
        });
        componentInstance = {
          topic: topic
        };
      }
      let ngbModalRef = new MockNgbModalRef();

      const modalSpy = spyOn(ngbModal, 'open').and.returnValue(
        <NgbModalRef>ngbModalRef);

      spyOn(topicEditorRoutingService, 'navigateToSubtopicEditorWithId');
      entityCreationService.createSubtopic(topic);
      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should create a skill', () => {
    entityCreationService.createSkill();
    expect(createNewSkillModalService.createNewSkill).toHaveBeenCalled();
  });
});
