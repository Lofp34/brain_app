
export const AIService = {
    getCoachFeedback: async (apiKey: string, score: number, mistakes: number, mode: string) => {
        if (!apiKey) return "No API Key provided. Add it in settings to get coaching.";

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini", // Using a faster/cheaper model as requested "nano" equiv
                    messages: [
                        {
                            role: "system",
                            content: "You are an encouraging cognitive training coach. Keep feedback extremely brief (max 2 sentences). Focus on one specific improvement."
                        },
                        {
                            role: "user",
                            content: `I just finished a ${mode} math session. Score: ${score}, Mistakes: ${mistakes}. Give me feedback.`
                        }
                    ],
                    max_tokens: 100
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }
            return data.choices[0].message.content;
        } catch (error) {
            console.error("AI Error:", error);
            return "Coach is currently unavailable (Check API Key).";
        }
    }
};
