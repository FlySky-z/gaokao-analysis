# Makefile for compiling Go files

# Name of the binary to build
BINARY_NAME=gaokaoZ

# Default target
all: build

# Build the Go project
build:
	./build/otel-darwin-arm64 go build -o $(BINARY_NAME) .

# Build for Linux amd64
build-linux:
	GOOS=linux GOARCH=amd64 ./build/otel-darwin-arm64 go build -o $(BINARY_NAME)_linux_amd64 .

# Run the Go project
run: build
	./$(BINARY_NAME)

# Clean up binaries
clean:
	rm -f $(BINARY_NAME)

.PHONY: all build run clean