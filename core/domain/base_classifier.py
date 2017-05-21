# coding: utf-8
#
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

"""Base class for classification algorithms"""

import abc


class BaseClassifier(object):
    """A base class for classifiers that uses supervised learning to match
    free-form text answers to answer groups. The classifier trains on answers
    that exploration editors have assigned to an answer group. Given a new
    answer, it predicts the answer group.

    Below are some concepts used in this class.
    training_data: list of 'training_data'. Each training_data is represented
        by a 2-element list. The first item of the list is the single training
        data, and the second item is a list of labels that the data should
        be matched.
    predicting_data: list of 'predicting_data'. Each element of the list
        represents a single 'predicting_data'.
    label - An answer group that the training sample should correspond to. If a
        sample is being added to train a model, labels are provided. If a
        sample is being added for prediction purposes, no labels are provided.
        If a sample does not match any label, the sample should have only one
        label, '_default'.

    Attributes:
        DEFAULT_LABEL: str. The label used to characterize a word with no label
            assigned to it.
    """

    __metaclass__ = abc.ABCMeta

    def __init__(self):
        pass

    @abc.abstractmethod
    def from_dict(self, model):
        """Initializes the properties of this classifier from a dict
          constructed using to_dict().

          Args:
              model: A dict representing the classifier.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def to_dict(self, model):
        """Returns a dict representing this classifier.

        Returns:
            dict. A representation of the state of the classifier.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def predict(self, predicting_data):
        """Returns the predicted label from the predicting_data's prediction
        report.

        Args:
            predicting_data: list of 'predicting_data'.

        Returns:
            list of str. The labels predicted by the classifier
            for the given 'predicting_data'.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def train(self, training_data):
        """Loads examples for training.

        Args:
            training_data: list of 'training_data'. Each training_data is
                represented by a 2-element list. The first item of the list
                is the single training data, and the second item is a list
                of labels that the data should be matched.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def validate(self, classifier_data):
        """Validates classifier data.

        Args:
            classifier_data: dict of the classifier attributes specific to
            the classifier algorithm used.
        """
        raise NotImplementedError
