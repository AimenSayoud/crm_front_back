import requests
import json
from pprint import pprint

# Base URL for the API
BASE_URL = "http://localhost:8080/api/v1"

def test_get_conversations():
    """Test getting conversations for a user"""
    print("\n=== Testing GET /messages/conversations/ ===")
    response = requests.get(f"{BASE_URL}/messages/conversations/", params={"user_id": 7})
    
    if response.status_code == 200:
        conversations = response.json()
        print(f"Success! Found {len(conversations)} conversations")
        if conversations:
            print("First conversation:")
            pprint(conversations[0])
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_get_conversation_with_messages():
    """Test getting a specific conversation with messages"""
    print("\n=== Testing GET /messages/conversations/1 ===")
    response = requests.get(f"{BASE_URL}/messages/conversations/1")
    
    if response.status_code == 200:
        conversation = response.json()
        print(f"Success! Conversation title: {conversation['title']}")
        print(f"Found {len(conversation['messages'])} messages")
        if conversation['messages']:
            print("Latest message:")
            pprint(conversation['messages'][0])
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_get_messages():
    """Test getting messages filtered by conversation"""
    print("\n=== Testing GET /messages/messages/ ===")
    response = requests.get(f"{BASE_URL}/messages/messages/", params={"conversation_id": 1})
    
    if response.status_code == 200:
        messages = response.json()
        print(f"Success! Found {len(messages)} messages for conversation 1")
        if messages:
            print("Latest message:")
            pprint(messages[0])
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_create_message():
    """Test creating a new message"""
    print("\n=== Testing POST /messages/messages/ ===")
    
    data = {
        "conversation_id": 1,
        "sender_id": 7,
        "content": "This is a test message created via the API",
        "type": "text",
        "entity_references": []
    }
    
    response = requests.post(f"{BASE_URL}/messages/messages/", json=data)
    
    if response.status_code == 200:
        message = response.json()
        print("Success! Created message:")
        pprint(message)
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_mark_message_as_read():
    """Test marking a message as read"""
    print("\n=== Testing PUT /messages/messages/1/read ===")
    
    response = requests.put(f"{BASE_URL}/messages/messages/1/read", params={"user_id": 1})
    
    if response.status_code == 200:
        message = response.json()
        print("Success! Marked message as read:")
        pprint(message)
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_get_unread_count():
    """Test getting unread message count"""
    print("\n=== Testing GET /messages/messages/unread/count ===")
    
    response = requests.get(f"{BASE_URL}/messages/messages/unread/count", params={"user_id": 1})
    
    if response.status_code == 200:
        result = response.json()
        print(f"Success! Unread count: {result['count']}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

def test_create_conversation():
    """Test creating a new conversation"""
    print("\n=== Testing POST /messages/conversations/ ===")
    
    data = {
        "title": "Test Conversation",
        "is_group": False,
        "entity_type": "job",
        "entity_id": 5,
        "participants": [
            {
                "user_id": 7,
                "role": "admin"
            },
            {
                "user_id": 3,
                "role": "member"
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/messages/conversations/", json=data)
    
    if response.status_code == 200:
        conversation = response.json()
        print("Success! Created conversation:")
        pprint(conversation)
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    # Run tests
    test_get_conversations()
    test_get_conversation_with_messages()
    test_get_messages()
    test_get_unread_count()
    
    # Create new data - uncomment to test
    # test_create_conversation()
    # test_create_message()
    # test_mark_message_as_read()