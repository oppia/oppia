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

"""Models for storing the classification data models."""

from __future__ import annotations

import datetime

from core import feconf
from core import utils
from core.platform import models

from typing import Dict, Final, List, Optional, Sequence, Tuple, Union

MYPY = False
if MYPY: # pragma: no cover
    # Here, we are importing 'classifier_domain' and 'classifier_services'
    # only for type checking.
    from core.domain import classifier_domain  # pylint: disable=invalid-import # isort:skip
    from core.domain import classifier_services  # pylint: disable=invalid-import # isort:skip
    from mypy_imports import base_models
    from mypy_imports import datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])
datastore_services = models.Registry.import_datastore_services()

NEW_AND_PENDING_TRAINING_JOBS_FETCH_LIMIT: Final = 100

TrainingDataUnionType = Union[
    Dict[str, Union[int, List[str]]],
    List[Dict[str, Union[int, List[str]]]]
]


class ClassifierTrainingJobModel(base_models.BaseModel):
    """Model for storing classifier training jobs.

    The id of instances of this class has the form
    '[exp_id].[random hash of 12 chars]'.
    """

    # The ID of the algorithm used to create the model.
    algorithm_id = datastore_services.StringProperty(
        required=True, indexed=True)
    # The ID of the interaction to which the algorithm belongs.
    interaction_id = (
        datastore_services.StringProperty(required=True, indexed=True))
    # The exploration_id of the exploration to whose state the model belongs.
    exp_id = datastore_services.StringProperty(required=True, indexed=True)
    # The exploration version at the time this training job was created.
    exp_version = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The name of the state to which the model belongs.
    state_name = datastore_services.StringProperty(required=True, indexed=True)
    # The status of the training job. It can be either NEW, COMPLETE or PENDING.
    status = datastore_services.StringProperty(
        required=True, choices=feconf.ALLOWED_TRAINING_JOB_STATUSES,
        default=feconf.TRAINING_JOB_STATUS_PENDING, indexed=True)
    # The training data which is to be populated when retrieving the job.
    # The list contains dicts where each dict represents a single training
    # data group. The training data are computed from answers that have been
    # anonymized and that are not connected to any existing or deleted users.
    training_data = datastore_services.JsonProperty(default=None)
    # The time when the job's status should next be checked.
    # It is incremented by TTL when a job with status NEW is picked up by VM.
    next_scheduled_check_time = datastore_services.DateTimeProperty(
        required=True, indexed=True)
    # The algorithm version for the classifier. Algorithm version identifies
    # the format of the classifier_data as well as the prediction API to be
    # used.
    algorithm_version = datastore_services.IntegerProperty(
        required=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'algorithm_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'interaction_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'training_data': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'next_scheduled_check_time':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'algorithm_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def _generate_id(cls, exp_id: str) -> str:
        """Generates a unique id for the training job of the form
        '[exp_id].[random hash of 16 chars]'.

        Args:
            exp_id: str. ID of the exploration.

        Returns:
            str. ID of the new ClassifierTrainingJobModel instance.

        Raises:
            Exception. The id generator for ClassifierTrainingJobModel is
                producing too many collisions.
        """

        for _ in range(base_models.MAX_RETRIES):
            new_id = '%s.%s' % (
                exp_id,
                utils.convert_to_hash(
                    str(utils.get_random_int(base_models.RAND_RANGE)),
                    base_models.ID_LENGTH))
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for ClassifierTrainingJobModel is producing '
            'too many collisions.')

    @classmethod
    def create(
        cls,
        algorithm_id: str,
        interaction_id: str,
        exp_id: str,
        exp_version: int,
        next_scheduled_check_time: datetime.datetime,
        training_data: TrainingDataUnionType,
        state_name: str,
        status: str,
        algorithm_version: int
    ) -> str:
        """Creates a new ClassifierTrainingJobModel entry.

        Args:
            algorithm_id: str. ID of the algorithm used to generate the model.
            interaction_id: str. ID of the interaction to which the algorithm
                belongs.
            exp_id: str. ID of the exploration.
            exp_version: int. The exploration version at the time
                this training job was created.
            next_scheduled_check_time: datetime.datetime. The next scheduled
                time to check the job.
            training_data: dict. The data used in training phase.
            state_name: str. The name of the state to which the classifier
                belongs.
            status: str. The status of the training job.
            algorithm_version: int. The version of the classifier model to be
                trained.

        Returns:
            str. ID of the new ClassifierModel entry.

        Raises:
            Exception. A model with the same ID already exists.
        """

        instance_id = cls._generate_id(exp_id)
        training_job_instance = cls(
            id=instance_id, algorithm_id=algorithm_id,
            interaction_id=interaction_id,
            exp_id=exp_id,
            exp_version=exp_version,
            next_scheduled_check_time=next_scheduled_check_time,
            state_name=state_name, status=status,
            training_data=training_data,
            algorithm_version=algorithm_version
        )

        training_job_instance.update_timestamps()
        training_job_instance.put()
        return instance_id

    @classmethod
    def query_new_and_pending_training_jobs(
        cls, offset: int
    ) -> Tuple[Sequence[ClassifierTrainingJobModel], int]:
        """Gets the next 10 jobs which are either in status "new" or "pending",
        ordered by their next_scheduled_check_time attribute.

        Args:
            offset: int. Number of query results to skip.

        Returns:
            tuple(list(ClassifierTrainingJobModel), int).
            A tuple containing the list of the ClassifierTrainingJobModels
            with status new or pending and the offset value.
        """
        query = (
            cls.get_all()
            .filter(
                datastore_services.all_of(
                    cls.status.IN([
                        feconf.TRAINING_JOB_STATUS_NEW,
                        feconf.TRAINING_JOB_STATUS_PENDING
                    ]),
                    cls.next_scheduled_check_time <= datetime.datetime.utcnow()
                )
            )
            .order(cls.next_scheduled_check_time)
        )

        classifier_job_models: Sequence[ClassifierTrainingJobModel] = (
            query.fetch(
                NEW_AND_PENDING_TRAINING_JOBS_FETCH_LIMIT, offset=offset))
        offset = offset + len(classifier_job_models)
        return classifier_job_models, offset

    @classmethod
    def create_multi(
        cls, job_dicts_list: List[classifier_services.JobInfoDict]
    ) -> List[str]:
        """Creates multiple new  ClassifierTrainingJobModel entries.

        Args:
            job_dicts_list: list(dict). The list of dicts where each dict
                represents the attributes of one ClassifierTrainingJobModel.

        Returns:
            list(str). List of job IDs.
        """
        job_models = []
        job_ids = []
        for job_dict in job_dicts_list:
            instance_id = cls._generate_id(job_dict['exp_id'])
            training_job_instance = cls(
                id=instance_id, algorithm_id=job_dict['algorithm_id'],
                interaction_id=job_dict['interaction_id'],
                exp_id=job_dict['exp_id'],
                exp_version=job_dict['exp_version'],
                next_scheduled_check_time=job_dict['next_scheduled_check_time'],
                state_name=job_dict['state_name'], status=job_dict['status'],
                training_data=job_dict['training_data'],
                algorithm_version=job_dict['algorithm_version'])

            job_models.append(training_job_instance)
            job_ids.append(instance_id)
        cls.update_timestamps_multi(job_models)
        cls.put_multi(job_models)
        return job_ids


