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

"""Services for classifier data models"""

from core.domain import classifier_domain
from core.domain import classifier_registry
from core.domain import exp_domain
from core.domain import interaction_registry
from core.platform import models

import feconf

(classifier_models,) = models.Registry.import_models(
    [models.NAMES.classifier])


def classify(state, answer):
    """Classify the answer using the string classifier.

    This should only be called if the string classifier functionality is
    enabled, and the interaction is trainable.

    Normalize the answer and classifies the answer if the interaction has a
    classifier associated with it. Otherwise, classifies the answer to the
    default outcome.

    Returns a dict with the following keys:
        'outcome': A dict representing the outcome of the answer group matched.
        'answer_group_index': An index into the answer groups list indicating
            which one was selected as the group which this answer belongs to.
            This is equal to the number of answer groups if the default outcome
            was matched.
        'rule_spec_index': An index into the rule specs list of the matched
            answer group which was selected that indicates which rule spec was
            matched. This is equal to 0 if the default outcome is selected.
    When the default rule is matched, outcome is the default_outcome of the
    state's interaction.
    """
    assert feconf.ENABLE_STRING_CLASSIFIER

    interaction_instance = interaction_registry.Registry.get_interaction_by_id(
        state.interaction.id)
    normalized_answer = interaction_instance.normalize_answer(answer)
    response = None

    if interaction_instance.is_string_classifier_trainable:
        response = classify_string_classifier_rule(state, normalized_answer)
    else:
        raise Exception('No classifier found for interaction.')

    if response is not None:
        return response
    elif state.interaction.default_outcome is not None:
        return {
            'outcome': state.interaction.default_outcome.to_dict(),
            'answer_group_index': len(state.interaction.answer_groups),
            'classification_certainty': 0.0,
            'rule_spec_index': 0
        }

    raise Exception(
        'Something has seriously gone wrong with the exploration. Oppia does '
        'not know what to do with this answer. Please contact the '
        'exploration owner.')


def classify_string_classifier_rule(state, normalized_answer):
    """Run the classifier if no prediction has been made yet. Currently this
    is behind a development flag.
    """
    best_matched_answer_group = None
    best_matched_answer_group_index = len(state.interaction.answer_groups)
    best_matched_rule_spec_index = None

    sc = classifier_registry.Registry.get_classifier_by_algorithm_id(
        feconf.INTERACTION_CLASSIFIER_MAPPING[state.interaction.id][
            'algorithm_id'])

    training_examples = [
        [doc, []] for doc in state.interaction.confirmed_unclassified_answers]
    for (answer_group_index, answer_group) in enumerate(
            state.interaction.answer_groups):
        classifier_rule_spec_index = answer_group.get_classifier_rule_index()
        if classifier_rule_spec_index is not None:
            classifier_rule_spec = answer_group.rule_specs[
                classifier_rule_spec_index]
        else:
            classifier_rule_spec = None
        if classifier_rule_spec is not None:
            training_examples.extend([
                [doc, [str(answer_group_index)]]
                for doc in classifier_rule_spec.inputs['training_data']])
    if len(training_examples) > 0:
        sc.train(training_examples)
        labels = sc.predict([normalized_answer])
        predicted_label = labels[0]
        if predicted_label != feconf.DEFAULT_CLASSIFIER_LABEL:
            predicted_answer_group_index = int(predicted_label)
            predicted_answer_group = state.interaction.answer_groups[
                predicted_answer_group_index]
            for rule_spec in predicted_answer_group.rule_specs:
                if rule_spec.rule_type == exp_domain.RULE_TYPE_CLASSIFIER:
                    best_matched_rule_spec_index = classifier_rule_spec_index
                    break
            best_matched_answer_group = predicted_answer_group
            best_matched_answer_group_index = predicted_answer_group_index
            return {
                'outcome': best_matched_answer_group.outcome.to_dict(),
                'answer_group_index': best_matched_answer_group_index,
                'rule_spec_index': best_matched_rule_spec_index,
            }
        else:
            return None

    return None


def get_classifier_from_model(classifier_data_model):
    """Gets a classifier domain object from a classifier data model.

    Args:
        classifier_data_model: Classifier data model instance in datastore.

    Returns:
        classifier: Domain object for the classifier.
    """
    return classifier_domain.ClassifierData(
        classifier_data_model.id, classifier_data_model.exp_id,
        classifier_data_model.exp_version_when_created,
        classifier_data_model.state_name, classifier_data_model.algorithm_id,
        classifier_data_model.classifier_data,
        classifier_data_model.data_schema_version)


