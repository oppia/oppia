// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Learner component for the NumberLineInput interaction.
 */

import {
  Component,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {NumberLineInputAnswer} from 'interactions/answer-defs';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {NumberLineInputCustomizationArgs} from 'interactions/customization-args-defs';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {NumberLineInputRulesService} from './number-line-input-rules.service';
import {getNumberLinePoints} from './number-line-input-utils';

@Component({
  selector: 'oppia-interactive-number-line-input',
  templateUrl: './number-line-input-interaction.component.html',
  styleUrls: ['./number-line-input-interaction.component.css'],
})
export class InteractiveNumberLineInput implements OnInit {
  @Input() startValueWithValue: string = '';
  @Input() endValueWithValue: string = '';
  @Input() intervalWithValue: string = '';
  @Input() lastAnswer: NumberLineInputAnswer | null = null;
  @Input() savedSolution: NumberLineInputAnswer | null = null;
  @ViewChildren('pointButton') pointButtons!: QueryList<
    ElementRef<HTMLButtonElement>
  >;

  points: number[] = [];
  selectedIndex: number | null = null;
  isDragging: boolean = false;

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService: InteractionAttributesExtractorService,
    private numberLineInputRulesService: NumberLineInputRulesService
  ) {}

  ngOnInit(): void {
    const customizationArgs =
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'NumberLineInput',
        {
          startValueWithValue: this.startValueWithValue,
          endValueWithValue: this.endValueWithValue,
          intervalWithValue: this.intervalWithValue,
        }
      ) as NumberLineInputCustomizationArgs;
    this.points = getNumberLinePoints(
      customizationArgs.startValue.value,
      customizationArgs.endValue.value,
      customizationArgs.interval.value
    );
    const priorAnswer = this.lastAnswer ?? this.savedSolution;
    const priorIndex = this.points.findIndex(point => point === priorAnswer);
    this.selectedIndex = priorIndex === -1 ? null : priorIndex;

    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(),
      () => this.selectedIndex !== null
    );
  }

  selectPoint(index: number): void {
    if (index < 0 || index >= this.points.length) {
      return;
    }
    this.selectedIndex = index;
    this.currentInteractionService.updateAnswerIsValid(true);
    this.currentInteractionService.updateCurrentAnswer(this.points[index]);
    this.currentInteractionService.updateViewWithNewAnswer();
  }

  submitAnswer(): void {
    if (this.selectedIndex === null) {
      this.currentInteractionService.updateAnswerIsValid(false);
      return;
    }
    this.currentInteractionService.onSubmit(
      this.points[this.selectedIndex],
      this.numberLineInputRulesService
    );
  }

  private selectNearestPoint(event: PointerEvent): void {
    if (this.points.length === 0) {
      return;
    }
    const track = event.currentTarget as HTMLElement;
    const bounds = track.getBoundingClientRect();
    if (bounds.width <= 0) {
      return;
    }
    const fraction = Math.max(
      0,
      Math.min(1, (event.clientX - bounds.left) / bounds.width)
    );
    this.selectPoint(Math.round(fraction * (this.points.length - 1)));
  }

  onPointerDown(event: PointerEvent): void {
    this.isDragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.selectNearestPoint(event);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.isDragging) {
      this.selectNearestPoint(event);
    }
  }

  onPointerUp(): void {
    this.isDragging = false;
  }

  onKeydown(event: KeyboardEvent): void {
    const currentIndex = this.selectedIndex ?? 0;
    let nextIndex = currentIndex;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        nextIndex = Math.min(this.points.length - 1, currentIndex + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = this.points.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.selectPoint(nextIndex);
    this.pointButtons.toArray()[nextIndex].nativeElement.focus();
  }
}
