# R demo
greet <- function(name) {
  paste0("Hello, ", name, "!")
}

speak <- function(name, sound) {
  paste(name, "says", sound)
}

animals <- data.frame(
  name = c("Cat", "Dog"),
  sound = c("meow", "woof"),
  stringsAsFactors = FALSE
)

for (i in seq_len(nrow(animals))) {
  cat(speak(animals$name[i], animals$sound[i]), "\n")
}
cat(greet("World"), "\n")
