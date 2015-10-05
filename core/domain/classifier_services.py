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

import copy
import operator

import numpy


class StringClassifier(object):
    """Handles math-y internals for classifying strings.
    https://en.wikipedia.org/wiki/Latent_Dirichlet_allocation"""

    # Learning rates
    _DEFAULT_ALPHA = 0.1
    _DEFAULT_BETA = 0.001

    # Default label
    # Captures parts of docs that don't help with prediction
    _DEFAULT_LABEL = '_default'

    def __init__(self):
        """
        Hieroglyph decoder:
        b - boolean
        c - count
        p - position
        l - label (id)
        w - word (id)
        d - doc (id)

        Internal (private) model representation:
        _w_dp - word given doc and count
            (list of word ids which represent a doc)
        _b_dl - boolean given doc and label
            (boolean of whether a doc has a label)
        _l_dp - label given doc and count
            (assigned label of each word instance in a doc)
        _c_dl - count given doc and label
            (count of each label per doc)
        _c_lw - count given label and word
            (count of labels per word)
        _c_l - count given label
            (count of each label type)
        """
        # Ensure that results are deterministic
        # There is nothing special about the value 4
        numpy.random.seed(seed=4)

        self._alpha = self._DEFAULT_ALPHA
        self._beta = self._DEFAULT_BETA

    def _get_word_id(self, word):
        """Returns a word's id if it exists, otherwise assigns
        a new id to the word and returns it."""
        if word not in self._word_to_id:
            self._word_to_id[word] = self._word_count
            self._word_count += 1
        return self._word_to_id[word]

    def _get_label_id(self, label):
        """Returns a label's id if it exists, otherwise assigns
        a new id to the label and returns it."""
        if label not in self._label_to_id:
            self._label_to_id[label] = self._label_count
            self._label_count += 1
        return self._label_to_id[label]

    def _get_record(self, doc_id):
        """Given a doc id, return the doc and labels."""
        return self._w_dp[doc_id], self._b_dl[doc_id]

    def _get_label_vector(self, labels):
        """Returns a vector specifying which labels
        are specified in the training set."""
        # When we see an empty label list, predicting on all labels
        # is assumed (versus having to pass all the labels each prediction)
        if len(labels) == 0:
            return numpy.ones(self._label_count)
        label_vector = numpy.zeros(self._label_count)
        for label in labels:
            label_vector[self._get_label_id(label)] = 1
        # Always set default label
        label_vector[self._label_to_id[self._DEFAULT_LABEL]] = 1
        return label_vector

    def _update_counting_matrices(self, d, w, l, inc=True):
        """Update counting matrices given doc/word/label indices.
        Either increments or decrements."""
        val = 1 if inc else -1
        self._c_dl[d, l] += val
        self._c_lw[l, w] += val
        self._c_l[l] += val

    def _get_doc_ids(self, doc_ids):
        if doc_ids is None:
            doc_ids = xrange(self._doc_count)
        return doc_ids

    def _init_docs(self, doc_ids=None):
        """Initialize data for given docs (defaults to all)."""
        doc_ids = self._get_doc_ids(doc_ids)

        for d in doc_ids:
            doc, labels = self._get_record(d)
            l_c = [
                numpy.random.multinomial(1, labels / labels.sum()).argmax()
                for i in xrange(len(doc))
            ]
            self._l_dp.append(l_c)
            for w, l in zip(doc, l_c):
                self._update_counting_matrices(d, w, l)

    def _infer_docs(self, doc_ids):
        """Runs iterative inference on given docs."""
        doc_ids = self._get_doc_ids(doc_ids)

        statez = {
            'updates': 0,
            'computes': 0
        }

        for d in doc_ids:
            doc, labels = self._get_record(d)
            for c, w in enumerate(doc):
                l = self._l_dp[d][c]

                self._update_counting_matrices(d, w, l, False)

                # Gibbs update of labels
                coeff_a = 1.0 / (
                    self._c_dl[d].sum() + self._label_count * self._alpha)
                coeff_b = 1.0 / (
                    self._c_lw.sum(axis=1) + self._word_count * self._beta)
                prob_l = (
                    labels *
                    coeff_a * (self._c_dl[d] + self._alpha) *
                    coeff_b * (self._c_lw[:, w] + self._beta))
                new_l = numpy.random.multinomial(
                    1, prob_l / prob_l.sum()).argmax()

                statez['computes'] += 1
                if l != new_l:
                    statez['updates'] += 1

                self._l_dp[d][c] = new_l
                self._update_counting_matrices(d, w, new_l)

        return statez

    def _get_probability(self, d):
        """Returns the probability of a doc having a label."""
        probs_i = self._c_dl[d] + (self._b_dl[d] * self._alpha)
        probs_i = probs_i / probs_i.sum(axis=0)[numpy.newaxis]
        return probs_i

    def _get_probability_with_label(self, d):
        """Returns a dict that maps human-readable labels to the probability
        that the doc has the label."""
        probs_i = self._get_probability(d)
        probs_l = {}
        for label, l in self._label_to_id.iteritems():
            probs_l[label] = probs_i[l]
        return probs_l

    def _predict(self, d, threshold=0.5):
        """Calculates prediction data for a doc.
        Returns a tuple of (predicted label, prediction score)."""
        probs_l = self._get_probability_with_label(d)
        default_prob = probs_l[self._DEFAULT_LABEL]
        default_prob_comp = 1.0 - default_prob
        for label in sorted(probs_l, key=probs_l.get, reverse=True):
            prob_l = probs_l[label]
            if (label != self._DEFAULT_LABEL and
                    prob_l / default_prob_comp > threshold):
                return label, prob_l / default_prob_comp
        return self._DEFAULT_LABEL, default_prob / default_prob_comp

    def _validate_label(self, label):
        """Checks that labels don't begin with underscore."""
        if label[0] == '_':
            raise Exception('Label %s cannot begin with underscore.' % label)

    def _parse_examples(self, examples):
        """Splits examples into docs (split on spaces) and labels.
        Example format:
        [
            ['doc1', ['label1']],
            ['doc2', ['label2']],
            etc
        ]
        """
        docs = []
        labels = []
        for example in examples:
            doc = example[0].split()
            if len(doc) > 0:
                docs.append(doc)
                map(self._validate_label, example[1])
                labels.append(example[1])
        return docs, labels

    def _train_docs(self, iterations, doc_ids=None):
        """Trains given docs (default all) for a number of iterations."""
        doc_ids = self._get_doc_ids(doc_ids)

        for i in xrange(iterations):
            statez = self._infer_docs(doc_ids)

    def load_examples(self, examples, iterations=25):
        """Sets new examples. Overwrites existing ones."""
        docs, labels_list = self._parse_examples(examples)

        label_set = set(
            [self._DEFAULT_LABEL] +
            [label for labels in labels_list for label in labels])

        self._label_count = len(label_set)
        self._label_to_id = dict(zip(label_set, xrange(self._label_count)))

        self._word_count = 0
        self._word_to_id = {}

        self._doc_count = len(docs)

        self._b_dl = numpy.array(
            map(self._get_label_vector, labels_list), dtype=int)
        self._w_dp = [map(self._get_word_id, doc) for doc in docs]
        self._l_dp = []
        self._c_dl = numpy.zeros(
            (self._doc_count, self._label_count), dtype=int)
        self._c_lw = numpy.zeros(
            (self._label_count, self._word_count), dtype=int)
        self._c_l = numpy.zeros(self._label_count, dtype=int)

        self._init_docs()
        self._train_docs(iterations)

    def add_examples(self, examples, iterations=25):
        """Adds examples. Old examples are preserved.
        Recommend 5 iterations when adding for predicting purposes.
        Returns the doc ids of examples added, in the same order."""
        docs, labels_list = self._parse_examples(examples)

        last_label_count = self._label_count
        last_doc_count = self._doc_count
        last_word_count = self._word_count

        # Increments _label_count with any new labels
        [map(self._get_label_id, labels) for labels in labels_list]
        self._doc_count += len(docs)

        if len(examples) > 0:
            self._b_dl = numpy.concatenate(
                (self._b_dl, numpy.zeros(
                    (last_doc_count, self._label_count - last_label_count),
                    dtype=int)), axis=1)
            self._b_dl = numpy.concatenate(
                (self._b_dl, [
                    self._get_label_vector(labels) for labels in labels_list
                ]), axis=0)
            self._w_dp.extend([map(self._get_word_id, doc) for doc in docs])
            self._c_dl = numpy.concatenate(
                (self._c_dl, numpy.zeros(
                    (last_doc_count, self._label_count - last_label_count),
                    dtype=int)), axis=1)
            self._c_dl = numpy.concatenate(
                (self._c_dl, numpy.zeros(
                    (self._doc_count - last_doc_count, self._label_count),
                    dtype=int)), axis=0)
            self._c_lw = numpy.concatenate(
                (self._c_lw, numpy.zeros(
                    (last_label_count, self._word_count - last_word_count),
                    dtype=int)), axis=1)
            self._c_lw = numpy.concatenate(
                (self._c_lw, numpy.zeros(
                    (self._label_count - last_label_count, self._word_count),
                    dtype=int)), axis=0)
            self._c_l = numpy.concatenate(
                (self._c_l, numpy.zeros(
                    self._label_count - last_label_count, dtype=int)))

        for d in xrange(last_doc_count, self._doc_count):
            self._init_docs([d])
            self._train_docs(iterations, [d])

        return xrange(last_doc_count, self._doc_count)

    def predict_label(self, d, threshold=0.5):
        """Calculates predicted label for a doc."""
        return self._predict(d, threshold)[0]

    def to_dict(self):
        """Converts a classifier into a dict model."""
        model = {}
        model['_alpha'] = copy.deepcopy(self._alpha)
        model['_beta'] = copy.deepcopy(self._beta)
        model['_label_count'] = copy.deepcopy(self._label_count)
        model['_doc_count'] = copy.deepcopy(self._doc_count)
        model['_word_count'] = copy.deepcopy(self._word_count)
        model['_label_to_id'] = copy.deepcopy(self._label_to_id)
        model['_word_to_id'] = copy.deepcopy(self._word_to_id)
        model['_w_dp'] = copy.deepcopy(self._w_dp)
        model['_b_dl'] = copy.deepcopy(self._b_dl)
        model['_l_dp'] = copy.deepcopy(self._l_dp)
        model['_c_dl'] = copy.deepcopy(self._c_dl)
        model['_c_lw'] = copy.deepcopy(self._c_lw)
        model['_c_l'] = copy.deepcopy(self._c_l)
        return model

    def from_dict(self, model):
        """Converts a dict model into a classifier."""
        self._alpha = copy.deepcopy(model['_alpha'])
        self._beta = copy.deepcopy(model['_beta'])
        self._label_count = copy.deepcopy(model['_label_count'])
        self._doc_count = copy.deepcopy(model['_doc_count'])
        self._word_count = copy.deepcopy(model['_word_count'])
        self._label_to_id = copy.deepcopy(model['_label_to_id'])
        self._word_to_id = copy.deepcopy(model['_word_to_id'])
        self._w_dp = copy.deepcopy(model['_w_dp'])
        self._b_dl = copy.deepcopy(model['_b_dl'])
        self._l_dp = copy.deepcopy(model['_l_dp'])
        self._c_dl = copy.deepcopy(model['_c_dl'])
        self._c_lw = copy.deepcopy(model['_c_lw'])
        self._c_l = copy.deepcopy(model['_c_l'])
