# Nix demo
{ pkgs ? import <nixpkgs> {} }:

let
  greet = name: "Hello, ${name}!";

  myPackage = pkgs.stdenv.mkDerivation {
    pname = "demo";
    version = "1.0.0";
    src = ./.;
    buildInputs = [ pkgs.nodejs pkgs.git ];
    buildPhase = ''
      echo ${greet "World"}
    '';
  };
in myPackage
