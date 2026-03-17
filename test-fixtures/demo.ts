// TypeScript demo
interface User {
  id: number;
  name: string;
  email?: string;
}

function greet(user: User): string {
  return `Hello, ${user.name}!`;
}

const users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

export { greet, users };
