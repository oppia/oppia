from warnings import warn

ERROR = """\
The 'wheel.bdist_wheel' module has been removed.
Please update your setuptools to v70.1 or later.
If you're explicitly importing 'wheel.bdist_wheel', please update your import to point \
to 'setuptools.command.bdist_wheel' instead.
"""

try:
    from setuptools.command.bdist_wheel import bdist_wheel as bdist_wheel
except ModuleNotFoundError as exc:
    raise ImportError(ERROR) from exc

warn(ERROR, DeprecationWarning, stacklevel=2)
