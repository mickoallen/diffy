# Python demo
from typing import Optional

class Animal:
    def __init__(self, name: str, sound: Optional[str] = None):
        self.name = name
        self.sound = sound or "..."

    def speak(self) -> str:
        return f"{self.name} says {self.sound}"

def greet(name: str) -> str:
    return f"Hello, {name}!"

animals = [Animal("Cat", "meow"), Animal("Dog", "woof")]
