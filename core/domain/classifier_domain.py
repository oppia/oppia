# Copyright 2016 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Domain objects for classifier models."""

import copy
import datetime

from core.platform import models
import feconf
import utils

(classifier_models,) = models.Registry.import_models(
    [models.NAMES.classifier])


class ClassifierTrainingJob(object):
    """Domain object for a classifier training job.

    A classifier training job is an abstraction of a request made by Oppia
    for training a classifier model using certain dataset and a particular ML
    algorithm denoted by the algorithm id. The classifier training jobs are
    then picked up by the Virtual Machine (VM) through APIs exposed by Oppia.
    The training_data is populated lazily when the job is fetched from the
    database upon the request from the VM.

    Attributes:
        job_id: str. The unique id of the classifier training job.
        algorithm_id: str. The id of the algorithm that will be used for
            generating the classifier.
        interaction_id: str. The id of the interaction to which the algorithm
            belongs.
        exp_id: str. The id of the exploration that contains the state
            for which the classifier will be generated.
        exp_version: int. The version of the exploration when
            the training job was generated.
        next_scheduled_check_time: datetime.datetime. The next scheduled time to
            check the job.
        state_name: str. The name of the state for which the classifier will be
            generated.
        status: str. The status of the training job request. This can be either
            NEW (default value), FAILED, PENDING or COMPLETE.
        training_data: list(dict). The training data that is used for training
            the classifier. This field is populated lazily when the job request
            is picked up by the VM. The list contains dicts where each dict
            represents a single training data group, for example:
            training_data = [
                {
                    'answer_group_index': 1,
                    'answers': ['a1', 'a2']
                },
                {
                    'answer_group_index': 2,
                    'answers': ['a2', 'a3']
                }
            ]
        classifier_data: dict. The actual classifier model used for
            classification purpose.
        data_schema_version: int. Schema version of the data used by the
            classifier. This depends on the algorithm ID.
    """

    def __init__(
            self, job_id, algorithm_id, interaction_id, exp_id,
            exp_version, next_scheduled_check_time, state_name, status,
            training_data, classifier_data, data_schema_version):
        """Constructs a ClassifierTrainingJob domain object.

        Args:
        job_id: str. The unique id of the classifier training job.
        algorithm_id: str. The id of the algorithm that will be used for
            generating the classifier.
        interaction_id: str. The id of the interaction to which the algorithm
            belongs.
        exp_id: str. The id of the exploration id that contains the state
            for which classifier will be generated.
        exp_version: int. The version of the exploration when
            the training job was generated.
        next_scheduled_check_time: datetime.datetime. The next scheduled time to
            check the job.
        state_name: str. The name of the state for which the classifier will be
            generated.
        status: str. The status of the training job request. This can be either
            NEW (default), PENDING (when a job has been picked up) or COMPLETE.
        training_data: list(dict). The training data that is used for training
            the classifier. This is populated lazily when the job request is
            picked up by the VM. The list contains dicts where each dict
            represents a single training data group, for example:
            training_data = [
                {
                    'answer_group_index': 1,
                    'answers': ['a1', 'a2']
                },
                {
                    'answer_group_index': 2,
                    'answers': ['a2', 'a3']
                }
            ]
        classifier_data: dict. The actual classifier model used for
            classification purpose.
        data_schema_version: int. Schema version of the data used by the
            classifier. This depends on the algorithm ID.
        """
        self._job_id = job_id
        self._algorithm_id = algorithm_id
        self._interaction_id = interaction_id
        self._exp_id = exp_id
        self._exp_version = exp_version
        self._next_scheduled_check_time = next_scheduled_check_time
        self._state_name = state_name
        self._status = status
        self._training_data = copy.deepcopy(training_data)
        self._classifier_data = classifier_data
        self._data_schema_version = data_schema_version

    @property
    def job_id(self):
        """Returns the job_id of the classifier training job.

        Returns:
            str. The unique id of the classifier training job.
        """
        return self._job_id

    @property
    def algorithm_id(self):
        """Returns the algorithm_id of the algorithm used for generating
        the classifier.

        Returns:
            str. The id of the algorithm used for generating the classifier.
        """
        return self._algorithm_id

    @property
    def interaction_id(self):
        """Returns the interaction_id to which the algorithm belongs.

        Returns:
            str. The id of the interaction to which the algorithm belongs.
        """
        return self._interaction_id

    @property
    def exp_id(self):
        """Returns the exploration id for which the classifier will be
        generated.

        Returns:
            str. The id of the exploration that contains the state
            for which classifier will be generated.
        """
        return self._exp_id

    @property
    def exp_version(self):
        """Returns the exploration version.

        Returns:
            int. The version of the exploration when the training job was
            generated.
        """
        return self._exp_version

    @property
    def next_scheduled_check_time(self):
        """Returns the next scheduled time to check the job.

        Returns:
            datetime.datetime. The next scheduled time to check the job.
        """
        return self._next_scheduled_check_time

    @property
    def state_name(self):
        """Returns the state_name for which the classifier will be generated.

        Returns:
            str. The name of the state for which the classifier will be
            generated.
        """
        return self._state_name

    @property
    def status(self):
        """Returns the status of the training job request.

        Returns:
            str. The status of the training job request. This can be either
            NEW (default), PENDING (when a job has been picked up) or
            COMPLETE.
        """
        return self._status

    @property
    def training_data(self):
        """Returns the training data used for training the classifier.

        Returns:
            list(dict). The training data that is used for training the
            classifier. This is populated lazily when the job request is
            picked up by the VM. The list contains dicts where each dict
            represents a single training data group, for example:
            training_data = [
                {
                    'answer_group_index': 1,
                    'answers': ['a1', 'a2']
                },
                {
                    'answer_group_index': 2,
                    'answers': ['a2', 'a3']
                }
            ]
        """
        return self._training_data

    @property
    def classifier_data(self):
        """Returns the classifier data.

        Returns:
            dict. The actual classifier model used for
            classification purpose.
        """
        return self._classifier_data

    @property
    def data_schema_version(self):
        """Returns the schema version of the data used by the classifier.

        Returns:
            int. Schema version of the data used by the
            classifier. This depends on the algorithm ID.
        """
        return self._data_schema_version

    def update_status(self, status):
        """Updates the status attribute of the ClassifierTrainingJob domain
        object.

        Args:
            status: str. The status of the classifier training job.
        """
        initial_status = self._status
        if status not in (
                feconf.ALLOWED_TRAINING_JOB_STATUS_CHANGES[initial_status]):
            raise Exception(
                'The status change %s to %s is not valid.' % (
                    initial_status, status))
        self._status = status

    def update_next_scheduled_check_time(self, next_scheduled_check_time):
        """Updates the next_scheduled_check_time attribute of the
        ClassifierTrainingJob domain object.

        Args:
            next_scheduled_check_time: datetime.datetime. The next scheduled
            time to check the job.
        """

        self._next_scheduled_check_time = next_scheduled_check_time

    def update_classifier_data(self, classifier_data):
        """Updates the classifier_data attribute of the ClassifierTrainingJob
        domain object.

        Args:
            classifier_data: dict. The classifier model used for classification.
        """

        self._classifier_data = classifier_data

    def to_dict(self):
        """Constructs a dict representation of training job domain object.

        Returns:
            A dict representation of training job domain object.
        """

        return {
            'job_id': self._job_id,
            'algorithm_id': self._algorithm_id,
            'interaction_id': self._interaction_id,
            'exp_id': self._exp_id,
            'exp_version': self._exp_version,
            'next_scheduled_check_time': self._next_scheduled_check_time,
            'state_name': self._state_name,
            'status': self._status,
            'training_data': self._training_data,
            'classifier_data': self._classifier_data,
            'data_schema_version': self._data_schema_version
        }

    def validate(self):
        """Validates the training job before it is saved to storage."""

        algorithm_ids = []
        if not isinstance(self.job_id, basestring):
            raise utils.ValidationError(
                'Expected id to be a string, received %s' % self.job_id)

        if not isinstance(self.exp_id, basestring):
            raise utils.ValidationError(
                'Expected exp_id to be a string, received %s' % self.exp_id)

        if not isinstance(self.exp_version, int):
            raise utils.ValidationError(
                'Expected exp_version to be an int, received %s' %
                self.exp_version)

        if not isinstance(self.next_scheduled_check_time, datetime.datetime):
            raise utils.ValidationError(
                'Expected next_scheduled_check_time to be datetime,' +
                ' received %s' % self.next_scheduled_check_time)

        if not isinstance(self.state_name, basestring):
            raise utils.ValidationError(
                'Expected state to be a string, received %s' % self.state_name)
        utils.require_valid_name(self.state_name, 'the state name')

        if self.status not in feconf.ALLOWED_TRAINING_JOB_STATUSES:
            raise utils.ValidationError(
                'Expected status to be in %s, received %s' %
                feconf.ALLOWED_TRAINING_JOB_STATUSES,
                self.exp_version)

        if not isinstance(self.interaction_id, basestring):
            raise utils.ValidationError(
                'Expected interaction_id to be a string, received %s' %
                self.interaction_id)

        if self.interaction_id not in feconf.INTERACTION_CLASSIFIER_MAPPING:
            raise utils.ValidationError(
                'Invalid interaction id: %s' % self.interaction_id)

        if not isinstance(self.algorithm_id, basestring):
            raise utils.ValidationError(
                'Expected algorithm_id to be a string, received %s' %
                self.algorithm_id)

        algorithm_ids = [
            classifier_details['algorithm_id'] for classifier_details in
            feconf.INTERACTION_CLASSIFIER_MAPPING.values()]
        if self.algorithm_id not in algorithm_ids:
            raise utils.ValidationError(
                'Invalid algorithm id: %s' % self.algorithm_id)

        if not isinstance(self.training_data, list):
            raise utils.ValidationError(
                'Expected training_data to be a list, received %s' % (
                    self.training_data))

        for grouped_answers in self.training_data:
            if 'answer_group_index' not in grouped_answers:
                raise utils.ValidationError(
                    'Expected answer_group_index to be a key in training_data',
                    'list item')
            if 'answers' not in grouped_answers:
                raise utils.ValidationError(
                    'Expected answers to be a key in training_data list item')
            if not isinstance(grouped_answers['answer_group_index'], int):
                raise utils.ValidationError(
                    'Expected answer_group_index to be an int, received %s' %
                    grouped_answers['answer_group_index'])
            if not isinstance(grouped_answers['answers'], list):
                raise utils.ValidationError(
                    'Expected answers to be a list, received %s' %
                    grouped_answers['answers'])

        # Classifier data can be either None (before its stored) or a dict.
        if not isinstance(self.classifier_data, dict) and self.classifier_data:
            raise utils.ValidationError(
                'Expected classifier_data to be a dict|None, received %s' % (
                    self.classifier_data))

        if not isinstance(self.data_schema_version, int):
            raise utils.ValidationError(
                'Expected data_schema_version to be an int, received %s' %
                self.data_schema_version)