class StateTrainingJobsMappingModel(base_models.BaseModel):
    """Model for mapping exploration attributes to a ClassifierTrainingJob.

    The ID of instances of this class has the form
    [exp_id].[exp_version].[state_name].
    """

    # The exploration_id of the exploration to whose state the model belongs.
    exp_id = datastore_services.StringProperty(required=True, indexed=True)
    # The exploration version at the time the corresponding classifier's
    # training job was created.
    exp_version = (
        datastore_services.IntegerProperty(required=True, indexed=True))
    # The name of the state to which the model belongs.
    state_name = datastore_services.StringProperty(required=True, indexed=True)
    # The IDs of the training jobs corresponding to the exploration state. Each
    # algorithm_id corresponding to the interaction of the exploration state is
    # mapped to its unique job_id.
    algorithm_ids_to_job_ids = datastore_services.JsonProperty(
        required=True, indexed=True)

    @staticmethod
    def get_deletion_policy() -> base_models.DELETION_POLICY:
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @staticmethod
    def get_model_association_to_user(
    ) -> base_models.MODEL_ASSOCIATION_TO_USER:
        """Model does not contain user data."""
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls) -> Dict[str, base_models.EXPORT_POLICY]:
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'algorithm_ids_to_job_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def _generate_id(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str
    ) -> str:
        """Generates a unique ID for the Classifier Exploration Mapping of the
        form [exp_id].[exp_version].[state_name].

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. The exploration version at the time
                this training job was created.
            state_name: unicode. The name of the state to which the classifier
                belongs.

        Returns:
            str. ID of the new Classifier Exploration Mapping instance.
        """
        return '%s.%s.%s' % (exp_id, exp_version, state_name)

    @classmethod
    def get_models(
        cls, exp_id: str, exp_version: int, state_names: List[str]
    ) -> List[Optional[StateTrainingJobsMappingModel]]:
        """Retrieves the Classifier Exploration Mapping models given Exploration
        attributes.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. The exploration version at the time
                this training job was created.
            state_names: list(unicode). The state names for which we retrieve
                the mapping models.

        Returns:
            list(ClassifierExplorationMappingModel|None). The model instances
            for the classifier exploration mapping.
        """
        mapping_ids = []
        for state_name in state_names:
            mapping_id = cls._generate_id(exp_id, exp_version, state_name)
            mapping_ids.append(mapping_id)
        mapping_instances = cls.get_multi(mapping_ids)
        return mapping_instances

    @classmethod
    def get_model(
        cls, exp_id: str, exp_version: int, state_name: str
    ) -> Optional[StateTrainingJobsMappingModel]:
        """Retrieves the Classifier Exploration Mapping model for given
        exploration.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. The exploration version at the time
                this training job was created.
            state_name: unicode. The state name for which we retrieve
                the mapping model.

        Returns:
            ClassifierExplorationMappingModel|None. The model instance
            for the classifier exploration mapping. It returns None if the no
            entry for given <exp_id, exp_version, state_name> is found.
        """
        mapping_id = cls._generate_id(exp_id, exp_version, state_name)
        model = cls.get_by_id(mapping_id)
        return model

    @classmethod
    def create(
        cls,
        exp_id: str,
        exp_version: int,
        state_name: str,
        algorithm_ids_to_job_ids: Dict[str, str]
    ) -> str:
        """Creates a new ClassifierExplorationMappingModel entry.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. The exploration version at the time
                this training job was created.
            state_name: unicode. The name of the state to which the classifier
                belongs.
            algorithm_ids_to_job_ids: dict(str, str). The mapping from
                algorithm IDs to the IDs of their corresponding classifier
                training jobs.

        Returns:
            str. ID of the new ClassifierExplorationMappingModel entry.

        Raises:
            Exception. A model with the same ID already exists.
        """

        instance_id = cls._generate_id(exp_id, exp_version, state_name)
        if not cls.get_by_id(instance_id):
            mapping_instance = cls(
                id=instance_id, exp_id=exp_id, exp_version=exp_version,
                state_name=state_name,
                algorithm_ids_to_job_ids=algorithm_ids_to_job_ids)

            mapping_instance.update_timestamps()
            mapping_instance.put()
            return instance_id
        raise Exception('A model with the same ID already exists.')

    @classmethod
    def create_multi(
        cls,
        state_training_jobs_mappings: List[
            classifier_domain.StateTrainingJobsMapping
        ]
    ) -> List[str]:
        """Creates multiple new StateTrainingJobsMappingModel entries.

        Args:
            state_training_jobs_mappings: list(StateTrainingJobsMapping). The
                list of StateTrainingJobsMapping domain objects.

        Returns:
            list(int). The list of mapping IDs.
        """
        mapping_models = []
        mapping_ids = []
        for state_training_job_mapping in state_training_jobs_mappings:
            instance_id = cls._generate_id(
                state_training_job_mapping.exp_id,
                state_training_job_mapping.exp_version,
                state_training_job_mapping.state_name)
            mapping_instance = cls(
                id=instance_id, exp_id=state_training_job_mapping.exp_id,
                exp_version=state_training_job_mapping.exp_version,
                state_name=state_training_job_mapping.state_name,
                algorithm_ids_to_job_ids=(
                    state_training_job_mapping.algorithm_ids_to_job_ids
                ))

            mapping_models.append(mapping_instance)
            mapping_ids.append(instance_id)
        cls.update_timestamps_multi(mapping_models)
        cls.put_multi(mapping_models)
        return mapping_ids
