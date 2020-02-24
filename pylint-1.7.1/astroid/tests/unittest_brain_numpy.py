#-*- encoding=utf-8 -*-
# Copyright (c) 2017 Guillaume Peillex <guillaume.peillex@gmail.com>

# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/PyCQA/astroid/blob/master/COPYING.LESSER
import unittest
import contextlib

try:
    import numpy # pylint: disable=unused-import
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

from astroid import builder
from astroid import nodes


class SubTestWrapper(unittest.TestCase):
    """
    A class for supporting all unittest version wether or not subTest is available
    """
    def subTest(self, msg=None, **params):
        try:
            # For python versions above 3.5 this should be ok
            return super(SubTestWrapper, self).subTest(msg, **params)
        except AttributeError:
            # For python versions below 3.5
            return subTestMock(msg)


@contextlib.contextmanager
def subTestMock(msg=None):
    """
    A mock for subTest which do nothing
    """
    yield msg


@unittest.skipUnless(HAS_NUMPY, "This test requires the numpy library.")
class NumpyBrainCoreUmathTest(SubTestWrapper):
    """
    Test of all members of numpy.core.umath module
    """
    no_arg_ufunc = ('geterrobj',)

    one_arg_ufunc_spec = ('seterrobj',)

    one_arg_ufunc = (
        'arccos', 'arccosh', 'arcsin', 'arcsinh', 'arctan', 'arctanh',
        'cbrt', 'conj', 'conjugate', 'cosh', 'deg2rad',
        'degrees', 'exp2', 'expm1', 'fabs', 'frexp', 'isfinite',
        'isinf', 'log', 'log1p', 'log2', 'logical_not', 'modf',
        'negative', 'rad2deg', 'radians', 'reciprocal', 'rint',
        'sign', 'signbit', 'spacing', 'square', 'tan', 'tanh',
        'trunc',)

    two_args_ufunc = (
        'bitwise_and', 'bitwise_or', 'bitwise_xor',
        'copysign', 'divide', 'equal', 'float_power',
        'floor_divide', 'fmax', 'fmin', 'fmod', 'greater',
        'hypot', 'ldexp', 'left_shift', 'less', 'logaddexp',
        'logaddexp2', 'logical_and', 'logical_or', 'logical_xor',
        'maximum', 'minimum', 'nextafter', 'not_equal', 'power',
        'remainder', 'right_shift', 'subtract', 'true_divide',)

    all_ufunc = no_arg_ufunc + one_arg_ufunc_spec + one_arg_ufunc + two_args_ufunc

    constants = ('e', 'euler_gamma')

    def _inferred_numpy_attribute(self, func_name):
        node = builder.extract_node("""
        import numpy.core.umath as tested_module
        func = tested_module.{:s}
        func""".format(func_name))
        return next(node.infer())

    def test_numpy_core_umath_constants(self):
        """
        Test that constants have Const type.
        """
        for const in self.constants:
            with self.subTest(const=const):
                inferred = self._inferred_numpy_attribute(const)
                self.assertIsInstance(inferred, nodes.Const)

    def test_numpy_core_umath_constants_values(self):
        """
        Test the values of the constants.
        """
        exact_values = {'e': 2.718281828459045,
                        'euler_gamma': 0.5772156649015329}
        for const in self.constants:
            with self.subTest(const=const):
                inferred = self._inferred_numpy_attribute(const)
                self.assertEqual(inferred.value, exact_values[const])

    def test_numpy_core_umath_functions(self):
        """
        Test that functions have FunctionDef type.
        """
        for func in self.all_ufunc:
            with self.subTest(func=func):
                inferred = self._inferred_numpy_attribute(func)
                self.assertIsInstance(inferred, nodes.FunctionDef)

    def test_numpy_core_umath_functions_no_arg(self):
        """
        Test that functions with no arguments have really no arguments.
        """
        for func in self.no_arg_ufunc:
            with self.subTest(func=func):
                inferred = self._inferred_numpy_attribute(func)
                self.assertFalse(inferred.argnames())

    def test_numpy_core_umath_functions_one_arg_spec(self):
        """
        Test the arguments names of functions.
        """
        exact_arg_names = ['errobj']
        for func in self.one_arg_ufunc_spec:
            with self.subTest(func=func):
                inferred = self._inferred_numpy_attribute(func)
                self.assertEqual(inferred.argnames(), exact_arg_names)

    def test_numpy_core_umath_functions_one_arg(self):
        """
        Test the arguments names of functions.
        """
        exact_arg_names = ['x', 'out', 'where', 'casting', 'order', 'dtype', 'subok']
        for func in self.one_arg_ufunc:
            with self.subTest(func=func):
                inferred = self._inferred_numpy_attribute(func)
                self.assertEqual(inferred.argnames(), exact_arg_names)

    def test_numpy_core_umath_functions_two_args(self):
        """
        Test the arguments names of functions.
        """
        exact_arg_names = ['x1', 'x2', 'out', 'where', 'casting', 'order', 'dtype', 'subok']
        for func in self.two_args_ufunc:
            with self.subTest(func=func):
                inferred = self._inferred_numpy_attribute(func)
                self.assertEqual(inferred.argnames(), exact_arg_names)

    def test_numpy_core_umath_functions_kwargs_default_values(self):
        """
        Test the default values for keyword arguments.
        """
        exact_kwargs_default_values = [None, True, 'same_kind', 'K', None, True]
        for func in self.one_arg_ufunc + self.two_args_ufunc:
            with self.subTest(func=func):
                inferred = self._inferred_numpy_attribute(func)
                default_args_values = [default.value for default in inferred.args.defaults]
                self.assertEqual(default_args_values, exact_kwargs_default_values)


