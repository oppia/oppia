import pytest


# RHEL 7 ships pytest 2.7 which doesn't have the 'bool' type to addini. This
# broke pytest for EPEL: https://bugzilla.redhat.com/show_bug.cgi?id=1605138
# If it's older than 2.9 we handle bool conversion ourselves. Remove this when
# we can rely on a newer pytest.
#
# Version 3 is also where the @yield_fixture decorator was deprecated and you
# can now just use @fixture, so we handle both of those cases as well.

try:
    _pytest_version = tuple([
        int(x) for x in pytest.__version__.split('.')[:2]
    ])
    _pytest29 = _pytest_version >= (2, 9)
    _pytest30 = _pytest_version >= (3, 0)
except Exception:
    _pytest29 = False
    _pytest30 = False


if not _pytest29:
    _case_type = None
    _case_default = 'false'

    # Copied from pytest 2.9.0 where bool was introduced. It's what happens
    # internally if we specify a bool type argument.
    def _strtobool(val):
        """Convert a string representation of truth to true (1) or false (0).

        True values are 'y', 'yes', 't', 'true', 'on', and '1'; false values
        are 'n', 'no', 'f', 'false', 'off', and '0'.  Raises ValueError if
        'val' is anything else.

        .. note:: copied from distutils.util
        """
        val = val.lower()
        if val in ('y', 'yes', 't', 'true', 'on', '1'):
            return 1
        elif val in ('n', 'no', 'f', 'false', 'off', '0'):
            return 0
        else:
            raise ValueError("invalid truth value %r" % (val,))

    def _bool_value(value):
        return bool(_strtobool(value.strip()))

else:
    _case_type = 'bool'
    _case_default = False

    def _bool_value(value):
        return value


if _pytest30:
    _fixture_type = pytest.fixture
else:
    _fixture_type = pytest.yield_fixture


def pytest_addoption(parser):
    parser.addini('requests_mock_case_sensitive',
                  'Use case sensitive matching in requests_mock',
                  type=_case_type,
                  default=_case_default)


@_fixture_type(scope='function')  # executed on every test
def requests_mock(request):
    """Mock out the requests component of your code with defined responses.

    Mocks out any requests made through the python requests library with useful
    responses for unit testing. See:
    https://requests-mock.readthedocs.io/en/latest/
    """
    # pytest plugins get loaded immediately. If we import requests_mock it
    # imports requests and then SSL which prevents gevent patching. Late load.
    import requests_mock as rm_module

    case_sensitive = request.config.getini('requests_mock_case_sensitive')
    kw = {'case_sensitive': _bool_value(case_sensitive)}

    with rm_module.Mocker(**kw) as m:
        yield m
