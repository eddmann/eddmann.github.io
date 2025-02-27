---
layout: post
title: 'Binary Addition using Half and Full Adders within TypeScript'
meta: 'Explores performing Binary Addition within TypeScript using Logic Gates and Half/Full Adders'
---

Recently, I watched an interesting talk about [Binary Addition in the TypeScript Type System](https://www.youtube.com/watch?v=7lyb22x9tcM) and thought it would be interesting to explore this concept in more depth.
I wanted to pay close attention to how I could leverage the TypeScript type-system to help ensure validity in the final implementation.

<!--more-->

### The Bit

Starting from basic principles and working our way up we define the concept of a `Bit` and a fixed tuple of `Bits` using [Recursive Conditional Types](https://devblogs.microsoft.com/typescript/announcing-typescript-4-1-beta/#recursive-conditional-types) which will be available in TypeScript 4.1.

```typescript
type Bit = 0 | 1;
type Bits<N extends number> = N extends N ? (number extends N ? Bit[] : _Bits<N, []>) : never;
type _Bits<N extends number, R extends Bit[]> = R["length"] extends N ? R : _Bits<N, [Bit, ...R]>;
```

From here, we create a simple factory function which, based on the desired Bit width size, pads out a supplied Partial type with trailing zeros.
For this exercise we will be storing the Bits in [Least Significant Bit](https://en.wikipedia.org/wiki/Bit_numbering#Least_significant_bit) order.

```typescript
type PartialBits<N extends number> = Partial<Bits<N>>;

const Bits = <N extends number>(size: N) => (bits: PartialBits<N>): Bits<N> => {
  let result = Array<Bit>(size) as Bits<N>;

  for (let i = 0; i < size; i++) {
    result[i] = bits[i] || 0;
  }

  return result;
};

const Int8 = Bits(8);
const Int16 = Bits(16);
```

In doing this we are now levaging the type system to ensure that any supplied bits do not exceed the allocated represenation width.
This is highlighted in the examples below.

```typescript
Int8([1, 0, 1]); // valid
Int8([1, 0, 0, 1, 1, 0, 1, 0, 1]); // invalid
Int16([1, 0, 0, 1, 1, 0, 1, 0, 1]); // valid
```

### The Logic Gates

So as to perform the final addition we need to provide the tooling around being able to construct Logic Gates based on supplied Bits.
We are able to achieve this using the approach laid out below.

```typescript
const and = (a: Bit, b: Bit): Bit => (a === 1 && b === 1 ? 1 : 0);
const or = (a: Bit, b: Bit): Bit => (a === 1 || b === 1 ? 1 : 0);
const invert = (a: Bit): Bit => (a ? 0 : 1);
const nand = (a: Bit, b: Bit): Bit => invert(and(a, b));
const nor = (a: Bit, b: Bit): Bit => invert(or(a, b));
const xor = (a: Bit, b: Bit): Bit => and(or(a, b), nand(a, b));
```

### The Half Adder

The [Half Adder](<https://en.wikipedia.org/wiki/Adder_(electronics)#Half_adder>) is used to add two single bits A and B together, resulting in Sum and Carry outputs.
We can build such a circuit using the following three approaches - the simplest of which is shown first, comprising of a single `XOR` and `AND` gate.

```typescript
type Addition = {
  sum: Bit;
  carry: Bit;
};

type HalfAdder = (a: Bit, b: Bit) => Addition;
```

#### Simplest Half-Adder

[![Simplest Half-Adder](/uploads/binary-addition-using-half-and-full-adders-within-typescript/half-adder.jpg)](https://www.electronicshub.org/half-adder-and-full-adder-circuits/#Half_Adder)

```typescript
const halfAdder: HalfAdder = (a, b) => ({
  sum: xor(a, b),
  carry: and(a, b),
});
```

#### Half-Adder using only NAND Gates

[![Half-Adder using only NAND Gates](/uploads/binary-addition-using-half-and-full-adders-within-typescript/half-adder-nand.jpg)](https://www.electronicshub.org/half-adder-and-full-adder-circuits/#Half_Adder_using_NAND_Gates)

```typescript
const halfAdderUsingNand: HalfAdder = (a, b) => {
  const ab = nand(a, b);
  return {
    sum: nand(nand(ab, a), nand(ab, b)),
    carry: nand(ab, ab),
  };
};
```

#### Half-Adder using only NOR Gates

[![Half-Adder using only NOR Gates](/uploads/binary-addition-using-half-and-full-adders-within-typescript/half-adder-nor.jpg)](https://www.electronicshub.org/half-adder-and-full-adder-circuits/#Half_Adder_using_NOR_Gates)

```typescript
const halfAdderUsingNor: HalfAdder = (a, b) => {
  const carry = nor(nor(a, a), nor(b, b));
  return {
    sum: nor(carry, nor(a, b)),
    carry,
  };
};
```

### The Full Adder

On its own a Half Adder is unable to perform the binary addition we hope to achieve.
To achieve this we can use a [Full Adder](<https://en.wikipedia.org/wiki/Adder_(electronics)#Full_adder>) which is able to handle a subsquent third bit within the input - this being the Carry from a previous operation.
This Adder can be constructed by using two Half Adders like so.

[![The Full Adder](/uploads/binary-addition-using-half-and-full-adders-within-typescript/full-adder.jpg)](https://www.electronicshub.org/half-adder-and-full-adder-circuits/#Full_Adder)

```typescript
type FullAdder = (a: Bit, b: Bit, c: Bit) => Addition;

const fullAdder = (halfAdder: HalfAdder): FullAdder => (a, b, c) => {
  const ab = halfAdder(a, b);
  const abc = halfAdder(ab.sum, c);
  return {
    sum: abc.sum,
    carry: or(ab.carry, abc.carry),
  };
};
```

### Binary Addition

With this tooling in-place we can then construct an addition function.
Based on a Bit result width size, we supply Partials of this Bit width and in-turn use the Full Adder to calculate the final result.
Leveraging the type system we are able to ensure that we do permit inputs that are larger than the allocated return type.

```typescript
const add = (fullAdder: FullAdder) => <N extends number>(size: N) => (
  a: PartialBits<N>,
  b: PartialBits<N>
): Bits<N> => {
  let carry: Bit = 0;
  let result = Array<Bit>(size) as Bits<N>;

  for (let i = 0; i < size; i++) {
    ({ sum: result[i], carry } = fullAdder(a[i] || 0, b[i] || 0, carry));
  }

  return result;
};
```

Finally, we can test out this implementation like so.

```typescript
const addInt8 = add(fullAdder(halfAdder))(8);
const addInt16 = add(fullAdder(halfAdderUsingNand))(16);

addInt8(Int8([1, 0, 1, 1]), Int8([1, 0, 1])); // 01001000
addInt8(Int16([1, 0, 1, 1, 1, 1, 1, 1, 1]), Int8([1, 1, 1, 1])); // invalid
addInt16(Int16([1, 0, 1, 1, 1, 1, 1, 1, 1]), Int8([1, 1, 1, 1])); // 0011000001000000
```

Notice the type system again helping to enforce width rules with regards to Bits in the second example.
If you are interested in experimenting with the demonstration you can visit [this TypeScript playground](https://www.typescriptlang.org/play?ts=4.1.0-beta#code/C4TwDgpgBAQglsKBeKAGKAfKBGA3AKFElgQGcAeAOSggA9gIA7AE1KkYFcBbAIwgCcAfMijU6DFm2oB+KAApOvATXpNWoqLPjAA2gF0oALigB9bRUoAaKPsEBKI+wgA3AQSLQzZKionrFfPzWAEq+amzatiLBOgBEADZMAObAABaxBuLhGrKhxl7AFtY62tYAdBXBeoLu4NAACgCG-MBwjfHmPlmS7NyBwihNLW3x5J2UgjX4+ADGAPaMpIjmIl2qPQECgnKkcABeEMaUDkjCcjxkxkOt7eP2xnfIwgDe+FBQiYj8EKQc8YgoACC-H4jRAYwQ212BwcjQi3gmBDeUAAZnN+PJPlA4CJULhsVByFBoRB8XAANTkhyvd7vb6-f46OAGFAXQpMgwYLB45EAX2mdIgwA4-EYUHpf2ABF5SPmi0QAElGMAABwicxyFV2AhypZQJXAbAANnVZDkxu1011iEaLBEckaDwQ1h4TuAdjdT3kjWQSBQ2CgADJA1AeL7-ZocI5UJbrVB0fbHSRgC63R7k16HeGo1zQ9mA7IA8YYzqFnq4IxXC1E2nPadvZH0MZsLGy4hGLbmDXk6nk+ntF6K1XgA6WA6XXZW-L2AmUA63b3tP2EIPKwIR+jx6HJ6Xp7RZ96F6Haxn6525JvGhPrB2x1ft5bCHUoIDmMwEHAFiIacTuG6CO8MzNPwID-vgMrTB4UAABLtCir7MMoc5JqUx59l6CEfgssptlAqRwQhAjGLB8TwW+SHehOmY-r8XDGPu-BbjwdiWMiQEgqBUDnvezGsbyj5xvhpGEfwACquyMEklCdsRBHkRiyFUfWP5xo0YYoLezBMZagrCqKUA-u8tHGJpCjcTw1iNCx7DmROLHIoBwGcaZamWbxfLSjh05CWRiFiRJUnorJwnyYmSkvGxuHsSBIiMJucWMfeVk3puFkPgB4pCiKYqGb+dEzox0UgCliV2axtJQEV5VQBBEFPsQABifzxCJ3aoa6PaVWmGFvlhjBeXqKLNa1c4+SJwW+QI6ZNfELWhfWTHWDMJwRYBuFqSIY3ydpGWqTwMybXJfkOjwZS0UtOmZXpOUOXlxhqTMZ3cNVjkccYl6nVVXH7WURX2e8tUDTab72kNs3jVAM1zX5K2EmI6z+H0Ww7PshyiLDcjIkm1wjHc1UdTjtwIoI+DLoUVADKtHxCpVTl1mgGVYhK-wiMCoLgtoUKo7C8Lk4iAqogmchYjiKB4gSRIkmSlLUrdcjPHdmUMrozJLU5NUiGD0MCA6HKYNyLp67mqBqxxO58gL3zXUrkqeVa61vgaaooI0b5yFrIlyFtMN2JqU56q7zAGsaIiB+7w3bd7AjiRWUmdpO5pGgJZZzIkv2JM0cj+6nEBlPEcxJA6jvKiqchO3IOjYNYJs4NY2B6NZ5eV9XdcN+buo53nBdF0HyrGmXfdGhXVdoHXY+1xPI9Tw31hN1P4-15OlpAA).
