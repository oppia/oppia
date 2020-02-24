# Copyright (c) 2015-2016 Claudiu Popa <pcmanticore@gmail.com>

# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/PyCQA/astroid/blob/master/COPYING.LESSER


"""Astroid hooks for numpy."""

import astroid


def numpy_random_mtrand_transform():
    return astroid.parse('''
    def beta(a, b, size=None): pass
    def binomial(n, p, size=None): pass
    def bytes(length): pass
    def chisquare(df, size=None): pass
    def choice(a, size=None, replace=True, p=None): pass
    def dirichlet(alpha, size=None): pass
    def exponential(scale=1.0, size=None): pass
    def f(dfnum, dfden, size=None): pass
    def gamma(shape, scale=1.0, size=None): pass
    def geometric(p, size=None): pass
    def get_state(): pass
    def gumbel(loc=0.0, scale=1.0, size=None): pass
    def hypergeometric(ngood, nbad, nsample, size=None): pass
    def laplace(loc=0.0, scale=1.0, size=None): pass
    def logistic(loc=0.0, scale=1.0, size=None): pass
    def lognormal(mean=0.0, sigma=1.0, size=None): pass
    def logseries(p, size=None): pass
    def multinomial(n, pvals, size=None): pass
    def multivariate_normal(mean, cov, size=None): pass
    def negative_binomial(n, p, size=None): pass
    def noncentral_chisquare(df, nonc, size=None): pass
    def noncentral_f(dfnum, dfden, nonc, size=None): pass
    def normal(loc=0.0, scale=1.0, size=None): pass
    def pareto(a, size=None): pass
    def permutation(x): pass
    def poisson(lam=1.0, size=None): pass
    def power(a, size=None): pass
    def rand(*args): pass
    def randint(low, high=None, size=None, dtype='l'): pass
    def randn(*args): pass
    def random_integers(low, high=None, size=None): pass
    def random_sample(size=None): pass
    def rayleigh(scale=1.0, size=None): pass
    def seed(seed=None): pass
    def set_state(state): pass
    def shuffle(x): pass
    def standard_cauchy(size=None): pass
    def standard_exponential(size=None): pass
    def standard_gamma(shape, size=None): pass
    def standard_normal(size=None): pass
    def standard_t(df, size=None): pass
    def triangular(left, mode, right, size=None): pass
    def uniform(low=0.0, high=1.0, size=None): pass
    def vonmises(mu, kappa, size=None): pass
    def wald(mean, scale, size=None): pass
    def weibull(a, size=None): pass
    def zipf(a, size=None): pass
    ''')


