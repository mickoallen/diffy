// C# demo
using System;
using System.Collections.Generic;

class Animal {
    public string Name { get; }
    public string Sound { get; }

    public Animal(string name, string sound) {
        Name = name;
        Sound = sound;
    }

    public string Speak() => $"{Name} says {Sound}";
}

class Program {
    static string Greet(string name) => $"Hello, {name}!";

    static void Main() {
        var animals = new List<Animal> {
            new Animal("Cat", "meow"),
            new Animal("Dog", "woof"),
        };
        foreach (var a in animals) Console.WriteLine(a.Speak());
        Console.WriteLine(Greet("World"));
    }
}