@unittest.skipUnless(HAS_NUMPY, "This test requires the numpy library.")
class NumpyBrainRandomMtrandTest(SubTestWrapper):
    """
    Test of all the functions of numpy.random.mtrand module.
    """
    # Map between functions names and arguments names and default values
    all_mtrand = {
        'beta': (['a', 'b', 'size'], [None]),
        'binomial': (['n', 'p', 'size'], [None]),
        'bytes': (['length',], []),
        'chisquare': (['df', 'size'], [None]),
        'choice': (['a', 'size', 'replace', 'p'], [None, True, None]),
        'dirichlet': (['alpha', 'size'], [None]),
        'exponential': (['scale', 'size'], [1.0, None]),
        'f': (['dfnum', 'dfden', 'size'], [None]),
        'gamma': (['shape', 'scale', 'size'], [1.0, None]),
        'geometric': (['p', 'size'], [None]),
        'get_state': ([], []),
        'gumbel': (['loc', 'scale', 'size'], [0.0, 1.0, None]),
        'hypergeometric': (['ngood', 'nbad', 'nsample', 'size'], [None]),
        'laplace': (['loc', 'scale', 'size'], [0.0, 1.0, None]),
        'logistic': (['loc', 'scale', 'size'], [0.0, 1.0, None]),
        'lognormal': (['mean', 'sigma', 'size'], [0.0, 1.0, None]),
        'logseries': (['p', 'size'], [None]),
        'multinomial': (['n', 'pvals', 'size'], [None]),
        'multivariate_normal': (['mean', 'cov', 'size'], [None]),
        'negative_binomial': (['n', 'p', 'size'], [None]),
        'noncentral_chisquare': (['df', 'nonc', 'size'], [None]),
        'noncentral_f': (['dfnum', 'dfden', 'nonc', 'size'], [None]),
        'normal': (['loc', 'scale', 'size'], [0.0, 1.0, None]),
        'pareto': (['a', 'size'], [None]),
        'permutation': (['x'], []),
        'poisson': (['lam', 'size'], [1.0, None]),
        'power': (['a', 'size'], [None]),
        'rand': (['args'], []),
        'randint': (['low', 'high', 'size', 'dtype'], [None, None, 'l']),
        'randn': (['args'], []),
        'random_integers': (['low', 'high', 'size'], [None, None]),
        'random_sample': (['size'], [None]),
        'rayleigh': (['scale', 'size'], [1.0, None]),
        'seed': (['seed'], [None]),
        'set_state': (['state'], []),
        'shuffle': (['x'], []),
        'standard_cauchy': (['size'], [None]),
        'standard_exponential': (['size'], [None]),
        'standard_gamma': (['shape', 'size'], [None]),
        'standard_normal': (['size'], [None]),
        'standard_t': (['df', 'size'], [None]),
        'triangular': (['left', 'mode', 'right', 'size'], [None]),
        'uniform': (['low', 'high', 'size'], [0.0, 1.0, None]),
        'vonmises': (['mu', 'kappa', 'size'], [None]),
        'wald': (['mean', 'scale', 'size'], [None]),
        'weibull': (['a', 'size'], [None]),
        'zipf':  (['a', 'size'], [None])}

    def _inferred_numpy_attribute(self, func_name):
        node = builder.extract_node("""
        import numpy.random.mtrand as tested_module
        func = tested_module.{:s}
        func""".format(func_name))
        return next(node.infer())

    def test_numpy_random_mtrand_functions(self):
        """
        Test that all functions have FunctionDef type.
        """
        for func in self.all_mtrand:
            with self.subTest(func=func):
                inferred = self._inferred_numpy_attribute(func)
                self.assertIsInstance(inferred, nodes.FunctionDef)

    def test_numpy_random_mtrand_functions_signature(self):
        """
        Test the arguments names and default values.
        """
        for func, (exact_arg_names, exact_kwargs_default_values) in self.all_mtrand.items():
            with self.subTest(func=func):
                inferred = self._inferred_numpy_attribute(func)
                self.assertEqual(inferred.argnames(), exact_arg_names)
                default_args_values = [default.value for default in inferred.args.defaults]
                self.assertEqual(default_args_values, exact_kwargs_default_values)


@unittest.skipUnless(HAS_NUMPY, "This test requires the numpy library.")
class NumpyBrainCoreNumericTypesTest(SubTestWrapper):
    """
    Test of all the missing types defined in numerictypes module.
    """
    all_types = ['uint16', 'uint32', 'uint64', 'int128', 'uint128',
                 'float16', 'float32', 'float64', 'float80', 'float96',
                 'float128', 'float256', 'complex32', 'complex64', 'complex128',
                 'complex160', 'complex192', 'complex256', 'complex512',
                 'timedelta64', 'datetime64', 'unicode_', 'string_', 'object_']

    def _inferred_numpy_attribute(self, attrib):
        node = builder.extract_node("""
        import numpy.core.numerictypes as tested_module
        missing_type = tested_module.{:s}""".format(attrib))
        return next(node.value.infer())

    def test_numpy_core_types(self):
        """
        Test that all defined types have ClassDef type.
        """
        for typ in self.all_types:
            with self.subTest(typ=typ):
                inferred = self._inferred_numpy_attribute(typ)
                self.assertIsInstance(inferred, nodes.ClassDef)


if __name__ == '__main__':
    unittest.main()
