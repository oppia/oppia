p = [p for p in prime_range(100,200) if p % 4 == 3][0]

p = 7
x = var('x')
K.<a> = GF(p**2, name='a', modulus=x^2 + 1 )
zeta = K.multiplicative_generator()
zeta = K(ZZ(ZZ.quo(p).multiplicative_generator()))
zeta.multiplicative_order() == p+1



def cosk(x):
    return K(1/2) * (zeta**(a*x) + zeta**(-a*x))

def sink(x):
    return K(1/(2*a)) * (zeta**(a*x) - zeta**(-a*x))


p = [p for p in prime_range(100,200) if p % 4 == 1][0]

p = 5
K = GF(p)


x = var('x')
eval(str(taylor(exp(x),x,0,p-1)).replace('^','**'))
K(1/3628800*x^10 + 1/362880*x^9 + 1/40320*x^8 + 1/5040*x^7 + 1/720*x^6 + 1/120*x^5 + 1/24*x^4 + 1/6*x^3 + 1/2*x^2 + x + 1)




exp has properties like

exp(a) * exp(b) = exp(a+b)


so exp(2*x) = exp(2+2+2...+2) = exp(2)^x

so exp(y) = exp(2)^(y/2)



really want exp(log(x)) == x


should only be testing x's which are in the image of exp?



but perhaps don't want log(exp(x)) == x


exp(log(x)) == x

exp(2*log(x)) == x^2





unnested exponentials


http://www-oldurls.inf.ethz.ch/personal/gonnet/CAII/HeuristicAlgorithms/node18.html
