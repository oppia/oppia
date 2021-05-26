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

import base64
import datetime
import hashlib
import hmac
import logging

from core.domain import classifier_domain
from core.domain import config_domain
from core.domain import exp_fetchers
from core.domain import fs_services
from core.platform import models
import feconf
import python_utils

(classifier_models, exp_models) = models.Registry.import_models(
    [models.NAMES.classifier, models.NAMES.exploration])


# NOTE TO DEVELOPERS: This function should be kept in sync with its counterpart
# in Oppia-ml.
def generate_signature(secret, message, vm_id):
    """Generates digital signature for given data.

    Args:
        secret: bytes. The secret used to communicate with Oppia-ml.
        message: bytes. The message payload data.
        vm_id: str. The ID of the VM that generated the message.

    Returns:
        str. The signature of the payload data.
    """
    encoded_vm_id = python_utils.convert_to_bytes(vm_id)
    message = b'%s|%s' % (base64.b64encode(message), encoded_vm_id)
    return hmac.new(
        secret, msg=message, digestmod=hashlib.sha256).hexdigest()


def verify_signature(oppia_ml_auth_info):
    """Function that checks if the signature received from the VM is valid.

    Args:
        oppia_ml_auth_info: OppiaMLAuthInfo. Domain object containing
            authentication information.

    Returns:
        bool. Whether the incoming request is valid.
    """
    secret = None
    for val in config_domain.VMID_SHARED_SECRET_KEY_MAPPING.value:
        if val['vm_id'] == oppia_ml_auth_info.vm_id:
            secret = python_utils.convert_to_bytes(val['shared_secret_key'])
            break
    if secret is None:
        return False

    generated_signature = generate_signature(
        secret, python_utils.convert_to_bytes(oppia_ml_auth_info.message),
        oppia_ml_auth_info.vm_id)
    if generated_signature != oppia_ml_auth_info.signature:
        return False
    return True


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
        algorithm_version = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['algorithm_version']

        # Validate the job.
        dummy_classifier_training_job = classifier_domain.ClassifierTrainingJob(
            'job_id_dummy', algorithm_id, interaction_id, exp_id, exp_version,
            next_scheduled_check_time, state_name,
            feconf.TRAINING_JOB_STATUS_NEW, training_data,
            algorithm_version)
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
            'algorithm_version': algorithm_version
        })

    # Create all the classifier training jobs.
    job_ids = classifier_models.ClassifierTrainingJobModel.create_multi(
        job_dicts_list)

    # Create mapping for each job. For StateTrainingJobsMapping, we can
    # append domain objects to send to the state_training_jobs_mappings dict
    # because we know all the attributes required for creating the Domain
    # object unlike ClassifierTrainingJob class where we don't know the job_id.
    state_training_jobs_mappings = []
    for job_id_index, job_id in enumerate(job_ids):
        state_training_jobs_mapping = (
            classifier_domain.StateTrainingJobsMapping(
                job_dicts_list[job_id_index]['exp_id'],
                job_dicts_list[job_id_index]['exp_version'],
                job_dicts_list[job_id_index]['state_name'],
                {job_dicts_list[job_id_index]['algorithm_id']: job_id}))
        state_training_jobs_mapping.validate()
        state_training_jobs_mappings.append(state_training_jobs_mapping)

    classifier_models.StateTrainingJobsMappingModel.create_multi(
        state_training_jobs_mappings)


