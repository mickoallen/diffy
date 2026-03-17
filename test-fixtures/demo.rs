// Rust demo
use std::fmt;

struct Animal {
    name: String,
    sound: String,
}

impl Animal {
    fn new(name: &str, sound: &str) -> Self {
        Animal { name: name.to_string(), sound: sound.to_string() }
    }

    fn speak(&self) -> String {
        format!("{} says {}", self.name, self.sound)
    }
}

impl fmt::Display for Animal {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Animal({})", self.name)
    }
}

fn main() {
    let cat = Animal::new("Cat", "meow");
    println!("{}", cat.speak());
}
