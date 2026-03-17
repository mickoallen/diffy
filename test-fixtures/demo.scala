// Scala demo
case class Animal(name: String, sound: String) {
  def speak: String = s"$name says $sound"
}

object Demo extends App {
  def greet(name: String): String = s"Hello, $name!"

  val animals = List(Animal("Cat", "meow"), Animal("Dog", "woof"))
  animals.foreach(a => println(a.speak))
  println(greet("World"))
}
