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
 * @fileoverview Factory for creating instances of Drag And Drop Sort
 * domain objects.
 */

 import { downgradeInjectable } from '@angular/upgrade/static';
 import { Injectable } from '@angular/core';
 import { DragAndDropAnswer } from 'interactions/answer-defs';
 import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
 
 @Injectable({
   providedIn: 'root'
 })
 export class DragAndDropSortObjectFactory {

    answerContentIdToHTML(answer: DragAndDropAnswer, choices: SubtitledHtml): string[][] {
        var answerResponse = [];
        function* yieldAllValuesOf(choices) {
            yield* choices;
        }
        for (let ans of answer) {
            for (let value of ans) {
                for(let elem of yieldAllValuesOf(choices)) {
                    if (value === elem._contentId) {
                        answerResponse.push(elem._html);
                    }
                }
            }
        }
        var answerArray = [];
        for (let elem of answerResponse) {
            let transformedArray = [];
            transformedArray.push(elem);
            answerArray.push(transformedArray);
        }
        return answerArray;
    }
 }
 
 angular.module('oppia').factory(
   'DragAndDropSortObjectFactory', downgradeInjectable(DragAndDropSortObjectFactory));

