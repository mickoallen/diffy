// JavaScript demo
const greet = (name) => {
  return `Hello, ${name}!`;
};

class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log(`${this.name} makes a noise.`);
  }
}

export default greet;
