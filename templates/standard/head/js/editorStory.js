var editorUrl = '/editor/';

// Makes the question boxes draggable.
oppia.directive('questionBox', function($compile) {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      $(element).draggable({
        containment: 'window',
        helper: 'clone',
        revert: 'invalid',
        start: function(event, ui) {
        },
        zIndex: 3000
      });
    }
  };
});

// Allows questions to be dropped into groups.
oppia.directive('addContentBox', function($compile) {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      $(element).droppable({
        accept: '.question-box',
        activeClass: 'droppable-active',
        drop: function(event, ui) {
          // Get the question box, and stick it in the given group.
          var classList = ui.draggable[0].classList;
          var questionId = null;
          // Make the following more robust, so that it throws an error if there
          // is no questionId or there are duplicate questionIds.
          for (var i = 0; i < classList.length; ++i) {
            if (classList[i].indexOf('id-') == 0)
              questionId = classList[i].substring(3);
          }
          console.log(questionId);

          var groupId = null;
          var groupBoxClassList = event.target.classList;
          for (var i = 0; i < groupBoxClassList.length; ++i) {
            if (groupBoxClassList[i].indexOf('group-id-') == 0)
              groupId = groupBoxClassList[i].substring(9);
          }
          console.log(groupId);

          scope.moveQuestionToGroup(questionId, groupId);
          scope.$apply();
        }
      });
    }
  };
});


