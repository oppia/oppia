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
 * @fileoverview Unit test for Service which maintains
 *  a stack of changes to a Question domain object.
 **/

import { TestBed } from '@angular/core/testing';
import { QuestionUndoRedoService } from './question-undo-redo.service';


describe('Question Undo Redo service', () => {
  let questionUndoRedoService: QuestionUndoRedoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QuestionUndoRedoService]
    });

    questionUndoRedoService = TestBed.inject(QuestionUndoRedoService);
  });

  it('should be defined', () => {
    expect(questionUndoRedoService).toBeDefined();
  });
});
