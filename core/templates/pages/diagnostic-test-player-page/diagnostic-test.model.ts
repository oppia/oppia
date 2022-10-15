interface TopicIdToRelatedTopicIds {
  [topicId: string]: string[]
}

export class DiagnosticTestModel {
  _totalNumberOfAttemptedQuestions :number;
  _currentTopicId: string;
  _eligibleTopicIds: string[];
  _skippedTopicIds: string[];
  _passedTopicIds: string[];
  _failedTopicIds: string[];
  _topicIdToPrerequisiteTopicIds: TopicIdToRelatedTopicIds;
  _topicIdToAncestorTopicIds: TopicIdToRelatedTopicIds;
  _topicIdToSuccessorTopicIds: TopicIdToRelatedTopicIds;

  constructor(topicIdToPrerequisiteTopicIds) {
    this._topicIdToPrerequisiteTopicIds = topicIdToPrerequisiteTopicIds;

    this.setTopicIdToAncestorTopicIds();
    this.setTopicIdToSuccessorTopicIds();
  }

  setTopicIdToAncestorTopicIds(): void {
    this._topicIdToAncestorTopicIds = {}
    for (let topicId in this._topicIdToPrerequisiteTopicIds) {
      let ancestors = []
      let prerequisites = this._topicIdToPrerequisiteTopicIds[topicId]
      while (prerequisites.length > 0) {
        let len = prerequisites.length;

        let lastTopicId = prerequisites[len - 1];
        prerequisites.splice(len-1, 1);
        ancestors.push(lastTopicId);
      }
      this._topicIdToAncestorTopicIds[topicId] = ancestors;
    }
  }

  setTopicIdToSuccessorTopicIds(): void {
    let topicIdToChildTopicId = {}
    for (let topicId in this._topicIdToPrerequisiteTopicIds) {
      topicIdToChildTopicId[topicId] = []
    }

    for (let topicid in this._topicIdToPrerequisiteTopicIds) {
      let prerequisites = this._topicIdToPrerequisiteTopicIds[topicid]
      for (let prerequisiteTopicId of prerequisites) {
        topicIdToChildTopicId[prerequisiteTopicId].push(topicid)
      }
    }
    this._topicIdToSuccessorTopicIds = {}
    for (let topicid in topicIdToChildTopicId) {
      let successors = [];
      let children = topicIdToChildTopicId[topicid];
      while(children.length > 0) {
        let len = children.length;

        let lastTopicId = children[len - 1];
        children.splice(len-1, 1);
        successors.push(lastTopicId);
      }
      this._topicIdToSuccessorTopicIds[topicid] = successors;
    }

  }

  getAncestorsTopicIds(topicId: string) {
    return this._topicIdToAncestorTopicIds[topicId];
  }

  getSuccessorTopicIds(topicId: string) {
    return this._topicIdToSuccessorTopicIds[topicId];
  }

  incrementNumberOfAttemptedQuestions(incrementByValue: number): void {
    this._totalNumberOfAttemptedQuestions += incrementByValue;
  }

  recordTopicPassed(): void {
    let ancestors = this._topicIdToAncestorTopicIds[this._currentTopicId];
    this._passedTopicIds.push(this._currentTopicId);

    let topicIdsToRemoveFromEligibleList = [];
    topicIdsToRemoveFromEligibleList.concat(ancestors);
    topicIdsToRemoveFromEligibleList.push(this._currentTopicId);

    this._eligibleTopicIds = this._eligibleTopicIds.filter((topicId) => {
      if (topicIdsToRemoveFromEligibleList.indexOf(topicId) === -1) {
        return true;
      }
      return false;
    });

    this._skippedTopicIds.concat(ancestors);
  }

  recordTopicFailed(): void {
    let successors = this._topicIdToSuccessorTopicIds[this._currentTopicId];
    this._failedTopicIds.push(this._currentTopicId);

    let topicIdsToRemoveFromEligibleList = [];
    topicIdsToRemoveFromEligibleList.concat(successors);
    topicIdsToRemoveFromEligibleList.push(this._currentTopicId);

    this._eligibleTopicIds = this._eligibleTopicIds.filter((topicId) => {
      if (topicIdsToRemoveFromEligibleList.indexOf(topicId) === -1) {
        return true;
      }
      return false;
    });

    this._skippedTopicIds.concat(successors);
  }

  isTestFinished(): boolean {
    if (
        this._eligibleTopicIds.length > 0 &&
        this._failedTopicIds.length === 0 &&
        this._totalNumberOfAttemptedQuestions >= 15
    ) {
      return true;
    }

    if (
        this._eligibleTopicIds.length === 0 &&
        this._skippedTopicIds.length > 0 &&
        this._failedTopicIds.length > 0
    ) {
      return true;
    }

    if (
        this._eligibleTopicIds.length === 0 &&
        this._skippedTopicIds.length === 0
    ) {
      return true;
    }

    return false;
  }

  getEligibleTopicIds(): string[] {
    return this._eligibleTopicIds;
  }

  getFailedTopicIds(): string[] {
    return this._failedTopicIds;
  }

  getCurrentTopicId(): string {
    // return Object.keys(this._topicIdToPrerequisiteTopicIds)[0];
    return this._currentTopicId;
  }

  setCurrentTopicId(): void {
    let topicIdToLengthOfExpectedRemoval = {}
    let lengthOfAncestorTopicIds, lengthOfSuccessorTopicIds;
    for (let topicId in this._topicIdToPrerequisiteTopicIds) {
      lengthOfAncestorTopicIds = this._topicIdToAncestorTopicIds[topicId];
      lengthOfSuccessorTopicIds = this._topicIdToSuccessorTopicIds[topicId];

      topicIdToLengthOfExpectedRemoval[topicId] = Math.min(
        lengthOfAncestorTopicIds, lengthOfSuccessorTopicIds);
    }

    let tempTopicId = Object.keys(topicIdToLengthOfExpectedRemoval)[0];
    let tempLenghtOfExpectedRemoval = (
      topicIdToLengthOfExpectedRemoval[tempTopicId]);
    for (let topicId in topicIdToLengthOfExpectedRemoval) {
      if (
          topicIdToLengthOfExpectedRemoval[topicId] >
          tempLenghtOfExpectedRemoval
      ) {
        tempLenghtOfExpectedRemoval = topicIdToLengthOfExpectedRemoval[topicId];
        tempTopicId = topicId;
      }
    }
    this._currentTopicId = tempTopicId;
  }
}