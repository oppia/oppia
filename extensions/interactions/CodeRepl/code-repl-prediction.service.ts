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
 * @fileoverview CodeRepl interaction prediction functions.
 *
 * IMPORTANT NOTE: The prediction function uses the classifier data
 * of trained model (code classifier model) for inference. These functions
 * must be changed if there are any changes in corresponding classifier training
 * function on Oppia-ml.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { CountVectorizerService } from 'classifiers/count-vectorizer.service';
import { ClassifiersExtensionConstants } from
  'classifiers/classifiers-extension.constants.ts';
import { InteractionsExtensionsConstants } from
  'interactions/interactions-extension.constants.ts';
import { PythonProgramTokenizer } from 'classifiers/python-program.tokenizer';
import { SVMPredictionService } from 'classifiers/svm-prediction.service';
import { WinnowingPreprocessingService } from
  'classifiers/winnowing-preprocessing.service';

// TODO(#7165): Replace 'any' with the exact type
/* eslint-disable camelcase */
export interface IKNN {
  fingerprint_data: any;
  occurrence: any;
  top: any;
  K?: any;
  T?: any;
  token_to_id?:any;
}
export interface IClassifierData {
  KNN: IKNN
  cv_vocabulary: object;
  SVM: object;
}
@Injectable({
  providedIn: 'root'
})
export class CodeReplPredictionService {
  private PythonProgramTokenType = (
    ClassifiersExtensionConstants.PythonProgramTokenType);
  private CODE_REPL_PREDICTION_SERVICE_THRESHOLD = (
    InteractionsExtensionsConstants.CODE_REPL_PREDICTION_SERVICE_THRESHOLD);
  constructor(
    private countVectorizerService: CountVectorizerService,
    private pythonProgramTokenizer: PythonProgramTokenizer,
    private svmPredictionService: SVMPredictionService,
    private winnowingPreprocessingService: WinnowingPreprocessingService) {}

  // The string with which all the variable and method names need to be
  // replaced.
  private TOKEN_NAME_VAR = 'V';
  // The string with which all unknown tokens (tokens which are ignored
  // because they appear rarely in a program) will be replaced.
  private TOKEN_NAME_UNK = 'UNK';

  // List of python keywords.
  private KW_LIST = [
    'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del',
    'elif', 'else', 'except', 'exec', 'finally', 'for', 'from', 'global',
    'if', 'import', 'in', 'is', 'lambda', 'not', 'or', 'pass', 'print',
    'raise', 'return', 'try', 'while', 'with', 'yield'
  ];

  getTokenizedProgram(
      programTokens: Array<string[]>, tokenToId: object): string[] {
    // Tokenize Python programs in dataset for winnowing.
    const tokenizedProgram = [];

    for (let i = 0; i < programTokens.length; i++) {
      const token = programTokens[i];
      const tokenId = token[0];
      const tokenName = token[1];

      if (
        tokenId === this.PythonProgramTokenType.NL ||
        tokenId === this.PythonProgramTokenType.COMMENT ||
        tokenName.trim() === '') {
        continue;
      } else if (
        tokenId === this.PythonProgramTokenType.NAME &&
        this.KW_LIST.indexOf(tokenName) === -1) {
        tokenizedProgram.push(this.TOKEN_NAME_VAR);
      } else {
        if (tokenToId.hasOwnProperty(tokenName)) {
          tokenizedProgram.push(tokenName);
        } else {
          tokenizedProgram.push(this.TOKEN_NAME_UNK);
        }
      }
    }

    return tokenizedProgram;
  }

  getTokenizedProgramForCV(programTokens: Array<string[]>): string[] {
    // Tokenize Python programs in dataset for winnowing.
    const tokenizedProgram = [];

    for (let i = 0; i < programTokens.length; i++) {
      const token = programTokens[i];
      const tokenId = token[0];
      const tokenName = token[1];

      if (
        tokenId === this.PythonProgramTokenType.NL ||
        tokenId === this.PythonProgramTokenType.COMMENT ||
        tokenName.trim() === '') {
        continue;
      } else if (
        tokenId === this.PythonProgramTokenType.NAME &&
        this.KW_LIST.indexOf(tokenName) === -1) {
        tokenizedProgram.push(this.TOKEN_NAME_VAR);
      } else {
        tokenizedProgram.push(tokenName);
      }
    }

    return tokenizedProgram;
  }

