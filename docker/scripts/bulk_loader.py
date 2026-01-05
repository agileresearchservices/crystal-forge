#!/usr/bin/env python3
"""
OpenSearch Bulk Data Loader

Loads generated documents into OpenSearch with comprehensive error handling,
validation, and progress tracking.
"""

import json
import os
import time
import logging
from typing import Tuple
from urllib.parse import urlparse
from opensearchpy import OpenSearch

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Configuration parameters - read from environment
OPENSEARCH_URL = os.environ.get("OPENSEARCH_HOST", "http://localhost:9200")
parsed_url = urlparse(OPENSEARCH_URL)
OPENSEARCH_HOST = parsed_url.hostname or "localhost"
OPENSEARCH_PORT = parsed_url.port or 9200

INDEX_NAME = "opensearch-demo"
INPUT_FILE = "generated_documents.json"
MAPPINGS_FILE = "index_mappings.json"
BATCH_SIZE = 100
MAX_RETRIES = 5
CONNECTION_TIMEOUT = 30


def check_opensearch_connection(client: OpenSearch) -> bool:
    """
    Verify OpenSearch cluster is running and healthy.

    Args:
        client: OpenSearch client instance

    Returns:
        True if connection is successful and cluster is healthy

    Raises:
        Exception if unable to connect after MAX_RETRIES attempts
    """
    logging.info(f"Checking OpenSearch connection to {OPENSEARCH_HOST}:{OPENSEARCH_PORT}...")

    for retry in range(MAX_RETRIES):
        try:
            # Check if cluster is reachable
            health = client.cluster.health()
            status = health['status']

            logging.info(f"Cluster health: {status}")
            logging.info(f"Cluster name: {health['cluster_name']}")
            logging.info(f"Number of nodes: {health['number_of_nodes']}")

            if status in ['yellow', 'green']:
                logging.info("OpenSearch cluster is healthy and ready")
                return True
            else:
                logging.warning(f"Cluster status is {status}, waiting...")

        except Exception as e:
            wait_time = 2 ** retry
            logging.warning(f"Connection attempt {retry + 1}/{MAX_RETRIES} failed: {e}")

            if retry < MAX_RETRIES - 1:
                logging.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise Exception(f"Failed to connect to OpenSearch after {MAX_RETRIES} attempts: {e}")

    return False


def create_index_with_mappings(client: OpenSearch, index_name: str) -> None:
    """
    Create OpenSearch index with mappings from configuration file.

    Args:
        client: OpenSearch client instance
        index_name: Name of the index to create

    Raises:
        Exception if unable to load mappings or create index
    """
    logging.info(f"Creating index '{index_name}' with mappings...")

    try:
        # Load mappings from file
        with open(MAPPINGS_FILE, 'r') as f:
            mappings_config = json.load(f)

        # Delete existing index if present (for idempotency)
        if client.indices.exists(index=index_name):
            logging.warning(f"Index '{index_name}' already exists, deleting...")
            client.indices.delete(index=index_name)
            logging.info(f"Deleted existing index '{index_name}'")

        # Create index with mappings
        response = client.indices.create(
            index=index_name,
            body=mappings_config
        )

        if response.get('acknowledged'):
            logging.info(f"Index '{index_name}' created successfully")
        else:
            raise Exception(f"Index creation not acknowledged: {response}")

    except FileNotFoundError:
        raise Exception(f"Mappings file not found: {MAPPINGS_FILE}")
    except json.JSONDecodeError as e:
        raise Exception(f"Invalid JSON in mappings file: {e}")
    except Exception as e:
        raise Exception(f"Failed to create index: {e}")


