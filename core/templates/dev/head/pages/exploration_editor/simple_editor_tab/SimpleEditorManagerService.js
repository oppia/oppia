// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service that maintains the title, introduction and list of
 * questions shown in the simple editor. This service provides functionality
 * for updating the questions that are displayed in the UI, and passing the
 * updates through to services like explorationStatesService that are
 * responsible for generally maintaining the frontend exploration data.
 */

oppia.factory('SimpleEditorManagerService', [
  'StatesToQuestionsService', 'SimpleEditorShimService',
  'QuestionObjectFactory',
  function(
      StatesToQuestionsService, SimpleEditorShimService,
      QuestionObjectFactory) {
    var data = {
      title: null,
      introductionHtml: null,
      questions: null
    };

    var DEFAULT_INTERACTION = {
      ID: 'MultipleChoiceInput',
      CUSTOMIZATION_ARGS: {
        choices: {
          value: ['<p>Option 1</p>']
        }
      }
    };

    var END_EXPLORATION_INTERACTION = {
      ID: 'EndExploration',
      CUSTOMIZATION_ARGS: {
        recommendedExplorationIds: []
      }
    };

    var getNewStateName = function() {
      var allStateNames = data.questions.map(function(question) {
        return question.stateName;
      });
      var minimumStateNumber = data.questions.length + 1;
      while (allStateNames.indexOf('Question ' + minimumStateNumber) !== -1) {
        minimumStateNumber++;
      }

      return 'Question ' + minimumStateNumber;
    };

    var getNextStateName = function(stateName) {
      for (var i = 0; i < data.questions.length; i++) {
        if (data.questions[i].getStateName() === stateName) {
          return data.questions[i + 1].getStateName();
        }
      }
    };

    // Returns a question object whose properties can be edited without
    // breaking the references in data.questions.
    var getBindableQuestion = function(stateName) {
      for (var i = 0; i < data.questions.length; i++) {
        if (data.questions[i].getStateName() === stateName) {
          return data.questions[i];
        }
      }
      throw Error(
        'Cannot find question corresponding to state named: ' + stateName);
    };

    return {
      // Attempts to initialize the local data variables. Returns true if
      // the initialization is successful (judged by the success of
      // initializing data.questions), and false otherwise.
      tryToInit: function() {
        data.title = SimpleEditorShimService.getTitle();
        data.introductionHtml = SimpleEditorShimService.getIntroductionHtml();
        data.questions = StatesToQuestionsService.getQuestions();
        return Boolean(data.questions);
      },
      getData: function() {
        return data;
      },
      getTitle: function() {
        return data.title;
      },
      getIntroductionHtml: function() {
        return data.introductionHtml;
      },
      getQuestions: function() {
        return data.questions;
      },
      saveTitle: function(newTitle) {
        SimpleEditorShimService.saveTitle(newTitle);
        data.title = newTitle;
      },
      saveIntroductionHtml: function(newIntroductionHtml) {
        SimpleEditorShimService.saveIntroductionHtml(newIntroductionHtml);
        data.introductionHtml = newIntroductionHtml;
      },
      saveCustomizationArgs: function(stateName, newCustomizationArgs) {
        SimpleEditorShimService.saveCustomizationArgs(
          stateName, newCustomizationArgs);
        getBindableQuestion(stateName).setInteractionCustomizationArgs(
          newCustomizationArgs);
      },
      saveAnswerGroups: function(stateName, newAnswerGroups) {
        SimpleEditorShimService.saveAnswerGroups(stateName, newAnswerGroups);
        getBindableQuestion(stateName).setAnswerGroups(newAnswerGroups);
      },
      saveDefaultOutcome: function(stateName, newDefaultOutcome) {
        SimpleEditorShimService.saveDefaultOutcome(
          stateName, newDefaultOutcome);
        getBindableQuestion(stateName).setDefaultOutcome(newDefaultOutcome);
      },
      saveBridgeHtml: function(stateName, newHtml) {
        // This is actually the content HTML for the *next* state.
        SimpleEditorShimService.saveBridgeHtml(
          getNextStateName(stateName), newHtml);
        getBindableQuestion(stateName).setBridgeHtml(newHtml);
      },
      addNewQuestion: function() {
        // This effectively adds a new multiple-choice interaction to the
        // latest state in the chain.
        var lastStateName = (
          data.questions.length > 0 ?
          data.questions[data.questions.length - 1].getDestinationStateName() :
          SimpleEditorShimService.getInitStateName());

        SimpleEditorShimService.saveInteractionId(
          lastStateName, DEFAULT_INTERACTION.ID);
        SimpleEditorShimService.saveCustomizationArgs(
          lastStateName, DEFAULT_INTERACTION.CUSTOMIZATION_ARGS);
        SimpleEditorShimService.saveDefaultOutcome(lastStateName, {
          dest: lastStateName,
          feedback: [''],
          param_changes: []
        });

        var stateData = SimpleEditorShimService.getState(lastStateName);
        data.questions.push(QuestionObjectFactory.create(
          lastStateName, stateData.interaction, ''));
      },
      canAddNewQuestion: function() {
        // Requirements:
        // - If this is the first question, there must already be an
        //   introduction.
        // - Otherwise, the requirement is that, for the last question in the
        //   list, there is at least one answer group.
        if (data.questions.length === 0) {
          return Boolean(data.introductionHtml);
        } else {
          return data.questions[data.questions.length - 1].hasAnswerGroups();
        }
      },
      canTryToPublish: function() {
        return this.canAddNewQuestion() && data.questions.length > 2;
      },
      addState: function() {
        var newStateName = getNewStateName();
        SimpleEditorShimService.addState(newStateName);
        SimpleEditorShimService.saveInteractionId(
          newStateName, END_EXPLORATION_INTERACTION.ID);
        SimpleEditorShimService.saveCustomizationArgs(
          newStateName, END_EXPLORATION_INTERACTION.CUSTOMIZATION_ARGS);
        SimpleEditorShimService.saveDefaultOutcome(newStateName, null);
        return newStateName;
      }
    };
  }
]);
