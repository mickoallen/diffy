(* OCaml demo *)
type animal = { name: string; sound: string }

let speak a = Printf.sprintf "%s says %s" a.name a.sound

let greet name = "Hello, " ^ name ^ "!"

let () =
  let animals = [{ name = "Cat"; sound = "meow" }; { name = "Dog"; sound = "woof" }] in
  List.iter (fun a -> print_endline (speak a)) animals;
  print_endline (greet "World")
