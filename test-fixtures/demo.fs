// F# demo
type Animal = { Name: string; Sound: string }

let speak a = sprintf "%s says %s" a.Name a.Sound

let greet name = sprintf "Hello, %s!" name

[<EntryPoint>]
let main _ =
    let animals = [ { Name = "Cat"; Sound = "meow" }; { Name = "Dog"; Sound = "woof" } ]
    animals |> List.iter (speak >> printfn "%s")
    printfn "%s" (greet "World")
    0
