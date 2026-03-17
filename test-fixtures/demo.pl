# Perl demo
use strict;
use warnings;

package Animal;
sub new {
    my ($class, %args) = @_;
    return bless { name => $args{name}, sound => $args{sound} }, $class;
}
sub speak {
    my $self = shift;
    return "$self->{name} says $self->{sound}";
}

package main;
sub greet { return "Hello, $_[0]!" }

my @animals = (
    Animal->new(name => "Cat", sound => "meow"),
    Animal->new(name => "Dog", sound => "woof"),
);
print $_->speak() . "\n" for @animals;
print greet("World") . "\n";
