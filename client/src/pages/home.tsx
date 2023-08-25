import { ElementRef, useCallback, useEffect, useRef, useState } from "react";
import { In, Message, Out } from "../types/websocket";

export const HomePage: React.FC = () => {
  const [status, setStatus] = useState<"disconnected" | "connected">(
    "disconnected"
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const [name, setName] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);
  const messageContainerRef = useRef<ElementRef<"div">>(null);

  const sendWsMessage = useCallback(
    (data: Out) => {
      if (!wsRef.current) throw new Error("ws is not initialized");
      wsRef.current.send(JSON.stringify(data));
    },
    [wsRef]
  );

  const sendMessage = useCallback(
    (message: string) => {
      sendWsMessage({
        type: "Send",
        data: {
          message,
        },
      });
      setMessage("");
    },
    [sendWsMessage]
  );

  const connect = useCallback(
    (name: string) => {
      if (wsRef.current) return;

      const ws = new WebSocket("ws://localhost:8080/ws");
      wsRef.current = ws;

      const onOpen = () => {
        sendWsMessage({
          type: "Handshake",
          data: {
            name,
          },
        });
      };

      const onMessage = (e: MessageEvent) => {
        const data = JSON.parse(e.data) as In;

        if (data.type === "Message") {
          setMessages((prev) => [...prev, data.data]);
        }
      };

      ws.addEventListener("open", onOpen);
      ws.addEventListener("message", onMessage);

      // return () => {
      //   ws.removeEventListener("open", onOpen);
      //   ws.removeEventListener("message", onMessage);
      // };
    },
    [sendWsMessage]
  );

  useEffect(() => {
    messageContainerRef.current?.scrollTo({
      top: messageContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="p-4 flex justify-center h-full">
      <main className="w-[60rem] h-full flex flex-col">
        {status === "disconnected" && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              connect(name);
              setStatus("connected");
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border px-3 p-2 text-lg w-full"
              placeholder="Name"
            />
            <button
              type="submit"
              className="border px-8 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Join!
            </button>
          </form>
        )}
        {status === "connected" && (
          <>
            <div className="mb-4 border-b pb-4">
              <p className="text-lg">
                Connected as <span className="font-bold">{name}</span>
              </p>
            </div>

            <div
              className="flex gap-1 flex-col mb-2 overflow-scroll"
              ref={messageContainerRef}
            >
              {messages.length === 0 && (
                <p className="text-gray-500 text-xl">
                  There are no messages here. Start the conversation!
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className="border px-3 py-2">
                  <p className="underline">{m.from.name}</p>
                  <p>{m.message}</p>
                </div>
              ))}
            </div>

            <form
              className="flex gap-2 mt-auto"
              onSubmit={(e) => {
                e.preventDefault();
                if (message !== "") sendMessage(message);
              }}
            >
              <input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (message !== "") sendMessage(message);
                  }
                }}
                className="border px-3 p-2 text-lg w-full"
              />
              <button
                type="submit"
                className="border px-8 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};
