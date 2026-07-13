output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "Visit this URL once you've deployed something to the app tier"
  value       = aws_lb.main.dns_name
}

output "security_group_ids" {
  value = {
    web = aws_security_group.web.id
    app = aws_security_group.app.id
    db  = aws_security_group.db.id
  }
}
