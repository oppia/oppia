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


def _create_classifier(classifier):
    """Creates classifier data model in the datastore given a classifier
       domain object.

    Args:
        classifier: Domain object for the classifier.

    Returns:
        classifier_id: str. ID of the classifier.
    """
    classifier_id = classifier_models.ClassifierDataModel.create(
        classifier.id, classifier.exp_id,
        classifier.exp_version_when_created,
        classifier.state_name, classifier.algorithm_id,
        classifier.classifier_data, classifier.data_schema_version)
    return classifier_id


def _update_classifier(classifier_data_model, state_name):
    """Updates classifier data model in the datastore given a classifier
    domain object.

    Args:
        classifier_data_model: Classifier data model instance in datastore.
        state_name: The name of the state.

    Note: All of the properties of a classifier are immutable,
    except for state_name.
    """
    classifier_data_model.state_name = state_name
    classifier_data_model.put()


def save_classifier(classifier):
    """Checks for the existence of the model.
    If the model exists, it is updated using _update_classifier method.
    If the model doesn't exist, it is created using _create_classifier method.

    Args:
        classifier: Domain object for the classifier.

    Returns:
        classifier_id: str. ID of the classifier.
    """
    classifier_id = classifier.id
    classifier_data_model = classifier_models.ClassifierDataModel.get(
        classifier_id, False)
    classifier.validate()
    if classifier_data_model is None:
        classifier_id = _create_classifier(classifier)
    else:
        _update_classifier(classifier_data_model, classifier.state_name)
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


def _create_classifier_training_job(classifier_training_job):
    """Creates classifier training job model in the datastore given a
    classifier training job domain object.

    Args:
        classifier_training_job: ClassifierTrainingJob. Domain object for the
            classifier training job.

    Returns:
        job_id: str. ID of the classifier training job.
    """
    job_id = classifier_models.ClassifierTrainingJobModel.create(
        classifier_training_job.algorithm_id, classifier_training_job.exp_id,
        classifier_training_job.exp_version,
        classifier_training_job.training_data,
        classifier_training_job.state_name)
    return job_id


def _update_classifier_training_job(classifier_training_job_model, status):
    """Updates classifier training job model in the datastore given a
    classifier training job domain object.

    Args:
        classifier_training_job_model: ClassifierTrainingJobModel. Classifier
            training job model instance in datastore.
        status: The status of the job.

    Note: All of the properties of a classifier training job are immutable,
        except for status.
    """
    classifier_training_job_model.status = status
    classifier_training_job_model.put()


def save_classifier_training_job(algorithm_id, exp_id, exp_version,
                                 state_name, status, training_data,
                                 job_id="None"):
    """Checks for the existence of the model.
    If the model exists, it is updated using _update_classifier_training_job
        method.
    If the model doesn't exist, it is created using
        _create_classifier_training_job method.

    Args:
        algorithm_id: str. ID of the algorithm used to generate the model.
        exp_id: str. ID of the exploration.
        exp_version: int. The exploration version at the time
            this training job was created.
        state_name: str. The name of the state to which the classifier
            belongs.
        status: str. The status of the training job (NEW by default).
        training_data: dict. The data used in training phase.
        job_id: str. The optional job_id which decides to create/update
            classifier.

    Returns:
        job_id: str. ID of the classifier training job.
    """
    classifier_training_job_model = (
        classifier_models.ClassifierTrainingJobModel.get(job_id, False))
    if classifier_training_job_model is None:
        classifier_training_job = classifier_domain.ClassifierTrainingJob(
            'job_id_dummy', algorithm_id, exp_id, exp_version,
            state_name, status, training_data)
        classifier_training_job.validate()
        job_id = _create_classifier_training_job(classifier_training_job)
    else:
        classifier_training_job = get_classifier_training_job_from_model(
            classifier_training_job_model)
        classifier_training_job.validate()
        _update_classifier_training_job(classifier_training_job_model,
                                        status)
    return job_id


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
