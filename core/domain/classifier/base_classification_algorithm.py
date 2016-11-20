# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Base class of classification algorithms for free-form text answers"""

from abc import abstractmethod
import copy


class BaseClassificationAlgorithm(object):
    """A base class for classifiers that uses supervised learning to match
    free-form text answers to answer groups. The classifier trains on answers
    that exploration editors have assigned to an answer group. Given a new
    answer, it predicts the answer group.

    Below is an example workflow for running a batch job that builds a new
    classifier and outputs it to a dictionary.

        # Examples are formatted as a list. Each element is a doc followed by a
        # list of labels.
        examples = [
            ['i eat fish and vegetables', ['food']],
            ['fish are pets', ['pets']],
            ['my kitten eats fish', ['food', 'pets']]
        ]
        string_classifier = XXXClassifier()
        string_classifier.load_examples(examples)
        classifier_dict = string_classifier.to_dict()
        save_to_data_store(classifier_dict)

    Below is an example workflow for using an existing classifier to predict a
    document's label.

        # A list of docs to classify.
        prediction_docs = [
            'i only eat fish and vegetables'
        ]
        classifier_dict = load_from_data_store()
        string_classifier = XXXClassifier()
        string_classifier.from_dict(classifier_dict)
        label = string_classifier.predict(prediction_docs)
        print label

    Below are some concepts used in this class.
    doc - A student free form response, represented as a string of arbitrary
        non-whitespace characters (a "word") separated by single spaces.
    word - A string of arbitrary non-whitespace characters.
    word id - A unique word. Each unique word has one word id that is used
        to represent the word in the classifier model.
    word instance - An instance of a word id. Each word id can have multiple
        instances corresponding to its occurrences in all docs.
    label - An answer group that the doc should correspond to. If a doc is
        being added to train a model, labels are provided. If a doc is being
        added for prediction purposes, no labels are provided. If a doc does
        not match any label, the doc should have only one label, '_default'.
    label bit vector - A bit vector corresponding to a doc, indexed by label
        id. A one in the vector means the label id matches some word instance
        in the doc; a zero in the vector means the label id does not match any
        word instance in the doc.
    example - A doc with a list of labels it should be matched to.

    It is possible for a word instance in a doc to not have an explicit label
    assigned to it. This is characterized by assigning DEFAULT_LABEL to the
    word instance.

    Attributes:
        DEFAULT_LABEL: str. The label used to characterize a word with no label
            assigned to it.
    """

    # Classifiers built with less than _DEFAULT_MIN_DOCS_TO_PREDICT will
    # likely not be useful for predicting as there are not enough examples to
    # build a generalized model. The value 20 was chosen as a balance between a
    # reasonable number of data to learn from and a low entry barrier to using
    # the classifier.
    _DEFAULT_MIN_DOCS_TO_PREDICT = 20

    DEFAULT_LABEL = '_default'

    def __init__(self):
        self.examples = []

    @abstractmethod
    def from_dict(self, model):
        """Initializes the properties of this classifier from a dict
          constructed using to_dict().

          Args:
              model: A dict representing the classifier.
        """
        pass

    @abstractmethod
    def to_dict(self, model):
        """Returns a dict representing this classifier.

        Returns:
            dict. A representation of the state of the classifier.
        """
        pass

    @abstractmethod
    def predict(self, docs):
        """Returns the predicted label from the docs' prediction report.

        Args:
            docs: list of str. A list of docs.

                docs = [
                    'i only eat fish and vegetables'
                ].

        Returns:
            list of str. The labels predicted by the classifier
            for the given docs.
        """
        pass


    @abstractmethod
    def _train(self):
        pass

    def load_examples(self, examples):
        """Loads examples for training.

        Args:
            examples: list of 'examples'. Each example is represented
                by a 2-element list. The first item of the list is a str
                representing a doc, and the second item is a list of labels
                that the doc should be matched to. E.g.:

                training_examples = [
                    ['i eat fish and vegetables', ['food']],
                    ['fish are pets', ['pets']],
                    ['my kitten eats fish', ['food', 'pets']]
                ]
        """
        self.examples = copy.deepcopy(examples)
        self._train()
