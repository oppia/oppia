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

    var DEFAULT_INTERACTION_PROPERTIES = {
      MultipleChoiceInput: {
        CUSTOMIZATION_ARGS:  {
          choices: {
            value: ['<p>Option 1</p>']
          }
        },
        FIRST_ANSWER_GROUP_RULE: {
          type: 'Equals',
          value: {
            x: 0
          }
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

    // Change the destination in all answer groups from oldStateName to newStateName.
    var changeDestInAnswerGroups = function(oldStateName, newStateName) {
      var allStateNames = SimpleEditorShimService.getAllStateNames();
      for (var i = 0; i < allStateNames.length; i++) {
        var currentState = SimpleEditorShimService.getState(allStateNames[i]);
        var newAnswerGroups = currentState.interaction.answerGroups;
        var answerGroupsHaveChanged = false;
        currentState.interaction.answerGroups.forEach(
          function(answerGroup, index) {
            if (answerGroup.outcome.dest === oldStateName) {
              newAnswerGroups[index].outcome.dest = newStateName;
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

    var setDestOfFirstAnswerGroup = function(sourceState, destinationState) {
      var answerGroups = SimpleEditorShimService.getState(sourceState)
        .interaction.answerGroups;
      answerGroups[0].outcome.dest = destinationState;
      SimpleEditorShimService.saveAnswerGroups(sourceState, answerGroups);
      data.questionList.getBindableQuestion(sourceState)
        .setAnswerGroups(answerGroups);
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
          lastStateName, 'MultipleChoiceInput');
        SimpleEditorShimService.saveCustomizationArgs(
          lastStateName,
          DEFAULT_INTERACTION_PROPERTIES.MultipleChoiceInput.CUSTOMIZATION_ARGS
        );
        SimpleEditorShimService.saveDefaultOutcome(
          lastStateName, OutcomeObjectFactory.createEmpty(lastStateName));

        var stateData = SimpleEditorShimService.getState(lastStateName);
        data.questionList.addQuestion(QuestionObjectFactory.create(
          lastStateName, stateData.interaction, ''));
      },
      changeQuestionType: function(newInteractionId, index) {
        var currentStateName = data.questionList.getAllStateNames()[index];
        var currentInteractionId = (
          SimpleEditorShimService.getInteractionId(currentStateName));
        // Update the question type if the interaction ID has changed.
        if (newInteractionId !== currentInteractionId) {
          var nextStateName = data.questionList.getAllStateNames()[index + 1];
          var questionCount = data.questionList.getQuestionCount();
          var doesLastQuestionHaveAnswerGroups = (
            data.questionList.doesLastQuestionHaveAnswerGroups());
          SimpleEditorShimService.saveInteractionId(
            currentStateName, newInteractionId);
          SimpleEditorShimService.saveCustomizationArgs(
            currentStateName,
            DEFAULT_INTERACTION_PROPERTIES[newInteractionId].
              CUSTOMIZATION_ARGS);
          // Don't save answer group when it's the last question and doesn't
          // have a answer group.
          if (index !== questionCount - 1 || doesLastQuestionHaveAnswerGroups) {
            var newAnswerGroups = [];
            newAnswerGroups.push(AnswerGroupObjectFactory.createNew([
              RuleObjectFactory.createNew(
                DEFAULT_INTERACTION_PROPERTIES[newInteractionId].
                  FIRST_ANSWER_GROUP_RULE.type,
                DEFAULT_INTERACTION_PROPERTIES[newInteractionId].
                  FIRST_ANSWER_GROUP_RULE.value
              )
            ], OutcomeObjectFactory.createEmpty(nextStateName), false));
            SimpleEditorShimService.saveAnswerGroups(
              currentStateName, newAnswerGroups);
          }
        }
        // Update the question in the locally-stored questionList.
        var questions = StatesToQuestionsService.getQuestions();
        data.questionList.updateQuestion(index, questions[index]);
      },
      deleteQuestion: function(question) {
        console.log(question);
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
      alternativeMove: function(oldIndex,newIndex) {
        var stateNamesInOrder = data.questionList.getAllStateNames();
        var oldQuestion = SimpleEditorShimService.getState(stateNamesInOrder[oldIndex]);
        var question = data.questionList._questions[oldIndex];
        this.deleteQuestion(question);
      },
      insertQuestion: function(oldIndex, newIndex) {
      },
      move: function(index) {
        console.log(oldIndex+"=>"+newIndex);

       console.log(data.questionList);
       var stateNamesInOrder = data.questionList.getAllStateNames();
       var oldQuestion = SimpleEditorShimService.getState(stateNamesInOrder[oldIndex+1]);
       console.log(oldQuestion);

       var oldQuestionAnswerGroups = oldQuestion.interaction.answerGroups;
       var previousQuestion = SimpleEditorShimService.getState(stateNamesInOrder[newIndex-1]);
       var previousQuestionAnswerGroups = previousQuestion.interaction.answerGroups;

       var oldpreviousQuestion = SimpleEditorShimService.getState(stateNamesInOrder[oldIndex-1]);
       var oldpreviousQuestionAnswerGroups = previousQuestion.interaction.answerGroups;

       var questionCount = data.questionList.getQuestionCount();
       if (oldIndex === questionCount - 1 ){
         //Self Loop last Question.
         oldpreviousQuestionAnswerGroups[0].outcome.dest = stateNamesInOrder[oldIndex-1];
         makeStateTerminal(stateNamesInOrder[oldIndex-1]);
       }
       else {
         oldpreviousQuestionAnswerGroups[0].outcome.dest = stateNamesInOrder[oldIndex+1];
         SimpleEditorShimService.saveAnswerGroups(stateNamesInOrder[oldIndex-1], oldpreviousQuestionAnswerGroups);
       }
        // Set dest in new Question to question to be moved.
        oldQuestionAnswerGroups[0].outcome.dest = stateNamesInOrder[newIndex];
        SimpleEditorShimService.saveAnswerGroups(stateNamesInOrder[oldIndex], oldQuestionAnswerGroups);

       // Set dest of newIndex-1 to question to be moved.
       previousQuestionAnswerGroups[0].outcome.dest = stateNamesInOrder[oldIndex];
       SimpleEditorShimService.saveAnswerGroups(stateNamesInOrder[newIndex-1], previousQuestionAnswerGroups);
       if(oldIndex > newIndex){
         for(i= oldIndex; i > newIndex; i--){
          var tempQuestion = SimpleEditorShimService.getState(stateNamesInOrder[i-1]);
          data.questionList.updateQuestion(i, tempQuestion);
        }
       }
       else{
         for(i= oldIndex; i < newIndex; i++){
          var tempQuestion = SimpleEditorShimService.getState(stateNamesInOrder[i+1]);
          data.questionList.updateQuestion(i, tempQuestion);
        }
       }
       data.questionList.updateQuestion(newIndex, oldQuestion);
       console.log(data.questionList);
      },
      canAddNewQuestion: function() {
        // Requirements:
        // - If this is the first question, there must already be an
        //   introduction.
        // - Otherwise, the requirement is that, for the last question in the
        //   list, there is at least one answer group.
      //  console.log(data.questionList);
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
