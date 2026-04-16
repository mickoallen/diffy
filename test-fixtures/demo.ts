// TypeScript demo
interface User {
  id: number;
  name: string;
  email?: string;
  role: 'admin' | 'user';
}

function greet(user: User): string {
  return `Hello, ${user.name}!`;
}

const users: User[] = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", email: "bob@example.com", role: "user" },
  { id: 3, name: "Charlie", email: "charlie@example.com", role: "user" },
];

export { greet, users };
