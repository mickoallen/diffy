# Elixir demo
defmodule Animal do
  defstruct [:name, :sound]

  def speak(%Animal{name: name, sound: sound}) do
    "#{name} says #{sound}"
  end
end

defmodule Demo do
  def greet(name), do: "Hello, #{name}!"

  def main do
    animals = [%Animal{name: "Cat", sound: "meow"}, %Animal{name: "Dog", sound: "woof"}]
    Enum.each(animals, fn a -> IO.puts(Animal.speak(a)) end)
    IO.puts(greet("World"))
  end
end

Demo.main()
