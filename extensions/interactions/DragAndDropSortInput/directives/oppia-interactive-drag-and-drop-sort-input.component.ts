// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the DragAndDropSortInput interaction.
 */

import { Component, Input, OnInit, ElementRef } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { CdkDragDrop, CdkDragExit, moveItemInArray } from '@angular/cdk/drag-drop';
import { DragAndDropSortInputCustomizationArgs } from 'interactions/customization-args-defs';

import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { DragAndDropSortInputRulesService } from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-rules.service';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';

import { InteractionAnswer } from 'interactions/answer-defs';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { DragAndDropAnswer } from 'interactions/answer-defs';

@Component({
  selector: 'oppia-interactive-drag-and-drop-sort-input',
  templateUrl: './drag-and-drop-sort-input-interaction.component.html',
  styleUrls: []
})
export class InteractiveDragAndDropSortInputComponent implements OnInit {
  @Input() allowMultipleItemsInSamePositionWithValue: string;
  @Input() choicesWithValue: string;
  @Input() savedSolution: InteractionAnswer;
  allowMultipleItemsInSamePosition: boolean;
  choices: string[];
  choicesValue: SubtitledHtml[];
  dragStarted: boolean = false;
  hide: number[] = [];
  highlightedGroup: number = -1;
  multipleItemsInSamePositionArray: string[][];
  singleItemInSamePositionArray: string[];
  noShow: number = -1;
  rootHeight: number = 40;

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private dragAndDropSortInputRulesService: DragAndDropSortInputRulesService,
    private el: ElementRef,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService) {}

  resetArray(): void {
    // Resets the array into the correct format.
    // For example, [[], [1, 2, 3], []].
    const res = [[]];
    for (let i = 0; i < this.multipleItemsInSamePositionArray.length; i++) {
      if (this.multipleItemsInSamePositionArray[i].length !== 0) {
        res.push(this.multipleItemsInSamePositionArray[i]);
        res.push([]);
      }
    }
    this.highlightedGroup = -1;
    this.multipleItemsInSamePositionArray = res;
    this.noShow = -1;
    this.hide = [];
    this.dragStarted = false;
  }

  addHighlight(i: number): void {
    if (i === this.highlightedGroup && this.dragStarted) {
      return;
    }
    this.highlightedGroup = i;
  }

  removeHighlight(): void {
    this.highlightedGroup = -1;
  }

  dropList(event: CdkDragDrop<string[][]>): void {
    // Handles the drop event. Drop whole list which is part of list of lists.
    // If the drop is valid, then the list of lits is reset, otherwise the
    // drag is cancelled.
    moveItemInArray(
      this.multipleItemsInSamePositionArray,
      event.previousIndex, event.currentIndex);
    this.resetArray();
  }

  dropItemInAnyList(event: CdkDragDrop<string[]>): void {
    // Handles the drop event. Drop item in any list. If the drop is valid,
    // then the list of lists is reset, otherwise the drag is cancelled.
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.noShow = -1;
      this.hide = [];
      this.dragStarted = false;
    } else {
      const data = event.previousContainer.data[event.previousIndex];
      for (
        let i = event.previousIndex;
        i < event.previousContainer.data.length - 1;
        i++
      ) {
        event.previousContainer.data[i] = event.previousContainer.data[i + 1];
      }
      event.previousContainer.data.pop();
      for (let i in this.multipleItemsInSamePositionArray) {
        if (this.multipleItemsInSamePositionArray[i] === event.container.data) {
          this.multipleItemsInSamePositionArray[i].splice(
            event.currentIndex, 0, data);
        }
      }
      this.resetArray();
    }
  }

  dropItemInSameList(event: CdkDragDrop<string[]>): void {
    // Handles the drop event. Drop item in the same list. If the drop is
    // valid, then the list is reset, otherwise the drag is cancelled.
    moveItemInArray(
      this.singleItemInSamePositionArray,
      event.previousIndex, event.currentIndex);
  }

  logEvent(event: CdkDragExit<string[]>): void {
    // Logs the event.
    if (this.dragStarted) {
      return;
    }
    this.dragStarted = true;
    for (let i = 0; i < this.multipleItemsInSamePositionArray.length; i++) {
      if (event.container.data === this.multipleItemsInSamePositionArray[i]) {
        if (this.multipleItemsInSamePositionArray[i].length === 1) {
          this.noShow = i;
          this.hide.push(i, i + 1);
        }
      }
    }
  }

  setRootPlaceHolderHeight(i: number): void {
    // Sets the root placeholder height.
    const el: HTMLDivElement = this.el.nativeElement.getElementsByClassName(
      'child-dnd-' + i
    )[0];
    this.rootHeight = el.offsetHeight;
  }

  ngOnInit(): void {
    const {
      choices,
      allowMultipleItemsInSamePosition
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'DragAndDropSortInput',
      {
        choicesWithValue: this.choicesWithValue,
        allowMultipleItemsInSamePositionWithValue:
          this.allowMultipleItemsInSamePositionWithValue,
      }
    ) as DragAndDropSortInputCustomizationArgs;

    this.multipleItemsInSamePositionArray = [];
    this.singleItemInSamePositionArray = [];
    this.choicesValue = choices.value;
    this.choices = this.choicesValue.map(choice => choice.html);
    this.allowMultipleItemsInSamePosition = (
      allowMultipleItemsInSamePosition.value);

    let savedSolution = (
      this.savedSolution !== undefined ? this.savedSolution : []
    ) as DragAndDropAnswer;

    if (this.allowMultipleItemsInSamePosition) {
      // Use list of lists to store the multiple items in the same position.
      // Push empty list along with the list of items in the same position,
      // to unable the drag and drop in different positions from items in the
      // same position.
      // For example, if the list of items in the same position is [1, 2, 3],
      // then the list of lists will be [[], [1, 2, 3], []].
      if (savedSolution.length) {
        // Pre populate with the saved solution, if present.
        for (let i = 0; i < savedSolution.length; i++) {
          let items = [];
          for (let j = 0; j < savedSolution[i].length; j++) {
            items.push(this.getHtmlOfContentId(savedSolution[i][j]));
          }
          this.multipleItemsInSamePositionArray.push([]);
          this.multipleItemsInSamePositionArray.push(items);
        }
        this.multipleItemsInSamePositionArray.push([]);
      } else {
        // Pre populate with the choices, if no saved solution is present.
        for (let choice of this.choices) {
          this.multipleItemsInSamePositionArray.push([]);
          this.multipleItemsInSamePositionArray.push([choice]);
        }
        this.multipleItemsInSamePositionArray.push([]);
      }
    } else {
      // Use Array to store the single item in same position.
      if (savedSolution.length) {
        // Pre populate with the saved solution, if present.
        for (let i = 0; i < savedSolution.length; i++) {
          this.singleItemInSamePositionArray.push(
            this.getHtmlOfContentId(savedSolution[i][0]));
        }
      } else {
        // Pre populate with the choices, if no saved solution is present.
        for (let choice of this.choices) {
          this.singleItemInSamePositionArray.push(choice);
        }
      }
    }

    const submitAnswerFn = () => this.submitAnswer();
    this.currentInteractionService.registerCurrentInteraction(
      submitAnswerFn, null);
  }

  getContentIdOfHtml(html: string): string {
    // Returns the content id of the html.
    return this.choicesValue[this.choices.indexOf(html)].contentId;
  }

  getHtmlOfContentId(contentId: string): string {
    // Return the html of the content id.
    for (let choice of this.choicesValue) {
      if (choice.contentId === contentId) {
        return choice.html;
      }
    }
  }

  submitAnswer(): void {
    // Convert the list of lists of html content to a list of lists
    // of content ids.
    const answer = [];
    if (this.allowMultipleItemsInSamePosition) {
      for (let i = 0; i < this.multipleItemsInSamePositionArray.length; i++) {
        if (this.multipleItemsInSamePositionArray[i].length) {
          let items = [];
          for (
            let j = 0;
            j < this.multipleItemsInSamePositionArray[i].length;
            j++
          ) {
            items.push(this.getContentIdOfHtml(
              this.multipleItemsInSamePositionArray[i][j]));
          }
          answer.push(items);
        }
      }
    } else {
      for (let i = 0; i < this.singleItemInSamePositionArray.length; i++) {
        answer.push(
          [this.getContentIdOfHtml(this.singleItemInSamePositionArray[i])]);
      }
    }
    this.currentInteractionService.onSubmit(
      answer as unknown as string,
      this.dragAndDropSortInputRulesService as unknown as
      InteractionRulesService);
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveDragAndDropSortInput', downgradeComponent({
    component: InteractiveDragAndDropSortInputComponent
  }) as angular.IDirectiveFactory);
