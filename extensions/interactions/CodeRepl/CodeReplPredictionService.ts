// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * CodeRepl interaction prediction functions.
 *
 * IMPORTANT NOTE: The prediction function uses the classifier data
 * of trained model (code classifier model) for inference. These functions
 * must be changed if there are any changes in corresponding classifier training
 * function on Oppia-ml.
 */

// Minimum confidence required for a predicted answer group to be shown to user.
// Generally a threshold of 0.7-0.8 is assumed to be a good one in practice,
// however value need not be in those bounds.
oppia.constant('CODE_REPL_PREDICTION_SERVICE_THRESHOLD', 0.7);

oppia.factory('CodeReplPredictionService', [
  'CountVectorizerService', 'PythonProgramTokenType',
  'PythonProgramTokenizer', 'SVMPredictionService',
  'WinnowingPreprocessingService',
  'CODE_REPL_PREDICTION_SERVICE_THRESHOLD', function(
      CountVectorizerService, PythonProgramTokenType,
      PythonProgramTokenizer, SVMPredictionService,
      WinnowingPreprocessingService, CODE_REPL_PREDICTION_SERVICE_THRESHOLD) {
    // The string with which all the variable and method names need to be
    // replaced.
    var TOKEN_NAME_VAR = 'V';
    // The string with which all unknown tokens (tokens which are ignored
    // because they appear rarely in a program) will be replaced.
    var TOKEN_NAME_UNK = 'UNK';

    // List of python keywords.
    var KW_LIST = [
      'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del',
      'elif', 'else', 'except', 'exec', 'finally', 'for', 'from', 'global',
      'if', 'import', 'in', 'is', 'lambda', 'not', 'or', 'pass', 'print',
      'raise', 'return', 'try', 'while', 'with', 'yield'];

    var predictionService = {
      getTokenizedProgram: function(programTokens, tokenToId) {
        // Tokenize Python programs in dataset for winnowing.
        var tokenizedProgram = [];

        for (var i = 0; i < programTokens.length; i++) {
          var token = programTokens[i];
          var tokenId = token[0];
          var tokenName = token[1];

          if (
            tokenId === PythonProgramTokenType.NL ||
            tokenId === PythonProgramTokenType.COMMENT ||
            tokenName.trim() === '') {
            continue;
          } else if (
            tokenId === PythonProgramTokenType.NAME &&
            KW_LIST.indexOf(tokenName) === -1) {
            tokenizedProgram.push(TOKEN_NAME_VAR);
          } else {
            if (tokenToId.hasOwnProperty(tokenName)) {
              tokenizedProgram.push(tokenName);
            } else {
              tokenizedProgram.push(TOKEN_NAME_UNK);
            }
          }
        }

        return tokenizedProgram;
      },

      getTokenizedProgramForCV: function(programTokens) {
        // Tokenize Python programs in dataset for winnowing.
        var tokenizedProgram = [];

        for (var i = 0; i < programTokens.length; i++) {
          var token = programTokens[i];
          var tokenId = token[0];
          var tokenName = token[1];

          if (
            tokenId === PythonProgramTokenType.NL ||
            tokenId === PythonProgramTokenType.COMMENT ||
            tokenName.trim() === '') {
            continue;
          } else if (
            tokenId === PythonProgramTokenType.NAME &&
            KW_LIST.indexOf(tokenName) === -1) {
            tokenizedProgram.push(TOKEN_NAME_VAR);
          } else {
            tokenizedProgram.push(tokenName);
          }
        }

        return tokenizedProgram;
      },

      calcJaccardIndex: function(multisetA, multisetB) {
        // Calculate jaccard index between two multisets.
        multisetA.sort(function(x, y) {
          return x > y ? 1 : -1;
        });
        multisetB.sort(function(x, y) {
          return x > y ? 1 : -1;
        });

        var smallSet = (
          (multisetA.length < multisetB.length) ?
            multisetA.slice() : multisetB.slice());
        var unionSet = (
          (multisetA.length < multisetB.length) ?
            multisetB.slice() : multisetA.slice());
        var index = 0;
        var extraElements = [];

        smallSet.forEach(function(elem) {
          while (index < unionSet.length && elem > unionSet[index]) {
            index += 1;
          }
          if (index >= unionSet.length || elem < unionSet[index]) {
            extraElements.push(elem);
          } else if (elem === unionSet[index]) {
            index += 1;
          }
        });

        unionSet = unionSet.concat(extraElements);
        if (unionSet.length === 0) {
          return 0;
        }

        index = 0;
        var intersectionSet = [];
        multisetA.forEach(function(elem) {
          while (index < multisetB.length && elem > multisetB[index]) {
            index += 1;
          }
          if (index < multisetB.length && elem === multisetB[index]) {
            intersectionSet.push(elem);
            index += 1;
          }
        });

        var coeff = intersectionSet.length / unionSet.length;
        return coeff;
      },

      getProgramSimilarity: function(fingerprintA, fingerprintB) {
        // Calculate similarity between two programs' fingerprints.
        var multisetA = [];
        var multisetB = [];

        fingerprintA.forEach(function(hash) {
          multisetA.push(hash[0]);
        });

        fingerprintB.forEach(function(hash) {
          multisetB.push(hash[0]);
        });

        return predictionService.calcJaccardIndex(multisetA, multisetB);
      },

      findNearestNeighborsIndexes: function(knnData, program) {
        // Find index of nearest neighbor programs to given program.
        var K = knnData.K;
        var T = knnData.T;
        var fingerprintData = knnData.fingerprint_data;
        var tokenToId = knnData.token_to_id;
        var top = knnData.top;

        // Find program tokens using python program tokenizer.
        var programLines = program.split('\n');

        // Empty lines in between program causes parser to think that program
        // has ended which leads to generation of wrong set of tokens.
        programLines = programLines.filter(function(line) {
          return line.trim().length !== 0;
        });

        var pythonProgramTokens = PythonProgramTokenizer.generateTokens(
          programLines);
        // Normalize program tokens for winnowing preprocessing. This removes
        // unnecessary tokens and normalizes variable and method name tokens.

        var tokenizedProgram = predictionService.getTokenizedProgram(
          pythonProgramTokens, tokenToId);
        // Find k-gram hashes from normalized program tokens.

        var programHashes = WinnowingPreprocessingService.getKGramHashes(
          tokenizedProgram, tokenToId, K);
        // Find fingerprint from k-gram hashes of program.

        var programFingerprint = (
          WinnowingPreprocessingService.getFingerprintFromHashes(
            programHashes, T, K));
        // Calculte similarity of the input program with every program in
        // classifier data for k nearest neighbor classification.
        var similarityList = [];
        Object.keys(fingerprintData).forEach(function(index) {
          var fingerprintA = fingerprintData[index].fingerprint;
          var similarity = predictionService.getProgramSimilarity(
            fingerprintA, programFingerprint);
          similarityList.push([parseInt(index), similarity]);
        });

        // Sort the programs according to their similairy with the
        // input program.
        similarityList.sort(function(x, y) {
          return x[1] > y[1] ? -1 : 1;
        });

        var nearestNeighborsIndexes = similarityList.slice(0, top);
        return nearestNeighborsIndexes;
      },

      predict: function(classifierData, answer) {
        // Get python code from the input answer.
        var program = answer.code;
        var knnData = classifierData.KNN;
        var svmData = classifierData.SVM;
        var cvVocabulary = classifierData.cv_vocabulary;

        var fingerprintData = knnData.fingerprint_data;
        var top = knnData.top;
        var occurrence = knnData.occurrence;

        var nearestNeighborsIndexes = (
          predictionService.findNearestNeighborsIndexes(knnData, program));
        var nearesNeighborsClasses = [];

        // Find classes of nearest neighbor programs.
        nearestNeighborsIndexes.forEach(function(neighbor) {
          var index = neighbor[0];
          var outputClassPropertyName = 'class';
          var similarity = neighbor[1];
          nearesNeighborsClasses.push(
            [fingerprintData[index][outputClassPropertyName], similarity]);
        });

        // Count how many times a class appears in nearest neighbors.
        var classCount = {};
        nearesNeighborsClasses.forEach(function(neighbor) {
          var outputClass = neighbor[0];
          if (classCount.hasOwnProperty(outputClass)) {
            classCount[outputClass] += 1;
          } else {
            classCount[outputClass] = 1;
          }
        });

        // Find the winning class.
        var classCountArray = [];
        Object.keys(classCount).forEach(function(k) {
          classCountArray.push([parseInt(k), classCount[k]]);
        });

        classCountArray.sort(function(x, y) {
          return x[1] > y[1] ? -1 : 1;
        });

        var predictedClass = classCountArray[0][0];
        var predictedClassOccurrence = classCountArray[0][1];
        var prediction = predictedClass;

        if (predictedClassOccurrence >= occurrence) {
          if (classCountArray.length > 1) {
            if (predictedClassOccurrence !== classCountArray[1][1]) {
              // Check whether second most likely prediction does not have same
              // occurrence count. If it does, then we assume that KNN has
              // failed.
              return prediction;
            }
          } else {
            return prediction;
          }
        }

        // If KNN fails to predict then use SVM to predict the output class.

        // Find program tokens using python program tokenizer.
        var programLines = program.split('\n');

        // Empty lines in between program causes parser to think that program
        // has ended which leads to generation of wrong set of tokens.
        programLines = programLines.filter(function(line) {
          return line.trim().length !== 0;
        });

        var pythonProgramTokens = PythonProgramTokenizer.generateTokens(
          programLines);

        var tokenizedProgram = predictionService.getTokenizedProgramForCV(
          pythonProgramTokens);
        var programVector = CountVectorizerService.vectorize(
          tokenizedProgram, cvVocabulary);

        var predictionResult = SVMPredictionService.predict(
          svmData, programVector);
        if (predictionResult.predictionConfidence >
            CODE_REPL_PREDICTION_SERVICE_THRESHOLD) {
          return predictionResult.predictionLabel;
        }
        return -1;
      }
    };

    return predictionService;
  }]);