def handle_non_retrainable_states(exploration, state_names, exp_versions_diff):
    """Creates new StateTrainingJobsMappingModel instances for all the
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
    classifier_training_job_maps = get_classifier_training_job_maps(
        exp_id, old_exp_version, state_names_to_retrieve)

    state_training_jobs_mappings = []
    state_names_without_classifier = []
    for index, classifier_training_job_map in enumerate(
            classifier_training_job_maps):
        if classifier_training_job_map is None:
            logging.error(
                'The ClassifierTrainingJobModel for the %s state of Exploration'
                ' with exp_id %s and exp_version %s does not exist.' % (
                    state_names_to_retrieve[index], exp_id, old_exp_version))
            state_names_without_classifier.append(
                state_names_to_retrieve[index])
            continue
        new_state_name = state_names[index]
        algorithm_ids_to_job_ids = {
            algorithm_id: job_id
            for algorithm_id, job_id in classifier_training_job_map.items()}
        state_training_jobs_mapping = (
            classifier_domain.StateTrainingJobsMapping(
                exp_id, current_exp_version, new_state_name,
                algorithm_ids_to_job_ids))
        state_training_jobs_mapping.validate()
        state_training_jobs_mappings.append(state_training_jobs_mapping)

    classifier_models.StateTrainingJobsMappingModel.create_multi(
        state_training_jobs_mappings)

    return state_names_without_classifier


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
        classifier_training_job_model.algorithm_version)


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

    classifier_models.ClassifierTrainingJobModel.update_timestamps_multi(
        classifier_training_job_models)
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
    classifier_training_job_model.update_timestamps()
    classifier_training_job_model.put()


def fetch_next_job():
    """Gets next job model in the job queue.

    Returns:
        ClassifierTrainingJob. Domain object of the next training Job.
    """
    classifier_training_jobs = []
    # Initially the offset for query is set to None.
    offset = 0
    valid_jobs = []
    timed_out_job_ids = []

    while len(valid_jobs) == 0:
        classifier_training_jobs, offset = (
            classifier_models.ClassifierTrainingJobModel.
            query_new_and_pending_training_jobs(offset))
        if len(classifier_training_jobs) == 0:
            break
        for training_job in classifier_training_jobs:
            if (training_job.status == (
                    feconf.TRAINING_JOB_STATUS_PENDING)):
                if (training_job.next_scheduled_check_time <= (
                        datetime.datetime.utcnow())):
                    timed_out_job_ids.append(training_job.id)
            else:
                valid_jobs.append(training_job)

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


def store_classifier_data(job_id, classifier_data_proto):
    """Checks for the existence of the model and then updates it.

    Args:
        job_id: str. ID of the ClassifierTrainingJob domain object.
        classifier_data_proto: FrozenModel. The frozen model protobuf object
            containing result of training job that needs to be stored.

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
    classifier_training_job.validate()
    fs_services.save_classifier_data(
        classifier_training_job_model.exp_id, job_id,
        classifier_data_proto)


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


def get_classifier_training_job(exp_id, exp_version, state_name, algorithm_id):
    """Gets classifier training job object for given algorithm_id for the
    given <exploration, version, state> triplet.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. The exploration version.
        state_name: str. The state name for which we retrieve the job.
        algorithm_id: str. The ID of the algorithm for which classifier training
            job is to be retrieved.

    Returns:
        ClassifierTrainingJob|None. An instance for the classifier training job
        or None if no such instance is found.
    """
    state_training_jobs_mapping_model = (
        classifier_models.StateTrainingJobsMappingModel.get_model(
            exp_id, exp_version, state_name))
    if state_training_jobs_mapping_model is None:
        return None
    job_id = state_training_jobs_mapping_model.algorithm_ids_to_job_ids[
        algorithm_id]
    return get_classifier_training_job_by_id(job_id)


def get_state_training_jobs_mapping(exp_id, exp_version, state_name):
    """Gets training job exploration mapping model for given exploration state
    combination.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. Version of the exploration.
        state_name: str. Name of the state for which training job mapping model
            is to be retrieved.

    Returns:
        StateTrainingJobsMapping. A domain object containing exploration
        mapping model information.
    """
    state_training_jobs_mapping_model = (
        classifier_models.StateTrainingJobsMappingModel.get_model(
            exp_id, exp_version, state_name))
    if state_training_jobs_mapping_model is None:
        return None

    return classifier_domain.StateTrainingJobsMapping(
        state_training_jobs_mapping_model.exp_id,
        state_training_jobs_mapping_model.exp_version,
        state_training_jobs_mapping_model.state_name,
        state_training_jobs_mapping_model.algorithm_ids_to_job_ids)


