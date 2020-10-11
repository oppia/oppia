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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.platform import models
import feconf
import python_utils
import utils

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()

# Available choices of algorithms for classification.
ALGORITHM_CHOICES = [classifier_details['algorithm_id'] for (
    classifier_details) in feconf.INTERACTION_CLASSIFIER_MAPPING.values()]


class ClassifierTrainingJobModel(base_models.BaseModel):
    """Model for storing classifier training jobs.

    The id of instances of this class has the form
    '[exp_id].[random hash of 12 chars]'.
    """

    # The ID of the algorithm used to create the model.
    algorithm_id = datastore_services.StringProperty(
        required=True, choices=ALGORITHM_CHOICES, indexed=True)
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
    # data group.
    training_data = datastore_services.JsonProperty(default=None)
    # The time when the job's status should next be checked.
    # It is incremented by TTL when a job with status NEW is picked up by VM.
    next_scheduled_check_time = datastore_services.DateTimeProperty(
        required=True, indexed=True)
    # The schema version for the data that is being classified.
    data_schema_version = (
        datastore_services.IntegerProperty(required=True, indexed=True))

    @staticmethod
    def get_deletion_policy():
        """ClassifierTrainingJobModel is not related to users."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_export_policy(cls):
        """Model does not contain user data."""
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
            'data_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def _generate_id(cls, exp_id):
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

        for _ in python_utils.RANGE(base_models.MAX_RETRIES):
            new_id = '%s.%s' % (
                exp_id,
                utils.convert_to_hash(
                    python_utils.UNICODE(
                        utils.get_random_int(base_models.RAND_RANGE)),
                    base_models.ID_LENGTH))
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for ClassifierTrainingJobModel is producing '
            'too many collisions.')

    @classmethod
    def create(
            cls, algorithm_id, interaction_id, exp_id, exp_version,
            next_scheduled_check_time, training_data, state_name, status,
            data_schema_version):
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
            data_schema_version: int. The schema version for the data.

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
            data_schema_version=data_schema_version
            )

        training_job_instance.put()
        return instance_id

    @classmethod
    def query_new_and_pending_training_jobs(cls, cursor=None):
        """Gets the next 10 jobs which are either in status "new" or "pending",
        ordered by their next_scheduled_check_time attribute.

        Args:
            cursor: str or None. The list of returned entities starts from this
                datastore cursor.

        Returns:
            list(ClassifierTrainingJobModel). List of the
            ClassifierTrainingJobModels with status new or pending.
        """
        query = cls.query(cls.status.IN([
            feconf.TRAINING_JOB_STATUS_NEW,
            feconf.TRAINING_JOB_STATUS_PENDING])).filter(
                cls.next_scheduled_check_time <= (
                    datetime.datetime.utcnow())).order(
                        cls.next_scheduled_check_time, cls._key)

        job_models, cursor, more = query.fetch_page(10, start_cursor=cursor)
        return job_models, cursor, more

    @classmethod
    def create_multi(cls, job_dicts_list):
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
                data_schema_version=job_dict['data_schema_version'])

            job_models.append(training_job_instance)
            job_ids.append(instance_id)
        cls.put_multi(job_models)
        return job_ids


class TrainingJobExplorationMappingModel(base_models.BaseModel):
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
    # The ID of the training job corresponding to the exploration attributes.
    job_id = datastore_services.StringProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """TrainingJobExplorationMappingModel is not related to users."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

    @classmethod
    def get_export_policy(cls):
        """Model does not contain user data."""
        return dict(super(cls, cls).get_export_policy(), **{
            'exp_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'exp_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'state_name': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'job_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })

    @classmethod
    def _generate_id(cls, exp_id, exp_version, state_name):
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
        new_id = '%s.%s.%s' % (exp_id, exp_version, state_name)
        return python_utils.convert_to_bytes(new_id)

    @classmethod
    def get_models(cls, exp_id, exp_version, state_names):
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
    def create(
            cls, exp_id, exp_version, state_name, job_id):
        """Creates a new ClassifierExplorationMappingModel entry.

        Args:
            exp_id: str. ID of the exploration.
            exp_version: int. The exploration version at the time
                this training job was created.
            state_name: unicode. The name of the state to which the classifier
                belongs.
            job_id: str. The ID of the training job corresponding to this
                combination of <exp_id, exp_version, state_name>.

        Returns:
            str. ID of the new ClassifierExplorationMappingModel entry.

        Raises:
            Exception. A model with the same ID already exists.
        """

        instance_id = cls._generate_id(exp_id, exp_version, state_name)
        if not cls.get_by_id(instance_id):
            mapping_instance = cls(
                id=instance_id, exp_id=exp_id, exp_version=exp_version,
                state_name=state_name, job_id=job_id)

            mapping_instance.put()
            return instance_id
        raise Exception('A model with the same ID already exists.')

    @classmethod
    def create_multi(cls, job_exploration_mappings):
        """Creates multiple new TrainingJobExplorationMappingModel entries.

        Args:
            job_exploration_mappings: list(TrainingJobExplorationMapping). The
                list of TrainingJobExplorationMapping Domain objects.

        Returns:
            list(int). The list of mapping IDs.
        """
        mapping_models = []
        mapping_ids = []
        for job_exploration_mapping in job_exploration_mappings:
            instance_id = cls._generate_id(
                job_exploration_mapping.exp_id,
                job_exploration_mapping.exp_version,
                job_exploration_mapping.state_name)
            mapping_instance = cls(
                id=instance_id, exp_id=job_exploration_mapping.exp_id,
                exp_version=job_exploration_mapping.exp_version,
                state_name=job_exploration_mapping.state_name,
                job_id=job_exploration_mapping.job_id)

            mapping_models.append(mapping_instance)
            mapping_ids.append(instance_id)
        cls.put_multi(mapping_models)
        return mapping_ids
