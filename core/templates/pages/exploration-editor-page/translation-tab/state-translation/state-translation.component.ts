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
 * @fileoverview Component containing the exploration material to be translated.
 */

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {SubtitledUnicode} from 'domain/exploration/subtitled-unicode.model';
import {
  TRANSLATION_DATA_FORMAT_HTML,
  TRANSLATION_DATA_FORMAT_UNICODE,
  TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
  TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING,
} from 'domain/exploration/written-translation.model';
import {InteractionCustomizationArgs} from 'interactions/customization-args-defs';
import {Rule} from 'domain/exploration/rule.model';
import {CkEditorCopyContentService} from
  'components/ck-editor-helpers/ck-editor-copy-content.service';
import {
  AnswerChoice,
  StateEditorService,
} from
  'components/state-editor/state-editor-properties-services/state-editor.service';
import {ExplorationLanguageCodeService} from
  'pages/exploration-editor-page/services/exploration-language-code.service';
import {ExplorationHtmlFormatterService} from
  'services/exploration-html-formatter.service';
import {ExplorationStatesService} from
  'pages/exploration-editor-page/services/exploration-states.service';
import {RouterService} from
  'pages/exploration-editor-page/services/router.service';
import {EntityTranslationsService} from
  'services/entity-translations.services';
import {TranslationLanguageService} from '../services/translation-language.service';
import {TranslationStatusService} from '../services/translation-status.service';
import {TranslationTabActiveContentIdService} from
  '../services/translation-tab-active-content-id.service';
import {TranslationTabActiveModeService} from
  '../services/translation-tab-active-mode.service';

import {FormatRtePreviewPipe} from 'filters/format-rte-preview.pipe';
import {ConvertToPlainTextPipe} from
  'filters/string-utility-filters/convert-to-plain-text.pipe';
import {TruncatePipe} from 'filters/string-utility-filters/truncate.pipe';
import {WrapTextWithEllipsisPipe} from
  'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import {ParameterizeRuleDescriptionPipe} from
  'filters/parameterize-rule-description.pipe';

import {AnswerGroup} from 'domain/exploration/answer-group.model';
import {Hint} from 'domain/exploration/hint-object.model';
import {Solution} from 'domain/exploration/solution.model';
import {Outcome} from 'domain/exploration/outcome.model';
import {TranslatedContent} from
  'domain/exploration/translated-content.model';
import {BaseTranslatableObject} from 'interactions/rule-input-defs';
import {PlatformFeatureService} from 'services/platform-feature.service';

import INTERACTION_SPECS from 'interactions/interaction_specs.json';

@Component({
  selector: 'oppia-state-translation',
  templateUrl: './state-translation.component.html',
})
export class StateTranslationComponent implements OnInit, OnDestroy {
  @Input() isTranslationTabBusy: boolean;

  directiveSubscriptions = new Subscription();

  INTERACTION_SPECS = INTERACTION_SPECS;
  activatedTabId: string;
  activeAnswerGroupIndex: number;
  stateAnswerGroups: AnswerGroup[];
  RULE_INPUT_TYPES_TO_DATA_FORMATS: object;
  TAB_ID_RULE_INPUTS: string;
  stateContent: SubtitledHtml;
  stateSolution: Solution | SubtitledHtml;
  interactionPreviewHtml: string;
  stateInteractionCustomizationArgs: InteractionCustomizationArgs;
  activeCustomizationArgContentIndex: number;
  activeRuleContentIndex: number;
  activeHintIndex: number;
  stateHints: Hint[];
  stateName: string;
  needsUpdateTooltipMessage: string;
  stateInteractionId: string;
  TAB_ID_CUSTOMIZATION_ARGS: string;
  TAB_ID_SOLUTION: string;
  TAB_ID_FEEDBACK: string;
  TAB_ID_HINTS: string;
  TAB_ID_CONTENT: string;
  stateDefaultOutcome: Outcome;
  answerChoices: AnswerChoice[];
  activeTranslatedContent: TranslatedContent;
  activeTab: string;
  initActiveContentId: string | null;
  initActiveIndex: number;

  interactionRuleTranslatableContents: {
    rule: Rule;
    inputName: string;
    contentId: string;
  }[];

  interactionCustomizationArgTranslatableContent: {
    name: string;
    content: SubtitledUnicode | SubtitledHtml;
  }[];

  constructor(
    private ckEditorCopyContentService: CkEditorCopyContentService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private explorationLanguageCodeService: ExplorationLanguageCodeService,
    private explorationStatesService: ExplorationStatesService,
    private routerService: RouterService,
    private stateEditorService: StateEditorService,
    private entityTranslationsService: EntityTranslationsService,
    private translationLanguageService: TranslationLanguageService,
    private translationStatusService: TranslationStatusService,
    private translationTabActiveContentIdService:
      TranslationTabActiveContentIdService,
    private translationTabActiveModeService:
      TranslationTabActiveModeService,
    private formatRtePreviewPipe: FormatRtePreviewPipe,
    private convertToPlainTextPipe: ConvertToPlainTextPipe,
    private truncatePipe: TruncatePipe,
    private wrapTextWithEllipsisPipe: WrapTextWithEllipsisPipe,
    private parameterizeRuleDescriptionPipe:
      ParameterizeRuleDescriptionPipe,
    private platformFeatureService: PlatformFeatureService
  ) {}

  /** Returns true if voiceover mode is active. */
  isVoiceoverModeActive(): boolean {
    return this.translationTabActiveModeService.isVoiceoverModeActive();
  }

