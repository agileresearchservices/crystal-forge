#!/usr/bin/env python3
"""
OpenSearch Demo Data Generator

Generates 1000 realistic documents across 4 domains:
- E-commerce products (350)
- Technical documentation (300)
- Blog articles (200)
- User reviews (150)

All data generation is deterministic for reproducibility.
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Configuration parameters
SEED = 42
OUTPUT_FILE = "generated_documents.json"
DOMAINS = {
    "e_commerce": 350,
    "technical_docs": 300,
    "blog_articles": 200,
    "reviews": 150
}

# Data pools for realistic content generation
PRODUCT_CATEGORIES = ["Electronics", "Clothing", "Books", "Home & Garden"]

PRODUCT_NAMES = {
    "Electronics": [
        "UltraBook Pro Laptop", "SmartPhone X12", "Wireless Earbuds Elite",
        "4K Smart TV 55-inch", "Gaming Console Next-Gen", "Digital Camera DSLR",
        "Tablet Pro 12-inch", "Smartwatch Fitness Tracker", "Bluetooth Speaker Portable",
        "External SSD 1TB", "Wireless Mouse Ergonomic", "Mechanical Keyboard RGB"
    ],
    "Clothing": [
        "Cotton T-Shirt Classic", "Denim Jeans Slim Fit", "Running Shoes Athletic",
        "Winter Jacket Waterproof", "Yoga Pants Stretch", "Casual Sneakers Canvas",
        "Dress Shirt Formal", "Hoodie Pullover Fleece", "Shorts Athletic Quick-Dry",
        "Socks Performance Pack"
    ],
    "Books": [
        "Python Programming Guide", "Data Science Handbook", "Machine Learning Basics",
        "Cloud Architecture Patterns", "Web Development Complete", "Database Design Principles",
        "JavaScript Modern Edition", "DevOps Practices", "Cybersecurity Fundamentals",
        "Agile Project Management"
    ],
    "Home & Garden": [
        "Coffee Maker Programmable", "Blender High-Speed", "Air Purifier HEPA",
        "Robot Vacuum Cleaner", "Standing Desk Adjustable", "Office Chair Ergonomic",
        "Garden Tool Set 10-Piece", "LED Desk Lamp Dimmable", "Storage Organizer Bins",
        "Kitchen Knife Set Professional"
    ]
}

PRODUCT_DESCRIPTIONS = {
    "Electronics": [
        "High-performance device with cutting-edge technology and sleek design.",
        "Latest generation featuring advanced processors and extended battery life.",
        "Premium quality with exceptional performance for professionals and enthusiasts.",
        "Innovative features combined with user-friendly interface and durability."
    ],
    "Clothing": [
        "Comfortable fabric with modern style perfect for everyday wear.",
        "Durable construction with breathable materials for all-day comfort.",
        "Stylish design meets functional performance in this versatile piece.",
        "Premium quality materials ensure long-lasting wear and comfort."
    ],
    "Books": [
        "Comprehensive guide covering fundamental concepts and practical applications.",
        "Expert insights with real-world examples and hands-on exercises.",
        "Essential resource for beginners and experienced professionals alike.",
        "In-depth coverage of core principles with modern best practices."
    ],
    "Home & Garden": [
        "Practical solution designed for efficiency and convenience in daily use.",
        "Durable construction with innovative features for modern living spaces.",
        "High-quality materials ensure reliable performance and longevity.",
        "Versatile design suitable for various home and office environments."
    ]
}

TECH_DOC_TITLES = [
    "API Authentication Guide", "RESTful API Design Principles", "Database Migration Tutorial",
    "Containerization Best Practices", "CI/CD Pipeline Setup", "Monitoring and Logging Strategies",
    "Microservices Architecture Overview", "Security Best Practices", "Performance Optimization Techniques",
    "Error Handling and Debugging", "API Rate Limiting Implementation", "Caching Strategies Guide",
    "GraphQL API Development", "WebSocket Integration Tutorial", "OAuth 2.0 Implementation",
    "Service Mesh Configuration", "Kubernetes Deployment Guide", "Infrastructure as Code Basics"
]

TECH_DOC_CONTENT = [
    "This guide covers the fundamentals of implementing secure authentication mechanisms. Learn how to integrate JWT tokens, session management, and OAuth flows into your applications.",
    "Understanding RESTful principles is essential for building scalable APIs. This documentation explains resource modeling, HTTP methods, status codes, and versioning strategies.",
    "Database migrations require careful planning and execution. Follow these steps to safely migrate your production data while minimizing downtime and ensuring data integrity.",
    "Containers provide isolated environments for running applications. This tutorial demonstrates how to create Docker images, manage container lifecycles, and orchestrate deployments.",
    "Continuous integration and deployment automate the software delivery process. Configure pipelines to build, test, and deploy code changes with confidence and speed.",
    "Effective monitoring enables proactive issue detection. Implement comprehensive logging, metrics collection, and alerting to maintain system health and performance.",
    "Microservices architecture breaks monolithic applications into smaller, independent services. Learn the benefits, challenges, and implementation patterns for distributed systems.",
    "Security must be built into every layer of your application. This guide covers common vulnerabilities, encryption methods, and secure coding practices.",
    "Optimizing application performance requires systematic analysis. Profile your code, identify bottlenecks, and apply targeted improvements to reduce latency and resource consumption.",
    "Robust error handling improves user experience and system reliability. Implement comprehensive exception handling, logging, and graceful degradation strategies."
]

BLOG_HEADLINES = [
    "10 Tips for Improving Developer Productivity", "The Future of Cloud Computing in 2025",
    "How AI is Transforming Software Development", "Best Practices for Remote Team Collaboration",
    "Understanding Modern Web Frameworks", "The Rise of Serverless Architecture",
    "Cybersecurity Trends Every Developer Should Know", "Optimizing Database Performance at Scale",
    "Building Resilient Distributed Systems", "The Complete Guide to API Design",
    "Machine Learning for Software Engineers", "DevOps Culture and Practices",
    "Microservices vs Monoliths: Making the Right Choice", "Container Security Best Practices",
    "Scaling Your Application: Lessons Learned", "The Evolution of JavaScript Frameworks"
]

BLOG_CONTENT = [
    "In today's fast-paced development environment, productivity is paramount. These proven strategies help developers maximize their efficiency while maintaining code quality and work-life balance.",
    "Cloud computing continues to evolve with new services, pricing models, and architectural patterns. Explore the trends shaping the future of infrastructure and application deployment.",
    "Artificial intelligence is revolutionizing how we write, test, and deploy code. Discover the tools and techniques that leverage AI to enhance developer workflows and code quality.",
    "Remote work presents unique challenges for software teams. Learn how to foster collaboration, maintain culture, and ensure productivity in distributed environments.",
    "Modern web frameworks offer powerful features but vary in philosophy and implementation. Compare popular options to choose the right framework for your project requirements.",
    "Serverless computing abstracts infrastructure management, enabling developers to focus on code. Understand when serverless makes sense and how to architect applications effectively.",
    "Security threats evolve constantly, requiring developers to stay informed. Explore emerging vulnerabilities, attack vectors, and defensive strategies for modern applications.",
    "Database performance impacts user experience and system scalability. Learn optimization techniques including indexing strategies, query tuning, and caching patterns.",
    "Distributed systems introduce complexity but enable massive scale. Master the patterns, protocols, and practices for building reliable systems that handle failures gracefully.",
    "Well-designed APIs provide intuitive interfaces for developers. Follow these principles to create APIs that are consistent, documented, and easy to integrate."
]

AUTHORS = [
    "Sarah Chen", "Michael Rodriguez", "Emily Watson", "David Kim",
    "Jennifer Liu", "Robert Johnson", "Amanda Foster", "James Wilson"
]

REVIEW_TEXTS = {
    "positive": [
        "Absolutely love this product! Exceeded my expectations in every way. The quality is outstanding and it arrived quickly.",
        "Best purchase I've made in a long time. Highly recommend to anyone looking for a reliable and high-quality option.",
        "Fantastic quality and great value for money. Works exactly as described and the customer service was excellent.",
        "Incredibly impressed with this product. It's well-made, durable, and performs better than I anticipated.",
        "Five stars all the way! This has made such a difference and I couldn't be happier with my purchase."
    ],
    "neutral": [
        "The product is decent and does what it's supposed to do. Nothing exceptional but it works fine for my needs.",
        "It's okay for the price. There are some minor issues but overall it gets the job done adequately.",
        "Average product that meets basic expectations. Not amazing but not terrible either.",
        "Works as advertised though I expected slightly better quality. It's acceptable for everyday use."
    ],
    "negative": [
        "Very disappointed with this purchase. The quality is poor and it doesn't work as described. Would not recommend.",
        "Waste of money. Stopped working after just a few days and customer service was unhelpful.",
        "Not worth the price at all. Cheap materials and doesn't perform as advertised. Returning it.",
        "Really unhappy with this product. Multiple defects and poor construction. Save your money and buy something else."
    ]
}


def generate_e_commerce_products() -> List[Dict[str, Any]]:
    """Generate realistic e-commerce product documents."""
    products = []
    logging.info(f"Generating {DOMAINS['e_commerce']} e-commerce products...")

    for i in range(DOMAINS['e_commerce']):
        category = random.choice(PRODUCT_CATEGORIES)
        product_name = random.choice(PRODUCT_NAMES[category])
        description = random.choice(PRODUCT_DESCRIPTIONS[category])

        if random.random() > 0.7:
            product_name += f" {random.choice(['Pro', 'Plus', 'Elite', 'Premium', 'Standard'])}"

        product = {
            "domain": "e_commerce",
            "product_name": product_name,
            "description": description,
            "category": category,
            "price": round(random.uniform(10.0, 500.0), 2),
            "popularity_score": random.randint(1, 100),
            "in_stock": random.random() > 0.2
        }
        products.append(product)

    logging.info(f"Generated {len(products)} e-commerce products")
    return products


def generate_technical_docs() -> List[Dict[str, Any]]:
    """Generate realistic technical documentation documents."""
    docs = []
    logging.info(f"Generating {DOMAINS['technical_docs']} technical documentation documents...")

    versions = ["1.0", "1.5", "2.0", "2.5", "3.0"]

    for i in range(DOMAINS['technical_docs']):
        title = random.choice(TECH_DOC_TITLES)
        content = random.choice(TECH_DOC_CONTENT)

        if random.random() > 0.6:
            title += f" v{random.choice(versions)}"

        days_ago = random.randint(0, 365)
        last_updated = (datetime.now() - timedelta(days=days_ago)).isoformat()

        doc = {
            "domain": "technical_docs",
            "title": title,
            "content": content,
            "version": random.choice(versions),
            "last_updated": last_updated,
            "difficulty_level": random.randint(1, 5)
        }
        docs.append(doc)

    logging.info(f"Generated {len(docs)} technical documentation documents")
    return docs


def generate_blog_articles() -> List[Dict[str, Any]]:
    """Generate realistic blog article documents."""
    articles = []
    logging.info(f"Generating {DOMAINS['blog_articles']} blog articles...")

    for i in range(DOMAINS['blog_articles']):
        headline = random.choice(BLOG_HEADLINES)
        body_text = random.choice(BLOG_CONTENT)

        if random.random() > 0.7:
            suffix = random.choice([
                ": A Complete Guide", " - Updated 2025", ": What You Need to Know",
                " in Production", ": Practical Examples"
            ])
            headline += suffix

        days_ago = int(random.expovariate(1/180))
        days_ago = min(days_ago, 730)
        publish_date = (datetime.now() - timedelta(days=days_ago)).isoformat()

        article = {
            "domain": "blog_articles",
            "headline": headline,
            "body_text": body_text,
            "author": random.choice(AUTHORS),
            "publish_date": publish_date,
            "read_count": random.randint(0, 10000)
        }
        articles.append(article)

    logging.info(f"Generated {len(articles)} blog articles")
    return articles


def generate_reviews() -> List[Dict[str, Any]]:
    """Generate realistic user review documents."""
    reviews = []
    logging.info(f"Generating {DOMAINS['reviews']} user reviews...")

    positive_count = int(DOMAINS['reviews'] * 0.6)
    neutral_count = int(DOMAINS['reviews'] * 0.2)
    negative_count = DOMAINS['reviews'] - positive_count - neutral_count

    sentiments = (
        ['positive'] * positive_count +
        ['neutral'] * neutral_count +
        ['negative'] * negative_count
    )
    random.shuffle(sentiments)

    for i, sentiment in enumerate(sentiments):
        review_text = random.choice(REVIEW_TEXTS[sentiment])

        if sentiment == 'positive':
            rating = random.randint(4, 5)
        elif sentiment == 'neutral':
            rating = 3
        else:
            rating = random.randint(1, 2)

        review = {
            "domain": "reviews",
            "review_text": review_text,
            "rating": rating,
            "verified_purchase": random.random() > 0.3,
            "sentiment_label": sentiment,
            "helpful_count": random.randint(0, 500)
        }
        reviews.append(review)

    logging.info(f"Generated {len(reviews)} user reviews")
    return reviews


def main() -> None:
    """Main execution function."""
    random.seed(SEED)

    logging.info("Starting document generation...")
    logging.info(f"Target: {sum(DOMAINS.values())} total documents")

    all_documents = []
    all_documents.extend(generate_e_commerce_products())
    all_documents.extend(generate_technical_docs())
    all_documents.extend(generate_blog_articles())
    all_documents.extend(generate_reviews())

    current_time = datetime.now().isoformat()
    for doc in all_documents:
        doc['id'] = str(uuid.uuid4())
        doc['indexed_at'] = current_time

    random.shuffle(all_documents)

    try:
        with open(OUTPUT_FILE, 'w') as f:
            for doc in all_documents:
                f.write(json.dumps(doc) + '\n')

        logging.info(f"Successfully generated {len(all_documents)} documents to {OUTPUT_FILE}")

    except Exception as e:
        logging.error(f"Failed to write output file: {e}")
        raise


if __name__ == "__main__":
    main()
