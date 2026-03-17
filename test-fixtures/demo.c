/* C demo */
#include <stdio.h>
#include <string.h>

typedef struct {
    char name[50];
    char sound[20];
} Animal;

void speak(Animal *a) {
    printf("%s says %s\n", a->name, a->sound);
}

int main() {
    Animal cat;
    strcpy(cat.name, "Cat");
    strcpy(cat.sound, "meow");
    speak(&cat);
    return 0;
}
