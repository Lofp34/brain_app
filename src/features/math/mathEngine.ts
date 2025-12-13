import type { MathDifficulty, MathOperation, MathQuestion } from '../../types';

export const MathEngine = {
    generateQuestion: (difficulty: MathDifficulty, operations: MathOperation[] = ['addition', 'subtraction', 'multiplication']): MathQuestion => {
        // Pick random operation
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const id = crypto.randomUUID();

        let operandA = 0;
        let operandB = 0;
        let correctAnswer = 0;

        switch (operation) {
            case 'addition':
                if (difficulty === 'easy') {
                    // 1-2 digits, no carry ideally (but random is fine for MVP start)
                    operandA = Math.floor(Math.random() * 50) + 1;
                    operandB = Math.floor(Math.random() * 40) + 1;
                } else if (difficulty === 'medium') {
                    // 2-3 digits
                    operandA = Math.floor(Math.random() * 90) + 10;
                    operandB = Math.floor(Math.random() * 90) + 10;
                } else {
                    // Hard: 3 digits or mixed
                    operandA = Math.floor(Math.random() * 400) + 50;
                    operandB = Math.floor(Math.random() * 400) + 50;
                }
                correctAnswer = operandA + operandB;
                break;

            case 'subtraction':
                if (difficulty === 'easy') {
                    operandA = Math.floor(Math.random() * 50) + 10;
                    operandB = Math.floor(Math.random() * operandA); // Ensure positive result
                } else if (difficulty === 'medium') {
                    operandA = Math.floor(Math.random() * 100) + 20;
                    operandB = Math.floor(Math.random() * operandA);
                } else {
                    operandA = Math.floor(Math.random() * 500) + 100;
                    operandB = Math.floor(Math.random() * operandA);
                }
                correctAnswer = operandA - operandB;
                break;

            case 'multiplication':
                if (difficulty === 'easy') {
                    // Tables 2-9
                    operandA = Math.floor(Math.random() * 8) + 2;
                    operandB = Math.floor(Math.random() * 9) + 1;
                } else if (difficulty === 'medium') {
                    // 2 digits x 1 digit
                    operandA = Math.floor(Math.random() * 20) + 2;
                    operandB = Math.floor(Math.random() * 9) + 2;
                } else {
                    // 2 digits x 2 digits simple or 3 digits x 1
                    operandA = Math.floor(Math.random() * 20) + 10;
                    operandB = Math.floor(Math.random() * 20) + 2;
                }
                correctAnswer = operandA * operandB;
                break;

            case 'division':
                // For division, we generate multiplication and reverse it to ensure integer results
                if (difficulty === 'easy') {
                    const b = Math.floor(Math.random() * 8) + 2;
                    const res = Math.floor(Math.random() * 9) + 1;
                    operandB = b;
                    operandA = b * res; // A / B = res
                    correctAnswer = res;
                } else {
                    const b = Math.floor(Math.random() * 10) + 2;
                    const res = Math.floor(Math.random() * 20) + 2;
                    operandB = b;
                    operandA = b * res;
                    correctAnswer = res;
                }
                break;
        }

        return {
            id,
            operation,
            operandA,
            operandB,
            correctAnswer,
        };
    },

    checkAnswer: (question: MathQuestion, userAnswer: number): boolean => {
        return question.correctAnswer === userAnswer;
    }
};
