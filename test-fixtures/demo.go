// Go demo
package main

import "fmt"

type Animal struct {
	Name  string
	Sound string
}

func (a Animal) Speak() string {
	return fmt.Sprintf("%s says %s", a.Name, a.Sound)
}

func greet(name string) string {
	return fmt.Sprintf("Hello, %s!", name)
}

func main() {
	cat := Animal{Name: "Cat", Sound: "meow"}
	fmt.Println(cat.Speak())
	fmt.Println(greet("World"))
}
