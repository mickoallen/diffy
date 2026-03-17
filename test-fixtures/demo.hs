-- Haskell demo
data Animal = Animal { name :: String, sound :: String }

speak :: Animal -> String
speak a = name a ++ " says " ++ sound a

greet :: String -> String
greet n = "Hello, " ++ n ++ "!"

main :: IO ()
main = do
  let animals = [Animal "Cat" "meow", Animal "Dog" "woof"]
  mapM_ (putStrLn . speak) animals
  putStrLn (greet "World")
