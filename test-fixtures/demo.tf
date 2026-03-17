# HCL/Terraform demo
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "region" {
  type    = string
  default = "us-east-1"
}

resource "aws_s3_bucket" "demo" {
  bucket = "my-demo-bucket"
  tags = {
    Environment = "dev"
    Name        = "Demo Bucket"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.demo.bucket
}
