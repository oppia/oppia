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
 * @fileoverview Unit tests for Delete State Skill Modal.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {DeleteStateSkillModalComponent} from './delete-state-skill-modal.component';
import {ResponsesService} from '../../services/responses.service';
import {
  AnswerGroup,
  AnswerGroupObjectFactory,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('Delete Topic Modal Component', () => {
  let fixture: ComponentFixture<DeleteStateSkillModalComponent>;
  let componentInstance: DeleteStateSkillModalComponent;
  let responsesService: ResponsesService;
  let answerGroupObjectFactory: AnswerGroupObjectFactory;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [DeleteStateSkillModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteStateSkillModalComponent);
    componentInstance = fixture.componentInstance;

    answerGroupObjectFactory = TestBed.inject(AnswerGroupObjectFactory);
    responsesService = TestBed.inject(ResponsesService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should determine if any misconception is tagged', () => {
    let answerGroups: AnswerGroup[] = [
      answerGroupObjectFactory.createFromBackendDict(
        {
          rule_specs: [
            {
              rule_type: 'Contains',
              inputs: {
                x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['abc'],
                },
              },
            },
          ],
          outcome: {
            dest: 'State',
            dest_if_really_stuck: null,
            feedback: {
              html: '',
              content_id: 'This is a new feedback text',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: 'test',
            missing_prerequisite_skill_id: 'test_skill_id',
          },
          training_data: [],
          tagged_skill_misconception_id: 'misconception1',
        },
        'TextInput'
      ),
    ];

    spyOn(responsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    expect(componentInstance.isAnyMisconceptionTagged()).toBeTrue();
  });

  it('should determine if no misconception is tagged', () => {
    spyOn(responsesService, 'getAnswerGroups').and.returnValue([]);
    expect(componentInstance.isAnyMisconceptionTagged()).toBeFalse();
  });
});