  /** Returns true if the active language is the original exploration language. */
  isOriginalLanguageActive(): boolean {
    return (
      this.translationLanguageService.getActiveLanguageCode() ===
      this.explorationLanguageCodeService.displayed
    );
  }

  /** Returns true if a translation exists for the given contentId. */
  isTranslationAvailable(contentId: string): boolean {
    const langCode = this.translationLanguageService.getActiveLanguageCode();
    const entityTranslations =
      this.entityTranslationsService.languageCodeToLatestEntityTranslations[
        langCode
      ];
    if (!entityTranslations) {
      return false;
    }
    const translation = entityTranslations.getWrittenTranslation(contentId);
    return Boolean(translation && translation.translation);
  }

  /** Returns true if the subtitled content has non-empty text. */
  isContentPresent(
    subtitled: SubtitledHtml | SubtitledUnicode
  ): boolean {
    if (!subtitled) {
      return false;
    }
    const content =
      subtitled instanceof SubtitledHtml
        ? subtitled.html
        : subtitled.unicode;
    if (!content) {
      return false;
    }
    if (subtitled instanceof SubtitledHtml) {
      const text = this.convertToPlainTextPipe.transform(content);
      return Boolean(text && text.trim().length > 0);
    }
    return content.trim().length > 0;
  }

  /** Returns true if a card should be visible in voiceover mode. */
  isCardVisible(subtitled: SubtitledHtml | SubtitledUnicode): boolean {
    if (!this.isVoiceoverModeActive()) {
      return true;
    }
    return this.isContentPresent(subtitled);
  }

  getRequiredHtml(subtitledHtml: SubtitledHtml): string {
    if (this.translationTabActiveModeService.isTranslationModeActive()) {
      return subtitledHtml.html;
    }

    if (this.isOriginalLanguageActive()) {
      return subtitledHtml.html;
    }

    const langCode = this.translationLanguageService.getActiveLanguageCode();
    const entityTranslations =
      this.entityTranslationsService.languageCodeToLatestEntityTranslations[
        langCode
      ];
    if (!entityTranslations) {
      return null;
    }

    const translationContent =
      entityTranslations.getWrittenTranslation(subtitledHtml.contentId);
    return translationContent
      ? (translationContent.translation as string)
      : null;
  }

  getRequiredUnicode(subtitledUnicode: SubtitledUnicode): string {
    if (this.translationTabActiveModeService.isTranslationModeActive()) {
      return subtitledUnicode.unicode;
    }

    if (this.isOriginalLanguageActive()) {
      return subtitledUnicode.unicode;
    }

    const langCode = this.translationLanguageService.getActiveLanguageCode();
    const entityTranslations =
      this.entityTranslationsService.languageCodeToLatestEntityTranslations[
        langCode
      ];
    if (!entityTranslations) {
      return null;
    }

    const translationContent =
      entityTranslations.getWrittenTranslation(
        subtitledUnicode.contentId
      );
    return translationContent
      ? (translationContent.translation as string)
      : null;
  }

  contentIdStatusColorStyle(contentId: string): object {
    let color =
      this.translationStatusService.getActiveStateContentIdStatusColor(
        contentId
      );

    if (
      this.isVoiceoverModeActive() &&
      !this.isOriginalLanguageActive() &&
      !this.isTranslationAvailable(contentId)
    ) {
      color = '#808080';
    }

    return {'border-left': '3px solid ' + color};
  }

  summarizeDefaultOutcome(
    defaultOutcome: Outcome,
    interactionId: string,
    answerGroupCount: number,
    shortenRule: string
  ): string {
    if (!defaultOutcome) {
      return '';
    }

    let summary = 'Feedback';
    const hasFeedback = defaultOutcome.hasNonemptyFeedback();

    if (!this.isVoiceoverModeActive()) {
      if (interactionId && INTERACTION_SPECS[interactionId].is_linear) {
        summary = INTERACTION_SPECS[interactionId].default_outcome_heading;
      } else if (answerGroupCount > 0) {
        summary = 'All other answers';
      } else {
        summary = 'All answers';
      }
    }

    if (hasFeedback && shortenRule) {
      summary = this.wrapTextWithEllipsisPipe.transform(
        summary,
        AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT
      );
    }

    summary = '[' + summary + ']';

    if (hasFeedback) {
      summary +=
        ' ' +
        this.convertToPlainTextPipe.transform(
          defaultOutcome.feedback.html
        );
    }

    return summary;
  }

  summarizeAnswerGroup(
    answerGroup: AnswerGroup,
    interactionId: string,
    answerChoices: AnswerChoice[],
    shortenRule: boolean
  ): string {
    let summary = 'Feedback';
    const outcome = answerGroup.outcome;
    const hasFeedback = outcome.hasNonemptyFeedback();

    if (!this.isVoiceoverModeActive() && answerGroup.rules) {
      let firstRule = this.convertToPlainTextPipe.transform(
        this.parameterizeRuleDescriptionPipe.transform(
          answerGroup.rules[0],
          interactionId,
          answerChoices
        )
      );
      summary = firstRule;

      if (hasFeedback && shortenRule) {
        summary = this.wrapTextWithEllipsisPipe.transform(
          summary,
          AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT
        );
      }
    }

    summary = '[' + summary + ']';

    if (hasFeedback) {
      summary +=
        ' ' +
        (shortenRule
          ? this.truncatePipe.transform(outcome.feedback.html, 30)
          : this.convertToPlainTextPipe.transform(
              outcome.feedback.html
            ));
    }

    return summary;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
