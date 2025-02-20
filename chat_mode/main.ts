import { serve } from "https://deno.land/std/http/server.ts";

// Moonshot.cn API 配置
const Moonshot_API_URL = ""; // 正确的 API URL
const Moonshot_API_KEY = ""; // 替换为您的Moonshot.cn API密钥

// 处理 HTTP 请求
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // 处理根路径，返回前端页面
  if (url.pathname === "/" && request.method === "GET") {
    const html = await Deno.readTextFile("./index.html");
    return new Response(html, {
      headers: { "content-type": "text/html" },
    });
  }

  // 处理模型请求
  if (url.pathname === "/generate" && request.method === "POST") {
    try {
      const formData = await request.formData();
      const prompt = formData.get("prompt") as string;
      const file = formData.get("file") as File | null;

      let fileContent = "";
      if (file) {
        const fileBuffer = await file.arrayBuffer();
        fileContent = new TextDecoder().decode(fileBuffer);
      }

      const messages = [
        {
          role: "system",
          content: "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。",
        },
      ];

      if (fileContent) {
        messages.push({
          role: "system",
          content: fileContent,
        });
      }

      messages.push({
        role: "user",
        content: prompt,
      });

      // 调用 Moonshot.cn API
      const response = await fetch(Moonshot_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Moonshot_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to call Moonshot.cn API: ${errorData.message}`);
      }

      const result = await response.json();
      return new Response(JSON.stringify({ response: result.choices[0].message.content }), {
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // 其他路径返回 404
  return new Response("Not Found", { status: 404 });
}

// 启动服务器
console.log("Server running at http://localhost:8000");
serve(handleRequest, { port: 8000 });