function StoryEditor($scope, $http, $timeout) {
  // The pathname is expected to be: /editor/[story_id]
  var pathnameArray = window.location.pathname.split('/');
  $scope.story = { id: pathnameArray[2] };
  $scope.currChapter = parseInt(pathnameArray[4]) || 0;
  $scope.currentActiveInput = '';

  var dataRequestUrl = window.editorUrl + $scope.story.id + '/structure/' +
      $scope.currChapter + '/data';
  $http.get(dataRequestUrl).success(function(data) {
    $scope.story.desc = data.story_name;
    $scope.chapters = data.chapters;
    $scope.currChapter = data.curr_chapter;
    $scope.initQuestionId = data.init_question_id;
    $scope.storyNavigation = data.navigation;
  });

  /**
   * Adds a new collaborator.
   */
  // TODO(sll): Display the current list of collaborators in the UI.
  $scope.addEditor = function() {
    $('#addEditorLoading').show();
    $http.put(
        editorUrl + $scope.story.id + '/structure/',
        'new_editor=' + $scope.newEditor,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
                if (data.error) {
                  $scope.addWarning(data.error ? data.error :
                      'Error: Could not add new editor.');
                } else {
                  $scope.addWarning('New editor successfully added.');
                }
                $('#addEditorLoading').hide();
            }).error(function(data) {
                $scope.addWarning(data.error ? data.error :
                      'Error: Could not add new editor.');
                $('#addEditorLoading').hide();
            });
  };

  /**
   * Adds a new chapter to the list of chapters, and updates the backend.
   * @param {String} newChapterName The name of the added chapter.
   */
  $scope.addChapter = function(newChapterName) {
    if (!$scope.isValidEntityName(newChapterName))
      return;
    $('#addChapterLoading').show();
    $http.post(
        editorUrl + $scope.story.id + '/structure/',
        'chapter_name=' + newChapterName,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              if (data.error) {
                $scope.addWarning(data.error ? data.error :
                    'Error while adding new chapter.');
              } else {
                console.log(data);
                $('#addChapterLoading').hide();
                $scope.chapters.push({
                    desc: data.chapter_name,
                    groups: [{
                        id: data.new_group_id,
                        desc: data.new_group_name,
                        questions: []}],
                    freeQuestions: []});
                console.log('GROUPs');
                console.log($scope.chapters);
                $scope.newChapterName = '';
              }
            });
  };

  /**
   * Adds a new question to the list of questions, and updates the backend.
   */
  $scope.addQuestion = function() {
    if (!$scope.isValidEntityName($scope.newQuestionName))
      return;
    var chapter = $scope.chapters[$scope.currChapter];
    console.log(chapter);
    for (var i = 0; i < chapter.groups.length; ++i) {
      for (var j = 0; j < chapter.groups[i].questions.length; ++j) {
        if (chapter.groups[i].questions[j].desc == $scope.newQuestionName) {
          $scope.addWarning('This name has already been used.');
          return;
        }
      }
    }
    for (var i = 0; i < chapter.freeQuestions.length; ++i) {
      if (chapter.freeQuestions[i].desc == $scope.newQuestionName) {
        $scope.addWarning('This name has already been used.');
        return;
      }
    }

    $('#addQuestionLoading').show();
    $http.post(
        editorUrl + $scope.story.id + '/structure/',
        'question_name=' + $scope.newQuestionName +
        '&chapter_number=' + $scope.currChapter,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $('#addQuestionLoading').hide();
              if (data.error) {
                $scope.addWarning(data.error ? data.error :
                    'Error while adding new question.');
              } else {
                console.log($scope.chapters);
                console.log($scope.currChapter);
                console.log(data);
                $scope.chapters[data.chapter_number].freeQuestions.push(
                    {id: data.question_id, desc: data.question_name});
                $scope.newQuestionName = '';
              }
            });
  };

  /**
   * Redirects the content creator to the page for editing an question.
   * @param {Object} question The question to be edited.
   */
  $scope.editQuestion = function(question) {
    window.location = editorUrl + $scope.story.id + '/qneditor/' +
        $scope.currChapter + '/' + question.id;
  };

  $scope.addQuestionGroup = function(newQuestionGroupName) {
    if (!$scope.isValidEntityName(newQuestionGroupName))
      return;
    $('#addQuestionGroupLoading').show();
    $http.post(
        editorUrl + $scope.story.id + '/structure/',
        'question_group_name=' + newQuestionGroupName +
        '&chapter_number=' + $scope.currChapter,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              if (data.error) {
                $scope.addWarning(data.error ? data.error :
                    'Error while adding new question group.');
              } else {
                console.log(data);
                $('#addQuestionGroupLoading').hide();
                $scope.chapters[data.chapter_number].groups.push(
                    {id: data.question_group_id,
                     desc: data.question_group_name,
                     questions: []});
                $scope.newQuestionGroupName = '';
              }
            });
  };

  /**
   * Assigns a question to a group, taking it out of its previous group.
   * @param {String} questionId The id of the question.
   * @param {String} groupId The id of the question group.
   */
  // TODO(sll): Refactor this so that it uses keys in an Object, not indexes
  // in an array.
  $scope.moveQuestionToGroup = function(questionId, groupId) {
    var question = null;
    var groups = $scope.chapters[$scope.currChapter].groups;

    // Delete questionId from wherever it was.
    var oldGroupId = null;
    for (var i = 0; i < groups.length; ++i) {
      for (var j = 0; j < groups[i].questions.length; ++j) {
        if (groups[i].questions[j].id == questionId) {
          oldGroupId = groups[i].id;
          question = groups[i].questions[j];
          $scope.chapters[$scope.currChapter].groups[i].questions.splice(j, 1);
          break;
        }
      }
    }
    console.log(oldGroupId);
    if (oldGroupId == null) {
      for (var i = 0; i < $scope.chapters[$scope.currChapter].
               freeQuestions.length; ++i) {
        if ($scope.chapters[$scope.currChapter].freeQuestions[i].id ==
               questionId) {
          question = $scope.chapters[$scope.currChapter].freeQuestions[i];
          $scope.chapters[$scope.currChapter].freeQuestions.splice(i, 1);
          break;
        }
      }
    }

    // Add questionId to groupId.
    for (var i = 0; i < groups.length; ++i) {
      if (groups[i].id == groupId) {
        $scope.chapters[$scope.currChapter].groups[i].questions.push(question);
        break;
      }
    }

    console.log($scope.chapters[$scope.currChapter]);
    $http.put(
        editorUrl + $scope.story.id + '/structure/' + $scope.currChapter +
            '/data',
        'question_id=' + questionId + '&new_group_id=' + groupId,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              if (data.error) {
                $scope.addWarning(data.error ? data.error :
                    'Error in saving the question reassignment.');
              }
            });
  };

  /**
   * Deletes a question group.
   * @param {String} groupId The id of the question group.
   */
  $scope.deleteQuestionGroup = function(groupId) {
    $http.delete(
        editorUrl + $scope.story.id + '/structure/' + $scope.currChapter +
            '/g/' + groupId,
        '',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              if (data.error) {
                $scope.addWarning(data.error ? data.error :
                    'Error in deleting question group.');
              } else {
                var groups = $scope.chapters[$scope.currChapter].groups;
                for (var i = 0; i < groups.length; ++i) {
                  if (groups[i].id == groupId) {
                    for (var j = 0; j < groups[i].questions.length; ++j) {
                      $scope.chapters[$scope.currChapter].
                          freeQuestions.push(groups[i].questions[j]);
                    }
                    groups.splice(i, 1);
                    break;
                  }
                }
              }
            });
  };

  /**
   * Makes a group name editable.
   * @param {String} chapterName The current name of the chapter.
   */
  $scope.editChapterName = function(chapterName) {
    $scope.initializeNewActiveInput('chapterName');
    $scope.replacementChapterName = chapterName;
  };

  /**
   * Saves the edit to an existing chapter name.
   * @param {String} newChapterName The new chapter name.
   */
  $scope.saveChapterName = function(newChapterName) {
    $http.put(
        editorUrl + $scope.story.id + '/structure/' + $scope.currChapter +
            '/data',
        'chapter_name=' + newChapterName,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              if (data.error) {
                $scope.addWarning(data.error ? data.error :
                    'Error in saving new chapter name.');
              }
              $scope.currentActiveInput = '';
              $scope.replacementChapterName = '';
              $scope.chapters[$scope.currChapter].desc = newChapterName;
            }).error(function(data) {
              $scope.addWarning('Error communicating with server.');
              $scope.currentActiveInput = '';
            });
  };

  /**
   * Makes a group name editable.
   * @param {int} groupId The id of the group.
   * @param {String} groupName The current name of the group.
   */
  $scope.editGroupName = function(groupId, groupName) {
    $scope.initializeNewActiveInput('groupName-' + groupId);
    $scope.replacementGroupName = groupName;
  };

  /**
   * Saves the edit to an existing question group name.
   * @param {String} groupId The id of the group.
   * @param {String} newGroupName The new group name.
   */
  $scope.saveGroupName = function(groupId, newGroupName) {
    console.log(groupId);
    $http.put(
        editorUrl + $scope.story.id + '/structure/' + $scope.currChapter +
            '/g/' + groupId,
        'group_name=' + newGroupName,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              if (data.error) {
                $scope.addWarning(data.error ? data.error :
                    'Error in saving new group name.');
              }
              $scope.currentActiveInput = '';
              $scope.replacementGroupName = '';
              var groups = $scope.chapters[$scope.currChapter].groups;
              for (var i = 0; i < groups.length; ++i) {
                if (groups[i].id == groupId) {
                  groups[i].desc = newGroupName;
                  break;
                }
              }
            }).error(function(data) {
              $scope.addWarning('Error communicating with server.');
              $scope.currentActiveInput = '';
              $scope.replacementGroupName = '';
            });
  };

  /**
   * Opens an editor for group prerequisites.
   * @param {String} groupId The id of the group.
   */
  $scope.editGroupPrereqs = function(groupId) {
    $scope.initializeNewActiveInput('groupPrereqs-' + groupId);
  };

  $scope.addGroupMetricPrereq = function(groupId, name, value) {
    value = Number(value);
    if (!value || typeof value !== 'number') {
      $scope.addWarning('Invalid metric prerequisite value: ' + value);
      $scope.clearActiveInputs();
      return;
    }

    var groups = $scope.chapters[$scope.currChapter].groups;
    for (var i = 0; i < groups.length; ++i) {
      if (groups[i].id == groupId) {
        groups[i].prereqMetrics[name] = value;
        $scope.newGroupPrereqMetricName = '';
        $scope.newGroupPrereqMetricValue = '';
        $scope.saveGroupPrereqs(groups[i]);
        break;
      }
    }
  };

  $scope.editGroupPrereqMetricForm = function(group, key) {
    $scope.newGroupPrereqMetricName = key;
    $scope.newGroupPrereqMetricValue = Number(group.prereqMetrics[key]);
    group.prereqMetrics = {};
  };

  /**
   * Saves prerequisites for a question group.
   * @param {Object} group The group whose data is to be saved.
   */
  $scope.saveGroupPrereqs = function(group) {
    $http.put(
        editorUrl + $scope.story.id + '/structure/' + $scope.currChapter +
            '/g/' + group.id,
        'prereq_metrics=' + JSON.stringify(group.prereqMetrics) +
            '&prereq_date=' + JSON.stringify(group.prereqDate),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              if (data.error) {
                $scope.addWarning(data.error ||
                    'Error in updating group prerequisites.');
              }
            }).error(function(data) {
              $scope.addWarning('Error communicating with server.');
            });
  };

  /**
   * Saves an edit to the story navigation style.
   */
  $scope.saveStoryNav = function() {
    $http.post(
        editorUrl + $scope.story.id + '/structure/',
        'story_navigation=' + $scope.storyNavigation,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              if (data.error) {
                $scope.addWarning(data.error ? data.error :
                    'Error while changing story navigation.');
              } else {
                $scope.addWarning('Change to story navigation saved.');
              }
            });
  };

  /**
   * Switches the chapter in the view.
   * @param {String} index The index of the chapter to be switched to.
   */
  $scope.switchChapter = function(index) {
    $scope.currChapter = index;
    window.history.replaceState('', '', window.editorUrl + $scope.story.id +
        '/' + $scope.currChapter);
  };

  /**
   * Initializes the new active input.
   * @param {String} newActiveInput The new currentActiveInput.
   */
  $scope.initializeNewActiveInput = function(newActiveInput) {
    $scope.currentActiveInput = newActiveInput;
  };

  /**
   * Clears the active input.
   */
  $scope.clearActiveInputs = function() {
    $scope.currentActiveInput = '';
  };

  /**
   * Tests whether a JavaScript object is empty.
   * @param {Object} obj The object to be tested.
   * @return {boolean} Whether obj is empty.
   */
  $scope.isEmpty = function(obj) {
    for (var item in obj) {
      if (obj.hasOwnProperty(item)) {
        return false;
      }
    }
    return true;
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
StoryEditor.$inject = ['$scope', '$http', '$timeout'];
