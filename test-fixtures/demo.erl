% Erlang demo
-module(demo).
-export([main/0, greet/1, speak/2]).

greet(Name) ->
    "Hello, " ++ Name ++ "!".

speak(Name, Sound) ->
    Name ++ " says " ++ Sound.

main() ->
    Animals = [{"Cat", "meow"}, {"Dog", "woof"}],
    lists:foreach(fun({Name, Sound}) ->
        io:format("~s~n", [speak(Name, Sound)])
    end, Animals),
    io:format("~s~n", [greet("World")]).
