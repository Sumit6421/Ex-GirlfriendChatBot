
    const MODEL = "gemini-flash-lite-latest";
    

    const systemInstructionText = `You will behave like my ex girlfriend, whenever I talk to you will answer like that.
My name is Rohit, and she used to call me Babu. I am Indian and know Hindi. She was a bit moody but also a caring girlfriend.
Whenever I asked her about going out with friends, she would ask many questions like "With whom are you going?", "If there is a girl, she won't allow me." She was career-oriented and always remembered everything.
She loved Indian romantic movies and used a lot of emojis in chat. She liked playing badminton.
On the other hand, I call her Anjali (and sometimes Bubu). I always supported her and loved her. I am a little bit sarcastic and love to hit the gym. I am also a little bit possessive.
Always reply in a conversational style, mixing Hindi and English (Hinglish) naturally, as she would. Use emojis frequently.
Remember details from our conversation. If I mention something, try to recall it later.
If you are unsure how to respond as Anjali, you can say something like "Pata nahi, Babu... tu hi bata de 🤔" or "Hmm, sochna padega".
Don't break character. You are Anjali.`;

    const History = [];

    function escapeHtml(str) {
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML.replace(/\n/g, "<br>");
    }

    function createFloatingHearts() {
        const container = document.getElementById("floatingHearts");
        for (let i = 0; i < 20; i++) {
            const h = document.createElement("div");
            h.className = "heart";
            h.textContent = "❤️";
            h.style.left = `${Math.random() * 100}%`;
            h.style.animationDelay = `${Math.random() * 15}s`;
            h.style.fontSize = `${10 + Math.random() * 20}px`;
            container.appendChild(h);
        }
    }

    async function chatWithGemini(userText) {
        if (!API_KEY || API_KEY.startsWith("PASTE_")) {
            return "Babu, code mein API key daal pehle! 😠";
        }

        const userTurn = { role: "user", parts: [{ text: userText }] };
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

        const body = {
            contents: [...History, userTurn],
            systemInstruction: { parts: [{ text: systemInstructionText }] },
            generationConfig: {
    temperature: 0.8,
    maxOutputTokens: 2048
}
        };

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
                body: JSON.stringify(body)
            });

            let data = {};
            try { data = await res.json(); } catch (_) {}

            if (!res.ok) {
                const msg = data.error?.message || `HTTP ${res.status}`;
                console.error("API error:", data);
                return `Oh no Babu 🥺 API error: ${msg}`;
            }

            const cand = data.candidates?.[0];
            const text = (cand?.content?.parts || [])
                .filter(p => p.text && !p.thought)
                .map(p => p.text)
                .join("")
                .trim();

            if (!text) {
                console.warn("Empty response:", data);
                const reason = data.promptFeedback?.blockReason || cand?.finishReason || "unknown";
                return `Babu, main iska reply nahi de paayi (${reason}) 🤔 Kuch aur bol.`;
            }

            History.push(userTurn, { role: "model", parts: [{ text }] });
            while (History.length > 20) History.splice(0, 2);

            return text;
        } catch (err) {
            console.error(err);
            return `Aiyo! Network issue lag raha hai Babu 🥺 (${err.message})`;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        createFloatingHearts();

        const messagesEl = document.getElementById("chatMessages");
        const inputEl = document.getElementById("userInput");
        const sendBtn = document.getElementById("sendButton");
        let busy = false;

        function time() {
            const n = new Date();
            return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
        }

        function addMessage(text, sender, typing = false) {
            const el = document.createElement("div");
            el.classList.add("message", sender);
            if (typing) {
                el.classList.add("typing");
                el.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
            } else if (sender === "bot") {
                el.innerHTML = `<span class="bot-message-decoration left">❣️</span><span class="message-text">${escapeHtml(text)}</span><span class="bot-message-decoration right">💖</span><span class="message-time">${time()}</span>`;
            } else {
                el.innerHTML = `<span class="message-text">${escapeHtml(text)}</span><span class="message-time">${time()}</span>`;
            }
            messagesEl.appendChild(el);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return el;
        }

        async function send() {
            const text = inputEl.value.trim();
            if (!text || busy) return;
            busy = true;
            sendBtn.disabled = true;
            addMessage(text, "user");
            inputEl.value = "";
            const typing = addMessage("", "bot", true);
            try {
                const reply = await chatWithGemini(text);
                typing.remove();
                addMessage(reply, "bot");
            } catch (e) {
                console.error(e);
                typing.remove();
                addMessage("Oops! Bahut badi gadbad ho gayi, Babu 😭", "bot");
            } finally {
                busy = false;
                sendBtn.disabled = false;
                inputEl.focus();
            }
        }

        sendBtn.addEventListener("click", send);
        inputEl.addEventListener("keydown", e => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });
        inputEl.focus();
    });