def numpy_core_umath_transform():
    ufunc_optional_keyword_arguments = ("""out=None, where=True, casting='same_kind', order='K', """
                                        """dtype=None, subok=True""")
    return astroid.parse('''
    # Constants
    e = 2.718281828459045
    euler_gamma = 0.5772156649015329

    # No arg functions
    def geterrobj(): pass

    # One arg functions
    def seterrobj(errobj): pass

    # One arg functions with optional kwargs
    def arccos(x, {opt_args:s}): pass
    def arccosh(x, {opt_args:s}): pass
    def arcsin(x, {opt_args:s}): pass
    def arcsinh(x, {opt_args:s}): pass
    def arctan(x, {opt_args:s}): pass
    def arctanh(x, {opt_args:s}): pass
    def cbrt(x, {opt_args:s}): pass
    def conj(x, {opt_args:s}): pass
    def conjugate(x, {opt_args:s}): pass
    def cosh(x, {opt_args:s}): pass
    def deg2rad(x, {opt_args:s}): pass
    def degrees(x, {opt_args:s}): pass
    def exp2(x, {opt_args:s}): pass
    def expm1(x, {opt_args:s}): pass
    def fabs(x, {opt_args:s}): pass
    def frexp(x, {opt_args:s}): pass
    def isfinite(x, {opt_args:s}): pass
    def isinf(x, {opt_args:s}): pass
    def log(x, {opt_args:s}): pass
    def log1p(x, {opt_args:s}): pass
    def log2(x, {opt_args:s}): pass
    def logical_not(x, {opt_args:s}): pass
    def modf(x, {opt_args:s}): pass
    def negative(x, {opt_args:s}): pass
    def rad2deg(x, {opt_args:s}): pass
    def radians(x, {opt_args:s}): pass
    def reciprocal(x, {opt_args:s}): pass
    def rint(x, {opt_args:s}): pass
    def sign(x, {opt_args:s}): pass
    def signbit(x, {opt_args:s}): pass
    def sinh(x, {opt_args:s}): pass
    def spacing(x, {opt_args:s}): pass
    def square(x, {opt_args:s}): pass
    def tan(x, {opt_args:s}): pass
    def tanh(x, {opt_args:s}): pass
    def trunc(x, {opt_args:s}): pass
    
    # Two args functions with optional kwargs
    def bitwise_and(x1, x2, {opt_args:s}): pass
    def bitwise_or(x1, x2, {opt_args:s}): pass
    def bitwise_xor(x1, x2, {opt_args:s}): pass
    def copysign(x1, x2, {opt_args:s}): pass
    def divide(x1, x2, {opt_args:s}): pass
    def equal(x1, x2, {opt_args:s}): pass
    def float_power(x1, x2, {opt_args:s}): pass
    def floor_divide(x1, x2, {opt_args:s}): pass
    def fmax(x1, x2, {opt_args:s}): pass
    def fmin(x1, x2, {opt_args:s}): pass
    def fmod(x1, x2, {opt_args:s}): pass
    def greater(x1, x2, {opt_args:s}): pass
    def hypot(x1, x2, {opt_args:s}): pass
    def ldexp(x1, x2, {opt_args:s}): pass
    def left_shift(x1, x2, {opt_args:s}): pass
    def less(x1, x2, {opt_args:s}): pass
    def logaddexp(x1, x2, {opt_args:s}): pass
    def logaddexp2(x1, x2, {opt_args:s}): pass
    def logical_and(x1, x2, {opt_args:s}): pass
    def logical_or(x1, x2, {opt_args:s}): pass
    def logical_xor(x1, x2, {opt_args:s}): pass
    def maximum(x1, x2, {opt_args:s}): pass
    def minimum(x1, x2, {opt_args:s}): pass
    def nextafter(x1, x2, {opt_args:s}): pass
    def not_equal(x1, x2, {opt_args:s}): pass
    def power(x1, x2, {opt_args:s}): pass
    def remainder(x1, x2, {opt_args:s}): pass
    def right_shift(x1, x2, {opt_args:s}): pass
    def subtract(x1, x2, {opt_args:s}): pass
    def true_divide(x1, x2, {opt_args:s}): pass
    '''.format(opt_args=ufunc_optional_keyword_arguments))


def numpy_core_numerictypes_transform():
    return astroid.parse('''
    # different types defined in numerictypes.py
    uint16 = type('uint16') 
    uint32 = type('uint32')
    uint64 = type('uint64')
    int128 = type('int128')
    uint128 = type('uint128')
    float16 = type('float16')
    float32 = type('float32')
    float64 = type('float64')
    float80 = type('float80')
    float96 = type('float96')
    float128 = type('float128')
    float256 = type('float256')
    complex32 = type('complex32')
    complex64 = type('complex64')
    complex128 = type('complex128')
    complex160 = type('complex160')
    complex192 = type('complex192')
    complex256 = type('complex256')
    complex512 = type('complex512')
    timedelta64 = type('timedelta64')
    datetime64 = type('datetime64')
    unicode_ = type('unicode_')
    string_ = type('string_')
    object_ = type('object_')
    ''')


def numpy_funcs():
    return astroid.parse('''
    import builtins
    def sum(a, axis=None, dtype=None, out=None, keepdims=None):
        return builtins.sum(a)
    ''')


astroid.register_module_extender(astroid.MANAGER, 'numpy.core.umath', numpy_core_umath_transform)
astroid.register_module_extender(astroid.MANAGER, 'numpy.random.mtrand',
                                 numpy_random_mtrand_transform)
astroid.register_module_extender(astroid.MANAGER, 'numpy.core.numerictypes',
                                 numpy_core_numerictypes_transform)
astroid.register_module_extender(astroid.MANAGER, 'numpy', numpy_funcs)
