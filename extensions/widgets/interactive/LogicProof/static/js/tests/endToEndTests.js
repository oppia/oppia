function TestCtrl($scope) {

  $scope.questionInstance = logicProofStudent.buildInstance(
    LOGIC_PROOF_DEFAULT_QUESTION_DATA);

  $scope.validProofs = [{
    assumptionsString: 'p',
    targetString: 'p',
    proofString: 'we know p'
  }]

  $scope.invalidProofs = [{
    assumptionsString: 'p',
    targetString: 'p',
    proofString: 'we knew p',
    expectedError: 'The phrase starting \'we\' could not be identified; please\
 make sure you are only using phrases from the given list of vocabulary.'
  }]

  $scope.validResults = [];
  for (var i = 0; i < $scope.validProofs.length; i++) {
    try {
      var question = logicProofTeacher.buildQuestion(
        $scope.validProofs[i].assumptionsString, 
        $scope.validProofs[i].targetString, 
        $scope.questionInstance.vocabulary);
      $scope.questionInstance.assumptions = question.assumptions;
      $scope.questionInstance.results = question.results;
      $scope.questionInstance.language.operators = question.operators;
      var proof = logicProofStudent.buildProof(
        $scope.validProofs[i].proofString, $scope.questionInstance);
      logicProofStudent.checkProof(proof, $scope.questionInstance);
      $scope.validResults.push({
        index: (i+1) + '. ',
        result: 'passed',
        error: ''
      });
    }
    catch (err) {
      $scope.validResults.push({
        index: (i+1) + '. ',
        result: 'failed',
        error: err.message
      })
    }
  }

  $scope.invalidResults = [];
  for (var i = 0; i < $scope.invalidProofs.length; i++) {
    try {
      var question = logicProofTeacher.buildQuestion(
        $scope.invalidProofs[i].assumptionsString, 
        $scope.invalidProofs[i].targetString, 
        $scope.questionInstance.vocabulary);
      $scope.questionInstance.assumptions = question.assumptions;
      $scope.questionInstance.results = question.results;
      $scope.questionInstance.language.operators = question.operators;
      var proof = logicProofStudent.buildProof(
        $scope.invalidProofs[i].proofString, $scope.questionInstance);
      logicProofStudent.checkProof(proof, $scope.questionInstance);
      $scope.invalidResults.push({
        index: (i+1) + '. ',
        result: 'This proof was wrongly deemed correct.',
        expectedError: '',
        actualError: ''
      });
    }
    catch (err) {
      if (err.message === $scope.invalidProofs[i].expectedError) {
        $scope.invalidResults.push({
          index: (i+1) + '. ',
          result: 'passed',
          expectedError: '',
          actualError: ''
        });
      } else {
        $scope.invalidResults.push({
          index: (i+1) + '. ',
          result: 'failed',
          expectedError: $scope.invalidProofs[i].expectedError,
          actualError: err.message
        })
      }
    }
  }
} 


