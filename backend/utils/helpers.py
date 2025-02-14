def process_content(content_data):
    """Process and format content data from the response."""
    if isinstance(content_data, dict):
        return "\n\n".join(
            str(v) for k, v in content_data.items()
            if k.startswith('paragraph') and v
        )
    return str(content_data)

def format_topics(topics_data):
    """Format topics data into a consistent structure."""
    formatted_topics = []
    for topic in topics_data:
        formatted_topic = {
            "topic": topic.get("name", topic.get("topic", "")),
            "type": topic.get("type", ""),
            "reason": topic.get("detail", topic.get("reason", ""))
        }
        formatted_topics.append(formatted_topic)
    return formatted_topics

def format_questions(questions_data):
    """Format questions data into a consistent structure."""
    formatted_questions = []
    for question in questions_data:
        formatted_question = {
            "question": question.get("text", question.get("question", "")),
            "type": question.get("type", ""),
            "context": question.get("detail", question.get("context", ""))
        }
        formatted_questions.append(formatted_question)
    return formatted_questions