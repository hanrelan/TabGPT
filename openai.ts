import { parseJsonSSE } from "./parseJSONSSE"

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
    const data = { prompt, ...config }
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


export const streamCompletion = async (args: {
    data: {
        prompt: string
        openaiApiKey: string
        config: any
    }
    onMessage: (completion: string) => void
    onError: (err: string) => void
    onClose: () => void
}) => {
    const { data, onMessage, onClose } = args

    const openaiApiKey = data.openaiApiKey
    const payload = {
        prompt: data.prompt,
        stream: true,
        ...data.config
    }

    console.log("STREAMING WITH PAYLOAD", payload)

    const res = await fetch("https://api.openai.com/v1/completions", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
        },
        method: "POST",
        body: JSON.stringify(payload)
    })

    parseJsonSSE({
        data: res.body,
        onParse: (obj) => {
            onMessage(
                //@ts-ignore
                obj.choices?.[0].text
            )
        },
        onFinish: onClose
    })
}