class TrainingJobExplorationMapping(object):
    """Domain object for a job-exploration mapping model.

    A job-exploration mapping is a one-to-one relation between the
    attributes in an exploration to the training job model for the classifier it
    needs to use. The mapping is from <exp_id, exp_version, state_name> to the
    job_id.

    Attributes:
        exp_id: str. ID of the exploration.
        exp_version: int. The exploration version at the time the corresponding
            classifier's training job was created.
        state_name: str. The name of the state to which the classifier
            belongs.
        job_id. str. The unique ID of the training job in the
            job-exploration mapping.
    """

    def __init__(self, exp_id, exp_version, state_name, job_id):
        """Constructs a TrainingJobExplorationMapping domain object.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. The exploration version at the time the
                corresponding classifier's training job was created.
            state_name: str. The name of the state to which the classifier
                belongs.
            job_id: str. The unique ID of the training job.
        """
        self._exp_id = exp_id
        self._exp_version = exp_version
        self._state_name = state_name
        self._job_id = job_id

    @property
    def exp_id(self):
        """Returns the exploration id.

        Returns:
            str. The id of the exploration.
        """
        return self._exp_id

    @property
    def exp_version(self):
        """Returns the exploration version.

        Returns:
            int. The exploration version at the time the
            corresponding classifier's training job was created.
        """
        return self._exp_version

    @property
    def state_name(self):
        """Returns the state_name to which the classifier belongs.

        Returns:
            str. The name of the state to which the classifier belongs.
        """
        return self._state_name

    @property
    def job_id(self):
        """Returns the job_id of the training job.

        Returns:
            str. The unique ID of the training job in the
            job-exploration mapping.
        """
        return self._job_id

    def to_dict(self):
        """Constructs a dict representation of TrainingJobExplorationMapping
        domain object.

        Returns:
            A dict representation of TrainingJobExplorationMapping domain
                object.
        """

        return {
            'exp_id': self._exp_id,
            'exp_version': self._exp_version,
            'state_name': self.state_name,
            'job_id': self._job_id
        }

    def validate(self):
        """Validates the mapping before it is saved to storage."""

        if not isinstance(self.exp_id, basestring):
            raise utils.ValidationError(
                'Expected exp_id to be a string, received %s' % self.exp_id)

        if not isinstance(self.exp_version, int):
            raise utils.ValidationError(
                'Expected exp_version to be an int, received %s' % (
                    self.exp_version))

        if not isinstance(self.state_name, basestring):
            raise utils.ValidationError(
                'Expected state_name to be a string, received %s' % (
                    self.state_name))

        if not isinstance(self.job_id, basestring):
            raise utils.ValidationError(
                'Expected job_id to be a string, received %s' % (
                    self.job_id))
