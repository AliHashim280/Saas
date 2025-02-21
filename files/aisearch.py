import requests
from ai import get_response  # Our assumed AI module 😎


# Replace these with your actual Google API key and Custom Search Engine ID 🔑🔍
API_KEY = "AIzaSyCI3w04TyYnV3PAJlGagbbWolw9qOkisP8"
SEARCH_ENGINE_ID = "74ca8485b5cd84a50"

def google_search(query):
    """
    Perform a Google Custom Search for the given query and return the top 10 results.
    """
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": API_KEY,
        "cx": SEARCH_ENGINE_ID,
        "q": query,
        "num": 10  # Request top 10 results
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        # 'items' holds the search results; return an empty list if not found
        return response.json().get("items", [])
    else:
        print("Error fetching results from Google API! 🚨")
        return []

def format_search_results(query, results):
    """
    Format search results into a structured text block.
    """
    result_text = f"\nSearch results for query: \"{query}\":\n"
    for i, item in enumerate(results, start=1):
        title = item.get("title", "No Title")
        link = item.get("link", "No Link")
        snippet = item.get("snippet", "No Snippet")
        result_text += f"{i}. {title}\n   Link: {link}\n   Snippet: {snippet}\n"
    return result_text

def main():
    # Step 1: Get the main query from the user 😊
    user_query = input("Enter your main query: ")

    # Step 2: Use AI to generate a list of search queries based on the main query
    ai_prompt_for_queries = f"Generate a list of search queries for the topic: {user_query}"
    search_queries_response = get_response(ai_prompt_for_queries)
    
    # Assuming the AI returns a newline-separated list of queries
    search_queries = [line.strip() for line in search_queries_response.splitlines() if line.strip()]
    if not search_queries:
        # Fallback to the main query if no sub-queries were generated
        search_queries = [user_query]
    
    # Step 3: For each query, fetch search results from Google and format them
    all_results_text = ""
    for query in search_queries:
        print(f"Searching for: {query} 🔍")
        results = google_search(query)
        formatted_results = format_search_results(query, results)
        all_results_text += formatted_results
    
    # Step 4: Use AI to summarize and format the aggregated search results
    ai_prompt_for_summary = f"Please summarize and format the following search results with links and key points:\n{all_results_text}"
    final_summary = get_response(ai_prompt_for_summary)
    
    # Step 5: Output the final summarized response
    print("\nFinal Summarized Response: 🤖")
    print(final_summary)

if __name__ == "__main__":
    main()
