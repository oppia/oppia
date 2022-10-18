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

from __future__ import annotations

import copy
import datetime

from core import feconf
from core import utils
from core.domain import state_domain

from typing import Dict, List, TypedDict


class ClassifierTrainingJobDict(TypedDict):
    """Dictionary that represents ClassifierTrainingJob."""

    job_id: str
    algorithm_id: str
    interaction_id: str
    exp_id: str
    exp_version: int
    next_scheduled_check_time: datetime.datetime
    state_name: str
    status: str
    training_data: List[state_domain.TrainingDataDict]
    algorithm_version: int


class ClassifierTrainingJob:
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
        algorithm_version: int. The version of the classifier algorithm to be
            trained. The algorithm version determines the training algorithm,
            format in which trained parameters are stored along with the
            prediction algorithm to be used. We expect this to change only when
            the classifier algorithm is updated. This depends on the
            algorithm ID.
    """

    def __init__(
        self,
        job_id: str,
        algorithm_id: str,
        interaction_id: str,
        exp_id: str,
        exp_version: int,
        next_scheduled_check_time: datetime.datetime,
        state_name: str,
        status: str,
        training_data: List[state_domain.TrainingDataDict],
        algorithm_version: int
    ) -> None:
        """Constructs a ClassifierTrainingJob domain object.

        Args:
            job_id: str. The unique id of the classifier training job.
            algorithm_id: str. The id of the algorithm that will be used for
                generating the classifier.
            interaction_id: str. The id of the interaction to which the
                algorithm belongs.
            exp_id: str. The id of the exploration id that contains the state
                for which classifier will be generated.
            exp_version: int. The version of the exploration when
                the training job was generated.
            next_scheduled_check_time: datetime.datetime. The next scheduled
                time to check the job.
            state_name: str. The name of the state for which the classifier
                will be generated.
            status: str. The status of the training job request. This can be
                either NEW (default), PENDING (when a job has been picked up)
                or COMPLETE.
            training_data: list(dict). The training data that is used for
                training the classifier. This is populated lazily when the job
                request is picked up by the VM. The list contains dicts where
                each dict represents a single training data group, for example:
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
            algorithm_version: int. Schema version of the classifier model to
                be trained. This depends on the algorithm ID.
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
        self._algorithm_version = algorithm_version

    @property
    def job_id(self) -> str:
        """Returns the job_id of the classifier training job.

        Returns:
            str. The unique id of the classifier training job.
        """
        return self._job_id

    @property
    def algorithm_id(self) -> str:
        """Returns the algorithm_id of the algorithm used for generating
        the classifier.

        Returns:
            str. The id of the algorithm used for generating the classifier.
        """
        return self._algorithm_id

    @property
    def interaction_id(self) -> str:
        """Returns the interaction_id to which the algorithm belongs.

        Returns:
            str. The id of the interaction to which the algorithm belongs.
        """
        return self._interaction_id

    @property
    def exp_id(self) -> str:
        """Returns the exploration id for which the classifier will be
        generated.

        Returns:
            str. The id of the exploration that contains the state
            for which classifier will be generated.
        """
        return self._exp_id

    @property
    def exp_version(self) -> int:
        """Returns the exploration version.

        Returns:
            int. The version of the exploration when the training job was
            generated.
        """
        return self._exp_version

    @property
    def next_scheduled_check_time(self) -> datetime.datetime:
        """Returns the next scheduled time to check the job.

        Returns:
            datetime.datetime. The next scheduled time to check the job.
        """
        return self._next_scheduled_check_time

    @property
    def state_name(self) -> str:
        """Returns the state_name for which the classifier will be generated.

        Returns:
            str. The name of the state for which the classifier will be
            generated.
        """
        return self._state_name

    @property
    def status(self) -> str:
        """Returns the status of the training job request.

        Returns:
            str. The status of the training job request. This can be either
            NEW (default), PENDING (when a job has been picked up) or
            COMPLETE.
        """
        return self._status

    @property
    def training_data(self) -> List[state_domain.TrainingDataDict]:
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
    def classifier_data_filename(self) -> str:
        """Returns file name of the GCS file which stores classifier data
        for this training job.

        Returns:
            str. The GCS file name of the classifier data.
        """
        return '%s-classifier-data.pb.xz' % (self.job_id)

    @property
    def algorithm_version(self) -> int:
        """Returns the algorithm version of the classifier.

        Returns:
            int. Version of the classifier algorithm. This depends on the
            algorithm ID.
        """
        return self._algorithm_version

    def update_status(self, status: str) -> None:
        """Updates the status attribute of the ClassifierTrainingJob domain
        object.

        Args:
            status: str. The status of the classifier training job.

        Raises:
            Exception. The status is not valid.
        """
        initial_status = self._status
        if status not in (
                feconf.ALLOWED_TRAINING_JOB_STATUS_CHANGES[initial_status]):
            raise Exception(
                'The status change %s to %s is not valid.' % (
                    initial_status, status))
        self._status = status

    def to_dict(self) -> ClassifierTrainingJobDict:
        """Constructs a dict representation of training job domain object.

        Returns:
            dict. A dict representation of training job domain object.
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
            'algorithm_version': self._algorithm_version
        }

    def validate(self) -> None:
        """Validates the training job before it is saved to storage."""

        algorithm_ids = []
        utils.require_valid_name(self.state_name, 'the state name')
        if self.status not in feconf.ALLOWED_TRAINING_JOB_STATUSES:
            raise utils.ValidationError(
                'Expected status to be in %s, received %s'
                % (feconf.ALLOWED_TRAINING_JOB_STATUSES, self.status))

        if self.interaction_id not in feconf.INTERACTION_CLASSIFIER_MAPPING:
            raise utils.ValidationError(
                'Invalid interaction id: %s' % self.interaction_id)

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
                    'Expected answer_group_index to be a key in training_data'
                    'list item')
            if 'answers' not in grouped_answers:
                raise utils.ValidationError(
                    'Expected answers to be a key in training_data list item')


class StateTrainingJobsMappingDict(TypedDict):
    """Dictionary that represents StateTrainingJobsMapping."""

    exp_id: str
    exp_version: int
    state_name: str
    algorithm_ids_to_job_ids: Dict[str, str]


class StateTrainingJobsMapping:
    """Domain object for a state-to-training job mapping model.

    This object represents a one-to-many relation between a particular state
    of the particular version of the particular exploration and a set of
    classifier training jobs. Each <exp_id, exp_version, state_name> is mapped
    to an algorithm_id_to_job_id dict which maps all the valid algorithm_ids for
    the given state to their training jobs. A state may have multiple
    algorithm_ids valid for it: for example, one algorithm would serve Oppia
    web users while another might support Oppia mobile or Android user. The
    number of algorithm_ids that are valid for a given state depends upon the
    interaction_id of that state.

    Attributes:
        exp_id: str. ID of the exploration.
        exp_version: int. The exploration version at the time the corresponding
            classifier's training job was created.
        state_name: str. The name of the state to which the classifier
            belongs.
        algorithm_ids_to_job_ids: dict(str, str). Mapping of algorithm IDs to
            corresponding unique training job IDs.
    """

    def __init__(
        self,
        exp_id: str,
        exp_version: int,
        state_name: str,
        algorithm_ids_to_job_ids: Dict[str, str]
    ) -> None:
        """Constructs a StateTrainingJobsMapping domain object.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. The exploration version at the time the
                corresponding classifier's training job was created.
            state_name: str. The name of the state to which the classifier
                belongs.
            algorithm_ids_to_job_ids: dict(str, str). The mapping from
                algorithm IDs to the IDs of their corresponding classifier
                training jobs.
        """
        self._exp_id = exp_id
        self._exp_version = exp_version
        self._state_name = state_name
        self._algorithm_ids_to_job_ids = algorithm_ids_to_job_ids

    @property
    def exp_id(self) -> str:
        """Returns the exploration id.

        Returns:
            str. The id of the exploration.
        """
        return self._exp_id

    @property
    def exp_version(self) -> int:
        """Returns the exploration version.

        Returns:
            int. The exploration version at the time the
            corresponding classifier's training job was created.
        """
        return self._exp_version

    @property
    def state_name(self) -> str:
        """Returns the state_name to which the classifier belongs.

        Returns:
            str. The name of the state to which the classifier belongs.
        """
        return self._state_name

    @property
    def algorithm_ids_to_job_ids(self) -> Dict[str, str]:
        """Returns the algorithm_ids_to_job_ids of the training jobs.

        Returns:
            dict(str, str). Mapping of algorithm IDs to corresponding unique
            training job IDs.
        """
        return self._algorithm_ids_to_job_ids

    def to_dict(self) -> StateTrainingJobsMappingDict:
        """Constructs a dict representation of StateTrainingJobsMapping
        domain object.

        Returns:
            dict. A dict representation of StateTrainingJobsMapping domain
            object.
        """

        return {
            'exp_id': self._exp_id,
            'exp_version': self._exp_version,
            'state_name': self.state_name,
            'algorithm_ids_to_job_ids': self._algorithm_ids_to_job_ids
        }

    def validate(self) -> None:
        """Validates the mapping before it is saved to storage."""

        if not self.exp_version > 0:
            raise utils.ValidationError(
                    'Expected version to be greater than 0')


class OppiaMLAuthInfo:
    """Domain object containing information necessary for authentication
    of Oppia ML.

    Attributes:
        message: bytes. The message being communicated.
        vm_id: str. The ID of the Oppia ML VM to be authenticated.
        signature: str. The authentication signature signed by Oppia ML.
    """

    def __init__(
        self,
        message: bytes,
        vm_id: str,
        signature: str
    ) -> None:
        """Creates new OppiaMLAuthInfo object.

        Args:
            message: bytes. The message being communicated.
            vm_id: str. The ID of the Oppia ML VM to be authenticated.
            signature: str. The authentication signature signed by Oppia ML.
        """
        self._message = message
        self._vm_id = vm_id
        self._signature = signature

    @property
    def message(self) -> bytes:
        """Returns the message sent by OppiaML."""
        return self._message

    @property
    def vm_id(self) -> str:
        """Returns the vm_id of OppiaML VM."""
        return self._vm_id

    @property
    def signature(self) -> str:
        """Returns the signature sent by OppiaML."""
        return self._signature
