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
* @fileoverview unit tests for the dragAndDropSort object type factory service.
*/
 
import { DragAndDropSortObjectFactory } from
'domain/objects/DragAndDropSortObjectFactory';
/*import { DragAndDropAnswer } from
'interactions/answer-defs';*/
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
 
describe('DragAndDropSort Object Factory', () => {
let dragAndDrop: DragAndDropSortObjectFactory;
/*let dragAndDropAnswer: DragAndDropAnswer;
let subtitledHtml: SubtitledHtml;*/
 
beforeEach(() => {
  dragAndDrop = new DragAndDropSortObjectFactory();
});
 
it('should get the answer of DragAndDropSort interaction', () => {
    var answer = [['ca_choices01'], ['ca_choices1']];
    var choices = SubtitledHtml.createDefault('Choice 1', 'ca_choices_0');
    var value = ['ca_choices01'];
    var elem = ['ca_choices01'];
    var answerArray = [['aa'], ['bb']];
    spyOn(dragAndDrop, 'answerContentIdToHTML').and.returnValue(answerArray);
    expect(value).toEqual(elem);
    expect(dragAndDrop.answerContentIdToHTML(
        answer, choices)
    ).toBe(answerArray);
})
});
