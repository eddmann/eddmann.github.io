---
layout: post
title: 'Maintaining Invariant Constraints in PostgreSQL using Trigger Functions'
meta: 'Taking advantage of trigger functions to maintain complex invariant constraints in PostgreSQL'
---

Recently a feature I was working on required me to alter a unique constraint which existed upon a table column.
The invariant had now been weakened to allow storing of duplicate `email` addresses based on if they share an equivalent `link_id` (excluding NULL).
Sadly the ease in which I was able to add the general unique constraint had disappear.
However, I was able to take advantage of insertion/update triggers to again provide me with these invariant reassurances. <!--more-->
I should note that I'm in favor of having business critical constraints placed within the database layer, even if this seems like a blurring of responsibility between application logic and the data-store.

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
SQL;
```

```sql
CREATE TRIGGER validate_record_email_address
BEFORE INSERT OR UPDATE ON records
FOR EACH ROW
    EXECUTE PROCEDURE valid_record_email_address();
SQL;
```

As you can see within PostgreSQL we are able to write extremely clear trigger functions which can be used to alter actions that occur in the database.
We hope that the application layer will safe-guard us from an attempt to break this invariant, but as this is a critical area of our domain we can provide another level of validation just to make sure.