def get_classifier_by_id(classifier_id):
    """Gets a classifier from a classifier id.

    Args:
        classifier_id: str. ID of the classifier.

    Returns:
        classifier: Domain object for the classifier.

    Raises:
        Exception: Entity for class ClassifierDataModel with id not found.
    """
    classifier_data_model = classifier_models.ClassifierDataModel.get(
        classifier_id)
    classifier = get_classifier_from_model(classifier_data_model)
    return classifier


def create_classifier(job_id, classifier_data):
    """Creates classifier data model in the datastore given a classifier
       domain object.

    Args:
        job_id: str. ID of the ClassifierTrainingJob corresponding to the
            classifier.
        classifier_data: dict. The trained classifier data.

    Returns:
        classifier_id: str. ID of the classifier.

    Raises:
        Exception. The ClassifierDataModel corresponding to the job already
            exists.
        Exception. The algorithm_id of the job does not exist in the Interaction
            Classifier Mapping.
    """
    classifier_data_model = classifier_models.ClassifierDataModel.get(
        job_id, strict=False)
    if classifier_data_model is not None:
        raise Exception(
            'The ClassifierDataModel corresponding to the job already exists.')

    classifier_training_job = get_classifier_training_job_by_id(job_id)
    state_name = classifier_training_job.state_name
    exp_id = classifier_training_job.exp_id
    exp_version = classifier_training_job.exp_version
    algorithm_id = classifier_training_job.algorithm_id
    interaction_id = classifier_training_job.interaction_id
    data_schema_version = None
    if feconf.INTERACTION_CLASSIFIER_MAPPING[interaction_id][
            'algorithm_id'] == algorithm_id:
        data_schema_version = feconf.INTERACTION_CLASSIFIER_MAPPING[
            interaction_id]['current_data_schema_version']
    if data_schema_version is None:
        raise Exception(
            'The algorithm_id of the job does not exist in the Interaction '
            'Classifier Mapping.')

    classifier = classifier_domain.ClassifierData(
        job_id, exp_id, exp_version, state_name, algorithm_id,
        classifier_data, data_schema_version)
    classifier.validate()

    classifier_id = classifier_models.ClassifierDataModel.create(
        classifier.id, classifier.exp_id,
        classifier.exp_version_when_created,
        classifier.state_name, classifier.algorithm_id,
        classifier.classifier_data, classifier.data_schema_version)

    # Create the mapping from <exp_id,exp_version,state_name>
    # to classifier_id.
    create_classifier_exploration_mapping(
        classifier.exp_id, classifier.exp_version_when_created,
        classifier.state_name, classifier_id)

    return classifier_id


def delete_classifier(classifier_id):
    """Deletes classifier data model in the datastore given classifier_id.

    Args:
        classifier_id: str. ID of the classifier.
    """
    classifier_data_model = classifier_models.ClassifierDataModel.get(
        classifier_id)
    classifier_data_model.delete()


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
        classifier_training_job_model.state_name,
        classifier_training_job_model.status,
        classifier_training_job_model.training_data)

def get_classifier_training_job_by_id(job_id):
    """Gets a classifier training job by a job_id.

    Args:
        job_id: str. ID of the classifier training job.

    Returns:
        classifier_training_job: ClassifierTrainingJob. Domain object for the
            classifier training job.

    Raises:
        Exception: Entity for class ClassifierTrainingJobModel with id not
            found.
    """
    classifier_training_job_model = (
        classifier_models.ClassifierTrainingJobModel.get(job_id))
    classifier_training_job = get_classifier_training_job_from_model(
        classifier_training_job_model)
    return classifier_training_job


def create_classifier_training_job(algorithm_id, interaction_id, exp_id,
                                   exp_version, state_name, training_data,
                                   status):
    """Creates a ClassifierTrainingJobModel in data store.

    Args:
        algorithm_id: str. ID of the algorithm used to generate the model.
        interaction_id: str. ID of the interaction to which the algorithm
            belongs.
        exp_id: str. ID of the exploration.
        exp_version: int. The exploration version at the time
            this training job was created.
        state_name: str. The name of the state to which the classifier
            belongs.
        training_data: dict. The data used in training phase.
        status: str. The status of the training job (NEW by default).

    Returns:
        job_id: str. ID of the classifier training job.
    """
    dummy_classifier_training_job = classifier_domain.ClassifierTrainingJob(
        'job_id_dummy', algorithm_id, interaction_id, exp_id, exp_version,
        state_name, status, training_data)
    dummy_classifier_training_job.validate()
    job_id = classifier_models.ClassifierTrainingJobModel.create(
        algorithm_id, interaction_id, exp_id, exp_version, training_data,
        state_name, status)
    return job_id


