export const runCompletion = async ({
    prompt,
    openaiApiKey,
    config = {
        model: "text-davinci-003",
        max_tokens: 128,
        temperature: 0.7,
    }
}: {
    prompt: string,
    openaiApiKey: string
    config: any
}) => {
    const data = { prompt, ...config, provider: undefined }
    try {
        const res = await fetch("https://api.openai.com/v1/completions", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + openaiApiKey
            }
        })

        const compRes = await res.json()

        return compRes.choices[0].text
    } catch (e) {
        console.error(e)
    }
}