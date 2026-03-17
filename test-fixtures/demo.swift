// Swift demo
import Foundation

struct Animal {
    let name: String
    let sound: String

    func speak() -> String {
        return "\(name) says \(sound)"
    }
}

func greet(_ name: String) -> String {
    return "Hello, \(name)!"
}

let animals: [Animal] = [
    Animal(name: "Cat", sound: "meow"),
    Animal(name: "Dog", sound: "woof"),
]

for animal in animals {
    print(animal.speak())
}
print(greet("World"))
