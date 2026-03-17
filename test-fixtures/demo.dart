// Dart demo
class Animal {
  final String name;
  final String sound;

  const Animal(this.name, this.sound);

  String speak() => '$name says $sound';
}

String greet(String name) => 'Hello, $name!';

void main() {
  final animals = [Animal('Cat', 'meow'), Animal('Dog', 'woof')];
  for (final a in animals) {
    print(a.speak());
  }
  print(greet('World'));
}
