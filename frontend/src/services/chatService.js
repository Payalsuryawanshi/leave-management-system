import { aiApi } from "./api";

// include optional `role` so backend can tailor manager vs employee responses
export const askChatbot = (question, user_id, role) =>
  aiApi.post("/chatbot/ask", { question, user_id, role });