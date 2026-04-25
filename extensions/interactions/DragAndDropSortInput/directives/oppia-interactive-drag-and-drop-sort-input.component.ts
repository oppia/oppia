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

import {
  Component,
  Input,
  OnInit,
  ElementRef,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  CdkDragDrop,
  CdkDragExit,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {DragAndDropSortInputCustomizationArgs} from 'interactions/customization-args-defs';

import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {DragAndDropSortInputRulesService} from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-rules.service';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';

import {InteractionAnswer} from 'interactions/answer-defs';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {DragAndDropAnswer} from 'interactions/answer-defs';

import {Subscription} from 'rxjs';

@Component({
  selector: 'oppia-interactive-drag-and-drop-sort-input',
  templateUrl: './drag-and-drop-sort-input-interaction.component.html',
  styleUrls: [],
})
export class InteractiveDragAndDropSortInputComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() allowMultipleItemsInSamePositionWithValue!: string;
  @Input() choicesWithValue!: string;
  // Save solution is null until the solution is set.
  @Input() savedSolution!: InteractionAnswer | null;
  choices!: string[];
  choicesValue!: SubtitledHtml[];
  multipleItemsInSamePositionArray!: string[][];
  singleItemInSamePositionArray!: string[];
  allowMultipleItemsInSamePosition: boolean = false;
  dragStarted: boolean = false;
  hide: number[] = [];
  highlightedGroup: number = -1;
  noShow: number = -1;
  rootHeight: number = 40;
  activeGroup!: number;
  activeItem!: number;
  listSubscription!: Subscription;
  @ViewChildren('listItem') listItems!: QueryList<ElementRef<HTMLDivElement>>;
  maxGroups!: number;

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private dragAndDropSortInputRulesService: DragAndDropSortInputRulesService,
    private el: ElementRef,
    private interactionAttributesExtractorService: InteractionAttributesExtractorService
  ) {}

  ngAfterViewInit(): void {
    this.listSubscription = this.listItems.changes.subscribe(_ => {
      this.setFocus();
    });
  }

  ngOnDestroy(): void {
    this.listSubscription.unsubscribe();
  }

  getFlatIndex(groupIndex: number, itemIndex: number): number {
    let index = 0;
    for (
      let currentGroupIndex = 0;
      currentGroupIndex < groupIndex;
      currentGroupIndex++
    ) {
      const group = this.multipleItemsInSamePositionArray[currentGroupIndex];
      if (!group) {
        continue;
      }
      index += group.length;
    }
    return index + itemIndex;
  }

  getGroupItemFromFlatIndex(flatIndex: number): {group: number; item: number} {
    let count = 0;
    for (
      let currentGroupIndex = 0;
      currentGroupIndex < this.multipleItemsInSamePositionArray.length;
      currentGroupIndex++
    ) {
      const groupLength =
        this.multipleItemsInSamePositionArray[currentGroupIndex].length;
      if (flatIndex < count + groupLength) {
        return {
          group: currentGroupIndex,
          item: flatIndex - count,
        };
      }
      count += groupLength;
    }
    return {group: 0, item: 0};
  }

  setFocus(): void {
    if (!this.listItems) {
      return;
    }
    const items = this.listItems.toArray();
    const flatIndex = this.getFlatIndex(this.activeGroup, this.activeItem);
    if (!items[flatIndex]) {
      return;
    }
    items[flatIndex].nativeElement.focus();
  }

  resetArray(): void {
    // Resets the array into the correct format.
    // For example, [[], [1, 2, 3], []].
    const res: string[][] = [[]];
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

  isChildElementHaveBorder(idx: number): boolean {
    // Checks if the child has a border.
    return idx % 2 === 1 && idx !== this.noShow;
  }

  isChildElementHaveZeroHeight(idx: number): boolean {
    // Checks if the child has zero height.
    return this.hide.indexOf(idx) >= 0;
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
    // If the drop is valid, then the list of lists is reset, otherwise the
    // drag is cancelled.
    moveItemInArray(
      this.multipleItemsInSamePositionArray,
      event.previousIndex,
      event.currentIndex
    );
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
            event.currentIndex,
            0,
            data
          );
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
      event.previousIndex,
      event.currentIndex
    );
    this.activeItem = event.currentIndex;
    this.setFocus();
  }

  handleKeyDown(event: KeyboardEvent, currentIndex: number): void {
    let newIndex = currentIndex;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.activeItem !== this.listItems.length - 1) {
        newIndex += 1;
        moveItemInArray(
          this.singleItemInSamePositionArray,
          currentIndex,
          newIndex
        );
      }
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.activeItem !== 0) {
        newIndex -= 1;
        moveItemInArray(
          this.singleItemInSamePositionArray,
          currentIndex,
          newIndex
        );
      }
    }

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (this.activeItem > 0) {
          event.preventDefault();
          newIndex -= 1;
        }
      } else {
        if (this.activeItem < this.listItems.length - 1) {
          event.preventDefault();
          newIndex += 1;
        }
      }
    }
    this.activeItem = newIndex;
    this.setFocus();
  }

  handleKeyDownMultipleItems(
    event: KeyboardEvent,
    groupIndex: number,
    itemIndex: number
  ): void {
    if (event.ctrlKey) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        let newGroupIndex = groupIndex + 2;
        if (newGroupIndex >= this.multipleItemsInSamePositionArray.length) {
          return;
        }

        // Move entire group down (swap).
        const temp = this.multipleItemsInSamePositionArray[groupIndex];
        this.multipleItemsInSamePositionArray[groupIndex] =
          this.multipleItemsInSamePositionArray[newGroupIndex];
        this.multipleItemsInSamePositionArray[newGroupIndex] = temp;

        this.activeGroup = newGroupIndex;
        this.activeItem = itemIndex;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        let newGroupIndex = groupIndex - 2;
        if (newGroupIndex < 0) {
          return;
        }

        // Move entire group up (swap).
        const temp = this.multipleItemsInSamePositionArray[groupIndex];
        this.multipleItemsInSamePositionArray[groupIndex] =
          this.multipleItemsInSamePositionArray[newGroupIndex];
        this.multipleItemsInSamePositionArray[newGroupIndex] = temp;

        this.activeGroup = newGroupIndex;
        this.activeItem = itemIndex;
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const group = this.multipleItemsInSamePositionArray[groupIndex];
      // Move inside group.
      if (itemIndex < group.length - 1) {
        let newItemIndex = itemIndex + 1;
        moveItemInArray(group, itemIndex, newItemIndex);
        this.activeGroup = groupIndex;
        this.activeItem = newItemIndex;
      }
      // Transfer to next group.
      else {
        const item = group[itemIndex];
        let newGroupIndex = groupIndex + 2;
        if (newGroupIndex >= this.multipleItemsInSamePositionArray.length) {
          const currentGroups = this.multipleItemsInSamePositionArray.filter(
            group => group.length > 0
          ).length;
          // Possible to add group under the rest.
          if (currentGroups < this.maxGroups) {
            this.multipleItemsInSamePositionArray.push([]);
            newGroupIndex = this.multipleItemsInSamePositionArray.length - 1;
          } else {
            // There is max number of groups.
            return;
          }
        }

        transferArrayItem(
          this.multipleItemsInSamePositionArray[groupIndex],
          this.multipleItemsInSamePositionArray[newGroupIndex],
          itemIndex,
          0
        );

        this.resetArray();
        // Updates the active group and item index after transfer.
        for (
          let groupIndex = 0;
          groupIndex < this.multipleItemsInSamePositionArray.length;
          groupIndex++
        ) {
          const idx =
            this.multipleItemsInSamePositionArray[groupIndex].indexOf(item);
          if (idx !== -1) {
            this.activeGroup = groupIndex;
            this.activeItem = idx;
            break;
          }
        }
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const group = this.multipleItemsInSamePositionArray[groupIndex];

      // Move inside group.
      if (itemIndex > 0) {
        let newItemIndex = itemIndex - 1;
        moveItemInArray(group, itemIndex, newItemIndex);
        this.activeGroup = groupIndex;
        this.activeItem = newItemIndex;
      }
      // Transfer to previous group.
      else {
        let newGroupIndex = groupIndex - 2;
        if (newGroupIndex < 0) {
          return;
        }

        const targetGroup =
          this.multipleItemsInSamePositionArray[newGroupIndex];
        const insertIndex = targetGroup.length;
        transferArrayItem(
          this.multipleItemsInSamePositionArray[groupIndex],
          targetGroup,
          itemIndex,
          insertIndex
        );

        this.activeGroup = newGroupIndex;
        this.activeItem = insertIndex;
        this.resetArray();
      }
    }

    if (event.key === 'Tab') {
      const flatIndex = this.getFlatIndex(groupIndex, itemIndex);
      const totalItems = this.listItems.length;
      let newFlatIndex = flatIndex;

      if (event.shiftKey) {
        if (flatIndex > 0) {
          event.preventDefault();
          newFlatIndex = flatIndex - 1;
        }
      } else {
        if (flatIndex < totalItems - 1) {
          event.preventDefault();
          newFlatIndex = flatIndex + 1;
        }
      }

      const position = this.getGroupItemFromFlatIndex(newFlatIndex);
      this.activeGroup = position.group;
      this.activeItem = position.item;
    }
    this.setFocus();
  }

  hideElement(event: CdkDragExit<string[]>): void {
    // Emits when the user removes an element from the container
    // by dragging it into another container.
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
    const {choices, allowMultipleItemsInSamePosition} =
      this.interactionAttributesExtractorService.getValuesFromAttributes(
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
    this.allowMultipleItemsInSamePosition =
      allowMultipleItemsInSamePosition.value;
    // Max groups the array can have.
    this.maxGroups = this.choices.length;

    let savedSolution = (
      this.savedSolution !== null ? this.savedSolution : []
    ) as DragAndDropAnswer;

    if (this.allowMultipleItemsInSamePosition) {
      // Use list of lists to store the multiple items in the same position.
      // Push empty list along with the list of items in the same position,
      // to enable the drag and drop in different positions from items in the
      // same position.
      // For example, if the list of items in the same position is [1, 2, 3],
      // then the list of lists will be [[], [1, 2, 3], []].
      if (savedSolution && savedSolution.length) {
        // Pre populate with the saved solution, if present.
        for (let i = 0; i < savedSolution.length; i++) {
          let items = [];
          for (let j = 0; j < savedSolution[i].length; j++) {
            let htmlContent = this.getHtmlOfContentId(savedSolution[i][j]);
            items.push(htmlContent);
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
      if (savedSolution && savedSolution.length) {
        // Pre populate with the saved solution, if present.
        for (let i = 0; i < savedSolution.length; i++) {
          let htmlContent = this.getHtmlOfContentId(savedSolution[i][0]);
          this.singleItemInSamePositionArray.push(htmlContent);
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
      submitAnswerFn,
      null
    );
  }

  getContentIdOfHtml(html: string): string {
    let contentId = this.choicesValue[this.choices.indexOf(html)].contentId;

    if (contentId === null) {
      throw new Error('contentId cannot be null');
    }
    // Returns the content id of the html.
    return contentId;
  }

  getHtmlOfContentId(contentId: string): string {
    // Return the html of the content id.
    for (let choice of this.choicesValue) {
      if (choice.contentId === contentId) {
        return choice.html;
      }
    }
    throw new Error('contentId not found');
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
            items.push(
              this.getContentIdOfHtml(
                this.multipleItemsInSamePositionArray[i][j]
              )
            );
          }
          answer.push(items);
        }
      }
    } else {
      for (let i = 0; i < this.singleItemInSamePositionArray.length; i++) {
        answer.push([
          this.getContentIdOfHtml(this.singleItemInSamePositionArray[i]),
        ]);
      }
    }
    this.currentInteractionService.onSubmit(
      answer,
      this.dragAndDropSortInputRulesService
    );
  }
}