def _update_classifier_training_job_status(job_id, status):
    """Checks for the existence of the model and then updates it.

    Args:
        job_id: str. ID of the ClassifierTrainingJob domain object.
        status: str. The status to which the job needs to be updated.

    Raises:
        Exception. The ClassifierTrainingJobModel corresponding to the job_id
            of the ClassifierTrainingJob does not exist.
    """
    classifier_training_job_model = (
        classifier_models.ClassifierTrainingJobModel.get(job_id, strict=False))
    if not classifier_training_job_model:
        raise Exception(
            'The ClassifierTrainingJobModel corresponding to the job_id of the'
            'ClassifierTrainingJob does not exist.')

    initial_status = classifier_training_job_model.status
    if status not in feconf.ALLOWED_TRAINING_JOB_STATUS_CHANGES[initial_status]:
        raise Exception(
            'The status change %s to %s is not valid.' % (initial_status,
                                                          status))

    classifier_training_job = get_classifier_training_job_by_id(job_id)
    classifier_training_job.update_status(status)
    classifier_training_job.validate()

    classifier_training_job_model.status = status
    classifier_training_job_model.put()

def mark_training_job_complete(job_id):
    """Updates the training job's status to complete.

    Args:
        job_id: str. ID of the ClassifierTrainingJob.
    """
    _update_classifier_training_job_status(job_id,
                                           feconf.TRAINING_JOB_STATUS_COMPLETE)


def delete_classifier_training_job(job_id):
    """Deletes classifier training job model in the datastore given job_id.

    Args:
        job_id: str. ID of the classifier training job.
    """
    classifier_training_job_model = (
        classifier_models.ClassifierTrainingJobModel.get(job_id))
    if classifier_training_job_model is not None:
        classifier_training_job_model.delete()


def get_classifier_from_exploration_attributes(exp_id, exp_version,
                                               state_name):
    """Gets the classifier object from the exploration attributes.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. The exploration version.
        state_name: str. The name of the state to which the classifier
            belongs.

    Returns:
        ClassifierData. Domain object for the Classifier model.

    Raises:
        Exception: Entity for class ClassifierExplorationMapping with id not
            found.
        Exception: Entity for class ClassifierData with id not found.
    """
    classifier_exploration_mapping_model = (
        classifier_models.ClassifierExplorationMappingModel.get_model(
            exp_id, exp_version, state_name))
    classifier_id = classifier_exploration_mapping_model.classifier_id
    classifier = get_classifier_by_id(classifier_id)
    return classifier


def create_classifier_exploration_mapping(exp_id, exp_version, state_name,
                                          classifier_id):
    """Creates an entry for Classifier Exploration Mapping in datastore.

    Args:
        exp_id: str. ID of the exploration.
        exp_version: int. The exploration version.
        state_name: str. The state to which the classifier belongs.
        classifier_id: str. ID of the classifier.

    Returns:
        str. ID of the classifier exploration mapping instance.

    Raises:
        Exception: The Classifier-Exploration mapping with id already exists.
    """
    classifier_exploration_mapping_model = (
        classifier_models.ClassifierExplorationMappingModel.get_model(
            exp_id, exp_version, state_name))
    if classifier_exploration_mapping_model is not None:
        raise Exception('The Classifier-Exploration mapping with id %s.%s.%s '
                        'already exists.' % (exp_id, exp_version,
                                             state_name.encode('utf-8')))
    # Verify that the corresponding classifier exists.
    get_classifier_by_id(classifier_id)

    classifier_exploration_mapping = (
        classifier_domain.ClassifierExplorationMapping(
            exp_id, exp_version, state_name, classifier_id))
    classifier_exploration_mapping.validate()
    mapping_id = classifier_models.ClassifierExplorationMappingModel.create(
        exp_id, exp_version, state_name, classifier_id)
    return mapping_id
