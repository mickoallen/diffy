// Kotlin demo
data class Animal(val name: String, val sound: String) {
    fun speak(): String = "$name says $sound"
}

fun greet(name: String): String = "Hello, $name!"

fun main() {
    val animals = listOf(Animal("Cat", "meow"), Animal("Dog", "woof"))
    animals.forEach { println(it.speak()) }
    println(greet("World"))
}
