# SPDX-FileCopyrightText: 2023-present Antoine Pitrou <antoine@python.org>
#
# SPDX-License-Identifier: Apache-2.0


_ERROR_MSG = """\
Disallowed deserialization of 'arrow.py_extension_type':
storage_type = {storage_type}
serialized = {serialized}
pickle disassembly:\n{pickle_disassembly}

Reading of untrusted Parquet or Feather files with a PyExtensionType column
allows arbitrary code execution.
If you trust this file, you can enable reading the extension type by one of:

- upgrading to pyarrow >= 14.0.1, and call `pa.PyExtensionType.set_auto_load(True)`
- disable this error by running `import pyarrow_hotfix; pyarrow_hotfix.uninstall()`

We strongly recommend updating your Parquet/Feather files to use extension types
derived from `pyarrow.ExtensionType` instead, and register this type explicitly.
See https://arrow.apache.org/docs/dev/python/extending_types.html#defining-extension-types-user-defined-types
for more details.
"""

try:
    _import_error = ModuleNotFoundError
except NameError:
    _import_error = ImportError  # ModuleNotFoundError unavailable in py3.5


def install():
    import atexit
    try:
        import pyarrow as pa
    except _import_error:
        # Not installed; nothing to do here.
        return

    if not hasattr(pa, "ExtensionType"):
        # Unsupported PyArrow version?
        return

    if getattr(pa, "_hotfix_installed", False):
        return

    class ForbiddenExtensionType(pa.ExtensionType):
        def __arrow_ext_serialize__(self):
            return b""

        @classmethod
        def __arrow_ext_deserialize__(cls, storage_type, serialized):
            import io
            import pickletools
            out = io.StringIO()
            pickletools.dis(serialized, out)
            raise RuntimeError(
                _ERROR_MSG.format(
                    storage_type=storage_type,
                    serialized=serialized,
                    pickle_disassembly=out.getvalue(),
                )
            )

    if hasattr(pa, "unregister_extension_type"):
        if not hasattr(pa, "PyExtensionType"):
            # 21.0.0 <= PyArrow
            return
        else:
            # 0.15.0 <= PyArrow < 21.0.0
            pa.unregister_extension_type("arrow.py_extension_type")
            pa.register_extension_type(ForbiddenExtensionType(pa.null(),
                                                          "arrow.py_extension_type"))
    elif hasattr(pa.lib, "_unregister_py_extension_type"):
        # 0.14.1 <= PyArrow < 0.15.0
        pa.lib._unregister_py_extension_type()
        atexit.unregister(pa.lib._unregister_py_extension_type)
    else:
        # PyArrow 0.14.0
        del pa.lib._extension_types_initializer

    pa._hotfix_installed = True


def uninstall():
    import atexit
    try:
        import pyarrow as pa
    except _import_error:
        # Not installed; nothing to do here.
        return

    if not hasattr(pa, "ExtensionType"):
        # Unsupported PyArrow version?
        return

    if not getattr(pa, "_hotfix_installed", False):
        return

    if hasattr(pa, "unregister_extension_type"):
        if not hasattr(pa, "PyExtensionType"):
            # 21.0.0 <= PyArrow
            return
        else:
            # 0.15.0 <= PyArrow < 21.0.0
            pa.unregister_extension_type("arrow.py_extension_type")
            pa.lib._register_py_extension_type()
    elif hasattr(pa.lib, "_register_py_extension_type"):
        # 0.14.1 <= PyArrow < 0.15.0
        pa.lib._register_py_extension_type()
        atexit.register(pa.lib._unregister_py_extension_type)
    elif hasattr(pa.lib, "_ExtensionTypesInitializer"):
        # PyArrow 0.14.0
        pa.lib._extension_types_initializer = pa.lib._ExtensionTypesInitializer()

    pa._hotfix_installed = False


install()
