// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the state content editor.
 */

import {
  Component,
  OnInit,
  AfterViewChecked,
  OnDestroy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';

import {PageContextService} from 'services/page-context.service';
import {EditabilityService} from 'services/editability.service';
import {EditorFirstTimeEventsService} from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import {ExternalSaveService} from 'services/external-save.service';
import {StateContentService} from 'components/state-editor/state-editor-properties-services/state-content.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';

import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {Subscription} from 'rxjs';

interface HTMLSchema {
  type: string;
  ui_config: {
    rte_component_config_id: 'ALL_COMPONENTS';
    hide_complex_extensions: boolean;
  };
}

@Component({
  selector: 'oppia-state-content-editor',
  templateUrl: './state-content-editor.component.html',
})
export class StateContentEditorComponent
  implements OnInit, AfterViewChecked, OnDestroy
{
  @Output() intialize: EventEmitter<void> = new EventEmitter();
  @Output() saveStateContent = new EventEmitter<SubtitledHtml>();

  @Input() stateContentPlaceholder!: string;
  @Input() stateContentSaveButtonPlaceholder!: string;
  cardHeightLimitWarningIsShown!: boolean;
  contentId!: string | null;
  contentEditorIsOpen: boolean = false;
  directiveSubscriptions = new Subscription();
  isEditable!: boolean;
  HTML_SCHEMA!: HTMLSchema;

  cardHeightLimitReached = false;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private pageContextService: PageContextService,
    private editorFirstTimeEventsService: EditorFirstTimeEventsService,
    private externalSaveService: ExternalSaveService,
    public stateContentService: StateContentService,
    private stateEditorService: StateEditorService,
    private editabilityService: EditabilityService
  ) {}

  ngOnInit(): void {
    this.HTML_SCHEMA = {
      type: 'html',
      ui_config: {
        rte_component_config_id: 'ALL_COMPONENTS',
        hide_complex_extensions:
          this.pageContextService.getEntityType() === 'question',
      },
    };
    if (this.stateContentService.displayed) {
      this.contentId = this.stateContentService.displayed.contentId;
    }

    this.cardHeightLimitWarningIsShown = true;
    this.directiveSubscriptions.add(
      this.externalSaveService.onExternalSave.subscribe(() => {
        if (this.contentEditorIsOpen) {
          this.saveContent();
        }
      })
    );
    this.stateEditorService.updateStateContentEditorInitialised();
  }

  isCardContentLengthLimitReached(): boolean {
    let content = this.stateContentService.displayed.html;
    return content.length > 4500;
  }

  isCardHeightLimitReached(): boolean {
    const shadowPreviewCard = document.querySelector(
      '.oppia-shadow-preview-card .oppia-learner-view-card-top-section'
    ) as HTMLElement | null;

    if (!shadowPreviewCard) {
      return false;
    }
    const height = shadowPreviewCard.offsetHeight;
    return height > 630;
  }

  ngAfterViewChecked(): void {
    let cardHeightLimitReached = this.isCardHeightLimitReached();
    if (cardHeightLimitReached !== this.cardHeightLimitReached) {
      this.cardHeightLimitReached = cardHeightLimitReached;
      this.changeDetectorRef.detectChanges();
    }
    this.detectContentChangeAndAutosave();
  }

  hideCardHeightLimitWarning(): void {
    this.cardHeightLimitWarningIsShown = false;
  }

  saveContent(): void {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }
    this.stateContentService.saveDisplayedValue();
    this.saveStateContent.emit(this.stateContentService.displayed);
    this.contentEditorIsOpen = false;
    this.intialize.emit();
    this.autosaveInitialized = false;
  }

  openStateContentEditor(): void {
    this.editorFirstTimeEventsService.registerFirstOpenContentBoxEvent();
    this.contentEditorIsOpen = true;
    this.lastSavedHtml = this.stateContentService.displayed.html;
    setTimeout(() => {
      this.autosaveInitialized = true;
    });
  }

  onSaveContentButtonClicked(): void {
    this.editorFirstTimeEventsService.registerFirstSaveContentEvent();
    this.saveContent();
  }

  cancelEdit(): void {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }
    this.stateContentService.restoreFromMemento();
    this.contentEditorIsOpen = false;
    this.autosaveInitialized = false;
  }

  isContentEditable(): boolean {
    return this.editabilityService.isEditable();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }
  }

  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly AUTOSAVE_DELAY_MS = 1500;
  private lastSavedHtml: string = '';
  private autosaveInitialized: boolean = false;
  private detectContentChangeAndAutosave(): void {
    if (!this.contentEditorIsOpen || !this.autosaveInitialized) {
      return;
    }
    const currentHtml = this.stateContentService.displayed.html;
    if (currentHtml === this.lastSavedHtml) {
      return;
    }
    this.scheduleAutosave(currentHtml);
  }

  private scheduleAutosave(newHtml: string): void {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }
    this.autosaveTimer = setTimeout(() => {
      this.autoSaveContent(newHtml);
    }, this.AUTOSAVE_DELAY_MS);
  }

  private autoSaveContent(newHtml: string): void {
    if (!this.contentEditorIsOpen) {
      return;
    }
    this.lastSavedHtml = newHtml;
    this.stateContentService.saveDisplayedValue();
    this.saveStateContent.emit(this.stateContentService.displayed);
  }
}
