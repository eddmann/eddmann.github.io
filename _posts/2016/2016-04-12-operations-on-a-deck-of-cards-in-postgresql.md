---
layout: post
title: 'Operations on a Deck of Cards in PostgreSQL'
meta: 'Exploring how to use PostgreSQL for performing operations on a Deck of Cards'
---

Recently I have been looking more into SQL and in-particular how RDMS's work under-the-hood.
I thought it would be interesting to use some of the lesser-known features that PostgreSQL has to offer, concentrating my efforts on operations performed on a deck of cards. <!--more-->

```sql
WITH deck AS (
    SELECT
        rank || suit AS card
    FROM
        unnest(string_to_array('2 3 4 5 6 7 8 9 10 J Q K A', ' ')) AS rank,
        unnest(string_to_array('♠ ♥ ♦ ♣', ' ')) as suit
)
```

The first task we need to complete is to create a table of the 52 cards that are present in a deck.
We can do this rather succinctly by taking advantage of PostgreSQL's arrays and a cross-join (Cartesian product) between the ranks and suits.
Using a CTE by way of the `WITH` clause, we are able to use this table in later queries by name.

```sql
SELECT ARRAY(SELECT card FROM deck ORDER BY random() LIMIT 5) AS hand
```

We can then use this deck to retrieve a randomised five card hand.

```sql
SELECT
    COUNT(*) AS hands
FROM
    deck AS a, deck AS b, deck AS c, deck AS d, deck AS e
WHERE
    a.card < b.card AND b.card < c.card AND
    c.card < d.card AND d.card < e.card;
```

Alternatively we can return all the possible combinations of hands present within a deck.
Using a similar cross-join present when creating the deck we instead condition the result to only return unique combinations.
This uses the fact that although each card is a string value, combined they are comparable and still provide a [total order](https://en.wikipedia.org/wiki/Total_order).
