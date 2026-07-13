# Module 17 -- a real, minimal 3-tier VPC: public subnets (load balancer),
# private subnets (application instances), and a 3-tier security group
# chain (web -> app -> db, each only reachable from the tier "in front"
# of it) -- the exact same isolation PRINCIPLE as Module 09's home-lab
# VLAN plan (Main/IoT/Lab), expressed in AWS's networking primitives
# instead of pfSense's.
#
# This file was written with care for correct, standard AWS provider
# (hashicorp/aws) syntax, but was NOT run through `terraform validate` or
# `terraform plan` during this module's build -- neither the Terraform
# CLI nor an HCL parser was available in this course's build environment,
# and applying this against a real AWS account requires the student's own
# credentials this course will never handle. See DECISIONS.md and
# tutorial.html for what WAS verified (the security-group logic, via
# sg_rule_auditor.py/.js) versus what the student must verify themselves
# (`terraform validate` and `terraform plan`, before ever running `apply`).

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------------------- VPC ---
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "${var.environment}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.environment}-igw" }
}

# ------------------------------------------------------------ Subnets ---
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "${var.environment}-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  tags = { Name = "${var.environment}-private-${count.index}" }
}

# ----------------------------------------------------- NAT for private ---
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${var.environment}-nat-eip" }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = { Name = "${var.environment}-nat" }
  depends_on    = [aws_internet_gateway.main]
}

# ------------------------------------------------------- Route tables ---
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "${var.environment}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  tags = { Name = "${var.environment}-private-rt" }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# --------------------------------------------- 3-tier security groups ---
# web: only the load balancer's ports are open to the internet
resource "aws_security_group" "web" {
  name        = "${var.environment}-web-sg"
  description = "Internet-facing load balancer -- only 80/443 from anywhere"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.environment}-web-sg" }
}

# app: ONLY reachable from the web tier's security group -- never directly
# from the internet. This is the same "Main can reach Lab, Lab can't
# initiate to Main" asymmetric trust pattern from Module 09.
resource "aws_security_group" "app" {
  name        = "${var.environment}-app-sg"
  description = "Application instances -- only reachable from the web tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App port, ONLY from the web security group"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.environment}-app-sg" }
}

# db: ONLY reachable from the app tier -- never from the web tier or the internet
resource "aws_security_group" "db" {
  name        = "${var.environment}-db-sg"
  description = "Database -- only reachable from the app tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL/Aurora port, ONLY from the app security group"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.environment}-db-sg" }
}

# --------------------------------------------------- Load balancer ---
resource "aws_lb" "main" {
  name               = "${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = aws_subnet.public[*].id
  tags               = { Name = "${var.environment}-alb" }
}

resource "aws_lb_target_group" "app" {
  name     = "${var.environment}-app-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    timeout             = 5
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
