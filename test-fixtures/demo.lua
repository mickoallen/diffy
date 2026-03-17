-- Lua demo
local Animal = {}
Animal.__index = Animal

function Animal.new(name, sound)
  return setmetatable({ name = name, sound = sound }, Animal)
end

function Animal:speak()
  return self.name .. " says " .. self.sound
end

local function greet(name)
  return "Hello, " .. name .. "!"
end

local animals = { Animal.new("Cat", "meow"), Animal.new("Dog", "woof") }
for _, a in ipairs(animals) do
  print(a:speak())
end
print(greet("World"))
