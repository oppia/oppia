# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/PyCQA/astroid/blob/master/COPYING.LESSER
"""
Astroid hook for the attrs library

Without this hook pylint reports unsupported-assignment-operation
for atrrs classes
"""

import astroid
from astroid import MANAGER


ATTR_IB = 'attr.ib'


def is_decorated_with_attrs(
        node, decorator_names=('attr.s', 'attr.attrs', 'attr.attributes')):
    """Return True if a decorated node has
    an attr decorator applied."""
    if not node.decorators:
        return False
    for decorator_attribute in node.decorators.nodes:
        if decorator_attribute.as_string() in decorator_names:
            return True
    return False


def attr_attributes_transform(node):
    """Given that the ClassNode has an attr decorator,
    rewrite class attributes as instance attributes
    """
    # Astroid can't infer this attribute properly
    # Prevents https://github.com/PyCQA/pylint/issues/1884
    node.locals["__attrs_attrs__"] = [astroid.Unknown(parent=node.body)]

    for cdefbodynode in node.body:
        if not isinstance(cdefbodynode, astroid.Assign):
            continue
        if isinstance(cdefbodynode.value, astroid.Call):
            if cdefbodynode.value.func.as_string() != ATTR_IB:
                continue
        else:
            continue
        for target in cdefbodynode.targets:

            rhs_node = astroid.Unknown(
                lineno=cdefbodynode.lineno,
                col_offset=cdefbodynode.col_offset,
                parent=cdefbodynode
            )
            node.locals[target.name] = [rhs_node]


MANAGER.register_transform(
    astroid.Class,
    attr_attributes_transform,
    is_decorated_with_attrs)
