// TSX demo
import { useState } from 'react';

interface Animal {
  name: string;
  sound: string;
}

function AnimalItem({ name, sound }: Animal) {
  return <li>{name} says {sound}</li>;
}

export default function Demo() {
  const [animals, setAnimals] = useState<Animal[]>([
    { name: 'Cat', sound: 'meow' },
    { name: 'Dog', sound: 'woof' },
  ]);

  return (
    <div className="demo">
      <h1>Hello, World!</h1>
      <ul>
        {animals.map(a => (
          <AnimalItem key={a.name} name={a.name} sound={a.sound} />
        ))}
      </ul>
    </div>
  );
}
