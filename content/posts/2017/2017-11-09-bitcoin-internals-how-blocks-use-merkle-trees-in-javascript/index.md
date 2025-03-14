---
layout: post
title: 'Bitcoin Internals: How Blocks use Merkle Trees in JavaScript'
meta: "Explore how Bitcoin utilises Merkle trees internally, featuring a JavaScript example demonstrating how to compute and verify Merkle roots for a block's transactions."
tags: ['bitcoin', 'javascript']
---

In this video, I take a look into how Bitcoin internally uses Merkle trees to generate its block Merkle roots.
We delve into how this is computed and why it is so important to validate the state of transactions.
We then move on to create a simple script in JavaScript that computes the Merkle root of a given block's transactions and verifies it with the value stored within the block.

{{< youtube 1pasjSinXDs >}}

## Source

Below is a copy of the source code which accompanies the video.

```js
const fetchLatestBlock = () =>
  fetch(`https://blockchain.info/q/latesthash?cors=true`).then(r => r.text());

const fetchMerkleRootAndTransactions = block =>
  fetch(`https://blockchain.info/rawblock/${block}?cors=true`)
    .then(r => r.json())
    .then(d => [d.mrkl_root, d.tx.map(t => t.hash)]);

const toBytes = hex =>
  hex.match(/../g).reduce((acc, hex) => [...acc, parseInt(hex, 16)], []);

const toHex = bytes =>
  bytes.reduce((acc, bytes) => acc + bytes.toString(16).padStart(2, '0'), '');

const toPairs = arr =>
  Array.from(Array(Math.ceil(arr.length / 2)), (_, i) =>
    arr.slice(i * 2, i * 2 + 2)
  );

const hashPair = (a, b = a) => {
  const bytes = toBytes(`${b}${a}`).reverse();
  const hashed = sha256.array(sha256.array(bytes));
  return toHex(hashed.reverse());
};

const merkleRoot = txs =>
  txs.length === 1
    ? txs[0]
    : merkleRoot(
        toPairs(txs).reduce((tree, pair) => [...tree, hashPair(...pair)], [])
      );

fetchLatestBlock()
  .then(fetchMerkleRootAndTransactions)
  .then(([root, txs]) => {
    const isValid = merkleRoot(txs) === root;
    console.log(isValid);
  });
```

## Resources

- https://www.bitcoinbook.info/
- https://bitcointalk.org/index.php?topic=45456.0
- https://bitcoin.stackexchange.com/questions/2063/why-does-the-bitcoin-protocol-use-the-little-endian-notation
