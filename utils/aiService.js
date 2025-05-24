const ApiConfig = require('../models/ApiConfig');

// Mock AI service for demonstration
// In production, this would integrate with actual AI APIs like OpenAI, Anthropic, etc.

const generateAIResponse = async (messages, user) => {
  try {
    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    
    if (!latestMessage || latestMessage.role !== 'user') {
      throw new Error('No user message found');
    }

    // Check if user has custom API configurations
    const userApiConfigs = await ApiConfig.findByUserId(user.id);
    
    // For demo purposes, we'll use a mock response
    // In production, you would:
    // 1. Determine which AI service to use based on the query
    // 2. Format the request according to the API's requirements
    // 3. Make the actual API call
    // 4. Parse and format the response

    const mockResponse = await generateMockResponse(latestMessage.content, userApiConfigs);
    
    return {
      content: mockResponse.content,
      attachments: mockResponse.attachments || []
    };
  } catch (error) {
    console.error('AI service error:', error);
    throw error;
  }
};

const generateMockResponse = async (userMessage, apiConfigs) => {
  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  const message = userMessage.toLowerCase();

  // Code generation requests
  if (message.includes('code') || message.includes('function') || message.includes('script')) {
    return {
      content: generateCodeResponse(userMessage),
      attachments: [{
        type: 'code',
        language: detectLanguage(userMessage),
        content: generateSampleCode(userMessage)
      }]
    };
  }

  // API-related requests
  if (message.includes('api') && apiConfigs.length > 0) {
    return {
      content: `I can help you with API integrations! You have ${apiConfigs.length} configured API(s): ${apiConfigs.map(api => api.providerName).join(', ')}. What would you like to do with these APIs?`,
      attachments: []
    };
  }

  // Data analysis requests
  if (message.includes('analyze') || message.includes('data') || message.includes('chart')) {
    return {
      content: generateDataAnalysisResponse(userMessage),
      attachments: [{
        type: 'visualization',
        chartType: 'line',
        data: generateSampleData()
      }]
    };
  }

  // General conversation
  return {
    content: generateGeneralResponse(userMessage),
    attachments: []
  };
};

const generateCodeResponse = (userMessage) => {
  const codeExamples = {
    javascript: `Here's a JavaScript example based on your request:

\`\`\`javascript
function processData(data) {
  return data
    .filter(item => item.isValid)
    .map(item => ({
      ...item,
      processed: true,
      timestamp: new Date().toISOString()
    }));
}

// Usage example
const result = processData(inputData);
console.log(result);
\`\`\`

This function filters valid items and adds processing metadata. Would you like me to explain any part of this code or modify it for your specific needs?`,

    python: `Here's a Python solution for your request:

\`\`\`python
def process_data(data):
    """Process and filter data with validation."""
    from datetime import datetime
    
    return [
        {
            **item,
            'processed': True,
            'timestamp': datetime.now().isoformat()
        }
        for item in data
        if item.get('is_valid', False)
    ]

# Usage example
result = process_data(input_data)
print(f"Processed {len(result)} items")
\`\`\`

This Python function provides similar functionality with proper error handling. Let me know if you need any modifications!`,

    react: `Here's a React component based on your request:

\`\`\`jsx
import React, { useState, useEffect } from 'react';

const DataProcessor = ({ data }) => {
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setLoading(true);
      const processed = data
        .filter(item => item.isValid)
        .map(item => ({
          ...item,
          processed: true,
          timestamp: new Date().toISOString()
        }));
      
      setProcessedData(processed);
      setLoading(false);
    }
  }, [data]);

  if (loading) return <div>Processing...</div>;

  return (
    <div className="data-processor">
      <h3>Processed Data ({processedData.length} items)</h3>
      {processedData.map(item => (
        <div key={item.id} className="data-item">
          {JSON.stringify(item, null, 2)}
        </div>
      ))}
    </div>
  );
};

export default DataProcessor;
\`\`\`

This React component handles data processing with loading states. Would you like me to add any specific features?`
  };

  const language = detectLanguage(userMessage);
  return codeExamples[language] || codeExamples.javascript;
};

const generateDataAnalysisResponse = (userMessage) => {
  return `I'll help you analyze your data. Based on your request, here's what I found:

**Data Summary:**
- Total records: 1,247
- Valid entries: 1,156 (92.7%)
- Missing values: 91 (7.3%)
- Date range: 2024-01-01 to 2024-12-31

**Key Insights:**
1. **Trend Analysis**: The data shows a steady upward trend with seasonal variations
2. **Outliers**: Detected 23 potential outliers that may need investigation
3. **Correlations**: Strong positive correlation (r=0.84) between variables A and B

**Recommendations:**
- Clean the missing values using interpolation
- Investigate the outliers for data quality issues
- Consider seasonal adjustments for forecasting

Would you like me to generate specific visualizations or dive deeper into any particular aspect of the analysis?`;
};

const generateGeneralResponse = (userMessage) => {
  const responses = [
    `That's an interesting question! Based on what you've shared, I can help you explore this topic further. What specific aspect would you like to focus on?`,
    
    `I understand your request. Let me break this down into manageable parts and provide you with a comprehensive response. Here's what I think...`,
    
    `Great question! This touches on several important concepts. Let me explain the key points and how they relate to your situation.`,
    
    `I can definitely help with that. Based on the context you've provided, here are some insights and suggestions that might be useful.`,
    
    `That's a thoughtful inquiry. Let me provide you with a detailed response that addresses your main concerns and offers practical solutions.`
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return `${randomResponse}

Based on your message: "${userMessage}"

I'm here to assist you with various tasks including:
- Code generation and review
- Data analysis and visualization
- API integration guidance
- Problem-solving and explanations
- Creative writing and content generation

Is there a specific area you'd like to explore further, or would you like me to provide more detailed information about any of these capabilities?`;
};

const detectLanguage = (message) => {
  const message_lower = message.toLowerCase();
  
  if (message_lower.includes('react') || message_lower.includes('jsx') || message_lower.includes('component')) {
    return 'react';
  }
  if (message_lower.includes('python') || message_lower.includes('django') || message_lower.includes('flask')) {
    return 'python';
  }
  if (message_lower.includes('javascript') || message_lower.includes('node') || message_lower.includes('js')) {
    return 'javascript';
  }
  
  return 'javascript'; // default
};

const generateSampleCode = (userMessage) => {
  const language = detectLanguage(userMessage);
  
  const codeSnippets = {
    javascript: `// Sample JavaScript code
function handleUserRequest(input) {
  const processed = input.trim().toLowerCase();
  return {
    original: input,
    processed: processed,
    timestamp: Date.now()
  };
}`,
    
    python: `# Sample Python code
def handle_user_request(input_text):
    processed = input_text.strip().lower()
    return {
        'original': input_text,
        'processed': processed,
        'timestamp': time.time()
    }`,
    
    react: `// Sample React component
const UserRequestHandler = ({ input }) => {
  const [result, setResult] = useState(null);
  
  useEffect(() => {
    if (input) {
      setResult({
        original: input,
        processed: input.trim().toLowerCase(),
        timestamp: Date.now()
      });
    }
  }, [input]);
  
  return <div>{JSON.stringify(result, null, 2)}</div>;
};`
  };
  
  return codeSnippets[language] || codeSnippets.javascript;
};

const generateSampleData = () => {
  const data = [];
  for (let i = 0; i < 12; i++) {
    data.push({
      month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      value: Math.floor(Math.random() * 100) + 50
    });
  }
  return data;
};

module.exports = {
  generateAIResponse,
  generateMockResponse
};
