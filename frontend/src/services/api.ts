import axios from 'axios'
import storageService from './storageService';
import { get_random_aspect } from '../utils/helpers';


const apiClient = axios.create({
	baseURL: 'https://educasm-habeeb-backend.vercel.app/api',
	headers: {
		'Content-Type': 'application/json'
	}
})

export const api = {
  getPlaygroundQuestion(topic: string, level: number) {
    const userContext = storageService.getUserInfo();
    const sessionId = storageService.getSessionId();
    if (!userContext) throw new Error("User Info Not found");
    const requestData = {
      selected_aspect: get_random_aspect(),
      session_id: sessionId,
      age: userContext.age,
      topic: topic,
      level: level,
    }
    return apiClient.post('/playground/question', requestData) 
  },

  getMessages() {
    const sessionId = storageService.getSessionId()
    return apiClient.get(`/history/${sessionId}`)
  }
}