def migrate_state_training_jobs(state_training_jobs_mapping):
    """Migrate exploration training jobs to latest version of algorithm_id
    and algorithm_version.

    This function lazily migrates an older classifier training job and
    trains new classifiers. Specifically, if training job exploration mapping of
    an <exploration, version, state> triplet is missing job_id for some
    algorithm_id, or if the job_id exists but it has been trained on a now
    obsolete algorithm, we re-submit the jobs.

    The function goes through existing training job exploration mapping and
    identifies three different types of algorithm IDs.
        1. algorithm_ids_to_upgrade: Those which exist but needs to be
            upgraded a new algorithm (because existing one has been deprecated)
            by re-submitting the training job.
        2. algorithm_ids_to_add: Those which doesn't exist and needs to be added
            by submitting a new training job.
        3. algorithm_ids_to_remove: Those which needs to be removed since these
            algorithms are no longer supported.

    Once all three types of algorithm IDs are filtered, the function performs
    specific tasks tailored to each of them. We call this a lazy migration
    because it happens only when there is a query to retrieve a trained model
    for given <exploration, version, state> and algorithm_id.

    Args:
        state_training_jobs_mapping: StateTrainingJobsMapping. Domain
            object containing exploration to training job id mapping. This
            mapping is used to figure out jobs that need to be re-submitted,
            added or removed.
    """
    exp_id = state_training_jobs_mapping.exp_id
    exp_version = state_training_jobs_mapping.exp_version
    state_name = state_training_jobs_mapping.state_name

    exploration = exp_fetchers.get_exploration_by_id(
        exp_id, version=exp_version)
    interaction_id = exploration.states[state_name].interaction.id

    algorithm_id = feconf.INTERACTION_CLASSIFIER_MAPPING[
        interaction_id]['algorithm_id']
    algorithm_version = feconf.INTERACTION_CLASSIFIER_MAPPING[
        interaction_id]['algorithm_version']

    algorithm_id_to_algorithm_version = {
        algorithm_id: algorithm_version
    }

    # The list below contains only one element because as of now we only
    # support a single algorithm id per interaction type. However once the
    # support for multiple algorithm ids (see issue #10217) is added, the list
    # of possible algorithm ids can be retrieved from
    # feconf.INTERACTION_CLASSIFIER_MAPPING.
    possible_algorithm_ids = [algorithm_id]

    algorithm_ids_to_add = set(possible_algorithm_ids).difference(
        set(state_training_jobs_mapping.algorithm_ids_to_job_ids.keys()))

    algorithm_ids_to_remove = set(
        state_training_jobs_mapping.algorithm_ids_to_job_ids.keys()).difference(
            set(possible_algorithm_ids))

    algorithm_ids_to_upgrade = set(possible_algorithm_ids).intersection(
        set(state_training_jobs_mapping.algorithm_ids_to_job_ids.keys()))

    if len(algorithm_ids_to_add) > 0:
        job_dicts = []

        for algorithm_id in algorithm_ids_to_add:
            next_scheduled_check_time = datetime.datetime.utcnow()
            training_data = exploration.states[state_name].get_training_data()

            classifier_domain.ClassifierTrainingJob(
                'job_id_dummy', algorithm_id, interaction_id, exp_id,
                exp_version, next_scheduled_check_time, state_name,
                feconf.TRAINING_JOB_STATUS_NEW, training_data,
                algorithm_version).validate()

            job_dicts.append({
                'algorithm_id': algorithm_id,
                'interaction_id': interaction_id,
                'exp_id': exp_id,
                'exp_version': exp_version,
                'next_scheduled_check_time': next_scheduled_check_time,
                'state_name': state_name,
                'training_data': training_data,
                'status': feconf.TRAINING_JOB_STATUS_NEW,
                'algorithm_version': algorithm_version
            })

        job_ids = classifier_models.ClassifierTrainingJobModel.create_multi(
            job_dicts)

        for algorithm_id, job_id in python_utils.ZIP(
                algorithm_ids_to_add, job_ids):
            state_training_jobs_mapping.algorithm_ids_to_job_ids[
                algorithm_id] = job_id

    if algorithm_ids_to_upgrade:
        for algorithm_id in algorithm_ids_to_upgrade:
            classifier_training_job = (
                classifier_models.ClassifierTrainingJobModel.get_by_id(
                    state_training_jobs_mapping.algorithm_ids_to_job_ids[
                        algorithm_id]))
            classifier_training_job.algorithm_version = (
                algorithm_id_to_algorithm_version[algorithm_id])
            classifier_training_job.next_scheduled_check_time = (
                datetime.datetime.utcnow())
            classifier_training_job.status = feconf.TRAINING_JOB_STATUS_NEW
            classifier_training_job.update_timestamps()
            classifier_training_job.put()

    if algorithm_ids_to_remove:
        for algorithm_id in algorithm_ids_to_remove:
            delete_classifier_training_job(
                state_training_jobs_mapping.algorithm_ids_to_job_ids[
                    algorithm_id])
            state_training_jobs_mapping.algorithm_ids_to_job_ids.pop(
                algorithm_id)

    state_training_jobs_mapping_model = (
        classifier_models.StateTrainingJobsMappingModel.get_model(
            exp_id, exp_version, state_name))
    state_training_jobs_mapping.validate()
    state_training_jobs_mapping_model.algorithm_ids_to_job_ids = (
        state_training_jobs_mapping.algorithm_ids_to_job_ids)
    state_training_jobs_mapping_model.update_timestamps()
    state_training_jobs_mapping_model.put()


