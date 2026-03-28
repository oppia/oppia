import sys

try:
    if sys.version_info < (3, 8):
        import importlib_metadata as metadata
    else:
        from importlib import metadata
except (ImportError, OSError):
    metadata = None


def _get_version():
    default_version = '0.0.0-alpha'
    try:
        version = metadata.version('jsonpickle')
    except (AttributeError, ImportError, OSError):
        version = default_version
    return version


__version__ = _get_version()
