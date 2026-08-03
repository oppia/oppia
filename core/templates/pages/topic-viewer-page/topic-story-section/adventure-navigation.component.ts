// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Top adventure navigation bar shown above story arcs.
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import './adventure-navigation.component.css';

interface AdventureNavigationGroup {
  lessons: {
    lessonNumber: number;
  }[];
  accentColor: string;
  showPractice: boolean;
}

@Component({
  selector: 'topic-adventure-navigation',
  templateUrl: './adventure-navigation.component.html',
  styleUrls: ['./adventure-navigation.component.css'],
})
export class AdventureNavigationComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() adventureGroups: AdventureNavigationGroup[] = [];
  @Input() activeLessonNumber: number | null = null;
  @Output() lessonSelected = new EventEmitter<number>();
  @Output() practiceSelected = new EventEmitter<number>();

  @ViewChild('scrollWrapper') scrollWrapper!: ElementRef<HTMLElement>;

  showLeftArrow: boolean = false;
  showRightArrow: boolean = false;
  hasHorizontalOverflow: boolean = false;

  private scrollCheckTimeouts: ReturnType<typeof setTimeout>[] = [];

  ngAfterViewInit(): void {
    // Defer checks to allow DOM to fully render.
    this.scrollCheckTimeouts.push(setTimeout(() => this.updateArrows(), 50));
    this.scrollCheckTimeouts.push(setTimeout(() => this.updateArrows(), 200));
    this.scrollCheckTimeouts.push(setTimeout(() => this.updateArrows(), 500));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.adventureGroups) {
      // When adventureGroups changes, schedule arrow updates.
      this.scrollCheckTimeouts.push(setTimeout(() => this.updateArrows(), 100));
      this.scrollCheckTimeouts.push(setTimeout(() => this.updateArrows(), 300));
    }
  }

  ngOnDestroy(): void {
    this.scrollCheckTimeouts.forEach(timeout => clearTimeout(timeout));
    this.scrollCheckTimeouts = [];
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateArrows();
  }

  onScroll(): void {
    this.updateArrows();
  }

  private updateArrows(): void {
    const el = this.scrollWrapper?.nativeElement;
    if (!el) {
      this.hasHorizontalOverflow = false;
      return;
    }

    const hasOverflow = el.scrollWidth > el.clientWidth;
    this.hasHorizontalOverflow = hasOverflow;

    if (!hasOverflow) {
      // No overflow, hide both arrows.
      this.showLeftArrow = false;
      this.showRightArrow = false;
      return;
    }

    const maxScroll = el.scrollWidth - el.clientWidth;
    const currentScroll = el.scrollLeft;

    this.showLeftArrow = currentScroll > 5;
    this.showRightArrow = currentScroll < maxScroll - 5;
  }

  scrollLeft(): void {
    const el = this.scrollWrapper?.nativeElement;
    if (el) {
      el.scrollBy({left: -200, behavior: 'smooth'});
      this.scrollCheckTimeouts.push(setTimeout(() => this.updateArrows(), 500));
    }
  }

  scrollRight(): void {
    const el = this.scrollWrapper?.nativeElement;
    if (el) {
      el.scrollBy({left: 200, behavior: 'smooth'});
      this.scrollCheckTimeouts.push(setTimeout(() => this.updateArrows(), 500));
    }
  }

  isActiveLesson(lessonNumber: number): boolean {
    // Badge is colored when it's the currently selected lesson in navbar.
    if (this.activeLessonNumber === null) {
      return lessonNumber === 1;
    }
    return lessonNumber === this.activeLessonNumber;
  }

  onLessonClick(lessonNumber: number): void {
    this.lessonSelected.emit(lessonNumber);
  }

  onPracticeClick(adventureIndex: number): void {
    this.practiceSelected.emit(adventureIndex);
  }
}
