# Python demo
from typing import Optional

class Animal:
    def __init__(self, name: str, sound: Optional[str] = None):
        self.name = name
        self.sound = sound or "..."

    def speak(self) -> str:
        return f"{self.name} says {self.sound}"

    def __repr__(self) -> str:
        return f"Animal({self.name!r}, {self.sound!r})"

def greet(name: str) -> str:
    return f"Hello, {name}!"

animals = [Animal("Cat", "meow"), Animal("Dog", "woof"), Animal("Bird", "chirp")]
