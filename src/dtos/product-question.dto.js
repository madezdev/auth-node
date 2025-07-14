/**
 * Product Question DTOs (Data Transfer Objects)
 * These DTOs handle the transformation of ProductQuestion documents to client-safe objects
 */

/**
 * Creates a DTO for product question data with all necessary information
 * 
 * @param {Object} question - The product question document from the database
 * @returns {Object} A cleaned product question object safe for client-side use
 */
export const createProductQuestionDTO = (question) => {
  if (!question) {
    return null;
  }
  
  // Basic question data
  const questionDTO = {
    id: question._id.toString(),
    productId: question.product._id?.toString() || question.product.toString(),
    question: question.question,
    isAnswered: question.isAnswered,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt
  };

  // Add user information if populated
  if (question.user) {
    if (typeof question.user === 'object') {
      questionDTO.user = {
        id: question.user._id.toString(),
        name: `${question.user.first_name} ${question.user.last_name}`,
        email: question.user.email
      };
    } else {
      questionDTO.userId = question.user.toString();
    }
  }
  
  // Add answer information if available
  if (question.answer) {
    questionDTO.answer = question.answer;
    
    // Add answeredBy information if populated
    if (question.answeredBy && typeof question.answeredBy === 'object') {
      questionDTO.answeredBy = {
        id: question.answeredBy._id.toString(),
        name: `${question.answeredBy.first_name} ${question.answeredBy.last_name}`
      };
    } else if (question.answeredBy) {
      questionDTO.answeredById = question.answeredBy.toString();
    }
  }
  
  // Add product information if populated
  if (question.product && typeof question.product === 'object') {
    questionDTO.product = {
      id: question.product._id.toString(),
      name: question.product.name,
      image: question.product.image
    };
  }
  
  return questionDTO;
};

/**
 * Transform an array of product questions to DTOs
 * 
 * @param {Array} questions - Array of product question documents
 * @returns {Array} Array of product question DTOs
 */
export const createProductQuestionsDTO = (questions) => {
  if (!questions || !Array.isArray(questions)) {
    return [];
  }
  
  return questions.map(question => createProductQuestionDTO(question));
};
