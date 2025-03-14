---
layout: post
title: 'Bitcoin Internals: Verifying Merkle Roots using Merkle Proofs in JavaScript'
meta: 'Learn how to validate Bitcoin transactions using Merkle proofs in JavaScript. This guide covers computing Merkle proofs, verifying transactions in blocks, and leveraging Simplified Payment Verification for lightweight Bitcoin clients.'
tags: ['bitcoin', 'javascript']
---

In this video, we expand on the previous one, in which we computed a Merkle root for a given list of transactions using Merkle trees.
We will now compute a Merkle proof for a given transaction, allowing clients to validate that a transaction exists in a block without having to download its entire contents.
This technique is used widely in lightweight Bitcoin clients (using Simplified Payment Verification).
We codify a JavaScript solution that creates a Merkle proof for a transaction and then does the inverse by validating that proof's claim based on the block's Merkle root.

{{< youtube 2kPFSoknlUU >}}

## Source

Below is a copy of the source code which accompanies the video.

```js
const fetchLatestBlock = () =>
  fetch(`https://blockchain.info/q/latesthash?cors=true`).then(r => r.text());

const fetchMerkleRootAndTransactions = block =>
  fetch(`https://blockchain.info/rawblock/${block}?cors=true`)
    .then(r => r.json())
    .then(d => [d.mrkl_root, d.tx.map(t => t.hash)]);

const random = arr => arr[Math.floor(Math.random() * arr.length)];

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

const merkleProof = (txs, tx, proof = []) => {
  if (txs.length === 1) {
    return proof;
  }

  const tree = [];

  toPairs(txs).forEach(pair => {
    const hash = hashPair(...pair);

    if (pair.includes(tx)) {
      const idx = (pair[0] === tx) | 0;
      proof.push([idx, pair[idx]]);
      tx = hash;
    }

    tree.push(hash);
  });

  return merkleProof(tree, tx, proof);
};

const merkleProofRoot = (proof, tx) =>
  proof.reduce(
    (root, [idx, tx]) => (idx ? hashPair(root, tx) : hashPair(tx, root)),
    tx
  );

fetchLatestBlock()
  .then(fetchMerkleRootAndTransactions)
  .then(([root, txs]) => {
    const tx = random(txs);
    const proof = merkleProof(txs, tx);

    const isValid = merkleProofRoot(proof, tx) === root;
    console.log(isValid);
  });
```

## Resources

- https://www.bitcoinbook.info/
- https://bitcoin.org/en/glossary/simplified-payment-verification
