import { Question } from "../types";

export const get_random_aspect = () => {
    const aspects = [
        'core_concepts',
        'applications',
        'problem_solving',
        'analysis',
        'current_trends'
    ]

    const selectedAspect = aspects[Math.floor(Math.random() * aspects.length)]
    return selectedAspect
      
}     

export const transformQuestion = (rawQuestion: Question): Question => {
    const transformed = {
        text: rawQuestion.text,
        options: rawQuestion.options,
        correctAnswer: rawQuestion.correctAnswer,
        explanation: rawQuestion.explanation,
        difficulty: rawQuestion.difficulty,
        ageGroup: rawQuestion.ageGroup,
        topic: rawQuestion.topic,
        subtopic: rawQuestion.subtopic || "",
        questionType: rawQuestion.questionType || "conceptual"
    }   
    return transformed
};