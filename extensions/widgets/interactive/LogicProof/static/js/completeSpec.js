// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Complete tests for LogicProof widget js.
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var errorWrapper = function(dubiousFunction, input1, input2, input3, input4, input5, input6) {
  return function() {
    try {
      if(input1 === undefined) {
        dubiousFunction();
      } else if(input2 === undefined) {
        dubiousFunction(input1);
      } else if(input3 === undefined) {
        dubiousFunction(input1, input2);
      } else if(input4 === undefined) {
        dubiousFunction(input1, input2, input3);
      } else if(input5 === undefined) {
        dubiousFunction(input1, input2, input3, input4);
      } else if(input6 === undefined) {
        dubiousFunction(input1, input2, input3, input4, input5);
      } else {
        dubiousFunction(input1, input2, input3, input4, input5, input6);
      }
    } catch(err) {
      throw new Error(logicProofShared.renderError(
        err, logicProofData.BASE_GENERAL_MESSAGES, 
        logicProofData.BASE_STUDENT_LANGUAGE));
    }
  }
};

describe('Full sustem', function() {
  var completeCheck = function(assumptionsString, targetString, proofString) {
    var questionInstance = logicProofStudent.buildInstance(
      LOGIC_PROOF_DEFAULT_QUESTION_DATA);
    var question = logicProofTeacher.buildQuestion(
      assumptionsString, targetString, questionInstance.vocabulary);
    questionInstance.assumptions = question.assumptions;
    questionInstance.results = question.results;
    questionInstance.language.operators = question.operators;

    var proof = logicProofStudent.buildProof(proofString, questionInstance);
    logicProofStudent.checkProof(proof, questionInstance);
  }

  it('should accept fully correct proofs', function() {
    expect(completeCheck('p', 'p', 'we know p')).toEqual(undefined);
  });

  it('should reject proofs with any error', function() {
    expect(function() {
      completeCheck('p', 'p', 'we knew p')
    }).toThrow('The phrase starting \'we\' could not be identified; please\
 make sure you are only using phrases from the given list of vocabulary.');
  })
});