---
layout: post
title: 'Maintaining Invariant Constraints in PostgreSQL using Trigger Functions'
meta: 'Learn how to maintain complex invariant constraints in PostgreSQL using trigger functions for enhanced data integrity.'
tags: ['postgresql', 'sql']
---

Recently, a feature I was working on required me to alter a unique constraint that existed on a table column.
The invariant had now been weakened to allow storing of duplicate `email` addresses, provided they shared an equivalent `link_id` (excluding `NULL`).
Sadly, the ease with which I had initially added the general unique constraint had disappeared.
However, I was able to take advantage of insertion/update triggers to regain these invariant reassurances. <!--more-->
I should note that I am in favour of placing business-critical constraints within the database layer, even if this seems like a blurring of responsibility between application logic and the data store.

```sql
CREATE OR REPLACE FUNCTION valid_record_email_address()
RETURNS TRIGGER
AS $$
BEGIN
    IF NEW.link_id IS NULL AND EXISTS (SELECT TRUE FROM records WHERE email = NEW.email AND id != NEW.id) THEN
        RAISE EXCEPTION 'Unlinked records must have a unique email address';
    END IF;

    IF NEW.link_id IS NOT NULL AND EXISTS (SELECT TRUE FROM records WHERE link_id != NEW.link_id AND email = NEW.email AND id != NEW.id) THEN
        RAISE EXCEPTION 'Only linked records can have the same email address';
    END IF;

    RETURN NEW;
END
$$ LANGUAGE plpgsql;
```

```sql
CREATE TRIGGER validate_record_email_address
BEFORE INSERT OR UPDATE ON records
FOR EACH ROW
    EXECUTE PROCEDURE valid_record_email_address();
```

As you can see, within PostgreSQL we can write extremely clear trigger functions that modify actions occurring in the database.
We hope that the application layer will safeguard us from attempts to break this invariant.
However, as this is a critical area of our domain, we provide another level of validation to ensure data integrity.
