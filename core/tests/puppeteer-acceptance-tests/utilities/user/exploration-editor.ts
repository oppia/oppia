// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility functions for the Exploration Editor page.
 */

import puppeteer, {ElementHandle} from 'puppeteer';
import {BaseUser} from '../common/puppeteer-utils';
import testConstants from '../common/test-constants';
import {showMessage} from '../common/show-message';
import {error} from 'console';
import fs from 'fs';
import path from 'path';

import {GraphViz} from '../common/interactions/graph-viz';
import {PencilCode} from '../common/interactions/pencil-code';
import {ImageAreaSelection} from '../common/interactions/image-area-selection';

const creatorDashboardPage = testConstants.URLs.CreatorDashboard;
const baseUrl = testConstants.URLs.BaseURL;
const imageToUpload = testConstants.data.curriculumAdminThumbnailImage;

const createExplorationButtonSelector =
  'button.e2e-test-create-new-exploration-button';
const dismissWelcomeModalSelector = 'button.e2e-test-dismiss-welcome-modal';
const dropdownToggleIcon = '.e2e-test-mobile-options-dropdown';
const saveContentButton = 'button.e2e-test-save-state-content';
const addInteractionButton = 'button.e2e-test-open-add-interaction-modal';
const saveInteractionButton = 'button.e2e-test-save-interaction';
const saveChangesButton = 'button.e2e-test-save-changes';
const mathInteractionsTab = '.e2e-test-interaction-tab-math';
const closeResponseModalButton = '.e2e-test-close-add-response-modal';

const settingsTabSelector = 'a.e2e-test-exploration-settings-tab';
const addTitleBar = 'input#explorationTitle';
const explorationTitleSelector = '.e2e-test-exploration-title-input';
const addGoalInputBox = '.e2e-test-exploration-objective-input';
const categoryDropdown = 'mat-select.e2e-test-exploration-category-dropdown';
const languageUpdateDropdown =
  'mat-select.e2e-test-exploration-language-select';
const addTagsInputBox = 'input.e2e-test-chip-list-tags';
const autoSaveIndicator = 'span.e2e-test-autosave-indicator';
const previewSummaryButton = 'button.e2e-test-open-preview-summary-modal';
const dismissPreviewButton = 'button.e2e-test-close-preview-summary-modal';
const textToSpeechToggle = 'label.e2e-test-on-off-switch';
const feedbackToggle = 'label.e2e-test-enable-fallbacks';
const editRoleButton = '.e2e-test-edit-roles';
const addUsernameInputBox = '#newMemberUsername';
const addRoleDropdown = 'mat-select.e2e-test-role-select';
const collaboratorRoleOption = 'Collaborator (can make changes)';
const playtesterRoleOption = 'Playtester (can give feedback)';
const saveRoleButton = 'button.e2e-test-save-role';

const interactionDiv = '.e2e-test-interaction';
const addInteractionModalSelector = 'customize-interaction-body-container';
const multipleChoiceInteractionButton =
  'div.e2e-test-interaction-tile-MultipleChoiceInput';
const addResponseOptionButton = 'button.e2e-test-add-list-entry';
const addAnotherResponseButton = 'button.e2e-test-add-another-response';
const multipleChoiceResponseDropdown =
  'mat-select.e2e-test-main-html-select-selector';
const multipleChoiceResponseOption = 'mat-option.e2e-test-html-select-selector';
const textInputInteractionButton = 'div.e2e-test-interaction-tile-TextInput';
const textInputInteractionOption =
  'tr#e2e-test-schema-based-list-editor-table-row';
const textInputField = '.e2e-test-text-input';

const saveDraftButton = 'button.e2e-test-save-draft-button';
const commitMessageSelector = 'textarea.e2e-test-commit-message-input';
const publishExplorationButtonSelector = 'button.e2e-test-publish-exploration';
const explorationTitleInput = 'input.e2e-test-exploration-title-input-modal';
const explorationGoalInput = 'input.e2e-test-exploration-objective-input-modal';
const explorationCategoryDropdown =
  'mat-form-field.e2e-test-exploration-category-metadata-modal';
const explorationLanguageSelector =
  '.e2e-test-exploration-language-select-modal';

const saveExplorationChangesButton = 'button.e2e-test-confirm-pre-publication';
const explorationConfirmPublishButton = '.e2e-test-confirm-publish';
const explorationIdElement = 'span.oppia-unique-progress-id';
const closePublishedPopUpButton = 'button.e2e-test-share-publish-close';
const discardDraftDropdownSelector = 'button.e2e-test-save-discard-toggle';
const desktopDiscardDraftButton = 'a.e2e-test-discard-changes';
const confirmDiscardButton = 'button.e2e-test-confirm-discard-changes';
const currentCardNameContainerSelector = '.e2e-test-state-name-container';

const previewTabButton = '.e2e-test-preview-tab';
const previewTabContainer = '.e2e-test-preview-tab-container';
const mobilePreviewTabButton = '.e2e-test-mobile-preview-button';
const mainTabButton = '.e2e-test-main-tab';
const mobileMainTabButton = '.e2e-test-mobile-main-tab';
const stateEditSelector = '.e2e-test-state-edit-content';
// TODO(#23019): Required selector for code below.
// const stateContentSelector = '.e2e-test-actual-state-content';
const stateContentInputField = 'div.e2e-test-rte';
const uploadImageButton = '.e2e-test-upload-image';
const useTheUploadImageButton = '.e2e-test-use-image';

const correctAnswerInTheGroupSelector = '.e2e-test-editor-correctness-toggle';
const addNewResponseButton = 'button.e2e-test-add-new-response';
const floatFormInput = '.e2e-test-float-form-input';
const modifyExistingTranslationsButton = '.e2e-test-modify-translations-button';
const leaveTranslationsAsIsButton = '.e2e-test-leave-translations-as-is';
const activeTranslationTab = '.e2e-test-active-translation-tab';
const modifyTranslationModalSelector =
  '.e2e-test-modify-translations-modal-body';

const stateNodeSelector = '.e2e-test-node-label';
const openOutcomeDestButton = '.e2e-test-open-outcome-dest-editor';
const destinationCardSelector = 'select.e2e-test-destination-selector-dropdown';
const addStateInput = '.e2e-test-add-state-input';
const saveOutcomeDestButton = '.e2e-test-save-outcome-dest';
const stateResponsesSelector = '.e2e-test-default-response-tab';
const feedbackEditorSelector = '.e2e-test-open-feedback-editor';
const responseModalHeaderSelector = '.e2e-test-add-response-modal-header';
const toastMessage = '.e2e-test-toast-message';

const defaultFeedbackTab = 'a.e2e-test-default-response-tab';
const openOutcomeFeedBackEditor = 'div.e2e-test-open-outcome-feedback-editor';
const saveOutcomeFeedbackButton = 'button.e2e-test-save-outcome-feedback';
const addHintButton = 'button.e2e-test-oppia-add-hint-button';
const saveHintButton = 'button.e2e-test-save-hint';
const addSolutionButton = 'button.e2e-test-oppia-add-solution-button';
const solutionInputNumeric = 'oppia-add-or-update-solution-modal input';
const solutionInputTextArea =
  'oppia-add-or-update-solution-modal textarea.e2e-test-description-box';
const submitSolutionButton = 'button.e2e-test-submit-solution-button';
const oppiaFeebackEditorContainerSelector = '.e2e-test-response-body-default';

const dismissTranslationWelcomeModalSelector =
  'button.e2e-test-translation-tab-dismiss-welcome-modal';
const translationTabButton = '.e2e-test-translation-tab';
const mobileTranslationTabButton = '.e2e-test-mobile-translation-tab';

const voiceoverLanguageSelector = '.e2e-test-voiceover-language-selector';
const voiceoverLanguageOptionSelector = '.e2e-test-language-selector-option';
const voiceoverLanguageAccentSelector =
  '.e2e-test-voiceover-language-accent-selector';
const voiceoverLanguageAccentOptionSelector =
  '.e2e-test-language-accent-selector-option';

const translationModeButton = 'button.e2e-test-translation-mode';
const editTranslationSelector = 'div.e2e-test-edit-translation';
const stateTranslationEditorSelector =
  'div.e2e-test-state-translation-editor schema-based-editor';
const saveTranslationButton = 'button.e2e-test-save-translation';

const stateSolutionTab = '.e2e-test-oppia-solution-tab';
const editStateSolutionExplanationSelector =
  '.e2e-test-edit-solution-explanation';
const saveSolutionEditButton = 'button.e2e-test-save-solution-explanation-edit';

const stateHintTab = '.e2e-test-hint-tab';
const editStateHintSelector = '.e2e-test-open-hint-editor';
const saveHintEditButton = 'button.e2e-test-save-hint-edit';

const misconceptionDiv = '.misconception-list-item';
const misconceptionTitle = '.e2e-test-misconception-title';
const optionalMisconceptionDiv = '.optional-misconception-list-item';
const inapplicableMisconceptionDiv = '.optional-misconception-list-no-action';
const optionalMisconceptionOptionsButton =
  '.optional-misconception-options-button';
const misconceptionApplicableToggle =
  '.e2e-test-misconception-applicable-toggle';
const responseGroupDiv = '.e2e-test-response-tab';
const misconceptionEditorTab = '.e2e-test-open-misconception-editor';
const toggleResponseTab = '.e2e-test-response-tab-toggle';

const modalSaveButton = '.e2e-test-save-button';
const modifyTranslationsModalDoneButton =
  '.e2e-test-modify-translations-done-button';

const mobileSettingsBarSelector = 'li.e2e-test-mobile-settings-button';
const mobileChangesDropdownSelector = 'div.e2e-test-mobile-changes-dropdown';
const mobileSaveChangesButtonSelector =
  'button.e2e-test-save-changes-for-small-screens';
const mobilePublishButtonSelector = 'button.e2e-test-mobile-publish-button';
const mobileDiscardButtonSelector =
  'button.e2e-test-mobile-exploration-discard-tab';
const mobileStateGraphResizeButton = '.e2e-test-mobile-graph-resize-button';
const mobileNavbarDropdown = 'div.e2e-test-mobile-options-dropdown';
const mobileNavbarPane = '.oppia-exploration-editor-tabs-dropdown';
const mobileNavbarOptions = '.navbar-mobile-options';
const mobileOptionsButtonSelector = 'i.e2e-test-mobile-options';
const basicSettingsDropdown = 'h3.e2e-test-settings-container';
const feedbackSettingsDropdown = 'h3.e2e-test-feedback-settings-container';
const permissionSettingsDropdown = 'h3.e2e-test-permission-settings-container';
const voiceArtistSettingsDropdown =
  'h3.e2e-test-voice-artists-settings-container';
const rolesSettingsDropdown = 'h3.e2e-test-roles-settings-container';
const advanceSettingsDropdown = 'h3.e2e-test-advanced-settings-container';
const explorationControlsSettingsDropdown =
  'h3.e2e-test-controls-bar-settings-container';
const settingsContainerSelector =
  '.oppia-editor-card.oppia-settings-card-container';
const deleteButtonSelector = 'button.oppia-delete-button';

const nextCardButton = '.e2e-test-next-card-button';
const nextCardArrowButton = '.e2e-test-next-button';
const submitAnswerButton = '.e2e-test-submit-answer-button';
const previewRestartButton = '.e2e-test-preview-restart-button';
const stateConversationContent = '.e2e-test-conversation-content';
const explorationCompletionToastMessage = '.e2e-test-lesson-completion-message';

const subscriberCountLabel = '.e2e-test-oppia-total-subscribers';
const subscriberTabButton = '.e2e-test-subscription-tab';
const subscriberCard = '.e2e-test-subscription-card';
const feedbackPopupSelector = '.e2e-test-exploration-feedback-popup-link';
const feedbackTextarea = '.e2e-test-exploration-feedback-textarea';
const destinationSelectorDropdown = '.e2e-test-destination-selector-dropdown';
const destinationWhenStuckSelectorDropdown =
  '.e2e-test-destination-when-stuck-selector-dropdown';
const addDestinationStateWhenStuckInput = '.protractor-test-add-state-input';
const outcomeDestWhenStuckSelector =
  '.protractor-test-open-outcome-dest-if-stuck-editor';
const intEditorField = '.e2e-test-editor-int';
const setAsCheckpointButton = '.e2e-test-checkpoint-selection-checkbox';
const tagsField = '.e2e-test-chip-list-tags';
const saveUploadedAudioButton = '.e2e-test-save-uploaded-audio-button';
const feedBackButtonTab = '.e2e-test-feedback-tab';
const mobileFeedbackTabButton = '.e2e-test-mobile-feedback-button';
const explorationSummaryTileTitleSelector = '.e2e-test-exp-summary-tile-title';
const feedbackSubjectSelector = '.e2e-test-exploration-feedback-subject';
const feedbackSelector = '.e2e-test-exploration-feedback';
const stayAnonymousCheckbox = '.e2e-test-stay-anonymous-checkbox';
const responseTextareaSelector = '.e2e-test-feedback-response-textarea';
const sendButtonSelector = '.e2e-test-oppia-feedback-response-send-btn';
const errorSavingExplorationModal = '.e2e-test-discard-lost-changes-button';
const historyTabButton = '.e2e-test-history-tab';
const historyListContent = '.e2e-test-history-list-item';
const mobileHistoryTabButton = '.e2e-test-mobile-history-button';
const totalPlaysSelector = '.e2e-test-oppia-total-plays';
const numberOfOpenFeedbacksSelector = '.e2e-test-oppia-open-feedback';
const avarageRatingSelector = '.e2e-test-oppia-average-rating';
const usersCountInRatingSelector = '.e2e-test-oppia-total-users';
const explorationFeedbackCardActiveSelector =
  '.e2e-test-exploration-feedback-card-active';
const explorationFeedbackTabContentSelector =
  '.e2e-test-exploration-feedback-card';

const editRolesButtonSelector = '.oppia-edit-roles-btn-container';
const stateContentEditorSelector =
  '.e2e-test-edit-content.oppia-editable-section';
const tagFilterDropdownSelector = '.e2e-test-tag-filter-selection-dropdown';
const languageDropdownValueSelector =
  'mat-select.e2e-test-exploration-language-select .mat-select-value';

const mainTabContainerSelector = '.e2e-test-exploration-main-tab';
const historyTabContentContainerSelector = '.e2e-test-exploration-history-tab';
const historyTableIndex = '.history-table-index';
const historyListOptions = '.e2e-test-history-list-options';
const downloadExplorationButton =
  'a.dropdown-item.e2e-test-download-exploration';
const feedbackTabBackButtonSelector = '.e2e-test-oppia-feedback-back-button';
const feedbackStatusMenu = '.e2e-test-oppia-feedback-status-menu';
const feedbackTabRowSelector = '.e2e-test-oppia-feedback-tab-row';
const feedbackStatusSelector = '.e2e-test-exploration-feedback-status';
const feedbackAuthorSelector = '.e2e-test-exploration-feedback-author';

const downloadPath = testConstants.TEST_DOWNLOAD_DIR;
const addManualVoiceoverButton = '.e2e-test-voiceover-upload-audio';
const regenerateAutomaticVoiceoverButton = '.e2e-test-regenerate-voiceover';
const voiceoverConfirmationModalButton =
  '.e2e-test-voiceover-regeneration-confirm';

const saveDestinationButtonSelector = '.e2e-test-save-outcome-dest';
const saveStuckDestinationButtonSelector = '.e2e-test-save-stuck-destination';
const descriptionBoxSelector = 'textarea.e2e-test-description-box';
const textInputSelector = 'input.e2e-test-text-input';
const closeButtonForExtraModel = '.e2e-test-close-rich-text-component-editor';

const skillItemInRTESelector = '.e2e-test-rte-skill-selector-item';
const translationTabContainer = '.e2e-test-translation-tab-container';

const previousCardButton = '.e2e-test-back-button';
const openExplorationEditorNavigationMobile =
  '.oppia-exploration-editor-tabs-dropdown.show';
const skillNameInput = '.e2e-test-skill-name-input';

const openNavbarIconSelector = '.mobile-navbar-toggled';
const stateChangesDropdownSelector = '.e2e-test-state-changes-dropdown';

const oppiaYouTubeVideoUrl = 'https://www.youtube.com/watch?v=0tRc75S9MFU';
const oppiaWebURL = 'https://www.oppia.org';
const rteHelperModalSelector = 'oppia-rte-helper-modal';

// Common Selectors.

const addListEntryButtonSelector = '.e2e-test-add-list-entry';

// Editor Tab Selectors.
const addResponseModalHeaderSelector = '.e2e-test-add-response-modal-header';
const algebricExpressionEditorSelector = '.e2e-test-guppy-div';

const codeEditorStringEditorSelector = 'code-string-editor';
const contentBoxSelector =
  '.e2e-test-state-editor .e2e-test-state-content-display';
const currentHintSummarySelector =
  '.e2e-test-current-hint-box .e2e-test-response-summary';
const currentOutcomeDestinationSelector = '.e2e-test-current-outcome-dest';
const currentSolutionSummarySelector =
  '.e2e-test-oppia-solution-tab .e2e-test-response-summary';
const customizeInteractionBodySelector = '.e2e-test-customize-interaction-body';
const customizeInteractionHeaderSelector =
  '.e2e-test-customize-interaction-header';

const editCardContentButtonSelector = '.e2e-test-edit-content-pencil-button';
const editOutcomeDestPencilButtonSelector =
  '.e2e-test-edit-outcome-dest-pencil-button';
const interactionPreviewCardSelector = '.e2e-test-interaction-preview';
const mathEquationEditorSelector = '.e2e-test-guppy-div';
const numberWithUnitEditorSelector = 'number-with-units-editor';
const numericExpressionEditorSelector = '.e2e-test-guppy-div';
const outcomeFeedbackSelector = '.e2e-test-edit-outcome-feedback-button';
const removeInteractionButttonSelector = '.e2e-test-delete-interaction';
const responseModalBodySelector = '.e2e-test-response-modal-body';
const ruleEditorInResponseModalSeclector = 'oppia-rule-editor';
const creatorDashboardContainerSelector =
  '.e2e-test-creator-dashboard-container';
const commonMathExpressionInputField = '.e2e-test-guppy-div';

const dragAndDropItemSelector = '.e2e-test-drag-and-drop-sort-item';
const solutionModal = 'oppia-add-or-update-solution-modal';
const codeEditorInSolutionModal = '.CodeMirror-scroll .CodeMirror-lines';

const deleteExplorationButton = '.e2e-test-delete-exploration-button';
const confirmExplorationDeletetionButton =
  '.e2e-test-really-delete-exploration-button';

const historyUserFilterSelector = 'oppia-history-tab input';
const historyListItemSelector = '.e2e-test-history-list-item';
const historyPaginationDesktopSelector =
  '.e2e-test-desktop-history-pagination mat-select';
const historyPaginationMobileSelector =
  '.e2e-test-mobile-history-pagination mat-select';
const versionComparasionSelect = '.e2e-test-version-comparasion-select';
const graphDifferencesSelector = '.e2e-test-graph-diff-container';
const resetGraphButton = '.e2e-test-reset-graph';

const startNewFeedbackButtonSelector = '.e2e-test-start-new-thread-button';
const newFeedbackThreadModalSelector = 'oppia-create-feedback-thread-modal';
const feedbackSubjectSelectorInNewFeedbackModal = `${newFeedbackThreadModalSelector} input`;
const feedbackSelectorInNewFeedbackModal = `${newFeedbackThreadModalSelector} textarea`;
const createThreadButtonSelector = '.e2e-test-create-new-feedback-btn';

const explorationStateGraphModalSelector =
  '.e2e-test-exploration-state-graph-modal';
const closeModalButtonSelector = '.e2e-test-modal-close-button';

const feedbackResponseRemoveSelector = '.e2e-test-close-help-card-button';

// Editor Tab > Navigation Bar.
const helpTabSelector = '.e2e-test-help-button';

// Editor Tab > Help Modal.
const helpModalContainerSelector = '.e2e-test-help-modal-container';
const helpModalHeaderSelector = '.e2e-test-help-modal-header';
const helpPageLinkSelector = '.e2e-test-help-page-link';
const takeATourButtonSelector = '.e2e-test-tour-button';
const translationTourButtonSelector = '.e2e-test-translation-tour-button';

// Joyride (Exploration Editor Tour).
const joyrideBodySelector = '.joyride-step__body';
const joyrideTitleSelector = '.e2e-test-joyride-title';
const nextButtonSelector = '.joyride-step__next-container .joyride-button';
const previousButtonSelector = '.joyride-step__prev-container .joyride-button';
const joyrideDoneButtonSelector = '.joyride-step__done-button .joyride-button';
const joyrideStepSelector = '.joyride-step__counter';

// Save Exploration Modal.
const saveExplorationModalContainerSelector =
  '.e2e-test-save-exploration-modal-container';
const saveDraftTitleSelector = '.e2e-test-save-draft-heading';

// Publish Exploration (Metadata) Modal.
const publishMetadataExplorationHeaderSelector =
  '.e2e-test-metadata-modal-header';

// Multiple Choice Interaction Selectors.
const multipleChoiceOptionSelector = '.e2e-test-multiple-choice-option';

const textAreaInputSelector = 'textarea.e2e-test-description-box';

// Image Interaction Selectors.
const imageContainerSelector = '.oppia-image-click-img';

// Common Selectors.
const commonModalTitleSelector = '.e2e-test-modal-header';
const commonModalBodySelector = '.e2e-test-modal-body';
const previousConversationToggleSelector = '.e2e-test-previous-responses-text';

const lessonInfoCardSelector = '.e2e-test-lesson-info-card';
const formErrorContainer = '.e2e-test-form-error-container';
const numberWithUnitsModalSelector =
  '.e2e-test-number-with-units-help-modal-header';
const firstCardSettingsSelector = '.e2e-test-initial-state-select';
const progressUIDSelector = '.e2e-test-progress-id';
const customSelectedCharctersSelector = '.e2e-test-custom-letters';
const showUnitFormatsButtonSelector = '.e2e-test-show-unit-formats';
const codeOutputSelector = '.e2e-test-code-output';
const graphContainerSelector = '.e2e-test-graph-input-viz-container';
const nodeWarningSignSelector = '.e2e-test-node-warning-sign';
const navigationDropdownInMobileVisibleSelector =
  '.oppia-exploration-editor-tabs-dropdown.show';
const selfLoopWarningSelector = '.e2e-test-response-self-loop-warning';
const goalWarningSelector = '.e2e-test-exploration-objective-warning';

const revertVersionButtonSelector = '.e2e-test-revert-version';
const confirmRevertButtonSelector = '.e2e-test-confirm-revert';
const dropdownMenuShown = '.dropdown-menu.show';
const interactionPreviewSelector = '.e2e-test-interaction';
const historyItemIndexSelector = '.e2e-test-history-table-index';
const historyItemOptionSelector = '.e2e-test-history-table-option';
const confirmDeleteInteractionButtonSelector =
  '.e2e-test-confirm-delete-interaction';
const selectedInteractionNameSelector = '.e2e-test-selected-interaction-name';

export enum INTERACTION_TYPES {
  ALGEBRAIC_EXPRESSION = 'Algebric Expression Input',
  CODE_EDITOR = 'Code Editor',
  CONTINUE_BUTTON = 'Continue Button',
  DRAG_AND_DROP_SORT = 'Drag And Drop Sort',
  END_EXPLORATION = 'End Exploration',
  FRACTION_INPUT = 'Fraction Input',
  GRAPH_THEORY = 'Graph Theory',
  ITEM_SELECTION = 'Item Selection',
  MATH_EQUATION = 'Math Equation Input',
  MULTIPLE_CHOICE = 'Multiple Choice',
  MUSIC_NOTES_INPUT = 'Music Notes Input',
  NUMBER_INPUT = 'Number Input',
  NUMBER_WITH_UNITS = 'Number With Units',
  NUMERIC_EXPRESSION = 'Numeric Expression Input',
  PENCIL_CODE_EDITOR = 'Pencil Code Editor',
  RATIO_EXPRESSION_INPUT = 'Ratio Expression Input',
  SET_INPUT = 'Set Input',
  TEXT_INPUT = 'Text Input',
  WORLD_MAP = 'World Map',
  NUMERIC_INPUT = 'Number Input',
}

const INTERACTION_SELECTORS: Record<string, string> = {
  [INTERACTION_TYPES.DRAG_AND_DROP_SORT]:
    '.e2e-test-interaction-tile-DragAndDropSortInput',
  [INTERACTION_TYPES.SET_INPUT]: '.e2e-test-interaction-tile-SetInput',
  [INTERACTION_TYPES.NUMERIC_EXPRESSION]:
    '.e2e-test-interaction-tile-NumericExpressionInput',
  [INTERACTION_TYPES.ALGEBRAIC_EXPRESSION]:
    '.e2e-test-interaction-tile-AlgebraicExpressionInput',
  [INTERACTION_TYPES.MATH_EQUATION]:
    '.e2e-test-interaction-tile-MathEquationInput',
  [INTERACTION_TYPES.NUMBER_WITH_UNITS]:
    '.e2e-test-interaction-tile-NumberWithUnits',
  [INTERACTION_TYPES.RATIO_EXPRESSION_INPUT]:
    '.e2e-test-interaction-tile-RatioExpressionInput',
  [INTERACTION_TYPES.WORLD_MAP]: '.e2e-test-interaction-tile-InteractiveMap',
  [INTERACTION_TYPES.MUSIC_NOTES_INPUT]:
    '.e2e-test-interaction-tile-MusicNotesInput',
} as const;

enum INTERACTION_TABS {
  PROGRAMMING = 'PROGRAMMING',
  MATHS = 'MATHS',
  MUSIC = 'MUSIC',
  GEOGRAPHY = 'GEOGRAPHY',
}

const INTERACTION_TABS_SELECTORS: Record<string, string> = {
  [INTERACTION_TABS.PROGRAMMING]: '.e2e-test-interaction-tab-programming',
  [INTERACTION_TABS.MATHS]: '.e2e-test-interaction-tab-math',
  [INTERACTION_TABS.GEOGRAPHY]: '.e2e-test-interaction-tab-geography',
  [INTERACTION_TABS.MUSIC]: '.e2e-test-interaction-tab-music',
};

export const INTERACTION_TABS_OF_INTERACTION_TYPE: Record<string, string> = {
  [INTERACTION_TYPES.CODE_EDITOR]: INTERACTION_TABS.PROGRAMMING,
  [INTERACTION_TYPES.FRACTION_INPUT]: INTERACTION_TABS.MATHS,
} as const;

interface TabContent {
  title: string;
  content: string;
}

const UNPUBLISHED_EXPLORATION_ZIP_FILE_PREFIX =
  'oppia-unpublished_exploration-v';