  calcJaccardIndex(
      multisetA: Array<number>, multisetB: Array<number>): number {
    // Calculate jaccard index between two multisets.
    multisetA.sort((x, y) => {
      return x > y ? 1 : -1;
    });
    multisetB.sort((x, y) => {
      return x > y ? 1 : -1;
    });

    const smallSet = (
      (multisetA.length < multisetB.length) ?
        multisetA.slice() : multisetB.slice());
    let unionSet = (
      (multisetA.length < multisetB.length) ?
        multisetB.slice() : multisetA.slice());
    let index = 0;
    const extraElements = [];

    smallSet.forEach((elem: number) => {
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
    const intersectionSet = [];
    multisetA.forEach((elem: number) => {
      while (index < multisetB.length && elem > multisetB[index]) {
        index += 1;
      }
      if (index < multisetB.length && elem === multisetB[index]) {
        intersectionSet.push(elem);
        index += 1;
      }
    });

    const coeff = intersectionSet.length / unionSet.length;
    return coeff;
  }

  getProgramSimilarity(
      fingerprintA: Array<number[]>, fingerprintB: Array<number[]>): number {
    // Calculate similarity between two programs' fingerprints.
    const multisetA = [];
    const multisetB = [];

    fingerprintA.forEach((hash: number[]) => {
      multisetA.push(hash[0]);
    });

    fingerprintB.forEach((hash: number[]) => {
      multisetB.push(hash[0]);
    });

    return this.calcJaccardIndex(multisetA, multisetB);
  }

  findNearestNeighborsIndexes(knnData: IKNN, program: string): Array<number[]> {
    // Find index of nearest neighbor programs to given program.
    const K = knnData.K;
    const T = knnData.T;
    const fingerprintData = knnData.fingerprint_data;
    const tokenToId = knnData.token_to_id;
    const top = knnData.top;

    // Find program tokens using python program tokenizer.
    let programLines = program.split('\n');

    // Empty lines in between program causes parser to think that program
    // has ended which leads to generation of wrong set of tokens.
    programLines = programLines.filter((line: string) => {
      return line.trim().length !== 0;
    });

    const pythonProgramTokens = this.pythonProgramTokenizer.generateTokens(
      programLines);
    // Normalize program tokens for winnowing preprocessing. This removes
    // unnecessary tokens and normalizes variable and method name tokens.

    const tokenizedProgram = this.getTokenizedProgram(
      pythonProgramTokens, tokenToId);
    // Find k-gram hashes from normalized program tokens.

    const programHashes = this.winnowingPreprocessingService.getKGramHashes(
      tokenizedProgram, tokenToId, K);
    // Find fingerprint from k-gram hashes of program.

    const programFingerprint = (
      this.winnowingPreprocessingService.getFingerprintFromHashes(
        programHashes, T, K));
    // Calculte similarity of the input program with every program in
    // classifier data for k nearest neighbor classification.
    const similarityList = [];
    Object.keys(fingerprintData).forEach((index: string) => {
      const fingerprintA = fingerprintData[index].fingerprint;
      const similarity = this.getProgramSimilarity(
        fingerprintA, programFingerprint);
      similarityList.push([parseInt(index), similarity]);
    });

    // Sort the programs according to their similairy with the
    // input program.
    similarityList.sort((x, y) => {
      return x[1] > y[1] ? -1 : 1;
    });

    const nearestNeighborsIndexes = similarityList.slice(0, top);
    return nearestNeighborsIndexes;
  }

  predict(classifierData: IClassifierData, answer: {code: string}): number {
    // Get python code from the input answer.
    const program = answer.code;
    const knnData = classifierData.KNN;
    const svmData = classifierData.SVM;
    const cvVocabulary = classifierData.cv_vocabulary;

    const fingerprintData = knnData.fingerprint_data;
    const top = knnData.top;
    const occurrence = knnData.occurrence;

    const nearestNeighborsIndexes = (
      this.findNearestNeighborsIndexes(knnData, program));
    const nearesNeighborsClasses = [];

    // Find classes of nearest neighbor programs.
    nearestNeighborsIndexes.forEach((neighbor: number[]) => {
      const index = neighbor[0];
      const outputClassPropertyName = 'class';
      const similarity = neighbor[1];
      nearesNeighborsClasses.push(
        [fingerprintData[index][outputClassPropertyName], similarity]);
    });

    // Count how many times a class appears in nearest neighbors.
    const classCount = {};
    nearesNeighborsClasses.forEach((neighbor: any[]) => {
      const outputClass = neighbor[0];
      if (classCount.hasOwnProperty(outputClass)) {
        classCount[outputClass] += 1;
      } else {
        classCount[outputClass] = 1;
      }
    });

    // Find the winning class.
    const classCountArray = [];
    Object.keys(classCount).forEach((k: string) => {
      classCountArray.push([parseInt(k), classCount[k]]);
    });

    classCountArray.sort((x, y) => {
      return x[1] > y[1] ? -1 : 1;
    });

    const predictedClass = classCountArray[0][0];
    const predictedClassOccurrence = classCountArray[0][1];
    const prediction = predictedClass;

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
    let programLines = program.split('\n');

    // Empty lines in between program causes parser to think that program
    // has ended which leads to generation of wrong set of tokens.
    programLines = programLines.filter((line: string) => {
      return line.trim().length !== 0;
    });

    const pythonProgramTokens = this.pythonProgramTokenizer.generateTokens(
      programLines);

    const tokenizedProgram = this.getTokenizedProgramForCV(
      pythonProgramTokens);
    const programVector = this.countVectorizerService.vectorize(
      tokenizedProgram, cvVocabulary);

    const predictionResult = this.svmPredictionService.predict(
      svmData, programVector);
    if (predictionResult.predictionConfidence >
        this.CODE_REPL_PREDICTION_SERVICE_THRESHOLD) {
      return predictionResult.predictionLabel;
    }
    return -1;
  }
}

angular.module('oppia').factory(
  'CodeReplPredictionService', downgradeInjectable(CodeReplPredictionService));
