# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/pylint-dev/astroid/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/astroid/blob/main/CONTRIBUTORS.txt

"""Astroid hooks for the UUID module."""
from astroid import nodes
from astroid.manager import AstroidManager


def _patch_uuid_class(node: nodes.ClassDef) -> None:
    # The .int member is patched using __dict__
    node.locals["int"] = [nodes.Const(0, parent=node)]


def register(manager: AstroidManager) -> None:
    manager.register_transform(
        nodes.ClassDef, _patch_uuid_class, lambda node: node.qname() == "uuid.UUID"
    )
