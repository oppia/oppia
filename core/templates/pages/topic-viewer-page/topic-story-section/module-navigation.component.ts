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
 * @fileoverview Top module navigation bar shown above story arcs.
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

import './module-navigation.component.css';

interface ModuleNavigationGroup {
  lessons: {
    lessonNumber: number;
    isCompleted: boolean;
  }[];
  accentColor: string;
  showPractice: boolean;
  isPracticeCompleted: boolean;
  arcId: string;
}

export interface ModuleNavigationLessonSelection {
  lessonNumber: number;
  moduleIndex: number;
}

@Component({
  selector: 'topic-module-navigation',
  templateUrl: './module-navigation.component.html',
  styleUrls: ['./module-navigation.component.css'],
})
export class ModuleNavigationComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() moduleGroups: ModuleNavigationGroup[] = [];
  @Input() activeLessonNumber: number | null = null;
  // The arc whose practice card is currently selected in the navbar.
  @Input() activePracticeArcId: string = '';
  // True when this component is rendered inside the topic editor's preview
  // tab, where the fixed editor header bar adds height to the header stack.
  @Input() isInTopicEditorPreview: boolean = false;
  @Output() lessonSelected =
    new EventEmitter<ModuleNavigationLessonSelection>();
  @Output() practiceSelected = new EventEmitter<string>();
  @Output() masteryChallengeClicked = new EventEmitter<void>();

  @ViewChild('scrollWrapper') scrollWrapper!: ElementRef<HTMLElement>;

  showLeftArrow: boolean = false;
  showRightArrow: boolean = false;
  hasHorizontalOverflow: boolean = false;

  private scrollCheckTimeouts: ReturnType<typeof setTimeout>[] = [];

  constructor() {}

  ngAfterViewInit(): void {
    // Defer checks to allow DOM to fully render.
    this.scrollCheckTimeouts.push(setTimeout(() => this.updateArrows(), 50));
    this.scrollCheckTimeouts.push(setTimeout(() => this.updateArrows(), 200));
    this.scrollCheckTimeouts.push(setTimeout(() => this.updateArrows(), 500));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.moduleGroups) {
      // When moduleGroups changes, schedule arrow updates.
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
    // Badge is colored only when it is the currently selected lesson.
    if (this.activeLessonNumber === null) {
      return false;
    }
    return lessonNumber === this.activeLessonNumber;
  }

  onLessonClick(lessonNumber: number, moduleIndex: number): void {
    this.lessonSelected.emit({
      lessonNumber,
      moduleIndex,
    });
  }

  onPracticeClick(arcId: string): void {
    this.practiceSelected.emit(arcId);
  }

  isActivePractice(arcId: string): boolean {
    return (
      this.activePracticeArcId !== '' && this.activePracticeArcId === arcId
    );
  }

  getPracticeBadgeIconName(): string {
    return 'edit';
  }

  isLastLessonCompleted(moduleGroup: ModuleNavigationGroup): boolean {
    const lessons = moduleGroup.lessons;
    return lessons.length > 0 && lessons[lessons.length - 1].isCompleted;
  }

  onMasteryClick(): void {
    this.masteryChallengeClicked.emit();
  }
}
