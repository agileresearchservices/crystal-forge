#!/usr/bin/env python3
"""
OpenSearch Demo Data Generator

Generates 1000 realistic documents across 4 domains:
- E-commerce products (350)
- Technical documentation (300)
- Blog articles (200)
- User reviews (150)

All data generation is deterministic for reproducibility.
Uses compositional text generation to maximize content variety
for full-text search demonstrations.
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

# --------------------------------------------------------------------------
# E-Commerce Data Pools
# --------------------------------------------------------------------------

PRODUCT_CATEGORIES = ["Electronics", "Clothing", "Books", "Home & Garden"]

PRODUCT_NAMES = {
    "Electronics": [
        "UltraBook Pro Laptop", "SmartPhone X12", "Wireless Earbuds Elite",
        "4K Smart TV 55-inch", "Gaming Console Next-Gen", "Digital Camera DSLR",
        "Tablet Pro 12-inch", "Smartwatch Fitness Tracker", "Bluetooth Speaker Portable",
        "External SSD 1TB", "Wireless Mouse Ergonomic", "Mechanical Keyboard RGB",
        "Noise-Cancelling Headphones", "Portable Power Bank 20000mAh",
        "USB-C Docking Station", "Mesh WiFi Router System",
        "Action Camera Waterproof", "E-Reader Paperlight",
        "Wireless Charging Pad", "Smart Home Hub Controller",
    ],
    "Clothing": [
        "Cotton T-Shirt Classic", "Denim Jeans Slim Fit", "Running Shoes Athletic",
        "Winter Jacket Waterproof", "Yoga Pants Stretch", "Casual Sneakers Canvas",
        "Dress Shirt Formal", "Hoodie Pullover Fleece", "Shorts Athletic Quick-Dry",
        "Socks Performance Pack", "Wool Sweater Knit", "Rain Jacket Lightweight",
        "Hiking Boots Rugged", "Linen Pants Relaxed", "Compression Leggings Sport",
        "Windbreaker Jacket Packable", "Polo Shirt Moisture-Wicking",
        "Cargo Pants Utility", "Trail Running Shoes Grip",
        "Thermal Underwear Base Layer",
    ],
    "Books": [
        "Python Programming Guide", "Data Science Handbook", "Machine Learning Basics",
        "Cloud Architecture Patterns", "Web Development Complete", "Database Design Principles",
        "JavaScript Modern Edition", "DevOps Practices", "Cybersecurity Fundamentals",
        "Agile Project Management", "System Design Interview", "Distributed Systems Concepts",
        "Clean Code Principles", "API Design Patterns", "Rust Programming Language",
        "Kubernetes in Action", "Site Reliability Engineering", "Data Engineering Pipelines",
        "Natural Language Processing", "Computer Networking Essentials",
    ],
    "Home & Garden": [
        "Coffee Maker Programmable", "Blender High-Speed", "Air Purifier HEPA",
        "Robot Vacuum Cleaner", "Standing Desk Adjustable", "Office Chair Ergonomic",
        "Garden Tool Set 10-Piece", "LED Desk Lamp Dimmable", "Storage Organizer Bins",
        "Kitchen Knife Set Professional", "Instant Pot Pressure Cooker",
        "Dehumidifier Portable", "Smart Thermostat WiFi", "Cast Iron Skillet Pre-Seasoned",
        "Electric Kettle Temperature Control", "Indoor Herb Garden Kit",
        "Cordless Drill Set", "Memory Foam Mattress Topper",
        "Bamboo Cutting Board Set", "Stainless Steel Water Bottle Insulated",
    ],
}

# Compositional product description fragments for rich variety
PRODUCT_DESC_OPENERS = {
    "Electronics": [
        "High-performance device with cutting-edge technology and sleek design.",
        "Latest generation featuring advanced processors and extended battery life.",
        "Premium quality with exceptional performance for professionals and enthusiasts.",
        "Innovative features combined with user-friendly interface and durability.",
        "Industry-leading specifications packed into a compact, portable form factor.",
        "Professional-grade electronics engineered for demanding workflows and creative tasks.",
        "Next-generation technology delivering unprecedented speed and reliability.",
        "Designed for power users who need uncompromising performance and connectivity.",
    ],
    "Clothing": [
        "Comfortable fabric with modern style perfect for everyday wear.",
        "Durable construction with breathable materials for all-day comfort.",
        "Stylish design meets functional performance in this versatile piece.",
        "Premium quality materials ensure long-lasting wear and comfort.",
        "Engineered with advanced moisture-wicking fabric technology.",
        "Sustainably sourced materials crafted with attention to detail.",
        "Designed for active lifestyles with four-way stretch flexibility.",
        "Classic silhouette updated with contemporary fits and finishes.",
    ],
    "Books": [
        "Comprehensive guide covering fundamental concepts and practical applications.",
        "Expert insights with real-world examples and hands-on exercises.",
        "Essential resource for beginners and experienced professionals alike.",
        "In-depth coverage of core principles with modern best practices.",
        "Thoroughly updated edition with the latest industry standards and techniques.",
        "Written by seasoned practitioners with decades of combined experience.",
        "Step-by-step tutorials paired with challenging projects and exercises.",
        "Bridge the gap between theory and practice with battle-tested approaches.",
    ],
    "Home & Garden": [
        "Practical solution designed for efficiency and convenience in daily use.",
        "Durable construction with innovative features for modern living spaces.",
        "High-quality materials ensure reliable performance and longevity.",
        "Versatile design suitable for various home and office environments.",
        "Professional-grade quality at a price point accessible for home use.",
        "Space-saving design that maximizes functionality without clutter.",
        "Eco-friendly materials combined with energy-efficient operation.",
        "Thoughtfully designed to simplify everyday tasks and routines.",
    ],
}

PRODUCT_DESC_DETAILS = {
    "Electronics": [
        "Features include fast wireless charging, multi-device connectivity via Bluetooth 5.3, and an intuitive touch interface.",
        "Built with aerospace-grade aluminum and Gorilla Glass for superior durability in everyday use.",
        "Includes advanced noise cancellation, spatial audio support, and crystal-clear microphone array for calls.",
        "Equipped with AI-powered optimization that adapts to your usage patterns for improved battery efficiency.",
        "Ships with a comprehensive accessory kit including cables, adapters, and a premium carrying case.",
        "Supports the latest WiFi 6E standard for blazing fast connectivity and reduced latency.",
        "Integrated thermal management system ensures sustained peak performance without throttling.",
        "Compatible with all major platforms including iOS, Android, Windows, macOS, and Linux.",
    ],
    "Clothing": [
        "Features reinforced stitching at stress points and flatlock seams to prevent chafing during movement.",
        "Available in a wide range of sizes from XS to 3XL with an inclusive fit guide for every body type.",
        "Machine washable with color-fast dyes that maintain vibrancy through hundreds of wash cycles.",
        "Includes reflective accents for visibility in low-light conditions during outdoor activities.",
        "Made with recycled polyester fibers and organic cotton blends certified by OEKO-TEX Standard.",
        "Features hidden zippered pockets for secure storage of essentials during workouts and travel.",
        "Treated with antimicrobial finish to reduce odor and keep you feeling fresh throughout the day.",
        "Designed with ergonomic paneling that follows natural body contours for unrestricted movement.",
    ],
    "Books": [
        "Includes over 200 code examples with a companion GitHub repository for hands-on practice.",
        "Features end-of-chapter quizzes, review questions, and three capstone projects to test your knowledge.",
        "Covers everything from beginner fundamentals to advanced architectural patterns used in production systems.",
        "Each chapter builds on the previous one, creating a structured learning path from basics to mastery.",
        "Written in clear, jargon-free language with diagrams and illustrations that make complex concepts accessible.",
        "Includes interviews with industry leaders sharing real-world insights from companies like Google and Netflix.",
        "Provides downloadable cheat sheets, reference cards, and a quick-start guide for immediate productivity.",
        "Addresses common pitfalls, anti-patterns, and debugging strategies encountered in professional environments.",
    ],
    "Home & Garden": [
        "Easy to assemble in under 30 minutes with included tools and step-by-step illustrated instructions.",
        "Backed by a 5-year manufacturer warranty with responsive customer support and free replacements.",
        "Features a compact footprint that fits perfectly in apartments, condos, and smaller living spaces.",
        "Made from BPA-free, food-grade materials that are dishwasher safe for hassle-free cleaning.",
        "Includes smart home integration with Alexa, Google Home, and Apple HomeKit for voice control.",
        "Energy Star certified to reduce electricity consumption by up to 40% compared to standard models.",
        "Constructed with rust-resistant stainless steel and UV-resistant materials for indoor and outdoor use.",
        "Modular design allows customization and expansion as your needs grow over time.",
    ],
}

PRODUCT_TAGS = {
    "Electronics": [
        "electronics", "tech", "gadgets", "portable", "wireless", "smart",
        "premium", "professional", "compact", "rechargeable", "fast-charging",
        "bluetooth", "usb-c", "high-resolution", "noise-cancelling",
    ],
    "Clothing": [
        "clothing", "apparel", "fashion", "athletic", "casual", "outdoor",
        "sustainable", "moisture-wicking", "breathable", "durable", "comfortable",
        "waterproof", "lightweight", "eco-friendly", "activewear",
    ],
    "Books": [
        "books", "education", "programming", "technical", "reference",
        "tutorial", "beginner-friendly", "advanced", "hands-on", "bestseller",
        "software-engineering", "computer-science", "practical", "illustrated",
    ],
    "Home & Garden": [
        "home", "kitchen", "garden", "furniture", "appliance", "smart-home",
        "energy-efficient", "compact", "modular", "durable", "eco-friendly",
        "workspace", "organization", "outdoor", "stainless-steel",
    ],
}

PRODUCT_STATUSES = ["active", "active", "active", "active", "discontinued", "clearance", "pre-order", "back-ordered"]

# --------------------------------------------------------------------------
# Technical Documentation Data Pools
# --------------------------------------------------------------------------

TECH_DOC_TITLES = [
    "API Authentication Guide", "RESTful API Design Principles", "Database Migration Tutorial",
    "Containerization Best Practices", "CI/CD Pipeline Setup", "Monitoring and Logging Strategies",
    "Microservices Architecture Overview", "Security Best Practices", "Performance Optimization Techniques",
    "Error Handling and Debugging", "API Rate Limiting Implementation", "Caching Strategies Guide",
    "GraphQL API Development", "WebSocket Integration Tutorial", "OAuth 2.0 Implementation",
    "Service Mesh Configuration", "Kubernetes Deployment Guide", "Infrastructure as Code Basics",
    "Event-Driven Architecture Patterns", "Message Queue Configuration",
    "Load Balancing Strategies", "Data Serialization Formats",
    "Blue-Green Deployment Guide", "Canary Release Implementation",
    "Circuit Breaker Pattern Tutorial", "Distributed Tracing Setup",
    "Secret Management Best Practices", "API Gateway Configuration",
    "Database Sharding Strategies", "Full-Text Search Implementation",
]

TECH_DOC_CONTENT_INTROS = [
    "This guide covers the fundamentals of implementing secure authentication mechanisms. Learn how to integrate JWT tokens, session management, and OAuth flows into your applications.",
    "Understanding RESTful principles is essential for building scalable APIs. This documentation explains resource modeling, HTTP methods, status codes, and versioning strategies.",
    "Database migrations require careful planning and execution. Follow these steps to safely migrate your production data while minimizing downtime and ensuring data integrity.",
    "Containers provide isolated environments for running applications. This tutorial demonstrates how to create Docker images, manage container lifecycles, and orchestrate deployments.",
    "Continuous integration and deployment automate the software delivery process. Configure pipelines to build, test, and deploy code changes with confidence and speed.",
    "Effective monitoring enables proactive issue detection. Implement comprehensive logging, metrics collection, and alerting to maintain system health and performance.",
    "Microservices architecture breaks monolithic applications into smaller, independent services. Learn the benefits, challenges, and implementation patterns for distributed systems.",
    "Security must be built into every layer of your application. This guide covers common vulnerabilities, encryption methods, and secure coding practices.",
    "Optimizing application performance requires systematic analysis. Profile your code, identify bottlenecks, and apply targeted improvements to reduce latency and resource consumption.",
    "Robust error handling improves user experience and system reliability. Implement comprehensive exception handling, logging, and graceful degradation strategies.",
    "Event-driven architectures decouple producers and consumers through asynchronous messaging. This pattern enables scalable, resilient systems that respond to changes in real time.",
    "Message queues like Kafka and RabbitMQ provide reliable asynchronous communication between services. Configure topics, partitions, and consumer groups for optimal throughput.",
    "Load balancing distributes incoming traffic across multiple server instances. Choose between round-robin, least connections, and weighted algorithms based on your workload characteristics.",
    "Full-text search engines like OpenSearch power sophisticated content discovery. Configure analyzers, tokenizers, and scoring algorithms to deliver relevant results to users.",
    "Circuit breakers prevent cascading failures in distributed systems. Implement the pattern with configurable thresholds, timeouts, and fallback mechanisms.",
]

TECH_DOC_CONTENT_DETAILS = [
    "Begin by configuring your development environment with the required dependencies. Ensure you have the latest SDK version installed and verify connectivity to your staging cluster before proceeding.",
    "The implementation follows a layered architecture where each component has a single responsibility. This separation of concerns makes the system easier to test, maintain, and extend over time.",
    "Error scenarios are handled through a retry mechanism with exponential backoff. Failed operations are logged to a dead-letter queue for manual review and reprocessing when the root cause is resolved.",
    "Performance benchmarks show a 3x improvement in response times after applying the optimizations described in this section. Memory usage decreases by approximately 40% under sustained load.",
    "Configuration is managed through environment variables and a centralized configuration service. Secrets are stored in an encrypted vault and rotated automatically every 90 days.",
    "The migration process includes automated rollback capabilities. If any step fails validation, the system reverts to the previous state without data loss or service interruption.",
    "Monitoring dashboards provide real-time visibility into system health metrics. Set up alerts for CPU usage exceeding 80%, memory consumption above 90%, and error rates surpassing 1%.",
    "Integration tests verify end-to-end functionality across service boundaries. Use contract testing to ensure API compatibility between producer and consumer services as they evolve independently.",
    "Security headers are configured at the reverse proxy level to enforce HTTPS, prevent clickjacking, and mitigate cross-site scripting attacks across all endpoints.",
    "Horizontal scaling is achieved by adding stateless service instances behind a load balancer. Session state is externalized to Redis, enabling any instance to handle any request.",
]

TECH_DOC_TAGS = [
    "api", "authentication", "security", "deployment", "docker", "kubernetes",
    "monitoring", "performance", "database", "migration", "microservices",
    "ci-cd", "testing", "caching", "architecture", "devops", "cloud",
    "networking", "configuration", "troubleshooting", "best-practices",
    "scalability", "reliability", "observability", "infrastructure",
]

# --------------------------------------------------------------------------
# Blog Article Data Pools
# --------------------------------------------------------------------------

BLOG_HEADLINES = [
    "10 Tips for Improving Developer Productivity", "The Future of Cloud Computing in 2025",
    "How AI is Transforming Software Development", "Best Practices for Remote Team Collaboration",
    "Understanding Modern Web Frameworks", "The Rise of Serverless Architecture",
    "Cybersecurity Trends Every Developer Should Know", "Optimizing Database Performance at Scale",
    "Building Resilient Distributed Systems", "The Complete Guide to API Design",
    "Machine Learning for Software Engineers", "DevOps Culture and Practices",
    "Microservices vs Monoliths: Making the Right Choice", "Container Security Best Practices",
    "Scaling Your Application: Lessons Learned", "The Evolution of JavaScript Frameworks",
    "Why Rust is Gaining Momentum in Systems Programming", "GraphQL vs REST: A Practical Comparison",
    "Implementing Zero Trust Security Architecture", "The State of WebAssembly in 2025",
    "Building Real-Time Applications with WebSockets", "Effective Code Review Practices for Teams",
    "Data Pipeline Architecture for Modern Analytics", "Edge Computing: Bringing Processing Closer to Users",
    "Observability Beyond Monitoring: Traces, Metrics, and Logs",
    "Platform Engineering: The Next Evolution of DevOps",
    "Search Relevancy Tuning: A Practical Guide",
    "Building Accessible Web Applications from the Ground Up",
]

BLOG_CONTENT_INTROS = [
    "In today's fast-paced development environment, productivity is paramount. These proven strategies help developers maximize their efficiency while maintaining code quality and work-life balance.",
    "Cloud computing continues to evolve with new services, pricing models, and architectural patterns. Explore the trends shaping the future of infrastructure and application deployment.",
    "Artificial intelligence is revolutionizing how we write, test, and deploy code. Discover the tools and techniques that leverage AI to enhance developer workflows and code quality.",
    "Remote work presents unique challenges for software teams. Learn how to foster collaboration, maintain culture, and ensure productivity in distributed environments.",
    "Modern web frameworks offer powerful features but vary in philosophy and implementation. Compare popular options to choose the right framework for your project requirements.",
    "Serverless computing abstracts infrastructure management, enabling developers to focus on code. Understand when serverless makes sense and how to architect applications effectively.",
    "Security threats evolve constantly, requiring developers to stay informed. Explore emerging vulnerabilities, attack vectors, and defensive strategies for modern applications.",
    "Database performance impacts user experience and system scalability. Learn optimization techniques including indexing strategies, query tuning, and caching patterns.",
    "Distributed systems introduce complexity but enable massive scale. Master the patterns, protocols, and practices for building reliable systems that handle failures gracefully.",
    "Well-designed APIs provide intuitive interfaces for developers. Follow these principles to create APIs that are consistent, documented, and easy to integrate.",
    "Search relevancy is both an art and a science. Understanding how scoring algorithms like BM25 work helps you tune field boosting, analyzers, and query structures for better results.",
    "Web accessibility is not optional, it is a fundamental requirement for inclusive software. Implementing WCAG guidelines from the start saves time and creates better user experiences for everyone.",
    "Platform engineering teams build internal developer platforms that abstract infrastructure complexity. This approach improves developer experience while maintaining operational excellence.",
    "Edge computing moves processing closer to where data is generated, reducing latency and bandwidth costs. Learn how edge architectures complement cloud-native applications.",
    "Observability goes beyond simple monitoring by providing deep insights into system behavior through correlated traces, structured logs, and dimensional metrics.",
]

BLOG_CONTENT_BODIES = [
    "The key insight from our experience is that incremental adoption works far better than big-bang migrations. Teams that gradually introduced new practices saw higher adoption rates and fewer production incidents.",
    "We surveyed over 500 engineering teams across different industries to understand which approaches yielded the best outcomes. The data reveals surprising patterns about tool selection and team structure.",
    "One common mistake is over-engineering the initial solution. Start with the simplest architecture that solves the problem, then iterate based on real usage patterns and measured bottlenecks.",
    "The return on investment becomes clear within the first quarter of adoption. Teams reported 30% faster delivery cycles and 50% fewer rollback incidents after implementing these practices.",
    "Cross-functional collaboration is essential for success. Engineers, product managers, and operations teams must align on shared metrics and communicate through well-defined interfaces.",
    "Testing strategies should evolve with the architecture. Unit tests catch logic errors, integration tests verify interactions, and chaos engineering validates resilience under unexpected conditions.",
    "Documentation is often undervalued but pays enormous dividends. Teams with comprehensive, up-to-date documentation onboard new members 3x faster and resolve incidents more quickly.",
    "The open-source ecosystem provides mature, battle-tested tools for most common challenges. Evaluate existing solutions before building custom infrastructure that requires ongoing maintenance.",
    "Metrics-driven decision making eliminates guesswork. Instrument your applications with structured logging and distributed tracing to build a data-driven understanding of system behavior.",
    "Developer experience directly impacts productivity and retention. Invest in fast feedback loops, clear error messages, and self-service tooling to keep engineers focused on solving business problems.",
]

BLOG_TAGS = [
    "engineering", "productivity", "cloud", "ai", "machine-learning", "devops",
    "security", "architecture", "web-development", "javascript", "python",
    "career", "leadership", "best-practices", "tutorial", "opinion",
    "performance", "scalability", "testing", "open-source", "accessibility",
    "search", "data-engineering", "platform-engineering", "observability",
]

AUTHORS = [
    "Sarah Chen", "Michael Rodriguez", "Emily Watson", "David Kim",
    "Jennifer Liu", "Robert Johnson", "Amanda Foster", "James Wilson",
    "Priya Patel", "Carlos Mendez", "Lisa Thompson", "Alex Nguyen",
]

# --------------------------------------------------------------------------
# Review Data Pools
# --------------------------------------------------------------------------

REVIEW_TEXTS = {
    "positive": [
        "Absolutely love this product! Exceeded my expectations in every way. The quality is outstanding and it arrived quickly.",
        "Best purchase I've made in a long time. Highly recommend to anyone looking for a reliable and high-quality option.",
        "Fantastic quality and great value for money. Works exactly as described and the customer service was excellent.",
        "Incredibly impressed with this product. It's well-made, durable, and performs better than I anticipated.",
        "Five stars all the way! This has made such a difference and I couldn't be happier with my purchase.",
        "Exceeded every expectation. The build quality is phenomenal and it integrates seamlessly into my daily workflow.",
        "After extensive research, I chose this product and I'm so glad I did. Performance is consistently top-notch.",
        "Outstanding experience from ordering to delivery. The product works flawlessly and the packaging was thoughtful.",
        "This is exactly what I was looking for. Setup was straightforward and the results are impressive.",
        "Purchased this as a gift and the recipient was thrilled. Premium feel and excellent functionality throughout.",
    ],
    "neutral": [
        "The product is decent and does what it's supposed to do. Nothing exceptional but it works fine for my needs.",
        "It's okay for the price. There are some minor issues but overall it gets the job done adequately.",
        "Average product that meets basic expectations. Not amazing but not terrible either.",
        "Works as advertised though I expected slightly better quality. It's acceptable for everyday use.",
        "Solid middle-of-the-road option. Does what it claims but doesn't particularly stand out from competitors.",
        "Functional but unexciting. The core features work well but the fit and finish could be improved.",
        "Good enough for the price point. I've seen better but also much worse at this range.",
        "It serves its purpose. Installation was a bit fiddly but once set up it works reliably enough.",
    ],
    "negative": [
        "Very disappointed with this purchase. The quality is poor and it doesn't work as described. Would not recommend.",
        "Waste of money. Stopped working after just a few days and customer service was unhelpful.",
        "Not worth the price at all. Cheap materials and doesn't perform as advertised. Returning it.",
        "Really unhappy with this product. Multiple defects and poor construction. Save your money and buy something else.",
        "Arrived damaged and the replacement process was frustrating. The product itself feels flimsy and poorly designed.",
        "Does not match the product description at all. Colors are wrong, dimensions are off, and it feels cheap.",
        "Broke within the first week of normal use. Quality control seems non-existent for this manufacturer.",
    ],
}

REVIEW_DETAIL_SENTENCES = [
    "I've been using it daily for the past month and can confidently share my experience.",
    "Compared to similar products in this price range, this one holds up reasonably well.",
    "The packaging was secure and everything arrived in perfect condition with clear instructions.",
    "Customer support was responsive when I reached out with a question about setup.",
    "I would consider purchasing from this brand again based on this experience.",
    "The product photos are accurate and what you see is what you get.",
    "Delivery was faster than expected, arriving two days ahead of the estimated date.",
    "I've recommended this to several friends and colleagues who have similar needs.",
    "Battery life is impressive and lasts through a full day of heavy usage without issues.",
    "The user manual could be more detailed but online resources fill in the gaps.",
]

REVIEW_TAGS = [
    "review", "customer-feedback", "product-review", "verified", "helpful",
    "detailed-review", "comparison", "unboxing", "long-term-use", "recommendation",
]


def generate_e_commerce_products() -> List[Dict[str, Any]]:
    """Generate realistic e-commerce product documents with rich text content."""
    products = []
    logging.info(f"Generating {DOMAINS['e_commerce']} e-commerce products...")

    for i in range(DOMAINS['e_commerce']):
        category = random.choice(PRODUCT_CATEGORIES)
        product_name = random.choice(PRODUCT_NAMES[category])
        opener = random.choice(PRODUCT_DESC_OPENERS[category])
        detail = random.choice(PRODUCT_DESC_DETAILS[category])
        description = f"{opener} {detail}"

        if random.random() > 0.7:
            product_name += f" {random.choice(['Pro', 'Plus', 'Elite', 'Premium', 'Standard'])}"

        # Generate 2-4 relevant tags
        tag_pool = PRODUCT_TAGS[category]
        num_tags = random.randint(2, 4)
        tags = random.sample(tag_pool, min(num_tags, len(tag_pool)))

        product = {
            "domain": "e_commerce",
            "product_name": product_name,
            "description": description,
            "category": category,
            "price": round(random.uniform(10.0, 500.0), 2),
            "popularity_score": random.randint(1, 100),
            "in_stock": random.random() > 0.2,
            "tags": tags,
            "status": random.choice(PRODUCT_STATUSES),
        }
        products.append(product)

    logging.info(f"Generated {len(products)} e-commerce products")
    return products


def generate_technical_docs() -> List[Dict[str, Any]]:
    """Generate realistic technical documentation with compositional content."""
    docs = []
    logging.info(f"Generating {DOMAINS['technical_docs']} technical documentation documents...")

    versions = ["1.0", "1.5", "2.0", "2.5", "3.0"]

    for i in range(DOMAINS['technical_docs']):
        title = random.choice(TECH_DOC_TITLES)
        intro = random.choice(TECH_DOC_CONTENT_INTROS)
        detail = random.choice(TECH_DOC_CONTENT_DETAILS)
        content = f"{intro}\n\n{detail}"

        if random.random() > 0.6:
            title += f" v{random.choice(versions)}"

        days_ago = random.randint(0, 365)
        last_updated = (datetime.now() - timedelta(days=days_ago)).isoformat()

        # Generate 2-4 relevant tags
        num_tags = random.randint(2, 4)
        tags = random.sample(TECH_DOC_TAGS, min(num_tags, len(TECH_DOC_TAGS)))

        doc = {
            "domain": "technical_docs",
            "title": title,
            "content": content,
            "version": random.choice(versions),
            "last_updated": last_updated,
            "difficulty_level": random.randint(1, 5),
            "tags": tags,
        }
        docs.append(doc)

    logging.info(f"Generated {len(docs)} technical documentation documents")
    return docs


def generate_blog_articles() -> List[Dict[str, Any]]:
    """Generate realistic blog articles with compositional content."""
    articles = []
    logging.info(f"Generating {DOMAINS['blog_articles']} blog articles...")

    for i in range(DOMAINS['blog_articles']):
        headline = random.choice(BLOG_HEADLINES)
        intro = random.choice(BLOG_CONTENT_INTROS)
        body_detail = random.choice(BLOG_CONTENT_BODIES)
        body_text = f"{intro}\n\n{body_detail}"

        if random.random() > 0.7:
            suffix = random.choice([
                ": A Complete Guide", " - Updated 2025", ": What You Need to Know",
                " in Production", ": Practical Examples"
            ])
            headline += suffix

        days_ago = int(random.expovariate(1/180))
        days_ago = min(days_ago, 730)
        publish_date = (datetime.now() - timedelta(days=days_ago)).isoformat()

        # Generate 2-5 relevant tags
        num_tags = random.randint(2, 5)
        tags = random.sample(BLOG_TAGS, min(num_tags, len(BLOG_TAGS)))

        article = {
            "domain": "blog_articles",
            "headline": headline,
            "body_text": body_text,
            "author": random.choice(AUTHORS),
            "publish_date": publish_date,
            "read_count": random.randint(0, 10000),
            "tags": tags,
        }
        articles.append(article)

    logging.info(f"Generated {len(articles)} blog articles")
    return articles


def generate_reviews() -> List[Dict[str, Any]]:
    """Generate realistic user reviews with varied text content."""
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
        # Add a detail sentence for richer text content
        detail = random.choice(REVIEW_DETAIL_SENTENCES)
        review_text = f"{review_text} {detail}"

        if sentiment == 'positive':
            rating = random.randint(4, 5)
        elif sentiment == 'neutral':
            rating = 3
        else:
            rating = random.randint(1, 2)

        # Generate 1-3 relevant tags
        num_tags = random.randint(1, 3)
        tags = random.sample(REVIEW_TAGS, min(num_tags, len(REVIEW_TAGS)))

        review = {
            "domain": "reviews",
            "review_text": review_text,
            "rating": rating,
            "verified_purchase": random.random() > 0.3,
            "sentiment_label": sentiment,
            "helpful_count": random.randint(0, 500),
            "tags": tags,
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