def load_documents(client: OpenSearch, index_name: str, input_file: str) -> Tuple[int, int]:
    """
    Load documents from file into OpenSearch using bulk API.

    Args:
        client: OpenSearch client instance
        index_name: Target index name
        input_file: Path to line-delimited JSON file

    Returns:
        Tuple of (successful_count, failed_count)

    Raises:
        Exception if unable to read input file
    """
    logging.info(f"Loading documents from '{input_file}'...")

    try:
        # Read all documents
        documents = []
        with open(input_file, 'r') as f:
            for line in f:
                if line.strip():
                    documents.append(json.loads(line))

        total_docs = len(documents)
        logging.info(f"Loaded {total_docs} documents from file")

        successful_count = 0
        failed_count = 0
        errors = []

        # Process in batches
        for i in range(0, total_docs, BATCH_SIZE):
            batch = documents[i:i + BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            total_batches = (total_docs + BATCH_SIZE - 1) // BATCH_SIZE

            # Prepare bulk request body
            bulk_body = []
            for doc in batch:
                # Index action
                bulk_body.append({"index": {"_index": index_name, "_id": doc['id']}})
                # Document source
                bulk_body.append(doc)

            try:
                # Execute bulk request
                response = client.bulk(body=bulk_body)

                # Check for errors in response
                if response.get('errors'):
                    for item in response['items']:
                        if 'error' in item.get('index', {}):
                            failed_count += 1
                            error_msg = item['index']['error']
                            errors.append(error_msg)
                            logging.debug(f"Document indexing error: {error_msg}")
                        else:
                            successful_count += 1
                else:
                    successful_count += len(batch)

                logging.info(f"Processed batch {batch_num}/{total_batches} ({successful_count}/{total_docs} documents)")

            except Exception as e:
                failed_count += len(batch)
                error_msg = f"Bulk request failed for batch {batch_num}: {e}"
                errors.append(error_msg)
                logging.error(error_msg)

        # Log summary
        logging.info(f"Loading complete: {successful_count} successful, {failed_count} failed")

        if errors and len(errors) <= 10:
            logging.warning("Errors encountered:")
            for error in errors[:10]:
                logging.warning(f"  {error}")
        elif errors:
            logging.warning(f"Total errors: {len(errors)} (showing first 10)")
            for error in errors[:10]:
                logging.warning(f"  {error}")

        return (successful_count, failed_count)

    except FileNotFoundError:
        raise Exception(f"Input file not found: {input_file}")
    except json.JSONDecodeError as e:
        raise Exception(f"Invalid JSON in input file: {e}")


def validate_load(client: OpenSearch, index_name: str, expected_count: int = 1000) -> None:
    """
    Validate that documents were loaded correctly.

    Args:
        client: OpenSearch client instance
        index_name: Index to validate
        expected_count: Expected number of documents

    Raises:
        Exception if document count doesn't match expected count
    """
    logging.info("Validating document load...")

    # Refresh index to ensure all documents are searchable
    client.indices.refresh(index=index_name)

    # Get document count
    count_response = client.count(index=index_name)
    actual_count = count_response['count']

    logging.info(f"Document count: {actual_count}/{expected_count}")

    if actual_count == expected_count:
        logging.info("Validation successful: document count matches expected")
    else:
        raise Exception(f"Validation failed: expected {expected_count} documents, found {actual_count}")

    # Get index stats
    stats = client.indices.stats(index=index_name)
    store_size = stats['indices'][index_name]['total']['store']['size_in_bytes']
    logging.info(f"Index size: {store_size / (1024*1024):.2f} MB")

    # Sample query to verify data
    sample_query = {
        "size": 1,
        "query": {"match_all": {}}
    }
    sample_result = client.search(index=index_name, body=sample_query)

    if sample_result['hits']['total']['value'] > 0:
        sample_doc = sample_result['hits']['hits'][0]['_source']
        logging.info(f"Sample document domain: {sample_doc.get('domain', 'unknown')}")
        logging.info("Index is ready for queries")
    else:
        logging.warning("No documents found in sample query")


def main() -> None:
    """
    Main execution function to orchestrate the data loading process.
    """
    start_time = time.time()

    logging.info("=" * 60)
    logging.info("OpenSearch Bulk Data Loader")
    logging.info("=" * 60)

    try:
        # Initialize OpenSearch client
        client = OpenSearch(
            hosts=[{'host': OPENSEARCH_HOST, 'port': OPENSEARCH_PORT}],
            http_compress=True,
            use_ssl=False,
            verify_certs=False,
            ssl_assert_hostname=False,
            ssl_show_warn=False,
            timeout=CONNECTION_TIMEOUT
        )

        # Check connection
        check_opensearch_connection(client)

        # Create index
        create_index_with_mappings(client, INDEX_NAME)

        # Load documents
        successful, failed = load_documents(client, INDEX_NAME, INPUT_FILE)

        # Validate
        validate_load(client, INDEX_NAME, expected_count=successful)

        elapsed_time = time.time() - start_time

        # Final summary
        logging.info("=" * 60)
        logging.info("SETUP COMPLETE")
        logging.info("=" * 60)
        logging.info(f"Index: {INDEX_NAME}")
        logging.info(f"Documents loaded: {successful}")
        logging.info(f"Failed documents: {failed}")
        logging.info(f"Time elapsed: {elapsed_time:.2f} seconds")
        logging.info("")
        logging.info("Access points:")
        logging.info(f"  OpenSearch API: http://{OPENSEARCH_HOST}:{OPENSEARCH_PORT}")
        logging.info("  OpenSearch Dashboards: http://localhost:5601")
        logging.info("")
        logging.info("Next steps:")
        logging.info("  1. Open Crystal Forge at http://localhost:3000")
        logging.info("  2. Connect to http://localhost:9200")
        logging.info("  3. Select the 'opensearch-demo' index")
        logging.info("=" * 60)

    except Exception as e:
        logging.error(f"Setup failed: {e}")
        raise


if __name__ == "__main__":
    main()
