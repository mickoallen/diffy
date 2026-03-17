<?php
// PHP demo
class Animal {
    public string $name;
    public string $sound;

    public function __construct(string $name, string $sound) {
        $this->name = $name;
        $this->sound = $sound;
    }

    public function speak(): string {
        return "{$this->name} says {$this->sound}";
    }
}

function greet(string $name): string {
    return "Hello, $name!";
}

$animals = [new Animal("Cat", "meow"), new Animal("Dog", "woof")];
foreach ($animals as $animal) {
    echo $animal->speak() . "\n";
}
echo greet("World") . "\n";
