function TestCtrl($scope) {

  $scope.buildIndexer = function(n) {
    var output = [];
    for (var i = 0; i < n; i++) {
      output.push(i);
    }
    return output;
  }

  $scope.buildErrors = function(n) {
    var output = [];
    for (var i = 0; i < n; i++) {
      output.push('');
    }
    return output;
  }

  $scope.questionData = LOGIC_PROOF_DEFAULT_QUESTION_DATA;  
  $scope.proofString = 'from P\u2227Q we have P\nfrom P\u2227Q we have Q\nfrom Q and P we have Q\u2227P';
  
  $scope.displayMessage = function(message, line) {
    $scope.proofError = '';
    for (var i = 0; i < line; i++) {
      $scope.proofError += ' \n';
    }
    var pointer = 0;
    while (pointer < message.length) {
      var nextSpace = message.slice(pointer, pointer + 70).lastIndexOf(' ');
      var breakPoint = (nextSpace <= 0 || pointer + 70 >= message.length) ? 70: nextSpace + 1;
      $scope.proofError += (message.slice(pointer, pointer + breakPoint) + '\n');
      pointer += breakPoint;
    }
  }

  $scope.editProof = function() {
    $scope.checkSuccess = false;
    if ($scope.proofString.slice(-1) === '\n') {
      questionInstance = logicProofStudent.buildInstance($scope.questionData);
      try {
        logicProofStudent.validateProof($scope.proofString, questionInstance);
      }
      catch (err) {
        $scope.displayMessage(err.message, err.line);
      }
    } else {
      $scope.proofError = '';
    }
  }

  $scope.submitProof = function() {
    questionInstance = logicProofStudent.buildInstance($scope.questionData);
    try {
      proof = logicProofStudent.buildProof($scope.proofString, questionInstance);
      logicProofStudent.checkProof(proof, questionInstance);
      $scope.proofError = '';
      $scope.checkSuccess = true;
    }
    catch (err) {
      $scope.displayMessage(err.message, err.line);
      $scope.checkSuccess = false;
    }
  }

  // LOCAL CHECK (for testing only)
  $scope.localCheck = function() {
    $scope.buildProof();
    $scope.localCheck = 'mistake not found'
    var parameters = {
      proof: $scope.proof,
      assumptions: $scope.questionData.assumptions,
      target: $scope.questionData.results[0]
    };
    for ( var i = 0; i < $scope.questionData.mistake_table.length; i++) {
      for (var j = 0; j < $scope.questionData.mistake_table[i].entries.length; j++) {
        var mistake = $scope.questionData.mistake_table[i].entries[j];
        if (mistake.name === $scope.mistakeName) {
          $scope.localCheck = logicProofStudent.evaluate(mistake.occurs, {n: parseInt($scope.line)}, $scope.questionData.control_model, parameters, {});
        }
      }
    }
  }

  // QUESTION
  $scope.assumptionsString = 'P\u2227Q';
  $scope.targetString = 'Q\u2227P';
  $scope.submitQuestion = function() {
    $scope.checkError = '';
    $scope.checkSuccess = false;
    $scope.buildError = '';
    $scope.buildSuccess = false;
    $scope.questionError = '';
    try {
      var attempt = logicProofTeacher.buildQuestion($scope.assumptionsString, $scope.targetString, $scope.questionData.vocabulary);
      $scope.questionData.assumptions = attempt.assumptions;
      $scope.questionData.results = attempt.results;
      $scope.questionData.language.operators = attempt.operators;
      $scope.questionSuccess = true;
      $scope.assumptionsDisplay = logicProofShared.displayExpressionArray($scope.questionData.assumptions, $scope.questionData.language.operators);
      $scope.targetDisplay = logicProofShared.displayExpression($scope.questionData.results[0], $scope.questionData.language.operators);
    }
    catch (err) {
      $scope.questionError = err.message;
      $scope.questionSuccess = false;
    }
  }
  $scope.submitQuestion();

  // LINE TEMPLATES
  $scope.lineTemplateStrings = logicProofTeacher2.displayLineTemplateTable($scope.questionData.line_templates, $scope.questionData.vocabulary);
  $scope.lineTemplateIndexer = $scope.buildIndexer($scope.lineTemplateStrings.length);
  $scope.submitLineTemplates = function() {
    $scope.checkError = '';
    $scope.checkSuccess = false;
    $scope.buildError = '';
    $scope.buildSuccess = false;
    try {
      $scope.questionData.line_templates = logicProofTeacher2.buildLineTemplateTable($scope.lineTemplateStrings, $scope.questionData.vocabulary);
      $scope.lineTemplateSuccess = true;
      $scope.LineTemplateErrors = $scope.buildErrors($scope.lineTemplateStrings.length);
    }
    catch (err) {
      $scope.LineTemplateErrors = err;
      $scope.lineTemplateSuccess = false;
    }
  }
  $scope.submitLineTemplates();

  // MISTAKE TABLE
  $scope.mistakeStrings = logicProofTeacher2.displayMistakeTable($scope.questionData.mistake_table);
  $scope.mistakeIndexer = $scope.buildIndexer($scope.mistakeStrings.length);
  $scope.mistakeSectionIndexer = [];
  $scope.mistakeSuccess = [];
  $scope.mistakeErrors = [];
  for (var i = 0; i < $scope.mistakeStrings.length; i++) {
    $scope.mistakeSectionIndexer.push($scope.buildIndexer($scope.mistakeStrings[i].entries.length));
    $scope.mistakeSuccess.push(true);
    $scope.mistakeErrors.push([]);
  }
  $scope.submitMistakes = function(sectionNumber) {
    $scope.checkError = '';
    $scope.checkSuccess = false;
    $scope.buildError = '';
    $scope.buildSuccess = false;
    try {
      $scope.questionData.mistake_table[sectionNumber] = logicProofTeacher2.buildMistakeSection(
        $scope.mistakeStrings[sectionNumber].name, 
        $scope.mistakeStrings[sectionNumber].entries, 
        $scope.questionData.control_functions);
      $scope.mistakeSuccess[sectionNumber] = true;
      $scope.mistakeErrors[sectionNumber] = $scope.buildErrors($scope.mistakeStrings[sectionNumber].entries.length);
    }
    catch (err) {
      $scope.mistakeSuccess[sectionNumber] = false;
      $scope.mistakeErrors[sectionNumber] = err;
    }
  }
  for (var i = 0; i < $scope.mistakeStrings.length; i++) {
    $scope.submitMistakes(i);
  }

  // CONTROL FUNCTIONS
  $scope.controlFunctionStrings = logicProofTeacher2.displayControlFunctionTable($scope.questionData.control_functions);
  $scope.controlFunctionIndexer = $scope.buildIndexer($scope.controlFunctionStrings.length);
  $scope.submitControlFunctions = function() {
    $scope.checkError = '';
    $scope.checkSuccess = false;
    $scope.buildError = '';
    $scope.buildSuccess = false;
    $scope.controlFunctionErrors = $scope.buildErrors($scope.controlFunctionStrings.length);
    try {
      $scope.questionData.control_functions = logicProofTeacher2.buildControlFunctionTable($scope.controlFunctionStrings);
      $scope.controlFunctionSuccess = true;
    }
    catch (err) {
      $scope.controlFunctionErrors[err.line] = err.message;
      $scope.controlFunctionSuccess = false;
    }
  };
  $scope.submitControlFunctions();
} 


