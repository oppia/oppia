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
import {SubtitledUnicode} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {
  TRANSLATION_DATA_FORMAT_HTML,
  TRANSLATION_DATA_FORMAT_UNICODE,
  TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
  TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING,
} from 'domain/exploration/WrittenTranslationObjectFactory';
import {InteractionCustomizationArgs} from 'interactions/customization-args-defs';
import {Rule} from 'domain/exploration/rule.model';
import {CkEditorCopyContentService} from 'components/ck-editor-helpers/ck-editor-copy-content.service';
import {
  AnswerChoice,
  StateEditorService,
} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {RouterService} from 'pages/exploration-editor-page/services/router.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {TranslationStatusService} from '../services/translation-status.service';
import {TranslationTabActiveContentIdService} from '../services/translation-tab-active-content-id.service';
import {TranslationTabActiveModeService} from '../services/translation-tab-active-mode.service';
import {FormatRtePreviewPipe} from 'filters/format-rte-preview.pipe';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {ConvertToPlainTextPipe} from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import {TruncatePipe} from 'filters/string-utility-filters/truncate.pipe';
import {WrapTextWithEllipsisPipe} from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import {ParameterizeRuleDescriptionPipe} from 'filters/parameterize-rule-description.pipe';
import {AnswerGroup} from 'domain/exploration/AnswerGroupObjectFactory';
import {BaseTranslatableObject} from 'interactions/rule-input-defs';
import {Hint} from 'domain/exploration/hint-object.model';
import {Solution} from 'domain/exploration/SolutionObjectFactory';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {TranslationLanguageService} from '../services/translation-language.service';
import {PlatformFeatureService} from 'services/platform-feature.service';

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
  voiceoverContributionIsEnabled: boolean = true;

  constructor(
    private ckEditorCopyContentService: CkEditorCopyContentService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private explorationStatesService: ExplorationStatesService,
    private routerService: RouterService,
    private stateEditorService: StateEditorService,
    private entityTranslationsService: EntityTranslationsService,
    private translationLanguageService: TranslationLanguageService,
    private translationStatusService: TranslationStatusService,
    private translationTabActiveContentIdService: TranslationTabActiveContentIdService,
    private translationTabActiveModeService: TranslationTabActiveModeService,
    private formatRtePreviewPipe: FormatRtePreviewPipe,
    private ConvertToPlainTextPipe: ConvertToPlainTextPipe,
    private truncatePipe: TruncatePipe,
    private wrapTextWithEllipsisPipe: WrapTextWithEllipsisPipe,
    private parameterizeRuleDescriptionPipe: ParameterizeRuleDescriptionPipe,
    private platformFeatureService: PlatformFeatureService
  ) {}

  isVoiceoverModeActive(): boolean {
    return this.translationTabActiveModeService.isVoiceoverModeActive();
  }

  isVoiceoverContributionEnabled(): boolean {
    return this.platformFeatureService.status.EnableVoiceoverContribution
      .isEnabled;
  }

  isVoiceoverContributionWithAccentEnabled(): boolean {
    return this.platformFeatureService.status.AddVoiceoverWithAccent.isEnabled;
  }

  getRequiredHtml(subtitledHtml: SubtitledHtml): string {
    if (this.translationTabActiveModeService.isTranslationModeActive()) {
      return subtitledHtml.html;
    }

    let langCode = this.translationLanguageService.getActiveLanguageCode();
    if (
      !this.entityTranslationsService.languageCodeToLatestEntityTranslations.hasOwnProperty(
        langCode
      )
    ) {
      return subtitledHtml.html;
    }

    let translationContent =
      this.entityTranslationsService.languageCodeToLatestEntityTranslations[
        langCode
      ].getWrittenTranslation(subtitledHtml.contentId);
    if (!translationContent) {
      return subtitledHtml.html;
    }

    return translationContent.translation as string;
  }

  getRequiredUnicode(SubtitledUnicode: SubtitledUnicode): string {
    if (this.translationTabActiveModeService.isTranslationModeActive()) {
      return SubtitledUnicode.unicode;
    }

    let langCode = this.translationLanguageService.getActiveLanguageCode();
    if (
      !this.entityTranslationsService.languageCodeToLatestEntityTranslations.hasOwnProperty(
        langCode
      )
    ) {
      return SubtitledUnicode.unicode;
    }

    let translationContent =
      this.entityTranslationsService.languageCodeToLatestEntityTranslations[
        langCode
      ].getWrittenTranslation(SubtitledUnicode.contentId);
    if (!translationContent) {
      return SubtitledUnicode.unicode;
    }

    return translationContent.translation as string;
  }

  getEmptyContentMessage(): string {
    if (this.translationTabActiveModeService.isVoiceoverModeActive()) {
      return (
        'The translation for this section has not been created yet. ' +
        'Switch to translation mode to add a text translation.'
      );
    } else {
      return 'There is no text available to translate.';
    }
  }

  isActive(tabId: string): boolean {
    return this.activatedTabId === tabId;
  }

  navigateToState(stateName: string): void {
    this.routerService.navigateToMainTab(stateName);
  }

  onContentClick(event: Event): void {
    if (this.isCopyModeActive()) {
      event.stopPropagation();
    }

    this.ckEditorCopyContentService.broadcastCopy(event.target as HTMLElement);
  }

  isCopyModeActive(): boolean {
    return this.ckEditorCopyContentService.copyModeActive;
  }

  onTabClick(tabId: string): void {
    if (this.isDisabled(tabId)) {
      return;
    }

    if (this.isTranslationTabBusy) {
      this.stateEditorService.onShowTranslationTabBusyModal.emit();
      return;
    }

    let activeContentId = null;
    let activeDataFormat = TRANSLATION_DATA_FORMAT_HTML;

    if (tabId === this.TAB_ID_CONTENT) {
      activeContentId = this.stateContent.contentId;
    } else if (tabId === this.TAB_ID_FEEDBACK) {
      this.activeAnswerGroupIndex = this.initActiveIndex;
      if (this.stateAnswerGroups.length > 0) {
        activeContentId = this.stateAnswerGroups[0].outcome.feedback.contentId;
      } else {
        activeContentId = this.stateDefaultOutcome.feedback.contentId;
      }
    } else if (tabId === this.TAB_ID_HINTS) {
      this.activeHintIndex = this.initActiveIndex;
      activeContentId = this.stateHints[0].hintContent.contentId;
    } else if (tabId === this.TAB_ID_SOLUTION) {
      activeContentId = (this.stateSolution as Solution).explanation.contentId;
    } else if (tabId === this.TAB_ID_CUSTOMIZATION_ARGS) {
      this.activeCustomizationArgContentIndex = this.initActiveIndex;
      const activeContent =
        this.interactionCustomizationArgTranslatableContent[0].content;
      activeContentId = activeContent.contentId;
      if (activeContent instanceof SubtitledUnicode) {
        activeDataFormat = TRANSLATION_DATA_FORMAT_UNICODE;
      }
    } else if (tabId === this.TAB_ID_RULE_INPUTS) {
      if (this.interactionRuleTranslatableContents.length === 0) {
        throw new Error(
          'Accessed rule input translation tab when there are no rules'
        );
      }

      // Note that only 'TextInput' and 'SetInput' have translatable rule
      // types. The rules tab is disabled for other interactions.
      const {rule, inputName, contentId} =
        this.interactionRuleTranslatableContents[0];
      activeContentId = contentId;
      const inputType = rule.inputTypes[inputName];
      activeDataFormat = this.RULE_INPUT_TYPES_TO_DATA_FORMATS[inputType];
      this.activeRuleContentIndex = 0;
    }
    this.translationTabActiveContentIdService.setActiveContent(
      activeContentId,
      activeDataFormat
    );
    this.activatedTabId = tabId;
    this.updateTranslatedContent();
  }

  updateTranslatedContent(): void {
    if (!this.translationTabActiveModeService.isVoiceoverModeActive()) {
      let langCode = this.translationLanguageService.getActiveLanguageCode();
      const entityTranslations =
        this.entityTranslationsService.languageCodeToLatestEntityTranslations[
          langCode
        ];
      if (entityTranslations) {
        this.activeTranslatedContent = entityTranslations.getWrittenTranslation(
          this.translationTabActiveContentIdService.getActiveContentId()
        );
      }
    }
  }

  getHumanReadableRuleInputValues(
    inputValue: {normalizedStrSet: string[]; unicodeStrSet: string[]},
    inputType: string
  ): string {
    if (inputType === 'TranslatableSetOfNormalizedString') {
      return '[' + inputValue.normalizedStrSet.join(', ') + ']';
    } else if (inputType === 'TranslatableSetOfUnicodeString') {
      return '[' + inputValue.unicodeStrSet.join(', ') + ']';
    } else {
      throw new Error(`The ${inputType} type is not implemented.`);
    }
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

    let summary = '';
    let hasFeedback = defaultOutcome.hasNonemptyFeedback();

    if (interactionId && INTERACTION_SPECS[interactionId].is_linear) {
      summary = INTERACTION_SPECS[interactionId].default_outcome_heading;
    } else if (answerGroupCount > 0) {
      summary = 'All other answers';
    } else {
      summary = 'All answers';
    }

    if (hasFeedback && shortenRule) {
      summary = this.wrapTextWithEllipsisPipe.transform(
        summary,
        AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT
      );
    }
    summary = '[' + summary + '] ';

    if (hasFeedback) {
      summary += this.ConvertToPlainTextPipe.transform(
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
    let summary = '';
    let outcome = answerGroup.outcome;
    let hasFeedback = outcome.hasNonemptyFeedback();

    if (answerGroup.rules) {
      let firstRule = this.ConvertToPlainTextPipe.transform(
        this.parameterizeRuleDescriptionPipe.transform(
          answerGroup.rules[0],
          interactionId,
          answerChoices
        )
      );
      summary = 'Answer ' + firstRule;

      if (hasFeedback && shortenRule) {
        summary = this.wrapTextWithEllipsisPipe.transform(
          summary,
          AppConstants.RULE_SUMMARY_WRAP_CHARACTER_COUNT
        );
      }
      summary = '[' + summary + '] ';
    }

    if (hasFeedback) {
      summary += shortenRule
        ? this.truncatePipe.transform(outcome.feedback.html, 30)
        : this.ConvertToPlainTextPipe.transform(outcome.feedback.html);
    }
    return summary;
  }

  isDisabled(tabId: string): boolean {
    if (tabId === this.TAB_ID_CONTENT) {
      return false;
    }
    // This is used to prevent users from adding unwanted audio for
    // default_outcome and hints in Continue and EndExploration
    // interaction. An exception is if the interaction contains
    // translatable customization arguments -- e.g. Continue
    // interaction's placeholder.
    if (
      tabId !== this.TAB_ID_CUSTOMIZATION_ARGS &&
      (!this.stateInteractionId ||
        INTERACTION_SPECS[this.stateInteractionId].is_linear ||
        INTERACTION_SPECS[this.stateInteractionId].is_terminal)
    ) {
      return true;
    } else if (tabId === this.TAB_ID_FEEDBACK) {
      if (!this.stateDefaultOutcome) {
        return true;
      } else {
        return false;
      }
    } else if (tabId === this.TAB_ID_HINTS) {
      if (this.stateHints.length <= 0) {
        return true;
      } else {
        return false;
      }
    } else if (tabId === this.TAB_ID_SOLUTION) {
      if (!this.stateSolution) {
        return true;
      } else {
        return false;
      }
    } else if (tabId === this.TAB_ID_CUSTOMIZATION_ARGS) {
      return this.interactionCustomizationArgTranslatableContent.length === 0;
    } else if (tabId === this.TAB_ID_RULE_INPUTS) {
      return this.interactionRuleTranslatableContents.length === 0;
    }
  }

  changeActiveHintIndex(newIndex: number): void {
    if (this.isTranslationTabBusy) {
      this.stateEditorService.onShowTranslationTabBusyModal.emit();
      return;
    }

    if (this.activeHintIndex === newIndex) {
      return;
    }

    this.activeHintIndex = newIndex;
    let activeContentId = this.stateHints[newIndex].hintContent.contentId;
    this.translationTabActiveContentIdService.setActiveContent(
      activeContentId,
      TRANSLATION_DATA_FORMAT_HTML
    );
    this.updateTranslatedContent();
  }

  changeActiveRuleContentIndex(newIndex: number): void {
    if (this.isTranslationTabBusy) {
      this.stateEditorService.onShowTranslationTabBusyModal.emit();
      return;
    }
    if (this.activeRuleContentIndex === newIndex) {
      return;
    }
    const {rule, inputName, contentId} =
      this.interactionRuleTranslatableContents[newIndex];
    const activeContentId = contentId;
    const inputType = rule.inputTypes[inputName];
    const activeDataFormat = this.RULE_INPUT_TYPES_TO_DATA_FORMATS[inputType];

    this.translationTabActiveContentIdService.setActiveContent(
      activeContentId,
      activeDataFormat
    );
    this.activeRuleContentIndex = newIndex;
    this.updateTranslatedContent();
  }

  changeActiveCustomizationArgContentIndex(newIndex: number): void {
    if (this.isTranslationTabBusy) {
      this.stateEditorService.onShowTranslationTabBusyModal.emit();
      return;
    }

    if (this.activeCustomizationArgContentIndex === newIndex) {
      return;
    }

    const activeContent =
      this.interactionCustomizationArgTranslatableContent[newIndex].content;
    const activeContentId = activeContent.contentId;
    let activeDataFormat = null;

    if (activeContent instanceof SubtitledUnicode) {
      activeDataFormat = TRANSLATION_DATA_FORMAT_UNICODE;
    } else if (activeContent instanceof SubtitledHtml) {
      activeDataFormat = TRANSLATION_DATA_FORMAT_HTML;
    }

    this.translationTabActiveContentIdService.setActiveContent(
      activeContentId,
      activeDataFormat
    );
    this.activeCustomizationArgContentIndex = newIndex;
    this.updateTranslatedContent();
  }

  changeActiveAnswerGroupIndex(newIndex: number): void {
    if (this.isTranslationTabBusy) {
      this.stateEditorService.onShowTranslationTabBusyModal.emit();
      return;
    }

    if (this.activeAnswerGroupIndex !== newIndex) {
      let activeContentId = null;
      this.activeAnswerGroupIndex = newIndex;
      if (newIndex === this.stateAnswerGroups.length) {
        activeContentId = this.stateDefaultOutcome.feedback.contentId;
      } else {
        activeContentId =
          this.stateAnswerGroups[newIndex].outcome.feedback.contentId;
      }

      this.translationTabActiveContentIdService.setActiveContent(
        activeContentId,
        TRANSLATION_DATA_FORMAT_HTML
      );
    }
    this.updateTranslatedContent();
  }

  tabStatusColorStyle(tabId: string): object {
    if (!this.isDisabled(tabId)) {
      let color =
        this.translationStatusService.getActiveStateComponentStatusColor(tabId);
      return {'border-top-color': color};
    }
  }

  tabNeedUpdatesStatus(tabId: string): boolean {
    if (!this.isDisabled(tabId)) {
      return this.translationStatusService.getActiveStateComponentNeedsUpdateStatus(
        tabId
      );
    }
  }

  contentIdNeedUpdates(contentId: string): boolean {
    return this.translationStatusService.getActiveStateContentIdNeedsUpdateStatus(
      contentId
    );
  }

  contentIdStatusColorStyle(contentId: string): object {
    let color =
      this.translationStatusService.getActiveStateContentIdStatusColor(
        contentId
      );

    return {'border-left': '3px solid ' + color};
  }

  getSubtitledContentSummary(
    subtitledContent: SubtitledHtml | SubtitledUnicode
  ): string {
    if (subtitledContent instanceof SubtitledHtml) {
      return this.formatRtePreviewPipe.transform(subtitledContent.html);
    } else if (subtitledContent instanceof SubtitledUnicode) {
      return subtitledContent.unicode;
    }
  }

  getInteractionRuleTranslatableContents(): {
    rule: Rule;
    inputName: string;
    contentId: string;
  }[] {
    const allRules = this.stateAnswerGroups
      .map(answerGroup => answerGroup.rules)
      .flat();

    const interactionRuleTranslatableContent = [];
    allRules.forEach(rule => {
      Object.keys(rule.inputs).forEach(inputName => {
        const ruleInput = rule.inputs[inputName];
        // All rules input types which are translatable are subclasses of
        // BaseTranslatableObject having dict structure with contentId
        // as a key.
        if (ruleInput && ruleInput.hasOwnProperty('contentId')) {
          const contentId = (ruleInput as BaseTranslatableObject).contentId;
          interactionRuleTranslatableContent.push({
            rule,
            inputName,
            contentId,
          });
        }
      });
    });

    return interactionRuleTranslatableContent;
  }

  getInteractionCustomizationArgTranslatableContents(
    customizationArgs: InteractionCustomizationArgs
  ): {name: string; content: SubtitledUnicode | SubtitledHtml}[] {
    const translatableContents = [];

    const camelCaseToSentenceCase = s => {
      // Lowercase the first letter (edge case for UpperCamelCase).
      s = s.charAt(0).toLowerCase() + s.slice(1);
      // Add a space in front of capital letters.
      s = s.replace(/([A-Z])/g, ' $1');
      // Captialize first letter.
      s = s.charAt(0).toUpperCase() + s.slice(1);
      return s;
    };

    const traverseValueAndRetrieveSubtitledContent = (
      name: string,
      value: Object[] | Object
    ): void => {
      if (value instanceof SubtitledUnicode || value instanceof SubtitledHtml) {
        translatableContents.push({
          name,
          content: value,
        });
      } else if (value instanceof Array) {
        value.forEach((element, index) =>
          traverseValueAndRetrieveSubtitledContent(
            `${name} (${index})`,
            element
          )
        );
      } else if (value instanceof Object) {
        Object.keys(value).forEach(key =>
          traverseValueAndRetrieveSubtitledContent(
            `${name} > ${camelCaseToSentenceCase(key)}`,
            value[key]
          )
        );
      }
    };

    Object.keys(customizationArgs).forEach(caName =>
      traverseValueAndRetrieveSubtitledContent(
        camelCaseToSentenceCase(caName),
        customizationArgs[caName].value
      )
    );

    return translatableContents;
  }

  getActiveTab(): string {
    this.initActiveContentId = this.stateEditorService.getInitActiveContentId();
    if (!this.initActiveContentId) {
      return null;
    }
    const tabName = this.stateEditorService
      .getInitActiveContentId()
      .split('_')[0];
    return tabName === 'default' ? this.TAB_ID_FEEDBACK : tabName;
  }

  getIndexOfActiveCard(): number {
    if (!this.stateEditorService.getInitActiveContentId()) {
      return 0;
    }

    const tabName = this.activeTab;
    switch (tabName) {
      case this.TAB_ID_FEEDBACK:
        return this.stateAnswerGroups.findIndex(
          card => card.outcome.feedback.contentId === this.initActiveContentId
        );
      case this.TAB_ID_HINTS:
        return this.stateHints.findIndex(
          card => card.hintContent.contentId === this.initActiveContentId
        );
      case this.TAB_ID_CUSTOMIZATION_ARGS:
        return this.interactionCustomizationArgTranslatableContent.findIndex(
          card => card.content.contentId === this.initActiveContentId
        );
      default:
        return 0;
    }
  }

  initStateTranslation(): void {
    this.stateName = this.stateEditorService.getActiveStateName();
    this.stateContent = this.explorationStatesService.getStateContentMemento(
      this.stateName
    );
    this.stateSolution = this.explorationStatesService.getSolutionMemento(
      this.stateName
    );
    this.stateHints = this.explorationStatesService.getHintsMemento(
      this.stateName
    );
    this.stateAnswerGroups =
      this.explorationStatesService.getInteractionAnswerGroupsMemento(
        this.stateName
      );
    this.stateDefaultOutcome =
      this.explorationStatesService.getInteractionDefaultOutcomeMemento(
        this.stateName
      );
    this.stateInteractionId =
      this.explorationStatesService.getInteractionIdMemento(this.stateName);
    this.stateInteractionCustomizationArgs =
      this.explorationStatesService.getInteractionCustomizationArgsMemento(
        this.stateName
      );
    this.activeHintIndex = null;
    this.activeAnswerGroupIndex = null;
    let currentCustomizationArgs =
      this.explorationStatesService.getInteractionCustomizationArgsMemento(
        this.stateName
      );
    this.answerChoices = this.stateEditorService.getAnswerChoices(
      this.stateInteractionId,
      currentCustomizationArgs
    );
    this.interactionPreviewHtml = this.stateInteractionId
      ? this.explorationHtmlFormatterService.getInteractionHtml(
          this.stateInteractionId,
          this.stateInteractionCustomizationArgs,
          false,
          null,
          null
        )
      : '';
    this.interactionCustomizationArgTranslatableContent =
      this.getInteractionCustomizationArgTranslatableContents(
        this.stateInteractionCustomizationArgs
      );
    this.interactionRuleTranslatableContents =
      this.getInteractionRuleTranslatableContents();

    if (this.translationTabActiveModeService.isVoiceoverModeActive()) {
      this.needsUpdateTooltipMessage =
        'Audio needs update to ' + 'match text. Please record new audio.';
    } else {
      this.needsUpdateTooltipMessage =
        'Translation needs update ' +
        'to match text. Please re-translate the content.';
    }
    this.isDisabled(this.activatedTabId) || !this.activatedTabId
      ? this.onTabClick(this.TAB_ID_CONTENT)
      : this.onTabClick(this.activatedTabId);

    this.updateTranslatedContent();
  }

  ngOnInit(): void {
    // A map from translatable rule input types to their corresponding data
    // formats.
    this.RULE_INPUT_TYPES_TO_DATA_FORMATS = {
      TranslatableSetOfNormalizedString:
        TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
      TranslatableSetOfUnicodeString:
        TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING,
    };

    // Define tab constants.
    this.TAB_ID_CONTENT = AppConstants.COMPONENT_NAME_CONTENT;
    this.TAB_ID_FEEDBACK = AppConstants.COMPONENT_NAME_FEEDBACK;
    this.TAB_ID_HINTS = AppConstants.COMPONENT_NAME_HINT;
    this.TAB_ID_RULE_INPUTS = AppConstants.COMPONENT_NAME_RULE_INPUT;
    this.TAB_ID_SOLUTION = AppConstants.COMPONENT_NAME_SOLUTION;
    this.TAB_ID_CUSTOMIZATION_ARGS =
      AppConstants.COMPONENT_NAME_INTERACTION_CUSTOMIZATION_ARGS;

    // Activates Content tab by default.
    this.activatedTabId = this.TAB_ID_CONTENT;
    this.stateHints = [];
    this.stateAnswerGroups = [];

    this.activeTab = this.getActiveTab();

    this.directiveSubscriptions.add(
      this.stateEditorService.onRefreshStateTranslation.subscribe(() =>
        this.initStateTranslation()
      )
    );

    this.initStateTranslation();
    this.initActiveIndex = this.getIndexOfActiveCard();
    this.stateEditorService.setInitActiveContentId(null);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
