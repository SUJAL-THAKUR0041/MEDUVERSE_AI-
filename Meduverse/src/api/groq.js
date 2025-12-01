export async function askGroq(prompt) {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    console.error("GROQ_API_KEY is not defined in environment variables");
    return "Error: API key not configured. Please add VITE_GROQ_API_KEY to your .env file";
  }

  // Check if API key is valid (should start with 'gsk_')
  if (!GROQ_API_KEY.startsWith('gsk_')) {
    console.error("Invalid GROQ_API_KEY format. Should start with 'gsk_'");
    return "Error: Invalid API key format";
  }

  try {
    console.log("🚀 Sending request to Groq API...");
    console.log("API Key present:", !!GROQ_API_KEY);
    
    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    console.log("📤 Request body prepared");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 Response received - Status:", response.status);

    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error("❌ Non-JSON response received:", text.substring(0, 200));
      return `Error: API returned invalid response format`;
    }

    data = await response.json();
    console.log("✅ JSON parsed successfully");

    if (!response.ok) {
      console.error("❌ API Error Response:", data);
      const errorMsg = data.error?.message || "Unknown error";
      return `API Error: ${errorMsg}`;
    }

    // Validate response structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("❌ Invalid response structure - no choices:", data);
      return "Error: No response from API";
    }

    const content = data.choices[0]?.message?.content;
    
    if (!content || typeof content !== 'string') {
      console.error("❌ No valid content in response:", data.choices[0]);
      return "Error: Empty response from API";
    }

    console.log("✨ Success! Response length:", content.length);
    return content;
    
  } catch (error) {
    console.error("❌ Network/Fetch error:", error);
    return `Error: ${error.message || "Connection failed"}`;
  }
}

export const geminiClient = {
  async generateContent(prompt) {
    try {
      if (!prompt || typeof prompt !== 'string') {
        console.error("Invalid prompt provided");
        return "Error: Invalid input";
      }

      const response = await askGroq(prompt);
      return response;
    } catch (error) {
      console.error("Error in generateContent:", error);
      return `Error: ${error.message}`;
    }
  }
};
