// C++ demo
#include <iostream>
#include <string>
#include <vector>

class Animal {
public:
    std::string name;
    std::string sound;

    Animal(std::string n, std::string s) : name(n), sound(s) {}

    std::string speak() const {
        return name + " says " + sound;
    }
};

int main() {
    std::vector<Animal> animals = {{"Cat", "meow"}, {"Dog", "woof"}};
    for (const auto& a : animals) {
        std::cout << a.speak() << std::endl;
    }
    return 0;
}
