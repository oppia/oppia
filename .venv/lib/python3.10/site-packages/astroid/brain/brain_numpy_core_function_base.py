# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/pylint-dev/astroid/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/astroid/blob/main/CONTRIBUTORS.txt

"""Astroid hooks for numpy.core.function_base module."""

import functools

from astroid import nodes
from astroid.brain.brain_numpy_utils import (
    attribute_name_looks_like_numpy_member,
    infer_numpy_attribute,
)
from astroid.inference_tip import inference_tip
from astroid.manager import AstroidManager

METHODS_TO_BE_INFERRED = {
    "linspace": """def linspace(start, stop, num=50, endpoint=True, retstep=False, dtype=None, axis=0):
            return numpy.ndarray([0, 0])""",
    "logspace": """def logspace(start, stop, num=50, endpoint=True, base=10.0, dtype=None, axis=0):
            return numpy.ndarray([0, 0])""",
    "geomspace": """def geomspace(start, stop, num=50, endpoint=True, dtype=None, axis=0):
            return numpy.ndarray([0, 0])""",
}


def register(manager: AstroidManager) -> None:
    manager.register_transform(
        nodes.Attribute,
        inference_tip(functools.partial(infer_numpy_attribute, METHODS_TO_BE_INFERRED)),
        functools.partial(
            attribute_name_looks_like_numpy_member,
            frozenset(METHODS_TO_BE_INFERRED.keys()),
        ),
    )
