-- SQL demo
CREATE TABLE animals (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  sound VARCHAR(20) NOT NULL
);

INSERT INTO animals (name, sound) VALUES
  ('Cat', 'meow'),
  ('Dog', 'woof');

SELECT
  a.id,
  a.name,
  a.sound,
  COUNT(*) OVER () AS total
FROM animals a
WHERE a.name LIKE 'C%'
ORDER BY a.name ASC;

UPDATE animals SET sound = 'purr' WHERE name = 'Cat';

DELETE FROM animals WHERE id = 99;
