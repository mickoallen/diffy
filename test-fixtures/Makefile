# Makefile demo
.PHONY: all build test clean

CC = gcc
CFLAGS = -Wall -Wextra -O2
SRC = demo.c
OUT = demo

all: build

build: $(SRC)
	$(CC) $(CFLAGS) -o $(OUT) $(SRC)

test: build
	./$(OUT)

clean:
	rm -f $(OUT)