const PUBLISHED_EXPLORATION_ZIP_FILE_PREFIX =
  'oppia-Publishwithaninteraction-v';
export class ExplorationEditor extends BaseUser {
  /**
   * Checks if the interaction name is as expected.
   * @param name The name of the interaction.
   */
  async expectSelectedInteractionNameToBe(name: string): Promise<void> {
    await this.expectTextContentToBe(
      selectedInteractionNameSelector,
      `Interaction ( ${name} )`
    );
  }
  /**
   * Remove feedback response in preview tab.
   */
  async removeFeedbackResponseInPreviewTab(): Promise<void> {
    await this.expectElementToBeVisible(feedbackResponseRemoveSelector);
    // Wait for the response modal animation to finish, else it causes flakiness.
    await this.page.waitForTimeout(2000);
    await this.clickOn(feedbackResponseRemoveSelector);
    await this.expectElementToBeVisible(feedbackResponseRemoveSelector, false);
  }

  /**
   * Click on the submit answer button.
   * @param skipVerification - If true, skips verification that the button is visible.
   */
  async clickOnSubmitAnswerButton(): Promise<void> {
    const feedbackSelector = '.e2e-test-conversation-feedback-latest';

    await this.expectElementToBeClickable(submitAnswerButton);

    // Get current status of old and latest responses to use it later.
    // Handle cases where elements might not exist.
    const initialPreviousResponses = await this.page
      .$eval(
        previousConversationToggleSelector,
        element => element?.textContent?.trim() || null
      )
      .catch(() => null);

    const initialLatestResponse = await this.page
      .$eval(feedbackSelector, element => element?.textContent?.trim() || null)
      .catch(() => null);

    // Wait for 1s to ensure the selected answer is updated in Angular component.
    await this.page.waitForTimeout(1000);
    // Click on Submit Answer button.
    await this.clickOn(submitAnswerButton);

    // Wait for either element to change content.
    await this.page.waitForFunction(
      (
        submitButtonSelector: string,
        formErrorContainer: string,
        selector1: string,
        value1: string | null,
        selector2: string,
        value2: string | null
      ) => {
        const submitButton = document.querySelector(submitButtonSelector);
        const element1 = document.querySelector(selector1);
        const element2 = document.querySelector(selector2);

        const currentValue1 = element1?.textContent?.trim() || null;
        const currentValue2 = element2?.textContent?.trim() || null;

        // Return true if either: submit button is disabled, or if number of
        // previous responses has increased, or if there was no previous
        // response and we got the first response.
        return (
          (submitButton as HTMLButtonElement)?.disabled ||
          document.querySelector(formErrorContainer)?.textContent?.trim() !==
            null ||
          currentValue1 !== value1 ||
          currentValue2 !== value2
        );
      },
      {timeout: 10000},
      submitAnswerButton,
      formErrorContainer,
      previousConversationToggleSelector,
      initialPreviousResponses,
      feedbackSelector,
      initialLatestResponse
    );
  }

  async clickOnImageInInteractionPreviewCard(): Promise<void> {
    await this.expectElementToBeVisible(imageContainerSelector);
    await this.page.click(imageContainerSelector);
  }

  /**
   * Selects a multiple choice option.
   * @param {string} option - The option to select.
   */
  async selectMultipleChoiceOption(option: string): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible(multipleChoiceOptionSelector);

    const options = await this.page.$$(multipleChoiceOptionSelector);
    let found = false;
    for (const optionElement of options) {
      const optionText = await optionElement.evaluate(el =>
        el.textContent?.trim()
      );
      if (optionText === option) {
        await optionElement.click();
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Option ${option} not found.`);
    }
    await this.page.waitForNetworkIdle({idleTime: 1000});
    await this.clickOnSubmitAnswerButton();
  }

  /**
   * Selects multiple options from the item selection input.
   * @param options The options to select.
   */
  async selectItemSelectionOptions(options: string[]): Promise<void> {
    const optionElementSelector = '.e2e-test-item-selection-input-item';

    await this.expectElementToBeVisible(optionElementSelector);
    const optionElements = await this.page.$$(optionElementSelector);

    for (const optionElement of optionElements) {
      const optionText = await optionElement.evaluate(el =>
        el.textContent?.trim()
      );
      if (!optionText) {
        continue;
      }
      if (options.includes(optionText)) {
        await optionElement.click();

        const inputElement = await optionElement.$('input');
        await this.page.waitForFunction(
          (element: HTMLInputElement) => {
            return element.checked;
          },
          {},
          inputElement
        );
      }
    }
  }

  /**
   * Selects the image answer by clicking on the point (xInPercent, yInPercent).
   * @param xInPercent x coordinate of the point in percent.
   * @param yInPercent y coordinate of the point in percent.
   */
  async selectImageAnswer(
    xInPercent: number,
    yInPercent: number
  ): Promise<void> {
    // Scroll page fully so image is fully covered in mobile view.
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    const imageInteraction = new ImageAreaSelection(this.page);
    await imageInteraction.selectPoint(xInPercent, yInPercent);
  }

  /**
   * Clicks on the delete exploration button.
   */
  async clickOnDeleteExplorationButton(): Promise<void> {
    await this.page.waitForSelector(deleteExplorationButton, {
      visible: true,
    });
    await this.clickOn(deleteExplorationButton);
    await this.expectElementToBeVisible(confirmExplorationDeletetionButton);
  }

  /**
   * Confirm the delete exploration button.
   */
  async confirmDeleteExplorationButton(): Promise<void> {
    await this.page.waitForSelector(confirmExplorationDeletetionButton, {
      visible: true,
    });
    await this.clickOn(confirmExplorationDeletetionButton);
    await this.page.waitForSelector(confirmExplorationDeletetionButton, {
      visible: false,
    });
  }

  /**
   * Searches for a user in the history tab.
   * @param username The username to be searched.
   */
  async searchUserInHistoryTab(username: string): Promise<void> {
    await this.expectElementToBeVisible(historyUserFilterSelector);

    await this.clearAllTextFrom(historyUserFilterSelector);
    await this.type(historyUserFilterSelector, username);

    await this.page.keyboard.press('Enter');
  }

  /**
   * Changes the pagination in the history tab to the specified number of pages.
   * @param numberOfPages The number of pages to change the pagination to.
   */
  async changePaginationInHistoryTabTo(numberOfPages: number): Promise<void> {
    const selector = this.isViewportAtMobileWidth()
      ? historyPaginationMobileSelector
      : historyPaginationDesktopSelector;
    await this.page.waitForSelector(selector);

    await this.clickOn(selector);

    await this.page.waitForSelector('mat-option');
    const optionsElements = await this.page.$$('mat-option');
    const optionValues = await this.page.$$eval('mat-option', elements =>
      elements.map(element => element.textContent?.trim())
    );

    const index = optionValues.indexOf(numberOfPages.toString());

    if (index === -1) {
      throw new Error(`Could not find option with value ${numberOfPages}`);
    }

    await optionsElements[index].click();

    await this.page.waitForSelector('mat-option', {
      visible: false,
    });
    expect(await this.page.$eval(selector, el => el.textContent)).toContain(
      numberOfPages.toString()
    );
  }

  /**
   * Expects the number of history items to be the specified number.
   * @param numberOfItems The expected number of history items.
   */
  async expectNumberOfHistoryItemsToBe(numberOfItems: number): Promise<void> {
    if (numberOfItems === 0) {
      await this.expectElementToBeVisible(historyListItemSelector, false);
      return;
    }
    await this.expectElementToBeVisible(historyListItemSelector);
    const historyItems = await this.page.$$(historyListItemSelector);
    expect(historyItems.length).toBe(numberOfItems);
  }

  /**
   * Compares the versions of the exploration in the history tab.
   * @param version1 The first version.
   * @param version2 The second version.
   */
  async compareExplorationVersionsInHistoryTab(
    version1: string,
    version2: string
  ): Promise<void> {
    await this.page.waitForSelector(versionComparasionSelect);

    const versionSelectElements = await this.page.$$(versionComparasionSelect);

    await versionSelectElements[0].hover();
    await versionSelectElements[0].click();
    await this.selectMatOption(version1);

    await versionSelectElements[0].hover();
    await versionSelectElements[1].click();
    await this.selectMatOption(version2);

    expect(await versionSelectElements[0].evaluate(el => el.textContent)).toBe(
      version1
    );
    expect(await versionSelectElements[1].evaluate(el => el.textContent)).toBe(
      version2
    );
  }

  async startAFeedbackThread(subject: string, feedback: string): Promise<void> {
    await this.page.waitForSelector(startNewFeedbackButtonSelector, {
      visible: true,
    });
    await this.clickOn(startNewFeedbackButtonSelector);

    await this.isTextPresentOnPage('Start New Feedback Thread');

    await this.page.waitForSelector(newFeedbackThreadModalSelector);
    await this.type(feedbackSubjectSelectorInNewFeedbackModal, subject);
    await this.type(feedbackSelectorInNewFeedbackModal, feedback);

    expect(
      await this.page.$eval(
        feedbackSubjectSelectorInNewFeedbackModal,
        el => (el as HTMLInputElement).value
      )
    ).toBe(subject);
    expect(
      await this.page.$eval(
        feedbackSelectorInNewFeedbackModal,
        el => (el as HTMLTextAreaElement).value
      )
    ).toBe(feedback);

    await this.clickOn(createThreadButtonSelector);
    await this.page.waitForSelector(newFeedbackThreadModalSelector, {
      visible: false,
    });
  }

  /**
   * Function to verify if the feedback thread is present
   * @param {string} feedbackSubject - The feedback subject to be verified
   */
  async expectFeedbackThreadToBePresent(
    feedbackSubject: string
  ): Promise<void> {
    await this.page.waitForSelector(feedbackSubjectSelector);

    expect(
      await this.page.$$eval(feedbackSubjectSelector, subjects =>
        subjects.map(subject => subject.textContent)
      )
    ).toContain(feedbackSubject);
  }

  /**
   * Expects the graph differences to be visible or not.
   * @param visible Whether the graph differences should be visible or not.
   */
  async expectGraphDifferencesToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(graphDifferencesSelector, visible);
  }

  /**
   * Resets the graph differences in the history tab.
   */
  async resetGraphDifferenceInHistoryTab(): Promise<void> {
    await this.clickOn(resetGraphButton);

    await this.expectGraphDifferencesToBeVisible(false);
  }

  /**
   * Adds the response details in the response modal.
   * @param feedback The feedback to be added in the response modal.
   * @param destination The destination to be added in the response modal.
   * @param responseIsCorrect The response is correct or not.
   * @param isLastResponse Whether the response is the last response or not.
   */
  async addResponseDetailsInResponseModal(
    feedback: string,
    destination?: string,
    responseIsCorrect?: boolean,
    isLastResponse: boolean = true
  ): Promise<void> {
    await this.waitForElementToStabilize(feedbackEditorSelector);
    await this.clickOn(feedbackEditorSelector);
    await this.type(stateContentInputField, feedback);
    await this.expectTextContentToBe(stateContentInputField, feedback);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    if (destination) {
      await this.select(destinationCardSelector, '/');
      await this.type(addStateInput, destination);
    }
    if (responseIsCorrect) {
      await this.clickOn(correctAnswerInTheGroupSelector);
    }
    if (isLastResponse) {
      await this.page.waitForSelector(addNewResponseButton, {
        visible: true,
      });
      await this.clickOn(addNewResponseButton);
      await this.page
        .waitForSelector(responseModalHeaderSelector, {
          hidden: true,
        })
        .catch(async () => {
          await this.clickOn(addNewResponseButton);
        });
    } else {
      await this.clickOn(addAnotherResponseButton);
      // The waitForNetworkIdle method waits for the response
      // to the "Save Draft" request from change-list.service.ts
      // to get executed, the Add Response modal to fully appear
      // and all the fields in it to become clickable before
      // moving on to next steps.
      await this.waitForNetworkIdle();
    }
  }

  /**
   * Submits the world map answer.
   * @param zoomLevel The zoom level to increase the map to.
   */
  async submitWorldMapAnswer(zoomLevel: number): Promise<void> {
    const zoomIncreaseSelctor = '.leaflet-control-zoom-in';
    const interactiveMap = 'oppia-interactive-interactive-map';

    for (let i = 0; i < zoomLevel; i++) {
      await this.expectElementToBeVisible(zoomIncreaseSelctor);
      await this.clickOn(zoomIncreaseSelctor);
      await this.page.waitForTimeout(1000);
    }

    await this.expectElementToBeVisible(interactiveMap);
    await this.page.waitForFunction(
      (sel: string) => {
        const element = document.querySelector(sel);
        return element && element.getBoundingClientRect().width > 0;
      },
      {},
      interactiveMap
    );
    await this.page.click(interactiveMap);

    await this.clickOnSubmitAnswerButton();
  }

  /**
   * Function to add responses to the interactions.
   * Currently, it only handles 'Number Input', 'Multiple Choice', 'Number Input', and 'Text Input' interaction types.
   * @param {string} interactionType - The type of the interaction.
   * @param {string} answer - The response to be added.
   * @param {string} feedback - The feedback for the response.
   * @param {string} destination - The destination state for the response.
   * @param {boolean} responseIsCorrect - Whether the response is marked as correct.
   * @param {boolean} isLastResponse - Whether the response is last and more aren't going to be added.
   */
  async addResponsesToTheInteraction(
    interactionType: string,
    answer: string,
    feedback: string,
    destination?: string,
    responseIsCorrect?: boolean,
    isLastResponse: boolean = true
  ): Promise<void> {
    await this.updateAnswersInResponseModal(
      interactionType as INTERACTION_TYPES,
      answer
    );

    await this.addResponseDetailsInResponseModal(
      feedback,
      destination,
      responseIsCorrect,
      isLastResponse
    );
  }

  /**
   * Customizes the drag and drop sort interaction.
   * @param {string[]} options - The options to be selected.
   */
  async customizeDragAndDropSortInteraction(options: string[]): Promise<void> {
    for (let i = 0; i < options.length - 1; i++) {
      await this.page.waitForSelector(addResponseOptionButton, {visible: true});
      await this.clickOn(addResponseOptionButton);
    }

    const responseInputs = await this.page.$$(stateContentInputField);
    for (let i = 0; i < options.length; i++) {
      await responseInputs[i].type(`${options[i]}`);
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
  }

  /**
   * Customizes the Fraction Input Interaction.
   * @param simplestForm - Whether the Fraction Input Interaction should be
   * customized to be a simplest form.
   * @param improperFraction - Whether the Fraction Input Interaction should be
   * customized to be an improper fraction.
   * @param integerPart - Wheather the Fraction Input Interaction should have
   * an integer part.
   * @param placeholder - The placeholder of the Fraction Input Interaction.
   */
  async customizeFractionInputInteraction(
    simplestForm: boolean,
    improperFraction: boolean,
    integerPart: boolean,
    placeholder?: string
  ): Promise<void> {
    await this.expectElementToBeVisible(customizeInteractionBodySelector);
    await this.page.waitForFunction(
      (selector: string) => {
        const element = document.querySelector(selector);
        return element?.querySelectorAll('input').length === 4;
      },
      {},
      customizeInteractionBodySelector
    );

    const inputFields = await this.page.$$(
      `${customizeInteractionBodySelector} input`
    );

    // Simplest Form.
    if (simplestForm) {
      await inputFields[0].click();
      await this.page.waitForFunction(
        (element: Element) => {
          return (element as HTMLInputElement).checked;
        },
        {},
        inputFields[0]
      );
    }

    // Improper Fractions.
    if (improperFraction) {
      await inputFields[1].click();
      await this.page.waitForFunction(
        (element: Element) => {
          return (element as HTMLInputElement).checked;
        },
        {},
        inputFields[1]
      );
    }

    // Integer Part.
    if (integerPart) {
      await inputFields[2].click();
      await this.page.waitForFunction(
        (element: Element) => {
          return (element as HTMLInputElement).checked;
        },
        {},
        inputFields[2]
      );
    }

    // Placeholder Text.
    if (placeholder) {
      await inputFields[3].click();
      await inputFields[3].type(placeholder);
      await this.page.waitForFunction(
        (element: Element, value: string) => {
          return (element as HTMLInputElement).value === value;
        },
        {},
        inputFields[3],
        placeholder
      );
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
  }

  async customizeEndExplorationInteraction(
    explorationIds: string[]
  ): Promise<void> {
    if (explorationIds.length > 3) {
      throw new Error(
        'The maximum number of explorations that can be selected is 3.'
      );
    }

    await this.expectElementToBeVisible(customizeInteractionBodySelector);
    const customizeInteractionBodyElement = await this.page.$(
      customizeInteractionBodySelector
    );

    for (const explorationId of explorationIds) {
      await this.expectElementToBeVisible(addListEntryButtonSelector);
      await this.page.click(addListEntryButtonSelector);

      const textInputFields =
        await customizeInteractionBodyElement?.$$(textInputField);

      if (!textInputFields || textInputFields.length === 0) {
        throw new Error('No text input fields found');
      }

      const lastTextInputField = textInputFields[textInputFields.length - 1];
      await lastTextInputField.type(explorationId);

      await this.page.waitForFunction(
        (element: HTMLInputElement, value: string) => {
          return element.value.trim() === value.trim();
        },
        {},
        lastTextInputField,
        explorationId
      );
    }

    await this.expectElementToBeClickable(saveInteractionButton);
    await this.page.click(saveInteractionButton);

    await this.expectElementToBeVisible(saveInteractionButton, false);
  }

  /**
   * Customizes the graph theory interaction.
   */
  async customizeGraphTheoryInteraction(): Promise<void> {
    const graphViz = new GraphViz(this.page);

    await graphViz.clearGraph();
    await graphViz.addFourVerticesInCenter();

    const customizeInteractionModal = await this.getElementInParent(
      customizeInteractionBodySelector
    );

    const inputElements = await customizeInteractionModal.$$('input');
    for (let i = 0; i < 2; i++) {
      const inputElement = inputElements[i];
      const checked = await inputElement.evaluate(
        el => (el as HTMLInputElement).checked
      );
      if (!checked) {
        await inputElement.click();
        await this.page.waitForFunction(
          (element: Element) => {
            return (element as HTMLInputElement).checked;
          },
          {},
          inputElement
        );
      }
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Customized graph theory interaction with four vertices.');
  }

  /**
   * Customizes the set input interaction.
   * @param customLabel The custom label to set.
   */
  async customizeSetInputInteraction(customLabel: string): Promise<void> {
    await this.expectElementToBeVisible(
      `${customizeInteractionBodySelector} input`
    );
    await this.type(`${customizeInteractionBodySelector} input`, customLabel);

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Customized set input interaction with four vertices.');
  }

  /**
   * Waits for interaction customization box and returns it.
   * @returns {Promise<ElementHandle<Element>>} Promise that resolves to the
   *     element handle of the interaction customization box.
   */
  async getInteractionCustomizationBox(): Promise<ElementHandle<Element>> {
    await this.expectElementToBeVisible(customizeInteractionBodySelector);
    const customizationBox = await this.page.$(
      customizeInteractionBodySelector
    );

    if (!customizationBox) {
      throw new Error(
        'Could not find the customization box for the interaction.'
      );
    }

    return customizationBox;
  }

  /**
   * Customizes the Music Notes interaction.
   * @param correctSquenceOfNotes The correct sequence of notes.
   * @param startingNotes The starting notes.
   */
  async customizeMusicNotesInteraction(
    correctSquenceOfNotes: string[],
    startingNotes: string[]
  ): Promise<void> {
    const customizationBox = await this.getInteractionCustomizationBox();
    const addListItemButtons = await customizationBox.$$(
      addResponseOptionButton
    );

    for (let i = 0; i < correctSquenceOfNotes.length; i++) {
      await addListItemButtons[0].click();
    }
    for (let i = 0; i < startingNotes.length; i++) {
      await addListItemButtons[1].click();
    }

    const combinedNotes = correctSquenceOfNotes.concat(startingNotes);
    const selectFields = await customizationBox.$$('select');
    for (let i = 0; i < combinedNotes.length; i++) {
      selectFields[i].select(combinedNotes[i]);
    }

    // Save.
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Customized Music Notes successfully.');
  }

  /**
   * Customizes the code editor interaction.
   * @param initalCode The initial code of the code editor.
   * @param codeToPrepend The code to prepend to the code editor.
   * @param codeToAppend The code to append to the code editor.
   */
  async customizeCodeEditorInteraction(
    initalCode: string,
    codeToPrepend?: string,
    codeToAppend?: string
  ): Promise<void> {
    const selector = '.CodeMirror-scroll';
    const customizationBox = await this.getInteractionCustomizationBox();

    const codeInputs = await customizationBox.$$(selector);

    // Initial Code.
    await codeInputs[0].click();
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.keyboard.press('Backspace');
    await this.page.keyboard.type(initalCode);
    await this.page.waitForFunction(
      (element: Element, textContent: string) => {
        return element.textContent?.trim().includes(textContent);
      },
      {},
      codeInputs[0],
      initalCode
    );

    // Code to prepend to the code input.
    if (codeToPrepend) {
      await codeInputs[1].type(codeToPrepend);
      await this.page.waitForFunction(
        (element: Element, textContent: string) => {
          return element.textContent?.trim().includes(textContent);
        },
        {},
        codeInputs[1],
        codeToPrepend
      );
    }

    // Code to append to the code input.
    if (codeToAppend) {
      await codeInputs[2].type(codeToAppend);
      await this.page.waitForFunction(
        (element: Element, textContent: string) => {
          return element.textContent?.trim().includes(textContent);
        },
        {},
        codeInputs[2],
        codeToAppend
      );
    }

    // Save.
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Customized Code Editor / Preview Code Editor successfully.');
  }

  /**
   * Customizes the numeric expression input interaction.
   * @param placeholderText The placeholder text of the input.
   * @param representDivUsingFraction Whether to represent the division using
   */
  async customizeNumericExpressionInputInteraction(
    placeholderText: string,
    representDivUsingFraction: boolean
  ): Promise<void> {
    const customizationBox = await this.getInteractionCustomizationBox();
    await customizationBox.waitForSelector('input');
    const inputElements = await customizationBox.$$('input');

    // Placeholder text.
    await inputElements[0].click({clickCount: 3});
    await inputElements[0].type(placeholderText);
    await this.page.waitForFunction(
      (element: Element, value: string) => {
        return (element as HTMLInputElement).value === value;
      },
      {},
      inputElements[0],
      placeholderText
    );

    // Represt Divisions using Fractions.
    if (representDivUsingFraction) {
      await inputElements[1].click();
      await this.page.waitForFunction(
        (element: Element) => {
          return (element as HTMLInputElement).checked;
        },
        {},
        inputElements[1]
      );
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Customized World Map successfully.');
  }

  /**
   * Customizes the numeric expression input interaction.
   * @param quickAccessCharcters The characters to be displayed in the quick
   * @param representDivUsingFraction Whether to represent the division using
   */
  async customizeAlgebricExpressionInputInteraction(
    quickAccessCharcters: string,
    representDivUsingFraction: boolean
  ): Promise<void> {
    const customizationBox = await this.getInteractionCustomizationBox();
    const quickAccessInput = await customizationBox.$(
      customSelectedCharctersSelector
    );
    if (!quickAccessInput) {
      throw new Error('Could not find quick access input');
    }
    await customizationBox.waitForSelector('input');
    const inputElement = await customizationBox.$('input');
    if (!inputElement) {
      throw new Error('Could not find input element');
    }

    // Placeholder text.
    await quickAccessInput.type(quickAccessCharcters);
    try {
      await this.page.waitForFunction(
        (element: Element, value: string) => {
          return (element as HTMLInputElement).textContent?.trim() === value;
        },
        {},
        quickAccessInput,
        quickAccessCharcters.split('').join('  ')
      );
    } catch {
      throw new Error(
        `Can't customize characters. Found: ${quickAccessCharcters.split('').join(' ')}`
      );
    }

    // Represt Divisions using Fractions.
    if (representDivUsingFraction) {
      await inputElement.click();
      await this.page.waitForFunction(
        (element: Element) => {
          return (element as HTMLInputElement).checked;
        },
        {},
        inputElement
      );
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Customized World Map successfully.');
  }

  /**
   * Customizes the world map interaction.
   * @param initialLat The initial latitude of the map.
   * @param initialLong The initial longitude of the map.
   * @param initialZoom The initial zoom level of the map.
   */
  async customizeWorldMapInteraction(
    initialLat: number,
    initialLong: number,
    initialZoom: number
  ): Promise<void> {
    await this.expectElementToBeVisible(customizeInteractionBodySelector);
    const customizeInteractionBodyElement = await this.page.$(
      customizeInteractionBodySelector
    );
    if (!customizeInteractionBodyElement) {
      throw new Error(
        `Could not find element ${customizeInteractionBodySelector}`
      );
    }

    const inputFields = await customizeInteractionBodyElement.$$('input');
    if (!inputFields || inputFields.length !== 3) {
      throw new Error(
        `Could not find input fields ${customizeInteractionBodySelector}`
      );
    }

    await inputFields[0].type(initialLat.toString());
    await this.page.waitForFunction(
      (element: HTMLInputElement, value: number) => {
        return element.value.trim() === value.toString();
      },
      {},
      inputFields[0],
      initialLat
    );

    await inputFields[1].type(initialLong.toString());
    await this.page.waitForFunction(
      (element: HTMLInputElement, value: number) => {
        return element.value.trim() === value.toString();
      },
      {},
      inputFields[1],
      initialLong
    );

    await inputFields[2].type(initialZoom.toString());
    await this.page.waitForFunction(
      (element: HTMLInputElement, value: number) => {
        return element.value.trim() === value.toString();
      },
      {},
      inputFields[2],
      initialZoom
    );

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Customized World Map successfully.');
  }

