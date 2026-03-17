// JSX demo
import { useState } from 'react';

function Animal({ name, sound }) {
  return <li>{name} says {sound}</li>;
}

export default function Demo() {
  const [animals, setAnimals] = useState([
    { name: 'Cat', sound: 'meow' },
    { name: 'Dog', sound: 'woof' },
  ]);

  return (
    <div className="demo">
      <h1>Hello, World!</h1>
      <ul>
        {animals.map(a => (
          <Animal key={a.name} name={a.name} sound={a.sound} />
        ))}
      </ul>
    </div>
  );
}
