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

"""Domain objects for classifier models"""

import copy

from core.domain import classifier_registry
from core.platform import models
import feconf
import utils

(classifier_models,) = models.Registry.import_models(
    [models.NAMES.classifier])

class ClassifierData(object):
    """Domain object for a classifier data model.

    A classifier is a machine learning model created using a particular
    classification algorithm which is used for answer classification
    task.

    Attributes:
        id: str. The unique id of the classifier.
        exp_id: str. The exploration id to which this classifier belongs.
        exp_version_when_created: str. The version of the exploration when
            this classification model was created.
        state_name: str. The name of the state to which the classifier belongs.
        algorithm_id: str. The id of the algorithm used for generating
            classifier.
        classifier_data: dict. The actual classifier model used for
            classification purpose.
        data_schema_version: int. Schema version of the data used by the
            classifier. This depends on the algorithm ID.
    """

    def __init__(self, classifier_id, exp_id,
                 exp_version_when_created, state_name, algorithm_id,
                 classifier_data, data_schema_version):
        """Constructs a ClassifierData domain object.

        Args:
            classifier_id: str. The unique id of the classifier.
            exp_id: str. The exploration id to which the classifier belongs.
            exp_version_when_created: int. The version of the exploration when
                this classification model was created.
            state_name: str. The name of the state to which the classifier
                belongs.
            algorithm_id: str. The id of the algorithm used for generating
                classifier.
            classifier_data: dict. The actual classifier model used for
                classification purpose.
            data_schema_version: int. Schema version of the
                data used by the classifier.
        """
        self._id = classifier_id
        self._exp_id = exp_id
        self._exp_version_when_created = exp_version_when_created
        self._state_name = state_name
        self._algorithm_id = algorithm_id
        self._classifier_data = copy.deepcopy(classifier_data)
        self._data_schema_version = data_schema_version

    @property
    def id(self):
        return self._id

    @property
    def exp_id(self):
        return self._exp_id

    @property
    def exp_version_when_created(self):
        return self._exp_version_when_created

    @property
    def state_name(self):
        return self._state_name

    @property
    def algorithm_id(self):
        return self._algorithm_id

    @property
    def classifier_data(self):
        return self._classifier_data

    @property
    def data_schema_version(self):
        return self._data_schema_version

    def update_state_name(self, state_name):
        """Updates the state_name attribute of the ClassifierData domain object.

        Args:
            state_name: str. The name of the updated state to which the
            classifier belongs.
        """

        self._state_name = state_name

    def to_dict(self):
        """Constructs a dict representation of ClassifierData domain object.

        Returns:
            A dict representation of ClassifierData domain object.
        """

        return {
            'classifier_id': self._id,
            'exp_id': self._exp_id,
            'exp_version_when_created': self._exp_version_when_created,
            'state_name': self._state_name,
            'algorithm_id': self._algorithm_id,
            'classifier_data': self._classifier_data,
            'data_schema_version': self._data_schema_version
        }

    def validate(self):
        """Validates the classifier before it is saved to storage."""

        if not isinstance(self.id, basestring):
            raise utils.ValidationError(
                'Expected id to be a string, received %s' % self.id)

        if not isinstance(self.exp_id, basestring):
            raise utils.ValidationError(
                'Expected exp_id to be a string, received %s' % self.exp_id)

        if not isinstance(self.exp_version_when_created, int):
            raise utils.ValidationError(
                'Expected exp_version_when_created to be an int, received %s' %
                self.exp_version_when_created)

        if not isinstance(self.state_name, basestring):
            raise utils.ValidationError(
                'Expected id to be a string, received %s' % self.state_name)
        utils.require_valid_name(self.state_name, 'the state name')

        if not isinstance(self.algorithm_id, basestring):
            raise utils.ValidationError(
                'Expected algorithm_id to be a string, received %s' %
                self.algorithm_id)
        utils.require_valid_name(
            self.algorithm_id, 'the algorithm id')
        algorithm_ids = [
            classifier_details['algorithm_id'] for classifier_details in
            feconf.INTERACTION_CLASSIFIER_MAPPING.values()]
        if self.algorithm_id not in algorithm_ids:
            raise utils.ValidationError(
                'Invalid algorithm id: %s' % self.algorithm_id)

        if not isinstance(self.classifier_data, dict):
            raise utils.ValidationError(
                'Expected classifier_data to be a dict, received %s' %(
                    self.classifier_data))
        classifier_class = (
            classifier_registry.Registry.get_classifier_by_algorithm_id(
                self.algorithm_id))
        classifier_class.validate(self.classifier_data)


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
        exp_id: str. The id of the exploration that contains the state
            for which the classifier will be generated.
        exp_version: str. The version of the exploration when
            the training job was generated.
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

    """

    def __init__(self, job_id, algorithm_id, exp_id, exp_version,
                 state_name, status, training_data):
        """Constructs a ClassifierTrainingJob domain object.

        Args:
        job_id: str. The unique id of the classifier training job.
        algorithm_id: str. The id of the algorithm that will be used for
            generating the classifier.
        exp_id: str. The id of the exploration id that contains the state
            for which classifier will be generated.
        exp_version: str. The version of the exploration when
            the training job was generated.
        state_name: str. The name of the state for which the classifier will be
            generated.
        status: str. The status of the training job request. This can be either
            NEW (default), PENDING (when a job has been picked up) or COMPLETE.
        training_data: list. The training data that is used for training the
            classifier. This is populated lazily when the job request is picked
            up by the VM. The list contains dicts where each dict
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
        self._job_id = job_id
        self._algorithm_id = algorithm_id
        self._exp_id = exp_id
        self._exp_version = exp_version
        self._state_name = state_name
        self._status = status
        self._training_data = copy.deepcopy(training_data)

    @property
    def job_id(self):
        return self._job_id

    @property
    def algorithm_id(self):
        return self._algorithm_id

    @property
    def exp_id(self):
        return self._exp_id

    @property
    def exp_version(self):
        return self._exp_version

    @property
    def state_name(self):
        return self._state_name

    @property
    def status(self):
        return self._status

    @property
    def training_data(self):
        return self._training_data

    def update_status(self, status):
        """Updates the status attribute of the ClassifierTrainingJob domain
        object.

        Args:
            status: str. The status of the classifier training job.
        """

        self._status = status

    def to_dict(self):
        """Constructs a dict representation of training job domain object.

        Returns:
            A dict representation of training job domain object.
        """

        return {
            'job_id': self._job_id,
            'algorithm_id': self._algorithm_id,
            'exp_id': self._exp_id,
            'exp_version': self._exp_version,
            'state_name': self._state_name,
            'status': self._status,
            'training_data': self._training_data
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

        if not isinstance(self.state_name, basestring):
            raise utils.ValidationError(
                'Expected state to be a string, received %s' % self.state_name)
        utils.require_valid_name(self.state_name, 'the state name')

        if self.status not in feconf.ALLOWED_TRAINING_JOB_STATUSES:
            raise utils.ValidationError(
                'Expected status to be in %s, received %s' %
                feconf.ALLOWED_TRAINING_JOB_STATUSES,
                self.exp_version)

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
                'Expected training_data to be a list, received %s' %(
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
