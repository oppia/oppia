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
  'AnswerGroupObjectFactory', 'explorationInitStateNameService',
  'OutcomeObjectFactory', 'QuestionListObjectFactory',
  'QuestionObjectFactory', 'RuleObjectFactory', 'SimpleEditorShimService',
  'StatesToQuestionsService',
  function(
    AnswerGroupObjectFactory, explorationInitStateNameService,
    OutcomeObjectFactory, QuestionListObjectFactory,
    QuestionObjectFactory, RuleObjectFactory, SimpleEditorShimService,
    StatesToQuestionsService) {
    var data = {
      title: null,
      introductionHtml: null,
      questionList: null
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
        recommendedExplorationIds: {
          value: []
        }
      }
    };

    var getNewStateName = function() {
      var allStateNames = data.questionList.getAllStateNames();

      var minimumStateNumber = data.questionList.getQuestionCount();
      while (allStateNames.indexOf('Question ' + minimumStateNumber) !== -1) {
        minimumStateNumber++;
      }
      return 'Question ' + minimumStateNumber;
    };

    // Overwrites the given state's properties so that they match those of a
    // terminal state.
    var makeStateTerminal = function(stateName) {
      SimpleEditorShimService.saveInteractionId(
        stateName, END_EXPLORATION_INTERACTION.ID);
      SimpleEditorShimService.saveCustomizationArgs(
        stateName, END_EXPLORATION_INTERACTION.CUSTOMIZATION_ARGS);
      SimpleEditorShimService.saveDefaultOutcome(stateName, null);
    };

    // Changes both states and the present questionList to reflect the changes.
    var redirectAllIncomingNodes = function(stateName, newStateName) {
      var allStateNames = SimpleEditorShimService.getAllStateNames();
      for (var i = 0; i < allStateNames.length; i++) {
        var currentState = SimpleEditorShimService.getState(allStateNames[i]);
        var newAnswerGroups = currentState.interaction.answerGroups;
        var answerGroupsHaveChanged = false;
        currentState.interaction.answerGroups.forEach(
          function(answerGroup, idx) {
            if (answerGroup.outcome.dest === stateName) {
              newAnswerGroups[idx].outcome.dest = newStateName;
              answerGroupsHaveChanged = true;
            }
          });
        if (answerGroupsHaveChanged) {
          SimpleEditorShimService.saveAnswerGroups(
            allStateNames[i], newAnswerGroups);
          data.questionList.getBindableQuestion(allStateNames[i])
            .setAnswerGroups(newAnswerGroups);
        }
      }
    };

    var directAtoB = function(stateNameA, stateNameB) {
      var answerGroupsA = SimpleEditorShimService.getState(stateNameA)
        .interaction.answerGroups;
      answerGroupsA[0].outcome.dest = stateNameB;
      SimpleEditorShimService.saveAnswerGroups(stateNameA, answerGroupsA);
      data.questionList.getBindableQuestion(stateNameA)
        .setAnswerGroups(answerGroupsA);
    };

    return {
      // Attempts to initialize the local data variables. Returns true if
      // the initialization is successful (judged by the success of
      // initializing the question list), and false otherwise.
      tryToInit: function() {
        data.title = SimpleEditorShimService.getTitle();
        data.introductionHtml = SimpleEditorShimService.getIntroductionHtml();
        var questions = StatesToQuestionsService.getQuestions();
        if (!questions) {
          return false;
        }

        data.questionList = QuestionListObjectFactory.create(questions);
        return true;
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
      getQuestionList: function() {
        return data.questionList;
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
        data.questionList.getBindableQuestion(
          stateName).setInteractionCustomizationArgs(newCustomizationArgs);
      },
      saveAnswerGroups: function(stateName, newAnswerGroups) {
        SimpleEditorShimService.saveAnswerGroups(stateName, newAnswerGroups);
        data.questionList.getBindableQuestion(
          stateName).setAnswerGroups(newAnswerGroups);
      },
      saveDefaultOutcome: function(stateName, newDefaultOutcome) {
        SimpleEditorShimService.saveDefaultOutcome(
          stateName, newDefaultOutcome);
        data.questionList.getBindableQuestion(
          stateName).setDefaultOutcome(newDefaultOutcome);
      },
      saveBridgeHtml: function(stateName, newHtml) {
        // This is actually the content HTML for the *next* state.
        SimpleEditorShimService.saveBridgeHtml(
          data.questionList.getNextStateName(stateName), newHtml);
        data.questionList.getBindableQuestion(
          stateName).setBridgeHtml(newHtml);
      },
      addNewQuestion: function() {
        // This effectively adds a new multiple-choice interaction to the
        // latest state in the chain.
        var lastStateName = (
          data.questionList.isEmpty() ?
          SimpleEditorShimService.getInitStateName() :
          data.questionList.getLastQuestion().getDestinationStateName());

        SimpleEditorShimService.saveInteractionId(
          lastStateName, DEFAULT_INTERACTION.ID);
        SimpleEditorShimService.saveCustomizationArgs(
          lastStateName, DEFAULT_INTERACTION.CUSTOMIZATION_ARGS);
        SimpleEditorShimService.saveDefaultOutcome(
          lastStateName, OutcomeObjectFactory.createEmpty(lastStateName));

        var stateData = SimpleEditorShimService.getState(lastStateName);
        data.questionList.addQuestion(QuestionObjectFactory.create(
          lastStateName, stateData.interaction, ''));
      },
      deleteQuestion: function(question) {
        // - Change destination of answer groups that point to it.
        // - Move content stored in present state to next state if it exists.
        // - Delete the state.
        var stateName = question.getStateName();
        var state = SimpleEditorShimService.getState(stateName);
        // If it's the last question in the list, make it EndExploration.
        if (state.interaction.answerGroups.length === 0) {
          makeStateTerminal(stateName);
          data.questionList.removeQuestion(question);
          return;
        }
        var nextStateName = state.interaction.answerGroups[0].outcome.dest;
        // Change init state name, if init_state is being deleted.
        if (SimpleEditorShimService.getInitStateName() === stateName) {
          explorationInitStateNameService.displayed = nextStateName;
          explorationInitStateNameService.saveDisplayedValue(nextStateName);
        }
        redirectAllIncomingNodes(stateName, nextStateName);
        SimpleEditorShimService.saveStateContent(nextStateName, state.content);
        SimpleEditorShimService.deleteState(stateName);
        data.questionList.removeQuestion(question);
      },

      sortQuestions: function(sIndex, dIndex) {
        var stateNamesInOrder = data.questionList.getAllStateNames();
        var sStateName = stateNamesInOrder[sIndex];
        var sState = SimpleEditorShimService.getState(sStateName);
        var dStateName = stateNamesInOrder[dIndex];
        var dState = SimpleEditorShimService.getState(dStateName);
        if (dState.interaction.answerGroups.length === 0 ||
          sState.interaction.answerGroups.length === 0) {
          var newStateName = this.addState();
          var newAnswerGroups = [];
          newAnswerGroups.push(AnswerGroupObjectFactory.createNew([
            RuleObjectFactory.createNew('Equals', {
              x: 0
            })
          ], OutcomeObjectFactory.createEmpty(newStateName), false));
          if (dState.interaction.answerGroups.length === 0) {
            SimpleEditorShimService.saveAnswerGroups(dStateName,
              newAnswerGroups);
            dState.interaction.answerGroups = newAnswerGroups;
          } else {
            SimpleEditorShimService.saveAnswerGroups(sStateName,
              newAnswerGroups);
            sState.interaction.answerGroups = newAnswerGroups;
          }
        }
        var sDestName = sState.interaction.answerGroups[0].outcome.dest;
        var dDestName = dState.interaction.answerGroups[0].outcome.dest;

        redirectAllIncomingNodes(sStateName, sDestName);
        if (sIndex < dIndex) {
          directAtoB(dStateName, sStateName);
          directAtoB(sStateName, dDestName);
          var tmp = SimpleEditorShimService.getState(dDestName).content;
          SimpleEditorShimService.saveStateContent(
            dDestName, SimpleEditorShimService.getState(sDestName).content);
          SimpleEditorShimService.saveStateContent(sDestName, sState.content);
          SimpleEditorShimService.saveStateContent(sStateName, tmp);
          if (sStateName === SimpleEditorShimService.getInitStateName()) {
            explorationInitStateNameService.displayed = sDestName;
            explorationInitStateNameService.saveDisplayedValue(sDestName);
          }
        } else {
          redirectAllIncomingNodes(dStateName, sStateName);
          directAtoB(sStateName, dStateName);
          var tmp = SimpleEditorShimService.getState(sDestName).content;
          SimpleEditorShimService.saveStateContent(sDestName, sState.content);
          SimpleEditorShimService.saveStateContent(sStateName, dState.content);
          SimpleEditorShimService.saveStateContent(dStateName, tmp);
          if (dStateName === SimpleEditorShimService.getInitStateName()) {
            explorationInitStateNameService.displayed = sStateName;
            explorationInitStateNameService.saveDisplayedValue(sStateName);
          }
        }
      },

      canAddNewQuestion: function() {
        // Requirements:
        // - If this is the first question, there must already be an
        //   introduction.
        // - Otherwise, the requirement is that, for the last question in the
        //   list, there is at least one answer group.
        if (data.questionList.isEmpty()) {
          return Boolean(data.introductionHtml);
        } else {
          return data.questionList.getLastQuestion().hasAnswerGroups();
        }
      },
      canTryToFinishExploration: function() {
        return (
          this.canAddNewQuestion() &&
          data.questionList.getQuestionCount() > 2);
      },
      addState: function() {
        var newStateName = getNewStateName();
        SimpleEditorShimService.addState(newStateName);
        makeStateTerminal(newStateName);
        return newStateName;
      }
    };
  }
]);