  /**
   * Customizes the item selection interaction.
   * @param {string[]} options - The options to be selected.
   * @param {number} minimumNumberOfSelections - The minimum number of selections.
   * @param {number} maximumNumberOfSelections - The maximum number of selections.
   */
  async customizeItemSelectionInteraction(
    options: string[],
    minimumNumberOfSelections?: number,
    maximumNumberOfSelections?: number
  ): Promise<void> {
    await this.page.waitForSelector(customizeInteractionBodySelector);

    const inputSelctor = `${customizeInteractionBodySelector} input`;
    await this.page.waitForSelector(inputSelctor);
    const inputElements = await this.page.$$(inputSelctor);

    // Update minimum number of selections.
    if (minimumNumberOfSelections) {
      const inputElement = inputElements[0];
      await inputElement.click();
      await this.page.keyboard.press('Backspace');
      await inputElement.type(String(minimumNumberOfSelections));

      expect(
        await inputElement.evaluate(el => (el as HTMLInputElement).value)
      ).toBe(String(minimumNumberOfSelections));
    }

    // Update maximum number of selections.
    if (maximumNumberOfSelections) {
      const inputElement = inputElements[1];
      await inputElement.click();
      await this.page.keyboard.press('Backspace');
      await inputElement.type(String(maximumNumberOfSelections));

      expect(
        await inputElement.evaluate(el => (el as HTMLInputElement).value)
      ).toBe(String(maximumNumberOfSelections));
    }

    // Add options.
    for (let i = 0; i < options.length - 1; i++) {
      await this.page.waitForSelector(addResponseOptionButton, {visible: true});
      await this.clickOn(addResponseOptionButton);
    }

    const responseInputs = await this.page.$$(stateContentInputField);
    for (let i = 0; i < options.length; i++) {
      await responseInputs[i].type(`${options[i]}`);
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Item Selection interaction has been customized successfully.');
  }

  /**
   * Function to customize the text input interaction.
   * @param placeHolderText - The placeholder text for the text input.
   * @param heightInRows - The height of the text input in rows.
   * @param catchMisspellings - Whether to catch misspellings.+
   */
  async customizeTextInputInteraction(
    placeHolderText?: string,
    heightInRows?: string,
    catchMisspellings?: boolean
  ): Promise<void> {
    await this.page.waitForSelector(customizeInteractionBodySelector);

    await this.page.waitForSelector(
      `${customizeInteractionBodySelector} input`
    );
    const inputElements = await this.page.$$(
      `${customizeInteractionBodySelector} input`
    );

    // Update placeholder text.
    if (placeHolderText) {
      await inputElements[0].click({clickCount: 3});
      await inputElements[0].type(placeHolderText);
      await this.expectElementValueToBe(inputElements[0], placeHolderText);
    }

    // Update height in rows.
    if (heightInRows) {
      await inputElements[1].click();
      await this.page.keyboard.press('Backspace');
      await inputElements[1].type(heightInRows);

      await this.expectElementValueToBe(inputElements[1], heightInRows);
    }

    // Update catch misspellings.
    if (catchMisspellings === true) {
      await inputElements[2].click();

      await this.page.waitForFunction(
        (ele: HTMLInputElement) => {
          return ele.checked;
        },
        {},
        inputElements[2]
      );
    }

    // Save the interaction.
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
  }

  /**
   * Customizes the number input interaction.
   * @param allowOnlyPositiveInputs Whether to allow only positive inputs.
   */
  async customizeNumberInputInteraction(
    allowOnlyPositiveInputs: boolean = false
  ): Promise<void> {
    await this.page.waitForSelector(customizeInteractionBodySelector);
    await this.page.waitForSelector(
      `${customizeInteractionBodySelector} input[type="checkbox"]`
    );

    const checked = await this.page.$eval(
      `${customizeInteractionBodySelector} input[type="checkbox"]`,
      el => (el as HTMLInputElement).checked
    );
    if (checked !== allowOnlyPositiveInputs) {
      await this.page.click(
        `${customizeInteractionBodySelector} input[type="checkbox"]`
      );
    }

    // Verify that the checkbox is (un)checked.
    await this.page.waitForFunction(
      (selector: string, checked: boolean) => {
        const element = document.querySelector(selector);
        return (element as HTMLInputElement)?.checked === checked;
      },
      {},
      `${customizeInteractionBodySelector} input[type="checkbox"]`,
      allowOnlyPositiveInputs
    );

    // Save the interaction.
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
  }

  /**
   * Returns the rule editor modal.
   * @returns The rule editor modal.
   */
  async getRuleEditorModal(): Promise<puppeteer.ElementHandle<Element>> {
    await this.page.waitForSelector(responseModalBodySelector);

    const responseBox = await this.page.$(responseModalBodySelector);
    if (!responseBox) {
      throw new Error('Response modal not found');
    }

    const ruleEditor = await responseBox.$(ruleEditorInResponseModalSeclector);
    if (!ruleEditor) {
      throw new Error('Rule editor not found');
    }

    return ruleEditor;
  }

  /**
   * Returns a modal element used to add solution.
   * @returns {Promise<puppeteer.ElementHandle<Element>>}
   */
  async getSolutionModal(): Promise<puppeteer.ElementHandle<Element>> {
    await this.page.waitForSelector(solutionModal);

    const solutionBox = await this.page.$(solutionModal);
    if (!solutionBox) {
      throw new Error('Solution box not found');
    }

    return solutionBox;
  }

  /**
   * Updates the rule in the response modal to the given rule.
   * @param {string} rule The rule to update the response modal to.
   * @param {string} expression The algebric expression for which the feedback is being given.
   */
  async updateAlgebricExpressionLearnerAnswerInResponseModal(
    rule: string,
    expression: string
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    const responseBox = await this.getRuleEditorModal();
    const algebricExpressionEditor = await responseBox.$(
      algebricExpressionEditorSelector
    );

    if (!algebricExpressionEditor) {
      throw new Error('Algebric expression editor not found.');
    }

    await algebricExpressionEditor.click();
    await algebricExpressionEditor.type(expression);
  }

  /**
   * Adds algebric solution in solution modal.
   * @param solution - The correct answer.
   * @param explaination - Explanation of the solution.
   */
  async addAlgebricExpressionSolutionToState(
    solution: string,
    explaination: string
  ): Promise<void> {
    // Click on Add Solution button.
    await this.clickOnAddSolutionButton();

    // Add solution.
    const solutionModal = await this.getSolutionModal();
    const algebricExpressionEditor = await solutionModal.$(
      algebricExpressionEditorSelector
    );

    if (!algebricExpressionEditor) {
      throw new Error('Algebric expression editor not found.');
    }

    await algebricExpressionEditor.click();
    await algebricExpressionEditor.type(solution);

    await this.clickOn(submitAnswerButton);

    // Add explanation.
    await this.addSolutionExplanationAndSave(explaination);
  }

  /**
   * Updates the numeric expression learner answer in the response modal.
   * @param {string} rule - The rule to update.
   * @param {string} expression - The expression to update.
   */
  async updateNumericExpressionLearnerAnswerInResponseModal(
    rule: string,
    expression: string
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    const responseBox = await this.getRuleEditorModal();
    const numericExpressionEditor = await responseBox.$(
      numericExpressionEditorSelector
    );

    if (!numericExpressionEditor) {
      throw new Error('Could not find numeric expression editor.');
    }

    await numericExpressionEditor.click();
    await numericExpressionEditor.type(expression);
  }

  /**
   * Adds a numeric interaction solution to the current state card.
   * @param {string} solution - The solution to add.
   * @param {string} explaination - The explanation for the solution.
   */
  async addNumbericInteractionSolutionToState(
    solution: string,
    explaination: string
  ): Promise<void> {
    // Click on Add Solution button.
    await this.clickOnAddSolutionButton();

    // Add solution.
    const solutionModal = await this.getSolutionModal();
    const numericExpressionEditor = await solutionModal.$(
      numericExpressionEditorSelector
    );

    if (!numericExpressionEditor) {
      throw new Error('Could not find numeric expression editor.');
    }

    await numericExpressionEditor.click();
    await numericExpressionEditor.type(solution);

    await this.clickOn(submitAnswerButton);

    // Add explanation.
    await this.addSolutionExplanationAndSave(explaination);
  }

  /**
   * This function updates the answers in the response modal.
   * @param {INTERACTION_TYPES} interactionType - The type of the interaction.
   * @param {string} answer - The answer to set in the response modal.
   */
  async updateAnswersInResponseModal(
    interactionType: INTERACTION_TYPES,
    answer: string
  ): Promise<void> {
    const responseModal = await this.getRuleEditorModal();
    switch (interactionType) {
      case INTERACTION_TYPES.NUMBER_INPUT:
        (await responseModal.waitForSelector(floatFormInput))?.type(answer);
        break;
      case INTERACTION_TYPES.MULTIPLE_CHOICE:
        await this.page.waitForSelector(multipleChoiceResponseDropdown, {
          visible: true,
          timeout: 5000,
        });
        await this.clickOn(multipleChoiceResponseDropdown);
        await this.page.waitForSelector(multipleChoiceResponseOption, {
          visible: true,
        });

        await this.page.evaluate(
          (answer, multipleChoiceResponseOption) => {
            const optionElements = Array.from(
              document.querySelectorAll(multipleChoiceResponseOption)
            );
            const element = optionElements.find(
              element => element.textContent?.trim() === answer
            ) as HTMLElement;
            if (element) {
              element.click();
            } else {
              throw new Error(`Cannot find "${answer}" in options.`);
            }
          },
          answer,
          multipleChoiceResponseOption
        );
        break;
      case INTERACTION_TYPES.TEXT_INPUT:
        await this.page.waitForSelector(addResponseOptionButton, {
          visible: true,
        });
        await this.clickOn(addResponseOptionButton);
        await this.page.waitForSelector(textInputInteractionOption);
        await this.page.type(textInputInteractionOption, answer);
        break;
      case INTERACTION_TYPES.FRACTION_INPUT:
        await this.page.waitForSelector(intEditorField, {
          visible: true,
        });
        await this.clearAllTextFrom(intEditorField);
        await this.type(intEditorField, answer);
        break;
      // Add cases for other interaction types here
      // case 'otherInteractionType':
      //   await this.type(otherFormInput, answer);
      //   break;
      default:
        throw new Error(`Unsupported interaction type: ${interactionType}`);
    }
  }

  /**
   * Updates the code editor in the response modal to the given rule and code
   * @param rule the rule to update the code editor to
   * @param code the code to update the code editor to
   */
  async updateCodeEditorLearnerAnswerInResponseModal(
    rule: string,
    code: string
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    const ruleEditor = await this.getRuleEditorModal();

    const codeEditor = await ruleEditor.$(codeEditorStringEditorSelector);
    if (!codeEditor) {
      throw new Error(`Code editor not found for rule ${rule}`);
    }

    await codeEditor.click();
    await codeEditor.type(code);
  }

  /**
   * Adds a solution to the state.
   * @param solution The solution to add.
   * @param explaination The explaination for the solution.
   */
  async addCodeEditorSolutionToState(
    solution: string,
    explaination: string
  ): Promise<void> {
    await this.clickOnAddSolutionButton();

    const solutionBox = await this.getSolutionModal();
    const codeEditor = await solutionBox.$(codeEditorInSolutionModal);
    if (!codeEditor) {
      throw new Error('Code editor not found.');
    }

    await codeEditor.click();
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.keyboard.press('Backspace');

    await this.page.type(codeEditorInSolutionModal, solution);

    await this.clickOn(submitAnswerButton);

    // Add Explaination.
    await this.addSolutionExplanationAndSave(explaination);
  }

  /**
   * Adds a pencil code editor solution to the current state card.
   * @param {string} solution - The solution to add.
   * @param {string} explaination - The explanation for the solution.
   */
  async addPencilCodeEditorSolutionToState(
    solution: string,
    explaination: string
  ): Promise<void> {
    await this.clickOnAddSolutionButton();

    const solutionBox = await this.getSolutionModal();
    const pencilCodeEditor = new PencilCode(this.page, solutionBox);
    await pencilCodeEditor.typeCode(solution);

    await pencilCodeEditor.runCode();

    // Retry if code didn't run properly.
    if ((await this.isElementVisible(stateContentInputField)) === false) {
      await pencilCodeEditor.runCode();
    }

    await this.addSolutionExplanationAndSave(explaination);
  }

  /**
   * Updates rule and options in response modal for Drag and Drop Sort interaction.
   * @param rule Rule to update.
   * @param optionsSelections Options selections to update.
   */
  async updateDragAndDropSortLearnersAnswerInResponseModal(
    rule: string,
    optionsSelections: string[] | number[]
  ): Promise<void> {
    // Update Rule.
    await this.updateRuleInResponseModalTo(rule);

    // Update Options Selections.
    const ruleBox = await this.page.waitForSelector(
      ruleEditorInResponseModalSeclector,
      {
        visible: true,
      }
    );

    if (!ruleBox) {
      throw new Error('Response modal is not visible.');
    }

    const ruleType =
      typeof optionsSelections[0] === 'number' ? 'ordering' : 'comparasion';

    if (ruleType === 'ordering') {
      const selectBoxes = await ruleBox.$$('select');

      if (selectBoxes.length !== optionsSelections.length) {
        throw new Error(
          `Expected ${optionsSelections.length} select boxes, but found ${selectBoxes.length}.`
        );
      }

      for (let i = 0; i < selectBoxes.length; i++) {
        await selectBoxes[i].select(optionsSelections[i].toString());
      }
    } else {
      throw new Error('Rule currently not supported');
    }
  }

  /**
   * Updates graph theory learner answer in response modal to be a simple star network.
   */
  async updateGraphTheoryLearnerAnswerInResponseModal(): Promise<void> {
    const responseBox = await this.getRuleEditorModal();

    await this.waitForPageToFullyLoad();
    const graphViz = new GraphViz(this.page, responseBox);
    await graphViz.createASimpleStarNetwork(this.isViewportAtMobileWidth());
  }

  /**
   * Creates a star network in the graph theory learner answer in response modal.
   * @param {number} n - The number of vertices in the star network.
   */
  async submitGraphStarNetworkSolution(n: number): Promise<void> {
    await this.page.waitForSelector(graphContainerSelector);
    await this.waitForPageToFullyLoad();
    const graphViz = new GraphViz(this.page);

    await graphViz.resetGraph();
    const vertices = await graphViz.getVertices();
    if (vertices.length < n) {
      throw new Error(
        `Expected atleast ${n} vertices, but found ${vertices.length}`
      );
    }

    for (let i = 1; i < n; i++) {
      await graphViz.addEdge(
        vertices[0],
        vertices[i],
        this.isViewportAtMobileWidth()
      );
    }

    await this.clickOnSubmitAnswerButton();
  }

  /**
   * Updates math equation learner answer in response modal to be a simple equation.
   */
  async updateMathEquationLearnerAnswerInResponseModal(
    rule: string,
    equation: string
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    const responseBox = await this.getRuleEditorModal();

    const equationBox = await responseBox.$(mathEquationEditorSelector);
    if (!equationBox) {
      throw new Error('Math equation box not found.');
    }

    await equationBox.click();
    await equationBox.type(equation);

    if (this.isViewportAtMobileWidth()) {
      const onScreenKeyboardSelector = '.e2e-test-osk-hide-button';
      if (await this.isElementVisible(onScreenKeyboardSelector)) {
        await this.page.click(onScreenKeyboardSelector);
      }
      await this.expectElementToBeVisible(onScreenKeyboardSelector, false);
    }
  }

  async addMathEquationSolutionToState(
    solution: string,
    explaination: string
  ): Promise<void> {
    // Click on Add Solution button.
    await this.clickOnAddSolutionButton();

    // Add solution.
    const solutionModal = await this.getSolutionModal();
    const equationBox = await solutionModal.$(mathEquationEditorSelector);
    if (!equationBox) {
      throw new Error('Math equation box not found.');
    }

    await this.waitForElementToStabilize(equationBox);
    await equationBox.click();
    await equationBox.type(solution);

    await this.clickOn(submitAnswerButton);

    // Add explanation.
    await this.addSolutionExplanationAndSave(explaination);
  }

  async updateMusicNotesInputLearnerAnswerInResponseModal(
    rule: 'is equal to',
    musicNotes: string[]
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    const responseBox = await this.getRuleEditorModal();

    for (let i = 0; i < musicNotes.length; i++) {
      const addNoteButton = await responseBox.$(addResponseOptionButton);
      await addNoteButton?.click();
    }

    const responseInputs = await responseBox.$$('select');
    if (responseInputs.length !== musicNotes.length) {
      throw new Error(
        `Expected ${musicNotes.length} response inputs, but found ${responseInputs.length}`
      );
    }

    for (let i = 0; i < musicNotes.length; i++) {
      await responseInputs[i].select(musicNotes[i]);
    }
  }

  /**
   * Add a music note input solution to the state
   * @param musicNodes - music notes to add
   * @param explaination - explaination of the solution
   */
  async addMusicNotesInputSolutionToState(
    musicNodes: string[],
    explaination: string
  ): Promise<void> {
    await this.clickOnAddSolutionButton();

    const solutionModal = await this.getSolutionModal();
    for (let i = 0; i < musicNodes.length; i++) {
      const addNoteButton = await solutionModal.$(addResponseOptionButton);
      await addNoteButton?.click();

      const nodeSelectElements = await solutionModal.$$('select');
      const nodeSelectElement = nodeSelectElements[i];
      await nodeSelectElement.select(musicNodes[i]);
    }

    await this.clickOn(submitAnswerButton);

    await this.addSolutionExplanationAndSave(explaination);
  }

  /**
   * Submits the music notes input answer.
   * @param {string[]} musicNotes - The music notes to submit.
   */
  async submitMusicNotesInputAnswer(musicNotes: string[]): Promise<void> {
    for (const note of musicNotes) {
      await this.expectElementToBeVisible(addResponseOptionButton);
      const addNoteButton = await this.page.$(addResponseOptionButton);
      await addNoteButton?.click();

      const nodeSelectElements = await this.page.$$('select');
      const nodeSelectElement =
        nodeSelectElements[nodeSelectElements.length - 1];
      await nodeSelectElement.select(note);
    }

    await this.clickOnSubmitAnswerButton();
  }

  /**
   * Updates the number with unit editor in the response modal.
   * @param {} rule The rule to update the response modal to.
   */
  async updateNumberWithUnitsLearnerAnswerInResponseModal(
    rule: string,
    numberWithUnit: string
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    const responseModal = await this.getRuleEditorModal();

    const numberWithUnitEditor = await responseModal.$(
      numberWithUnitEditorSelector
    );
    if (!numberWithUnitEditor) {
      throw new Error('Could not find number with unit editor');
    }

    await numberWithUnitEditor.type(numberWithUnit);
  }

  /**
   * Updates the answer in the response modal for a multiple choice rule.
   * @param rule The rule to update.
   * @param answer The answer to update.
   */
  async updateMultipleChoiceLearnersAnswerInResponseModal(
    rule: 'is equal to',
    answer: string
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    const responseModal = await this.getRuleEditorModal();

    const multipleChoiceDropdown = await this.getElementInParent(
      multipleChoiceResponseDropdown,
      responseModal
    );

    await multipleChoiceDropdown.click();
    await this.selectMatOption(answer);

    // Check if the value has been updated.
    await this.expectTextContentToBe(multipleChoiceResponseDropdown, answer);
  }

  /**
   * Update the item selection learners answer in the response modal.
   * @param rule The rule to update.
   * @param optionsSelections The options selections to update.
   */
  async updateItemSelectionLearnersAnswerInResponseModal(
    rule:
      | 'is equal to'
      | 'is proper subset of'
      | 'contains at least one of'
      | 'omits atleast on of',
    optionsSelections: string[]
  ): Promise<void> {
    const responseBox = await this.page.waitForSelector(
      responseModalBodySelector,
      {visible: true}
    );

    if (!responseBox) {
      throw new Error('Response modal is not visible.');
    }

    // Update Rule.
    await this.updateRuleInResponseModalTo(rule);

    // Select given options.
    const options = await responseBox?.$$('mat-checkbox');
    for (let option of options) {
      const optionText =
        (await option.evaluate(el => el.textContent?.trim())) ?? '';
      if (optionsSelections.includes(optionText)) {
        const inputElementContainer = await option.$(
          '.mat-checkbox-inner-container'
        );
        if (!inputElementContainer) {
          throw new Error(`Option ${optionText} not found.`);
        }
        await inputElementContainer.click();

        const inputElement = await option.$('input');
        await this.page.waitForFunction(
          (inputElement: HTMLInputElement) => inputElement.checked,
          {},
          inputElement
        );
      }
    }
  }

  /**
   * Updates the ratio expression learner answer in the response modal.
   * @param {string} rule - The rule to update.
   * @param {string[]} answer - The answer to update.
   */
  async updateRatioExpressionInputLearnerAnswerInResponseModal(
    rule: string,
    answer: string[]
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    const ruleEditorModal = await this.getRuleEditorModal();

    const inputFields = await ruleEditorModal.$$('input');

    if (inputFields.length !== answer.length) {
      throw new Error(
        `Expected ${answer.length} input fields, but found ${inputFields.length}`
      );
    }

    for (let i = 0; i < inputFields.length; i++) {
      await inputFields[i].click();
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Backspace');

      await inputFields[i].type(answer[i]);
    }
  }

  /**
   * Updates the rule in the response modal.
   * @param {string} rule The rule to update the response modal to.
   */
  async updateRuleInResponseModalTo(rule: string): Promise<void> {
    const responseBox = await this.page.waitForSelector(
      responseModalBodySelector,
      {visible: true}
    );

    if (!responseBox) {
      throw new Error('Response modal is not visible.');
    }
    const selectInput = await responseBox.$('mat-select');
    await selectInput?.click();

    await this.page.waitForSelector('mat-option');
    const ruleOptions = await this.page.$$('mat-option');
    const ruleOptionTexts = await this.page.$$eval('mat-option', options =>
      options.map(option => option.textContent)
    );

    for (let i = 0; i < ruleOptionTexts.length; i++) {
      if (ruleOptionTexts[i]?.includes(rule)) {
        await ruleOptions[i].click();
        break;
      }
    }

    await this.page.waitForFunction(
      (ele: HTMLElement, value: string) => {
        return ele.textContent?.trim().includes(value);
      },
      {},
      selectInput,
      rule
    );
  }

  /**
   * Updates the set input learner answer in the response modal.
   * @param rule The rule to update.
   * @param values The values to update.
   */
  async updateSetInputLearnerAnswerInResponseModal(
    rule: string,
    values: string[]
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    await this.page.waitForSelector(responseModalBodySelector, {visible: true});

    const responseBox = await this.page.$(responseModalBodySelector);

    if (!responseBox) {
      throw new Error('Response box not found.');
    }

    for (let i = 0; i < values.length; i++) {
      const addNewElementButton = await responseBox.$(addResponseOptionButton);

      if (!addNewElementButton) {
        throw new Error('Add new element button not found.');
      }
      await addNewElementButton.click();

      const inputFields = await responseBox.$$(textInputField);
      const inputField = inputFields[i];

      await inputField.type(values[i]);

      expect(
        await inputField.evaluate(el => (el as HTMLInputElement).value)
      ).toEqual(values[i]);
    }
  }

  /**
   * Adds a set input solution to the current state card.
   * @param {string[]} set - The set of options to add.
   * @param {string} explaination - The explanation for the solution.
   */
  async addSetInputSolutionToState(
    set: string[],
    explaination: string
  ): Promise<void> {
    await this.clickOnAddSolutionButton();

    let firstOption = true;
    for (const option of set) {
      if (!firstOption) {
        await this.clickOn(addResponseOptionButton);
        firstOption = false;
      }
      await this.type(`${solutionModal} ${textInputField}`, option);
    }

    await this.clickOn(submitAnswerButton);

    await this.addSolutionExplanationAndSave(explaination);
  }

  /**
   * Submits the answer to the input set.
   * @param answer The answer to submit.
   * @param submitAnswer Whether to submit the answer.
   */
  async submitInputSetAnswer(
    answer: string[],
    submitAnswer: boolean = true
  ): Promise<void> {
    let first = true;
    for (let i = 0; i < answer.length; i++) {
      if (!first) {
        this.expectElementToBeVisible(addResponseOptionButton);
        this.clickOn(addResponseOptionButton);
      }
      await this.page.waitForFunction(
        (selector: string, numberOfElements: number) => {
          return (
            document.querySelectorAll(selector).length === numberOfElements
          );
        },
        {},
        textInputField,
        i + 1
      );

      const inputField = await this.page.$$(textInputField);
      await inputField[i].type(answer[i]);
      await this.page.waitForFunction(
        (element: HTMLInputElement, value: string) => {
          return element.value === value;
        },
        {},
        inputField[i],
        answer[i]
      );
      first = false;
    }

    if (submitAnswer) {
      await this.clickOnSubmitAnswerButton();
    }
  }

  /**
   * Submits the answer to the set input question.
   * @param answer The answer to submit.
   */
  async submitSetInputAnswer(answer: string[]): Promise<void> {
    let firstOption = true;
    for (const option of answer) {
      if (!firstOption) {
        await this.clickOn(addResponseOptionButton);
        firstOption = false;
      }
      await this.type(`${solutionModal} ${textInputField}`, option);
    }

    await this.clickOnSubmitAnswerButton();
  }

  /**
   * Updates the world map learner answer in the response modal
   * @param rule The rule to update
   * @param answer The answer to update
   */
  async updateWorldMapLearnerAnswerInResponseModal(
    rule: 'is within ... km of ...' | 'is not within ... km of ...',
    answer: number
  ): Promise<void> {
    await this.updateRuleInResponseModalTo(rule);

    const responseBox = await this.getRuleEditorModal();
    const inputFieldElement = await responseBox.$('input');

    if (!inputFieldElement) {
      throw new Error('Input field not found');
    }
    await inputFieldElement.type(answer.toString());

    await this.page.waitForFunction(
      (element: HTMLInputElement, value: number) => {
        return element.value === value.toString();
      },
      {},
      inputFieldElement,
      answer
    );
  }

  /**
   * Function to navigate to creator dashboard page.
   */
  async navigateToCreatorDashboardPage(): Promise<void> {
    await this.goto(creatorDashboardPage);
    showMessage('Creator dashboard page is opened successfully.');
  }

  /**
   * Function to navigate to exploration editor from Creator Dashboard.
   */
  async navigateToExplorationEditorFromCreatorDashboard(): Promise<void> {
    await this.page.waitForSelector(createExplorationButtonSelector);
    await this.clickAndWaitForNavigation(createExplorationButtonSelector);

    await this.page.waitForFunction(
      (targetURL: string) => {
        return document.URL.includes(targetURL);
      },
      {},
      `${baseUrl}/create/`
    );
  }

  /**
   * Function to navigate to exploration editor.
   */
  async navigateToExplorationEditorPage(): Promise<void> {
    await this.clickAndWaitForNavigation(createExplorationButtonSelector);
  }

  /**
   * Function to create an exploration with a content and interaction.
   * This is a composite function that can be used when a straightforward, simple exploration setup is required.
   *
   * @param content - content of the exploration
   * @param interaction - the interaction to be added to the exploration
   */
  async createMinimalExploration(
    content: string,
    interaction: string
  ): Promise<void> {
    await this.updateCardContent(content);
    await this.addInteraction(interaction);
    showMessage('A simple exploration is created.');
  }

  /**
   * Open settings tab.(Note->It also opens all the dropdowns present
   * in the setting tab for mobile view port.)
   */
  async navigateToSettingsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarDropdown);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to settings tab appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.page.waitForSelector(mobileOptionsButtonSelector, {
          visible: true,
        });
        await this.clickOn(mobileOptionsButtonSelector);
      }
      await this.page.waitForSelector(mobileNavbarDropdown, {
        visible: true,
      });
      await this.clickOn(mobileNavbarDropdown);
      await this.clickOn(mobileSettingsBarSelector);

      // Open all dropdowns because by default all dropdowns are closed in mobile view.
      await this.clickOn(basicSettingsDropdown);
      await this.clickOn(advanceSettingsDropdown);
      await this.clickOn(rolesSettingsDropdown);
      await this.clickOn(voiceArtistSettingsDropdown);
      await this.clickOn(permissionSettingsDropdown);
      await this.clickOn(feedbackSettingsDropdown);
    } else {
      await this.page.waitForSelector(settingsTabSelector, {
        visible: true,
      });
      await this.clickOn(settingsTabSelector);
    }

    await this.page.waitForSelector(settingsContainerSelector, {
      visible: true,
    });
    showMessage('Settings tab is opened successfully.');
  }

  /**
   * Expands the specified settings tab section.
   * Currently it only expands Basic Settings, Advanced Features, Roles, and Voice Artists.
   * @param section - The name of the section to expand.
   */
  async expandSettingsTabSection(
    section:
      | 'Basic Settings'
      | 'Advanced Features'
      | 'Roles'
      | 'Voice Artists'
      | 'Controls'
  ): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      showMessage(
        `Skipped: Expanding ${section} section on desktop.\n` +
          'Reason: Sections are already expanded on desktop.'
      );
      return;
    }

    // Generate the selectors for the section header and content.
    const identifier = section.replace(' ', '-').toLowerCase();
    const sectionContentSelector = `.e2e-test-${identifier}-content`;
    const sectionHeaderSelector = `.e2e-test-${identifier}-header`;

    // Skip if the section is already expanded.
    if (await this.isElementVisible(sectionContentSelector)) {
      showMessage(
        `Skipped: Expanding ${section} section on desktop.\n` +
          'Reason: Section is already expanded on desktop.'
      );
      return;
    }

    // Expand the section.
    await this.expectElementToBeVisible(sectionHeaderSelector);
    await this.page.click(sectionHeaderSelector);
    await this.expectElementToBeVisible(sectionContentSelector);
  }

  /**
   * Function to open control dropdown so that delete exploration button is visible
   * in mobile view.
   */
  async openExplorationControlDropdown(): Promise<void> {
    await this.page.waitForSelector(explorationControlsSettingsDropdown, {
      visible: true,
    });
    await this.clickOn(explorationControlsSettingsDropdown);

    await this.page.waitForSelector(deleteButtonSelector, {
      visible: true,
    });
  }

  /**
   * Opens the navigation in mobile viewport properly.
   * @param dropdown Dropdown to open. Currently, it only opens
   * the state changes dropdown, but can be extended to open navigation dropdown.
   */
  async openExplorationNavigationInMobile(
    dropdown: 'State Changes' | null
  ): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      showMessage('Skipped: Open exploration navigation in mobile view');
    }

    // Open the navigation only if it is not open.
    if (!(await this.isElementVisible(openNavbarIconSelector))) {
      await this.clickOn(mobileOptionsButtonSelector);
      await this.expectElementToBeVisible(`${openNavbarIconSelector}`);
      showMessage('Opened Navigation Menu (mobile).');
    }

    // Open state changes dropdown only if required.
    if (
      dropdown === 'State Changes' &&
      !(await this.isElementVisible(`${stateChangesDropdownSelector}.show`))
    ) {
      await this.clickOn(mobileChangesDropdownSelector);
      await this.expectElementToBeVisible(
        `${stateChangesDropdownSelector}.show`
      );
      showMessage('State Changes Dropdown Opened (mobile).');
    }

    showMessage(`Opened Navigation Menu and ${dropdown} Dropdown.`);
  }

  /**
   * Function to publish exploration.
   * This is a composite function that can be used when a straightforward, simple exploration published is required.
   * @param {string} title - The title of the exploration.
   * @param {string} goal - The goal of the exploration.
   * @param {string} category - The category of the exploration.,
   * @param {string} tags - The tags of the exploration.
   */
  async publishExplorationWithMetadata(
    title: string,
    goal: string,
    category: string,
    tags?: string
  ): Promise<string> {
    const publishExploration = async () => {
      if (this.isViewportAtMobileWidth()) {
        await this.waitForPageToFullyLoad();
        await this.page.waitForSelector(mobileNavbarDropdown, {
          visible: true,
        });
        const element = await this.page.$(mobileNavbarOptions);
        // If the element is not present, it means the mobile navigation bar is not expanded.
        // The option to save changes appears only in the mobile view after clicking on the mobile options button,
        // which expands the mobile navigation bar.
        if (!element) {
          await this.clickOn(mobileOptionsButtonSelector);
        }
        await this.clickOn(mobileChangesDropdownSelector);
        await this.clickOn(mobilePublishButtonSelector);
      } else {
        await this.page.waitForSelector(publishExplorationButtonSelector, {
          visible: true,
        });
        await this.clickOn(publishExplorationButtonSelector);
      }
    };

    const fillExplorationMetadataDetails = async () => {
      await this.clickOn(explorationTitleInput);
      await this.type(explorationTitleInput, title);
      await this.clickOn(explorationGoalInput);
      await this.type(explorationGoalInput, goal);
      await this.clickOn(explorationCategoryDropdown);
      await this.clickOn(category);
      if (tags) {
        await this.type(tagsField, tags);
      }
    };

    const confirmPublish = async (): Promise<string> => {
      await this.clickOn(saveExplorationChangesButton);
      await this.page.waitForSelector(explorationConfirmPublishButton, {
        visible: true,
      });
      await this.waitForElementToStabilize(explorationConfirmPublishButton);
      await this.clickOn(explorationConfirmPublishButton);
      await this.page.waitForSelector(explorationIdElement);
      const explorationIdUrl = await this.page.$eval(
        explorationIdElement,
        element => (element as HTMLElement).innerText
      );
      const explorationId = explorationIdUrl.replace(/^.*\/explore\//, '');
      await this.waitForElementToStabilize(closePublishedPopUpButton);
      await this.clickOn(closePublishedPopUpButton);
      await this.expectElementToBeVisible(closePublishedPopUpButton, false);

      if (!explorationId) {
        throw new Error('Failed to get exploration ID.');
      }
      return explorationId;
    };

    await publishExploration();
    await fillExplorationMetadataDetails();

    try {
      return await confirmPublish();
    } catch (error) {
      showMessage('Failed to publish the exploration.\n' + error.stack);

      const errorSavingExplorationElement = await this.page.$(
        errorSavingExplorationModal
      );
      if (errorSavingExplorationElement) {
        await this.clickOn(errorSavingExplorationModal);
        await this.page.waitForNavigation({
          waitUntil: ['load', 'networkidle0'],
        });
      }
      await publishExploration();
      return await confirmPublish();
    }
  }

  /**
   * Navigate to feedback tab.
   */
  async navigateToFeedbackTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const mobileNavbarElement = await this.page.$(mobileNavbarOptions);
      if (!mobileNavbarElement) {
        await this.clickOn(mobileOptionsButtonSelector);
      }
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileFeedbackTabButton);
    } else {
      await this.clickOn(feedBackButtonTab);
      await this.waitForNetworkIdle();
    }

    await this.page.waitForSelector(explorationFeedbackTabContentSelector, {
      visible: true,
    });
  }

  /**
   * Fetches the exploration ID from the current URL of the exploration editor page.
   * The exploration ID is the string after '/create/' in the URL.
   */
  async getExplorationId(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/create\/(.*?)(\/|#)/);
    if (!match) {
      throw new Error(
        'Exploration ID not found in the URL.' +
          `Ensure you are on the exploration editor page. Found URL: ${url}`
      );
    }
    return match[1];
  }

  /**
   * Function to dismiss exploration editor welcome modal.
   */
  async dismissWelcomeModal(): Promise<void> {
    try {
      await this.page.waitForSelector(dismissWelcomeModalSelector, {
        visible: true,
        timeout: 5000,
      });
      await this.clickOn(dismissWelcomeModalSelector);
      await this.page.waitForSelector(dismissWelcomeModalSelector, {
        hidden: true,
      });
      showMessage('Tutorial pop-up closed successfully.');
    } catch (error) {
      showMessage(`Welcome Modal not found, but test can be continued.
        Error: ${error.message}`);
    }
  }

  /**
   * Function to close editor navigation dropdown. Can be done by clicking
   * on the dropdown toggle.
   */
  async closeEditorNavigationDropdownOnMobile(): Promise<void> {
    const isDropdownClosed = await this.isElementVisible(
      openExplorationEditorNavigationMobile,
      false,
      5000
    );

    if (isDropdownClosed) {
      showMessage(
        'Skipped closing editor navigation dropdown, already closed.'
      );
      return;
    }

    // We are using page.click as this button might be overlapped by the
    // dropdown. Thus, it will fail with onClick.
    await this.page.click(dropdownToggleIcon);
    await this.expectElementToBeVisible(
      openExplorationEditorNavigationMobile,
      false
    );
  }

  /**
   * Function to dismiss translation tab welcome modal.
   */
  async dismissTranslationTabWelcomeModal(): Promise<void> {
    await this.page.waitForSelector(dismissTranslationWelcomeModalSelector, {
      visible: true,
    });
    await this.clickOn(dismissTranslationWelcomeModalSelector);
    await this.page.waitForSelector(dismissTranslationWelcomeModalSelector, {
      hidden: true,
    });
    showMessage('Translation tutorial pop-up closed successfully.');
  }

  /**
   * Function to add content to a card.
   * @param {string} content - The content to be added to the card.
   */
  async updateCardContent(content: string): Promise<void> {
    await this.page.waitForSelector(stateEditSelector, {
      visible: true,
    });
    await this.clickOn(stateEditSelector);
    await this.clearAllTextFrom(stateContentInputField);
    await this.type(stateContentInputField, `${content}`);
    await this.clickOn(saveContentButton);
    await this.page.waitForSelector(stateContentInputField, {hidden: true});

    // TODO(#23019): Currently, the content automatically changes spaces in the
    // card content. So, skipping the post-check. Once the issue is resolved,
    // uncomment the following line.
    // await this.expectTextContentToContain(stateContentSelector, content);
    showMessage('Card content is updated successfully.');
  }

  /**
   * Changes tab in interaction selection modal.
   * @param interactionType Interaction type to change tab.
   */
  async changeTabInInteractionSelectionModal(
    interactionType: INTERACTION_TYPES
  ): Promise<void> {
    const interactionTabs: Record<string, INTERACTION_TYPES[]> = {
      [INTERACTION_TABS.PROGRAMMING]: [
        INTERACTION_TYPES.CODE_EDITOR,
        INTERACTION_TYPES.PENCIL_CODE_EDITOR,
      ],
      [INTERACTION_TABS.MATHS]: [
        INTERACTION_TYPES.FRACTION_INPUT,
        INTERACTION_TYPES.GRAPH_THEORY,
        INTERACTION_TYPES.NUMBER_INPUT,
        INTERACTION_TYPES.SET_INPUT,
        INTERACTION_TYPES.NUMERIC_EXPRESSION,
        INTERACTION_TYPES.ALGEBRAIC_EXPRESSION,
        INTERACTION_TYPES.MATH_EQUATION,
        INTERACTION_TYPES.NUMBER_WITH_UNITS,
        INTERACTION_TYPES.RATIO_EXPRESSION_INPUT,
      ],
      [INTERACTION_TABS.GEOGRAPHY]: [INTERACTION_TYPES.WORLD_MAP],
      [INTERACTION_TABS.MUSIC]: [INTERACTION_TYPES.MUSIC_NOTES_INPUT],
    };

    for (const interaction in interactionTabs) {
      if (interactionTabs[interaction].includes(interactionType)) {
        await this.waitForElementToStabilize(
          INTERACTION_TABS_SELECTORS[interaction]
        );
        await this.clickOn(INTERACTION_TABS_SELECTORS[interaction]);
        showMessage(`Switched to ${interaction} tab.`);
        break;
      }
    }
  }

  /**
   * Function to add an interaction to the exploration.
   * @param {string} interactionToAdd - The interaction type to add to the Exploration.
   * @param {boolean} skipInteractionCustoization - Whether to skip interaction customization.
   * Note: A space is added before and after the interaction name to match the format in the UI.
   */
  async addInteraction(
    interactionToAdd: string,
    skipInteractionCustoization: boolean = true
  ): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });

    await this.clickOn(addInteractionButton);

    // Check if modal title is correct.
    await this.expectModalTitleToBe('Choose Interaction');

    await this.changeTabInInteractionSelectionModal(
      interactionToAdd as INTERACTION_TYPES
    );

    const selector =
      INTERACTION_SELECTORS[interactionToAdd] ?? ` ${interactionToAdd} `;
    if (INTERACTION_SELECTORS[interactionToAdd]) {
      await this.page.waitForSelector(selector);
    }
    await this.waitForNetworkIdle();
    await this.clickOn(selector);
    if (skipInteractionCustoization) {
      await this.expectCustomizeInteractionTitleToBe(
        `Customize Interaction (${interactionToAdd})`
      );
      await this.page.waitForSelector(saveInteractionButton, {
        visible: true,
      });
      await this.clickOn(saveInteractionButton);
      await this.page.waitForSelector(addInteractionModalSelector, {
        hidden: true,
      });
    }
    showMessage(`${interactionToAdd} interaction has been added successfully.`);
  }

  /**
   * Function to add a multiple choice interaction to the exploration.
   * Any number of options can be added to the multiple choice interaction
   * using the options array.
   * @param options - Array of multiple choice options.
   */
  async addMultipleChoiceInteraction(options: string[]): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });
    await this.clickOn(addInteractionButton);

    await this.expectModalTitleToBe('Choose Interaction');
    await this.page.waitForSelector(multipleChoiceInteractionButton, {
      visible: true,
    });
    await this.clickOn(multipleChoiceInteractionButton);

    await this.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Multiple Choice)'
    );

    for (let i = 0; i < options.length - 1; i++) {
      await this.page.waitForSelector(addResponseOptionButton, {visible: true});
      await this.clickOn(addResponseOptionButton);
    }

    const responseInputs = await this.page.$$(stateContentInputField);
    for (let i = 0; i < options.length; i++) {
      await responseInputs[i].type(`${options[i]}`);
    }

    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Multiple Choice interaction has been added successfully.');
  }

  /**
   * Add a text input interaction to the card.
   */
  async addTextInputInteraction(): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });
    await this.clickOn(addInteractionButton);
    await this.page.waitForSelector(textInputInteractionButton, {
      visible: true,
    });
    await this.clickOn(textInputInteractionButton);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage('Text input interaction has been added successfully.');
  }

  /**
   * Update the optional text input interaction content.
   * @param content - The text input interaction content.
   */
  async updateTextInputInteraction(content: string): Promise<void> {
    await this.page.waitForSelector(interactionDiv, {
      visible: true,
    });
    await this.clickOn(interactionDiv);
    await this.clickOn(textInputField);
    await this.type(textInputField, content);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
  }

  /**
   * Adds a math interaction to the current exploration.
   * @param {string} interactionToAdd - The interaction type to add to the exploration.
   */
  async addMathInteraction(interactionToAdd: string): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });
    await this.clickOn(addInteractionButton);
    await this.clickOn(mathInteractionsTab);
    await this.clickOn(` ${interactionToAdd} `);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });
    showMessage(`${interactionToAdd} interaction has been added successfully.`);
  }

  /**
   * Function to close the interaction's response modal.
   */
  async closeInteractionResponseModal(): Promise<void> {
    await this.page.waitForSelector(closeResponseModalButton, {visible: true});
    await this.page.click(closeResponseModalButton);
    await this.page.waitForSelector(closeResponseModalButton, {
      hidden: true,
    });
  }

  /**
   * Adds an Image interaction to the current exploration.
   */
  async addImageInteraction(
    feedback: string = 'Correct!',
    nextCard: string = 'Last Card'
  ): Promise<void> {
    await this.page.waitForSelector(addInteractionButton, {
      visible: true,
    });
    // Click on add interaction button.
    await this.clickOn(addInteractionButton);
    await this.expectModalTitleToBe('Choose Interaction');

    // Click on image region interaction.
    await this.clickOn('Image Region');
    await this.expectCustomizeInteractionTitleToBe(
      'Customize Interaction (Image Region)'
    );
    await this.clickOn(uploadImageButton);
    await this.uploadFile(imageToUpload);
    await this.clickOn(useTheUploadImageButton);
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector('.btn-danger', {visible: true});

    const imageRegionHepler = new ImageAreaSelection(this.page);
    await imageRegionHepler.selectArea(5, 50, 90, 45);
    await this.clickOn(saveInteractionButton);
    await this.page.waitForSelector(addInteractionModalSelector, {
      hidden: true,
    });

    // Update correct response.
    await this.expectModalTitleToBe('Add Response');
    await this.addResponseDetailsInResponseModal(
      feedback,
      nextCard,
      true,
      true
    );
  }

  /**
   * Deletes the previous written title and updates the new title.
   * @param {string} title - The new title to be added to the exploration.
   */
  async updateTitleTo(title: string): Promise<void> {
    await this.page.waitForSelector(addTitleBar, {
      visible: true,
    });
    await this.clearAllTextFrom(addTitleBar);
    await this.type(addTitleBar, title);
    await this.page.keyboard.press('Tab');

    const newTitle = await this.page.$eval(addTitleBar, el =>
      (el as HTMLInputElement).value?.trim()
    );

    // Compare first 36 characters of title.
    if (newTitle !== title.slice(0, 36)) {
      throw new Error(
        `Failed to update title. Expected: ${title}, but got: ${newTitle}`
      );
    }

    showMessage(`Title has been updated to ${newTitle}`);
  }

  /**
   * Matches the expected title with current title.
   */
  async expectTitleToBe(expectedTitle: string): Promise<void> {
    await this.page.waitForSelector(explorationTitleSelector);
    const titleInput = await this.page.$(explorationTitleSelector);
    const currentTitle = await this.page.evaluate(
      input => input.value,
      titleInput
    );

    if (expectedTitle === currentTitle) {
      showMessage('Title matches the expected title.');
    } else {
      throw new Error('Failed to update changes.');
    }
  }

  /**
   * This function Waits for the autosave indicator to appear and then disappear.
   */
  async waitForAutosaveIndicator(): Promise<void> {
    await this.page.waitForSelector(autoSaveIndicator, {
      visible: true,
    });
    await this.page.waitForSelector(autoSaveIndicator, {
      hidden: true,
    });
  }

  /**
   * Clears previous goal and adds a new goal in the exploration.
   */
  async updateGoalTo(goal: string): Promise<void> {
    await this.page.waitForSelector(addGoalInputBox, {
      visible: true,
    });
    await this.clickOn(addGoalInputBox);
    await this.clearAllTextFrom(addGoalInputBox);
    await this.type(addGoalInputBox, goal);
    await this.page.keyboard.press('Tab');

    const addGoalInput = await this.page.$(addGoalInputBox);
    const newGoal = await this.page.evaluate(
      input => input.value,
      addGoalInput
    );
    if (!newGoal || newGoal !== goal) {
      throw new Error(
        `Failed to update goal. Expected: ${goal}, but got: ${newGoal}`
      );
    }
    showMessage(`Goal has been updated to ${goal}`);
  }

  /**
   * Matches the goal with expected goal.
   */
  async expectGoalToBe(expectedGoal: string): Promise<void> {
    try {
      const goalInput = await this.page.$('#explorationObjective');
      if (!goalInput) {
        throw new Error('Goal input element not found.');
      }

      const goal = await this.page.evaluate(input => input.value, goalInput);

      if (goal === expectedGoal) {
        showMessage('The goal has been set for the exploration.');
      } else {
        throw new Error('The goal does not match the expected goal.');
      }
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  }

  /**
   * Selects a category from dropdown. For Eg. Algebra, Biology, Chemistry etc.
   */
  async selectCategory(category: string): Promise<void> {
    await this.page.waitForSelector(categoryDropdown, {
      visible: true,
    });
    await this.clickOn(categoryDropdown);
    await this.clickOn(category);
    await this.expectSelectedCategoryToBe(category);
  }

  /**
   * Checks if the category matches the expected category.
   */
  async expectSelectedCategoryToBe(expectedCategory: string): Promise<void> {
    await this.page.waitForSelector('.mat-select-value');
    const selectedCategory = await this.page.evaluate(() => {
      return (
        document.querySelector('.mat-select-value') as HTMLElement
      ).innerText.trim();
    });
    if (selectedCategory === expectedCategory) {
      showMessage(
        `The category ${selectedCategory} is same as expectedCategory.`
      );
    } else {
      throw new Error('Category is not correct.');
    }
  }

  /**
   * Select language in language selection dropdown.
   * @param language - The language to select.
   */
  async selectLanguage(language: string): Promise<void> {
    // The language dropdown was visible, but it was mostly hidden towards the bottom
    // of the screen. When we clicked on the dropdown, the options did not fully appear,
    // leading to incorrect selections.To prevent this, we are now scrolling the page.
    // We can use 300 - 500px to move the language dropdown to the upper part of the page.
    await this.page.evaluate(() => {
      window.scrollTo(0, 350);
    });

    await this.page.waitForSelector(languageUpdateDropdown, {
      visible: true,
    });
    await this.clickOn(languageUpdateDropdown);
    await this.clickOn(language);
    await this.page.waitForNetworkIdle();

    await this.expectSelectedLanguageToBe(language);
    showMessage(`Language has been set to ${language}.`);
  }

  async selectFirstCard(cardName: string): Promise<void> {
    await this.updateMatOption(firstCardSettingsSelector, cardName);
  }

  /**
   *  Verifies that the selected language matches the expected language.
   */
  async expectSelectedLanguageToBe(expectedLanguage: string): Promise<void> {
    await this.page.waitForSelector(languageDropdownValueSelector, {
      visible: true,
    });

    const selectedLanguage = await this.page.evaluate(selector => {
      const element = document.querySelector(selector) as HTMLElement;
      return element?.innerText.trim() ?? '';
    }, languageDropdownValueSelector);

    if (selectedLanguage.includes(expectedLanguage)) {
      showMessage(
        `The language ${selectedLanguage} contains the expected language.`
      );
    } else {
      throw new Error(
        `Expected language: ${expectedLanguage}, but found: "${selectedLanguage}".`
      );
    }
  }

  /**
   * Verifies that the first card name matches the expected first card name.
   * @param {string} expectedCardName - The expected first card name.
   */
  async expectSelectedFirstCardToBe(expectedCardName: string): Promise<void> {
    await this.expectElementToBeVisible(firstCardSettingsSelector);
    await this.expectTextContentToBe(
      firstCardSettingsSelector,
      expectedCardName
    );
  }

  /**
   * Adds tags.
   * @param tagNames - List of tags to add
   */
  async addTags(tagNames: string[]): Promise<void> {
    await this.page.waitForSelector(addTagsInputBox, {
      visible: true,
    });
    for (let i = 0; i < tagNames.length; i++) {
      await this.clickOn(addTagsInputBox);
      await this.type(addTagsInputBox, tagNames[i].toLowerCase());
      await this.page.keyboard.press('Tab');
    }

    await this.expectTagsToMatch(tagNames);
  }

  /**
   * Checks if the given tags exists in the tags list.
   * @param expectedTags - List of tags that should to visible.
   */
  async expectTagsToMatch(expectedTags: string[]): Promise<void> {
    // When adding a tag in the exploration settings UI, it gets auto-converted
    // to lowercase by the input field.
    const lowercaseExpectedTags = expectedTags.map(tag => tag.toLowerCase());
    await this.page.waitForSelector('mat-chip-list');
    const observedTags = await this.page.evaluate(() => {
      const tagElements = Array.from(document.querySelectorAll('mat-chip'));
      return tagElements
        .map(tag => {
          const textContent =
            tag.querySelector('.mat-chip-remove')?.previousSibling?.textContent;
          return textContent ? textContent.trim() : '';
        })
        .filter(Boolean);
    });

    for (const expectedTag of lowercaseExpectedTags) {
      if (!observedTags.includes(expectedTag)) {
        throw new Error(`Tag "${expectedTag}" was not added.`);
      }
    }

    showMessage('All expected tags were added successfully.');
  }

  /**
   * Clicks on "Preview Summary" button and waits for the preview summary to be visible.
   */
  async previewSummary(): Promise<void> {
    await this.page.waitForSelector(previewSummaryButton, {
      visible: true,
    });
    await this.clickOn(previewSummaryButton);
    await this.expectPreviewSummaryToBeVisible();
  }

  /**
   * Closes preview summary modal by clicking on the "Return to editor" button.
   */
  async closePreviewSummary(): Promise<void> {
    await this.clickOn(dismissPreviewButton);
    await this.page.waitForSelector(dismissPreviewButton, {
      hidden: true,
    });
  }

  /**
   * Allows you to preview the summary of exploration.
   */
  async previewAndCloseSummary(): Promise<void> {
    await this.previewSummary();
    await this.closePreviewSummary();
  }

  /**
   * Verifies that the preview summary is visible.
   */
  async expectPreviewSummaryToBeVisible(): Promise<void> {
    await this.page.waitForSelector(dismissPreviewButton);
    const previewSummary = await this.page.$(dismissPreviewButton);

    if (previewSummary) {
      showMessage('Preview summary is visible.');
    } else {
      throw new Error('Preview summary is not visible.');
    }
  }

  /**
   * Enables Automatic Text-to-Speech switch present in settings tab.
   */
  async enableAutomaticTextToSpeech(): Promise<void> {
    await this.expandSettingsTabSection('Advanced Features');
    await this.page.waitForSelector(textToSpeechToggle, {
      visible: true,
    });
    await this.clickOn(textToSpeechToggle);
    await this.expectAutomaticTextToSpeechToBeEnabled();
  }

  /**
   * Checks whether the Automatic Text-to-Speech setting is enabled or disabled.
   */
  async expectAutomaticTextToSpeechToBeEnabled(): Promise<void> {
    await this.page.waitForSelector('#text-speech-switch');
    const autoTtsSwitch = await this.page.$('#text-speech-switch');
    const autoTtsSwitchIsOn = await this.page.evaluate(
      switchElement => switchElement.checked,
      autoTtsSwitch
    );
    if (autoTtsSwitchIsOn) {
      showMessage('Automatic Text-to-Speech is enabled.');
    } else {
      throw error('Automatic Text-to-Speech is disabled.');
    }
  }

  /**
   * Assigns a role of manager to any guest user.
   */
  async assignUserToManagerRole(username: string): Promise<void> {
    await this.page.waitForSelector(editRolesButtonSelector, {
      visible: true,
    });
    await this.clickOn(editRoleButton);
    await this.clickOn(addUsernameInputBox);
    await this.type(addUsernameInputBox, username);
    await this.clickOn(addRoleDropdown);
    const [managerOption] = await this.page.$x(
      "//mat-option[contains(., 'Manager (can edit permissions)')]"
    );
    await managerOption.click();
    await this.page.waitForSelector(tagFilterDropdownSelector, {
      hidden: true,
    });
    await this.clickOn(saveRoleButton);
    await this.page.waitForSelector(saveRoleButton, {hidden: true});
    showMessage(`${username} has been added as manager role.`);
  }

  /**
   * Assigns a role of collaborator to any guest user.
   */
  async assignUserToCollaboratorRole(username: string): Promise<void> {
    await this.page.waitForSelector(editRolesButtonSelector, {
      visible: true,
    });
    await this.clickOn(editRoleButton);
    await this.clickOn(addUsernameInputBox);
    await this.type(addUsernameInputBox, username);
    await this.clickOn(addRoleDropdown);
    await this.clickOn(collaboratorRoleOption);
    await this.waitForElementToStabilize(saveRoleButton);
    await this.clickOn(saveRoleButton);
    await this.page.waitForSelector(saveRoleButton, {hidden: true});
    showMessage(`${username} has been added as collaboratorRole.`);
  }

  /**
   * Assigns a role of Playtester to any guest user.
   */
  async assignUserToPlaytesterRole(username: string): Promise<void> {
    await this.page.waitForSelector(editRolesButtonSelector, {
      visible: true,
    });
    await this.clickOn(editRoleButton);
    await this.page.waitForSelector('.e2e-test-editor-role-names', {
      visible: true,
    });
    await this.clickOn(addUsernameInputBox);
    await this.type(addUsernameInputBox, username);
    await this.clickOn(addRoleDropdown);
    await this.clickOn(playtesterRoleOption);
    await this.clickOn(saveRoleButton);
    await this.page.waitForSelector(saveRoleButton, {hidden: true});
    showMessage(`${username} has been added as playtester.`);
  }

  /**
   * Verifies the presence of the publish button.
   */
  async expectExplorationToBePublished(): Promise<void> {
    let publishButtonSelector = '.e2e-test-publish-exploration';
    if (this.isViewportAtMobileWidth()) {
      publishButtonSelector = mobilePublishButtonSelector;
      await this.clickOn(mobileChangesDropdownSelector);
    }
    const publishButton = await this.page.$(publishButtonSelector);
    if (!publishButton) {
      showMessage(
        'Exploration is set to Public and is accessible to Oppia users.'
      );
    } else {
      throw new Error(
        'Exploration is set to Private and is not accessible to Oppia users.'
      );
    }
  }

  /**
   * Choose notification type by enabling/disabling the feedback toggle.
   */
  async optInToEmailNotifications(): Promise<void> {
    await this.page.waitForSelector(feedbackToggle, {
      visible: true,
    });
    await this.clickOn(feedbackToggle);
    await this.expectEmailNotificationsToBeActivated();
  }

  /**
   * Verifies the choice of receiving feedback and suggestion notifications via email.
   */
  async expectEmailNotificationsToBeActivated(): Promise<void> {
    await this.page.waitForSelector('input[id="suggestion-switch"]');
    const input = await this.page.$('input[id="suggestion-switch"]');

    if (!input) {
      throw new Error('Suggestion switch input element not found.');
    }
    const suggestionSwitchIsActive = await input.evaluate(
      input => (input as HTMLInputElement).checked
    );

    if (suggestionSwitchIsActive) {
      showMessage('suggestion notifications via email are enabled.');
    } else {
      throw new Error('suggestion notifications via email are disabled.');
    }
  }

  /**
   * Function to save an exploration draft.
   * @param commitMessage - The commit message text to be saved.
   */
  async saveExplorationDraft(
    commitMessage: string = 'Testing Testing'
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.page.waitForSelector(mobileOptionsButtonSelector, {
          visible: true,
        });
        await this.clickOn(mobileOptionsButtonSelector);
      }

      await this.page.waitForSelector(
        `${mobileSaveChangesButtonSelector}:not([disabled])`,
        {visible: true}
      );
      await this.clickOn(mobileSaveChangesButtonSelector);
    } else {
      await this.page.waitForSelector(saveChangesButton, {
        visible: true,
      });
      await this.clickOn(saveChangesButton);
    }
    // We skip the commit message if it's an empty string.
    if (commitMessage) {
      await this.clickOn(commitMessageSelector);
      await this.type(commitMessageSelector, commitMessage);
    }
    await this.clickOn(saveDraftButton);
    await this.page.waitForSelector(saveDraftButton, {hidden: true});

    // Toast message confirms that the draft has been saved.
    await this.page.waitForSelector(toastMessage, {
      visible: true,
    });
    await this.page.waitForSelector(toastMessage, {
      hidden: true,
    });
    showMessage('Exploration is saved successfully.');
    await this.waitForPageToFullyLoad();
  }

  /**
   * Publishes an exploration.
   */
  async publishExploration(): Promise<string | null> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileChangesDropdownSelector, {
        visible: true,
      });
      await this.clickOn(mobileChangesDropdownSelector);
      await this.clickOn(mobilePublishButtonSelector);
    } else {
      await this.page.waitForSelector(publishExplorationButtonSelector, {
        visible: true,
      });
      await this.clickOn(publishExplorationButtonSelector);
    }
    await this.clickOn(explorationConfirmPublishButton);
    await this.page.waitForSelector(closePublishedPopUpButton, {visible: true});

    const explorationUrlAfterPublished = await this.page.url();
    let explorationId = explorationUrlAfterPublished
      .replace(/^.*\/create\//, '')
      .replace(/#\/.*/, '');

    await this.clickOn(closePublishedPopUpButton);
    await this.expectExplorationToBePublished();

    return explorationId;
  }

  /**
   * Discards the current changes.
   */
  async discardCurrentChanges(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileChangesDropdownSelector, {
        visible: true,
      });
      await this.clickOn(mobileChangesDropdownSelector);
      await this.clickOn(mobileDiscardButtonSelector);
    } else {
      await this.page.waitForSelector(discardDraftDropdownSelector, {
        visible: true,
      });
      await this.clickOn(discardDraftDropdownSelector);
      await this.page.waitForSelector(desktopDiscardDraftButton, {
        visible: true,
      });
      await this.clickOn(desktopDiscardDraftButton);
    }
    await this.page.waitForSelector(confirmDiscardButton, {
      visible: true,
    });
    await this.clickAndWaitForNavigation(confirmDiscardButton);
    await this.waitForStaticAssetsToLoad();
    await this.expectElementToBeVisible(confirmDiscardButton, false);
  }

  /**
   * Function to display the Oppia responses section.
   */
  async viewOppiaResponses(): Promise<void> {
    await this.page.waitForSelector(stateResponsesSelector, {
      visible: true,
    });
    await this.clickOn(stateResponsesSelector);
    await this.page.waitForSelector(oppiaFeebackEditorContainerSelector, {
      visible: true,
    });
  }

  /**
   * Function to select the card that learners will be directed to from the current card.
   * @param {string} cardName - The name of the card to which learners will be directed.
   */
  async directLearnersToNewCard(cardName: string): Promise<void> {
    await this.page.waitForSelector(openOutcomeDestButton, {
      visible: true,
    });
    await this.clickOn(openOutcomeDestButton);
    await this.waitForElementToBeClickable(destinationCardSelector);
    // The '/' value is used to select the 'a new card called' option in the dropdown.
    await this.select(destinationCardSelector, '/');
    await this.type(addStateInput, cardName);
    await this.clickOn(saveOutcomeDestButton);
    await this.page.waitForSelector(saveOutcomeDestButton, {
      hidden: true,
    });
  }

  /**
   * Updates direct learners option when changing cards.
   * @param cardName - The ard name where learners should be directed.
   */
  async directLearnersToAlreadyExistingCard(cardName: string): Promise<void> {
    await this.page.waitForSelector(openOutcomeDestButton, {
      visible: true,
    });
    await this.clickOn(openOutcomeDestButton);
    await this.waitForElementToBeClickable(destinationCardSelector);
    await this.select(destinationCardSelector, cardName);
    await this.clickOn(saveOutcomeDestButton);
    await this.page.waitForSelector(saveOutcomeDestButton, {
      hidden: true,
    });
  }

  /**
   * Opens the exploration state graph in mobile view.
   */
  async openExplorationStateGraphInMobileView(): Promise<void> {
    await this.expectElementToBeVisible(mobileStateGraphResizeButton);
    await this.clickOn(mobileStateGraphResizeButton);
    await this.expectElementToBeVisible(explorationStateGraphModalSelector);
  }

  /**
   * Function to navigate to a specific card in the exploration.
   * @param {string} cardName - The name of the card to navigate to.
   */
  async navigateToCard(cardName: string, retry: boolean = true): Promise<void> {
    let elements;
    if (this.isViewportAtMobileWidth()) {
      await this.page.waitForSelector(mobileStateGraphResizeButton, {
        visible: true,
      });
      await this.clickOn(mobileStateGraphResizeButton);
    }

    await this.page.waitForSelector(stateNodeSelector);
    elements = await this.page.$$(stateNodeSelector);

    const cardNames = await Promise.all(
      elements.map(element =>
        element.$eval('tspan', node => node.textContent?.trim() || '')
      )
    );
    const cardIndex = cardNames.indexOf(cardName);

    if (cardIndex === -1) {
      throw new Error(`Card name ${cardName} not found in the graph.`);
    }

    let cardButton: ElementHandle<Element> | null = null;
    if (this.isViewportAtMobileWidth()) {
      cardButton = elements[cardIndex + elements.length / 2];
    } else {
      cardButton = elements[cardIndex];
    }

    if (!cardButton) {
      throw new Error(`Could not find card button for card: ${cardName}`);
    }

    await cardButton.click();
    await this.waitForNetworkIdle({idleTime: 1000});

    const headingName = !cardName.trimEnd().endsWith('...')
      ? cardName
      : cardName.trimEnd().slice(0, -3);
    try {
      await this.page.waitForFunction(
        (selector: string, value: string) => {
          const element = document.querySelector(selector);
          return element?.textContent?.includes(value);
        },
        {},
        currentCardNameContainerSelector,
        headingName
      );
    } catch (error) {
      if (retry) {
        showMessage(`Unable to navigate to the card ${cardName}. Retrying...`);
        await this.navigateToCard(cardName, false);
      } else {
        error.message =
          `Unable to navigate to the card ${cardName}.\n` + error.message;
        throw error;
      }
    }
  }

  /**
   * Function to update the default response feedback for a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   */
  async updateDefaultResponseFeedbackInExplorationEditorPage(
    defaultResponseFeedback: string
  ): Promise<void> {
    await this.page.waitForSelector(openOutcomeFeedBackEditor, {
      visible: true,
    });
    await this.clickOn(openOutcomeFeedBackEditor);
    await this.clickOn(stateContentInputField);
    await this.type(stateContentInputField, defaultResponseFeedback);
    await this.clickOn(saveOutcomeFeedbackButton);

    await this.page.waitForSelector(saveOutcomeDestButton, {
      hidden: true,
    });
  }

  // TODO(#22539): This function has a duplicate in exploration-editor.ts.
  // To avoid unexpected behavior, ensure that any modifications here are also
  // made in editDefaultResponseFeedbackInQuestionEditorPage() in question-submitter.ts.
  /**
   * Function to add feedback for default responses of a state interaction.
   * @param {string} defaultResponseFeedback - The feedback for the default responses.
   * @param {string} [directToCard] - The card to direct to (optional).
   * @param {string} [directToCardWhenStuck] - The card to direct to when the learner is stuck (optional).
   */
  async editDefaultResponseFeedbackInExplorationEditorPage(
    defaultResponseFeedback: string,
    directToCard?: string,
    directToCardWhenStuck?: string
  ): Promise<void> {
    await this.page.waitForSelector(defaultFeedbackTab, {
      visible: true,
    });
    await this.clickOn(defaultFeedbackTab);

    if (defaultResponseFeedback) {
      await this.updateDefaultResponseFeedbackInExplorationEditorPage(
        defaultResponseFeedback
      );
    }

    if (directToCard) {
      await this.clickOn(openOutcomeDestButton);
      await this.page.select(destinationSelectorDropdown, directToCard);
      await this.page.click(saveDestinationButtonSelector);
      await this.expectElementToBeVisible(saveDestinationButtonSelector, false);
    }

    if (directToCardWhenStuck) {
      await this.clickOn(outcomeDestWhenStuckSelector);
      // The '4: /' value is used to select the 'a new card called' option in the dropdown.
      await this.select(destinationWhenStuckSelectorDropdown, '4: /');
      await this.type(addDestinationStateWhenStuckInput, directToCardWhenStuck);
      await this.page.click(saveStuckDestinationButtonSelector);
      await this.expectElementToBeVisible(
        saveStuckDestinationButtonSelector,
        false
      );
    }
  }

  /**
   * Function to add a solution for a state interaction.
   * @param {string} answer - The solution of the current state card.
   * @param {string} answerExplanation - The explanation for this state card's solution.
   * @param {boolean} isSolutionNumericInput - Whether the solution is for a numeric input interaction.
   */
  async addSolutionToState(
    answer: string,
    answerExplanation: string,
    isSolutionNumericInput: boolean
  ): Promise<void> {
    const solutionSelector = isSolutionNumericInput
      ? solutionInputNumeric
      : solutionInputTextArea;
    await this.page.waitForSelector(stateSolutionTab, {visible: true});
    await this.clickOn(addSolutionButton);
    await this.page.waitForSelector(solutionSelector, {visible: true});
    await this.type(solutionSelector, answer);
    await this.page.waitForSelector(`${submitAnswerButton}:not([disabled])`);
    await this.clickOn(submitAnswerButton);
    await this.addSolutionExplanationAndSave(answerExplanation);
  }

  /**
   * Adds a solution explanation to the current state card and saves it.
   * @param explanation - The solution explanation to add to the state card.
   */
  async addSolutionExplanationAndSave(explanation: string): Promise<void> {
    await this.type(stateContentInputField, explanation);
    await this.page.waitForSelector(`${submitSolutionButton}:not([disabled])`);
    await this.clickOn(submitSolutionButton);
    await this.page.waitForSelector(submitSolutionButton, {
      hidden: true,
    });
  }

  /**
   * Update the solution explanation of the current state card.
   * @param explanation - Updated solution explanation for the state card.
   */
  async updateSolutionExplanation(explanation: string): Promise<void> {
    await this.page.waitForSelector(stateSolutionTab, {visible: true});
    await this.clickOn(stateSolutionTab);
    await this.clickOn(editStateSolutionExplanationSelector);
    await this.type(stateContentInputField, explanation);
    await this.clickOn(saveSolutionEditButton);
    await this.page.waitForSelector(saveSolutionEditButton, {
      hidden: true,
    });
  }

  /**
   * Sets a state as a checkpoint in the exploration.
   */
  async setTheStateAsCheckpoint(): Promise<void> {
    await this.page.waitForSelector(setAsCheckpointButton, {
      visible: true,
    });

    let checkboxState = await this.page.$eval(
      `${setAsCheckpointButton} input.mat-checkbox-input`,
      el => (el as HTMLInputElement).checked
    );

    if (!checkboxState) {
      await this.clickOn(setAsCheckpointButton);
    }

    // Check checkbox value again and throw error if it's still not checked.
    checkboxState = await this.page.$eval(
      `${setAsCheckpointButton} input.mat-checkbox-input`,
      el => (el as HTMLInputElement).checked
    );

    if (!checkboxState) {
      throw new Error('Failed to set the state as a checkpoint.');
    }
  }

  /**
   * Function to add a hint for a state card.
   * @param {string} hint - The hint to be added for the current card.
   */
  async addHintToState(hint: string): Promise<void> {
    await this.page.waitForSelector(addHintButton, {
      visible: true,
    });
    await this.clickOn(addHintButton);
    await this.type(stateContentInputField, hint);
    await this.clickOn(saveHintButton);
    await this.page.waitForSelector(saveHintButton, {
      hidden: true,
    });
  }

  /**
   * Function to edit a hint for a state card.
   * @param hint - The updated hint content for the current card.
   */
  async updateHint(hint: string): Promise<void> {
    await this.page.waitForSelector(stateHintTab, {
      visible: true,
    });
    await this.clickOn(stateHintTab);
    await this.clickOn(editStateHintSelector);
    await this.type(stateContentInputField, hint);
    await this.clickOn(saveHintEditButton);
    await this.page.waitForSelector(saveHintEditButton, {
      hidden: true,
    });
  }

  /**
   * Tag an answer response group with a misconception for a state card.
   * @param responseIndex - The index of the response group to be tagged.
   * @param misconceptionName - The name of the misconception to tag response with.
   * @param isOptional - Whether the misconception is optional or compulsory.
   */
  async tagAnswerGroupWithMisconception(
    responseIndex: number,
    misconceptionName: string,
    isOptional: boolean
  ): Promise<void> {
    let expectedTitle = !isOptional
      ? misconceptionName
      : `(Optional) ${misconceptionName}`;
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(responseGroupDiv);
      // If the responses were collapsed in mobile view.
      if (!element) {
        await this.clickOn(toggleResponseTab);
      }
    }
    await this.page.waitForSelector(responseGroupDiv, {
      visible: true,
    });
    let responseTabs = await this.page.$$(responseGroupDiv);

    await responseTabs[responseIndex].click();
    await this.clickOn('Tag with misconception');

    await this.page.waitForSelector(misconceptionTitle, {
      timeout: 5000,
      visible: true,
    });
    const misconceptionTitles = await this.page.$$(misconceptionTitle);
    for (const misconceptionTitle of misconceptionTitles) {
      const title = await this.page.evaluate(
        el => el.textContent,
        misconceptionTitle
      );
      if (title.trim() === expectedTitle) {
        await misconceptionTitle.click();
      }
    }

    await this.clickOn('Done');
    await this.page.waitForSelector(leaveTranslationsAsIsButton, {
      visible: true,
    });
    await this.clickOn(leaveTranslationsAsIsButton);
    await this.page.waitForSelector(leaveTranslationsAsIsButton, {
      hidden: true,
    });
  }

  /**
   * Replace a misconception tagged to a response group with a new one.
   * @param responseIndex - The index of the response group to change.
   * @param misconceptionName - The name of the new misconception to be tagged.
   * @param isOptional - Whether the new misconception is optional or not.
   */
  async changeTaggedAnswerGroupMisconception(
    responseIndex: number,
    misconceptionName: string,
    isOptional: boolean
  ): Promise<void> {
    let expectedTitle = !isOptional
      ? misconceptionName
      : `(Optional) ${misconceptionName}`;
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(responseGroupDiv);
      // If the responses were collapsed in mobile view.
      if (!element) {
        await this.clickOn(toggleResponseTab);
      }
    }
    await this.page.waitForSelector(responseGroupDiv, {
      visible: true,
    });
    let responseTabs = await this.page.$$(responseGroupDiv);
    await responseTabs[responseIndex].click();
    await this.clickOn(misconceptionEditorTab);
    await this.page.waitForSelector(misconceptionTitle, {
      timeout: 5000,
      visible: true,
    });
    const misconceptionTitles = await this.page.$$(misconceptionTitle);
    for (const misconceptionTitle of misconceptionTitles) {
      const title = await this.page.evaluate(
        el => el.textContent,
        misconceptionTitle
      );
      if (title.trim() === expectedTitle) {
        await misconceptionTitle.click();
      }
    }
    await this.clickOn('Save Misconception');
    await this.page.waitForSelector(leaveTranslationsAsIsButton, {
      visible: true,
    });
    await this.clickOn(leaveTranslationsAsIsButton);
    await this.page.waitForSelector(leaveTranslationsAsIsButton, {
      hidden: true,
    });
  }

  /**
   * Verifies if a misconception is present on the page.
   * @param {string} misconceptionName - The name of the misconception to verify.
   * @param {boolean} isPresent - Whether the misconception is expected to be present.
   */
  async verifyMisconceptionPresentForState(
    misconceptionName: string,
    isPresent: boolean
  ): Promise<void> {
    try {
      if (this.isViewportAtMobileWidth()) {
        const element = await this.page.$(responseGroupDiv);
        // If the responses were collapsed in mobile view.
        if (!element) {
          await this.clickOn(toggleResponseTab);
        }
      }
      await this.page.waitForSelector(misconceptionDiv, {
        timeout: 5000,
        visible: true,
      });
      const misconceptions = await this.page.$$(misconceptionDiv);

      for (const misconception of misconceptions) {
        const title = await this.page.evaluate(
          el => el.textContent,
          misconception
        );
        if (title.trim() === misconceptionName) {
          if (!isPresent) {
            throw new Error(
              `The misconception ${misconceptionName} is present, should be absent.`
            );
          }
          return;
        }
      }

      if (isPresent) {
        throw new Error(
          `The misconception ${misconceptionName} is not present.`
        );
      }
    } catch (error) {
      if (isPresent) {
        throw new Error('No misconceptions found.');
      }
    }

    showMessage(
      `The misconception is ${isPresent ? '' : 'not'} present as expected.`
    );
  }

  /**
   * Toggles the applicability status of an optional misconception.
   * @param misconceptionName - The name of the misconception to be toggled.
   */
  async toggleMisconceptionApplicableStatus(
    misconceptionName: string
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(responseGroupDiv);
      // If the responses were collapsed in mobile view.
      if (!element) {
        await this.clickOn(toggleResponseTab);
      }
    }
    await this.page.waitForSelector(optionalMisconceptionDiv, {
      timeout: 5000,
      visible: true,
    });
    let misconceptions = await this.page.$$(optionalMisconceptionDiv);
    let misconceptionFound = false;
    for (const misconception of misconceptions) {
      const optionalMisconceptionName = await misconception.evaluate(el =>
        el.textContent?.trim()
      );
      if (optionalMisconceptionName?.startsWith(misconceptionName)) {
        const misconceptionOptions = await misconception.$(
          optionalMisconceptionOptionsButton
        );
        if (!misconceptionOptions) {
          throw new Error(
            `Options not found for misconception "${misconceptionName}"`
          );
        }
        await misconceptionOptions.click();
        await this.page.waitForSelector(misconceptionApplicableToggle, {
          visible: true,
        });
        await this.clickOn(misconceptionApplicableToggle);
        misconceptionFound = true;
        break;
      }
    }
    if (!misconceptionFound) {
      throw new Error(
        `Couldn't find misconception with name ${misconceptionName}.`
      );
    }
  }

  /**
   * Verifies whether a given optional misconception is applicable or not.
   * @param misconceptionName - The name of the misconception to be verified.
   * @param isApplicable - The expected applicability status of the misconception.
   */
  async verifyOptionalMisconceptionApplicableStatus(
    misconceptionName: string,
    isApplicable: boolean
  ): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(responseGroupDiv);
      // If the responses were collapsed in mobile view.
      if (!element) {
        await this.clickOn(toggleResponseTab);
      }
    }
    if (!isApplicable) {
      await this.page.waitForSelector(inapplicableMisconceptionDiv);
    }

    const inapplicableMisconceptions = await this.page.$$(
      inapplicableMisconceptionDiv
    );

    for (const misconception of inapplicableMisconceptions) {
      const title = await this.page.evaluate(
        el => el.textContent.trim(),
        misconception
      );
      if (title === misconceptionName && !isApplicable) {
        return;
      } else if (title.startsWith(misconceptionName) && isApplicable) {
        // We use startsWith since misconception title divs can have an icon at
        // the end indicating that the misconception needs to be addressed.
        throw new Error(
          `The misconception ${misconceptionName} is expected to be applicable, found not applicable.`
        );
      }
    }

    showMessage(
      `The misconception is ${isApplicable ? '' : 'not'} applicable as expected.`
    );
  }

  /**
   * Function to navigate to the preview tab.
   */
  async navigateToPreviewTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.waitForPageToFullyLoad();
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.page.waitForSelector(mobileOptionsButtonSelector, {
          visible: true,
        });
        await this.clickOn(mobileOptionsButtonSelector);
      }

      // Check if dropdown is open or not, if open skip clicking on dropdown.
      const isDropdownOpen = await this.isElementVisible(
        `${mobileNavbarPane}.show`
      );

      // Open dropdown if not open.
      if (!isDropdownOpen) {
        await this.page.waitForSelector(mobileNavbarDropdown, {
          visible: true,
        });
        await this.clickOn(mobileNavbarDropdown);
        await this.page.waitForTimeout(500);
      }

      // Click on the "Preview" button.
      await this.page.waitForSelector(`${mobileNavbarPane}.show`);
      await this.page.waitForTimeout(500);
      const previewButton = await this.page.waitForSelector(
        mobilePreviewTabButton
      );
      await previewButton?.click();
    } else {
      await this.page.waitForSelector(previewTabButton, {
        visible: true,
      });
      await this.clickOn(previewTabButton);
    }

    await this.expectElementToBeVisible(previewTabContainer);
    await this.waitForPageToFullyLoad();
  }

  /**
   * Function to navigate to the history tab.
   */
  async navigateToHistoryTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.clickOn(mobileNavbarDropdown);
      await this.expectElementToBeVisible(mobileHistoryTabButton);
      await this.clickOn(mobileHistoryTabButton);
    } else {
      await this.clickOn(historyTabButton);
    }

    await this.expectElementToBeVisible(historyTabContentContainerSelector);
  }

  /**
   * Gets the list of existing files for the given version.
   * @param {number} version - The expected version number.
   * @param {boolean} isPublished - Whether the exploration is published.
   * @returns {string[]} - List of matching file names.
   */
  async getExistingVersionFiles(
    version: number,
    isPublished: boolean
  ): Promise<string[]> {
    const filePrefix = isPublished
      ? PUBLISHED_EXPLORATION_ZIP_FILE_PREFIX
      : UNPUBLISHED_EXPLORATION_ZIP_FILE_PREFIX;

    const files = fs.readdirSync(downloadPath);
    return files.filter(file =>
      file.match(new RegExp(`^${filePrefix}${version}( \\(\\d+\\))?\\.zip$`))
    );
  }

  /**
   * Generates the expected filename based on the existing count.
   * @param {number} version - The version number.
   * @param {boolean} isPublished - Whether the exploration is published.
   * @param {number} fileCount - The number of existing files.
   * @returns {string} - The expected filename.
   */
  getExpectedFileName(
    version: number,
    isPublished: boolean,
    fileCount: number
  ): string {
    const filePrefix = isPublished
      ? PUBLISHED_EXPLORATION_ZIP_FILE_PREFIX
      : UNPUBLISHED_EXPLORATION_ZIP_FILE_PREFIX;
    return fileCount === 0
      ? `${filePrefix}${version}.zip`
      : `${filePrefix}${version} (${fileCount}).zip`;
  }

  /**
   * Function to download a specific version of Exploration.
   * @param {number} explorationVersion - The version of the exploration to download.
   * @param {boolean} isExplorationPublished - Whether the Exploration is published.
   */
  async downloadExploration(
    explorationVersion: number,
    isExplorationPublished: boolean
  ): Promise<void> {
    await this.expectElementToBeVisible(historyListContent);
    const historyItems = await this.page.$$(historyListContent);
    for (const historyItem of historyItems) {
      const versionNumberElement = await historyItem.$(historyTableIndex);
      const versionText = await this.page.evaluate(
        element => element.textContent,
        versionNumberElement
      );

      // Check whether the current exploration version matches the given explorationVersion.
      if (parseInt(versionText, 10) === explorationVersion) {
        // Count existing files with same name before downloading.
        const existingFiles = await this.getExistingVersionFiles(
          explorationVersion,
          isExplorationPublished
        );
        const nextNumber = existingFiles.length;
        const expectedFileName = await this.getExpectedFileName(
          explorationVersion,
          isExplorationPublished,
          nextNumber
        );

        const dropdownButton = await historyItem.$(historyListOptions);
        await this.page.evaluate(el => el.click(), dropdownButton);
        await this.page.waitForTimeout(1000);
        const downloadButton = await historyItem.$(downloadExplorationButton);
        await this.page.evaluate(el => el.click(), downloadButton);
        await this.page.waitForTimeout(5000);
        const downloadedFile =
          await this.waitForExplorationDownload(expectedFileName);
        if (downloadedFile) {
          showMessage(`${downloadedFile} file is successfully downloaded`);
          return;
        } else {
          throw new Error(
            `Download failed for Exploration version: ${explorationVersion}`
          );
        }
      }
    }
  }

  /**
   * Waits for a downloaded file to appear and cleans up only the new one.
   * @param {string} expectedFileName - The expected file name.
   * @returns {Promise<string | null>} - The verified file name or null if not found.
   */
  async waitForExplorationDownload(
    expectedFileName: string
  ): Promise<string | null> {
    // Wait for network to be idle after triggering the download.
    await this.page.waitForNetworkIdle();
    const files = fs.readdirSync(downloadPath);
    const downloadedFile =
      files.find(file => file === expectedFileName) || null;
    if (
      downloadedFile &&
      fs.existsSync(path.join(downloadPath, downloadedFile))
    ) {
      fs.unlinkSync(path.join(downloadPath, downloadedFile));
    }
    return downloadedFile;
  }

  /**
   * Function to navigate to the translations tab.
   */
  async navigateToTranslationsTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.clickOn(mobileOptionsButtonSelector);
      }
      await this.page.waitForSelector(mobileNavbarDropdown, {
        visible: true,
      });
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickAndWaitForNavigation(mobileTranslationTabButton);

      // Close dropdown if it doesn't automatically close.
      const isVisible = await this.isElementVisible(
        navigationDropdownInMobileVisibleSelector
      );
      if (isVisible) {
        // We are using page.click as this button might be overlapped by the
        // dropdown. Thus, it will fail with onClick.
        await this.page.click(dropdownToggleIcon);
      }
    } else {
      await this.page.waitForSelector(translationTabButton, {
        visible: true,
      });
      await this.clickAndWaitForNavigation(translationTabButton);
    }

    await this.expectElementToBeVisible(translationTabContainer);
  }

  /**
   * Function to navigate to the editor tab.
   */
  async navigateToEditorTab(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      const element = await this.page.$(mobileNavbarOptions);
      // If the element is not present, it means the mobile navigation bar is not expanded.
      // The option to save changes appears only in the mobile view after clicking on the mobile options button,
      // which expands the mobile navigation bar.
      if (!element) {
        await this.clickOn(mobileOptionsButtonSelector);
      }
      await this.page.waitForSelector(mobileNavbarDropdown, {
        visible: true,
      });
      await this.clickOn(mobileNavbarDropdown);
      await this.page.waitForSelector(mobileNavbarPane);
      await this.clickOn(mobileMainTabButton);

      // Close dropdown if it doesn't automatically close.
      const isVisible = await this.isElementVisible(
        navigationDropdownInMobileVisibleSelector
      );
      if (isVisible) {
        // We are using page.click as this button might be overlapped by the
        // dropdown. Thus, it will fail with onClick.
        await this.page.click(dropdownToggleIcon);
      }
    } else {
      await this.page.waitForSelector(mainTabButton, {
        visible: true,
      });
      await this.clickOn(mainTabButton);
    }

    await this.expectElementToBeVisible(mainTabContainerSelector);
    await this.waitForPageToFullyLoad();
  }

  /**
   * Function to verify if the preview is on a particular card by checking the content of the card.
   * @param {string} cardName - The name of the card to check.
   * @param {string} expectedCardContent - The expected text content of the card.
   */
  async expectPreviewCardContentToBe(
    cardName: string,
    expectedCardContent: string,
    matchCase: boolean = true
  ): Promise<void> {
    await this.page.waitForSelector(stateConversationContent, {
      visible: true,
    });
    const element = await this.page.$(stateConversationContent);
    try {
      await this.page.waitForFunction(
        (element: HTMLElement, value: string, matchCase: boolean) => {
          return (element.innerText.trim() === value.trim()) === matchCase;
        },
        {},
        element,
        expectedCardContent,
        matchCase
      );
    } catch (error) {
      throw new Error(
        `Card content ${matchCase ? 'did not' : 'did'} match expected content.\n` +
          `Original Error: ${error.stack}`
      );
    }
  }

  /**
   * Function to navigate to the next card in the preview tab.
   * @param skipVerification - Whether to skip verification of the card content.
   */
  async continueToNextCard(skipVerification: boolean = false): Promise<void> {
    try {
      await this.page.waitForSelector(nextCardButton, {timeout: 7000});
      await this.clickOn(nextCardButton);
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        await this.clickOn(nextCardArrowButton);
      } else {
        throw error;
      }
    }

    if (skipVerification) {
      return;
    }
    await this.page.waitForSelector(previousCardButton, {
      visible: true,
    });
  }

  /**
   * Function to submit an answer to a form input field.
   *
   * This function first determines the type of the input field in the DOM using the getInputType function.
   * Currently, it only supports 'text', 'number', and 'float' input types. If the input type is anything else, it throws an error.
   * @param {string} answer - The answer to submit.
   */
  async submitAnswer(answer: string): Promise<void> {
    await this.waitForElementToBeClickable(floatFormInput);
    const inputType = await this.getInputType(floatFormInput);

    switch (inputType) {
      case 'text':
      case 'number':
      case 'float':
        await this.page.waitForSelector(floatFormInput);
        await this.page.type(floatFormInput, answer);
        break;
      default:
        throw new Error(`Unsupported input type: ${inputType}`);
    }

    await this.clickOn(submitAnswerButton);
  }

  /**
   * Function to submit an text input answer.
   * @param {string} answer - The answer to submit.
   */
  async submitTextInputAnsswer(answer: string): Promise<void> {
    await this.expectElementToBeVisible(textAreaInputSelector);

    await this.type(textAreaInputSelector, answer);
    await this.expectElementValueToBe(textAreaInputSelector, answer);

    await this.clickOnSubmitAnswerButton();
  }

  /**
   * Function to Get the type of an input field in the DOM.
   * @param {string} selector - The CSS selector for the input field.
   */
  async getInputType(selector: string): Promise<string> {
    const inputField = await this.page.$(selector);
    if (!inputField) {
      throw new Error(`Input field not found for selector: ${selector}`);
    }
    const inputType = (await (
      await inputField.getProperty('type')
    ).jsonValue()) as string;
    return inputType;
  }

  /**
   * Function to verify if the exploration is completed in the preview tab via checking the toast message.
   * @param {string} message - The expected toast message.
   */
  async expectPreviewCompletionToastMessage(message: string): Promise<void> {
    await this.page.waitForSelector(explorationCompletionToastMessage, {
      visible: true,
    });
    const element = await this.page.$(explorationCompletionToastMessage);
    const toastMessage = await this.page.evaluate(
      element => element.textContent,
      element
    );
    if (!toastMessage || !toastMessage.includes(message)) {
      throw new Error('Exploration did not complete successfully');
    }
    showMessage('Exploration has completed successfully');
    await this.page.waitForSelector(explorationCompletionToastMessage, {
      hidden: true,
    });
  }

  /**
   * Verifies that the header in the publish exploration modal matches the expected header.
   * @param {string} expectedHeader - The expected header.
   */
  async expectHeaderInPublishExplorationModalToBe(
    expectedHeader: string
  ): Promise<void> {
    await this.expectElementToBeVisible(
      publishMetadataExplorationHeaderSelector
    );

    await this.expectTextContentToBe(
      publishMetadataExplorationHeaderSelector,
      expectedHeader
    );
  }

  /**
   * Function to restart the preview after it has been completed.
   */
  async restartPreview(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      // If the mobile navigation bar is expanded, it can overlap with the restart button,
      // making it unclickable. So, we check for its presence and collapse it.
      const element = await this.page.$(mobileNavbarOptions);
      if (element) {
        await this.clickOn(mobileOptionsButtonSelector);
      }
    }
    await this.page.waitForSelector(previewRestartButton, {
      visible: true,
    });
    await this.clickOn(previewRestartButton);

    await this.waitForNetworkIdle();
    await this.page.waitForSelector(previousCardButton, {
      hidden: true,
    });
  }

  /**
   * Function for creating an exploration with only EndExploration interaction with given title.
   * @param {boolean} flag - Determines whether to dismiss the welcome modal.
   */
  async createAndPublishAMinimalExplorationWithTitle(
    title: string,
    category: string = 'Algebra',
    flag: boolean = true
  ): Promise<string> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorFromCreatorDashboard();
    if (flag) {
      await this.dismissWelcomeModal();
    }
    await this.createMinimalExploration(
      'Exploration intro text',
      'End Exploration'
    );
    await this.saveExplorationDraft();
    return await this.publishExplorationWithMetadata(
      title,
      'This is Goal here.',
      category
    );
  }

  /**
   * This function creates simple Programming Exploration.
   * Starts at new Exploration Editor Page.
   * Ends at same page, after adding programming interaction and saving the
   * draft.
   */
  async createSimpleProgrammingExploration(): Promise<string | null> {
    // Check if element to add interaction is visible (pre-check)
    await this.page.waitForSelector(stateEditSelector, {
      visible: true,
    });

    await this.createMinimalExploration(
      'This is a test Programming Exploration',
      INTERACTION_TYPES.CODE_EDITOR
    );

    const lastInteraction = 'Last Card';
    await this.waitForElementToBeClickable(destinationCardSelector);
    await this.select(destinationCardSelector, '/');
    await this.type(addStateInput, lastInteraction);
    await this.clickOn(addNewResponseButton);
    await this.clickOn(correctAnswerInTheGroupSelector);

    await this.editDefaultResponseFeedbackInExplorationEditorPage(
      'Wrong Answer. Please try again'
    );
    await this.navigateToCard(lastInteraction);
    await this.createMinimalExploration(
      'This is last card',
      INTERACTION_TYPES.END_EXPLORATION
    );

    await this.saveExplorationDraft();
    const explorationId = await this.publishExplorationWithMetadata(
      'Simple Code Editor',
      'This is goal here',
      'Algebra'
    );

    // Check if publish button is disabled (post-check)
    const publishButton = await this.page.$(saveChangesButton);
    const isDisabled = await this.page.evaluate(
      el => el.disabled,
      publishButton
    );

    if (isDisabled) {
      showMessage('Publish Button is disabled, as expected');
    } else {
      showMessage(
        'Publish Button is enabled and clickable, expected to be disabled'
      );
      throw new Error('Publish Button is enabled and clickable');
    }

    return explorationId;
  }

  /**
   * Function for creating an exploration with two cards.
   * @param {string} explorationTitle - The title of the exploration.
   * @param {string} category - The category of the exploration.,
   * @param {number} numberOfCards - The number of cards to create.
   */
  async createAndPublishExplorationWithCards(
    explorationTitle: string,
    category: string = 'Mathematics',
    numberOfCards: number = 2
  ): Promise<string> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorFromCreatorDashboard();
    await this.dismissWelcomeModal();

    for (let i = 0; i < numberOfCards - 1; i++) {
      await this.updateCardContent(`Content ${i}`);
      await this.addInteraction(INTERACTION_TYPES.CONTINUE_BUTTON);
      await this.viewOppiaResponses();
      await this.directLearnersToNewCard(`Card ${i + 1}`);
      await this.saveExplorationDraft();
      await this.navigateToCard(`Card ${i + 1}`);
    }

    await this.updateCardContent(`Content ${numberOfCards - 1}`);
    await this.addInteraction(INTERACTION_TYPES.END_EXPLORATION);
    await this.saveExplorationDraft();

    const explorationId = await this.publishExplorationWithMetadata(
      explorationTitle,
      `This is ${explorationTitle}\`s goals.`,
      category
    );

    if (explorationId) {
      showMessage('Exploration published successfully');
      return explorationId;
    } else {
      throw new Error('Exploration not published');
    }
  }

  /**
   * Creates and publishes n explorations with cards.
   * @param n - The number of explorations to create and publish.
   * @return A promise that resolves to an array of exploration IDs.
   */
  async createAndPublishExplorationsWithCards(n: number): Promise<string[]> {
    const explorationIds: string[] = [];
    for (let i = 0; i < n; i++) {
      const explorationTitle = `Quick Exploration ${i + 1}`;
      const explorationId =
        await this.createAndPublishAMinimalExplorationWithTitle(
          explorationTitle,
          'Algebra',
          false
        );
      explorationIds.push(explorationId);
    }
    return explorationIds;
  }

  /**
   * This function checks the number of subscribers in the Subscribers tab of the creator dashboard.
   */
  async expectNumberOfSubscribersToBe(subscriberCount: number): Promise<void> {
    await this.page.waitForSelector(subscriberCountLabel);
    const currentSubscriberCount = await this.page.$eval(
      subscriberCountLabel,
      element => element.textContent
    );

    if (
      currentSubscriberCount &&
      parseInt(currentSubscriberCount) === subscriberCount
    ) {
      showMessage(`Number of subscribers is equal to ${subscriberCount}.`);
    } else {
      throw new Error(
        `Number of subscribers is not equal to ${subscriberCount}.`
      );
    }
  }

  /**
   * Function for opening the subscribers tab.
   */
  async openSubscribersTab(): Promise<void> {
    if (this.page.url() !== creatorDashboardPage) {
      await this.navigateToCreatorDashboardPage();
    }

    await this.clickOn(subscriberTabButton);
    await this.page.waitForSelector('.e2e-test-subscription-card');
  }

  /**
   * This function checks whether given user is a subscriber or not.
   */
  async expectUserToBeASubscriber(username: string): Promise<void> {
    let truncatedUsername = username;
    if (username.length > 10) {
      const ellipsis = '...';
      truncatedUsername =
        username.substring(0, 10 - ellipsis.length) + ellipsis;
    }

    const subscribers = await this.page.$$(subscriberCard);

    if (subscribers.length === 0) {
      throw new Error(`User "${username}" is not subscribed.`);
    }

    const subscriberUsername = await subscribers[0].$eval(
      '.e2e-test-subscription-name',
      element => (element as HTMLElement).textContent?.trim()
    );

    if (truncatedUsername === subscriberUsername) {
      showMessage(`User ${username} is a subscriber.`);
    } else {
      throw new Error(`User ${username} is not a subscriber.`);
    }
  }

  /**
   * Navigates to the exploration page and starts playing the exploration.
   * @param {string} explorationId - The ID of the exploration to play.
   */
  async playExploration(explorationId: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({waitUntil: ['load', 'networkidle0']}),
      this.goto(`${baseUrl}/explore/${explorationId}`),
    ]);
  }

  /**
   * Gives feedback on the exploration.
   * @param {string} feedback - The feedback to give on the exploration.
   */
  async giveFeedback(feedback: string, stayAnonymous?: boolean): Promise<void> {
    // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
    // in mobile viewport which is required for testing the feedback messages tab),
    // remove this part of skipping this function for Mobile viewport and make it run in mobile viewport
    // as well. see: https://github.com/oppia/oppia/issues/19443.
    if (process.env.MOBILE === 'true') {
      return;
    }
    await this.page.waitForSelector('nav-options', {visible: true});
    await this.clickOn(feedbackPopupSelector);
    await this.page.waitForSelector(feedbackTextarea, {visible: true});
    await this.type(feedbackTextarea, feedback);

    // If stayAnonymous is true, clicking on the "stay anonymous" checkbox.
    if (stayAnonymous) {
      await this.clickOn(stayAnonymousCheckbox);
    }

    await this.clickOn('Submit');

    try {
      await this.page.waitForFunction(
        'document.querySelector(".oppia-feedback-popup-container") !== null',
        {timeout: 5000}
      );
      showMessage('Feedback submitted successfully');
    } catch (error) {
      throw new Error('Feedback was not successfully submitted');
    }
  }

  /**
   * Function to edit a translation for specific content of the current card.
   * @param {string} language - Language for which the translation has to be added.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint"
   * @param {string} translation - The translation which will be added for the content.
   * @param {number} feedbackIndex - The index of the feedback to edit, since multiple feedback responses exist.
   */
  async editTranslationOfContent(
    language: string,
    contentType: string,
    translation: string,
    feedbackIndex?: number
  ): Promise<void> {
    await this.expectElementToBeVisible(voiceoverLanguageSelector);
    await this.clickOn(voiceoverLanguageSelector);

    await this.expectElementToBeVisible(voiceoverLanguageOptionSelector);
    const languageOptions = await this.page.$$(voiceoverLanguageOptionSelector);

    for (const option of languageOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === language) {
        await option.click();
        break;
      }
    }

    await this.page.waitForSelector(translationModeButton);
    await this.clickOn(translationModeButton);
    const activeContentType = await this.page.$eval(activeTranslationTab, el =>
      el.textContent?.trim()
    );
    if (!activeContentType?.includes(contentType)) {
      showMessage(
        `Switching content type from ${activeContentType} to ${contentType}`
      );
      await this.clickOn(contentType);
    }
    await this.clickOn(editTranslationSelector);
    switch (contentType) {
      case 'Content':
      case 'Hint':
      case 'Solution':
        await this.clickOn(stateContentInputField);
        await this.type(stateContentInputField, translation);
        break;
      case 'Interaction':
        await this.clickOn(stateTranslationEditorSelector);
        await this.type(stateTranslationEditorSelector, translation);
        break;
      case 'Feedback':
        await this.clickOn(`.e2e-test-feedback-${feedbackIndex}`);
        await this.clickOn(editTranslationSelector);
        await this.clickOn(stateContentInputField);
        await this.type(stateContentInputField, translation);
        break;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }
    await this.clickOn(saveTranslationButton);

    await this.waitForNetworkIdle();
    await this.expectElementToBeVisible(saveTranslationButton, false);
  }

  /**
   * Open the "modify existing translations" modal after editing a piece of content that has already been
   * translated, when presented with the choices of what shall be done with the translation.
   */
  async openModifyExistingTranslationsModal(): Promise<void> {
    await this.page.waitForSelector(modifyExistingTranslationsButton, {
      visible: true,
    });
    await this.clickOn(modifyExistingTranslationsButton);
    await this.waitForNetworkIdle();

    await this.page.waitForSelector(modifyTranslationModalSelector, {
      visible: true,
    });
  }

  /**
   * Verify if a particular translation exists in the translation modification modal after opening it.
   * @param languageCode - The language code of the translation to check.
   * @param expectedTranslation - The expected translation for the language to check.
   */
  async verifyTranslationInModifyTranslationsModal(
    languageCode: string,
    expectedTranslation: string
  ): Promise<void> {
    await this.page.waitForSelector(
      `div.e2e-test-translation-${languageCode}`,
      {visible: true}
    );

    const translationElementText = await this.page.evaluate(languageCode => {
      const element = document.querySelector(
        `div.e2e-test-translation-${languageCode}`
      );
      return element ? element.textContent : null;
    }, languageCode);

    if (translationElementText === expectedTranslation) {
      showMessage('The expected translation exists in the modal.');
    } else {
      throw new Error(
        `The expected translation does not exist in the modal. Found "${translationElementText}", expected "${expectedTranslation}"`
      );
    }
  }

  /**
   * Update a specific translation from the "modify translations" modal after it has opened.
   * @param languageCode - The language code for which the translation should be modified.
   * @param contentType - Type of the content such as "Interaction" or "Hint".
   * @param newTranslation - The new translation to be written for the content in given language.
   */
  async updateTranslationFromModal(
    languageCode: string,
    contentType: string,
    newTranslation: string
  ): Promise<void> {
    await this.clickOn(`.e2e-test-${languageCode}-translation-edit`);
    switch (contentType) {
      case 'Content':
      case 'Hint':
      case 'Solution':
      case 'Feedback':
        await this.clickOn(stateContentInputField);
        await this.page.evaluate(selector => {
          document.querySelector(selector).textContent = '';
        }, `${stateContentInputField} p`);
        await this.type(stateContentInputField, newTranslation);
        break;
      case 'Interaction':
        await this.clickOn(stateTranslationEditorSelector);
        await this.page.evaluate(selector => {
          document.querySelector(selector).value = '';
        }, `${textInputField}`);
        await this.type(stateTranslationEditorSelector, newTranslation);
        break;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }

    await this.clickOn(modalSaveButton);
    await this.clickOn(modifyTranslationsModalDoneButton);

    await this.page.waitForSelector(modifyTranslationsModalDoneButton, {
      hidden: true,
    });
    showMessage('Successfully updated translation from modal.');
  }

  /**
   * Verify if a particular translation exists in the translations tab.
   * @param {string} expectedTranslation - The translation which should exist for the content.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint".
   * @param {number} feedbackIndex - The index of the feedback to edit, since multiple feedback responses exist.
   */
  async verifyTranslationInTranslationsTab(
    expectedTranslation: string,
    contentType: string,
    feedbackIndex?: number
  ): Promise<void> {
    let translation: string | null = '';
    await this.navigateToTranslationsTab();
    await this.clickOn(translationModeButton);

    const activeContentType = await this.page.$eval(activeTranslationTab, el =>
      el.textContent?.trim()
    );

    if (!activeContentType?.includes(contentType)) {
      showMessage(
        `Switching content type from ${activeContentType} to ${contentType}`
      );
      await this.clickOn(contentType);
    }

    await this.clickOn(editTranslationSelector);
    switch (contentType) {
      case 'Content':
      case 'Hint':
      case 'Solution':
        translation = await this.page.$eval(
          stateContentInputField,
          el => el.textContent
        );
        break;
      case 'Interaction':
        translation = await this.page.$eval(
          textInputField,
          el => (el as HTMLInputElement).value
        );
        break;
      case 'Feedback':
        await this.clickOn(`.e2e-test-feedback-${feedbackIndex}`);
        await this.clickOn(editTranslationSelector);
        translation = await this.page.$eval(
          stateContentInputField,
          el => el.textContent
        );
        break;
      default:
        throw new Error(`Invalid content type: ${contentType}`);
    }

    if (translation === expectedTranslation) {
      showMessage(
        'The newly updated translation exists in the translations tab.'
      );
    } else {
      throw new Error(
        `The expected translation does not exist in the translations tab. Found "${translation}", expected "${expectedTranslation}"`
      );
    }
  }

  /**
   * Function to add a voiceover for specific content of the current card.
   * @param {string} language - Language for which the voiceover has to be added.
   * @param {string} languageAccent - Language accent for which the voiceover has to be added.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint"
   * @param {string} voiceoverFilePath - The path of the voiceover file which will be added for the content.
   * @param {number} feedbackIndex - The index of the feedback to edit, since multiple feedback responses exist.
   */
  async addVoiceoverToContent(
    language: string,
    languageAccent: string,
    contentType: string,
    voiceoverFilePath: string
  ): Promise<void> {
    await this.waitForPageToFullyLoad();

    const activeContentType = await this.page.$eval(activeTranslationTab, el =>
      el.textContent?.trim()
    );
    if (!activeContentType?.includes(contentType)) {
      showMessage(
        `Switching content type from ${activeContentType} to ${contentType}`
      );
      await this.clickOn(contentType);
    }

    await this.clickOn(voiceoverLanguageSelector);
    await this.page.waitForSelector(voiceoverLanguageOptionSelector);
    const languageOptions = await this.page.$$(voiceoverLanguageOptionSelector);

    for (const option of languageOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === language) {
        await option.click();
        break;
      }
    }

    await this.clickOn(voiceoverLanguageAccentSelector);
    await this.page.waitForSelector(voiceoverLanguageAccentOptionSelector);
    const languageAccentOptions = await this.page.$$(
      voiceoverLanguageAccentOptionSelector
    );

    for (const option of languageAccentOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === languageAccent) {
        await option.click();
        break;
      }
    }

    await this.clickOn(addManualVoiceoverButton);
    await this.uploadFile(voiceoverFilePath);
    await this.waitForElementToStabilize(saveUploadedAudioButton);
    await this.clickOn(saveUploadedAudioButton);
    await this.waitForNetworkIdle();

    await this.page.waitForSelector(saveUploadedAudioButton, {
      hidden: true,
    });
  }

  /**
   * Function to add a voiceover for specific content of the current card.
   * @param {string} language - Language for which the voiceover has to be added.
   * @param {string} languageAccent - Language accent for which the voiceover has to be added.
   * @param {string} contentType - Type of the content such as "Interaction" or "Hint".
   */
  async regenerateVoiceoverForContent(
    language: string,
    languageAccent: string,
    contentType: string
  ): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(activeTranslationTab, {
      visible: true,
    });

    const activeContentType = await this.page.$eval(activeTranslationTab, el =>
      el.textContent?.trim()
    );
    if (!activeContentType?.includes(contentType)) {
      showMessage(
        `Switching content type from ${activeContentType} to ${contentType}`
      );
      await this.clickOn(contentType);
    }

    await this.clickOn(voiceoverLanguageSelector);
    await this.page.waitForSelector(voiceoverLanguageOptionSelector);
    const languageOptions = await this.page.$$(voiceoverLanguageOptionSelector);

    for (const option of languageOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === language) {
        await option.click();
        break;
      }
    }

    await this.clickOn(voiceoverLanguageAccentSelector);
    await this.page.waitForSelector(voiceoverLanguageAccentOptionSelector);
    const languageAccentOptions = await this.page.$$(
      voiceoverLanguageAccentOptionSelector
    );

    for (const option of languageAccentOptions) {
      const textContent = await option.evaluate(
        el => el.textContent?.trim() || ''
      );
      if (textContent === languageAccent) {
        await option.click();
        break;
      }
    }

    await this.clickOn(regenerateAutomaticVoiceoverButton);

    await this.page.waitForSelector(voiceoverConfirmationModalButton, {
      visible: true,
      timeout: 5000,
    });

    await this.clickOn(voiceoverConfirmationModalButton);

    await this.page.waitForSelector(voiceoverConfirmationModalButton, {
      hidden: true,
    });

    showMessage('Voiceover has been successfully regenerated.');
    await this.waitForNetworkIdle();
  }

  /**
   * Function to create and save a new untitled exploration containing only the EndExploration interaction.
   */
  async createAndSaveAMinimalExploration(): Promise<void> {
    await this.navigateToCreatorDashboardPage();
    await this.navigateToExplorationEditorFromCreatorDashboard();
    await this.createMinimalExploration(
      'Exploration intro text',
      'End Exploration'
    );
    await this.saveExplorationDraft();
  }

  /**
   * Function to click on the add solution button.
   */
  async clickOnAddSolutionButton(): Promise<void> {
    await this.clickOn(addSolutionButton);
  }

  /**
   * Function to drag and drop an item in the drag and drop sort solution.
   * @param {number} startX - The starting x coordinate of the item.
   * @param {number} startY - The starting y coordinate of the item.
   * @param {number} endX - The ending x coordinate of the item.
   * @param {number} endY - The ending y coordinate of the item.
   */
  async dragAndDropItem(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Promise<void> {
    await this.page.mouse.move(startX, startY);
    await this.page.waitForTimeout(1000);
    await this.page.mouse.down();
    await this.page.waitForTimeout(1000);
    await this.page.mouse.move(endX, endY, {steps: 10});
    await this.page.waitForTimeout(1000);
    await this.page.mouse.up();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Function to add a drag and drop sort solution.
   * @param {string[]} sortedOptions - The options to sort.
   */
  async addDragAndDropSortSolution(
    sortedOptions: string[],
    explaination: string
  ): Promise<void> {
    await this.clickOnAddSolutionButton();

    await this.page.waitForSelector(dragAndDropItemSelector, {visible: true});
    const solutionModal = await this.getSolutionModal();

    for (let i = 0; i < sortedOptions.length - 1; i++) {
      const option = sortedOptions[i];

      const optionElements = await solutionModal.$$(dragAndDropItemSelector);
      const destinationElement = optionElements[i];

      let sourceElement: puppeteer.ElementHandle<Element> | null = null;

      for (let j = i; j < optionElements.length; j++) {
        const optionText = await optionElements[j].evaluate(el =>
          el.textContent?.trim()
        );
        if (optionText === option) {
          sourceElement = optionElements[j];
          break;
        }
      }

      if (!sourceElement) {
        throw new Error(`Option "${option}" not found.`);
      }

      if (sourceElement === destinationElement) {
        continue;
      }

      await this.waitForElementToStabilize(sourceElement);
      await this.waitForElementToStabilize(destinationElement);

      const sourceBox = await sourceElement.boundingBox();
      const destBox = await destinationElement.boundingBox();

      if (!sourceBox || !destBox) {
        throw new Error(
          'Could not get bounding box for drag-and-drop operation.'
        );
      }

      await this.dragAndDropItem(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2,
        destBox.x + destBox.width / 2,
        destBox.y + destBox.height / 2
      );
    }

    await this.clickOn(submitAnswerButton);

    // Add explaination.
    await this.addSolutionExplanationAndSave(explaination);
  }

  async submitDragAndDropSortAnswer(answerItems: string[]): Promise<void> {
    await this.page.waitForSelector(dragAndDropItemSelector, {visible: true});

    for (let i = 0; i < answerItems.length - 1; i++) {
      const option = answerItems[i];

      const optionElements = await this.page.$$(dragAndDropItemSelector);
      const destinationElement = optionElements[i];

      let sourceElement: puppeteer.ElementHandle<Element> | null = null;

      for (let j = 0; j < optionElements.length; j++) {
        const optionText = await optionElements[j].evaluate(el =>
          el.textContent?.trim()
        );
        if (optionText === option) {
          sourceElement = optionElements[j];
          break;
        }
      }

      if (!sourceElement) {
        throw new Error(`Option "${option}" not found.`);
      }

      const sourceBox = await sourceElement.boundingBox();
      const destBox = await destinationElement.boundingBox();

      if (!sourceBox || !destBox) {
        throw new Error(
          'Could not get bounding box for drag-and-drop operation.'
        );
      }

      await this.dragAndDropItem(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2,
        destBox.x + destBox.width / 2,
        destBox.y + destBox.height / 2
      );
    }

    await this.clickOnSubmitAnswerButton();
  }

  /**
   * Function to verify the average rating and the number of users who submitted ratings.
   * @param {number} expectedRating - The expected average rating.
   * @param {number} expectedUsers - The expected count of users who submitted ratings.
   */
  async expectAverageRatingAndUsersToBe(
    expectedRating: number,
    expectedUsers: number
  ): Promise<void> {
    await this.page.waitForSelector(avarageRatingSelector, {
      visible: true,
    });
    const avarageRating = await this.page.$eval(
      avarageRatingSelector,
      element => parseFloat((element as HTMLElement).innerText.trim())
    );
    if (avarageRating !== expectedRating) {
      throw new Error(
        `Expected average rating to be ${expectedRating}, but found ${avarageRating}.`
      );
    }
    const totalUsersText = await this.page.$eval(
      usersCountInRatingSelector,
      el => (el as HTMLElement).innerText.trim() || ''
    );
    // Extract number from text (e.g., "by 3 users" → 3).
    const totalUsersMatch = totalUsersText.match(/\d+/);
    const totalUsers = totalUsersMatch ? parseInt(totalUsersMatch[0], 10) : 0;
    if (totalUsers !== expectedUsers) {
      throw new Error(
        `Expected ${expectedUsers} users to have submitted ratings, but found only ${totalUsers} instead.`
      );
    }
  }

  /**
   * Function to check the expected number of open feedback entries.
   * @param {number} number - The expected count of open feedback entries.
   */
  async expectOpenFeedbacksToBe(number: number): Promise<void> {
    await this.page.waitForSelector(numberOfOpenFeedbacksSelector, {
      visible: true,
    });
    const numberOfOpenFeedbacks = await this.page.$eval(
      numberOfOpenFeedbacksSelector,
      el => parseInt((el as HTMLElement).innerText.trim(), 10)
    );
    if (numberOfOpenFeedbacks !== number) {
      throw new Error(
        `Expected open feedback count to be ${number}, but found ${numberOfOpenFeedbacks}.`
      );
    }
  }

  /**
   * Function to check the expected total number of plays."
   * @param {number} number - The expected total play count.
   */
  async expectTotalPlaysToBe(number: number): Promise<void> {
    await this.page.waitForSelector(totalPlaysSelector, {
      visible: true,
    });
    const numberOfTotalPlays = await this.page.$eval(totalPlaysSelector, el =>
      parseInt((el as HTMLElement).innerText.trim(), 10)
    );
    if (numberOfTotalPlays !== number) {
      throw new Error(
        `Expected total plays count to be ${number}, but found ${numberOfTotalPlays}.`
      );
    }
  }

  /**
   * Function to check the expected total number of explorations.
   * @param {number} number - The expected count of total explorations.
   */
  async expectNumberOfExplorationsToBe(number: number): Promise<void> {
    await this.page.waitForSelector(explorationSummaryTileTitleSelector, {
      visible: true,
    });
    const titlesOnPage = await this.page.$$eval(
      explorationSummaryTileTitleSelector,
      elements => elements.map(el => el.textContent?.trim() || '')
    );
    const count = titlesOnPage.length;

    if (count !== number) {
      throw new Error(
        `Expected ${number} explorations, but found ${count} instead.`
      );
    }
  }

  /**
   * Function to check the presence and expected number of occurrences of an exploration.
   * @param {string} explorationName - The name of the exploration.
   * @param {number} numberOfOccurrence - The expected occurrence count of the exploration.
   */
  async expectExplorationNameToAppearNTimes(
    explorationName: string,
    numberOfOccurrence: number = 1
  ): Promise<void> {
    await this.page.waitForSelector(explorationSummaryTileTitleSelector, {
      visible: true,
    });

    // Extract all exploration titles.
    const titlesOnPage = await this.page.$$eval(
      explorationSummaryTileTitleSelector,
      elements => elements.map(el => el.textContent?.trim() || '')
    );

    // Count occurrences of the target exploration.
    const count = titlesOnPage.filter(
      title => title === explorationName
    ).length;

    if (numberOfOccurrence === 1 && count !== numberOfOccurrence) {
      throw new Error(`Exploration "${explorationName}" not found.`);
    } else if (count !== numberOfOccurrence) {
      throw new Error(
        `Exploration "${explorationName}" found ${count} times, but expected ${numberOfOccurrence} times.`
      );
    }
  }

  /**
   * Opens an exploration in the editor.
   * @param {string} explorationName - The name of the exploration.
   */
  async openExplorationInExplorationEditor(
    explorationName: string
  ): Promise<void> {
    await this.page.waitForSelector(explorationSummaryTileTitleSelector, {
      visible: true,
    });
    const title = await this.page.$eval(
      explorationSummaryTileTitleSelector,
      el => el.textContent?.trim()
    );

    if (title === explorationName) {
      const explorationTileElement = await this.page.$(
        explorationSummaryTileTitleSelector
      );
      await explorationTileElement?.click();
    } else {
      throw new Error(`Exploration not found: ${explorationName}`);
    }

    await this.waitForNetworkIdle();
    await this.waitForPageToFullyLoad();

    await this.expectElementToBeVisible(
      explorationSummaryTileTitleSelector,
      false
    );
  }

  /**
   * Checks the number of suggestions in the exploration editor.
   * @param {number} expectedNumber - The expected number of suggestions.
   */
  async expectNoOfSuggestionsToBe(expectedNumber: number): Promise<void> {
    await this.page.waitForSelector(feedbackSubjectSelector);
    const feedbackSubjects = await this.page.$$(feedbackSubjectSelector);

    if (feedbackSubjects.length === expectedNumber) {
      showMessage('Number of suggestions matches the expected number.');
    } else {
      throw new Error(
        `Number of suggestions does not match the expected number. Expected: ${expectedNumber}, Found: ${feedbackSubjects.length}`
      );
    }
  }

  /**
   * Views a feedback thread.
   * @param {number} expectedThread - The 1-indexed position of the expected thread.
   */
  async viewFeedbackThread(expectedThread: number): Promise<void> {
    // Reloading to make sure the feedback threads are updated.
    await this.reloadPage();
    await this.page.waitForSelector(feedbackSubjectSelector);
    const feedbackSubjects = await this.page.$$(feedbackSubjectSelector);

    if (expectedThread > 0 && expectedThread <= feedbackSubjects.length) {
      await feedbackSubjects[expectedThread - 1].click();

      await this.page.waitForSelector(explorationFeedbackCardActiveSelector, {
        visible: true,
      });
    } else {
      throw new Error(`Expected thread not found: ${expectedThread}`);
    }
  }

  /**
   * Checks if a suggestion is anonymous.
   * @param {string} suggestion - The expected suggestion.
   * @param {boolean} anonymouslySubmitted - Indicates whether the suggestion is expected to be anonymous.
   */
  async expectSuggestionToBeAnonymous(
    suggestion: string,
    anonymouslySubmitted: boolean
  ): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.page.waitForSelector(feedbackSelector);
    const actualSuggestion = await this.page.$eval(feedbackSelector, el =>
      el.textContent?.trim()
    );

    if (actualSuggestion !== suggestion) {
      throw new Error(
        `Suggestion does not match the expected value. Expected: ${suggestion}, Found: ${actualSuggestion}`
      );
    }

    const isAnonymouslySubmitted = await this.isTextPresentOnPage(
      '(anonymously submitted)'
    );

    if (isAnonymouslySubmitted !== anonymouslySubmitted) {
      throw new Error(
        `Anonymity does not match the expected value. Expected: ${anonymouslySubmitted ? 'Anonymous' : 'Not anonymous'}, Found: ${isAnonymouslySubmitted ? 'Anonymous' : 'Not anonymous'}`
      );
    }
  }

  /**
   * Replies to a suggestion.
   * @param {string} reply - The reply to the suggestion.
   */
  async replyToSuggestion(reply: string): Promise<void> {
    await this.page.waitForSelector(responseTextareaSelector, {
      visible: true,
    });
    await this.type(responseTextareaSelector, reply);
    await this.clickOn(sendButtonSelector);

    // Check if button is disabled after clicking
    await this.page.waitForFunction(
      (selector: string) => {
        const btn = document.querySelector(selector);
        return btn && (btn as HTMLButtonElement).disabled;
      },
      {},
      sendButtonSelector
    );
  }

  /**
   * Verifies that the Edit Roles button is hidden, indicating the user
   * doesn't have permission to modify user roles.
   * @returns A promise that resolves when the assertion completes.
   */
  async expectEditRolesButtonToBeHidden(): Promise<void> {
    const element = await this.page.$(editRolesButtonSelector);
    expect(element).toBe(null);
  }

  /**
   * Verifies that the state content editor is hidden, indicating the user
   * doesn't have permission to edit exploration content.
   * @returns A promise that resolves when the assertion completes.
   */
  async expectStateContentEditorToBeHidden(): Promise<void> {
    const element = await this.page.$(stateContentEditorSelector);
    expect(element).toBe(null);
  }

  /**
   * Navigates back to the feedback tab.
   */
  async goBackToTheFeedbackTab(): Promise<void> {
    await this.page.waitForSelector(feedbackTabBackButtonSelector, {
      visible: true,
    });
    await this.clickOn(feedbackTabBackButtonSelector);
    await this.page.waitForSelector(feedbackTabBackButtonSelector, {
      hidden: true,
    });
  }

  /**
   * Changes the status of the current feedback thread.
   * @param {string} statusValue - The new status value to set for the feedback.
   */
  async changeFeedbackStatus(statusValue: string): Promise<void> {
    await this.page.waitForSelector(responseTextareaSelector, {
      visible: true,
    });
    if (statusValue === 'ignored' || statusValue === 'not_actionable') {
      await this.type(responseTextareaSelector, statusValue);
    }
    await this.select(feedbackStatusMenu, statusValue);
  }

  /**
   * Updates the feedback status. It updates the status and clicks on the send button.
   * @param {string} statusValue - The new status value to set for the feedback.
   */
  async updateFeedbackStatus(statusValue: string): Promise<void> {
    await this.changeFeedbackStatus(statusValue);
    await this.clickOn(sendButtonSelector);

    await this.expectElementToBeClickable(sendButtonSelector, false);
  }

  /**
   * Checks if the current feedback status matches the expected value.
   * @param {string} statusValue - The expected status value of the feedback.
   */
  async expectFeedbackStatusToBe(statusValue: string): Promise<void> {
    const currentStatus = await this.page.$eval(
      feedbackStatusMenu,
      el => (el as HTMLSelectElement).value
    );
    if (currentStatus !== statusValue) {
      throw new Error(
        `Expected feedback status to be ${statusValue}, but found ${currentStatus}`
      );
    }
  }

  /**
   * Verifies that a feedback thread at the specified index has the expected status.
   * @param {number} threadIndex - The 1-indexed position of the feedback thread.
   * @param {string} expectedStatus - The status text expected for the feedback thread.
   */
  async expectFeedbackStatusInList(
    threadIndex: number,
    expectedStatus: string
  ): Promise<void> {
    await this.page.waitForSelector(feedbackTabRowSelector, {
      visible: true,
    });

    await this.page.waitForFunction(
      (selector: string, elementNumber: number, expectedText: string) => {
        const elements = document.querySelectorAll(selector);
        return elements[elementNumber - 1].textContent?.trim() === expectedText;
      },
      {},
      feedbackStatusSelector,
      threadIndex,
      expectedStatus
    );
  }

  /**
   * Verifies that the feedback author is as expected.
   * @param {string} expectedAuthor - The expected author.
   */
  async expectFeedbackAuthorToBe(expectedAuthor: string): Promise<void> {
    await this.page.waitForSelector(feedbackAuthorSelector);
    const feedbackAuthors = await this.page.$$(feedbackAuthorSelector);

    if (feedbackAuthors.length === 0) {
      throw new Error('Feedback author not found.');
    }

    const authorText = await feedbackAuthors[0].evaluate(
      el => el.textContent?.trim(),
      feedbackAuthors[0]
    );

    if (authorText !== expectedAuthor) {
      throw new Error(
        `Expected feedback author to be "${expectedAuthor}", but found "${authorText}"`
      );
    }
  }

  /**
   * Navigates to the help tab in the exploration editor.
   */
  async clickOnHelpButton(): Promise<void> {
    await this.expectElementToBeVisible(helpTabSelector);

    await this.clickOn(helpTabSelector);
    await this.expectElementToBeVisible(helpModalContainerSelector);
  }

  async clickOnPublishExplorationButton(): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.openExplorationNavigationInMobileView();

      await this.expectElementToBeVisible(mobileChangesDropdownSelector);
      await this.clickOn(mobileChangesDropdownSelector);
    }

    const publishButtonSelector = this.isViewportAtMobileWidth()
      ? mobilePublishButtonSelector
      : publishExplorationButtonSelector;
    await this.expectElementToBeVisible(publishButtonSelector);
    await this.clickOn(publishButtonSelector);

    await this.expectElementToBeVisible(
      publishMetadataExplorationHeaderSelector
    );
  }

  /**
   * Navigates to the tour tab in the exploration editor.
   */
  async clickOnTakeATourButton(): Promise<void> {
    await this.isElementVisible(takeATourButtonSelector);
    await this.clickOn(takeATourButtonSelector);

    await this.expectElementToBeVisible(joyrideBodySelector);
  }

  async clickOnTakeATranslationsTourButton(): Promise<void> {
    await this.isElementVisible(translationTourButtonSelector);
    await this.clickOn(translationTourButtonSelector);

    await this.expectElementToBeVisible(joyrideBodySelector);
  }

  /**
   * Clicks on the publish button in the publish modal.
   */
  async clickOnPublishButtonInPublishModal(): Promise<void> {
    await this.expectElementToBeVisible(explorationConfirmPublishButton);
    await this.clickOn(explorationConfirmPublishButton);
    await this.expectElementToBeVisible(explorationConfirmPublishButton, false);
  }

  /**
   * Clicks on the save changes button in the publish modal.
   */
  async clickOnSaveChangesButtonInPublishModal(): Promise<void> {
    await this.expectElementToBeVisible(saveExplorationChangesButton);
    await this.clickOn(saveExplorationChangesButton);

    await this.expectElementToBeVisible(saveExplorationChangesButton, false);
  }

  /**
   * Opens the exploration navigation in mobile view.
   */
  async openExplorationNavigationInMobileView(
    open: boolean = true
  ): Promise<void> {
    if (!this.isViewportAtMobileWidth()) {
      return;
    }

    if (await this.isElementVisible(dropdownToggleIcon, open)) {
      showMessage(
        `Skipping ${open ? 'opening' : 'closing'} exploration navigation in mobile view. Already ${open ? 'opened' : 'closed'}.`
      );
      return;
    }

    await this.expectElementToBeVisible(mobileOptionsButtonSelector);
    await this.page.click(mobileOptionsButtonSelector);

    await this.expectElementToBeVisible(dropdownToggleIcon, open);
  }

  /**
   * Clicks on the save draft button.
   */
  async clickOnSaveDraftButton(): Promise<void> {
    await this.openExplorationNavigationInMobileView();

    const saveButtonSelector = this.isViewportAtMobileWidth()
      ? mobileSaveChangesButtonSelector
      : saveChangesButton;
    await this.expectElementToBeClickable(saveButtonSelector);

    await this.clickOn(saveButtonSelector);
    await this.expectElementToBeVisible(saveExplorationModalContainerSelector);
  }

  /**
   * Clicks on the save draft button in the save draft modal.
   */
  async clickOnSaveDraftButtonInSaveDraftModal(): Promise<void> {
    await this.expectElementToBeVisible(`${saveDraftButton}:not([disabled])`);
    await this.page.click(saveDraftButton);

    // Toast message confirms that the draft has been saved.
    await this.page.waitForSelector(toastMessage, {
      visible: true,
    });
    await this.page.waitForSelector(toastMessage, {
      hidden: true,
    });
  }

  /**
   * Navigates to the next step in the joyride.
   */
  async continueToNextJoyrideStep(): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.expectJoyrideNextButtonToBeVisible();

    const currentStep = await this.getTextContent(joyrideStepSelector);
    await this.page.click(nextButtonSelector);

    await this.waitForPageToFullyLoad();
    await this.page.waitForTimeout(1000);
    await this.page.waitForFunction(
      (selector: string, currentStep: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() !== currentStep;
      },
      {},
      joyrideStepSelector,
      currentStep
    );
  }

  /**
   * Navigates to the previous step in the joyride.
   */
  async continueToPreviousJoyrideStep(): Promise<void> {
    await this.expectJoyridePreviousButtonToBeVisible();

    const currentStep = await this.getTextContent(joyrideStepSelector);
    await this.page.click(previousButtonSelector);

    await this.page.waitForFunction(
      (selector: string, currentStep: string) => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() !== currentStep;
      },
      {},
      joyrideStepSelector,
      currentStep
    );
  }

  /**
   * Verifies that the add response modal header is as expected.
   * @param {string} expectedHeader - The expected header.
   */
  async expectAddResponseModalHeaderToBe(
    expectedHeader: string
  ): Promise<void> {
    await this.page.waitForSelector(addResponseModalHeaderSelector, {
      visible: true,
    });

    const header = await this.page.$eval(addResponseModalHeaderSelector, el =>
      el.textContent?.trim()
    );

    expect(header).toBe(expectedHeader);
  }

  /**
   * Verifies that the card content is as expected.
   * @param {string} expectedCardContent - The expected card content.
   */
  async expectCardContentToBe(expectedCardContent: string): Promise<void> {
    await this.page.waitForSelector(contentBoxSelector, {
      visible: true,
    });

    const cardContent = await this.page.$eval(contentBoxSelector, el =>
      el.textContent?.trim()
    );

    expect(cardContent).toBe(expectedCardContent);
  }

  /**
   * Verifies that the current outcome destination is as expected.
   * @param {string} expectedDestination - The expected destination.
   */
  async expectCurrentOutcomeDestinationToBe(
    expectedDestination: string
  ): Promise<void> {
    await this.page.waitForSelector(currentOutcomeDestinationSelector, {
      visible: true,
    });
    const currentDestination = await this.page.$eval(
      currentOutcomeDestinationSelector,
      el => el.textContent?.trim()
    );

    expect(currentDestination).toBe(expectedDestination);
  }

  /**
   * Verifies that the customize interaction header is visible and contains the expected title.
   * @param {string} title The expected title of the customize interaction header.
   */
  async expectCustomizeInteractionTitleToBe(title: string): Promise<void> {
    await this.expectElementToBeVisible(customizeInteractionHeaderSelector);

    await this.expectTextContentToBe(customizeInteractionHeaderSelector, title);
  }

  /**
   * Verifies that the edit card content pencil button is visible.
   */
  async expectEditCardContentPencilButtonToBeVisible(): Promise<void> {
    const visible = await this.isElementVisible(editCardContentButtonSelector);

    expect(visible).toBe(true);
  }

  /**
   * Verifies that the edit outcome destination pencil button is visible.
   */
  async expectEditOutcomeDestPencilButtonToBeVisible(): Promise<void> {
    const visible = await this.isElementVisible(
      editOutcomeDestPencilButtonSelector
    );

    expect(visible).toBe(true);
  }

  /**
   * Verifies that the exploration graph contains the specified card.
   * @param {string} cardName - The name of the card to check.
   */
  async expectExplorationGraphToContainCard(cardName: string): Promise<void> {
    if (this.isViewportAtMobileWidth()) {
      await this.openExplorationStateGraphInMobileView();
    }

    await this.page.waitForFunction(
      (selector: string, value: string) => {
        const elements = document.querySelectorAll(selector);
        const cardValues = Array.from(elements).map(element =>
          element.textContent?.trim()
        );
        return cardValues.includes(value);
      },
      {},
      stateNodeSelector,
      cardName
    );

    if (this.isViewportAtMobileWidth()) {
      await this.page.click(closeModalButtonSelector);
      await this.expectElementToBeVisible(
        explorationStateGraphModalSelector,
        false
      );
    }
  }

  /**
   * Visits the help center from the help tab.
   */
  async expectHelpCenterButtonToWorkProperly(): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.expectAnchorToOpenCorrectPage(
      helpPageLinkSelector,
      testConstants.URLs.UserDocumentation
    );
  }

  /**
   * Verifies that the help modal title is as expected.
   * @param {string} expectedTitle - The expected title.
   */
  async expectHelpModalTitleToBe(expectedTitle: string): Promise<void> {
    await this.expectElementToBeVisible(helpModalHeaderSelector);

    await this.expectTextContentToBe(helpModalHeaderSelector, expectedTitle);
  }

  /**
   * Verifies that the expected hint is in the current hints.
   * @param {string} expectedHint - The expected hint.
   */
  async expectHintsToConatin(expectedHint: string): Promise<void> {
    await this.page.waitForSelector(currentHintSummarySelector, {
      visible: true,
    });

    const hints = await this.page.$$eval(currentHintSummarySelector, elements =>
      elements.map(el => el.textContent?.trim())
    );

    expect(hints).toContain(expectedHint);
  }

  /**
   * Verifies that the interaction preview card is visible.
   */
  async expectInteractionPreviewCardToBeVisible(): Promise<void> {
    const visible = await this.isElementVisible(interactionPreviewCardSelector);

    expect(visible).toBe(true);
  }

  /**
   * Verifies that the joyride content is as expected.
   * @param expectedContent - The expected content.
   */
  async expectJoyrideContentToContain(expectedContent: string): Promise<void> {
    await this.expectTextContentToContain(joyrideBodySelector, expectedContent);
  }

  /**
   * Verifies that the joyride title is as expected.
   * @param expectedTitle - The expected title.
   */
  async expectJoyrideTitleToBe(expectedTitle: string): Promise<void> {
    await this.expectTextContentToBe(joyrideTitleSelector, expectedTitle);
  }

  async expectJoyrideDoneButtonToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(joyrideDoneButtonSelector, visible);
  }

  /**
   * Verifies that the joyride next button is visible.
   */
  async expectJoyrideNextButtonToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(nextButtonSelector, visible);
  }

  /**
   * Verifies that the joyride previous button is visible.
   */
  async expectJoyridePreviousButtonToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(previousButtonSelector, visible);
  }

  async expectModalContentToContain(expectedText: string): Promise<void> {
    await this.expectElementToBeVisible(commonModalBodySelector);
    await this.expectTextContentToContain(
      commonModalBodySelector,
      expectedText
    );
  }

  /**
   * Verifies that the modal title is as expected.
   * @param {string} expectedTitle - The expected title.
   */
  async expectModalTitleToBe(expectedTitle: string): Promise<void> {
    await this.expectElementToBeVisible(commonModalTitleSelector);
    await this.expectTextContentToContain(
      commonModalTitleSelector,
      expectedTitle
    );
  }

  /**
   * Verifies that the outcome feedback is visible.
   */
  async expectOutcomeFeedbackToBe(expectedFeedback: string): Promise<void> {
    await this.page.waitForSelector(outcomeFeedbackSelector);
    const feedbackText = await this.page.evaluate(
      element => element.textContent,
      outcomeFeedbackSelector
    );

    // Remove "Oppia tells the learner..." prefix.
    const feedbackTextWithoutPrefix = feedbackText.replace(
      'Oppia tells the learner...',
      ''
    );

    expect(feedbackTextWithoutPrefix).toBe(expectedFeedback);
  }

  /**
   * Verifies that the remove interaction button is visible.
   */
  async expectRemoveInteractionButtonToBeVisible(): Promise<void> {
    const visible = await this.isElementVisible(
      removeInteractionButttonSelector
    );

    expect(visible).toBe(true);
  }

  async expectSaveDraftButtonToBeDisabled(
    disabled: boolean = true
  ): Promise<void> {
    const saveChangesButtonSelector = this.isViewportAtMobileWidth()
      ? mobileSaveChangesButtonSelector
      : saveChangesButton;
    await this.expectElementToBeVisible(saveChangesButtonSelector);

    await this.page.waitForFunction(
      (selector: string, disabled: boolean) => {
        const element = document.querySelector(selector);
        return (element as HTMLButtonElement)?.disabled === disabled;
      },
      {},
      saveChangesButton,
      disabled
    );
  }

  /**
   * Verifies that the save draft modal title is as expected.
   * @param {string} title - The expected title.
   */
  async expectSaveDraftModalTitleToBe(title: string): Promise<void> {
    await this.expectElementToBeVisible(saveDraftTitleSelector);
    await this.expectTextContentToBe(saveDraftTitleSelector, title);
  }

  /**
   * Verifies that the expected solution is in the current solutions.
   * @param {string} expectedSolution - The expected solution.
   */
  async expectSolutionsToContain(expectedSolution: string): Promise<void> {
    await this.page.waitForSelector(currentSolutionSummarySelector, {
      visible: true,
    });

    const solutions = await this.page.$$eval(
      currentSolutionSummarySelector,
      elements => elements.map(el => el.textContent?.trim())
    );

    expect(solutions).toContain(expectedSolution);
  }

  /**
   * Expect to be in the creator dashboard page.
   */
  async expectToBeInCreatorDashboard(): Promise<void> {
    await this.page.waitForSelector(creatorDashboardContainerSelector, {
      visible: true,
    });

    await this.isTextPresentOnPage('Creator Dashboard');
  }

  /**
   * Fills the description in the save draft modal.
   * @param description The description to fill in the save draft modal.
   */
  async fillDescriptionInSaveDraftModal(description: string): Promise<void> {
    await this.expectElementToBeVisible(commitMessageSelector);
    await this.type(commitMessageSelector, description);

    await this.page.waitForFunction(
      (selector: string, value: string) => {
        const element = document.querySelector(selector);
        return (element as HTMLTextAreaElement)?.value?.trim() === value.trim();
      },
      {},
      commitMessageSelector,
      description
    );
  }

  async fillExplorationMetadataDetails(
    explorationTitle: string,
    goal: string,
    category: string,
    language: string,
    tags: string[]
  ): Promise<void> {
    await this.expectElementToBeVisible(explorationTitleInput);
    await this.clickOn(explorationTitleInput);
    await this.type(explorationTitleInput, explorationTitle);
    await this.expectElementValueToBe(explorationTitleInput, explorationTitle);

    await this.expectElementToBeVisible(explorationGoalInput);
    await this.clickOn(explorationGoalInput);
    await this.type(explorationGoalInput, goal);
    await this.expectElementValueToBe(explorationGoalInput, goal);

    await this.expectElementToBeVisible(explorationCategoryDropdown);
    await this.clickOn(explorationCategoryDropdown);
    await this.clickOn(category);
    await this.expectTextContentToBe(categoryDropdown, category);

    await this.expectElementToBeVisible(explorationLanguageSelector);
    await this.clickOn(explorationLanguageSelector);
    await this.clickOn(language);
    await this.expectTextContentToBe(explorationLanguageSelector, language);

    await this.expectElementToBeVisible(tagsField);
    await this.clickOn(tagsField);
    for (const tag of tags) {
      await this.type(tagsField, tag);
      await this.page.keyboard.press('Enter');
    }
  }

  /**
   * Function to finish the joyride.
   */
  async finishJoyride(): Promise<void> {
    await this.expectJoyrideDoneButtonToBeVisible();

    await this.page.click(joyrideDoneButtonSelector);
    await this.expectElementToBeVisible(joyrideDoneButtonSelector, false);
  }

  /**
   * Function to submit an answer in the input field.
   * @param {string} answer - The answer to submit.
   */
  async submitAnswerInInputField(answer: string): Promise<void> {
    await this.waitForPageToFullyLoad();
    await this.expectElementToBeVisible('input');
    await this.clearAllTextFrom('input');
    await this.type('input', answer);

    await this.clickOnSubmitAnswerButton();
  }

  /**
   * Function to submit an answer in the input field.
   * @param {string} answer - The answer to submit.
   */
  async submitExpressionAnswer(answer: string): Promise<void> {
    await this.expectElementToBeVisible(commonMathExpressionInputField);

    const inputField = await this.page.$(commonMathExpressionInputField);
    if (!inputField) {
      throw new Error('Input field not found.');
    }

    await inputField.click();
    await this.page.keyboard.type(answer);

    await this.clickOnSubmitAnswerButton();
  }

  async submitPencilCodeEditorAnswer(answer: string): Promise<void> {
    const pencilCode = new PencilCode(this.page);
    await pencilCode.typeCode(answer);
    await pencilCode.runCode();
  }

  async submitCodeEditorAnswer(answer: string): Promise<void> {
    const codeEditor = await this.getElementInParent(codeEditorInSolutionModal);
    if (!codeEditor) {
      throw new Error('Code editor not found.');
    }

    await this.clickOn(codeEditorInSolutionModal);
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.keyboard.press('Backspace');
    await this.page.type(codeEditorInSolutionModal, answer);

    await this.clickOnSubmitAnswerButton();
  }

  /**
   * Expects the lesson info card to contain the given text.
   * @param text The text to look for.
   */
  async expectLessonInfoCardToContain(text: string): Promise<void> {
    await this.expectTextContentToContain(lessonInfoCardSelector, text);
  }

  /**
   * Expects the answer error message to be the expected error.
   * @param expectedError The expected error message.
   */
  async expectAnswerErrorMessageToBe(expectedError: string): Promise<void> {
    await this.expectTextContentToContain(formErrorContainer, expectedError);
  }

  /**
   * Checks if the Number With Units help modal header is present.
   */
  async expectUnitsTableToShowProperly(): Promise<void> {
    await this.expectElementToBeVisible(showUnitFormatsButtonSelector);
    await this.page.click(showUnitFormatsButtonSelector);
    await this.expectElementToBeVisible(numberWithUnitsModalSelector);
    await this.expectElementToBeVisible(closeModalButtonSelector);
    await this.clickOn(closeModalButtonSelector);
    await this.expectElementToBeVisible(closeModalButtonSelector, false);
  }

  /**
   * Checks if the share exploration link is valid.
   */
  async expectShareExplorationLinkToBeValid(): Promise<void> {
    await this.expectElementToBeVisible(progressUIDSelector);
    await this.expectTextContentToContain(
      progressUIDSelector,
      testConstants.URLs.BaseExplorationPlayer
    );
  }

  /**
   * Checks if the code output is as expected.
   * @param {string} expectedOutput - The expected output.
   */
  async expectCodeOutputToBe(expectedOutput: string): Promise<void> {
    await this.expectTextContentToBe(codeOutputSelector, expectedOutput);
  }

  /**
   * Moves the node in the graph.
   */
  async expectGraphNodeCanBeMoved(): Promise<void> {
    // Check if the graph interaction is present.
    const graphHelper = new GraphViz(this.page);
    await graphHelper.expectGraphInteractionToBePresent();

    // Move the node to the given position.
    const nodes = await graphHelper.getVertices();
    const initalCoordinates = await graphHelper.getNodeCoordinates(nodes[0]);
    await graphHelper.moveNode(nodes[0], 50, 50);

    // Check if the node is moved to the given position.
    const updatedNodes = await graphHelper.getVertices();
    let allNewCoordinates: number[][] = [];
    for (const node of updatedNodes) {
      const coordinates = await graphHelper.getNodeCoordinates(node);
      allNewCoordinates.push(coordinates);
    }
    expect(allNewCoordinates).not.toContain(initalCoordinates);
  }

  /**
   * Checks if graph node can be removed.
   */
  async expectGraphNodeCanBeRemoved(): Promise<void> {
    const graphHelper = new GraphViz(this.page);

    const nodes = await graphHelper.getVertices();
    await graphHelper.removeNode(nodes[0]);
    const newNodes = await graphHelper.getVertices();
    expect(newNodes.length).toEqual(nodes.length - 1);
  }

  /**
   * Checks if graph node can be added.
   */
  async expectGraphNodeCanBeAdded(): Promise<void> {
    const graphHelper = new GraphViz(this.page);
    const nodes = await graphHelper.getVertices();
    await graphHelper.addNode(60, 60);
    const newNodes = await graphHelper.getVertices();
    expect(newNodes.length).toEqual(nodes.length + 1);
  }

  /**
   * Creates a Tab Element In RTE.
   * @param tabContents - A list of tab contents to add.
   */
  async addTabContentsRTE(tabContents: TabContent[] = []): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert tabs');

    await this.waitForNetworkIdle();
    const helperModel = await this.page.$(rteHelperModalSelector);

    const tabTitleInputElements = await helperModel?.$$(textInputSelector);
    const tabContentInputElements = await helperModel?.$$(
      stateContentInputField
    );

    showMessage(tabContentInputElements?.length + ' tab contents found.');
    showMessage(tabTitleInputElements?.length + ' tab titles found.');

    for (let i = 0; i < tabContents.length; i++) {
      if (i > 1) {
        await this.clickOn('.e2e-test-add-list-entry');
      }
      await this.clearAllTextFrom(
        `oppia-rte-helper-model input.e2e-test-text-input:nth-child(${i + 1})`
      );
      await this.clearAllTextFrom(
        `oppia-rte-helper-model ${stateContentInputField}:nth-child(${i + 1})`
      );
      await tabTitleInputElements?.[i]?.type(tabContents[i].title);
      await tabContentInputElements?.[i]?.type(tabContents[i].content);
    }
    await this.clickOn(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Adds an Image RTE element to the current card.
   * @param {string} imageFilePath - Path of Image file to add.
   * @param {string} imageDescription - Image Description to add.
   * @param {string} imageCaption - Caption to add with image.
   */
  async addImageRTEToCardContent(
    imageFilePath: string,
    imageDescription: string,
    imageCaption: string | null
  ): Promise<void> {
    await this.expectElementToBeVisible(stateEditSelector);
    await this.clickOn(stateEditSelector);
    await this.addImageRTE(imageFilePath, imageDescription, imageCaption);
    await this.clickOn(saveContentButton);
    await this.expectElementToBeVisible(stateContentInputField, false);
  }

  /**
   * Adds basic RTE components to the exploration.
   * It includes Bold, Italic, Numbered List, Bulleted List, Pre formatted Text,
   * Block Quote, Image, Math Formula, and Concept Card.
   */
  async addExplorationDescriptionContainingBasicRTEComponents(): Promise<void> {
    // Click on RTE.
    await this.page.waitForSelector(stateEditSelector, {visible: true});
    await this.clickOn(stateEditSelector);

    // Add Bold text.
    await this.clickOnRTEOptionWithTitle('Bold');
    await this.type(stateContentInputField, 'Bold text');
    await this.page.keyboard.press('Enter');
    await this.clickOnRTEOptionWithTitle('Bold');

    // Add Italic text.
    await this.clickOnRTEOptionWithTitle('Italic');
    await this.type(stateContentInputField, 'Italic text');
    await this.page.keyboard.press('Enter');
    await this.clickOnRTEOptionWithTitle('Italic');

    // Add Numbered List.
    await this.clickOnRTEOptionWithTitle('Numbered List');
    await this.type(stateContentInputField, 'Numbered List Item 1');
    await this.page.keyboard.press('Enter');
    await this.type(stateContentInputField, 'Numbered List Item 2');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Enter');

    // Add Bulleted List.
    await this.clickOnRTEOptionWithTitle('Bulleted List');
    await this.type(stateContentInputField, 'Bulleted List Item 1');
    await this.page.keyboard.press('Enter');
    await this.type(stateContentInputField, 'Bulleted List Item 2');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Enter');

    // Add Pre formatted Text.
    await this.clickOnRTEOptionWithTitle('Pre');
    await this.type(stateContentInputField, 'Pre formatted text');
    await this.clickOnRTEOptionWithTitle('Pre');
    await this.page.keyboard.press('Enter');

    // Add Block Quote.
    await this.clickOnRTEOptionWithTitle('Block Quote');
    await this.type(stateContentInputField, 'Block Quote text');
    await this.page.keyboard.press('Enter');
    await this.clickOnRTEOptionWithTitle('Block Quote');

    // Add Image.
    await this.addImageRTE(
      testConstants.data.profilePicture,
      'Test Image',
      'Test Image Caption'
    );
    await this.waitForNetworkIdle();

    await this.page.keyboard.press('ArrowRight');

    // Math Formula.
    await this.clickOnRTEOptionWithTitle('Insert mathematical formula');
    await this.waitForNetworkIdle();
    const textareaElement = await this.page.$(
      'textarea[placeholder*="Enter a math expression using LaTeX"]'
    );
    await textareaElement?.type('x^2 + y^2 = z^2');
    await this.clickOn(closeButtonForExtraModel);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Concept Card.
    await this.clickOnRTEOptionWithTitle('Insert Concept Card Link');
    await this.waitForNetworkIdle();
    const skillSearchElement = await this.page.$(skillNameInput);
    await skillSearchElement?.type('Math');
    await this.clickOn(skillItemInRTESelector);
    await this.page.keyboard.press('Enter');
    await this.clickOn(closeButtonForExtraModel);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Save content.
    await this.clickOn(saveContentButton);
    await this.expectElementToBeVisible(saveContentButton, false);
  }

  /**
   * Updates an exploration description containing all RTE elements.
   */
  async addExplorationDescriptionContainingAllRTEComponents(): Promise<void> {
    // Click on RTE.
    await this.page.waitForSelector(stateEditSelector, {visible: true});
    await this.clickOn(stateEditSelector);

    // Add Bold text.
    await this.clickOnRTEOptionWithTitle('Bold');
    await this.type(stateContentInputField, 'Bold text');
    await this.page.keyboard.press('Enter');
    await this.clickOnRTEOptionWithTitle('Bold');

    // Add Italic text.
    await this.clickOnRTEOptionWithTitle('Italic');
    await this.type(stateContentInputField, 'Italic text');
    await this.page.keyboard.press('Enter');
    await this.clickOnRTEOptionWithTitle('Italic');

    // Add Numbered List.
    await this.clickOnRTEOptionWithTitle('Numbered List');
    await this.type(stateContentInputField, 'Numbered List Item 1');
    await this.page.keyboard.press('Enter');
    await this.type(stateContentInputField, 'Numbered List Item 2');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Enter');

    // Add Bulleted List.
    await this.clickOnRTEOptionWithTitle('Bulleted List');
    await this.type(stateContentInputField, 'Bulleted List Item 1');
    await this.page.keyboard.press('Enter');
    await this.type(stateContentInputField, 'Bulleted List Item 2');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Enter');

    // Add Pre formatted Text.
    await this.clickOnRTEOptionWithTitle('Pre');
    await this.type(stateContentInputField, 'Pre formatted text');
    await this.clickOnRTEOptionWithTitle('Pre');
    await this.page.keyboard.press('Enter');

    // Add Block Quote.
    await this.clickOnRTEOptionWithTitle('Block Quote');
    await this.type(stateContentInputField, 'Block Quote text');
    await this.page.keyboard.press('Enter');
    await this.clickOnRTEOptionWithTitle('Block Quote');

    // Add Collapsible Block.
    await this.addCollapsibleBlockRTE();
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('ArrowRight');

    // Add Image.
    await this.addImageRTE(
      testConstants.data.profilePicture,
      'Test Image',
      'Test Image Caption'
    );
    await this.waitForNetworkIdle();

    await this.page.keyboard.press('ArrowRight');

    // Video.
    await this.addVideoRTE(oppiaYouTubeVideoUrl);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('ArrowRight');

    // Add Link.
    await this.addTextWithLinkRTE('Oppia', oppiaWebURL);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Math Formula.
    await this.clickOnRTEOptionWithTitle('Insert mathematical formula');
    await this.waitForNetworkIdle();
    const textareaElement = await this.page.$(
      'textarea[placeholder*="Enter a math expression using LaTeX"]'
    );
    await textareaElement?.type('x^2 + y^2 = z^2');
    await this.clickOn(closeButtonForExtraModel);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Concept Card.
    await this.clickOnRTEOptionWithTitle('Insert Concept Card Link');
    await this.waitForNetworkIdle();
    const skillSearchElement = await this.page.$(skillNameInput);
    await skillSearchElement?.type('Math');
    await this.clickOn(skillItemInRTESelector);
    await this.page.keyboard.press('Enter');
    await this.clickOn(closeButtonForExtraModel);
    await this.waitForNetworkIdle();
    await this.page.keyboard.press('Enter');

    // Tab Contents.
    await this.addTabContentsRTE();
    await this.page.keyboard.press('ArrowRight');

    await this.clickOn(saveContentButton);
    await this.expectElementToBeVisible(saveContentButton, false);
  }

  /**
   * Clicks on the RTE option with the given title.
   * @param title - The title of RTE option.
   */
  async clickOnRTEOptionWithTitle(title: string): Promise<void> {
    const optionSelector = `a.cke_button[title*="${title}"]`;
    await this.page.waitForSelector(optionSelector);
    const optionElement = await this.page.$(optionSelector);
    await optionElement?.click();
  }

  /**
   * Adds a default collapsible block RTE element.
   */
  async addCollapsibleBlockRTE(): Promise<void> {
    await this.clickOnRTEOptionWithTitle('collapsible block');
    await this.clickOn(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Adds text with link in RTE editor.
   * @param text - The text that should be displayed
   * @param url - The URL to which the text should redirect to.
   */
  async addTextWithLinkRTE(text: string, url: string): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert link');
    await this.waitForNetworkIdle();

    const helperModel = await this.page.$(rteHelperModalSelector);

    // Get Fields.
    const inputs = await helperModel?.$$(textInputSelector);
    const linkInput = inputs?.[0];
    const linkTextInput = inputs?.[1];

    if (linkInput && linkTextInput) {
      await linkInput.type(url);
      await linkTextInput.type(text);
    } else {
      throw new Error('Link input fields not found in the helper modal');
    }

    await this.clickOn(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Adds an Image RTE element.
   * @param imageFilePath - Path of Image file to add.
   * @param imageDescription - Image Description to add.
   * @param imageCaption - Caption to add with image.
   */
  async addImageRTE(
    imageFilePath: string,
    imageDescription: string,
    imageCaption: string | null
  ): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert image');

    await this.waitForNetworkIdle();
    const helperModel = await this.page.$(rteHelperModalSelector);

    // Get Fields.
    const imageDescriptionInput = await helperModel?.$(descriptionBoxSelector);
    const imageCaptionInput = await helperModel?.$(textInputSelector);

    if (imageDescriptionInput) {
      await imageDescriptionInput.type(imageDescription);
    } else {
      throw new Error('Image description input not found in the helper modal');
    }
    if (imageCaptionInput && imageCaption) {
      await imageCaptionInput.type(imageCaption);
    }

    await this.clickOn(uploadImageButton);
    await this.uploadFile(imageFilePath);
    await this.clickOn(useTheUploadImageButton);

    await this.clickOn(closeButtonForExtraModel);
    await this.expectElementToBeVisible(closeButtonForExtraModel, false);
  }

  /**
   * Adds Video RTE element.
   * @param videoUrl - Youtube Video URL
   */
  async addVideoRTE(videoUrl: string): Promise<void> {
    await this.clickOnRTEOptionWithTitle('Insert video');

    await this.expectElementToBeVisible(rteHelperModalSelector);
    const helperModel = await this.page.$(rteHelperModalSelector);

    // Get Fields.
    const videoUrlInput = await helperModel?.$(textInputField);

    if (!videoUrlInput) {
      throw new Error('Video URL input not found in the helper modal');
    }
    await this.waitForElementToStabilize(videoUrlInput);
    await videoUrlInput.type(videoUrl);

    await this.page.waitForSelector(closeButtonForExtraModel);
    await this.page.click(closeButtonForExtraModel);
    await this.page.waitForSelector(closeButtonForExtraModel, {
      hidden: true,
    });
  }

  /**
   * Function to navigate to exploration editor.
   * @param explorationUrl - url of the exploration.
   */
  async navigateToExplorationEditor(
    explorationId: string | null
  ): Promise<void> {
    if (!explorationId) {
      throw new Error('Cannot navigate to editor: explorationId is null');
    }
    const editorUrl = `${baseUrl}/create/${explorationId}#/`;
    await this.goto(editorUrl);

    showMessage('Navigation to exploration editor is successful.');
  }

  /**
   * Expects the node warning sign to be visible or not visible.
   * @param visible - Whether the node warning sign should be visible or not.
   */
  async expectNodeWariningSignToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    // TODO(##23129): Remove this skip once the issue is fixed, and the nodes
    // are added to mobile viewport.
    if (this.isViewportAtMobileWidth()) {
      showMessage(
        'Skipping node warning sign check on mobile viewport,' +
          'as nodes are not visible on mobile viewport.'
      );
      return;
    }

    await this.expectElementToBeVisible(nodeWarningSignSelector, visible);
  }

  /**
   * Checks if the self loop warning is visible.
   * @param {boolean} visible - Whether the self loop warning should be visible or not.
   */
  async expectSelfLoopWarningToBeVisible(
    visible: boolean = true
  ): Promise<void> {
    await this.expectElementToBeVisible(selfLoopWarningSelector, visible);
  }

  /**
   * Checks if the goal warning is visible.
   * @param {boolean} visible - Whether the goal warning should be visible or not.
   */
  async expectGoalWarningToBeVisible(visible: boolean = true): Promise<void> {
    await this.expectElementToBeVisible(goalWarningSelector, visible);
  }

  /**
   * Reverts the version of exploration.
   * @param version - The version number to revert to.
   */
  async revertExplorationToVersion(version: string): Promise<void> {
    await this.expectElementToBeVisible(historyListItemSelector);

    const historyItems = await this.page.$$(historyListItemSelector);
    let historyItem: ElementHandle<Element> | null = null;

    const currentVersion = await this.page.$eval(
      historyItemIndexSelector,
      (el: Element) => {
        return parseInt(el.textContent?.replace('.', '').trim() || '');
      }
    );
    for (const historyItemElement of historyItems) {
      const historyItemText = await historyItemElement.$eval(
        historyItemIndexSelector,
        el => el.textContent?.trim().replace('.', '')
      );
      if (historyItemText === version) {
        historyItem = historyItemElement;
        break;
      }
    }

    if (!historyItem) {
      throw new Error(`Version ${version} not found in history tab.`);
    }

    const historyOption = await historyItem.waitForSelector(
      historyItemOptionSelector
    );
    if (!historyOption) {
      throw new Error('Options element not found.');
    }

    await this.waitForElementToBeClickable(historyOption);
    await historyOption.click();

    await this.clickOn(`${dropdownMenuShown} ${revertVersionButtonSelector}`);
    await this.waitForElementToStabilize(confirmRevertButtonSelector);
    await this.clickAndWaitForNavigation(confirmRevertButtonSelector, {
      waitUntil: ['networkidle0', 'load'],
    });
    await this.page.waitForFunction(
      (selector: string, version: number) => {
        const element = document.querySelector(selector);
        return (
          parseInt(element?.textContent?.trim().replace('.', '') || '') ===
          version
        );
      },
      {},
      historyItemIndexSelector,
      currentVersion + 1
    );
    await this.expectElementToBeVisible(confirmRevertButtonSelector, false);
  }

  /**
   * Checks if the date of the last exploration version is in correct format or not.
   */
  async expectExplorationHistoryDateHasProperFormat(): Promise<void> {
    const explorationHistoryDateSelector = '.e2e-test-history-tab-commit-date';
    await this.expectElementToBeVisible(explorationHistoryDateSelector);
    const dateString = await this.page.$eval(
      explorationHistoryDateSelector,
      el => el.textContent?.trim() || ''
    );
    const pattern =
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{1,2}:\d{2} (AM|PM)$/;
    if (!pattern.test(dateString)) {
      throw new Error("The date ins't formatted properly.");
    }
  }

  /**
   * Clicks on interaction in exploration editor.
   */
  async clickOnTestExploration(): Promise<void> {
    await this.expectElementToBeVisible(interactionPreviewSelector);
    await this.clickOn(interactionPreviewSelector);
    await this.page.waitForFunction(
      (selector: string, h1: string, h2: string) => {
        const element = document.querySelector(selector);
        return (
          element &&
          (element.textContent?.includes(h1) ||
            element.textContent?.includes(h2))
        );
      },
      {},
      commonModalTitleSelector,
      'Customize Interaction',
      'Add Response'
    );
  }

  /**
   * Removes the current interaction.
   */
  async removeInteraction(): Promise<void> {
    await this.expectElementToBeVisible(removeInteractionButttonSelector);
    await this.waitForElementToStabilize(removeInteractionButttonSelector);
    await this.clickOn(removeInteractionButttonSelector);
    await this.expectElementToBeVisible(confirmDeleteInteractionButtonSelector);
    await this.clickOn(confirmDeleteInteractionButtonSelector);
    await this.expectElementToBeVisible(
      confirmDeleteInteractionButtonSelector,
      false
    );
  }
}

export let ExplorationEditorFactory = (): ExplorationEditor =>
  new ExplorationEditor();
