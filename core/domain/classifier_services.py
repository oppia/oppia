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

"""Services for classifier models"""

from core.domain import classifier_registry
from core.domain import exp_domain
from core.domain import interaction_registry

import feconf

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

    sc = classifier_registry.ClassifierRegistry.get_classifier_by_id(
        feconf.INTERACTION_CLASSIFIER_MAPPING['TextInput'])

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
                if rule_spec.rule_type == exp_domain.CLASSIFIER_RULESPEC_STR:
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
