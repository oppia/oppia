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
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';

import {PageContextService} from 'services/page-context.service';
import {EditabilityService} from 'services/editability.service';
import {EditorFirstTimeEventsService} from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import {ExternalSaveService} from 'services/external-save.service';
import {ExternalRteSaveService} from 'services/external-rte-save.service';
import {StateContentService} from 'components/state-editor/state-editor-properties-services/state-content.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';

import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {Subscription} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmFormulaAsTextModalComponent} from 'pages/contributor-dashboard-page/modal-templates/confirm-formula-as-text-modal.component';

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
export class StateContentEditorComponent implements OnInit {
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
    private externalRteSaveService: ExternalRteSaveService,
    public stateContentService: StateContentService,
    private stateEditorService: StateEditorService,
    private editabilityService: EditabilityService,
    private ngbModal: NgbModal
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
  }

  hideCardHeightLimitWarning(): void {
    this.cardHeightLimitWarningIsShown = false;
  }

  saveContent(): void {
    this.stateContentService.saveDisplayedValue();
    this.saveStateContent.emit(this.stateContentService.displayed);
    this.contentEditorIsOpen = false;
    this.intialize.emit();
  }

  openStateContentEditor(): void {
    this.editorFirstTimeEventsService.registerFirstOpenContentBoxEvent();
    this.contentEditorIsOpen = true;
  }

  isFormulaAsText(htmlString: string | string[]): boolean {
    if (
      !htmlString ||
      typeof htmlString !== 'string' ||
      htmlString.includes('oppia-noninteractive-math')
    ) {
      return false;
    }

    const textWithNewlines = htmlString
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();

    const lines = textWithNewlines
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return lines.some(line => /[+\-*/=]/.test(line));
  }

  onSaveContentButtonClicked(): void {
    this.editorFirstTimeEventsService.registerFirstSaveContentEvent();
    this.externalRteSaveService.onExternalRteSave.emit();
    if (this.isFormulaAsText(this.stateContentService.displayed._html)) {
      this.ngbModal
        .open(ConfirmFormulaAsTextModalComponent, {
          backdrop: 'static',
        })
        .result.then(
          () => {
            this.saveContent();
          },
          () => {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          }
        );
    } else {
      this.saveContent();
    }
  }

  cancelEdit(): void {
    this.stateContentService.restoreFromMemento();
    this.contentEditorIsOpen = false;
  }

  isContentEditable(): boolean {
    return this.editabilityService.isEditable();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
