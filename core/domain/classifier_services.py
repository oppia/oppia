# Copyright 2017 The Oppia Authors. All Rights Reserved.
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

"""Services for classifier data models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import logging
import re

from core.domain import classifier_domain
from core.domain import fs_services
from core.platform import models
import feconf
import python_utils

(classifier_models, exp_models) = models.Registry.import_models(
    [models.NAMES.classifier, models.NAMES.exploration])


def handle_trainable_states(exploration, state_names):
    """Creates ClassifierTrainingJobModel instances for all the state names
    passed into the function. If this function is called with version number 1,
    we are creating jobs for all trainable states in the exploration. Otherwise,
    a new job is being created for the states where retraining is required.

    Args:
        exploration: Exploration. The Exploration domain object.
        state_names: list(str). List of state names.
    """
    job_dicts_list = []
    exp_id = exploration.id
    exp_version = exploration.version
    for state_name in state_names:
        state = exploration.states[state_name]
        training_data = state.get_training_data()
        interaction_id = state.interaction.id
        algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_id']
        next_scheduled_check_time = datetime.datetime.utcnow()
        classifier_data = None
        data_schema_version = 1

        # Validate the job.
        dummy_classifier_training_job = classifier_domain.ClassifierTrainingJob(
            'job_id_dummy', algorithm_id, interaction_id, exp_id, exp_version,
            next_scheduled_check_time, state_name,
            feconf.TRAINING_JOB_STATUS_NEW, training_data, classifier_data,
            data_schema_version)
        dummy_classifier_training_job.validate()

        job_dicts_list.append({
            'algorithm_id': algorithm_id,
            'interaction_id': interaction_id,
            'exp_id': exp_id,
            'exp_version': exp_version,
            'next_scheduled_check_time': next_scheduled_check_time,
            'state_name': state_name,
            'training_data': training_data,
            'status': feconf.TRAINING_JOB_STATUS_NEW,
            'data_schema_version': data_schema_version
        })

    # Create all the classifier training jobs.
    job_ids = classifier_models.ClassifierTrainingJobModel.create_multi(
        job_dicts_list)

    # Create mapping for each job. For TrainingJobExplorationMapping, we can
    # append Domain objects to send to the job_exploration_mappings dict because
    # we know all the attributes required for creating the Domain object unlike
    # ClassifierTrainingJob class where we don't know the job_id.
    job_exploration_mappings = []
    for job_id_index, job_id in enumerate(job_ids):
        job_exploration_mapping = (
            classifier_domain.TrainingJobExplorationMapping(
                job_dicts_list[job_id_index]['exp_id'],
                job_dicts_list[job_id_index]['exp_version'],
                job_dicts_list[job_id_index]['state_name'],
                job_id))
        job_exploration_mapping.validate()
        job_exploration_mappings.append(job_exploration_mapping)

    classifier_models.TrainingJobExplorationMappingModel.create_multi(
        job_exploration_mappings)


def handle_non_retrainable_states(exploration, state_names, exp_versions_diff):
    """Creates new TrainingJobExplorationMappingModel instances for all the
    state names passed into the function. The mapping is created from the
    state in the new version of the exploration to the ClassifierTrainingJob of
    the state in the older version of the exploration. If there's been a change
    in the state name, we retrieve the old state name and create the mapping
    accordingly.
    This method is called only from exp_services._save_exploration() method and
    is never called from exp_services._create_exploration().
    In this method, the current_state_name refers to the name of the state in
    the current version of the exploration whereas the old_state_name refers to
    the name of the state in the previous version of the exploration.

    Args:
        exploration: Exploration. The Exploration domain object.
        state_names: list(str). List of state names.
        exp_versions_diff: ExplorationVersionsDiff. An instance of the
            exploration versions diff class.

    Raises:
        Exception. This method should not be called by exploration with version
            number 1.

    Returns:
        list(str). State names which don't have classifier model for previous
        version of exploration.
    """
    exp_id = exploration.id
    current_exp_version = exploration.version
    old_exp_version = current_exp_version - 1
    if old_exp_version <= 0:
        raise Exception(
            'This method should not be called by exploration with version '
            'number %s' % (current_exp_version))

    state_names_to_retrieve = []
    for current_state_name in state_names:
        old_state_name = current_state_name
        if current_state_name in exp_versions_diff.new_to_old_state_names:
            old_state_name = exp_versions_diff.new_to_old_state_names[
                current_state_name]
        state_names_to_retrieve.append(old_state_name)
    classifier_training_jobs = get_classifier_training_jobs(
        exp_id, old_exp_version, state_names_to_retrieve)

    job_exploration_mappings = []
    state_names_without_classifier = []
    for index, classifier_training_job in enumerate(classifier_training_jobs):
        if classifier_training_job is None:
            logging.error(
                'The ClassifierTrainingJobModel for the %s state of Exploration'
                ' with exp_id %s and exp_version %s does not exist.' % (
                    state_names_to_retrieve[index], exp_id, old_exp_version))
            state_names_without_classifier.append(
                state_names_to_retrieve[index])
            continue
        new_state_name = state_names[index]
        job_exploration_mapping = (
            classifier_domain.TrainingJobExplorationMapping(
                exp_id, current_exp_version, new_state_name,
                classifier_training_job.job_id))
        job_exploration_mapping.validate()
        job_exploration_mappings.append(job_exploration_mapping)

    classifier_models.TrainingJobExplorationMappingModel.create_multi(
        job_exploration_mappings)

    return state_names_without_classifier


def convert_strings_to_float_numbers_in_classifier_data(
        classifier_data_with_floats_stringified):
    """Converts all floating point numbers in classifier data to string.

    The following function iterates through entire classifier data and converts
    all string values which are successfully matched by regex of floating point
    numbers to corresponding float values.

    Args:
        classifier_data_with_floats_stringified: dict|list|string|int.
            The original classifier data which needs conversion of floats from
            strings to floats.

    Raises:
        Exception. If classifier data contains an object whose type is other
            than integer, string, dict or list.

    Returns:
        dict|list|string|int|float. Original classifier data dict with
        float values converted back from string to float.
    """
    if isinstance(classifier_data_with_floats_stringified, dict):
        classifier_data = {}
        for k in classifier_data_with_floats_stringified:
            classifier_data[k] = (
                convert_strings_to_float_numbers_in_classifier_data(
                    classifier_data_with_floats_stringified[k]))
        return classifier_data
    elif isinstance(classifier_data_with_floats_stringified, list):
        classifier_data = []
        for item in classifier_data_with_floats_stringified:
            classifier_data.append(
                convert_strings_to_float_numbers_in_classifier_data(item))
        return classifier_data
    elif isinstance(
            classifier_data_with_floats_stringified, python_utils.BASESTRING):
        if re.match(
                feconf.FLOAT_VERIFIER_REGEX,
                classifier_data_with_floats_stringified):
            return float(classifier_data_with_floats_stringified)
        return classifier_data_with_floats_stringified
    elif isinstance(classifier_data_with_floats_stringified, int):
        return classifier_data_with_floats_stringified
    else:
        raise Exception(
            'Expected all classifier data objects to be lists, dicts, '
            'strings, integers but received %s.' % type(
                classifier_data_with_floats_stringified))


def get_classifier_training_job_from_model(classifier_training_job_model):
    """Gets a classifier training job domain object from a classifier
    training job model.

    Args:
        classifier_training_job_model: ClassifierTrainingJobModel. Classifier
            training job instance in datastore.

    Returns:
        classifier_training_job: ClassifierTrainingJob. Domain object for the
        classifier training job.
    """
    classifier_data = fs_services.read_classifier_data(
        classifier_training_job_model.exp_id, classifier_training_job_model.id)
    return classifier_domain.ClassifierTrainingJob(
        classifier_training_job_model.id,
        classifier_training_job_model.algorithm_id,
        classifier_training_job_model.interaction_id,
        classifier_training_job_model.exp_id,
        classifier_training_job_model.exp_version,
        classifier_training_job_model.next_scheduled_check_time,
        classifier_training_job_model.state_name,
        classifier_training_job_model.status,
        classifier_training_job_model.training_data,
        classifier_data,
        classifier_training_job_model.data_schema_version)


def get_classifier_training_job_by_id(job_id):
    """Gets a classifier training job by a job_id.

    Args:
        job_id: str. ID of the classifier training job.

    Returns:
        classifier_training_job: ClassifierTrainingJob. Domain object for the
        classifier training job.

    Raises:
        Exception. Entity for class ClassifierTrainingJobModel with id not
            found.
    """
    classifier_training_job_model = (
        classifier_models.ClassifierTrainingJobModel.get(job_id))
    classifier_training_job = get_classifier_training_job_from_model(
        classifier_training_job_model)
    return classifier_training_job


def _update_classifier_training_jobs_status(job_ids, status):
    """Checks for the existence of the model and then updates it.

    Args:
        job_ids: list(str). List of ID of the ClassifierTrainingJob domain
            objects.
        status: str. The status to which the job needs to be updated.

    Raises:
        Exception. The ClassifierTrainingJobModel corresponding to the job_id
            of the ClassifierTrainingJob does not exist.
    """
    classifier_training_job_models = (
        classifier_models.ClassifierTrainingJobModel.get_multi(job_ids))

    for index in python_utils.RANGE(len(job_ids)):
        if classifier_training_job_models[index] is None:
            raise Exception(
                'The ClassifierTrainingJobModel corresponding to the job_id '
                'of the ClassifierTrainingJob does not exist.')

        classifier_training_job = get_classifier_training_job_from_model(
            classifier_training_job_models[index])
        classifier_training_job.update_status(status)
        classifier_training_job.validate()

        classifier_training_job_models[index].status = status

    classifier_models.ClassifierTrainingJobModel.put_multi(
        classifier_training_job_models)


def mark_training_job_complete(job_id):
    """Updates the training job's status to complete.

    Args:
        job_id: str. ID of the ClassifierTrainingJob.
    """
    _update_classifier_training_jobs_status(
        [job_id], feconf.TRAINING_JOB_STATUS_COMPLETE)


def mark_training_jobs_failed(job_ids):
    """Updates the training job's status to failed.

    Args:
        job_ids: list(str). List of ID of the ClassifierTrainingJobs.
    """
    _update_classifier_training_jobs_status(
        job_ids, feconf.TRAINING_JOB_STATUS_FAILED)


def mark_training_job_pending(job_id):
    """Updates the training job's status to pending.

    Args:
        job_id: str. ID of the ClassifierTrainingJob.
    """
    _update_classifier_training_jobs_status(
        [job_id], feconf.TRAINING_JOB_STATUS_PENDING)


def _update_scheduled_check_time_for_new_training_job(job_id):
    """Updates the next scheduled check time of job with status NEW.

    Args:
        job_id: str. ID of the ClassifierTrainingJob.
    """
    classifier_training_job_model = (
        classifier_models.ClassifierTrainingJobModel.get(job_id))
    classifier_training_job_model.next_scheduled_check_time = (
        datetime.datetime.utcnow() + datetime.timedelta(
            minutes=feconf.CLASSIFIER_JOB_TTL_MINS))
    classifier_training_job_model.put()


def fetch_next_job():
    """Gets next job model in the job queue.

    Returns:
        ClassifierTrainingJob. Domain object of the next training Job.
    """
    classifier_training_jobs = []
    # Initially the cursor for query is set to None.
    cursor = None
    valid_jobs = []
    timed_out_job_ids = []

    while len(valid_jobs) == 0:
        classifier_training_jobs, cursor, more = (
            classifier_models.ClassifierTrainingJobModel.
            query_new_and_pending_training_jobs(cursor))
        for training_job in classifier_training_jobs:
            if (training_job.status == (
                    feconf.TRAINING_JOB_STATUS_PENDING)):
                if (training_job.next_scheduled_check_time <= (
                        datetime.datetime.utcnow())):
                    timed_out_job_ids.append(training_job.id)
            else:
                valid_jobs.append(training_job)
        if not more:
            break

    if timed_out_job_ids:
        mark_training_jobs_failed(timed_out_job_ids)

    if valid_jobs:
        next_job_model = valid_jobs[0]
        # Assuming that a pending job has empty classifier data as it has not
        # been trained yet.
        next_job_model.classifier_data = None
        next_job = get_classifier_training_job_from_model(next_job_model)
        _update_scheduled_check_time_for_new_training_job(next_job.job_id)
    else:
        next_job = None
    return next_job


def store_classifier_data(job_id, classifier_data):
    """Checks for the existence of the model and then updates it.

    Args:
        job_id: str. ID of the ClassifierTrainingJob domain object.
        classifier_data: dict. The classification model which needs to be stored
            in the job.

    Raises:
        Exception. The ClassifierTrainingJobModel corresponding to the job_id
            of the ClassifierTrainingJob does not exist.
    """
    classifier_training_job_model = (
        classifier_models.ClassifierTrainingJobModel.get(job_id, strict=False))
    if not classifier_training_job_model:
        raise Exception(
            'The ClassifierTrainingJobModel corresponding to the job_id of the '
            'ClassifierTrainingJob does not exist.')
    classifier_training_job = get_classifier_training_job_from_model(
        classifier_training_job_model)
    classifier_training_job.update_classifier_data(classifier_data)
    classifier_training_job.validate()
    fs_services.save_classifier_data(
        classifier_training_job_model.exp_id, job_id, classifier_data)


def delete_classifier_training_job(job_id):
    """Deletes classifier training job model in the datastore given job_id.

    Args:
        job_id: str. ID of the classifier training job.
    """
    classifier_training_job_model = (
        classifier_models.ClassifierTrainingJobModel.get(job_id))
    if classifier_training_job_model is not None:
        fs_services.delete_classifier_data(
            classifier_training_job_model.exp_id, job_id)
        classifier_training_job_model.delete()


def get_classifier_training_jobs(exp_id, exp_version, state_names):
    """Gets the classifier training job object from the exploration attributes.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. The exploration version.
        state_names: list(str). The state names for which we retrieve the job.

    Returns:
        list(ClassifierTrainingJob). Domain objects for the Classifier training
        job model.
    """
    training_job_exploration_mapping_models = (
        classifier_models.TrainingJobExplorationMappingModel.get_models(
            exp_id, exp_version, state_names))
    job_ids = []
    for mapping_model in training_job_exploration_mapping_models:
        if mapping_model is None:
            continue
        job_ids.append(mapping_model.job_id)

    classifier_training_job_models = (
        classifier_models.ClassifierTrainingJobModel.get_multi(job_ids))

    classifier_training_jobs = []
    for job_model in classifier_training_job_models:
        classifier_training_jobs.append(get_classifier_training_job_from_model(
            job_model))

    # Backfill None's to maintain indexes.
    for index, mapping_model in enumerate(
            training_job_exploration_mapping_models):
        if mapping_model is None:
            classifier_training_jobs.insert(index, None)
    return classifier_training_jobs


def create_classifier_training_job_for_reverted_exploration(
        exploration, exploration_to_revert_to):
    """Create classifier training job model when an exploration is reverted.

    Args:
        exploration: Exploration. Exploration domain object.
        exploration_to_revert_to: Exploration. Exploration to revert to.
    """
    classifier_training_jobs_for_old_version = get_classifier_training_jobs(
        exploration.id, exploration_to_revert_to.version,
        list(exploration_to_revert_to.states.keys()))
    job_exploration_mappings = []
    state_names = list(exploration_to_revert_to.states.keys())
    for index, classifier_training_job in enumerate(
            classifier_training_jobs_for_old_version):
        if classifier_training_job is not None:
            state_name = state_names[index]
            job_exploration_mapping = (
                classifier_domain.TrainingJobExplorationMapping(
                    exploration.id, exploration.version + 1, state_name,
                    classifier_training_job.job_id))
            job_exploration_mapping.validate()
            job_exploration_mappings.append(job_exploration_mapping)

    classifier_models.TrainingJobExplorationMappingModel.create_multi(
        job_exploration_mappings)
