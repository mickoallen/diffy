# Ruby demo
class Animal
  attr_reader :name, :sound

  def initialize(name, sound)
    @name = name
    @sound = sound
  end

  def speak
    "#{@name} says #{@sound}"
  end
end

def greet(name)
  "Hello, #{name}!"
end

animals = [Animal.new("Cat", "meow"), Animal.new("Dog", "woof")]
animals.each { |a| puts a.speak }
puts greet("World")
