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
 * @fileoverview Component for the skill rubrics editor.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {Rubric} from 'domain/skill/rubric.model';
import {SkillUpdateService} from 'domain/skill/skill-update.service';
import {Skill} from 'domain/skill/SkillObjectFactory';
import {SkillEditorStateService} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

@Component({
  selector: 'oppia-skill-rubrics-editor',
  templateUrl: './skill-rubrics-editor.component.html',
})
export class SkillRubricsEditorComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  skill!: Skill;
  rubrics!: Rubric[];
  rubricsListIsShown: boolean = false;
  directiveSubscriptions = new Subscription();
  windowIsNarrow!: boolean;
  skillEditorCardIsShown: boolean = false;

  constructor(
    private skillEditorStateService: SkillEditorStateService,
    private skillUpdateService: SkillUpdateService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  onSaveRubric(difficulty: string, explanations: string[]): void {
    this.skillUpdateService.updateRubricForDifficulty(
      this.skill,
      difficulty,
      explanations
    );
  }

  toggleRubricsList(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.rubricsListIsShown = !this.rubricsListIsShown;
    }
  }

  toggleSkillEditorCard(): void {
    if (this.windowDimensionsService.isWindowNarrow()) {
      this.skillEditorCardIsShown = !this.skillEditorCardIsShown;
    }
  }

  ngOnInit(): void {
    this.skillEditorCardIsShown = true;
    this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
    if (this.windowDimensionsService.getResizeEvent) {
      this.directiveSubscriptions.add(
        this.windowDimensionsService.getResizeEvent().subscribe(() => {
          this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
          this.rubricsListIsShown =
            !this.windowDimensionsService.isWindowNarrow();
        })
      );
    }

    this.skill = this.skillEditorStateService.getSkill();
    this.rubricsListIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.skillEditorStateService.onSkillChange.subscribe(
        () => (this.rubrics = this.skill.getRubrics())
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
