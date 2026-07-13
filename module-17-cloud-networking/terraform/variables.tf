# Module 17 -- input variables for a real, minimal 3-tier VPC.
# Every default here fits comfortably in AWS's free tier (t2/t3.micro
# eligible, a small number of resources) -- verify current free-tier
# limits yourself at aws.amazon.com/free before applying, since AWS's
# free-tier terms can change.

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the whole VPC -- same /16 sizing thinking as Module 04's VLSM work, just bigger"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "One public subnet per AZ -- hosts the load balancer and NAT gateway"
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "One private subnet per AZ -- hosts application instances, no direct internet route"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "availability_zones" {
  description = "Two AZs for basic redundancy"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "environment" {
  description = "Tag applied to every resource, for cost tracking and identification"
  type        = string
  default     = "module17-lab"
}
