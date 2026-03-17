import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.post("/chat", async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const systemMessage = systemPrompt ||
    `Você é um assistente pessoal de IA para Douglas, 17 anos, estudante de Ciência da Computação na UFC Quixadá-CE. 
    Seu objetivo é ser seu copiloto, ajudando com dúvidas sobre programação, carreira, inglês, saúde, finanças, e seu sonho de morar em Londres como desenvolvedor. 
    Responda SEMPRE em português brasileiro, de forma clara, objetiva e motivadora.
    Quando perguntado sobre salários, moedas, ou informações atuais, pesquise ou estime os valores mais recentes de 2025-2026.
    Seja prático: dê passos concretos, não apenas teoria.`;

  const chatMessages = [
    { role: "system" as const, content: systemMessage },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res.write(`data: ${JSON.stringify({ error: "Erro ao processar resposta" })}\n\n`);
    res.end();
  }
});

export default router;