def get_classifier_training_job_maps(exp_id, exp_version, state_names):
    """Gets the list of algorithm-id-to-classifier-training-job mappings for
    each of the given state names.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. The exploration version.
        state_names: list(str). The state names for which we retrieve the job
            mappings.

    Returns:
        list(dict(str: str)). A list of dicts, each mapping
        algorithm IDs to the corresponding job IDs. Each element
        in the list corresponds to the corresponding state name in the
        state_names input argument.
    """
    state_training_jobs_mapping_models = (
        classifier_models.StateTrainingJobsMappingModel.get_models(
            exp_id, exp_version, state_names))
    state_to_algorithm_id_job_id_maps = []
    for state_mapping_model in state_training_jobs_mapping_models:
        state_to_algorithm_id_job_id_maps.append(
            None if state_mapping_model is None
            else state_mapping_model.algorithm_ids_to_job_ids)
    return state_to_algorithm_id_job_id_maps


def create_classifier_training_job_for_reverted_exploration(
        exploration, exploration_to_revert_to):
    """Create classifier training job model when an exploration is reverted.

    Args:
        exploration: Exploration. Exploration domain object.
        exploration_to_revert_to: Exploration. Exploration to revert to.
    """
    classifier_training_job_maps_for_old_version = (
        get_classifier_training_job_maps(
            exploration.id, exploration_to_revert_to.version,
            list(exploration_to_revert_to.states.keys())))
    state_training_jobs_mappings = []
    state_names = list(exploration_to_revert_to.states.keys())
    for index, classifier_training_job_map in enumerate(
            classifier_training_job_maps_for_old_version):
        if classifier_training_job_map is not None:
            state_name = state_names[index]
            algorithm_ids_to_job_ids = {
                algorithm_id: job_id
                for algorithm_id, job_id in (
                    classifier_training_job_map.items())
            }
            state_training_jobs_mapping = (
                classifier_domain.StateTrainingJobsMapping(
                    exploration.id, exploration.version + 1, state_name,
                    algorithm_ids_to_job_ids))
            state_training_jobs_mapping.validate()
            state_training_jobs_mappings.append(state_training_jobs_mapping)

    classifier_models.StateTrainingJobsMappingModel.create_multi(
        state_training_jobs_mappings)
